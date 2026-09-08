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
    const range = (req.query.range as string) || 'today';
    let fromDate = req.query.fromDate as string | undefined;
    let toDate = req.query.toDate as string | undefined;

    const now = new Date();
    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatYMD(now);

    if (range === 'today') {
      fromDate = todayStr;
      toDate = todayStr;
    } else if (range === 'week') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      fromDate = formatYMD(past);
      toDate = todayStr;
    } else if (range === 'month') {
      fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      toDate = todayStr;
    } else if (range === 'year') {
      fromDate = `${now.getFullYear()}-01-01`;
      toDate = todayStr;
    } else if (range === 'all') {
      fromDate = undefined;
      toDate = undefined;
    } else if (range === 'custom') {
      if (!fromDate) fromDate = todayStr;
      if (!toDate) toDate = todayStr;
    }

    const hasDateRange = Boolean(fromDate && toDate);

    const [
      chatsRes,
      appointmentsRes,
      appointmentsCompletedRes,
      appointmentRevenueRes,
      ordersRes,
      ordersPaidRes,
      orderRevenueRes,
      pendingRes,
      recentOrdersRes,
      recentApptsRes
    ] = await Promise.all([
      hasDateRange
        ? query(`SELECT COUNT(DISTINCT remote_jid) as count FROM chat_messages WHERE tenant_id = $1 AND created_at::date >= $2 AND created_at::date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COUNT(DISTINCT remote_jid) as count FROM chat_messages WHERE tenant_id = $1`, [tenantId]),

      hasDateRange
        ? query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND date >= $2 AND date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1`, [tenantId]),

      hasDateRange
        ? query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND (payment_status = 'paid' OR LOWER(status) IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done')) AND date >= $2 AND date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND (payment_status = 'paid' OR LOWER(status) IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done'))`, [tenantId]),

      hasDateRange
        ? query(`SELECT COALESCE(SUM(amount), 0) as total FROM appointments WHERE tenant_id = $1 AND (payment_status = 'paid' OR LOWER(status) IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done')) AND date >= $2 AND date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COALESCE(SUM(amount), 0) as total FROM appointments WHERE tenant_id = $1 AND (payment_status = 'paid' OR LOWER(status) IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done'))`, [tenantId]),

      hasDateRange
        ? query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND created_at::date >= $2 AND created_at::date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1`, [tenantId]),

      hasDateRange
        ? query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND payment_status = 'paid' AND created_at::date >= $2 AND created_at::date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND payment_status = 'paid'`, [tenantId]),

      hasDateRange
        ? query(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = $1 AND payment_status = 'paid' AND created_at::date >= $2 AND created_at::date <= $3`, [tenantId, fromDate, toDate])
        : query(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = $1 AND payment_status = 'paid'`, [tenantId]),

      query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]),

      query(`
        SELECT id, order_number as "orderNumber", customer_name as "customerName", total, status, 
               payment_method as "paymentMethod", payment_status as "paymentStatus", created_at as "createdAt"
        FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 6
      `, [tenantId]),

      query(`
        SELECT id, name, whatsapp, service, date, time, amount, status, 
               payment_status as "paymentStatus", created_at as "createdAt"
        FROM appointments WHERE tenant_id = $1 ORDER BY date DESC, time DESC, created_at DESC LIMIT 6
      `, [tenantId])
    ]);

    let courtRevenue = 0;
    let courtBookingsCount = 0;
    try {
      const cbRes = hasDateRange
        ? await query(`SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total FROM court_bookings WHERE tenant_id = $1 AND status NOT IN ('cancelled', 'rejected') AND date >= $2 AND date <= $3`, [tenantId, fromDate, toDate])
        : await query(`SELECT COUNT(*) as count, COALESCE(SUM(total_price), 0) as total FROM court_bookings WHERE tenant_id = $1 AND status NOT IN ('cancelled', 'rejected')`, [tenantId]);
      courtBookingsCount = parseInt(cbRes.rows[0]?.count || '0', 10);
      courtRevenue = parseFloat(cbRes.rows[0]?.total || '0');
    } catch (e) {
      // safe fallback if courts feature is not enabled
    }

    const appointmentRevenue = parseFloat(appointmentRevenueRes.rows[0]?.total || '0');
    const orderRevenue = parseFloat(orderRevenueRes.rows[0]?.total || '0');
    const totalRevenue = appointmentRevenue + orderRevenue + courtRevenue;

    res.json({
      range,
      fromDate: fromDate || null,
      toDate: toDate || null,
      chats: parseInt(chatsRes.rows[0]?.count || '0', 10),
      appointments: parseInt(appointmentsRes.rows[0]?.count || '0', 10),
      appointmentsCompleted: parseInt(appointmentsCompletedRes.rows[0]?.count || '0', 10),
      orders: parseInt(ordersRes.rows[0]?.count || '0', 10),
      ordersPaid: parseInt(ordersPaidRes.rows[0]?.count || '0', 10),
      appointmentRevenue,
      orderRevenue,
      courtRevenue,
      courtBookingsCount,
      totalRevenue,
      revenue: totalRevenue, // backwards compatible
      pendingOrders: parseInt(pendingRes.rows[0]?.count || '0', 10),
      recentOrders: recentOrdersRes.rows,
      recentAppointments: recentApptsRes.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
