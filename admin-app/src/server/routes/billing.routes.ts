import { Router } from 'express';
import { query } from '../db.js';
import { requireSuperAdmin } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

router.get('/stats', async (req, res) => {
  try {
    // 1. Tenants count by subscription status
    const statusRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true AND (subscription_status = 'active' OR subscription_status IS NULL)) as "payingCount",
        COUNT(*) FILTER (WHERE subscription_status = 'trial') as "trialCount",
        COUNT(*) FILTER (WHERE active = false OR subscription_status = 'cancelled' OR subscription_status = 'expired') as "inactiveCount"
      FROM tenants
    `);

    // 2. MRR calculation based on plan / custom_monthly_price
    const mrrRes = await query(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN billing_currency = 'USD' THEN 0
            WHEN custom_monthly_price > 0 THEN custom_monthly_price
            WHEN plan = 'starter' THEN 18000
            WHEN plan = 'pro' THEN 32000
            WHEN plan = 'business' THEN 55000
            ELSE 18000
          END
        ), 0) as "mrrCrc",
        COALESCE(SUM(
          CASE 
            WHEN billing_currency = 'USD' AND custom_monthly_price > 0 THEN custom_monthly_price
            WHEN billing_currency = 'USD' AND plan = 'starter' THEN 35
            WHEN billing_currency = 'USD' AND plan = 'pro' THEN 65
            WHEN billing_currency = 'USD' AND plan = 'business' THEN 110
            ELSE 0
          END
        ), 0) as "mrrUsd"
      FROM tenants
      WHERE active = true
    `);

    // 3. Electronic invoicing vouchers usage
    const vouchersRes = await query(`
      SELECT 
        COUNT(*) as "totalVouchers",
        COUNT(*) FILTER (WHERE status = 'accepted') as "acceptedVouchers",
        COUNT(*) FILTER (WHERE status = 'rejected') as "rejectedVouchers"
      FROM electronic_vouchers
    `).catch(() => ({ rows: [{ totalVouchers: 0, acceptedVouchers: 0, rejectedVouchers: 0 }] }));

    // 4. Card tokens registered
    const cardsRes = await query(`
      SELECT COUNT(*) as "totalCards" FROM tenant_payment_cards WHERE active = true
    `).catch(() => ({ rows: [{ totalCards: 0 }] }));

    res.json({
      overview: {
        totalTenants: parseInt(statusRes.rows[0]?.total || '0', 10),
        payingTenants: parseInt(statusRes.rows[0]?.payingCount || '0', 10),
        trialTenants: parseInt(statusRes.rows[0]?.trialCount || '0', 10),
        inactiveTenants: parseInt(statusRes.rows[0]?.inactiveCount || '0', 10),
        mrrCrc: parseFloat(mrrRes.rows[0]?.mrrCrc || '0'),
        mrrUsd: parseFloat(mrrRes.rows[0]?.mrrUsd || '0'),
        vouchers: vouchersRes.rows[0] || { totalVouchers: 0, acceptedVouchers: 0, rejectedVouchers: 0 },
        activeCards: parseInt(cardsRes.rows[0]?.totalCards || '0', 10)
      }
    });
  } catch (error: any) {
    console.error('[Billing Stats] Error:', error);
    res.status(500).json({ error: 'Error al consultar métricas de facturación' });
  }
});

// Recent charges & transactions
router.get('/charges', async (req, res) => {
  try {
    const chargesRes = await query(`
      SELECT tc.id, tc.tenant_id as "tenantId", t.name as "tenantName",
             tc.amount, tc.currency, tc.status, tc.payment_method as "paymentMethod",
             tc.description, tc.created_at as "createdAt"
      FROM tenant_charges tc
      LEFT JOIN tenants t ON tc.tenant_id = t.id
      ORDER BY tc.created_at DESC
      LIMIT 30
    `).catch(() => ({ rows: [] }));

    res.json(chargesRes.rows);
  } catch (error: any) {
    console.error('[Billing Charges] Error:', error);
    res.status(500).json({ error: 'Error al consultar cargos' });
  }
});

export default router;
