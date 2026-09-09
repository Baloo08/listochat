import { query } from './pool.js';
import { CryptoService } from '../services/crypto.service.js';
import { TenantAlmendroConfig, ElectronicVoucher, AlmendroModuleToggles } from '../../shared/types.js';

const DEFAULT_MODULE_TOGGLES: AlmendroModuleToggles = {
  storeEnabled: true,
  bookingsEnabled: true,
  courtsEnabled: false,
  restaurantEnabled: false,
  subscriptionsEnabled: false
};

/**
 * Retrieves the masked Almendro configuration for a tenant.
 * Safe for UI display (secrets are masked).
 */
export async function getTenantAlmendroConfig(tenantId: string): Promise<TenantAlmendroConfig | null> {
  if (!tenantId) throw new Error('tenantId es requerido para consultar la configuración de Almendro');

  const res = await query(`
    SELECT id, tenant_id as "tenantId", is_enabled as "isEnabled", environment,
           api_key_encrypted as "apiKeyEncrypted", default_doc_type as "defaultDocType",
           module_toggles as "moduleToggles", tax_id_type as "taxIdType",
           tax_id_number as "taxIdNumber", legal_name as "legalName",
           commercial_name as "commercialName", economic_activity_code as "economicActivityCode",
           branch_code as "branchCode", pos_code as "posCode",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM tenant_almendro_configs
    WHERE tenant_id = $1
  `, [tenantId]);

  if (res.rows.length === 0) {
    return {
      id: '',
      tenantId,
      isEnabled: false,
      environment: 'SANDBOX',
      apiKeyMasked: '',
      defaultDocType: '04',
      moduleToggles: { ...DEFAULT_MODULE_TOGGLES },
      isConfigured: false
    };
  }

  const row = res.rows[0];
  let rawKey = '';
  if (row.apiKeyEncrypted) {
    try {
      rawKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted);
    } catch (e) {
      console.error(`[AlmendroRepo] Error descifrando API Key para tenant ${tenantId}:`, e);
    }
  }

  const toggles: AlmendroModuleToggles = row.moduleToggles
    ? { ...DEFAULT_MODULE_TOGGLES, ...row.moduleToggles }
    : { ...DEFAULT_MODULE_TOGGLES };

  return {
    id: row.id,
    tenantId: row.tenantId,
    isEnabled: Boolean(row.isEnabled),
    environment: row.environment || 'SANDBOX',
    apiKeyMasked: rawKey ? CryptoService.maskSecret(rawKey) : '',
    defaultDocType: row.defaultDocType === '01' ? '01' : '04',
    moduleToggles: toggles,
    taxIdType: row.taxIdType || '',
    taxIdNumber: row.taxIdNumber || '',
    legalName: row.legalName || '',
    commercialName: row.commercialName || '',
    economicActivityCode: row.economicActivityCode || '',
    branchCode: row.branchCode || '001',
    posCode: row.posCode || '00001',
    isConfigured: Boolean(rawKey && rawKey.length > 5),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

/**
 * Internal helper for backend services. Decrypts credentials into memory.
 * NEVER expose this function's output to API endpoints or user responses.
 */
export async function getTenantAlmendroConfigRaw(tenantId: string): Promise<{
  apiKey: string;
  isEnabled: boolean;
  environment: 'SANDBOX' | 'PRODUCTION';
  defaultDocType: '01' | '04';
  moduleToggles: AlmendroModuleToggles;
  taxIdType?: string;
  taxIdNumber?: string;
  legalName?: string;
  commercialName?: string;
  economicActivityCode?: string;
  branchCode?: string;
  posCode?: string;
} | null> {
  if (!tenantId) return null;

  const res = await query(`
    SELECT is_enabled as "isEnabled", environment, api_key_encrypted as "apiKeyEncrypted",
           default_doc_type as "defaultDocType", module_toggles as "moduleToggles",
           tax_id_type as "taxIdType", tax_id_number as "taxIdNumber",
           legal_name as "legalName", commercial_name as "commercialName",
           economic_activity_code as "economicActivityCode",
           branch_code as "branchCode", pos_code as "posCode"
    FROM tenant_almendro_configs
    WHERE tenant_id = $1
  `, [tenantId]);

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let apiKey = '';
  if (row.apiKeyEncrypted) {
    try {
      apiKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted);
    } catch (e) {
      console.error(`[AlmendroRepo] Error descifrando API Key raw para tenant ${tenantId}`);
    }
  }

  const toggles: AlmendroModuleToggles = row.moduleToggles
    ? { ...DEFAULT_MODULE_TOGGLES, ...row.moduleToggles }
    : { ...DEFAULT_MODULE_TOGGLES };

  return {
    apiKey,
    isEnabled: Boolean(row.isEnabled),
    environment: row.environment || 'SANDBOX',
    defaultDocType: row.defaultDocType === '01' ? '01' : '04',
    moduleToggles: toggles,
    taxIdType: row.taxIdType,
    taxIdNumber: row.taxIdNumber,
    legalName: row.legalName,
    commercialName: row.commercialName,
    economicActivityCode: row.economicActivityCode,
    branchCode: row.branchCode || '001',
    posCode: row.posCode || '00001'
  };
}

