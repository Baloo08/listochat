import { Router } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { encrypt, decrypt } from '../services/encryption.js';
import { createInstance, connectInstance, disconnectInstance, getInstanceStatus, sendMessage } from '../services/evolution.js';
import { notifyNewTenantEnrollment, notifyPaymentProofUploaded, notifyPaymentApproved } from '../services/superadmin-notify.service.js';
import { hashPassword } from '../db/users.repo.js';
import { getAllTenantsMonthlyUsage } from '../db/ai-usage.repo.js';
import { callAI, getMasterAIConfig } from '../services/ai-provider.js';

const router = Router();

// ========================================================
// 1. PUBLIC / TENANT ENDPOINT: SUBMIT PAYMENT PROOF
// ========================================================
router.post('/submit-payment-proof', authenticateToken, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { reference, proofUrl, amount, notes } = req.body;

    if (!tenantId) {
      res.status(400).json({ error: 'Tenant no identificado' });
      return;
    }

    const tenantRes = await query(`SELECT id, name, slug, billing_currency as currency FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Tenant no encontrado' });
      return;
    }
    const tenant = tenantRes.rows[0];

    await query(`
      UPDATE tenants
      SET last_payment_proof = $1,
          last_payment_ref = $2,
          last_payment_amount = $3,
          payment_notes = $4,
          subscription_status = CASE WHEN subscription_status = 'suspended' THEN 'grace_period' ELSE subscription_status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [proofUrl || null, reference || null, amount ? Number(amount) : null, notes || null, tenantId]);

    // Notify Superadmin
    await notifyPaymentProofUploaded({
      tenantName: tenant.name,
      slug: tenant.slug,
      amount: Number(amount || 0),
      currency: tenant.currency || 'CRC',
      reference: reference || '',
      notes: notes || ''
    });

    res.json({ success: true, message: 'Comprobante recibido con éxito. En breve será revisado y aprobado.' });
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    res.status(500).json({ error: 'Error al enviar comprobante de pago' });
  }
});

// ========================================================
// 2. SUPERADMIN PROTECTED ROUTES
// ========================================================
router.use(authenticateToken);
router.use(requireSuperAdmin);

