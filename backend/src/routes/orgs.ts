import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, adminOnly, AuthVariables } from '../middleware/auth';

const orgs = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List organizations (admin only)
orgs.get('/', adminOnly, async (c) => {
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT * FROM org 
      ORDER BY created_at DESC
    `).all();
    
    return c.json({
      success: true,
      data: {
        list: result.results || [],
        total: result.results?.length || 0
      }
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Get organization by ID
orgs.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  
  // Only admin or org owner can view
  if (user.org_id !== 'system' && user.org_id !== id) {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }
  
  const db = c.env.DB;
  
  try {
    const result = await db.prepare('SELECT * FROM org WHERE id = ?').bind(id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'Organization not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create organization (admin only)
orgs.post('/', adminOnly, async (c) => {
  const { name, contact, phone, address } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  const createdAt = now();
  
  try {
    await db.prepare(`
      INSERT INTO org (id, name, contact, phone, address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, contact || null, phone || null, address || null, createdAt, createdAt).run();
    
    // Create default admin user for this org
    const adminUserId = generateId();
    await db.prepare(`
      INSERT INTO user (id, org_id, username, password_hash, name, role_ids, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(adminUserId, id, name + '_admin', '$2a$10$placeholder', name + '管理员', '[]', createdAt).run();
    
    return c.json({ success: true, data: { id, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update organization
orgs.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, contact, phone, address } = await c.req.json();
  
  if (user.org_id !== 'system' && user.org_id !== id) {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }
  
  const db = c.env.DB;
  const updatedAt = now();
  
  try {
    await db.prepare(`
      UPDATE org SET name = ?, contact = ?, phone = ?, address = ?, updated_at = ?
      WHERE id = ?
    `).bind(name, contact, phone, address, updatedAt, id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Disable organization
orgs.put('/:id/disable', adminOnly, async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  try {
    await db.prepare('UPDATE org SET status = ? WHERE id = ?').bind('disabled', id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Enable organization
orgs.put('/:id/enable', adminOnly, async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  try {
    await db.prepare('UPDATE org SET status = ? WHERE id = ?').bind('enabled', id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Delete organization
orgs.delete('/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  const db = c.env.DB;
  
  try {
    // Check if org has data
    const productCount = await db.prepare('SELECT COUNT(*) as count FROM product WHERE org_id = ?').bind(id).first();
    if (productCount && productCount.count > 0) {
      return c.json({ success: false, error: 'Organization has data, cannot delete' }, 400);
    }
    
    await db.prepare('DELETE FROM org WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default orgs;
