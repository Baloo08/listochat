import {
  getTenantAlmendroConfigRaw,
  saveElectronicVoucher
} from '../db/tenant-almendro.repo.js';
import { AlmendroEnvironment, AlmendroModuleToggles } from '../../shared/types.js';

const ALMENDRO_PROD_URL = 'https://fe.almendro.cr/api/v1/public';
const ALMENDRO_SANDBOX_URL = 'https://fe.almendro.cr/api/v1/public/sandbox';

function getBaseUrl(environment?: AlmendroEnvironment): string {
  return environment === 'PRODUCTION' ? ALMENDRO_PROD_URL : ALMENDRO_SANDBOX_URL;
}

function getCostaRicaIssuedAt(): string {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const crTime = new Date(utc - (3600000 * 6)); // Costa Rica is UTC-6
  const y = crTime.getFullYear();
  const m = String(crTime.getMonth() + 1).padStart(2, '0');
  const d = String(crTime.getDate()).padStart(2, '0');
  const hh = String(crTime.getHours()).padStart(2, '0');
  const mm = String(crTime.getMinutes()).padStart(2, '0');
  const ss = String(crTime.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}-06:00`;
}

export interface TaxpayerInfo {
  idType: string;
  idNumber: string;
  name: string;
  commercialName?: string;
  status: string;
  taxRegime?: string;
  activities: Array<{ code: string; name: string }>;
}

export interface VoucherLineItem {
  cabysCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateCode?: string; // '08' 13%, '04' 4%, '02' 2%, '01' 1%, '10' Exento
  discountAmount?: number;
}

export interface EmitVoucherParams {
  docType?: '01' | '04' | '03'; // 01: Factura, 04: Tiquete, 03: Nota Crédito
  receiver?: {
    idType?: string;
    idNumber?: string;
    name?: string;
    email?: string;
  };
  currency?: string;
  exchangeRate?: number;
  paymentMethod?: string;
  items: VoucherLineItem[];
  orderId?: string;
  appointmentId?: string;
  courtBookingId?: string;
  subscriptionChargeId?: string;
  referenceKey?: string; // Para Notas de Crédito
}

export class AlmendroService {
  /**
   * Tests connection with Almendro using the provided API Key.
   */
  static async testConnection(
    apiKey: string,
    environment: AlmendroEnvironment = 'SANDBOX'
  ): Promise<{ success: boolean; message: string; details?: any }> {
    if (!apiKey || apiKey.trim().length < 5) {
      return { success: false, message: 'La llave de API es requerida' };
    }

    const cleanKey = apiKey.trim();
    const primaryUrl = getBaseUrl(environment);

    try {
      // 1. Probar contra el ambiente seleccionado utilizando el endpoint de comprobantes
      let res = await fetch(`${primaryUrl}/vouchers?limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Accept': 'application/json'
        }
      });

      // 2. Si responde 404 o falla en sandbox, probar contra el perfil o catálogo de producción
      if (!res.ok && res.status !== 401 && res.status !== 403) {
        try {
          const fallbackRes = await fetch(`${ALMENDRO_PROD_URL}/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cleanKey}`,
              'Accept': 'application/json'
            }
          });
          if (fallbackRes.status === 200 || fallbackRes.status === 202 || fallbackRes.status === 401 || fallbackRes.status === 403) {
            res = fallbackRes;
          }
        } catch (_) {}
      }

      if (res.status === 200 || res.status === 202) {
        return {
          success: true,
          message: `Conexión exitosa con Almendro (${environment})`
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          message: 'La llave de API no es válida o no tiene permisos en Almendro'
        };
      }

      const errText = await res.text().catch(() => '');
      return {
        success: false,
        message: `Almendro respondió con código ${res.status}: ${errText.slice(0, 150)}`
      };
    } catch (err: any) {
      // Intento de fallback cruzado si ocurrió un fallo de red transitorio
      try {
        const altUrl = environment === 'SANDBOX' ? ALMENDRO_PROD_URL : ALMENDRO_SANDBOX_URL;
        const altRes = await fetch(`${altUrl}/vouchers?limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'application/json'
          }
        });
        if (altRes.status === 200 || altRes.status === 202) {
          return {
            success: true,
            message: `Conexión exitosa con Almendro`
          };
        }
        if (altRes.status === 401 || altRes.status === 403) {
          return {
            success: false,
            message: 'La llave de API no es válida o no tiene permisos en Almendro'
          };
        }
      } catch (_) {}

      return {
        success: false,
        message: `No fue posible conectar con el servidor de Almendro: ${err.message}`
      };
    }
  }

  /**
   * Looks up a taxpayer's official name, status and economic activities from TSE/Hacienda.
   */
  static async lookupTaxpayer(
    apiKey: string,
    environment: AlmendroEnvironment,
    rawIdNumber: string
  ): Promise<{ success: boolean; data?: TaxpayerInfo; error?: string }> {
    if (!rawIdNumber) return { success: false, error: 'Número de cédula requerido' };
    const cleanId = rawIdNumber.replace(/\D/g, '');

    if (cleanId.length < 9 || cleanId.length > 12) {
      return { success: false, error: 'El formato de cédula debe tener entre 9 y 12 dígitos numéricos' };
    }

    const baseUrl = getBaseUrl(environment);

    try {
      const res = await fetch(`${baseUrl}/taxpayer/${cleanId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        return {
          success: false,
          error: `Contribuyente no encontrado en el padrón (${res.status}): ${errText.slice(0, 100)}`
        };
      }

      const body: any = await res.json();
      return {
        success: true,
        data: {
          idType: body.id_type || (cleanId.length === 10 && cleanId.startsWith('3') ? '02' : '01'),
          idNumber: cleanId,
          name: body.name || body.legal_name || 'Nombre no disponible',
          commercialName: body.commercial_name,
          status: body.status || 'INSCRITO',
          taxRegime: body.tax_regime || 'TRADICIONAL',
          activities: body.activities || []
        }
      };
    } catch (err: any) {
      return { success: false, error: `Error consultando padrón de Hacienda: ${err.message}` };
    }
  }

  /**
   * Determines if a specific module should automatically invoice.
   */
  static async shouldInvoiceModule(
    tenantId: string,
    moduleName: keyof AlmendroModuleToggles
  ): Promise<boolean> {
    const config = await getTenantAlmendroConfigRaw(tenantId);
    if (!config || !config.isEnabled || !config.apiKey) return false;
    return Boolean(config.moduleToggles[moduleName]);
  }

  /**
   * Emits an electronic voucher through Almendro and stores it in electronic_vouchers.
   */
  static async emitVoucher(
    tenantId: string,
    params: EmitVoucherParams
  ): Promise<{ success: boolean; numericKey?: string; pdfUrl?: string; message: string }> {
    const config = await getTenantAlmendroConfigRaw(tenantId);
    if (!config || !config.isEnabled || !config.apiKey) {
      return {
        success: false,
        message: 'La facturación electrónica está desactivada o no configurada para este negocio.'
      };
    }

    const docType = params.docType || config.defaultDocType || '04';
    const currency = params.currency || 'CRC';
    const exchangeRate = params.exchangeRate || 1.0;

    // Build line items formatted with exactly 5 decimal places for Almendro v1.1.1
    let subtotal = 0;
    let taxAmount = 0;

    const lines = params.items.map((item, idx) => {
      const lineQty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const lineSubtotal = lineQty * unitPrice;
      subtotal += lineSubtotal;

      const taxRateCode = item.taxRateCode || '08';
      let taxPercentage = 0.13;
      if (taxRateCode === '04') taxPercentage = 0.04;
      else if (taxRateCode === '02') taxPercentage = 0.02;
      else if (taxRateCode === '01') taxPercentage = 0.01;
      else if (taxRateCode === '10') taxPercentage = 0.00;

      const lineTax = lineSubtotal * taxPercentage;
      taxAmount += lineTax;
      const totalLineAmount = lineSubtotal + lineTax;

      return {
        line_number: idx + 1,
        cabys_code: item.cabysCode || '8311100000000',
        detail: item.description.slice(0, 160),
        description: item.description.slice(0, 160),
        unit_of_measure: 'Unid',
        unit_measure: 'Unid',
        quantity: lineQty.toFixed(3),
        unit_price: unitPrice.toFixed(5),
        total_amount: lineSubtotal.toFixed(5),
        sub_total: lineSubtotal.toFixed(5),
        base_imponible: lineSubtotal.toFixed(5),
        taxes: [
          {
            codigo: '01', // IVA
            codigoTarifa: taxRateCode,
            tarifa: (taxPercentage * 100).toFixed(2),
            monto: lineTax.toFixed(5),
            code: '01',
            rate_code: taxRateCode,
            rate: (taxPercentage * 100).toFixed(2),
            amount: lineTax.toFixed(5)
          }
        ],
        impuesto_neto: lineTax.toFixed(5),
        total_line_amount: totalLineAmount.toFixed(5)
      };
    });

    const totalAmount = subtotal + taxAmount;

    // Receiver block (required for 01 Factura, optional for 04 Tiquete)
    const receiverEmail = params.receiver?.email;
    const receiverPayload = params.receiver?.idNumber ? {
      id_type: params.receiver.idType || '01',
      id_number: params.receiver.idNumber.replace(/\D/g, ''),
      name: params.receiver.name || 'Cliente Particular',
      emails: receiverEmail ? [receiverEmail] : [],
      email: receiverEmail
    } : undefined;

    const paymentMethodCode = params.paymentMethod || '01';
    const issuerActivityCode = config.economicActivityCode?.trim() || '561001';

    const payload: Record<string, any> = {
      voucher_type: docType,
      doc_type: docType,
      situation: '1',
      issued_at: getCostaRicaIssuedAt(),
      issuer_activity_code: issuerActivityCode,
      sale_condition: '01',
      currency_code: currency,
      currency,
      exchange_rate: exchangeRate.toFixed(5),
      payment_methods: [
        {
          tipo: paymentMethodCode
        }
      ],
      branch_code: config.branchCode || '001',
      pos_code: config.posCode || '00001',
      line_items: lines,
      items: lines
    };

    if (receiverPayload) {
      payload.receiver = receiverPayload;
    }

    if (params.referenceKey && docType === '03') {
      payload.reference = {
        code: '01', // Anula documento de referencia
        numeric_key: params.referenceKey,
        reason: 'Anulación solicitada por el emisor'
      };
    }

    const baseUrl = getBaseUrl(config.environment);

    try {
      const res = await fetch(`${baseUrl}/vouchers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseBody: any = await res.json().catch(() => ({}));

      if (res.status === 200 || res.status === 201 || res.status === 202) {
        const numericKey = responseBody.numeric_key || responseBody.key || `506${Date.now()}`;
        const consecutive = responseBody.consecutive || responseBody.consecutive_number || '';
        const pdfUrl = responseBody.pdf_url || `${baseUrl}/vouchers/${numericKey}/pdf`;
        const xmlSigned = responseBody.xml_signed_url || `${baseUrl}/vouchers/${numericKey}/xml`;

        // Save voucher in electronic_vouchers table
        await saveElectronicVoucher(tenantId, {
          orderId: params.orderId,
          appointmentId: params.appointmentId,
          courtBookingId: params.courtBookingId,
          subscriptionChargeId: params.subscriptionChargeId,
          docType,
          consecutiveNumber: consecutive,
          numericKey,
          receiverIdType: params.receiver?.idType,
          receiverIdNumber: params.receiver?.idNumber,
          receiverName: params.receiver?.name,
          receiverEmail: params.receiver?.email,
          currency,
          subtotal,
          taxAmount,
          totalAmount,
          status: responseBody.status === 'accepted' ? 'accepted' : 'pending',
          pdfUrl,
          xmlSignedUrl: xmlSigned,
          metadata: responseBody
        });

        return {
          success: true,
          numericKey,
          pdfUrl,
          message: `Comprobante emitido con éxito. Clave: ${numericKey}`
        };
      }

      let errorMsg = responseBody.message || responseBody.error || `Error ${res.status} al emitir en Almendro`;
      if (responseBody.errors && typeof responseBody.errors === 'object') {
        const detailErrors = Object.entries(responseBody.errors)
          .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
          .join(' | ');
        if (detailErrors) {
          errorMsg = `${errorMsg} (${detailErrors})`;
        }
      }
      console.warn(`[AlmendroService] Emisión fallida para tenant ${tenantId}:`, errorMsg);
      return { success: false, message: errorMsg };
    } catch (err: any) {
      console.error(`[AlmendroService] Excepción emitiendo comprobante para tenant ${tenantId}:`, err);
      return { success: false, message: `Error de red al conectar con Almendro: ${err.message}` };
    }
  }

  /**
   * Automatically or manually emits an electronic invoice for an Order.
   * Performs idempotency checks, line formatting, and updates order.billingInfo in DB.
   */
  static async emitOrderInvoice(
    tenantId: string,
    orderId: string
  ): Promise<{ success: boolean; numericKey?: string; pdfUrl?: string; message: string }> {
    try {
      const { getOrderById, updateOrder } = await import('../db/orders.repo.js');
      const { getElectronicVoucherByOrderId } = await import('../db/tenant-almendro.repo.js');

      const order = await getOrderById(orderId, tenantId);
      if (!order) {
        return { success: false, message: 'Orden no encontrada' };
      }

      // Check if electronic invoicing is enabled for this tenant
      const config = await getTenantAlmendroConfigRaw(tenantId);
      if (!config || !config.isEnabled || !config.apiKey) {
        return { success: false, message: 'Facturación electrónica no habilitada en este comercio' };
      }

      // Idempotency check 1: order.billingInfo already has a numericKey
      if (order.billingInfo?.numericKey && order.billingInfo?.invoiceStatus === 'issued') {
        return {
          success: true,
          numericKey: order.billingInfo.numericKey,
          pdfUrl: order.billingInfo.pdfUrl,
          message: `Factura ya emitida previamente con clave ${order.billingInfo.numericKey}`
        };
      }

      // Idempotency check 2: voucher already in electronic_vouchers table
      const existingVoucher = await getElectronicVoucherByOrderId(tenantId, order.id);
      if (existingVoucher && existingVoucher.numericKey) {
        const updatedBillingInfo = {
          ...(order.billingInfo || { requiresInvoice: true }),
          numericKey: existingVoucher.numericKey,
          pdfUrl: existingVoucher.pdfUrl || undefined,
          invoiceStatus: 'issued' as const,
          issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : new Date().toISOString()
        };
        await updateOrder(order.id, tenantId, { billingInfo: updatedBillingInfo });
        return {
          success: true,
          numericKey: existingVoucher.numericKey,
          pdfUrl: existingVoucher.pdfUrl || undefined,
          message: `Factura recuperada de registros con clave ${existingVoucher.numericKey}`
        };
      }

      const billing = order.billingInfo;
      const receiverIdNumber = billing?.idNumber?.replace(/\D/g, '') || undefined;
      const receiverIdType = billing?.idType || (receiverIdNumber && receiverIdNumber.length === 10 && receiverIdNumber.startsWith('3') ? '02' : '01');
      const receiverName = billing?.legalName || order.customerName;
      const receiverEmail = billing?.email || order.customerEmail || undefined;

      const docType: '01' | '04' = receiverIdNumber ? '01' : (config.defaultDocType || '04');

      // Prepare line items
      const items: VoucherLineItem[] = (order.items && order.items.length > 0)
        ? order.items.map(it => ({
            cabysCode: '8311100000000',
            description: `${it.productName}${it.variantName ? ` - ${it.variantName}` : ''}`,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            taxRateCode: '08' // 13% IVA
          }))
        : [{
            cabysCode: '8311100000000',
            description: `Consumo / Pedido #ORD-${order.orderNumber}`,
            quantity: 1,
            unitPrice: Number(order.subtotal || order.total) || 0,
            taxRateCode: '08'
          }];

      // Add delivery fee as line item if present and > 0
      if (Number(order.deliveryFee) > 0) {
        items.push({
          cabysCode: '8311100000000',
          description: 'Servicio de Envío Express',
          quantity: 1,
          unitPrice: Number(order.deliveryFee),
          taxRateCode: '08'
        });
      }

      const paymentMethodCode = order.paymentMethod === 'card'
        ? '02'
        : (['sinpe', 'transfer'].includes(order.paymentMethod) ? '04' : '01');

      const voucherRes = await this.emitVoucher(tenantId, {
        docType,
        orderId: order.id,
        currency: order.currency || 'CRC',
        paymentMethod: paymentMethodCode,
        receiver: receiverIdNumber ? {
          idType: receiverIdType,
          idNumber: receiverIdNumber,
          name: receiverName,
          email: receiverEmail
        } : undefined,
        items
      });

      if (voucherRes.success && voucherRes.numericKey) {
        const updatedBilling = {
          ...(order.billingInfo || { requiresInvoice: true }),
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: new Date().toISOString()
        };

        await updateOrder(order.id, tenantId, { billingInfo: updatedBilling });

        return {
          success: true,
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          message: voucherRes.message
        };
      } else {
        const failedBilling = {
          ...(order.billingInfo || { requiresInvoice: true }),
          invoiceStatus: 'failed' as const
        };
        await updateOrder(order.id, tenantId, { billingInfo: failedBilling });
        return {
          success: false,
          message: voucherRes.message || 'Error desconocido al emitir comprobante'
        };
      }
    } catch (err: any) {
      console.error(`[AlmendroService] Error emitiendo factura para orden ${orderId}:`, err);
      return { success: false, message: `Error interno: ${err.message}` };
    }
  }

  /**
   * Automatically or manually emits an electronic invoice for an Appointment.
   * Performs idempotency checks and updates appointment.billingInfo in DB.
   */
  static async emitAppointmentInvoice(
    tenantId: string,
    appointmentId: string
  ): Promise<{ success: boolean; numericKey?: string; pdfUrl?: string; message: string }> {
    try {
      const { getAppointmentById, updateAppointment } = await import('../db/appointments.repo.js');
      const { getRecordById } = await import('../db/records.repo.js');
      const { getElectronicVoucherByAppointmentId } = await import('../db/tenant-almendro.repo.js');

      const appt = await getAppointmentById(appointmentId, tenantId);
      if (!appt) return { success: false, message: 'Cita no encontrada' };

      const config = await getTenantAlmendroConfigRaw(tenantId);
      if (!config || !config.isEnabled || !config.apiKey) {
        return { success: false, message: 'Facturación electrónica no habilitada' };
      }

      if (appt.billingInfo?.numericKey && appt.billingInfo?.invoiceStatus === 'issued') {
        return {
          success: true,
          numericKey: appt.billingInfo.numericKey,
          pdfUrl: appt.billingInfo.pdfUrl,
          message: `Factura ya emitida con clave ${appt.billingInfo.numericKey}`
        };
      }

      const existingVoucher = await getElectronicVoucherByAppointmentId(tenantId, appt.id);
      if (existingVoucher && existingVoucher.numericKey) {
        const updatedBilling = {
          ...(appt.billingInfo || { requiresInvoice: true }),
          numericKey: existingVoucher.numericKey,
          pdfUrl: existingVoucher.pdfUrl || undefined,
          invoiceStatus: 'issued' as const,
          issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : new Date().toISOString()
        };
        await updateAppointment(appt.id, tenantId, { billingInfo: updatedBilling });
        return {
          success: true,
          numericKey: existingVoucher.numericKey,
          pdfUrl: existingVoucher.pdfUrl || undefined,
          message: `Factura recuperada con clave ${existingVoucher.numericKey}`
        };
      }

      let patientRecord = null;
      if (appt.recordId) {
        patientRecord = await getRecordById(appt.recordId, tenantId).catch(() => null);
      }

      const customerBilling = appt.billingInfo || patientRecord?.metadata?.billingInfo;
      const receiverIdNumber = customerBilling?.idNumber?.replace(/\D/g, '') || patientRecord?.identification || undefined;
      const receiverIdType = customerBilling?.idType || (receiverIdNumber && receiverIdNumber.length === 10 && receiverIdNumber.startsWith('3') ? '02' : '01');
      const receiverName = customerBilling?.legalName || patientRecord?.fullName || appt.name;
      const receiverEmail = customerBilling?.email || patientRecord?.email || undefined;

      const docType: '01' | '04' = receiverIdNumber ? '01' : (config.defaultDocType || '04');
      const unitPrice = Number(appt.amount) || 0;

      const voucherRes = await this.emitVoucher(tenantId, {
        docType,
        appointmentId: appt.id,
        paymentMethod: '01',
        receiver: receiverIdNumber ? {
          idType: receiverIdType,
          idNumber: receiverIdNumber,
          name: receiverName,
          email: receiverEmail
        } : undefined,
        items: [
          {
            cabysCode: '8311100000000',
            description: `Servicio: ${appt.service}${appt.vehicleModel ? ` (${appt.vehicleModel})` : ''}`,
            quantity: 1,
            unitPrice,
            taxRateCode: '08'
          }
        ]
      });

      if (voucherRes.success && voucherRes.numericKey) {
        const updatedBilling = {
          ...(appt.billingInfo || { requiresInvoice: true }),
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: new Date().toISOString()
        };
        await updateAppointment(appt.id, tenantId, { billingInfo: updatedBilling });
        return {
          success: true,
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          message: voucherRes.message
        };
      } else {
        const failedBilling = {
          ...(appt.billingInfo || { requiresInvoice: true }),
          invoiceStatus: 'failed' as const
        };
        await updateAppointment(appt.id, tenantId, { billingInfo: failedBilling });
        return { success: false, message: voucherRes.message };
      }
    } catch (err: any) {
      console.error(`[AlmendroService] Error emitiendo factura para cita ${appointmentId}:`, err);
      return { success: false, message: `Error interno: ${err.message}` };
    }
  }
}

export default AlmendroService;