/**
 * Saves or updates Almendro configuration for a tenant with AES-256-GCM encryption.
 */
export async function saveTenantAlmendroConfig(
  tenantId: string,
  data: {
    isEnabled: boolean;
    environment?: 'SANDBOX' | 'PRODUCTION';
    apiKey?: string;
    defaultDocType?: '01' | '04';
    moduleToggles?: Partial<AlmendroModuleToggles>;
    taxIdType?: string;
    taxIdNumber?: string;
    legalName?: string;
    commercialName?: string;
    economicActivityCode?: string;
    branchCode?: string;
    posCode?: string;
  }
): Promise<TenantAlmendroConfig> {
  if (!tenantId) throw new Error('tenantId es requerido para guardar la configuración de Almendro');

  // Check if there is an existing config
  const existing = await query(`SELECT api_key_encrypted, module_toggles FROM tenant_almendro_configs WHERE tenant_id = $1`, [tenantId]);
  
  let keyToEncrypt = existing.rows[0]?.api_key_encrypted || '';
  if (data.apiKey && data.apiKey.trim() && !data.apiKey.includes('••••')) {
    keyToEncrypt = CryptoService.encryptForTenant(tenantId, data.apiKey.trim());
  }

  const currentToggles = existing.rows[0]?.module_toggles || DEFAULT_MODULE_TOGGLES;
  const mergedToggles: AlmendroModuleToggles = {
    ...DEFAULT_MODULE_TOGGLES,
    ...currentToggles,
    ...(data.moduleToggles || {})
  };

  const env = data.environment || 'SANDBOX';
  const docType = data.defaultDocType === '01' ? '01' : '04';
  const branch = data.branchCode || '001';
  const pos = data.posCode || '00001';

  await query(`
    INSERT INTO tenant_almendro_configs (
      tenant_id, is_enabled, environment, api_key_encrypted,
      default_doc_type, module_toggles, tax_id_type, tax_id_number,
      legal_name, commercial_name, economic_activity_code,
      branch_code, pos_code, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      environment = EXCLUDED.environment,
      api_key_encrypted = CASE WHEN $4 != '' THEN $4 ELSE tenant_almendro_configs.api_key_encrypted END,
      default_doc_type = EXCLUDED.default_doc_type,
      module_toggles = EXCLUDED.module_toggles,
      tax_id_type = COALESCE(EXCLUDED.tax_id_type, tenant_almendro_configs.tax_id_type),
      tax_id_number = COALESCE(EXCLUDED.tax_id_number, tenant_almendro_configs.tax_id_number),
      legal_name = COALESCE(EXCLUDED.legal_name, tenant_almendro_configs.legal_name),
      commercial_name = COALESCE(EXCLUDED.commercial_name, tenant_almendro_configs.commercial_name),
      economic_activity_code = COALESCE(EXCLUDED.economic_activity_code, tenant_almendro_configs.economic_activity_code),
      branch_code = EXCLUDED.branch_code,
      pos_code = EXCLUDED.pos_code,
      updated_at = CURRENT_TIMESTAMP
  `, [
    tenantId,
    Boolean(data.isEnabled),
    env,
    keyToEncrypt,
    docType,
    JSON.stringify(mergedToggles),
    data.taxIdType || null,
    data.taxIdNumber || null,
    data.legalName || null,
    data.commercialName || null,
    data.economicActivityCode || null,
    branch,
    pos
  ]);

  const updated = await getTenantAlmendroConfig(tenantId);
  return updated!;
}

