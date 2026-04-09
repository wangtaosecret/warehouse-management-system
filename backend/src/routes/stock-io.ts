import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';
import { generateIOCode } from '../utils/code';

const stockIo = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List stock IO records
stockIo.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  const { page = 1, pageSize = 20, type, category, status, keyword, start_date, end_date } = c.req.query();
  
  let sql = `SELECT s.*, w.name as warehouse_name, u.name as apply_user_name, su.name as supplier_name
    FROM stock_io s
    LEFT JOIN warehouse w ON s.warehouse_id = w.id
    LEFT JOIN user u ON s.apply_user_id = u.id
    LEFT JOIN supplier su ON s.supplier_id = su.id
    WHERE s.org_id = ?`;
  const params: any[] = [user.org_id];
  
  if (type) {
    sql += ' AND s.type = ?';
    params.push(type);
  }
  if (category) {
    sql += ' AND s.category = ?';
    params.push(category);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  if (keyword) {
    sql += ' AND s.code LIKE ?';
    params.push(`%${keyword}%`);
  }
  if (start_date) {
    sql += ' AND s.apply_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND s.apply_date <= ?';
    params.push(end_date);
  }
  
  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  try {
    const result = await db.prepare(sql).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        list: result.results || [],
        total: result.results?.length || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get stock IO by ID with items
stockIo.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const header = await db.prepare(`
      SELECT s.*, w.name as warehouse_name, su.name as supplier_name
      FROM stock_io s
      LEFT JOIN warehouse w ON s.warehouse_id = w.id
      LEFT JOIN supplier su ON s.supplier_id = su.id
      WHERE s.id = ? AND s.org_id = ?
    `).bind(id, user.org_id).first();
    
    if (!header) {
      return c.json({ success: false, error: 'Record not found' }, 404);
    }
    
    const items = await db.prepare(`
      SELECT i.*, p.name as product_name, p.code as product_code, p.unit, l.name as location_name
      FROM stock_io_item i
      LEFT JOIN product p ON i.product_id = p.id
      LEFT JOIN location l ON i.location_id = l.id
      WHERE i.stock_io_id = ? AND i.org_id = ?
    `).bind(id, user.org_id).all();
    
    return c.json({
      success: true,
      data: { ...header, items: items.results || [] }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create stock IO (apply)
stockIo.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { type, category, warehouse_id, supplier_id, items, apply_date, remark } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  const createdAt = now();
  const code = generateIOCode(type, category);
  
  // Calculate total amount
  let totalAmount = 0;
  items?.forEach((item: any) => {
    totalAmount += (item.quantity || 0) * (item.price || 0);
  });
  
  try {
    // Insert header
    await db.prepare(`
      INSERT INTO stock_io (id, org_id, type, category, code, warehouse_id, supplier_id, status, total_amount, apply_user_id, apply_date, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user.org_id, type, category, code, warehouse_id, supplier_id || null,
      'pending', totalAmount, user.id, apply_date || createdAt.split('T')[0], remark || null, createdAt
    ).run();
    
    // Insert items
    if (items && items.length > 0) {
      for (const item of items) {
        const itemId = generateId();
        const amount = (item.quantity || 0) * (item.price || 0);
        
        await db.prepare(`
          INSERT INTO stock_io_item (id, org_id, stock_io_id, product_id, location_id, quantity, price, amount, remark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId, user.org_id, id, item.product_id, item.location_id || null,
          item.quantity, item.price || 0, amount, item.remark || null
        ).run();
      }
    }
    
    return c.json({ success: true, data: { id, code, type, category, status: 'pending' } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Approve stock IO
stockIo.put('/:id/approve', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  // Check status
  const existing = await db.prepare('SELECT status FROM stock_io WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Record not found' }, 404);
  }
  if (existing.status !== 'pending') {
    return c.json({ success: false, error: 'Invalid status for approval' }, 400);
  }
  
  try {
    await db.prepare(`
      UPDATE stock_io SET status = ?, approve_user_id = ?, approve_date = ?
      WHERE id = ?
    `).bind('approved', user.id, now(), id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Reject stock IO
stockIo.put('/:id/reject', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { reason } = await c.req.json();
  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT status FROM stock_io WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Record not found' }, 404);
  }
  if (existing.status !== 'pending') {
    return c.json({ success: false, error: 'Invalid status for rejection' }, 400);
  }
  
  try {
    await db.prepare(`
      UPDATE stock_io SET status = ?, remark = CONCAT(IFNULL(remark, ''), ' | 驳回: ', ?)
      WHERE id = ?
    `).bind(reason || '审核不通过', id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Execute stock IO (update inventory)
stockIo.put('/:id/execute', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  // Get header
  const header = await db.prepare('SELECT * FROM stock_io WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!header) {
    return c.json({ success: false, error: 'Record not found' }, 404);
  }
  if (header.status !== 'approved') {
    return c.json({ success: false, error: 'Must be approved before execution' }, 400);
  }
  
  // Get items
  const items = await db.prepare('SELECT * FROM stock_io_item WHERE stock_io_id = ?').bind(id).all();
  
  try {
    // Update inventory for each item
    for (const item of items.results || []) {
      // Check if inventory exists
      let inventory = await db.prepare(`
        SELECT * FROM inventory 
        WHERE org_id = ? AND product_id = ? AND warehouse_id = ? AND (location_id = ? OR (location_id IS NULL AND ? IS NULL))
      `).bind(user.org_id, item.product_id, header.warehouse_id, item.location_id, item.location_id).first();
      
      const actualQty = item.actual_quantity || item.quantity;
      
      if (inventory) {
        // Update existing inventory
        if (header.type === 'in') {
          await db.prepare(`
            UPDATE inventory SET quantity = quantity + ?, updated_at = ?
            WHERE id = ?
          `).bind(actualQty, now(), inventory.id).run();
        } else {
          // Out - reduce quantity
          await db.prepare(`
            UPDATE inventory SET quantity = quantity - ?, updated_at = ?
            WHERE id = ?
          `).bind(actualQty, now(), inventory.id).run();
        }
      } else if (header.type === 'in') {
        // Create new inventory for in
        await db.prepare(`
          INSERT INTO inventory (id, org_id, product_id, warehouse_id, location_id, quantity, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(generateId(), user.org_id, item.product_id, header.warehouse_id, item.location_id, actualQty, now()).run();
      }
      
      // Update actual quantity in item
      await db.prepare('UPDATE stock_io_item SET actual_quantity = ? WHERE id = ?').bind(actualQty, item.id).run();
    }
    
    // Update status
    await db.prepare(`
      UPDATE stock_io SET status = ?, execute_user_id = ?, execute_date = ?
      WHERE id = ?
    `).bind('completed', user.id, now(), id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Archive stock IO
stockIo.put('/:id/archive', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT status FROM stock_io WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Record not found' }, 404);
  }
  if (existing.status !== 'completed') {
    return c.json({ success: false, error: 'Only completed records can be archived' }, 400);
  }
  
  await db.prepare('UPDATE stock_io SET status = ? WHERE id = ?').bind('archived', id).run();
  
  return c.json({ success: true });
});

export default stockIo;
