import { Router } from 'express';
import os from 'os';
import { query } from '../db.js';
import { requireSuperAdmin } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

router.get('/stats', async (req, res) => {
  try {
    // 1. Memory stats
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memUsagePercent = Math.round((usedMemBytes / totalMemBytes) * 100);

    const mem = {
      totalMb: Math.round(totalMemBytes / (1024 * 1024)),
      usedMb: Math.round(usedMemBytes / (1024 * 1024)),
      freeMb: Math.round(freeMemBytes / (1024 * 1024)),
      percent: memUsagePercent
    };

    // 2. Node Process stats
    const procMem = process.memoryUsage();
    const processStats = {
      heapUsedMb: Math.round(procMem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(procMem.heapTotal / (1024 * 1024)),
      rssMb: Math.round(procMem.rss / (1024 * 1024)),
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version
    };

    // 3. CPU and System stats
    const cpus = os.cpus();
    const cpuInfo = {
      model: cpus.length > 0 ? cpus[0].model : 'Unknown',
      cores: cpus.length,
      loadAvg: os.loadavg(), // 1, 5, 15 min
      platform: os.platform(),
      osUptimeSeconds: Math.round(os.uptime())
    };

    // 4. PostgreSQL Stats
    const [connRes, sizeRes, tablesRes] = await Promise.all([
      query(`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`).catch(() => ({ rows: [{ size: 'N/A' }] })),
      Promise.all([
        query(`SELECT COUNT(*) as c FROM tenants`).then(r => ({ table: 'tenants', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'tenants', count: 0 })),
        query(`SELECT COUNT(*) as c FROM users`).then(r => ({ table: 'users', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'users', count: 0 })),
        query(`SELECT COUNT(*) as c FROM orders`).then(r => ({ table: 'orders', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'orders', count: 0 })),
        query(`SELECT COUNT(*) as c FROM products`).then(r => ({ table: 'products', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'products', count: 0 })),
        query(`SELECT COUNT(*) as c FROM appointments`).then(r => ({ table: 'appointments', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'appointments', count: 0 })),
        query(`SELECT COUNT(*) as c FROM chat_messages`).then(r => ({ table: 'chat_messages', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'chat_messages', count: 0 })),
        query(`SELECT COUNT(*) as c FROM message_queue`).then(r => ({ table: 'message_queue', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'message_queue', count: 0 })),
        query(`SELECT COUNT(*) as c FROM audit_logs`).then(r => ({ table: 'audit_logs', count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: 'audit_logs', count: 0 })),
      ])
    ]);

    const activeConnections = parseInt(connRes.rows[0]?.count || '1', 10);
    const dbSize = sizeRes.rows[0]?.size || 'N/A';

    res.json({
      memory: mem,
      process: processStats,
      cpu: cpuInfo,
      database: {
        activeConnections,
        diskSize: dbSize,
        tables: tablesRes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[System Stats] Error:', error);
    res.status(500).json({ error: 'Error al consultar métricas del sistema' });
  }
});

export default router;
