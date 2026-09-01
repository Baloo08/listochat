import { Router } from 'express';
import { getPendingByTenant, getQueueStats } from '../db/message-queue.repo.js';

const router = Router();

// GET /api/queue/pending?tenantId=xxx
router.get('/pending', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId || req.query.tenantId as string;
    if (!tenantId) return res.status(400).json({ error: 'tenantId required' });
    const messages = await getPendingByTenant(tenantId);
    res.json(messages);
  } catch (error: any) {
    console.error('[QueueRoute] Error pending:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/queue/stats?tenantId=xxx
router.get('/stats', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId || req.query.tenantId as string;
    const stats = await getQueueStats(tenantId || undefined);
    res.json(stats);
  } catch (error: any) {
    console.error('[QueueRoute] Error stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
