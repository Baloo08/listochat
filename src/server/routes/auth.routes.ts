import { Router } from 'express';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { getUserByEmail, getUserById, verifyPassword } from '../db/users.repo.js';
import { getTenantById, getTenantBySlug } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();

// In-memory rate limiting for brute-force protection
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

function checkRateLimit(key: string): { blocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt) return { blocked: false, remainingSeconds: 0 };

  if (attempt.blockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
    return { blocked: true, remainingSeconds };
  }

  // Reset if window has expired (10 minutes)
  if (now - attempt.firstAttempt > 10 * 60 * 1000) {
    loginAttempts.delete(key);
  }

  return { blocked: false, remainingSeconds: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  attempt.count += 1;

  // If 5 failed attempts in 10 minutes, block for 5 minutes
  if (attempt.count >= 5) {
    attempt.blockedUntil = now + 5 * 60 * 1000;
  }
  loginAttempts.set(key, attempt);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

// Public endpoint to get tenant branding for dedicated login (/acceso/:slug)
router.get('/tenant-info/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    const store = await getStoreSettings(tenant.id);

    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      whatsappNumber: tenant.whatsappNumber || '',
      logoUrl: store?.storeLogoUrl || '',
      bannerUrl: store?.storeBannerUrl || '',
      theme: store?.storeTheme || { primaryColor: '#16a34a' }
    });
  } catch (error) {
    console.error('Error al obtener info de tenant:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const ipKey = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
    const rateLimitKey = `${ipKey}_${(email || '').toLowerCase().trim()}`;

    // 1. Rate-limiting check
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.blocked) {
      await logAuditEvent(null, null, 'login_blocked_rate_limit', 'security', undefined, { email, ip: ipKey, remainingSeconds: rateCheck.remainingSeconds }, req.ip, req.headers['user-agent']);
      res.status(429).json({
        error: `Demasiados intentos fallidos. Por seguridad, tu acceso está bloqueado temporalmente por ${rateCheck.remainingSeconds} segundos.`
      });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      return;
    }

    const user = await getUserByEmail(null, email);
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      await logAuditEvent(null, null, 'login_failed', 'user', undefined, { email, reason: 'user_not_found' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      await logAuditEvent(user.tenantId, user.id, 'login_failed', 'user', user.id, { email, reason: 'wrong_password' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.' });
      return;
    }

    // If tenantSlug was provided, check if user belongs to this tenant or is superadmin
    if (tenantSlug) {
      const targetTenant = await getTenantBySlug(tenantSlug.toLowerCase().trim());
      if (targetTenant && user.role !== 'superadmin' && user.tenantId !== targetTenant.id) {
        res.status(403).json({
          error: `Esta cuenta no tiene permisos para acceder a ${targetTenant.name}. Por favor verifica tus credenciales.`
        });
        return;
      }
    }

    // Clear failed attempts on successful login
    clearAttempts(rateLimitKey);

    const token = generateToken(user.id, user.tenantId, user.role);
    const tenant = user.tenantId ? await getTenantById(user.tenantId) : null;

    await logAuditEvent(user.tenantId, user.id, 'login', 'user', user.id, { email, role: user.role }, req.ip, req.headers['user-agent']);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name || 'Mi Negocio',
        tenantSlug: tenant?.slug || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error del servidor al procesar el ingreso' });
  }
});

router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await getUserById(req.user?.userId);
    const tenant = await getTenantById(req.user?.tenantId);
    
    // Always honor the token's active tenantId and role (vital for impersonation!)
    const activeTenantId = req.user?.tenantId || user?.tenantId;
    const activeRole = req.user?.role || user?.role || 'admin';
    
    res.json({
      id: user?.id || req.user?.userId,
      email: user?.email || 'admin@betico.cr',
      name: user?.name || 'Super Admin',
      role: activeRole,
      tenantId: activeTenantId,
      tenantName: tenant?.name || 'Mi Negocio',
      tenantSlug: tenant?.slug || ''
    });
  } catch (err) {
    res.json(req.user);
  }
});

export default router;