/**
 * Saves a newly issued electronic voucher.
 */
export async function saveElectronicVoucher(
  tenantId: string,
  voucher: {
    orderId?: string;
    appointmentId?: string;
    courtBookingId?: string;
    subscriptionChargeId?: string;
    docType: string;
    consecutiveNumber: string;
    numericKey: string;
    receiverIdType?: string;
    receiverIdNumber?: string;
    receiverName?: string;
    receiverEmail?: string;
    currency?: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    pdfUrl?: string;
    xmlSignedUrl?: string;
    xmlResponseUrl?: string;
    haciendaResponseCode?: string;
    haciendaResponseDetail?: string;
    metadata?: Record<string, any>;
  }
): Promise<ElectronicVoucher> {
  if (!tenantId) throw new Error('tenantId es requerido para registrar un comprobante electrónico');

  const res = await query(`
    INSERT INTO electronic_vouchers (
      tenant_id, order_id, appointment_id, court_booking_id, subscription_charge_id,
      doc_type, consecutive_number, numeric_key, receiver_id_type, receiver_id_number,
      receiver_name, receiver_email, currency, subtotal, tax_amount, total_amount,
      status, pdf_url, xml_signed_url, xml_response_url, hacienda_response_code,
      hacienda_response_detail, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
              court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
              doc_type as "docType", consecutive_number as "consecutiveNumber", numeric_key as "numericKey",
              receiver_id_type as "receiverIdType", receiver_id_number as "receiverIdNumber",
              receiver_name as "receiverName", receiver_email as "receiverEmail",
              currency, subtotal, tax_amount as "taxAmount", total_amount as "totalAmount",
              status, pdf_url as "pdfUrl", xml_signed_url as "xmlSignedUrl",
              xml_response_url as "xmlResponseUrl", hacienda_response_code as "haciendaResponseCode",
              hacienda_response_detail as "haciendaResponseDetail", metadata,
              created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId,
    voucher.orderId || null,
    voucher.appointmentId || null,
    voucher.courtBookingId || null,
    voucher.subscriptionChargeId || null,
    voucher.docType || '04',
    voucher.consecutiveNumber || '',
    voucher.numericKey,
    voucher.receiverIdType || null,
    voucher.receiverIdNumber || null,
    voucher.receiverName || null,
    voucher.receiverEmail || null,
    voucher.currency || 'CRC',
    voucher.subtotal || 0,
    voucher.taxAmount || 0,
    voucher.totalAmount || 0,
    voucher.status || 'pending',
    voucher.pdfUrl || null,
    voucher.xmlSignedUrl || null,
    voucher.xmlResponseUrl || null,
    voucher.haciendaResponseCode || null,
    voucher.haciendaResponseDetail || null,
    JSON.stringify(voucher.metadata || {})
  ]);

  return res.rows[0];
}

/**
 * Retrieves vouchers for a tenant with pagination and optional status filter.
 * Strictly filtered by tenant_id.
 */
export async function getElectronicVouchers(
  tenantId: string,
  options?: { limit?: number; offset?: number; status?: string; docType?: string }
): Promise<{ vouchers: ElectronicVoucher[]; total: number }> {
  if (!tenantId) throw new Error('tenantId es requerido para consultar comprobantes');

  const limit = Math.min(Number(options?.limit) || 50, 100);
  const offset = Math.max(Number(options?.offset) || 0, 0);

  const conditions = ['tenant_id = $1'];
  const params: any[] = [tenantId];
  let pIdx = 2;

  if (options?.status) {
    conditions.push(`status = $${pIdx}`);
    params.push(options.status);
    pIdx++;
  }

  if (options?.docType) {
    conditions.push(`doc_type = $${pIdx}`);
    params.push(options.docType);
    pIdx++;
  }

  const whereSql = conditions.join(' AND ');

  const countRes = await query(`SELECT COUNT(*) as total FROM electronic_vouchers WHERE ${whereSql}`, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  params.push(limit);
  params.push(offset);

  const res = await query(`
    SELECT id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
           court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
           doc_type as "docType", consecutive_number as "consecutiveNumber", numeric_key as "numericKey",
           receiver_id_type as "receiverIdType", receiver_id_number as "receiverIdNumber",
           receiver_name as "receiverName", receiver_email as "receiverEmail",
           currency, subtotal, tax_amount as "taxAmount", total_amount as "totalAmount",
           status, pdf_url as "pdfUrl", xml_signed_url as "xmlSignedUrl",
           xml_response_url as "xmlResponseUrl", hacienda_response_code as "haciendaResponseCode",
           hacienda_response_detail as "haciendaResponseDetail", metadata,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM electronic_vouchers
    WHERE ${whereSql}
    ORDER BY created_at DESC
    LIMIT $${pIdx} OFFSET $${pIdx + 1}
  `, params);

  return {
    vouchers: res.rows,
    total
  };
}

/**
 * Retrieves an electronic voucher by orderId strictly isolated by tenantId.
 */
export async function getElectronicVoucherByOrderId(
  tenantId: string,
  orderId: string
): Promise<ElectronicVoucher | null> {
  if (!tenantId || !orderId) return null;
  const res = await query(`
    SELECT id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
           court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
           doc_type as "docType", consecutive_number as "consecutiveNumber", numeric_key as "numericKey",
           receiver_id_type as "receiverIdType", receiver_id_number as "receiverIdNumber",
           receiver_name as "receiverName", receiver_email as "receiverEmail",
           currency, subtotal, tax_amount as "taxAmount", total_amount as "totalAmount",
           status, pdf_url as "pdfUrl", xml_signed_url as "xmlSignedUrl",
           xml_response_url as "xmlResponseUrl", hacienda_response_code as "haciendaResponseCode",
           hacienda_response_detail as "haciendaResponseDetail", metadata,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM electronic_vouchers
    WHERE tenant_id = $1 AND order_id = $2
    ORDER BY created_at DESC
    LIMIT 1
  `, [tenantId, orderId]);
  return res.rows[0] || null;
}

/**
 * Retrieves an electronic voucher by appointmentId strictly isolated by tenantId.
 */
export async function getElectronicVoucherByAppointmentId(
  tenantId: string,
  appointmentId: string
): Promise<ElectronicVoucher | null> {
  if (!tenantId || !appointmentId) return null;
  const res = await query(`
    SELECT id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
           court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
           doc_type as "docType", consecutive_number as "consecutiveNumber", numeric_key as "numericKey",
           receiver_id_type as "receiverIdType", receiver_id_number as "receiverIdNumber",
           receiver_name as "receiverName", receiver_email as "receiverEmail",
           currency, subtotal, tax_amount as "taxAmount", total_amount as "totalAmount",
           status, pdf_url as "pdfUrl", xml_signed_url as "xmlSignedUrl",
           xml_response_url as "xmlResponseUrl", hacienda_response_code as "haciendaResponseCode",
           hacienda_response_detail as "haciendaResponseDetail", metadata,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM electronic_vouchers
    WHERE tenant_id = $1 AND appointment_id = $2
    ORDER BY created_at DESC
    LIMIT 1
  `, [tenantId, appointmentId]);
  return res.rows[0] || null;
}

/**
 * Retrieves an electronic voucher by numericKey, 50-digit voucher_key, UUID, or order_id/appointment_id.
 * Used for public PDF downloads and status verification.
 */
export async function getElectronicVoucherByKeyOrId(
  keyOrId: string
): Promise<ElectronicVoucher | null> {
  if (!keyOrId || !keyOrId.trim()) return null;
  const clean = keyOrId.trim();

  const querySql = `
    SELECT id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
           court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
           doc_type as "docType", consecutive_number as "consecutiveNumber", numeric_key as "numericKey",
           receiver_id_type as "receiverIdType", receiver_id_number as "receiverIdNumber",
           receiver_name as "receiverName", receiver_email as "receiverEmail",
           currency, subtotal, tax_amount as "taxAmount", total_amount as "totalAmount",
           status, pdf_url as "pdfUrl", xml_signed_url as "xmlSignedUrl",
           xml_response_url as "xmlResponseUrl", hacienda_response_code as "haciendaResponseCode",
           hacienda_response_detail as "haciendaResponseDetail", metadata,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM electronic_vouchers
    WHERE numeric_key = $1
       OR id::text = $1
       OR order_id::text = $1
       OR appointment_id::text = $1
       OR metadata->'data'->>'voucher_key' = $1
       OR metadata->>'voucher_key' = $1
       OR metadata->>'key' = $1
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const res = await query(querySql, [clean]);
  return res.rows[0] || null;
}

