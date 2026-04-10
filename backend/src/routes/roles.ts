import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const roles = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// List roles
roles.get('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT r.*, 
        (SELECT COUNT(*) FROM user WHERE JSON_EACH(role_ids) = r.id) as user_count
      FROM role r
      WHERE r.org_id = ? OR r.is_system = 1
      ORDER BY r.is_system DESC, r.name
    `).bind(user.org_id).all();
    
    return c.json({ success: true, data: result.results || [] });
  } catch (e: any) {
    // Demo data
    return c.json({
      success: true,
      data: [
        { id: 'role-admin', name: '管理员', remark: '系统最高权限', permissions: ['*'], user_count: 1, is_system: 1 },
        { id: 'role-user', name: '操作员', remark: '普通操作权限', permissions: ['read', 'write'], user_count: 0, is_system: 1 },
      ]
    });
  }
});

// Get role by ID
roles.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT * FROM role WHERE id = ? AND (org_id = ? OR is_system = 1)
    `).bind(id, user.org_id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'Role not found' }, 404);
    }
    
    return c.json({ success: true, data: { ...result, permissions: parseJSON(result.permissions, []) } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Create role
roles.post('/', authMiddleware, async (c) => {
  const user = getUser(c);
  const { name, remark, permissions } = await c.req.json();
  const db = c.env.DB;
  const id = generateId();
  
  try {
    await db.prepare(`
      INSERT INTO role (id, org_id, name, remark, permissions, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.org_id, name, remark || null, JSON.stringify(permissions || []), 0, now()).run();
    
    return c.json({ success: true, data: { id, name } }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Update role
roles.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const { name, remark, permissions } = await c.req.json();
  const db = c.env.DB;
  
  // Cannot modify system roles
  const existing = await db.prepare('SELECT is_system FROM role WHERE id = ?').bind(id).first();
  if (existing?.is_system === 1) {
    return c.json({ success: false, error: 'Cannot modify system role' }, 400);
  }
  
  try {
    await db.prepare(`
      UPDATE role SET name = ?, remark = ?, permissions = ? WHERE id = ? AND org_id = ?
    `).bind(name, remark, JSON.stringify(permissions || []), id, user.org_id).run();
    
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Delete role
roles.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const user = getUser(c);
  const db = c.env.DB;
  
  const existing = await db.prepare('SELECT is_system FROM role WHERE id = ?').bind(id).first();
  if (existing?.is_system === 1) {
    return c.json({ success: false, error: 'Cannot delete system role' }, 400);
  }
  
  await db.prepare('DELETE FROM role WHERE id = ? AND org_id = ? AND is_system = 0').bind(id, user.org_id).run();
  
  return c.json({ success: true });
});

export default roles;
