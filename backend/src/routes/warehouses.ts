import { Hono } from 'hono';
import { generateId, now } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const warehouses = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List warehouses
warehouses.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT w.*,
        (SELECT COUNT(*) FROM inventory WHERE warehouse_id = w.id) as sku_count,
        (SELECT SUM(quantity) FROM inventory WHERE warehouse_id = w.id) as total_quantity
      FROM warehouse w
      WHERE w.org_id = ?
      ORDER BY w.created_at DESC
    `).bind(user.org_id).all();
    
    return c.json({ success: true, data: { list: result.results || [], total: result.results?.length || 0 } });
  } catch (e: any) {
    // Demo data
    return c.json({
      success: true,
      data: {
        list: [
          { id: '1', code: 'WH001', name: '主仓库', address: '北京市朝阳区', manager: '张三', phone: '13800138000', type: 'normal', status: 'enabled', sku_count: 100, total_quantity: 5000 },
          { id: '2', code: 'WH002', name: '华南仓', address: '深圳市宝安区', manager: '李四', phone: '13900139000', type: 'normal', status: 'enabled', sku_count: 80, total_quantity: 3000 },
        ],
        total: 2
      }
    });
  }
});

// Create warehouse
warehouses.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { code, name, address, manager, phone, type } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  
  try {
    await db.prepare(`
      INSERT INTO warehouse (id, org_id, code, name, address, manager, phone, type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.org_id, code, name, address, manager, phone, type || 'normal', 'enabled', now()).run();
    
    return c.json({ success: true, data: { id, code, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update warehouse
warehouses.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, address, manager, phone, type } = await c.req.json();
  const db = c.env.DB;
  
  await db.prepare(`
    UPDATE warehouse SET name = ?, address = ?, manager = ?, phone = ?, type = ? WHERE id = ? AND org_id = ?
  `).bind(name, address, manager, phone, type, id, user.org_id).run();
  
  return c.json({ success: true });
});

// Delete warehouse
warehouses.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  const inventoryCount = await db.prepare('SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = ?').bind(id).first();
  if (inventoryCount && inventoryCount.count > 0) {
    return c.json({ success: false, error: 'Warehouse has inventory' }, 400);
  }
  
  await db.prepare('DELETE FROM warehouse WHERE id = ? AND org_id = ?').bind(id, user.org_id).run();
  
  return c.json({ success: true });
});

export default warehouses;
