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
  getPlatformTilopayConfig
} from '../services/tilopay-subscription.service.js';

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
    res.json({
      configured: Boolean(config && config.apiKey && config.apiUser),
      environment: config?.environment || 'SANDBOX'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/superadmin/billing/cards/:tenantId
 * Lists registered cards for a tenant.
 */
router.get('/cards/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await getBillingCards(req.params.tenantId);
    res.json(cards);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/superadmin/billing/cards/:tenantId
 * Registers and tokenizes a new payment card for a tenant.
 */
router.post('/cards/:tenantId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId } = req.params;
    const { cardNumber, expMonth, expYear, cvv, cardHolder } = req.body;

    if (!cardNumber || !expMonth || !expYear || !cvv || !cardHolder) {
      res.status(400).json({ error: 'Todos los datos de la tarjeta son obligatorios.' });
      return;
    }

    const result = await TilopaySubscriptionService.registerTenantCard(tenantId, {
      cardNumber,
      expMonth,
      expYear,
      cvv,
      cardHolder
    });

    res.json({
      success: true,
      message: `Tarjeta ${result.cardBrand} terminada en ${result.cardLast4} registrada exitosamente.`,
      cardLast4: result.cardLast4,
      cardBrand: result.cardBrand
    });
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
    const success = await deactivateBillingCard(req.params.cardId, req.params.tenantId);
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
    const result = await TilopaySubscriptionService.chargeTenantSubscription(req.params.tenantId, true);
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
    const charges = await getBillingCharges(req.params.tenantId);
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
    `, [Boolean(enabled), req.params.tenantId]);

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