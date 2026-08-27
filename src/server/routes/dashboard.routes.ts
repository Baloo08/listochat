import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [chatsRes, appointmentsRes, ordersRes, revenueRes, pendingRes, recentOrdersRes, recentApptsRes] = await Promise.all([
      query(`SELECT COUNT(DISTINCT remote_jid) as count FROM chat_messages WHERE tenant_id = $1 AND created_at::date = $2`, [tenantId, today]),
      query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND date = $2`, [tenantId, today]),
      query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND created_at::date = $2`, [tenantId, today]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = $1 AND created_at >= $2 AND payment_status = 'paid'`, [tenantId, firstOfMonth]),
      query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]),
      query(`
        SELECT id, order_number as "orderNumber", customer_name as "customerName", total, status, 
               payment_method as "paymentMethod", created_at as "createdAt"
        FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5
      `, [tenantId]),
      query(`
        SELECT id, name, whatsapp, service, date, time, status, created_at as "createdAt"
        FROM appointments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5
      `, [tenantId])
    ]);

    res.json({
      chats: parseInt(chatsRes.rows[0].count, 10),
      appointments: parseInt(appointmentsRes.rows[0].count, 10),
      orders: parseInt(ordersRes.rows[0].count, 10),
      revenue: parseFloat(revenueRes.rows[0].total),
      pendingOrders: parseInt(pendingRes.rows[0].count, 10),
      recentOrders: recentOrdersRes.rows,
      recentAppointments: recentApptsRes.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
