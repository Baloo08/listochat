import { Router, Request, Response } from 'express';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { getOrCreateSuperadminTenantId } from '../services/tilopay-subscription.service.js';
import {
  getTenantAlmendroConfig,
  getTenantAlmendroConfigRaw,
  saveTenantAlmendroConfig,
  getElectronicVouchers
} from '../db/tenant-almendro.repo.js';
import { AlmendroService } from '../services/almendro.service.js';
import { query } from '../db/pool.js';

const router = Router();

// Strict security: require SuperAdmin role for all endpoints
router.use(authenticateToken, requireSuperAdmin);

/**
 * GET /api/superadmin/almendro/config
 * Retrieves platform Almendro configuration for subscription billing.
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const config = await getTenantAlmendroConfig(superadminTenantId);
    res.json(config);
  } catch (error: any) {
    console.error('[SuperAdminAlmendro] Error al obtener config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/almendro/config
 * Saves platform Almendro configuration.
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const {
      isEnabled,
      environment,
      apiKey,
      defaultDocType,
      moduleToggles,
      taxIdType,
      taxIdNumber,
      legalName,
      commercialName,
      economicActivityCode,
      branchCode,
      posCode
    } = req.body;

    const updated = await saveTenantAlmendroConfig(superadminTenantId, {
      isEnabled: Boolean(isEnabled),
      environment: environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX',
      apiKey,
      defaultDocType: defaultDocType === '01' ? '01' : '04',
      moduleToggles: {
        storeEnabled: false,
        bookingsEnabled: false,
        courtsEnabled: false,
        restaurantEnabled: false,
        subscriptionsEnabled: Boolean(moduleToggles?.subscriptionsEnabled ?? true)
      },
      taxIdType,
      taxIdNumber,
      legalName,
      commercialName,
      economicActivityCode: economicActivityCode || '8314100000000', // Servicios de desarrollo/hosting de software
      branchCode,
      posCode
    });

    res.json({
      success: true,
      message: 'Configuración de facturación de plataforma guardada con éxito',
      config: updated
    });
  } catch (error: any) {
    console.error('[SuperAdminAlmendro] Error al guardar config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/almendro/test-connection
 * Tests SuperAdmin platform Almendro key.
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const { apiKey, environment } = req.body;

    let keyToTest = apiKey;
    let envToTest = environment || 'SANDBOX';

    if (!keyToTest || keyToTest.includes('••••')) {
      const stored = await getTenantAlmendroConfigRaw(superadminTenantId);
      if (!stored || !stored.apiKey) {
        res.status(400).json({ success: false, message: 'No hay ninguna llave configurada para la plataforma' });
        return;
      }
      keyToTest = stored.apiKey;
      envToTest = environment || stored.environment;
    }

    const result = await AlmendroService.testConnection(keyToTest, envToTest);
    res.json(result);
  } catch (error: any) {
    console.error('[SuperAdminAlmendro] Error en test connection:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/superadmin/almendro/vouchers
 * Lists all subscription invoices emitted by the platform.
 */
router.get('/vouchers', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const { limit, offset, status, docType } = req.query;

    const result = await getElectronicVouchers(superadminTenantId, {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      status: status as string,
      docType: docType as string
    });

    res.json(result);
  } catch (error: any) {
    console.error('[SuperAdminAlmendro] Error al listar comprobantes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/almendro/emit-subscription-invoice/:chargeId
 * Emits an electronic invoice for a specific subscription charge.
 */
router.post('/emit-subscription-invoice/:chargeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const superadminTenantId = await getOrCreateSuperadminTenantId();
    const { chargeId } = req.params;

    // Retrieve charge and tenant details
    const chargeRes = await query(`
      SELECT c.*, t.name as "tenantName", t.slug as "tenantSlug",
             t.settings_json as "settingsJson"
      FROM tenant_billing_charges c
      JOIN tenants t ON t.id = c.tenant_id
      WHERE c.id = $1
    `, [chargeId]);

    if (chargeRes.rows.length === 0) {
      res.status(404).json({ error: 'Cobro de suscripción no encontrado' });
      return;
    }

    const charge = chargeRes.rows[0];

    // Check if voucher already exists for this charge
    const existingVoucher = await query(`
      SELECT id, numeric_key as "numericKey", pdf_url as "pdfUrl"
      FROM electronic_vouchers
      WHERE subscription_charge_id = $1
    `, [chargeId]);

    if (existingVoucher.rows.length > 0) {
      res.json({
        success: true,
        alreadyEmitted: true,
        numericKey: existingVoucher.rows[0].numericKey,
        pdfUrl: existingVoucher.rows[0].pdfUrl,
        message: 'Este cobro ya cuenta con comprobante electrónico emitido.'
      });
      return;
    }

    const subtotal = Number(charge.amount) || 0;
    const description = `Suscripción ListoChat SaaS - ${charge.tenantName || charge.tenantSlug} (Periodo ${charge.period_start || 'Mes Actual'})`;

    const emitRes = await AlmendroService.emitVoucher(superadminTenantId, {
      docType: '04', // Tiquete electrónico por defecto para B2B simple o 01 si hay cédula jurídica
      subscriptionChargeId: charge.id,
      currency: charge.currency || 'CRC',
      items: [
        {
          cabysCode: '8314100000000', // Servicios de desarrollo de software y aplicaciones
          description,
          quantity: 1,
          unitPrice: subtotal,
          taxRateCode: '08' // 13% IVA
        }
      ]
    });

    if (!emitRes.success) {
      res.status(400).json({ error: emitRes.message });
      return;
    }

    res.json({
      success: true,
      numericKey: emitRes.numericKey,
      pdfUrl: emitRes.pdfUrl,
      message: 'Factura de suscripción emitida con éxito.'
    });
  } catch (error: any) {
    console.error('[SuperAdminAlmendro] Error emitiendo factura de suscripción:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
