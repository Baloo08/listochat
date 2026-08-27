import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

export default router;