// PLATFORM SETTINGS (AI MASTER KEY & NOTIFY PHONE)
// PLATFORM SETTINGS (LOCALAI MARCA BLANCA, AI MASTER KEY, NOTIFY PHONE & DEPLOYMENTS)
router.get('/settings', async (req, res) => {
  try {
    const result = await query(`SELECT key, value, value_encrypted FROM platform_settings`);
    const settings: Record<string, string> = {};
    for (const r of result.rows) {
      if (r.value_encrypted) {
        settings[r.key] = decrypt(r.value_encrypted);
      } else {
        settings[r.key] = r.value || '';
      }
    }

    res.json({
      masterAiProvider: settings.master_ai_provider || 'gemini',
      masterAiKey: settings.master_ai_key ? '••••••••' + settings.master_ai_key.slice(-4) : '',
      masterAiModel: settings.master_ai_model || 'gemini-2.5-flash',
      localaiUrl: settings.localai_url || 'http://localhost:8080/v1',
      localaiModel: settings.localai_model || 'llama-3.1-8b-instruct',
      localaiApiKey: settings.localai_api_key ? '••••••••' + settings.localai_api_key.slice(-4) : '',
      localaiEnabled: settings.localai_enabled !== 'false',
      quotaStarterTokens: parseInt(settings.quota_starter_tokens || '25000', 10),
      quotaProTokens: parseInt(settings.quota_pro_tokens || '100000', 10),
      quotaBusinessTokens: parseInt(settings.quota_business_tokens || '300000', 10),
      superadminNotifyPhone: settings.superadmin_notify_phone || '',
      deployWebhookApp: settings.deploy_webhook_app || 'http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b',
      deployWebhookLocalai: settings.deploy_webhook_localai || 'http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e'
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ error: 'Error al obtener ajustes de plataforma' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const {
      masterAiProvider,
      masterAiKey,
      masterAiModel,
      localaiUrl,
      localaiModel,
      localaiApiKey,
      localaiEnabled,
      quotaStarterTokens,
      quotaProTokens,
      quotaBusinessTokens,
      superadminNotifyPhone,
      deployWebhookApp,
      deployWebhookLocalai
    } = req.body;

    const upsertSetting = async (key: string, value: string) => {
      await query(`
        INSERT INTO platform_settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [key, value]);
    };

    if (masterAiProvider) await upsertSetting('master_ai_provider', masterAiProvider);
    if (masterAiModel) await upsertSetting('master_ai_model', masterAiModel);
    if (localaiUrl) await upsertSetting('localai_url', localaiUrl.trim());
    if (localaiModel) await upsertSetting('localai_model', localaiModel.trim());
    if (localaiEnabled !== undefined) await upsertSetting('localai_enabled', String(localaiEnabled));
    if (quotaStarterTokens !== undefined) await upsertSetting('quota_starter_tokens', String(quotaStarterTokens));
    if (quotaProTokens !== undefined) await upsertSetting('quota_pro_tokens', String(quotaProTokens));
    if (quotaBusinessTokens !== undefined) await upsertSetting('quota_business_tokens', String(quotaBusinessTokens));
    if (deployWebhookApp) await upsertSetting('deploy_webhook_app', deployWebhookApp.trim());
    if (deployWebhookLocalai) await upsertSetting('deploy_webhook_localai', deployWebhookLocalai.trim());

    if (masterAiKey && !masterAiKey.startsWith('••••••••')) {
      const encrypted = encrypt(masterAiKey.trim());
      await query(`
        INSERT INTO platform_settings (key, value_encrypted) VALUES ('master_ai_key', $1)
        ON CONFLICT (key) DO UPDATE SET value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP
      `, [encrypted]);
    }

    if (localaiApiKey && !localaiApiKey.startsWith('••••••••')) {
      const encrypted = encrypt(localaiApiKey.trim());
      await query(`
        INSERT INTO platform_settings (key, value_encrypted) VALUES ('localai_api_key', $1)
        ON CONFLICT (key) DO UPDATE SET value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP
      `, [encrypted]);
    }

    if (superadminNotifyPhone !== undefined) {
      const cleanPhone = (superadminNotifyPhone || '').replace(/\D/g, '');
      await upsertSetting('superadmin_notify_phone', cleanPhone);
    }

    res.json({ success: true, message: 'Ajustes de plataforma guardados con éxito' });
  } catch (error: any) {
    console.error('Error saving platform settings:', error);
    res.status(500).json({ error: error.message || 'Error al guardar ajustes de plataforma' });
  }
});

// AI USAGE MONITORING FOR ALL TENANTS
router.get('/ai-usage', async (req, res) => {
  try {
    const monthYear = (req.query.monthYear as string) || undefined;
    const usage = await getAllTenantsMonthlyUsage(monthYear);
    res.json({ success: true, usage });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    res.status(500).json({ error: 'Error al obtener consumo de IA' });
  }
});

// REMOTE AUTO-DEPLOY TRIGGER
router.post('/deploy/:target', async (req, res) => {
  try {
    const target = req.params.target; // 'app' or 'localai'
    const settingKey = target === 'localai' ? 'deploy_webhook_localai' : 'deploy_webhook_app';

    const dbRes = await query(`SELECT value FROM platform_settings WHERE key = $1`, [settingKey]);
    let deployUrl = dbRes.rows[0]?.value;

    if (!deployUrl) {
      deployUrl = target === 'localai'
        ? 'http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e'
        : 'http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b';
    }

    console.log(`[Deploy] Triggering webhook for ${target} at ${deployUrl}...`);
    try {
      const resp = await fetch(deployUrl, { method: 'POST' });
      const respText = await resp.text();
      res.json({ success: true, message: `Despliegue de ${target === 'localai' ? 'Local AI' : 'App Betico'} iniciado con éxito.`, detail: respText });
    } catch (fetchErr: any) {
      // If POST failed, try GET as fallback
      try {
        const resp2 = await fetch(deployUrl, { method: 'GET' });
        const respText2 = await resp2.text();
        res.json({ success: true, message: `Despliegue de ${target === 'localai' ? 'Local AI' : 'App Betico'} iniciado (GET).`, detail: respText2 });
      } catch (getErr: any) {
        res.status(502).json({ error: `No se pudo contactar el webhook de despliegue: ${getErr.message}` });
      }
    }
  } catch (error: any) {
    console.error('Error triggering deploy:', error);
    res.status(500).json({ error: 'Error al ejecutar webhook de despliegue' });
  }
});

// SUPERADMIN WHATSAPP INSTANCES (VENTAS & SOPORTE)
router.get('/instances', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, instance_type as "instanceType", instance_name as "instanceName", 
             phone_number as "phoneNumber", status, qr_code as "qrCode", updated_at as "updatedAt"
      FROM superadmin_instances
      ORDER BY instance_type ASC
    `);

    const instances = result.rows;
    const types = ['ventas', 'soporte'];
    const formatted = types.map(t => {
      const found = instances.find(i => i.instanceType === t);
      return found || {
        instanceType: t,
        instanceName: `betico_${t}`,
        status: 'disconnected',
        qrCode: null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching superadmin instances:', error);
    res.status(500).json({ error: 'Error al consultar instancias' });
  }
});

router.post('/instances/connect', async (req, res) => {
  try {
    const { instanceType } = req.body;
    if (!instanceType) {
      res.status(400).json({ error: 'Tipo de instancia requerido' });
      return;
    }

    const instanceName = `betico_${instanceType}`;
    
    // Create if not existing in Evolution
    await createInstance(instanceName);
    const conn = await connectInstance(instanceName);

    let qr = conn.data?.base64 || conn.data?.qrcode?.base64 || conn.data?.code || null;
    let status = conn.data?.state === 'open' ? 'connected' : qr ? 'qr_ready' : 'disconnected';

    await query(`
      INSERT INTO superadmin_instances (instance_type, instance_name, status, qr_code)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (instance_type) DO UPDATE SET
        status = EXCLUDED.status,
        qr_code = EXCLUDED.qr_code,
        updated_at = CURRENT_TIMESTAMP
    `, [instanceType, instanceName, status, qr]);

    res.json({
      success: true,
      instanceName,
      status,
      qrCode: qr
    });
  } catch (error) {
    console.error('Error connecting instance:', error);
    res.status(500).json({ error: 'Error al conectar WhatsApp de Superadmin' });
  }
});

router.post('/instances/disconnect', async (req, res) => {
  try {
    const { instanceType } = req.body;
    const instanceName = `betico_${instanceType}`;
    await disconnectInstance(instanceName);
    
    await query(`
      UPDATE superadmin_instances SET status = 'disconnected', qr_code = null WHERE instance_type = $1
    `, [instanceType]);

    res.json({ success: true, message: 'Instancia desconectada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al desconectar' });
  }
});

// MANUAL TENANT ENROLLMENT WITH WHATSAPP DISPATCH & SUPERADMIN ALERT
router.post('/tenants/create', async (req, res) => {
  try {
    const {
      name, slug, contactName, email, phone, plan,
      customMonthlyPrice, billingCurrency, isTrial, trialDays = 15
    } = req.body;

    if (!name || !email || !slug) {
      res.status(400).json({ error: 'Nombre, slug y correo son obligatorios' });
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const price = Number(customMonthlyPrice || 29);
    const currency = billingCurrency || 'CRC';
    const trialEnabled = isTrial !== false;

    // Check slug
    const existing = await query(`SELECT id FROM tenants WHERE slug = $1`, [cleanSlug]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'El identificador (slug) ya está en uso por otro comercio' });
      return;
    }

    // Generate secure temporary password
    const tempPassword = 'Btc' + Math.floor(100000 + Math.random() * 900000) + '!';
    const passwordHash = hashPassword(tempPassword);

    const trialEnd = new Date(Date.now() + (trialDays || 15) * 24 * 60 * 60 * 1000);

    // Create Tenant
    const tenantRes = await query(`
      INSERT INTO tenants (
        name, slug, plan, whatsapp_number, custom_monthly_price, billing_currency,
        subscription_status, trial_ends_at, next_billing_date, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING id, name, slug, plan, whatsapp_number as "whatsappNumber",
                custom_monthly_price as "customMonthlyPrice", billing_currency as "billingCurrency",
                subscription_status as "subscriptionStatus", trial_ends_at as "trialEndsAt",
                next_billing_date as "nextBillingDate", created_at as "createdAt"
    `, [
      name, cleanSlug, plan || 'starter', cleanPhone, price, currency,
      trialEnabled ? 'trial' : 'active',
      trialEnabled ? trialEnd : null,
      trialEnabled ? trialEnd : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ]);

    const tenant = tenantRes.rows[0];

    // Create Admin User
    await query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, 'admin', true)
    `, [tenant.id, contactName || name, email.toLowerCase().trim(), passwordHash]);

    // Send Welcome WhatsApp to Client
    if (cleanPhone && cleanPhone.length >= 8) {
      const trialMsg = trialEnabled ? `⏳ Cuentas con *15 días de prueba gratis* hasta el *${trialEnd.toLocaleDateString('es-CR')}*.` : '';
      const waText = `🎉 ¡Hola *${contactName || name}*! Te damos la bienvenida a *Betico.tech*.\n\n` +
        `Tu plataforma de ventas y WhatsApp con IA está lista:\n\n` +
        `🔗 *Enlace de Acceso:* https://betico.tech/login\n` +
        `👤 *Usuario:* ${email}\n` +
        `🔑 *Contraseña Temporal:* ${tempPassword}\n\n` +
        `${trialMsg}\n\n` +
        `🚀 ¡Muchos éxitos automatizando tu negocio!`;

      try {
        await sendMessage('betico_soporte', cleanPhone, waText);
      } catch (waErr) {
        console.error('Error sending welcome WhatsApp to new tenant:', waErr);
      }
    }

    // Notify Superadmin WhatsApp
    await notifyNewTenantEnrollment({
      tenantName: name,
      slug: cleanSlug,
      contactName: contactName || name,
      email,
      phone: cleanPhone,
      plan: plan || 'starter',
      monthlyPrice: price,
      currency,
      trialDays: trialDays || 15,
      isManual: true
    });

    res.status(201).json({
      success: true,
      tenant,
      tempPassword,
      message: 'Inquilino creado y credenciales despachadas por WhatsApp'
    });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: error.message || 'Error al crear inquilino' });
  }
});

// TENANT SUBSCRIPTION MANAGEMENT (APPROVE PAYMENT, EXTEND, SUSPEND)
router.post('/tenants/:id/approve-payment', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { days = 30 } = req.body;

    const tenantRes = await query(`SELECT id, name, slug, whatsapp_number FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    const tenant = tenantRes.rows[0];

    const nextBilling = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);

    await query(`
      UPDATE tenants
      SET subscription_status = 'active',
          next_billing_date = $1,
          grace_period_ends_at = null,
          last_payment_proof = null,
          active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [nextBilling, tenantId]);

    // Send confirmation to tenant
    if (tenant.whatsapp_number) {
      const cleanPhone = tenant.whatsapp_number.replace(/\D/g, '');
      const msg = `✅ *[Pago Aprobado - Betico]*\n\nHola *${tenant.name}*, hemos verificado tu comprobante de pago exitosamente.\n\nTu suscripción ha sido renovada por 30 días hasta el *${nextBilling.toLocaleDateString('es-CR')}*. ¡Gracias por confiar en Betico!`;
      try {
        await sendMessage('betico_soporte', cleanPhone, msg);
      } catch (e) {}
    }

    // Notify Superadmin
    await notifyPaymentApproved({
      tenantName: tenant.name,
      slug: tenant.slug,
      renewedUntil: nextBilling.toLocaleDateString('es-CR')
    });

    res.json({ success: true, message: 'Pago aprobado y suscripción renovada' });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Error al aprobar pago' });
  }
});

