import { Router } from 'express';
import { query } from '../db.js';
import { requireSuperAdmin, AuthenticatedRequest, generateToken, logAdminAction } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://betico.tech';
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://evolution:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';

// 1. Instant multi-criteria tenant search
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json([]);
      return;
    }

    const searchTerm = `%${q.toLowerCase()}%`;
    const result = await query(
      `SELECT t.id, t.name, t.slug, t.whatsapp_number as "whatsappNumber",
              t.plan, t.active, t.trial_ends_at as "trialEndsAt",
              t.evolution_instance as "evolutionInstance",
              COALESCE(u.email, 'Sin registrar') as "adminEmail",
              COALESCE(u.name, 'Sin nombre') as "adminName"
       FROM tenants t
       LEFT JOIN LATERAL (
         SELECT id, email, name FROM users 
         WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin') 
         ORDER BY created_at ASC LIMIT 1
       ) u ON true
       WHERE LOWER(t.name) LIKE $1 
          OR LOWER(t.slug) LIKE $1 
          OR LOWER(COALESCE(t.whatsapp_number, '')) LIKE $1
          OR LOWER(COALESCE(u.email, '')) LIKE $1
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('[Monitoring Search] Error:', error);
    res.status(500).json({ error: 'Error al buscar clientes en el centro de monitoreo' });
  }
});

// 2. 360° Tenant Dossier
router.get('/tenant/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // A. Tenant general information
    const tenantRes = await query(
      `SELECT t.*, 
              COALESCE(u.email, 'Sin registrar') as "adminEmail",
              COALESCE(u.name, 'Administrador') as "adminName",
              u.id as "adminId"
       FROM tenants t
       LEFT JOIN LATERAL (
         SELECT id, email, name FROM users 
         WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin') 
         ORDER BY created_at ASC LIMIT 1
       ) u ON true
       WHERE t.id = $1`,
      [id]
    );

    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio o inquilino no encontrado' });
      return;
    }

    const tenant = tenantRes.rows[0];

    // B. Real WhatsApp message consumption metrics
    const msgStatsRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as "todayMsgs",
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as "weekMsgs",
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as "monthMsgs"
       FROM chat_messages
       WHERE tenant_id = $1`,
      [id]
    );
    const msgStats = msgStatsRes.rows[0] || { todayMsgs: 0, weekMsgs: 0, monthMsgs: 0 };

    // C. Message Queue metrics (pending, processing, failed, done)
    const queueStatsRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'processing') as processing,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'done') as done
       FROM message_queue
       WHERE tenant_id = $1`,
      [id]
    );
    const queueStats = queueStatsRes.rows[0] || { pending: 0, processing: 0, failed: 0, done: 0 };

    // D. Business catalog & volume metrics
    const [productsRes, bookingsRes, courtBookingsRes, ordersRes] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM products WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(*) as count FROM court_bookings WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(
        `SELECT COUNT(*) as count, 
                COALESCE(SUM(CASE WHEN currency = 'CRC' OR currency IS NULL THEN total ELSE 0 END), 0) as "gmvCrc",
                COALESCE(SUM(CASE WHEN currency = 'USD' THEN total ELSE 0 END), 0) as "gmvUsd"
         FROM orders WHERE tenant_id = $1`,
        [id]
      ).catch(() => ({ rows: [{ count: 0, gmvCrc: 0, gmvUsd: 0 }] }))
    ]);

    // E. Evolution WhatsApp Instance Live Health Check
    let whatsappStatus = {
      connected: false,
      state: 'desconocido',
      instanceName: tenant.evolution_instance || `tenant_${tenant.slug}`,
      phone: tenant.whatsapp_number || 'No asignado',
      details: null as any
    };

    if (tenant.evolution_instance) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const evoRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${tenant.evolution_instance}`, {
          headers: { apikey: EVOLUTION_API_KEY },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (evoRes.ok) {
          const evoData = await evoRes.json() as any;
          const state = evoData?.instance?.state || evoData?.state || 'open';
          whatsappStatus.connected = state === 'open' || state === 'connected';
          whatsappStatus.state = state;
          whatsappStatus.details = evoData;
        }
      } catch (err: any) {
        whatsappStatus.state = 'error_conexion';
      }
    }

    // F. Store & Invoicing Settings Health Check
    const [storeRes, almendroRes] = await Promise.all([
      query(`SELECT * FROM store_settings WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(`SELECT * FROM tenant_almendro_configs WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] }))
    ]);

    const storeSettings = storeRes.rows[0] || {};
    const almendroConfig = almendroRes.rows[0] || {};

    const gatewayHealth = {
      tilopayConfigured: Boolean(storeSettings.tilopay_api_key || storeSettings.tilopay_merchant_id),
      sinpeConfigured: Boolean(storeSettings.sinpe_phone),
      storeEnabled: Boolean(storeSettings.store_enabled)
    };

    const invoicingHealth = {
      configured: Boolean(almendroConfig.active && almendroConfig.company_id),
      environment: almendroConfig.is_sandbox ? 'staging' : 'produccion'
    };

    // G. Live Error Diagnostics: recent failed messages in queue
    const failedMessagesRes = await query(
      `SELECT id, remote_jid as "remoteJid", push_name as "pushName", clean_phone as "cleanPhone",
              user_message as "userMessage", error_message as "errorMessage", created_at as "createdAt",
              processed_at as "processedAt"
       FROM message_queue
       WHERE tenant_id = $1 AND status = 'failed'
       ORDER BY created_at DESC
       LIMIT 15`,
      [id]
    );

    // H. Recent audit events for this tenant
    const auditRes = await query(
      `SELECT a.id, a.action, a.entity_type as "entityType", a.details, a.created_at as "createdAt",
              u.name as "userName", u.email as "userEmail"
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC
       LIMIT 15`,
      [id]
    );

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        active: tenant.active,
        customMonthlyPrice: tenant.custom_monthly_price || 0,
        billingCurrency: tenant.billing_currency || 'CRC',
        trialEndsAt: tenant.trial_ends_at,
        gracePeriodEndsAt: tenant.grace_period_ends_at,
        whatsappNumber: tenant.whatsapp_number,
        evolutionInstance: tenant.evolution_instance,
        aiProvider: tenant.ai_provider || 'gemini',
        aiModel: tenant.ai_model || 'gemini-2.5-flash',
        createdAt: tenant.created_at,
        adminName: tenant.adminName,
        adminEmail: tenant.adminEmail,
        adminId: tenant.adminId,
      },
      metrics: {
        messages: {
          today: parseInt(msgStats.todayMsgs || '0', 10),
          week: parseInt(msgStats.weekMsgs || '0', 10),
          month: parseInt(msgStats.monthMsgs || '0', 10)
        },
        queue: {
          pending: parseInt(queueStats.pending || '0', 10),
          processing: parseInt(queueStats.processing || '0', 10),
          failed: parseInt(queueStats.failed || '0', 10),
          done: parseInt(queueStats.done || '0', 10)
        },
        catalog: {
          products: parseInt(productsRes.rows[0]?.count || '0', 10),
          bookings: parseInt(bookingsRes.rows[0]?.count || '0', 10),
          courtBookings: parseInt(courtBookingsRes.rows[0]?.count || '0', 10),
          orders: parseInt(ordersRes.rows[0]?.count || '0', 10),
          gmvCrc: parseFloat(ordersRes.rows[0]?.gmvCrc || '0'),
          gmvUsd: parseFloat(ordersRes.rows[0]?.gmvUsd || '0')
        }
      },
      health: {
        whatsapp: whatsappStatus,
        gateway: gatewayHealth,
        invoicing: invoicingHealth
      },
      diagnostics: {
        failedMessages: failedMessagesRes.rows,
        auditLogs: auditRes.rows
      }
    });
  } catch (error: any) {
    console.error('[Monitoring Dossier] Error:', error);
    res.status(500).json({ error: 'Error al obtener el expediente 360° del cliente' });
  }
});

