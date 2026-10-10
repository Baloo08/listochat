import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'betico_jwt_secret_64_chars_super_safe_key_cr_2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `v2:${salt}:${hash}`;
}

export function verifyPassword(password: string, hashString: string): boolean {
  if (!hashString || !password) return false;

  // 1. Plain text comparison
  const passBuf = Buffer.from(password);
  const hashBuf = Buffer.from(hashString);
  if (passBuf.length === hashBuf.length && crypto.timingSafeEqual(passBuf, hashBuf)) return true;

  // 2. Modern v2 format: "v2:salt:hash"
  if (hashString.startsWith('v2:')) {
    const parts = hashString.split(':');
    const salt = parts[1];
    const storedHash = parts[2];
    if (!salt || !storedHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const b1 = Buffer.from(hash);
    const b2 = Buffer.from(storedHash);
    return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
  }

  // 3. Salted formats: "salt:hash"
  if (hashString.includes(':')) {
    const [salt, storedHash] = hashString.split(':');
    if (salt && storedHash) {
      // PBKDF2 1,000 rounds sha512
      const hashPbkdf2_1k = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      if (hashPbkdf2_1k === storedHash) return true;

      // PBKDF2 100,000 rounds sha512 without v2 prefix
      const hashPbkdf2_100k = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      if (hashPbkdf2_100k === storedHash) return true;

      // PBKDF2 1,000 rounds sha256
      const hashPbkdf2_1k_256 = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
      if (hashPbkdf2_1k_256 === storedHash) return true;

      // SHA256 (salt + password)
      const hashSha256_1 = crypto.createHash('sha256').update(salt + password).digest('hex');
      if (hashSha256_1 === storedHash) return true;

      // SHA256 (password + salt)
      const hashSha256_2 = crypto.createHash('sha256').update(password + salt).digest('hex');
      if (hashSha256_2 === storedHash) return true;
    }
  }

  // 4. Standalone SHA256 hash
  const plainSha256 = crypto.createHash('sha256').update(password).digest('hex');
  if (plainSha256 === hashString) return true;

  return false;
}

export function generateToken(userId: string, tenantId: string | null, role: string): string {
  return jwt.sign(
    { userId, tenantId: tenantId || 'system', role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No autorizado: Token de acceso no proporcionado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (decoded.role !== 'superadmin') {
      res.status(403).json({ error: 'Acceso denegado: Se requieren permisos de SuperAdmin' });
      return;
    }

    // Verify user in DB is active
    const userRes = await query(
      `SELECT id, name, email, role, active FROM users WHERE id = $1 AND role = 'superadmin'`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0 || userRes.rows[0].active === false) {
      res.status(403).json({ error: 'Cuenta de administrador inactiva o no encontrada' });
      return;
    }

    const row = userRes.rows[0];
    req.user = {
      userId: row.id,
      tenantId: decoded.tenantId,
      role: row.role,
      name: row.name,
      email: row.email,
    };

    next();
  } catch (err: any) {
    res.status(403).json({ error: 'Token inválido o expirado' });
  }
}

export async function logAdminAction(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
  req?: Request
): Promise<void> {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress) : null;
    const ua = req ? req.headers['user-agent'] : 'Admin App';
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ip, ua]
    );
  } catch (e) {
    console.warn('[Admin Audit] No se pudo guardar log:', e);
  }
}