router.post('/tenants/:id/toggle-suspension', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenantRes = await query(`SELECT id, name, subscription_status, active FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const currentStatus = tenantRes.rows[0].subscription_status;
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const newActive = newStatus === 'active';

    await query(`
      UPDATE tenants 
      SET subscription_status = $1, active = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [newStatus, newActive, tenantId]);

    res.json({ success: true, status: newStatus, message: `Estado cambiado a ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

router.put('/tenants/:id/subscription', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { customMonthlyPrice, billingCurrency, subscriptionStatus, nextBillingDate } = req.body;

    await query(`
      UPDATE tenants
      SET custom_monthly_price = COALESCE($1, custom_monthly_price),
          billing_currency = COALESCE($2, billing_currency),
          subscription_status = COALESCE($3, subscription_status),
          next_billing_date = COALESCE($4, next_billing_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      customMonthlyPrice !== undefined ? Number(customMonthlyPrice) : null,
      billingCurrency || null,
      subscriptionStatus || null,
      nextBillingDate ? new Date(nextBillingDate) : null,
      tenantId
    ]);

    res.json({ success: true, message: 'Suscripción actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar suscripción' });
  }
});

// TEST AI INFERENCE PLAYGROUND (SUPERADMIN)
router.post('/test-ai', async (req, res) => {
  const startTime = Date.now();
  try {
    const { prompt, provider, model, baseUrl } = req.body;
    const master = await getMasterAIConfig();

    const testConfig = {
      provider: provider || master.provider,
      apiKey: master.apiKey,
      model: model || master.model,
      temperature: 0.7,
      baseUrl: baseUrl || master.baseUrl
    };

    const aiResult = await callAI(testConfig, prompt || 'Hola, ¿cómo funciona este modelo de IA?');
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      text: aiResult.text,
      tokensUsed: aiResult.tokensUsed,
      latencyMs,
      config: {
        provider: testConfig.provider,
        model: testConfig.model,
        baseUrl: testConfig.baseUrl
      }
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in Superadmin AI Playground:', error);
    res.status(500).json({ error: error.message || 'Error en prueba de IA', latencyMs });
  }
});

