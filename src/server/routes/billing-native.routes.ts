import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getHaciendaConfigByTenant,
  getHaciendaDecryptedSecrets,
  saveHaciendaConfig,
  clearHaciendaCredentials,
  getHaciendaBranchesByTenant,
  saveHaciendaBranch,
  deleteHaciendaBranch,
  getCycleUsage
} from '../db/hacienda-native.repo.js';
import {
  testTenantHaciendaConnection,
  testBranchHaciendaConnection,
  authenticateHaciendaIdp,
  inspectP12Certificate,
  lookupHaciendaTaxpayerPublic,
  emitManualOrNativeVoucher,
  emitCreditNoteForVoucher
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
        taxpayerIdNumber: '',
        taxpayerName: '',
        commercialName: '',
        taxpayerEmail: '',
        taxpayerPhone: '',
        economicActivityCode: '',
        economicActivities: [],
        defaultCabysCode: '8311100000000',
        province: '1',
        canton: '01',
        district: '01',
        neighborhood: '01',
        addressDetail: '',
        idpUsername: '',
        idpPasswordMasked: '',
        p12Filename: '',
        p12ExpiresAt: null,
        p12HasCertificate: false,
        certSubject: '',
        certIssuer: '',
        certDaysRemaining: null,
        branchCode: '001',
        posCode: '00001',
        defaultDocType: '04',
        seqFactura: 1,
        seqTiquete: 1,
        seqNotaCredito: 1,
        multiBranchEnabled: false,
        isConnected: false,
        providerMode: 'BETICO_NATIVE',
        useAlternativeProvider: false,
        isSimplifiedRegime: false,
        emailAutoSend: true,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassMasked: '',
        resendApiKeyMasked: '',
        active: true
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
    let certSubject: string | undefined = undefined;
    let certIssuer: string | undefined = undefined;

    const cleanPin = body.p12Pin && !String(body.p12Pin).includes('••••') ? String(body.p12Pin).trim() : '';

    if (file && file.buffer) {
      p12Buffer = file.buffer;
      p12Filename = file.originalname;

      const pinToUse = cleanPin || (await getHaciendaDecryptedSecrets(tenantId))?.p12Pin || '';
      if (pinToUse) {
        const certCheck = await inspectP12Certificate(p12Buffer, pinToUse);
        if (!certCheck.valid) {
          res.status(400).json({ error: certCheck.error || 'El PIN no coincide con el certificado .p12' });
          return;
        }
        p12ExpiresAt = certCheck.expiresAt;
        certSubject = certCheck.subject;
        certIssuer = certCheck.issuer;
      }
    } else if (cleanPin) {
      // Si envió un nuevo PIN sin subir un nuevo archivo, verificar contra el certificado ya guardado si existe
      const secrets = await getHaciendaDecryptedSecrets(tenantId);
      if (secrets?.p12Buffer) {
        const certCheck = await inspectP12Certificate(secrets.p12Buffer, cleanPin);
        if (!certCheck.valid) {
          res.status(400).json({ error: certCheck.error || 'El PIN ingresado no coincide con el certificado .p12 guardado' });
          return;
        }
        p12ExpiresAt = certCheck.expiresAt;
        certSubject = certCheck.subject;
        certIssuer = certCheck.issuer;
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
      economicActivities: body.economicActivities,
      defaultCabysCode: body.defaultCabysCode,
      province: body.province,
      canton: body.canton,
      district: body.district,
      neighborhood: body.neighborhood,
      addressDetail: body.addressDetail,
      idpUsername: body.idpUsername,
      idpPassword: body.idpPassword,
      p12Buffer,
      p12Filename,
      p12Pin: cleanPin || undefined,
      p12ExpiresAt,
      certSubject,
      certIssuer,
      branchCode: body.branchCode,
      posCode: body.posCode,
      defaultDocType: body.defaultDocType,
      seqFactura: body.seqFactura !== undefined ? Number(body.seqFactura) : undefined,
      seqTiquete: body.seqTiquete !== undefined ? Number(body.seqTiquete) : undefined,
      seqNotaCredito: body.seqNotaCredito !== undefined ? Number(body.seqNotaCredito) : undefined,
      multiBranchEnabled: body.multiBranchEnabled !== undefined ? (body.multiBranchEnabled === 'true' || body.multiBranchEnabled === true) : undefined,
      providerMode: body.providerMode,
      useAlternativeProvider: body.useAlternativeProvider !== undefined ? (body.useAlternativeProvider === 'true' || body.useAlternativeProvider === true) : undefined,
      isSimplifiedRegime: body.isSimplifiedRegime !== undefined ? (body.isSimplifiedRegime === 'true' || body.isSimplifiedRegime === true) : undefined,
      emailAutoSend: body.emailAutoSend !== undefined ? (body.emailAutoSend === 'true' || body.emailAutoSend === true) : undefined,
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort !== undefined ? Number(body.smtpPort) : undefined,
      smtpUser: body.smtpUser,
      smtpPass: body.smtpPass,
      resendApiKey: body.resendApiKey,
      pricesIncludeTax: body.pricesIncludeTax !== undefined ? (body.pricesIncludeTax === 'true' || body.pricesIncludeTax === true) : undefined,
      defaultTaxRateCode: body.defaultTaxRateCode ? String(body.defaultTaxRateCode).trim() : undefined,
      active: body.active !== undefined ? (body.active === 'true' || body.active === true) : undefined
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
 * DELETE /api/billing/native/credentials
 * Permite limpiar credenciales ATV, el certificado .p12 o ambos para reemplazarlos desde cero.
 */
router.delete('/credentials', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const rawTarget = String(req.query.target || req.body?.target || 'all').toLowerCase();
    const target: 'atv' | 'p12' | 'all' = rawTarget === 'atv' ? 'atv' : rawTarget === 'p12' ? 'p12' : 'all';

    const config = await clearHaciendaCredentials(tenantId, target);
    res.json({
      success: true,
      message: target === 'atv'
        ? 'Credenciales ATV eliminadas correctamente'
        : target === 'p12'
          ? 'Certificado criptográfico .p12 eliminado correctamente'
          : 'Credenciales y certificado eliminados correctamente',
      config
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error limpiando credenciales:', err);
    res.status(500).json({ error: err.message || 'Error al limpiar credenciales de Hacienda' });
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
 * Prueba rápida de usuario y contraseña ATV (acepta credenciales en formulario o usa las guardadas en BD).
 */
router.post('/quick-test', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { environment, idpUsername, idpPassword } = req.body || {};

    let effEnv: 'sandbox' | 'production' = environment || 'sandbox';
    let effUsername = idpUsername ? String(idpUsername).trim() : '';
    let effPassword = idpPassword && !String(idpPassword).includes('••••') ? String(idpPassword).trim() : '';

    if (!effUsername || !effPassword) {
      const secrets = await getHaciendaDecryptedSecrets(tenantId);
      if (secrets) {
        if (!effUsername) effUsername = secrets.idpUsername;
        if (!effPassword) effPassword = secrets.idpPassword;
        if (!environment) effEnv = secrets.environment;
      }
    }

    if (!effUsername || !effPassword) {
      res.status(400).json({ success: false, message: 'Ingrese usuario y contraseña ATV para realizar la prueba' });
      return;
    }

    const result = await authenticateHaciendaIdp(effEnv, effUsername, effPassword);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Error probando credenciales ATV' });
  }
});

/**
 * POST /api/billing/native/test-p12
 * Inspecciona y valida un archivo .p12 + PIN (ya sea subido al vuelo o el almacenado en bóveda).
 */
router.post('/test-p12', upload.single('certificateFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const file = req.file;
    const rawPin = req.body?.p12Pin && !String(req.body.p12Pin).includes('••••')
      ? String(req.body.p12Pin).trim()
      : '';

    let p12Buffer: Buffer | null = file?.buffer || null;
    let p12Pin = rawPin;

    if (!p12Buffer || !p12Pin) {
      const secrets = await getHaciendaDecryptedSecrets(tenantId);
      if (secrets) {
        if (!p12Buffer) p12Buffer = secrets.p12Buffer;
        if (!p12Pin) p12Pin = secrets.p12Pin;
      }
    }

    if (!p12Buffer || !p12Pin) {
      res.status(400).json({
        success: false,
        message: 'Seleccione un archivo .p12 e ingrese su PIN de 4 dígitos para validar la llave criptográfica.'
      });
      return;
    }

    const certInfo = await inspectP12Certificate(p12Buffer, p12Pin);
    if (certInfo.valid && !file) {
      await saveHaciendaConfig(tenantId, {
        p12ExpiresAt: certInfo.expiresAt,
        certSubject: certInfo.subject,
        certIssuer: certInfo.issuer
      });
    }

    res.json({
      success: certInfo.valid,
      message: certInfo.valid
        ? `Llave criptográfica válida: ${certInfo.subject} (Vence el ${certInfo.expiresAt ? certInfo.expiresAt.toLocaleDateString('es-CR') : 'N/A'})`
        : (certInfo.error || 'No se pudo validar el certificado .p12'),
      certificate: certInfo
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error en test-p12:', err);
    res.status(500).json({ success: false, message: err.message || 'Error al inspeccionar certificado .p12' });
  }
});

/**
 * GET /api/billing/native/padron/:identificacion
 * Consulta el Padrón Público del Ministerio de Hacienda (nombre, tipo de cédula, régimen y actividades económicas).
 */
router.get('/padron/:identificacion', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await lookupHaciendaTaxpayerPublic(String(req.params.identificacion || ''));
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error consultando padrón Hacienda:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error consultando el padrón de Hacienda'
    });
  }
});

/**
 * GET /api/billing/native/branches
 * Lista las sucursales/terminales fiscales (001, 002, etc.) y las sucursales operativas del comercio.
 */
router.get('/branches', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { getBranchesByTenant } = await import('../db/branches.repo.js');
    const [branches, storeBranches] = await Promise.all([
      getHaciendaBranchesByTenant(tenantId),
      getBranchesByTenant(tenantId).catch(() => [])
    ]);
    res.json({
      success: true,
      branches,
      storeBranches
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error listando sucursales fiscales:', err);
    res.status(500).json({ error: 'Error al obtener sucursales de facturación' });
  }
});

/**
 * POST /api/billing/native/branches
 * Crea o actualiza una sucursal/terminal fiscal (con soporte opcional para certificado .p12 propio).
 */
router.post('/branches', upload.single('certificateFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const body = req.body || {};
    const file = req.file;

    let customP12Buffer: Buffer | undefined = undefined;
    let customP12Filename: string | undefined = undefined;
    let customP12ExpiresAt: Date | undefined = undefined;
    let customCertSubject: string | undefined = undefined;

    const cleanPin = body.customP12Pin && !String(body.customP12Pin).includes('••••')
      ? String(body.customP12Pin).trim()
      : '';

    if (file && file.buffer) {
      customP12Buffer = file.buffer;
      customP12Filename = file.originalname;
      if (cleanPin) {
        const certInfo = await inspectP12Certificate(customP12Buffer, cleanPin);
        if (!certInfo.valid) {
          res.status(400).json({ error: certInfo.error || 'El PIN no coincide con el certificado .p12 de la sucursal' });
          return;
        }
        customP12ExpiresAt = certInfo.expiresAt;
        customCertSubject = certInfo.subject;
      }
    }

    const branch = await saveHaciendaBranch(tenantId, {
      ...body,
      customP12Buffer,
      customP12Filename,
      customP12Pin: cleanPin || undefined,
      customP12ExpiresAt,
      customCertSubject
    });

    res.json({
      success: true,
      message: 'Sucursal de facturación guardada exitosamente',
      branch
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error guardando sucursal fiscal:', err);
    res.status(500).json({ error: err.message || 'Error al guardar sucursal de facturación' });
  }
});

/**
 * POST /api/billing/native/branches/:id/test
 * Prueba la conexión de una sucursal fiscal específica contra Hacienda.
 */
router.post('/branches/:id/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await testBranchHaciendaConnection(tenantId, String(req.params.id || ''));
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error probando sucursal fiscal:', err);
    res.status(500).json({ success: false, message: err.message || 'Error al probar conexión de sucursal' });
  }
});

