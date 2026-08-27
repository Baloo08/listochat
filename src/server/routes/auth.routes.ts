import { Router } from 'express';
import { generateToken, authenticateToken } from '../middleware/auth.js';
// DB import would go here

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Mock authentication for now
    if (email === 'admin@admin.com' && password === 'admin') {
      const token = generateToken('1', 'tenant-1', 'superadmin');
      res.json({ token, user: { id: '1', email, role: 'superadmin', tenantId: 'tenant-1' } });
      return;
    }
    res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