// 3. Action: Retry failed messages in message queue
router.post('/tenant/:id/retry-failed-queue', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    const updateRes = await query(
      `UPDATE message_queue
       SET status = 'pending', error_message = NULL, processed_at = NULL
       WHERE tenant_id = $1 AND status = 'failed'
       RETURNING id`,
      [id]
    );

    await logAdminAction(req.user!.userId, 'retry_failed_queue', 'tenant', id, { recoveredCount: updateRes.rowCount }, req);

    res.json({
      success: true,
      recoveredCount: updateRes.rowCount,
      message: `${updateRes.rowCount} mensaje(s) reactivado(s) en la cola con éxito`
    });
  } catch (error: any) {
    console.error('[Action Retry Queue] Error:', error);
    res.status(500).json({ error: 'Error al reintentar mensajes en cola' });
  }
});

// 4. Action: Extend trial / grace period
router.post('/tenant/:id/extend-trial', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const days = parseInt(req.body.days || '15', 10);

  try {
    const updateRes = await query(
      `UPDATE tenants
       SET trial_ends_at = CURRENT_TIMESTAMP + (INTERVAL '1 day' * $1),
           active = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, trial_ends_at as "trialEndsAt", active`,
      [days, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    await logAdminAction(req.user!.userId, 'extend_trial', 'tenant', id, { daysAdded: days, newTrialEndsAt: updateRes.rows[0].trialEndsAt }, req);

    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Período extendido por ${days} días adicionales y cliente reactivado`
    });
  } catch (error: any) {
    console.error('[Action Extend Trial] Error:', error);
    res.status(500).json({ error: 'Error al extender el período de prueba' });
  }
});

// 5. Action: Change tenant plan
router.post('/tenant/:id/change-plan', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { plan, customMonthlyPrice } = req.body;

  if (!plan) {
    res.status(400).json({ error: 'El plan es obligatorio' });
    return;
  }

  try {
    const updateRes = await query(
      `UPDATE tenants
       SET plan = $1,
           custom_monthly_price = COALESCE($2, custom_monthly_price),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, plan, custom_monthly_price as "customMonthlyPrice"`,
      [plan, customMonthlyPrice !== undefined ? Number(customMonthlyPrice) : null, id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    await logAdminAction(req.user!.userId, 'change_tenant_plan', 'tenant', id, { newPlan: plan, customMonthlyPrice }, req);

    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Plan actualizado exitosamente a ${plan}`
    });
  } catch (error: any) {
    console.error('[Action Change Plan] Error:', error);
    res.status(500).json({ error: 'Error al cambiar plan del cliente' });
  }
});

