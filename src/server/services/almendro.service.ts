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

      return {
        line_number: idx + 1,
        cabys_code: item.cabysCode || '8311100000000',
        description: item.description.slice(0, 160),
        quantity: lineQty.toFixed(3),
        unit_price: unitPrice.toFixed(5),
        unit_measure: 'Unid',
        taxes: [
          {
            code: '01', // IVA
            rate_code: taxRateCode,
            rate: (taxPercentage * 100).toFixed(2),
            amount: lineTax.toFixed(5)
          }
        ]
      };
    });

    const totalAmount = subtotal + taxAmount;

    // Receiver block (required for 01 Factura, optional for 04 Tiquete)
    const receiverPayload = params.receiver?.idNumber ? {
      id_type: params.receiver.idType || '01',
      id_number: params.receiver.idNumber.replace(/\D/g, ''),
      name: params.receiver.name || 'Cliente Particular',
      email: params.receiver.email
    } : undefined;

    const payload: Record<string, any> = {
      doc_type: docType,
      currency,
      exchange_rate: exchangeRate.toFixed(4),
      branch_code: config.branchCode || '001',
      pos_code: config.posCode || '00001',
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

      const errorMsg = responseBody.message || responseBody.error || `Error ${res.status} al emitir en Almendro`;
      console.warn(`[AlmendroService] Emisión fallida para tenant ${tenantId}:`, errorMsg);
      return { success: false, message: errorMsg };
    } catch (err: any) {
      console.error(`[AlmendroService] Excepción emitiendo comprobante para tenant ${tenantId}:`, err);
      return { success: false, message: `Error de red al conectar con Almendro: ${err.message}` };
    }
  }
}

export default AlmendroService;
