import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'warehouse-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  orgId: string;
  username: string;
  name: string;
  roleIds: string[];
  exp?: number;
  iat?: number;
}

export function generateToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
