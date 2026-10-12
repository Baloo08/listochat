import { query } from './pool.js';
import { encrypt, decrypt } from '../services/encryption.js';
import { getTodayCR, getNowCR } from '../services/timezone.service.js';

export interface TenantHaciendaConfig {
  id: string;
  tenantId: string;
  environment: 'sandbox' | 'production';
  taxpayerIdType: '01' | '02' | '03' | '04'; // Física, Jurídica, DIMEX, NITE
  taxpayerIdNumber: string;
  taxpayerName: string;
  commercialName?: string;
  taxpayerEmail: string;
  taxpayerPhone?: string;
  economicActivityCode: string;
  province: string;
  canton: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  idpUsername: string;
  idpPasswordMasked?: string;
  p12Filename?: string;
  p12ExpiresAt?: string | null;
  p12HasCertificate: boolean;
  branchCode: string;
  posCode: string;
  defaultDocType: '01' | '04';
  isConnected: boolean;
  lastTestAt?: string | null;
  lastTestMessage?: string | null;
  providerMode: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
  useAlternativeProvider: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCycleUsage {
  emitted: number;
  quota: number;
  remaining: number;
  inCourtesy: boolean;
  courtesyUsed: number;
  courtesyAvailable: number;
  isBlocked: boolean;
  cycleStartDate: string;
  cycleEndDate: string;
  planName: string;
}

/**
 * Obtiene la configuración de Hacienda Nativo del inquilino (máscara de seguridad aplicada).
 */
export async function getHaciendaConfigByTenant(tenantId: string): Promise<TenantHaciendaConfig | null> {
  const res = await query(
    `SELECT * FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  return {
    id: row.id,
    tenantId: row.tenant_id,
    environment: row.environment || 'sandbox',
    taxpayerIdType: row.taxpayer_id_type || '01',
    taxpayerIdNumber: row.taxpayer_id_number || '',
    taxpayerName: row.taxpayer_name || '',
    commercialName: row.commercial_name || '',
    taxpayerEmail: row.taxpayer_email || '',
    taxpayerPhone: row.taxpayer_phone || '',
    economicActivityCode: row.economic_activity_code || '',
    province: row.province || '1',
    canton: row.canton || '01',
    district: row.district || '01',
    neighborhood: row.neighborhood || '01',
    addressDetail: row.address_detail || '',
    idpUsername: row.idp_username || '',
    idpPasswordMasked: row.idp_password_encrypted ? '••••••••' : '',
    p12Filename: row.p12_filename || '',
    p12ExpiresAt: row.p12_expires_at ? row.p12_expires_at.toISOString() : null,
    p12HasCertificate: Boolean(row.p12_encrypted_blob || row.p12_filename),
    branchCode: row.branch_code || '001',
    posCode: row.pos_code || '00001',
    defaultDocType: row.default_doc_type || '04',
    isConnected: Boolean(row.is_connected),
    lastTestAt: row.last_test_at ? row.last_test_at.toISOString() : null,
    lastTestMessage: row.last_test_message || null,
    providerMode: row.provider_mode || 'BETICO_NATIVE',
    useAlternativeProvider: Boolean(row.use_alternative_provider),
    active: Boolean(row.active),
    createdAt: row.created_at ? row.created_at.toISOString() : '',
    updatedAt: row.updated_at ? row.updated_at.toISOString() : ''
  };
}

/**
 * Obtiene el certificado .p12 y contraseñas descifradas en memoria RAM exclusivamente.
 */
export async function getHaciendaDecryptedSecrets(tenantId: string): Promise<{
  p12Buffer: Buffer | null;
  p12Pin: string;
  idpPassword: string;
  idpUsername: string;
  environment: 'sandbox' | 'production';
} | null> {
  const res = await query(
    `SELECT p12_encrypted_blob, p12_pin_encrypted, idp_username, idp_password_encrypted, environment 
     FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let p12Buffer: Buffer | null = null;
  if (row.p12_encrypted_blob) {
    try {
      const rawEncrypted = row.p12_encrypted_blob.toString('utf8');
      const decryptedBase64 = decrypt(rawEncrypted);
      p12Buffer = Buffer.from(decryptedBase64, 'base64');
    } catch (e: any) {
      console.error('[HaciendaRepo] Error descifrando certificado .p12:', e.message);
    }
  }

  const p12Pin = row.p12_pin_encrypted ? decrypt(row.p12_pin_encrypted) : '';
  const idpPassword = row.idp_password_encrypted ? decrypt(row.idp_password_encrypted) : '';

  return {
    p12Buffer,
    p12Pin,
    idpPassword,
    idpUsername: row.idp_username || '',
    environment: row.environment || 'sandbox'
  };
}

/**
 * Guarda o actualiza la configuración de Hacienda nativa del inquilino.
 */
export async function saveHaciendaConfig(
  tenantId: string,
  data: {
    environment?: 'sandbox' | 'production';
    taxpayerIdType?: '01' | '02' | '03' | '04';
    taxpayerIdNumber?: string;
    taxpayerName?: string;
    commercialName?: string;
    taxpayerEmail?: string;
    taxpayerPhone?: string;
    economicActivityCode?: string;
    province?: string;
    canton?: string;
    district?: string;
    neighborhood?: string;
    addressDetail?: string;
    idpUsername?: string;
    idpPassword?: string;
    p12Buffer?: Buffer;
    p12Filename?: string;
    p12Pin?: string;
    p12ExpiresAt?: Date;
    branchCode?: string;
    posCode?: string;
    defaultDocType?: '01' | '04';
    providerMode?: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
    useAlternativeProvider?: boolean;
    active?: boolean;
  }
): Promise<TenantHaciendaConfig> {
  // 1. Obtener registro previo si existe
  const existingRes = await query(
    `SELECT * FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );
  const existing = existingRes.rows[0] || {};

  const environment = data.environment || existing.environment || 'sandbox';
  const taxpayerIdType = data.taxpayerIdType || existing.taxpayer_id_type || '01';
  const taxpayerIdNumber = data.taxpayerIdNumber !== undefined ? data.taxpayerIdNumber.trim() : (existing.taxpayer_id_number || '');
  const taxpayerName = data.taxpayerName !== undefined ? data.taxpayerName.trim() : (existing.taxpayer_name || '');
  const commercialName = data.commercialName !== undefined ? data.commercialName.trim() : (existing.commercial_name || '');
  const taxpayerEmail = data.taxpayerEmail !== undefined ? data.taxpayerEmail.trim() : (existing.taxpayer_email || '');
  const taxpayerPhone = data.taxpayerPhone !== undefined ? data.taxpayerPhone.trim() : (existing.taxpayer_phone || '');
  const economicActivityCode = data.economicActivityCode !== undefined ? data.economicActivityCode.trim() : (existing.economic_activity_code || '');
  const province = data.province || existing.province || '1';
  const canton = data.canton || existing.canton || '01';
  const district = data.district || existing.district || '01';
  const neighborhood = data.neighborhood || existing.neighborhood || '01';
  const addressDetail = data.addressDetail !== undefined ? data.addressDetail.trim() : (existing.address_detail || '');
  const branchCode = data.branchCode || existing.branch_code || '001';
  const posCode = data.posCode || existing.pos_code || '00001';
  const defaultDocType = data.defaultDocType || existing.default_doc_type || '04';
  const providerMode = data.providerMode || existing.provider_mode || 'BETICO_NATIVE';
  const useAlternativeProvider = data.useAlternativeProvider !== undefined ? Boolean(data.useAlternativeProvider) : Boolean(existing.use_alternative_provider);
  const active = data.active !== undefined ? Boolean(data.active) : (existing.active !== undefined ? Boolean(existing.active) : true);

  // ATV Username y Password
  const idpUsername = data.idpUsername !== undefined ? data.idpUsername.trim() : (existing.idp_username || '');
  let idpPasswordEncrypted = existing.idp_password_encrypted || '';
  if (data.idpPassword && data.idpPassword.trim()) {
    idpPasswordEncrypted = encrypt(data.idpPassword.trim());
  }

  // Certificado .p12 y PIN
  let p12EncryptedBlob = existing.p12_encrypted_blob;
  let p12Filename = existing.p12_filename || '';
  let p12ExpiresAt = existing.p12_expires_at || null;

  if (data.p12Buffer && data.p12Buffer.length > 0) {
    const base64Str = data.p12Buffer.toString('base64');
    const encryptedStr = encrypt(base64Str);
    p12EncryptedBlob = Buffer.from(encryptedStr, 'utf8');
    p12Filename = data.p12Filename || 'certificado.p12';
    if (data.p12ExpiresAt) {
      p12ExpiresAt = data.p12ExpiresAt;
    }
  }

  let p12PinEncrypted = existing.p12_pin_encrypted || '';
  if (data.p12Pin && data.p12Pin.trim()) {
    p12PinEncrypted = encrypt(data.p12Pin.trim());
  }

  await query(
    `INSERT INTO tenant_hacienda_configs (
      tenant_id, environment, taxpayer_id_type, taxpayer_id_number, taxpayer_name, commercial_name,
      taxpayer_email, taxpayer_phone, economic_activity_code, province, canton, district, neighborhood,
      address_detail, idp_username, idp_password_encrypted, p12_encrypted_blob, p12_pin_encrypted,
      p12_filename, p12_expires_at, branch_code, pos_code, default_doc_type, provider_mode,
      use_alternative_provider, active, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      environment = EXCLUDED.environment,
      taxpayer_id_type = EXCLUDED.taxpayer_id_type,
      taxpayer_id_number = EXCLUDED.taxpayer_id_number,
      taxpayer_name = EXCLUDED.taxpayer_name,
      commercial_name = EXCLUDED.commercial_name,
      taxpayer_email = EXCLUDED.taxpayer_email,
      taxpayer_phone = EXCLUDED.taxpayer_phone,
      economic_activity_code = EXCLUDED.economic_activity_code,
      province = EXCLUDED.province,
      canton = EXCLUDED.canton,
      district = EXCLUDED.district,
      neighborhood = EXCLUDED.neighborhood,
      address_detail = EXCLUDED.address_detail,
      idp_username = EXCLUDED.idp_username,
      idp_password_encrypted = EXCLUDED.idp_password_encrypted,
      p12_encrypted_blob = COALESCE(EXCLUDED.p12_encrypted_blob, tenant_hacienda_configs.p12_encrypted_blob),
      p12_pin_encrypted = EXCLUDED.p12_pin_encrypted,
      p12_filename = COALESCE(EXCLUDED.p12_filename, tenant_hacienda_configs.p12_filename),
      p12_expires_at = COALESCE(EXCLUDED.p12_expires_at, tenant_hacienda_configs.p12_expires_at),
      branch_code = EXCLUDED.branch_code,
      pos_code = EXCLUDED.pos_code,
      default_doc_type = EXCLUDED.default_doc_type,
      provider_mode = EXCLUDED.provider_mode,
      use_alternative_provider = EXCLUDED.use_alternative_provider,
      active = EXCLUDED.active,
      updated_at = CURRENT_TIMESTAMP`,
    [
      tenantId, environment, taxpayerIdType, taxpayerIdNumber, taxpayerName, commercialName,
      taxpayerEmail, taxpayerPhone, economicActivityCode, province, canton, district, neighborhood,
      addressDetail, idpUsername, idpPasswordEncrypted, p12EncryptedBlob, p12PinEncrypted,
      p12Filename, p12ExpiresAt, branchCode, posCode, defaultDocType, providerMode,
      useAlternativeProvider, active
    ]
  );

  return (await getHaciendaConfigByTenant(tenantId))!;
}

/**
 * Actualiza el resultado del test de conexión con Hacienda.
 */
export async function updateConnectionTestResult(tenantId: string, isConnected: boolean, message: string): Promise<void> {
  await query(
    `UPDATE tenant_hacienda_configs 
     SET is_connected = $1, last_test_at = CURRENT_TIMESTAMP, last_test_message = $2, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $3`,
    [isConnected, message, tenantId]
  );
}

/**
 * Obtiene la cuota del plan y margen de cortesía configurados globalmente o por inquilino.
 */
export async function getTenantPlanQuota(tenantId: string): Promise<{
  quota: number;
  courtesyMargin: number;
  planName: string;
}> {
  // 1. Obtener datos del inquilino (plan y posible cuota personalizada)
  const tenantRes = await query(
    `SELECT plan, custom_invoices_quota FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (tenantRes.rows.length === 0) {
    return { quota: 100, courtesyMargin: 10, planName: 'pro' };
  }

  const { plan, custom_invoices_quota } = tenantRes.rows[0];
  const normalizedPlan = (plan || 'pro').toLowerCase();

  // Si tiene cuota personalizada específica en su expediente, esa prevalece
  if (custom_invoices_quota !== null && custom_invoices_quota !== undefined && Number(custom_invoices_quota) > 0) {
    return {
      quota: Number(custom_invoices_quota),
      courtesyMargin: 10,
      planName: normalizedPlan
    };
  }

  // 2. Leer configuraciones globales de platform_settings
  const settingsRes = await query(
    `SELECT key, value FROM platform_settings WHERE key IN (
      'plan_starter_invoices_quota',
      'plan_pro_invoices_quota',
      'plan_enterprise_invoices_quota',
      'plan_aliado_invoices_quota',
      'courtesy_invoices_margin'
    )`
  );

  const settingsMap: Record<string, number> = {};
  for (const row of settingsRes.rows) {
    settingsMap[row.key] = parseInt(row.value, 10);
  }

  const courtesyMargin = settingsMap['courtesy_invoices_margin'] || 10;

  let quota = 100;
  if (normalizedPlan === 'starter' || normalizedPlan === 'emprendedor') {
    quota = settingsMap['plan_starter_invoices_quota'] || 50;
  } else if (normalizedPlan === 'enterprise' || normalizedPlan === 'business' || normalizedPlan === 'empresa') {
    quota = settingsMap['plan_enterprise_invoices_quota'] || 250;
  } else if (normalizedPlan === 'aliado') {
    quota = settingsMap['plan_aliado_invoices_quota'] || 500;
  } else {
    quota = settingsMap['plan_pro_invoices_quota'] || 100;
  }

  return {
    quota,
    courtesyMargin,
    planName: normalizedPlan
  };
}

/**
 * Obtiene o inicializa el ciclo actual de uso alineado con la fecha de corte del inquilino (next_billing_date).
 */
export async function getCycleUsage(tenantId: string): Promise<BillingCycleUsage> {
  const { quota, courtesyMargin, planName } = await getTenantPlanQuota(tenantId);

  // Obtener next_billing_date del inquilino
  const tenantRes = await query(
    `SELECT next_billing_date, created_at FROM tenants WHERE id = $1`,
    [tenantId]
  );

  const nextBilling = tenantRes.rows[0]?.next_billing_date 
    ? new Date(tenantRes.rows[0].next_billing_date)
    : new Date(Date.now() + 30 * 86400000);

  // Ciclo termina en nextBillingDate y empezó 30 días antes (o un mes antes)
  const cycleEndDate = nextBilling.toISOString().split('T')[0];
  const startDateObj = new Date(nextBilling);
  startDateObj.setDate(startDateObj.getDate() - 30);
  const cycleStartDate = startDateObj.toISOString().split('T')[0];

  // Buscar o crear registro para este ciclo
  const usageRes = await query(
    `SELECT invoices_emitted, courtesy_used, quota_limit 
     FROM hacienda_usage_cycles 
     WHERE tenant_id = $1 AND cycle_start_date = $2`,
    [tenantId, cycleStartDate]
  );

  let emitted = 0;
  let courtesyUsed = 0;

  if (usageRes.rows.length === 0) {
    await query(
      `INSERT INTO hacienda_usage_cycles (tenant_id, cycle_start_date, cycle_end_date, quota_limit)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, cycle_start_date) DO NOTHING`,
      [tenantId, cycleStartDate, cycleEndDate, quota]
    );
  } else {
    emitted = Number(usageRes.rows[0].invoices_emitted || 0);
    courtesyUsed = Number(usageRes.rows[0].courtesy_used || 0);
  }

  const remaining = Math.max(0, quota - emitted);
  const inCourtesy = emitted >= quota;
  const courtesyAvailable = Math.max(0, courtesyMargin - courtesyUsed);
  const isBlocked = emitted >= quota && courtesyUsed >= courtesyMargin;

  return {
    emitted,
    quota,
    remaining,
    inCourtesy,
    courtesyUsed,
    courtesyAvailable,
    isBlocked,
    cycleStartDate,
    cycleEndDate,
    planName
  };
}

/**
 * Incrementa el conteo de emisión de un comprobante dentro del ciclo actual.
 */
export async function incrementInvoiceUsage(tenantId: string): Promise<{
  success: boolean;
  emitted: number;
  inCourtesy: boolean;
  courtesyUsed: number;
  blocked: boolean;
}> {
  const usage = await getCycleUsage(tenantId);

  if (usage.isBlocked) {
    return {
      success: false,
      emitted: usage.emitted,
      inCourtesy: true,
      courtesyUsed: usage.courtesyUsed,
      blocked: true
    };
  }

  if (usage.emitted < usage.quota) {
    // Incremento normal dentro de la cuota
    await query(
      `UPDATE hacienda_usage_cycles 
       SET invoices_emitted = invoices_emitted + 1, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND cycle_start_date = $2`,
      [tenantId, usage.cycleStartDate]
    );
    return {
      success: true,
      emitted: usage.emitted + 1,
      inCourtesy: false,
      courtesyUsed: usage.courtesyUsed,
      blocked: false
    };
  } else {
    // Uso del margen de cortesía de 10 documentos
    await query(
      `UPDATE hacienda_usage_cycles 
       SET invoices_emitted = invoices_emitted + 1, courtesy_used = courtesy_used + 1, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1 AND cycle_start_date = $2`,
      [tenantId, usage.cycleStartDate]
    );
    return {
      success: true,
      emitted: usage.emitted + 1,
      inCourtesy: true,
      courtesyUsed: usage.courtesyUsed + 1,
      blocked: false
    };
  }
}
