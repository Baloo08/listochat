import {
  getTenantAlmendroConfigRaw,
  saveElectronicVoucher,
  getElectronicVoucherByKeyOrId
} from '../db/tenant-almendro.repo.js';
import { AlmendroEnvironment, AlmendroModuleToggles } from '../../shared/types.js';
import { env } from '../config/env.js';

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

function formatEconomicActivityCode(rawCode?: string): string {
  if (!rawCode) return '5610.0';
  const cleaned = rawCode.trim();
  if (/^\d{4}\.\d$/.test(cleaned)) {
    return cleaned;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length >= 5) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 5)}`;
  }
  if (digits.length === 4) {
    return `${digits}.0`;
  }
  return '5610.0';
}

function sanitizeVoucherPdfUrl(url?: string, numericKey?: string): string | undefined {
  if (!url && !numericKey) return undefined;
  if (url && !url.includes('fe.almendro.cr')) return url;
  if (numericKey) return `${env.APP_URL}/api/almendro/public/voucher-pdf/${numericKey}`;
  return url;
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
  branchId?: string | null;
  branchCode?: string;
  posCode?: string;
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
    const issuerActivityCode = formatEconomicActivityCode(config.economicActivityCode);

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
      branch_code: params.branchCode || config.branchCode || '001',
      pos_code: params.posCode || config.posCode || '00001',
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
        const numericKey = responseBody.data?.numeric_key || responseBody.numeric_key || responseBody.key || `506${Date.now()}`;
        const consecutive = responseBody.data?.consecutive || responseBody.consecutive || responseBody.consecutive_number || '';
        const voucherKey = responseBody.data?.voucher_key || responseBody.voucher_key || numericKey;
        const pdfUrl = `${env.APP_URL}/api/almendro/public/voucher-pdf/${numericKey}`;
        const xmlSigned = responseBody.xml_signed_url || `${baseUrl}/vouchers/${voucherKey}/xml`;

        // Save voucher in electronic_vouchers table
        const savedVoucher = await saveElectronicVoucher(tenantId, {
          orderId: params.orderId,
          appointmentId: params.appointmentId,
          courtBookingId: params.courtBookingId,
          subscriptionChargeId: params.subscriptionChargeId,
          branchId: params.branchId || null,
          branchCode: params.branchCode || config.branchCode || '001',
          posCode: params.posCode || config.posCode || '00001',
          referenceKey: params.referenceKey || null,
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

        // Envío prioritario por correo electrónico al cliente (PDF + XML DGT v4.4)
        import('./voucher-email.service.js')
          .then(({ sendVoucherEmailNotification }) =>
            sendVoucherEmailNotification(tenantId, savedVoucher.id, params.receiver?.email)
          )
          .catch((e) => console.error('[AlmendroService] Error enviando comprobante por correo:', e));

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

      // Check if native Hacienda or Almendro electronic invoicing is enabled for this tenant
      const { getHaciendaConfigByTenant, getHaciendaBranchByStoreBranchId } = await import('../db/hacienda-native.repo.js');
      const nativeCfg = await getHaciendaConfigByTenant(tenantId).catch(() => null);
      const isNativeActive = Boolean(nativeCfg && nativeCfg.active && nativeCfg.providerMode === 'BETICO_NATIVE' && (nativeCfg.taxpayerIdNumber || nativeCfg.isConnected));

      const config = await getTenantAlmendroConfigRaw(tenantId);
      const isAlmendroActive = Boolean(config && config.isEnabled && config.apiKey);

      if (!isNativeActive && !isAlmendroActive) {
        return { success: false, message: 'Facturación electrónica no habilitada en este comercio' };
      }

      // Idempotency check 1: order.billingInfo already has a numericKey
      if (order.billingInfo?.numericKey && order.billingInfo?.invoiceStatus === 'issued') {
        const safeUrl = sanitizeVoucherPdfUrl(order.billingInfo.pdfUrl, order.billingInfo.numericKey);
        return {
          success: true,
          numericKey: order.billingInfo.numericKey,
          pdfUrl: safeUrl,
          message: `Factura ya emitida previamente con clave ${order.billingInfo.numericKey}`
        };
      }

      // Idempotency check 2: voucher already in electronic_vouchers table
      const existingVoucher = await getElectronicVoucherByOrderId(tenantId, order.id);
      if (existingVoucher && existingVoucher.numericKey) {
        const safeUrl = sanitizeVoucherPdfUrl(existingVoucher.pdfUrl, existingVoucher.numericKey);
        const updatedBillingInfo = {
          ...(order.billingInfo || { requiresInvoice: true }),
          numericKey: existingVoucher.numericKey,
          pdfUrl: safeUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : new Date().toISOString()
        };
        await updateOrder(order.id, tenantId, { billingInfo: updatedBillingInfo });
        return {
          success: true,
          numericKey: existingVoucher.numericKey,
          pdfUrl: safeUrl,
          message: `Factura recuperada de registros con clave ${existingVoucher.numericKey}`
        };
      }

      const billing = order.billingInfo;
      const receiverIdNumber = billing?.idNumber?.replace(/\D/g, '') || undefined;
      const receiverIdType = billing?.idType || (receiverIdNumber && receiverIdNumber.length === 10 && receiverIdNumber.startsWith('3') ? '02' : '01');
      const receiverName = billing?.legalName || order.customerName;
      const receiverEmail = billing?.email || order.customerEmail || undefined;

      const defaultDoc = isNativeActive ? (nativeCfg?.defaultDocType || '04') : (config?.defaultDocType || '04');
      const docType: '01' | '04' = receiverIdNumber ? '01' : defaultDoc;
      const defaultCabys = isNativeActive ? (nativeCfg?.defaultCabysCode || '8311100000000') : '8311100000000';

      // Prepare line items
      const items: VoucherLineItem[] = (order.items && order.items.length > 0)
        ? order.items.map(it => ({
            cabysCode: defaultCabys,
            description: `${it.productName}${it.variantName ? ` - ${it.variantName}` : ''}`,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            taxRateCode: '08' // 13% IVA
          }))
        : [{
            cabysCode: defaultCabys,
            description: `Consumo / Pedido #ORD-${order.orderNumber}`,
            quantity: 1,
            unitPrice: Number(order.subtotal || order.total) || 0,
            taxRateCode: '08'
          }];

      // Add delivery fee as line item if present and > 0
      if (Number(order.deliveryFee) > 0) {
        items.push({
          cabysCode: defaultCabys,
          description: 'Servicio de Envío Express',
          quantity: 1,
          unitPrice: Number(order.deliveryFee),
          taxRateCode: '08'
        });
      }

      const paymentMethodCode = order.paymentMethod === 'card'
        ? '02'
        : (['sinpe', 'transfer'].includes(order.paymentMethod) ? '04' : '01');

      const orderBranchId = (order as any).branchId || null;

      let voucherRes: { success: boolean; numericKey?: string; pdfUrl?: string; message: string };

      if (isNativeActive) {
        const { emitManualOrNativeVoucher } = await import('./hacienda-native.service.js');
        voucherRes = await emitManualOrNativeVoucher(tenantId, {
          docType,
          orderId: order.id,
          branchId: orderBranchId,
          currency: order.currency || 'CRC',
          paymentMethod: paymentMethodCode,
          receiver: {
            idType: receiverIdNumber ? receiverIdType : undefined,
            idNumber: receiverIdNumber,
            name: receiverName,
            email: receiverEmail,
            phone: order.customerPhone
          },
          items
        });
      } else {
        // Resolve branchCode / posCode if order has a store branchId
        let resolvedBranchCode = config?.branchCode || '001';
        let resolvedPosCode = config?.posCode || '00001';
        if (orderBranchId && nativeCfg?.multiBranchEnabled) {
          const matchedBranch = await getHaciendaBranchByStoreBranchId(tenantId, orderBranchId).catch(() => null);
          if (matchedBranch && matchedBranch.active) {
            resolvedBranchCode = matchedBranch.branchCode;
            resolvedPosCode = matchedBranch.posCode;
          }
        }

        voucherRes = await this.emitVoucher(tenantId, {
          docType,
          orderId: order.id,
          branchId: orderBranchId,
          branchCode: resolvedBranchCode,
          posCode: resolvedPosCode,
          currency: order.currency || 'CRC',
          paymentMethod: paymentMethodCode,
          receiver: (receiverIdNumber || receiverEmail) ? {
            idType: receiverIdType,
            idNumber: receiverIdNumber,
            name: receiverName,
            email: receiverEmail
          } : undefined,
          items
        });
      }

      if (voucherRes.success && voucherRes.numericKey) {
        const updatedBilling = {
          ...(order.billingInfo || { requiresInvoice: true }),
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: new Date().toISOString()
        };

        await updateOrder(order.id, tenantId, { billingInfo: updatedBilling });

        // Notificación automática por WhatsApp al cliente con su comprobante
        try {
          const { sendVoucherWhatsAppNotification } = await import('./hacienda-native.service.js');
          sendVoucherWhatsAppNotification({
            tenantId,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            referenceLabel: `Pedido #ORD-${order.orderNumber}`,
            docType,
            numericKey: voucherRes.numericKey,
            pdfUrl: voucherRes.pdfUrl
          }).catch(notifErr => console.warn('[AlmendroService] Error enviando WhatsApp de factura:', notifErr));
        } catch (impErr) {
          console.warn('[AlmendroService] No se pudo cargar módulo de notificación:', impErr);
        }

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
      const { getHaciendaConfigByTenant } = await import('../db/hacienda-native.repo.js');

      const appt = await getAppointmentById(appointmentId, tenantId);
      if (!appt) return { success: false, message: 'Cita no encontrada' };

      const nativeCfg = await getHaciendaConfigByTenant(tenantId).catch(() => null);
      const isNativeActive = Boolean(nativeCfg && nativeCfg.active && nativeCfg.providerMode === 'BETICO_NATIVE' && (nativeCfg.taxpayerIdNumber || nativeCfg.isConnected));

      const config = await getTenantAlmendroConfigRaw(tenantId);
      const isAlmendroActive = Boolean(config && config.isEnabled && config.apiKey);

      if (!isNativeActive && !isAlmendroActive) {
        return { success: false, message: 'Facturación electrónica no habilitada' };
      }

      if (appt.billingInfo?.numericKey && appt.billingInfo?.invoiceStatus === 'issued') {
        const safeUrl = sanitizeVoucherPdfUrl(appt.billingInfo.pdfUrl, appt.billingInfo.numericKey);
        return {
          success: true,
          numericKey: appt.billingInfo.numericKey,
          pdfUrl: safeUrl,
          message: `Factura ya emitida con clave ${appt.billingInfo.numericKey}`
        };
      }

      const existingVoucher = await getElectronicVoucherByAppointmentId(tenantId, appt.id);
      if (existingVoucher && existingVoucher.numericKey) {
        const safeUrl = sanitizeVoucherPdfUrl(existingVoucher.pdfUrl, existingVoucher.numericKey);
        const updatedBilling = {
          ...(appt.billingInfo || { requiresInvoice: true }),
          numericKey: existingVoucher.numericKey,
          pdfUrl: safeUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : new Date().toISOString()
        };
        await updateAppointment(appt.id, tenantId, { billingInfo: updatedBilling });
        return {
          success: true,
          numericKey: existingVoucher.numericKey,
          pdfUrl: safeUrl,
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
      const receiverEmail = customerBilling?.email || patientRecord?.email || (appt as any).email || undefined;

      const defaultDoc = isNativeActive ? (nativeCfg?.defaultDocType || '04') : (config?.defaultDocType || '04');
      const docType: '01' | '04' = receiverIdNumber ? '01' : defaultDoc;
      const defaultCabys = isNativeActive ? (nativeCfg?.defaultCabysCode || '8311100000000') : '8311100000000';
      const unitPrice = Number(appt.amount) || 0;

      const items = [
        {
          cabysCode: defaultCabys,
          description: `Servicio: ${appt.service}${appt.vehicleModel ? ` (${appt.vehicleModel})` : ''}`,
          quantity: 1,
          unitPrice,
          taxRateCode: '08'
        }
      ];

      let voucherRes: { success: boolean; numericKey?: string; pdfUrl?: string; message: string };
      if (isNativeActive) {
        const { emitManualOrNativeVoucher } = await import('./hacienda-native.service.js');
        voucherRes = await emitManualOrNativeVoucher(tenantId, {
          docType,
          appointmentId: appt.id,
          paymentMethod: '01',
          receiver: {
            idType: receiverIdNumber ? receiverIdType : undefined,
            idNumber: receiverIdNumber,
            name: receiverName,
            email: receiverEmail,
            phone: appt.phone
          },
          items
        });
      } else {
        voucherRes = await this.emitVoucher(tenantId, {
          docType,
          appointmentId: appt.id,
          paymentMethod: '01',
          receiver: (receiverIdNumber || receiverEmail) ? {
            idType: receiverIdType,
            idNumber: receiverIdNumber,
            name: receiverName,
            email: receiverEmail
          } : undefined,
          items
        });
      }

      if (voucherRes.success && voucherRes.numericKey) {
        const updatedBilling = {
          ...(appt.billingInfo || { requiresInvoice: true }),
          numericKey: voucherRes.numericKey,
          pdfUrl: voucherRes.pdfUrl,
          invoiceStatus: 'issued' as const,
          issuedAt: new Date().toISOString()
        };
        await updateAppointment(appt.id, tenantId, { billingInfo: updatedBilling });

        // Notificación automática por WhatsApp al cliente con su comprobante de cita
        try {
          const { sendVoucherWhatsAppNotification } = await import('./hacienda-native.service.js');
          sendVoucherWhatsAppNotification({
            tenantId,
            customerName: appt.name,
            customerPhone: appt.phone,
            referenceLabel: `Cita del ${appt.date || ''} (${appt.time || ''})`,
            docType: appt.billingInfo?.idNumber ? '01' : (config.defaultDocType || '04'),
            numericKey: voucherRes.numericKey,
            pdfUrl: voucherRes.pdfUrl
          }).catch(notifErr => console.warn('[AlmendroService] Error enviando WhatsApp de factura para cita:', notifErr));
        } catch (impErr) {
          console.warn('[AlmendroService] No se pudo cargar módulo de notificación:', impErr);
        }

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

  /**
   * Genera un PDF 1.4 oficial en memoria para comprobantes emitidos con el motor nativo BETICO_NATIVE.
   */
  private static buildNativePdfBuffer(voucher: any, haciendaConfig: any): Buffer {
    const esc = (text: any): string => {
      return String(text ?? '')
        .replace(/₡/g, 'CRC ')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
    };

    const docTitle = voucher.docType === '01'
      ? 'FACTURA ELECTRONICA'
      : voucher.docType === '03'
        ? 'NOTA DE CREDITO ELECTRONICA'
        : 'TIQUETE ELECTRONICO';

    const issuerName = haciendaConfig?.taxpayerName || haciendaConfig?.commercialName || 'Emisor Autorizado Hacienda CR';
    const commercialName = haciendaConfig?.commercialName || issuerName;
    const issuerId = haciendaConfig?.taxpayerIdNumber || 'N/A';
    const issuerEmail = haciendaConfig?.taxpayerEmail || '';
    const issuerActivity = haciendaConfig?.economicActivityCode || '831110';
    const branchCode = voucher.branchCode || haciendaConfig?.branchCode || '001';
    const posCode = voucher.posCode || haciendaConfig?.posCode || '00001';
    const consecutive = voucher.consecutiveNumber || '00100001040000000001';
    const numericKey = voucher.numericKey || '';
    const createdAtStr = voucher.createdAt ? new Date(voucher.createdAt).toLocaleString('es-CR') : new Date().toLocaleString('es-CR');
    const currency = voucher.currency || 'CRC';

    const receiverName = voucher.receiverName || 'Cliente Contado';
    const receiverId = voucher.receiverIdNumber || 'No especificado';
    const receiverEmail = voucher.receiverEmail || 'No especificado';

    const metadata = (voucher.metadata || {}) as any;
    const rawItems = Array.isArray(metadata.items) && metadata.items.length > 0
      ? metadata.items
      : [
          {
            cabysCode: '8311100000000',
            description: 'Servicios / Productos facturados',
            quantity: 1,
            unitPrice: Number(voucher.subtotal || voucher.totalAmount || 0),
            lineTotal: Number(voucher.totalAmount || 0)
          }
        ];

    const fmtMoney = (val: any) => {
      const n = Number(val || 0);
      return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const ops: string[] = [];

    // Header Banner
    ops.push('0.08 0.14 0.28 rg');
    ops.push('36 700 540 60 re f');

    ops.push('BT /F2 14 Tf 1 1 1 rg 48 736 Td (' + esc(docTitle) + ') Tj ET');
    ops.push('BT /F1 9 Tf 0.85 0.90 1 rg 48 720 Td (' + esc(`Version DGT v4.4 - Sucursal ${branchCode} / Terminal ${posCode}`) + ') Tj ET');
    ops.push('BT /F2 10 Tf 1 1 1 rg 340 736 Td (' + esc(`Consecutivo: ${consecutive}`) + ') Tj ET');
    ops.push('BT /F1 8 Tf 0.85 0.90 1 rg 340 720 Td (' + esc(`Fecha: ${createdAtStr}`) + ') Tj ET');

    // Clave Numérica Box
    ops.push('0.95 0.96 0.98 rg');
    ops.push('36 668 540 24 re f');
    ops.push('0.1 0.15 0.25 rg');
    ops.push('BT /F2 8.5 Tf 44 677 Td (' + esc(`CLAVE NUMERICA HACIENDA (50 DIGITOS): ${numericKey}`) + ') Tj ET');

    // Emisor & Receptor Boxes
    ops.push('0.82 0.85 0.90 RG 0.8 w');
    ops.push('36 572 262 86 re S');
    ops.push('314 572 262 86 re S');

    ops.push('0.08 0.14 0.28 rg');
    ops.push('BT /F2 9.5 Tf 44 644 Td (DATOS DEL EMISOR) Tj ET');
    ops.push('0.15 0.18 0.22 rg');
    ops.push('BT /F2 8.5 Tf 44 630 Td (' + esc(issuerName.slice(0, 44)) + ') Tj ET');
    ops.push('BT /F1 8 Tf 44 617 Td (' + esc(`Nombre Comercial: ${commercialName.slice(0, 34)}`) + ') Tj ET');
    ops.push('BT /F1 8 Tf 44 605 Td (' + esc(`Identificacion: ${issuerId} | Act. Econ: ${issuerActivity}`) + ') Tj ET');
    ops.push('BT /F1 8 Tf 44 593 Td (' + esc(`Correo: ${issuerEmail || 'N/A'}`) + ') Tj ET');
    ops.push('BT /F1 8 Tf 44 581 Td (' + esc(`Sucursal: ${branchCode} | Caja/POS: ${posCode}`) + ') Tj ET');

    ops.push('0.08 0.14 0.28 rg');
    ops.push('BT /F2 9.5 Tf 322 644 Td (DATOS DEL RECEPTOR) Tj ET');
    ops.push('0.15 0.18 0.22 rg');
    ops.push('BT /F2 8.5 Tf 322 630 Td (' + esc(receiverName.slice(0, 44)) + ') Tj ET');
    ops.push('BT /F1 8 Tf 322 615 Td (' + esc(`Identificacion: ${receiverId}`) + ') Tj ET');
    ops.push('BT /F1 8 Tf 322 600 Td (' + esc(`Correo: ${receiverEmail.slice(0, 40)}`) + ') Tj ET');
    const statusLabel = voucher.status === 'cancelled' ? 'ANULADO (NOTA DE CREDITO)' : 'ACEPTADO HACIENDA';
    ops.push('BT /F2 8 Tf 322 584 Td (' + esc(`Estado Fiscal: ${statusLabel}`) + ') Tj ET');

    let y = 550;

    if (voucher.referenceKey || metadata.referenceKey) {
      const refK = voucher.referenceKey || metadata.referenceKey;
      ops.push('0.99 0.94 0.92 rg');
      ops.push(`36 ${y - 16} 540 22 re f`);
      ops.push('0.65 0.15 0.15 rg');
      ops.push(`BT /F2 8.5 Tf 44 ${y - 8} Td (` + esc(`DOCUMENTO DE REFERENCIA ANULADO (CLAVE): ${refK}`) + ') Tj ET');
      y -= 30;
    }

    // Table Header
    ops.push('0.12 0.18 0.32 rg');
    ops.push(`36 ${y - 18} 540 22 re f`);
    ops.push('1 1 1 rg');
    ops.push(`BT /F2 8.5 Tf 44 ${y - 10} Td (CANT.) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 86 ${y - 10} Td (CABYS) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 168 ${y - 10} Td (DESCRIPCION) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 385 ${y - 10} Td (PRECIO UNIT.) Tj ET`);
    ops.push(`BT /F2 8.5 Tf 485 ${y - 10} Td (SUBTOTAL) Tj ET`);

    y -= 34;
    ops.push('0.15 0.18 0.22 rg');

    for (const item of rawItems.slice(0, 14)) {
      const qty = Number(item.quantity || 1);
      const cabys = String(item.cabysCode || item.cabys_code || '8311100000000').slice(0, 13);
      const desc = String(item.description || item.detail || 'Item').slice(0, 42);
      const unitP = Number(item.unitPrice ?? item.unit_price ?? 0);
      const lineSub = Number(item.lineSubtotal ?? (qty * unitP));

      ops.push(`BT /F1 8 Tf 44 ${y} Td (${esc(qty)}) Tj ET`);
      ops.push(`BT /F1 7.5 Tf 86 ${y} Td (${esc(cabys)}) Tj ET`);
      ops.push(`BT /F1 8 Tf 168 ${y} Td (${esc(desc)}) Tj ET`);
      ops.push(`BT /F1 8 Tf 385 ${y} Td (${esc(fmtMoney(unitP))}) Tj ET`);
      ops.push(`BT /F1 8 Tf 485 ${y} Td (${esc(fmtMoney(lineSub))}) Tj ET`);

      ops.push('0.90 0.92 0.95 RG 0.5 w');
      ops.push(`36 ${y - 6} 540 0 re S`);
      y -= 18;
    }

    // Totals Box
    const totY = Math.min(y - 12, 230);
    ops.push('0.95 0.96 0.98 rg');
    ops.push(`340 ${totY - 62} 236 70 re f`);
    ops.push('0.82 0.85 0.90 RG 0.8 w');
    ops.push(`340 ${totY - 62} 236 70 re S`);

    ops.push('0.15 0.18 0.22 rg');
    ops.push(`BT /F1 9 Tf 352 ${totY - 12} Td (Subtotal Neto:) Tj ET`);
    ops.push(`BT /F1 9 Tf 465 ${totY - 12} Td (${esc(fmtMoney(voucher.subtotal))}) Tj ET`);

    ops.push(`BT /F1 9 Tf 352 ${totY - 28} Td (Impuesto IVA:) Tj ET`);
    ops.push(`BT /F1 9 Tf 465 ${totY - 28} Td (${esc(fmtMoney(voucher.taxAmount))}) Tj ET`);

    ops.push('0.08 0.14 0.28 rg');
    ops.push(`BT /F2 10.5 Tf 352 ${totY - 48} Td (TOTAL COMPROBANTE:) Tj ET`);
    ops.push(`BT /F2 10.5 Tf 465 ${totY - 48} Td (${esc(fmtMoney(voucher.totalAmount))}) Tj ET`);

    // Legal Footer
    ops.push('0.45 0.48 0.54 rg');
    ops.push('BT /F1 7.5 Tf 36 65 Td (Autorizado mediante resolucion DGT-R-033-2019 y Anexos v4.4 de la Direccion General de Tributacion - Ministerio de Hacienda Costa Rica.) Tj ET');
    ops.push('BT /F1 7.5 Tf 36 52 Td (Representacion grafica de Comprobante Electronico generado por el motor nativo BETICO / ListoCR.) Tj ET');

    const contentStream = ops.join('\n');
    const streamBytes = Buffer.from(contentStream, 'latin1');

    const chunks: Buffer[] = [];
    const offsets: number[] = [0];
    let currentOffset = 0;

    const pushStr = (s: string) => {
      const b = Buffer.from(s, 'latin1');
      chunks.push(b);
      currentOffset += b.length;
    };

    const startObj = (id: number) => {
      offsets[id] = currentOffset;
      pushStr(`${id} 0 obj\n`);
    };

    pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

    startObj(1);
    pushStr('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    startObj(2);
    pushStr('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

    startObj(3);
    pushStr('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');

    startObj(4);
    pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

    startObj(5);
    pushStr('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

    startObj(6);
    pushStr(`<< /Length ${streamBytes.length} >>\nstream\n`);
    chunks.push(streamBytes);
    currentOffset += streamBytes.length;
    pushStr('\nendstream\nendobj\n');

    const xrefOffset = currentOffset;
    pushStr('xref\n0 7\n0000000000 65535 f \n');
    for (let i = 1; i <= 6; i++) {
      const off = String(offsets[i] || 0).padStart(10, '0');
      pushStr(`${off} 00000 n \n`);
    }
    pushStr(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

    return Buffer.concat(chunks);
  }

  /**
   * Secure proxy method to retrieve the official PDF voucher from Almendro or generate native PDF.
   * Resolves the voucher record by numericKey (16/50 digits), voucher_key (50 digits), or UUID.
   */
  static async getVoucherPdf(
    keyOrId: string
  ): Promise<{
    success: boolean;
    buffer?: Buffer;
    contentType?: string;
    filename?: string;
    status?: number;
    message?: string;
  }> {
    try {
      if (!keyOrId || !keyOrId.trim()) {
        return { success: false, status: 400, message: 'Clave o identificador de comprobante requerido' };
      }

      const voucher = await getElectronicVoucherByKeyOrId(keyOrId.trim());
      if (!voucher) {
        return { success: false, status: 404, message: 'Comprobante electrónico no encontrado' };
      }

      const metadata = (voucher.metadata || {}) as any;
      const config = await getTenantAlmendroConfigRaw(voucher.tenantId);
      const isNativeVoucher = metadata?.emittedVia === 'BETICO_NATIVE' || !config || !config.apiKey || !config.apiKey.trim();

      if (isNativeVoucher) {
        const { getHaciendaConfigByTenant } = await import('../db/hacienda-native.repo.js');
        const haciendaConfig = await getHaciendaConfigByTenant(voucher.tenantId);
        const pdfBuffer = this.buildNativePdfBuffer(voucher, haciendaConfig);
        const prefix = voucher.docType === '01' ? 'Factura' : voucher.docType === '03' ? 'NotaCredito' : 'Tiquete';
        const filename = `${prefix}-${voucher.consecutiveNumber || voucher.numericKey || 'CR'}.pdf`;
        return {
          success: true,
          buffer: pdfBuffer,
          contentType: 'application/pdf',
          filename
        };
      }

      // Extract 50-digit voucher key from metadata or fallback to numericKey
      const voucherKey50 = metadata?.data?.voucher_key || metadata?.voucher_key;
      const effectiveKey = voucherKey50 || voucher.numericKey;

      if (!effectiveKey) {
        return { success: false, status: 400, message: 'El comprobante no cuenta con clave de documento registrada' };
      }

      const baseUrl = getBaseUrl(config.environment);
      const cleanKey = config.apiKey.trim();

      // Primary attempt: using the configured environment (Sandbox or Production)
      const primaryUrl = `${baseUrl}/vouchers/${effectiveKey}/pdf`;
      let res = await fetch(primaryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Accept': 'application/pdf, application/json'
        }
      });

      // If primary returned 404, attempt fallback to the other baseUrl (in case environment was toggled)
      if (res.status === 404) {
        const fallbackBase = config.environment === 'PRODUCTION' ? ALMENDRO_SANDBOX_URL : ALMENDRO_PROD_URL;
        const fallbackUrl = `${fallbackBase}/vouchers/${effectiveKey}/pdf`;
        try {
          const fallbackRes = await fetch(fallbackUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${cleanKey}`,
              'Accept': 'application/pdf, application/json'
            }
          });
          if (fallbackRes.status === 200) {
            res = fallbackRes;
          }
        } catch (_) {}
      }

      if (res.status === 200) {
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const filename = `Factura-${voucher.consecutiveNumber || voucher.numericKey || 'CR'}.pdf`;
        return {
          success: true,
          buffer,
          contentType: 'application/pdf',
          filename
        };
      }

      // Fallback to native PDF generator if Almendro doesn't have the PDF
      const { getHaciendaConfigByTenant } = await import('../db/hacienda-native.repo.js');
      const haciendaConfig = await getHaciendaConfigByTenant(voucher.tenantId);
      const fallbackBuffer = this.buildNativePdfBuffer(voucher, haciendaConfig);
      const filename = `Comprobante-${voucher.consecutiveNumber || voucher.numericKey || 'CR'}.pdf`;
      return {
        success: true,
        buffer: fallbackBuffer,
        contentType: 'application/pdf',
        filename
      };
    } catch (err: any) {
      console.error('[AlmendroService] Error al obtener PDF de comprobante:', err);
      return {
        success: false,
        status: 500,
        message: `Error interno de conexión con el proveedor de facturación: ${err.message}`
      };
    }
  }
}

export default AlmendroService;