/**
 * DELETE /api/billing/native/branches/:id
 * Elimina una sucursal/terminal fiscal.
 */
router.delete('/branches/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const deleted = await deleteHaciendaBranch(tenantId, String(req.params.id || ''));
    res.json({
      success: deleted,
      message: deleted ? 'Sucursal eliminada correctamente' : 'Sucursal no encontrada'
    });
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error eliminando sucursal fiscal:', err);
    res.status(500).json({ error: err.message || 'Error al eliminar sucursal de facturación' });
  }
});

/**
 * POST /api/billing/native/emit-manual
 * Emite una Factura Electrónica (01), Tiquete Electrónico (04) o Nota de Crédito (03) desde el Facturador Rápido POS.
 */
router.post('/emit-manual', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await emitManualOrNativeVoucher(tenantId, req.body || {});
    if (!result.success) {
      res.status(400).json({ ...result, error: result.message });
      return;
    }
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error en emisión manual POS:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al emitir comprobante electrónico' });
  }
});

/**
 * POST /api/billing/native/vouchers/:id/credit-note
 * Emite una Nota de Crédito Electrónica (03) que referencia y anula un comprobante emitido previamente.
 */
router.post('/vouchers/:id/credit-note', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const result = await emitCreditNoteForVoucher(tenantId, String(req.params.id || ''), req.body?.reason);
    if (!result.success) {
      res.status(400).json({ ...result, error: result.message });
      return;
    }
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error emitiendo Nota de Crédito:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al emitir Nota de Crédito' });
  }
});

/**
 * POST /api/billing/native/vouchers/:id/send-email
 * Envía o reenvía el comprobante electrónico (PDF + XML DGT v4.4 adjuntos) al correo electrónico del cliente.
 */
router.post('/vouchers/:id/send-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { sendVoucherEmailNotification } = await import('../services/voucher-email.service.js');
    const result = await sendVoucherEmailNotification({
      tenantId,
      voucherKeyOrId: String(req.params.id || ''),
      overrideEmail: req.body?.email ? String(req.body.email).trim() : undefined
    });
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error enviando correo de comprobante:', err);
    res.status(500).json({ success: false, message: err.message || 'Error al enviar el comprobante por correo' });
  }
});

/**
 * POST /api/billing/native/test-email
 * Prueba la configuración de envío de correos (SMTP o Resend) enviando un correo de prueba.
 */
router.post('/test-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { testTenantEmailDelivery } = await import('../services/voucher-email.service.js');
    const result = await testTenantEmailDelivery(tenantId, req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('[BillingNativeRoutes] Error en test-email:', err);
    res.status(500).json({ success: false, message: err.message || 'Error probando envío de correo' });
  }
});

export default router;
