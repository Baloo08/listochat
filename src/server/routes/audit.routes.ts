import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { getAuditLogs } from '../db/audit.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/', async (req, res) => {
  try {
    const { action, userId, tenantId, limit, offset, startDate, endDate } = req.query as any;
    const result = await getAuditLogs(tenantId || null, {
      action,
      userId,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Error al obtener logs de auditoría' });
  }
});

export default router;
