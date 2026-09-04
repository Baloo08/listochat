import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getDefaultBillingCard, getBillingCards, deactivateBillingCard } from '../db/tenant-billing.repo.js';
import { getPlatformTilopayConfig } from '../services/tilopay-subscription.service.js';
import { logAuditEvent } from '../db/audit.repo.js';
import { sendMessage } from '../services/evolution.js';
import { env } from '../config/env.js';

const router = Router();

// Require authenticated tenant admin/staff
router.use(authenticateToken);

/**
 * GET /api/tenant/subscription
 * Retrieves full subscription, trial status, days remaining, card info, and payment history.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Contexto de inquilino requerido.' });
      return;
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado.' });
      return;
    }

    // Fetch tenant detailed billing attributes
    const tenantBillingRes = await query(`
      SELECT custom_monthly_price as "customMonthlyPrice",
             billing_currency as "billingCurrency",
             subscription_status as "subscriptionStatus",
             trial_ends_at as "trialEndsAt",
             next_billing_date as "nextBillingDate",
             grace_period_ends_at as "gracePeriodEndsAt",
             auto_billing_enabled as "autoBillingEnabled",
             plan,
             active
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    const billingData = tenantBillingRes.rows[0] || {};
    const plan = tenant.plan || billingData.plan || 'pro';
    const isAliado = plan.toLowerCase() === 'aliado' || Number(billingData.customMonthlyPrice) === 0;
    const monthlyPrice = Number(billingData.customMonthlyPrice || (plan === 'enterprise' ? 85000 : 55000));
    const currency = billingData.billingCurrency || 'CRC';
    const subscriptionStatus = billingData.subscriptionStatus || (isAliado ? 'active' : 'trial');
    const autoBillingEnabled = Boolean(billingData.autoBillingEnabled);

    // Calculate days remaining
    const now = Date.now();
    let daysRemaining = 0;
    let targetDate: Date | null = null;

    if (subscriptionStatus === 'trial' && billingData.trialEndsAt) {
      targetDate = new Date(billingData.trialEndsAt);
    } else if (billingData.nextBillingDate) {
      targetDate = new Date(billingData.nextBillingDate);
    } else if (billingData.trialEndsAt) {
      targetDate = new Date(billingData.trialEndsAt);
    }

    if (targetDate) {
      const diffMs = targetDate.getTime() - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Default card details (without sensitive tokens)
    const card = await getDefaultBillingCard(tenantId);
    const cardInfo = card ? {
      id: card.id,
      cardLast4: card.cardLast4,
      cardBrand: card.cardBrand,
      cardHolder: card.cardHolder,
      createdAt: card.createdAt
    } : null;

    // Payment history
    const paymentsRes = await query(`
      SELECT id, amount, currency, payment_method as "paymentMethod",
             reference, notes, status, created_at as "createdAt"
      FROM tenant_payments
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 12
    `, [tenantId]);

    res.json({
      tenantId,
      tenantName: tenant.name,
      plan,
      isAliado,
      subscriptionStatus,
      active: tenant.active,
      daysRemaining,
      targetDate: targetDate ? targetDate.toISOString() : null,
      trialEndsAt: billingData.trialEndsAt,
      nextBillingDate: billingData.nextBillingDate,
      gracePeriodEndsAt: billingData.gracePeriodEndsAt,
      monthlyPrice,
      currency,
      autoBillingEnabled,
      card: cardInfo,
      paymentHistory: paymentsRes.rows
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al consultar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al obtener estado de suscripción' });
  }
});

/**
 * POST /api/tenant/subscription/create-card-session
 * Creates a Tilopay hosted session URL to securely link or update a card without raw PAN/CVV touching the server.
 */
