import { query } from './pool.js';
import { encrypt, decrypt } from '../services/encryption.js';

export interface TenantWalletConfig {
  id?: string;
  tenantId: string;
  // Google Wallet
  googleIssuerId: string;
  googleClientEmail: string;
  googlePrivateKeyMasked?: string;
  googleHasKey: boolean;
  googleIsActive: boolean;
  googleIsTested: boolean;
  googleLastTestAt?: string | null;
  googleLastTestMessage?: string | null;
  // Apple Wallet
  applePassTypeId: string;
  appleTeamId: string;
  appleP12Filename?: string;
  appleHasCertificate: boolean;
  applePasswordMasked?: string;
  appleIsActive: boolean;
  appleIsTested: boolean;
  appleLastTestAt?: string | null;
  appleLastTestMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletDecryptedSecrets {
  tenantId: string;
  googleIssuerId: string;
  googleClientEmail: string;
  googlePrivateKey: string;
  googleIsActive: boolean;
  googleIsTested: boolean;
  applePassTypeId: string;
  appleTeamId: string;
  appleP12Buffer: Buffer | null;
  appleP12Password: string;
  appleIsActive: boolean;
  appleIsTested: boolean;
}

/**
 * Parsea contenido JSON de cuenta de servicio de Google Cloud si es necesario.
 */
export function parseGoogleServiceAccountJson(input: string): { clientEmail?: string; privateKey?: string } | null {
  const trimmed = input.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        clientEmail: parsed.client_email || undefined,
        privateKey: parsed.private_key || undefined
      };
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * Obtiene la configuración de billeteras móviles con secretos enmascarados para la UI.
 */
export async function getWalletConfigByTenant(tenantId: string): Promise<TenantWalletConfig> {
  const res = await query(
    `SELECT * FROM tenant_wallet_configs WHERE tenant_id = $1`,
    [tenantId]
  );

  if (res.rows.length === 0) {
    return {
      tenantId,
      googleIssuerId: '',
      googleClientEmail: '',
      googlePrivateKeyMasked: '',
      googleHasKey: false,
      googleIsActive: false,
      googleIsTested: false,
      googleLastTestAt: null,
      googleLastTestMessage: null,
      applePassTypeId: '',
      appleTeamId: '',
      appleP12Filename: '',
      appleHasCertificate: false,
      applePasswordMasked: '',
      appleIsActive: false,
      appleIsTested: false,
      appleLastTestAt: null,
      appleLastTestMessage: null
    };
  }

  const row = res.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    googleIssuerId: row.google_issuer_id || '',
    googleClientEmail: row.google_client_email || '',
    googlePrivateKeyMasked: row.google_private_key_encrypted ? '••••••••••••••••' : '',
    googleHasKey: Boolean(row.google_private_key_encrypted),
    googleIsActive: Boolean(row.google_is_active),
    googleIsTested: Boolean(row.google_is_tested),
    googleLastTestAt: row.google_last_test_at ? row.google_last_test_at.toISOString() : null,
    googleLastTestMessage: row.google_last_test_message || null,
    applePassTypeId: row.apple_pass_type_id || '',
    appleTeamId: row.apple_team_id || '',
    appleP12Filename: row.apple_p12_filename || '',
    appleHasCertificate: Boolean(row.apple_p12_encrypted_blob || row.apple_p12_filename),
    applePasswordMasked: row.apple_p12_password_encrypted ? '••••••••' : '',
    appleIsActive: Boolean(row.apple_is_active),
    appleIsTested: Boolean(row.apple_is_tested),
    appleLastTestAt: row.apple_last_test_at ? row.apple_last_test_at.toISOString() : null,
    appleLastTestMessage: row.apple_last_test_message || null,
    createdAt: row.created_at ? row.created_at.toISOString() : undefined,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined
  };
}

/**
 * Obtiene los secretos descifrados en memoria RAM exclusivamente para la firma de pases.
 */