// CHECK LOCALAI ENGINE HEALTH / PING
router.get('/ai-engine-status', async (req, res) => {
  const startTime = Date.now();
  let localaiUrl = (req.query.url as string || '').trim();
  try {
    if (!localaiUrl) {
      const dbRes = await query("SELECT value FROM platform_settings WHERE key = 'localai_url'");
      localaiUrl = dbRes.rows[0]?.value || 'https://beticoia-localai.qvtdko.easypanel.host/v1';
    }

    // Clean URL
    const baseUrl = localaiUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
    const pingUrl = baseUrl + '/v1/models';

    // Ping /models endpoint with 4s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(pingUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data: any = await response.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
      res.json({
        online: true,
        url: localaiUrl,
        latencyMs,
        models,
        statusText: 'Operativo & Respondiendo'
      });
    } else {
      res.json({
        online: false,
        url: localaiUrl,
        latencyMs,
        statusText: 'Servidor respondió con código ' + response.status
      });
    }
  } catch (e: any) {
    const latencyMs = Date.now() - startTime;
    res.json({
      online: false,
      url: localaiUrl,
      latencyMs,
      statusText: 'Servidor no accesible (' + (e.message || 'Timeout') + ')'
    });
  }
});

// OVERRIDE CUSTOM AI QUOTA FOR A TENANT
router.put('/tenants/:id/ai-quota', async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { customTokensLimit } = req.body;

    if (customTokensLimit !== undefined) {
      await query(
        "UPDATE tenants SET settings_json = jsonb_set(COALESCE(settings_json, '{}'::jsonb), '{customAiQuotaTokens}', $1::jsonb) WHERE id = $2",
        [JSON.stringify(Number(customTokensLimit)), tenantId]
      );
    }

    res.json({ success: true, message: 'Cuota personalizada actualizada con éxito' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error actualizando cuota' });
  }
});

