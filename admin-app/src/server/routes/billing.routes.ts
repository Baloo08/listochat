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

// Collections & traffic-light status per tenant
router.get('/collections', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.name, t.slug, t.plan, t.active,
             t.subscription_status, t.billing_currency, t.custom_monthly_price,
             t.trial_ends_at, t.next_billing_date, t.grace_period_ends_at,
             t.whatsapp_number, t.auto_billing_enabled, t.last_auto_charge_status,
             t.last_payment_amount, t.last_payment_ref, t.payment_notes,
             COALESCE(t.requires_subscription_invoice, false) as requires_subscription_invoice,
             NULLIF(t.billing_id_type, '') as billing_id_type,
             NULLIF(t.billing_id_number, '') as billing_id_number,
             NULLIF(t.billing_legal_name, '') as billing_legal_name,
             NULLIF(t.billing_email, '') as billing_email,
             thc.taxpayer_id_type, thc.taxpayer_id_number, thc.taxpayer_name, thc.taxpayer_email,
             COALESCE(u.email, '') as admin_email,
             COALESCE(u.name, 'Admin') as admin_name,
             c.card_last4, c.card_brand
      FROM tenants t
      LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
      LEFT JOIN LATERAL (
        SELECT email, name FROM users
        WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin')
        ORDER BY created_at ASC LIMIT 1
      ) u ON true
      LEFT JOIN LATERAL (
        SELECT card_last4, card_brand FROM tenant_billing_cards
        WHERE tenant_id = t.id AND is_active = true
        ORDER BY is_default DESC, created_at DESC LIMIT 1
      ) c ON true
      WHERE t.slug != 'superadmin'
      ORDER BY COALESCE(t.next_billing_date, t.trial_ends_at::date, CURRENT_DATE) ASC, t.name ASC
    `);

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let totalDueCRC = 0;
    let countPaid = 0;
    let countDueSoon = 0;
    let countGrace = 0;
    let countOverdue = 0;

    const collections = result.rows.map((r: any) => {
      const currency = r.billing_currency || 'CRC';
      let monthlyPrice = Number(r.custom_monthly_price || 0);
      if (monthlyPrice <= 0) {
        if (currency === 'USD') {
          monthlyPrice = r.plan === 'business' ? 110 : r.plan === 'pro' ? 65 : 35;
        } else {
          monthlyPrice = r.plan === 'business' ? 55000 : r.plan === 'pro' ? 32000 : 18000;
        }
      }

      const rawDate = r.next_billing_date || r.trial_ends_at || null;
      let nextBillingDate: string | null = null;
      let diffDays: number | null = null;

      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          nextBillingDate = d.toISOString().split('T')[0];
          const dueMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          diffDays = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      let trafficLight: 'paid' | 'due_soon' | 'grace' | 'overdue' = 'paid';
      let trafficLabel = 'Al día';
      let trafficColor = 'green';

      if (diffDays === null || diffDays > 5) {
        trafficLight = 'paid';
        trafficLabel = diffDays !== null ? `Al día (${diffDays}d)` : 'Al día';
        trafficColor = 'green';
        countPaid++;
      } else if (diffDays >= 0 && diffDays <= 5) {
        trafficLight = 'due_soon';
        trafficLabel = diffDays === 0 ? 'Vence hoy' : `Vence en ${diffDays}d`;
        trafficColor = 'yellow';
        countDueSoon++;
        totalDueCRC += currency === 'USD' ? monthlyPrice * 515 : monthlyPrice;
      } else if (diffDays >= -5 && diffDays < 0) {
        trafficLight = 'grace';
        trafficLabel = `En gracia (${Math.abs(diffDays)}d)`;
        trafficColor = 'orange';
        countGrace++;
        totalDueCRC += currency === 'USD' ? monthlyPrice * 515 : monthlyPrice;
      } else {
        trafficLight = 'overdue';
        trafficLabel = `Moroso (${Math.abs(diffDays)}d)`;
        trafficColor = 'red';
        countOverdue++;
        totalDueCRC += currency === 'USD' ? monthlyPrice * 515 : monthlyPrice;
      }

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        plan: r.plan,
        active: Boolean(r.active),
        subscriptionStatus: r.subscription_status || (r.active ? 'active' : 'suspended'),
        whatsappNumber: r.whatsapp_number || '',
        adminEmail: r.admin_email || 'Sin registrar',
        adminName: r.admin_name || 'Admin',
        monthlyPrice,
        currency,
        nextBillingDate,
        diffDays,
        trafficLight,
        trafficLabel,
        trafficColor,
        autoBillingEnabled: Boolean(r.auto_billing_enabled),
        lastAutoChargeStatus: r.last_auto_charge_status || null,
        cardLast4: r.card_last4 || null,
        cardBrand: r.card_brand || null,
        lastPaymentAmount: r.last_payment_amount ? Number(r.last_payment_amount) : null,
        lastPaymentRef: r.last_payment_ref || null,
        paymentNotes: r.payment_notes || null,
        requiresSubscriptionInvoice: Boolean(r.requires_subscription_invoice),
        billingIdType: r.billing_id_type || r.taxpayer_id_type || '01',
        billingIdNumber: r.billing_id_number || r.taxpayer_id_number || '',
        billingLegalName: r.billing_legal_name || r.taxpayer_name || r.name,
        billingEmail: r.billing_email || r.taxpayer_email || r.admin_email || ''
      };
    });

    res.json({
      summary: {
        totalDueCRC,
        countPaid,
        countDueSoon,
        countGrace,
        countOverdue,
        totalTenants: collections.length
      },
      collections
    });
  } catch (error: any) {
    console.error('[Billing Collections] Error:', error);
    res.status(500).json({ error: 'Error al consultar estado de cobros de suscripciones' });
  }
});

export default router;