export async function getWalletDecryptedSecrets(tenantId: string): Promise<WalletDecryptedSecrets | null> {
  const res = await query(
    `SELECT * FROM tenant_wallet_configs WHERE tenant_id = $1`,
    [tenantId]
  );

  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  let googlePrivateKey = '';
  if (row.google_private_key_encrypted) {
    try {
      googlePrivateKey = decrypt(row.google_private_key_encrypted);
    } catch (e: any) {
      console.error('[WalletConfigRepo] Error descifrando private key de Google:', e.message);
    }
  }

  let appleP12Buffer: Buffer | null = null;
  if (row.apple_p12_encrypted_blob) {
    try {
      const rawEncrypted = row.apple_p12_encrypted_blob.toString('utf8');
      const decryptedBase64 = decrypt(rawEncrypted);
      appleP12Buffer = Buffer.from(decryptedBase64, 'base64');
    } catch (e: any) {
      console.error('[WalletConfigRepo] Error descifrando certificado .p12 de Apple:', e.message);
    }
  }

  let appleP12Password = '';
  if (row.apple_p12_password_encrypted) {
    try {
      appleP12Password = decrypt(row.apple_p12_password_encrypted);
    } catch (e: any) {
      console.error('[WalletConfigRepo] Error descifrando password de Apple .p12:', e.message);
    }
  }

  return {
    tenantId,
    googleIssuerId: row.google_issuer_id || '',
    googleClientEmail: row.google_client_email || '',
    googlePrivateKey,
    googleIsActive: Boolean(row.google_is_active),
    googleIsTested: Boolean(row.google_is_tested),
    applePassTypeId: row.apple_pass_type_id || '',
    appleTeamId: row.apple_team_id || '',
    appleP12Buffer,
    appleP12Password,
    appleIsActive: Boolean(row.apple_is_active),
    appleIsTested: Boolean(row.apple_is_tested)
  };
}

/**
 * Guarda o actualiza la configuración de billeteras móviles para un tenant.
 */
