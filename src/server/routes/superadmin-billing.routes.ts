import { Router, Request, Response } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import {
  getBillingCards,
  deactivateBillingCard,
  getBillingCharges
} from '../db/tenant-billing.repo.js';
import {
  TilopaySubscriptionService,
  getPlatformTilopayConfig,
  getOrCreateSuperadminTenantId
} from '../services/tilopay-subscription.service.js';
import {
  getTenantPaymentConfig,
  getTenantPaymentConfigRaw,
  saveTenantPaymentConfig
} from '../db/tenant-payment.repo.js';
import { TilopayTenantService } from '../services/tilopay-tenant.service.js';
import { env } from '../config/env.js';

const router = Router();

// Require SuperAdmin role on all billing endpoints
router.use(authenticateToken, requireSuperAdmin);

/**
 * GET /api/superadmin/billing/platform-status
 * Checks if platform has Tilopay credentials configured for tenant subscription charging.
 */
router.get('/platform-status', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getPlatformTilopayConfig();
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const raw = await getTenantPaymentConfigRaw(superadminTenantId);

    const isPlatformReady = Boolean(
      (config && config.apiKey && config.apiUser) ||
      (raw && raw.apiKey && raw.apiUser && raw.isEnabled)
    );

    res.json({
      configured: isPlatformReady,
      environment: config?.environment || raw?.environment || 'SANDBOX'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/superadmin/billing/platform-config
 * Retrieves full platform Tilopay configuration with masked secrets for SuperAdmin UI.
 */
router.get('/platform-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const config = await getTenantPaymentConfig(superadminTenantId);

    const hasEnvConfig = Boolean(
      process.env.TILOPAY_PLATFORM_KEY &&
      process.env.TILOPAY_PLATFORM_USER &&
      process.env.TILOPAY_PLATFORM_PASSWORD
    );

    const appUrl = (env.APP_URL || 'https://betico.tech').replace(/\/$/, '');
    const webhookUrl = `${appUrl}/api/webhooks/tilopay`;

    if (config && (config.apiKeyMasked || config.apiUser)) {
      res.json({
        isConfigured: Boolean(config.isConfigured),
        isEnabled: Boolean(config.isEnabled),
        apiKeyMasked: config.apiKeyMasked || '',
        apiUser: config.apiUser || '',
        apiPasswordMasked: config.apiPasswordMasked || '',
        environment: config.environment || 'PRODUCTION',
        captureMode: config.captureMode || 'IMMEDIATE',
        source: 'database',
        webhookUrl
      });
      return;
    }

    if (hasEnvConfig) {
      const maskedKey = process.env.TILOPAY_PLATFORM_KEY!.length > 8
        ? `${process.env.TILOPAY_PLATFORM_KEY!.slice(0, 4)}••••••••${process.env.TILOPAY_PLATFORM_KEY!.slice(-4)}`
        : '••••••••';
      res.json({
        isConfigured: true,
        isEnabled: true,
        apiKeyMasked: maskedKey,
        apiUser: process.env.TILOPAY_PLATFORM_USER || '',
        apiPasswordMasked: '••••••••',
        environment: process.env.TILOPAY_PLATFORM_ENV === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION',
        captureMode: 'IMMEDIATE',
        source: 'environment',
        webhookUrl
      });
      return;
    }

    res.json({
      isConfigured: false,
      isEnabled: true,
      apiKeyMasked: '',
      apiUser: '',
      apiPasswordMasked: '',
      environment: 'PRODUCTION',
      captureMode: 'IMMEDIATE',
      source: 'none',
      webhookUrl
    });
  } catch (error: any) {
    console.error('[SuperadminBilling] Error al obtener configuración de plataforma:', error);
    res.status(500).json({ error: error.message || 'Error al obtener configuración de plataforma' });
  }
});

/**
 * POST /api/superadmin/billing/test-platform-config
 * Diagnostic connection test against Tilopay using provided or stored credentials.
 */
router.post('/test-platform-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, apiUser, apiPassword, environment = 'PRODUCTION' } = req.body;

    let testKey = apiKey;
    let testPass = apiPassword;

    // Re-use existing decrypted credentials if masked placeholders were sent
    if ((!testKey || testKey.includes('••••')) || (!testPass || testPass.includes('••••'))) {
      const superadminTenantId = await getOrCreateSuperadminTenantId();
      const existing = await getTenantPaymentConfigRaw(superadminTenantId);
      if (existing) {
        testKey = (!testKey || testKey.includes('••••')) ? existing.apiKey : testKey;
        testPass = (!testPass || testPass.includes('••••')) ? existing.apiPassword : testPass;
      } else if (process.env.TILOPAY_PLATFORM_KEY) {
        testKey = (!testKey || testKey.includes('••••')) ? process.env.TILOPAY_PLATFORM_KEY : testKey;
        testPass = (!testPass || testPass.includes('••••')) ? process.env.TILOPAY_PLATFORM_PASSWORD : testPass;
      }
    }

    if (!testKey || !apiUser || !testPass) {
      res.status(400).json({ success: false, error: 'Todos los campos (API Key, Usuario y Contraseña) son requeridos para la prueba.' });
      return;
    }

    const testResult = await TilopayTenantService.verifyCredentials(
      testKey,
      apiUser,
      testPass,
      environment
    );

    if (testResult.success) {
      res.json({ success: true, message: testResult.message });
    } else {
      res.status(400).json({ success: false, error: testResult.message });
    }
  } catch (error: any) {
    console.error('[SuperadminBilling] Error en prueba de credenciales de plataforma:', error);
    res.status(500).json({ error: error.message || 'Error en prueba de conexión con Tilopay' });
  }
});

