import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getTenantPaymentConfig,
  saveTenantPaymentConfig,
  getPaymentAuditLogs
} from '../db/tenant-payment.repo.js';
import { TilopayTenantService } from '../services/tilopay-tenant.service.js';
import { query } from '../db/pool.js';
import { notifyPaymentProofUploaded } from '../services/superadmin-notify.service.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

// 1. Get current tenant Tilopay configuration (Sanitized, never exposes plaintext secrets)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getTenantPaymentConfig(req.tenantId!);
    res.json(config || {
      provider: 'TILOPAY',
      isEnabled: false,
      environment: 'SANDBOX',
      isConfigured: false,
      apiUser: '',
      apiKeyMasked: '',
      apiPasswordMasked: '',
      captureMode: 'IMMEDIATE'
    });
  } catch (error: any) {
    console.error('[TenantPaymentRoutes] Error al obtener configuración de pago:', error);
    res.status(500).json({ error: 'Error al obtener configuración de pagos' });
  }
});

// 2. Test Tilopay credentials before saving
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, apiUser, apiPassword, environment = 'SANDBOX' } = req.body;

    let testKey = apiKey;
    let testPass = apiPassword;

    // If user didn't modify existing masked password/key, test existing credentials
    if ((!testKey || testKey.includes('••••')) || (!testPass || testPass.includes('••••'))) {
      const existing = await import('../db/tenant-payment.repo.js').then(m => m.getTenantPaymentConfigRaw(req.tenantId!));
      if (existing) {
        testKey = (!testKey || testKey.includes('••••')) ? existing.apiKey : testKey;
        testPass = (!testPass || testPass.includes('••••')) ? existing.apiPassword : testPass;
      }
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
    console.error('[TenantPaymentRoutes] Error en prueba de credenciales:', error);
    res.status(500).json({ error: error.message || 'Error en prueba de conexión' });
  }
});

// 3. Save or update tenant Tilopay configuration
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey, apiUser, apiPassword, environment, isEnabled, captureMode } = req.body;
    const changedBy = (req as any).user?.userId || (req as any).user?.role || 'admin';

    // Clear cached tokens so new credentials take effect immediately
    TilopayTenantService.clearTokenCache(req.tenantId!);

    const updated = await saveTenantPaymentConfig(
      req.tenantId!,
      {
        apiKey,
        apiUser,
        apiPassword,
        environment,
        isEnabled,
        captureMode
      },
      changedBy
    );

    res.json({
      success: true,
      message: 'Configuración de pasarela Tilopay actualizada con éxito',
      config: updated
    });
  } catch (error: any) {
    console.error('[TenantPaymentRoutes] Error al guardar configuración de pago:', error);
    res.status(500).json({ error: error.message || 'Error al guardar configuración de pagos' });
  }
});

// 4. Get audit logs for payment credentials modifications
router.get('/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await getPaymentAuditLogs(req.tenantId!, 20);
    res.json(logs);
  } catch (error: any) {
    console.error('[TenantPaymentRoutes] Error al obtener auditoría de pagos:', error);
    res.status(500).json({ error: 'Error al obtener registros de auditoría' });
  }
});

// 5. Tenant Submit Subscription Payment Proof
router.post('/submit-payment-proof', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const { reference, proofUrl, amount, notes } = req.body;

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
    console.error('[TenantPaymentRoutes] Error submitting payment proof:', error);
    res.status(500).json({ error: 'Error al enviar comprobante de pago' });
  }
});

export default router;
