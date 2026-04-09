import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const products = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List products
products.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  const { page = 1, pageSize = 20, keyword, category_id, status } = c.req.query();
  
  let sql = `SELECT p.*, c.name as category_name 
    FROM product p 
    LEFT JOIN category c ON p.category_id = c.id 
    WHERE p.org_id = ?`;
  const params: any[] = [user.org_id];
  
  if (keyword) {
    sql += ' AND (p.name LIKE ? OR p.code LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (category_id) {
    sql += ' AND p.category_id = ?';
    params.push(category_id);
  }
  
  if (status) {
    sql += ' AND p.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  try {
    const result = await db.prepare(sql).bind(...params).all();
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM product WHERE org_id = ?';
    const countParams: any[] = [user.org_id];
    if (keyword) {
      countSql += ' AND (name LIKE ? OR code LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const countResult = await db.prepare(countSql).bind(...countParams).first();
    
    return c.json({
      success: true,
      data: {
        list: (result.results || []).map((p: any) => ({
          ...p,
          tags: parseJSON(p.tags, []),
          category_name: p.category_name,
        })),
        total: countResult?.total || 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get product by ID
products.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM product p 
      LEFT JOIN category c ON p.category_id = c.id 
      WHERE p.id = ? AND p.org_id = ?
    `).bind(id, user.org_id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'Product not found' }, 404);
    }
    
    return c.json({
      success: true,
      data: { ...result, tags: parseJSON(result.tags, []) }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create product
products.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { code, name, category_id, spec, unit, price, cost, origin, image_url, tags } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  const createdAt = now();
  
  // Check code uniqueness
  const existing = await db.prepare('SELECT id FROM product WHERE org_id = ? AND code = ?').bind(user.org_id, code).first();
  if (existing) {
    return c.json({ success: false, error: 'Product code already exists' }, 400);
  }
  
  try {
    await db.prepare(`
      INSERT INTO product (id, org_id, code, name, category_id, spec, unit, price, cost, origin, image_url, tags, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user.org_id, code, name, category_id || null, spec || null, 
      unit || '个', price || 0, cost || 0, origin || null, 
      image_url || null, JSON.stringify(tags || []), 'enabled', createdAt
    ).run();
    
    return c.json({ success: true, data: { id, code, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update product
products.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, category_id, spec, unit, price, cost, origin, image_url, tags } = await c.req.json();
  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT id FROM product WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }
  
  try {
    await db.prepare(`
      UPDATE product SET name = ?, category_id = ?, spec = ?, unit = ?, price = ?, cost = ?, origin = ?, image_url = ?, tags = ?
      WHERE id = ?
    `).bind(
      name, category_id, spec, unit, price, cost, origin, image_url, JSON.stringify(tags || []), id
    ).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Disable product
products.put('/:id/disable', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  await db.prepare('UPDATE product SET status = ? WHERE id = ? AND org_id = ?').bind('disabled', id, user.org_id).run();
  
  return c.json({ success: true });
});

// Enable product
products.put('/:id/enable', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  await db.prepare('UPDATE product SET status = ? WHERE id = ? AND org_id = ?').bind('enabled', id, user.org_id).run();
  
  return c.json({ success: true });
});

// Delete product
products.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  // Check if product has inventory or io records
  const inventory = await db.prepare('SELECT id FROM inventory WHERE product_id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (inventory) {
    return c.json({ success: false, error: 'Product has inventory, cannot delete' }, 400);
  }
  
  await db.prepare('DELETE FROM product WHERE id = ? AND org_id = ?').bind(id, user.org_id).run();
  
  return c.json({ success: true });
});

export default products;