/**
 * POST /api/superadmin/billing/platform-config
 * Saves or updates platform Tilopay credentials encrypted with AES-256-GCM.
 */
router.post('/platform-config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, apiUser, apiPassword, environment = 'PRODUCTION', isEnabled = true } = req.body;
    const changedBy = req.user?.userId || 'superadmin';

    const superadminTenantId = await getOrCreateSuperadminTenantId();

    // Clear token cache
    TilopayTenantService.clearTokenCache(superadminTenantId);

    const updated = await saveTenantPaymentConfig(
      superadminTenantId,
      {
        apiKey,
        apiUser,
        apiPassword,
        environment,
        isEnabled: isEnabled !== false,
        captureMode: 'IMMEDIATE'
      },
      changedBy
    );

    res.json({
      success: true,
      message: 'Credenciales de Tilopay de la plataforma guardadas con éxito.',
      config: updated
    });
  } catch (error: any) {
    console.error('[SuperadminBilling] Error al guardar credenciales de plataforma:', error);
    res.status(500).json({ error: error.message || 'Error al guardar credenciales de plataforma' });
  }
});

/**
 * GET /api/superadmin/billing/cards/:tenantId
 * Lists registered cards for a tenant.
 */
router.get('/cards/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.params.tenantId);
    const cards = await getBillingCards(tenantId);
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/billing/cards/:tenantId/session
 * Generates a hosted Tilopay tokenization session URL for PCI-DSS compliance (SAQ A).
 */
router.post('/cards/:tenantId/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.params.tenantId);
    const tenant = await query(`SELECT id, name, slug, whatsapp_number FROM tenants WHERE id = $1`, [tenantId]);
    if (tenant.rows.length === 0) {
      res.status(404).json({ error: 'Tenant no encontrado.' });
      return;
    }

    const platformCfg = await getPlatformTilopayConfig();
    if (!platformCfg) {
      res.status(503).json({ error: 'Credenciales de Tilopay de la plataforma no configuradas.' });
      return;
    }

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
      throw new Error(loginData.message || 'Error de autenticación con Tilopay.');
    }

    const t = tenant.rows[0];
    const orderNumber = `SUB-CARD-${t.id}-${Date.now()}`;
    const cleanPhone = (t.whatsapp_number || '88888888').replace(/\D/g, '') || '88888888';
    const appUrl = (process.env.APP_URL || 'https://betico.tech').replace(/\/$/, '');

    const sessionRes = await fetch(`${baseUrl}/processPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: platformCfg.apiKey,
        amount: '0.00',
        currency: 'CRC',
        billToFirstName: t.name.split(' ')[0] || 'Cliente',
        billToLastName: t.name.split(' ').slice(1).join(' ') || 'Betico',
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
      })
    });

    const sessionData = await sessionRes.json().catch(() => ({}));
    if (!sessionRes.ok || !sessionData.url) {
      throw new Error(sessionData.message || sessionData.error || 'No fue posible crear la sesión de tarjeta en Tilopay');
    }

    res.json({
      success: true,
      paymentUrl: sessionData.url,
      orderNumber
    });
  } catch (error: any) {
    console.error('[SuperadminBilling] Error al generar sesión de tarjeta:', error);
    res.status(500).json({ error: error.message || 'Error al generar sesión' });
  }
});

/**
 * POST /api/superadmin/billing/cards/:tenantId
 * Registers a new payment card for a tenant (via tokenized card or fallback).
 */
router.post('/cards/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = String(req.params.tenantId);
    const { cardToken, last4, brand, cardNumber, expMonth, expYear, cvv, cardHolder } = req.body;

    if (cardNumber && expMonth && expYear && cvv) {
      const result = await TilopaySubscriptionService.registerTenantCard(tenantId, {
        cardNumber: String(cardNumber),
        expMonth: String(expMonth),
        expYear: String(expYear),
        cvv: String(cvv),
        cardHolder: String(cardHolder || 'Cliente')
      });

      res.json({
        success: true,
        message: `Tarjeta ${result.cardBrand} terminada en ${result.cardLast4} registrada exitosamente.`,
        cardLast4: result.cardLast4,
        cardBrand: result.cardBrand
      });
      return;
    }

    res.status(400).json({ error: 'Datos de tarjeta incompletos.' });
  } catch (error: any) {
    console.error('[SuperadminBilling] Error registrando tarjeta:', error);
    res.status(500).json({ error: error.message || 'Error al tokenizar tarjeta' });
  }
});

/**
 * DELETE /api/superadmin/billing/cards/:tenantId/:cardId
 * Deactivates a billing card.
 */
router.delete('/cards/:tenantId/:cardId', async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await deactivateBillingCard(String(req.params.cardId), String(req.params.tenantId));
    if (!success) {
      res.status(404).json({ error: 'Tarjeta no encontrada' });
      return;
    }
    res.json({ success: true, message: 'Tarjeta desactivada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/billing/charge/:tenantId
 * Executes a manual charge of the tenant monthly subscription via Tilopay.
 */
router.post('/charge/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TilopaySubscriptionService.chargeTenantSubscription(String(req.params.tenantId), true);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    console.error('[SuperadminBilling] Error al cobrar suscripción:', error);
    res.status(500).json({ error: error.message || 'Error al procesar cobro' });
  }
});

/**
 * GET /api/superadmin/billing/charges/:tenantId
 * Retrieves recent charge history for a tenant.
 */
router.get('/charges/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const charges = await getBillingCharges(String(req.params.tenantId));
    res.json(charges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/billing/toggle-auto-billing/:tenantId
 * Enables or disables automatic recurring billing for a tenant.
 */
router.post('/toggle-auto-billing/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;
    await query(`
      UPDATE tenants
      SET auto_billing_enabled = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [Boolean(enabled), String(req.params.tenantId)]);

    res.json({
      success: true,
      autoBillingEnabled: Boolean(enabled),
      message: enabled ? 'Cobro automático activado' : 'Cobro automático desactivado'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/billing/run-auto-billing
 * Triggers the automatic recurring billing batch immediately.
 */
router.post('/run-auto-billing', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await TilopaySubscriptionService.processRecurringBillingBatch();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;