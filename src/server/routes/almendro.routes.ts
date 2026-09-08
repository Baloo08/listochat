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
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getAppointmentById } from '../db/appointments.repo.js';
import { getRecordById } from '../db/records.repo.js';

const router = Router();

/**
 * GET /api/almendro/public-config/:slug?module=store|bookings|courts|restaurant
 * Public check to determine if electronic invoicing is enabled for the checkout.
 * Does NOT expose secrets or API keys.
 */
router.get('/public-config/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const module = (req.query.module as string) || 'store';
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).json({ error: 'Comercio no encontrado' });
      return;
    }

    const config = await getTenantAlmendroConfig(tenant.id);
    if (!config || !config.isEnabled || !config.isConfigured) {
      res.json({ isEnabled: false, defaultDocType: '04' });
      return;
    }

    let isModuleEnabled = false;
    if (module === 'store') isModuleEnabled = Boolean(config.moduleToggles.storeEnabled);
    else if (module === 'bookings') isModuleEnabled = Boolean(config.moduleToggles.bookingsEnabled);
    else if (module === 'courts') isModuleEnabled = Boolean(config.moduleToggles.courtsEnabled);
    else if (module === 'restaurant') isModuleEnabled = Boolean(config.moduleToggles.restaurantEnabled);

    res.json({
      isEnabled: isModuleEnabled,
      defaultDocType: config.defaultDocType || '04'
    });
  } catch (err: any) {
    res.json({ isEnabled: false, defaultDocType: '04' });
  }
});

// Apply JWT authentication and tenant context to all following routes
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

/**
 * POST /api/almendro/emit-appointment-invoice/:appointmentId
 * Emits an electronic invoice for an appointment.
 * Automatically resolves client tax data from:
 * 1. Explicit payload receiver details (if provided)
 * 2. appointment.billingInfo
 * 3. Associated customer record (expediente) metadata.billingInfo
 * 4. Fallback to appointment client name
 */
router.post('/emit-appointment-invoice/:appointmentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { appointmentId } = req.params;
    const { docType, receiver, cabysCode, taxRateCode } = req.body;

    const appointment = await getAppointmentById(appointmentId, tenantId);
    if (!appointment) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }

    // Resolve patient record if present
    let patientRecord = null;
    if (appointment.recordId) {
      patientRecord = await getRecordById(appointment.recordId, tenantId);
    }

    const customerBilling = appointment.billingInfo || patientRecord?.metadata?.billingInfo;

    const receiverIdType = receiver?.idType || customerBilling?.idType || (patientRecord?.identification ? '01' : undefined);
    const receiverIdNumber = receiver?.idNumber || customerBilling?.idNumber || patientRecord?.identification || undefined;
    const receiverName = receiver?.name || customerBilling?.legalName || patientRecord?.fullName || appointment.name;
    const receiverEmail = receiver?.email || customerBilling?.email || patientRecord?.email || undefined;

    const finalDocType = docType || (receiverIdNumber ? '01' : '04');
    const unitPrice = Number(appointment.amount) || 0;

    const result = await AlmendroService.emitVoucher(tenantId, {
      docType: finalDocType,
      appointmentId: appointment.id,
      receiver: receiverIdNumber ? {
        idType: receiverIdType,
        idNumber: receiverIdNumber,
        name: receiverName,
        email: receiverEmail
      } : undefined,
      items: [
        {
          cabysCode: cabysCode || '8311100000000',
          description: `Servicio: ${appointment.service}${appointment.vehicleModel ? ` (${appointment.vehicleModel})` : ''}`,
          quantity: 1,
          unitPrice: unitPrice,
          taxRateCode: taxRateCode || '08' // 13% IVA
        }
      ]
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({
      success: true,
      numericKey: result.numericKey,
      pdfUrl: result.pdfUrl,
      message: result.message
    });
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error emitiendo factura de cita:', error);
    res.status(500).json({ error: error.message || 'Error interno al emitir comprobante' });
  }
});

/**
 * POST /api/almendro/emit-record-invoice/:recordId
 * Emits an electronic invoice for a patient/client directly from their record.
 */
router.post('/emit-record-invoice/:recordId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req as any).tenantId;
    const { recordId } = req.params;
    const { docType, serviceName, amount, cabysCode, taxRateCode, receiver, notes } = req.body;

    const record = await getRecordById(recordId, tenantId);
    if (!record) {
      res.status(404).json({ error: 'Expediente no encontrado' });
      return;
    }

    const patientBilling = record.metadata?.billingInfo;
    const receiverIdType = receiver?.idType || patientBilling?.idType || '01';
    const receiverIdNumber = receiver?.idNumber || patientBilling?.idNumber || record.identification || undefined;
    const receiverName = receiver?.name || patientBilling?.legalName || record.fullName;
    const receiverEmail = receiver?.email || patientBilling?.email || record.email || undefined;

    const finalDocType = docType || (receiverIdNumber ? '01' : '04');
    const unitPrice = Number(amount) || 0;
    if (unitPrice <= 0) {
      res.status(400).json({ error: 'El monto a facturar debe ser mayor a 0' });
      return;
    }

    const result = await AlmendroService.emitVoucher(tenantId, {
      docType: finalDocType,
      receiver: receiverIdNumber ? {
        idType: receiverIdType,
        idNumber: receiverIdNumber,
        name: receiverName,
        email: receiverEmail
      } : undefined,
      items: [
        {
          cabysCode: cabysCode || '8311100000000',
          description: serviceName || notes || `Consulta / Atención Médica - ${record.fullName}`,
          quantity: 1,
          unitPrice: unitPrice,
          taxRateCode: taxRateCode || '04' // 4% IVA en salud o 13% general
        }
      ]
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({
      success: true,
      numericKey: result.numericKey,
      pdfUrl: result.pdfUrl,
      message: result.message
    });
  } catch (error: any) {
    console.error('[AlmendroRoutes] Error emitiendo factura desde expediente:', error);
    res.status(500).json({ error: error.message || 'Error interno al emitir comprobante' });
  }
});

export default router;
