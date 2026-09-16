import { Router, Request, Response } from 'express';
import jwtLib from 'jsonwebtoken';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getDefaultBillingCard, getBillingCards, deactivateBillingCard } from '../db/tenant-billing.repo.js';
import { getPlatformTilopayConfig } from '../services/tilopay-subscription.service.js';
import { logAuditEvent } from '../db/audit.repo.js';
import { sendMessage } from '../services/evolution.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * POST /api/tenant/subscription/exchange-return-token
 * Public endpoint to exchange a verified single-use session_token returned from Tilopay
 * into a full authenticated session JWT.
 * Solves cross-browser handoff (e.g. WhatsApp In-App Webview -> Safari/Chrome) and session loss.
 */
router.post('/exchange-return-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_token } = req.body || {};
    if (!session_token || typeof session_token !== 'string') {
      res.status(400).json({ error: 'Token de retorno requerido' });
      return;
    }

    let decoded: any;
    try {
      decoded = jwtLib.verify(session_token.trim(), env.JWT_SECRET) as any;
    } catch (err) {
      res.status(401).json({ error: 'El enlace de retorno ha expirado o es inválido' });
      return;
    }

    if (!decoded || decoded.action !== 'subscription_return' || !decoded.userId || !decoded.tenantId) {
      res.status(400).json({ error: 'Token de retorno con alcance inválido' });
      return;
    }

    // Tenant isolation verification: user must belong to decoded.tenantId and both must be active
    const userRes = await query(
      `SELECT id, tenant_id as "tenantId", name, email, role, active 
       FROM users 
       WHERE id = $1 AND tenant_id = $2 AND active = true`,
      [decoded.userId, decoded.tenantId]
    );

    if (!userRes.rows || userRes.rows.length === 0) {
      res.status(403).json({ error: 'Usuario no encontrado o cuenta inactiva' });
      return;
    }

    const user = userRes.rows[0];
    const tenant = await getTenantById(decoded.tenantId);
    if (!tenant || tenant.active === false) {
      res.status(403).json({ error: 'Negocio no encontrado o suspendido' });
      return;
    }

    // Generate fresh session token
    const token = generateToken(user.id, tenant.id, user.role);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al canjear token de retorno:', error);
    res.status(500).json({ error: 'Error del servidor al restaurar sesión' });
  }
});

// Require authenticated tenant admin/staff for all subsequent endpoints
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
             trial_consumed as "trialConsumed",
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
      trialConsumed: Boolean(billingData.trialConsumed),
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

    // Generate short-lived single-use handoff token for session restoration across webviews/browsers
    const sessionToken = jwtLib.sign(
      {
        userId: req.user?.userId,
        tenantId: tenant.id,
        action: 'subscription_return',
        orderNumber
      },
      env.JWT_SECRET,
      { expiresIn: '30m' }
    );

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
      redirect: `${appUrl}/subscription/return?session_token=${sessionToken}`,
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

    // Update tenant subscription status to cancelled, deactivate auto billing, and record trial consumption
    await query(`
      UPDATE tenants
      SET subscription_status = 'cancelled',
          auto_billing_enabled = false,
          active = false,
          trial_consumed = true,
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
 * Enforces anti-abuse rule (ISO/IEC 25010): If the 15-day trial was already consumed,
 * reactivation requires an active registered card and activates immediately without resetting trial.
 */
router.post('/reactivate', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'Contexto de inquilino requerido.' });
      return;
    }

    const tenantRes = await query(`
      SELECT plan, custom_monthly_price as "customMonthlyPrice", trial_consumed as "trialConsumed", active
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (!tenantRes.rows || tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio no encontrado.' });
      return;
    }

    const tenantRow = tenantRes.rows[0];
    const isAliado = tenantRow.plan?.toLowerCase() === 'aliado' || Number(tenantRow.customMonthlyPrice) === 0;

    if (isAliado) {
      await query(`
        UPDATE tenants
        SET subscription_status = 'active',
            active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenantId]);

      await logAuditEvent(tenantId, req.user?.userId || null, 'subscription_reactivated', 'billing', tenantId, { plan: 'aliado' }, req.ip, req.headers['user-agent'] as string);

      res.json({
        success: true,
        message: 'Cuenta reactivada exitosamente bajo el Plan Aliado Estratégico (₡0/mes).'
      });
      return;
    }

    const card = await getDefaultBillingCard(tenantId);
    const trialAlreadyConsumed = Boolean(tenantRow.trialConsumed);

    if (trialAlreadyConsumed) {
      if (!card) {
        res.status(402).json({
          error: 'El periodo de prueba gratuita ya ha sido utilizado para este comercio. Debe vincular una tarjeta de crédito o débito para reactivar el servicio.',
          requiresCard: true
        });
        return;
      }

      // Card is present: reactivate as active with auto billing enabled
      await query(`
        UPDATE tenants
        SET subscription_status = 'active',
            auto_billing_enabled = true,
            active = true,
            trial_consumed = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenantId]);

      await logAuditEvent(tenantId, req.user?.userId || null, 'subscription_reactivated', 'billing', tenantId, { cardId: card.id }, req.ip, req.headers['user-agent'] as string);

      res.json({
        success: true,
        message: 'Cuenta reactivada exitosamente. Se ha reanudado tu suscripción activa con tu tarjeta vinculada.'
      });
      return;
    }

    // First-time trial reactivation (trial not yet consumed)
    await query(`
      UPDATE tenants
      SET subscription_status = 'trial',
          trial_consumed = true,
          trial_ends_at = CURRENT_TIMESTAMP + INTERVAL '15 days',
          next_billing_date = CURRENT_TIMESTAMP + INTERVAL '15 days',
          active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tenantId]);

    await logAuditEvent(tenantId, req.user?.userId || null, 'subscription_reactivated', 'billing', tenantId, { trialConsumedNow: true }, req.ip, req.headers['user-agent'] as string);

    res.json({
      success: true,
      message: 'Cuenta reactivada exitosamente con tu periodo de prueba inicial (15 días).'
    });
  } catch (error: any) {
    console.error('[TenantSubscription] Error al reactivar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al reactivar cuenta' });
  }
});

export default router;
