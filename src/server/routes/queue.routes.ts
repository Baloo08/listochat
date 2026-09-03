import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getPendingByTenant, getQueueStats } from '../db/message-queue.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

// GET /api/queue/pending
router.get('/pending', async (req, res) => {
  try {
    const tenantId = ((req as any).user?.role === 'superadmin' && req.query.tenantId)
      ? (req.query.tenantId as string)
      : req.tenantId;

    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    const messages = await getPendingByTenant(tenantId);
    res.json(messages);
  } catch (error: any) {
    console.error('[QueueRoute] Error pending:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/queue/stats
router.get('/stats', async (req, res) => {
  try {
    const tenantId = ((req as any).user?.role === 'superadmin' && req.query.tenantId)
      ? (req.query.tenantId as string)
      : req.tenantId;

    const stats = await getQueueStats(tenantId || undefined);
    res.json(stats);
  } catch (error: any) {
    console.error('[QueueRoute] Error stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
