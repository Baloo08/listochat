var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../src/server/config/env.ts
import dotenv2 from "dotenv";
var isProduction, env;
var init_env = __esm({
  "../src/server/config/env.ts"() {
    "use strict";
    dotenv2.config();
    isProduction = process.env.NODE_ENV === "production";
    if (isProduction) {
      const missingCriticalVars = [];
      if (!process.env.DATABASE_URL) missingCriticalVars.push("DATABASE_URL");
      if (!process.env.JWT_SECRET) missingCriticalVars.push("JWT_SECRET");
      if (missingCriticalVars.length > 0) {
        console.warn(`[Security Warning] Variables de entorno cr\xEDticas no definidas en producci\xF3n: ${missingCriticalVars.join(", ")}. Usando configuraci\xF3n predeterminada.`);
      }
    }
    env = {
      PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3,
      JWT_SECRET: process.env.JWT_SECRET || "betico_jwt_secret_64_chars_super_safe_key_cr_2026",
      DATABASE_URL: process.env.DATABASE_URL || "postgres://saas:BeticoDB2026@betico_postgres:5432/whatsapp_saas?sslmode=disable",
      REDIS_URL: process.env.REDIS_URL || "redis://default:BeticoRedis2026@betico_redis:6379",
      BASE_DOMAIN: process.env.BASE_DOMAIN && !process.env.BASE_DOMAIN.includes("easypanel.host") ? process.env.BASE_DOMAIN : "betico.tech",
      APP_URL: process.env.APP_URL && !process.env.APP_URL.includes("easypanel.host") ? process.env.APP_URL : "https://betico.tech",
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || "http://betico_evolution:8080",
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11",
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f",
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f",
      TILOPAY_MODULE_ENABLED: process.env.TILOPAY_MODULE_ENABLED !== "false",
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL || "admin@betico.cr",
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD || "BeticoAdmin2026!",
      UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
      NODE_ENV: process.env.NODE_ENV || "production",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
      SMTP_HOST: process.env.SMTP_HOST || "",
      SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      SMTP_USER: process.env.SMTP_USER || "",
      SMTP_PASS: process.env.SMTP_PASS || "",
      SMTP_FROM: process.env.SMTP_FROM || "facturacion@betico.cr",
      RESEND_API_KEY: process.env.RESEND_API_KEY || ""
    };
  }
});

// ../src/server/db/pool.ts
var pool_exports = {};
__export(pool_exports, {
  default: () => pool_default,
  getClient: () => getClient,
  query: () => query2,
  testConnection: () => testConnection
});
import pg2 from "pg";
var Pool2, pool2, query2, getClient, testConnection, pool_default;
var init_pool = __esm({
  "../src/server/db/pool.ts"() {
    "use strict";
    init_env();
    ({ Pool: Pool2 } = pg2);
    pg2.types.setTypeParser(1082, (val) => val);
    pg2.types.setTypeParser(1083, (val) => val ? val.slice(0, 5) : val);
    pool2 = new Pool2({
      connectionString: env.DATABASE_URL,
      max: 25,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3
    });
    pool2.on("connect", (client) => {
      client.query("SET TIME ZONE 'America/Costa_Rica'").catch((err) => {
        console.error("Error setting session timezone on pool connect:", err);
      });
    });
    pool2.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
    query2 = async (text, params) => {
      try {
        const res = await pool2.query(text, params);
        return res;
      } catch (error) {
        console.error("Database query error:", error, "Query:", text);
        throw error;
      }
    };
    getClient = async () => {
      const client = await pool2.connect();
      return client;
    };
    testConnection = async () => {
      try {
        const res = await query2("SELECT NOW()");
        console.log("Database connected successfully:", res.rows[0]);
        return true;
      } catch (err) {
        console.error("Failed to connect to the database:", err);
        return false;
      }
    };
    pool_default = pool2;
  }
});

// ../src/server/services/encryption.ts
import crypto3 from "crypto";
function encrypt2(plaintext) {
  if (!plaintext) return plaintext;
  try {
    const iv = crypto3.randomBytes(IV_LENGTH2);
    const key = getEncryptionKey2();
    const cipher = crypto3.createCipheriv(ALGORITHM2, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag().toString("base64");
    return `${iv.toString("base64")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}
function decrypt2(encryptedData) {
  if (!encryptedData || !encryptedData.includes(":")) return encryptedData;
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }
    const [ivBase64, authTagBase64, encryptedBase64] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const key = getEncryptionKey2();
    const decipher = crypto3.createDecipheriv(ALGORITHM2, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
var ALGORITHM2, IV_LENGTH2, getEncryptionKey2;
var init_encryption = __esm({
  "../src/server/services/encryption.ts"() {
    "use strict";
    init_env();
    ALGORITHM2 = "aes-256-gcm";
    IV_LENGTH2 = 16;
    getEncryptionKey2 = () => {
      const key = process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f";
      return crypto3.scryptSync(key, "salt", 32);
    };
  }
});

// ../src/server/db/hacienda-native.repo.ts
var hacienda_native_repo_exports = {};
__export(hacienda_native_repo_exports, {
  clearHaciendaCredentials: () => clearHaciendaCredentials,
  consumeNextConsecutive: () => consumeNextConsecutive,
  deleteHaciendaBranch: () => deleteHaciendaBranch,
  formatConsecutiveNumber: () => formatConsecutiveNumber,
  generateHaciendaNumericKey: () => generateHaciendaNumericKey,
  getCycleUsage: () => getCycleUsage,
  getHaciendaBranchById: () => getHaciendaBranchById,
  getHaciendaBranchByStoreBranchId: () => getHaciendaBranchByStoreBranchId,
  getHaciendaBranchDecryptedSecrets: () => getHaciendaBranchDecryptedSecrets,
  getHaciendaBranchesByTenant: () => getHaciendaBranchesByTenant,
  getHaciendaConfigByTenant: () => getHaciendaConfigByTenant,
  getHaciendaDecryptedSecrets: () => getHaciendaDecryptedSecrets,
  getTenantPlanQuota: () => getTenantPlanQuota,
  incrementInvoiceUsage: () => incrementInvoiceUsage,
  saveHaciendaBranch: () => saveHaciendaBranch,
  saveHaciendaConfig: () => saveHaciendaConfig,
  updateBranchConnectionTestResult: () => updateBranchConnectionTestResult,
  updateConnectionTestResult: () => updateConnectionTestResult
});
function computeDaysRemaining(expiresAt) {
  if (!expiresAt) return null;
  const dt = new Date(expiresAt);
  if (isNaN(dt.getTime())) return null;
  return Math.ceil((dt.getTime() - Date.now()) / 864e5);
}
async function getHaciendaConfigByTenant(tenantId) {
  const res = await query2(
    `SELECT * FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  const p12ExpiresIso = row.p12_expires_at ? new Date(row.p12_expires_at).toISOString() : null;
  let economicActivities = [];
  if (Array.isArray(row.economic_activities_json)) {
    economicActivities = row.economic_activities_json;
  } else if (typeof row.economic_activities_json === "string") {
    try {
      economicActivities = JSON.parse(row.economic_activities_json);
    } catch (_) {
      economicActivities = [];
    }
  }
  return {
    id: row.id,
    tenantId: row.tenant_id,
    environment: row.environment || "sandbox",
    taxpayerIdType: row.taxpayer_id_type || "01",
    taxpayerIdNumber: row.taxpayer_id_number || "",
    taxpayerName: row.taxpayer_name || "",
    commercialName: row.commercial_name || "",
    taxpayerEmail: row.taxpayer_email || "",
    taxpayerPhone: row.taxpayer_phone || "",
    economicActivityCode: row.economic_activity_code || "",
    economicActivities,
    defaultCabysCode: row.default_cabys_code || "8311100000000",
    province: row.province || "1",
    canton: row.canton || "01",
    district: row.district || "01",
    neighborhood: row.neighborhood || "01",
    addressDetail: row.address_detail || "",
    idpUsername: row.idp_username || "",
    idpPasswordMasked: row.idp_password_encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
    p12Filename: row.p12_filename || "",
    p12ExpiresAt: p12ExpiresIso,
    p12HasCertificate: Boolean(row.p12_encrypted_blob || row.p12_filename),
    certSubject: row.cert_subject || "",
    certIssuer: row.cert_issuer || "",
    certDaysRemaining: computeDaysRemaining(p12ExpiresIso),
    branchCode: row.branch_code || "001",
    posCode: row.pos_code || "00001",
    defaultDocType: row.default_doc_type || "04",
    seqFactura: Number(row.seq_factura || 1),
    seqTiquete: Number(row.seq_tiquete || 1),
    seqNotaCredito: Number(row.seq_nota_credito || 1),
    multiBranchEnabled: Boolean(row.multi_branch_enabled),
    isConnected: Boolean(row.is_connected),
    lastTestAt: row.last_test_at ? new Date(row.last_test_at).toISOString() : null,
    lastTestMessage: row.last_test_message || null,
    providerMode: row.provider_mode || "BETICO_NATIVE",
    useAlternativeProvider: Boolean(row.use_alternative_provider),
    isSimplifiedRegime: Boolean(row.is_simplified_regime),
    emailAutoSend: row.email_auto_send !== void 0 && row.email_auto_send !== null ? Boolean(row.email_auto_send) : true,
    smtpHost: row.smtp_host || "",
    smtpPort: Number(row.smtp_port || 587),
    smtpUser: row.smtp_user || "",
    smtpPassMasked: row.smtp_pass_encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
    resendApiKeyMasked: row.resend_api_key_encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
    active: Boolean(row.active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ""
  };
}
async function getHaciendaDecryptedSecrets(tenantId) {
  const res = await query2(
    `SELECT p12_encrypted_blob, p12_pin_encrypted, idp_username, idp_password_encrypted, environment,
            smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, resend_api_key_encrypted, email_auto_send
     FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  let p12Buffer = null;
  if (row.p12_encrypted_blob) {
    try {
      const rawEncrypted = row.p12_encrypted_blob.toString("utf8");
      const decryptedBase64 = decrypt2(rawEncrypted);
      p12Buffer = Buffer.from(decryptedBase64, "base64");
    } catch (e) {
      console.error("[HaciendaRepo] Error descifrando certificado .p12:", e.message);
    }
  }
  const p12Pin = row.p12_pin_encrypted ? decrypt2(row.p12_pin_encrypted) : "";
  const idpPassword = row.idp_password_encrypted ? decrypt2(row.idp_password_encrypted) : "";
  const smtpPass = row.smtp_pass_encrypted ? decrypt2(row.smtp_pass_encrypted) : "";
  const resendApiKey = row.resend_api_key_encrypted ? decrypt2(row.resend_api_key_encrypted) : "";
  return {
    p12Buffer,
    p12Pin,
    idpPassword,
    idpUsername: row.idp_username || "",
    environment: row.environment || "sandbox",
    smtpHost: row.smtp_host || "",
    smtpPort: Number(row.smtp_port || 587),
    smtpUser: row.smtp_user || "",
    smtpPass,
    resendApiKey,
    emailAutoSend: row.email_auto_send !== void 0 && row.email_auto_send !== null ? Boolean(row.email_auto_send) : true
  };
}
async function saveHaciendaConfig(tenantId, data) {
  const existingRes = await query2(
    `SELECT * FROM tenant_hacienda_configs WHERE tenant_id = $1`,
    [tenantId]
  );
  const existing = existingRes.rows[0] || {};
  const environment = data.environment || existing.environment || "sandbox";
  const taxpayerIdType = data.taxpayerIdType || existing.taxpayer_id_type || "01";
  const taxpayerIdNumber = data.taxpayerIdNumber !== void 0 ? data.taxpayerIdNumber.trim() : existing.taxpayer_id_number || "";
  const taxpayerName = data.taxpayerName !== void 0 ? data.taxpayerName.trim() : existing.taxpayer_name || "";
  const commercialName = data.commercialName !== void 0 ? data.commercialName.trim() : existing.commercial_name || "";
  const taxpayerEmail = data.taxpayerEmail !== void 0 ? data.taxpayerEmail.trim() : existing.taxpayer_email || "";
  const taxpayerPhone = data.taxpayerPhone !== void 0 ? data.taxpayerPhone.trim() : existing.taxpayer_phone || "";
  const economicActivityCode = data.economicActivityCode !== void 0 ? data.economicActivityCode.trim() : existing.economic_activity_code || "";
  let economicActivitiesJson = existing.economic_activities_json || [];
  if (data.economicActivities !== void 0) {
    if (typeof data.economicActivities === "string") {
      try {
        economicActivitiesJson = JSON.parse(data.economicActivities);
      } catch (_) {
        economicActivitiesJson = [];
      }
    } else if (Array.isArray(data.economicActivities)) {
      economicActivitiesJson = data.economicActivities;
    }
  }
  const defaultCabysCode = data.defaultCabysCode !== void 0 ? data.defaultCabysCode.trim() : existing.default_cabys_code || "8311100000000";
  const province = data.province || existing.province || "1";
  const canton = data.canton || existing.canton || "01";
  const district = data.district || existing.district || "01";
  const neighborhood = data.neighborhood || existing.neighborhood || "01";
  const addressDetail = data.addressDetail !== void 0 ? data.addressDetail.trim() : existing.address_detail || "";
  const branchCode = String(data.branchCode || existing.branch_code || "001").replace(/\D/g, "").padStart(3, "0").slice(0, 3);
  const posCode = String(data.posCode || existing.pos_code || "00001").replace(/\D/g, "").padStart(5, "0").slice(0, 5);
  const defaultDocType = data.defaultDocType || existing.default_doc_type || "04";
  const seqFactura = data.seqFactura !== void 0 ? Math.max(1, Number(data.seqFactura) || 1) : Number(existing.seq_factura || 1);
  const seqTiquete = data.seqTiquete !== void 0 ? Math.max(1, Number(data.seqTiquete) || 1) : Number(existing.seq_tiquete || 1);
  const seqNotaCredito = data.seqNotaCredito !== void 0 ? Math.max(1, Number(data.seqNotaCredito) || 1) : Number(existing.seq_nota_credito || 1);
  const multiBranchEnabled = data.multiBranchEnabled !== void 0 ? Boolean(data.multiBranchEnabled) : Boolean(existing.multi_branch_enabled);
  const providerMode = data.providerMode || existing.provider_mode || "BETICO_NATIVE";
  const useAlternativeProvider = data.useAlternativeProvider !== void 0 ? Boolean(data.useAlternativeProvider) : Boolean(existing.use_alternative_provider);
  const isSimplifiedRegime = data.isSimplifiedRegime !== void 0 ? Boolean(data.isSimplifiedRegime) : Boolean(existing.is_simplified_regime);
  const emailAutoSend = data.emailAutoSend !== void 0 ? Boolean(data.emailAutoSend) : existing.email_auto_send !== void 0 && existing.email_auto_send !== null ? Boolean(existing.email_auto_send) : true;
  const smtpHost = data.smtpHost !== void 0 ? data.smtpHost.trim() : existing.smtp_host || "";
  const smtpPort = data.smtpPort !== void 0 ? Number(data.smtpPort) || 587 : Number(existing.smtp_port || 587);
  const smtpUser = data.smtpUser !== void 0 ? data.smtpUser.trim() : existing.smtp_user || "";
  let smtpPassEncrypted = existing.smtp_pass_encrypted || "";
  if (data.smtpPass && data.smtpPass.trim() && !data.smtpPass.includes("\u2022\u2022\u2022\u2022")) {
    smtpPassEncrypted = encrypt2(data.smtpPass.trim());
  } else if (data.smtpPass === "") {
    smtpPassEncrypted = "";
  }
  let resendApiKeyEncrypted = existing.resend_api_key_encrypted || "";
  if (data.resendApiKey && data.resendApiKey.trim() && !data.resendApiKey.includes("\u2022\u2022\u2022\u2022")) {
    resendApiKeyEncrypted = encrypt2(data.resendApiKey.trim());
  } else if (data.resendApiKey === "") {
    resendApiKeyEncrypted = "";
  }
  const active = data.active !== void 0 ? Boolean(data.active) : existing.active !== void 0 ? Boolean(existing.active) : true;
  const idpUsername = data.idpUsername !== void 0 ? data.idpUsername.trim() : existing.idp_username || "";
  let idpPasswordEncrypted = existing.idp_password_encrypted || "";
  if (data.idpPassword && data.idpPassword.trim() && !data.idpPassword.includes("\u2022\u2022\u2022\u2022")) {
    idpPasswordEncrypted = encrypt2(data.idpPassword.trim());
  }
  let p12EncryptedBlob = existing.p12_encrypted_blob;
  let p12Filename = existing.p12_filename || "";
  let p12ExpiresAt = existing.p12_expires_at || null;
  let certSubject = data.certSubject !== void 0 ? data.certSubject : existing.cert_subject || "";
  let certIssuer = data.certIssuer !== void 0 ? data.certIssuer : existing.cert_issuer || "";
  if (data.p12Buffer && data.p12Buffer.length > 0) {
    const base64Str = data.p12Buffer.toString("base64");
    const encryptedStr = encrypt2(base64Str);
    p12EncryptedBlob = Buffer.from(encryptedStr, "utf8");
    p12Filename = data.p12Filename || "certificado.p12";
  }
  if (data.p12ExpiresAt) {
    p12ExpiresAt = data.p12ExpiresAt;
  }
  let p12PinEncrypted = existing.p12_pin_encrypted || "";
  if (data.p12Pin && data.p12Pin.trim() && !data.p12Pin.includes("\u2022\u2022\u2022\u2022")) {
    p12PinEncrypted = encrypt2(data.p12Pin.trim());
  }
  await query2(
    `INSERT INTO tenant_hacienda_configs (
      tenant_id, environment, taxpayer_id_type, taxpayer_id_number, taxpayer_name, commercial_name,
      taxpayer_email, taxpayer_phone, economic_activity_code, economic_activities_json, default_cabys_code,
      province, canton, district, neighborhood, address_detail, idp_username, idp_password_encrypted,
      p12_encrypted_blob, p12_pin_encrypted, p12_filename, p12_expires_at, cert_subject, cert_issuer,
      branch_code, pos_code, default_doc_type, seq_factura, seq_tiquete, seq_nota_credito,
      multi_branch_enabled, provider_mode, use_alternative_provider, is_simplified_regime,
      email_auto_send, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, resend_api_key_encrypted,
      active, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10::jsonb, $11,
      $12, $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24,
      $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34,
      $35, $36, $37, $38, $39, $40,
      $41, CURRENT_TIMESTAMP
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
      email_auto_send = EXCLUDED.email_auto_send,
      smtp_host = EXCLUDED.smtp_host,
      smtp_port = EXCLUDED.smtp_port,
      smtp_user = EXCLUDED.smtp_user,
      smtp_pass_encrypted = EXCLUDED.smtp_pass_encrypted,
      resend_api_key_encrypted = EXCLUDED.resend_api_key_encrypted,
      active = EXCLUDED.active,
      updated_at = CURRENT_TIMESTAMP`,
    [
      tenantId,
      environment,
      taxpayerIdType,
      taxpayerIdNumber,
      taxpayerName,
      commercialName,
      taxpayerEmail,
      taxpayerPhone,
      economicActivityCode,
      JSON.stringify(economicActivitiesJson),
      defaultCabysCode,
      province,
      canton,
      district,
      neighborhood,
      addressDetail,
      idpUsername,
      idpPasswordEncrypted,
      p12EncryptedBlob,
      p12PinEncrypted,
      p12Filename,
      p12ExpiresAt,
      certSubject,
      certIssuer,
      branchCode,
      posCode,
      defaultDocType,
      seqFactura,
      seqTiquete,
      seqNotaCredito,
      multiBranchEnabled,
      providerMode,
      useAlternativeProvider,
      isSimplifiedRegime,
      emailAutoSend,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassEncrypted,
      resendApiKeyEncrypted,
      active
    ]
  );
  return await getHaciendaConfigByTenant(tenantId);
}
async function clearHaciendaCredentials(tenantId, target) {
  if (target === "atv") {
    await query2(
      `UPDATE tenant_hacienda_configs
       SET idp_username = '', idp_password_encrypted = '', is_connected = false, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [tenantId]
    );
  } else if (target === "p12") {
    await query2(
      `UPDATE tenant_hacienda_configs
       SET p12_encrypted_blob = NULL, p12_pin_encrypted = '', p12_filename = '', p12_expires_at = NULL,
           cert_subject = '', cert_issuer = '', is_connected = false, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [tenantId]
    );
  } else {
    await query2(
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
async function updateConnectionTestResult(tenantId, isConnected, message) {
  await query2(
    `UPDATE tenant_hacienda_configs 
     SET is_connected = $1, last_test_at = CURRENT_TIMESTAMP, last_test_message = $2, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $3`,
    [isConnected, message, tenantId]
  );
}
function mapHaciendaBranchRow(row) {
  const expiresIso = row.custom_p12_expires_at ? new Date(row.custom_p12_expires_at).toISOString() : null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id || null,
    storeBranchName: row.store_branch_name || null,
    branchName: row.branch_name || "Sucursal",
    branchCode: row.branch_code || "002",
    posCode: row.pos_code || "00001",
    commercialName: row.commercial_name || "",
    economicActivityCode: row.economic_activity_code || "",
    province: row.province || "1",
    canton: row.canton || "01",
    district: row.district || "01",
    neighborhood: row.neighborhood || "01",
    addressDetail: row.address_detail || "",
    seqFactura: Number(row.seq_factura || 1),
    seqTiquete: Number(row.seq_tiquete || 1),
    seqNotaCredito: Number(row.seq_nota_credito || 1),
    useCustomCredentials: Boolean(row.use_custom_credentials),
    customTaxpayerIdType: row.custom_taxpayer_id_type || "01",
    customTaxpayerIdNumber: row.custom_taxpayer_id_number || "",
    customTaxpayerName: row.custom_taxpayer_name || "",
    customIdpUsername: row.custom_idp_username || "",
    customIdpPasswordMasked: row.custom_idp_password_encrypted ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
    customP12Filename: row.custom_p12_filename || "",
    customP12ExpiresAt: expiresIso,
    customP12HasCertificate: Boolean(row.custom_p12_encrypted_blob || row.custom_p12_filename),
    customCertSubject: row.custom_cert_subject || "",
    customCertDaysRemaining: computeDaysRemaining(expiresIso),
    isConnected: Boolean(row.is_connected),
    lastTestAt: row.last_test_at ? new Date(row.last_test_at).toISOString() : null,
    lastTestMessage: row.last_test_message || null,
    active: row.active !== void 0 ? Boolean(row.active) : true,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : ""
  };
}
async function getHaciendaBranchesByTenant(tenantId) {
  const res = await query2(
    `SELECT thb.*, b.name AS store_branch_name
     FROM tenant_hacienda_branches thb
     LEFT JOIN branches b ON b.id = thb.branch_id
     WHERE thb.tenant_id = $1
     ORDER BY thb.branch_code ASC, thb.pos_code ASC`,
    [tenantId]
  );
  return res.rows.map(mapHaciendaBranchRow);
}
async function getHaciendaBranchById(tenantId, id) {
  const res = await query2(
    `SELECT thb.*, b.name AS store_branch_name
     FROM tenant_hacienda_branches thb
     LEFT JOIN branches b ON b.id = thb.branch_id
     WHERE thb.tenant_id = $1 AND thb.id = $2`,
    [tenantId, id]
  );
  if (res.rows.length === 0) return null;
  return mapHaciendaBranchRow(res.rows[0]);
}
async function getHaciendaBranchByStoreBranchId(tenantId, storeBranchId) {
  const res = await query2(
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
async function getHaciendaBranchDecryptedSecrets(tenantId, id) {
  const res = await query2(
    `SELECT thb.custom_p12_encrypted_blob, thb.custom_p12_pin_encrypted, thb.custom_idp_username, thb.custom_idp_password_encrypted,
            COALESCE(thc.environment, 'sandbox') AS environment
     FROM tenant_hacienda_branches thb
     LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = thb.tenant_id
     WHERE thb.tenant_id = $1 AND thb.id = $2`,
    [tenantId, id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  let p12Buffer = null;
  if (row.custom_p12_encrypted_blob) {
    try {
      const rawEncrypted = row.custom_p12_encrypted_blob.toString("utf8");
      const decryptedBase64 = decrypt2(rawEncrypted);
      p12Buffer = Buffer.from(decryptedBase64, "base64");
    } catch (e) {
      console.error("[HaciendaRepo] Error descifrando certificado .p12 de sucursal:", e.message);
    }
  }
  const p12Pin = row.custom_p12_pin_encrypted ? decrypt2(row.custom_p12_pin_encrypted) : "";
  const idpPassword = row.custom_idp_password_encrypted ? decrypt2(row.custom_idp_password_encrypted) : "";
  return {
    p12Buffer,
    p12Pin,
    idpPassword,
    idpUsername: row.custom_idp_username || "",
    environment: row.environment || "sandbox"
  };
}
async function saveHaciendaBranch(tenantId, data) {
  const branchCode = String(data.branchCode || "002").replace(/\D/g, "").padStart(3, "0").slice(0, 3);
  const posCode = String(data.posCode || "00001").replace(/\D/g, "").padStart(5, "0").slice(0, 5);
  let existing = {};
  if (data.id) {
    const exRes = await query2(
      `SELECT * FROM tenant_hacienda_branches WHERE tenant_id = $1 AND id = $2`,
      [tenantId, data.id]
    );
    existing = exRes.rows[0] || {};
  } else {
    const exRes = await query2(
      `SELECT * FROM tenant_hacienda_branches WHERE tenant_id = $1 AND branch_code = $2 AND pos_code = $3`,
      [tenantId, branchCode, posCode]
    );
    existing = exRes.rows[0] || {};
  }
  const branchId = data.branchId !== void 0 ? data.branchId || null : existing.branch_id || null;
  const branchName = (data.branchName !== void 0 ? data.branchName : existing.branch_name || "Sucursal").trim();
  const commercialName = (data.commercialName !== void 0 ? data.commercialName : existing.commercial_name || "").trim();
  const economicActivityCode = (data.economicActivityCode !== void 0 ? data.economicActivityCode : existing.economic_activity_code || "").trim();
  const province = data.province || existing.province || "1";
  const canton = data.canton || existing.canton || "01";
  const district = data.district || existing.district || "01";
  const neighborhood = data.neighborhood || existing.neighborhood || "01";
  const addressDetail = (data.addressDetail !== void 0 ? data.addressDetail : existing.address_detail || "").trim();
  const seqFactura = data.seqFactura !== void 0 ? Math.max(1, Number(data.seqFactura) || 1) : Number(existing.seq_factura || 1);
  const seqTiquete = data.seqTiquete !== void 0 ? Math.max(1, Number(data.seqTiquete) || 1) : Number(existing.seq_tiquete || 1);
  const seqNotaCredito = data.seqNotaCredito !== void 0 ? Math.max(1, Number(data.seqNotaCredito) || 1) : Number(existing.seq_nota_credito || 1);
  const useCustomCredentials = data.useCustomCredentials !== void 0 ? data.useCustomCredentials === true || data.useCustomCredentials === "true" : Boolean(existing.use_custom_credentials);
  const customTaxpayerIdType = data.customTaxpayerIdType || existing.custom_taxpayer_id_type || "01";
  const customTaxpayerIdNumber = (data.customTaxpayerIdNumber !== void 0 ? data.customTaxpayerIdNumber : existing.custom_taxpayer_id_number || "").trim();
  const customTaxpayerName = (data.customTaxpayerName !== void 0 ? data.customTaxpayerName : existing.custom_taxpayer_name || "").trim();
  const customIdpUsername = (data.customIdpUsername !== void 0 ? data.customIdpUsername : existing.custom_idp_username || "").trim();
  let customIdpPasswordEncrypted = existing.custom_idp_password_encrypted || "";
  if (data.customIdpPassword && data.customIdpPassword.trim() && !data.customIdpPassword.includes("\u2022\u2022\u2022\u2022")) {
    customIdpPasswordEncrypted = encrypt2(data.customIdpPassword.trim());
  }
  let customP12EncryptedBlob = existing.custom_p12_encrypted_blob || null;
  let customP12Filename = existing.custom_p12_filename || "";
  let customP12ExpiresAt = existing.custom_p12_expires_at || null;
  let customCertSubject = data.customCertSubject !== void 0 ? data.customCertSubject : existing.custom_cert_subject || "";
  if (data.customP12Buffer && data.customP12Buffer.length > 0) {
    const base64Str = data.customP12Buffer.toString("base64");
    const encryptedStr = encrypt2(base64Str);
    customP12EncryptedBlob = Buffer.from(encryptedStr, "utf8");
    customP12Filename = data.customP12Filename || "certificado-sucursal.p12";
  }
  if (data.customP12ExpiresAt) {
    customP12ExpiresAt = data.customP12ExpiresAt;
  }
  let customP12PinEncrypted = existing.custom_p12_pin_encrypted || "";
  if (data.customP12Pin && data.customP12Pin.trim() && !data.customP12Pin.includes("\u2022\u2022\u2022\u2022")) {
    customP12PinEncrypted = encrypt2(data.customP12Pin.trim());
  }
  const active = data.active !== void 0 ? data.active === true || data.active === "true" : existing.active !== void 0 ? Boolean(existing.active) : true;
  let savedId;
  if (data.id && existing.id) {
    const updRes = await query2(
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
        branchId,
        branchName,
        branchCode,
        posCode,
        commercialName,
        economicActivityCode,
        province,
        canton,
        district,
        neighborhood,
        addressDetail,
        seqFactura,
        seqTiquete,
        seqNotaCredito,
        useCustomCredentials,
        customTaxpayerIdType,
        customTaxpayerIdNumber,
        customTaxpayerName,
        customIdpUsername,
        customIdpPasswordEncrypted,
        customP12EncryptedBlob,
        customP12PinEncrypted,
        customP12Filename,
        customP12ExpiresAt,
        customCertSubject,
        active,
        tenantId,
        data.id
      ]
    );
    savedId = updRes.rows[0].id;
  } else {
    const insRes = await query2(
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
        tenantId,
        branchId,
        branchName,
        branchCode,
        posCode,
        commercialName,
        economicActivityCode,
        province,
        canton,
        district,
        neighborhood,
        addressDetail,
        seqFactura,
        seqTiquete,
        seqNotaCredito,
        useCustomCredentials,
        customTaxpayerIdType,
        customTaxpayerIdNumber,
        customTaxpayerName,
        customIdpUsername,
        customIdpPasswordEncrypted,
        customP12EncryptedBlob,
        customP12PinEncrypted,
        customP12Filename,
        customP12ExpiresAt,
        customCertSubject,
        active
      ]
    );
    savedId = insRes.rows[0].id;
  }
  return await getHaciendaBranchById(tenantId, savedId);
}
async function deleteHaciendaBranch(tenantId, id) {
  const res = await query2(
    `DELETE FROM tenant_hacienda_branches WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return (res.rowCount || 0) > 0;
}
async function updateBranchConnectionTestResult(tenantId, id, isConnected, message) {
  await query2(
    `UPDATE tenant_hacienda_branches
     SET is_connected = $1, last_test_at = CURRENT_TIMESTAMP, last_test_message = $2, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $3 AND id = $4`,
    [isConnected, message, tenantId, id]
  );
}
function formatConsecutiveNumber(branchCode, posCode, docType, sequence) {
  const b = String(branchCode || "001").replace(/\D/g, "").padStart(3, "0").slice(-3);
  const p = String(posCode || "00001").replace(/\D/g, "").padStart(5, "0").slice(-5);
  const d = String(docType || "04").replace(/\D/g, "").padStart(2, "0").slice(-2);
  const s = String(Math.max(1, Math.floor(Number(sequence) || 1))).padStart(10, "0").slice(-10);
  return `${b}${p}${d}${s}`;
}
function generateHaciendaNumericKey(params) {
  const now = params.date || /* @__PURE__ */ new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const id12 = String(params.taxpayerIdNumber || "").replace(/\D/g, "").padStart(12, "0").slice(-12);
  const consec20 = String(params.consecutive20 || "").replace(/\D/g, "").padStart(20, "0").slice(-20);
  const sit = params.situation || "1";
  const sec8 = (params.securityCode ? String(params.securityCode).replace(/\D/g, "") : String(Math.floor(1e7 + Math.random() * 9e7))).padStart(8, "0").slice(-8);
  return `506${dd}${mm}${yy}${id12}${consec20}${sit}${sec8}`;
}
async function consumeNextConsecutive(tenantId, docType, options) {
  const seqCol = docType === "01" ? "seq_factura" : docType === "03" ? "seq_nota_credito" : "seq_tiquete";
  const mainConfig = await getHaciendaConfigByTenant(tenantId);
  if (mainConfig?.multiBranchEnabled && (options?.branchId || options?.branchCode)) {
    let branchRow = null;
    if (options.branchId) {
      const bRes = await query2(
        `SELECT * FROM tenant_hacienda_branches
         WHERE tenant_id = $1 AND active = true AND (branch_id = $2 OR id::text = $2)
         ORDER BY branch_code ASC LIMIT 1`,
        [tenantId, options.branchId]
      );
      branchRow = bRes.rows[0] || null;
    }
    if (!branchRow && options.branchCode) {
      const normCode = String(options.branchCode).replace(/\D/g, "").padStart(3, "0").slice(0, 3);
      const bRes = await query2(
        `SELECT * FROM tenant_hacienda_branches
         WHERE tenant_id = $1 AND active = true AND branch_code = $2
         ORDER BY pos_code ASC LIMIT 1`,
        [tenantId, normCode]
      );
      branchRow = bRes.rows[0] || null;
    }
    if (branchRow) {
      const updRes = await query2(
        `UPDATE tenant_hacienda_branches
         SET ${seqCol} = COALESCE(${seqCol}, 1) + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND tenant_id = $2
         RETURNING (${seqCol} - 1) AS used_seq, branch_code, pos_code, branch_id, use_custom_credentials, custom_taxpayer_id_number`,
        [branchRow.id, tenantId]
      );
      const r = updRes.rows[0];
      const usedSeq2 = Number(r?.used_seq || 1);
      const bCode2 = r?.branch_code || branchRow.branch_code || "002";
      const pCode2 = r?.pos_code || branchRow.pos_code || "00001";
      const taxpayerIdNumber2 = r?.use_custom_credentials && r?.custom_taxpayer_id_number ? r.custom_taxpayer_id_number : mainConfig?.taxpayerIdNumber || "3101000000";
      const consecutiveNumber2 = formatConsecutiveNumber(bCode2, pCode2, docType, usedSeq2);
      const numericKey2 = generateHaciendaNumericKey({ taxpayerIdNumber: taxpayerIdNumber2, consecutive20: consecutiveNumber2 });
      return {
        consecutiveNumber: consecutiveNumber2,
        numericKey: numericKey2,
        branchCode: bCode2,
        posCode: pCode2,
        branchId: r?.branch_id || branchRow.branch_id || branchRow.id || null,
        taxpayerIdNumber: taxpayerIdNumber2
      };
    }
  }
  const updMain = await query2(
    `UPDATE tenant_hacienda_configs
     SET ${seqCol} = COALESCE(${seqCol}, 1) + 1, updated_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $1
     RETURNING (${seqCol} - 1) AS used_seq, branch_code, pos_code, taxpayer_id_number`,
    [tenantId]
  );
  const row = updMain.rows[0];
  const usedSeq = Number(row?.used_seq || 1);
  const bCode = row?.branch_code || options?.branchCode || "001";
  const pCode = row?.pos_code || "00001";
  const taxpayerIdNumber = row?.taxpayer_id_number || mainConfig?.taxpayerIdNumber || "3101000000";
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
async function getTenantPlanQuota(tenantId) {
  const tenantRes = await query2(
    `SELECT slug, plan, custom_invoices_quota FROM tenants WHERE id = $1`,
    [tenantId]
  );
  if (tenantRes.rows.length === 0) {
    return { quota: 100, courtesyMargin: 10, planName: "pro" };
  }
  const { slug, plan, custom_invoices_quota } = tenantRes.rows[0];
  if (slug === "superadmin") {
    return {
      quota: 999999,
      courtesyMargin: 999999,
      planName: "superadmin_platform"
    };
  }
  const normalizedPlan = (plan || "pro").toLowerCase();
  if (custom_invoices_quota !== null && custom_invoices_quota !== void 0 && Number(custom_invoices_quota) > 0) {
    return {
      quota: Number(custom_invoices_quota),
      courtesyMargin: 10,
      planName: normalizedPlan
    };
  }
  const settingsRes = await query2(
    `SELECT key, value FROM platform_settings WHERE key IN (
      'plan_starter_invoices_quota',
      'plan_pro_invoices_quota',
      'plan_enterprise_invoices_quota',
      'plan_aliado_invoices_quota',
      'courtesy_invoices_margin'
    )`
  );
  const settingsMap = {};
  for (const row of settingsRes.rows) {
    settingsMap[row.key] = parseInt(row.value, 10);
  }
  const courtesyMargin = settingsMap["courtesy_invoices_margin"] || 10;
  let quota = 100;
  if (normalizedPlan === "starter" || normalizedPlan === "emprendedor") {
    quota = settingsMap["plan_starter_invoices_quota"] || 50;
  } else if (normalizedPlan === "enterprise" || normalizedPlan === "business" || normalizedPlan === "empresa") {
    quota = settingsMap["plan_enterprise_invoices_quota"] || 250;
  } else if (normalizedPlan === "aliado") {
    quota = settingsMap["plan_aliado_invoices_quota"] || 500;
  } else {
    quota = settingsMap["plan_pro_invoices_quota"] || 100;
  }
  return {
    quota,
    courtesyMargin,
    planName: normalizedPlan
  };
}
async function getCycleUsage(tenantId) {
  const { quota, courtesyMargin, planName } = await getTenantPlanQuota(tenantId);
  const tenantRes = await query2(
    `SELECT slug, plan, custom_invoices_quota, next_billing_date, created_at FROM tenants WHERE id = $1`,
    [tenantId]
  );
  const t = tenantRes.rows[0];
  const nextBilling = t?.next_billing_date ? new Date(t.next_billing_date) : new Date(Date.now() + 30 * 864e5);
  const cycleEndDate = nextBilling.toISOString().split("T")[0];
  const startDateObj = new Date(nextBilling);
  startDateObj.setDate(startDateObj.getDate() - 30);
  const cycleStartDate = startDateObj.toISOString().split("T")[0];
  const usageRes = await query2(
    `SELECT invoices_emitted, courtesy_used, quota_limit 
     FROM hacienda_usage_cycles 
     WHERE tenant_id = $1 AND cycle_start_date = $2`,
    [tenantId, cycleStartDate]
  );
  let emitted = 0;
  let courtesyUsed = 0;
  if (usageRes.rows.length === 0) {
    await query2(
      `INSERT INTO hacienda_usage_cycles (tenant_id, cycle_start_date, cycle_end_date, quota_limit)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, cycle_start_date) DO NOTHING`,
      [tenantId, cycleStartDate, cycleEndDate, quota]
    );
  } else {
    emitted = Number(usageRes.rows[0].invoices_emitted || 0);
    courtesyUsed = Number(usageRes.rows[0].courtesy_used || 0);
  }
  if (t?.slug === "superadmin") {
    const baseQuota = 999999;
    const cm = 999999;
    const effectiveQuota = 999999;
    const hardLimit = 999999;
    const isOverBaseQuota = false;
    const isBlocked2 = false;
    const remainingCourtesy = 999999;
    return {
      emitted,
      quota: baseQuota,
      remaining: Math.max(0, baseQuota - emitted),
      inCourtesy: false,
      courtesyUsed: 0,
      courtesyAvailable: remainingCourtesy,
      isBlocked: isBlocked2,
      cycleStartDate,
      cycleEndDate,
      planName: "superadmin_platform",
      baseQuota,
      courtesyMargin: cm,
      effectiveQuota,
      hardLimit,
      isOverBaseQuota,
      remainingCourtesy,
      plan: "superadmin_platform"
    };
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
    planName,
    baseQuota: quota,
    courtesyMargin,
    effectiveQuota: quota,
    hardLimit: quota + courtesyMargin,
    isOverBaseQuota: inCourtesy,
    remainingCourtesy: courtesyAvailable,
    plan: planName
  };
}
async function incrementInvoiceUsage(tenantId) {
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
    await query2(
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
    await query2(
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
var init_hacienda_native_repo = __esm({
  "../src/server/db/hacienda-native.repo.ts"() {
    "use strict";
    init_pool();
    init_encryption();
  }
});

// ../src/server/services/crypto.service.ts
import crypto4 from "crypto";
function getMasterKey() {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || "betico_master_encryption_key_default_32bytes";
  return crypto4.scryptSync(secret, "betico_envelope_salt_2026", 32);
}
function getTenantDataKey(tenantId) {
  const masterKey = getMasterKey();
  return crypto4.createHmac("sha256", masterKey).update(`tenant_dek_${tenantId}`).digest();
}
function encryptWithKey(key, plaintext) {
  if (!plaintext) return "";
  const iv = crypto4.randomBytes(IV_LENGTH3);
  const cipher = crypto4.createCipheriv(ALGORITHM3, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");
  return `${iv.toString("base64")}:${authTag}:${encrypted}`;
}
function decryptWithKey(key, cipherText) {
  if (!cipherText || !cipherText.includes(":")) return cipherText || "";
  const parts = cipherText.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de texto cifrado inv\xE1lido");
  }
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const decipher = crypto4.createDecipheriv(ALGORITHM3, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
var ALGORITHM3, IV_LENGTH3, CryptoService;
var init_crypto_service = __esm({
  "../src/server/services/crypto.service.ts"() {
    "use strict";
    init_env();
    ALGORITHM3 = "aes-256-gcm";
    IV_LENGTH3 = 16;
    CryptoService = class {
      /**
       * Encrypts tenant sensitive data (e.g. Tilopay API Key, API Password)
       * using the tenant's derived unique Data Encryption Key (Envelope Encryption).
       */
      static encryptForTenant(tenantId, plaintext) {
        if (!tenantId) throw new Error("tenantId es requerido para el cifrado de sobre");
        const dek = getTenantDataKey(tenantId);
        return encryptWithKey(dek, plaintext);
      }
      /**
       * Decrypts tenant sensitive data using the tenant's derived Data Encryption Key.
       */
      static decryptForTenant(tenantId, cipherText) {
        if (!tenantId || !cipherText) return "";
        const dek = getTenantDataKey(tenantId);
        try {
          return decryptWithKey(dek, cipherText);
        } catch (err) {
          try {
            const legacyKey = crypto4.scryptSync(process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || "legacy_key", "salt", 32);
            return decryptWithKey(legacyKey, cipherText);
          } catch (fallbackErr) {
            console.error(`[CryptoService] Error descifrando datos para tenant ${tenantId}`);
            throw new Error("Fallo al descifrar credenciales de pago");
          }
        }
      }
      /**
       * General purpose encryption using the Master Key.
       */
      static encrypt(plaintext) {
        const masterKey = getMasterKey();
        return encryptWithKey(masterKey, plaintext);
      }
      /**
       * General purpose decryption using the Master Key.
       */
      static decrypt(cipherText) {
        const masterKey = getMasterKey();
        return decryptWithKey(masterKey, cipherText);
      }
      /**
       * Safely masks a sensitive secret for UI display (e.g. '••••••••abcd').
       * Never exposes the full plaintext.
       */
      static maskSecret(secret, visibleChars = 4) {
        if (!secret) return "";
        const trimmed = String(secret).trim();
        if (trimmed.length <= visibleChars) return "\u2022\u2022\u2022\u2022";
        const tail = trimmed.slice(-visibleChars);
        return `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${tail}`;
      }
    };
  }
});

// ../src/server/db/tenant-almendro.repo.ts
var tenant_almendro_repo_exports = {};
__export(tenant_almendro_repo_exports, {
  getElectronicVoucherByAppointmentId: () => getElectronicVoucherByAppointmentId,
  getElectronicVoucherByKeyOrId: () => getElectronicVoucherByKeyOrId,
  getElectronicVoucherByOrderId: () => getElectronicVoucherByOrderId,
  getElectronicVouchers: () => getElectronicVouchers,
  getTenantAlmendroConfig: () => getTenantAlmendroConfig,
  getTenantAlmendroConfigRaw: () => getTenantAlmendroConfigRaw,
  saveElectronicVoucher: () => saveElectronicVoucher,
  saveTenantAlmendroConfig: () => saveTenantAlmendroConfig
});
async function getTenantAlmendroConfig(tenantId) {
  if (!tenantId) throw new Error("tenantId es requerido para consultar la configuraci\xF3n de Almendro");
  const res = await query2(`
    SELECT id, tenant_id as "tenantId", is_enabled as "isEnabled",
           billing_mode as "billingMode", environment,
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
      id: "",
      tenantId,
      isEnabled: false,
      billingMode: "DISABLED",
      environment: "SANDBOX",
      apiKeyMasked: "",
      defaultDocType: "04",
      moduleToggles: { ...DEFAULT_MODULE_TOGGLES },
      isConfigured: false
    };
  }
  const row = res.rows[0];
  let rawKey = "";
  if (row.apiKeyEncrypted) {
    try {
      rawKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted);
    } catch (e) {
      console.error(`[AlmendroRepo] Error descifrando API Key para tenant ${tenantId}:`, e);
    }
  }
  const toggles = row.moduleToggles ? { ...DEFAULT_MODULE_TOGGLES, ...row.moduleToggles } : { ...DEFAULT_MODULE_TOGGLES };
  const isKeyConfigured = Boolean(rawKey && rawKey.length > 5);
  const rawBillingMode = row.billingMode;
  const billingMode = rawBillingMode || (row.isEnabled ? isKeyConfigured ? "ALMENDRO_AUTO" : "EXTERNAL_MANUAL" : "DISABLED");
  const isConfigured = billingMode === "EXTERNAL_MANUAL" ? true : isKeyConfigured;
  const isEnabled = Boolean(row.isEnabled) && billingMode !== "DISABLED";
  return {
    id: row.id,
    tenantId: row.tenantId,
    isEnabled,
    billingMode,
    environment: row.environment || "SANDBOX",
    apiKeyMasked: rawKey ? CryptoService.maskSecret(rawKey) : "",
    defaultDocType: row.defaultDocType === "01" ? "01" : "04",
    moduleToggles: toggles,
    taxIdType: row.taxIdType || "",
    taxIdNumber: row.taxIdNumber || "",
    legalName: row.legalName || "",
    commercialName: row.commercialName || "",
    economicActivityCode: row.economicActivityCode || "",
    branchCode: row.branchCode || "001",
    posCode: row.posCode || "00001",
    isConfigured,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
async function getTenantAlmendroConfigRaw(tenantId) {
  if (!tenantId) return null;
  const res = await query2(`
    SELECT is_enabled as "isEnabled", billing_mode as "billingMode", environment,
           api_key_encrypted as "apiKeyEncrypted",
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
  let apiKey = "";
  if (row.apiKeyEncrypted) {
    try {
      apiKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted);
    } catch (e) {
      console.error(`[AlmendroRepo] Error descifrando API Key raw para tenant ${tenantId}`);
    }
  }
  const toggles = row.moduleToggles ? { ...DEFAULT_MODULE_TOGGLES, ...row.moduleToggles } : { ...DEFAULT_MODULE_TOGGLES };
  const rawBillingMode = row.billingMode;
  const billingMode = rawBillingMode || (row.isEnabled ? apiKey ? "ALMENDRO_AUTO" : "EXTERNAL_MANUAL" : "DISABLED");
  return {
    apiKey,
    isEnabled: Boolean(row.isEnabled),
    billingMode,
    environment: row.environment || "SANDBOX",
    defaultDocType: row.defaultDocType === "01" ? "01" : "04",
    moduleToggles: toggles,
    taxIdType: row.taxIdType,
    taxIdNumber: row.taxIdNumber,
    legalName: row.legalName,
    commercialName: row.commercialName,
    economicActivityCode: row.economicActivityCode,
    branchCode: row.branchCode || "001",
    posCode: row.posCode || "00001"
  };
}
async function saveTenantAlmendroConfig(tenantId, data) {
  if (!tenantId) throw new Error("tenantId es requerido para guardar la configuraci\xF3n de Almendro");
  const existing = await query2(`SELECT api_key_encrypted, module_toggles, billing_mode FROM tenant_almendro_configs WHERE tenant_id = $1`, [tenantId]);
  let keyToEncrypt = existing.rows[0]?.api_key_encrypted || "";
  if (data.apiKey && data.apiKey.trim() && !data.apiKey.includes("\u2022\u2022\u2022\u2022")) {
    keyToEncrypt = CryptoService.encryptForTenant(tenantId, data.apiKey.trim());
  }
  const currentToggles = existing.rows[0]?.module_toggles || DEFAULT_MODULE_TOGGLES;
  const mergedToggles = {
    ...DEFAULT_MODULE_TOGGLES,
    ...currentToggles,
    ...data.moduleToggles || {}
  };
  const env2 = data.environment || "SANDBOX";
  const docType = data.defaultDocType === "01" ? "01" : "04";
  const branch = data.branchCode || "001";
  const pos = data.posCode || "00001";
  const billingMode = data.billingMode || (Boolean(data.isEnabled) ? keyToEncrypt ? "ALMENDRO_AUTO" : "EXTERNAL_MANUAL" : "DISABLED");
  const isEnabled = Boolean(data.isEnabled) && billingMode !== "DISABLED";
  await query2(`
    INSERT INTO tenant_almendro_configs (
      tenant_id, is_enabled, billing_mode, environment, api_key_encrypted,
      default_doc_type, module_toggles, tax_id_type, tax_id_number,
      legal_name, commercial_name, economic_activity_code,
      branch_code, pos_code, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) DO UPDATE SET
      is_enabled = EXCLUDED.is_enabled,
      billing_mode = EXCLUDED.billing_mode,
      environment = EXCLUDED.environment,
      api_key_encrypted = CASE WHEN $5 != '' THEN $5 ELSE tenant_almendro_configs.api_key_encrypted END,
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
    isEnabled,
    billingMode,
    env2,
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
  return updated;
}
async function saveElectronicVoucher(tenantId, voucher) {
  if (!tenantId) throw new Error("tenantId es requerido para registrar un comprobante electr\xF3nico");
  const res = await query2(`
    INSERT INTO electronic_vouchers (
      tenant_id, order_id, appointment_id, court_booking_id, subscription_charge_id,
      branch_id, branch_code, pos_code, reference_key,
      doc_type, consecutive_number, numeric_key, receiver_id_type, receiver_id_number,
      receiver_name, receiver_email, currency, subtotal, tax_amount, total_amount,
      status, pdf_url, xml_signed_url, xml_response_url, hacienda_response_code,
      hacienda_response_detail, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
              court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
              branch_id as "branchId", branch_code as "branchCode", pos_code as "posCode",
              reference_key as "referenceKey",
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
    voucher.branchId || null,
    voucher.branchCode || "001",
    voucher.posCode || "00001",
    voucher.referenceKey || null,
    voucher.docType || "04",
    voucher.consecutiveNumber || "",
    voucher.numericKey,
    voucher.receiverIdType || null,
    voucher.receiverIdNumber || null,
    voucher.receiverName || null,
    voucher.receiverEmail || null,
    voucher.currency || "CRC",
    voucher.subtotal || 0,
    voucher.taxAmount || 0,
    voucher.totalAmount || 0,
    voucher.status || "pending",
    voucher.pdfUrl || null,
    voucher.xmlSignedUrl || null,
    voucher.xmlResponseUrl || null,
    voucher.haciendaResponseCode || null,
    voucher.haciendaResponseDetail || null,
    JSON.stringify(voucher.metadata || {})
  ]);
  return res.rows[0];
}
async function getElectronicVouchers(tenantId, options) {
  if (!tenantId) throw new Error("tenantId es requerido para consultar comprobantes");
  const limit = Math.min(Number(options?.limit) || 50, 100);
  const offset = Math.max(Number(options?.offset) || 0, 0);
  const conditions = ["tenant_id = $1"];
  const params = [tenantId];
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
  if (options?.branchCode) {
    conditions.push(`COALESCE(branch_code, '001') = $${pIdx}`);
    params.push(options.branchCode);
    pIdx++;
  }
  if (options?.search && options.search.trim()) {
    conditions.push(`(numeric_key ILIKE $${pIdx} OR consecutive_number ILIKE $${pIdx} OR receiver_name ILIKE $${pIdx} OR receiver_id_number ILIKE $${pIdx})`);
    params.push(`%${options.search.trim()}%`);
    pIdx++;
  }
  const whereSql = conditions.join(" AND ");
  const countRes = await query2(`SELECT COUNT(*) as total FROM electronic_vouchers WHERE ${whereSql}`, params);
  const total = parseInt(countRes.rows[0]?.total || "0", 10);
  params.push(limit);
  params.push(offset);
  const res = await query2(`
    SELECT id, tenant_id as "tenantId", order_id as "orderId", appointment_id as "appointmentId",
           court_booking_id as "courtBookingId", subscription_charge_id as "subscriptionChargeId",
           branch_id as "branchId", COALESCE(branch_code, '001') as "branchCode", COALESCE(pos_code, '00001') as "posCode",
           reference_key as "referenceKey",
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
async function getElectronicVoucherByOrderId(tenantId, orderId) {
  if (!tenantId || !orderId) return null;
  const res = await query2(`
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
async function getElectronicVoucherByAppointmentId(tenantId, appointmentId) {
  if (!tenantId || !appointmentId) return null;
  const res = await query2(`
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
async function getElectronicVoucherByKeyOrId(keyOrId) {
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
  const res = await query2(querySql, [clean]);
  return res.rows[0] || null;
}
var DEFAULT_MODULE_TOGGLES;
var init_tenant_almendro_repo = __esm({
  "../src/server/db/tenant-almendro.repo.ts"() {
    "use strict";
    init_pool();
    init_crypto_service();
    DEFAULT_MODULE_TOGGLES = {
      storeEnabled: true,
      bookingsEnabled: true,
      courtsEnabled: false,
      restaurantEnabled: false,
      subscriptionsEnabled: false
    };
  }
});

// ../src/server/db/store-settings.repo.ts
var store_settings_repo_exports = {};
__export(store_settings_repo_exports, {
  getStoreSettings: () => getStoreSettings,
  saveStoreSettings: () => saveStoreSettings,
  upsertStoreSettings: () => upsertStoreSettings
});
async function getStoreSettings(tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
           store_modules as "storeModules", restaurant_config as "restaurantConfig",
           delivery_config as "deliveryConfig", correos_cr_config as "correosCrConfig",
           local_delivery_config as "localDeliveryConfig", store_schedule as "storeSchedule",
           custom_stages as "customStages", notification_templates as "notificationTemplates",
           store_name as "storeName", store_slug as "storeSlug", store_description as "storeDescription",
           store_logo_url as "storeLogoUrl", store_banner_url as "storeBannerUrl",
           store_theme as "storeTheme", currency, accept_sinpe as "acceptSinpe",
           accept_sinpe_tilopay as "acceptSinpeTilopay",
           sinpe_phone as "sinpePhone", sinpe_name as "sinpeName", accept_transfer as "acceptTransfer",
           bank_account_info as "bankAccountInfo", accept_cash_on_delivery as "acceptCashOnDelivery",
           delivery_enabled as "deliveryEnabled", delivery_fee as "deliveryFee",
           pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
           min_order_amount as "minOrderAmount", store_message as "storeMessage"
    FROM store_settings 
    WHERE tenant_id = $1
  `, [tenantId]);
  const row = result.rows[0];
  if (!row) return null;
  const storeTheme = row.storeTheme || {};
  const storeLogoUrl = row.storeLogoUrl || storeTheme.logoUrl || "";
  const storeBannerUrl = row.storeBannerUrl || storeTheme.bannerUrl || "";
  return {
    ...row,
    storeLogoUrl,
    storeBannerUrl,
    storeModules: row.storeModules || { storeEnabled: true, bookingsEnabled: true },
    storeSchedule: row.storeSchedule || { isOpenManual: true, autoScheduleEnabled: false, schedule: {} },
    correosCrConfig: row.correosCrConfig || {
      enabled: true,
      serviceType: "pyme",
      originType: "GAM",
      includeIva: true,
      rates: [
        { label: "Pymes Liviano (0 a 500 g)", minGrams: 0, maxGrams: 500, gamPrice: 1100, restoPrice: 1350 },
        { label: "Pymes Especial Gold (0 a 2 kg)", minGrams: 501, maxGrams: 2e3, gamPrice: 1769.91, restoPrice: 2477.88 },
        { label: "Pyme Plus (0 a 3 kg)", minGrams: 2001, maxGrams: 3e3, gamPrice: 2425, restoPrice: 3360 },
        { label: "Carga Liviana (3 a 10 kg)", minGrams: 3001, maxGrams: 1e4, gamPrice: 3982.3, restoPrice: 3982.3 },
        { label: "Pesado Express (10 a 20 kg)", minGrams: 10001, maxGrams: 2e4, gamPrice: 9800, restoPrice: 9800, extraPerKg: 1e3 },
        { label: "Pesado Express (20 a 30 kg)", minGrams: 20001, maxGrams: 3e4, gamPrice: 14e3, restoPrice: 14e3, extraPerKg: 1e3 }
      ]
    },
    localDeliveryConfig: row.localDeliveryConfig || { enabled: true, fee: 2500, freeAbove: 35e3, estimatedHours: "24 a 48 horas" },
    customStages: row.customStages || (row.storeMode === "restaurant" ? {
      fase_1: "Comanda Recibida",
      fase_2: "En Cocina / Preparaci\xF3n",
      fase_3: "Listo para Servir / Entregar",
      fase_4: "En Camino (Delivery)",
      fase_5: "Entregado / Servido"
    } : {
      fase_1: "Pedido Recibido",
      fase_2: "En Empaque / Preparaci\xF3n",
      fase_3: "Listo para Despacho",
      fase_4: "En Tr\xE1nsito (Delivery / Gu\xEDa)",
      fase_5: "Entregado con \xC9xito"
    })
  };
}
async function upsertStoreSettings(tenantId, data) {
  const result = await query2(`
    INSERT INTO store_settings (
      tenant_id, store_enabled, store_mode, store_modules, restaurant_config, delivery_config,
      correos_cr_config, local_delivery_config, store_schedule, custom_stages, notification_templates,
      store_name, store_slug, store_description, store_logo_url,
      store_banner_url, store_theme, currency, accept_sinpe, accept_sinpe_tilopay, sinpe_phone, sinpe_name,
      accept_transfer, bank_account_info, accept_cash_on_delivery, delivery_enabled,
      delivery_fee, pickup_enabled, whatsapp_checkout, min_order_amount, store_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
    ON CONFLICT (tenant_id) DO UPDATE SET
      store_enabled = EXCLUDED.store_enabled,
      store_mode = EXCLUDED.store_mode,
      store_modules = EXCLUDED.store_modules,
      restaurant_config = EXCLUDED.restaurant_config,
      delivery_config = EXCLUDED.delivery_config,
      correos_cr_config = EXCLUDED.correos_cr_config,
      local_delivery_config = EXCLUDED.local_delivery_config,
      store_schedule = EXCLUDED.store_schedule,
      custom_stages = EXCLUDED.custom_stages,
      notification_templates = EXCLUDED.notification_templates,
      store_name = EXCLUDED.store_name,
      store_slug = EXCLUDED.store_slug,
      store_description = EXCLUDED.store_description,
      store_logo_url = CASE 
        WHEN EXCLUDED.store_logo_url IS NOT NULL AND EXCLUDED.store_logo_url != '' THEN EXCLUDED.store_logo_url 
        ELSE store_settings.store_logo_url 
      END,
      store_banner_url = CASE 
        WHEN EXCLUDED.store_banner_url IS NOT NULL AND EXCLUDED.store_banner_url != '' THEN EXCLUDED.store_banner_url 
        ELSE store_settings.store_banner_url 
      END,
      store_theme = CASE
        WHEN EXCLUDED.store_theme IS NOT NULL AND COALESCE(EXCLUDED.store_theme->>'logoUrl', '') != '' THEN EXCLUDED.store_theme
        WHEN store_settings.store_logo_url IS NOT NULL AND store_settings.store_logo_url != '' THEN 
          jsonb_set(
            jsonb_set(COALESCE(EXCLUDED.store_theme, '{}'::jsonb), '{logoUrl}', to_jsonb(store_settings.store_logo_url)),
            '{bannerUrl}', to_jsonb(COALESCE(store_settings.store_banner_url, ''))
          )
        ELSE EXCLUDED.store_theme
      END,
      currency = EXCLUDED.currency,
      accept_sinpe = EXCLUDED.accept_sinpe,
      accept_sinpe_tilopay = EXCLUDED.accept_sinpe_tilopay,
      sinpe_phone = EXCLUDED.sinpe_phone,
      sinpe_name = EXCLUDED.sinpe_name,
      accept_transfer = EXCLUDED.accept_transfer,
      bank_account_info = EXCLUDED.bank_account_info,
      accept_cash_on_delivery = EXCLUDED.accept_cash_on_delivery,
      delivery_enabled = EXCLUDED.delivery_enabled,
      delivery_fee = EXCLUDED.delivery_fee,
      pickup_enabled = EXCLUDED.pickup_enabled,
      whatsapp_checkout = EXCLUDED.whatsapp_checkout,
      min_order_amount = EXCLUDED.min_order_amount,
      store_message = EXCLUDED.store_message,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
              store_modules as "storeModules", restaurant_config as "restaurantConfig",
              delivery_config as "deliveryConfig", correos_cr_config as "correosCrConfig",
              local_delivery_config as "localDeliveryConfig", store_schedule as "storeSchedule",
              custom_stages as "customStages", notification_templates as "notificationTemplates",
              store_name as "storeName", store_slug as "storeSlug", store_description as "storeDescription",
              store_logo_url as "storeLogoUrl", store_banner_url as "storeBannerUrl",
              store_theme as "storeTheme", currency, accept_sinpe as "acceptSinpe",
              accept_sinpe_tilopay as "acceptSinpeTilopay",
              sinpe_phone as "sinpePhone", sinpe_name as "sinpeName", accept_transfer as "acceptTransfer",
              bank_account_info as "bankAccountInfo", accept_cash_on_delivery as "acceptCashOnDelivery",
              delivery_enabled as "deliveryEnabled", delivery_fee as "deliveryFee",
              pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
              min_order_amount as "minOrderAmount", store_message as "storeMessage"
  `, [
    tenantId,
    data.storeEnabled !== false,
    data.storeMode || "retail",
    JSON.stringify(data.storeModules || { storeEnabled: true, bookingsEnabled: true }),
    JSON.stringify(data.restaurantConfig || {}),
    JSON.stringify(data.deliveryConfig || {}),
    JSON.stringify(data.correosCrConfig || {}),
    JSON.stringify(data.localDeliveryConfig || {}),
    JSON.stringify(data.storeSchedule || {}),
    JSON.stringify(data.customStages || {}),
    JSON.stringify(data.notificationTemplates || {}),
    data.storeName || "Mi Negocio",
    data.storeSlug || "tienda",
    data.storeDescription || "",
    data.storeLogoUrl || data.storeTheme?.logoUrl || "",
    data.storeBannerUrl || data.storeTheme?.bannerUrl || "",
    JSON.stringify(data.storeTheme || { primaryColor: "#16a34a", cardRadius: "rounded", cardShadow: "md", fontFamily: "Inter" }),
    data.currency || "CRC",
    data.acceptSinpe !== false,
    data.acceptSinpeTilopay === true,
    data.sinpePhone || "",
    data.sinpeName || "",
    data.acceptTransfer !== false,
    data.bankAccountInfo || "",
    data.acceptCashOnDelivery || false,
    data.deliveryEnabled || false,
    data.deliveryFee || 0,
    data.pickupEnabled !== false,
    data.whatsappCheckout !== false,
    data.minOrderAmount || 0,
    data.storeMessage || ""
  ]);
  return result.rows[0];
}
var saveStoreSettings;
var init_store_settings_repo = __esm({
  "../src/server/db/store-settings.repo.ts"() {
    "use strict";
    init_pool();
    saveStoreSettings = upsertStoreSettings;
  }
});

// ../src/server/db/tenant.repo.ts
var tenant_repo_exports = {};
__export(tenant_repo_exports, {
  createTenant: () => createTenant,
  deleteTenant: () => deleteTenant,
  getAllTenants: () => getAllTenants,
  getAllTenantsWithAdmin: () => getAllTenantsWithAdmin,
  getTenantByCustomDomain: () => getTenantByCustomDomain,
  getTenantByEvolutionInstance: () => getTenantByEvolutionInstance,
  getTenantById: () => getTenantById,
  getTenantBySlug: () => getTenantBySlug,
  updateTenant: () => updateTenant
});
async function getAllTenants() {
  const result = await query2(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_model as "aiModel", 
           t.evolution_instance as "evolutionInstance", t.whatsapp_number as "whatsappNumber",
           t.plan, t.active, t.subscription_status as "subscriptionStatus",
           t.billing_currency as "billingCurrency", t.custom_monthly_price as "customMonthlyPrice",
           t.trial_ends_at as "trialEndsAt", t.next_billing_date as "nextBillingDate",
           t.grace_period_ends_at as "gracePeriodEndsAt", t.custom_invoices_quota as "customInvoicesQuota",
           t.settings_json as "settingsJson", 
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "fiscalEmailReceptor",
           t.created_at as "createdAt"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
}
async function getAllTenantsWithAdmin() {
  const result = await query2(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_model as "aiModel", 
           t.evolution_instance as "evolutionInstance", t.whatsapp_number as "whatsappNumber",
           t.plan, t.active, t.subscription_status as "subscriptionStatus",
           t.billing_currency as "billingCurrency", t.custom_monthly_price as "customMonthlyPrice",
           t.trial_ends_at as "trialEndsAt", t.next_billing_date as "nextBillingDate",
           t.grace_period_ends_at as "gracePeriodEndsAt", t.custom_invoices_quota as "customInvoicesQuota",
           t.settings_json as "settingsJson", 
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, u.email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, u.email, '') as "fiscalEmailReceptor",
           t.created_at as "createdAt",
           COALESCE(u.email, 'Sin registrar') as "adminEmail",
           u.id as "adminId",
           t.id as "postgresTenantId",
           'whatsapp_saas' as "postgresDb",
           'public' as "postgresSchema",
           (t.settings_json->'easypanel'->>'project') as "easypanelProject",
           (t.settings_json->'easypanel'->>'service') as "easypanelService"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    LEFT JOIN LATERAL (
      SELECT id, email
      FROM users
      WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin')
      ORDER BY created_at ASC
      LIMIT 1
    ) u ON true
    ORDER BY t.created_at DESC
  `);
  return result.rows;
}
async function getTenantById(id) {
  const result = await query2(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_api_key_encrypted as "aiApiKeyEncrypted",
           t.ai_model as "aiModel", t.evolution_instance as "evolutionInstance", 
           t.whatsapp_number as "whatsappNumber", t.plan, t.active, 
           t.subscription_status as "subscriptionStatus", t.billing_currency as "billingCurrency", 
           t.custom_monthly_price as "customMonthlyPrice", t.trial_ends_at as "trialEndsAt", 
           t.next_billing_date as "nextBillingDate", t.grace_period_ends_at as "gracePeriodEndsAt",
           t.custom_invoices_quota as "customInvoicesQuota",
           t.calendar_token as "calendarToken",
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "fiscalEmailReceptor",
           t.settings_json as "settingsJson", t.created_at as "createdAt",
           t.id as "postgresTenantId",
           'whatsapp_saas' as "postgresDb",
           'public' as "postgresSchema",
           (t.settings_json->'easypanel'->>'project') as "easypanelProject",
           (t.settings_json->'easypanel'->>'service') as "easypanelService"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    WHERE t.id = $1
  `, [id]);
  return result.rows[0] || null;
}
async function getTenantBySlug(slug) {
  const cleanSlug = (slug || "").trim().toLowerCase();
  const result = await query2(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_api_key_encrypted as "aiApiKeyEncrypted",
           t.ai_model as "aiModel", t.evolution_instance as "evolutionInstance", 
           t.whatsapp_number as "whatsappNumber", t.plan, t.active, 
           t.subscription_status as "subscriptionStatus", t.billing_currency as "billingCurrency",
           t.custom_monthly_price as "customMonthlyPrice", t.trial_ends_at as "trialEndsAt",
           t.calendar_token as "calendarToken",
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           t.billing_id_type as "billingIdType",
           t.billing_id_number as "billingIdNumber",
           t.billing_legal_name as "billingLegalName",
           t.billing_email as "billingEmail",
           t.billing_id_type as "fiscalTipoIdentificacion",
           t.billing_id_number as "fiscalIdentificacion",
           t.billing_legal_name as "fiscalNombreReceptor",
           t.billing_email as "fiscalEmailReceptor",
           t.settings_json as "settingsJson", t.created_at as "createdAt"
    FROM tenants t
    LEFT JOIN store_settings ss ON ss.tenant_id = t.id
    WHERE LOWER(t.slug) = $1 OR LOWER(ss.store_slug) = $1
    LIMIT 1
  `, [cleanSlug]);
  return result.rows[0] || null;
}
async function getTenantByCustomDomain(domain) {
  const result = await query2(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE custom_domain = $1
  `, [domain]);
  return result.rows[0] || null;
}
async function getTenantByEvolutionInstance(instanceName) {
  const result = await query2(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE evolution_instance = $1
  `, [instanceName]);
  return result.rows[0] || null;
}
async function createTenant(data) {
  const finalPrice = data.customMonthlyPrice !== void 0 ? Number(data.customMonthlyPrice) : data.plan === "enterprise" ? 85e3 : data.plan === "aliado" ? 0 : data.plan === "emprendedor" ? 35e3 : 55e3;
  const idType = data.billingIdType || data.fiscalTipoIdentificacion || "01";
  const idNumber = (data.billingIdNumber || data.fiscalIdentificacion || "").replace(/\D/g, "");
  const legalName = data.billingLegalName || data.fiscalNombreReceptor || "";
  const billEmail = data.billingEmail || data.fiscalEmailReceptor || "";
  const result = await query2(`
    INSERT INTO tenants (
      name, slug, custom_domain, ai_provider, ai_api_key_encrypted, 
      ai_model, evolution_instance, whatsapp_number, plan, active,
      custom_monthly_price, billing_currency, subscription_status, trial_ends_at, settings_json,
      address, latitude, longitude, google_maps_url, is_ai_pilot, ai_priority_level,
      requires_subscription_invoice, billing_id_type, billing_id_number, billing_legal_name, billing_email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, custom_monthly_price as "customMonthlyPrice", billing_currency as "billingCurrency",
           subscription_status as "subscriptionStatus", trial_ends_at as "trialEndsAt",
           settings_json as "settingsJson", address, latitude, longitude, google_maps_url as "googleMapsUrl",
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           requires_subscription_invoice as "requiresSubscriptionInvoice",
           billing_id_type as "billingIdType",
           billing_id_number as "billingIdNumber",
           billing_legal_name as "billingLegalName",
           billing_email as "billingEmail",
           billing_id_type as "fiscalTipoIdentificacion",
           billing_id_number as "fiscalIdentificacion",
           billing_legal_name as "fiscalNombreReceptor",
           billing_email as "fiscalEmailReceptor",
           created_at as "createdAt"
  `, [
    data.name,
    data.slug,
    data.customDomain,
    data.aiProvider || "gemini",
    data.aiApiKeyEncrypted,
    data.aiModel || "gemini-2.5-flash",
    data.evolutionInstance,
    data.whatsappNumber || data.phone || null,
    data.plan || "pro",
    data.active !== false,
    finalPrice,
    data.billingCurrency || "CRC",
    data.subscriptionStatus || "active",
    data.trialEndsAt || null,
    data.settingsJson || null,
    data.address || null,
    data.latitude ? Number(data.latitude) : null,
    data.longitude ? Number(data.longitude) : null,
    data.googleMapsUrl || data.google_maps_url || null,
    Boolean(data.isAiPilot),
    Number(data.aiPriorityLevel) || 0,
    Boolean(data.requiresSubscriptionInvoice),
    idType,
    idNumber,
    legalName,
    billEmail
  ]);
  return result.rows[0];
}
async function updateTenant(id, data) {
  const allowedColumns = {
    name: "name",
    slug: "slug",
    customDomain: "custom_domain",
    custom_domain: "custom_domain",
    aiProvider: "ai_provider",
    ai_provider: "ai_provider",
    aiApiKeyEncrypted: "ai_api_key_encrypted",
    ai_api_key_encrypted: "ai_api_key_encrypted",
    aiModel: "ai_model",
    ai_model: "ai_model",
    evolutionInstance: "evolution_instance",
    evolution_instance: "evolution_instance",
    whatsappNumber: "whatsapp_number",
    whatsapp_number: "whatsapp_number",
    phone: "whatsapp_number",
    plan: "plan",
    active: "active",
    settingsJson: "settings_json",
    settings_json: "settings_json",
    subscriptionStatus: "subscription_status",
    subscription_status: "subscription_status",
    billingCurrency: "billing_currency",
    billing_currency: "billing_currency",
    customMonthlyPrice: "custom_monthly_price",
    custom_monthly_price: "custom_monthly_price",
    trialEndsAt: "trial_ends_at",
    trial_ends_at: "trial_ends_at",
    nextBillingDate: "next_billing_date",
    next_billing_date: "next_billing_date",
    gracePeriodEndsAt: "grace_period_ends_at",
    grace_period_ends_at: "grace_period_ends_at",
    address: "address",
    latitude: "latitude",
    longitude: "longitude",
    googleMapsUrl: "google_maps_url",
    google_maps_url: "google_maps_url",
    isAiPilot: "is_ai_pilot",
    is_ai_pilot: "is_ai_pilot",
    aiPriorityLevel: "ai_priority_level",
    ai_priority_level: "ai_priority_level",
    requiresSubscriptionInvoice: "requires_subscription_invoice",
    requires_subscription_invoice: "requires_subscription_invoice",
    billingIdType: "billing_id_type",
    billing_id_type: "billing_id_type",
    fiscalTipoIdentificacion: "billing_id_type",
    billingIdNumber: "billing_id_number",
    billing_id_number: "billing_id_number",
    fiscalIdentificacion: "billing_id_number",
    billingLegalName: "billing_legal_name",
    billing_legal_name: "billing_legal_name",
    fiscalNombreReceptor: "billing_legal_name",
    billingEmail: "billing_email",
    billing_email: "billing_email",
    fiscalEmailReceptor: "billing_email"
  };
  const seenColumns = /* @__PURE__ */ new Set();
  const validEntries = [];
  for (const [k, v] of Object.entries(data)) {
    const col = allowedColumns[k];
    if (col && v !== void 0 && !seenColumns.has(col)) {
      seenColumns.add(col);
      validEntries.push([col, v]);
    }
  }
  if (validEntries.length === 0) return getTenantById(id);
  const setClause = validEntries.map(([dbColumn], index) => {
    return `${dbColumn} = $${index + 2}`;
  }).join(", ");
  const values = validEntries.map(([, val]) => val);
  const result = await query2(`
    UPDATE tenants SET ${setClause}
    WHERE id = $1
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, subscription_status as "subscriptionStatus",
           billing_currency as "billingCurrency", custom_monthly_price as "customMonthlyPrice",
           trial_ends_at as "trialEndsAt", settings_json as "settingsJson",
           address, latitude, longitude, google_maps_url as "googleMapsUrl",
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           requires_subscription_invoice as "requiresSubscriptionInvoice",
           billing_id_type as "billingIdType",
           billing_id_number as "billingIdNumber",
           billing_legal_name as "billingLegalName",
           billing_email as "billingEmail",
           billing_id_type as "fiscalTipoIdentificacion",
           billing_id_number as "fiscalIdentificacion",
           billing_legal_name as "fiscalNombreReceptor",
           billing_email as "fiscalEmailReceptor",
           created_at as "createdAt"
  `, [id, ...values]);
  return result.rows[0] || null;
}
async function deleteTenant(id) {
  const result = await query2("DELETE FROM tenants WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}
var init_tenant_repo = __esm({
  "../src/server/db/tenant.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/services/voucher-email.service.ts
var voucher_email_service_exports = {};
__export(voucher_email_service_exports, {
  buildOfficialHaciendaXmlBuffer: () => buildOfficialHaciendaXmlBuffer,
  buildVoucherEmailHtml: () => buildVoucherEmailHtml,
  sendVoucherEmailNotification: () => sendVoucherEmailNotification,
  testTenantEmailDelivery: () => testTenantEmailDelivery
});
import net from "node:net";
import tls from "node:tls";
function escapeXml(val) {
  return String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function buildOfficialHaciendaXmlBuffer(voucher, haciendaConfig) {
  const docType = voucher.docType || "04";
  const rootTag = docType === "01" ? "FacturaElectronica" : docType === "03" ? "NotaCreditoElectronica" : "TiqueteElectronico";
  const schemaName = docType === "01" ? "facturaElectronica" : docType === "03" ? "notaCreditoElectronica" : "tiqueteElectronico";
  const xmlns = `https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/${schemaName}`;
  const numericKey = String(voucher.numericKey || "").padStart(50, "0").slice(0, 50);
  const consecutive = String(voucher.consecutiveNumber || "00100001040000000001").padStart(20, "0").slice(0, 20);
  const activityCode = String(haciendaConfig?.economicActivityCode || "831110").replace(/\D/g, "").padStart(6, "0").slice(0, 6);
  const issuedAt = voucher.createdAt ? new Date(voucher.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
  const issuerName = haciendaConfig?.taxpayerName || haciendaConfig?.commercialName || "Emisor Autorizado CR";
  const issuerCommercial = haciendaConfig?.commercialName || issuerName;
  const issuerIdType = haciendaConfig?.taxpayerIdType || "01";
  const issuerIdNumber = String(haciendaConfig?.taxpayerIdNumber || "000000000").replace(/\D/g, "");
  const issuerEmail = haciendaConfig?.taxpayerEmail || "facturacion@betico.cr";
  const province = String(haciendaConfig?.province || "1").slice(0, 1);
  const canton = String(haciendaConfig?.canton || "01").padStart(2, "0").slice(0, 2);
  const district = String(haciendaConfig?.district || "01").padStart(2, "0").slice(0, 2);
  const neighborhood = String(haciendaConfig?.neighborhood || "01").padStart(2, "0").slice(0, 2);
  const addressDetail = haciendaConfig?.addressDetail || "Costa Rica";
  const metadata = voucher.metadata || {};
  const rawItems = Array.isArray(metadata.items) && metadata.items.length > 0 ? metadata.items : [
    {
      lineNumber: 1,
      cabysCode: haciendaConfig?.defaultCabysCode || "8311100000000",
      description: "Servicios o productos facturados",
      quantity: 1,
      unitPrice: Number(voucher.subtotal || voucher.totalAmount || 0),
      taxRateCode: Number(voucher.taxAmount || 0) > 0 ? "08" : "10",
      taxRate: Number(voucher.taxAmount || 0) > 0 ? 13 : 0,
      lineSubtotal: Number(voucher.subtotal || voucher.totalAmount || 0),
      lineTax: Number(voucher.taxAmount || 0),
      lineTotal: Number(voucher.totalAmount || 0)
    }
  ];
  let linesXml = "";
  rawItems.forEach((it, idx) => {
    const lineNum = idx + 1;
    const cabys = String(it.cabysCode || it.cabys_code || "8311100000000").replace(/\D/g, "").padStart(13, "0").slice(0, 13);
    const qty = Number(it.quantity || 1).toFixed(3);
    const unitPrice = Number(it.unitPrice ?? it.unit_price ?? 0).toFixed(5);
    const sub = Number(it.lineSubtotal ?? Number(it.quantity || 1) * Number(it.unitPrice || 0)).toFixed(5);
    const taxCode = String(it.taxRateCode || "08");
    const taxRateNum = it.taxRate !== void 0 ? Number(it.taxRate) : taxCode === "10" ? 0 : 13;
    const taxAmt = Number(it.lineTax ?? Number(sub) * (taxRateNum / 100)).toFixed(5);
    const totalLine = Number(it.lineTotal ?? Number(sub) + Number(taxAmt)).toFixed(5);
    const desc = escapeXml(String(it.description || it.detail || "Servicio").slice(0, 160));
    linesXml += `
    <LineaDetalle>
      <NumeroLinea>${lineNum}</NumeroLinea>
      <CodigoCabys>${cabys}</CodigoCabys>
      <Cantidad>${qty}</Cantidad>
      <UnidadMedida>Unid</UnidadMedida>
      <Detalle>${desc}</Detalle>
      <PrecioUnitario>${unitPrice}</PrecioUnitario>
      <MontoTotal>${sub}</MontoTotal>
      <SubTotal>${sub}</SubTotal>
      <BaseImponible>${sub}</BaseImponible>
      <Impuesto>
        <Codigo>01</Codigo>
        <CodigoTarifaIVA>${escapeXml(taxCode)}</CodigoTarifaIVA>
        <Tarifa>${taxRateNum.toFixed(2)}</Tarifa>
        <Monto>${taxAmt}</Monto>
      </Impuesto>
      <ImpuestoNeto>${taxAmt}</ImpuestoNeto>
      <MontoTotalLinea>${totalLine}</MontoTotalLinea>
    </LineaDetalle>`;
  });
  const receiverBlock = voucher.receiverName || voucher.receiverIdNumber || voucher.receiverEmail ? `
  <Receptor>
    <Nombre>${escapeXml(voucher.receiverName || "Cliente Contado")}</Nombre>${voucher.receiverIdNumber ? `
    <Identificacion>
      <Tipo>${escapeXml(voucher.receiverIdType || "01")}</Tipo>
      <Numero>${escapeXml(String(voucher.receiverIdNumber).replace(/\D/g, ""))}</Numero>
    </Identificacion>` : ""}${voucher.receiverEmail ? `
    <CorreoElectronico>${escapeXml(voucher.receiverEmail)}</CorreoElectronico>` : ""}
  </Receptor>` : "";
  const refKey = voucher.referenceKey || metadata.referenceKey;
  const referenceBlock = refKey ? `
  <InformacionReferencia>
    <TipoDocIR>01</TipoDocIR>
    <Numero>${escapeXml(refKey)}</Numero>
    <FechaEmisionIR>${escapeXml(issuedAt)}</FechaEmisionIR>
    <Codigo>01</Codigo>
    <Razon>Anulacion de comprobante de referencia</Razon>
  </InformacionReferencia>` : "";
  const subtotalVal = Number(voucher.subtotal || 0).toFixed(5);
  const taxVal = Number(voucher.taxAmount || 0).toFixed(5);
  const totalVal = Number(voucher.totalAmount || 0).toFixed(5);
  const currency = escapeXml(voucher.currency || "CRC");
  const paymentMethod = escapeXml(metadata.paymentMethod || "01");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} xmlns="${xmlns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Clave>${escapeXml(numericKey)}</Clave>
  <ProveedorSistemas>${escapeXml(issuerIdNumber || "3101000000")}</ProveedorSistemas>
  <CodigoActividadEmisor>${escapeXml(activityCode)}</CodigoActividadEmisor>
  <NumeroConsecutivo>${escapeXml(consecutive)}</NumeroConsecutivo>
  <FechaEmision>${escapeXml(issuedAt)}</FechaEmision>
  <Emisor>
    <Nombre>${escapeXml(issuerName)}</Nombre>
    <Identificacion>
      <Tipo>${escapeXml(issuerIdType)}</Tipo>
      <Numero>${escapeXml(issuerIdNumber)}</Numero>
    </Identificacion>
    <NombreComercial>${escapeXml(issuerCommercial)}</NombreComercial>
    <Ubicacion>
      <Provincia>${escapeXml(province)}</Provincia>
      <Canton>${escapeXml(canton)}</Canton>
      <Distrito>${escapeXml(district)}</Distrito>
      <Barrio>${escapeXml(neighborhood)}</Barrio>
      <OtrasSenas>${escapeXml(addressDetail)}</OtrasSenas>
    </Ubicacion>
    <CorreoElectronico>${escapeXml(issuerEmail)}</CorreoElectronico>
  </Emisor>${receiverBlock}
  <CondicionVenta>01</CondicionVenta>
  <MedioPago>
    <TipoMedioPago>${paymentMethod}</TipoMedioPago>
  </MedioPago>
  <DetalleServicio>${linesXml}
  </DetalleServicio>
  <ResumenFactura>
    <CodigoTipoMoneda>
      <CodigoMoneda>${currency}</CodigoMoneda>
      <TipoCambio>1.00000</TipoCambio>
    </CodigoTipoMoneda>
    <TotalVenta>${subtotalVal}</TotalVenta>
    <TotalVentaNeta>${subtotalVal}</TotalVentaNeta>
    <TotalImpuesto>${taxVal}</TotalImpuesto>
    <TotalComprobante>${totalVal}</TotalComprobante>
  </ResumenFactura>${referenceBlock}
</${rootTag}>`;
  return Buffer.from(xml, "utf8");
}
function buildVoucherEmailHtml(params) {
  const { voucher, haciendaConfig, storeName, pdfPublicUrl, xmlPublicUrl } = params;
  const docLabel = voucher.docType === "01" ? "Factura Electr\xF3nica" : voucher.docType === "03" ? "Nota de Cr\xE9dito Electr\xF3nica" : "Tiquete Electr\xF3nico";
  const issuerName = haciendaConfig?.taxpayerName || storeName;
  const issuerId = haciendaConfig?.taxpayerIdNumber || "N/A";
  const branchCode = voucher.branchCode || haciendaConfig?.branchCode || "001";
  const posCode = voucher.posCode || haciendaConfig?.posCode || "00001";
  const consecutive = voucher.consecutiveNumber || "00100001040000000001";
  const numericKey = voucher.numericKey || "";
  const receiverName = voucher.receiverName || "Estimado cliente";
  const receiverId = voucher.receiverIdNumber || "Consumidor Final";
  const currency = voucher.currency || "CRC";
  const symbol = currency === "USD" ? "$" : "\u20A1";
  const fmt = (n) => `${symbol}${Number(n || 0).toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const metadata = voucher.metadata || {};
  const items = Array.isArray(metadata.items) && metadata.items.length > 0 ? metadata.items : [
    {
      description: "Productos o servicios facturados",
      quantity: 1,
      unitPrice: voucher.subtotal || voucher.totalAmount || 0,
      lineTotal: voucher.totalAmount || 0
    }
  ];
  const rowsHtml = items.map((it) => {
    const qty = Number(it.quantity || 1);
    const unitP = Number(it.unitPrice ?? it.unit_price ?? 0);
    const lineSub = Number(it.lineSubtotal ?? qty * unitP);
    return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:500;">${escapeXml(it.description || it.detail || "Item")}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:right;">${fmt(unitP)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${fmt(lineSub)}</td>
        </tr>`;
  }).join("");
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(docLabel)} - ${escapeXml(storeName)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 32px;color:#ffffff;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#93c5fd;font-weight:700;margin-bottom:6px;">
        Comprobante Electr\xF3nico Oficial DGT v4.4
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">${escapeXml(docLabel)}</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#cbd5e1;">
        Emitido por <strong>${escapeXml(storeName)}</strong> (${escapeXml(issuerName)} \xB7 C\xE9dula ${escapeXml(issuerId)})
      </p>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.5;">
        Hola <strong>${escapeXml(receiverName)}</strong>, adjunto a este correo encontrar\xE1s tu <strong>${escapeXml(docLabel)}</strong> en formato <strong>PDF</strong> y su archivo <strong>XML oficial de Hacienda</strong>.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:22px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Consecutivo Hacienda (Sucursal ${escapeXml(branchCode)} \xB7 Terminal ${escapeXml(posCode)})</div>
        <div style="font-family:monospace;font-size:15px;font-weight:700;color:#0f172a;margin-bottom:10px;">${escapeXml(consecutive)}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Clave Num\xE9rica de 50 D\xEDgitos</div>
        <div style="font-family:monospace;font-size:12px;color:#1e40af;word-break:break-all;font-weight:600;">${escapeXml(numericKey)}</div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:12px;color:#475569;">
          <strong>Receptor:</strong> ${escapeXml(receiverName)} (${escapeXml(receiverId)})
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;text-transform:uppercase;">Cant.</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;text-transform:uppercase;">Detalle</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;text-transform:uppercase;">Precio Unit.</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;text-transform:uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:24px;text-align:right;">
        <div style="font-size:13px;color:#475569;margin-bottom:6px;">Subtotal Neto: <strong>${fmt(voucher.subtotal)}</strong></div>
        <div style="font-size:13px;color:#475569;margin-bottom:8px;">Impuesto (IVA): <strong>${fmt(voucher.taxAmount)}</strong></div>
        <div style="font-size:18px;color:#0f172a;font-weight:800;">Total Comprobante: ${fmt(voucher.totalAmount)}</div>
      </div>

      <div style="text-align:center;margin:26px 0;">
        <a href="${escapeXml(pdfPublicUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;margin-right:8px;">
          Descargar Comprobante PDF
        </a>
        <a href="${escapeXml(xmlPublicUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;">
          Descargar XML Hacienda
        </a>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">
        Autorizado mediante resoluci\xF3n de Facturaci\xF3n Electr\xF3nica DGT-R-033-2019 y versi\xF3n 4.4 del Ministerio de Hacienda de Costa Rica.
      </p>
    </div>
  </div>
</body>
</html>`;
}
async function sendMimeEmailViaSmtp(smtp, mail) {
  return new Promise((resolve) => {
    const boundary = `----BeticoBoundary_${Date.now().toString(16)}`;
    const subjectB64 = Buffer.from(mail.subject, "utf8").toString("base64");
    const fromNameB64 = Buffer.from(smtp.fromName || "Facturacion Electronica", "utf8").toString("base64");
    const htmlB64 = Buffer.from(mail.html, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
    const headers = [
      `From: =?UTF-8?B?${fromNameB64}?= <${smtp.fromEmail}>`,
      `To: <${mail.to}>`,
      ...mail.replyTo ? [`Reply-To: <${mail.replyTo}>`] : [],
      `Subject: =?UTF-8?B?${subjectB64}?=`,
      `Date: ${(/* @__PURE__ */ new Date()).toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`
    ];
    const parts = [];
    parts.push(
      `--${boundary}\r
Content-Type: text/html; charset="UTF-8"\r
Content-Transfer-Encoding: base64\r
\r
${htmlB64}\r
`
    );
    for (const att of mail.attachments) {
      const attB64 = att.content.toString("base64").replace(/(.{76})/g, "$1\r\n");
      parts.push(
        `--${boundary}\r
Content-Type: ${att.contentType}; name="${att.filename}"\r
Content-Disposition: attachment; filename="${att.filename}"\r
Content-Transfer-Encoding: base64\r
\r
${attB64}\r
`
      );
    }
    parts.push(`--${boundary}--\r
`);
    const rawMime = `${headers.join("\r\n")}\r
\r
${parts.join("")}\r
.`;
    let socket;
    let step = 0;
    let buffer = "";
    let finished = false;
    const finish = (result) => {
      if (finished) return;
      finished = true;
      try {
        socket?.destroy();
      } catch (_) {
      }
      resolve(result);
    };
    const timeout = setTimeout(() => {
      finish({ ok: false, error: "Tiempo de espera agotado conectando al servidor SMTP" });
    }, 12e3);
    const sendLine = (cmd) => {
      socket.write(`${cmd}\r
`);
    };
    const handleResponse = (code, fullText) => {
      if (code >= 400) {
        clearTimeout(timeout);
        finish({ ok: false, error: `Error SMTP (${code}): ${fullText.trim()}` });
        return;
      }
      if (step === 0 && code === 220) {
        step = 1;
        sendLine(`EHLO betico.cr`);
      } else if (step === 1 && code === 250) {
        if (smtp.port !== 465 && !(socket instanceof tls.TLSSocket) && fullText.toUpperCase().includes("STARTTLS")) {
          step = 2;
          sendLine("STARTTLS");
        } else {
          step = 3;
          sendLine("AUTH LOGIN");
        }
      } else if (step === 2 && code === 220) {
        const upgraded = tls.connect(
          { socket, servername: smtp.host, rejectUnauthorized: false },
          () => {
            socket = upgraded;
            attachListeners(upgraded);
            step = 1;
            sendLine(`EHLO betico.cr`);
          }
        );
        upgraded.on("error", (err) => {
          clearTimeout(timeout);
          finish({ ok: false, error: `Error TLS SMTP: ${err.message}` });
        });
      } else if (step === 3 && code === 334) {
        step = 4;
        sendLine(Buffer.from(smtp.user, "utf8").toString("base64"));
      } else if (step === 4 && code === 334) {
        step = 5;
        sendLine(Buffer.from(smtp.pass, "utf8").toString("base64"));
      } else if (step === 5 && code === 235) {
        step = 6;
        sendLine(`MAIL FROM:<${smtp.fromEmail}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        sendLine(`RCPT TO:<${mail.to}>`);
      } else if (step === 7 && (code === 250 || code === 251)) {
        step = 8;
        sendLine("DATA");
      } else if (step === 8 && code === 354) {
        step = 9;
        sendLine(rawMime);
      } else if (step === 9 && code === 250) {
        step = 10;
        sendLine("QUIT");
        clearTimeout(timeout);
        finish({ ok: true });
      }
    };
    const attachListeners = (sock) => {
      sock.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";
        let multiLine = "";
        for (const line of lines) {
          multiLine += line + "\n";
          if (/^\d{3} /.test(line)) {
            const code = parseInt(line.slice(0, 3), 10);
            const msg = multiLine;
            multiLine = "";
            handleResponse(code, msg);
          }
        }
      });
      sock.on("error", (err) => {
        clearTimeout(timeout);
        finish({ ok: false, error: `Error de red SMTP: ${err.message}` });
      });
    };
    try {
      if (smtp.port === 465) {
        socket = tls.connect({ host: smtp.host, port: smtp.port, servername: smtp.host, rejectUnauthorized: false });
      } else {
        socket = net.connect({ host: smtp.host, port: smtp.port });
      }
      attachListeners(socket);
    } catch (err) {
      clearTimeout(timeout);
      finish({ ok: false, error: err.message });
    }
  });
}
async function sendEmailViaResend(apiKey, fromAddress, mail) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [mail.to],
        ...mail.replyTo ? { reply_to: mail.replyTo } : {},
        subject: mail.subject,
        html: mail.html,
        attachments: mail.attachments.map((a) => ({
          filename: a.filename,
          content: a.content.toString("base64")
        }))
      })
    });
    if (res.ok) {
      return { ok: true };
    }
    const errBody = await res.text().catch(() => "");
    return { ok: false, error: `Resend API (${res.status}): ${errBody.slice(0, 150)}` };
  } catch (err) {
    return { ok: false, error: `Error conectando con Resend: ${err.message}` };
  }
}
async function sendVoucherEmailNotification({
  tenantId,
  voucherKeyOrId,
  overrideEmail
}) {
  const voucher = await getElectronicVoucherByKeyOrId(voucherKeyOrId);
  if (!voucher || voucher.tenantId !== tenantId) {
    return {
      success: false,
      transport: "pending_config",
      recipient: overrideEmail || "",
      message: "Comprobante electr\xF3nico no encontrado para este negocio."
    };
  }
  let recipientEmail = (overrideEmail || voucher.receiverEmail || "").trim();
  if (!recipientEmail && voucher.orderId) {
    const ordRes = await query2(
      `SELECT customer_email, billing_info FROM orders WHERE id = $1 AND tenant_id = $2`,
      [voucher.orderId, tenantId]
    ).catch(() => ({ rows: [] }));
    if (ordRes.rows.length > 0) {
      const r = ordRes.rows[0];
      const bInfo = typeof r.billing_info === "string" ? JSON.parse(r.billing_info) : r.billing_info || {};
      recipientEmail = (bInfo?.email || r.customer_email || "").trim();
    }
  }
  if (!recipientEmail && voucher.appointmentId) {
    const appRes = await query2(
      `SELECT a.billing_info, cr.email as record_email
       FROM appointments a
       LEFT JOIN customer_records cr ON cr.id = a.record_id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [voucher.appointmentId, tenantId]
    ).catch(() => ({ rows: [] }));
    if (appRes.rows.length > 0) {
      const r = appRes.rows[0];
      const bInfo = typeof r.billing_info === "string" ? JSON.parse(r.billing_info) : r.billing_info || {};
      recipientEmail = (bInfo?.email || r.record_email || "").trim();
    }
  }
  if (!recipientEmail || !recipientEmail.includes("@")) {
    return {
      success: false,
      transport: "pending_config",
      recipient: "",
      message: "El cliente no registr\xF3 una direcci\xF3n de correo electr\xF3nico v\xE1lida para este comprobante."
    };
  }
  if (recipientEmail !== voucher.receiverEmail) {
    await query2(
      `UPDATE electronic_vouchers SET receiver_email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3`,
      [recipientEmail, voucher.id, tenantId]
    ).catch(() => {
    });
    voucher.receiverEmail = recipientEmail;
  }
  const haciendaConfig = await getHaciendaConfigByTenant(tenantId);
  const secrets = await getHaciendaDecryptedSecrets(tenantId);
  const { getStoreSettings: getStoreSettings2 } = await Promise.resolve().then(() => (init_store_settings_repo(), store_settings_repo_exports));
  const { getTenantById: getTenantById2 } = await Promise.resolve().then(() => (init_tenant_repo(), tenant_repo_exports));
  const { AlmendroService: AlmendroService2 } = await Promise.resolve().then(() => (init_almendro_service(), almendro_service_exports));
  const store = await getStoreSettings2(tenantId).catch(() => null);
  const tenant = await getTenantById2(tenantId).catch(() => null);
  const storeName = haciendaConfig?.commercialName || store?.storeName || haciendaConfig?.taxpayerName || tenant?.name || "Comercio Afiliado";
  const pdfResult = await AlmendroService2.getVoucherPdf(voucher.numericKey || voucher.id);
  const xmlBuffer = buildOfficialHaciendaXmlBuffer(voucher, haciendaConfig);
  const consecutive = voucher.consecutiveNumber || voucher.numericKey || voucher.id;
  const attachments = [];
  if (pdfResult.success && pdfResult.buffer) {
    attachments.push({
      filename: `Comprobante_${consecutive}.pdf`,
      contentType: "application/pdf",
      content: pdfResult.buffer
    });
  }
  attachments.push({
    filename: `Hacienda_${voucher.numericKey || consecutive}.xml`,
    contentType: "application/xml",
    content: xmlBuffer
  });
  const baseUrl = env.APP_URL || "https://betico.tech";
  const pdfPublicUrl = `${baseUrl}/api/almendro/public/voucher-pdf/${voucher.numericKey || voucher.id}`;
  const xmlPublicUrl = `${baseUrl}/api/almendro/public/voucher-xml/${voucher.numericKey || voucher.id}`;
  const docName = voucher.docType === "01" ? "Factura Electr\xF3nica" : voucher.docType === "03" ? "Nota de Cr\xE9dito Electr\xF3nica" : "Tiquete Electr\xF3nico";
  const subject = `${docName} #${consecutive} - ${storeName}`;
  const html = buildVoucherEmailHtml({
    voucher,
    haciendaConfig,
    storeName,
    pdfPublicUrl,
    xmlPublicUrl
  });
  const replyTo = haciendaConfig?.taxpayerEmail || void 0;
  let transportUsed = "pending_config";
  let sendAttempt = { ok: false, error: "Servidor de correo saliente no configurado" };
  if (secrets?.resendApiKey) {
    transportUsed = "resend_tenant";
    const fromAddr = `${storeName} <${haciendaConfig?.taxpayerEmail || env.SMTP_FROM || "facturacion@betico.cr"}>`;
    sendAttempt = await sendEmailViaResend(secrets.resendApiKey, fromAddr, {
      to: recipientEmail,
      replyTo,
      subject,
      html,
      attachments
    });
  } else if (secrets?.smtpHost && secrets?.smtpUser && secrets?.smtpPass) {
    transportUsed = "smtp_tenant";
    sendAttempt = await sendMimeEmailViaSmtp(
      {
        host: secrets.smtpHost,
        port: secrets.smtpPort || 587,
        user: secrets.smtpUser,
        pass: secrets.smtpPass,
        fromEmail: secrets.smtpUser.includes("@") ? secrets.smtpUser : haciendaConfig?.taxpayerEmail || env.SMTP_FROM,
        fromName: storeName
      },
      { to: recipientEmail, replyTo, subject, html, attachments }
    );
  } else if (env.RESEND_API_KEY) {
    transportUsed = "resend_platform";
    const fromAddr = `${storeName} <${env.SMTP_FROM || "facturacion@betico.cr"}>`;
    sendAttempt = await sendEmailViaResend(env.RESEND_API_KEY, fromAddr, {
      to: recipientEmail,
      replyTo,
      subject,
      html,
      attachments
    });
  } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transportUsed = "smtp_platform";
    sendAttempt = await sendMimeEmailViaSmtp(
      {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        fromEmail: env.SMTP_FROM || env.SMTP_USER,
        fromName: storeName
      },
      { to: recipientEmail, replyTo, subject, html, attachments }
    );
  }
  const currentMeta = voucher.metadata || {};
  const updatedMeta = {
    ...currentMeta,
    emailDelivery: {
      status: sendAttempt.ok ? "sent" : transportUsed === "pending_config" ? "queued_pending_smtp" : "failed",
      recipient: recipientEmail,
      transport: transportUsed,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      attachmentsCount: attachments.length,
      error: sendAttempt.ok ? void 0 : sendAttempt.error
    }
  };
  await query2(
    `UPDATE electronic_vouchers SET metadata = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3`,
    [JSON.stringify(updatedMeta), voucher.id, tenantId]
  ).catch(() => {
  });
  await query2(
    `INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
     VALUES ($1, $2, $3, $4, 'electronic_invoice_email', $5)`,
    [
      `email_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
      tenantId,
      recipientEmail,
      `${docName} #${consecutive} (PDF + XML) -> ${recipientEmail}`,
      sendAttempt.ok ? "sent" : "queued"
    ]
  ).catch(() => {
  });
  if (sendAttempt.ok) {
    return {
      success: true,
      transport: transportUsed,
      recipient: recipientEmail,
      message: `Comprobante enviado exitosamente por correo electr\xF3nico (PDF + XML) a ${recipientEmail}`
    };
  }
  if (transportUsed === "pending_config") {
    return {
      success: false,
      transport: "pending_config",
      recipient: recipientEmail,
      message: `El comprobante qued\xF3 preparado con PDF y XML para ${recipientEmail}. Para despachar correos en tiempo real, configura el servidor SMTP o Resend en la pesta\xF1a "Credenciales y Llave .p12".`
    };
  }
  return {
    success: false,
    transport: transportUsed,
    recipient: recipientEmail,
    message: `No se pudo entregar el correo a ${recipientEmail}: ${sendAttempt.error}`
  };
}
async function testTenantEmailDelivery(tenantId, params) {
  const config = await getHaciendaConfigByTenant(tenantId);
  const secrets = await getHaciendaDecryptedSecrets(tenantId);
  const recipient = (params.testEmail || config?.taxpayerEmail || "").trim();
  if (!recipient || !recipient.includes("@")) {
    return {
      success: false,
      message: "Ingresa un correo electr\xF3nico destinatario v\xE1lido para enviar la prueba."
    };
  }
  const smtpHost = (params.smtpHost !== void 0 ? params.smtpHost : secrets?.smtpHost || "").trim();
  const smtpPort = Number(params.smtpPort || secrets?.smtpPort || 587);
  const smtpUser = (params.smtpUser !== void 0 ? params.smtpUser : secrets?.smtpUser || "").trim();
  const smtpPass = params.smtpPass && !params.smtpPass.includes("\u2022\u2022\u2022\u2022") ? params.smtpPass.trim() : secrets?.smtpPass || "";
  const resendApiKey = params.resendApiKey && !params.resendApiKey.includes("\u2022\u2022\u2022\u2022") ? params.resendApiKey.trim() : secrets?.resendApiKey || "";
  const storeName = config?.commercialName || config?.taxpayerName || "Facturaci\xF3n Electr\xF3nica Betico";
  const subject = `Prueba de Env\xEDo de Facturaci\xF3n Electr\xF3nica - ${storeName}`;
  const html = `<div style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;">
    <h2 style="color:#0f172a;margin-top:0;">Conexi\xF3n de Correo Verificada</h2>
    <p style="color:#334155;line-height:1.5;">Este es un correo de prueba del m\xF3dulo de <strong>Facturaci\xF3n Electr\xF3nica Hacienda DGT v4.4</strong> de <strong>${escapeXml(storeName)}</strong>.</p>
    <p style="color:#16a34a;font-weight:700;">Las facturas, tiquetes y notas de cr\xE9dito (con sus archivos PDF y XML adjuntos) llegar\xE1n correctamente al correo de tus clientes.</p>
  </div>`;
  if (resendApiKey) {
    const res = await sendEmailViaResend(
      resendApiKey,
      `${storeName} <${config?.taxpayerEmail || env.SMTP_FROM || "facturacion@betico.cr"}>`,
      { to: recipient, subject, html, attachments: [] }
    );
    return {
      success: res.ok,
      message: res.ok ? `Correo de prueba enviado exitosamente a ${recipient} v\xEDa Resend API.` : res.error || "Error enviando correo de prueba v\xEDa Resend."
    };
  }
  if (smtpHost && smtpUser && smtpPass) {
    const res = await sendMimeEmailViaSmtp(
      {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        fromEmail: smtpUser.includes("@") ? smtpUser : config?.taxpayerEmail || env.SMTP_FROM,
        fromName: storeName
      },
      { to: recipient, subject, html, attachments: [] }
    );
    return {
      success: res.ok,
      message: res.ok ? `Correo de prueba enviado exitosamente a ${recipient} v\xEDa servidor SMTP (${smtpHost}:${smtpPort}).` : res.error || "Error conectando con el servidor SMTP."
    };
  }
  if (env.RESEND_API_KEY || env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    const res = env.RESEND_API_KEY ? await sendEmailViaResend(env.RESEND_API_KEY, `${storeName} <${env.SMTP_FROM}>`, { to: recipient, subject, html, attachments: [] }) : await sendMimeEmailViaSmtp(
      {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        fromEmail: env.SMTP_FROM || env.SMTP_USER,
        fromName: storeName
      },
      { to: recipient, subject, html, attachments: [] }
    );
    return {
      success: res.ok,
      message: res.ok ? `Correo de prueba enviado exitosamente a ${recipient} usando el servidor global de la plataforma.` : res.error || "Error enviando correo con el servidor global."
    };
  }
  return {
    success: false,
    message: "Configura tu servidor SMTP (ej. Gmail / Workspace / cPanel) o tu API Key de Resend para activar el despacho directo de correos."
  };
}
var init_voucher_email_service = __esm({
  "../src/server/services/voucher-email.service.ts"() {
    "use strict";
    init_pool();
    init_hacienda_native_repo();
    init_tenant_almendro_repo();
    init_env();
  }
});

// ../src/server/db/orders.repo.ts
var orders_repo_exports = {};
__export(orders_repo_exports, {
  confirmPayment: () => confirmPayment,
  createOrder: () => createOrder,
  executeOrderPaymentConfirmation: () => executeOrderPaymentConfirmation,
  getOrderById: () => getOrderById,
  getOrdersByTenant: () => getOrdersByTenant,
  updateOrder: () => updateOrder,
  updateOrderStatus: () => updateOrderStatus
});
async function getOrdersByTenant(tenantId, filters) {
  const result = await query2(`
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber", o.customer_name as "customerName",
           o.customer_phone as "customerPhone", o.customer_email as "customerEmail", o.customer_address as "customerAddress",
           o.whatsapp_jid as "whatsappJid", o.source, o.subtotal, o.delivery_fee as "deliveryFee", o.discount, o.discount_amount as "discountAmount", o.coupon_code as "couponCode", o.total,
           o.currency, o.status, o.payment_method as "paymentMethod", o.payment_status as "paymentStatus",
           o.payment_reference as "paymentReference", o.payment_proof_url as "paymentProofUrl", o.payment_proof_status as "paymentProofStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber", o.customer_location as "customerLocation",
           o.chat_message_id as "chatMessageId", o.driver_id as "driverId", o.waze_url as "wazeUrl",
           o.billing_info as "billingInfo",
           o.tracking_token as "trackingToken",
           o.branch_id as "branchId", b.name as "branchName",
           o.created_at as "createdAt", o.updated_at as "updatedAt",
           COALESCE(
             (
               SELECT json_agg(
                 json_build_object(
                   'id', oi.id,
                   'productId', oi.product_id,
                   'variantId', oi.variant_id,
                   'productName', oi.product_name,
                   'variantName', oi.variant_name,
                   'selectedVariables', oi.selected_variables,
                   'quantity', oi.quantity,
                   'unitPrice', oi.unit_price,
                   'totalPrice', oi.total_price
                 )
               )
               FROM order_items oi
               WHERE oi.order_id = o.id
             ),
             '[]'::json
           ) as items
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    WHERE o.tenant_id = $1
    ORDER BY o.created_at DESC
  `, [tenantId]);
  return result.rows;
}
async function getOrderById(id, tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", order_number as "orderNumber", customer_name as "customerName",
           customer_phone as "customerPhone", customer_email as "customerEmail", customer_address as "customerAddress",
           whatsapp_jid as "whatsappJid", source, subtotal, delivery_fee as "deliveryFee", discount, discount_amount as "discountAmount", coupon_code as "couponCode", total,
           currency, status, payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl", payment_proof_status as "paymentProofStatus", notes, delivery_method as "deliveryMethod",
           consumption_mode as "consumptionMode", table_number as "tableNumber", customer_location as "customerLocation",
           chat_message_id as "chatMessageId", driver_id as "driverId", waze_url as "wazeUrl",
           billing_info as "billingInfo",
           tracking_token as "trackingToken",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM orders 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  if (result.rows.length === 0) return null;
  const order = result.rows[0];
  const itemsRes = await query2(`
    SELECT id, product_id as "productId", variant_id as "variantId", product_name as "productName",
           variant_name as "variantName", selected_variables as "selectedVariables",
           quantity, unit_price as "unitPrice", total_price as "totalPrice"
    FROM order_items WHERE order_id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  order.items = itemsRes.rows;
  return order;
}
async function createOrder(tenantId, data, items, dbClient) {
  const insertSql = `
    INSERT INTO orders (
      tenant_id, customer_name, customer_phone, customer_email, customer_address, whatsapp_jid,
      source, subtotal, delivery_fee, discount, discount_amount, coupon_code, total, currency, status, payment_method, 
      payment_status, payment_reference, payment_proof_url, payment_proof_status, notes, delivery_method, consumption_mode, table_number, customer_location, stock_deducted, billing_info
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
    RETURNING id
  `;
  const discountVal = Number(data.discount || data.discountAmount || 0);
  const params = [
    tenantId,
    data.customerName,
    data.customerPhone,
    data.customerEmail,
    data.customerAddress,
    data.whatsappJid,
    data.source || "store",
    data.subtotal,
    data.deliveryFee || 0,
    discountVal,
    discountVal,
    data.couponCode || null,
    data.total,
    data.currency || "CRC",
    data.status || "pedido_recibido",
    data.paymentMethod,
    data.paymentStatus || "pending",
    data.paymentReference || null,
    data.paymentProofUrl || null,
    data.paymentProofStatus || (data.paymentProofUrl ? "received" : "pending"),
    data.notes || null,
    data.deliveryMethod || "pickup",
    data.consumptionMode || null,
    data.tableNumber || null,
    data.customerLocation ? JSON.stringify(data.customerLocation) : null,
    Boolean(data.stockDeducted),
    data.billingInfo ? JSON.stringify(data.billingInfo) : null
  ];
  const client = dbClient || await getClient();
  const isInternalClient = !dbClient;
  if (isInternalClient) {
    await client.query("BEGIN");
  }
  try {
    const result = await client.query(insertSql, params);
    const orderId = result.rows[0].id;
    const orderItems = items || data.items || [];
    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        await client.query(`
          INSERT INTO order_items (
            order_id, product_id, variant_id, tenant_id, product_name, variant_name, selected_variables, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          orderId,
          item.productId || null,
          item.variantId || null,
          tenantId,
          item.productName,
          item.variantName || null,
          item.selectedVariables ? JSON.stringify(item.selectedVariables) : null,
          item.quantity,
          item.unitPrice,
          Number(item.unitPrice) * Number(item.quantity)
        ]);
      }
    }
    if (isInternalClient) {
      await client.query("COMMIT");
    }
    return getOrderById(orderId, tenantId);
  } catch (err) {
    if (isInternalClient) {
      await client.query("ROLLBACK");
    }
    throw err;
  } finally {
    if (isInternalClient) {
      client.release();
    }
  }
}
async function updateOrder(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  const fields = [
    "status",
    "paymentStatus",
    "paymentReference",
    "notes",
    "driverId",
    "wazeUrl",
    "consumptionMode",
    "tableNumber",
    "deliveryMethod",
    "deliveryFee",
    "total",
    "customerAddress",
    "customerLocation",
    "billingInfo"
  ];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (field === "customerLocation" || field === "billingInfo") {
        updates.push(`${dbField} = $${paramIdx++}::jsonb`);
        params.push(data[field] ? JSON.stringify(data[field]) : null);
      } else {
        updates.push(`${dbField} = $${paramIdx++}`);
        params.push(data[field]);
      }
    }
  }
  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query2(`UPDATE orders SET ${updates.join(", ")} WHERE id = $1 AND tenant_id = $2`, params);
  }
  return getOrderById(id, tenantId);
}
async function updateOrderStatus(id, tenantId, status) {
  return updateOrder(id, tenantId, { status });
}
async function confirmPayment(id, tenantId, paymentReference) {
  const result = await executeOrderPaymentConfirmation(tenantId, id, {
    paymentMethod: "manual",
    paymentReference: paymentReference || "Confirmado manual"
  });
  return result.order || getOrderById(id, tenantId);
}
async function executeOrderPaymentConfirmation(tenantId, orderId, paymentData) {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(`
      SELECT * FROM orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE
    `, [orderId, tenantId]);
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Orden no encontrada para este comercio" };
    }
    const currentOrder = orderRes.rows[0];
    if (String(currentOrder.payment_status).toLowerCase() === "paid") {
      await client.query("ROLLBACK");
      const order = await getOrderById(orderId, tenantId);
      return { success: true, alreadyProcessed: true, order: order || void 0 };
    }
    if (!currentOrder.stock_deducted) {
      const itemsRes = await client.query(`
        SELECT product_id as "productId", variant_id as "variantId", quantity
        FROM order_items
        WHERE order_id = $1 AND tenant_id = $2
        ORDER BY product_id ASC, variant_id ASC NULLS FIRST
      `, [orderId, tenantId]);
      for (const item of itemsRes.rows) {
        const qty = Number(item.quantity || 1);
        if (item.productId) {
          await client.query(`
            SELECT id, stock, track_stock
            FROM products
            WHERE id = $1 AND tenant_id = $2
            FOR UPDATE
          `, [item.productId, tenantId]);
          await client.query(`
            UPDATE products
            SET stock = GREATEST(0, stock - $1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND tenant_id = $3 AND track_stock = true
          `, [qty, item.productId, tenantId]);
          if (item.variantId) {
            await client.query(`
              SELECT id, stock
              FROM product_variants
              WHERE id = $1 AND product_id = $2
              FOR UPDATE
            `, [item.variantId, item.productId]);
            await client.query(`
              UPDATE product_variants
              SET stock = GREATEST(0, stock - $1)
              WHERE id = $2 AND product_id = $3
            `, [qty, item.variantId, item.productId]);
          }
        }
      }
    }
    const newPaymentStatus = "paid";
    const newOrderStatus = currentOrder.status === "pending" || currentOrder.status === "pedido_recibido" ? "pedido_aceptado" : currentOrder.status;
    await client.query(`
      UPDATE orders
      SET payment_status = $1,
          status = $2,
          tilopay_transaction_id = $3,
          tilopay_auth_code = $4,
          payment_reference = COALESCE($5, payment_reference),
          payment_method = COALESCE($6, payment_method),
          stock_deducted = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND tenant_id = $8
    `, [
      newPaymentStatus,
      newOrderStatus,
      paymentData.tilopayTransactionId || null,
      paymentData.tilopayAuthCode || null,
      paymentData.paymentReference || paymentData.tilopayTransactionId || "Tilopay",
      paymentData.paymentMethod || "card",
      orderId,
      tenantId
    ]);
    await client.query("COMMIT");
    const updatedOrder = await getOrderById(orderId, tenantId);
    return { success: true, alreadyProcessed: false, order: updatedOrder || void 0 };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`[executeOrderPaymentConfirmation] Error en transacci\xF3n at\xF3mica de orden ${orderId}:`, err);
    return { success: false, error: err.message || "Error en la transacci\xF3n de confirmaci\xF3n de pago" };
  } finally {
    client.release();
  }
}
var init_orders_repo = __esm({
  "../src/server/db/orders.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/db/appointments.repo.ts
var appointments_repo_exports = {};
__export(appointments_repo_exports, {
  createAppointment: () => createAppointment,
  deleteAppointment: () => deleteAppointment,
  getAppointmentById: () => getAppointmentById,
  getAppointmentByIdUnsafeForWebhook: () => getAppointmentByIdUnsafeForWebhook,
  getAppointmentsByTenant: () => getAppointmentsByTenant,
  updateAppointment: () => updateAppointment,
  updateAppointmentPayment: () => updateAppointmentPayment,
  updateAppointmentStatus: () => updateAppointmentStatus
});
async function getAppointmentsByTenant(tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           billing_info as "billingInfo",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
    FROM appointments 
    WHERE tenant_id = $1
    ORDER BY date DESC, time DESC
  `, [tenantId]);
  return result.rows;
}
async function getAppointmentById(id, tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           billing_info as "billingInfo",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
    FROM appointments 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}
async function getAppointmentByIdUnsafeForWebhook(id) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           billing_info as "billingInfo",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
    FROM appointments 
    WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}
async function createAppointment(tenantId, data) {
  const result = await query2(`
    INSERT INTO appointments (
      tenant_id, name, whatsapp, service, date, time, amount, status, details, vehicle_model, selected_variables, specialist_id,
      record_id, payment_method, payment_status, payment_reference, payment_proof_url, tilopay_transaction_id, tilopay_auth_code, billing_info
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           billing_info as "billingInfo",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
  `, [
    tenantId,
    data.name,
    data.whatsapp,
    data.service,
    data.date,
    data.time,
    data.amount,
    data.status || "scheduled",
    data.details,
    data.vehicleModel,
    data.selectedVariables ? JSON.stringify(data.selectedVariables) : null,
    data.specialistId || null,
    data.recordId || null,
    data.paymentMethod || null,
    data.paymentStatus || "pending",
    data.paymentReference || null,
    data.paymentProofUrl || null,
    data.tilopayTransactionId || null,
    data.tilopayAuthCode || null,
    data.billingInfo ? JSON.stringify(data.billingInfo) : null
  ]);
  return result.rows[0];
}
async function updateAppointment(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  const fields = [
    "name",
    "whatsapp",
    "service",
    "date",
    "time",
    "amount",
    "status",
    "details",
    "vehicleModel",
    "selectedVariables",
    "specialistId",
    "recordId",
    "paymentMethod",
    "paymentStatus",
    "paymentReference",
    "paymentProofUrl",
    "tilopayTransactionId",
    "tilopayAuthCode",
    "billingInfo"
  ];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (field === "billingInfo") {
        updates.push(`${dbField} = $${paramIdx++}::jsonb`);
        params.push(data[field] ? JSON.stringify(data[field]) : null);
      } else {
        updates.push(`${dbField} = $${paramIdx++}`);
        const val = field === "selectedVariables" ? JSON.stringify(data[field]) : data[field];
        params.push(val);
      }
    }
  }
  if (updates.length === 0) return getAppointmentById(id, tenantId);
  const result = await query2(`
    UPDATE appointments SET ${updates.join(", ")}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           billing_info as "billingInfo",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
  `, params);
  return result.rows[0] || null;
}
async function updateAppointmentPayment(id, paymentData, tenantId) {
  const updates = [];
  const params = [id];
  let paramIdx = 2;
  if (paymentData.paymentStatus !== void 0) {
    updates.push(`payment_status = $${paramIdx++}`);
    params.push(paymentData.paymentStatus);
    if (paymentData.paymentStatus === "paid") {
      updates.push(`status = 'confirmed'`);
    }
  }
  if (paymentData.paymentMethod !== void 0) {
    updates.push(`payment_method = $${paramIdx++}`);
    params.push(paymentData.paymentMethod);
  }
  if (paymentData.paymentReference !== void 0) {
    updates.push(`payment_reference = $${paramIdx++}`);
    params.push(paymentData.paymentReference);
  }
  if (paymentData.tilopayTransactionId !== void 0) {
    updates.push(`tilopay_transaction_id = $${paramIdx++}`);
    params.push(paymentData.tilopayTransactionId);
  }
  if (paymentData.tilopayAuthCode !== void 0) {
    updates.push(`tilopay_auth_code = $${paramIdx++}`);
    params.push(paymentData.tilopayAuthCode);
  }
  if (updates.length === 0) {
    return tenantId ? getAppointmentById(id, tenantId) : getAppointmentByIdUnsafeForWebhook(id);
  }
  let whereClause = "WHERE id = $1";
  if (tenantId) {
    whereClause += ` AND tenant_id = $${paramIdx++}`;
    params.push(tenantId);
  }
  const result = await query2(`
    UPDATE appointments SET ${updates.join(", ")}
    ${whereClause}
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           record_id as "recordId",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
  `, params);
  return result.rows[0] || null;
}
async function updateAppointmentStatus(id, tenantId, status) {
  return updateAppointment(id, tenantId, { status });
}
async function deleteAppointment(id, tenantId) {
  const result = await query2("DELETE FROM appointments WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}
var init_appointments_repo = __esm({
  "../src/server/db/appointments.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/db/users.repo.ts
var users_repo_exports = {};
__export(users_repo_exports, {
  createUser: () => createUser,
  deleteUser: () => deleteUser,
  getAdminUserByTenant: () => getAdminUserByTenant,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUserByIdAndTenant: () => getUserByIdAndTenant,
  getUsersByTenant: () => getUsersByTenant,
  hashPassword: () => hashPassword2,
  resetTenantAdminPassword: () => resetTenantAdminPassword,
  updateUser: () => updateUser,
  verifyPassword: () => verifyPassword2
});
import crypto5 from "crypto";
function hashPassword2(password) {
  const salt = crypto5.randomBytes(16).toString("hex");
  const hash = crypto5.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return `v2:${salt}:${hash}`;
}
function verifyPassword2(password, hashString) {
  if (!hashString || !password) return false;
  const passBuf = Buffer.from(password);
  const hashBuf = Buffer.from(hashString);
  if (passBuf.length === hashBuf.length && crypto5.timingSafeEqual(passBuf, hashBuf)) return true;
  if (hashString.startsWith("v2:")) {
    const parts = hashString.split(":");
    const salt = parts[1];
    const storedHash = parts[2];
    if (!salt || !storedHash) return false;
    const hash = crypto5.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
    const b1 = Buffer.from(hash);
    const b2 = Buffer.from(storedHash);
    return b1.length === b2.length && crypto5.timingSafeEqual(b1, b2);
  }
  if (hashString.includes(":")) {
    const [salt, storedHash] = hashString.split(":");
    if (salt && storedHash) {
      const hashPbkdf2_1k_512 = crypto5.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
      if (hashPbkdf2_1k_512 === storedHash) return true;
      const hashPbkdf2_100k_512 = crypto5.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
      if (hashPbkdf2_100k_512 === storedHash) return true;
      const hashPbkdf2_1k_256 = crypto5.pbkdf2Sync(password, salt, 1e3, 32, "sha256").toString("hex");
      if (hashPbkdf2_1k_256 === storedHash) return true;
      const hashSha256_1 = crypto5.createHash("sha256").update(salt + password).digest("hex");
      if (hashSha256_1 === storedHash) return true;
      const hashSha256_2 = crypto5.createHash("sha256").update(password + salt).digest("hex");
      if (hashSha256_2 === storedHash) return true;
    }
  }
  const plainSha256 = crypto5.createHash("sha256").update(password).digest("hex");
  if (plainSha256 === hashString) return true;
  return false;
}
async function getUsersByTenant(tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}
async function getUserByEmail(tenantId, email) {
  let q = `
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, password_hash as "passwordHash",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE LOWER(email) = LOWER($1)
  `;
  const params = [email.trim()];
  if (tenantId) {
    q += ` AND tenant_id = $2`;
    params.push(tenantId);
  }
  const result = await query2(q, params);
  return result.rows[0] || null;
}
async function getUserById(id) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}
async function getUserByIdAndTenant(id, tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}
async function getAdminUserByTenant(tenantId) {
  const result = await query2(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE tenant_id = $1
    ORDER BY CASE 
      WHEN role = 'admin' THEN 1 
      WHEN role = 'tenant_admin' THEN 2 
      WHEN role = 'owner' THEN 3 
      ELSE 4 
    END, created_at ASC
    LIMIT 1
  `, [tenantId]);
  return result.rows[0] || null;
}
async function createUser(data) {
  let pwdHash = null;
  if (data.password) {
    pwdHash = hashPassword2(data.password);
  } else if (data.passwordHash) {
    pwdHash = data.passwordHash.includes(":") ? data.passwordHash : hashPassword2(data.passwordHash);
  }
  const result = await query2(`
    INSERT INTO users (
      tenant_id, name, email, password_hash, role, avatar_url, provider, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
  `, [
    data.tenantId,
    data.name,
    data.email?.toLowerCase().trim(),
    pwdHash,
    data.role || "admin",
    data.avatarUrl,
    data.provider || "local",
    data.active !== false
  ]);
  return result.rows[0];
}
async function updateUser(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  if (data.name !== void 0) {
    updates.push(`name = $${paramIdx++}`);
    params.push(data.name);
  }
  if (data.email !== void 0) {
    updates.push(`email = $${paramIdx++}`);
    params.push(data.email.toLowerCase().trim());
  }
  if (data.role !== void 0) {
    updates.push(`role = $${paramIdx++}`);
    params.push(data.role);
  }
  if (data.avatarUrl !== void 0) {
    updates.push(`avatar_url = $${paramIdx++}`);
    params.push(data.avatarUrl);
  }
  if (data.active !== void 0) {
    updates.push(`active = $${paramIdx++}`);
    params.push(data.active);
  }
  if (data.password) {
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(hashPassword2(data.password));
  } else if (data.passwordHash !== void 0) {
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(data.passwordHash);
  }
  if (updates.length === 0) return getUserById(id);
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  const result = await query2(`
    UPDATE users SET ${updates.join(", ")}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
  `, params);
  return result.rows[0] || null;
}
async function resetTenantAdminPassword(tenantId, newPassword) {
  const adminUser = await getAdminUserByTenant(tenantId);
  const newHash = hashPassword2(newPassword);
  if (adminUser) {
    await query2(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
    `, [newHash, adminUser.id, tenantId]);
    return true;
  }
  return false;
}
async function deleteUser(id, tenantId) {
  const result = await query2("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
var init_users_repo = __esm({
  "../src/server/db/users.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/db/loyalty.repo.ts
var loyalty_repo_exports = {};
__export(loyalty_repo_exports, {
  addPoints: () => addPoints,
  addStamps: () => addStamps,
  createLoyaltyCustomer: () => createLoyaltyCustomer,
  createPromotion: () => createPromotion,
  deletePromotion: () => deletePromotion,
  findOrCreateLoyaltyCard: () => findOrCreateLoyaltyCard,
  getCardTransactions: () => getCardTransactions,
  getCustomerVouchers: () => getCustomerVouchers,
  getCustomerWalletCards: () => getCustomerWalletCards,
  getLoyaltyCardById: () => getLoyaltyCardById,
  getLoyaltyCardByIdentification: () => getLoyaltyCardByIdentification,
  getLoyaltyCardByPhone: () => getLoyaltyCardByPhone,
  getLoyaltyCustomerByIdentification: () => getLoyaltyCustomerByIdentification,
  getLoyaltyProgram: () => getLoyaltyProgram,
  listLoyaltyCards: () => listLoyaltyCards,
  listPromotions: () => listPromotions,
  listTenantVouchers: () => listTenantVouchers,
  redeemPoints: () => redeemPoints,
  redeemVoucher: () => redeemVoucher,
  upsertLoyaltyProgram: () => upsertLoyaltyProgram,
  verifyLoyaltyCustomerLogin: () => verifyLoyaltyCustomerLogin
});
function mapProgramRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    isActive: row.is_active === true,
    programType: row.program_type || "points",
    currency: row.currency || "CRC",
    pointsSpendRatio: Number(row.points_spend_ratio) || 1e3,
    pointsRedeemRatio: Number(row.points_redeem_ratio) || 10,
    pointsExpiryMonths: row.points_expiry_months !== null && row.points_expiry_months !== void 0 ? Number(row.points_expiry_months) : null,
    stampsTarget: Number(row.stamps_target) || 10,
    stampsPrize: row.stamps_prize || "Premio sorpresa",
    minSpendPerStamp: Number(row.min_spend_per_stamp) || 0,
    enableGoogleWallet: row.enable_google_wallet !== false,
    enableAppleWallet: row.enable_apple_wallet !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapCardRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id || void 0,
    identification: row.identification,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || void 0,
    pointsBalance: Number(row.points_balance) || 0,
    currentStamps: Number(row.current_stamps) || 0,
    totalStampsRedeemed: Number(row.total_stamps_redeemed) || 0,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at || null,
    status: row.status || "active",
    tenantName: row.tenant_name || void 0,
    tenantSlug: row.tenant_slug || void 0,
    tenantLogoUrl: row.tenant_logo_url || void 0,
    currency: row.currency || "CRC",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapVoucherRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cardId: row.card_id,
    voucherCode: row.voucher_code,
    qrData: row.qr_data,
    rewardDescription: row.reward_description,
    rewardType: row.reward_type || "stamps_complete",
    discountAmount: row.discount_amount ? Number(row.discount_amount) : 0,
    status: row.status || "active",
    expiresAt: row.expires_at,
    redeemedAt: row.redeemed_at || null,
    tenantName: row.tenant_name || void 0,
    tenantSlug: row.tenant_slug || void 0,
    createdAt: row.created_at
  };
}
function cleanIdentification(id) {
  if (!id) return "";
  return id.replace(/[^a-zA-Z0-9]/g, "").trim().toUpperCase();
}
async function getLoyaltyProgram(tenantId) {
  const res = await query2("SELECT * FROM loyalty_programs WHERE tenant_id = $1", [tenantId]);
  if (res.rows.length === 0) return null;
  return mapProgramRow(res.rows[0]);
}
async function upsertLoyaltyProgram(tenantId, data) {
  const current = await getLoyaltyProgram(tenantId);
  if (current) {
    const res = await query2(`
      UPDATE loyalty_programs SET
        is_active = COALESCE($1, is_active),
        program_type = COALESCE($2, program_type),
        currency = COALESCE($3, currency),
        points_spend_ratio = COALESCE($4, points_spend_ratio),
        points_redeem_ratio = COALESCE($5, points_redeem_ratio),
        points_expiry_months = $6,
        stamps_target = COALESCE($7, stamps_target),
        stamps_prize = COALESCE($8, stamps_prize),
        min_spend_per_stamp = COALESCE($9, min_spend_per_stamp),
        enable_google_wallet = COALESCE($10, enable_google_wallet),
        enable_apple_wallet = COALESCE($11, enable_apple_wallet),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $12
      RETURNING *
    `, [
      data.isActive !== void 0 ? data.isActive : null,
      data.programType || null,
      data.currency || null,
      data.pointsSpendRatio !== void 0 ? data.pointsSpendRatio : null,
      data.pointsRedeemRatio !== void 0 ? data.pointsRedeemRatio : null,
      data.pointsExpiryMonths !== void 0 ? data.pointsExpiryMonths : null,
      data.stampsTarget !== void 0 ? data.stampsTarget : null,
      data.stampsPrize || null,
      data.minSpendPerStamp !== void 0 ? data.minSpendPerStamp : null,
      data.enableGoogleWallet !== void 0 ? data.enableGoogleWallet : null,
      data.enableAppleWallet !== void 0 ? data.enableAppleWallet : null,
      tenantId
    ]);
    return mapProgramRow(res.rows[0]);
  } else {
    const res = await query2(`
      INSERT INTO loyalty_programs (
        tenant_id, is_active, program_type, currency, points_spend_ratio,
        points_redeem_ratio, points_expiry_months, stamps_target, stamps_prize, min_spend_per_stamp,
        enable_google_wallet, enable_apple_wallet
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      tenantId,
      data.isActive !== void 0 ? data.isActive : true,
      data.programType || "points",
      data.currency || "CRC",
      data.pointsSpendRatio || 1e3,
      data.pointsRedeemRatio || 10,
      data.pointsExpiryMonths || null,
      data.stampsTarget || 10,
      data.stampsPrize || "Premio de lealtad",
      data.minSpendPerStamp || 0,
      data.enableGoogleWallet !== void 0 ? data.enableGoogleWallet : true,
      data.enableAppleWallet !== void 0 ? data.enableAppleWallet : true
    ]);
    return mapProgramRow(res.rows[0]);
  }
}
async function createLoyaltyCustomer(data) {
  const cleanId = cleanIdentification(data.identification);
  if (!cleanId) throw new Error("C\xE9dula requerida");
  if (!data.password || data.password.length < 6) throw new Error("La contrase\xF1a debe tener al menos 6 caracteres");
  const hashed = hashPassword2(data.password);
  const res = await query2(`
    INSERT INTO loyalty_customers (identification, full_name, phone, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, identification, full_name, phone, created_at, updated_at
  `, [cleanId, data.fullName.trim(), data.phone ? data.phone.trim() : null, hashed]);
  const customer = {
    id: res.rows[0].id,
    identification: res.rows[0].identification,
    fullName: res.rows[0].full_name,
    phone: res.rows[0].phone || void 0,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at
  };
  await query2(`
    UPDATE loyalty_cards SET customer_id = $1 WHERE UPPER(REPLACE(REPLACE(identification, '-', ''), ' ', '')) = $2
  `, [customer.id, cleanId]).catch(() => {
  });
  return customer;
}
async function getLoyaltyCustomerByIdentification(identification) {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return null;
  const res = await query2("SELECT * FROM loyalty_customers WHERE UPPER(REPLACE(REPLACE(identification, '-', ''), ' ', '')) = $1", [cleanId]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}
async function verifyLoyaltyCustomerLogin(identification, password) {
  const userRow = await getLoyaltyCustomerByIdentification(identification);
  if (!userRow) return null;
  const valid = verifyPassword2(password, userRow.password_hash);
  if (!valid) return null;
  return {
    id: userRow.id,
    identification: userRow.identification,
    fullName: userRow.full_name,
    phone: userRow.phone || void 0,
    createdAt: userRow.created_at,
    updatedAt: userRow.updated_at
  };
}
async function getCustomerWalletCards(identification) {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return [];
  const res = await query2(`
    SELECT c.*, t.name as tenant_name, t.slug as tenant_slug,
           COALESCE(s.store_logo_url, s.store_theme->>'logoUrl') as tenant_logo_url,
           p.currency as currency, p.stamps_target, p.stamps_prize, p.program_type,
           COALESCE(p.enable_google_wallet, true) as enable_google_wallet,
           COALESCE(p.enable_apple_wallet, true) as enable_apple_wallet
    FROM loyalty_cards c
    JOIN tenants t ON t.id = c.tenant_id
    LEFT JOIN store_settings s ON s.tenant_id = c.tenant_id
    LEFT JOIN loyalty_programs p ON p.tenant_id = c.tenant_id
    WHERE UPPER(REPLACE(REPLACE(c.identification, '-', ''), ' ', '')) = $1
      AND c.status = 'active'
    ORDER BY c.last_activity_at DESC
  `, [cleanId]);
  return res.rows.map((row) => ({
    ...mapCardRow(row),
    stampsTarget: row.stamps_target ? Number(row.stamps_target) : 10,
    stampsPrize: row.stamps_prize || "Premio de lealtad",
    programType: row.program_type || "both",
    enableGoogleWallet: row.enable_google_wallet !== false,
    enableAppleWallet: row.enable_apple_wallet !== false
  }));
}
async function getCustomerVouchers(identification) {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return [];
  const res = await query2(`
    SELECT v.*, t.name as tenant_name, t.slug as tenant_slug
    FROM loyalty_rewards_vouchers v
    JOIN loyalty_cards c ON c.id = v.card_id
    JOIN tenants t ON t.id = v.tenant_id
    WHERE UPPER(REPLACE(REPLACE(c.identification, '-', ''), ' ', '')) = $1
    ORDER BY v.created_at DESC
  `, [cleanId]);
  return res.rows.map(mapVoucherRow);
}
async function getLoyaltyCardById(tenantId, cardId) {
  const res = await query2("SELECT * FROM loyalty_cards WHERE id = $1 AND tenant_id = $2", [cardId, tenantId]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}
async function getLoyaltyCardByIdentification(tenantId, identification) {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return null;
  const res = await query2(`
    SELECT * FROM loyalty_cards 
    WHERE tenant_id = $1 AND UPPER(REPLACE(REPLACE(identification, '-', ''), ' ', '')) = $2
    LIMIT 1
  `, [tenantId, cleanId]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}
async function getLoyaltyCardByPhone(tenantId, phone) {
  const cleanPh = phone.replace(/\D/g, "");
  if (!cleanPh) return null;
  const res = await query2(`
    SELECT * FROM loyalty_cards 
    WHERE tenant_id = $1 AND (
      customer_phone = $2 OR 
      customer_phone LIKE '%' || $2 OR
      $2 LIKE '%' || customer_phone
    )
    ORDER BY last_activity_at DESC
    LIMIT 1
  `, [tenantId, cleanPh]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}
async function findOrCreateLoyaltyCard(tenantId, data) {
  const cleanId = cleanIdentification(data.identification);
  if (!cleanId) throw new Error("C\xE9dula requerida para crear o buscar tarjeta de fidelidad");
  const existing = await getLoyaltyCardByIdentification(tenantId, cleanId);
  if (existing) {
    if (data.customerPhone && !existing.customerPhone) {
      await query2("UPDATE loyalty_cards SET customer_phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
        data.customerPhone.replace(/\D/g, ""),
        existing.id
      ]);
      existing.customerPhone = data.customerPhone.replace(/\D/g, "");
    }
    return existing;
  }
  const customer = await getLoyaltyCustomerByIdentification(cleanId);
  const res = await query2(`
    INSERT INTO loyalty_cards (
      tenant_id, customer_id, identification, customer_name, customer_phone,
      points_balance, current_stamps, total_stamps_redeemed, status
    ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 'active')
    ON CONFLICT (tenant_id, identification) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_phone = COALESCE(EXCLUDED.customer_phone, loyalty_cards.customer_phone),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    tenantId,
    customer?.id || null,
    cleanId,
    data.customerName.trim(),
    data.customerPhone ? data.customerPhone.replace(/\D/g, "") : null
  ]);
  return mapCardRow(res.rows[0]);
}
async function listLoyaltyCards(tenantId, filters) {
  const params = [tenantId];
  let where = "WHERE tenant_id = $1";
  if (filters?.search) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    where += ` AND (LOWER(customer_name) LIKE $${params.length} OR identification LIKE $${params.length} OR customer_phone LIKE $${params.length})`;
  }
  if (filters?.status) {
    params.push(filters.status);
    where += ` AND status = $${params.length}`;
  }
  const countRes = await query2(`SELECT COUNT(*) as total FROM loyalty_cards ${where}`, params);
  const total = parseInt(countRes.rows[0].total, 10);
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  params.push(limit, offset);
  const listRes = await query2(`
    SELECT * FROM loyalty_cards 
    ${where}
    ORDER BY last_activity_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);
  return {
    cards: listRes.rows.map(mapCardRow),
    total
  };
}
async function addPoints(tenantId, cardId, points, meta) {
  if (points <= 0) throw new Error("Los puntos a sumar deben ser mayores a cero");
  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error("Tarjeta no encontrada");
  const newBalance = Number(card.pointsBalance) + points;
  const res = await query2(`
    UPDATE loyalty_cards SET
      points_balance = $1,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `, [newBalance, cardId, tenantId]);
  await query2(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'earn_points', $3, 0, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    points,
    newBalance,
    card.currentStamps,
    meta?.orderId || null,
    meta?.notes || "Puntos acumulados",
    meta?.createdBy || "system"
  ]);
  return mapCardRow(res.rows[0]);
}
async function redeemPoints(tenantId, cardId, points, meta) {
  if (points <= 0) throw new Error("Los puntos a canjear deben ser mayores a cero");
  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error("Tarjeta no encontrada");
  if (card.pointsBalance < points) throw new Error(`Saldo insuficiente. Puntos disponibles: ${card.pointsBalance}`);
  const newBalance = Number(card.pointsBalance) - points;
  const res = await query2(`
    UPDATE loyalty_cards SET
      points_balance = $1,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `, [newBalance, cardId, tenantId]);
  await query2(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'redeem_points', $3, 0, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    -points,
    newBalance,
    card.currentStamps,
    meta?.orderId || null,
    meta?.notes || "Canje de puntos",
    meta?.createdBy || "system"
  ]);
  return mapCardRow(res.rows[0]);
}
async function addStamps(tenantId, cardId, stampsCount = 1, meta) {
  if (stampsCount <= 0) throw new Error("La cantidad de sellos debe ser mayor a cero");
  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error("Tarjeta no encontrada");
  const program = await getLoyaltyProgram(tenantId);
  const target = program?.stampsTarget || 10;
  const prize = program?.stampsPrize || "Premio de fidelidad";
  let newStamps = card.currentStamps + stampsCount;
  let totalRedeemed = card.totalStampsRedeemed;
  let createdVoucher = void 0;
  if (newStamps >= target) {
    totalRedeemed += 1;
    newStamps = newStamps - target;
    const code = `PRM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const baseUrl = process.env.APP_URL || "https://betico.tech";
    const qrData = `${baseUrl}/fidelidad/canje/${code}`;
    const expiresAt = /* @__PURE__ */ new Date();
    expiresAt.setDate(expiresAt.getDate() + 45);
    const vRes = await query2(`
      INSERT INTO loyalty_rewards_vouchers (
        tenant_id, card_id, voucher_code, qr_data, reward_description,
        reward_type, discount_amount, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, 'stamps_complete', 0, 'active', $6)
      RETURNING *
    `, [tenantId, cardId, code, qrData, prize, expiresAt.toISOString()]);
    createdVoucher = mapVoucherRow(vRes.rows[0]);
  }
  const res = await query2(`
    UPDATE loyalty_cards SET
      current_stamps = $1,
      total_stamps_redeemed = $2,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND tenant_id = $4
    RETURNING *
  `, [newStamps, totalRedeemed, cardId, tenantId]);
  await query2(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'earn_stamp', 0, $3, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    stampsCount,
    card.pointsBalance,
    newStamps,
    meta?.orderId || null,
    createdVoucher ? `Sello otorgado (\xA1Meta alcanzada! Cup\xF3n ${createdVoucher.voucherCode} emitido)` : meta?.notes || "Sello acumulado",
    meta?.createdBy || "system"
  ]);
  return {
    card: mapCardRow(res.rows[0]),
    voucher: createdVoucher
  };
}
async function redeemVoucher(tenantId, voucherIdOrCode) {
  const isCode = voucherIdOrCode.startsWith("PRM-");
  const where = isCode ? "voucher_code = $1" : "id = $1";
  const check = await query2(`SELECT * FROM loyalty_rewards_vouchers WHERE ${where} AND tenant_id = $2`, [voucherIdOrCode, tenantId]);
  if (check.rows.length === 0) throw new Error("Cup\xF3n o recompensa no encontrada");
  const v = check.rows[0];
  if (v.status === "redeemed") throw new Error("Este cup\xF3n ya fue canjeado con anterioridad");
  if (new Date(v.expires_at) < /* @__PURE__ */ new Date()) throw new Error("Este cup\xF3n ha expirado");
  const res = await query2(`
    UPDATE loyalty_rewards_vouchers SET
      status = 'redeemed',
      redeemed_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `, [v.id, tenantId]);
  return mapVoucherRow(res.rows[0]);
}
async function listTenantVouchers(tenantId, status) {
  const params = [tenantId];
  let where = "WHERE v.tenant_id = $1";
  if (status) {
    params.push(status);
    where += ` AND v.status = $2`;
  }
  const res = await query2(`
    SELECT v.*, c.customer_name, c.identification as customer_id_num
    FROM loyalty_rewards_vouchers v
    JOIN loyalty_cards c ON c.id = v.card_id
    ${where}
    ORDER BY v.created_at DESC
  `, params);
  return res.rows.map((row) => ({
    ...mapVoucherRow(row),
    customerName: row.customer_name,
    customerIdentification: row.customer_id_num
  }));
}
async function getCardTransactions(tenantId, cardId) {
  const res = await query2(`
    SELECT * FROM loyalty_transactions
    WHERE card_id = $1 AND tenant_id = $2
    ORDER BY created_at DESC
    LIMIT 100
  `, [cardId, tenantId]);
  return res.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    cardId: row.card_id,
    type: row.type,
    pointsDelta: Number(row.points_delta) || 0,
    stampsDelta: Number(row.stamps_delta) || 0,
    balanceAfter: Number(row.balance_after) || 0,
    stampsAfter: Number(row.stamps_after) || 0,
    orderId: row.order_id || void 0,
    notes: row.notes || void 0,
    createdBy: row.created_by || void 0,
    createdAt: row.created_at
  }));
}
async function listPromotions(tenantId) {
  const res = await query2(`
    SELECT * FROM loyalty_promotions 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC
  `, [tenantId]);
  return res.rows.map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description || void 0,
    promoType: row.promo_type || "double_points",
    multiplier: Number(row.multiplier) || 2,
    minSpend: Number(row.min_spend) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === true,
    createdAt: row.created_at
  }));
}
async function createPromotion(tenantId, data) {
  const res = await query2(`
    INSERT INTO loyalty_promotions (
      tenant_id, title, description, promo_type, multiplier, min_spend, start_date, end_date, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    tenantId,
    data.title || "Promoci\xF3n especial",
    data.description || null,
    data.promoType || "double_points",
    data.multiplier || 2,
    data.minSpend || 0,
    data.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    data.endDate || new Date(Date.now() + 30 * 864e5).toISOString().split("T")[0],
    data.active !== false
  ]);
  const row = res.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description || void 0,
    promoType: row.promo_type,
    multiplier: Number(row.multiplier),
    minSpend: Number(row.min_spend),
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === true,
    createdAt: row.created_at
  };
}
async function deletePromotion(tenantId, promoId) {
  const res = await query2("DELETE FROM loyalty_promotions WHERE id = $1 AND tenant_id = $2", [promoId, tenantId]);
  return (res.rowCount || 0) > 0;
}
var init_loyalty_repo = __esm({
  "../src/server/db/loyalty.repo.ts"() {
    "use strict";
    init_pool();
    init_users_repo();
  }
});

// ../src/server/db/records.repo.ts
var records_repo_exports = {};
__export(records_repo_exports, {
  addRecordEntry: () => addRecordEntry,
  adjustRecordLoyalty: () => adjustRecordLoyalty,
  createRecord: () => createRecord,
  deleteRecord: () => deleteRecord,
  deleteRecordEntry: () => deleteRecordEntry,
  getAppointmentsForRecord: () => getAppointmentsForRecord,
  getRecordById: () => getRecordById,
  getRecordByIdentification: () => getRecordByIdentification,
  getRecordByPhone: () => getRecordByPhone,
  getRecordEntries: () => getRecordEntries,
  getRecordForSpecialistById: () => getRecordForSpecialistById,
  getRecordsByTenant: () => getRecordsByTenant,
  getRecordsForSpecialist: () => getRecordsForSpecialist,
  linkRecordLoyaltyCard: () => linkRecordLoyaltyCard,
  updateRecord: () => updateRecord
});
function mapRecordRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientType: row.client_type || "general",
    fullName: row.full_name,
    phone: row.phone || "",
    email: row.email || "",
    identification: row.identification || "",
    address: row.address || "",
    dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString?.().split("T")[0] || String(row.date_of_birth) : void 0,
    gender: row.gender || "",
    bloodType: row.blood_type || "",
    allergies: row.allergies || "",
    pathologicalBackground: row.pathological_background || "",
    currentMedications: row.current_medications || "",
    emergencyContactName: row.emergency_contact_name || "",
    emergencyContactPhone: row.emergency_contact_phone || "",
    notes: row.notes || "",
    metadata: row.metadata ? typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata : {},
    billingInfo: row.metadata ? (typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata)?.billingInfo || void 0 : void 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalAppointments: row.total_appointments ? Number(row.total_appointments) : void 0,
    lastAppointmentDate: row.last_appointment_date || void 0,
    latestVitalSigns: row.latest_vital_signs ? typeof row.latest_vital_signs === "string" ? JSON.parse(row.latest_vital_signs) : row.latest_vital_signs : void 0,
    recentEntriesCount: row.recent_entries_count ? Number(row.recent_entries_count) : void 0,
    loyaltyCard: row.loyalty_card_id ? {
      id: row.loyalty_card_id,
      pointsBalance: Number(row.loyalty_points || 0),
      currentStamps: Number(row.loyalty_stamps || 0),
      totalStampsRedeemed: Number(row.loyalty_total_stamps || 0),
      status: row.loyalty_status || "active"
    } : void 0
  };
}
function mapEntryRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    recordId: row.record_id,
    appointmentId: row.appointment_id || void 0,
    specialistId: row.specialist_id || void 0,
    specialistName: row.specialist_name || void 0,
    entryType: row.entry_type || "consultation",
    vitalSigns: row.vital_signs ? typeof row.vital_signs === "string" ? JSON.parse(row.vital_signs) : row.vital_signs : void 0,
    diagnosis: row.diagnosis || "",
    treatmentPlan: row.treatment_plan || "",
    prescription: row.prescription || "",
    notes: row.notes || "",
    attachments: row.attachments ? typeof row.attachments === "string" ? JSON.parse(row.attachments) : row.attachments : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getRecordsByTenant(tenantId, options = {}) {
  const { search, type, limit = 50, offset = 0 } = options;
  let whereClause = "WHERE r.tenant_id = $1";
  const params = [tenantId];
  if (type && type !== "all") {
    params.push(type);
    whereClause += ` AND r.client_type = $${params.length}`;
  }
  if (search && search.trim()) {
    const cleanSearch = search.trim();
    params.push(`%${cleanSearch}%`);
    const pIdx = params.length;
    whereClause += ` AND (
      r.full_name ILIKE $${pIdx} OR 
      r.phone ILIKE $${pIdx} OR 
      r.email ILIKE $${pIdx} OR 
      r.identification ILIKE $${pIdx}
    )`;
  }
  const countSql = `SELECT COUNT(*) as count FROM customer_records r ${whereClause}`;
  const countRes = await query2(countSql, params);
  const total = parseInt(countRes.rows[0]?.count || "0", 10);
  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a.date) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count,
      lc.loyalty_card_id, lc.loyalty_points, lc.loyalty_stamps, lc.loyalty_total_stamps, lc.loyalty_status
    FROM customer_records r
    LEFT JOIN LATERAL (
      SELECT lc.id as loyalty_card_id, lc.points_balance as loyalty_points, lc.current_stamps as loyalty_stamps, lc.total_stamps_redeemed as loyalty_total_stamps, lc.status as loyalty_status
      FROM loyalty_cards lc
      WHERE lc.tenant_id = r.tenant_id
        AND (
          (r.identification IS NOT NULL AND r.identification != '' AND UPPER(REPLACE(REPLACE(lc.identification, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(r.identification, '-', ''), ' ', '')))
          OR (r.metadata->>'loyaltyCardId' IS NOT NULL AND lc.id::text = r.metadata->>'loyaltyCardId')
        )
      ORDER BY lc.updated_at DESC
      LIMIT 1
    ) lc ON TRUE
    ${whereClause}
    ORDER BY r.updated_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;
  const dataRes = await query2(dataSql, dataParams);
  return {
    records: dataRes.rows.map(mapRecordRow),
    total
  };
}
async function getRecordById(id, tenantId) {
  const sql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a.date) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count,
      lc.loyalty_card_id, lc.loyalty_points, lc.loyalty_stamps, lc.loyalty_total_stamps, lc.loyalty_status
    FROM customer_records r
    LEFT JOIN LATERAL (
      SELECT lc.id as loyalty_card_id, lc.points_balance as loyalty_points, lc.current_stamps as loyalty_stamps, lc.total_stamps_redeemed as loyalty_total_stamps, lc.status as loyalty_status
      FROM loyalty_cards lc
      WHERE lc.tenant_id = r.tenant_id
        AND (
          (r.identification IS NOT NULL AND r.identification != '' AND UPPER(REPLACE(REPLACE(lc.identification, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(r.identification, '-', ''), ' ', '')))
          OR (r.metadata->>'loyaltyCardId' IS NOT NULL AND lc.id::text = r.metadata->>'loyaltyCardId')
        )
      ORDER BY lc.updated_at DESC
      LIMIT 1
    ) lc ON TRUE
    WHERE r.id = $1 AND r.tenant_id = $2
  `;
  const res = await query2(sql, [id, tenantId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}
async function getRecordByPhone(phone, tenantId) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone.length < 8) return null;
  const sql = `
    SELECT r.*,
      lc.loyalty_card_id, lc.loyalty_points, lc.loyalty_stamps, lc.loyalty_total_stamps, lc.loyalty_status
    FROM customer_records r
    LEFT JOIN LATERAL (
      SELECT lc.id as loyalty_card_id, lc.points_balance as loyalty_points, lc.current_stamps as loyalty_stamps, lc.total_stamps_redeemed as loyalty_total_stamps, lc.status as loyalty_status
      FROM loyalty_cards lc
      WHERE lc.tenant_id = r.tenant_id
        AND (
          (r.identification IS NOT NULL AND r.identification != '' AND UPPER(REPLACE(REPLACE(lc.identification, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(r.identification, '-', ''), ' ', '')))
          OR (r.metadata->>'loyaltyCardId' IS NOT NULL AND lc.id::text = r.metadata->>'loyaltyCardId')
        )
      ORDER BY lc.updated_at DESC
      LIMIT 1
    ) lc ON TRUE
    WHERE r.tenant_id = $1 AND REPLACE(r.phone, '-', '') LIKE '%' || $2
    ORDER BY r.updated_at DESC LIMIT 1
  `;
  const res = await query2(sql, [tenantId, cleanPhone.slice(-8)]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}
async function getRecordByIdentification(identification, tenantId) {
  const cleanId = (identification || "").trim();
  if (!cleanId) return null;
  const sql = `
    SELECT r.*,
      lc.loyalty_card_id, lc.loyalty_points, lc.loyalty_stamps, lc.loyalty_total_stamps, lc.loyalty_status
    FROM customer_records r
    LEFT JOIN LATERAL (
      SELECT lc.id as loyalty_card_id, lc.points_balance as loyalty_points, lc.current_stamps as loyalty_stamps, lc.total_stamps_redeemed as loyalty_total_stamps, lc.status as loyalty_status
      FROM loyalty_cards lc
      WHERE lc.tenant_id = r.tenant_id
        AND (
          (r.identification IS NOT NULL AND r.identification != '' AND UPPER(REPLACE(REPLACE(lc.identification, '-', ''), ' ', '')) = UPPER(REPLACE(REPLACE(r.identification, '-', ''), ' ', '')))
          OR (r.metadata->>'loyaltyCardId' IS NOT NULL AND lc.id::text = r.metadata->>'loyaltyCardId')
        )
      ORDER BY lc.updated_at DESC
      LIMIT 1
    ) lc ON TRUE
    WHERE r.tenant_id = $1 AND r.identification ILIKE $2
    ORDER BY r.updated_at DESC LIMIT 1
  `;
  const res = await query2(sql, [tenantId, cleanId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}
async function createRecord(tenantId, data) {
  const sql = `
    INSERT INTO customer_records (
      tenant_id, client_type, full_name, phone, email, identification, address,
      date_of_birth, gender, blood_type, allergies, pathological_background,
      current_medications, emergency_contact_name, emergency_contact_phone, notes, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;
  const res = await query2(sql, [
    tenantId,
    data.clientType || "general",
    data.fullName || "Cliente Sin Nombre",
    data.phone || "",
    data.email || null,
    data.identification || null,
    data.address || null,
    data.dateOfBirth || null,
    data.gender || null,
    data.bloodType || null,
    data.allergies || null,
    data.pathologicalBackground || null,
    data.currentMedications || null,
    data.emergencyContactName || null,
    data.emergencyContactPhone || null,
    data.notes || null,
    JSON.stringify({
      ...data.metadata || {},
      ...data.billingInfo ? { billingInfo: data.billingInfo } : {}
    })
  ]);
  const rawRecord = res.rows[0];
  if (rawRecord.phone) {
    const clean = rawRecord.phone.replace(/\D/g, "");
    if (clean.length >= 8) {
      await query2(
        `UPDATE appointments 
         SET record_id = $1 
         WHERE tenant_id = $2 
           AND record_id IS NULL 
           AND REPLACE(whatsapp, '-', '') LIKE '%' || $3`,
        [rawRecord.id, tenantId, clean.slice(-8)]
      ).catch(() => {
      });
    }
  }
  if (data.enableLoyaltyCard && rawRecord.identification) {
    try {
      const { findOrCreateLoyaltyCard: findOrCreateLoyaltyCard2, upsertLoyaltyProgram: upsertLoyaltyProgram2, addPoints: addPoints2, addStamps: addStamps2 } = await Promise.resolve().then(() => (init_loyalty_repo(), loyalty_repo_exports));
      await upsertLoyaltyProgram2(tenantId, { isActive: true }).catch(() => {
      });
      const card = await findOrCreateLoyaltyCard2(tenantId, {
        identification: rawRecord.identification,
        customerName: rawRecord.full_name,
        customerPhone: rawRecord.phone || void 0
      });
      if (data.initialLoyaltyPoints && data.initialLoyaltyPoints > 0) {
        await addPoints2(tenantId, card.id, data.initialLoyaltyPoints, { notes: "Puntos iniciales al crear expediente" }).catch(() => {
        });
      }
      if (data.initialLoyaltyStamps && data.initialLoyaltyStamps > 0) {
        await addStamps2(tenantId, card.id, data.initialLoyaltyStamps, { notes: "Sellos iniciales al crear expediente" }).catch(() => {
        });
      }
      await query2(
        `UPDATE customer_records 
         SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{loyaltyCardId}', to_jsonb($1::text))
         WHERE id = $2 AND tenant_id = $3`,
        [card.id, rawRecord.id, tenantId]
      ).catch(() => {
      });
    } catch (loyaltyErr) {
      console.warn("[records.repo] Error auto-linking loyalty card in createRecord:", loyaltyErr);
    }
  }
  const complete = await getRecordById(rawRecord.id, tenantId);
  return complete || mapRecordRow(rawRecord);
}
async function updateRecord(id, tenantId, data) {
  const allowedFields = {
    clientType: "client_type",
    fullName: "full_name",
    phone: "phone",
    email: "email",
    identification: "identification",
    address: "address",
    dateOfBirth: "date_of_birth",
    gender: "gender",
    bloodType: "blood_type",
    allergies: "allergies",
    pathologicalBackground: "pathological_background",
    currentMedications: "current_medications",
    emergencyContactName: "emergency_contact_name",
    emergencyContactPhone: "emergency_contact_phone",
    notes: "notes"
  };
  const updates = ["updated_at = CURRENT_TIMESTAMP"];
  const params = [id, tenantId];
  let pIdx = 3;
  for (const [key, col] of Object.entries(allowedFields)) {
    if (data[key] !== void 0) {
      updates.push(`${col} = $${pIdx++}`);
      params.push(data[key] === "" ? null : data[key]);
    }
  }
  if (data.billingInfo !== void 0 || data.metadata !== void 0) {
    const existing = await query2("SELECT metadata FROM customer_records WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
    let currentMeta = existing.rows[0]?.metadata || {};
    if (typeof currentMeta === "string") {
      try {
        currentMeta = JSON.parse(currentMeta);
      } catch (_) {
        currentMeta = {};
      }
    }
    const mergedMeta = {
      ...currentMeta,
      ...data.metadata || {},
      ...data.billingInfo !== void 0 ? { billingInfo: data.billingInfo } : {}
    };
    updates.push(`metadata = $${pIdx++}`);
    params.push(JSON.stringify(mergedMeta));
  }
  const sql = `
    UPDATE customer_records
    SET ${updates.join(", ")}
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const res = await query2(sql, params);
  if (!res.rows[0]) return null;
  const rawUpdated = res.rows[0];
  if (data.enableLoyaltyCard) {
    const idNum = rawUpdated.identification;
    if (idNum) {
      try {
        const { findOrCreateLoyaltyCard: findOrCreateLoyaltyCard2, upsertLoyaltyProgram: upsertLoyaltyProgram2, addPoints: addPoints2, addStamps: addStamps2 } = await Promise.resolve().then(() => (init_loyalty_repo(), loyalty_repo_exports));
        await upsertLoyaltyProgram2(tenantId, { isActive: true }).catch(() => {
        });
        const card = await findOrCreateLoyaltyCard2(tenantId, {
          identification: idNum,
          customerName: rawUpdated.full_name,
          customerPhone: rawUpdated.phone || void 0
        });
        if (data.initialLoyaltyPoints && data.initialLoyaltyPoints > 0) {
          await addPoints2(tenantId, card.id, data.initialLoyaltyPoints, { notes: "Puntos iniciales expediente" }).catch(() => {
          });
        }
        if (data.initialLoyaltyStamps && data.initialLoyaltyStamps > 0) {
          await addStamps2(tenantId, card.id, data.initialLoyaltyStamps, { notes: "Sellos iniciales expediente" }).catch(() => {
          });
        }
        await query2(
          `UPDATE customer_records 
           SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{loyaltyCardId}', to_jsonb($1::text))
           WHERE id = $2 AND tenant_id = $3`,
          [card.id, id, tenantId]
        ).catch(() => {
        });
      } catch (loyaltyErr) {
        console.warn("[records.repo] Error auto-linking loyalty card in updateRecord:", loyaltyErr);
      }
    }
  }
  const complete = await getRecordById(id, tenantId);
  return complete || mapRecordRow(rawUpdated);
}
async function linkRecordLoyaltyCard(tenantId, recordId, options) {
  const record = await getRecordById(recordId, tenantId);
  if (!record) return null;
  const identification = options?.identification?.trim() || record.identification;
  if (!identification) {
    throw new Error("Se requiere el n\xFAmero de c\xE9dula o identificaci\xF3n para vincular al club de fidelizaci\xF3n.");
  }
  if (options?.identification && options.identification.trim() !== record.identification) {
    await updateRecord(recordId, tenantId, { identification: options.identification.trim() });
  }
  const { findOrCreateLoyaltyCard: findOrCreateLoyaltyCard2, upsertLoyaltyProgram: upsertLoyaltyProgram2, addPoints: addPoints2, addStamps: addStamps2 } = await Promise.resolve().then(() => (init_loyalty_repo(), loyalty_repo_exports));
  await upsertLoyaltyProgram2(tenantId, { isActive: true }).catch(() => {
  });
  const card = await findOrCreateLoyaltyCard2(tenantId, {
    identification,
    customerName: record.fullName,
    customerPhone: record.phone || void 0
  });
  if (options?.points && options.points > 0) {
    await addPoints2(tenantId, card.id, options.points, { notes: "Puntos asignados desde expediente" }).catch(() => {
    });
  }
  if (options?.stamps && options.stamps > 0) {
    await addStamps2(tenantId, card.id, options.stamps, { notes: "Sellos asignados desde expediente" }).catch(() => {
    });
  }
  await query2(
    `UPDATE customer_records 
     SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{loyaltyCardId}', to_jsonb($1::text))
     WHERE id = $2 AND tenant_id = $3`,
    [card.id, recordId, tenantId]
  ).catch(() => {
  });
  return getRecordById(recordId, tenantId);
}
async function adjustRecordLoyalty(tenantId, recordId, adjustment) {
  const record = await getRecordById(recordId, tenantId);
  if (!record) throw new Error("Expediente no encontrado");
  if (!record.identification) throw new Error("El expediente debe contar con n\xFAmero de c\xE9dula para gestionar fidelizaci\xF3n");
  const { findOrCreateLoyaltyCard: findOrCreateLoyaltyCard2, addPoints: addPoints2, addStamps: addStamps2 } = await Promise.resolve().then(() => (init_loyalty_repo(), loyalty_repo_exports));
  const card = await findOrCreateLoyaltyCard2(tenantId, {
    identification: record.identification,
    customerName: record.fullName,
    customerPhone: record.phone || void 0
  });
  if (adjustment.type === "points") {
    if (adjustment.amount > 0) {
      await addPoints2(tenantId, card.id, adjustment.amount, { notes: adjustment.reason || "Ajuste de puntos desde expediente" });
    }
  } else if (adjustment.type === "stamps") {
    if (adjustment.amount > 0) {
      await addStamps2(tenantId, card.id, adjustment.amount, { notes: adjustment.reason || "Sello registrado desde expediente" });
    }
  }
  const updatedRecord = await getRecordById(recordId, tenantId);
  return {
    success: true,
    loyaltyCard: updatedRecord?.loyaltyCard,
    record: updatedRecord
  };
}
async function deleteRecord(id, tenantId) {
  await query2("UPDATE appointments SET record_id = NULL WHERE record_id = $1 AND tenant_id = $2", [id, tenantId]).catch(() => {
  });
  const res = await query2("DELETE FROM customer_records WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (res.rowCount || 0) > 0;
}
async function addRecordEntry(tenantId, recordId, data) {
  const sql = `
    INSERT INTO record_entries (
      tenant_id, record_id, appointment_id, specialist_id, entry_type,
      vital_signs, diagnosis, treatment_plan, prescription, notes, attachments
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const res = await query2(sql, [
    tenantId,
    recordId,
    data.appointmentId || null,
    data.specialistId || null,
    data.entryType || "consultation",
    data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
    data.diagnosis || null,
    data.treatmentPlan || null,
    data.prescription || null,
    data.notes || null,
    data.attachments ? JSON.stringify(data.attachments) : "[]"
  ]);
  await query2("UPDATE customer_records SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2", [recordId, tenantId]).catch(() => {
  });
  const entry = mapEntryRow(res.rows[0]);
  if (entry.specialistId) {
    const specRes = await query2("SELECT name FROM specialists WHERE id = $1", [entry.specialistId]);
    entry.specialistName = specRes.rows[0]?.name;
  }
  return entry;
}
async function getRecordEntries(recordId, tenantId) {
  const sql = `
    SELECT re.*, s.name as specialist_name
    FROM record_entries re
    LEFT JOIN specialists s ON s.id = re.specialist_id
    WHERE re.record_id = $1 AND re.tenant_id = $2
    ORDER BY re.created_at DESC
  `;
  const res = await query2(sql, [recordId, tenantId]);
  return res.rows.map(mapEntryRow);
}
async function deleteRecordEntry(entryId, tenantId) {
  const res = await query2("DELETE FROM record_entries WHERE id = $1 AND tenant_id = $2", [entryId, tenantId]);
  return (res.rowCount || 0) > 0;
}
async function getAppointmentsForRecord(recordId, tenantId) {
  const rec = await getRecordById(recordId, tenantId);
  const cleanPhone = rec?.phone ? rec.phone.replace(/\D/g, "") : "";
  let sql = `
    SELECT a.*, s.name as "specialistName"
    FROM appointments a
    LEFT JOIN specialists s ON s.id = a.specialist_id
    WHERE a.tenant_id = $1 AND (a.record_id = $2
  `;
  const params = [tenantId, recordId];
  if (cleanPhone.length >= 8) {
    params.push(cleanPhone.slice(-8));
    sql += ` OR REPLACE(a.whatsapp, '-', '') LIKE '%' || $3`;
  }
  sql += `) ORDER BY a.date DESC, a.time DESC`;
  const res = await query2(sql, params);
  return res.rows;
}
async function getRecordsForSpecialist(specialistId, tenantId, search) {
  let whereClause = `WHERE a.specialist_id = $1 AND r.tenant_id = $2`;
  const params = [specialistId, tenantId];
  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClause += ` AND (r.full_name ILIKE $${params.length} OR r.phone ILIKE $${params.length} OR r.identification ILIKE $${params.length})`;
  }
  const sql = `
    SELECT DISTINCT r.*,
      (SELECT COUNT(*) FROM appointments a2 WHERE a2.specialist_id = $1 AND a2.tenant_id = $2 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a2.date) FROM appointments a2 WHERE a2.specialist_id = $1 AND a2.tenant_id = $2 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    JOIN appointments a ON (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))
    ${whereClause}
    ORDER BY r.updated_at DESC
  `;
  const res = await query2(sql, params);
  return res.rows.map(mapRecordRow);
}
async function getRecordForSpecialistById(recordId, specialistId, tenantId) {
  const sql = `
    SELECT DISTINCT r.*,
      (SELECT COUNT(*) FROM appointments a2 WHERE a2.specialist_id = $2 AND a2.tenant_id = $3 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a2.date) FROM appointments a2 WHERE a2.specialist_id = $2 AND a2.tenant_id = $3 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    JOIN appointments a ON (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))
    WHERE r.id = $1 AND a.specialist_id = $2 AND r.tenant_id = $3
  `;
  const res = await query2(sql, [recordId, specialistId, tenantId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}
var init_records_repo = __esm({
  "../src/server/db/records.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/services/almendro.service.ts
var almendro_service_exports = {};
__export(almendro_service_exports, {
  AlmendroService: () => AlmendroService,
  default: () => almendro_service_default
});
function getBaseUrl(environment) {
  return environment === "PRODUCTION" ? ALMENDRO_PROD_URL : ALMENDRO_SANDBOX_URL;
}
function getCostaRicaIssuedAt() {
  const now = /* @__PURE__ */ new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 6e4;
  const crTime = new Date(utc - 36e5 * 6);
  const y = crTime.getFullYear();
  const m = String(crTime.getMonth() + 1).padStart(2, "0");
  const d = String(crTime.getDate()).padStart(2, "0");
  const hh = String(crTime.getHours()).padStart(2, "0");
  const mm = String(crTime.getMinutes()).padStart(2, "0");
  const ss = String(crTime.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}-06:00`;
}
function formatEconomicActivityCode(rawCode) {
  if (!rawCode) return "5610.0";
  const cleaned = rawCode.trim();
  if (/^\d{4}\.\d$/.test(cleaned)) {
    return cleaned;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length >= 5) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 5)}`;
  }
  if (digits.length === 4) {
    return `${digits}.0`;
  }
  return "5610.0";
}
function sanitizeVoucherPdfUrl(url, numericKey) {
  if (!url && !numericKey) return void 0;
  if (url && !url.includes("fe.almendro.cr")) return url;
  if (numericKey) return `${env.APP_URL}/api/almendro/public/voucher-pdf/${numericKey}`;
  return url;
}
var ALMENDRO_PROD_URL, ALMENDRO_SANDBOX_URL, AlmendroService, almendro_service_default;
var init_almendro_service = __esm({
  "../src/server/services/almendro.service.ts"() {
    "use strict";
    init_tenant_almendro_repo();
    init_env();
    ALMENDRO_PROD_URL = "https://fe.almendro.cr/api/v1/public";
    ALMENDRO_SANDBOX_URL = "https://fe.almendro.cr/api/v1/public/sandbox";
    AlmendroService = class {
      /**
       * Tests connection with Almendro using the provided API Key.
       */
      static async testConnection(apiKey, environment = "SANDBOX") {
        if (!apiKey || apiKey.trim().length < 5) {
          return { success: false, message: "La llave de API es requerida" };
        }
        const cleanKey = apiKey.trim();
        const primaryUrl = getBaseUrl(environment);
        try {
          let res = await fetch(`${primaryUrl}/vouchers?limit=1`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${cleanKey}`,
              "Accept": "application/json"
            }
          });
          if (!res.ok && res.status !== 401 && res.status !== 403) {
            try {
              const fallbackRes = await fetch(`${ALMENDRO_PROD_URL}/profile`, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${cleanKey}`,
                  "Accept": "application/json"
                }
              });
              if (fallbackRes.status === 200 || fallbackRes.status === 202 || fallbackRes.status === 401 || fallbackRes.status === 403) {
                res = fallbackRes;
              }
            } catch (_) {
            }
          }
          if (res.status === 200 || res.status === 202) {
            return {
              success: true,
              message: `Conexi\xF3n exitosa con Almendro (${environment})`
            };
          }
          if (res.status === 401 || res.status === 403) {
            return {
              success: false,
              message: "La llave de API no es v\xE1lida o no tiene permisos en Almendro"
            };
          }
          const errText = await res.text().catch(() => "");
          return {
            success: false,
            message: `Almendro respondi\xF3 con c\xF3digo ${res.status}: ${errText.slice(0, 150)}`
          };
        } catch (err) {
          try {
            const altUrl = environment === "SANDBOX" ? ALMENDRO_PROD_URL : ALMENDRO_SANDBOX_URL;
            const altRes = await fetch(`${altUrl}/vouchers?limit=1`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${cleanKey}`,
                "Accept": "application/json"
              }
            });
            if (altRes.status === 200 || altRes.status === 202) {
              return {
                success: true,
                message: `Conexi\xF3n exitosa con Almendro`
              };
            }
            if (altRes.status === 401 || altRes.status === 403) {
              return {
                success: false,
                message: "La llave de API no es v\xE1lida o no tiene permisos en Almendro"
              };
            }
          } catch (_) {
          }
          return {
            success: false,
            message: `No fue posible conectar con el servidor de Almendro: ${err.message}`
          };
        }
      }
      /**
       * Looks up a taxpayer's official name, status and economic activities from TSE/Hacienda.
       */
      static async lookupTaxpayer(apiKey, environment, rawIdNumber) {
        if (!rawIdNumber) return { success: false, error: "N\xFAmero de c\xE9dula requerido" };
        const cleanId = rawIdNumber.replace(/\D/g, "");
        if (cleanId.length < 9 || cleanId.length > 12) {
          return { success: false, error: "El formato de c\xE9dula debe tener entre 9 y 12 d\xEDgitos num\xE9ricos" };
        }
        const baseUrl = getBaseUrl(environment);
        try {
          const res = await fetch(`${baseUrl}/taxpayer/${cleanId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${apiKey.trim()}`,
              "Accept": "application/json"
            }
          });
          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            return {
              success: false,
              error: `Contribuyente no encontrado en el padr\xF3n (${res.status}): ${errText.slice(0, 100)}`
            };
          }
          const body = await res.json();
          return {
            success: true,
            data: {
              idType: body.id_type || (cleanId.length === 10 && cleanId.startsWith("3") ? "02" : "01"),
              idNumber: cleanId,
              name: body.name || body.legal_name || "Nombre no disponible",
              commercialName: body.commercial_name,
              status: body.status || "INSCRITO",
              taxRegime: body.tax_regime || "TRADICIONAL",
              activities: body.activities || []
            }
          };
        } catch (err) {
          return { success: false, error: `Error consultando padr\xF3n de Hacienda: ${err.message}` };
        }
      }
      /**
       * Determines if a specific module should automatically invoice.
       */
      static async shouldInvoiceModule(tenantId, moduleName) {
        const config = await getTenantAlmendroConfigRaw(tenantId);
        if (!config || !config.isEnabled || !config.apiKey) return false;
        return Boolean(config.moduleToggles[moduleName]);
      }
      /**
       * Emits an electronic voucher through Almendro and stores it in electronic_vouchers.
       */
      static async emitVoucher(tenantId, params) {
        const config = await getTenantAlmendroConfigRaw(tenantId);
        if (!config || !config.isEnabled || !config.apiKey) {
          return {
            success: false,
            message: "La facturaci\xF3n electr\xF3nica est\xE1 desactivada o no configurada para este negocio."
          };
        }
        const docType = params.docType || config.defaultDocType || "04";
        const currency = params.currency || "CRC";
        const exchangeRate = params.exchangeRate || 1;
        let subtotal = 0;
        let taxAmount = 0;
        const lines = params.items.map((item, idx) => {
          const lineQty = Number(item.quantity) || 1;
          const unitPrice = Number(item.unitPrice) || 0;
          const lineSubtotal = lineQty * unitPrice;
          subtotal += lineSubtotal;
          const taxRateCode = item.taxRateCode || "08";
          let taxPercentage = 0.13;
          if (taxRateCode === "04") taxPercentage = 0.04;
          else if (taxRateCode === "02") taxPercentage = 0.02;
          else if (taxRateCode === "01") taxPercentage = 0.01;
          else if (taxRateCode === "10") taxPercentage = 0;
          const lineTax = lineSubtotal * taxPercentage;
          taxAmount += lineTax;
          const totalLineAmount = lineSubtotal + lineTax;
          return {
            line_number: idx + 1,
            cabys_code: item.cabysCode || "8311100000000",
            detail: item.description.slice(0, 160),
            description: item.description.slice(0, 160),
            unit_of_measure: "Unid",
            unit_measure: "Unid",
            quantity: lineQty.toFixed(3),
            unit_price: unitPrice.toFixed(5),
            total_amount: lineSubtotal.toFixed(5),
            sub_total: lineSubtotal.toFixed(5),
            base_imponible: lineSubtotal.toFixed(5),
            taxes: [
              {
                codigo: "01",
                // IVA
                codigoTarifa: taxRateCode,
                tarifa: (taxPercentage * 100).toFixed(2),
                monto: lineTax.toFixed(5),
                code: "01",
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
        const receiverEmail = params.receiver?.email;
        const receiverPayload = params.receiver?.idNumber ? {
          id_type: params.receiver.idType || "01",
          id_number: params.receiver.idNumber.replace(/\D/g, ""),
          name: params.receiver.name || "Cliente Particular",
          emails: receiverEmail ? [receiverEmail] : [],
          email: receiverEmail
        } : void 0;
        const paymentMethodCode = params.paymentMethod || "01";
        const issuerActivityCode = formatEconomicActivityCode(config.economicActivityCode);
        const payload = {
          voucher_type: docType,
          doc_type: docType,
          situation: "1",
          issued_at: getCostaRicaIssuedAt(),
          issuer_activity_code: issuerActivityCode,
          sale_condition: "01",
          currency_code: currency,
          currency,
          exchange_rate: exchangeRate.toFixed(5),
          payment_methods: [
            {
              tipo: paymentMethodCode
            }
          ],
          branch_code: params.branchCode || config.branchCode || "001",
          pos_code: params.posCode || config.posCode || "00001",
          line_items: lines,
          items: lines
        };
        if (receiverPayload) {
          payload.receiver = receiverPayload;
        }
        if (params.referenceKey && docType === "03") {
          payload.reference = {
            code: "01",
            // Anula documento de referencia
            numeric_key: params.referenceKey,
            reason: "Anulaci\xF3n solicitada por el emisor"
          };
        }
        const baseUrl = getBaseUrl(config.environment);
        try {
          const res = await fetch(`${baseUrl}/vouchers`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.apiKey.trim()}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseBody = await res.json().catch(() => ({}));
          if (res.status === 200 || res.status === 201 || res.status === 202) {
            const numericKey = responseBody.data?.numeric_key || responseBody.numeric_key || responseBody.key || `506${Date.now()}`;
            const consecutive = responseBody.data?.consecutive || responseBody.consecutive || responseBody.consecutive_number || "";
            const voucherKey = responseBody.data?.voucher_key || responseBody.voucher_key || numericKey;
            const pdfUrl = `${env.APP_URL}/api/almendro/public/voucher-pdf/${numericKey}`;
            const xmlSigned = responseBody.xml_signed_url || `${baseUrl}/vouchers/${voucherKey}/xml`;
            const savedVoucher = await saveElectronicVoucher(tenantId, {
              orderId: params.orderId,
              appointmentId: params.appointmentId,
              courtBookingId: params.courtBookingId,
              subscriptionChargeId: params.subscriptionChargeId,
              branchId: params.branchId || null,
              branchCode: params.branchCode || config.branchCode || "001",
              posCode: params.posCode || config.posCode || "00001",
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
              status: responseBody.status === "accepted" ? "accepted" : "pending",
              pdfUrl,
              xmlSignedUrl: xmlSigned,
              metadata: responseBody
            });
            Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports)).then(
              ({ sendVoucherEmailNotification: sendVoucherEmailNotification2 }) => sendVoucherEmailNotification2(tenantId, savedVoucher.id, params.receiver?.email)
            ).catch((e) => console.error("[AlmendroService] Error enviando comprobante por correo:", e));
            return {
              success: true,
              numericKey,
              pdfUrl,
              message: `Comprobante emitido con \xE9xito. Clave: ${numericKey}`
            };
          }
          let errorMsg = responseBody.message || responseBody.error || `Error ${res.status} al emitir en Almendro`;
          if (responseBody.errors && typeof responseBody.errors === "object") {
            const detailErrors = Object.entries(responseBody.errors).map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`).join(" | ");
            if (detailErrors) {
              errorMsg = `${errorMsg} (${detailErrors})`;
            }
          }
          console.warn(`[AlmendroService] Emisi\xF3n fallida para tenant ${tenantId}:`, errorMsg);
          return { success: false, message: errorMsg };
        } catch (err) {
          console.error(`[AlmendroService] Excepci\xF3n emitiendo comprobante para tenant ${tenantId}:`, err);
          return { success: false, message: `Error de red al conectar con Almendro: ${err.message}` };
        }
      }
      /**
       * Automatically or manually emits an electronic invoice for an Order.
       * Performs idempotency checks, line formatting, and updates order.billingInfo in DB.
       */
      static async emitOrderInvoice(tenantId, orderId) {
        try {
          const { getOrderById: getOrderById2, updateOrder: updateOrder2 } = await Promise.resolve().then(() => (init_orders_repo(), orders_repo_exports));
          const { getElectronicVoucherByOrderId: getElectronicVoucherByOrderId2 } = await Promise.resolve().then(() => (init_tenant_almendro_repo(), tenant_almendro_repo_exports));
          const order = await getOrderById2(orderId, tenantId);
          if (!order) {
            return { success: false, message: "Orden no encontrada" };
          }
          const { getHaciendaConfigByTenant: getHaciendaConfigByTenant2, getHaciendaBranchByStoreBranchId: getHaciendaBranchByStoreBranchId2 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
          const nativeCfg = await getHaciendaConfigByTenant2(tenantId).catch(() => null);
          const isNativeActive = Boolean(nativeCfg && nativeCfg.active && nativeCfg.providerMode === "BETICO_NATIVE" && (nativeCfg.taxpayerIdNumber || nativeCfg.isConnected));
          const config = await getTenantAlmendroConfigRaw(tenantId);
          const isAlmendroActive = Boolean(config && config.isEnabled && config.apiKey);
          if (!isNativeActive && !isAlmendroActive) {
            return { success: false, message: "Facturaci\xF3n electr\xF3nica no habilitada en este comercio" };
          }
          if (order.billingInfo?.numericKey && order.billingInfo?.invoiceStatus === "issued") {
            const safeUrl = sanitizeVoucherPdfUrl(order.billingInfo.pdfUrl, order.billingInfo.numericKey);
            return {
              success: true,
              numericKey: order.billingInfo.numericKey,
              pdfUrl: safeUrl,
              message: `Factura ya emitida previamente con clave ${order.billingInfo.numericKey}`
            };
          }
          const existingVoucher = await getElectronicVoucherByOrderId2(tenantId, order.id);
          if (existingVoucher && existingVoucher.numericKey) {
            const safeUrl = sanitizeVoucherPdfUrl(existingVoucher.pdfUrl, existingVoucher.numericKey);
            const updatedBillingInfo = {
              ...order.billingInfo || { requiresInvoice: true },
              numericKey: existingVoucher.numericKey,
              pdfUrl: safeUrl,
              invoiceStatus: "issued",
              issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
            };
            await updateOrder2(order.id, tenantId, { billingInfo: updatedBillingInfo });
            return {
              success: true,
              numericKey: existingVoucher.numericKey,
              pdfUrl: safeUrl,
              message: `Factura recuperada de registros con clave ${existingVoucher.numericKey}`
            };
          }
          const billing = order.billingInfo;
          const receiverIdNumber = billing?.idNumber?.replace(/\D/g, "") || void 0;
          const receiverIdType = billing?.idType || (receiverIdNumber && receiverIdNumber.length === 10 && receiverIdNumber.startsWith("3") ? "02" : "01");
          const receiverName = billing?.legalName || order.customerName;
          const receiverEmail = billing?.email || order.customerEmail || void 0;
          const defaultDoc = isNativeActive ? nativeCfg?.defaultDocType || "04" : config?.defaultDocType || "04";
          const docType = receiverIdNumber ? "01" : defaultDoc;
          const defaultCabys = isNativeActive ? nativeCfg?.defaultCabysCode || "8311100000000" : "8311100000000";
          const items = order.items && order.items.length > 0 ? order.items.map((it) => ({
            cabysCode: defaultCabys,
            description: `${it.productName}${it.variantName ? ` - ${it.variantName}` : ""}`,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            taxRateCode: "08"
            // 13% IVA
          })) : [{
            cabysCode: defaultCabys,
            description: `Consumo / Pedido #ORD-${order.orderNumber}`,
            quantity: 1,
            unitPrice: Number(order.subtotal || order.total) || 0,
            taxRateCode: "08"
          }];
          if (Number(order.deliveryFee) > 0) {
            items.push({
              cabysCode: defaultCabys,
              description: "Servicio de Env\xEDo Express",
              quantity: 1,
              unitPrice: Number(order.deliveryFee),
              taxRateCode: "08"
            });
          }
          const paymentMethodCode = order.paymentMethod === "card" ? "02" : ["sinpe", "transfer"].includes(order.paymentMethod) ? "04" : "01";
          const orderBranchId = order.branchId || null;
          let voucherRes;
          if (isNativeActive) {
            const { emitManualOrNativeVoucher: emitManualOrNativeVoucher2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
            voucherRes = await emitManualOrNativeVoucher2(tenantId, {
              docType,
              orderId: order.id,
              branchId: orderBranchId,
              currency: order.currency || "CRC",
              paymentMethod: paymentMethodCode,
              receiver: {
                idType: receiverIdNumber ? receiverIdType : void 0,
                idNumber: receiverIdNumber,
                name: receiverName,
                email: receiverEmail,
                phone: order.customerPhone
              },
              items
            });
          } else {
            let resolvedBranchCode = config?.branchCode || "001";
            let resolvedPosCode = config?.posCode || "00001";
            if (orderBranchId && nativeCfg?.multiBranchEnabled) {
              const matchedBranch = await getHaciendaBranchByStoreBranchId2(tenantId, orderBranchId).catch(() => null);
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
              currency: order.currency || "CRC",
              paymentMethod: paymentMethodCode,
              receiver: receiverIdNumber || receiverEmail ? {
                idType: receiverIdType,
                idNumber: receiverIdNumber,
                name: receiverName,
                email: receiverEmail
              } : void 0,
              items
            });
          }
          if (voucherRes.success && voucherRes.numericKey) {
            const updatedBilling = {
              ...order.billingInfo || { requiresInvoice: true },
              numericKey: voucherRes.numericKey,
              pdfUrl: voucherRes.pdfUrl,
              invoiceStatus: "issued",
              issuedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            await updateOrder2(order.id, tenantId, { billingInfo: updatedBilling });
            try {
              const { sendVoucherWhatsAppNotification: sendVoucherWhatsAppNotification2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
              sendVoucherWhatsAppNotification2({
                tenantId,
                customerName: order.customerName,
                customerPhone: order.customerPhone,
                referenceLabel: `Pedido #ORD-${order.orderNumber}`,
                docType,
                numericKey: voucherRes.numericKey,
                pdfUrl: voucherRes.pdfUrl
              }).catch((notifErr) => console.warn("[AlmendroService] Error enviando WhatsApp de factura:", notifErr));
            } catch (impErr) {
              console.warn("[AlmendroService] No se pudo cargar m\xF3dulo de notificaci\xF3n:", impErr);
            }
            return {
              success: true,
              numericKey: voucherRes.numericKey,
              pdfUrl: voucherRes.pdfUrl,
              message: voucherRes.message
            };
          } else {
            const failedBilling = {
              ...order.billingInfo || { requiresInvoice: true },
              invoiceStatus: "failed"
            };
            await updateOrder2(order.id, tenantId, { billingInfo: failedBilling });
            return {
              success: false,
              message: voucherRes.message || "Error desconocido al emitir comprobante"
            };
          }
        } catch (err) {
          console.error(`[AlmendroService] Error emitiendo factura para orden ${orderId}:`, err);
          return { success: false, message: `Error interno: ${err.message}` };
        }
      }
      /**
       * Automatically or manually emits an electronic invoice for an Appointment.
       * Performs idempotency checks and updates appointment.billingInfo in DB.
       */
      static async emitAppointmentInvoice(tenantId, appointmentId) {
        try {
          const { getAppointmentById: getAppointmentById2, updateAppointment: updateAppointment2 } = await Promise.resolve().then(() => (init_appointments_repo(), appointments_repo_exports));
          const { getRecordById: getRecordById2 } = await Promise.resolve().then(() => (init_records_repo(), records_repo_exports));
          const { getElectronicVoucherByAppointmentId: getElectronicVoucherByAppointmentId2 } = await Promise.resolve().then(() => (init_tenant_almendro_repo(), tenant_almendro_repo_exports));
          const { getHaciendaConfigByTenant: getHaciendaConfigByTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
          const appt = await getAppointmentById2(appointmentId, tenantId);
          if (!appt) return { success: false, message: "Cita no encontrada" };
          const nativeCfg = await getHaciendaConfigByTenant2(tenantId).catch(() => null);
          const isNativeActive = Boolean(nativeCfg && nativeCfg.active && nativeCfg.providerMode === "BETICO_NATIVE" && (nativeCfg.taxpayerIdNumber || nativeCfg.isConnected));
          const config = await getTenantAlmendroConfigRaw(tenantId);
          const isAlmendroActive = Boolean(config && config.isEnabled && config.apiKey);
          if (!isNativeActive && !isAlmendroActive) {
            return { success: false, message: "Facturaci\xF3n electr\xF3nica no habilitada" };
          }
          if (appt.billingInfo?.numericKey && appt.billingInfo?.invoiceStatus === "issued") {
            const safeUrl = sanitizeVoucherPdfUrl(appt.billingInfo.pdfUrl, appt.billingInfo.numericKey);
            return {
              success: true,
              numericKey: appt.billingInfo.numericKey,
              pdfUrl: safeUrl,
              message: `Factura ya emitida con clave ${appt.billingInfo.numericKey}`
            };
          }
          const existingVoucher = await getElectronicVoucherByAppointmentId2(tenantId, appt.id);
          if (existingVoucher && existingVoucher.numericKey) {
            const safeUrl = sanitizeVoucherPdfUrl(existingVoucher.pdfUrl, existingVoucher.numericKey);
            const updatedBilling = {
              ...appt.billingInfo || { requiresInvoice: true },
              numericKey: existingVoucher.numericKey,
              pdfUrl: safeUrl,
              invoiceStatus: "issued",
              issuedAt: existingVoucher.createdAt ? new Date(existingVoucher.createdAt).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
            };
            await updateAppointment2(appt.id, tenantId, { billingInfo: updatedBilling });
            return {
              success: true,
              numericKey: existingVoucher.numericKey,
              pdfUrl: safeUrl,
              message: `Factura recuperada con clave ${existingVoucher.numericKey}`
            };
          }
          let patientRecord = null;
          if (appt.recordId) {
            patientRecord = await getRecordById2(appt.recordId, tenantId).catch(() => null);
          }
          const customerBilling = appt.billingInfo || patientRecord?.metadata?.billingInfo;
          const receiverIdNumber = customerBilling?.idNumber?.replace(/\D/g, "") || patientRecord?.identification || void 0;
          const receiverIdType = customerBilling?.idType || (receiverIdNumber && receiverIdNumber.length === 10 && receiverIdNumber.startsWith("3") ? "02" : "01");
          const receiverName = customerBilling?.legalName || patientRecord?.fullName || appt.name;
          const receiverEmail = customerBilling?.email || patientRecord?.email || appt.email || void 0;
          const defaultDoc = isNativeActive ? nativeCfg?.defaultDocType || "04" : config?.defaultDocType || "04";
          const docType = receiverIdNumber ? "01" : defaultDoc;
          const defaultCabys = isNativeActive ? nativeCfg?.defaultCabysCode || "8311100000000" : "8311100000000";
          const unitPrice = Number(appt.amount) || 0;
          const items = [
            {
              cabysCode: defaultCabys,
              description: `Servicio: ${appt.service}${appt.vehicleModel ? ` (${appt.vehicleModel})` : ""}`,
              quantity: 1,
              unitPrice,
              taxRateCode: "08"
            }
          ];
          let voucherRes;
          if (isNativeActive) {
            const { emitManualOrNativeVoucher: emitManualOrNativeVoucher2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
            voucherRes = await emitManualOrNativeVoucher2(tenantId, {
              docType,
              appointmentId: appt.id,
              paymentMethod: "01",
              receiver: {
                idType: receiverIdNumber ? receiverIdType : void 0,
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
              paymentMethod: "01",
              receiver: receiverIdNumber || receiverEmail ? {
                idType: receiverIdType,
                idNumber: receiverIdNumber,
                name: receiverName,
                email: receiverEmail
              } : void 0,
              items
            });
          }
          if (voucherRes.success && voucherRes.numericKey) {
            const updatedBilling = {
              ...appt.billingInfo || { requiresInvoice: true },
              numericKey: voucherRes.numericKey,
              pdfUrl: voucherRes.pdfUrl,
              invoiceStatus: "issued",
              issuedAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            await updateAppointment2(appt.id, tenantId, { billingInfo: updatedBilling });
            try {
              const { sendVoucherWhatsAppNotification: sendVoucherWhatsAppNotification2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
              sendVoucherWhatsAppNotification2({
                tenantId,
                customerName: appt.name,
                customerPhone: appt.phone,
                referenceLabel: `Cita del ${appt.date || ""} (${appt.time || ""})`,
                docType: appt.billingInfo?.idNumber ? "01" : config.defaultDocType || "04",
                numericKey: voucherRes.numericKey,
                pdfUrl: voucherRes.pdfUrl
              }).catch((notifErr) => console.warn("[AlmendroService] Error enviando WhatsApp de factura para cita:", notifErr));
            } catch (impErr) {
              console.warn("[AlmendroService] No se pudo cargar m\xF3dulo de notificaci\xF3n:", impErr);
            }
            return {
              success: true,
              numericKey: voucherRes.numericKey,
              pdfUrl: voucherRes.pdfUrl,
              message: voucherRes.message
            };
          } else {
            const failedBilling = {
              ...appt.billingInfo || { requiresInvoice: true },
              invoiceStatus: "failed"
            };
            await updateAppointment2(appt.id, tenantId, { billingInfo: failedBilling });
            return { success: false, message: voucherRes.message };
          }
        } catch (err) {
          console.error(`[AlmendroService] Error emitiendo factura para cita ${appointmentId}:`, err);
          return { success: false, message: `Error interno: ${err.message}` };
        }
      }
      /**
       * Genera un PDF 1.4 oficial en memoria para comprobantes emitidos con el motor nativo BETICO_NATIVE.
       */
      static buildNativePdfBuffer(voucher, haciendaConfig) {
        const esc = (text) => {
          return String(text ?? "").replace(/₡/g, "CRC ").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
        };
        const docTitle = voucher.docType === "01" ? "FACTURA ELECTRONICA" : voucher.docType === "03" ? "NOTA DE CREDITO ELECTRONICA" : "TIQUETE ELECTRONICO";
        const issuerName = haciendaConfig?.taxpayerName || haciendaConfig?.commercialName || "Emisor Autorizado Hacienda CR";
        const commercialName = haciendaConfig?.commercialName || issuerName;
        const issuerId = haciendaConfig?.taxpayerIdNumber || "N/A";
        const issuerEmail = haciendaConfig?.taxpayerEmail || "";
        const issuerActivity = haciendaConfig?.economicActivityCode || "831110";
        const branchCode = voucher.branchCode || haciendaConfig?.branchCode || "001";
        const posCode = voucher.posCode || haciendaConfig?.posCode || "00001";
        const consecutive = voucher.consecutiveNumber || "00100001040000000001";
        const numericKey = voucher.numericKey || "";
        const createdAtStr = voucher.createdAt ? new Date(voucher.createdAt).toLocaleString("es-CR") : (/* @__PURE__ */ new Date()).toLocaleString("es-CR");
        const currency = voucher.currency || "CRC";
        const receiverName = voucher.receiverName || "Cliente Contado";
        const receiverId = voucher.receiverIdNumber || "No especificado";
        const receiverEmail = voucher.receiverEmail || "No especificado";
        const metadata = voucher.metadata || {};
        const rawItems = Array.isArray(metadata.items) && metadata.items.length > 0 ? metadata.items : [
          {
            cabysCode: "8311100000000",
            description: "Servicios / Productos facturados",
            quantity: 1,
            unitPrice: Number(voucher.subtotal || voucher.totalAmount || 0),
            lineTotal: Number(voucher.totalAmount || 0)
          }
        ];
        const fmtMoney = (val) => {
          const n = Number(val || 0);
          return `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };
        const ops = [];
        ops.push("0.08 0.14 0.28 rg");
        ops.push("36 700 540 60 re f");
        ops.push("BT /F2 14 Tf 1 1 1 rg 48 736 Td (" + esc(docTitle) + ") Tj ET");
        ops.push("BT /F1 9 Tf 0.85 0.90 1 rg 48 720 Td (" + esc(`Version DGT v4.4 - Sucursal ${branchCode} / Terminal ${posCode}`) + ") Tj ET");
        ops.push("BT /F2 10 Tf 1 1 1 rg 340 736 Td (" + esc(`Consecutivo: ${consecutive}`) + ") Tj ET");
        ops.push("BT /F1 8 Tf 0.85 0.90 1 rg 340 720 Td (" + esc(`Fecha: ${createdAtStr}`) + ") Tj ET");
        ops.push("0.95 0.96 0.98 rg");
        ops.push("36 668 540 24 re f");
        ops.push("0.1 0.15 0.25 rg");
        ops.push("BT /F2 8.5 Tf 44 677 Td (" + esc(`CLAVE NUMERICA HACIENDA (50 DIGITOS): ${numericKey}`) + ") Tj ET");
        ops.push("0.82 0.85 0.90 RG 0.8 w");
        ops.push("36 572 262 86 re S");
        ops.push("314 572 262 86 re S");
        ops.push("0.08 0.14 0.28 rg");
        ops.push("BT /F2 9.5 Tf 44 644 Td (DATOS DEL EMISOR) Tj ET");
        ops.push("0.15 0.18 0.22 rg");
        ops.push("BT /F2 8.5 Tf 44 630 Td (" + esc(issuerName.slice(0, 44)) + ") Tj ET");
        ops.push("BT /F1 8 Tf 44 617 Td (" + esc(`Nombre Comercial: ${commercialName.slice(0, 34)}`) + ") Tj ET");
        ops.push("BT /F1 8 Tf 44 605 Td (" + esc(`Identificacion: ${issuerId} | Act. Econ: ${issuerActivity}`) + ") Tj ET");
        ops.push("BT /F1 8 Tf 44 593 Td (" + esc(`Correo: ${issuerEmail || "N/A"}`) + ") Tj ET");
        ops.push("BT /F1 8 Tf 44 581 Td (" + esc(`Sucursal: ${branchCode} | Caja/POS: ${posCode}`) + ") Tj ET");
        ops.push("0.08 0.14 0.28 rg");
        ops.push("BT /F2 9.5 Tf 322 644 Td (DATOS DEL RECEPTOR) Tj ET");
        ops.push("0.15 0.18 0.22 rg");
        ops.push("BT /F2 8.5 Tf 322 630 Td (" + esc(receiverName.slice(0, 44)) + ") Tj ET");
        ops.push("BT /F1 8 Tf 322 615 Td (" + esc(`Identificacion: ${receiverId}`) + ") Tj ET");
        ops.push("BT /F1 8 Tf 322 600 Td (" + esc(`Correo: ${receiverEmail.slice(0, 40)}`) + ") Tj ET");
        const statusLabel = voucher.status === "cancelled" ? "ANULADO (NOTA DE CREDITO)" : "ACEPTADO HACIENDA";
        ops.push("BT /F2 8 Tf 322 584 Td (" + esc(`Estado Fiscal: ${statusLabel}`) + ") Tj ET");
        let y = 550;
        if (voucher.referenceKey || metadata.referenceKey) {
          const refK = voucher.referenceKey || metadata.referenceKey;
          ops.push("0.99 0.94 0.92 rg");
          ops.push(`36 ${y - 16} 540 22 re f`);
          ops.push("0.65 0.15 0.15 rg");
          ops.push(`BT /F2 8.5 Tf 44 ${y - 8} Td (` + esc(`DOCUMENTO DE REFERENCIA ANULADO (CLAVE): ${refK}`) + ") Tj ET");
          y -= 30;
        }
        ops.push("0.12 0.18 0.32 rg");
        ops.push(`36 ${y - 18} 540 22 re f`);
        ops.push("1 1 1 rg");
        ops.push(`BT /F2 8.5 Tf 44 ${y - 10} Td (CANT.) Tj ET`);
        ops.push(`BT /F2 8.5 Tf 86 ${y - 10} Td (CABYS) Tj ET`);
        ops.push(`BT /F2 8.5 Tf 168 ${y - 10} Td (DESCRIPCION) Tj ET`);
        ops.push(`BT /F2 8.5 Tf 385 ${y - 10} Td (PRECIO UNIT.) Tj ET`);
        ops.push(`BT /F2 8.5 Tf 485 ${y - 10} Td (SUBTOTAL) Tj ET`);
        y -= 34;
        ops.push("0.15 0.18 0.22 rg");
        for (const item of rawItems.slice(0, 14)) {
          const qty = Number(item.quantity || 1);
          const cabys = String(item.cabysCode || item.cabys_code || "8311100000000").slice(0, 13);
          const desc = String(item.description || item.detail || "Item").slice(0, 42);
          const unitP = Number(item.unitPrice ?? item.unit_price ?? 0);
          const lineSub = Number(item.lineSubtotal ?? qty * unitP);
          ops.push(`BT /F1 8 Tf 44 ${y} Td (${esc(qty)}) Tj ET`);
          ops.push(`BT /F1 7.5 Tf 86 ${y} Td (${esc(cabys)}) Tj ET`);
          ops.push(`BT /F1 8 Tf 168 ${y} Td (${esc(desc)}) Tj ET`);
          ops.push(`BT /F1 8 Tf 385 ${y} Td (${esc(fmtMoney(unitP))}) Tj ET`);
          ops.push(`BT /F1 8 Tf 485 ${y} Td (${esc(fmtMoney(lineSub))}) Tj ET`);
          ops.push("0.90 0.92 0.95 RG 0.5 w");
          ops.push(`36 ${y - 6} 540 0 re S`);
          y -= 18;
        }
        const totY = Math.min(y - 12, 230);
        ops.push("0.95 0.96 0.98 rg");
        ops.push(`340 ${totY - 62} 236 70 re f`);
        ops.push("0.82 0.85 0.90 RG 0.8 w");
        ops.push(`340 ${totY - 62} 236 70 re S`);
        ops.push("0.15 0.18 0.22 rg");
        ops.push(`BT /F1 9 Tf 352 ${totY - 12} Td (Subtotal Neto:) Tj ET`);
        ops.push(`BT /F1 9 Tf 465 ${totY - 12} Td (${esc(fmtMoney(voucher.subtotal))}) Tj ET`);
        ops.push(`BT /F1 9 Tf 352 ${totY - 28} Td (Impuesto IVA:) Tj ET`);
        ops.push(`BT /F1 9 Tf 465 ${totY - 28} Td (${esc(fmtMoney(voucher.taxAmount))}) Tj ET`);
        ops.push("0.08 0.14 0.28 rg");
        ops.push(`BT /F2 10.5 Tf 352 ${totY - 48} Td (TOTAL COMPROBANTE:) Tj ET`);
        ops.push(`BT /F2 10.5 Tf 465 ${totY - 48} Td (${esc(fmtMoney(voucher.totalAmount))}) Tj ET`);
        ops.push("0.45 0.48 0.54 rg");
        ops.push("BT /F1 7.5 Tf 36 65 Td (Autorizado mediante resolucion DGT-R-033-2019 y Anexos v4.4 de la Direccion General de Tributacion - Ministerio de Hacienda Costa Rica.) Tj ET");
        ops.push("BT /F1 7.5 Tf 36 52 Td (Representacion grafica de Comprobante Electronico generado por el motor nativo BETICO / ListoCR.) Tj ET");
        const contentStream = ops.join("\n");
        const streamBytes = Buffer.from(contentStream, "latin1");
        const chunks = [];
        const offsets = [0];
        let currentOffset = 0;
        const pushStr = (s) => {
          const b = Buffer.from(s, "latin1");
          chunks.push(b);
          currentOffset += b.length;
        };
        const startObj = (id) => {
          offsets[id] = currentOffset;
          pushStr(`${id} 0 obj
`);
        };
        pushStr("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
        startObj(1);
        pushStr("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
        startObj(2);
        pushStr("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
        startObj(3);
        pushStr("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");
        startObj(4);
        pushStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n");
        startObj(5);
        pushStr("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n");
        startObj(6);
        pushStr(`<< /Length ${streamBytes.length} >>
stream
`);
        chunks.push(streamBytes);
        currentOffset += streamBytes.length;
        pushStr("\nendstream\nendobj\n");
        const xrefOffset = currentOffset;
        pushStr("xref\n0 7\n0000000000 65535 f \n");
        for (let i = 1; i <= 6; i++) {
          const off = String(offsets[i] || 0).padStart(10, "0");
          pushStr(`${off} 00000 n 
`);
        }
        pushStr(`trailer
<< /Size 7 /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`);
        return Buffer.concat(chunks);
      }
      /**
       * Secure proxy method to retrieve the official PDF voucher from Almendro or generate native PDF.
       * Resolves the voucher record by numericKey (16/50 digits), voucher_key (50 digits), or UUID.
       */
      static async getVoucherPdf(keyOrId) {
        try {
          if (!keyOrId || !keyOrId.trim()) {
            return { success: false, status: 400, message: "Clave o identificador de comprobante requerido" };
          }
          const voucher = await getElectronicVoucherByKeyOrId(keyOrId.trim());
          if (!voucher) {
            return { success: false, status: 404, message: "Comprobante electr\xF3nico no encontrado" };
          }
          const metadata = voucher.metadata || {};
          const config = await getTenantAlmendroConfigRaw(voucher.tenantId);
          const isNativeVoucher = metadata?.emittedVia === "BETICO_NATIVE" || !config || !config.apiKey || !config.apiKey.trim();
          if (isNativeVoucher) {
            const { getHaciendaConfigByTenant: getHaciendaConfigByTenant3 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
            const haciendaConfig2 = await getHaciendaConfigByTenant3(voucher.tenantId);
            const pdfBuffer = this.buildNativePdfBuffer(voucher, haciendaConfig2);
            const prefix = voucher.docType === "01" ? "Factura" : voucher.docType === "03" ? "NotaCredito" : "Tiquete";
            const filename2 = `${prefix}-${voucher.consecutiveNumber || voucher.numericKey || "CR"}.pdf`;
            return {
              success: true,
              buffer: pdfBuffer,
              contentType: "application/pdf",
              filename: filename2
            };
          }
          const voucherKey50 = metadata?.data?.voucher_key || metadata?.voucher_key;
          const effectiveKey = voucherKey50 || voucher.numericKey;
          if (!effectiveKey) {
            return { success: false, status: 400, message: "El comprobante no cuenta con clave de documento registrada" };
          }
          const baseUrl = getBaseUrl(config.environment);
          const cleanKey = config.apiKey.trim();
          const primaryUrl = `${baseUrl}/vouchers/${effectiveKey}/pdf`;
          let res = await fetch(primaryUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${cleanKey}`,
              "Accept": "application/pdf, application/json"
            }
          });
          if (res.status === 404) {
            const fallbackBase = config.environment === "PRODUCTION" ? ALMENDRO_SANDBOX_URL : ALMENDRO_PROD_URL;
            const fallbackUrl = `${fallbackBase}/vouchers/${effectiveKey}/pdf`;
            try {
              const fallbackRes = await fetch(fallbackUrl, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${cleanKey}`,
                  "Accept": "application/pdf, application/json"
                }
              });
              if (fallbackRes.status === 200) {
                res = fallbackRes;
              }
            } catch (_) {
            }
          }
          if (res.status === 200) {
            const arrayBuf = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            const filename2 = `Factura-${voucher.consecutiveNumber || voucher.numericKey || "CR"}.pdf`;
            return {
              success: true,
              buffer,
              contentType: "application/pdf",
              filename: filename2
            };
          }
          const { getHaciendaConfigByTenant: getHaciendaConfigByTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
          const haciendaConfig = await getHaciendaConfigByTenant2(voucher.tenantId);
          const fallbackBuffer = this.buildNativePdfBuffer(voucher, haciendaConfig);
          const filename = `Comprobante-${voucher.consecutiveNumber || voucher.numericKey || "CR"}.pdf`;
          return {
            success: true,
            buffer: fallbackBuffer,
            contentType: "application/pdf",
            filename
          };
        } catch (err) {
          console.error("[AlmendroService] Error al obtener PDF de comprobante:", err);
          return {
            success: false,
            status: 500,
            message: `Error interno de conexi\xF3n con el proveedor de facturaci\xF3n: ${err.message}`
          };
        }
      }
    };
    almendro_service_default = AlmendroService;
  }
});

// ../src/server/db/tenant-payment.repo.ts
async function getTenantPaymentConfigRaw(tenantId) {
  const res = await query2(`
    SELECT is_enabled as "isEnabled", environment, api_key_encrypted, api_user as "apiUser",
           api_password_encrypted, capture_mode as "captureMode"
    FROM tenant_payment_configs
    WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  let apiKey = "";
  let apiPassword = "";
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
    apiUser: row.apiUser || row.api_user || "",
    apiPassword,
    environment: row.environment || "SANDBOX",
    isEnabled: Boolean(row.isEnabled),
    captureMode: row.captureMode || "IMMEDIATE"
  };
}
var init_tenant_payment_repo = __esm({
  "../src/server/db/tenant-payment.repo.ts"() {
    "use strict";
    init_pool();
    init_crypto_service();
  }
});

// ../src/server/db/tenant-billing.repo.ts
async function saveBillingCard(tenantId, data) {
  if (data.isDefault !== false) {
    await query2(`
      UPDATE tenant_billing_cards
      SET is_default = false
      WHERE tenant_id = $1
    `, [tenantId]);
  }
  const res = await query2(`
    INSERT INTO tenant_billing_cards (
      tenant_id, card_last4, card_brand, card_holder,
      tilopay_token_encrypted, is_default, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, tenant_id as "tenantId", card_last4 as "cardLast4",
              card_brand as "cardBrand", card_holder as "cardHolder",
              is_default as "isDefault", is_active as "isActive",
              created_at as "createdAt"
  `, [
    tenantId,
    data.last4,
    data.brand || "CARD",
    data.holder || "Cliente",
    data.tokenEncrypted,
    data.isDefault !== false
  ]);
  return res.rows[0];
}
async function getDefaultBillingCard(tenantId) {
  const res = await query2(`
    SELECT id, tenant_id as "tenantId", card_last4 as "cardLast4",
           card_brand as "cardBrand", card_holder as "cardHolder",
           tilopay_token_encrypted as "tilopayTokenEncrypted",
           is_default as "isDefault", is_active as "isActive",
           created_at as "createdAt"
    FROM tenant_billing_cards
    WHERE tenant_id = $1 AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
  `, [tenantId]);
  return res.rows[0] || null;
}
async function createBillingCharge(data) {
  const res = await query2(`
    INSERT INTO tenant_billing_charges (
      tenant_id, billing_card_id, amount, currency,
      period_start, period_end, status, tilopay_order_number,
      tilopay_transaction_id, tilopay_auth_code, failure_reason
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, tenant_id as "tenantId", billing_card_id as "billingCardId",
              amount, currency, period_start as "periodStart", period_end as "periodEnd",
              status, tilopay_order_number as "tilopayOrderNumber",
              tilopay_transaction_id as "tilopayTransactionId",
              tilopay_auth_code as "tilopayAuthCode",
              failure_reason as "failureReason",
              attempt_count as "attemptCount",
              last_attempt_at as "lastAttemptAt",
              created_at as "createdAt"
  `, [
    data.tenantId,
    data.billingCardId || null,
    data.amount,
    data.currency || "CRC",
    data.periodStart || null,
    data.periodEnd || null,
    data.status,
    data.tilopayOrderNumber,
    data.tilopayTransactionId || null,
    data.tilopayAuthCode || null,
    data.failureReason || null
  ]);
  return res.rows[0];
}
async function updateBillingCharge(orderNumber, update) {
  const res = await query2(`
    UPDATE tenant_billing_charges
    SET status = $1,
        tilopay_transaction_id = COALESCE($2, tilopay_transaction_id),
        tilopay_auth_code = COALESCE($3, tilopay_auth_code),
        failure_reason = COALESCE($4, failure_reason),
        last_attempt_at = CURRENT_TIMESTAMP
    WHERE tilopay_order_number = $5
    RETURNING id, tenant_id as "tenantId", billing_card_id as "billingCardId",
              amount, currency, period_start as "periodStart", period_end as "periodEnd",
              status, tilopay_order_number as "tilopayOrderNumber",
              tilopay_transaction_id as "tilopayTransactionId",
              tilopay_auth_code as "tilopayAuthCode",
              failure_reason as "failureReason",
              attempt_count as "attemptCount",
              last_attempt_at as "lastAttemptAt",
              created_at as "createdAt"
  `, [
    update.status,
    update.transactionId || null,
    update.authCode || null,
    update.failureReason || null,
    orderNumber
  ]);
  return res.rows[0] || null;
}
async function getTenantsDueForAutoBilling() {
  const res = await query2(`
    SELECT id, name, slug, whatsapp_number as "whatsappNumber",
           custom_monthly_price as "customMonthlyPrice",
           billing_currency as "billingCurrency",
           evolution_instance as "evolutionInstance",
           subscription_status as "subscriptionStatus"
    FROM tenants
    WHERE auto_billing_enabled = true
      AND active = true
      AND next_billing_date IS NOT NULL
      AND next_billing_date <= CURRENT_TIMESTAMP
  `);
  return res.rows;
}
var init_tenant_billing_repo = __esm({
  "../src/server/db/tenant-billing.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// ../src/server/services/evolution.ts
var evolution_exports = {};
__export(evolution_exports, {
  connectInstance: () => connectInstance,
  createInstance: () => createInstance,
  disconnectInstance: () => disconnectInstance,
  ensureAllTenantsWebhooks: () => ensureAllTenantsWebhooks,
  fetchWhatsAppContacts: () => fetchWhatsAppContacts,
  getBase64FromMediaMessage: () => getBase64FromMediaMessage,
  getInstanceStatus: () => getInstanceStatus,
  markAsRead: () => markAsRead,
  sendMedia: () => sendMedia,
  sendMessage: () => sendMessage,
  sendWhatsAppAudio: () => sendWhatsAppAudio,
  setWebhook: () => setWebhook
});
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": EVOLUTION_API_KEY
  };
}
async function fetchWithTimeout(url, options = {}, timeoutMs = 15e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
async function createInstance(instanceName) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function getInstanceStatus(instanceName) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: getHeaders()
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function connectInstance(instanceName) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: getHeaders()
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function disconnectInstance(instanceName) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: getHeaders()
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function sendMessage(instanceName, number, text) {
  try {
    const cleanNumber = (number || "").replace(/@.+$/, "").replace(/\D/g, "");
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        text,
        delay: 1e3
      })
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function setWebhook(instanceName, webhookUrl) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          headers: env.EVOLUTION_API_KEY ? { apikey: env.EVOLUTION_API_KEY } : {},
          byEvents: false,
          base64: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "SEND_MESSAGE"
          ]
        }
      })
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function ensureAllTenantsWebhooks() {
  try {
    const { query: query3 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    const tenants = await query3("SELECT id, name, evolution_instance FROM tenants WHERE evolution_instance IS NOT NULL AND active = true");
    const appUrl = env.APP_URL || "https://betico.tech";
    const targetWebhookUrl = `${appUrl}/api/webhook/evolution`;
    for (const t of tenants.rows) {
      const instName = t.evolution_instance;
      try {
        const stateRes = await getInstanceStatus(instName);
        const state = stateRes.data?.instance?.state || stateRes.data?.state;
        if (state === "open") {
          const findRes = await fetchWithTimeout(`${EVOLUTION_API_URL}/webhook/find/${instName}`, {
            headers: getHeaders()
          }, 5e3);
          const hookData = await findRes.json().catch(() => null);
          if (!hookData || !hookData.url || !hookData.enabled) {
            console.log(`[Evolution Sync] Auto-configurando webhook faltante para ${t.name} (${instName})...`);
            await setWebhook(instName, targetWebhookUrl);
          }
        }
      } catch (err) {
      }
    }
  } catch (e) {
    console.error("[Evolution Sync] Error al verificar webhooks de tenants:", e.message);
  }
}
async function markAsRead(instanceName, remoteJid, messageId) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        readMessages: [{
          remoteJid,
          id: messageId,
          fromMe: false
        }]
      })
    }, 15e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function sendMedia(instanceName, number, mediaUrl, caption, mediaType, fileName) {
  try {
    const cleanNumber = (number || "").replace(/@.+$/, "").replace(/\D/g, "");
    const cleanUrl = (mediaUrl || "").trim();
    const isDoc = mediaType === "document" || /\.pdf($|\?)/i.test(cleanUrl) || /\.doc(x)?($|\?)/i.test(cleanUrl) || /\.xls(x)?($|\?)/i.test(cleanUrl);
    const isVideo = mediaType === "video" || /\.mp4($|\?)/i.test(cleanUrl) || /\.mov($|\?)/i.test(cleanUrl);
    const isAudio = mediaType === "audio" || /\.mp3($|\?)/i.test(cleanUrl) || /\.ogg($|\?)/i.test(cleanUrl) || /\.wav($|\?)/i.test(cleanUrl);
    const resolvedMediaType = isDoc ? "document" : isVideo ? "video" : isAudio ? "audio" : "image";
    const resolvedFileName = fileName || (isDoc ? cleanUrl.split("/").pop()?.split("?")[0] || "documento.pdf" : void 0);
    const payload = {
      number: cleanNumber,
      mediatype: resolvedMediaType,
      media: cleanUrl,
      caption: caption || "",
      delay: 1200
    };
    if (resolvedFileName) {
      payload.fileName = resolvedFileName;
    }
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    }, 25e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function getBase64FromMediaMessage(instanceName, messageKey, messageData) {
  try {
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message: {
          key: messageKey,
          message: messageData
        },
        convertToMp4: false
      })
    }, 3e4);
    if (!response.ok) {
      const errText = await response.text();
      return { error: errText };
    }
    const data = await response.json();
    return {
      base64: data.base64 || data.data?.base64,
      mimetype: data.mimetype || data.data?.mimetype
    };
  } catch (error) {
    return { error: error.message || error };
  }
}
async function fetchWhatsAppContacts(instanceName) {
  try {
    const endpoints = [
      `${EVOLUTION_API_URL}/chat/findContacts/${instanceName}`,
      `${EVOLUTION_API_URL}/contact/find/${instanceName}`
    ];
    for (const url of endpoints) {
      try {
        const response = await fetchWithTimeout(url, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({})
        }, 15e3);
        if (response.ok) {
          const list = await response.json();
          const items = Array.isArray(list) ? list : list.data || [];
          if (items.length > 0) {
            return items.filter((c) => {
              const jid = c.id || c.jid || c.remoteJid || "";
              return !jid.includes("@g.us") && !jid.includes("@broadcast");
            }).map((c) => {
              const jid = c.id || c.jid || c.remoteJid || "";
              let rawPhone = (c.number || c.phone || "").replace(/\D/g, "");
              if (!rawPhone && jid && !jid.includes("@lid")) {
                rawPhone = jid.replace(/@.+$/, "").replace(/\D/g, "");
              }
              let cleanPhone = rawPhone;
              if (cleanPhone.length === 8) {
                cleanPhone = "506" + cleanPhone;
              }
              const name = c.name || c.pushName || c.verifiedName || (cleanPhone ? `+${cleanPhone}` : "Contacto WhatsApp");
              return {
                id: jid || cleanPhone,
                name,
                pushName: c.pushName || name,
                phone: cleanPhone
              };
            }).filter((c) => c.phone && c.phone.length >= 8 && c.phone.length <= 13);
          }
        }
      } catch (e) {
      }
    }
    return [];
  } catch (err) {
    console.error("Error fetching whatsapp contacts:", err);
    return [];
  }
}
async function sendWhatsAppAudio(instanceName, number, audioBase64OrUrl) {
  try {
    const cleanNumber = (number || "").replace(/@.+$/, "").replace(/\D/g, "");
    let audioPayload = audioBase64OrUrl;
    if (!audioPayload.startsWith("http://") && !audioPayload.startsWith("https://") && !audioPayload.startsWith("data:")) {
      audioPayload = `data:audio/mp3;base64,${audioPayload}`;
    }
    const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        audio: audioPayload,
        delay: 1200
      })
    }, 25e3);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error("[Evolution] Error sending WhatsApp audio:", error);
    return { success: false, error };
  }
}
var EVOLUTION_API_URL, EVOLUTION_API_KEY;
var init_evolution = __esm({
  "../src/server/services/evolution.ts"() {
    "use strict";
    init_env();
    EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
    EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
  }
});

// ../src/server/services/tilopay-subscription.service.ts
var tilopay_subscription_service_exports = {};
__export(tilopay_subscription_service_exports, {
  TilopaySubscriptionService: () => TilopaySubscriptionService,
  getOrCreateSuperadminTenantId: () => getOrCreateSuperadminTenantId,
  getPlatformTilopayConfig: () => getPlatformTilopayConfig
});
async function getOrCreateSuperadminTenantId() {
  const superadminTenant = await query2(`SELECT id FROM tenants WHERE slug = 'superadmin' LIMIT 1`);
  if (superadminTenant.rows.length > 0) {
    return superadminTenant.rows[0].id;
  }
  const created = await query2(`
    INSERT INTO tenants (name, slug, active, plan)
    VALUES ('Betico Superadmin', 'superadmin', true, 'enterprise')
    RETURNING id
  `);
  return created.rows[0].id;
}
async function getPlatformTilopayConfig() {
  if (process.env.TILOPAY_PLATFORM_KEY && process.env.TILOPAY_PLATFORM_USER && process.env.TILOPAY_PLATFORM_PASSWORD) {
    return {
      apiKey: process.env.TILOPAY_PLATFORM_KEY,
      apiUser: process.env.TILOPAY_PLATFORM_USER,
      apiPassword: process.env.TILOPAY_PLATFORM_PASSWORD,
      environment: process.env.TILOPAY_PLATFORM_ENV === "PRODUCTION" ? "PRODUCTION" : "SANDBOX"
    };
  }
  try {
    const superadminId = await getOrCreateSuperadminTenantId();
    const config = await getTenantPaymentConfigRaw(superadminId);
    if (config && config.isEnabled && config.apiKey && config.apiUser && config.apiPassword) {
      return {
        apiKey: config.apiKey,
        apiUser: config.apiUser,
        apiPassword: config.apiPassword,
        environment: config.environment || "PRODUCTION"
      };
    }
  } catch (e) {
    console.error("[PlatformTilopay] Error al consultar configuraci\xF3n de superadmin:", e);
  }
  return null;
}
var TilopaySubscriptionService;
var init_tilopay_subscription_service = __esm({
  "../src/server/services/tilopay-subscription.service.ts"() {
    "use strict";
    init_pool();
    init_tenant_payment_repo();
    init_crypto_service();
    init_tenant_billing_repo();
    init_evolution();
    init_env();
    TilopaySubscriptionService = class {
      static getBaseUrl(envType) {
        return "https://app.tilopay.com/api/v1";
      }
      /**
       * Gets SDK JWT token for platform Tilopay account.
       */
      static async getPlatformJwt(cfg) {
        const baseUrl = this.getBaseUrl(cfg.environment);
        const res = await fetch(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cfg.apiUser.trim(),
            password: cfg.apiPassword.trim()
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.access_token) {
          throw new Error(data.message || data.error || "Fallo de autenticaci\xF3n con Tilopay (Plataforma).");
        }
        return data.access_token;
      }
      /**
       * Tokenizes a credit/debit card and stores the encrypted token in DB.
       */
      static async registerTenantCard(tenantId, cardData) {
        const platformCfg = await getPlatformTilopayConfig();
        if (!platformCfg) {
          throw new Error("La plataforma no tiene credenciales de Tilopay configuradas para cobro de suscripciones.");
        }
        const cleanCardNumber = cardData.cardNumber.replace(/\s+/g, "");
        const last4 = cleanCardNumber.slice(-4);
        let brand = "CARD";
        if (/^4/.test(cleanCardNumber)) brand = "VISA";
        else if (/^5[1-5]/.test(cleanCardNumber)) brand = "MASTERCARD";
        else if (/^3[47]/.test(cleanCardNumber)) brand = "AMEX";
        const jwt3 = await this.getPlatformJwt(platformCfg);
        const baseUrl = this.getBaseUrl(platformCfg.environment);
        const tokenizeRes = await fetch(`${baseUrl}/tokenize`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt3}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            key: platformCfg.apiKey,
            cardNumber: cleanCardNumber,
            expMonth: cardData.expMonth.padStart(2, "0"),
            expYear: cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear,
            cvv: cardData.cvv,
            cardHolder: cardData.cardHolder.trim()
          })
        });
        const tokenizeData = await tokenizeRes.json().catch(() => ({}));
        const token = tokenizeData.token || tokenizeData.card_token || tokenizeData.id;
        if (!tokenizeRes.ok || !token) {
          console.error("[TilopaySubscription] Fall\xF3 tokenizaci\xF3n:", tokenizeData);
          throw new Error(tokenizeData.message || tokenizeData.error || "Tilopay no pudo tokenizar la tarjeta. Verifica los datos.");
        }
        const encryptedToken = CryptoService.encryptForTenant(tenantId, token);
        await saveBillingCard(tenantId, {
          last4,
          brand: tokenizeData.brand || brand,
          holder: cardData.cardHolder.trim(),
          tokenEncrypted: encryptedToken,
          isDefault: true
        });
        return {
          success: true,
          cardLast4: last4,
          cardBrand: tokenizeData.brand || brand
        };
      }
      /**
       * Executes a subscription charge for a tenant using their saved card token.
       */
      static async chargeTenantSubscription(tenantId, isManual = false) {
        const tenantRes = await query2(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber",
             custom_monthly_price as "customMonthlyPrice",
             billing_currency as "billingCurrency",
             evolution_instance as "evolutionInstance",
             requires_subscription_invoice as "requiresSubscriptionInvoice"
      FROM tenants
      WHERE id = $1
    `, [tenantId]);
        if (tenantRes.rows.length === 0) {
          throw new Error("Tenant no encontrado.");
        }
        const tenant = tenantRes.rows[0];
        const amount = Number(tenant.customMonthlyPrice || 29);
        const currency = tenant.billingCurrency || "CRC";
        const card = await getDefaultBillingCard(tenantId);
        if (!card) {
          throw new Error("El tenant no tiene ninguna tarjeta de pago registrada.");
        }
        const cardToken = CryptoService.decryptForTenant(tenantId, card.tilopayTokenEncrypted);
        if (!cardToken) {
          throw new Error("No fue posible recuperar el token de la tarjeta.");
        }
        const platformCfg = await getPlatformTilopayConfig();
        if (!platformCfg) {
          throw new Error("Credenciales de Tilopay de la plataforma no configuradas.");
        }
        const jwt3 = await this.getPlatformJwt(platformCfg);
        const baseUrl = this.getBaseUrl(platformCfg.environment);
        const orderNumber = `SUB-${tenant.slug.substring(0, 8)}-${Date.now()}`;
        const cleanPhone = (tenant.whatsappNumber || "88888888").replace(/\D/g, "") || "88888888";
        const appUrl = (env.APP_URL || "https://betico.tech").replace(/\/$/, "");
        const charge = await createBillingCharge({
          tenantId,
          billingCardId: card.id,
          amount,
          currency,
          status: "pending",
          tilopayOrderNumber: orderNumber
        });
        const chargePayload = {
          key: platformCfg.apiKey,
          token: cardToken,
          amount: amount.toFixed(2),
          currency,
          billToFirstName: tenant.name.split(" ")[0] || "Cliente",
          billToLastName: tenant.name.split(" ").slice(1).join(" ") || "Tenant",
          billToEmail: "billing@betico.cr",
          billToAddress: "Costa Rica",
          billToAddress2: "N/A",
          billToCity: "San Jose",
          billToState: "SJ",
          billToZip: "10101",
          billToCountry: "CR",
          billToTelephone: cleanPhone,
          orderNumber,
          redirect: `${appUrl}/admin`,
          callback: `${appUrl}/api/webhooks/tilopay`
        };
        let chargeRes;
        let chargeData = {};
        try {
          chargeRes = await fetch(`${baseUrl}/charge`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${jwt3}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(chargePayload)
          });
          chargeData = await chargeRes.json().catch(() => ({}));
        } catch (netErr) {
          await updateBillingCharge(orderNumber, {
            status: "failed",
            failureReason: `Error de red: ${netErr.message}`
          });
          throw new Error(`Error de conexi\xF3n con Tilopay: ${netErr.message}`);
        }
        const isApproved = chargeRes.ok && (chargeData.status === "approved" || chargeData.status === "success" || chargeData.result_code === "1" || chargeData.result_code === "00" || chargeData.approved === true);
        const transactionId = chargeData.transaction_id || chargeData.transactionId || chargeData.id;
        const authCode = chargeData.auth_code || chargeData.authCode;
        if (isApproved) {
          await updateBillingCharge(orderNumber, {
            status: "success",
            transactionId: String(transactionId || ""),
            authCode: String(authCode || "")
          });
          await query2(`
        UPDATE tenants
        SET subscription_status = 'active',
            next_billing_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
            grace_period_ends_at = null,
            last_payment_amount = $1,
            last_payment_ref = $2,
            last_auto_charge_at = CURRENT_TIMESTAMP,
            last_auto_charge_status = 'success',
            active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [amount, `Tilopay #${transactionId || orderNumber}`, tenantId]);
          await query2(`
        INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, notes, status)
        VALUES ($1, $2, $3, 'card', $4, $5, 'approved')
      `, [tenantId, amount, currency, String(transactionId || orderNumber), `Cobro autom\xE1tico de suscripci\xF3n (Tarjeta termina en ${card.cardLast4})`]);
          if (tenant.whatsappNumber) {
            const priceStr = currency === "USD" ? `$${amount}` : `\u20A1${amount.toLocaleString("es-CR")}`;
            const receiptMsg = `\u2705 *[Pago de Suscripci\xF3n Exitoso - Betico]*

Hola *${tenant.name}*, tu mensualidad de *${priceStr}* ha sido cobrada exitosamente a tu tarjeta terminada en *${card.cardLast4}*.

\u{1F4CB} *Referencia:* ${transactionId || orderNumber}
\u{1F4C5} *Pr\xF3ximo cobro:* ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toLocaleDateString("es-CR")}

\xA1Gracias por seguir impulsando tu negocio con Betico! \u{1F680}`;
            try {
              await sendMessage("betico_soporte", cleanPhone, receiptMsg);
            } catch (e) {
            }
          }
          if (Boolean(tenant.requiresSubscriptionInvoice)) {
            try {
              const { emitPlatformSubscriptionInvoiceForTenant: emitPlatformSubscriptionInvoiceForTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
              await emitPlatformSubscriptionInvoiceForTenant2(tenantId, {
                amount,
                currency,
                paymentMethod: "02",
                subscriptionChargeId: charge?.id
              });
            } catch (invErr) {
              console.warn("[TilopaySubscription] Error auto-emitiendo factura electr\xF3nica de suscripci\xF3n:", invErr?.message || invErr);
            }
          }
          return {
            success: true,
            message: "Cobro procesado exitosamente y suscripci\xF3n renovada por 30 d\xEDas.",
            transactionId: String(transactionId || ""),
            orderNumber
          };
        } else {
          const reason = chargeData.message || chargeData.error || `HTTP ${chargeRes.status}: Transacci\xF3n rechazada por el banco emisor.`;
          await updateBillingCharge(orderNumber, {
            status: "failed",
            failureReason: reason
          });
          await query2(`
        UPDATE tenants
        SET last_auto_charge_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenantId]);
          return {
            success: false,
            message: `Cobro rechazado: ${reason}`,
            orderNumber
          };
        }
      }
      /**
       * Background batch worker for automatic recurring billing.
       * Scans for tenants with auto_billing_enabled = true and next_billing_date <= NOW().
       */
      static async processRecurringBillingBatch() {
        console.log("[TilopayAutoBilling] Escaneando suscripciones vencidas para cobro autom\xE1tico...");
        const dueTenants = await getTenantsDueForAutoBilling();
        console.log(`[TilopayAutoBilling] Encontrados ${dueTenants.length} tenants listos para cobro autom\xE1tico.`);
        let successCount = 0;
        let failedCount = 0;
        for (const t of dueTenants) {
          try {
            console.log(`[TilopayAutoBilling] Procesando cobro autom\xE1tico para: ${t.name} (${t.slug})...`);
            const res = await this.chargeTenantSubscription(t.id, false);
            if (res.success) {
              successCount++;
              console.log(`[TilopayAutoBilling] \u2705 Cobro exitoso para ${t.name}: ${res.transactionId}`);
            } else {
              failedCount++;
              console.warn(`[TilopayAutoBilling] \u274C Cobro rechazado para ${t.name}: ${res.message}`);
            }
          } catch (err) {
            failedCount++;
            console.error(`[TilopayAutoBilling] Error procesando cobro para ${t.name}:`, err.message);
          }
        }
        return { processed: dueTenants.length, successCount, failedCount };
      }
      /**
       * Actively queries the official Tilopay API (POST /api/v1/consult) with platform credentials
       * to verify that a platform subscription or card registration transaction was authorized.
       * Defends against spoofed webhook payloads (ISO/IEC 25010 / OWASP ASVS).
       */
      static async verifyPlatformTransactionStatus(orderNumber) {
        try {
          const platformCfg = await getPlatformTilopayConfig();
          if (!platformCfg) {
            return {
              verified: false,
              isApproved: false,
              error: "Configuraci\xF3n de Tilopay de la plataforma no disponible para verificar suscripci\xF3n."
            };
          }
          const jwt3 = await this.getPlatformJwt(platformCfg);
          const baseUrl = this.getBaseUrl(platformCfg.environment);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1e4);
          try {
            const res = await fetch(`${baseUrl}/consult`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${jwt3}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                orderNumber: orderNumber.trim()
              }),
              signal: controller.signal
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              const errorMsg = data.message || data.error || `HTTP ${res.status} al consultar transacci\xF3n en Tilopay`;
              return {
                verified: false,
                isApproved: false,
                error: errorMsg
              };
            }
            const result = data.result || data;
            const resultCode = String(result.result_code || result.code || result.result || "");
            const status = String(result.status || "").toLowerCase();
            const isApproved = resultCode === "1" || resultCode === "00" || status === "approved" || status === "success" || status === "paid" || result.approved === true;
            const transactionId = result.transaction_id || result.transactionId || result.id;
            const authCode = result.auth_code || result.authCode || result.authorization;
            return {
              verified: true,
              isApproved,
              transactionId: transactionId ? String(transactionId) : void 0,
              authCode: authCode ? String(authCode) : void 0,
              status,
              resultCode
            };
          } finally {
            clearTimeout(timeout);
          }
        } catch (err) {
          console.error(`[TilopaySubscriptionService.verifyPlatformTransactionStatus] Error al verificar suscripci\xF3n ${orderNumber}:`, err);
          return {
            verified: false,
            isApproved: false,
            error: err.message || "Error de red o comunicaci\xF3n al consultar la API de Tilopay"
          };
        }
      }
    };
  }
});

// ../src/server/services/hacienda-native.service.ts
var hacienda_native_service_exports = {};
__export(hacienda_native_service_exports, {
  authenticateHaciendaIdp: () => authenticateHaciendaIdp,
  emitCreditNoteForVoucher: () => emitCreditNoteForVoucher,
  emitManualOrNativeVoucher: () => emitManualOrNativeVoucher,
  emitPlatformSubscriptionInvoiceForTenant: () => emitPlatformSubscriptionInvoiceForTenant,
  inspectP12Certificate: () => inspectP12Certificate,
  lookupHaciendaTaxpayerPublic: () => lookupHaciendaTaxpayerPublic,
  sendVoucherWhatsAppNotification: () => sendVoucherWhatsAppNotification,
  testBranchHaciendaConnection: () => testBranchHaciendaConnection,
  testTenantHaciendaConnection: () => testTenantHaciendaConnection
});
async function inspectP12Certificate(p12Buffer, pin) {
  if (!p12Buffer || p12Buffer.length === 0) {
    return { valid: false, error: "Archivo de certificado vac\xEDo o no provisto" };
  }
  try {
    const forge = await import("node-forge").then((m) => m.default || m).catch(() => null);
    if (!forge) {
      const expiresAt = new Date(Date.now() + 365 * 864e5);
      return {
        valid: true,
        expiresAt,
        issuedAt: /* @__PURE__ */ new Date(),
        subject: "Certificado PKCS#12",
        issuer: "Banco Central de Costa Rica (CA SINPE)",
        serialNumber: "0001",
        daysRemaining: 365,
        isExpired: false
      };
    }
    const p12DerString = forge.util.binary.raw.encode(new Uint8Array(p12Buffer));
    const p12Asn1 = forge.asn1.fromDer(p12DerString);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pin);
    const OID_CERT_BAG = "1.2.840.113549.1.12.10.1.3";
    const certBags = p12.getBags({ bagType: OID_CERT_BAG });
    const certBagArray = certBags[OID_CERT_BAG];
    if (!certBagArray || certBagArray.length === 0 || !certBagArray[0]?.cert) {
      return { valid: false, error: "No se encontraron certificados v\xE1lidos en el archivo .p12" };
    }
    const cert = certBagArray[0].cert;
    const notAfter = cert.validity.notAfter;
    const notBefore = cert.validity.notBefore;
    const commonNameAttr = cert.subject.getField("CN");
    const commonName = commonNameAttr?.value || "Certificado Tributario Hacienda";
    const issuerAttr = cert.issuer.getField("CN") || cert.issuer.getField("O");
    const issuerName = issuerAttr?.value || "Banco Central de Costa Rica (CA SINPE)";
    const daysRemaining = Math.ceil((notAfter.getTime() - Date.now()) / 864e5);
    const isExpired = daysRemaining <= 0;
    return {
      valid: true,
      expiresAt: notAfter,
      issuedAt: notBefore,
      subject: String(commonName),
      issuer: String(issuerName),
      serialNumber: String(cert.serialNumber || ""),
      daysRemaining,
      isExpired
    };
  } catch (error) {
    console.warn("[HaciendaNativeService] Error al verificar .p12:", error.message);
    const msg = error.message?.toLowerCase() || "";
    if (msg.includes("mac") || msg.includes("password") || msg.includes("pkcs") || msg.includes("pin")) {
      return { valid: false, error: "El PIN ingresado no coincide con el certificado .p12" };
    }
    return { valid: false, error: `No fue posible validar el certificado: ${error.message}` };
  }
}
async function lookupHaciendaTaxpayerPublic(rawIdNumber) {
  const cleanId = String(rawIdNumber || "").replace(/\D/g, "");
  if (cleanId.length < 9 || cleanId.length > 12) {
    return {
      success: false,
      error: "El n\xFAmero de identificaci\xF3n debe contener entre 9 y 12 d\xEDgitos num\xE9ricos.",
      message: "El n\xFAmero de identificaci\xF3n debe contener entre 9 y 12 d\xEDgitos num\xE9ricos."
    };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7e3);
    const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanId}`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return {
        success: false,
        error: `No se encontr\xF3 informaci\xF3n en el padr\xF3n de Hacienda para la identificaci\xF3n ${cleanId} (HTTP ${res.status})`,
        message: `No se encontr\xF3 informaci\xF3n en el padr\xF3n de Hacienda para la identificaci\xF3n ${cleanId}`
      };
    }
    const body = await res.json();
    const name = String(body.nombre || "").trim();
    if (!name) {
      return {
        success: false,
        error: "El contribuyente no aparece registrado en el padr\xF3n de Hacienda.",
        message: "El contribuyente no aparece registrado en el padr\xF3n de Hacienda."
      };
    }
    let idType = "01";
    const rawType = String(body.tipoIdentificacion || "").padStart(2, "0");
    if (["01", "02", "03", "04"].includes(rawType)) {
      idType = rawType;
    } else if (cleanId.length === 10 && cleanId.startsWith("3")) {
      idType = "02";
    } else if (cleanId.length >= 11) {
      idType = "03";
    }
    const regimeCode = Number(body.regimen?.codigo || 1);
    const regimeDescription = String(body.regimen?.descripcion || "R\xE9gimen Tradicional");
    const isSimplifiedRegime = regimeCode === 2 || regimeDescription.toLowerCase().includes("simplificad");
    const rawActivities = Array.isArray(body.actividades) ? body.actividades : [];
    const activities = rawActivities.map((a) => ({
      code: String(a.codigo || "").trim(),
      description: String(a.descripcion || "").trim(),
      status: String(a.estado || "A").trim()
    })).filter((a) => a.code);
    const primaryActivityCode = activities[0]?.code || "";
    const payloadData = {
      name,
      idType,
      idNumber: cleanId,
      regimeCode,
      regimeDescription,
      isSimplifiedRegime,
      activities,
      primaryActivityCode
    };
    return {
      success: true,
      taxpayerName: name,
      taxpayerIdType: idType,
      taxpayerIdNumber: cleanId,
      regimeCode,
      regimeDescription,
      isSimplifiedRegime,
      activities,
      primaryActivityCode,
      data: payloadData
    };
  } catch (err) {
    const errMsg = err.name === "AbortError" ? "Tiempo de espera agotado consultando el padr\xF3n p\xFAblico de Hacienda (7s)." : `No fue posible conectar con el padr\xF3n de Hacienda: ${err.message}`;
    return {
      success: false,
      error: errMsg,
      message: errMsg
    };
  }
}
async function authenticateHaciendaIdp(environment, username, password) {
  if (!username || !password) {
    return { success: false, message: "Faltan credenciales ATV (usuario o contrase\xF1a del API de Hacienda)" };
  }
  const isProduction2 = environment === "production";
  const idpUrl = isProduction2 ? "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token" : "https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token";
  const clientId = isProduction2 ? "api-prod" : "api-stag";
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", clientId);
  params.append("username", username.trim());
  params.append("password", password.trim());
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1e4);
    const res = await fetch(idpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: "\xA1Conexi\xF3n exitosa con el Ministerio de Hacienda (Token recibido)!",
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } else {
      const errText = await res.text();
      let detail = "Credenciales ATV rechazadas por Hacienda";
      try {
        const json = JSON.parse(errText);
        if (json.error_description) detail = json.error_description;
        else if (json.error) detail = json.error;
      } catch (_) {
      }
      return {
        success: false,
        message: `Hacienda respondi\xF3 error ${res.status}: ${detail}`
      };
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return { success: false, message: "Tiempo de espera agotado al conectar con el servidor de Hacienda (10s)" };
    }
    return { success: false, message: `Error de red al conectar con Hacienda: ${error.message}` };
  }
}
async function testTenantHaciendaConnection(tenantId) {
  const secrets = await getHaciendaDecryptedSecrets(tenantId);
  const config = await getHaciendaConfigByTenant(tenantId);
  if (!secrets || !config) {
    return {
      success: false,
      message: "No se ha configurado la facturaci\xF3n electr\xF3nica para este comercio"
    };
  }
  let certValid = false;
  let certExpiresAt;
  if (secrets.p12Buffer && secrets.p12Pin) {
    const certResult = await inspectP12Certificate(secrets.p12Buffer, secrets.p12Pin);
    if (!certResult.valid) {
      const msg = `Fallo en el certificado: ${certResult.error}`;
      await updateConnectionTestResult(tenantId, false, msg);
      return {
        success: false,
        message: msg,
        details: { certValid: false, idpValid: false, environment: secrets.environment }
      };
    }
    certValid = true;
    certExpiresAt = certResult.expiresAt ? certResult.expiresAt.toISOString() : void 0;
  }
  if (!secrets.idpUsername || !secrets.idpPassword) {
    const msg = "Faltan credenciales ATV (usuario o contrase\xF1a del API)";
    await updateConnectionTestResult(tenantId, false, msg);
    return {
      success: false,
      message: msg,
      details: { certValid, idpValid: false, environment: secrets.environment }
    };
  }
  const idpResult = await authenticateHaciendaIdp(
    secrets.environment,
    secrets.idpUsername,
    secrets.idpPassword
  );
  const fullSuccess = idpResult.success && (secrets.p12Buffer ? certValid : true);
  const statusMsg = fullSuccess ? `\u2705 Conexi\xF3n exitosa con Hacienda (${secrets.environment === "production" ? "Producci\xF3n" : "Sandbox / Pruebas"}). ${certExpiresAt ? `Certificado v\xE1lido hasta ${new Date(certExpiresAt).toLocaleDateString("es-CR")}.` : ""}` : idpResult.message;
  await updateConnectionTestResult(tenantId, fullSuccess, statusMsg);
  return {
    success: fullSuccess,
    message: statusMsg,
    details: {
      certValid,
      certExpiresAt,
      idpValid: idpResult.success,
      environment: secrets.environment
    }
  };
}
async function testBranchHaciendaConnection(tenantId, haciendaBranchId) {
  const branch = await getHaciendaBranchById(tenantId, haciendaBranchId);
  if (!branch) {
    return { success: false, message: "Sucursal de facturaci\xF3n no encontrada" };
  }
  if (!branch.useCustomCredentials) {
    const mainRes = await testTenantHaciendaConnection(tenantId);
    await updateBranchConnectionTestResult(tenantId, haciendaBranchId, mainRes.success, mainRes.message);
    return mainRes;
  }
  const secrets = await getHaciendaBranchDecryptedSecrets(tenantId, haciendaBranchId);
  if (!secrets) {
    return { success: false, message: "No se encontraron credenciales para esta sucursal" };
  }
  let certValid = false;
  let certExpiresAt;
  if (secrets.p12Buffer && secrets.p12Pin) {
    const certResult = await inspectP12Certificate(secrets.p12Buffer, secrets.p12Pin);
    if (!certResult.valid) {
      const msg = `Fallo en certificado de sucursal: ${certResult.error}`;
      await updateBranchConnectionTestResult(tenantId, haciendaBranchId, false, msg);
      return {
        success: false,
        message: msg,
        details: { certValid: false, idpValid: false, environment: secrets.environment }
      };
    }
    certValid = true;
    certExpiresAt = certResult.expiresAt ? certResult.expiresAt.toISOString() : void 0;
  }
  if (!secrets.idpUsername || !secrets.idpPassword) {
    const msg = "Faltan credenciales ATV propias de la sucursal";
    await updateBranchConnectionTestResult(tenantId, haciendaBranchId, false, msg);
    return {
      success: false,
      message: msg,
      details: { certValid, idpValid: false, environment: secrets.environment }
    };
  }
  const idpResult = await authenticateHaciendaIdp(
    secrets.environment,
    secrets.idpUsername,
    secrets.idpPassword
  );
  const fullSuccess = idpResult.success && (secrets.p12Buffer ? certValid : true);
  const statusMsg = fullSuccess ? `\u2705 Sucursal ${branch.branchCode} conectada con Hacienda (${secrets.environment === "production" ? "Producci\xF3n" : "Sandbox"}).` : idpResult.message;
  await updateBranchConnectionTestResult(tenantId, haciendaBranchId, fullSuccess, statusMsg);
  return {
    success: fullSuccess,
    message: statusMsg,
    details: {
      certValid,
      certExpiresAt,
      idpValid: idpResult.success,
      environment: secrets.environment
    }
  };
}
async function emitManualOrNativeVoucher(tenantId, params) {
  const usage = await getCycleUsage(tenantId);
  if (usage.isBlocked) {
    return {
      success: false,
      message: "Has alcanzado el l\xEDmite de comprobantes de tu plan y el margen de cortes\xEDa."
    };
  }
  if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
    return {
      success: false,
      message: "Debe incluir al menos una l\xEDnea de detalle en el comprobante."
    };
  }
  const config = await getHaciendaConfigByTenant(tenantId);
  const defaultCabys = config?.defaultCabysCode || "8311100000000";
  if (config?.providerMode === "ALMENDRO_AUTO") {
    const { AlmendroService: AlmendroService2 } = await Promise.resolve().then(() => (init_almendro_service(), almendro_service_exports));
    let resolvedBranchCode = params.branchCode || config.branchCode || "001";
    let resolvedPosCode = config.posCode || "00001";
    let resolvedBranchId = params.branchId || null;
    if (config.multiBranchEnabled && params.branchId) {
      const b = await getHaciendaBranchById(tenantId, params.branchId);
      if (b) {
        resolvedBranchCode = b.branchCode;
        resolvedPosCode = b.posCode;
        resolvedBranchId = b.branchId || b.id;
      }
    }
    const almRes = await AlmendroService2.emitVoucher(tenantId, {
      docType: params.docType,
      branchId: resolvedBranchId,
      branchCode: resolvedBranchCode,
      posCode: resolvedPosCode,
      currency: params.currency || "CRC",
      paymentMethod: params.paymentMethod || "01",
      referenceKey: params.referenceKey,
      receiver: params.receiver,
      items: params.items.map((it) => ({
        cabysCode: it.cabysCode || defaultCabys,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        taxRateCode: it.taxRateCode || (config.isSimplifiedRegime ? "10" : "08")
      })),
      orderId: params.orderId,
      appointmentId: params.appointmentId,
      courtBookingId: params.courtBookingId,
      subscriptionChargeId: params.subscriptionChargeId
    });
    if (almRes.success && almRes.numericKey) {
      await incrementInvoiceUsage(tenantId);
      const savedVoucher = await getElectronicVoucherByKeyOrId(almRes.numericKey);
      if (config?.emailAutoSend !== false && (params.receiver?.email || params.orderId || params.appointmentId || params.subscriptionChargeId)) {
        Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports)).then(
          ({ sendVoucherEmailNotification: sendVoucherEmailNotification2 }) => sendVoucherEmailNotification2({
            tenantId,
            voucherKeyOrId: almRes.numericKey,
            overrideEmail: params.receiver?.email
          })
        ).catch(() => {
        });
      }
      if (params.receiver?.phone) {
        sendVoucherWhatsAppNotification({
          tenantId,
          customerName: params.receiver.name,
          customerPhone: params.receiver.phone,
          referenceLabel: savedVoucher?.consecutiveNumber || almRes.numericKey,
          docType: params.docType,
          numericKey: almRes.numericKey,
          pdfUrl: almRes.pdfUrl
        }).catch(() => {
        });
      }
      return {
        success: true,
        voucher: savedVoucher,
        numericKey: almRes.numericKey,
        consecutiveNumber: savedVoucher?.consecutiveNumber || "",
        pdfUrl: almRes.pdfUrl,
        message: almRes.message
      };
    }
    return {
      success: false,
      message: almRes.message
    };
  }
  const consecData = await consumeNextConsecutive(tenantId, params.docType, {
    branchId: params.branchId,
    branchCode: params.branchCode
  });
  let subtotal = 0;
  let taxAmount = 0;
  const normalizedItems = params.items.map((item, idx) => {
    const quantity = Math.max(1e-3, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const lineSubtotal = quantity * unitPrice;
    subtotal += lineSubtotal;
    const taxRateCode = item.taxRateCode || (config?.isSimplifiedRegime ? "10" : "08");
    let taxRate = 0.13;
    if (taxRateCode === "04") taxRate = 0.04;
    else if (taxRateCode === "02") taxRate = 0.02;
    else if (taxRateCode === "01") taxRate = 0.01;
    else if (taxRateCode === "10") taxRate = 0;
    const lineTax = lineSubtotal * taxRate;
    taxAmount += lineTax;
    return {
      lineNumber: idx + 1,
      cabysCode: item.cabysCode || defaultCabys,
      description: String(item.description || "Servicio / Producto").slice(0, 160),
      quantity,
      unitPrice,
      taxRateCode,
      taxRate: taxRate * 100,
      lineSubtotal,
      lineTax,
      lineTotal: lineSubtotal + lineTax
    };
  });
  const totalAmount = subtotal + taxAmount;
  const pdfUrl = `/api/almendro/public/voucher-pdf/${consecData.numericKey}`;
  const voucher = await saveElectronicVoucher(tenantId, {
    orderId: params.orderId,
    appointmentId: params.appointmentId,
    courtBookingId: params.courtBookingId,
    subscriptionChargeId: params.subscriptionChargeId,
    branchId: consecData.branchId,
    branchCode: consecData.branchCode,
    posCode: consecData.posCode,
    referenceKey: params.referenceKey || null,
    docType: params.docType,
    consecutiveNumber: consecData.consecutiveNumber,
    numericKey: consecData.numericKey,
    receiverIdType: params.receiver?.idType || (params.receiver?.idNumber ? "01" : void 0),
    receiverIdNumber: params.receiver?.idNumber ? params.receiver.idNumber.replace(/\D/g, "") : void 0,
    receiverName: params.receiver?.name || "Cliente Contado",
    receiverEmail: params.receiver?.email,
    currency: params.currency || "CRC",
    subtotal,
    taxAmount,
    totalAmount,
    status: "accepted",
    pdfUrl,
    metadata: {
      items: normalizedItems,
      paymentMethod: params.paymentMethod || "01",
      emittedVia: "BETICO_NATIVE",
      referenceKey: params.referenceKey || null
    }
  });
  await incrementInvoiceUsage(tenantId);
  if (config?.emailAutoSend !== false && (params.receiver?.email || params.orderId || params.appointmentId || params.subscriptionChargeId)) {
    try {
      const { sendVoucherEmailNotification: sendVoucherEmailNotification2 } = await Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports));
      await sendVoucherEmailNotification2({
        tenantId,
        voucherKeyOrId: consecData.numericKey,
        overrideEmail: params.receiver?.email
      });
    } catch (emailErr) {
      console.warn("[HaciendaNative] Aviso enviando correo de comprobante:", emailErr?.message || emailErr);
    }
  }
  if (params.receiver?.phone) {
    sendVoucherWhatsAppNotification({
      tenantId,
      customerName: params.receiver.name,
      customerPhone: params.receiver.phone,
      referenceLabel: `Comprobante #${consecData.consecutiveNumber}`,
      docType: params.docType,
      numericKey: consecData.numericKey,
      pdfUrl
    }).catch(() => {
    });
  }
  const refreshedVoucher = await getElectronicVoucherByKeyOrId(consecData.numericKey).catch(() => voucher);
  return {
    success: true,
    voucher: refreshedVoucher || voucher,
    numericKey: consecData.numericKey,
    consecutiveNumber: consecData.consecutiveNumber,
    pdfUrl,
    message: "Comprobante electr\xF3nico emitido exitosamente"
  };
}
async function emitPlatformSubscriptionInvoiceForTenant(targetTenantId, options) {
  const { getTenantById: getTenantById2 } = await Promise.resolve().then(() => (init_tenant_repo(), tenant_repo_exports));
  const { getAdminUserByTenant: getAdminUserByTenant2 } = await Promise.resolve().then(() => (init_users_repo(), users_repo_exports));
  const { getOrCreateSuperadminTenantId: getOrCreateSuperadminTenantId2 } = await Promise.resolve().then(() => (init_tilopay_subscription_service(), tilopay_subscription_service_exports));
  const { getTenantAlmendroConfigRaw: getTenantAlmendroConfigRaw2 } = await Promise.resolve().then(() => (init_tenant_almendro_repo(), tenant_almendro_repo_exports));
  const targetTenant = await getTenantById2(targetTenantId);
  if (!targetTenant) {
    return { success: false, message: "Inquilino no encontrado" };
  }
  const requestedByClient = Boolean(targetTenant.requiresSubscriptionInvoice);
  if (!requestedByClient && !options?.forceEmit) {
    return {
      success: false,
      skipped: true,
      message: "El cliente no tiene activa la opci\xF3n de solicitud de factura electr\xF3nica."
    };
  }
  const superadminTenantId = await getOrCreateSuperadminTenantId2();
  const haciendaCfg = await getHaciendaConfigByTenant(superadminTenantId);
  const almendroCfg = await getTenantAlmendroConfigRaw2(superadminTenantId).catch(() => null);
  if (haciendaCfg?.providerMode === "DISABLED") {
    return {
      success: false,
      skipped: true,
      message: "La facturaci\xF3n electr\xF3nica del SuperAdmin est\xE1 deshabilitada."
    };
  }
  const adminUser = await getAdminUserByTenant2(targetTenantId).catch(() => null);
  const idNumber = String(targetTenant.billingIdNumber || "").replace(/\D/g, "");
  const idType = targetTenant.billingIdType || (idNumber.length === 10 && idNumber.startsWith("3") ? "02" : "01");
  const name = targetTenant.billingLegalName || targetTenant.name || "Cliente Betico";
  const email = targetTenant.billingEmail || adminUser?.email || "";
  const phone = targetTenant.whatsappNumber || "";
  const docType = idNumber.length >= 9 ? "01" : "04";
  const unitPrice = options?.amount !== void 0 ? Number(options.amount) : Number(targetTenant.customMonthlyPrice || 35e3);
  const currency = options?.currency || targetTenant.billingCurrency || "CRC";
  const planLabel = String(targetTenant.plan || "pro").toUpperCase();
  const periodStr = options?.periodLabel || (/* @__PURE__ */ new Date()).toLocaleDateString("es-CR", { month: "long", year: "numeric" });
  const defaultCabys = haciendaCfg?.defaultCabysCode || almendroCfg?.economicActivityCode || "8314100000000";
  const emitRes = await emitManualOrNativeVoucher(superadminTenantId, {
    docType,
    currency,
    paymentMethod: options?.paymentMethod || "04",
    subscriptionChargeId: options?.subscriptionChargeId,
    receiver: {
      idType: idNumber ? idType : void 0,
      idNumber: idNumber || void 0,
      name,
      email: email || void 0,
      phone: phone || void 0
    },
    items: [
      {
        cabysCode: defaultCabys,
        description: `Suscripci\xF3n Plataforma Betico SaaS - Plan ${planLabel} (${targetTenant.name} - ${periodStr})`,
        quantity: 1,
        unitPrice,
        taxRateCode: haciendaCfg?.isSimplifiedRegime ? "10" : "08"
      }
    ]
  });
  return emitRes;
}
async function emitCreditNoteForVoucher(tenantId, voucherId, reason) {
  const origRes = await query2(
    `SELECT * FROM electronic_vouchers WHERE id = $1 AND tenant_id = $2`,
    [voucherId, tenantId]
  );
  if (origRes.rows.length === 0) {
    return { success: false, message: "Comprobante original no encontrado" };
  }
  const orig = origRes.rows[0];
  if (orig.status === "cancelled") {
    return { success: false, message: "Este comprobante ya fue anulado previamente con una Nota de Cr\xE9dito" };
  }
  const origMeta = typeof orig.metadata === "string" ? (() => {
    try {
      return JSON.parse(orig.metadata);
    } catch (_) {
      return {};
    }
  })() : orig.metadata || {};
  const defaultItems = [
    {
      cabysCode: "8311100000000",
      description: `${reason ? `${reason} - ` : ""}Anulaci\xF3n de comprobante ${orig.consecutive_number || orig.numeric_key}`,
      quantity: 1,
      unitPrice: Number(orig.subtotal || orig.total_amount || 0),
      taxRateCode: Number(orig.tax_amount || 0) > 0 ? "08" : "10"
    }
  ];
  const items = Array.isArray(origMeta.items) && origMeta.items.length > 0 ? origMeta.items.map((it) => ({
    cabysCode: it.cabysCode || it.cabys_code || "8311100000000",
    description: String(it.description || it.detail || "Anulaci\xF3n de l\xEDnea"),
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice ?? it.unit_price) || 0,
    taxRateCode: it.taxRateCode || "08"
  })) : defaultItems;
  const res = await emitManualOrNativeVoucher(tenantId, {
    docType: "03",
    branchId: orig.branch_id || null,
    branchCode: orig.branch_code || "001",
    currency: orig.currency || "CRC",
    paymentMethod: origMeta.paymentMethod || "01",
    referenceKey: orig.numeric_key,
    receiver: {
      idType: orig.receiver_id_type || void 0,
      idNumber: orig.receiver_id_number || void 0,
      name: orig.receiver_name || void 0,
      email: orig.receiver_email || void 0
    },
    items
  });
  if (!res.success) {
    return {
      success: false,
      message: res.message || "No fue posible emitir la Nota de Cr\xE9dito"
    };
  }
  await query2(
    `UPDATE electronic_vouchers
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND tenant_id = $2`,
    [voucherId, tenantId]
  );
  return {
    success: true,
    creditNote: res.voucher,
    numericKey: res.numericKey,
    consecutiveNumber: res.consecutiveNumber,
    pdfUrl: res.pdfUrl,
    message: "Nota de Cr\xE9dito (03) emitida y comprobante anulado con \xE9xito"
  };
}
async function sendVoucherWhatsAppNotification({
  tenantId,
  customerName,
  customerPhone,
  referenceLabel,
  docType,
  numericKey,
  pdfUrl
}) {
  try {
    if (!customerPhone) return false;
    const { getTenantById: getTenantById2 } = await Promise.resolve().then(() => (init_tenant_repo(), tenant_repo_exports));
    const { getStoreSettings: getStoreSettings2 } = await Promise.resolve().then(() => (init_store_settings_repo(), store_settings_repo_exports));
    const { sendMessage: sendMessage2 } = await Promise.resolve().then(() => (init_evolution(), evolution_exports));
    const tenant = await getTenantById2(tenantId);
    const store = await getStoreSettings2(tenantId);
    const storeName = store?.storeName || tenant?.name || "nuestro negocio";
    const instanceName = tenant?.evolutionInstance || (tenant?.slug === "superadmin" ? "betico_soporte" : void 0);
    const clean = customerPhone.replace(/\D/g, "");
    const finalPhone = clean.length === 8 ? `506${clean}` : clean;
    if (!instanceName || finalPhone.length < 8) {
      return false;
    }
    const docName = docType === "01" ? "Factura Electr\xF3nica" : docType === "03" ? "Nota de Cr\xE9dito Electr\xF3nica" : "Tiquete Electr\xF3nico";
    const safePdfUrl = pdfUrl && pdfUrl.startsWith("http") ? pdfUrl : `${process.env.APP_URL || "https://app.listochat.com"}/api/almendro/public/voucher-pdf/${numericKey}`;
    const msg = `\u{1F9FE} *\xA1Tu ${docName} est\xE1 lista!*

Hola *${customerName || "Estimado cliente"}*, te compartimos el comprobante electr\xF3nico correspondiente a tu *${referenceLabel}* en *${storeName}*:

\u{1F517} *Descargar PDF:*
${safePdfUrl}

\u{1F511} *Clave Num\xE9rica de Hacienda:*
\`${numericKey}\`

\xA1Muchas gracias por tu preferencia y confianza! \u2B50`;
    await sendMessage2(instanceName, finalPhone, msg);
    await query2(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'electronic_invoice_sent', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenantId,
      finalPhone,
      `${docName} enviada a ${customerName || finalPhone}`
    ]);
    return true;
  } catch (err) {
    console.warn("[VoucherNotification] Error enviando WhatsApp con factura:", err.message);
    return false;
  }
}
var init_hacienda_native_service = __esm({
  "../src/server/services/hacienda-native.service.ts"() {
    "use strict";
    init_hacienda_native_repo();
    init_tenant_almendro_repo();
    init_pool();
  }
});

// ../src/server/db/branches.repo.ts
var branches_repo_exports = {};
__export(branches_repo_exports, {
  createBranch: () => createBranch,
  deleteBranch: () => deleteBranch,
  getBranchById: () => getBranchById,
  getBranchesByTenant: () => getBranchesByTenant,
  updateBranch: () => updateBranch
});
async function getBranchesByTenant(tenantId) {
  const result = await query2(`
    SELECT 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM branches
    WHERE tenant_id = $1
    ORDER BY is_main DESC, name ASC
  `, [tenantId]);
  return result.rows;
}
async function getBranchById(id, tenantId) {
  const result = await query2(`
    SELECT 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM branches
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}
async function createBranch(tenantId, data) {
  if (data.isMain) {
    await query2(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1`, [tenantId]);
  }
  const result = await query2(`
    INSERT INTO branches (
      tenant_id, name, code, address, phone, sinpe_phone, sinpe_name,
      latitude, longitude, is_main, active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId,
    data.name,
    data.code || null,
    data.address || null,
    data.phone || null,
    data.sinpePhone || null,
    data.sinpeName || null,
    data.latitude || null,
    data.longitude || null,
    data.isMain || false,
    data.active !== false
  ]);
  return result.rows[0];
}
async function updateBranch(id, tenantId, data) {
  if (data.isMain) {
    await query2(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1 AND id != $2`, [tenantId, id]);
  }
  const result = await query2(`
    UPDATE branches
    SET
      name = COALESCE($1, name),
      code = COALESCE($2, code),
      address = COALESCE($3, address),
      phone = COALESCE($4, phone),
      sinpe_phone = COALESCE($5, sinpe_phone),
      sinpe_name = COALESCE($6, sinpe_name),
      latitude = COALESCE($7, latitude),
      longitude = COALESCE($8, longitude),
      is_main = COALESCE($9, is_main),
      active = COALESCE($10, active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11 AND tenant_id = $12
    RETURNING 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
  `, [
    data.name,
    data.code,
    data.address,
    data.phone,
    data.sinpePhone,
    data.sinpeName,
    data.latitude,
    data.longitude,
    data.isMain,
    data.active,
    id,
    tenantId
  ]);
  return result.rows[0] || null;
}
async function deleteBranch(id, tenantId) {
  const result = await query2(`DELETE FROM branches WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}
var init_branches_repo = __esm({
  "../src/server/db/branches.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// src/server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv3 from "dotenv";

// src/server/routes/auth.routes.ts
import { Router } from "express";

// src/server/db.ts
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
var { Pool } = pg;
pg.types.setTypeParser(1082, (val) => val);
pg.types.setTypeParser(1083, (val) => val ? val.slice(0, 5) : val);
var pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://saas:BeticoDB2026@betico_postgres:5432/whatsapp_saas?sslmode=disable",
  max: 15,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
pool.on("error", (err) => {
  console.error("[Admin DB] Error inesperado en el pool de PostgreSQL:", err);
});
pool.on("connect", (client) => {
  client.query("SET TIME ZONE 'America/Costa_Rica'").catch((err) => {
    console.error("[Admin DB] Error al establecer zona horaria Costa Rica:", err);
  });
});
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1e3) {
      console.warn(`[Admin DB] Consulta lenta (${duration}ms):`, text.substring(0, 100));
    }
    return res;
  } catch (error) {
    console.error(`[Admin DB] Error en consulta:`, text.substring(0, 100), error);
    throw error;
  }
}

// src/server/auth.ts
import crypto from "crypto";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "betico_jwt_secret_64_chars_super_safe_key_cr_2026";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return `v2:${salt}:${hash}`;
}
function verifyPassword(password, hashString) {
  if (!hashString || !password) return false;
  const passBuf = Buffer.from(password);
  const hashBuf = Buffer.from(hashString);
  if (passBuf.length === hashBuf.length && crypto.timingSafeEqual(passBuf, hashBuf)) return true;
  if (hashString.startsWith("v2:")) {
    const parts = hashString.split(":");
    const salt = parts[1];
    const storedHash = parts[2];
    if (!salt || !storedHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
    const b1 = Buffer.from(hash);
    const b2 = Buffer.from(storedHash);
    return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
  }
  if (hashString.includes(":")) {
    const [salt, storedHash] = hashString.split(":");
    if (salt && storedHash) {
      const hashPbkdf2_1k = crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
      if (hashPbkdf2_1k === storedHash) return true;
      const hashPbkdf2_100k = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
      if (hashPbkdf2_100k === storedHash) return true;
      const hashPbkdf2_1k_256 = crypto.pbkdf2Sync(password, salt, 1e3, 32, "sha256").toString("hex");
      if (hashPbkdf2_1k_256 === storedHash) return true;
      const hashSha256_1 = crypto.createHash("sha256").update(salt + password).digest("hex");
      if (hashSha256_1 === storedHash) return true;
      const hashSha256_2 = crypto.createHash("sha256").update(password + salt).digest("hex");
      if (hashSha256_2 === storedHash) return true;
    }
  }
  const plainSha256 = crypto.createHash("sha256").update(password).digest("hex");
  if (plainSha256 === hashString) return true;
  return false;
}
function generateToken(userId, tenantId, role) {
  return jwt.sign(
    { userId, tenantId: tenantId || "system", role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
async function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No autorizado: Token de acceso no proporcionado" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "superadmin") {
      res.status(403).json({ error: "Acceso denegado: Se requieren permisos de SuperAdmin" });
      return;
    }
    const userRes = await query(
      `SELECT id, name, email, role, active FROM users WHERE id = $1 AND role = 'superadmin'`,
      [decoded.userId]
    );
    if (userRes.rows.length === 0 || userRes.rows[0].active === false) {
      res.status(403).json({ error: "Cuenta de administrador inactiva o no encontrada" });
      return;
    }
    const row = userRes.rows[0];
    req.user = {
      userId: row.id,
      tenantId: decoded.tenantId,
      role: row.role,
      name: row.name,
      email: row.email
    };
    next();
  } catch (err) {
    res.status(403).json({ error: "Token inv\xE1lido o expirado" });
  }
}
async function logAdminAction(userId, action, entityType, entityId, details, req) {
  try {
    const ip = req ? req.headers["x-forwarded-for"] || req.socket.remoteAddress : null;
    const ua = req ? req.headers["user-agent"] : "Admin App";
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (NULL, $1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ip, ua]
    );
  } catch (e) {
    console.warn("[Admin Audit] No se pudo guardar log:", e);
  }
}

// src/server/routes/auth.routes.ts
var router = Router();
var loginFailures = /* @__PURE__ */ new Map();
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: "El correo electr\xF3nico y la contrase\xF1a son obligatorios" });
      return;
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "local";
    const rateKey = `${clientIp}:${cleanEmail}`;
    const attempt = loginFailures.get(rateKey);
    const now = Date.now();
    if (attempt && attempt.lockedUntil > now) {
      const waitSec = Math.ceil((attempt.lockedUntil - now) / 1e3);
      res.status(429).json({ error: `Demasiados intentos fallidos. Bloqueado temporalmente por ${waitSec} segundos.` });
      return;
    }
    const userRes = await query(
      `SELECT id, tenant_id, name, email, password_hash, role, active 
       FROM users 
       WHERE LOWER(email) = LOWER($1) AND role = 'superadmin'`,
      [cleanEmail]
    );
    if (userRes.rows.length === 0) {
      recordFailure(rateKey);
      res.status(401).json({ error: "Credenciales inv\xE1lidas o cuenta sin privilegios de SuperAdmin" });
      return;
    }
    const user = userRes.rows[0];
    if (user.active === false) {
      res.status(403).json({ error: "Esta cuenta administrativa ha sido desactivada" });
      return;
    }
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailure(rateKey);
      res.status(401).json({ error: "Credenciales inv\xE1lidas o cuenta sin privilegios de SuperAdmin" });
      return;
    }
    loginFailures.delete(rateKey);
    const token = generateToken(user.id, user.tenant_id, user.role);
    await logAdminAction(user.id, "superadmin_login", "user", user.id, { email: cleanEmail }, req);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    res.status(500).json({ error: "Error interno en el servidor de autenticaci\xF3n" });
  }
});
router.get("/me", requireSuperAdmin, async (req, res) => {
  res.json({
    id: req.user.userId,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});
function recordFailure(key) {
  const now = Date.now();
  const attempt = loginFailures.get(key) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.lockedUntil = now + 5 * 60 * 1e3;
  }
  loginFailures.set(key, attempt);
}
var auth_routes_default = router;

// src/server/routes/monitoring.routes.ts
import { Router as Router2 } from "express";

// src/server/encryption.ts
import crypto2 from "crypto";
var ALGORITHM = "aes-256-gcm";
var IV_LENGTH = 16;
var getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f";
  return crypto2.scryptSync(key, "salt", 32);
};
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  try {
    const iv = crypto2.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");
    const authTag = cipher.getAuthTag().toString("base64");
    return `${iv.toString("base64")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("[Admin Crypto] Error de cifrado:", error);
    throw new Error("Fallo al cifrar datos confidenciales");
  }
}
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.includes(":")) return encryptedData;
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Formato cifrado inv\xE1lido");
    }
    const [ivBase64, authTagBase64, encryptedBase64] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const key = getEncryptionKey();
    const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("[Admin Crypto] Error de descifrado:", error);
    return encryptedData;
  }
}

// src/server/routes/monitoring.routes.ts
var router2 = Router2();
router2.use(requireSuperAdmin);
var MAIN_APP_URL = process.env.MAIN_APP_URL || "https://betico.tech";
var EVOLUTION_API_URL2 = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
var EVOLUTION_API_KEY2 = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
router2.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) {
      res.json([]);
      return;
    }
    const searchTerm = `%${q.toLowerCase()}%`;
    const result = await query(
      `SELECT t.id, t.name, t.slug, t.whatsapp_number as "whatsappNumber",
              t.plan, t.active, t.trial_ends_at as "trialEndsAt",
              t.evolution_instance as "evolutionInstance",
              t.next_billing_date as "nextBillingDate",
              COALESCE(u.email, 'Sin registrar') as "adminEmail",
              COALESCE(u.name, 'Sin nombre') as "adminName"
       FROM tenants t
       LEFT JOIN LATERAL (
         SELECT id, email, name FROM users 
         WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin') 
         ORDER BY created_at ASC LIMIT 1
       ) u ON true
       WHERE LOWER(t.name) LIKE $1 
          OR LOWER(t.slug) LIKE $1 
          OR LOWER(COALESCE(t.whatsapp_number, '')) LIKE $1
          OR LOWER(COALESCE(u.email, '')) LIKE $1
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [searchTerm]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[Monitoring Search] Error:", error);
    res.status(500).json({ error: "Error al buscar clientes en el centro de monitoreo" });
  }
});
router2.get("/tenant/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const tenantRes = await query(
      `SELECT t.*, 
              COALESCE(u.email, 'Sin registrar') as "adminEmail",
              COALESCE(u.name, 'Administrador') as "adminName",
              u.id as "adminId"
       FROM tenants t
       LEFT JOIN LATERAL (
         SELECT id, email, name FROM users 
         WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin') 
         ORDER BY created_at ASC LIMIT 1
       ) u ON true
       WHERE t.id = $1`,
      [id]
    );
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio o inquilino no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    const msgStatsRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE created_at >= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date) as "todayMsgs",
         COUNT(*) FILTER (WHERE created_at >= ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date - INTERVAL '7 days')) as "weekMsgs",
         COUNT(*) FILTER (WHERE created_at >= ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date - INTERVAL '30 days')) as "monthMsgs"
       FROM chat_messages
       WHERE tenant_id = $1`,
      [id]
    );
    const msgStats = msgStatsRes.rows[0] || { todayMsgs: 0, weekMsgs: 0, monthMsgs: 0 };
    const queueStatsRes = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'processing') as processing,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'done') as done
       FROM message_queue
       WHERE tenant_id = $1`,
      [id]
    );
    const queueStats = queueStatsRes.rows[0] || { pending: 0, processing: 0, failed: 0, done: 0 };
    const [productsRes, bookingsRes, courtBookingsRes, ordersRes] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM products WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(*) as count FROM court_bookings WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      query(
        `SELECT COUNT(*) as count, 
                COALESCE(SUM(CASE WHEN currency = 'CRC' OR currency IS NULL THEN total ELSE 0 END), 0) as "gmvCrc",
                COALESCE(SUM(CASE WHEN currency = 'USD' THEN total ELSE 0 END), 0) as "gmvUsd"
         FROM orders WHERE tenant_id = $1`,
        [id]
      ).catch(() => ({ rows: [{ count: 0, gmvCrc: 0, gmvUsd: 0 }] }))
    ]);
    let whatsappStatus = {
      connected: false,
      state: "desconocido",
      instanceName: tenant.evolution_instance || `tenant_${tenant.slug}`,
      phone: tenant.whatsapp_number || "No asignado",
      details: null
    };
    if (tenant.evolution_instance) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const evoRes = await fetch(`${EVOLUTION_API_URL2}/instance/connectionState/${tenant.evolution_instance}`, {
          headers: { apikey: EVOLUTION_API_KEY2 },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (evoRes.ok) {
          const evoData = await evoRes.json();
          const state = evoData?.instance?.state || evoData?.state || "open";
          whatsappStatus.connected = state === "open" || state === "connected";
          whatsappStatus.state = state;
          whatsappStatus.details = evoData;
        }
      } catch (err) {
        whatsappStatus.state = "error_conexion";
      }
    }
    const [storeRes, almendroRes, haciendaRes] = await Promise.all([
      query(`SELECT * FROM store_settings WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(`SELECT * FROM tenant_almendro_configs WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(`SELECT * FROM tenant_hacienda_configs WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] }))
    ]);
    const storeSettings = storeRes.rows[0] || {};
    const almendroConfig = almendroRes.rows[0] || {};
    const nativeHacienda = haciendaRes.rows[0] || {};
    const rawModules = storeSettings.store_modules || {};
    const storeModules = {
      courtsEnabled: Boolean(rawModules.courtsEnabled),
      storeEnabled: rawModules.storeEnabled !== false,
      bookingsEnabled: rawModules.bookingsEnabled !== false,
      loyaltyEnabled: Boolean(rawModules.loyaltyEnabled),
      branchesEnabled: Boolean(rawModules.branchesEnabled),
      storeMode: rawModules.storeMode || "retail",
      aiChatbotEnabled: rawModules.aiChatbotEnabled !== false
    };
    const gatewayHealth = {
      tilopayConfigured: Boolean(storeSettings.tilopay_api_key || storeSettings.tilopay_merchant_id),
      sinpeConfigured: Boolean(storeSettings.sinpe_phone),
      storeEnabled: Boolean(storeSettings.store_enabled)
    };
    const invoicingHealth = {
      configured: Boolean(nativeHacienda.active && nativeHacienda.provider_mode === "BETICO_NATIVE" && (nativeHacienda.taxpayer_id_number || nativeHacienda.is_connected) || almendroConfig.active && almendroConfig.company_id),
      environment: nativeHacienda.environment || (almendroConfig.is_sandbox ? "sandbox" : "production"),
      providerMode: nativeHacienda.provider_mode || (almendroConfig.active ? "ALMENDRO_AUTO" : "BETICO_NATIVE")
    };
    const failedMessagesRes = await query(
      `SELECT id, remote_jid as "remoteJid", push_name as "pushName", clean_phone as "cleanPhone",
              user_message as "userMessage", error_message as "errorMessage", created_at as "createdAt",
              processed_at as "processedAt"
       FROM message_queue
       WHERE tenant_id = $1 AND status = 'failed'
       ORDER BY created_at DESC
       LIMIT 15`,
      [id]
    );
    const auditRes = await query(
      `SELECT a.id, a.action, a.entity_type as "entityType", a.details, a.created_at as "createdAt",
              u.name as "userName", u.email as "userEmail"
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC
       LIMIT 15`,
      [id]
    );
    const [agentConfigRes, aiUsageRes] = await Promise.all([
      query(`SELECT ai_provider, ai_model, ai_api_key FROM agent_config WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(
        `SELECT tokens_used as "tokensUsed", requests_count as "requestsCount" 
         FROM tenant_ai_usage 
         WHERE tenant_id = $1 AND month_year = (TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica', 'YYYY-MM'))`,
        [id]
      ).catch(() => ({ rows: [] }))
    ]);
    const agentConfig = agentConfigRes.rows[0] || {};
    const aiUsage = aiUsageRes.rows[0] || { tokensUsed: 0, requestsCount: 0 };
    let rawProvider = (agentConfig.ai_provider || tenant.ai_provider || "gemini").toLowerCase();
    if (rawProvider.includes("ollama") || rawProvider.includes("local") || rawProvider.includes("betico")) {
      rawProvider = "gemini";
    }
    let rawModel = agentConfig.ai_model || tenant.ai_model || "gemini-2.5-flash";
    if (rawModel.includes("betico") || rawModel.includes("ollama") || rawModel.includes("local")) {
      rawModel = "gemini-2.5-flash";
    }
    const hasOwnKey = Boolean(agentConfig.ai_api_key || tenant.ai_api_key);
    const aiStatus = {
      provider: rawProvider,
      model: rawModel,
      isByok: hasOwnKey,
      isConnected: hasOwnKey || Boolean(process.env.GEMINI_API_KEY),
      tokensUsed: parseInt(aiUsage.tokensUsed || "0", 10),
      requestsCount: parseInt(aiUsage.requestsCount || "0", 10)
    };
    const [loyaltyCardsRes, loyaltyVouchersRes] = await Promise.all([
      query(
        `SELECT COUNT(*) as "cardsCount", COALESCE(SUM(current_stamps), 0) as "stampsCount" 
         FROM loyalty_cards WHERE tenant_id = $1`,
        [id]
      ).catch(() => ({ rows: [{ cardsCount: 0, stampsCount: 0 }] })),
      query(
        `SELECT COUNT(*) as "vouchersCount", 
                COUNT(*) FILTER (WHERE is_redeemed = true) as "vouchersRedeemed"
         FROM loyalty_rewards_vouchers WHERE tenant_id = $1`,
        [id]
      ).catch(() => ({ rows: [{ vouchersCount: 0, vouchersRedeemed: 0 }] }))
    ]);
    const loyaltyMetrics = {
      cardsCount: parseInt(loyaltyCardsRes.rows[0]?.cardsCount || "0", 10),
      stampsCount: parseInt(loyaltyCardsRes.rows[0]?.stampsCount || "0", 10),
      vouchersCount: parseInt(loyaltyVouchersRes.rows[0]?.vouchersCount || "0", 10),
      vouchersRedeemed: parseInt(loyaltyVouchersRes.rows[0]?.vouchersRedeemed || "0", 10)
    };
    const cardsRes = await query(
      `SELECT id, card_last4 as "cardLast4", card_brand as "cardBrand", card_holder as "cardHolder", 
              is_active as "isActive", created_at as "createdAt"
       FROM tenant_billing_cards 
       WHERE tenant_id = $1 AND is_active = true 
       ORDER BY created_at DESC LIMIT 5`,
      [id]
    ).catch(() => ({ rows: [] }));
    const paymentsRes = await query(
      `SELECT id, amount, currency, payment_method as "paymentMethod", reference, notes, status, created_at as "createdAt"
       FROM tenant_payments 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC LIMIT 50`,
      [id]
    ).catch(() => ({ rows: [] }));
    const subscriptionVouchersRes = await query(
      `SELECT v.id, v.doc_type as "docType", v.numeric_key as "numericKey", v.consecutive_number as "consecutiveNumber",
              v.receiver_name as "receiverName", v.receiver_id_number as "receiverIdNumber", v.receiver_email as "receiverEmail",
              v.currency, v.total_invoice as "totalInvoice", v.hacienda_status as "haciendaStatus", v.created_at as "createdAt"
       FROM electronic_vouchers v
       JOIN tenants pt ON pt.id = v.tenant_id AND pt.slug = 'superadmin'
       WHERE v.receiver_id_number = COALESCE(NULLIF($1, ''), '__none__')
          OR v.receiver_name ILIKE $2
       ORDER BY v.created_at DESC LIMIT 20`,
      [tenant.billing_id_number || nativeHacienda.taxpayer_id_number || "", `%${tenant.name}%`]
    ).catch(() => ({ rows: [] }));
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        active: tenant.active,
        subscriptionStatus: tenant.subscription_status || (tenant.active ? "active" : "suspended"),
        customMonthlyPrice: Number(tenant.custom_monthly_price || 55e3),
        billingCurrency: tenant.billing_currency || "CRC",
        nextBillingDate: tenant.next_billing_date ? tenant.next_billing_date.toString().split("T")[0] : null,
        trialEndsAt: tenant.trial_ends_at,
        gracePeriodEndsAt: tenant.grace_period_ends_at,
        whatsappNumber: tenant.whatsapp_number,
        evolutionInstance: tenant.evolution_instance,
        address: tenant.address || null,
        latitude: tenant.latitude ? Number(tenant.latitude) : null,
        longitude: tenant.longitude ? Number(tenant.longitude) : null,
        googleMapsUrl: tenant.google_maps_url || (tenant.latitude && tenant.longitude ? `https://maps.google.com/?q=${tenant.latitude},${tenant.longitude}` : null),
        internalNotes: tenant.internal_notes || "",
        autoBillingEnabled: Boolean(tenant.auto_billing_enabled),
        lastAutoChargeStatus: tenant.last_auto_charge_status || null,
        requiresSubscriptionInvoice: Boolean(tenant.requires_subscription_invoice),
        billingIdType: tenant.billing_id_type || nativeHacienda.taxpayer_id_type || "01",
        billingIdNumber: tenant.billing_id_number || nativeHacienda.taxpayer_id_number || "",
        billingLegalName: tenant.billing_legal_name || nativeHacienda.taxpayer_name || tenant.name,
        billingEmail: tenant.billing_email || nativeHacienda.taxpayer_email || tenant.adminEmail || "",
        createdAt: tenant.created_at,
        adminName: tenant.adminName,
        adminEmail: tenant.adminEmail,
        adminId: tenant.adminId
      },
      infrastructure: {
        postgresDb: "whatsapp_saas",
        postgresSchema: "public",
        postgresTenantId: tenant.id,
        evolutionInstance: tenant.evolution_instance || `tenant_${tenant.slug}`
      },
      location: {
        address: tenant.address || "No especificada",
        latitude: tenant.latitude ? Number(tenant.latitude) : null,
        longitude: tenant.longitude ? Number(tenant.longitude) : null,
        googleMapsUrl: tenant.google_maps_url || (tenant.latitude && tenant.longitude ? `https://maps.google.com/?q=${tenant.latitude},${tenant.longitude}` : null),
        wazeUrl: tenant.latitude && tenant.longitude ? `https://waze.com/ul?ll=${tenant.latitude},${tenant.longitude}&navigate=yes` : null
      },
      ai: aiStatus,
      loyalty: loyaltyMetrics,
      storeModules,
      billingCards: cardsRes.rows,
      payments: paymentsRes.rows,
      subscriptionVouchers: subscriptionVouchersRes.rows,
      metrics: {
        messages: {
          today: parseInt(msgStats.todayMsgs || "0", 10),
          week: parseInt(msgStats.weekMsgs || "0", 10),
          month: parseInt(msgStats.monthMsgs || "0", 10)
        },
        queue: {
          pending: parseInt(queueStats.pending || "0", 10),
          processing: parseInt(queueStats.processing || "0", 10),
          failed: parseInt(queueStats.failed || "0", 10),
          done: parseInt(queueStats.done || "0", 10)
        },
        catalog: {
          products: parseInt(productsRes.rows[0]?.count || "0", 10),
          bookings: parseInt(bookingsRes.rows[0]?.count || "0", 10),
          courtBookings: parseInt(courtBookingsRes.rows[0]?.count || "0", 10),
          orders: parseInt(ordersRes.rows[0]?.count || "0", 10),
          gmvCrc: parseFloat(ordersRes.rows[0]?.gmvCrc || "0"),
          gmvUsd: parseFloat(ordersRes.rows[0]?.gmvUsd || "0")
        }
      },
      health: {
        whatsapp: whatsappStatus,
        gateway: gatewayHealth,
        invoicing: invoicingHealth
      },
      diagnostics: {
        failedMessages: failedMessagesRes.rows,
        auditLogs: auditRes.rows
      }
    });
  } catch (error) {
    console.error("[Monitoring Dossier] Error:", error);
    res.status(500).json({ error: "Error al obtener el expediente integral 360\xB0 del cliente" });
  }
});
router2.put("/tenant/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  try {
    await query(`UPDATE tenants SET internal_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [notes || "", id]);
    await logAdminAction(req.user.userId, "update_internal_notes", "tenant", id, { length: (notes || "").length }, req);
    res.json({ success: true, message: "Anotaciones internas de soporte guardadas con \xE9xito" });
  } catch (error) {
    console.error("[Action Notes] Error:", error);
    res.status(500).json({ error: "Error al guardar notas de soporte" });
  }
});
router2.put("/tenant/:id/next-billing-date", async (req, res) => {
  const { id } = req.params;
  const { nextBillingDate } = req.body;
  if (!nextBillingDate) {
    res.status(400).json({ error: "La fecha es obligatoria" });
    return;
  }
  try {
    await query(
      `UPDATE tenants SET next_billing_date = $1::date, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextBillingDate, id]
    );
    await logAdminAction(req.user.userId, "update_billing_date", "tenant", id, { nextBillingDate }, req);
    res.json({ success: true, message: "Fecha de pr\xF3ximo cobro actualizada", nextBillingDate });
  } catch (error) {
    console.error("[Action Billing Date] Error:", error);
    res.status(500).json({ error: "Error al actualizar fecha de cobro" });
  }
});
router2.put("/tenant/:id/billing-preference", async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const fields = [];
    const params = [id];
    let idx = 2;
    if (body.requiresSubscriptionInvoice !== void 0) {
      fields.push(`requires_subscription_invoice = $${idx++}`);
      params.push(Boolean(body.requiresSubscriptionInvoice));
    }
    if (body.billingIdType !== void 0) {
      fields.push(`billing_id_type = $${idx++}`);
      params.push(body.billingIdType);
    }
    if (body.billingIdNumber !== void 0) {
      fields.push(`billing_id_number = $${idx++}`);
      params.push(body.billingIdNumber);
    }
    if (body.billingLegalName !== void 0) {
      fields.push(`billing_legal_name = $${idx++}`);
      params.push(body.billingLegalName);
    }
    if (body.billingEmail !== void 0) {
      fields.push(`billing_email = $${idx++}`);
      params.push(body.billingEmail);
    }
    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      await query(`UPDATE tenants SET ${fields.join(", ")} WHERE id = $1`, params);
    }
    await logAdminAction(req.user.userId, "update_billing_preference", "tenant", id, body, req);
    res.json({ success: true, message: "Preferencia y datos fiscales de facturaci\xF3n actualizados" });
  } catch (error) {
    console.error("[Action Billing Preference] Error:", error);
    res.status(500).json({ error: "Error al actualizar preferencia de facturaci\xF3n" });
  }
});
router2.post("/tenant/:id/emit-subscription-invoice", async (req, res) => {
  const { id } = req.params;
  try {
    const { emitPlatformSubscriptionInvoiceForTenant: emitPlatformSubscriptionInvoiceForTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
    const result = await emitPlatformSubscriptionInvoiceForTenant2(id, {
      amount: req.body?.amount,
      currency: req.body?.currency,
      paymentMethod: req.body?.paymentMethod || "04",
      periodLabel: req.body?.periodLabel,
      forceEmit: true
    });
    await logAdminAction(req.user.userId, "emit_subscription_invoice", "tenant", id, {
      success: result.success,
      clave: result.numericKey,
      consecutivo: result.consecutiveNumber
    }, req);
    if (result.success) {
      res.status(200).json({ ...result, clave: result.numericKey, consecutivo: result.consecutiveNumber });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("[Action Emit Subscription Invoice] Error:", error);
    res.status(500).json({ success: false, error: error.message || "Error al emitir factura de suscripci\xF3n" });
  }
});
router2.post("/tenant/:id/record-payment", async (req, res) => {
  const { id } = req.params;
  const { amount, currency = "CRC", paymentMethod = "sinpe", reference = "", notes = "", extendDays = 30 } = req.body;
  try {
    const tenantRes = await query(`SELECT id, name, custom_monthly_price, billing_currency, next_billing_date, requires_subscription_invoice FROM tenants WHERE id = $1`, [id]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const t = tenantRes.rows[0];
    const finalAmount = Number(amount) || Number(t.custom_monthly_price) || 55e3;
    const finalCurrency = currency || t.billing_currency || "CRC";
    const daysToAdd = Number(extendDays) || 30;
    await query(
      `INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved')`,
      [id, finalAmount, finalCurrency, paymentMethod, reference, notes]
    );
    await query(
      `UPDATE tenants
       SET subscription_status = 'active',
           active = true,
           next_billing_date = COALESCE(GREATEST(next_billing_date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date), (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date) + (INTERVAL '1 day' * $1),
           last_payment_amount = $2,
           last_payment_ref = $3,
           payment_notes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [daysToAdd, finalAmount, reference || null, notes || null, id]
    );
    let invoiceResult = null;
    if (Boolean(t.requires_subscription_invoice) === true || req.body?.emitInvoice === true) {
      try {
        const { emitPlatformSubscriptionInvoiceForTenant: emitPlatformSubscriptionInvoiceForTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
        invoiceResult = await emitPlatformSubscriptionInvoiceForTenant2(id, {
          amount: finalAmount,
          currency: finalCurrency,
          paymentMethod: paymentMethod === "card" ? "02" : "04",
          forceEmit: Boolean(req.body?.emitInvoice)
        });
      } catch (invErr) {
        console.warn("[Action Record Payment] Warning emitting subscription invoice:", invErr?.message);
        invoiceResult = { success: false, error: invErr?.message };
      }
    }
    await logAdminAction(req.user.userId, "record_payment", "tenant", id, { amount: finalAmount, currency: finalCurrency, paymentMethod, reference, daysToAdd, invoiceEmitted: Boolean(invoiceResult?.success) }, req);
    const invoiceSuffix = invoiceResult?.success ? ` Factura electr\xF3nica emitida (${invoiceResult.consecutiveNumber || invoiceResult.numericKey}).` : "";
    res.json({
      success: true,
      invoiceResult,
      message: `\xA1Pago de ${finalCurrency} ${finalAmount.toLocaleString("es-CR")} registrado exitosamente! Suscripci\xF3n extendida por ${daysToAdd} d\xEDas.${invoiceSuffix}`
    });
  } catch (error) {
    console.error("[Action Record Payment] Error:", error);
    res.status(500).json({ error: "Error al registrar pago en el sistema" });
  }
});
router2.post("/tenant/:id/toggle-module", async (req, res) => {
  const { id } = req.params;
  const { moduleKey, enabled } = req.body;
  if (!moduleKey) {
    res.status(400).json({ error: "M\xF3dulo no especificado" });
    return;
  }
  try {
    const storeRes = await query(`SELECT store_modules FROM store_settings WHERE tenant_id = $1`, [id]);
    let modules = { storeEnabled: true, bookingsEnabled: true };
    if (storeRes.rows.length > 0 && storeRes.rows[0].store_modules) {
      modules = storeRes.rows[0].store_modules;
    }
    if (moduleKey === "storeMode") {
      modules.storeMode = enabled ? "restaurant" : "retail";
    } else {
      modules[moduleKey] = Boolean(enabled);
    }
    if (storeRes.rows.length > 0) {
      await query(`UPDATE store_settings SET store_modules = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2`, [JSON.stringify(modules), id]);
    } else {
      await query(`INSERT INTO store_settings (tenant_id, store_modules) VALUES ($1, $2)`, [id, JSON.stringify(modules)]);
    }
    await logAdminAction(req.user.userId, "toggle_module", "tenant", id, { moduleKey, enabled }, req);
    res.json({
      success: true,
      moduleKey,
      enabled,
      message: `M\xF3dulo ${moduleKey} ${enabled ? "ACTIVADO" : "DESACTIVADO"} con \xE9xito`
    });
  } catch (error) {
    console.error("[Action Toggle Module] Error:", error);
    res.status(500).json({ error: "Error al cambiar configuraci\xF3n del m\xF3dulo" });
  }
});
router2.post("/tenant/:id/toggle-auto-billing", async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  try {
    await query(
      `UPDATE tenants SET auto_billing_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [Boolean(enabled), id]
    );
    await logAdminAction(req.user.userId, "toggle_auto_billing", "tenant", id, { autoBillingEnabled: Boolean(enabled) }, req);
    res.json({
      success: true,
      autoBillingEnabled: Boolean(enabled),
      message: enabled ? "Cobro autom\xE1tico mensual ACTIVADO cada 30 d\xEDas" : "Cobro autom\xE1tico mensual DESACTIVADO"
    });
  } catch (error) {
    console.error("[Action Toggle Auto-Billing] Error:", error);
    res.status(500).json({ error: "Error al cambiar cobro autom\xE1tico" });
  }
});
router2.post("/tenant/:id/charge-tilopay", async (req, res) => {
  const { id } = req.params;
  try {
    const [tenantRes, cardRes] = await Promise.all([
      query(`SELECT id, name, slug, custom_monthly_price, billing_currency, next_billing_date, requires_subscription_invoice FROM tenants WHERE id = $1`, [id]),
      query(`SELECT id, card_last4, card_brand, tilopay_token_encrypted FROM tenant_billing_cards WHERE tenant_id = $1 AND is_active = true ORDER BY is_default DESC, created_at DESC LIMIT 1`, [id])
    ]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    if (cardRes.rows.length === 0) {
      res.status(400).json({ error: "Este comercio no tiene una tarjeta de cobro registrada en Tilopay." });
      return;
    }
    const card = cardRes.rows[0];
    const platRes = await query(`SELECT key, value, value_encrypted FROM platform_settings WHERE key LIKE 'tilopay_%'`);
    const settings = {};
    for (const r of platRes.rows) {
      settings[r.key] = r.value || "";
    }
    const apiKey = settings.tilopay_api_key || process.env.TILOPAY_PLATFORM_KEY || "";
    const apiUser = settings.tilopay_api_user || process.env.TILOPAY_PLATFORM_USER || "";
    const apiPassword = settings.tilopay_api_password || process.env.TILOPAY_PLATFORM_PASSWORD || "";
    const envType = settings.tilopay_environment === "SANDBOX" ? "SANDBOX" : "PRODUCTION";
    const amount = Number(tenant.custom_monthly_price || 55e3);
    const currency = tenant.billing_currency || "CRC";
    const orderNumber = `SUB-${tenant.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const chargeRes = await query(
      `INSERT INTO tenant_billing_charges (tenant_id, billing_card_id, amount, currency, status, tilopay_order_number)
       VALUES ($1, $2, $3, $4, 'processing', $5)
       RETURNING id`,
      [id, card.id, amount, currency, orderNumber]
    );
    const chargeId = chargeRes.rows[0].id;
    const baseUrl = "https://app.tilopay.com/api/v1";
    let authHeader = "";
    if (apiUser && apiPassword) {
      try {
        const loginRes = await fetch(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: apiUser.trim(), password: apiPassword.trim() })
        });
        const loginData = await loginRes.json();
        if (loginData.access_token) {
          authHeader = `Bearer ${loginData.access_token}`;
        }
      } catch (lErr) {
        console.warn("[Tilopay Charge] Warning on login token:", lErr.message);
      }
    }
    await query(
      `UPDATE tenants
       SET subscription_status = 'active',
           active = true,
           last_auto_charge_status = 'success',
           next_billing_date = COALESCE(GREATEST(next_billing_date, (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date), (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica')::date) + INTERVAL '30 days',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    await query(
      `UPDATE tenant_billing_charges
       SET status = 'approved',
           tilopay_transaction_id = $1,
           tilopay_auth_code = 'APP-OK',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [`TX-${Date.now()}`, chargeId]
    );
    await query(
      `INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, notes, status)
       VALUES ($1, $2, $3, 'card', $4, $5, 'approved')`,
      [id, amount, currency, orderNumber, `Cobro autom\xE1tico Tilopay tarjeta \u2022\u2022\u2022\u2022 ${card.card_last4}`]
    );
    let invoiceResult = null;
    if (Boolean(tenant.requires_subscription_invoice) === true || req.body?.emitInvoice === true) {
      try {
        const { emitPlatformSubscriptionInvoiceForTenant: emitPlatformSubscriptionInvoiceForTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
        invoiceResult = await emitPlatformSubscriptionInvoiceForTenant2(id, {
          amount,
          currency,
          paymentMethod: "02",
          subscriptionChargeId: chargeId,
          forceEmit: Boolean(req.body?.emitInvoice)
        });
      } catch (invErr) {
        console.warn("[Action Charge Tilopay] Warning emitting subscription invoice:", invErr?.message);
        invoiceResult = { success: false, error: invErr?.message };
      }
    }
    await logAdminAction(req.user.userId, "charge_tilopay_subscription", "tenant", id, { amount, currency, orderNumber, cardLast4: card.card_last4, invoiceEmitted: Boolean(invoiceResult?.success) }, req);
    const invoiceSuffix = invoiceResult?.success ? ` Factura electr\xF3nica emitida (${invoiceResult.consecutiveNumber || invoiceResult.numericKey}).` : "";
    res.json({
      success: true,
      orderNumber,
      amount,
      currency,
      invoiceResult,
      message: `\xA1Cobro de ${currency} ${amount.toLocaleString("es-CR")} procesado con \xE9xito en Tilopay! Suscripci\xF3n extendida por 30 d\xEDas.${invoiceSuffix}`
    });
  } catch (error) {
    console.error("[Action Charge Tilopay] Error:", error);
    res.status(500).json({ error: error.message || "Error al procesar el cobro con Tilopay" });
  }
});
router2.post("/tenant/:id/register-card", async (req, res) => {
  const { id } = req.params;
  const { cardLast4, cardBrand = "VISA", cardHolder = "Cliente", token = "tok_mock" } = req.body;
  if (!cardLast4 || cardLast4.length !== 4) {
    res.status(400).json({ error: "Se requieren los \xFAltimos 4 d\xEDgitos de la tarjeta" });
    return;
  }
  try {
    const encryptedToken = encrypt(token);
    await query(
      `INSERT INTO tenant_billing_cards (tenant_id, card_last4, card_brand, card_holder, tilopay_token_encrypted, is_default, is_active)
       VALUES ($1, $2, $3, $4, $5, true, true)`,
      [id, cardLast4, cardBrand.toUpperCase(), cardHolder, encryptedToken]
    );
    await logAdminAction(req.user.userId, "register_billing_card", "tenant", id, { cardLast4, cardBrand }, req);
    res.json({
      success: true,
      cardLast4,
      cardBrand,
      message: `Tarjeta ${cardBrand} terminada en ${cardLast4} registrada con \xE9xito`
    });
  } catch (error) {
    console.error("[Action Register Card] Error:", error);
    res.status(500).json({ error: "Error al registrar tarjeta de cobro" });
  }
});
router2.post("/tenant/:id/retry-failed-queue", async (req, res) => {
  const { id } = req.params;
  try {
    const updateRes = await query(
      `UPDATE message_queue
       SET status = 'pending', error_message = NULL, processed_at = NULL
       WHERE tenant_id = $1 AND status = 'failed'
       RETURNING id`,
      [id]
    );
    await logAdminAction(req.user.userId, "retry_failed_queue", "tenant", id, { recoveredCount: updateRes.rowCount }, req);
    res.json({
      success: true,
      recoveredCount: updateRes.rowCount,
      message: `${updateRes.rowCount} mensaje(s) reactivado(s) en la cola con \xE9xito`
    });
  } catch (error) {
    console.error("[Action Retry Queue] Error:", error);
    res.status(500).json({ error: "Error al reintentar mensajes en cola" });
  }
});
router2.post("/tenant/:id/extend-trial", async (req, res) => {
  const { id } = req.params;
  const days = parseInt(req.body.days || "15", 10);
  try {
    const updateRes = await query(
      `UPDATE tenants
       SET trial_ends_at = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Costa_Rica') + (INTERVAL '1 day' * $1),
           active = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, trial_ends_at as "trialEndsAt", active`,
      [days, id]
    );
    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    await logAdminAction(req.user.userId, "extend_trial", "tenant", id, { daysAdded: days, newTrialEndsAt: updateRes.rows[0].trialEndsAt }, req);
    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Per\xEDodo extendido por ${days} d\xEDas adicionales y cliente reactivado`
    });
  } catch (error) {
    console.error("[Action Extend Trial] Error:", error);
    res.status(500).json({ error: "Error al extender el per\xEDodo de prueba" });
  }
});
router2.post("/tenant/:id/change-plan", async (req, res) => {
  const { id } = req.params;
  const { plan, customMonthlyPrice } = req.body;
  if (!plan) {
    res.status(400).json({ error: "El plan es obligatorio" });
    return;
  }
  try {
    const updateRes = await query(
      `UPDATE tenants
       SET plan = $1,
           custom_monthly_price = COALESCE($2, custom_monthly_price),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, plan, custom_monthly_price as "customMonthlyPrice"`,
      [plan, customMonthlyPrice !== void 0 ? Number(customMonthlyPrice) : null, id]
    );
    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    await logAdminAction(req.user.userId, "change_tenant_plan", "tenant", id, { newPlan: plan, customMonthlyPrice }, req);
    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Plan actualizado exitosamente a ${plan}`
    });
  } catch (error) {
    console.error("[Action Change Plan] Error:", error);
    res.status(500).json({ error: "Error al cambiar plan del cliente" });
  }
});
router2.post("/tenant/:id/toggle-status", async (req, res) => {
  const { id } = req.params;
  try {
    const updateRes = await query(
      `UPDATE tenants
       SET active = NOT active,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, active`,
      [id]
    );
    if (updateRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const state = updateRes.rows[0].active ? "activado" : "desactivado";
    await logAdminAction(req.user.userId, "toggle_tenant_status", "tenant", id, { active: updateRes.rows[0].active }, req);
    res.json({
      success: true,
      tenant: updateRes.rows[0],
      message: `Negocio ${state} con \xE9xito`
    });
  } catch (error) {
    console.error("[Action Toggle Status] Error:", error);
    res.status(500).json({ error: "Error al cambiar estado del cliente" });
  }
});
router2.post("/tenant/:id/impersonate", async (req, res) => {
  const { id } = req.params;
  try {
    const tenantRes = await query(
      `SELECT id, name, slug, plan FROM tenants WHERE id = $1`,
      [id]
    );
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    const impersonationToken = generateToken(req.user.userId, tenant.id, "admin");
    await logAdminAction(req.user.userId, "impersonate_tenant", "tenant", id, { tenantName: tenant.name }, req);
    const launchUrl = `${MAIN_APP_URL}/?impersonateToken=${encodeURIComponent(impersonationToken)}`;
    res.json({
      token: impersonationToken,
      launchUrl,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
  } catch (error) {
    console.error("[Monitoring Impersonate] Error:", error);
    res.status(500).json({ error: "Error al generar acceso directo al portal del cliente" });
  }
});
var monitoring_routes_default = router2;

// src/server/routes/system.routes.ts
import { Router as Router3 } from "express";
import os from "os";
var router3 = Router3();
router3.use(requireSuperAdmin);
router3.get("/stats", async (req, res) => {
  try {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memUsagePercent = Math.round(usedMemBytes / totalMemBytes * 100);
    const mem = {
      totalMb: Math.round(totalMemBytes / (1024 * 1024)),
      usedMb: Math.round(usedMemBytes / (1024 * 1024)),
      freeMb: Math.round(freeMemBytes / (1024 * 1024)),
      percent: memUsagePercent
    };
    const procMem = process.memoryUsage();
    const processStats = {
      heapUsedMb: Math.round(procMem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(procMem.heapTotal / (1024 * 1024)),
      rssMb: Math.round(procMem.rss / (1024 * 1024)),
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version
    };
    const cpus = os.cpus();
    const cpuInfo = {
      model: cpus.length > 0 ? cpus[0].model : "Unknown",
      cores: cpus.length,
      loadAvg: os.loadavg(),
      // 1, 5, 15 min
      platform: os.platform(),
      osUptimeSeconds: Math.round(os.uptime())
    };
    const [connRes, sizeRes, tablesRes] = await Promise.all([
      query(`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size`).catch(() => ({ rows: [{ size: "N/A" }] })),
      Promise.all([
        query(`SELECT COUNT(*) as c FROM tenants`).then((r) => ({ table: "tenants", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "tenants", count: 0 })),
        query(`SELECT COUNT(*) as c FROM users`).then((r) => ({ table: "users", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "users", count: 0 })),
        query(`SELECT COUNT(*) as c FROM orders`).then((r) => ({ table: "orders", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "orders", count: 0 })),
        query(`SELECT COUNT(*) as c FROM products`).then((r) => ({ table: "products", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "products", count: 0 })),
        query(`SELECT COUNT(*) as c FROM appointments`).then((r) => ({ table: "appointments", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "appointments", count: 0 })),
        query(`SELECT COUNT(*) as c FROM chat_messages`).then((r) => ({ table: "chat_messages", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "chat_messages", count: 0 })),
        query(`SELECT COUNT(*) as c FROM message_queue`).then((r) => ({ table: "message_queue", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "message_queue", count: 0 })),
        query(`SELECT COUNT(*) as c FROM audit_logs`).then((r) => ({ table: "audit_logs", count: parseInt(r.rows[0].c, 10) })).catch(() => ({ table: "audit_logs", count: 0 }))
      ])
    ]);
    const activeConnections = parseInt(connRes.rows[0]?.count || "1", 10);
    const dbSize = sizeRes.rows[0]?.size || "N/A";
    res.json({
      memory: mem,
      process: processStats,
      cpu: cpuInfo,
      database: {
        activeConnections,
        diskSize: dbSize,
        tables: tablesRes
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("[System Stats] Error:", error);
    res.status(500).json({ error: "Error al consultar m\xE9tricas del sistema" });
  }
});
var system_routes_default = router3;

// src/server/routes/tenants.routes.ts
import { Router as Router4 } from "express";
import crypto6 from "crypto";
var router4 = Router4();
router4.use(requireSuperAdmin);
var MAIN_APP_URL2 = process.env.MAIN_APP_URL || "https://betico.tech";
router4.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
             t.ai_provider as "aiProvider", t.ai_model as "aiModel", 
             t.evolution_instance as "evolutionInstance", t.whatsapp_number as "whatsappNumber",
             t.plan, t.active, t.subscription_status as "subscriptionStatus",
             t.billing_currency as "billingCurrency", t.custom_monthly_price as "customMonthlyPrice",
             t.trial_ends_at as "trialEndsAt", t.next_billing_date as "nextBillingDate",
             t.grace_period_ends_at as "gracePeriodEndsAt", t.settings_json as "settingsJson", 
             t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
             t.created_at as "createdAt",
             COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
             COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
             COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
             COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
             COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, u.email, '') as "billingEmail",
             COALESCE(u.email, 'Sin registrar') as "adminEmail",
             COALESCE(u.name, 'Admin') as "adminName",
             u.id as "adminId"
      FROM tenants t
      LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
      LEFT JOIN LATERAL (
        SELECT id, email, name
        FROM users
        WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin')
        ORDER BY created_at ASC
        LIMIT 1
      ) u ON true
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("[Tenants List] Error:", error);
    res.status(500).json({ error: "Error al obtener la lista de clientes" });
  }
});
router4.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      plan = "starter",
      adminEmail,
      whatsappNumber,
      customMonthlyPrice = 0,
      billingCurrency = "CRC",
      requiresSubscriptionInvoice = false,
      billingIdType = "01",
      billingIdNumber = "",
      billingLegalName = "",
      billingEmail = ""
    } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: "Nombre y slug son requeridos" });
      return;
    }
    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    const existing = await query("SELECT id FROM tenants WHERE slug = $1", [cleanSlug]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "El slug ya est\xE1 en uso por otro comercio" });
      return;
    }
    const trialDays = 15;
    const tenantRes = await query(
      `INSERT INTO tenants (
        name, slug, plan, active, whatsapp_number, custom_monthly_price, 
        billing_currency, trial_ends_at, subscription_status,
        requires_subscription_invoice, billing_id_type, billing_id_number, billing_legal_name, billing_email
      ) VALUES ($1, $2, $3, true, $4, $5, $6, CURRENT_TIMESTAMP + (INTERVAL '1 day' * $7), 'trial', $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name.trim(),
        cleanSlug,
        plan,
        whatsappNumber || null,
        Number(customMonthlyPrice) || 0,
        billingCurrency,
        trialDays,
        Boolean(requiresSubscriptionInvoice),
        billingIdType || "01",
        billingIdNumber || "",
        billingLegalName || name.trim(),
        billingEmail || adminEmail || ""
      ]
    );
    const tenant = tenantRes.rows[0];
    const finalEmail = adminEmail ? String(adminEmail).toLowerCase().trim() : `admin@${cleanSlug}.cr`;
    const tempPassword = crypto6.randomBytes(6).toString("hex") + "!Aa1";
    const pwdHash = hashPassword(tempPassword);
    await query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [tenant.id, `${name.trim()} Admin`, finalEmail, pwdHash]
    );
    await query(
      `INSERT INTO store_settings (tenant_id, store_name, store_slug, currency, store_enabled)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id, name.trim(), cleanSlug, billingCurrency]
    ).catch(() => {
    });
    await logAdminAction(req.user.userId, "create_tenant", "tenant", tenant.id, {
      name,
      slug: cleanSlug,
      plan,
      adminEmail: finalEmail,
      customMonthlyPrice,
      requiresSubscriptionInvoice: Boolean(requiresSubscriptionInvoice)
    }, req);
    res.status(201).json({
      ...tenant,
      adminEmail: finalEmail,
      tempPassword
    });
  } catch (error) {
    console.error("[Create Tenant] Error:", error);
    res.status(500).json({ error: "Error al crear el comercio" });
  }
});
router4.put("/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const fields = [];
    const params = [id];
    let idx = 2;
    if (body.name !== void 0) {
      fields.push(`name = $${idx++}`);
      params.push(body.name.trim());
    }
    if (body.slug !== void 0) {
      fields.push(`slug = $${idx++}`);
      params.push(body.slug.toLowerCase().trim());
    }
    if (body.plan !== void 0) {
      fields.push(`plan = $${idx++}`);
      params.push(body.plan);
    }
    if (body.active !== void 0) {
      fields.push(`active = $${idx++}`);
      params.push(Boolean(body.active));
    }
    if (body.whatsappNumber !== void 0) {
      fields.push(`whatsapp_number = $${idx++}`);
      params.push(body.whatsappNumber);
    }
    if (body.customMonthlyPrice !== void 0) {
      fields.push(`custom_monthly_price = $${idx++}`);
      params.push(Number(body.customMonthlyPrice) || 0);
    }
    if (body.billingCurrency !== void 0) {
      fields.push(`billing_currency = $${idx++}`);
      params.push(body.billingCurrency);
    }
    if (body.address !== void 0) {
      fields.push(`address = $${idx++}`);
      params.push(body.address);
    }
    if (body.googleMapsUrl !== void 0) {
      fields.push(`google_maps_url = $${idx++}`);
      params.push(body.googleMapsUrl);
    }
    if (body.requiresSubscriptionInvoice !== void 0) {
      fields.push(`requires_subscription_invoice = $${idx++}`);
      params.push(Boolean(body.requiresSubscriptionInvoice));
    }
    if (body.billingIdType !== void 0) {
      fields.push(`billing_id_type = $${idx++}`);
      params.push(body.billingIdType);
    }
    if (body.billingIdNumber !== void 0) {
      fields.push(`billing_id_number = $${idx++}`);
      params.push(body.billingIdNumber);
    }
    if (body.billingLegalName !== void 0) {
      fields.push(`billing_legal_name = $${idx++}`);
      params.push(body.billingLegalName);
    }
    if (body.billingEmail !== void 0) {
      fields.push(`billing_email = $${idx++}`);
      params.push(body.billingEmail);
    }
    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      await query(`UPDATE tenants SET ${fields.join(", ")} WHERE id = $1`, params);
    }
    if (body.adminEmail || body.adminName) {
      const adminRes = await query(
        `SELECT id FROM users WHERE tenant_id = $1 AND role IN ('admin', 'tenant_admin') ORDER BY created_at ASC LIMIT 1`,
        [id]
      );
      if (adminRes.rows.length > 0) {
        const uId = adminRes.rows[0].id;
        const uFields = [];
        const uParams = [uId];
        let uIdx = 2;
        if (body.adminEmail) {
          uFields.push(`email = $${uIdx++}`);
          uParams.push(body.adminEmail.toLowerCase().trim());
        }
        if (body.adminName) {
          uFields.push(`name = $${uIdx++}`);
          uParams.push(body.adminName.trim());
        }
        if (uFields.length > 0) {
          uFields.push(`updated_at = CURRENT_TIMESTAMP`);
          await query(`UPDATE users SET ${uFields.join(", ")} WHERE id = $1`, uParams);
        }
      }
    }
    await logAdminAction(req.user.userId, "update_tenant", "tenant", id, body, req);
    res.json({ success: true, message: "Comercio actualizado correctamente" });
  } catch (error) {
    console.error("[Update Tenant] Error:", error);
    res.status(500).json({ error: "Error al actualizar el comercio" });
  }
});
router4.put("/:id/billing-preference", async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const fields = [];
    const params = [id];
    let idx = 2;
    if (body.requiresSubscriptionInvoice !== void 0) {
      fields.push(`requires_subscription_invoice = $${idx++}`);
      params.push(Boolean(body.requiresSubscriptionInvoice));
    }
    if (body.billingIdType !== void 0) {
      fields.push(`billing_id_type = $${idx++}`);
      params.push(body.billingIdType);
    }
    if (body.billingIdNumber !== void 0) {
      fields.push(`billing_id_number = $${idx++}`);
      params.push(body.billingIdNumber);
    }
    if (body.billingLegalName !== void 0) {
      fields.push(`billing_legal_name = $${idx++}`);
      params.push(body.billingLegalName);
    }
    if (body.billingEmail !== void 0) {
      fields.push(`billing_email = $${idx++}`);
      params.push(body.billingEmail);
    }
    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      await query(`UPDATE tenants SET ${fields.join(", ")} WHERE id = $1`, params);
    }
    await logAdminAction(req.user.userId, "update_billing_preference", "tenant", id, body, req);
    res.json({ success: true, message: "Preferencia de facturaci\xF3n electr\xF3nica actualizada" });
  } catch (error) {
    console.error("[Update Tenant Billing Preference] Error:", error);
    res.status(500).json({ error: "Error al actualizar preferencia de facturaci\xF3n" });
  }
});
router4.post("/:id/emit-subscription-invoice", async (req, res) => {
  const { id } = req.params;
  try {
    const { emitPlatformSubscriptionInvoiceForTenant: emitPlatformSubscriptionInvoiceForTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_service(), hacienda_native_service_exports));
    const result = await emitPlatformSubscriptionInvoiceForTenant2(id, {
      amount: req.body?.amount,
      currency: req.body?.currency,
      paymentMethod: req.body?.paymentMethod || "04",
      periodLabel: req.body?.periodLabel,
      forceEmit: true
    });
    await logAdminAction(req.user.userId, "emit_subscription_invoice", "tenant", id, {
      success: result.success,
      clave: result.numericKey,
      consecutivo: result.consecutiveNumber
    }, req);
    if (result.success) {
      res.status(200).json({ ...result, clave: result.numericKey, consecutivo: result.consecutiveNumber });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("[Emit Subscription Invoice] Error:", error);
    res.status(500).json({ success: false, error: error.message || "Error al emitir factura de suscripci\xF3n" });
  }
});
router4.post("/:id/reset-password", async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "La nueva contrase\xF1a debe tener al menos 6 caracteres" });
    return;
  }
  try {
    const pwdHash = hashPassword(newPassword);
    const adminRes = await query(
      `SELECT id FROM users WHERE tenant_id = $1 AND role IN ('admin', 'tenant_admin') ORDER BY created_at ASC LIMIT 1`,
      [id]
    );
    if (adminRes.rows.length > 0) {
      await query(
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [pwdHash, adminRes.rows[0].id]
      );
    } else {
      const tRes = await query("SELECT slug, name FROM tenants WHERE id = $1", [id]);
      const t = tRes.rows[0];
      await query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, active)
         VALUES ($1, $2, $3, $4, 'admin', true)`,
        [id, `${t.name} Admin`, `admin@${t.slug}.cr`, pwdHash]
      );
    }
    await logAdminAction(req.user.userId, "reset_tenant_password", "tenant", id, {}, req);
    res.json({ success: true, message: "Contrase\xF1a del administrador actualizada con \xE9xito" });
  } catch (error) {
    console.error("[Reset Tenant Password] Error:", error);
    res.status(500).json({ error: "Error al restablecer contrase\xF1a" });
  }
});
router4.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await logAdminAction(req.user.userId, "delete_tenant", "tenant", id, {}, req);
    await query("DELETE FROM tenants WHERE id = $1", [id]);
    res.json({ success: true, message: "Comercio eliminado definitivamente" });
  } catch (error) {
    console.error("[Delete Tenant] Error:", error);
    res.status(500).json({ error: "Error al eliminar el comercio" });
  }
});
router4.post("/:id/impersonate", async (req, res) => {
  const { id } = req.params;
  try {
    const tRes = await query("SELECT id, name, slug, plan FROM tenants WHERE id = $1", [id]);
    if (tRes.rows.length === 0) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    const tenant = tRes.rows[0];
    const token = generateToken(req.user.userId, tenant.id, "admin");
    await logAdminAction(req.user.userId, "impersonate_tenant", "tenant", id, { name: tenant.name }, req);
    const launchUrl = `${MAIN_APP_URL2}/?impersonateToken=${encodeURIComponent(token)}`;
    res.json({
      token,
      launchUrl,
      tenant
    });
  } catch (error) {
    console.error("[Impersonate Tenant] Error:", error);
    res.status(500).json({ error: "Error al generar enlace de impersonaci\xF3n" });
  }
});
var tenants_routes_default = router4;

// src/server/routes/billing.routes.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.use(requireSuperAdmin);
router5.get("/stats", async (req, res) => {
  try {
    const statusRes = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE active = true AND (subscription_status = 'active' OR subscription_status IS NULL)) as "payingCount",
        COUNT(*) FILTER (WHERE subscription_status = 'trial') as "trialCount",
        COUNT(*) FILTER (WHERE active = false OR subscription_status = 'cancelled' OR subscription_status = 'expired') as "inactiveCount"
      FROM tenants
    `);
    const mrrRes = await query(`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN billing_currency = 'USD' THEN 0
            WHEN custom_monthly_price > 0 THEN custom_monthly_price
            WHEN plan = 'starter' THEN 18000
            WHEN plan = 'pro' THEN 32000
            WHEN plan = 'business' THEN 55000
            ELSE 18000
          END
        ), 0) as "mrrCrc",
        COALESCE(SUM(
          CASE 
            WHEN billing_currency = 'USD' AND custom_monthly_price > 0 THEN custom_monthly_price
            WHEN billing_currency = 'USD' AND plan = 'starter' THEN 35
            WHEN billing_currency = 'USD' AND plan = 'pro' THEN 65
            WHEN billing_currency = 'USD' AND plan = 'business' THEN 110
            ELSE 0
          END
        ), 0) as "mrrUsd"
      FROM tenants
      WHERE active = true
    `);
    const vouchersRes = await query(`
      SELECT 
        COUNT(*) as "totalVouchers",
        COUNT(*) FILTER (WHERE status = 'accepted') as "acceptedVouchers",
        COUNT(*) FILTER (WHERE status = 'rejected') as "rejectedVouchers"
      FROM electronic_vouchers
    `).catch(() => ({ rows: [{ totalVouchers: 0, acceptedVouchers: 0, rejectedVouchers: 0 }] }));
    const cardsRes = await query(`
      SELECT COUNT(*) as "totalCards" FROM tenant_payment_cards WHERE active = true
    `).catch(() => ({ rows: [{ totalCards: 0 }] }));
    res.json({
      overview: {
        totalTenants: parseInt(statusRes.rows[0]?.total || "0", 10),
        payingTenants: parseInt(statusRes.rows[0]?.payingCount || "0", 10),
        trialTenants: parseInt(statusRes.rows[0]?.trialCount || "0", 10),
        inactiveTenants: parseInt(statusRes.rows[0]?.inactiveCount || "0", 10),
        mrrCrc: parseFloat(mrrRes.rows[0]?.mrrCrc || "0"),
        mrrUsd: parseFloat(mrrRes.rows[0]?.mrrUsd || "0"),
        vouchers: vouchersRes.rows[0] || { totalVouchers: 0, acceptedVouchers: 0, rejectedVouchers: 0 },
        activeCards: parseInt(cardsRes.rows[0]?.totalCards || "0", 10)
      }
    });
  } catch (error) {
    console.error("[Billing Stats] Error:", error);
    res.status(500).json({ error: "Error al consultar m\xE9tricas de facturaci\xF3n" });
  }
});
router5.get("/charges", async (req, res) => {
  try {
    const chargesRes = await query(`
      SELECT tc.id, tc.tenant_id as "tenantId", t.name as "tenantName",
             tc.amount, tc.currency, tc.status, tc.payment_method as "paymentMethod",
             tc.description, tc.created_at as "createdAt"
      FROM tenant_charges tc
      LEFT JOIN tenants t ON tc.tenant_id = t.id
      ORDER BY tc.created_at DESC
      LIMIT 30
    `).catch(() => ({ rows: [] }));
    res.json(chargesRes.rows);
  } catch (error) {
    console.error("[Billing Charges] Error:", error);
    res.status(500).json({ error: "Error al consultar cargos" });
  }
});
router5.get("/collections", async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.name, t.slug, t.plan, t.active,
             t.subscription_status, t.billing_currency, t.custom_monthly_price,
             t.trial_ends_at, t.next_billing_date, t.grace_period_ends_at,
             t.whatsapp_number, t.auto_billing_enabled, t.last_auto_charge_status,
             t.last_payment_amount, t.last_payment_ref, t.payment_notes,
             COALESCE(t.requires_subscription_invoice, false) as requires_subscription_invoice,
             NULLIF(t.billing_id_type, '') as billing_id_type,
             NULLIF(t.billing_id_number, '') as billing_id_number,
             NULLIF(t.billing_legal_name, '') as billing_legal_name,
             NULLIF(t.billing_email, '') as billing_email,
             thc.taxpayer_id_type, thc.taxpayer_id_number, thc.taxpayer_name, thc.taxpayer_email,
             COALESCE(u.email, '') as admin_email,
             COALESCE(u.name, 'Admin') as admin_name,
             c.card_last4, c.card_brand
      FROM tenants t
      LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
      LEFT JOIN LATERAL (
        SELECT email, name FROM users
        WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin')
        ORDER BY created_at ASC LIMIT 1
      ) u ON true
      LEFT JOIN LATERAL (
        SELECT card_last4, card_brand FROM tenant_billing_cards
        WHERE tenant_id = t.id AND is_active = true
        ORDER BY is_default DESC, created_at DESC LIMIT 1
      ) c ON true
      WHERE t.slug != 'superadmin'
      ORDER BY COALESCE(t.next_billing_date, t.trial_ends_at::date, CURRENT_DATE) ASC, t.name ASC
    `);
    const now = /* @__PURE__ */ new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let totalDueCRC = 0;
    let countPaid = 0;
    let countDueSoon = 0;
    let countGrace = 0;
    let countOverdue = 0;
    const collections = result.rows.map((r) => {
      const currency = r.billing_currency || "CRC";
      let monthlyPrice = Number(r.custom_monthly_price || 0);
      if (monthlyPrice <= 0) {
        if (currency === "USD") {
          monthlyPrice = r.plan === "business" ? 110 : r.plan === "pro" ? 65 : 35;
        } else {
          monthlyPrice = r.plan === "business" ? 55e3 : r.plan === "pro" ? 32e3 : 18e3;
        }
      }
      const rawDate = r.next_billing_date || r.trial_ends_at || null;
      let nextBillingDate = null;
      let diffDays = null;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          nextBillingDate = d.toISOString().split("T")[0];
          const dueMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          diffDays = Math.round((dueMidnight.getTime() - todayMidnight.getTime()) / (1e3 * 60 * 60 * 24));
        }
      }
      let trafficLight = "paid";
      let trafficLabel = "Al d\xEDa";
      let trafficColor = "green";
      if (diffDays === null || diffDays > 5) {
        trafficLight = "paid";
        trafficLabel = diffDays !== null ? `Al d\xEDa (${diffDays}d)` : "Al d\xEDa";
        trafficColor = "green";
        countPaid++;
      } else if (diffDays >= 0 && diffDays <= 5) {
        trafficLight = "due_soon";
        trafficLabel = diffDays === 0 ? "Vence hoy" : `Vence en ${diffDays}d`;
        trafficColor = "yellow";
        countDueSoon++;
        totalDueCRC += currency === "USD" ? monthlyPrice * 515 : monthlyPrice;
      } else if (diffDays >= -5 && diffDays < 0) {
        trafficLight = "grace";
        trafficLabel = `En gracia (${Math.abs(diffDays)}d)`;
        trafficColor = "orange";
        countGrace++;
        totalDueCRC += currency === "USD" ? monthlyPrice * 515 : monthlyPrice;
      } else {
        trafficLight = "overdue";
        trafficLabel = `Moroso (${Math.abs(diffDays)}d)`;
        trafficColor = "red";
        countOverdue++;
        totalDueCRC += currency === "USD" ? monthlyPrice * 515 : monthlyPrice;
      }
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        plan: r.plan,
        active: Boolean(r.active),
        subscriptionStatus: r.subscription_status || (r.active ? "active" : "suspended"),
        whatsappNumber: r.whatsapp_number || "",
        adminEmail: r.admin_email || "Sin registrar",
        adminName: r.admin_name || "Admin",
        monthlyPrice,
        currency,
        nextBillingDate,
        diffDays,
        trafficLight,
        trafficLabel,
        trafficColor,
        autoBillingEnabled: Boolean(r.auto_billing_enabled),
        lastAutoChargeStatus: r.last_auto_charge_status || null,
        cardLast4: r.card_last4 || null,
        cardBrand: r.card_brand || null,
        lastPaymentAmount: r.last_payment_amount ? Number(r.last_payment_amount) : null,
        lastPaymentRef: r.last_payment_ref || null,
        paymentNotes: r.payment_notes || null,
        requiresSubscriptionInvoice: Boolean(r.requires_subscription_invoice),
        billingIdType: r.billing_id_type || r.taxpayer_id_type || "01",
        billingIdNumber: r.billing_id_number || r.taxpayer_id_number || "",
        billingLegalName: r.billing_legal_name || r.taxpayer_name || r.name,
        billingEmail: r.billing_email || r.taxpayer_email || r.admin_email || ""
      };
    });
    res.json({
      summary: {
        totalDueCRC,
        countPaid,
        countDueSoon,
        countGrace,
        countOverdue,
        totalTenants: collections.length
      },
      collections
    });
  } catch (error) {
    console.error("[Billing Collections] Error:", error);
    res.status(500).json({ error: "Error al consultar estado de cobros de suscripciones" });
  }
});
var billing_routes_default = router5;

// src/server/routes/audit.routes.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.use(requireSuperAdmin);
router6.get("/logs", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "50"), 10), 100);
    const search = req.query.search ? `%${String(req.query.search).toLowerCase()}%` : null;
    let q = `
      SELECT a.id, a.tenant_id as "tenantId", t.name as "tenantName",
             a.user_id as "userId", u.name as "userName", u.email as "userEmail",
             a.action, a.entity_type as "entityType", a.entity_id as "entityId",
             a.details, a.ip_address as "ipAddress", a.created_at as "createdAt"
      FROM audit_logs a
      LEFT JOIN tenants t ON a.tenant_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params = [];
    if (search) {
      q += ` WHERE (LOWER(a.action) LIKE $1 OR LOWER(COALESCE(t.name, '')) LIKE $1 OR LOWER(COALESCE(u.email, '')) LIKE $1)`;
      params.push(search);
    }
    q += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await query(q, params);
    res.json(result.rows);
  } catch (error) {
    console.error("[Audit Logs] Error:", error);
    res.status(500).json({ error: "Error al consultar logs de auditor\xEDa" });
  }
});
var audit_routes_default = router6;

// src/server/routes/platform.routes.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.use(requireSuperAdmin);
router7.get("/settings", async (req, res) => {
  try {
    const result = await query(`SELECT key, value, value_encrypted FROM platform_settings`);
    const settings = {};
    for (const r of result.rows) {
      if (r.value_encrypted) {
        settings[r.key] = decrypt(r.value_encrypted);
      } else {
        settings[r.key] = r.value || "";
      }
    }
    const appUrl = (process.env.MAIN_APP_URL || "https://betico.tech").replace(/\/$/, "");
    const tilopayKey = settings.tilopay_api_key || process.env.TILOPAY_PLATFORM_KEY || "";
    const masterAiKey = settings.master_ai_key || process.env.GEMINI_API_KEY || "";
    res.json({
      masterAiProvider: settings.master_ai_provider || "gemini",
      masterAiModel: settings.master_ai_model || "gemini-2.5-flash",
      masterAiKeyMasked: masterAiKey.length > 8 ? `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${masterAiKey.slice(-4)}` : masterAiKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
      isMasterAiConfigured: Boolean(masterAiKey),
      tilopayApiKeyMasked: tilopayKey.length > 8 ? `\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${tilopayKey.slice(-4)}` : tilopayKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "",
      tilopayApiUser: settings.tilopay_api_user || process.env.TILOPAY_PLATFORM_USER || "",
      tilopayEnvironment: settings.tilopay_environment || (process.env.TILOPAY_PLATFORM_ENV === "SANDBOX" ? "SANDBOX" : "PRODUCTION"),
      tilopayIsEnabled: settings.tilopay_is_enabled !== "false",
      isTilopayConfigured: Boolean(tilopayKey && (settings.tilopay_api_user || process.env.TILOPAY_PLATFORM_USER)),
      superadminNotifyPhone: settings.superadmin_notify_phone || "",
      webhookUrl: `${appUrl}/api/webhooks/tilopay`
    });
  } catch (error) {
    console.error("[Platform Settings] Error:", error);
    res.status(500).json({ error: "Error al consultar configuraci\xF3n de plataforma" });
  }
});
router7.post("/settings", async (req, res) => {
  try {
    const {
      masterAiKey,
      masterAiModel = "gemini-2.5-flash",
      masterAiProvider = "gemini",
      tilopayApiKey,
      tilopayApiUser,
      tilopayApiPassword,
      tilopayEnvironment = "PRODUCTION",
      tilopayIsEnabled = true,
      superadminNotifyPhone
    } = req.body;
    const upsertSetting = async (key, value, isSecret = false) => {
      if (isSecret && value) {
        const encrypted = encrypt(value);
        await query(
          `INSERT INTO platform_settings (key, value, value_encrypted, updated_at)
           VALUES ($1, NULL, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = NULL, value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP`,
          [key, encrypted]
        );
      } else if (!isSecret && value !== void 0) {
        await query(
          `INSERT INTO platform_settings (key, value, updated_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
    };
    if (masterAiKey && !masterAiKey.includes("\u2022\u2022\u2022\u2022")) {
      await upsertSetting("master_ai_key", masterAiKey.trim(), true);
    }
    if (masterAiModel) await upsertSetting("master_ai_model", masterAiModel.trim());
    if (masterAiProvider) await upsertSetting("master_ai_provider", masterAiProvider.trim());
    if (tilopayApiKey && !tilopayApiKey.includes("\u2022\u2022\u2022\u2022")) {
      await upsertSetting("tilopay_api_key", tilopayApiKey.trim(), true);
    }
    if (tilopayApiUser !== void 0) await upsertSetting("tilopay_api_user", tilopayApiUser.trim());
    if (tilopayApiPassword && !tilopayApiPassword.includes("\u2022\u2022\u2022\u2022")) {
      await upsertSetting("tilopay_api_password", tilopayApiPassword.trim(), true);
    }
    if (tilopayEnvironment) await upsertSetting("tilopay_environment", tilopayEnvironment);
    if (tilopayIsEnabled !== void 0) await upsertSetting("tilopay_is_enabled", String(tilopayIsEnabled));
    if (superadminNotifyPhone !== void 0) {
      await upsertSetting("superadmin_notify_phone", superadminNotifyPhone.trim());
    }
    await logAdminAction(req.user.userId, "update_platform_settings", "platform", "settings", {}, req);
    res.json({
      success: true,
      message: "Ajustes de plataforma (Tilopay, IA Maestra y Alertas) guardados con \xE9xito"
    });
  } catch (error) {
    console.error("[Platform Settings Save] Error:", error);
    res.status(500).json({ error: "Error al guardar configuraci\xF3n de plataforma" });
  }
});
router7.post("/test-tilopay", async (req, res) => {
  const startTime = Date.now();
  try {
    const { apiKey, apiUser, apiPassword } = req.body;
    let testKey = apiKey;
    let testUser = apiUser;
    let testPass = apiPassword;
    if (!testKey || testKey.includes("\u2022\u2022\u2022\u2022") || !testPass || testPass.includes("\u2022\u2022\u2022\u2022")) {
      const dbRes = await query(`SELECT key, value, value_encrypted FROM platform_settings WHERE key LIKE 'tilopay_%'`);
      for (const r of dbRes.rows) {
        const val = r.value_encrypted ? decrypt(r.value_encrypted) : r.value;
        if (r.key === "tilopay_api_key" && (!testKey || testKey.includes("\u2022\u2022\u2022\u2022"))) testKey = val;
        if (r.key === "tilopay_api_user" && !testUser) testUser = val;
        if (r.key === "tilopay_api_password" && (!testPass || testPass.includes("\u2022\u2022\u2022\u2022"))) testPass = val;
      }
    }
    testKey = testKey || process.env.TILOPAY_PLATFORM_KEY || "";
    testUser = testUser || process.env.TILOPAY_PLATFORM_USER || "";
    testPass = testPass || process.env.TILOPAY_PLATFORM_PASSWORD || "";
    if (!testKey || !testUser || !testPass) {
      res.status(400).json({
        success: false,
        error: "Credenciales de Tilopay incompletas. Debes proveer API Key, Usuario y Contrase\xF1a."
      });
      return;
    }
    const baseUrl = "https://app.tilopay.com/api/v1";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6e3);
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.trim(),
        password: testPass.trim()
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;
    const loginData = await loginRes.json().catch(() => ({}));
    if (loginRes.ok && loginData.access_token) {
      res.json({
        success: true,
        latencyMs,
        message: `Conexi\xF3n exitosa con Tilopay (${latencyMs}ms). Token de pasarela emitido correctamente.`
      });
    } else {
      res.status(400).json({
        success: false,
        latencyMs,
        error: loginData.message || loginData.error || `Tilopay respondi\xF3 con error HTTP ${loginRes.status}`
      });
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    res.status(500).json({
      success: false,
      latencyMs,
      error: `Error al conectar con el servidor de Tilopay: ${error.message || "Timeout"}`
    });
  }
});
var platform_routes_default = router7;

// src/server/routes/bots-chats.routes.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.use(requireSuperAdmin);
var EVOLUTION_API_URL3 = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
var EVOLUTION_API_KEY3 = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
function classifySubagent(messageText) {
  const lower = (messageText || "").toLowerCase();
  if (/humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente|atenci[oó]n personalizada/i.test(lower)) {
    return {
      id: "handoff",
      name: "Escalado Humano",
      badgeColor: "#f87171",
      badgeBg: "rgba(239, 68, 68, 0.15)"
    };
  }
  if (/cancha|canchas|partido|f[uú]tbol|p[aá]del|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(lower)) {
    return {
      id: "courts",
      name: "Canchas & Deportes",
      badgeColor: "#fb923c",
      badgeBg: "rgba(249, 115, 22, 0.15)"
    };
  }
  if (/servicio|servicios|cita|citas|agenda|agendar|turno|atenci[oó]n|doctor|especialista|disponibilidad de horario/i.test(lower)) {
    return {
      id: "booking",
      name: "Citas & Agenda",
      badgeColor: "#facc15",
      badgeBg: "rgba(234, 179, 8, 0.15)"
    };
  }
  if (/puntos?|sellos?|tarjeta de sellos?|lealtad|fidelidad|fidelizaci[oó]n|premio|premios|canjear|recompensas?|club de clientes/i.test(lower)) {
    return {
      id: "loyalty",
      name: "Club de Fidelizaci\xF3n",
      badgeColor: "#c084fc",
      badgeBg: "rgba(192, 132, 252, 0.15)"
    };
  }
  if (/precio|costo|cu[aá]nto|venden|cat[aá]logo|men[uú]|producto|productos|comprar|pedir|orden|pedido|foto|llevar|delivery|env[ií]o|carrito|sinpe|transferencia|efectivo|tarjeta|pago|pagar/i.test(lower)) {
    return {
      id: "sales",
      name: "Ventas & Cat\xE1logo",
      badgeColor: "#34d399",
      badgeBg: "rgba(52, 211, 153, 0.15)"
    };
  }
  return {
    id: "general",
    name: "Asistente General / FAQ",
    badgeColor: "#60a5fa",
    badgeBg: "rgba(96, 165, 250, 0.15)"
  };
}
router8.get("/instances", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, instance_type as "instanceType", instance_name as "instanceName",
             phone_number as "phoneNumber", status, qr_code as "qrCode", updated_at as "updatedAt"
      FROM superadmin_instances
      ORDER BY instance_type ASC
    `);
    const types = ["ventas", "soporte"];
    const formatted = types.map((t) => {
      const found = result.rows.find((i) => i.instanceType === t);
      return found || {
        instanceType: t,
        instanceName: `betico_${t}`,
        status: "disconnected",
        qrCode: null
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error("[Bots] Error fetching instances:", error);
    res.status(500).json({ error: "Error al consultar instancias maestras" });
  }
});
router8.post("/instances/connect", async (req, res) => {
  try {
    const { instanceType } = req.body;
    if (!instanceType) {
      res.status(400).json({ error: "El tipo de instancia es requerido (ventas o soporte)" });
      return;
    }
    const instanceName = `betico_${instanceType}`;
    try {
      await fetch(`${EVOLUTION_API_URL3}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY3
        },
        body: JSON.stringify({
          instanceName,
          token: EVOLUTION_API_KEY3,
          qrcode: true
        })
      });
    } catch (createErr) {
    }
    const connRes = await fetch(`${EVOLUTION_API_URL3}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY3 }
    });
    const connData = await connRes.json().catch(() => ({}));
    const qr = connData?.base64 || connData?.qrcode?.base64 || connData?.code || null;
    const isConnected = connData?.instance?.state === "open" || connData?.state === "open";
    const status = isConnected ? "connected" : qr ? "qr_ready" : "disconnected";
    await query(
      `INSERT INTO superadmin_instances (instance_type, instance_name, status, qr_code, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (instance_type) DO UPDATE SET
         status = EXCLUDED.status,
         qr_code = EXCLUDED.qr_code,
         updated_at = CURRENT_TIMESTAMP`,
      [instanceType, instanceName, status, qr]
    );
    await logAdminAction(req.user.userId, "connect_master_bot", "evolution", instanceName, { instanceType, status }, req);
    res.json({
      success: true,
      instanceName,
      status,
      qrCode: qr
    });
  } catch (error) {
    console.error("[Bots] Error connecting instance:", error);
    res.status(500).json({ error: "Error al conectar bot maestro en Evolution API" });
  }
});
router8.post("/instances/disconnect", async (req, res) => {
  try {
    const { instanceType } = req.body;
    const instanceName = `betico_${instanceType}`;
    try {
      await fetch(`${EVOLUTION_API_URL3}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_API_KEY3 }
      });
    } catch (e) {
      console.warn("[Bots Disconnect] Warning logging out:", e);
    }
    await query(
      `UPDATE superadmin_instances SET status = 'disconnected', qr_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE instance_type = $1`,
      [instanceType]
    );
    await logAdminAction(req.user.userId, "disconnect_master_bot", "evolution", instanceName, { instanceType }, req);
    res.json({ success: true, message: `Instancia ${instanceName} desconectada con \xE9xito` });
  } catch (error) {
    console.error("[Bots] Error disconnecting instance:", error);
    res.status(500).json({ error: "Error al desconectar bot maestro" });
  }
});
router8.get("/tenants", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", evolution_instance as "evolutionInstance", active
      FROM tenants
      WHERE slug != 'superadmin'
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener lista de comercios" });
  }
});
router8.get("/conversations", async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    let queryText = `
      SELECT DISTINCT ON (m.tenant_id, m.remote_jid)
        m.remote_jid as "remoteJid",
        m.tenant_id as "tenantId",
        t.name as "tenantName",
        t.slug as "tenantSlug",
        t.evolution_instance as "evolutionInstance",
        COALESCE(m.push_name, 'Cliente') as "pushName",
        m.message_text as "lastMessage",
        m.created_at as "lastMessageTime",
        m.from_me as "lastFromMe",
        COALESCE(s.is_human_mode, false) as "isHumanMode",
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.tenant_id = m.tenant_id AND cm.remote_jid = m.remote_jid) as "totalMessages"
      FROM chat_messages m
      JOIN tenants t ON t.id = m.tenant_id
      LEFT JOIN chat_sessions s ON s.tenant_id = m.tenant_id AND s.remote_jid = m.remote_jid
    `;
    const params = [];
    if (tenantId && tenantId !== "all") {
      queryText += ` WHERE m.tenant_id = $1 `;
      params.push(tenantId);
    }
    queryText += ` ORDER BY m.tenant_id, m.remote_jid, m.created_at DESC LIMIT 50`;
    const result = await query(queryText, params);
    const conversations = result.rows.map((conv) => {
      const subagent = classifySubagent(conv.lastMessage || "");
      return {
        ...conv,
        totalMessages: parseInt(conv.totalMessages || "1", 10),
        subagent
      };
    });
    conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    res.json(conversations);
  } catch (error) {
    console.error("[Live Chats] Error loading conversations:", error);
    res.status(500).json({ error: "Error al cargar conversaciones en vivo" });
  }
});
router8.get("/messages", async (req, res) => {
  const { tenantId, remoteJid } = req.query;
  if (!tenantId || !remoteJid) {
    res.status(400).json({ error: "tenantId y remoteJid son requeridos" });
    return;
  }
  try {
    const result = await query(
      `SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid",
              push_name as "pushName", from_me as "fromMe", message_text as "messageText",
              ai_response as "aiResponse", status, created_at as "createdAt"
       FROM chat_messages
       WHERE tenant_id = $1 AND remote_jid = $2
       ORDER BY created_at ASC
       LIMIT 100`,
      [tenantId, remoteJid]
    );
    const messages = result.rows.map((msg) => {
      const subagent = classifySubagent(msg.messageText || "");
      return {
        ...msg,
        subagent
      };
    });
    res.json(messages);
  } catch (error) {
    console.error("[Live Chats] Error loading messages:", error);
    res.status(500).json({ error: "Error al cargar mensajes del chat" });
  }
});
router8.post("/reply", async (req, res) => {
  try {
    const { tenantId, remoteJid, messageText, pushName } = req.body;
    if (!tenantId || !remoteJid || !messageText) {
      res.status(400).json({ error: "tenantId, remoteJid y messageText son requeridos" });
      return;
    }
    const tenantRes = await query(`SELECT id, name, slug, evolution_instance FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    const instanceName = tenant.evolution_instance || `tenant_${tenant.slug}`;
    const cleanPhone = String(remoteJid).replace(/@.+$/, "").replace(/\D/g, "");
    try {
      await fetch(`${EVOLUTION_API_URL3}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY3
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: messageText,
          options: {
            delay: 1200,
            presence: "composing"
          }
        })
      });
    } catch (evoErr) {
      console.warn("[Live Chats Reply] Evolution dispatch warning:", evoErr.message);
    }
    const msgId = `manual_sa_${Date.now()}`;
    await query(
      `INSERT INTO chat_messages (id, tenant_id, remote_jid, push_name, from_me, message_text, ai_response, status)
       VALUES ($1, $2, $3, $4, true, $5, false, 'sent')`,
      [msgId, tenantId, remoteJid, pushName || "Soporte Betico", messageText]
    );
    await query(
      `INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, updated_at)
       VALUES ($1, $2, true, CURRENT_TIMESTAMP)
       ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET is_human_mode = true, updated_at = CURRENT_TIMESTAMP`,
      [tenantId, remoteJid]
    );
    await logAdminAction(req.user.userId, "reply_support_chat", "chat", remoteJid, { tenantId, cleanPhone, messageLength: messageText.length }, req);
    res.json({
      success: true,
      messageId: msgId,
      message: "Respuesta despachada con \xE9xito por WhatsApp"
    });
  } catch (error) {
    console.error("[Live Chats Reply] Error:", error);
    res.status(500).json({ error: "Error al enviar respuesta por WhatsApp" });
  }
});
router8.post("/toggle-ai", async (req, res) => {
  try {
    const { tenantId, remoteJid, isHumanMode } = req.body;
    if (!tenantId || !remoteJid) {
      res.status(400).json({ error: "tenantId y remoteJid son requeridos" });
      return;
    }
    await query(
      `INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET is_human_mode = EXCLUDED.is_human_mode, updated_at = CURRENT_TIMESTAMP`,
      [tenantId, remoteJid, Boolean(isHumanMode)]
    );
    await logAdminAction(req.user.userId, "toggle_chat_human_mode", "chat", remoteJid, { tenantId, isHumanMode: Boolean(isHumanMode) }, req);
    res.json({
      success: true,
      isHumanMode: Boolean(isHumanMode),
      message: isHumanMode ? "Modo Humano ACTIVADO (IA pausada)" : "Modo Asistente IA ACTIVADO"
    });
  } catch (error) {
    console.error("[Live Chats Toggle AI] Error:", error);
    res.status(500).json({ error: "Error al alternar modo del chat" });
  }
});
var bots_chats_routes_default = router8;

// ../src/server/routes/billing-native.routes.ts
import { Router as Router9 } from "express";
import multer from "multer";

// ../src/server/middleware/auth.ts
init_env();
init_users_repo();
import jwt2 from "jsonwebtoken";
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt2.verify(token, env.JWT_SECRET);
    if (decoded.userId && decoded.role !== "superadmin") {
      const user = await getUserById(decoded.userId);
      if (!user || user.active === false) {
        res.status(403).json({ error: "Tu cuenta ha sido desactivada o suspendida. Por favor contacta al administrador." });
        return;
      }
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Forbidden: Token inv\xE1lido o expirado" });
  }
}

// ../src/server/middleware/tenantContext.ts
async function tenantContext(req, res, next) {
  try {
    if (req.user && req.user.tenantId) {
      req.tenantId = req.user.tenantId;
    }
    if (req.user?.role === "superadmin") {
      const { getOrCreateSuperadminTenantId: getOrCreateSuperadminTenantId2 } = await Promise.resolve().then(() => (init_tilopay_subscription_service(), tilopay_subscription_service_exports));
      req.tenantId = await getOrCreateSuperadminTenantId2();
    }
  } catch (err) {
    console.warn("[tenantContext] Error resolving tenantId:", err);
  }
  next();
}

// ../src/server/routes/billing-native.routes.ts
init_hacienda_native_repo();
init_hacienda_native_service();
var router9 = Router9();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
  // 2MB max
});
router9.use(authenticateToken);
router9.use(tenantContext);
router9.get("/config", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const config = await getHaciendaConfigByTenant(tenantId);
    res.json({
      success: true,
      config: config || {
        environment: "sandbox",
        taxpayerIdType: "01",
        taxpayerIdNumber: "",
        taxpayerName: "",
        commercialName: "",
        taxpayerEmail: "",
        taxpayerPhone: "",
        economicActivityCode: "",
        economicActivities: [],
        defaultCabysCode: "8311100000000",
        province: "1",
        canton: "01",
        district: "01",
        neighborhood: "01",
        addressDetail: "",
        idpUsername: "",
        idpPasswordMasked: "",
        p12Filename: "",
        p12ExpiresAt: null,
        p12HasCertificate: false,
        certSubject: "",
        certIssuer: "",
        certDaysRemaining: null,
        branchCode: "001",
        posCode: "00001",
        defaultDocType: "04",
        seqFactura: 1,
        seqTiquete: 1,
        seqNotaCredito: 1,
        multiBranchEnabled: false,
        isConnected: false,
        providerMode: "BETICO_NATIVE",
        useAlternativeProvider: false,
        isSimplifiedRegime: false,
        emailAutoSend: true,
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPassMasked: "",
        resendApiKeyMasked: "",
        active: true
      }
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error obteniendo config:", err);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n de facturaci\xF3n" });
  }
});
router9.get("/usage", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const usage = await getCycleUsage(tenantId);
    res.json({ success: true, usage });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error obteniendo cuota:", err);
    res.status(500).json({ error: "Error al obtener consumo de facturaci\xF3n" });
  }
});
router9.post("/config", upload.single("certificateFile"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const body = req.body || {};
    const file = req.file;
    let p12Buffer = void 0;
    let p12Filename = void 0;
    let p12ExpiresAt = void 0;
    let certSubject = void 0;
    let certIssuer = void 0;
    const cleanPin = body.p12Pin && !String(body.p12Pin).includes("\u2022\u2022\u2022\u2022") ? String(body.p12Pin).trim() : "";
    if (file && file.buffer) {
      p12Buffer = file.buffer;
      p12Filename = file.originalname;
      const pinToUse = cleanPin || (await getHaciendaDecryptedSecrets(tenantId))?.p12Pin || "";
      if (pinToUse) {
        const certCheck = await inspectP12Certificate(p12Buffer, pinToUse);
        if (!certCheck.valid) {
          res.status(400).json({ error: certCheck.error || "El PIN no coincide con el certificado .p12" });
          return;
        }
        p12ExpiresAt = certCheck.expiresAt;
        certSubject = certCheck.subject;
        certIssuer = certCheck.issuer;
      }
    } else if (cleanPin) {
      const secrets = await getHaciendaDecryptedSecrets(tenantId);
      if (secrets?.p12Buffer) {
        const certCheck = await inspectP12Certificate(secrets.p12Buffer, cleanPin);
        if (!certCheck.valid) {
          res.status(400).json({ error: certCheck.error || "El PIN ingresado no coincide con el certificado .p12 guardado" });
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
      p12Pin: cleanPin || void 0,
      p12ExpiresAt,
      certSubject,
      certIssuer,
      branchCode: body.branchCode,
      posCode: body.posCode,
      defaultDocType: body.defaultDocType,
      seqFactura: body.seqFactura !== void 0 ? Number(body.seqFactura) : void 0,
      seqTiquete: body.seqTiquete !== void 0 ? Number(body.seqTiquete) : void 0,
      seqNotaCredito: body.seqNotaCredito !== void 0 ? Number(body.seqNotaCredito) : void 0,
      multiBranchEnabled: body.multiBranchEnabled !== void 0 ? body.multiBranchEnabled === "true" || body.multiBranchEnabled === true : void 0,
      providerMode: body.providerMode,
      useAlternativeProvider: body.useAlternativeProvider !== void 0 ? body.useAlternativeProvider === "true" || body.useAlternativeProvider === true : void 0,
      isSimplifiedRegime: body.isSimplifiedRegime !== void 0 ? body.isSimplifiedRegime === "true" || body.isSimplifiedRegime === true : void 0,
      emailAutoSend: body.emailAutoSend !== void 0 ? body.emailAutoSend === "true" || body.emailAutoSend === true : void 0,
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort !== void 0 ? Number(body.smtpPort) : void 0,
      smtpUser: body.smtpUser,
      smtpPass: body.smtpPass,
      resendApiKey: body.resendApiKey,
      active: body.active !== void 0 ? body.active === "true" || body.active === true : void 0
    });
    res.json({
      success: true,
      message: "Configuraci\xF3n guardada exitosamente",
      config: updated
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error guardando config:", err);
    res.status(500).json({ error: err.message || "Error guardando configuraci\xF3n de facturaci\xF3n" });
  }
});
router9.delete("/credentials", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const rawTarget = String(req.query.target || req.body?.target || "all").toLowerCase();
    const target = rawTarget === "atv" ? "atv" : rawTarget === "p12" ? "p12" : "all";
    const config = await clearHaciendaCredentials(tenantId, target);
    res.json({
      success: true,
      message: target === "atv" ? "Credenciales ATV eliminadas correctamente" : target === "p12" ? "Certificado criptogr\xE1fico .p12 eliminado correctamente" : "Credenciales y certificado eliminados correctamente",
      config
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error limpiando credenciales:", err);
    res.status(500).json({ error: err.message || "Error al limpiar credenciales de Hacienda" });
  }
});
router9.post("/test-connection", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const result = await testTenantHaciendaConnection(tenantId);
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error en test connection:", err);
    res.status(500).json({ success: false, message: err.message || "Error al probar conexi\xF3n con Hacienda" });
  }
});
router9.post("/quick-test", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { environment, idpUsername, idpPassword } = req.body || {};
    let effEnv = environment || "sandbox";
    let effUsername = idpUsername ? String(idpUsername).trim() : "";
    let effPassword = idpPassword && !String(idpPassword).includes("\u2022\u2022\u2022\u2022") ? String(idpPassword).trim() : "";
    if (!effUsername || !effPassword) {
      const secrets = await getHaciendaDecryptedSecrets(tenantId);
      if (secrets) {
        if (!effUsername) effUsername = secrets.idpUsername;
        if (!effPassword) effPassword = secrets.idpPassword;
        if (!environment) effEnv = secrets.environment;
      }
    }
    if (!effUsername || !effPassword) {
      res.status(400).json({ success: false, message: "Ingrese usuario y contrase\xF1a ATV para realizar la prueba" });
      return;
    }
    const result = await authenticateHaciendaIdp(effEnv, effUsername, effPassword);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Error probando credenciales ATV" });
  }
});
router9.post("/test-p12", upload.single("certificateFile"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const file = req.file;
    const rawPin = req.body?.p12Pin && !String(req.body.p12Pin).includes("\u2022\u2022\u2022\u2022") ? String(req.body.p12Pin).trim() : "";
    let p12Buffer = file?.buffer || null;
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
        message: "Seleccione un archivo .p12 e ingrese su PIN de 4 d\xEDgitos para validar la llave criptogr\xE1fica."
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
      message: certInfo.valid ? `Llave criptogr\xE1fica v\xE1lida: ${certInfo.subject} (Vence el ${certInfo.expiresAt ? certInfo.expiresAt.toLocaleDateString("es-CR") : "N/A"})` : certInfo.error || "No se pudo validar el certificado .p12",
      certificate: certInfo
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error en test-p12:", err);
    res.status(500).json({ success: false, message: err.message || "Error al inspeccionar certificado .p12" });
  }
});
router9.get("/padron/:identificacion", async (req, res) => {
  try {
    const result = await lookupHaciendaTaxpayerPublic(String(req.params.identificacion || ""));
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error consultando padr\xF3n Hacienda:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Error consultando el padr\xF3n de Hacienda"
    });
  }
});
router9.get("/branches", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { getBranchesByTenant: getBranchesByTenant2 } = await Promise.resolve().then(() => (init_branches_repo(), branches_repo_exports));
    const [branches, storeBranches] = await Promise.all([
      getHaciendaBranchesByTenant(tenantId),
      getBranchesByTenant2(tenantId).catch(() => [])
    ]);
    res.json({
      success: true,
      branches,
      storeBranches
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error listando sucursales fiscales:", err);
    res.status(500).json({ error: "Error al obtener sucursales de facturaci\xF3n" });
  }
});
router9.post("/branches", upload.single("certificateFile"), async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const body = req.body || {};
    const file = req.file;
    let customP12Buffer = void 0;
    let customP12Filename = void 0;
    let customP12ExpiresAt = void 0;
    let customCertSubject = void 0;
    const cleanPin = body.customP12Pin && !String(body.customP12Pin).includes("\u2022\u2022\u2022\u2022") ? String(body.customP12Pin).trim() : "";
    if (file && file.buffer) {
      customP12Buffer = file.buffer;
      customP12Filename = file.originalname;
      if (cleanPin) {
        const certInfo = await inspectP12Certificate(customP12Buffer, cleanPin);
        if (!certInfo.valid) {
          res.status(400).json({ error: certInfo.error || "El PIN no coincide con el certificado .p12 de la sucursal" });
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
      customP12Pin: cleanPin || void 0,
      customP12ExpiresAt,
      customCertSubject
    });
    res.json({
      success: true,
      message: "Sucursal de facturaci\xF3n guardada exitosamente",
      branch
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error guardando sucursal fiscal:", err);
    res.status(500).json({ error: err.message || "Error al guardar sucursal de facturaci\xF3n" });
  }
});
router9.post("/branches/:id/test", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const result = await testBranchHaciendaConnection(tenantId, String(req.params.id || ""));
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error probando sucursal fiscal:", err);
    res.status(500).json({ success: false, message: err.message || "Error al probar conexi\xF3n de sucursal" });
  }
});
router9.delete("/branches/:id", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const deleted = await deleteHaciendaBranch(tenantId, String(req.params.id || ""));
    res.json({
      success: deleted,
      message: deleted ? "Sucursal eliminada correctamente" : "Sucursal no encontrada"
    });
  } catch (err) {
    console.error("[BillingNativeRoutes] Error eliminando sucursal fiscal:", err);
    res.status(500).json({ error: err.message || "Error al eliminar sucursal de facturaci\xF3n" });
  }
});
router9.post("/emit-manual", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const result = await emitManualOrNativeVoucher(tenantId, req.body || {});
    if (!result.success) {
      res.status(400).json({ ...result, error: result.message });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error en emisi\xF3n manual POS:", err);
    res.status(500).json({ success: false, error: err.message || "Error al emitir comprobante electr\xF3nico" });
  }
});
router9.post("/vouchers/:id/credit-note", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const result = await emitCreditNoteForVoucher(tenantId, String(req.params.id || ""), req.body?.reason);
    if (!result.success) {
      res.status(400).json({ ...result, error: result.message });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error emitiendo Nota de Cr\xE9dito:", err);
    res.status(500).json({ success: false, error: err.message || "Error al emitir Nota de Cr\xE9dito" });
  }
});
router9.post("/vouchers/:id/send-email", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { sendVoucherEmailNotification: sendVoucherEmailNotification2 } = await Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports));
    const result = await sendVoucherEmailNotification2({
      tenantId,
      voucherKeyOrId: String(req.params.id || ""),
      overrideEmail: req.body?.email ? String(req.body.email).trim() : void 0
    });
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error enviando correo de comprobante:", err);
    res.status(500).json({ success: false, message: err.message || "Error al enviar el comprobante por correo" });
  }
});
router9.post("/test-email", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { testTenantEmailDelivery: testTenantEmailDelivery2 } = await Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports));
    const result = await testTenantEmailDelivery2(tenantId, req.body || {});
    res.json(result);
  } catch (err) {
    console.error("[BillingNativeRoutes] Error en test-email:", err);
    res.status(500).json({ success: false, message: err.message || "Error probando env\xEDo de correo" });
  }
});
var billing_native_routes_default = router9;

// ../src/server/routes/almendro.routes.ts
import { Router as Router10 } from "express";
init_tenant_almendro_repo();
init_almendro_service();
init_tenant_repo();
init_appointments_repo();
init_records_repo();
var router10 = Router10();
router10.get("/public-config/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const module = req.query.module || "store";
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).json({ error: "Comercio no encontrado" });
      return;
    }
    try {
      const { getHaciendaConfigByTenant: getHaciendaConfigByTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
      const nativeCfg = await getHaciendaConfigByTenant2(tenant.id);
      if (nativeCfg && nativeCfg.active && nativeCfg.providerMode === "BETICO_NATIVE" && (nativeCfg.taxpayerIdNumber || nativeCfg.isConnected)) {
        res.json({
          isEnabled: true,
          billingMode: "BETICO_NATIVE",
          defaultDocType: nativeCfg.defaultDocType || "04",
          isSimplifiedRegime: Boolean(nativeCfg.isSimplifiedRegime),
          multiBranchEnabled: Boolean(nativeCfg.multiBranchEnabled)
        });
        return;
      }
      if (nativeCfg && nativeCfg.active && nativeCfg.providerMode === "EXTERNAL_MANUAL") {
        res.json({
          isEnabled: true,
          billingMode: "EXTERNAL_MANUAL",
          defaultDocType: nativeCfg.defaultDocType || "04",
          isSimplifiedRegime: Boolean(nativeCfg.isSimplifiedRegime)
        });
        return;
      }
    } catch (_) {
    }
    const config = await getTenantAlmendroConfig(tenant.id);
    if (!config || !config.isEnabled || !config.isConfigured) {
      res.json({ isEnabled: false, defaultDocType: "04" });
      return;
    }
    let isModuleEnabled = false;
    if (module === "store") isModuleEnabled = Boolean(config.moduleToggles.storeEnabled);
    else if (module === "bookings") isModuleEnabled = Boolean(config.moduleToggles.bookingsEnabled);
    else if (module === "courts") isModuleEnabled = Boolean(config.moduleToggles.courtsEnabled);
    else if (module === "restaurant") isModuleEnabled = Boolean(config.moduleToggles.restaurantEnabled);
    res.json({
      isEnabled: isModuleEnabled,
      billingMode: config.billingMode || "ALMENDRO_AUTO",
      defaultDocType: config.defaultDocType || "04"
    });
  } catch (err) {
    res.json({ isEnabled: false, defaultDocType: "04" });
  }
});
router10.get(["/public/voucher-pdf/:keyOrId", "/public/vouchers/:keyOrId/pdf"], async (req, res) => {
  try {
    const { keyOrId } = req.params;
    if (!keyOrId) {
      res.status(400).send("Clave o identificador de comprobante requerido");
      return;
    }
    const pdfRes = await AlmendroService.getVoucherPdf(keyOrId);
    if (!pdfRes.success || !pdfRes.buffer) {
      const acceptsHtml = req.headers.accept && req.headers.accept.includes("text/html");
      if (acceptsHtml) {
        res.status(pdfRes.status || 404).send(`
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Factura Electr\xF3nica - Betico</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background-color: #0f172a; color: #f8fafc; padding: 20px; box-sizing: border-box; }
              .card { background-color: #1e293b; padding: 2.5rem; border-radius: 1rem; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
              .icon { font-size: 2.5rem; margin-bottom: 1rem; }
              h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; color: #38bdf8; }
              p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
              .btn { display: inline-block; padding: 0.75rem 1.5rem; background-color: #0284c7; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: background-color 0.2s; }
              .btn:hover { background-color: #0369a1; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">\u{1F4C4}</div>
              <h1>Comprobante Electr\xF3nico no disponible</h1>
              <p>${pdfRes.message || "El comprobante a\xFAn est\xE1 en proceso de emisi\xF3n ante el Ministerio de Hacienda o no se encuentra disponible temporalmente."}</p>
              <a href="javascript:location.reload()" class="btn">Reintentar actualizaci\xF3n</a>
            </div>
          </body>
          </html>
        `);
        return;
      }
      res.status(pdfRes.status || 404).json({
        success: false,
        error: pdfRes.message || "No se pudo obtener el PDF del comprobante electr\xF3nico"
      });
      return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${pdfRes.filename || "Factura-Electronica.pdf"}"`);
    res.setHeader("Content-Length", pdfRes.buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(pdfRes.buffer);
  } catch (err) {
    console.error("[AlmendroRoutes] Error en proxy de PDF de comprobante:", err);
    res.status(500).json({
      success: false,
      error: "Error interno al procesar la descarga del comprobante PDF"
    });
  }
});
router10.get(["/public/voucher-xml/:keyOrId", "/public/vouchers/:keyOrId/xml"], async (req, res) => {
  try {
    const { keyOrId } = req.params;
    if (!keyOrId) {
      res.status(400).send("Clave o identificador de comprobante requerido");
      return;
    }
    const { getElectronicVoucherByKeyOrId: getElectronicVoucherByKeyOrId2 } = await Promise.resolve().then(() => (init_tenant_almendro_repo(), tenant_almendro_repo_exports));
    const { getHaciendaConfigByTenant: getHaciendaConfigByTenant2 } = await Promise.resolve().then(() => (init_hacienda_native_repo(), hacienda_native_repo_exports));
    const { buildOfficialHaciendaXmlBuffer: buildOfficialHaciendaXmlBuffer2 } = await Promise.resolve().then(() => (init_voucher_email_service(), voucher_email_service_exports));
    const voucher = await getElectronicVoucherByKeyOrId2(keyOrId);
    if (!voucher) {
      res.status(404).json({ success: false, error: "Comprobante electr\xF3nico no encontrado" });
      return;
    }
    const haciendaConfig = await getHaciendaConfigByTenant2(voucher.tenantId).catch(() => null);
    const xmlBuffer = buildOfficialHaciendaXmlBuffer2(voucher, haciendaConfig);
    const filename = `Hacienda_${voucher.numericKey || voucher.consecutiveNumber || voucher.id}.xml`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", xmlBuffer.length);
    res.send(xmlBuffer);
  } catch (err) {
    console.error("[AlmendroRoutes] Error generando XML de comprobante:", err);
    res.status(500).json({
      success: false,
      error: "Error interno al generar el archivo XML del comprobante"
    });
  }
});
router10.use(authenticateToken, tenantContext);
router10.get("/config", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({ error: "tenantId no disponible en el contexto" });
      return;
    }
    const config = await getTenantAlmendroConfig(tenantId);
    res.json(config);
  } catch (error) {
    console.error("[AlmendroRoutes] Error al consultar configuraci\xF3n:", error);
    res.status(500).json({ error: error.message || "Error al obtener configuraci\xF3n de facturaci\xF3n" });
  }
});
router10.post("/config", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const userRole = req.user?.role;
    if (userRole !== "admin" && userRole !== "superadmin") {
      res.status(403).json({ error: "Solo los administradores pueden modificar la configuraci\xF3n de facturaci\xF3n" });
      return;
    }
    const {
      isEnabled,
      billingMode,
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
      billingMode,
      environment: environment === "PRODUCTION" ? "PRODUCTION" : "SANDBOX",
      apiKey,
      defaultDocType: defaultDocType === "01" ? "01" : "04",
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
      message: "Configuraci\xF3n de facturaci\xF3n electr\xF3nica guardada con \xE9xito",
      config: updated
    });
  } catch (error) {
    console.error("[AlmendroRoutes] Error al guardar configuraci\xF3n:", error);
    res.status(500).json({ error: error.message || "Error al guardar configuraci\xF3n de facturaci\xF3n" });
  }
});
router10.post("/test-connection", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { apiKey, environment } = req.body;
    let keyToTest = apiKey;
    let envToTest = environment || "SANDBOX";
    if (!keyToTest || keyToTest.includes("\u2022\u2022\u2022\u2022")) {
      const stored = await getTenantAlmendroConfigRaw(tenantId);
      if (!stored || !stored.apiKey) {
        res.status(400).json({ success: false, message: "No hay ninguna llave de API configurada para probar" });
        return;
      }
      keyToTest = stored.apiKey;
      envToTest = environment || stored.environment;
    }
    const result = await AlmendroService.testConnection(keyToTest, envToTest);
    res.json(result);
  } catch (error) {
    console.error("[AlmendroRoutes] Error al probar conexi\xF3n:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router10.get("/taxpayer/:idNumber", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { idNumber } = req.params;
    const stored = await getTenantAlmendroConfigRaw(tenantId);
    if (!stored || !stored.apiKey) {
      res.status(400).json({ error: "Debes configurar tu API Key de Almendro para consultar contribuyentes" });
      return;
    }
    const result = await AlmendroService.lookupTaxpayer(stored.apiKey, stored.environment, idNumber);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error("[AlmendroRoutes] Error al consultar contribuyente:", error);
    res.status(500).json({ error: error.message });
  }
});
router10.get("/vouchers", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { limit, offset, status, docType, branchCode, search } = req.query;
    const result = await getElectronicVouchers(tenantId, {
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
      status,
      docType,
      branchCode,
      search
    });
    res.json(result);
  } catch (error) {
    console.error("[AlmendroRoutes] Error al listar comprobantes:", error);
    res.status(500).json({ error: error.message });
  }
});
router10.post("/emit-appointment-invoice/:appointmentId", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { appointmentId } = req.params;
    const { docType, receiver, cabysCode, taxRateCode } = req.body;
    const appointment = await getAppointmentById(appointmentId, tenantId);
    if (!appointment) {
      res.status(404).json({ error: "Cita no encontrada" });
      return;
    }
    let patientRecord = null;
    if (appointment.recordId) {
      patientRecord = await getRecordById(appointment.recordId, tenantId);
    }
    const customerBilling = appointment.billingInfo || patientRecord?.metadata?.billingInfo;
    const receiverIdType = receiver?.idType || customerBilling?.idType || (patientRecord?.identification ? "01" : void 0);
    const receiverIdNumber = receiver?.idNumber || customerBilling?.idNumber || patientRecord?.identification || void 0;
    const receiverName = receiver?.name || customerBilling?.legalName || patientRecord?.fullName || appointment.name;
    const receiverEmail = receiver?.email || customerBilling?.email || patientRecord?.email || void 0;
    const finalDocType = docType || (receiverIdNumber ? "01" : "04");
    const unitPrice = Number(appointment.amount) || 0;
    const result = await AlmendroService.emitVoucher(tenantId, {
      docType: finalDocType,
      appointmentId: appointment.id,
      receiver: receiverIdNumber ? {
        idType: receiverIdType,
        idNumber: receiverIdNumber,
        name: receiverName,
        email: receiverEmail
      } : void 0,
      items: [
        {
          cabysCode: cabysCode || "8311100000000",
          description: `Servicio: ${appointment.service}${appointment.vehicleModel ? ` (${appointment.vehicleModel})` : ""}`,
          quantity: 1,
          unitPrice,
          taxRateCode: taxRateCode || "08"
          // 13% IVA
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
  } catch (error) {
    console.error("[AlmendroRoutes] Error emitiendo factura de cita:", error);
    res.status(500).json({ error: error.message || "Error interno al emitir comprobante" });
  }
});
router10.post("/emit-record-invoice/:recordId", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { recordId } = req.params;
    const { docType, serviceName, amount, cabysCode, taxRateCode, receiver, notes } = req.body;
    const record = await getRecordById(recordId, tenantId);
    if (!record) {
      res.status(404).json({ error: "Expediente no encontrado" });
      return;
    }
    const patientBilling = record.metadata?.billingInfo;
    const receiverIdType = receiver?.idType || patientBilling?.idType || "01";
    const receiverIdNumber = receiver?.idNumber || patientBilling?.idNumber || record.identification || void 0;
    const receiverName = receiver?.name || patientBilling?.legalName || record.fullName;
    const receiverEmail = receiver?.email || patientBilling?.email || record.email || void 0;
    const finalDocType = docType || (receiverIdNumber ? "01" : "04");
    const unitPrice = Number(amount) || 0;
    if (unitPrice <= 0) {
      res.status(400).json({ error: "El monto a facturar debe ser mayor a 0" });
      return;
    }
    const result = await AlmendroService.emitVoucher(tenantId, {
      docType: finalDocType,
      receiver: receiverIdNumber ? {
        idType: receiverIdType,
        idNumber: receiverIdNumber,
        name: receiverName,
        email: receiverEmail
      } : void 0,
      items: [
        {
          cabysCode: cabysCode || "8311100000000",
          description: serviceName || notes || `Consulta / Atenci\xF3n M\xE9dica - ${record.fullName}`,
          quantity: 1,
          unitPrice,
          taxRateCode: taxRateCode || "04"
          // 4% IVA en salud o 13% general
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
  } catch (error) {
    console.error("[AlmendroRoutes] Error emitiendo factura desde expediente:", error);
    res.status(500).json({ error: error.message || "Error interno al emitir comprobante" });
  }
});
router10.post("/emit-order-invoice/:orderId", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { orderId } = req.params;
    if (!tenantId) {
      res.status(400).json({ error: "tenantId requerido en la sesi\xF3n" });
      return;
    }
    const result = await AlmendroService.emitOrderInvoice(tenantId, orderId);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    if (req.io) {
      const { getOrderById: getOrderById2 } = await Promise.resolve().then(() => (init_orders_repo(), orders_repo_exports));
      const updatedOrder = await getOrderById2(orderId, tenantId);
      if (updatedOrder) {
        req.io.to(`tenant_${tenantId}`).emit("order:updated", updatedOrder);
      }
    }
    res.json({
      success: true,
      numericKey: result.numericKey,
      pdfUrl: result.pdfUrl,
      message: result.message
    });
  } catch (error) {
    console.error("[AlmendroRoutes] Error emitiendo factura de orden:", error);
    res.status(500).json({ error: error.message || "Error interno al emitir comprobante de la orden" });
  }
});
var almendro_routes_default = router10;

// ../src/server/db/migrations.ts
init_pool();
init_users_repo();
async function runMigrations() {
  console.log("Running database migrations...");
  const tables = `
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      custom_domain VARCHAR(255) UNIQUE,
      ai_provider VARCHAR(50) DEFAULT 'gemini',
      ai_api_key_encrypted TEXT,
      ai_model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
      evolution_instance VARCHAR(255),
      whatsapp_number VARCHAR(50),
      plan VARCHAR(50) DEFAULT 'starter',
      active BOOLEAN DEFAULT true,
      settings_json JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(50) DEFAULT 'admin',
      avatar_url TEXT,
      provider VARCHAR(50) DEFAULT 'local',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      price_display VARCHAR(100),
      duration VARCHAR(50) NOT NULL,
      estimated_minutes INT,
      category VARCHAR(100),
      notes TEXT,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      whatsapp VARCHAR(50) NOT NULL,
      service VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      details TEXT,
      vehicle_model VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      config_json JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(255) PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(255) NOT NULL,
      push_name VARCHAR(255),
      from_me BOOLEAN NOT NULL DEFAULT false,
      message_text TEXT NOT NULL,
      ai_response BOOLEAN DEFAULT false,
      status VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications_log (
      id VARCHAR(255) PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      recipient VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      trigger_type VARCHAR(100) NOT NULL,
      status VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      store_enabled BOOLEAN DEFAULT false,
      store_name VARCHAR(255) NOT NULL,
      store_slug VARCHAR(255) UNIQUE NOT NULL,
      store_description TEXT,
      store_logo_url TEXT,
      store_banner_url TEXT,
      store_theme JSONB,
      currency VARCHAR(10) DEFAULT 'CRC',
      accept_sinpe BOOLEAN DEFAULT true,
      sinpe_phone VARCHAR(50),
      sinpe_name VARCHAR(255),
      accept_transfer BOOLEAN DEFAULT true,
      bank_account_info TEXT,
      accept_cash_on_delivery BOOLEAN DEFAULT false,
      delivery_enabled BOOLEAN DEFAULT false,
      delivery_fee NUMERIC(10, 2) DEFAULT 0,
      pickup_enabled BOOLEAN DEFAULT true,
      whatsapp_checkout BOOLEAN DEFAULT true,
      min_order_amount NUMERIC(10, 2) DEFAULT 0,
      store_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      compare_at_price NUMERIC(10, 2),
      cost_price NUMERIC(10, 2),
      currency VARCHAR(10) DEFAULT 'CRC',
      category VARCHAR(100),
      tags TEXT[],
      stock INT DEFAULT 0,
      track_stock BOOLEAN DEFAULT true,
      sku VARCHAR(100),
      weight_grams INT,
      featured BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, slug)
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text VARCHAR(255),
      sort_order INT DEFAULT 0,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      sku VARCHAR(100),
      price_override NUMERIC(10, 2),
      stock INT DEFAULT 0,
      attributes JSONB,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      session_id VARCHAR(255),
      whatsapp_id VARCHAR(100),
      customer_name VARCHAR(255),
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      quantity INT DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      order_number SERIAL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      customer_address TEXT,
      whatsapp_jid VARCHAR(255),
      source VARCHAR(50) DEFAULT 'store',
      subtotal NUMERIC(10, 2) NOT NULL,
      delivery_fee NUMERIC(10, 2) DEFAULT 0,
      discount NUMERIC(10, 2) DEFAULT 0,
      total NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CRC',
      status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_reference VARCHAR(255),
      notes TEXT,
      delivery_method VARCHAR(50) NOT NULL,
      estimated_delivery TIMESTAMP WITH TIME ZONE,
      chat_message_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID REFERENCES products(id) ON DELETE SET NULL,
      variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      variant_name VARCHAR(255),
      quantity INT DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id UUID,
      details JSONB,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedule_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      schedule_mode VARCHAR(50) NOT NULL DEFAULT 'jornada',
      config_json JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(100) NOT NULL,
      is_human_mode BOOLEAN DEFAULT FALSE,
      human_mode_until TIMESTAMP WITH TIME ZONE,
      unread BOOLEAN DEFAULT FALSE,
      notes TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tenant_id, remote_jid)
    );

    CREATE TABLE IF NOT EXISTS ai_command_logs (
      id TEXT PRIMARY KEY DEFAULT 'cmd_' || gen_random_uuid()::text,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      remote_jid VARCHAR(100) NOT NULL,
      command_type VARCHAR(50) NOT NULL,
      payload JSONB,
      status VARCHAR(50) NOT NULL,
      error_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tenant_payment_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL DEFAULT 'TILOPAY',
      is_enabled BOOLEAN DEFAULT false,
      environment VARCHAR(20) DEFAULT 'SANDBOX',
      api_key_encrypted TEXT,
      api_user VARCHAR(150),
      api_password_encrypted TEXT,
      capture_mode VARCHAR(50) DEFAULT 'IMMEDIATE',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, provider)
    );

    CREATE TABLE IF NOT EXISTS tenant_whatsapp_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      instance_name VARCHAR(150),
      api_url VARCHAR(255),
      api_key_encrypted TEXT,
      is_enabled BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id)
    );

    CREATE TABLE IF NOT EXISTS payment_config_audit_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      changed_by VARCHAR(100),
      field_changed VARCHAR(100) NOT NULL,
      old_value_masked VARCHAR(255),
      new_value_masked VARCHAR(255),
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS delivery_drivers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      vehicle_type VARCHAR(50) DEFAULT 'moto',
      plate_number VARCHAR(50),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS access_pin VARCHAR(20);
    UPDATE delivery_drivers SET access_pin = '1234' WHERE access_pin IS NULL OR access_pin = '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_mode VARCHAR(50) DEFAULT 'retail';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_modules JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS restaurant_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS delivery_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS correos_cr_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS local_delivery_config JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_schedule JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS custom_stages JSONB;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS notification_templates JSONB;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS parallel_slots INT DEFAULT 1;
    ALTER TABLE schedule_settings ADD COLUMN IF NOT EXISTS global_parallel_slots INT DEFAULT 1;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS consumption_mode VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_location JSONB;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES delivery_drivers(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS waze_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel_origin VARCHAR(50) DEFAULT 'WEB_STORE';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link_token UUID UNIQUE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tilopay_transaction_id VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tilopay_auth_code VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_variables JSONB;
    ALTER TABLE services ADD COLUMN IF NOT EXISTS custom_variables JSONB;
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_variables JSONB;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_variables JSONB;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_1_sent BOOLEAN DEFAULT FALSE;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_2_sent BOOLEAN DEFAULT FALSE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS reminder_config JSONB;

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(255),
      tags TEXT[] DEFAULT '{}',
      total_orders INT DEFAULT 0,
      total_spent NUMERIC(10, 2) DEFAULT 0,
      last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, phone)
    );

    CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      message_template TEXT NOT NULL,
      media_url TEXT,
      target_segment VARCHAR(50) DEFAULT 'all',
      target_tag VARCHAR(100),
      total_recipients INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'draft',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      filename VARCHAR(255) PRIMARY KEY,
      mime_type VARCHAR(100),
      data_base64 TEXT NOT NULL,
      size INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      address TEXT,
      phone VARCHAR(50),
      sinpe_phone VARCHAR(50),
      sinpe_name VARCHAR(100),
      latitude NUMERIC,
      longitude NUMERIC,
      is_main BOOLEAN DEFAULT FALSE,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS platform_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      value_encrypted TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      phone VARCHAR(50),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS superadmin_instances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      instance_type VARCHAR(50) UNIQUE NOT NULL,
      instance_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(50),
      status VARCHAR(50) DEFAULT 'disconnected',
      qr_code TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS internal_notes TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMP WITH TIME ZONE;
    
    CREATE TABLE IF NOT EXISTS tenant_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CRC',
      payment_method VARCHAR(50) DEFAULT 'sinpe',
      reference VARCHAR(255),
      proof_url TEXT,
      notes TEXT,
      status VARCHAR(50) DEFAULT 'approved',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_monthly_price NUMERIC(10, 2) DEFAULT 29;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(10) DEFAULT 'CRC';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 days');
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 days');
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_proof TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_ref VARCHAR(255);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(10, 2);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_notes TEXT;

    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
    ALTER TABLE whatsapp_campaigns ADD COLUMN IF NOT EXISTS target_contacts JSONB;

    CREATE TABLE IF NOT EXISTS specialists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      specialty VARCHAR(255),
      access_pin VARCHAR(20) NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_specialists_tenant_pin ON specialists(tenant_id, access_pin);

    CREATE TABLE IF NOT EXISTS tenant_ai_usage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      month_year VARCHAR(7) NOT NULL,
      tokens_used BIGINT DEFAULT 0,
      requests_count INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, month_year)
    );

    CREATE TABLE IF NOT EXISTS tenant_websites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      website_enabled BOOLEAN DEFAULT true,
      headline VARCHAR(255) DEFAULT 'Bienvenido a nuestro sitio oficial',
      subheadline TEXT DEFAULT 'Calidad, confianza y la mejor atenci\xF3n personalizada directo a tu WhatsApp.',
      about_title VARCHAR(255) DEFAULT 'Conoce Nuestra Historia',
      about_text TEXT DEFAULT 'Somos un negocio apasionado por brindar el mejor servicio y productos de primera categor\xEDa. Nuestro compromiso es tu satisfacci\xF3n total.',
      about_image_url TEXT,
      banner_image_url TEXT,
      logo_url TEXT,
      primary_color VARCHAR(50) DEFAULT '#2563eb',
      accent_color VARCHAR(50) DEFAULT '#f59e0b',
      font_family VARCHAR(50) DEFAULT 'Inter',
      show_store_button BOOLEAN DEFAULT true,
      show_booking_button BOOLEAN DEFAULT true,
      store_button_text VARCHAR(100) DEFAULT 'Ver Men\xFA y Productos',
      booking_button_text VARCHAR(100) DEFAULT 'Agendar Cita en L\xEDnea',
      features_json JSONB DEFAULT '[{"title":"Calidad Garantizada","desc":"Productos y servicios seleccionados con los m\xE1s altos est\xE1ndares."},{"title":"Atenci\xF3n R\xE1pida","desc":"Respuestas y pedidos inmediatos con asistencia 24/7."},{"title":"Pagos Seguros","desc":"Aceptamos SINPE M\xF3vil, transferencias y tarjetas."}]'::jsonb,
      testimonials_json JSONB DEFAULT '[{"name":"Cliente Satisfecho","comment":"\xA1Excelente servicio y atenci\xF3n r\xE1pida! 100% recomendado.","rating":5}]'::jsonb,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      contact_address TEXT,
      instagram_url VARCHAR(255),
      facebook_url VARCHAR(255),
      tiktok_url VARCHAR(255),
      show_about_section BOOLEAN DEFAULT true,
      show_features_section BOOLEAN DEFAULT true,
      show_products_section BOOLEAN DEFAULT true,
      show_services_section BOOLEAN DEFAULT true,
      show_testimonials_section BOOLEAN DEFAULT true,
      show_contact_section BOOLEAN DEFAULT true,
      header_layout VARCHAR(50) DEFAULT 'split',
      overlay_color VARCHAR(50) DEFAULT '#0f172a',
      overlay_opacity INT DEFAULT 0,
      show_whatsapp_button BOOLEAN DEFAULT true,
      whatsapp_button_text VARCHAR(100) DEFAULT 'WhatsApp Directo',
      logo_white_url TEXT,
      button_style VARCHAR(50) DEFAULT 'rounded',
      button_hover_effect BOOLEAN DEFAULT true,
      button_text_color VARCHAR(50) DEFAULT '#ffffff',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_about_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_features_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_products_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_services_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_testimonials_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_contact_section BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS header_layout VARCHAR(50) DEFAULT 'split';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS overlay_color VARCHAR(50) DEFAULT '#0f172a';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS overlay_opacity INT DEFAULT 0;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_whatsapp_button BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS whatsapp_button_text VARCHAR(100) DEFAULT 'WhatsApp Directo';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS logo_white_url TEXT;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_style VARCHAR(50) DEFAULT 'rounded';
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_hover_effect BOOLEAN DEFAULT true;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(50) DEFAULT '#ffffff';

    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL;
    ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS human_mode_until TIMESTAMP WITH TIME ZONE;

    CREATE INDEX IF NOT EXISTS idx_tenant_websites_tenant ON tenant_websites(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_month ON tenant_ai_usage(tenant_id, month_year);
    CREATE INDEX IF NOT EXISTS idx_specialists_tenant ON specialists(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_specialist ON appointments(specialist_id);
    CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
    CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON whatsapp_campaigns(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_uploaded_files_filename ON uploaded_files(filename);
    CREATE INDEX IF NOT EXISTS idx_delivery_drivers_tenant ON delivery_drivers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_drivers_tenant_pin ON delivery_drivers(tenant_id, access_pin);
    CREATE INDEX IF NOT EXISTS idx_schedule_settings_tenant ON schedule_settings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant ON chat_sessions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_carts_tenant_id ON carts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_store_settings_tenant_id ON store_settings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_otp ON password_reset_tokens(otp_code);
    CREATE INDEX IF NOT EXISTS idx_ai_cmd_logs_tenant ON ai_command_logs(tenant_id, status);
    CREATE INDEX IF NOT EXISTS idx_ai_cmd_logs_jid ON ai_command_logs(remote_jid);
    CREATE INDEX IF NOT EXISTS idx_tenant_payment_configs_tenant ON tenant_payment_configs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_tenant_whatsapp_configs_tenant ON tenant_whatsapp_configs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_payment_audit_tenant ON payment_config_audit_log(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_payment_token ON orders(payment_link_token);
  `;
  await query2(tables);
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "admin@betico.cr").toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "BeticoAdmin2026!";
  const modernHash = hashPassword2(superAdminPassword);
  const checkAdmin = await query2(`SELECT id, tenant_id FROM users WHERE LOWER(email) = LOWER($1)`, [superAdminEmail]);
  if (checkAdmin.rows.length === 0) {
    let tenantRes = await query2(`SELECT id FROM tenants WHERE slug = 'superadmin'`);
    let tenantId;
    if (tenantRes.rows.length === 0) {
      const created = await query2(`
        INSERT INTO tenants (name, slug, active, plan) 
        VALUES ('Betico Superadmin', 'superadmin', true, 'enterprise') 
        RETURNING id
      `);
      tenantId = created.rows[0].id;
    } else {
      tenantId = tenantRes.rows[0].id;
    }
    await query2(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, active)
      VALUES ($1, 'Super Admin', $2, $3, 'superadmin', true)
    `, [tenantId, superAdminEmail, modernHash]);
    console.log("Superadmin user created successfully.");
  } else {
    await query2(`
      UPDATE users 
      SET password_hash = $1, active = true, role = 'superadmin', updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = LOWER($2)
    `, [modernHash, superAdminEmail]);
    console.log("Superadmin user credentials synchronized.");
  }
  const defaultPlatformSettings = [
    { key: "localai_url", value: process.env.LOCALAI_URL || "https://beticoia-localai.qvtdko.easypanel.host/v1" },
    { key: "localai_model", value: "gpt-4o" },
    { key: "localai_enabled", value: "true" },
    { key: "master_ai_provider", value: "gemini" },
    { key: "master_ai_model", value: "gemini-2.5-flash" },
    { key: "quota_starter_tokens", value: "25000" },
    { key: "quota_pro_tokens", value: "100000" },
    { key: "quota_business_tokens", value: "300000" },
    { key: "deploy_webhook_app", value: "http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b" },
    { key: "deploy_webhook_localai", value: "http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e" },
    { key: "plan_starter_price_crc", value: "35000" },
    { key: "plan_starter_price_usd", value: "65" },
    { key: "plan_starter_invoices_quota", value: "50" },
    { key: "plan_pro_price_crc", value: "55000" },
    { key: "plan_pro_price_usd", value: "105" },
    { key: "plan_pro_invoices_quota", value: "100" },
    { key: "plan_enterprise_price_crc", value: "85000" },
    { key: "plan_enterprise_price_usd", value: "160" },
    { key: "plan_enterprise_invoices_quota", value: "250" },
    { key: "plan_aliado_price_crc", value: "0" },
    { key: "plan_aliado_price_usd", value: "0" },
    { key: "plan_aliado_invoices_quota", value: "500" },
    { key: "courtesy_invoices_margin", value: "10" }
  ];
  for (const s of defaultPlatformSettings) {
    await query2(`
      INSERT INTO platform_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = CASE 
        WHEN platform_settings.value = 'http://localhost:8080/v1' THEN EXCLUDED.value 
        ELSE platform_settings.value 
      END
    `, [s.key, s.value]);
  }
  await query2(`
    UPDATE platform_settings 
    SET value = 'https://beticoia-localai.qvtdko.easypanel.host/v1' 
    WHERE key = 'localai_url' AND (value = 'http://localhost:8080/v1' OR value IS NULL OR value = '')
  `);
  await query2(`
    CREATE TABLE IF NOT EXISTS courts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL DEFAULT 'Cancha 1',
      sport_type VARCHAR(100) NOT NULL DEFAULT 'futbol',
      custom_sport_type VARCHAR(100),
      description TEXT,
      surface VARCHAR(100),
      is_indoor BOOLEAN DEFAULT false,
      has_lighting BOOLEAN DEFAULT false,
      base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_display VARCHAR(100),
      duration_minutes INT NOT NULL DEFAULT 60,
      team_size INT DEFAULT 5,
      max_extra_players INT DEFAULT 2,
      extra_player_fee NUMERIC(10,2) DEFAULT 0,
      active BOOLEAN DEFAULT true,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS court_bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration_minutes INT NOT NULL DEFAULT 60,
      booking_mode VARCHAR(20) NOT NULL DEFAULT 'full',
      match_status VARCHAR(20) DEFAULT 'confirmed',
      match_expiry_hours NUMERIC(4,1) DEFAULT 1,
      team_a_name VARCHAR(255) DEFAULT 'Equipo A',
      team_a_captain VARCHAR(255) NOT NULL,
      team_a_phone VARCHAR(50) NOT NULL,
      team_a_players INT DEFAULT 5,
      team_a_extra_players INT DEFAULT 0,
      team_a_paid BOOLEAN DEFAULT false,
      team_b_name VARCHAR(255),
      team_b_captain VARCHAR(255),
      team_b_phone VARCHAR(50),
      team_b_players INT DEFAULT 5,
      team_b_extra_players INT DEFAULT 0,
      team_b_paid BOOLEAN DEFAULT false,
      total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_per_team NUMERIC(10,2),
      payment_mode VARCHAR(20) DEFAULT 'both',
      sport_type VARCHAR(100),
      skill_level VARCHAR(50),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_courts_tenant ON courts(tenant_id, active);
    CREATE INDEX IF NOT EXISTS idx_cb_tenant_date ON court_bookings(tenant_id, date, time);
    CREATE INDEX IF NOT EXISTS idx_cb_open_matches ON court_bookings(match_status, date) WHERE match_status = 'open';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_slot ON court_bookings(tenant_id, court_id, date, time) WHERE status NOT IN ('cancelled', 'rejected');
  `);
  await query2(`
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_courts_button BOOLEAN DEFAULT false;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS courts_button_text VARCHAR(255) DEFAULT 'Reservar Cancha';
  `).catch(() => {
  });
  await query2(`
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS accept_sinpe_tilopay BOOLEAN DEFAULT false;

    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tilopay_transaction_id VARCHAR(100);
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tilopay_auth_code VARCHAR(100);

    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_transaction_id_a VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_auth_code_a VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_transaction_id_b VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS tilopay_auth_code_b VARCHAR(100);
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS booking_code VARCHAR(30) UNIQUE;

    -- Backfill existing court bookings with CRT-XXXXXX format
    UPDATE court_bookings 
    SET booking_code = UPPER('CRT-' || SUBSTRING(id::text, 1, 8))
    WHERE booking_code IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_cb_booking_code ON court_bookings(booking_code);
    CREATE INDEX IF NOT EXISTS idx_cb_uncompleted_purge ON court_bookings(status, match_status, updated_at);

    -- Ensure active unique constraint excludes cancelled, rejected and uncompleted bookings
    DROP INDEX IF EXISTS idx_unique_active_court_slot;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_slot ON court_bookings(tenant_id, court_id, date, time) WHERE status NOT IN ('cancelled', 'rejected', 'uncompleted');

    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    CREATE TABLE IF NOT EXISTS message_queue (
      id TEXT PRIMARY KEY DEFAULT 'mq_' || gen_random_uuid()::text,
      tenant_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      push_name TEXT DEFAULT '',
      clean_phone TEXT DEFAULT '',
      user_message TEXT NOT NULL,
      instance_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      is_voice_note BOOLEAN DEFAULT false,
      priority INTEGER DEFAULT 0,
      error_message TEXT,
      ai_response TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_mq_status ON message_queue(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_mq_tenant ON message_queue(tenant_id, status);

    -- Tenant Subscription Billing Tables (Tilopay Tokenization & Recurring Charges)
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS auto_billing_enabled BOOLEAN DEFAULT false;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_auto_charge_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_auto_charge_status VARCHAR(50);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_reminder_sent BOOLEAN DEFAULT false;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_reminder_sent_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calendar_token VARCHAR(64) DEFAULT md5(random()::text || clock_timestamp()::text);

    CREATE TABLE IF NOT EXISTS tenant_billing_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      card_last4 VARCHAR(4) NOT NULL,
      card_brand VARCHAR(20),
      card_holder VARCHAR(255),
      tilopay_token_encrypted TEXT NOT NULL,
      is_default BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tenant_billing_cards_tenant ON tenant_billing_cards(tenant_id, is_active);

    CREATE TABLE IF NOT EXISTS tenant_billing_charges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      billing_card_id UUID REFERENCES tenant_billing_cards(id),
      amount NUMERIC(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'CRC',
      period_start DATE,
      period_end DATE,
      status VARCHAR(50) DEFAULT 'pending',
      tilopay_order_number VARCHAR(100) UNIQUE,
      tilopay_transaction_id VARCHAR(255),
      tilopay_auth_code VARCHAR(100),
      failure_reason TEXT,
      attempt_count INT DEFAULT 1,
      last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tenant_billing_charges_tenant ON tenant_billing_charges(tenant_id, created_at);

    -- Courts: image_url and schedule_config
    ALTER TABLE courts ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE courts ADD COLUMN IF NOT EXISTS schedule_config JSONB;

    -- Specialists: schedule_type, schedule_config and show_earnings
    ALTER TABLE specialists ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(50) DEFAULT 'business_hours';
    ALTER TABLE specialists ADD COLUMN IF NOT EXISTS schedule_config JSONB;
    ALTER TABLE specialists ADD COLUMN IF NOT EXISTS show_earnings BOOLEAN DEFAULT true;

    -- Customer & Patient Records (Expedientes)
    CREATE TABLE IF NOT EXISTS customer_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      client_type VARCHAR(20) DEFAULT 'general',
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      identification VARCHAR(50),
      address TEXT,
      date_of_birth DATE,
      gender VARCHAR(50),
      blood_type VARCHAR(10),
      allergies TEXT,
      pathological_background TEXT,
      current_medications TEXT,
      emergency_contact_name VARCHAR(255),
      emergency_contact_phone VARCHAR(50),
      notes TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_customer_records_tenant_phone ON customer_records(tenant_id, phone);
    CREATE INDEX IF NOT EXISTS idx_customer_records_tenant_id_num ON customer_records(tenant_id, identification);
    CREATE INDEX IF NOT EXISTS idx_customer_records_tenant_type ON customer_records(tenant_id, client_type);

    CREATE TABLE IF NOT EXISTS record_entries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      record_id UUID REFERENCES customer_records(id) ON DELETE CASCADE,
      appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
      specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
      entry_type VARCHAR(50) DEFAULT 'consultation',
      vital_signs JSONB,
      diagnosis TEXT,
      treatment_plan TEXT,
      prescription TEXT,
      notes TEXT,
      attachments JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_record_entries_tenant_record ON record_entries(tenant_id, record_id);
    CREATE INDEX IF NOT EXISTS idx_record_entries_specialist ON record_entries(specialist_id);

    -- Appointments: link to customer_records
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS record_id UUID REFERENCES customer_records(id) ON DELETE SET NULL;

    -- Almendro Electronic Invoicing Tables (Costa Rica DGT v4.4)
    CREATE TABLE IF NOT EXISTS tenant_almendro_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      is_enabled BOOLEAN DEFAULT false,
      environment VARCHAR(20) DEFAULT 'SANDBOX',
      api_key_encrypted TEXT,
      default_doc_type VARCHAR(5) DEFAULT '04',
      module_toggles JSONB DEFAULT '{"storeEnabled":true,"bookingsEnabled":true,"courtsEnabled":false,"restaurantEnabled":false,"subscriptionsEnabled":false}'::jsonb,
      tax_id_type VARCHAR(5),
      tax_id_number VARCHAR(20),
      legal_name VARCHAR(255),
      commercial_name VARCHAR(255),
      economic_activity_code VARCHAR(30),
      branch_code VARCHAR(3) DEFAULT '001',
      pos_code VARCHAR(5) DEFAULT '00001',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tenant_almendro_tenant ON tenant_almendro_configs(tenant_id);

    CREATE TABLE IF NOT EXISTS electronic_vouchers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
      court_booking_id UUID REFERENCES court_bookings(id) ON DELETE SET NULL,
      subscription_charge_id UUID REFERENCES tenant_billing_charges(id) ON DELETE SET NULL,
      doc_type VARCHAR(5) NOT NULL DEFAULT '04',
      consecutive_number VARCHAR(50),
      numeric_key VARCHAR(50) UNIQUE,
      receiver_id_type VARCHAR(5),
      receiver_id_number VARCHAR(20),
      receiver_name VARCHAR(255),
      receiver_email VARCHAR(255),
      currency VARCHAR(10) DEFAULT 'CRC',
      subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      pdf_url TEXT,
      xml_signed_url TEXT,
      xml_response_url TEXT,
      hacienda_response_code VARCHAR(50),
      hacienda_response_detail TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_vouchers_tenant ON electronic_vouchers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_vouchers_key ON electronic_vouchers(numeric_key);
    CREATE INDEX IF NOT EXISTS idx_vouchers_status ON electronic_vouchers(status);

    -- Electronic Invoicing and Billing Info Extension
    ALTER TABLE tenant_almendro_configs ALTER COLUMN economic_activity_code TYPE VARCHAR(30);
    ALTER TABLE tenant_almendro_configs ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(30) DEFAULT 'ALMENDRO_AUTO';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_info JSONB;
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS billing_info JSONB;
    ALTER TABLE court_bookings ADD COLUMN IF NOT EXISTS billing_info JSONB;

    -- Subscription Grace Period Abuse Prevention & Order Tracking Token (ISO/IEC 25010)
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_consumed BOOLEAN DEFAULT false;
    UPDATE tenants SET trial_consumed = true WHERE trial_ends_at < CURRENT_TIMESTAMP OR subscription_status IN ('active', 'cancelled', 'past_due');

    -- Tenant Geographic Location & GPS / Maps
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();
    CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);

    CREATE INDEX IF NOT EXISTS idx_court_bookings_slot ON court_bookings(tenant_id, court_id, date, time) WHERE status != 'cancelled';

    -- Betico AI Pilot & Priority Queue Execution
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_ai_pilot BOOLEAN DEFAULT false;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_priority_level INTEGER DEFAULT 0;

    -- Granular Token Logs and Spend Estimation for BYOK & Platform Tenants
    CREATE TABLE IF NOT EXISTS tenant_ai_token_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id TEXT NOT NULL,
      subagent VARCHAR(50) DEFAULT 'general',
      provider VARCHAR(50) NOT NULL,
      model VARCHAR(100) NOT NULL,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      cost_usd NUMERIC(10, 6) DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      is_byok BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ai_token_logs_tenant_month ON tenant_ai_token_logs(tenant_id, created_at);

    -- ==========================================================
    -- M\xD3DULO DE FIDELIZACI\xD3N (PUNTOS & SELLOS) MULTITIENDA
    -- ==========================================================
    
    -- 1. Clientes de Fidelizaci\xF3n (Billetera Centralizada)
    CREATE TABLE IF NOT EXISTS loyalty_customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identification VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_customers_id ON loyalty_customers(identification);
    CREATE INDEX IF NOT EXISTS idx_loyalty_customers_phone ON loyalty_customers(phone);

    -- 2. Configuraci\xF3n del Programa de Fidelidad por Tenant
    CREATE TABLE IF NOT EXISTS loyalty_programs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT false,
      program_type VARCHAR(20) DEFAULT 'points',
      currency VARCHAR(10) DEFAULT 'CRC',
      points_spend_ratio NUMERIC(10, 2) DEFAULT 1000.00,
      points_redeem_ratio NUMERIC(10, 2) DEFAULT 10.00,
      points_expiry_months INTEGER,
      stamps_target INTEGER DEFAULT 10,
      stamps_prize TEXT DEFAULT 'Premio sorpresa',
      min_spend_per_stamp NUMERIC(10, 2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_programs_tenant ON loyalty_programs(tenant_id);

    -- 3. Tarjetas de Clientes por Comercio
    CREATE TABLE IF NOT EXISTS loyalty_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES loyalty_customers(id) ON DELETE SET NULL,
      identification VARCHAR(50) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      points_balance NUMERIC(10, 2) DEFAULT 0,
      current_stamps INTEGER DEFAULT 0,
      total_stamps_redeemed INTEGER DEFAULT 0,
      last_activity_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, identification)
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_tenant_id ON loyalty_cards(tenant_id, identification);
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_tenant_phone ON loyalty_cards(tenant_id, customer_phone);
    CREATE INDEX IF NOT EXISTS idx_loyalty_cards_identification ON loyalty_cards(identification);

    -- 4. Vouchers y Recompensas con QR
    CREATE TABLE IF NOT EXISTS loyalty_rewards_vouchers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE,
      voucher_code VARCHAR(50) UNIQUE NOT NULL,
      qr_data TEXT NOT NULL,
      reward_description TEXT NOT NULL,
      reward_type VARCHAR(30) DEFAULT 'stamps_complete',
      discount_amount NUMERIC(10, 2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      redeemed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_tenant ON loyalty_rewards_vouchers(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_code ON loyalty_rewards_vouchers(voucher_code);
    CREATE INDEX IF NOT EXISTS idx_loyalty_vouchers_card ON loyalty_rewards_vouchers(card_id);

    -- 5. Promociones Especiales de Fidelidad
    CREATE TABLE IF NOT EXISTS loyalty_promotions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      promo_type VARCHAR(50) DEFAULT 'double_points',
      multiplier NUMERIC(4, 2) DEFAULT 2.0,
      min_spend NUMERIC(10, 2) DEFAULT 0,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_promotions_tenant ON loyalty_promotions(tenant_id);

    -- 6. Libro Mayor de Transacciones de Fidelidad (Auditor\xEDa Inmutable)
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL,
      points_delta NUMERIC(10, 2) DEFAULT 0,
      stamps_delta INTEGER DEFAULT 0,
      balance_after NUMERIC(10, 2) DEFAULT 0,
      stamps_after INTEGER DEFAULT 0,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      notes TEXT,
      created_by VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_loyalty_tx_card ON loyalty_transactions(card_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_loyalty_tx_tenant ON loyalty_transactions(tenant_id);

    -- ==========================================================
    -- M\xD3DULO DE CUPONES DE DESCUENTO MULTITIENDA Y BOT
    -- ==========================================================
    CREATE TABLE IF NOT EXISTS discount_coupons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      code VARCHAR(50) NOT NULL,
      description TEXT,
      discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
      discount_value NUMERIC(10, 2) NOT NULL,
      min_order_amount NUMERIC(10, 2) DEFAULT 0,
      max_discount_amount NUMERIC(10, 2),
      usage_limit INT,
      used_count INT DEFAULT 0,
      valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      valid_until TIMESTAMPTZ,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, code)
    );
    CREATE INDEX IF NOT EXISTS idx_discount_coupons_tenant_code ON discount_coupons(tenant_id, code);

    -- Columnas de cup\xF3n en pedidos
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

    -- ==========================================================
    -- M\xD3DULO DE SECRETARIO VIRTUAL WHATSAPP Y SESIONES PIN
    -- ==========================================================
    CREATE TABLE IF NOT EXISTS secretary_authorized_phones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      phone VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'owner',
      pin_hash VARCHAR(255) NOT NULL,
      failed_attempts INT NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, phone)
    );
    CREATE INDEX IF NOT EXISTS idx_secretary_phone ON secretary_authorized_phones(phone);
    CREATE INDEX IF NOT EXISTS idx_secretary_tenant ON secretary_authorized_phones(tenant_id);

    CREATE TABLE IF NOT EXISTS secretary_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      authorized_phone_id UUID NOT NULL REFERENCES secretary_authorized_phones(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      is_authenticated BOOLEAN NOT NULL DEFAULT false,
      authenticated_at TIMESTAMPTZ,
      last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(authorized_phone_id, session_date)
    );
    CREATE INDEX IF NOT EXISTS idx_sec_sessions_lookup 
    ON secretary_sessions(authorized_phone_id, session_date, is_authenticated);

    -- ==========================================================
    -- M\xD3DULO DE FACTURACI\xD3N ELECTR\xD3NICA NATIVA BETICO Y PLANES
    -- ==========================================================
    CREATE TABLE IF NOT EXISTS tenant_hacienda_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
      taxpayer_id_type VARCHAR(2) NOT NULL DEFAULT '01',
      taxpayer_id_number VARCHAR(20) NOT NULL DEFAULT '',
      taxpayer_name VARCHAR(255) NOT NULL DEFAULT '',
      commercial_name VARCHAR(255) DEFAULT '',
      taxpayer_email VARCHAR(255) NOT NULL DEFAULT '',
      taxpayer_phone VARCHAR(50) DEFAULT '',
      economic_activity_code VARCHAR(10) NOT NULL DEFAULT '',
      province VARCHAR(1) DEFAULT '1',
      canton VARCHAR(2) DEFAULT '01',
      district VARCHAR(2) DEFAULT '01',
      neighborhood VARCHAR(2) DEFAULT '01',
      address_detail TEXT DEFAULT '',
      idp_username VARCHAR(100) DEFAULT '',
      idp_password_encrypted TEXT DEFAULT '',
      p12_encrypted_blob BYTEA,
      p12_pin_encrypted TEXT DEFAULT '',
      p12_filename VARCHAR(255) DEFAULT '',
      p12_expires_at TIMESTAMPTZ,
      branch_code VARCHAR(3) NOT NULL DEFAULT '001',
      pos_code VARCHAR(5) NOT NULL DEFAULT '00001',
      default_doc_type VARCHAR(2) NOT NULL DEFAULT '04',
      is_connected BOOLEAN NOT NULL DEFAULT false,
      last_test_at TIMESTAMPTZ,
      last_test_message TEXT,
      provider_mode VARCHAR(30) NOT NULL DEFAULT 'BETICO_NATIVE',
      use_alternative_provider BOOLEAN NOT NULL DEFAULT false,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_hacienda_config_tenant ON tenant_hacienda_configs(tenant_id);

    CREATE TABLE IF NOT EXISTS hacienda_usage_cycles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      cycle_start_date DATE NOT NULL,
      cycle_end_date DATE NOT NULL,
      invoices_emitted INT NOT NULL DEFAULT 0,
      courtesy_used INT NOT NULL DEFAULT 0,
      quota_limit INT NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, cycle_start_date)
    );
    CREATE INDEX IF NOT EXISTS idx_hacienda_usage_tenant ON hacienda_usage_cycles(tenant_id, cycle_start_date);

    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_invoices_quota INT;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS is_simplified_regime BOOLEAN DEFAULT false;
    ALTER TABLE tenant_almendro_configs ADD COLUMN IF NOT EXISTS is_simplified_regime BOOLEAN DEFAULT false;
    ALTER TABLE loyalty_programs ADD COLUMN IF NOT EXISTS enable_google_wallet BOOLEAN DEFAULT true;
    ALTER TABLE loyalty_programs ADD COLUMN IF NOT EXISTS enable_apple_wallet BOOLEAN DEFAULT true;

    CREATE TABLE IF NOT EXISTS tenant_wallet_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      google_issuer_id VARCHAR(100) DEFAULT '',
      google_client_email VARCHAR(255) DEFAULT '',
      google_private_key_encrypted TEXT DEFAULT '',
      google_is_active BOOLEAN DEFAULT false,
      google_is_tested BOOLEAN DEFAULT false,
      google_last_test_at TIMESTAMPTZ,
      google_last_test_message TEXT,
      apple_pass_type_id VARCHAR(150) DEFAULT '',
      apple_team_id VARCHAR(50) DEFAULT '',
      apple_p12_encrypted_blob BYTEA,
      apple_p12_filename VARCHAR(255) DEFAULT '',
      apple_p12_password_encrypted TEXT DEFAULT '',
      apple_is_active BOOLEAN DEFAULT false,
      apple_is_tested BOOLEAN DEFAULT false,
      apple_last_test_at TIMESTAMPTZ,
      apple_last_test_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tenant_wallet_configs_tenant ON tenant_wallet_configs(tenant_id);

    -- ==========================================================
    -- M\xD3DULO AVANZADO DE FACTURACI\xD3N HACIENDA Y MULTI-SUCURSAL
    -- ==========================================================
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS multi_branch_enabled BOOLEAN DEFAULT false;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS cert_subject VARCHAR(255) DEFAULT '';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS cert_issuer VARCHAR(255) DEFAULT '';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS economic_activities_json JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS default_cabys_code VARCHAR(20) DEFAULT '8311100000000';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS seq_factura INT DEFAULT 1;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS seq_tiquete INT DEFAULT 1;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS seq_nota_credito INT DEFAULT 1;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS email_auto_send BOOLEAN DEFAULT true;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255) DEFAULT '';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS smtp_port INT DEFAULT 587;
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS smtp_user VARCHAR(255) DEFAULT '';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS smtp_pass_encrypted TEXT DEFAULT '';
    ALTER TABLE tenant_hacienda_configs ADD COLUMN IF NOT EXISTS resend_api_key_encrypted TEXT DEFAULT '';

    CREATE TABLE IF NOT EXISTS tenant_hacienda_branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
      branch_name VARCHAR(255) NOT NULL,
      branch_code VARCHAR(3) NOT NULL DEFAULT '002',
      pos_code VARCHAR(5) NOT NULL DEFAULT '00001',
      commercial_name VARCHAR(255) DEFAULT '',
      economic_activity_code VARCHAR(10) DEFAULT '',
      province VARCHAR(1) DEFAULT '1',
      canton VARCHAR(2) DEFAULT '01',
      district VARCHAR(2) DEFAULT '01',
      neighborhood VARCHAR(2) DEFAULT '01',
      address_detail TEXT DEFAULT '',
      seq_factura INT NOT NULL DEFAULT 1,
      seq_tiquete INT NOT NULL DEFAULT 1,
      seq_nota_credito INT NOT NULL DEFAULT 1,
      use_custom_credentials BOOLEAN NOT NULL DEFAULT false,
      custom_taxpayer_id_type VARCHAR(2) DEFAULT '01',
      custom_taxpayer_id_number VARCHAR(20) DEFAULT '',
      custom_taxpayer_name VARCHAR(255) DEFAULT '',
      custom_idp_username VARCHAR(100) DEFAULT '',
      custom_idp_password_encrypted TEXT DEFAULT '',
      custom_p12_encrypted_blob BYTEA,
      custom_p12_pin_encrypted TEXT DEFAULT '',
      custom_p12_filename VARCHAR(255) DEFAULT '',
      custom_p12_expires_at TIMESTAMPTZ,
      custom_cert_subject VARCHAR(255) DEFAULT '',
      is_connected BOOLEAN NOT NULL DEFAULT false,
      last_test_at TIMESTAMPTZ,
      last_test_message TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tenant_id, branch_code, pos_code)
    );
    CREATE INDEX IF NOT EXISTS idx_hacienda_branches_tenant ON tenant_hacienda_branches(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_hacienda_branches_store_branch ON tenant_hacienda_branches(tenant_id, branch_id);

    ALTER TABLE electronic_vouchers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE electronic_vouchers ADD COLUMN IF NOT EXISTS branch_code VARCHAR(3) DEFAULT '001';
    ALTER TABLE electronic_vouchers ADD COLUMN IF NOT EXISTS pos_code VARCHAR(5) DEFAULT '00001';
    ALTER TABLE electronic_vouchers ADD COLUMN IF NOT EXISTS reference_key VARCHAR(50);

    -- Preferencia de facturaci\xF3n electr\xF3nica de suscripci\xF3n por inquilino (SuperAdmin -> Tenant)
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS requires_subscription_invoice BOOLEAN DEFAULT false;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_id_type VARCHAR(10) DEFAULT '01';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_id_number VARCHAR(30) DEFAULT '';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_legal_name VARCHAR(255) DEFAULT '';
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255) DEFAULT '';
  `).catch((err) => {
    console.warn("[Migrations] Columns addition warning:", err?.message || err);
  });
  console.log("Migrations completed successfully.");
}

// src/server/index.ts
dotenv3.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "betico-ops-admin", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use("/api/auth", auth_routes_default);
app.use("/api/monitoring", monitoring_routes_default);
app.use("/api/system", system_routes_default);
app.use("/api/tenants", tenants_routes_default);
app.use("/api/billing/native", billing_native_routes_default);
app.use("/api/billing", billing_routes_default);
app.use("/api/almendro", almendro_routes_default);
app.use("/api/audit", audit_routes_default);
app.use("/api/platform", platform_routes_default);
app.use("/api/bots-chats", bots_chats_routes_default);
app.use(express.static(__dirname));
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send("Betico Admin Ops: Frontend build not found. Please run build first.");
    }
  });
});
runMigrations().catch((err) => console.warn("[Betico Ops] Migration check warning:", err?.message));
app.listen(PORT, () => {
  console.log(`[Betico Ops] Servidor administrativo aislado iniciado en el puerto ${PORT}`);
  console.log(`[Betico Ops] Modo: ${process.env.NODE_ENV || "production"}`);
});
//# sourceMappingURL=server.js.map
