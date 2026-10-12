import { query } from './pool.js';
import { encrypt, decrypt } from '../services/encryption.js';
import { getTodayCR, getNowCR } from '../services/timezone.service.js';

export interface EconomicActivityItem {
  code: string;
  description: string;
  defaultCabys?: string;
}

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
  economicActivities: EconomicActivityItem[];
  defaultCabysCode: string;
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
  certSubject: string;
  certIssuer: string;
  certDaysRemaining: number | null;
  branchCode: string;
  posCode: string;
  defaultDocType: '01' | '04';
  seqFactura: number;
  seqTiquete: number;
  seqNotaCredito: number;
  multiBranchEnabled: boolean;
  isConnected: boolean;
  lastTestAt?: string | null;
  lastTestMessage?: string | null;
  providerMode: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
  useAlternativeProvider: boolean;
  isSimplifiedRegime: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HaciendaBranchConfig {
  id: string;
  tenantId: string;
  branchId: string | null;
  storeBranchName?: string | null;
  branchName: string;
  branchCode: string;
  posCode: string;
  commercialName: string;
  economicActivityCode: string;
  province: string;
  canton: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  seqFactura: number;
  seqTiquete: number;
  seqNotaCredito: number;
  useCustomCredentials: boolean;
  customTaxpayerIdType: '01' | '02' | '03' | '04';
  customTaxpayerIdNumber: string;
  customTaxpayerName: string;
  customIdpUsername: string;
  customIdpPasswordMasked: string;
  customP12Filename: string;
  customP12ExpiresAt: string | null;
  customP12HasCertificate: boolean;
  customCertSubject: string;
  customCertDaysRemaining: number | null;
  isConnected: boolean;
  lastTestAt: string | null;
  lastTestMessage: string | null;
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

function computeDaysRemaining(expiresAt?: Date | string | null): number | null {
  if (!expiresAt) return null;
  const dt = new Date(expiresAt);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 86400000);
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

  const p12ExpiresIso = row.p12_expires_at ? new Date(row.p12_expires_at).toISOString() : null;
  let economicActivities: EconomicActivityItem[] = [];
  if (Array.isArray(row.economic_activities_json)) {
    economicActivities = row.economic_activities_json;
  } else if (typeof row.economic_activities_json === 'string') {
    try {
      economicActivities = JSON.parse(row.economic_activities_json);
    } catch (_) {
      economicActivities = [];
    }
  }

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
    economicActivities,
    defaultCabysCode: row.default_cabys_code || '8311100000000',
    province: row.province || '1',
    canton: row.canton || '01',
    district: row.district || '01',
    neighborhood: row.neighborhood || '01',
    addressDetail: row.address_detail || '',
    idpUsername: row.idp_username || '',
    idpPasswordMasked: row.idp_password_encrypted ? '••••••••' : '',
    p12Filename: row.p12_filename || '',
    p12ExpiresAt: p12ExpiresIso,
    p12HasCertificate: Boolean(row.p12_encrypted_blob || row.p12_filename),
    certSubject: row.cert_subject || '',
    certIssuer: row.cert_issuer || '',
    certDaysRemaining: computeDaysRemaining(p12ExpiresIso),
    branchCode: row.branch_code || '001',
    posCode: row.pos_code || '00001',
    defaultDocType: row.default_doc_type || '04',
    seqFactura: Number(row.seq_factura || 1),
    seqTiquete: Number(row.seq_tiquete || 1),
    seqNotaCredito: Number(row.seq_nota_credito || 1),
    multiBranchEnabled: Boolean(row.multi_branch_enabled),
    isConnected: Boolean(row.is_connected),
    lastTestAt: row.last_test_at ? new Date(row.last_test_at).toISOString() : null,
    lastTestMessage: row.last_test_message || null,
    providerMode: row.provider_mode || 'BETICO_NATIVE',
    useAlternativeProvider: Boolean(row.use_alternative_provider),
    isSimplifiedRegime: Boolean(row.is_simplified_regime),
    active: Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
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
    economicActivities?: EconomicActivityItem[] | string;
    defaultCabysCode?: string;
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
    certSubject?: string;
    certIssuer?: string;
    branchCode?: string;
    posCode?: string;
    defaultDocType?: '01' | '04';
    seqFactura?: number;
    seqTiquete?: number;
    seqNotaCredito?: number;
    multiBranchEnabled?: boolean;
    providerMode?: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
    useAlternativeProvider?: boolean;
    isSimplifiedRegime?: boolean;
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

  let economicActivitiesJson = existing.economic_activities_json || [];
  if (data.economicActivities !== undefined) {
    if (typeof data.economicActivities === 'string') {
      try {
        economicActivitiesJson = JSON.parse(data.economicActivities);
      } catch (_) {
        economicActivitiesJson = [];
      }
    } else if (Array.isArray(data.economicActivities)) {
      economicActivitiesJson = data.economicActivities;
    }
  }

  const defaultCabysCode = data.defaultCabysCode !== undefined ? data.defaultCabysCode.trim() : (existing.default_cabys_code || '8311100000000');
  const province = data.province || existing.province || '1';
  const canton = data.canton || existing.canton || '01';
  const district = data.district || existing.district || '01';
  const neighborhood = data.neighborhood || existing.neighborhood || '01';
  const addressDetail = data.addressDetail !== undefined ? data.addressDetail.trim() : (existing.address_detail || '');
  const branchCode = String(data.branchCode || existing.branch_code || '001').replace(/\D/g, '').padStart(3, '0').slice(0, 3);
  const posCode = String(data.posCode || existing.pos_code || '00001').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
  const defaultDocType = data.defaultDocType || existing.default_doc_type || '04';
  const seqFactura = data.seqFactura !== undefined ? Math.max(1, Number(data.seqFactura) || 1) : Number(existing.seq_factura || 1);
  const seqTiquete = data.seqTiquete !== undefined ? Math.max(1, Number(data.seqTiquete) || 1) : Number(existing.seq_tiquete || 1);
  const seqNotaCredito = data.seqNotaCredito !== undefined ? Math.max(1, Number(data.seqNotaCredito) || 1) : Number(existing.seq_nota_credito || 1);
  const multiBranchEnabled = data.multiBranchEnabled !== undefined ? Boolean(data.multiBranchEnabled) : Boolean(existing.multi_branch_enabled);
  const providerMode = data.providerMode || existing.provider_mode || 'BETICO_NATIVE';
  const useAlternativeProvider = data.useAlternativeProvider !== undefined ? Boolean(data.useAlternativeProvider) : Boolean(existing.use_alternative_provider);
  const isSimplifiedRegime = data.isSimplifiedRegime !== undefined ? Boolean(data.isSimplifiedRegime) : Boolean(existing.is_simplified_regime);
  const active = data.active !== undefined ? Boolean(data.active) : (existing.active !== undefined ? Boolean(existing.active) : true);

  // ATV Username y Password
  const idpUsername = data.idpUsername !== undefined ? data.idpUsername.trim() : (existing.idp_username || '');
  let idpPasswordEncrypted = existing.idp_password_encrypted || '';
  if (data.idpPassword && data.idpPassword.trim() && !data.idpPassword.includes('••••')) {
    idpPasswordEncrypted = encrypt(data.idpPassword.trim());
  }

  // Certificado .p12 y PIN
  let p12EncryptedBlob = existing.p12_encrypted_blob;
  let p12Filename = existing.p12_filename || '';
  let p12ExpiresAt = existing.p12_expires_at || null;
  let certSubject = data.certSubject !== undefined ? data.certSubject : (existing.cert_subject || '');
  let certIssuer = data.certIssuer !== undefined ? data.certIssuer : (existing.cert_issuer || '');

  if (data.p12Buffer && data.p12Buffer.length > 0) {
    const base64Str = data.p12Buffer.toString('base64');
    const encryptedStr = encrypt(base64Str);
    p12EncryptedBlob = Buffer.from(encryptedStr, 'utf8');
    p12Filename = data.p12Filename || 'certificado.p12';
  }
  if (data.p12ExpiresAt) {
    p12ExpiresAt = data.p12ExpiresAt;
  }

  let p12PinEncrypted = existing.p12_pin_encrypted || '';
  if (data.p12Pin && data.p12Pin.trim() && !data.p12Pin.includes('••••')) {
    p12PinEncrypted = encrypt(data.p12Pin.trim());
  }

  await query(
    `INSERT INTO tenant_hacienda_configs (
      tenant_id, environment, taxpayer_id_type, taxpayer_id_number, taxpayer_name, commercial_name,
      taxpayer_email, taxpayer_phone, economic_activity_code, economic_activities_json, default_cabys_code,
      province, canton, district, neighborhood, address_detail, idp_username, idp_password_encrypted,
      p12_encrypted_blob, p12_pin_encrypted, p12_filename, p12_expires_at, cert_subject, cert_issuer,
      branch_code, pos_code, default_doc_type, seq_factura, seq_tiquete, seq_nota_credito,
      multi_branch_enabled, provider_mode, use_alternative_provider, is_simplified_regime, active, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10::jsonb, $11,
      $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, CURRENT_TIMESTAMP
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
      economic_activities_json = EXCLUDED.economic_activities_json,
      default_cabys_code = EXCLUDED.default_cabys_code,
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
      cert_subject = EXCLUDED.cert_subject,
      cert_issuer = EXCLUDED.cert_issuer,
      branch_code = EXCLUDED.branch_code,
      pos_code = EXCLUDED.pos_code,
      default_doc_type = EXCLUDED.default_doc_type,
      seq_factura = EXCLUDED.seq_factura,
      seq_tiquete = EXCLUDED.seq_tiquete,
      seq_nota_credito = EXCLUDED.seq_nota_credito,
      multi_branch_enabled = EXCLUDED.multi_branch_enabled,
      provider_mode = EXCLUDED.provider_mode,
      use_alternative_provider = EXCLUDED.use_alternative_provider,
      is_simplified_regime = EXCLUDED.is_simplified_regime,
      active = EXCLUDED.active,
      updated_at = CURRENT_TIMESTAMP`,
    [
      tenantId, environment, taxpayerIdType, taxpayerIdNumber, taxpayerName, commercialName,
      taxpayerEmail, taxpayerPhone, economicActivityCode, JSON.stringify(economicActivitiesJson), defaultCabysCode,
      province, canton, district, neighborhood, addressDetail, idpUsername, idpPasswordEncrypted,
      p12EncryptedBlob, p12PinEncrypted, p12Filename, p12ExpiresAt, certSubject, certIssuer,
      branchCode, posCode, defaultDocType, seqFactura, seqTiquete, seqNotaCredito,
      multiBranchEnabled, providerMode, useAlternativeProvider, isSimplifiedRegime, active
    ]
  );

  return (await getHaciendaConfigByTenant(tenantId))!;
}