// GET AUDIT LOGS FOR SUPERADMIN
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.user_id as "userId", a.action, a.entity_type as "entityType", 
             a.entity_id as "entityId", a.ip_address as "ipAddress", a.user_agent as "userAgent",
             a.created_at as "createdAt", u.name as "userName", u.email as "userEmail", t.name as "tenantName"
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN tenants t ON t.id = a.tenant_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al obtener logs de auditoría' });
  }
});

// SYSTEM STATS & METRICS
router.get('/system-stats', async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const uptimeHours = (uptimeSec / 3600).toFixed(1);

    const tenantsCount = await query("SELECT count(*) as total, count(*) filter (where active) as active FROM tenants WHERE slug != 'superadmin'");
    const ordersCount = await query("SELECT count(*) as total FROM orders");
    const appointmentsCount = await query("SELECT count(*) as total FROM appointments");
    const chatsCount = await query("SELECT count(*) as total FROM chat_messages");

    res.json({
      success: true,
      metrics: {
        ramRss: (mem.rss / 1024 / 1024).toFixed(0) + ' MB',
        ramHeapUsed: (mem.heapUsed / 1024 / 1024).toFixed(0) + ' MB',
        uptime: uptimeHours + ' horas',
        nodeVersion: process.version,
        tenantsTotal: parseInt(tenantsCount.rows[0]?.total || '0', 10),
        tenantsActive: parseInt(tenantsCount.rows[0]?.active || '0', 10),
        ordersTotal: parseInt(ordersCount.rows[0]?.total || '0', 10),
        appointmentsTotal: parseInt(appointmentsCount.rows[0]?.total || '0', 10),
        chatsTotal: parseInt(chatsCount.rows[0]?.total || '0', 10)
      }
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error al obtener métricas del sistema' });
  }
});

export default router;
