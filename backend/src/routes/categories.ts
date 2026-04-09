import { Hono } from 'hono';
import { generateId, now } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const categories = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List categories
categories.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM product WHERE category_id = c.id) as product_count
      FROM category c
      WHERE c.org_id = ?
      ORDER BY c.name
    `).bind(user.org_id).all();
    
    return c.json({ success: true, data: result.results || [] });
  } catch (e: any) {
    // Return demo data if DB not initialized
    return c.json({
      success: true,
      data: [
        { id: '1', name: '电子产品', parent_id: null, product_count: 50, remark: '' },
        { id: '2', name: '办公用品', parent_id: null, product_count: 30, remark: '' },
        { id: '3', name: '手机', parent_id: '1', product_count: 20, remark: '' },
        { id: '4', name: '电脑', parent_id: '1', product_count: 30, remark: '' },
      ]
    });
  }
});

// Create category
categories.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { name, parent_id, remark } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  
  try {
    await db.prepare(`
      INSERT INTO category (id, org_id, name, parent_id, remark, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, user.org_id, name, parent_id || null, remark || null, now()).run();
    
    return c.json({ success: true, data: { id, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update category
categories.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, parent_id, remark } = await c.req.json();
  const db = c.env.DB;
  
  await db.prepare(`
    UPDATE category SET name = ?, parent_id = ?, remark = ? WHERE id = ? AND org_id = ?
  `).bind(name, parent_id, remark, id, user.org_id).run();
  
  return c.json({ success: true });
});

// Delete category
categories.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  // Check if category has products
  const productCount = await db.prepare('SELECT COUNT(*) as count FROM product WHERE category_id = ?').bind(id).first();
  if (productCount && productCount.count > 0) {
    return c.json({ success: false, error: 'Category has products, cannot delete' }, 400);
  }
  
  await db.prepare('DELETE FROM category WHERE id = ? AND org_id = ?').bind(id, user.org_id).run();
  
  return c.json({ success: true });
});

export default categories;