/**
 * Limpia credenciales ATV, certificado .p12 o ambos para permitir reemplazo limpio.
 */
export async function clearHaciendaCredentials(
  tenantId: string,
  target: 'atv' | 'p12' | 'all'
): Promise<TenantHaciendaConfig | null> {
  if (target === 'atv') {
    await query(
      `UPDATE tenant_hacienda_configs
       SET idp_username = '', idp_password_encrypted = '', is_connected = false, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [tenantId]
    );
  } else if (target === 'p12') {
    await query(
      `UPDATE tenant_hacienda_configs
       SET p12_encrypted_blob = NULL, p12_pin_encrypted = '', p12_filename = '', p12_expires_at = NULL,
           cert_subject = '', cert_issuer = '', is_connected = false, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [tenantId]
    );
  } else {
    await query(
      `UPDATE tenant_hacienda_configs
       SET idp_username = '', idp_password_encrypted = '',
           p12_encrypted_blob = NULL, p12_pin_encrypted = '', p12_filename = '', p12_expires_at = NULL,
           cert_subject = '', cert_issuer = '', is_connected = false, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [tenantId]
    );
  }

  return getHaciendaConfigByTenant(tenantId);
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

// ============================================================================
// MULTI-SUCURSAL / TERMINALES HACIENDA (DGT v4.4)
// ============================================================================

function mapHaciendaBranchRow(row: any): HaciendaBranchConfig {
  const expiresIso = row.custom_p12_expires_at ? new Date(row.custom_p12_expires_at).toISOString() : null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id || null,
    storeBranchName: row.store_branch_name || null,
    branchName: row.branch_name || 'Sucursal',
    branchCode: row.branch_code || '002',
    posCode: row.pos_code || '00001',
    commercialName: row.commercial_name || '',
    economicActivityCode: row.economic_activity_code || '',
    province: row.province || '1',
    canton: row.canton || '01',
    district: row.district || '01',
    neighborhood: row.neighborhood || '01',
    addressDetail: row.address_detail || '',
    seqFactura: Number(row.seq_factura || 1),
    seqTiquete: Number(row.seq_tiquete || 1),
    seqNotaCredito: Number(row.seq_nota_credito || 1),
    useCustomCredentials: Boolean(row.use_custom_credentials),
    customTaxpayerIdType: row.custom_taxpayer_id_type || '01',
    customTaxpayerIdNumber: row.custom_taxpayer_id_number || '',
    customTaxpayerName: row.custom_taxpayer_name || '',
    customIdpUsername: row.custom_idp_username || '',
    customIdpPasswordMasked: row.custom_idp_password_encrypted ? '••••••••' : '',
    customP12Filename: row.custom_p12_filename || '',
    customP12ExpiresAt: expiresIso,
    customP12HasCertificate: Boolean(row.custom_p12_encrypted_blob || row.custom_p12_filename),
    customCertSubject: row.custom_cert_subject || '',
    customCertDaysRemaining: computeDaysRemaining(expiresIso),
    isConnected: Boolean(row.is_connected),
    lastTestAt: row.last_test_at ? new Date(row.last_test_at).toISOString() : null,
    lastTestMessage: row.last_test_message || null,
    active: row.active !== undefined ? Boolean(row.active) : true,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ''
  };
}

export async function getHaciendaBranchesByTenant(tenantId: string): Promise<HaciendaBranchConfig[]> {
  const res = await query(
    `SELECT thb.*, b.name AS store_branch_name
     FROM tenant_hacienda_branches thb
     LEFT JOIN branches b ON b.id = thb.branch_id
     WHERE thb.tenant_id = $1
     ORDER BY thb.branch_code ASC, thb.pos_code ASC`,
    [tenantId]
  );
  return res.rows.map(mapHaciendaBranchRow);
}

export async function getHaciendaBranchById(tenantId: string, id: string): Promise<HaciendaBranchConfig | null> {
  const res = await query(
    `SELECT thb.*, b.name AS store_branch_name
     FROM tenant_hacienda_branches thb
     LEFT JOIN branches b ON b.id = thb.branch_id
     WHERE thb.tenant_id = $1 AND thb.id = $2`,
    [tenantId, id]
  );
  if (res.rows.length === 0) return null;
  return mapHaciendaBranchRow(res.rows[0]);
}

export async function getHaciendaBranchByStoreBranchId(tenantId: string, storeBranchId: string): Promise<HaciendaBranchConfig | null> {
  const res = await query(
    `SELECT thb.*, b.name AS store_branch_name
     FROM tenant_hacienda_branches thb
     LEFT JOIN branches b ON b.id = thb.branch_id
     WHERE thb.tenant_id = $1 AND thb.branch_id = $2 AND thb.active = true
     ORDER BY thb.branch_code ASC
     LIMIT 1`,
    [tenantId, storeBranchId]
  );
  if (res.rows.length === 0) return null;
  return mapHaciendaBranchRow(res.rows[0]);
}

export async function getHaciendaBranchDecryptedSecrets(tenantId: string, id: string): Promise<{
  p12Buffer: Buffer | null;
  p12Pin: string;
  idpPassword: string;
  idpUsername: string;
  environment: 'sandbox' | 'production';
} | null> {
  const res = await query(
    `SELECT thb.custom_p12_encrypted_blob, thb.custom_p12_pin_encrypted, thb.custom_idp_username, thb.custom_idp_password_encrypted,
            COALESCE(thc.environment, 'sandbox') AS environment
     FROM tenant_hacienda_branches thb
     LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = thb.tenant_id
     WHERE thb.tenant_id = $1 AND thb.id = $2`,
    [tenantId, id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let p12Buffer: Buffer | null = null;
  if (row.custom_p12_encrypted_blob) {
    try {
      const rawEncrypted = row.custom_p12_encrypted_blob.toString('utf8');
      const decryptedBase64 = decrypt(rawEncrypted);
      p12Buffer = Buffer.from(decryptedBase64, 'base64');
    } catch (e: any) {
      console.error('[HaciendaRepo] Error descifrando certificado .p12 de sucursal:', e.message);
    }
  }

  const p12Pin = row.custom_p12_pin_encrypted ? decrypt(row.custom_p12_pin_encrypted) : '';
  const idpPassword = row.custom_idp_password_encrypted ? decrypt(row.custom_idp_password_encrypted) : '';

  return {
    p12Buffer,
    p12Pin,
    idpPassword,
    idpUsername: row.custom_idp_username || '',
    environment: row.environment || 'sandbox'
  };
}

export async function saveHaciendaBranch(tenantId: string, data: any): Promise<HaciendaBranchConfig> {
  const branchCode = String(data.branchCode || '002').replace(/\D/g, '').padStart(3, '0').slice(0, 3);
  const posCode = String(data.posCode || '00001').replace(/\D/g, '').padStart(5, '0').slice(0, 5);

  let existing: any = {};
  if (data.id) {
    const exRes = await query(
      `SELECT * FROM tenant_hacienda_branches WHERE tenant_id = $1 AND id = $2`,
      [tenantId, data.id]
    );
    existing = exRes.rows[0] || {};
  } else {
    const exRes = await query(
      `SELECT * FROM tenant_hacienda_branches WHERE tenant_id = $1 AND branch_code = $2 AND pos_code = $3`,
      [tenantId, branchCode, posCode]
    );
    existing = exRes.rows[0] || {};
  }

  const branchId = data.branchId !== undefined ? (data.branchId || null) : (existing.branch_id || null);
  const branchName = (data.branchName !== undefined ? data.branchName : (existing.branch_name || 'Sucursal')).trim();
  const commercialName = (data.commercialName !== undefined ? data.commercialName : (existing.commercial_name || '')).trim();
  const economicActivityCode = (data.economicActivityCode !== undefined ? data.economicActivityCode : (existing.economic_activity_code || '')).trim();
  const province = data.province || existing.province || '1';
  const canton = data.canton || existing.canton || '01';
  const district = data.district || existing.district || '01';
  const neighborhood = data.neighborhood || existing.neighborhood || '01';
  const addressDetail = (data.addressDetail !== undefined ? data.addressDetail : (existing.address_detail || '')).trim();
  const seqFactura = data.seqFactura !== undefined ? Math.max(1, Number(data.seqFactura) || 1) : Number(existing.seq_factura || 1);
  const seqTiquete = data.seqTiquete !== undefined ? Math.max(1, Number(data.seqTiquete) || 1) : Number(existing.seq_tiquete || 1);
  const seqNotaCredito = data.seqNotaCredito !== undefined ? Math.max(1, Number(data.seqNotaCredito) || 1) : Number(existing.seq_nota_credito || 1);
  const useCustomCredentials = data.useCustomCredentials !== undefined
    ? (data.useCustomCredentials === true || data.useCustomCredentials === 'true')
    : Boolean(existing.use_custom_credentials);
  const customTaxpayerIdType = data.customTaxpayerIdType || existing.custom_taxpayer_id_type || '01';
  const customTaxpayerIdNumber = (data.customTaxpayerIdNumber !== undefined ? data.customTaxpayerIdNumber : (existing.custom_taxpayer_id_number || '')).trim();
  const customTaxpayerName = (data.customTaxpayerName !== undefined ? data.customTaxpayerName : (existing.custom_taxpayer_name || '')).trim();
  const customIdpUsername = (data.customIdpUsername !== undefined ? data.customIdpUsername : (existing.custom_idp_username || '')).trim();

  let customIdpPasswordEncrypted = existing.custom_idp_password_encrypted || '';
  if (data.customIdpPassword && data.customIdpPassword.trim() && !data.customIdpPassword.includes('••••')) {
    customIdpPasswordEncrypted = encrypt(data.customIdpPassword.trim());
  }

  let customP12EncryptedBlob = existing.custom_p12_encrypted_blob || null;
  let customP12Filename = existing.custom_p12_filename || '';
  let customP12ExpiresAt = existing.custom_p12_expires_at || null;
  let customCertSubject = data.customCertSubject !== undefined ? data.customCertSubject : (existing.custom_cert_subject || '');

  if (data.customP12Buffer && data.customP12Buffer.length > 0) {
    const base64Str = data.customP12Buffer.toString('base64');
    const encryptedStr = encrypt(base64Str);
    customP12EncryptedBlob = Buffer.from(encryptedStr, 'utf8');
    customP12Filename = data.customP12Filename || 'certificado-sucursal.p12';
  }
  if (data.customP12ExpiresAt) {
    customP12ExpiresAt = data.customP12ExpiresAt;
  }

  let customP12PinEncrypted = existing.custom_p12_pin_encrypted || '';
  if (data.customP12Pin && data.customP12Pin.trim() && !data.customP12Pin.includes('••••')) {
    customP12PinEncrypted = encrypt(data.customP12Pin.trim());
  }

  const active = data.active !== undefined ? (data.active === true || data.active === 'true') : (existing.active !== undefined ? Boolean(existing.active) : true);

  let savedId: string;
  if (data.id && existing.id) {
    const updRes = await query(
      `UPDATE tenant_hacienda_branches SET
        branch_id = $1, branch_name = $2, branch_code = $3, pos_code = $4,
        commercial_name = $5, economic_activity_code = $6, province = $7, canton = $8,
        district = $9, neighborhood = $10, address_detail = $11,
        seq_factura = $12, seq_tiquete = $13, seq_nota_credito = $14,
        use_custom_credentials = $15, custom_taxpayer_id_type = $16,
        custom_taxpayer_id_number = $17, custom_taxpayer_name = $18,
        custom_idp_username = $19, custom_idp_password_encrypted = $20,
        custom_p12_encrypted_blob = $21, custom_p12_pin_encrypted = $22,
        custom_p12_filename = $23, custom_p12_expires_at = $24,
        custom_cert_subject = $25, active = $26, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $27 AND id = $28
       RETURNING id`,
      [
        branchId, branchName, branchCode, posCode,
        commercialName, economicActivityCode, province, canton,
        district, neighborhood, addressDetail,
        seqFactura, seqTiquete, seqNotaCredito,
        useCustomCredentials, customTaxpayerIdType,
        customTaxpayerIdNumber, customTaxpayerName,
        customIdpUsername, customIdpPasswordEncrypted,
        customP12EncryptedBlob, customP12PinEncrypted,
        customP12Filename, customP12ExpiresAt,
        customCertSubject, active, tenantId, data.id
      ]
    );
    savedId = updRes.rows[0].id;
  } else {
    const insRes = await query(
      `INSERT INTO tenant_hacienda_branches (
        tenant_id, branch_id, branch_name, branch_code, pos_code,
        commercial_name, economic_activity_code, province, canton,
        district, neighborhood, address_detail,
        seq_factura, seq_tiquete, seq_nota_credito,
        use_custom_credentials, custom_taxpayer_id_type,
        custom_taxpayer_id_number, custom_taxpayer_name,
        custom_idp_username, custom_idp_password_encrypted,
        custom_p12_encrypted_blob, custom_p12_pin_encrypted,
        custom_p12_filename, custom_p12_expires_at,
        custom_cert_subject, active, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13, $14, $15,
        $16, $17,
        $18, $19,
        $20, $21,
        $22, $23,
        $24, $25,
        $26, $27, CURRENT_TIMESTAMP
      )
      ON CONFLICT (tenant_id, branch_code, pos_code) DO UPDATE SET
        branch_id = EXCLUDED.branch_id,
        branch_name = EXCLUDED.branch_name,
        commercial_name = EXCLUDED.commercial_name,
        economic_activity_code = EXCLUDED.economic_activity_code,
        province = EXCLUDED.province,
        canton = EXCLUDED.canton,
        district = EXCLUDED.district,
        neighborhood = EXCLUDED.neighborhood,
        address_detail = EXCLUDED.address_detail,
        seq_factura = EXCLUDED.seq_factura,
        seq_tiquete = EXCLUDED.seq_tiquete,
        seq_nota_credito = EXCLUDED.seq_nota_credito,
        use_custom_credentials = EXCLUDED.use_custom_credentials,
        custom_taxpayer_id_type = EXCLUDED.custom_taxpayer_id_type,
        custom_taxpayer_id_number = EXCLUDED.custom_taxpayer_id_number,
        custom_taxpayer_name = EXCLUDED.custom_taxpayer_name,
        custom_idp_username = EXCLUDED.custom_idp_username,
        custom_idp_password_encrypted = EXCLUDED.custom_idp_password_encrypted,
        custom_p12_encrypted_blob = COALESCE(EXCLUDED.custom_p12_encrypted_blob, tenant_hacienda_branches.custom_p12_encrypted_blob),
        custom_p12_pin_encrypted = EXCLUDED.custom_p12_pin_encrypted,
        custom_p12_filename = COALESCE(EXCLUDED.custom_p12_filename, tenant_hacienda_branches.custom_p12_filename),
        custom_p12_expires_at = COALESCE(EXCLUDED.custom_p12_expires_at, tenant_hacienda_branches.custom_p12_expires_at),
        custom_cert_subject = EXCLUDED.custom_cert_subject,
        active = EXCLUDED.active,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        tenantId, branchId, branchName, branchCode, posCode,
        commercialName, economicActivityCode, province, canton,
        district, neighborhood, addressDetail,
        seqFactura, seqTiquete, seqNotaCredito,
        useCustomCredentials, customTaxpayerIdType,
        customTaxpayerIdNumber, customTaxpayerName,
        customIdpUsername, customIdpPasswordEncrypted,
        customP12EncryptedBlob, customP12PinEncrypted,
        customP12Filename, customP12ExpiresAt,
        customCertSubject, active
      ]
    );
    savedId = insRes.rows[0].id;
  }

  return (await getHaciendaBranchById(tenantId, savedId))!;
}

