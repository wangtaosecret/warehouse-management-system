import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { generateToken, verifyToken } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateId, now } from '../db/d1';
import { authMiddleware, getUser, AuthVariables } from '../middleware/auth';

const auth = new Hono<{ Bindings: { DB: any }; Variables: AuthVariables }>();

// Login
auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password) {
    return c.json({ success: false, error: 'Username and password required' }, 400);
  }

  const db = c.env.DB;
  
  // For demo, check if user exists (in real app, query database)
  // Since we don't have real DB initialization here, simulate login
  if (username === 'admin' && password === 'admin123') {
    const token = generateToken({
      userId: 'admin-id',
      orgId: 'system',
      username: 'admin',
      name: '系统管理员',
      role_ids: [],
    });
    
    return c.json({
      success: true,
      data: {
        token,
        user: {
          id: 'admin-id',
          org_id: 'system',
          username: 'admin',
          name: '系统管理员',
          role_ids: [],
        }
      }
    });
  }

  // Demo: allow any login for testing
  const token = generateToken({
    userId: 'demo-user-id',
    orgId: 'demo-org',
    username,
    name: username,
    role_ids: ['admin'],
  });

  return c.json({
    success: true,
    data: {
      token,
      user: {
        id: 'demo-user-id',
        org_id: 'demo-org',
        username,
        name: username,
        role_ids: ['admin'],
      }
    }
  });
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
