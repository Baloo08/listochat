import { Router } from 'express';
import { query } from '../db.js';
import { verifyPassword, generateToken, requireSuperAdmin, AuthenticatedRequest, logAdminAction } from '../auth.js';

const router = Router();

// In-memory rate limiter for login
const loginFailures = new Map<string, { count: number; lockedUntil: number }>();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400).json({ error: 'El correo electrónico y la contraseña son obligatorios' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'local');
    const rateKey = `${clientIp}:${cleanEmail}`;

    // Rate limiting check
    const attempt = loginFailures.get(rateKey);
    const now = Date.now();
    if (attempt && attempt.lockedUntil > now) {
      const waitSec = Math.ceil((attempt.lockedUntil - now) / 1000);
      res.status(429).json({ error: `Demasiados intentos fallidos. Bloqueado temporalmente por ${waitSec} segundos.` });
      return;
    }

    // Query user
    const userRes = await query(
      `SELECT id, tenant_id, name, email, password_hash, role, active 
       FROM users 
       WHERE LOWER(email) = LOWER($1) AND role = 'superadmin'`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      recordFailure(rateKey);
      res.status(401).json({ error: 'Credenciales inválidas o cuenta sin privilegios de SuperAdmin' });
      return;
    }

    const user = userRes.rows[0];

    if (user.active === false) {
      res.status(403).json({ error: 'Esta cuenta administrativa ha sido desactivada' });
      return;
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailure(rateKey);
      res.status(401).json({ error: 'Credenciales inválidas o cuenta sin privilegios de SuperAdmin' });
      return;
    }

    // Clear failure rate limit
    loginFailures.delete(rateKey);

    const token = generateToken(user.id, user.tenant_id, user.role);

    await logAdminAction(user.id, 'superadmin_login', 'user', user.id, { email: cleanEmail }, req);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('[Admin Login] Error:', error);
    res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
});

router.get('/me', requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  res.json({
    id: req.user!.userId,
    name: req.user!.name,
    email: req.user!.email,
    role: req.user!.role,
  });
});

function recordFailure(key: string) {
  const now = Date.now();
  const attempt = loginFailures.get(key) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 5 * 60 * 1000; // 5 minutes lockout
  }
  loginFailures.set(key, attempt);
}

export default router;