// 6. Action: Toggle tenant active/inactive
router.post('/tenant/:id/toggle-status', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    const updateRes = await query(
      `UPDATE tenants
       SET active = NOT active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, active`,
      [id]
    );

    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    const state = updateRes.rows[0].active ? 'activado' : 'desactivado';
    await logAdminAction(req.user!.userId, 'toggle_tenant_status', 'tenant', id, { active: updateRes.rows[0].active }, req);

    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Negocio ${state} con éxito`
    });
  } catch (error: any) {
    console.error('[Action Toggle Status] Error:', error);
    res.status(500).json({ error: 'Error al cambiar estado del cliente' });
  }
});

// 7. Action: 1-Click Secure Impersonation URL
router.post('/tenant/:id/impersonate', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    const tenantRes = await query(
      `SELECT id, name, slug, plan FROM tenants WHERE id = $1`,
      [id]
    );

    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const tenant = tenantRes.rows[0];

    // Issue impersonation JWT valid for tenant portal
    const impersonationToken = generateToken(req.user!.userId, tenant.id, 'admin');

    await logAdminAction(req.user!.userId, 'impersonate_tenant', 'tenant', id, { tenantName: tenant.name }, req);

    // Build seamless 1-click launch URL
    const launchUrl = `${MAIN_APP_URL}/?impersonateToken=${encodeURIComponent(impersonationToken)}`;

    res.json({
      token: impersonationToken,
      launchUrl,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
  } catch (error: any) {
    console.error('[Monitoring Impersonate] Error:', error);
    res.status(500).json({ error: 'Error al generar acceso directo al portal del cliente' });
  }
});

export default router;