export async function deleteHaciendaBranch(tenantId: string, id: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM tenant_hacienda_branches WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return (res.rowCount || 0) > 0;
}

export async function updateBranchConnectionTestResult(
  tenantId: string,
  id: string,
  isConnected: boolean,
  message: string
): Promise<void> {
  await query(
    `UPDATE tenant_hacienda_branches
     SET is_connected = $1, last_test_at = CURRENT_TIMESTAMP, last_test_message = $2, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $3 AND id = $4`,
    [isConnected, message, tenantId, id]
  );
}

// ============================================================================
// CONSECUTIVO DE 20 DÍGITOS Y CLAVE NUMÉRICA DE 50 DÍGITOS (HACIENDA DGT v4.4)
// ============================================================================

export function formatConsecutiveNumber(
  branchCode: string,
  posCode: string,
  docType: '01' | '03' | '04' | string,
  sequence: number
): string {
  const b = String(branchCode || '001').replace(/\D/g, '').padStart(3, '0').slice(-3);
  const p = String(posCode || '00001').replace(/\D/g, '').padStart(5, '0').slice(-5);
  const d = String(docType || '04').replace(/\D/g, '').padStart(2, '0').slice(-2);
  const s = String(Math.max(1, Math.floor(Number(sequence) || 1))).padStart(10, '0').slice(-10);
  return `${b}${p}${d}${s}`;
}

