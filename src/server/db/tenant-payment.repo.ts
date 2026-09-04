import { query } from './pool.js';
import { CryptoService } from '../services/crypto.service.js';
import { TenantPaymentConfig, PaymentConfigAuditLog } from '../../shared/types.js';

export async function getTenantPaymentConfig(tenantId: string): Promise<TenantPaymentConfig | null> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", provider, is_enabled as "isEnabled",
           environment, api_key_encrypted as "apiKeyEncrypted", api_user as "apiUser",
           api_password_encrypted as "apiPasswordEncrypted", capture_mode as "captureMode",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM tenant_payment_configs
    WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let rawKey = '';
  let rawPass = '';
  if (row.apiKeyEncrypted) {
    try { rawKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted); } catch (e) {}
  }
  if (row.apiPasswordEncrypted) {
    try { rawPass = CryptoService.decryptForTenant(tenantId, row.apiPasswordEncrypted); } catch (e) {}
  }

  return {
    id: row.id,
    tenantId: row.tenantId,
    provider: row.provider,
    isEnabled: Boolean(row.isEnabled),
    environment: row.environment || 'SANDBOX',
    apiUser: row.apiUser || '',
    apiKeyMasked: rawKey ? CryptoService.maskSecret(rawKey) : '',
    apiPasswordMasked: rawPass ? CryptoService.maskSecret(rawPass) : '',
    captureMode: row.captureMode || 'IMMEDIATE',
    isConfigured: Boolean(rawKey && row.apiUser && rawPass),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

/**
 * Internal helper for backend services. Decrypts credentials into memory.
 * Never expose this function's output to API endpoints or user responses.
 */
export async function getTenantPaymentConfigRaw(tenantId: string): Promise<{
  apiKey: string;
  apiUser: string;
  apiPassword: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  isEnabled: boolean;
  captureMode: 'IMMEDIATE' | 'AUTH_ONLY';
} | null> {
  const res = await query(`
    SELECT is_enabled as "isEnabled", environment, api_key_encrypted, api_user as "apiUser",
           api_password_encrypted, capture_mode as "captureMode"
    FROM tenant_payment_configs
    WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let apiKey = '';
  let apiPassword = '';

  if (row.api_key_encrypted) {
    try {
      apiKey = CryptoService.decryptForTenant(tenantId, row.api_key_encrypted);
    } catch (e) {
      console.error(`[TenantPaymentRepo] Error desencriptando api_key para tenant ${tenantId}:`, e);
    }
  }
  if (row.api_password_encrypted) {
    try {
      apiPassword = CryptoService.decryptForTenant(tenantId, row.api_password_encrypted);
    } catch (e) {
      console.error(`[TenantPaymentRepo] Error desencriptando api_password para tenant ${tenantId}:`, e);
    }
  }

  return {
    apiKey,
    apiUser: row.apiUser || row.api_user || '',
    apiPassword,
    environment: row.environment || 'SANDBOX',
    isEnabled: Boolean(row.isEnabled),
    captureMode: row.captureMode || 'IMMEDIATE'
  };
}

export async function saveTenantPaymentConfig(
  tenantId: string,
  data: {
    apiKey?: string;
    apiUser?: string;
    apiPassword?: string;
    environment?: 'SANDBOX' | 'PRODUCTION';
    isEnabled?: boolean;
    captureMode?: 'IMMEDIATE' | 'AUTH_ONLY';
  },
  changedBy: string = 'system'
): Promise<TenantPaymentConfig> {
  // 1. Get existing config to log audit diffs
  const existing = await query(`
    SELECT * FROM tenant_payment_configs WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);

  const prevRow = existing.rows[0] || null;

  let newEncryptedKey = prevRow?.api_key_encrypted || null;
  let newEncryptedPass = prevRow?.api_password_encrypted || null;

  // Encrypt new secrets if provided and not masked
  if (data.apiKey && !data.apiKey.includes('••••')) {
    newEncryptedKey = CryptoService.encryptForTenant(tenantId, data.apiKey.trim());
  }
  if (data.apiPassword && !data.apiPassword.includes('••••')) {
    newEncryptedPass = CryptoService.encryptForTenant(tenantId, data.apiPassword.trim());
  }

  const isEnabled = data.isEnabled !== undefined ? Boolean(data.isEnabled) : (prevRow ? Boolean(prevRow.is_enabled) : true);
  const environment = data.environment || prevRow?.environment || 'SANDBOX';
  const apiUser = data.apiUser !== undefined ? data.apiUser.trim() : (prevRow?.api_user || '');
  const captureMode = data.captureMode || prevRow?.capture_mode || 'IMMEDIATE';

  const upsertSql = `
    INSERT INTO tenant_payment_configs (
      tenant_id, provider, is_enabled, environment, api_key_encrypted, api_user, api_password_encrypted, capture_mode, updated_at
    ) VALUES ($1, 'TILOPAY', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, provider) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      environment = EXCLUDED.environment,
      api_key_encrypted = COALESCE(EXCLUDED.api_key_encrypted, tenant_payment_configs.api_key_encrypted),
      api_user = EXCLUDED.api_user,
      api_password_encrypted = COALESCE(EXCLUDED.api_password_encrypted, tenant_payment_configs.api_password_encrypted),
      capture_mode = EXCLUDED.capture_mode,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id
  `;

  await query(upsertSql, [
    tenantId, isEnabled, environment, newEncryptedKey, apiUser, newEncryptedPass, captureMode
  ]);

  // 2. Audit log changes
  const auditDiffs: Array<{ field: string; oldVal?: string; newVal?: string }> = [];

  if (prevRow) {
    if (prevRow.is_enabled !== isEnabled) {
      auditDiffs.push({ field: 'is_enabled', oldVal: String(prevRow.is_enabled), newVal: String(isEnabled) });
    }
    if (prevRow.environment !== environment) {
      auditDiffs.push({ field: 'environment', oldVal: prevRow.environment, newVal: environment });
    }
    if (data.apiKey && !data.apiKey.includes('••••')) {
      auditDiffs.push({ field: 'api_key', oldVal: '••••', newVal: CryptoService.maskSecret(data.apiKey) });
    }
    if (data.apiPassword && !data.apiPassword.includes('••••')) {
      auditDiffs.push({ field: 'api_password', oldVal: '••••', newVal: CryptoService.maskSecret(data.apiPassword) });
    }
    if (prevRow.api_user !== apiUser) {
      auditDiffs.push({ field: 'api_user', oldVal: prevRow.api_user, newVal: apiUser });
    }
  } else {
    auditDiffs.push({ field: 'created', oldVal: undefined, newVal: `provider=TILOPAY, env=${environment}` });
  }

  for (const diff of auditDiffs) {
    await query(`
      INSERT INTO payment_config_audit_log (tenant_id, changed_by, field_changed, old_value_masked, new_value_masked)
      VALUES ($1, $2, $3, $4, $5)
    `, [tenantId, changedBy, diff.field, diff.oldVal || null, diff.newVal || null]);
  }

  return (await getTenantPaymentConfig(tenantId))!;
}

export async function getPaymentAuditLogs(tenantId: string, limit: number = 20): Promise<PaymentConfigAuditLog[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", changed_by as "changedBy", field_changed as "fieldChanged",
           old_value_masked as "oldValueMasked", new_value_masked as "newValueMasked", timestamp
    FROM payment_config_audit_log
    WHERE tenant_id = $1
    ORDER BY timestamp DESC
    LIMIT $2
  `, [tenantId, limit]);

  return res.rows;
}
