import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';
import { hashPassword, verifyPassword, DEFAULT_PASSWORD } from '../utils/password';

const users = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List users
users.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  const { page = 1, pageSize = 20, keyword, status } = c.req.query();
  
  let sql = 'SELECT id, org_id, username, name, phone, role_ids, status, created_at FROM user WHERE org_id = ?';
  const params: any[] = [user.org_id];
  
  if (keyword) {
    sql += ' AND (username LIKE ? OR name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
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

// Get user by ID
users.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT id, org_id, username, name, phone, role_ids, status, created_at 
      FROM user WHERE id = ? AND org_id = ?
    `).bind(id, user.org_id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create user
users.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { username, password, name, phone, role_ids } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  const createdAt = now();
  
  // Check if username exists
  const existing = await db.prepare('SELECT id FROM user WHERE username = ?').bind(username).first();
  if (existing) {
    return c.json({ success: false, error: 'Username already exists' }, 400);
  }
  
  try {
    const passwordHash = await hashPassword(password || DEFAULT_PASSWORD);
    
    await db.prepare(`
      INSERT INTO user (id, org_id, username, password_hash, name, phone, role_ids, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.org_id, username, passwordHash, name, phone || null, JSON.stringify(role_ids || []), createdAt).run();
    
    return c.json({ success: true, data: { id, username, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update user
users.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, phone, role_ids } = await c.req.json();
  const db = c.env.DB;
  
  // Check ownership
  const existing = await db.prepare('SELECT id FROM user WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  try {
    await db.prepare(`
      UPDATE user SET name = ?, phone = ?, role_ids = ? WHERE id = ?
    `).bind(name, phone, JSON.stringify(role_ids || []), id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Reset password
users.put('/:id/reset-password', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { password } = await c.req.json();
  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT id FROM user WHERE id = ? AND org_id = ?').bind(id, user.org_id).first();
  if (!existing) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  try {
    const passwordHash = await hashPassword(password || DEFAULT_PASSWORD);
    await db.prepare('UPDATE user SET password_hash = ? WHERE id = ?').bind(passwordHash, id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Disable user
users.put('/:id/disable', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  await db.prepare('UPDATE user SET status = ? WHERE id = ? AND org_id = ?').bind('disabled', id, user.org_id).run();
  
  return c.json({ success: true });
});

// Enable user
users.put('/:id/enable', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  await db.prepare('UPDATE user SET status = ? WHERE id = ? AND org_id = ?').bind('enabled', id, user.org_id).run();
  
  return c.json({ success: true });
});

// Delete user
users.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  await db.prepare('DELETE FROM user WHERE id = ? AND org_id = ?').bind(id, user.org_id).run();
  
  return c.json({ success: true });
});

export default users;
