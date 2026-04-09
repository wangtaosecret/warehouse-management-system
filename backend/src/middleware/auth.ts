import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';

export interface AuthUser {
  id: string;
  org_id: string;
  username: string;
  name: string;
  role_ids: string[];
}

export interface AuthVariables {
  user: AuthUser;
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized', code: 401 }, 401);
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return c.json({ success: false, error: 'Invalid token', code: 401 }, 401);
  }

  c.set('user', {
    id: payload.userId,
    org_id: payload.orgId,
    username: payload.username,
    name: payload.name,
    role_ids: payload.roleIds || [],
  });

  await next();
}

// Helper to get current user from context
export function getUser(c: Context): AuthUser {
  return c.get('user');
}

// Helper to check if user has permission
export function hasPermission(user: AuthUser, permission: string): boolean {
  // System admin has all permissions
  if (user.username === 'admin') return true;
  
  // TODO: Check role permissions from database
  // For now, simple check
  return true;
}

// Admin only middleware
export async function adminOnly(c: Context, next: Next) {
  const user = getUser(c);
  
  if (user.username !== 'admin') {
    return c.json({ success: false, error: 'Admin only', code: 403 }, 403);
  }
  
  await next();
}