export function generateHaciendaNumericKey(params: {
  taxpayerIdNumber: string;
  consecutive20: string;
  situation?: '1' | '2' | '3';
  securityCode?: string;
  date?: Date;
}): string {
  const now = params.date || new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const id12 = String(params.taxpayerIdNumber || '').replace(/\D/g, '').padStart(12, '0').slice(-12);
  const consec20 = String(params.consecutive20 || '').replace(/\D/g, '').padStart(20, '0').slice(-20);
  const sit = params.situation || '1';
  const sec8 = (params.securityCode ? String(params.securityCode).replace(/\D/g, '') : String(Math.floor(10000000 + Math.random() * 90000000)))
    .padStart(8, '0')
    .slice(-8);

  return `506${dd}${mm}${yy}${id12}${consec20}${sit}${sec8}`;
}

export async function consumeNextConsecutive(
  tenantId: string,
  docType: '01' | '03' | '04',
  options?: { branchId?: string | null; branchCode?: string }
): Promise<{
  consecutiveNumber: string;
  numericKey: string;
  branchCode: string;
  posCode: string;
  branchId: string | null;
  taxpayerIdNumber: string;
}> {
  const seqCol = docType === '01' ? 'seq_factura' : docType === '03' ? 'seq_nota_credito' : 'seq_tiquete';
  const mainConfig = await getHaciendaConfigByTenant(tenantId);

  if (mainConfig?.multiBranchEnabled && (options?.branchId || options?.branchCode)) {
    let branchRow: any = null;
    if (options.branchId) {
      const bRes = await query(
        `SELECT * FROM tenant_hacienda_branches
         WHERE tenant_id = $1 AND active = true AND (branch_id = $2 OR id::text = $2)
         ORDER BY branch_code ASC LIMIT 1`,
        [tenantId, options.branchId]
      );
      branchRow = bRes.rows[0] || null;
    }
    if (!branchRow && options.branchCode) {
      const normCode = String(options.branchCode).replace(/\D/g, '').padStart(3, '0').slice(0, 3);
      const bRes = await query(
        `SELECT * FROM tenant_hacienda_branches
         WHERE tenant_id = $1 AND active = true AND branch_code = $2
         ORDER BY pos_code ASC LIMIT 1`,
        [tenantId, normCode]
      );
      branchRow = bRes.rows[0] || null;
    }

    if (branchRow) {
      const updRes = await query(
        `UPDATE tenant_hacienda_branches
         SET ${seqCol} = COALESCE(${seqCol}, 1) + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2
         RETURNING (${seqCol} - 1) AS used_seq, branch_code, pos_code, branch_id, use_custom_credentials, custom_taxpayer_id_number`,
        [branchRow.id, tenantId]
      );
      const r = updRes.rows[0];
      const usedSeq = Number(r?.used_seq || 1);
      const bCode = r?.branch_code || branchRow.branch_code || '002';
      const pCode = r?.pos_code || branchRow.pos_code || '00001';
      const taxpayerIdNumber = (r?.use_custom_credentials && r?.custom_taxpayer_id_number)
        ? r.custom_taxpayer_id_number
        : (mainConfig?.taxpayerIdNumber || '3101000000');

      const consecutiveNumber = formatConsecutiveNumber(bCode, pCode, docType, usedSeq);
      const numericKey = generateHaciendaNumericKey({ taxpayerIdNumber, consecutive20: consecutiveNumber });
      return {
        consecutiveNumber,
        numericKey,
        branchCode: bCode,
        posCode: pCode,
        branchId: r?.branch_id || branchRow.branch_id || branchRow.id || null,
        taxpayerIdNumber
      };
    }
  }

  // Fallback / Casa Matriz (tenant_hacienda_configs)
  const updMain = await query(
    `UPDATE tenant_hacienda_configs
     SET ${seqCol} = COALESCE(${seqCol}, 1) + 1, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $1
     RETURNING (${seqCol} - 1) AS used_seq, branch_code, pos_code, taxpayer_id_number`,
    [tenantId]
  );

  const row = updMain.rows[0];
  const usedSeq = Number(row?.used_seq || 1);
  const bCode = row?.branch_code || options?.branchCode || '001';
  const pCode = row?.pos_code || '00001';
  const taxpayerIdNumber = row?.taxpayer_id_number || mainConfig?.taxpayerIdNumber || '3101000000';

  const consecutiveNumber = formatConsecutiveNumber(bCode, pCode, docType, usedSeq);
  const numericKey = generateHaciendaNumericKey({ taxpayerIdNumber, consecutive20: consecutiveNumber });

  return {
    consecutiveNumber,
    numericKey,
    branchCode: bCode,
    posCode: pCode,
    branchId: options?.branchId || null,
    taxpayerIdNumber
  };
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
