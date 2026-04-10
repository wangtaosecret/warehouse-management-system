import { Hono } from 'hono';
import { generateId, now, parseJSON } from '../db/d1';
import { generateToken, verifyToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const auth = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// Login
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password) {
    return c.json({ success: false, error: '用户名和密码不能为空' }, 400);
  }

  const db = c.env.DB;
  
  try {
    // Query user from database
    const user = await db.prepare(`
      SELECT u.*, r.permissions as role_permissions
      FROM user u
      LEFT JOIN role r ON JSON_EACH(u.role_ids) = r.id
      WHERE u.username = ? AND u.status = 'enabled'
    `).bind(username).first();
    
    // Try simpler query first
    const userResult = await db.prepare(`
      SELECT * FROM user WHERE username = ? AND status = 'enabled'
    `).bind(username).first();
    
    if (!userResult) {
      return c.json({ success: false, error: '用户名或密码错误' }, 401);
    }
    
    // Verify password
    const valid = await verifyPassword(password, userResult.password_hash);
    if (!valid) {
      return c.json({ success: false, error: '用户名或密码错误' }, 401);
    }
    
    // Parse role_ids
    const roleIds = parseJSON<string[]>(userResult.role_ids, []);
    
    // Generate token
    const token = generateToken({
      userId: userResult.id,
      orgId: userResult.org_id,
      username: userResult.username,
      name: userResult.name,
      roleIds: roleIds,
    });
    
    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: userResult.id,
          org_id: userResult.org_id,
          username: userResult.username,
          name: userResult.name,
          role_ids: roleIds,
        }
      }
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return c.json({ success: false, error: '登录失败: ' + e.message }, 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  return c.json({ success: true });
});

// Get current user
auth.get('/me', authMiddleware, async (c) => {
  const user = getUser(c);
  
  return c.json({
    success: true,
    data: { user }
  });
});

export default auth;
