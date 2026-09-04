import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getUserById } from '../db/users.repo.js';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function generateToken(userId: string, tenantId: string, role: string): string {
  return jwt.sign({ userId, tenantId, role }, env.JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Check if account is still active (OWASP ASVS V4.1 / H-04)
    if (decoded.userId && decoded.role !== 'superadmin') {
      const user = await getUserById(decoded.userId);
      if (!user || user.active === false) {
        res.status(403).json({ error: 'Tu cuenta ha sido desactivada o suspendida. Por favor contacta al administrador.' });
        return;
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Forbidden: Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'superadmin') {
    res.status(403).json({ error: 'Superadmin access required' });
    return;
  }
  next();
}
