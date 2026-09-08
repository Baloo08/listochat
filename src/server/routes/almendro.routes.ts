import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getTenantAlmendroConfig,
  getTenantAlmendroConfigRaw,
  saveTenantAlmendroConfig,
  getElectronicVouchers
} from '../db/tenant-almendro.repo.js';
import { AlmendroService } from '../services/almendro.service.js';

const router = Router();

// Apply JWT authentication and tenant context to all routes
router.use(authenticateToken, tenantContext);

/**
 * GET /api/almendro/config
 * Retrieves masked Almendro electronic invoicing config for the tenant.
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      res.status(400).json({ error: 'tenantId no disponible en el contexto' });
      return;
    }

    const config = await getTenantAlmendroConfig(tenantId);
    res.json(config);
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error al consultar configuración:', error);
    res.status(500).json({ error: error.message || 'Error al obtener configuración de facturación' });
  }
});

/**
 * POST /api/almendro/config
 * Saves or updates Almendro config (API Key, environment, module toggles).
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const userRole = (req as any).user?.role;

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      res.status(403).json({ error: 'Solo los administradores pueden modificar la configuración de facturación' });
      return;
    }

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

    const updated = await saveTenantAlmendroConfig(tenantId, {
      isEnabled: Boolean(isEnabled),
      environment: environment === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX',
      apiKey,
      defaultDocType: defaultDocType === '01' ? '01' : '04',
      moduleToggles,
      taxIdType,
      taxIdNumber,
      legalName,
      commercialName,
      economicActivityCode,
      branchCode,
      posCode
    });

    res.json({
      success: true,
      message: 'Configuración de facturación electrónica guardada con éxito',
      config: updated
    });
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error al guardar configuración:', error);
    res.status(500).json({ error: error.message || 'Error al guardar configuración de facturación' });
  }
});

/**
 * POST /api/almendro/test-connection
 * Tests API connection against Almendro.
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { apiKey, environment } = req.body;

    let keyToTest = apiKey;
    let envToTest = environment || 'SANDBOX';

    // If apiKey not provided or masked, use stored raw key
    if (!keyToTest || keyToTest.includes('••••')) {
      const stored = await getTenantAlmendroConfigRaw(tenantId);
      if (!stored || !stored.apiKey) {
        res.status(400).json({ success: false, message: 'No hay ninguna llave de API configurada para probar' });
        return;
      }
      keyToTest = stored.apiKey;
      envToTest = environment || stored.environment;
    }

    const result = await AlmendroService.testConnection(keyToTest, envToTest);
    res.json(result);
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error al probar conexión:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/almendro/taxpayer/:idNumber
 * Looks up taxpayer data in TSE & Hacienda via Almendro.
 */
router.get('/taxpayer/:idNumber', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { idNumber } = req.params;

    const stored = await getTenantAlmendroConfigRaw(tenantId);
    if (!stored || !stored.apiKey) {
      res.status(400).json({ error: 'Debes configurar tu API Key de Almendro para consultar contribuyentes' });
      return;
    }

    const result = await AlmendroService.lookupTaxpayer(stored.apiKey, stored.environment, idNumber);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error al consultar contribuyente:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/almendro/vouchers
 * Lists issued electronic vouchers for the tenant.
 */
router.get('/vouchers', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { limit, offset, status, docType } = req.query;

    const result = await getElectronicVouchers(tenantId, {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      status: status as string,
      docType: docType as string
    });

    res.json(result);
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error al listar comprobantes:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
