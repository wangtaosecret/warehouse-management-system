import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const inventory = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List inventory
inventory.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  const { page = 1, pageSize = 20, keyword, warehouse_id, category_id } = c.req.query();
  
  let sql = `SELECT i.*, p.name as product_name, p.code as product_code, p.spec, p.unit, p.price as product_price,
    w.name as warehouse_name, l.name as location_name
    FROM inventory i
    LEFT JOIN product p ON i.product_id = p.id
    LEFT JOIN warehouse w ON i.warehouse_id = w.id
    LEFT JOIN location l ON i.location_id = l.id
    WHERE i.org_id = ?`;
  const params: any[] = [user.org_id];
  
  if (keyword) {
    sql += ' AND (p.name LIKE ? OR p.code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (warehouse_id) {
    sql += ' AND i.warehouse_id = ?';
    params.push(warehouse_id);
  }
  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  
  sql += ' ORDER BY i.updated_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  try {
    const result = await db.prepare(sql).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        list: (result.results || []).map((item: any) => ({
          ...item,
          amount: (item.quantity || 0) * (item.product_price || 0)
        })),
        total: result.results?.length || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get product inventory details
inventory.get('/product/:productId', authMiddleware, async (c) => {
  const productId = c.req.param('productId');
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    // Get inventory by warehouse
    const inventories = await db.prepare(`
      SELECT i.*, w.name as warehouse_name, l.name as location_name
      FROM inventory i
      LEFT JOIN warehouse w ON i.warehouse_id = w.id
      LEFT JOIN location l ON i.location_id = l.id
      WHERE i.product_id = ? AND i.org_id = ? AND i.quantity > 0
    `).bind(productId, user.org_id).all();
    
    // Get recent IO records
    const records = await db.prepare(`
      SELECT s.type, s.category, s.code, s.created_at, i.quantity, i.actual_quantity
      FROM stock_io_item i
      JOIN stock_io s ON i.stock_io_id = s.id
      WHERE i.product_id = ? AND s.org_id = ?
      ORDER BY s.created_at DESC LIMIT 20
    `).bind(productId, user.org_id).all();
    
    return c.json({
      success: true,
      data: {
        inventories: inventories.results || [],
        records: records.results || []
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// List alerts
inventory.get('/alerts', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT a.*, p.name as product_name, p.code as product_code, p.spec, p.unit,
        i.quantity as current_stock
      FROM inventory_alert a
      JOIN product p ON a.product_id = p.id
      LEFT JOIN inventory i ON a.product_id = i.product_id AND i.org_id = a.org_id
      WHERE a.org_id = ? AND a.is_enabled = 1
      ORDER BY 
        CASE 
          WHEN i.quantity < a.min_stock THEN 0 
          WHEN i.quantity > a.max_stock THEN 1 
          ELSE 2 
        END
    `).bind(user.org_id).all();
    
    const alerts = (result.results || []).map((item: any) => {
      let alert_type = 'normal';
      if (item.current_stock < item.min_stock) alert_type = 'low';
      else if (item.current_stock > item.max_stock) alert_type = 'high';
      
      return { ...item, alert_type };
    });
    
    return c.json({ success: true, data: alerts });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Set alert threshold
inventory.put('/alerts/:productId', authMiddleware, async (c) => {
  const productId = c.req.param('productId');
  const user = getUser(c);
  const { min_stock, max_stock, is_enabled } = await c.req.json();
  const db = c.env.DB;
  
  try {
    // Check if alert exists
    const existing = await db.prepare('SELECT id FROM inventory_alert WHERE org_id = ? AND product_id = ?')
      .bind(user.org_id, productId).first();
    
    if (existing) {
      await db.prepare(`
        UPDATE inventory_alert SET min_stock = ?, max_stock = ?, is_enabled = ?
        WHERE org_id = ? AND product_id = ?
      `).bind(min_stock || 0, max_stock || 0, is_enabled ? 1 : 0, user.org_id, productId).run();
    } else {
      await db.prepare(`
        INSERT INTO inventory_alert (id, org_id, product_id, min_stock, max_stock, is_enabled, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(generateId(), user.org_id, productId, min_stock || 0, max_stock || 0, is_enabled ? 1 : 0, now()).run();
    }
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Transfer inventory between warehouses
inventory.post('/transfer', authMiddleware, async (c) => {
  const user = getUser(c);
  const { from_warehouse_id, to_warehouse_id, items, transfer_date, remark } = await c.req.json();
  const db = c.env.DB;
  const createdAt = now();
  
  try {
    // Create out record
    const outId = generateId();
    const outCode = 'DB' + createdAt.replace(/[-:T]/g, '').slice(0, 8) + String(Math.floor(Math.random() * 9000) + 1000);
    
    await db.prepare(`
      INSERT INTO stock_io (id, org_id, type, category, code, warehouse_id, status, total_amount, apply_user_id, apply_date, remark, created_at)
      VALUES (?, ?, 'out', 'transfer', ?, ?, 'completed', 0, ?, ?, ?, ?)
    `).bind(outId, user.org_id, outCode, from_warehouse_id, user.id, transfer_date || createdAt.split('T')[0], remark || '调拨出库', createdAt).run();
    
    // Create in record
    const inId = generateId();
    const inCode = 'DB' + createdAt.replace(/[-:T]/g, '').slice(0, 8) + String(Math.floor(Math.random() * 9000) + 1000);
    
    await db.prepare(`
      INSERT INTO stock_io (id, org_id, type, category, code, warehouse_id, status, total_amount, apply_user_id, apply_date, remark, created_at)
      VALUES (?, ?, 'in', 'transfer', ?, ?, 'completed', 0, ?, ?, ?, ?)
    `).bind(inId, user.org_id, inCode, to_warehouse_id, user.id, transfer_date || createdAt.split('T')[0], remark || '调拨入库', createdAt).run();
    
    // Process items
    for (const item of items) {
      const { product_id, quantity } = item;
      
      // Deduct from source
      await db.prepare(`
        UPDATE inventory SET quantity = quantity - ?, updated_at = ?
        WHERE org_id = ? AND product_id = ? AND warehouse_id = ? AND quantity >= ?
      `).bind(quantity, now(), user.org_id, product_id, from_warehouse_id, quantity).run();
      
      // Add to destination
      const existingDest = await db.prepare(`
        SELECT id FROM inventory 
        WHERE org_id = ? AND product_id = ? AND warehouse_id = ?
      `).bind(user.org_id, product_id, to_warehouse_id).first();
      
      if (existingDest) {
        await db.prepare(`
          UPDATE inventory SET quantity = quantity + ?, updated_at = ?
          WHERE id = ?
        `).bind(quantity, now(), existingDest.id).run();
      } else {
        await db.prepare(`
          INSERT INTO inventory (id, org_id, product_id, warehouse_id, quantity, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(generateId(), user.org_id, product_id, to_warehouse_id, quantity, now()).run();
      }
      
      // Create IO items
      await db.prepare(`
        INSERT INTO stock_io_item (id, org_id, stock_io_id, product_id, quantity, actual_quantity, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(generateId(), user.org_id, outId, product_id, quantity, quantity, 0).run();
      
      await db.prepare(`
        INSERT INTO stock_io_item (id, org_id, stock_io_id, product_id, quantity, actual_quantity, amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(generateId(), user.org_id, inId, product_id, quantity, quantity, 0).run();
    }
    
    return c.json({ success: true, data: { outId, inId } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default inventory;
