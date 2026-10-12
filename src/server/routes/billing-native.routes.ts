import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getHaciendaConfigByTenant,
  saveHaciendaConfig,
  getCycleUsage
} from '../db/hacienda-native.repo.js';
import {
  testTenantHaciendaConnection,
  authenticateHaciendaIdp,
  inspectP12Certificate
} from '../services/hacienda-native.service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

// Middleware de autenticación y contexto de inquilino
router.use(authenticateToken);
router.use(tenantContext);

/**
 * GET /api/billing/native/config
 * Retorna la configuración de facturación nativa del inquilino (con datos sensibles enmascarados).
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const config = await getHaciendaConfigByTenant(tenantId);
    res.json({
      success: true,
      config: config || {
        environment: 'sandbox',
        taxpayerIdType: '01',
        providerMode: 'BETICO_NATIVE',
        useAlternativeProvider: false,
        branchCode: '001',
        posCode: '00001',
        defaultDocType: '04',
        isConnected: false,
        p12HasCertificate: false
      }
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error obteniendo config:', err);
    res.status(500).json({ error: 'Error al obtener configuración de facturación' });
  }
});

/**
 * GET /api/billing/native/usage
 * Retorna el estado de cuota del mes, comprobantes emitidos y margen de cortesía.
 */
router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const usage = await getCycleUsage(tenantId);
    res.json({ success: true, usage });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error obteniendo cuota:', err);
    res.status(500).json({ error: 'Error al obtener consumo de facturación' });
  }
});

/**
 * POST /api/billing/native/config
 * Guarda la configuración fiscal y credenciales. Acepta archivo .p12 en campo 'certificateFile'.
 */
router.post('/config', upload.single('certificateFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const body = req.body || {};
    const file = req.file;

    let p12Buffer: Buffer | undefined = undefined;
    let p12Filename: string | undefined = undefined;
    let p12ExpiresAt: Date | undefined = undefined;

    if (file && file.buffer) {
      p12Buffer = file.buffer;
      p12Filename = file.originalname;

      // Validar PIN de una vez si fue enviado
      if (body.p12Pin) {
        const certCheck = await inspectP12Certificate(p12Buffer, body.p12Pin);
        if (!certCheck.valid) {
          res.status(400).json({ error: certCheck.error || 'El PIN no coincide con el certificado .p12' });
          return;
        }
        p12ExpiresAt = certCheck.expiresAt;
      }
    }

    const updated = await saveHaciendaConfig(tenantId, {
      environment: body.environment,
      taxpayerIdType: body.taxpayerIdType,
      taxpayerIdNumber: body.taxpayerIdNumber,
      taxpayerName: body.taxpayerName,
      commercialName: body.commercialName,
      taxpayerEmail: body.taxpayerEmail,
      taxpayerPhone: body.taxpayerPhone,
      economicActivityCode: body.economicActivityCode,
      province: body.province,
      canton: body.canton,
      district: body.district,
      neighborhood: body.neighborhood,
      addressDetail: body.addressDetail,
      idpUsername: body.idpUsername,
      idpPassword: body.idpPassword,
      p12Buffer,
      p12Filename,
      p12Pin: body.p12Pin,
      p12ExpiresAt,
      branchCode: body.branchCode,
      posCode: body.posCode,
      defaultDocType: body.defaultDocType,
      providerMode: body.providerMode,
      useAlternativeProvider: body.useAlternativeProvider !== undefined ? body.useAlternativeProvider === 'true' || body.useAlternativeProvider === true : undefined,
      isSimplifiedRegime: body.isSimplifiedRegime !== undefined ? body.isSimplifiedRegime === 'true' || body.isSimplifiedRegime === true : undefined,
      active: body.active !== undefined ? body.active === 'true' || body.active === true : undefined
    });

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente',
      config: updated
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error guardando config:', err);
    res.status(500).json({ error: err.message || 'Error guardando configuración de facturación' });
  }
});

/**
 * POST /api/billing/native/test-connection
 * Prueba la conexión con Hacienda con las credenciales y certificado guardados.
 */
router.post('/test-connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await testTenantHaciendaConnection(tenantId);
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error en test connection:', err);
    res.status(500).json({ success: false, message: err.message || 'Error al probar conexión con Hacienda' });
  }
});

/**
 * POST /api/billing/native/quick-test
 * Prueba rápida de usuario y contraseña ATV antes de guardar.
 */
router.post('/quick-test', async (req: Request, res: Response): Promise<void> => {
  try {
    const { environment, idpUsername, idpPassword } = req.body;
    if (!idpUsername || !idpPassword) {
      res.status(400).json({ success: false, message: 'Ingrese usuario y contraseña ATV' });
      return;
    }

    const result = await authenticateHaciendaIdp(
      environment || 'sandbox',
      idpUsername,
      idpPassword
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error probando credenciales' });
  }
});

export default router;