router.post('/create-card-session', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Contexto de inquilino requerido.' });
      return;
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado.' });
      return;
    }

    const platformCfg = await getPlatformTilopayConfig();
    if (!platformCfg) {
      res.status(503).json({ error: 'La pasarela de suscripciones aún no está configurada por el administrador.' });
      return;
    }

    // Login to Tilopay to obtain JWT
    const baseUrl = 'https://app.tilopay.com/api/v1';
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: platformCfg.apiUser.trim(),
        password: platformCfg.apiPassword.trim()
      })
    });

    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginData.access_token) {
      throw new Error(loginData.message || 'No fue posible autenticar con la pasarela bancaria.');
    }

    const jwt = loginData.access_token;
    const cleanPhone = (tenant.whatsappNumber || '88888888').replace(/\D/g, '') || '88888888';
    const appUrl = (env.APP_URL || 'https://betico.tech').replace(/\/$/, '');
    const orderNumber = `SUB-CARD-${tenant.id}-${Date.now()}`;

    // Generate hosted payment / tokenization session with $0 (or ₡1 verification)
    const sessionPayload = {
      key: platformCfg.apiKey,
      amount: '0.00',
      currency: 'CRC',
      billToFirstName: tenant.name.split(' ')[0] || 'Comercio',
      billToLastName: tenant.name.split(' ').slice(1).join(' ') || 'Betico',
      billToEmail: 'billing@betico.cr',
      billToAddress: 'Costa Rica',
      billToAddress2: 'N/A',
      billToCity: 'San Jose',
      billToState: 'SJ',
      billToZip: '10101',
      billToCountry: 'CR',
      billToTelephone: cleanPhone,
      orderNumber,
      redirect: `${appUrl}/app?card_status=success`,
      callback: `${appUrl}/api/webhooks/tilopay`
    };

    const sessionRes = await fetch(`${baseUrl}/processPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionPayload)
    });

    const sessionData = await sessionRes.json().catch(() => ({}));
    if (!sessionRes.ok || !sessionData.url) {
      console.error('[TenantSubscription] Falló creación de pasarela para vincular tarjeta:', sessionData);
      throw new Error(sessionData.message || sessionData.error || 'No fue posible generar la sesión de tarjeta en Tilopay');
    }

    res.json({
      success: true,
      paymentUrl: sessionData.url,
      orderNumber
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al crear sesión de tarjeta:', error);
    res.status(500).json({ error: error.message || 'Error al iniciar vinculación de tarjeta' });
  }
});

/**
 * POST /api/tenant/subscription/cancel
 * Handles subscription cancellation. If plan is Aliado, informs that it's cost-free.
 * Otherwise pauses the account and stops automatic billing.
 */
router.post('/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.userId || null;
    if (!tenantId) {
      res.status(400).json({ error: 'Contexto de inquilino requerido.' });
      return;
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado.' });
      return;
    }

    // Check if Plan Aliado
    const isAliado = tenant.plan?.toLowerCase() === 'aliado';
    if (isAliado) {
      res.json({
        success: true,
        isAliado: true,
        message: 'Tu cuenta cuenta con el Plan Aliado Estratégico (₡0/mes). Este plan es gratuito de por vida y no genera ningún cobro recurrente.'
      });
      return;
    }

    const { reason } = req.body;

    // Update tenant subscription status to cancelled and deactivate auto billing
    await query(`
      UPDATE tenants
      SET subscription_status = 'cancelled',
          auto_billing_enabled = false,
          active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tenantId]);

    await logAuditEvent(tenantId, userId, 'subscription_cancelled', 'billing', tenantId, {
      previousStatus: tenant.subscriptionStatus,
      reason: reason || 'Cancelación voluntaria por el usuario'
    }, req.ip, req.headers['user-agent'] as string);

    // Notify Superadmin via WhatsApp
    try {
      const superadminPhone = '50688888888'; // Betico Support / Admin
      const alertMsg = `⚠️ *[Alerta de Cancelación de Suscripción - Betico]*\n\n` +
        `El comercio *${tenant.name}* (${tenant.slug}) ha cancelado su suscripción.\n` +
        `👤 *Usuario:* ${req.user?.userId}\n` +
        `📝 *Motivo:* ${reason || 'Sin motivo especificado'}\n` +
        `📅 *Fecha:* ${new Date().toLocaleString('es-CR')}`;

      await sendMessage('betico_soporte', superadminPhone, alertMsg);
    } catch (msgErr) {
      // Non-blocking notification
    }

    res.json({
      success: true,
      message: 'Tu suscripción ha sido cancelada exitosamente. Tu cuenta y asistentes han sido pausados.'
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al cancelar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al procesar cancelación' });
  }
});

/**
 * POST /api/tenant/subscription/reactivate
 * Allows reactivating a cancelled account.
 */
router.post('/reactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Contexto de inquilino requerido.' });
      return;
    }

    await query(`
      UPDATE tenants
      SET subscription_status = 'trial',
          trial_ends_at = CURRENT_TIMESTAMP + INTERVAL '15 days',
          next_billing_date = CURRENT_TIMESTAMP + INTERVAL '15 days',
          active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tenantId]);

    await logAuditEvent(tenantId, req.user?.userId || null, 'subscription_reactivated', 'billing', tenantId, {}, req.ip, req.headers['user-agent'] as string);

    res.json({
      success: true,
      message: 'Cuenta reactivada exitosamente. Se han restablecido tus 15 días.'
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al reactivar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al reactivar cuenta' });
  }
});

export default router;
