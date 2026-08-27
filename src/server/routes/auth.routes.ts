import { Router } from 'express';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { getUserByEmail, getUserById, verifyPassword } from '../db/users.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    const user = await getUserByEmail(null, email);
    if (!user) {
      await logAuditEvent(null, null, 'login_failed', 'user', undefined, { email, reason: 'user_not_found' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAuditEvent(user.tenantId, user.id, 'login_failed', 'user', user.id, { email, reason: 'wrong_password' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Cuenta desactivada' });
      return;
    }

    const token = generateToken(user.id, user.tenantId, user.role);

    await logAuditEvent(user.tenantId, user.id, 'login', 'user', user.id, { email }, req.ip, req.headers['user-agent']);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error del servidor' });
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