export async function saveWalletConfig(
  tenantId: string,
  data: {
    googleIssuerId?: string;
    googleClientEmail?: string;
    googlePrivateKey?: string;
    googleServiceAccountJson?: string;
    googleIsActive?: boolean;
    googleIsTested?: boolean;
    applePassTypeId?: string;
    appleTeamId?: string;
    appleP12Buffer?: Buffer;
    appleP12Filename?: string;
    appleP12Password?: string;
    appleIsActive?: boolean;
    appleIsTested?: boolean;
  }
): Promise<TenantWalletConfig> {
  const existingRes = await query(
    `SELECT * FROM tenant_wallet_configs WHERE tenant_id = $1`,
    [tenantId]
  );
  const existing = existingRes.rows[0] || {};

  // Procesar Google
  let googleIssuerId = data.googleIssuerId !== undefined ? data.googleIssuerId.trim() : (existing.google_issuer_id || '');
  let googleClientEmail = data.googleClientEmail !== undefined ? data.googleClientEmail.trim() : (existing.google_client_email || '');
  let googlePrivateKeyEncrypted = existing.google_private_key_encrypted || '';

  // Verificar si se pasó un JSON completo en googleServiceAccountJson o en googlePrivateKey
  const potentialJson = data.googleServiceAccountJson || data.googlePrivateKey || '';
  const parsedJson = parseGoogleServiceAccountJson(potentialJson);
  if (parsedJson) {
    if (parsedJson.clientEmail) googleClientEmail = parsedJson.clientEmail;
    if (parsedJson.privateKey) {
      googlePrivateKeyEncrypted = encrypt(parsedJson.privateKey);
    }
  } else if (data.googlePrivateKey && data.googlePrivateKey.trim()) {
    googlePrivateKeyEncrypted = encrypt(data.googlePrivateKey.trim());
  }

  const googleIsActive = data.googleIsActive !== undefined ? Boolean(data.googleIsActive) : Boolean(existing.google_is_active);
  const googleIsTested = data.googleIsTested !== undefined ? Boolean(data.googleIsTested) : Boolean(existing.google_is_tested);

  // Procesar Apple
  const applePassTypeId = data.applePassTypeId !== undefined ? data.applePassTypeId.trim() : (existing.apple_pass_type_id || '');
  const appleTeamId = data.appleTeamId !== undefined ? data.appleTeamId.trim() : (existing.apple_team_id || '');
  let appleP12EncryptedBlob = existing.apple_p12_encrypted_blob || null;
  let appleP12Filename = existing.apple_p12_filename || '';

  if (data.appleP12Buffer && Buffer.isBuffer(data.appleP12Buffer)) {
    const base64P12 = data.appleP12Buffer.toString('base64');
    const encryptedP12 = encrypt(base64P12);
    appleP12EncryptedBlob = Buffer.from(encryptedP12, 'utf8');
    appleP12Filename = data.appleP12Filename || 'pass_certificate.p12';
  }

  let appleP12PasswordEncrypted = existing.apple_p12_password_encrypted || '';
  if (data.appleP12Password !== undefined && data.appleP12Password.trim()) {
    appleP12PasswordEncrypted = encrypt(data.appleP12Password.trim());
  }

  const appleIsActive = data.appleIsActive !== undefined ? Boolean(data.appleIsActive) : Boolean(existing.apple_is_active);
  const appleIsTested = data.appleIsTested !== undefined ? Boolean(data.appleIsTested) : Boolean(existing.apple_is_tested);

  await query(
    `INSERT INTO tenant_wallet_configs (
      tenant_id, google_issuer_id, google_client_email, google_private_key_encrypted,
      google_is_active, google_is_tested, apple_pass_type_id, apple_team_id,
      apple_p12_encrypted_blob, apple_p12_filename, apple_p12_password_encrypted,
      apple_is_active, apple_is_tested, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      google_issuer_id = EXCLUDED.google_issuer_id,
      google_client_email = EXCLUDED.google_client_email,
      google_private_key_encrypted = EXCLUDED.google_private_key_encrypted,
      google_is_active = EXCLUDED.google_is_active,
      google_is_tested = EXCLUDED.google_is_tested,
      apple_pass_type_id = EXCLUDED.apple_pass_type_id,
      apple_team_id = EXCLUDED.apple_team_id,
      apple_p12_encrypted_blob = COALESCE(EXCLUDED.apple_p12_encrypted_blob, tenant_wallet_configs.apple_p12_encrypted_blob),
      apple_p12_filename = COALESCE(EXCLUDED.apple_p12_filename, tenant_wallet_configs.apple_p12_filename),
      apple_p12_password_encrypted = EXCLUDED.apple_p12_password_encrypted,
      apple_is_active = EXCLUDED.apple_is_active,
      apple_is_tested = EXCLUDED.apple_is_tested,
      updated_at = NOW()`,
    [
      tenantId,
      googleIssuerId,
      googleClientEmail,
      googlePrivateKeyEncrypted,
      googleIsActive,
      googleIsTested,
      applePassTypeId,
      appleTeamId,
      appleP12EncryptedBlob,
      appleP12Filename,
      appleP12PasswordEncrypted,
      appleIsActive,
      appleIsTested
    ]
  );

  return getWalletConfigByTenant(tenantId);
}

/**
 * Actualiza el resultado del test de validación de conexión de Google o Apple.
 */
export async function updateWalletTestStatus(
  tenantId: string,
  walletType: 'google' | 'apple',
  isTested: boolean,
  message: string
): Promise<void> {
  if (walletType === 'google') {
    await query(
      `UPDATE tenant_wallet_configs
       SET google_is_tested = $1,
           google_last_test_at = NOW(),
           google_last_test_message = $2,
           updated_at = NOW()
       WHERE tenant_id = $3`,
      [isTested, message, tenantId]
    );
  } else {
    await query(
      `UPDATE tenant_wallet_configs
       SET apple_is_tested = $1,
           apple_last_test_at = NOW(),
           apple_last_test_message = $2,
           updated_at = NOW()
       WHERE tenant_id = $3`,
      [isTested, message, tenantId]
    );
  }
}
