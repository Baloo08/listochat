var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/config/env.ts
import dotenv from "dotenv";
var env;
var init_env = __esm({
  "src/server/config/env.ts"() {
    "use strict";
    dotenv.config();
    env = {
      PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3,
      JWT_SECRET: process.env.JWT_SECRET || "betico_jwt_secret_64_chars_super_safe_key_cr_2026",
      DATABASE_URL: process.env.DATABASE_URL || "postgres://saas:BeticoDB2026@betico_postgres:5432/whatsapp_saas?sslmode=disable",
      REDIS_URL: process.env.REDIS_URL || "redis://default:BeticoRedis2026@betico_redis:6379",
      BASE_DOMAIN: process.env.BASE_DOMAIN || "betico-app.qvtdko.easypanel.host",
      APP_URL: process.env.APP_URL || "https://betico-app.qvtdko.easypanel.host",
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || "http://betico_evolution:8080",
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11",
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f",
      APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f",
      TILOPAY_MODULE_ENABLED: process.env.TILOPAY_MODULE_ENABLED !== "false",
      SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL || "admin@betico.cr",
      SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD || "BeticoAdmin2026!",
      UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
      NODE_ENV: process.env.NODE_ENV || "production",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ"
    };
  }
});

// src/server/db/pool.ts
var pool_exports = {};
__export(pool_exports, {
  default: () => pool_default,
  getClient: () => getClient,
  query: () => query,
  testConnection: () => testConnection
});
import pg from "pg";
var Pool, pool, query, getClient, testConnection, pool_default;
var init_pool = __esm({
  "src/server/db/pool.ts"() {
    "use strict";
    init_env();
    ({ Pool } = pg);
    pool = new Pool({
      connectionString: env.DATABASE_URL
    });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
    query = async (text, params) => {
      try {
        const res = await pool.query(text, params);
        return res;
      } catch (error) {
        console.error("Database query error:", error, "Query:", text);
        throw error;
      }
    };
    getClient = async () => {
      const client = await pool.connect();
      return client;
    };
    testConnection = async () => {
      try {
        const res = await query("SELECT NOW()");
        console.log("Database connected successfully:", res.rows[0]);
        return true;
      } catch (err) {
        console.error("Failed to connect to the database:", err);
        return false;
      }
    };
    pool_default = pool;
  }
});

// src/server/db/users.repo.ts
var users_repo_exports = {};
__export(users_repo_exports, {
  createUser: () => createUser,
  deleteUser: () => deleteUser,
  getAdminUserByTenant: () => getAdminUserByTenant,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUsersByTenant: () => getUsersByTenant,
  hashPassword: () => hashPassword,
  resetTenantAdminPassword: () => resetTenantAdminPassword,
  updateUser: () => updateUser,
  verifyPassword: () => verifyPassword
});
import crypto from "crypto";
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
      const hashPbkdf2_1k_512 = crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
      if (hashPbkdf2_1k_512 === storedHash) return true;
      const hashPbkdf2_100k_512 = crypto.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
      if (hashPbkdf2_100k_512 === storedHash) return true;
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
async function getUsersByTenant(tenantId) {
  const result = await query(`
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
  const result = await query(q, params);
  return result.rows[0] || null;
}
async function getUserById(id) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}
async function getAdminUserByTenant(tenantId) {
  const result = await query(`
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
    pwdHash = hashPassword(data.password);
  } else if (data.passwordHash) {
    pwdHash = data.passwordHash.includes(":") ? data.passwordHash : hashPassword(data.passwordHash);
  }
  const result = await query(`
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
    params.push(hashPassword(data.password));
  } else if (data.passwordHash !== void 0) {
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(data.passwordHash);
  }
  if (updates.length === 0) return getUserById(id);
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  const result = await query(`
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
  const newHash = hashPassword(newPassword);
  if (adminUser) {
    await query(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
    `, [newHash, adminUser.id, tenantId]);
    return true;
  }
  return false;
}
async function deleteUser(id, tenantId) {
  const result = await query("DELETE FROM users WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
var init_users_repo = __esm({
  "src/server/db/users.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// src/server/services/evolution.ts
var evolution_exports = {};
__export(evolution_exports, {
  connectInstance: () => connectInstance,
  createInstance: () => createInstance,
  disconnectInstance: () => disconnectInstance,
  fetchWhatsAppContacts: () => fetchWhatsAppContacts,
  getBase64FromMediaMessage: () => getBase64FromMediaMessage,
  getInstanceStatus: () => getInstanceStatus,
  markAsRead: () => markAsRead,
  sendMedia: () => sendMedia,
  sendMessage: () => sendMessage,
  setWebhook: () => setWebhook
});
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "apikey": EVOLUTION_API_KEY
  };
}
async function createInstance(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function getInstanceStatus(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function connectInstance(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function disconnectInstance(instanceName) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function sendMessage(instanceName, number, text) {
  try {
    const cleanNumber = (number || "").replace(/@.+$/, "").replace(/\D/g, "");
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        text,
        delay: 1e3
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function setWebhook(instanceName, webhookUrl) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "SEND_MESSAGE"
          ]
        }
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function markAsRead(instanceName, remoteJid, messageId) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        readMessages: [{
          remoteJid,
          id: messageId,
          fromMe: false
        }]
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function sendMedia(instanceName, number, mediaUrl, caption) {
  try {
    const cleanNumber = (number || "").replace(/@.+$/, "").replace(/\D/g, "");
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        number: cleanNumber,
        mediatype: "image",
        media: mediaUrl,
        caption: caption || "",
        delay: 1200
      })
    });
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error };
  }
}
async function getBase64FromMediaMessage(instanceName, messageKey, messageData) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        message: {
          key: messageKey,
          message: messageData
        },
        convertToMp4: false
      })
    });
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
        const response = await fetch(url, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({})
        });
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
var EVOLUTION_API_URL, EVOLUTION_API_KEY;
var init_evolution = __esm({
  "src/server/services/evolution.ts"() {
    "use strict";
    EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
    EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
  }
});

// src/server/services/superadmin-notify.service.ts
async function getSuperadminNotifyPhone() {
  try {
    const res = await query(`SELECT value FROM platform_settings WHERE key = 'superadmin_notify_phone'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      return res.rows[0].value.replace(/\D/g, "");
    }
    return null;
  } catch (e) {
    return null;
  }
}
async function sendSuperadminAlert(message) {
  try {
    const phone = await getSuperadminNotifyPhone();
    if (!phone || phone.length < 8) {
      return false;
    }
    const instanceRes = await query(`
      SELECT instance_name FROM superadmin_instances WHERE status = 'connected' LIMIT 1
    `);
    const instanceName = instanceRes.rows[0]?.instance_name || "betico_soporte";
    await sendMessage(instanceName, phone, message);
    return true;
  } catch (err) {
    console.error("[SuperadminNotify] Error sending alert to superadmin:", err);
    return false;
  }
}
async function notifyNewTenantEnrollment(params) {
  const priceFormatted = params.currency === "USD" ? `$${params.monthlyPrice}` : `\u20A1${params.monthlyPrice.toLocaleString("es-CR")}`;
  const originText = params.isManual ? "Manual desde Panel" : "Bot Aut\xF3nomo de WhatsApp";
  const text = `\u{1F389} *[Nuevo Negocio Registrado - Betico]*

\u{1F3E2} *Negocio:* ${params.tenantName} (\`${params.slug}\`)
\u{1F464} *Contacto:* ${params.contactName}
\u{1F4E7} *Correo:* ${params.email}
\u{1F4F1} *WhatsApp:* +${params.phone}
\u{1F4E6} *Plan:* ${params.plan.toUpperCase()}
\u{1F4B5} *Tarifa Acordada:* ${priceFormatted}/mes
\u23F3 *Per\xEDodo de Prueba:* ${params.trialDays} d\xEDas gratis
\u{1F4CD} *Origen:* ${originText}`;
  await sendSuperadminAlert(text);
}
async function notifyPaymentProofUploaded(params) {
  const priceFormatted = params.currency === "USD" ? `$${params.amount}` : `\u20A1${params.amount.toLocaleString("es-CR")}`;
  const text = `\u{1F4B3} *[Comprobante de Pago Recibido - Betico]*

\u{1F3E2} *Negocio:* ${params.tenantName} (\`${params.slug}\`)
\u{1F4B0} *Monto Reportado:* ${priceFormatted}
\u{1F522} *Referencia / SINPE:* ${params.reference || "No especificada"}
${params.notes ? `\u{1F4DD} *Nota:* ${params.notes}
` : ""}
\u{1F449} Ingresa a tu panel de SuperAdmin en la pesta\xF1a *Inquilinos* para verificar el comprobante y renovar la suscripci\xF3n.`;
  await sendSuperadminAlert(text);
}
async function notifyGracePeriodStarted(params) {
  const priceFormatted = params.currency === "USD" ? `$${params.monthlyPrice}` : `\u20A1${params.monthlyPrice.toLocaleString("es-CR")}`;
  const text = `\u23F3 *[Inicio de Periodo de Gracia - Morosidad]*

\u{1F3E2} *Negocio:* ${params.tenantName} (\`${params.slug}\`)
\u{1F4F1} *Tel\xE9fono:* +${params.phone}
\u{1F4B5} *Monto Pendiente:* ${priceFormatted}
\u26A0\uFE0F Ha vencido su per\xEDodo de prueba o suscripci\xF3n. Cuenta con *15 d\xEDas de gracia* para realizar el pago antes de la suspensi\xF3n autom\xE1tica del servicio.`;
  await sendSuperadminAlert(text);
}
async function notifyAccountSuspended(params) {
  const text = `\u{1F512} *[Cuenta Suspendida por Morosidad]*

\u{1F3E2} *Negocio:* ${params.tenantName} (\`${params.slug}\`)
\u{1F4F1} *Tel\xE9fono:* +${params.phone}
\u{1F6AB} Se han cumplido los 15 d\xEDas de gracia sin registrar pago. El acceso al panel y el bot de WhatsApp del negocio han sido suspendidos autom\xE1ticamente.`;
  await sendSuperadminAlert(text);
}
async function notifyPaymentApproved(params) {
  const text = `\u2705 *[Suscripci\xF3n Renovada con \xC9xito]*

\u{1F3E2} *Negocio:* ${params.tenantName} (\`${params.slug}\`)
\u{1F389} Has aprobado el pago. El servicio se encuentra activo y la pr\xF3xima fecha de cobro es el *${params.renewedUntil}*.`;
  await sendSuperadminAlert(text);
}
var init_superadmin_notify_service = __esm({
  "src/server/services/superadmin-notify.service.ts"() {
    "use strict";
    init_pool();
    init_evolution();
  }
});

// src/server/services/encryption.ts
import crypto2 from "crypto";
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
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.includes(":")) return encryptedData;
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
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
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}
var ALGORITHM, IV_LENGTH, getEncryptionKey;
var init_encryption = __esm({
  "src/server/services/encryption.ts"() {
    "use strict";
    init_env();
    ALGORITHM = "aes-256-gcm";
    IV_LENGTH = 16;
    getEncryptionKey = () => {
      const key = process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || "e8a1b2c3d4e5f60718293a4b5c6d7e8f";
      return crypto2.scryptSync(key, "salt", 32);
    };
  }
});

// src/server/services/ai-provider.ts
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
function getDefaultModels(provider) {
  switch (provider) {
    case "gemini":
      return [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
      ];
    case "openai":
      return [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "o1",
        "o1-mini",
        "o3-mini"
      ];
    case "anthropic":
      return [
        "claude-3-7-sonnet",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022"
      ];
    case "localai":
    case "betico_ai":
      return [
        "gpt-4",
        "gpt-4o"
      ];
    default:
      return [];
  }
}
async function getMasterAIConfig() {
  try {
    const res = await query("SELECT key, value, value_encrypted FROM platform_settings WHERE key IN ('master_ai_provider', 'master_ai_key', 'master_ai_model', 'localai_url', 'localai_model', 'localai_api_key', 'localai_enabled')");
    const settings = {};
    for (const row of res.rows) {
      if (row.value_encrypted) {
        settings[row.key] = decrypt(row.value_encrypted);
      } else {
        settings[row.key] = row.value || "";
      }
    }
    const localaiEnabled = settings.localai_enabled !== "false";
    const localaiUrl = settings.localai_url || process.env.LOCALAI_URL || "https://beticoia-localai.qvtdko.easypanel.host/v1";
    let localaiModel = settings.localai_model || "gpt-4";
    if (!localaiModel || localaiModel.includes("llama") || localaiModel.includes("qwen") || localaiModel.includes("gemini")) {
      localaiModel = "gpt-4";
    }
    if (localaiEnabled) {
      return {
        provider: "localai",
        apiKey: settings.localai_api_key || "localai",
        model: localaiModel,
        temperature: 0.7,
        baseUrl: localaiUrl
      };
    }
    const provider = settings.master_ai_provider || "gemini";
    const apiKey = settings.master_ai_key || DEFAULT_GEMINI_KEY;
    const model = settings.master_ai_model || (provider === "gemini" ? "gemini-2.5-flash" : provider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-20241022");
    return {
      provider,
      apiKey,
      model,
      temperature: 0.7
    };
  } catch (e) {
    return {
      provider: "gemini",
      apiKey: DEFAULT_GEMINI_KEY,
      model: "gemini-2.5-flash",
      temperature: 0.7
    };
  }
}
async function callAI(config, input) {
  const provider = config.provider || "gemini";
  const apiKey = config.apiKey || (provider === "gemini" ? DEFAULT_GEMINI_KEY : "");
  let chosenModel = config.model;
  if (provider === "localai" || provider === "betico_ai") {
    if (!chosenModel || chosenModel.includes("llama") || chosenModel.includes("qwen") || chosenModel.includes("gemini") || chosenModel.includes("claude")) {
      chosenModel = "gpt-4";
    }
  } else if (!chosenModel) {
    chosenModel = provider === "openai" ? "gpt-4o-mini" : provider === "anthropic" ? "claude-3-5-haiku-20241022" : "gemini-2.5-flash";
  }
  const defaultModels = getDefaultModels(provider);
  const fallbackModels = [chosenModel, ...defaultModels.filter((m) => m !== chosenModel)];
  let lastError = null;
  for (const modelName of fallbackModels) {
    try {
      return await executeProvider({
        provider,
        apiKey,
        model: modelName,
        temperature: config.temperature ?? 0.7,
        baseUrl: config.baseUrl
      }, input);
    } catch (error) {
      lastError = error;
      console.error(`Error calling AI with model ${modelName} (${provider}):`, error);
      if (provider === "localai" || provider === "betico_ai") {
        break;
      }
    }
  }
  if (provider === "localai" || provider === "betico_ai") {
    console.warn("[AI-Provider] LocalAI unavailable or timed out. Engaging Master Gemini Failover...");
    try {
      let masterKey = DEFAULT_GEMINI_KEY;
      try {
        const masterConf = await getMasterAIConfig();
        if (masterConf.apiKey && masterConf.apiKey !== "localai") {
          masterKey = masterConf.apiKey;
        }
      } catch (e) {
      }
      return await executeProvider({
        provider: "gemini",
        apiKey: masterKey || DEFAULT_GEMINI_KEY,
        model: "gemini-2.5-flash",
        temperature: 0.7
      }, input);
    } catch (geminiError) {
      console.error("[AI-Provider] Master Gemini Failover also failed:", geminiError);
    }
  }
  console.error("All AI fallback models failed. Last error:", lastError);
  return {
    text: "Hola, gracias por comunicarte con nosotros. En este momento estamos procesando tu solicitud, en breve un asesor te responder\xE1.",
    tokensUsed: 0
  };
}
async function executeProvider(config, input) {
  let model;
  if (config.provider === "gemini") {
    const key = config.apiKey || DEFAULT_GEMINI_KEY;
    const google = createGoogleGenerativeAI({ apiKey: key });
    model = google(config.model || "gemini-2.5-flash");
  } else if (config.provider === "openai") {
    const openai = createOpenAI({ apiKey: config.apiKey });
    model = openai(config.model || "gpt-4o-mini");
  } else if (config.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: config.apiKey });
    model = anthropic(config.model || "claude-3-5-haiku-20241022");
  } else if (config.provider === "localai" || config.provider === "betico_ai") {
    const localai = createOpenAI({
      baseURL: config.baseUrl || process.env.LOCALAI_URL || "https://beticoia-localai.qvtdko.easypanel.host/v1",
      apiKey: config.apiKey || "localai"
    });
    model = localai(config.model || "gpt-4");
  } else {
    throw new Error("Unsupported provider: " + config.provider);
  }
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("AI inference timeout after 120s")), 12e4);
  });
  const t0 = Date.now();
  const generatePromise = (async () => {
    let callParams = {
      model,
      temperature: config.temperature ?? 0.7
    };
    let promptLengthEstimate = 0;
    if (typeof input === "string") {
      callParams.prompt = input;
      promptLengthEstimate = input.length;
    } else {
      if (input.system) {
        callParams.system = input.system;
        promptLengthEstimate += input.system.length;
      }
      if (input.messages && input.messages.length > 0) {
        callParams.messages = input.messages;
        promptLengthEstimate += input.messages.reduce((acc, m) => acc + (m.content || "").length, 0);
      } else if (input.system) {
        callParams.prompt = input.system;
      }
    }
    const { text, usage } = await generateText(callParams);
    console.log(`[AI-Provider] ${config.provider}/${config.model} responded in ${Date.now() - t0}ms, tokens: ${usage?.totalTokens || "?"}`);
    return {
      text,
      tokensUsed: usage?.totalTokens || Math.ceil((promptLengthEstimate + text.length) / 4)
    };
  })();
  return await Promise.race([generatePromise, timeoutPromise]);
}
var DEFAULT_GEMINI_KEY;
var init_ai_provider = __esm({
  "src/server/services/ai-provider.ts"() {
    "use strict";
    init_pool();
    init_encryption();
    init_env();
    DEFAULT_GEMINI_KEY = env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ";
  }
});

// src/server/services/crypto.service.ts
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
  const iv = crypto4.randomBytes(IV_LENGTH2);
  const cipher = crypto4.createCipheriv(ALGORITHM2, key, iv);
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
  const decipher = crypto4.createDecipheriv(ALGORITHM2, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedBase64, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
var ALGORITHM2, IV_LENGTH2, CryptoService;
var init_crypto_service = __esm({
  "src/server/services/crypto.service.ts"() {
    "use strict";
    init_env();
    ALGORITHM2 = "aes-256-gcm";
    IV_LENGTH2 = 16;
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

// src/server/db/tenant-payment.repo.ts
var tenant_payment_repo_exports = {};
__export(tenant_payment_repo_exports, {
  getPaymentAuditLogs: () => getPaymentAuditLogs,
  getTenantPaymentConfig: () => getTenantPaymentConfig,
  getTenantPaymentConfigRaw: () => getTenantPaymentConfigRaw,
  saveTenantPaymentConfig: () => saveTenantPaymentConfig
});
async function getTenantPaymentConfig(tenantId) {
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
  let rawKey = "";
  let rawPass = "";
  if (row.apiKeyEncrypted) {
    try {
      rawKey = CryptoService.decryptForTenant(tenantId, row.apiKeyEncrypted);
    } catch (e) {
    }
  }
  if (row.apiPasswordEncrypted) {
    try {
      rawPass = CryptoService.decryptForTenant(tenantId, row.apiPasswordEncrypted);
    } catch (e) {
    }
  }
  return {
    id: row.id,
    tenantId: row.tenantId,
    provider: row.provider,
    isEnabled: Boolean(row.isEnabled),
    environment: row.environment || "SANDBOX",
    apiUser: row.apiUser || "",
    apiKeyMasked: rawKey ? CryptoService.maskSecret(rawKey) : "",
    apiPasswordMasked: rawPass ? CryptoService.maskSecret(rawPass) : "",
    captureMode: row.captureMode || "IMMEDIATE",
    isConfigured: Boolean(rawKey && row.apiUser && rawPass),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
async function getTenantPaymentConfigRaw(tenantId) {
  const res = await query(`
    SELECT is_enabled as "isEnabled", environment, api_key_encrypted, api_user,
           api_password_encrypted, capture_mode as "captureMode"
    FROM tenant_payment_configs
    WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  let apiKey = "";
  let apiPassword = "";
  if (row.api_key_encrypted) {
    apiKey = CryptoService.decryptForTenant(tenantId, row.api_key_encrypted);
  }
  if (row.api_password_encrypted) {
    apiPassword = CryptoService.decryptForTenant(tenantId, row.api_password_encrypted);
  }
  return {
    apiKey,
    apiUser: row.api_user || "",
    apiPassword,
    environment: row.environment || "SANDBOX",
    isEnabled: Boolean(row.isEnabled),
    captureMode: row.captureMode || "IMMEDIATE"
  };
}
async function saveTenantPaymentConfig(tenantId, data, changedBy = "system") {
  const existing = await query(`
    SELECT * FROM tenant_payment_configs WHERE tenant_id = $1 AND provider = 'TILOPAY'
  `, [tenantId]);
  const prevRow = existing.rows[0] || null;
  let newEncryptedKey = prevRow?.api_key_encrypted || null;
  let newEncryptedPass = prevRow?.api_password_encrypted || null;
  if (data.apiKey && !data.apiKey.includes("\u2022\u2022\u2022\u2022")) {
    newEncryptedKey = CryptoService.encryptForTenant(tenantId, data.apiKey.trim());
  }
  if (data.apiPassword && !data.apiPassword.includes("\u2022\u2022\u2022\u2022")) {
    newEncryptedPass = CryptoService.encryptForTenant(tenantId, data.apiPassword.trim());
  }
  const isEnabled = data.isEnabled !== void 0 ? data.isEnabled : prevRow ? prevRow.is_enabled : false;
  const environment = data.environment || prevRow?.environment || "SANDBOX";
  const apiUser = data.apiUser !== void 0 ? data.apiUser.trim() : prevRow?.api_user || "";
  const captureMode = data.captureMode || prevRow?.capture_mode || "IMMEDIATE";
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
    tenantId,
    isEnabled,
    environment,
    newEncryptedKey,
    apiUser,
    newEncryptedPass,
    captureMode
  ]);
  const auditDiffs = [];
  if (prevRow) {
    if (prevRow.is_enabled !== isEnabled) {
      auditDiffs.push({ field: "is_enabled", oldVal: String(prevRow.is_enabled), newVal: String(isEnabled) });
    }
    if (prevRow.environment !== environment) {
      auditDiffs.push({ field: "environment", oldVal: prevRow.environment, newVal: environment });
    }
    if (data.apiKey && !data.apiKey.includes("\u2022\u2022\u2022\u2022")) {
      auditDiffs.push({ field: "api_key", oldVal: "\u2022\u2022\u2022\u2022", newVal: CryptoService.maskSecret(data.apiKey) });
    }
    if (data.apiPassword && !data.apiPassword.includes("\u2022\u2022\u2022\u2022")) {
      auditDiffs.push({ field: "api_password", oldVal: "\u2022\u2022\u2022\u2022", newVal: CryptoService.maskSecret(data.apiPassword) });
    }
    if (prevRow.api_user !== apiUser) {
      auditDiffs.push({ field: "api_user", oldVal: prevRow.api_user, newVal: apiUser });
    }
  } else {
    auditDiffs.push({ field: "created", oldVal: void 0, newVal: `provider=TILOPAY, env=${environment}` });
  }
  for (const diff of auditDiffs) {
    await query(`
      INSERT INTO payment_config_audit_log (tenant_id, changed_by, field_changed, old_value_masked, new_value_masked)
      VALUES ($1, $2, $3, $4, $5)
    `, [tenantId, changedBy, diff.field, diff.oldVal || null, diff.newVal || null]);
  }
  return await getTenantPaymentConfig(tenantId);
}
async function getPaymentAuditLogs(tenantId, limit = 20) {
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
var init_tenant_payment_repo = __esm({
  "src/server/db/tenant-payment.repo.ts"() {
    "use strict";
    init_pool();
    init_crypto_service();
  }
});

// src/server/services/superadmin-bot.service.ts
var superadmin_bot_service_exports = {};
__export(superadmin_bot_service_exports, {
  processSuperadminWhatsAppMessage: () => processSuperadminWhatsAppMessage
});
async function processSuperadminWhatsAppMessage(params) {
  const { instanceName, remoteJid, pushName, userMessage } = params;
  const cleanPhone = remoteJid.replace(/@.+$/, "").replace(/\D/g, "");
  if (!userMessage.trim()) return false;
  const isSales = instanceName.includes("ventas");
  const masterAI = await getMasterAIConfig();
  if (isSales) {
    const systemPrompt = `Eres Betico Sales AI, el Asistente Oficial de Ventas y Demos de Betico.tech en Costa Rica.
Atiendes a prospectos que te escriben por WhatsApp interesados en la plataforma.

\u{1F3AF} TUS CAPACIDADES Y REGLAS:
1. Habla con tono profesional, tico c\xE1lido y convincente (usa "pura vida", formato WhatsApp con *negritas* y emojis amigables).
2. Explica que Betico es la plataforma todo-en-uno que automatiza:
   - Atenci\xF3n por WhatsApp 24/7 con IA (entiende audios y notas de voz ticas).
   - Tienda Online propia sin comisiones (cat\xE1logo, variantes, env\xEDos por GPS con Waze).
   - Agenda de Citas y Reservas en l\xEDnea 24/7 con recordatorios autom\xE1ticos (reduce 80% inasistencias).
   - Verificaci\xF3n instant\xE1nea de SINPE M\xF3vil con visi\xF3n artificial en 0 segundos.
   - Pantalla de cocina KDS en vivo para restaurantes y multi-sucursal.
3. Comparte los enlaces de demostraci\xF3n en vivo cuando el cliente pregunte:
   - \u{1F354} Tienda Demo: https://betico-app.qvtdko.easypanel.host/tienda/sabor-urbano
   - \u{1F4C5} Agenda Demo: https://betico-app.qvtdko.easypanel.host/reservas/estetica-bella
   - \u{1F310} Web Oficial: https://betico-app.qvtdko.easypanel.host/
4. Planes:
   - Emprendedor: $29/mes (Tienda/Men\xFA QR, WhatsApp IA texto).
   - Profesional: $59/mes (Notas de voz con IA, SINPE autom\xE1tico, KDS de cocina, Difusiones).
   - Franquicias: $119/mes (Hasta 5 sucursales independientes).
5. OFERTA ESPECIAL DE ONBOARDING:
   - Ofrece *15 d\xEDas de prueba gratis* sin compromiso ni tarjeta de cr\xE9dito.
   - Si el prospecto desea probar o activar su cuenta, p\xEDdele amablemente:
     1. Nombre de su negocio
     2. Nombre de la persona encargada
     3. Correo electr\xF3nico para el acceso
   - Cuando el prospecto te entregue estos 3 datos (nombre, negocio y correo), al final de tu respuesta agrega EXACTAMENTE esta etiqueta oculta para que el sistema cree su cuenta:
     [REGISTRO_TRIAL: {"nombre": "Nombre Persona", "negocio": "Nombre Negocio", "correo": "correo@ejemplo.com"}]
`;
    const prompt = `${systemPrompt}

Cliente (${pushName || "Prospecto"}, +${cleanPhone}): "${userMessage}"
Responde como Betico Sales AI:`;
    const aiResult = await callAI(masterAI, prompt);
    let replyText = aiResult.text || "";
    const trialMatch = replyText.match(/\[REGISTRO_TRIAL:\s*(\{.*?\})\]/s);
    if (trialMatch) {
      try {
        const leadData = JSON.parse(trialMatch[1]);
        replyText = replyText.replace(/\[REGISTRO_TRIAL:\s*\{.*?\}\]/s, "").trim();
        const bName = leadData.negocio || leadData.nombre || "Mi Negocio";
        const cName = leadData.nombre || pushName || "Emprendedor";
        const email = (leadData.correo || `${cleanPhone}@betico.cr`).toLowerCase().trim();
        const baseSlug = bName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
        const slug = baseSlug + "-" + Math.floor(100 + Math.random() * 900);
        const tempPassword = "Btc" + Math.floor(1e5 + Math.random() * 9e5) + "!";
        const passwordHash = hashPassword(tempPassword);
        const trialEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3);
        const tenantRes = await query(`
          INSERT INTO tenants (name, slug, plan, whatsapp_number, custom_monthly_price, billing_currency, subscription_status, trial_ends_at, next_billing_date, active)
          VALUES ($1, $2, 'starter', $3, 29, 'CRC', 'trial', $4, $4, true)
          RETURNING id
        `, [bName, slug, cleanPhone, trialEnd]);
        const tenantId = tenantRes.rows[0].id;
        await query(`
          INSERT INTO users (tenant_id, name, email, password_hash, role, active)
          VALUES ($1, $2, $3, $4, 'admin', true)
        `, [tenantId, cName, email, passwordHash]);
        const welcomeCreds = `\u{1F389} \xA1Tu cuenta para *${bName}* ha sido creada exitosamente!

\u{1F517} *Enlace de Acceso:* https://betico.tech/login
\u{1F464} *Usuario:* ${email}
\u{1F511} *Contrase\xF1a Temporal:* ${tempPassword}

\u23F3 Cuentas con *15 d\xEDas de prueba gratis* hasta el *${trialEnd.toLocaleDateString("es-CR")}*.
\xA1Puedes ingresar ahora mismo y escanear el QR de tu WhatsApp!`;
        replyText += "\n\n" + welcomeCreds;
        await notifyNewTenantEnrollment({
          tenantName: bName,
          slug,
          contactName: cName,
          email,
          phone: cleanPhone,
          plan: "starter",
          monthlyPrice: 29,
          currency: "CRC",
          trialDays: 15,
          isManual: false
        });
      } catch (err) {
        console.error("[SuperadminBot] Error auto-enrolling tenant from WhatsApp lead:", err);
      }
    }
    await sendMessage(instanceName, cleanPhone, replyText);
    return true;
  } else {
    const systemPrompt = `Eres Betico Support AI, el Asistente Oficial de Soporte de Betico.tech.
Tu misi\xF3n es resolver dudas operativas a usuarios y clientes de la plataforma.

\u{1F4DA} BASE DE CONOCIMIENTOS BETICO:
- Conexi\xF3n de WhatsApp: Se realiza desde el men\xFA "WhatsApp", haciendo clic en "Conectar" y escaneando el c\xF3digo QR con la app de WhatsApp del celular.
- Tienda Online: Se gestiona en "Productos" y "Ajustes de Tienda". El enlace p\xFAblico es tudominio/tienda/tu-slug.
- Agenda de Citas: Se configura en "Servicios" y "Horarios". El enlace p\xFAblico es tudominio/reservas/tu-slug.
- SINPE M\xF3vil: Los comprobantes se validan autom\xE1ticamente con visi\xF3n por computadora si el cliente env\xEDa una captura del banco.
- Multi-Sucursal: Disponible en la pesta\xF1a "Sucursales" para gestionar m\xFAltiples sedes, KDS de cocina separados e inventario.
- Precios y Planes: Emprendedor ($29/mes), Profesional ($59/mes), Franquicias ($119/mes).

\u{1F512} REGLAS DE SEGURIDAD:
- Nunca reveles llaves de API, contrase\xF1as de bases de datos ni secretos de infraestructura.
- S\xE9 cordial, claro, conciso y responde en espa\xF1ol costarricense profesional con formato *WhatsApp*.
`;
    const prompt = `${systemPrompt}

Usuario (${pushName || "Usuario"}, +${cleanPhone}): "${userMessage}"
Responde como Betico Support AI:`;
    const aiResult = await callAI(masterAI, prompt);
    const replyText = aiResult.text || "Hola, con gusto te ayudamos. Por favor ind\xEDcanos con qu\xE9 m\xF3dulo necesitas asistencia.";
    await sendMessage(instanceName, cleanPhone, replyText);
    return true;
  }
}
var init_superadmin_bot_service = __esm({
  "src/server/services/superadmin-bot.service.ts"() {
    "use strict";
    init_ai_provider();
    init_evolution();
    init_pool();
    init_users_repo();
    init_superadmin_notify_service();
  }
});

// src/server/db/drivers.repo.ts
var drivers_repo_exports = {};
__export(drivers_repo_exports, {
  createDriver: () => createDriver,
  deleteDriver: () => deleteDriver,
  getActiveOrdersForDriver: () => getActiveOrdersForDriver,
  getCompletedOrdersForDriver: () => getCompletedOrdersForDriver,
  getDriverById: () => getDriverById,
  getDriverByPin: () => getDriverByPin,
  getDriversByTenant: () => getDriversByTenant,
  updateDriver: () => updateDriver
});
async function getDriversByTenant(tenantId) {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE tenant_id = $1
    ORDER BY name ASC
  `, [tenantId]);
  return res.rows;
}
async function getDriverById(id, tenantId) {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE id = $1
  `, [id]);
  return res.rows[0] || null;
}
async function getDriverByPin(pin, phone) {
  const cleanPin = (pin || "").trim();
  let sql = `
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE TRIM(access_pin) = $1 AND active = TRUE
  `;
  const params = [cleanPin];
  if (phone) {
    const clean = phone.replace(/\D/g, "");
    sql += ` AND (REPLACE(phone, '-', '') LIKE '%' || $2 OR phone LIKE '%' || $2)`;
    params.push(clean.slice(-8));
  }
  sql += ` LIMIT 1`;
  const res = await query(sql, params);
  return res.rows[0] || null;
}
async function createDriver(tenantId, data) {
  const pin = data.accessPin || Math.floor(1e3 + Math.random() * 9e3).toString();
  const res = await query(`
    INSERT INTO delivery_drivers (tenant_id, name, phone, access_pin, vehicle_type, plate_number, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
              vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
  `, [
    tenantId,
    data.name || "Repartidor",
    data.phone || "",
    pin,
    data.vehicleType || "moto",
    data.plateNumber || null,
    data.active !== false
  ]);
  return res.rows[0];
}
async function updateDriver(id, tenantId, data) {
  const res = await query(`
    UPDATE delivery_drivers
    SET name = COALESCE($3, name),
        phone = COALESCE($4, phone),
        access_pin = COALESCE($5, access_pin),
        vehicle_type = COALESCE($6, vehicle_type),
        plate_number = COALESCE($7, plate_number),
        active = COALESCE($8, active)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
              vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
  `, [id, tenantId, data.name, data.phone, data.accessPin, data.vehicleType, data.plateNumber, data.active]);
  return res.rows[0] || null;
}
async function deleteDriver(id, tenantId) {
  const res = await query(`DELETE FROM delivery_drivers WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}
async function getActiveOrdersForDriver(driverId) {
  const res = await query(`
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
           o.customer_name as "customerName", o.customer_phone as "customerPhone",
           o.customer_address as "customerAddress", o.customer_location as "customerLocation",
           o.total, o.currency, o.status, o.payment_method as "paymentMethod",
           o.payment_status as "paymentStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
           o.driver_id as "driverId", o.waze_url as "wazeUrl", o.created_at as "createdAt"
    FROM orders o
    WHERE o.driver_id = $1
      AND o.status NOT IN ('delivered', 'entregado', 'cancelled', 'cancelado')
    ORDER BY o.created_at DESC
  `, [driverId]);
  const orders = [];
  for (const row of res.rows) {
    const itemsRes = await query(`
      SELECT id, product_name as "productName", quantity, unit_price as "unitPrice", total_price as "totalPrice"
      FROM order_items
      WHERE order_id = $1
    `, [row.id]);
    orders.push({ ...row, items: itemsRes.rows });
  }
  return orders;
}
async function getCompletedOrdersForDriver(driverId, fromDate, toDate) {
  let sql = `
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
           o.customer_name as "customerName", o.customer_phone as "customerPhone",
           o.customer_address as "customerAddress", o.customer_location as "customerLocation",
           o.total, o.currency, o.status, o.payment_method as "paymentMethod",
           o.payment_status as "paymentStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
           o.driver_id as "driverId", o.waze_url as "wazeUrl", o.created_at as "createdAt"
    FROM orders o
    WHERE o.driver_id = $1
      AND o.status IN ('delivered', 'entregado')
  `;
  const params = [driverId];
  if (fromDate) {
    params.push(fromDate);
    sql += ` AND o.created_at >= $${params.length}::timestamp`;
  }
  if (toDate) {
    params.push(toDate);
    sql += ` AND o.created_at <= $${params.length}::timestamp + interval '1 day'`;
  }
  sql += ` ORDER BY o.created_at DESC`;
  const res = await query(sql, params);
  const orders = [];
  for (const row of res.rows) {
    const itemsRes = await query(`
      SELECT id, product_name as "productName", quantity, unit_price as "unitPrice", total_price as "totalPrice"
      FROM order_items
      WHERE order_id = $1
    `, [row.id]);
    orders.push({ ...row, items: itemsRes.rows });
  }
  return orders;
}
var init_drivers_repo = __esm({
  "src/server/db/drivers.repo.ts"() {
    "use strict";
    init_pool();
  }
});

// src/server/index.ts
init_env();
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit2 from "express-rate-limit";
import path2 from "path";
import { fileURLToPath } from "url";
import fs2 from "fs";

// src/server/db/migrations.ts
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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
  await query(tables);
  const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "admin@betico.cr").toLowerCase().trim();
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || "BeticoAdmin2026!";
  const modernHash = hashPassword(superAdminPassword);
  const checkAdmin = await query(`SELECT id, tenant_id FROM users WHERE LOWER(email) = LOWER($1)`, [superAdminEmail]);
  if (checkAdmin.rows.length === 0) {
    let tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'superadmin'`);
    let tenantId;
    if (tenantRes.rows.length === 0) {
      const created = await query(`
        INSERT INTO tenants (name, slug, active, plan) 
        VALUES ('Betico Superadmin', 'superadmin', true, 'enterprise') 
        RETURNING id
      `);
      tenantId = created.rows[0].id;
    } else {
      tenantId = tenantRes.rows[0].id;
    }
    await query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, active)
      VALUES ($1, 'Super Admin', $2, $3, 'superadmin', true)
    `, [tenantId, superAdminEmail, modernHash]);
    console.log("Superadmin user created successfully.");
  } else {
    await query(`
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
    { key: "deploy_webhook_localai", value: "http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e" }
  ];
  for (const s of defaultPlatformSettings) {
    await query(`
      INSERT INTO platform_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = CASE 
        WHEN platform_settings.value = 'http://localhost:8080/v1' THEN EXCLUDED.value 
        ELSE platform_settings.value 
      END
    `, [s.key, s.value]);
  }
  await query(`
    UPDATE platform_settings 
    SET value = 'https://beticoia-localai.qvtdko.easypanel.host/v1' 
    WHERE key = 'localai_url' AND (value = 'http://localhost:8080/v1' OR value IS NULL OR value = '')
  `);
  await query(`
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
  `);
  await query(`
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS show_courts_button BOOLEAN DEFAULT false;
    ALTER TABLE tenant_websites ADD COLUMN IF NOT EXISTS courts_button_text VARCHAR(255) DEFAULT 'Reservar Cancha';
  `).catch(() => {
  });
  console.log("Migrations completed successfully.");
}

// src/server/index.ts
init_pool();

// src/server/services/reminder.service.ts
init_pool();
init_evolution();
var DEFAULT_REMINDER_CONFIG = {
  enabled: true,
  firstReminderEnabled: true,
  firstReminderHoursBefore: 24,
  firstReminderTemplate: "\u{1F44B} Hola *{{nombre}}*, te recordamos tu cita para *{{servicio}}* agendada para el d\xEDa *{{fecha}}* a las *{{hora}}* en *{{negocio}}*. \xA1Te esperamos!",
  secondReminderEnabled: true,
  secondReminderHoursBefore: 2,
  secondReminderTemplate: "\u23F0 Hola *{{nombre}}*, tu cita para *{{servicio}}* en *{{negocio}}* es hoy a las *{{hora}}* (en unas {{horas}} horas). Si necesitas reagendar, av\xEDsanos con tiempo."
};
function startReminderScheduler() {
  console.log("[ReminderService] Starting automated appointment reminder scheduler (interval: 3 mins)...");
  setTimeout(checkAndSendReminders, 1e4);
  setInterval(checkAndSendReminders, 3 * 60 * 1e3);
}
async function checkAndSendReminders() {
  try {
    const tenantsRes = await query(`
      SELECT id, name, slug, evolution_instance as "evolutionInstance", 
             reminder_config as "reminderConfig", settings_json as "settingsJson"
      FROM tenants 
      WHERE active = true AND evolution_instance IS NOT NULL AND evolution_instance != ''
    `);
    if (tenantsRes.rows.length === 0) return;
    const now = /* @__PURE__ */ new Date();
    for (const tenant of tenantsRes.rows) {
      try {
        const config = {
          ...DEFAULT_REMINDER_CONFIG,
          ...tenant.reminderConfig || tenant.settingsJson?.reminderConfig || {}
        };
        if (!config.enabled) continue;
        const apptsRes = await query(`
          SELECT id, name, whatsapp, service, date, time, amount, details, vehicle_model as "vehicleModel",
                 reminder_1_sent as "reminder1Sent", reminder_2_sent as "reminder2Sent"
          FROM appointments
          WHERE tenant_id = $1 
            AND status IN ('pending', 'scheduled', 'confirmed')
            AND date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
            AND date <= TO_CHAR(CURRENT_DATE + INTERVAL '3 days', 'YYYY-MM-DD')
        `, [tenant.id]);
        for (const appt of apptsRes.rows) {
          if (!appt.whatsapp || !appt.date || !appt.time) continue;
          const [year, month, day] = appt.date.split("-").map(Number);
          const [hour, minute] = appt.time.split(":").map(Number);
          const apptDate = new Date(year, month - 1, day, hour, minute || 0);
          const diffMs = apptDate.getTime() - now.getTime();
          const diffHours = diffMs / (1e3 * 60 * 60);
          if (diffHours < 0) continue;
          const cleanPhone = appt.whatsapp.replace(/\D/g, "");
          if (!cleanPhone) continue;
          const replacePlaceholders = (template, hoursRemaining) => {
            return template.replace(/\{\{nombre\}\}/gi, appt.name || "estimado cliente").replace(/\{\{servicio\}\}/gi, appt.service || "su cita").replace(/\{\{fecha\}\}/gi, appt.date).replace(/\{\{hora\}\}/gi, appt.time).replace(/\{\{negocio\}\}/gi, tenant.name).replace(/\{\{monto\}\}/gi, appt.amount ? `\u20A1${Number(appt.amount).toLocaleString("es-CR")}` : "").replace(/\{\{detalles\}\}/gi, appt.vehicleModel || appt.details || "").replace(/\{\{horas\}\}/gi, String(Math.round(hoursRemaining)));
          };
          if (config.firstReminderEnabled && !appt.reminder1Sent && diffHours <= config.firstReminderHoursBefore && diffHours > (config.secondReminderEnabled ? config.secondReminderHoursBefore : 0)) {
            const message = replacePlaceholders(config.firstReminderTemplate, diffHours);
            const sent = await sendMessage(tenant.evolutionInstance, cleanPhone, message);
            if (sent.success) {
              await query(`UPDATE appointments SET reminder_1_sent = true WHERE id = $1`, [appt.id]);
              console.log(`[ReminderService] Sent 1st reminder (${config.firstReminderHoursBefore}h) for appt ${appt.id} to ${cleanPhone}`);
            }
          }
          if (config.secondReminderEnabled && !appt.reminder2Sent && diffHours <= config.secondReminderHoursBefore && diffHours > 0) {
            const message = replacePlaceholders(config.secondReminderTemplate, diffHours);
            const sent = await sendMessage(tenant.evolutionInstance, cleanPhone, message);
            if (sent.success) {
              await query(`UPDATE appointments SET reminder_2_sent = true, reminder_1_sent = true WHERE id = $1`, [appt.id]);
              console.log(`[ReminderService] Sent 2nd reminder (${config.secondReminderHoursBefore}h) for appt ${appt.id} to ${cleanPhone}`);
            }
          }
        }
      } catch (tErr) {
        console.error(`[ReminderService] Error processing reminders for tenant ${tenant.id}:`, tErr);
      }
    }
  } catch (err) {
    console.error("[ReminderService] General error in checkAndSendReminders:", err);
  }
}

// src/server/services/campaign-queue.service.ts
init_pool();
init_evolution();
import { Redis } from "ioredis";

// src/server/db/tenant.repo.ts
init_pool();
async function getAllTenants() {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, subscription_status as "subscriptionStatus",
           billing_currency as "billingCurrency", custom_monthly_price as "customMonthlyPrice",
           trial_ends_at as "trialEndsAt", next_billing_date as "nextBillingDate",
           grace_period_ends_at as "gracePeriodEndsAt", settings_json as "settingsJson", 
           created_at as "createdAt"
    FROM tenants 
    ORDER BY created_at DESC
  `);
  return result.rows;
}
async function getTenantById(id) {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           subscription_status as "subscriptionStatus", billing_currency as "billingCurrency", 
           custom_monthly_price as "customMonthlyPrice", trial_ends_at as "trialEndsAt", 
           next_billing_date as "nextBillingDate", grace_period_ends_at as "gracePeriodEndsAt",
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}
async function getTenantBySlug(slug) {
  const cleanSlug = (slug || "").trim().toLowerCase();
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_api_key_encrypted as "aiApiKeyEncrypted",
           t.ai_model as "aiModel", t.evolution_instance as "evolutionInstance", 
           t.whatsapp_number as "whatsappNumber", t.plan, t.active, 
           t.subscription_status as "subscriptionStatus", t.billing_currency as "billingCurrency",
           t.custom_monthly_price as "customMonthlyPrice", t.trial_ends_at as "trialEndsAt",
           t.settings_json as "settingsJson", t.created_at as "createdAt"
    FROM tenants t
    LEFT JOIN store_settings ss ON ss.tenant_id = t.id
    WHERE LOWER(t.slug) = $1 OR LOWER(ss.store_slug) = $1
    LIMIT 1
  `, [cleanSlug]);
  return result.rows[0] || null;
}
async function getTenantByEvolutionInstance(instanceName) {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE evolution_instance = $1
  `, [instanceName]);
  return result.rows[0] || null;
}
async function createTenant(data) {
  const finalPrice = data.customMonthlyPrice !== void 0 ? Number(data.customMonthlyPrice) : data.plan === "enterprise" ? 85e3 : data.plan === "aliado" ? 0 : data.plan === "emprendedor" ? 35e3 : 55e3;
  const result = await query(`
    INSERT INTO tenants (
      name, slug, custom_domain, ai_provider, ai_api_key_encrypted, 
      ai_model, evolution_instance, whatsapp_number, plan, active,
      custom_monthly_price, billing_currency, subscription_status, trial_ends_at, settings_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, custom_monthly_price as "customMonthlyPrice", billing_currency as "billingCurrency",
           subscription_status as "subscriptionStatus", trial_ends_at as "trialEndsAt",
           settings_json as "settingsJson", created_at as "createdAt"
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
    data.settingsJson || null
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
    grace_period_ends_at: "grace_period_ends_at"
  };
  const validEntries = Object.entries(data).filter(([k, v]) => allowedColumns[k] !== void 0 && v !== void 0);
  if (validEntries.length === 0) return getTenantById(id);
  const setClause = validEntries.map(([key], index) => {
    const dbColumn = allowedColumns[key];
    return `${dbColumn} = $${index + 2}`;
  }).join(", ");
  const values = validEntries.map(([, val]) => val);
  const result = await query(`
    UPDATE tenants SET ${setClause}
    WHERE id = $1
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, subscription_status as "subscriptionStatus",
           billing_currency as "billingCurrency", custom_monthly_price as "customMonthlyPrice",
           trial_ends_at as "trialEndsAt", settings_json as "settingsJson", created_at as "createdAt"
  `, [id, ...values]);
  return result.rows[0] || null;
}
async function deleteTenant(id) {
  const result = await query("DELETE FROM tenants WHERE id = $1", [id]);
  return (result.rowCount || 0) > 0;
}

// src/server/services/campaign-queue.service.ts
var REDIS_URL = process.env.REDIS_URL || "redis://betico_redis:6379";
var redis = null;
try {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 1e3);
    },
    lazyConnect: true
  });
  redis.connect().catch(() => {
    console.log("[Redis] Redis not available, using in-memory queue fallback.");
    redis = null;
  });
} catch (e) {
  redis = null;
}
var activeJobs = /* @__PURE__ */ new Map();
async function enqueueCampaign(campaignId, tenantId) {
  if (activeJobs.has(campaignId) && !activeJobs.get(campaignId)?.isCancelled) {
    console.log(`[CampaignQueue] Campaign ${campaignId} is already running.`);
    return false;
  }
  const job = {
    campaignId,
    tenantId,
    isPaused: false,
    isCancelled: false
  };
  activeJobs.set(campaignId, job);
  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, {
        status: "sending",
        tenantId,
        startedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (e) {
    }
  }
  processCampaignJob(job);
  return true;
}
async function pauseCampaign(campaignId, tenantId) {
  const job = activeJobs.get(campaignId);
  if (job) {
    job.isPaused = true;
  }
  const sql = tenantId ? `UPDATE whatsapp_campaigns SET status = 'paused' WHERE id = $1 AND tenant_id = $2` : `UPDATE whatsapp_campaigns SET status = 'paused' WHERE id = $1`;
  const params = tenantId ? [campaignId, tenantId] : [campaignId];
  await query(sql, params);
  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, "status", "paused");
    } catch (e) {
    }
  }
  return true;
}
async function resumeCampaign(campaignId, tenantId) {
  let job = activeJobs.get(campaignId);
  if (job) {
    job.isPaused = false;
  } else {
    job = { campaignId, tenantId, isPaused: false, isCancelled: false };
    activeJobs.set(campaignId, job);
  }
  await query(`UPDATE whatsapp_campaigns SET status = 'sending' WHERE id = $1 AND tenant_id = $2`, [campaignId, tenantId]);
  if (redis) {
    try {
      await redis.hset(`campaign:${campaignId}`, "status", "sending");
    } catch (e) {
    }
  }
  processCampaignJob(job);
  return true;
}
async function cancelCampaign(campaignId, tenantId) {
  const job = activeJobs.get(campaignId);
  if (job) {
    job.isCancelled = true;
  }
  activeJobs.delete(campaignId);
  const sql = tenantId ? `UPDATE whatsapp_campaigns SET status = 'cancelled' WHERE id = $1 AND tenant_id = $2` : `UPDATE whatsapp_campaigns SET status = 'cancelled' WHERE id = $1`;
  const params = tenantId ? [campaignId, tenantId] : [campaignId];
  await query(sql, params);
  if (redis) {
    try {
      await redis.del(`campaign:${campaignId}`);
    } catch (e) {
    }
  }
  return true;
}
async function processCampaignJob(job) {
  const { campaignId, tenantId } = job;
  try {
    const campRes = await query(`SELECT * FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2`, [campaignId, tenantId]);
    if (campRes.rows.length === 0) return;
    const campaign = campRes.rows[0];
    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) return;
    let customers = [];
    if (campaign.target_contacts && Array.isArray(campaign.target_contacts) && campaign.target_contacts.length > 0) {
      customers = campaign.target_contacts;
    } else {
      let custQuery = `SELECT id, name, phone FROM customers WHERE tenant_id = $1`;
      const params = [tenantId];
      if (campaign.target_segment === "tag" && campaign.target_tag) {
        custQuery += ` AND $2 = ANY(tags)`;
        params.push(campaign.target_tag);
      }
      custQuery += ` ORDER BY last_interaction DESC`;
      const customersRes = await query(custQuery, params);
      customers = customersRes.rows;
    }
    let sentCount = Number(campaign.sent_count || 0);
    let failedCount = Number(campaign.failed_count || 0);
    const startIndex = sentCount + failedCount;
    for (let i = startIndex; i < customers.length; i++) {
      if (job.isCancelled) {
        console.log(`[CampaignQueue] Campaign ${campaignId} was cancelled.`);
        return;
      }
      if (job.isPaused) {
        console.log(`[CampaignQueue] Campaign ${campaignId} is paused at index ${i}.`);
        return;
      }
      const cust = customers[i];
      const cleanPhone = cust.phone.replace(/\D/g, "");
      if (!cleanPhone) continue;
      const text = campaign.message_template.replace(/\{\{nombre\}\}/gi, cust.name || "estimado cliente").replace(/\{\{negocio\}\}/gi, tenant.name);
      try {
        let sendRes;
        if (campaign.media_url) {
          sendRes = await sendMedia(tenant.evolutionInstance, cleanPhone, campaign.media_url, text);
        } else {
          sendRes = await sendMessage(tenant.evolutionInstance, cleanPhone, text);
        }
        if (sendRes.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
      if ((sentCount + failedCount) % 3 === 0 || i === customers.length - 1) {
        await query(`
          UPDATE whatsapp_campaigns 
          SET sent_count = $1, failed_count = $2 
          WHERE id = $3
        `, [sentCount, failedCount, campaignId]);
        if (redis) {
          try {
            await redis.hset(`campaign:${campaignId}`, {
              sentCount: String(sentCount),
              failedCount: String(failedCount),
              currentIndex: String(i)
            });
          } catch (e) {
          }
        }
      }
      await new Promise((r) => setTimeout(r, 3500));
    }
    await query(`
      UPDATE whatsapp_campaigns 
      SET sent_count = $1, failed_count = $2, status = 'completed' 
      WHERE id = $3
    `, [sentCount, failedCount, campaignId]);
    activeJobs.delete(campaignId);
    if (redis) {
      try {
        await redis.del(`campaign:${campaignId}`);
      } catch (e) {
      }
    }
    console.log(`[CampaignQueue] Campaign ${campaignId} finished. Total sent: ${sentCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error(`[CampaignQueue] Error processing campaign ${campaignId}:`, error);
    activeJobs.delete(campaignId);
  }
}
async function recoverInterruptedCampaigns() {
  try {
    const interrupted = await query(`SELECT id, tenant_id as "tenantId" FROM whatsapp_campaigns WHERE status = 'sending'`);
    for (const c of interrupted.rows) {
      console.log(`[CampaignQueue] Resuming interrupted campaign ${c.id} from database state...`);
      await enqueueCampaign(c.id, c.tenantId);
    }
  } catch (err) {
    console.error("[CampaignQueue] Error recovering interrupted campaigns:", err);
  }
}
function startScheduledCampaignScanner() {
  console.log("[CampaignQueue] Starting scheduled campaign scanner (30s interval)...");
  setInterval(async () => {
    try {
      const res = await query(`
        SELECT id, tenant_id as "tenantId" 
        FROM whatsapp_campaigns 
        WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= CURRENT_TIMESTAMP
      `);
      for (const row of res.rows) {
        console.log(`[CampaignQueue] Triggering scheduled campaign ${row.id}...`);
        await query(`UPDATE whatsapp_campaigns SET status = 'sending' WHERE id = $1`, [row.id]);
        await enqueueCampaign(row.id, row.tenantId);
      }
    } catch (err) {
      console.error("[CampaignQueue] Error scanning scheduled campaigns:", err);
    }
  }, 3e4);
}

// src/server/services/subscription.service.ts
init_pool();
init_evolution();
init_superadmin_notify_service();
async function checkSubscriptionLifecycles() {
  try {
    const now = /* @__PURE__ */ new Date();
    const expiredTrials = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", 
             custom_monthly_price as "monthlyPrice", billing_currency as "currency",
             evolution_instance as "evolutionInstance"
      FROM tenants
      WHERE subscription_status = 'trial' 
        AND trial_ends_at IS NOT NULL 
        AND trial_ends_at <= CURRENT_TIMESTAMP
    `);
    for (const t of expiredTrials.rows) {
      console.log(`[Subscription] Tenant ${t.name} trial has ended. Moving to 15-day grace period...`);
      await query(`
        UPDATE tenants
        SET subscription_status = 'grace_period',
            grace_period_ends_at = CURRENT_TIMESTAMP + INTERVAL '15 days',
            next_billing_date = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [t.id]);
      const price = Number(t.monthlyPrice || 29);
      const currency = t.currency || "CRC";
      const formattedPrice = currency === "USD" ? `$${price}` : `\u20A1${price.toLocaleString("es-CR")}`;
      if (t.whatsappNumber) {
        const cleanPhone = t.whatsappNumber.replace(/\D/g, "");
        const reminderMsg = `\u{1F44B} \xA1Hola *${t.name}*! Esperamos que est\xE9s disfrutando de Betico.

Tu per\xEDodo de prueba de 15 d\xEDas ha finalizado. Tu mensualidad acordada es de *${formattedPrice}*.

Cuenta con un *per\xEDodo de gracia de 15 d\xEDas* para realizar tu pago por SINPE M\xF3vil o transferencia y subir tu comprobante en el panel para continuar disfrutando del servicio sin interrupciones.

\xA1Gracias por tu confianza!`;
        try {
          const instance = t.evolutionInstance || "betico_soporte";
          await sendMessage(instance, cleanPhone, reminderMsg);
        } catch (e) {
          console.error("[Subscription] Error sending tenant reminder:", e);
        }
      }
      await notifyGracePeriodStarted({
        tenantName: t.name,
        slug: t.slug,
        phone: t.whatsappNumber || "",
        monthlyPrice: price,
        currency
      });
    }
    const expiredGrace = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", evolution_instance as "evolutionInstance"
      FROM tenants
      WHERE subscription_status = 'grace_period'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at <= CURRENT_TIMESTAMP
    `);
    for (const t of expiredGrace.rows) {
      console.log(`[Subscription] Tenant ${t.name} grace period ended. Suspending account...`);
      await query(`
        UPDATE tenants
        SET subscription_status = 'suspended'
        WHERE id = $1
      `, [t.id]);
      if (t.whatsappNumber) {
        const cleanPhone = t.whatsappNumber.replace(/\D/g, "");
        const suspendedMsg = `\u{1F512} *[Aviso de Suspensi\xF3n - Betico]*

Hola *${t.name}*, tu cuenta ha sido pausada temporalmente tras cumplirse los 15 d\xEDas de gracia sin registrar pago.

Para reactivar tu tienda y asistente de WhatsApp de inmediato, ingresa a tu panel y adjunta tu comprobante de pago o cont\xE1ctanos por este medio. \xA1Estamos para ayudarte!`;
        try {
          const instance = t.evolutionInstance || "betico_soporte";
          await sendMessage(instance, cleanPhone, suspendedMsg);
        } catch (e) {
          console.error("[Subscription] Error sending suspension notice to tenant:", e);
        }
      }
      await notifyAccountSuspended({
        tenantName: t.name,
        slug: t.slug,
        phone: t.whatsappNumber || ""
      });
    }
  } catch (error) {
    console.error("[Subscription] Error checking subscription lifecycles:", error);
  }
}
function startSubscriptionLifecycleWorker() {
  console.log("[Subscription] Starting subscription lifecycle worker (checks hourly)...");
  setTimeout(() => {
    checkSubscriptionLifecycles();
  }, 5e3);
  setInterval(() => {
    checkSubscriptionLifecycles();
  }, 60 * 60 * 1e3);
}

// src/server/db/message-queue.repo.ts
init_pool();
async function ensureQueueTable() {
  const sql = `
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
  `;
  await query(sql);
}
async function enqueueMessage(tenantId, remoteJid, pushName, cleanPhone, userMessage, instanceName, isVoiceNote = false) {
  const existingRes = await query(`
    SELECT id, user_message, is_voice_note 
    FROM message_queue
    WHERE tenant_id = $1 AND remote_jid = $2 AND status = 'pending'
      AND created_at >= (CURRENT_TIMESTAMP - INTERVAL '5 seconds')
    ORDER BY created_at DESC 
    LIMIT 1
  `, [tenantId, remoteJid]);
  if (existingRes.rows.length > 0) {
    const existing = existingRes.rows[0];
    const updatedRes = await query(`
      UPDATE message_queue
      SET user_message = user_message || E'
' || $1,
          is_voice_note = is_voice_note OR $2,
          created_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [userMessage, isVoiceNote, existing.id]);
    return mapToQueueMessage(updatedRes.rows[0]);
  }
  const sql = `
    INSERT INTO message_queue 
    (tenant_id, remote_jid, push_name, clean_phone, user_message, instance_name, status, is_voice_note)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
    RETURNING *;
  `;
  const result = await query(sql, [tenantId, remoteJid, pushName, cleanPhone, userMessage, instanceName, isVoiceNote]);
  return mapToQueueMessage(result.rows[0]);
}
async function consumePendingForChat(tenantId, remoteJid, currentMessageId) {
  const res = await query(`
    UPDATE message_queue
    SET status = 'done', completed_at = CURRENT_TIMESTAMP, ai_response = 'DEBOUNCED_CONCAT'
    WHERE tenant_id = $1 AND remote_jid = $2 AND status = 'pending' AND id != $3
    RETURNING user_message
  `, [tenantId, remoteJid, currentMessageId]);
  return res.rows.map((r) => r.user_message);
}
async function takeNextPending(excludeChatKeys = []) {
  let excludeClause = "";
  const params = [];
  if (excludeChatKeys && excludeChatKeys.length > 0) {
    excludeClause = "AND (tenant_id || ':' || remote_jid) != ALL($1::text[])";
    params.push(excludeChatKeys);
  }
  const sql = `
    UPDATE message_queue SET status = 'processing', processed_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT id FROM message_queue 
      WHERE status = 'pending' ${excludeClause}
      ORDER BY created_at ASC 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;
  const result = await query(sql, params);
  if (result.rows.length === 0) return null;
  return mapToQueueMessage(result.rows[0]);
}
async function markDone(id, aiResponse) {
  const sql = `
    UPDATE message_queue 
    SET status = 'done', completed_at = CURRENT_TIMESTAMP, ai_response = $1
    WHERE id = $2;
  `;
  await query(sql, [aiResponse, id]);
}
async function markFailed(id, errorMessage) {
  const sql = `
    UPDATE message_queue 
    SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = $1
    WHERE id = $2;
  `;
  await query(sql, [errorMessage, id]);
}
async function getPendingByTenant(tenantId) {
  const sql = `
    SELECT * FROM message_queue 
    WHERE tenant_id = $1 AND status IN ('pending', 'processing')
    ORDER BY created_at ASC;
  `;
  const result = await query(sql, [tenantId]);
  return result.rows.map(mapToQueueMessage);
}
async function getQueueStats(tenantId) {
  let sql = `SELECT status, count(*) as count FROM message_queue `;
  const params = [];
  if (tenantId) {
    sql += `WHERE tenant_id = $1 `;
    params.push(tenantId);
  }
  sql += `GROUP BY status;`;
  const result = await query(sql, params);
  const stats = { pending: 0, processing: 0, done: 0, failed: 0 };
  for (const row of result.rows) {
    if (row.status === "pending") stats.pending = parseInt(row.count, 10);
    if (row.status === "processing") stats.processing = parseInt(row.count, 10);
    if (row.status === "done") stats.done = parseInt(row.count, 10);
    if (row.status === "failed") stats.failed = parseInt(row.count, 10);
  }
  return stats;
}
function mapToQueueMessage(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    remoteJid: row.remote_jid,
    pushName: row.push_name,
    cleanPhone: row.clean_phone,
    userMessage: row.user_message,
    instanceName: row.instance_name,
    status: row.status,
    isVoiceNote: row.is_voice_note,
    errorMessage: row.error_message,
    aiResponse: row.ai_response,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    completedAt: row.completed_at
  };
}

// src/server/services/agent.ts
init_ai_provider();
init_encryption();

// src/server/db/agent-config.repo.ts
init_pool();
var defaultSystemPrompt = `You are an AI assistant. Help customers politely and concisely.`;
async function getAgentConfig(tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", config_json as "configJson", updated_at as "updatedAt"
    FROM agent_settings 
    WHERE tenant_id = $1
  `, [tenantId]);
  if (result.rows.length === 0) {
    return {
      tenantId,
      systemPrompt: defaultSystemPrompt,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      autoReplyEnabled: true,
      humanHandoffEnabled: true,
      handoffKeywords: ["humano", "asesor", "persona", "agente", "hablar con alguien", "queja", "reclamo", "urgente"],
      showBookingLink: true,
      showStoreLink: true
    };
  }
  const data = result.rows[0].configJson || {};
  return {
    id: result.rows[0].id,
    tenantId: result.rows[0].tenantId,
    systemPrompt: data.systemPrompt || defaultSystemPrompt,
    model: data.model || "gemini-2.5-flash",
    temperature: data.temperature ?? 0.7,
    aiChatbotEnabled: data.aiChatbotEnabled ?? true,
    autoReplyEnabled: data.autoReplyEnabled ?? true,
    notifyNumber: data.notifyNumber,
    businessName: data.businessName,
    currency: data.currency,
    humanHandoffEnabled: data.humanHandoffEnabled ?? true,
    handoffKeywords: data.handoffKeywords || ["humano", "asesor", "persona", "agente", "hablar con alguien", "queja", "reclamo", "urgente"],
    handoffNotifyPhone: data.handoffNotifyPhone || data.notifyNumber,
    showBookingLink: data.showBookingLink ?? true,
    showStoreLink: data.showStoreLink ?? true,
    updatedAt: result.rows[0].updatedAt
  };
}
async function saveAgentConfig(tenantId, config) {
  const configJson = {
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: config.temperature,
    aiChatbotEnabled: config.aiChatbotEnabled,
    autoReplyEnabled: config.autoReplyEnabled,
    notifyNumber: config.notifyNumber,
    businessName: config.businessName,
    currency: config.currency,
    humanHandoffEnabled: config.humanHandoffEnabled,
    handoffKeywords: config.handoffKeywords,
    handoffNotifyPhone: config.handoffNotifyPhone,
    showBookingLink: config.showBookingLink,
    showStoreLink: config.showStoreLink
  };
  const result = await query(`
    INSERT INTO agent_settings (tenant_id, config_json, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) 
    DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", config_json as "configJson", updated_at as "updatedAt"
  `, [tenantId, configJson]);
  const data = result.rows[0].configJson;
  return {
    id: result.rows[0].id,
    tenantId: result.rows[0].tenantId,
    systemPrompt: data.systemPrompt,
    model: data.model,
    temperature: data.temperature,
    autoReplyEnabled: data.autoReplyEnabled,
    notifyNumber: data.notifyNumber,
    businessName: data.businessName,
    currency: data.currency,
    humanHandoffEnabled: data.humanHandoffEnabled,
    handoffKeywords: data.handoffKeywords,
    handoffNotifyPhone: data.handoffNotifyPhone,
    showBookingLink: data.showBookingLink ?? true,
    showStoreLink: data.showStoreLink ?? true,
    updatedAt: result.rows[0].updatedAt
  };
}

// src/server/db/services.repo.ts
init_pool();
async function getServicesByTenant(tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, parallel_slots as "parallelSlots", custom_variables as "customVariables",
           notes, active, created_at as "createdAt"
    FROM services 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}
async function getServiceById(id, tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, parallel_slots as "parallelSlots", custom_variables as "customVariables",
           notes, active, created_at as "createdAt"
    FROM services 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}
async function createService(tenantId, data) {
  const result = await query(`
    INSERT INTO services (
      tenant_id, name, description, price, price_display, duration, estimated_minutes, category, parallel_slots, custom_variables, notes, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, parallel_slots as "parallelSlots", custom_variables as "customVariables",
           notes, active, created_at as "createdAt"
  `, [
    tenantId,
    data.name,
    data.description,
    data.price,
    data.priceDisplay,
    data.duration,
    data.estimatedMinutes,
    data.category,
    data.parallelSlots || 1,
    JSON.stringify(data.customVariables || []),
    data.notes,
    data.active !== false
  ]);
  return result.rows[0];
}
async function updateService(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  const fields = ["name", "description", "price", "priceDisplay", "duration", "estimatedMinutes", "category", "parallelSlots", "customVariables", "notes", "active"];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      const val = field === "customVariables" ? JSON.stringify(data[field]) : data[field];
      params.push(val);
    }
  }
  if (updates.length === 0) return getServiceById(id, tenantId);
  const result = await query(`
    UPDATE services SET ${updates.join(", ")}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, description, price, 
           price_display as "priceDisplay", duration, estimated_minutes as "estimatedMinutes",
           category, parallel_slots as "parallelSlots", custom_variables as "customVariables",
           notes, active, created_at as "createdAt"
  `, params);
  return result.rows[0] || null;
}
async function deleteService(id, tenantId) {
  const result = await query("DELETE FROM services WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}

// src/server/db/products.repo.ts
init_pool();
async function getProductsByTenant(tenantId, activeOnly = false) {
  let sql = `
    SELECT p.id, p.tenant_id as "tenantId", p.name, p.slug, p.description, p.price, p.compare_at_price as "compareAtPrice",
           p.currency, p.category, p.tags, p.stock, p.track_stock as "trackStock", p.sku, p.weight_grams as "weightGrams",
           p.custom_variables as "customVariables", p.featured, p.active,
           p.created_at as "createdAt", p.updated_at as "updatedAt",
           COALESCE(
             (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary) ORDER BY pi.sort_order ASC)
              FROM product_images pi WHERE pi.product_id = p.id), '[]'::json
           ) as images,
           COALESCE(
             (SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'priceOverride', pv.price_override, 'stock', pv.stock))
              FROM product_variants pv WHERE pv.product_id = p.id), '[]'::json
           ) as variants
    FROM products p
    WHERE p.tenant_id = $1
  `;
  const params = [tenantId];
  if (activeOnly) {
    sql += ` AND p.active = true`;
  }
  sql += ` ORDER BY p.sort_order ASC, p.created_at DESC`;
  const result = await query(sql, params);
  return result.rows;
}
async function getProductById(id, tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, slug, description, price, compare_at_price as "compareAtPrice",
           currency, category, tags, stock, track_stock as "trackStock", p.weight_grams as "weightGrams", 
           p.custom_variables as "customVariables", sku, featured, active,
           created_at as "createdAt", updated_at as "updatedAt"
    FROM products p
    WHERE p.id = $1 AND p.tenant_id = $2
  `, [id, tenantId]);
  if (result.rows.length === 0) return null;
  const product = result.rows[0];
  const imgRes = await query(`
    SELECT id, url, alt_text as "altText", sort_order as "sortOrder", is_primary as "isPrimary"
    FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC
  `, [id]);
  const varRes = await query(`
    SELECT id, name, sku, price_override as "priceOverride", stock, attributes, active
    FROM product_variants WHERE product_id = $1
  `, [id]);
  product.images = imgRes.rows;
  product.variants = varRes.rows;
  return product;
}
async function getProductBySlug(slug, tenantId) {
  const result = await query(`
    SELECT p.id, p.tenant_id as "tenantId", p.name, p.slug, p.description, p.price, p.compare_at_price as "compareAtPrice",
           p.currency, p.category, p.tags, p.stock, p.track_stock as "trackStock", p.weight_grams as "weightGrams",
           p.custom_variables as "customVariables", p.sku, p.featured, p.active,
           p.created_at as "createdAt", p.updated_at as "updatedAt"
    FROM products p
    WHERE p.slug = $1 AND p.tenant_id = $2
  `, [slug, tenantId]);
  if (result.rows.length === 0) return null;
  const product = result.rows[0];
  const imgRes = await query(`
    SELECT id, url, alt_text as "altText", sort_order as "sortOrder", is_primary as "isPrimary"
    FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC
  `, [product.id]);
  const varRes = await query(`
    SELECT id, name, sku, price_override as "priceOverride", stock, attributes, active
    FROM product_variants WHERE product_id = $1
  `, [product.id]);
  product.images = imgRes.rows;
  product.variants = varRes.rows;
  return product;
}
async function createProduct(tenantId, data) {
  const result = await query(`
    INSERT INTO products (
      tenant_id, name, slug, description, price, compare_at_price, currency, 
      category, tags, stock, track_stock, weight_grams, custom_variables, sku, featured, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING id, tenant_id as "tenantId", name, slug, description, price, compare_at_price as "compareAtPrice",
           currency, category, tags, stock, track_stock as "trackStock", weight_grams as "weightGrams", 
           custom_variables as "customVariables", sku, featured, active,
           created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId,
    data.name,
    data.slug,
    data.description,
    data.price,
    data.compareAtPrice,
    data.currency || "CRC",
    data.category,
    data.tags,
    data.stock || 0,
    data.trackStock !== false,
    data.weightGrams || 0,
    JSON.stringify(data.customVariables || []),
    data.sku,
    data.featured || false,
    data.active !== false
  ]);
  const product = result.rows[0];
  product.images = [];
  product.variants = [];
  return product;
}
async function updateProduct(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  const fields = ["name", "slug", "description", "price", "compareAtPrice", "currency", "category", "tags", "stock", "trackStock", "weightGrams", "customVariables", "sku", "featured", "active"];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      const val = field === "customVariables" ? JSON.stringify(data[field]) : data[field];
      params.push(val);
    }
  }
  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query(`UPDATE products SET ${updates.join(", ")} WHERE id = $1 AND tenant_id = $2`, params);
  }
  return getProductById(id, tenantId);
}
async function deleteProduct(id, tenantId) {
  const result = await query("DELETE FROM products WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount || 0) > 0;
}

// src/server/db/store-settings.repo.ts
init_pool();
async function getStoreSettings(tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
           store_modules as "storeModules", restaurant_config as "restaurantConfig",
           delivery_config as "deliveryConfig", correos_cr_config as "correosCrConfig",
           local_delivery_config as "localDeliveryConfig", store_schedule as "storeSchedule",
           custom_stages as "customStages", notification_templates as "notificationTemplates",
           store_name as "storeName", store_slug as "storeSlug", store_description as "storeDescription",
           store_logo_url as "storeLogoUrl", store_banner_url as "storeBannerUrl",
           store_theme as "storeTheme", currency, accept_sinpe as "acceptSinpe",
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
  const result = await query(`
    INSERT INTO store_settings (
      tenant_id, store_enabled, store_mode, store_modules, restaurant_config, delivery_config,
      correos_cr_config, local_delivery_config, store_schedule, custom_stages, notification_templates,
      store_name, store_slug, store_description, store_logo_url,
      store_banner_url, store_theme, currency, accept_sinpe, sinpe_phone, sinpe_name,
      accept_transfer, bank_account_info, accept_cash_on_delivery, delivery_enabled,
      delivery_fee, pickup_enabled, whatsapp_checkout, min_order_amount, store_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
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
var saveStoreSettings = upsertStoreSettings;

// src/server/db/schedule.repo.ts
init_pool();
async function getScheduleSettings(tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", schedule_mode as "scheduleMode", config_json as config, updated_at as "updatedAt"
    FROM schedule_settings
    WHERE tenant_id = $1
  `, [tenantId]);
  if (result.rows.length === 0) {
    return {
      tenantId,
      scheduleMode: "jornada",
      globalParallelSlots: 1,
      jornadaConfig: {
        startHour: "08:00",
        endHour: "17:00",
        slotMinutes: 45,
        hasBreak: true,
        breakStart: "12:00",
        breakEnd: "13:00",
        daysEnabled: [1, 2, 3, 4, 5, 6]
        // Lunes a Sábado
      },
      customFields: [],
      vacationConfig: {
        enabled: false,
        startDate: "",
        endDate: "",
        message: "Estaremos cerrados temporalmente por vacaciones. \xA1Pronto estaremos de vuelta!"
      }
    };
  }
  const row = result.rows[0];
  const config = row.config || {};
  return {
    id: row.id,
    tenantId: row.tenantId,
    scheduleMode: row.scheduleMode || "jornada",
    globalParallelSlots: Math.max(1, Number(config.globalParallelSlots) || 1),
    jornadaConfig: config.jornadaConfig,
    fechasConfig: config.fechasConfig,
    bloquesConfig: config.bloquesConfig,
    customFields: Array.isArray(config.customFields) ? config.customFields : [],
    vacationConfig: config.vacationConfig || {
      enabled: false,
      startDate: "",
      endDate: "",
      message: "Estaremos cerrados temporalmente por vacaciones. \xA1Pronto estaremos de vuelta!"
    },
    updatedAt: row.updatedAt
  };
}
async function saveScheduleSettings(tenantId, data) {
  const configJson = {
    globalParallelSlots: Math.max(1, Number(data.globalParallelSlots) || 1),
    jornadaConfig: data.jornadaConfig,
    fechasConfig: data.fechasConfig,
    bloquesConfig: data.bloquesConfig,
    customFields: data.customFields,
    vacationConfig: data.vacationConfig
  };
  const result = await query(`
    INSERT INTO schedule_settings (tenant_id, schedule_mode, config_json, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) DO UPDATE SET
      schedule_mode = EXCLUDED.schedule_mode,
      config_json = EXCLUDED.config_json,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", schedule_mode as "scheduleMode", config_json as config, updated_at as "updatedAt"
  `, [tenantId, data.scheduleMode || "jornada", JSON.stringify(configJson)]);
  const row = result.rows[0];
  const config = row.config || {};
  return {
    id: row.id,
    tenantId: row.tenantId,
    scheduleMode: row.scheduleMode,
    globalParallelSlots: Math.max(1, Number(config.globalParallelSlots) || 1),
    jornadaConfig: config.jornadaConfig,
    fechasConfig: config.fechasConfig,
    bloquesConfig: config.bloquesConfig,
    customFields: config.customFields,
    vacationConfig: config.vacationConfig,
    updatedAt: row.updatedAt
  };
}

// src/server/db/ai-usage.repo.ts
init_pool();
function getCurrentMonthYear() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
async function getPlanQuota(planName) {
  const normalizedPlan = (planName || "starter").toLowerCase();
  const key = `quota_${normalizedPlan}_tokens`;
  try {
    const res = await query(`SELECT value FROM platform_settings WHERE key = $1`, [key]);
    if (res.rows.length > 0 && res.rows[0].value) {
      return parseInt(res.rows[0].value, 10);
    }
  } catch (e) {
  }
  if (normalizedPlan === "starter") return 25e3;
  if (normalizedPlan === "pro") return 1e5;
  if (normalizedPlan === "business" || normalizedPlan === "enterprise") return 3e5;
  return 25e3;
}
async function getTenantCurrentMonthUsage(tenantId) {
  const monthYear = getCurrentMonthYear();
  const tenantRes = await query(`SELECT id, name, slug, plan FROM tenants WHERE id = $1`, [tenantId]);
  const tenant = tenantRes.rows[0] || { id: tenantId, name: "Desconocido", slug: "", plan: "starter" };
  const limit = await getPlanQuota(tenant.plan);
  const usageRes = await query(`
    SELECT tokens_used, requests_count
    FROM tenant_ai_usage
    WHERE tenant_id = $1 AND month_year = $2
  `, [tenantId, monthYear]);
  const tokensUsed = usageRes.rows.length > 0 ? parseInt(usageRes.rows[0].tokens_used || "0", 10) : 0;
  const requestsCount = usageRes.rows.length > 0 ? parseInt(usageRes.rows[0].requests_count || "0", 10) : 0;
  const percentageUsed = limit > 0 ? Math.min(100, Math.round(tokensUsed / limit * 100)) : 0;
  const isExceeded = limit > 0 && tokensUsed >= limit;
  return {
    tenantId,
    tenantName: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    monthYear,
    tokensUsed,
    requestsCount,
    limit,
    percentageUsed,
    isExceeded
  };
}
async function incrementTenantUsage(tenantId, tokens) {
  if (!tenantId || tokens <= 0) return;
  const monthYear = getCurrentMonthYear();
  try {
    await query(`
      INSERT INTO tenant_ai_usage (tenant_id, month_year, tokens_used, requests_count, updated_at)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (tenant_id, month_year)
      DO UPDATE SET
        tokens_used = tenant_ai_usage.tokens_used + $3,
        requests_count = tenant_ai_usage.requests_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId, monthYear, tokens]);
  } catch (err) {
    console.error(`[AI-Usage] Error incrementing usage for tenant ${tenantId}:`, err);
  }
}
async function getAllTenantsMonthlyUsage(monthYearParam) {
  const monthYear = monthYearParam || getCurrentMonthYear();
  const starterQuota = await getPlanQuota("starter");
  const proQuota = await getPlanQuota("pro");
  const businessQuota = await getPlanQuota("business");
  const res = await query(`
    SELECT 
      t.id as tenant_id,
      t.name as tenant_name,
      t.slug,
      t.plan,
      COALESCE(u.tokens_used, 0) as tokens_used,
      COALESCE(u.requests_count, 0) as requests_count
    FROM tenants t
    LEFT JOIN tenant_ai_usage u ON u.tenant_id = t.id AND u.month_year = $1
    WHERE t.slug != 'superadmin'
    ORDER BY tokens_used DESC, t.name ASC
  `, [monthYear]);
  return res.rows.map((r) => {
    const plan = (r.plan || "starter").toLowerCase();
    const limit = plan === "starter" ? starterQuota : plan === "pro" ? proQuota : businessQuota;
    const tokensUsed = parseInt(r.tokens_used || "0", 10);
    const requestsCount = parseInt(r.requests_count || "0", 10);
    const percentageUsed = limit > 0 ? Math.min(100, Math.round(tokensUsed / limit * 100)) : 0;
    const isExceeded = limit > 0 && tokensUsed >= limit;
    return {
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      slug: r.slug,
      plan: r.plan,
      monthYear,
      tokensUsed,
      requestsCount,
      limit,
      percentageUsed,
      isExceeded
    };
  });
}

// src/server/db/specialists.repo.ts
init_pool();
async function getSpecialistsByTenant(tenantId) {
  const res = await query(
    'SELECT id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt" FROM specialists WHERE tenant_id = $1 ORDER BY name ASC',
    [tenantId]
  );
  return res.rows;
}
async function getSpecialistByPin(pin, phone) {
  const cleanPin = (pin || "").trim();
  let sql = 'SELECT id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt" FROM specialists WHERE TRIM(access_pin) = $1 AND active = TRUE';
  const params = [cleanPin];
  if (phone) {
    const clean = phone.replace(/\D/g, "");
    sql += " AND (REPLACE(phone, '-', '') LIKE '%' || $2 OR phone LIKE '%' || $2)";
    params.push(clean.slice(-8));
  }
  sql += " LIMIT 1";
  const res = await query(sql, params);
  return res.rows[0] || null;
}
async function createSpecialist(tenantId, data) {
  const pin = data.accessPin || Math.floor(1e3 + Math.random() * 9e3).toString();
  const res = await query(
    'INSERT INTO specialists (tenant_id, name, phone, specialty, access_pin, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt"',
    [tenantId, data.name || "Colaborador", data.phone || "", data.specialty || "General", pin, data.active !== false]
  );
  return res.rows[0];
}
async function updateSpecialist(id, tenantId, data) {
  const res = await query(
    'UPDATE specialists SET name = COALESCE($3, name), phone = COALESCE($4, phone), specialty = COALESCE($5, specialty), access_pin = COALESCE($6, access_pin), active = COALESCE($7, active) WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt"',
    [id, tenantId, data.name, data.phone, data.specialty, data.accessPin, data.active]
  );
  return res.rows[0] || null;
}
async function deleteSpecialist(id, tenantId) {
  const res = await query("DELETE FROM specialists WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (res.rowCount || 0) > 0;
}
async function getActiveAppointmentsForSpecialist(specialistId) {
  const res = await query(
    `SELECT a.id, a.tenant_id as "tenantId", a.name, a.whatsapp, a.service, a.date, a.time, a.amount, a.status, a.details, a.vehicle_model as "vehicleModel", a.specialist_id as "specialistId", a.created_at as "createdAt" FROM appointments a WHERE a.specialist_id = $1 AND a.status NOT IN ('completed', 'completado', 'cancelled', 'cancelado') ORDER BY a.date ASC, a.time ASC`,
    [specialistId]
  );
  return res.rows;
}
async function getCompletedAppointmentsForSpecialist(specialistId, fromDate, toDate) {
  let sql = `SELECT a.id, a.tenant_id as "tenantId", a.name, a.whatsapp, a.service, a.date, a.time, a.amount, a.status, a.details, a.vehicle_model as "vehicleModel", a.specialist_id as "specialistId", a.created_at as "createdAt" FROM appointments a WHERE a.specialist_id = $1 AND a.status IN ('completed', 'completado')`;
  const params = [specialistId];
  if (fromDate) {
    params.push(fromDate);
    sql += " AND a.date >= $" + params.length;
  }
  if (toDate) {
    params.push(toDate);
    sql += " AND a.date <= $" + params.length;
  }
  sql += " ORDER BY a.date DESC, a.time DESC";
  const res = await query(sql, params);
  return res.rows;
}

// src/server/db/courts.repo.ts
init_pool();
function mapCourtRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    sportType: row.sport_type,
    customSportType: row.custom_sport_type,
    description: row.description,
    surface: row.surface,
    isIndoor: row.is_indoor,
    hasLighting: row.has_lighting,
    basePrice: Number(row.base_price),
    priceDisplay: row.price_display,
    durationMinutes: row.duration_minutes,
    teamSize: row.team_size,
    maxExtraPlayers: row.max_extra_players,
    extraPlayerFee: Number(row.extra_player_fee),
    active: row.active,
    sortOrder: row.sort_order,
    createdAt: row.created_at
  };
}
function mapBookingRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    courtId: row.court_id,
    courtName: row.court_name || row.name,
    // in case of join
    date: row.date,
    time: row.time,
    durationMinutes: row.duration_minutes,
    bookingMode: row.booking_mode,
    matchStatus: row.match_status,
    matchExpiryHours: Number(row.match_expiry_hours),
    teamAName: row.team_a_name,
    teamACaptain: row.team_a_captain,
    teamAPhone: row.team_a_phone,
    teamAPlayers: row.team_a_players,
    teamAExtraPlayers: row.team_a_extra_players,
    teamAPaid: row.team_a_paid,
    teamBName: row.team_b_name,
    teamBCaptain: row.team_b_captain,
    teamBPhone: row.team_b_phone,
    teamBPlayers: row.team_b_players,
    teamBExtraPlayers: row.team_b_extra_players,
    teamBPaid: row.team_b_paid,
    totalPrice: Number(row.total_price),
    pricePerTeam: row.price_per_team ? Number(row.price_per_team) : void 0,
    paymentMode: row.payment_mode,
    sportType: row.sport_type,
    skillLevel: row.skill_level,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getCourtsByTenant(tenantId) {
  const res = await query(`SELECT * FROM courts WHERE tenant_id = $1 ORDER BY sort_order, name`, [tenantId]);
  return res.rows.map(mapCourtRow);
}
async function getCourtById(id, tenantId) {
  const res = await query(`SELECT * FROM courts WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return res.rows[0] ? mapCourtRow(res.rows[0]) : null;
}
async function createCourt(tenantId, data) {
  const res = await query(`
    INSERT INTO courts (
      tenant_id, name, sport_type, custom_sport_type, description, surface, 
      is_indoor, has_lighting, base_price, price_display, duration_minutes, 
      team_size, max_extra_players, extra_player_fee, active, sort_order
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `, [
    tenantId,
    data.name,
    data.sportType,
    data.customSportType,
    data.description,
    data.surface,
    data.isIndoor,
    data.hasLighting,
    data.basePrice,
    data.priceDisplay,
    data.durationMinutes,
    data.teamSize,
    data.maxExtraPlayers,
    data.extraPlayerFee,
    data.active !== false,
    data.sortOrder || 0
  ]);
  return mapCourtRow(res.rows[0]);
}
async function updateCourt(id, tenantId, data) {
  const allowed = {
    name: "name",
    sportType: "sport_type",
    customSportType: "custom_sport_type",
    description: "description",
    surface: "surface",
    isIndoor: "is_indoor",
    hasLighting: "has_lighting",
    basePrice: "base_price",
    priceDisplay: "price_display",
    durationMinutes: "duration_minutes",
    teamSize: "team_size",
    maxExtraPlayers: "max_extra_players",
    extraPlayerFee: "extra_player_fee",
    active: "active",
    sortOrder: "sort_order"
  };
  const entries = Object.entries(data).filter(([k, v]) => allowed[k] !== void 0 && v !== void 0);
  if (entries.length === 0) return getCourtById(id, tenantId);
  const setClause = entries.map(([k], i) => `${allowed[k]} = $${i + 3}`).join(", ");
  const values = entries.map((e) => e[1]);
  const res = await query(`
    UPDATE courts SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId, ...values]);
  return res.rows[0] ? mapCourtRow(res.rows[0]) : null;
}
async function deleteCourt(id, tenantId) {
  const res = await query(`DELETE FROM courts WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}
async function getBookingsByTenant(tenantId, date) {
  let q = `
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.tenant_id = $1
  `;
  const params = [tenantId];
  if (date) {
    q += ` AND cb.date = $2`;
    params.push(date);
  }
  q += ` ORDER BY cb.date DESC, cb.time DESC`;
  const res = await query(q, params);
  return res.rows.map(mapBookingRow);
}
async function getBookingById(id, tenantId) {
  const res = await query(`
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.id = $1 AND cb.tenant_id = $2
  `, [id, tenantId]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}
async function createBooking(tenantId, data) {
  const bookingMode = data.bookingMode || "full";
  const matchStatus = data.matchStatus || (bookingMode === "seek_match" ? "open" : "confirmed");
  let totalPrice = Number(data.totalPrice || 0);
  let durationMinutes = data.durationMinutes || 60;
  let sportType = data.sportType;
  if (data.courtId && (!totalPrice || !sportType)) {
    const cRes = await query("SELECT * FROM courts WHERE id = $1", [data.courtId]);
    if (cRes.rows[0]) {
      const c = cRes.rows[0];
      durationMinutes = data.durationMinutes || c.duration_minutes || 60;
      sportType = sportType || c.sport_type || "futbol";
      if (!totalPrice) {
        totalPrice = Number(c.base_price || 0) + Number(data.teamAExtraPlayers || 0) * Number(c.extra_player_fee || 0);
      }
    }
  }
  const pricePerTeam = data.pricePerTeam ? Number(data.pricePerTeam) : totalPrice > 0 ? totalPrice / 2 : void 0;
  const res = await query(`
    INSERT INTO court_bookings (
      tenant_id, court_id, date, time, duration_minutes, booking_mode,
      match_status, match_expiry_hours, team_a_name, team_a_captain,
      team_a_phone, team_a_players, team_a_extra_players, team_a_paid,
      team_b_name, team_b_captain, team_b_phone, team_b_players,
      team_b_extra_players, team_b_paid, total_price, price_per_team,
      payment_mode, sport_type, skill_level, notes, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
      $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
    ) RETURNING *
  `, [
    tenantId,
    data.courtId,
    data.date,
    data.time,
    durationMinutes,
    bookingMode,
    matchStatus,
    data.matchExpiryHours || 1,
    data.teamAName || "Equipo A",
    data.teamACaptain,
    data.teamAPhone,
    data.teamAPlayers || 5,
    data.teamAExtraPlayers || 0,
    data.teamAPaid || false,
    data.teamBName,
    data.teamBCaptain,
    data.teamBPhone,
    data.teamBPlayers || 5,
    data.teamBExtraPlayers || 0,
    data.teamBPaid || false,
    totalPrice,
    pricePerTeam,
    data.paymentMode || "both",
    sportType,
    data.skillLevel,
    data.notes,
    data.status || "confirmed"
  ]);
  const booking = mapBookingRow(res.rows[0]);
  if (data.courtId) {
    const cRes = await query("SELECT name FROM courts WHERE id = $1", [data.courtId]);
    booking.courtName = cRes.rows[0]?.name || booking.courtName;
  }
  return booking;
}
async function updateBooking(id, tenantId, data) {
  const allowed = {
    date: "date",
    time: "time",
    durationMinutes: "duration_minutes",
    bookingMode: "booking_mode",
    matchStatus: "match_status",
    matchExpiryHours: "match_expiry_hours",
    teamAName: "team_a_name",
    teamACaptain: "team_a_captain",
    teamAPhone: "team_a_phone",
    teamAPlayers: "team_a_players",
    teamAExtraPlayers: "team_a_extra_players",
    teamAPaid: "team_a_paid",
    teamBName: "team_b_name",
    teamBCaptain: "team_b_captain",
    teamBPhone: "team_b_phone",
    teamBPlayers: "team_b_players",
    teamBExtraPlayers: "team_b_extra_players",
    teamBPaid: "team_b_paid",
    totalPrice: "total_price",
    pricePerTeam: "price_per_team",
    paymentMode: "payment_mode",
    sportType: "sport_type",
    skillLevel: "skill_level",
    notes: "notes",
    status: "status"
  };
  const entries = Object.entries(data).filter(([k, v]) => allowed[k] !== void 0 && v !== void 0);
  if (entries.length === 0) return getBookingById(id, tenantId);
  const setClause = entries.map(([k], i) => `${allowed[k]} = $${i + 3}`).join(", ");
  const values = entries.map((e) => e[1]);
  const res = await query(`
    UPDATE court_bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId, ...values]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}
async function cancelBooking(id, tenantId) {
  const res = await query(`
    UPDATE court_bookings SET status = 'cancelled', match_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2 RETURNING *
  `, [id, tenantId]);
  return res.rows[0] ? mapBookingRow(res.rows[0]) : null;
}
async function getOpenMatches(tenantId) {
  const res = await query(`
    SELECT cb.*, c.name as court_name 
    FROM court_bookings cb
    JOIN courts c ON c.id = cb.court_id
    WHERE cb.tenant_id = $1 
      AND cb.status != 'cancelled'
      AND (cb.match_status = 'open' OR (cb.booking_mode = 'seek_match' AND (cb.team_b_name IS NULL OR cb.team_b_name = '')))
      AND cb.date >= (CURRENT_DATE - INTERVAL '1 day')::date
    ORDER BY cb.date, cb.time
  `, [tenantId]);
  return res.rows.map(mapBookingRow);
}
async function joinMatch(id, tenantId, teamBData) {
  const res = await query(`
    UPDATE court_bookings 
    SET team_b_name = $1, team_b_captain = $2, team_b_phone = $3,
        team_b_players = $4, team_b_extra_players = $5,
        match_status = 'matched', updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND tenant_id = $7 RETURNING *
  `, [
    teamBData.teamBName || "Equipo B",
    teamBData.teamBCaptain,
    teamBData.teamBPhone,
    teamBData.teamBPlayers || 5,
    teamBData.teamBExtraPlayers || 0,
    id,
    tenantId
  ]);
  if (!res.rows[0]) return null;
  const booking = mapBookingRow(res.rows[0]);
  const cRes = await query("SELECT name FROM courts WHERE id = $1", [booking.courtId]);
  booking.courtName = cRes.rows[0]?.name || booking.courtName;
  return booking;
}
async function getAvailableSlots(tenantId, courtId, date) {
  const nowCR = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
  const todayCR = `${nowCR.getFullYear()}-${String(nowCR.getMonth() + 1).padStart(2, "0")}-${String(nowCR.getDate()).padStart(2, "0")}`;
  const currentMinutesNow = nowCR.getHours() * 60 + nowCR.getMinutes();
  if (date < todayCR) {
    return [];
  }
  const tRes = await query("SELECT settings_json FROM tenants WHERE id = $1", [tenantId]);
  const settingsJson = tRes.rows[0]?.settings_json || {};
  const scheduleSettings = settingsJson.scheduleSettings || { startHour: 8, endHour: 22, slotMinutes: 60 };
  const startHour = Number(scheduleSettings.startHour) || 8;
  const endHour = Number(scheduleSettings.endHour) || 22;
  const slotMinutes = Number(scheduleSettings.slotMinutes) || 60;
  const slots = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
    slots.push(timeStr);
    currentMinutes += slotMinutes;
  }
  const bookingsRes = await query(`
    SELECT time 
    FROM court_bookings 
    WHERE tenant_id = $1 AND court_id = $2 AND date = $3 AND status != 'cancelled'
  `, [tenantId, courtId, date]);
  const bookedTimes = bookingsRes.rows.map((r) => {
    return typeof r.time === "string" ? r.time : r.time.toString();
  });
  const isToday = date === todayCR;
  return slots.filter((slot) => {
    if (isToday) {
      const [sh, sm] = slot.split(":").map(Number);
      if (sh * 60 + sm <= currentMinutesNow) {
        return false;
      }
    }
    return !bookedTimes.includes(slot);
  });
}

// src/server/services/agent.ts
init_pool();
async function processWhatsAppMessageWithAI(tenantId, userMessage, senderPhone, senderName, chatHistory) {
  const tenant = await getTenantById(tenantId);
  const agentConfig = await getAgentConfig(tenantId);
  const services = await getServicesByTenant(tenantId);
  const products = await getProductsByTenant(tenantId, true);
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);
  const now = /* @__PURE__ */ new Date();
  const crTime = new Intl.DateTimeFormat("es-CR", {
    timeZone: "America/Costa_Rica",
    dateStyle: "full",
    timeStyle: "short"
  }).format(now);
  const baseUrl = process.env.APP_URL || "https://betico.tech";
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : "";
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : "";
  const lowerMsg = userMessage.toLowerCase().trim();
  const recentHistoryText = (chatHistory || []).slice(-12).map((h) => h.content).join(" ").toLowerCase();
  const conversationContext = `${recentHistoryText} ${lowerMsg}`;
  const isPureGreeting = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|alo|hi|saludos|pura vida|hola que tal|hola como estas)[s!.,?]*$/i.test(lowerMsg);
  const asksForServices = /servicio|cita|reserva|agenda|agendar|horario|hora|fecha|disponib|turno|atencion|lavado|pulido|mantenimiento/i.test(conversationContext);
  const asksForProducts = /precio|costo|cuanto|venden|catalogo|menu|producto|comprar|pedir|orden|foto|imagen|quiero|plato|comida|pizza|hamburguesa|cera|variante|talla|sabor|llevar|agregar|sumar|confirmo/i.test(conversationContext);
  const asksForPayments = /sinpe|transferencia|pago|pagar|cuenta|banco|efectivo|tarjeta|cuentas/i.test(conversationContext);
  const asksForLocation = /ubicacion|donde|direccion|llegar|local|tienda|sucursal|mapa/i.test(conversationContext);
  const asksForHuman = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente/i.test(lowerMsg);
  const asksForOrderStatus = /pedido|orden|paquete|comida|donde viene|estado del pedido|como va mi|cuando llega|mi orden|mi pedido/i.test(conversationContext);
  let paymentInfo = "";
  if (asksForPayments || asksForProducts || !isPureGreeting) {
    const methods = [];
    if (store?.acceptSinpe && store.sinpePhone) methods.push(`SINPE M\xF3vil: ${store.sinpePhone} (${store.sinpeName || tenant?.name})`);
    if (store?.acceptTransfer && store.bankAccountInfo) methods.push(`Transferencia: ${store.bankAccountInfo}`);
    if (store?.acceptCashOnDelivery) methods.push("Efectivo contra entrega");
    if (store?.deliveryEnabled) methods.push(`Env\xEDo: \u20A1${Number(store.deliveryFee || 0).toLocaleString("es-CR")}`);
    if (methods.length > 0) paymentInfo = "\u{1F4B3} Pagos: " + methods.join(" | ") + "\n";
  }
  let scheduleInfo = "";
  if (asksForServices || asksForLocation || !isPureGreeting) {
    if (schedule?.jornadaConfig) {
      const j = schedule.jornadaConfig;
      scheduleInfo = `\u23F0 Horario: ${j.startHour || "08:00"} a ${j.endHour || "17:00"} (${j.slotMinutes || 45}m por cita)
`;
    }
    if (schedule?.vacationConfig?.enabled) {
      const v = schedule.vacationConfig;
      scheduleInfo += `\u26A0\uFE0F Cierre temporal: ${v.startDate} al ${v.endDate} (${v.message})
`;
    }
  }
  let relevantServicesText = "";
  if (!isPureGreeting && services.length > 0) {
    const contextWords = conversationContext.split(/\s+/).filter((w) => w.length > 2);
    let matchedServices = services.filter((s) => {
      const sName = s.name.toLowerCase();
      const sCat = (s.category || "").toLowerCase();
      return contextWords.some((w) => sName.includes(w) || sCat.includes(w));
    });
    if (matchedServices.length === 0) {
      matchedServices = services.slice(0, 4);
    }
    if (matchedServices.length > 0) {
      relevantServicesText = "\u{1F697} Servicios:\n" + matchedServices.map(
        (s) => `\u2022 ${s.name}: \u20A1${Number(s.price || 0).toLocaleString("es-CR")} (${s.duration || `${s.estimatedMinutes || 45}m`})`
      ).join("\n") + "\n";
    }
  }
  let busySlotsText = "";
  let specialistsText = "";
  if (asksForServices || !isPureGreeting) {
    try {
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const busySlotsRes = await query(`
        SELECT date, time, service
        FROM appointments
        WHERE tenant_id = $1 AND date >= $2 AND status NOT IN ('cancelled', 'cancelado')
        ORDER BY date ASC, time ASC
        LIMIT 40
      `, [tenantId, todayStr]);
      if (busySlotsRes.rows.length > 0) {
        const grouped = {};
        busySlotsRes.rows.forEach((r) => {
          const d = r.date;
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(r.time);
        });
        const busySummary = Object.entries(grouped).map(([d, times]) => `  \u2022 ${d}: ${times.join(", ")} (OCUPADOS)`).join("\n");
        busySlotsText = `\u{1F6AB} HORARIOS YA OCUPADOS (NO OFRECER NI AGENDAR ESTOS HORARIOS):
${busySummary}
`;
      }
      const specialists = await getSpecialistsByTenant(tenantId);
      if (specialists && specialists.length > 0) {
        const activeSpecs = specialists.filter((s) => s.active);
        if (activeSpecs.length > 0) {
          specialistsText = "\u{1F465} Especialistas / Equipo:\n" + activeSpecs.map((s) => `\u2022 ${s.name}${s.specialty ? ` (${s.specialty})` : ""}`).join("\n") + "\n";
        }
      }
    } catch (slotErr) {
      console.error("[Agent] Error querying busy slots or specialists:", slotErr);
    }
  }
  let courtsText = "";
  try {
    const courts = await getCourtsByTenant(tenantId);
    if (courts && courts.length > 0) {
      const activeCourts = courts.filter((c) => c.active !== false);
      if (activeCourts.length > 0) {
        courtsText = "\u26BD/\u{1F3BE} CANCHAS DEPORTIVAS DISPONIBLES:\n" + activeCourts.map((c) => {
          let desc = `\u2022 *${c.name}* [${c.sportType || "cancha"}${c.surface ? `, ${c.surface}` : ""}]: \u20A1${Number(c.basePrice || 0).toLocaleString("es-CR")}/hora`;
          if (c.hasLighting) desc += " (iluminaci\xF3n incluida)";
          return desc;
        }).join("\n") + "\n";
      }
    }
  } catch (courtErr) {
    console.error("[Agent] Error fetching courts:", courtErr);
  }
  let relevantProductsText = "";
  if (!isPureGreeting && products.length > 0) {
    const contextWords = conversationContext.split(/\s+/).filter((w) => w.length > 2);
    let matchedProducts = products.filter((p) => {
      const pName = p.name.toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pTags = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
      const pDesc = (p.description || "").toLowerCase();
      return contextWords.some((w) => pName.includes(w) || pCat.includes(w) || pTags.includes(w) || pDesc.includes(w));
    });
    if (matchedProducts.length === 0) {
      matchedProducts = products.slice(0, 4);
    }
    if (matchedProducts.length > 0) {
      relevantProductsText = "\u{1F6CD}\uFE0F Cat\xE1logo de Productos Relevantes:\n" + matchedProducts.map((p) => {
        let details = `\u2022 *${p.name}*`;
        if (p.category) details += ` [${p.category}]`;
        details += `: \u20A1${Number(p.price || 0).toLocaleString("es-CR")}`;
        if (p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)) {
          details += ` (Antes: \u20A1${Number(p.compareAtPrice).toLocaleString("es-CR")})`;
        }
        details += ` | Stock: ${p.stock ?? "disponible"}`;
        if (p.description && p.description.trim()) {
          details += `
  \u{1F4DD} Descripci\xF3n: ${p.description.trim().replace(/\n+/g, " ")}`;
        }
        if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
          const varList = p.variants.map((v) => {
            let vStr = v.name;
            if (v.priceOverride && Number(v.priceOverride) > 0) vStr += ` (\u20A1${Number(v.priceOverride).toLocaleString("es-CR")})`;
            if (v.stock !== void 0 && v.stock !== null) vStr += ` [Stock: ${v.stock}]`;
            return vStr;
          }).join(", ");
          details += `
  \u{1F500} Variantes disponibles: ${varList}`;
        }
        if (p.customVariables && Array.isArray(p.customVariables) && p.customVariables.length > 0) {
          const varDetails = p.customVariables.map((cv) => {
            const opts = (cv.options || []).map((o) => {
              return o.price && Number(o.price) > 0 ? `${o.name} (+\u20A1${Number(o.price).toLocaleString("es-CR")})` : o.name;
            }).join(", ");
            return `${cv.name}: [${opts || "opciones"}]`;
          }).join(" | ");
          details += `
  \u2699\uFE0F Opciones/Extras: ${varDetails}`;
        }
        if (p.images && p.images.length > 0) {
          const rawUrl = p.images[0].url;
          const photoUrl = rawUrl.startsWith("http") ? rawUrl : `${baseUrl}${rawUrl}`;
          details += `
  \u{1F4F8} Foto: ${photoUrl}`;
        }
        return details;
      }).join("\n\n") + "\n";
    }
  }
  let activeCustomerBookingsText = "";
  try {
    const cleanPhone = senderPhone.replace(/\D/g, "");
    const activeAppts = await query(`
      SELECT service, date, time, status 
      FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
      ORDER BY date ASC, time ASC
      LIMIT 3
    `, [tenantId, cleanPhone.slice(-8)]);
    if (activeAppts.rows.length > 0) {
      activeCustomerBookingsText = "\nCITAS ACTIVAS DE ESTE CLIENTE:\n" + activeAppts.rows.map(
        (a) => `- ${a.service} para el ${a.date} a las ${a.time} (Estado: ${a.status === "confirmed" ? "Confirmada" : "Programada"})`
      ).join("\n") + "\n";
    }
  } catch (e) {
  }
  let activeCustomerOrdersText = "";
  try {
    const cleanPhone = senderPhone.replace(/\D/g, "");
    const activeOrders = await query(`
      SELECT o.id, o.order_number as "orderNumber", o.status, o.total, o.currency,
             o.delivery_method as "deliveryMethod", o.created_at as "createdAt",
             COALESCE(
               (SELECT json_agg(json_build_object('productName', oi.product_name, 'variantName', oi.variant_name, 'quantity', oi.quantity))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      WHERE o.tenant_id = $1 AND REPLACE(o.customer_phone, '+', '') LIKE '%' || $2 || '%'
        AND o.status NOT IN ('entregado', 'cancelled', 'cancelado', 'delivered')
      ORDER BY o.created_at DESC
      LIMIT 2
    `, [tenantId, cleanPhone.slice(-8)]);
    if (activeOrders.rows.length > 0) {
      const stages = store?.customStages || {
        fase_1: "Pedido Recibido",
        fase_2: "En Preparaci\xF3n / Cocina",
        fase_3: "Listo para Entrega / Despacho",
        fase_4: "En Camino (Delivery)",
        fase_5: "Entregado"
      };
      const statusMap = {
        "pedido_recibido": stages.fase_1 || "Recibido",
        "en_preparacion": stages.fase_2 || "En Preparaci\xF3n",
        "listo_para_entrega": stages.fase_3 || "Listo para entrega",
        "listo_entrega": stages.fase_3 || "Listo para entrega",
        "en_camino": stages.fase_4 || "En Camino (Delivery)",
        "pending": "Pendiente de confirmaci\xF3n",
        "confirmed": "Confirmado",
        "preparing": "En Preparaci\xF3n",
        "shipped": "En Camino"
      };
      activeCustomerOrdersText = "\nPEDIDOS ACTIVOS EN CURSO DE ESTE CLIENTE:\n" + activeOrders.rows.map((o) => {
        const itemsList = (o.items || []).map((it) => `${it.quantity}x ${it.productName}${it.variantName ? ` (${it.variantName})` : ""}`).join(", ");
        const st = statusMap[o.status] || o.status;
        return `\u2022 Pedido #ORD-${o.orderNumber}: [${itemsList || "Productos"}] | Estado actual: *${st}* | Total: \u20A1${Number(o.total || 0).toLocaleString("es-CR")}`;
      }).join("\n") + "\n";
    }
  } catch (e) {
  }
  const isConversationOngoing = chatHistory && chatHistory.length > 0;
  const antiGreetingInstruction = isConversationOngoing ? `\u26A0\uFE0F CONVERSACI\xD3N EN CURSO: El cliente ya est\xE1 interactuando contigo. PROHIBIDO SALUDAR DE NUEVO (no digas "Hola", "Buenas", "Buenos d\xEDas", etc.). Ve directo al grano respondiendo con calidez y entusiasmo a lo que pide el cliente.
` : `Saluda cordialmente al cliente present\xE1ndote como asistente de *${tenant?.name || "nuestro negocio"}*.
`;
  const systemPrompt = `Eres el asistente virtual y asesor experto de ventas de *${tenant?.name || "nuestro negocio"}* en WhatsApp.
IDIOMA: Responde SIEMPRE en espa\xF1ol de Costa Rica. NUNCA en otro idioma.
${antiGreetingInstruction}
${agentConfig?.systemPrompt || "Atiende amablemente a los clientes."}

Datos del negocio:
${crTime}
${agentConfig?.showBookingLink !== false && bookingUrl ? `Reservas online: ${bookingUrl}` : ""}${agentConfig?.showStoreLink !== false && storeUrl ? ` | Tienda online: ${storeUrl}` : ""}
${scheduleInfo}${paymentInfo}${relevantServicesText}${relevantProductsText}${courtsText}${specialistsText}${busySlotsText}${activeCustomerBookingsText}${activeCustomerOrdersText}
REGLAS OBLIGATORIAS:
1. Responde SOLO en espa\xF1ol con un tono c\xE1lido, emp\xE1tico, educado y \xE1gil adaptado al p\xFAblico de Costa Rica (*pura vida*, con mucho gusto, claro que s\xED).
2. Usa el nombre EXACTO del cliente (${senderName}) cuando sea oportuno. No lo modifiques.
3. Usa *negrita* para datos clave (precios, productos, horarios) y emojis moderados para dar calidez. S\xE9 conciso y claro (1-2 p\xE1rrafos m\xE1ximo).
4. Solo menciona productos, servicios y precios que aparezcan arriba en los datos del negocio. Si algo no aparece, indica que consultar\xE1s con el equipo.
5. NUNCA inventes URLs, links, procesos ni precios que no est\xE9n en la informaci\xF3n proporcionada.
6. POL\xCDTICA DE PRECIOS Y ANTIRREGATEO: Los precios, tarifas y promociones mostrados arriba son oficiales y fijos. Si el cliente insiste en pedir rebajas, regatea o solicita descuentos no oficiales, declina amablemente con simpat\xEDa explicando que nuestros precios son los establecidos y destaca la calidad y valor de lo que ofrecemos.

6. ASESOR\xCDA DE PRODUCTOS Y VENTAS (S\xC9 UN VENDEDOR CONSULTIVO):
- Si el producto tiene variantes (tallas, sabores, modelos, presentaciones), pres\xE9ntalas amablemente y pregunta cu\xE1l prefiere: *"\xA1Claro! Lo tenemos en presentaci\xF3n de [X] (\u20A1...) y [Y] (\u20A1...). \xBFCu\xE1l te gustar\xEDa?"*.
- Usa las descripciones para destacar beneficios o responder dudas sobre ingredientes o calidad.
- Si el producto tiene opciones/extras, ofr\xE9celos para que el cliente personalice su orden a gusto.

7. CARRITO CONVERSACIONAL MULTI-PRODUCTO (SUMAR PEDIDOS PROGRESIVAMENTE):
- Cuando el cliente pida un producto y luego agregue otros ("tambi\xE9n quiero...", "agr\xE9gale adem\xE1s...", "s\xFAmale..."), mant\xE9n el carrito acumulado con TODOS los productos pedidos a lo largo de la conversaci\xF3n.
- Antes de confirmar, resume amablemente la lista acumulada de productos con subtotales y el monto total general.
- Preg\xFAntale si es para **Env\xEDo a Domicilio** (solicitando la direcci\xF3n) o para **Retirar en el Local**.
- Preg\xFAntale el m\xE9todo de pago preferido (SINPE M\xF3vil, Transferencia o Efectivo).
- Cuando el cliente confirme la compra ("s\xED confirmo", "listo", "procedamos", "dale"), a\xF1ade al final:
  <<<COMMAND_ORDER: {"items":[{"productName":"Nombre Exacto","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"direcci\xF3n si aplica", "customerName":"${senderName}"}>>>
- Agradece la compra y brinda los datos de pago del negocio solicitando el comprobante para despacharlo.

8. RASTREO Y CONSULTAS DE ESTADO DE PEDIDOS:
- Si el cliente pregunta por su pedido ("\xBFC\xF3mo va mi orden?", "\xBFD\xF3nde viene?", "\xBFYa sali\xF3?"), revisa la secci\xF3n "PEDIDOS ACTIVOS EN CURSO DE ESTE CLIENTE" y resp\xF3ndele de inmediato con el n\xFAmero de orden, los \xEDtems y su estado real actual, d\xE1ndole tranquilidad.

9. GESTI\xD3N DE CITAS:
- Para AGENDAR: Cuando el cliente elija servicio, fecha y hora (verificando que NO figure en HORARIOS YA OCUPADOS), y opcionalmente elija con qui\xE9n atenderse, a\xF1ade <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}","specialistName":"opcional"}>>>.
- Para CANCELAR: Si el cliente pide cancelar una cita activa, SIEMPRE preg\xFAntale primero para confirmar: "\xBFEst\xE1s seguro de que deseas cancelar tu cita de [Servicio] para el [Fecha] a las [Hora]?". SOLO si el cliente responde confirmando ("s\xED", "confirmo", "correcto", "canc\xE9lala"), a\xF1ade <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD", "service":"opcional", "reason":"solicitado por cliente"}>>>.
- Para REAGENDAR: Ofr\xE9cele los horarios libres disponibles y cuando confirme la nueva fecha y hora, a\xF1ade <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD", "newTime":"HH:MM"}>>>.

10. RESERVA DE CANCHAS DEPORTIVAS (F\xDATBOL / P\xC1DEL):
- Si el cliente pregunta por canchas o partidos, ofr\xE9cele las canchas del cat\xE1logo con sus precios por hora. Preg\xFAntale fecha, hora y modalidad ("full" para cancha completa o "seek_match" si busca rival / partido abierto).
- Cuando el cliente confirme la reserva de cancha, a\xF1ade al final:
  <<<COMMAND_COURT_BOOKING: {"courtName":"nombre cancha", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>

Acciones disponibles (a\xF1ade al final SOLO cuando el cliente confirme expl\xEDcitamente):
Cita: <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}","specialistName":"opcional"}>>>
Cancha: <<<COMMAND_COURT_BOOKING: {"courtName":"nombre", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>
Cancelar Cita: <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","service":"opcional","reason":"motivo"}>>>
Reagendar Cita: <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD","newTime":"HH:MM"}>>>
Compra / Pedido: <<<COMMAND_ORDER: {"items":[{"productName":"nombre","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"direcci\xF3n si aplica", "customerName":"${senderName}"}>>>
Foto: <<<COMMAND_SEND_MEDIA: {"mediaUrl":"URL","caption":"desc"}>>>
Humano: <<<COMMAND_HANDOFF: {"reason":"motivo"}>>>`;
  const structuredMessages = [];
  if (chatHistory && chatHistory.length > 0) {
    for (const h of chatHistory.slice(-12)) {
      structuredMessages.push({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content
      });
    }
  }
  structuredMessages.push({
    role: "user",
    content: `${userMessage}`
  });
  const flatPrompt = `${systemPrompt}

${chatHistory.slice(-12).map((h) => `${h.role === "user" ? "Cliente" : "Asistente"}: ${h.content}`).join("\n")}

Cliente (${senderName}): ${userMessage}
Asistente:`;
  let apiKey = "";
  let isMarcaBlanca = false;
  if (tenant?.aiApiKeyEncrypted) {
    try {
      apiKey = decrypt(tenant.aiApiKeyEncrypted);
    } catch (e) {
    }
  }
  let config;
  if (apiKey) {
    config = {
      provider: tenant?.aiProvider || "gemini",
      apiKey,
      model: tenant?.aiModel || agentConfig?.model || "gemini-2.5-flash",
      temperature: agentConfig?.temperature || 0.7
    };
  } else {
    isMarcaBlanca = true;
    const usage = await getTenantCurrentMonthUsage(tenantId);
    if (usage.isExceeded) {
      return {
        replyText: "Hola, el asistente virtual de este negocio ha completado su cuota mensual de atenci\xF3n autom\xE1tica. Un asesor humano te responder\xE1 en breve.",
        isBookingDetected: false,
        isOrderDetected: false,
        isHandoffRequested: true,
        handoffReason: "L\xEDmite de cuota mensual de IA alcanzado",
        tokensUsed: 0
      };
    }
    const masterConfig = await getMasterAIConfig();
    config = {
      ...masterConfig,
      temperature: agentConfig?.temperature || 0.7
    };
  }
  const aiResult = await callAI(config, {
    system: systemPrompt,
    messages: structuredMessages
  });
  let replyText = aiResult.text;
  if (isMarcaBlanca && aiResult.tokensUsed > 0) {
    await incrementTenantUsage(tenantId, aiResult.tokensUsed);
  }
  let isBookingDetected = false;
  let bookingData;
  let isOrderDetected = false;
  let orderData;
  let isHandoffRequested = false;
  let handoffReason;
  let isMediaDetected = false;
  let mediaData;
  let isCancelBookingDetected = false;
  let cancelBookingData;
  let isRescheduleBookingDetected = false;
  let rescheduleBookingData;
  let isCourtBookingDetected = false;
  let courtBookingData;
  const bookingRegex = /<<<COMMAND_BOOKING:\s*({.*?})>>>/s;
  const courtBookingRegex = /<<<COMMAND_COURT_BOOKING:\s*({.*?})>>>/s;
  const orderRegex = /<<<COMMAND_ORDER:\s*({.*?})>>>/s;
  const handoffRegex = /<<<COMMAND_HANDOFF:\s*({.*?})>>>/s;
  const mediaRegex = /<<<COMMAND_SEND_MEDIA:\s*({.*?})>>>/s;
  const cancelRegex = /<<<COMMAND_CANCEL_BOOKING:\s*({.*?})>>>/s;
  const rescheduleRegex = /<<<COMMAND_RESCHEDULE_BOOKING:\s*({.*?})>>>/s;
  function safeParseJSON(rawStr) {
    if (!rawStr || typeof rawStr !== "string") return null;
    let cleaned = rawStr.trim();
    cleaned = cleaned.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
    try {
      return JSON.parse(cleaned);
    } catch (e1) {
      try {
        const relaxed = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        return JSON.parse(relaxed);
      } catch (e2) {
        return null;
      }
    }
  }
  const bookingMatch = replyText.match(bookingRegex);
  if (bookingMatch && bookingMatch[1]) {
    const parsed = safeParseJSON(bookingMatch[1]);
    if (parsed && parsed.service && (parsed.date || parsed.time)) {
      isBookingDetected = true;
      bookingData = parsed;
    }
  }
  const courtMatch = replyText.match(courtBookingRegex);
  if (courtMatch && courtMatch[1]) {
    const parsed = safeParseJSON(courtMatch[1]);
    if (parsed && (parsed.courtName || parsed.courtId) && (parsed.date || parsed.time)) {
      isCourtBookingDetected = true;
      courtBookingData = parsed;
    }
  }
  const cancelMatch = replyText.match(cancelRegex);
  if (cancelMatch && cancelMatch[1]) {
    const parsed = safeParseJSON(cancelMatch[1]);
    if (parsed) {
      isCancelBookingDetected = true;
      cancelBookingData = parsed;
    }
  }
  const rescheduleMatch = replyText.match(rescheduleRegex);
  if (rescheduleMatch && rescheduleMatch[1]) {
    const parsed = safeParseJSON(rescheduleMatch[1]);
    if (parsed && (parsed.newDate || parsed.newTime)) {
      isRescheduleBookingDetected = true;
      rescheduleBookingData = parsed;
    }
  }
  const orderMatch = replyText.match(orderRegex);
  if (orderMatch && orderMatch[1]) {
    const parsed = safeParseJSON(orderMatch[1]);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      const validItems = parsed.items.filter((it) => it.productName && it.productName.trim().length > 0);
      if (validItems.length > 0) {
        isOrderDetected = true;
        orderData = { ...parsed, items: validItems };
      }
    }
  }
  const handoffMatch = replyText.match(handoffRegex);
  if (handoffMatch && handoffMatch[1]) {
    isHandoffRequested = true;
    const parsed = safeParseJSON(handoffMatch[1]);
    if (parsed?.reason) handoffReason = parsed.reason;
  }
  const mediaMatch = replyText.match(mediaRegex);
  if (mediaMatch && mediaMatch[1]) {
    const parsed = safeParseJSON(mediaMatch[1]);
    if (parsed && (parsed.mediaUrl || parsed.url)) {
      isMediaDetected = true;
      mediaData = { mediaUrl: parsed.mediaUrl || parsed.url, caption: parsed.caption };
    }
  }
  replyText = replyText.replace(bookingRegex, "").replace(courtBookingRegex, "").replace(orderRegex, "").replace(handoffRegex, "").replace(mediaRegex, "").replace(cancelRegex, "").replace(rescheduleRegex, "").replace(/\*\*/g, "*").trim();
  return {
    replyText,
    isBookingDetected,
    bookingData,
    isCourtBookingDetected,
    courtBookingData,
    isOrderDetected,
    orderData,
    isHandoffRequested,
    handoffReason,
    isMediaDetected,
    mediaData,
    isCancelBookingDetected,
    cancelBookingData,
    isRescheduleBookingDetected,
    rescheduleBookingData,
    tokensUsed: aiResult.tokensUsed
  };
}

// src/server/db/chats.repo.ts
init_pool();
async function getChatsByTenant(tenantId, limit = 1e3) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
    FROM chat_messages 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [tenantId, limit]);
  return result.rows;
}
async function createChatMessage(tenantIdOrData, optionalData) {
  let tenantId;
  let data;
  if (typeof tenantIdOrData === "string") {
    tenantId = tenantIdOrData;
    data = optionalData || {};
  } else {
    data = tenantIdOrData || {};
    tenantId = data.tenantId || "";
  }
  const msgId = data.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const remoteJid = data.remoteJid || "";
  const pushName = data.pushName || null;
  const fromMe = data.fromMe || false;
  const messageText = data.messageText || "";
  const aiResponse = typeof data.aiResponse === "boolean" ? data.aiResponse ? messageText : "" : data.aiResponse || null;
  const status = data.status || "received";
  const result = await query(`
    INSERT INTO chat_messages (
      id, tenant_id, remote_jid, push_name, from_me, message_text, ai_response, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      message_text = EXCLUDED.message_text,
      status = EXCLUDED.status
    RETURNING id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
  `, [
    msgId,
    tenantId,
    remoteJid,
    pushName,
    fromMe,
    messageText,
    aiResponse ? true : false,
    status
  ]);
  if (remoteJid) {
    try {
      await query(`
        INSERT INTO chat_sessions (tenant_id, remote_jid, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      `, [tenantId, remoteJid]);
    } catch (e) {
    }
  }
  return result.rows[0];
}
async function getChatSession(tenantId, remoteJid) {
  let result;
  try {
    result = await query(`
      SELECT is_human_mode as "isHumanMode", unread, notes, human_mode_until as "humanModeUntil"
      FROM chat_sessions
      WHERE tenant_id = $1 AND remote_jid = $2
    `, [tenantId, remoteJid]);
  } catch (err) {
    if (err && (err.message?.includes("human_mode_until") || err.code === "42703")) {
      await query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS human_mode_until TIMESTAMPTZ;`);
      result = await query(`
        SELECT is_human_mode as "isHumanMode", unread, notes, human_mode_until as "humanModeUntil"
        FROM chat_sessions
        WHERE tenant_id = $1 AND remote_jid = $2
      `, [tenantId, remoteJid]);
    } else {
      throw err;
    }
  }
  const session = result.rows[0];
  if (!session) return { isHumanMode: false, unread: false, notes: "" };
  if (session.isHumanMode && session.humanModeUntil && new Date(session.humanModeUntil).getTime() < Date.now()) {
    await query(`
      UPDATE chat_sessions 
      SET is_human_mode = false, human_mode_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND remote_jid = $2
    `, [tenantId, remoteJid]);
    return { isHumanMode: false, unread: session.unread || false, notes: session.notes || "" };
  }
  return session;
}
async function getAllChatSessions(tenantId) {
  let result;
  try {
    result = await query(`
      SELECT remote_jid as "remoteJid", is_human_mode as "isHumanMode", unread, notes, human_mode_until as "humanModeUntil"
      FROM chat_sessions
      WHERE tenant_id = $1
    `, [tenantId]);
  } catch (err) {
    result = await query(`
      SELECT remote_jid as "remoteJid", is_human_mode as "isHumanMode", unread, notes
      FROM chat_sessions
      WHERE tenant_id = $1
    `, [tenantId]);
  }
  const map = {};
  result.rows.forEach((r) => {
    map[r.remoteJid] = {
      isHumanMode: r.isHumanMode || false,
      unread: r.unread || false,
      notes: r.notes || "",
      humanModeUntil: r.humanModeUntil
    };
  });
  return map;
}
async function setChatHumanMode(tenantId, remoteJid, isHumanMode, hoursUntilExpire = 4) {
  const safeHours = Math.max(1, Math.min(168, Number(hoursUntilExpire) || 4));
  const intervalStr = `${safeHours} hours`;
  const sql = isHumanMode ? `
    INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, human_mode_until, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP + $4::interval, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET
      is_human_mode = EXCLUDED.is_human_mode,
      human_mode_until = CURRENT_TIMESTAMP + $4::interval,
      updated_at = CURRENT_TIMESTAMP
  ` : `
    INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, human_mode_until, updated_at)
    VALUES ($1, $2, $3, NULL, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET
      is_human_mode = EXCLUDED.is_human_mode,
      human_mode_until = NULL,
      updated_at = CURRENT_TIMESTAMP
  `;
  const params = isHumanMode ? [tenantId, remoteJid, true, intervalStr] : [tenantId, remoteJid, false];
  try {
    await query(sql, params);
  } catch (err) {
    if (err && (err.message?.includes("human_mode_until") || err.code === "42703")) {
      await query(`ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS human_mode_until TIMESTAMPTZ;`);
      await query(sql, params);
    } else {
      throw err;
    }
  }
}
var getChatMessagesByTenant = getChatsByTenant;
var saveChatMessage = createChatMessage;

// src/server/db/appointments.repo.ts
init_pool();
async function getAppointmentsByTenant(tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
    FROM appointments 
    WHERE tenant_id = $1
    ORDER BY date DESC, time DESC
  `, [tenantId]);
  return result.rows;
}
async function getAppointmentById(id, tenantId) {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
    FROM appointments 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}
async function createAppointment(tenantId, data) {
  const result = await query(`
    INSERT INTO appointments (
      tenant_id, name, whatsapp, service, date, time, amount, status, details, vehicle_model, selected_variables, specialist_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
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
    data.specialistId || null
  ]);
  return result.rows[0];
}
async function updateAppointment(id, tenantId, data) {
  const updates = [];
  const params = [id, tenantId];
  let paramIdx = 3;
  const fields = ["name", "whatsapp", "service", "date", "time", "amount", "status", "details", "vehicleModel", "selectedVariables", "specialistId"];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      const val = field === "selectedVariables" ? JSON.stringify(data[field]) : data[field];
      params.push(val);
    }
  }
  if (updates.length === 0) return getAppointmentById(id, tenantId);
  const result = await query(`
    UPDATE appointments SET ${updates.join(", ")}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
  `, params);
  return result.rows[0] || null;
}
async function updateAppointmentStatus(id, tenantId, status) {
  return updateAppointment(id, tenantId, { status });
}
async function deleteAppointment(id, tenantId) {
  const result = await query("DELETE FROM appointments WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}

// src/server/services/booking.service.ts
init_pool();
async function createBookingFromCommand(tenantId, bookingData) {
  try {
    const services = await getServicesByTenant(tenantId);
    const matchedService = services.find(
      (s) => s.name.toLowerCase().includes((bookingData.service || "").toLowerCase())
    ) || services[0];
    const price = matchedService ? matchedService.price : 0;
    const bookingDate = bookingData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const bookingTime = bookingData.time || "10:00 AM";
    const collisionCheck = await query(`
      SELECT id, name, time 
      FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND time = $3 AND status NOT IN ('cancelled', 'cancelado')
      LIMIT 1
    `, [tenantId, bookingDate, bookingTime]);
    if (collisionCheck.rows.length > 0) {
      console.warn(`[createBookingFromCommand] Conflict detected: Slot ${bookingDate} ${bookingTime} is already booked.`);
      throw new Error(`El horario ${bookingDate} a las ${bookingTime} ya se encuentra reservado.`);
    }
    let specialistId = void 0;
    if (bookingData.specialistId) {
      specialistId = bookingData.specialistId;
    } else if (bookingData.specialistName) {
      const allSpecs = await getSpecialistsByTenant(tenantId);
      const matchedSpec = allSpecs.find(
        (s) => s.name.toLowerCase().includes(bookingData.specialistName.toLowerCase()) || bookingData.specialistName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSpec) specialistId = matchedSpec.id;
    }
    const appointment = await createAppointment(tenantId, {
      name: bookingData.customerName || "Cliente WhatsApp",
      whatsapp: bookingData.customerPhone || "",
      service: matchedService ? matchedService.name : bookingData.service || "Servicio General",
      date: bookingDate,
      time: bookingTime,
      amount: Number(price),
      details: bookingData.vehicleInfo || "",
      specialistId,
      status: "scheduled"
    });
    return appointment;
  } catch (error) {
    console.error("Error creating booking from command:", error);
    throw error;
  }
}
async function cancelBookingFromWhatsApp(tenantId, phone, cancelData) {
  try {
    const clean = phone.replace(/\D/g, "");
    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params = [tenantId, clean.slice(-8)];
    let paramIdx = 3;
    if (cancelData?.date) {
      sql += ` AND date = $${paramIdx++}`;
      params.push(cancelData.date);
    }
    if (cancelData?.service) {
      sql += ` AND service ILIKE $${paramIdx++}`;
      params.push(`%${cancelData.service}%`);
    }
    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);
    if (!res.rows[0]) {
      console.log(`[CancelBooking] No active appointment found for phone ${phone} matching criteria:`, cancelData);
      return null;
    }
    const appt = res.rows[0];
    const updated = await updateAppointment(appt.id, tenantId, { status: "cancelled" });
    console.log(`[CancelBooking] Successfully cancelled appointment ${appt.id} for ${appt.name} (${appt.service} - ${appt.date} ${appt.time})`);
    return updated;
  } catch (error) {
    console.error("Error cancelling booking from WhatsApp:", error);
    return null;
  }
}
async function rescheduleBookingFromWhatsApp(tenantId, phone, rescheduleData) {
  try {
    const clean = phone.replace(/\D/g, "");
    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params = [tenantId, clean.slice(-8)];
    let paramIdx = 3;
    if (rescheduleData?.currentDate || rescheduleData?.date) {
      sql += ` AND date = $${paramIdx++}`;
      params.push(rescheduleData.currentDate || rescheduleData.date);
    }
    if (rescheduleData?.service) {
      sql += ` AND service ILIKE $${paramIdx++}`;
      params.push(`%${rescheduleData.service}%`);
    }
    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);
    if (!res.rows[0]) {
      console.log(`[RescheduleBooking] No active appointment found for phone ${phone} matching criteria:`, rescheduleData);
      return null;
    }
    const appt = res.rows[0];
    const targetDate = rescheduleData.newDate || appt.date;
    const targetTime = rescheduleData.newTime || appt.time;
    const collisionCheck = await query(`
      SELECT id FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND time = $3 AND status NOT IN ('cancelled', 'cancelado') AND id != $4
      LIMIT 1
    `, [tenantId, targetDate, targetTime, appt.id]);
    if (collisionCheck.rows.length > 0) {
      console.warn(`[RescheduleBooking] Conflict detected: Target slot ${targetDate} ${targetTime} is already occupied.`);
      throw new Error(`El horario ${targetDate} a las ${targetTime} ya se encuentra ocupado.`);
    }
    const updated = await updateAppointment(appt.id, tenantId, {
      date: targetDate,
      time: targetTime,
      status: "scheduled"
    });
    console.log(`[RescheduleBooking] Successfully moved appointment ${appt.id} (${appt.service}) to ${targetDate} ${targetTime}`);
    return updated;
  } catch (error) {
    console.error("Error rescheduling booking from WhatsApp:", error);
    return null;
  }
}

// src/server/db/orders.repo.ts
init_pool();
async function getOrdersByTenant(tenantId, filters) {
  const result = await query(`
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber", o.customer_name as "customerName",
           o.customer_phone as "customerPhone", o.customer_email as "customerEmail", o.customer_address as "customerAddress",
           o.whatsapp_jid as "whatsappJid", o.source, o.subtotal, o.delivery_fee as "deliveryFee", o.discount, o.total,
           o.currency, o.status, o.payment_method as "paymentMethod", o.payment_status as "paymentStatus",
           o.payment_reference as "paymentReference", o.payment_proof_url as "paymentProofUrl", o.payment_proof_status as "paymentProofStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber", o.customer_location as "customerLocation",
           o.chat_message_id as "chatMessageId", o.driver_id as "driverId", o.waze_url as "wazeUrl",
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
  const result = await query(`
    SELECT id, tenant_id as "tenantId", order_number as "orderNumber", customer_name as "customerName",
           customer_phone as "customerPhone", customer_email as "customerEmail", customer_address as "customerAddress",
           whatsapp_jid as "whatsappJid", source, subtotal, delivery_fee as "deliveryFee", discount, total,
           currency, status, payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl", payment_proof_status as "paymentProofStatus", notes, delivery_method as "deliveryMethod",
           consumption_mode as "consumptionMode", table_number as "tableNumber", customer_location as "customerLocation",
           chat_message_id as "chatMessageId", driver_id as "driverId", waze_url as "wazeUrl",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM orders 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  if (result.rows.length === 0) return null;
  const order = result.rows[0];
  const itemsRes = await query(`
    SELECT id, product_id as "productId", variant_id as "variantId", product_name as "productName",
           variant_name as "variantName", selected_variables as "selectedVariables",
           quantity, unit_price as "unitPrice", total_price as "totalPrice"
    FROM order_items WHERE order_id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  order.items = itemsRes.rows;
  return order;
}
async function createOrder(tenantId, data, items) {
  const insertSql = `
    INSERT INTO orders (
      tenant_id, customer_name, customer_phone, customer_email, customer_address, whatsapp_jid,
      source, subtotal, delivery_fee, discount, total, currency, status, payment_method, 
      payment_status, payment_reference, payment_proof_url, payment_proof_status, notes, delivery_method, consumption_mode, table_number, customer_location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING id
  `;
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
    data.discount || 0,
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
    data.customerLocation ? JSON.stringify(data.customerLocation) : null
  ];
  let result;
  try {
    result = await query(insertSql, params);
  } catch (err) {
    if (err && (err.message?.includes("payment_proof_url") || err.message?.includes("payment_proof_status") || err.code === "42703")) {
      console.log("[createOrder] Column missing detected, auto-migrating orders table...");
      await query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_status VARCHAR(50) DEFAULT 'pending';
      `);
      result = await query(insertSql, params);
    } else {
      throw err;
    }
  }
  const orderId = result.rows[0].id;
  const orderItems = items || data.items || [];
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      await query(`
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
  return getOrderById(orderId, tenantId);
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
    "customerAddress"
  ];
  for (const field of fields) {
    if (data[field] !== void 0) {
      const dbField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      if (field === "customerLocation") {
        updates.push(`${dbField} = $${paramIdx++}::jsonb`);
        params.push(JSON.stringify(data[field]));
      } else {
        updates.push(`${dbField} = $${paramIdx++}`);
        params.push(data[field]);
      }
    }
  }
  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query(`UPDATE orders SET ${updates.join(", ")} WHERE id = $1 AND tenant_id = $2`, params);
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
    const itemsRes = await client.query(`
      SELECT product_id as "productId", variant_id as "variantId", quantity
      FROM order_items
      WHERE order_id = $1 AND tenant_id = $2
    `, [orderId, tenantId]);
    for (const item of itemsRes.rows) {
      const qty = Number(item.quantity || 1);
      if (item.productId) {
        await client.query(`
          UPDATE products
          SET stock = GREATEST(0, stock - $1),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND tenant_id = $3 AND track_stock = true
        `, [qty, item.productId, tenantId]);
        if (item.variantId) {
          await client.query(`
            UPDATE product_variants
            SET stock = GREATEST(0, stock - $1)
            WHERE id = $2 AND product_id = $3
          `, [qty, item.variantId, item.productId]);
        }
      }
    }
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

// src/server/services/order.service.ts
init_pool();
async function createOrderFromWhatsApp(tenantId, orderData) {
  try {
    const allProducts = await getProductsByTenant(tenantId, true);
    const items = [];
    let subtotal = 0;
    for (const item of orderData.items || []) {
      const product = allProducts.find(
        (p) => p.name.toLowerCase().includes((item.productName || "").toLowerCase()) || (item.productName || "").toLowerCase().includes(p.name.toLowerCase())
      );
      const qty = item.quantity || 1;
      if (product && product.trackStock) {
        if (item.variantName && product.variants && product.variants.length > 0) {
          const matchedVariant = product.variants.find(
            (v) => v.name.toLowerCase().includes(item.variantName.toLowerCase()) || item.variantName.toLowerCase().includes(v.name.toLowerCase())
          );
          if (matchedVariant && (matchedVariant.stock ?? 0) < qty) {
            throw new Error(`Stock insuficiente para la variante "${matchedVariant.name}" de "${product.name}". Disponible: ${matchedVariant.stock ?? 0}`);
          }
        } else if ((product.stock ?? 0) < qty) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock ?? 0}`);
        }
      }
    }
    for (const item of orderData.items || []) {
      const product = allProducts.find(
        (p) => p.name.toLowerCase().includes((item.productName || "").toLowerCase()) || (item.productName || "").toLowerCase().includes(p.name.toLowerCase())
      );
      let unitPrice = product ? Number(product.price) : item.unitPrice || 0;
      let variantName = item.variantName || null;
      let variantId = null;
      if (product && item.variantName && product.variants && product.variants.length > 0) {
        const matchedVariant = product.variants.find(
          (v) => v.name.toLowerCase().includes(item.variantName.toLowerCase()) || item.variantName.toLowerCase().includes(v.name.toLowerCase())
        );
        if (matchedVariant) {
          variantId = matchedVariant.id;
          variantName = matchedVariant.name;
          if (matchedVariant.priceOverride && Number(matchedVariant.priceOverride) > 0) {
            unitPrice = Number(matchedVariant.priceOverride);
          }
        }
      }
      const qty = item.quantity || 1;
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;
      items.push({
        productId: product?.id || void 0,
        variantId: variantId || void 0,
        productName: product?.name || item.productName || "Producto",
        variantName: variantName || void 0,
        quantity: qty,
        unitPrice,
        totalPrice
      });
      if (product && product.trackStock) {
        await query(
          "UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3",
          [qty, product.id, tenantId]
        );
        if (variantId) {
          await query(
            "UPDATE product_variants SET stock = GREATEST(0, stock - $1) WHERE id = $2 AND product_id = $3",
            [qty, variantId, product.id]
          );
        }
      }
    }
    const deliveryMethod = orderData.deliveryMethod || (orderData.deliveryAddress ? "delivery" : "pickup");
    const customerAddress = orderData.deliveryAddress || orderData.customerAddress || "";
    const store = await getStoreSettings(tenantId);
    const isDelivery = deliveryMethod === "delivery";
    const deliveryFee = isDelivery ? Number(store?.deliveryFee || 0) : 0;
    const finalTotal = subtotal + deliveryFee;
    const order = await createOrder(
      tenantId,
      {
        customerName: orderData.customerName || "Cliente WhatsApp",
        customerPhone: orderData.customerPhone || "",
        customerAddress,
        deliveryMethod,
        source: "whatsapp",
        subtotal,
        deliveryFee,
        total: finalTotal,
        currency: store?.currency || "CRC",
        status: "pedido_recibido",
        paymentMethod: orderData.paymentMethod || "sinpe",
        paymentStatus: "pending",
        notes: orderData.notes || (deliveryMethod === "delivery" && customerAddress ? `Entrega a: ${customerAddress}` : void 0)
      },
      items
    );
    return order;
  } catch (error) {
    console.error("Error creating order from WhatsApp:", error);
    throw error;
  }
}

// src/server/services/message-queue.service.ts
init_evolution();

// src/server/db/ai-command-logs.repo.ts
init_pool();
async function logAICommand(tenantId, remoteJid, commandType, payload, status, errorMessage) {
  try {
    await query(`
      INSERT INTO ai_command_logs (tenant_id, remote_jid, command_type, payload, status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      tenantId,
      remoteJid,
      commandType,
      payload ? JSON.stringify(payload) : null,
      status,
      errorMessage || null
    ]);
  } catch (err) {
    if (err && (err.message?.includes("ai_command_logs") || err.code === "42P01")) {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS ai_command_logs (
            id TEXT PRIMARY KEY DEFAULT 'cmd_' || gen_random_uuid()::text,
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            remote_jid VARCHAR(100) NOT NULL,
            command_type VARCHAR(50) NOT NULL,
            payload JSONB,
            status VARCHAR(50) NOT NULL,
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await query(`
          INSERT INTO ai_command_logs (tenant_id, remote_jid, command_type, payload, status, error_message)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          tenantId,
          remoteJid,
          commandType,
          payload ? JSON.stringify(payload) : null,
          status,
          errorMessage || null
        ]);
      } catch (innerErr) {
        console.error("[logAICommand] Inner error creating table or inserting:", innerErr);
      }
    } else {
      console.error("[logAICommand] Error logging AI command:", err);
    }
  }
}

// src/server/services/message-queue.service.ts
var io = null;
var activeChats = /* @__PURE__ */ new Set();
var MAX_CONCURRENT = 5;
var isPolling = false;
function startQueueWorker(socketIo) {
  io = socketIo;
  console.log("[Queue] Worker started. Multi-tenant concurrent worker active (up to 5 parallel)...");
  setInterval(tickQueue, 1500);
}
async function tickQueue() {
  if (isPolling) return;
  isPolling = true;
  try {
    while (activeChats.size < MAX_CONCURRENT) {
      const excludeKeys = Array.from(activeChats);
      const msg = await takeNextPending(excludeKeys);
      if (!msg) break;
      const chatKey = `${msg.tenantId}:${msg.remoteJid}`;
      activeChats.add(chatKey);
      processSingleMessage(msg).catch((err) => console.error("[Queue] Uncaught error in processSingleMessage:", err)).finally(() => {
        activeChats.delete(chatKey);
      });
    }
  } finally {
    isPolling = false;
  }
}
async function processSingleMessage(msg) {
  try {
    console.log(`[Queue] Processing message from ${msg.pushName} (${msg.cleanPhone}): "${msg.userMessage.slice(0, 50)}..."`);
    const session = await getChatSession(msg.tenantId, msg.remoteJid);
    if (session?.isHumanMode) {
      console.log(`[Queue] Chat ${msg.remoteJid} is in HUMAN MODE. Skipping.`);
      await markDone(msg.id, "HUMAN_MODE_SKIP");
      return;
    }
    const agentConfig = await getAgentConfig(msg.tenantId);
    if (agentConfig?.aiChatbotEnabled === false) {
      await markDone(msg.id, "AI_DISABLED");
      return;
    }
    const additionalMessages = await consumePendingForChat(msg.tenantId, msg.remoteJid, msg.id);
    let fullUserMessage = msg.userMessage;
    if (additionalMessages.length > 0) {
      fullUserMessage += "\n" + additionalMessages.join("\n");
      console.log(`[Queue] Debounced ${additionalMessages.length} burst messages for ${msg.pushName}`);
    }
    const allChats = await getChatMessagesByTenant(msg.tenantId, 50);
    const history = allChats.filter((c) => (c.remoteJid || c.remote_jid) === msg.remoteJid).map((c) => ({
      role: c.fromMe || c.from_me ? "assistant" : "user",
      content: c.messageText || c.message_text || c.aiResponse || c.ai_response || ""
    }));
    const aiResult = await processWhatsAppMessageWithAI(
      msg.tenantId,
      fullUserMessage,
      msg.cleanPhone,
      msg.pushName,
      history
    );
    const handoffEnabled = agentConfig?.humanHandoffEnabled !== false;
    const defaultKeywords = ["humano", "asesor", "persona", "agente", "hablar con alguien", "queja", "reclamo", "urgente"];
    const keywords = agentConfig?.handoffKeywords || defaultKeywords;
    const isKeywordTriggered = handoffEnabled && keywords.some((k) => msg.userMessage.toLowerCase().includes(k.toLowerCase().trim()));
    if (handoffEnabled && (isKeywordTriggered || aiResult.isHandoffRequested)) {
      await setChatHumanMode(msg.tenantId, msg.remoteJid, true);
      const customerHandoffReply = `\u{1F464} *Atenci\xF3n Personalizada:* Entendido *${msg.pushName}*, te estamos comunicando con un asesor humano para atenderte directamente. En breve te responder\xE1.`;
      await sendMessage(msg.instanceName, msg.cleanPhone, customerHandoffReply);
      await saveChatMessage(msg.tenantId, { id: `ai_${Date.now()}`, remoteJid: msg.remoteJid, pushName: "Asistente IA", fromMe: true, messageText: customerHandoffReply, aiResponse: customerHandoffReply, status: "sent" });
      await markDone(msg.id, customerHandoffReply);
      if (io) io.to(`tenant_${msg.tenantId}`).emit("chat:message", { id: `ai_${Date.now()}`, tenantId: msg.tenantId, remoteJid: msg.remoteJid, pushName: "Asistente IA", fromMe: true, messageText: customerHandoffReply, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
      const tenant = await getTenantById(msg.tenantId);
      const adminPhone = (agentConfig?.handoffNotifyPhone || tenant?.whatsappNumber || "").replace(/\D/g, "");
      if (adminPhone) {
        const reason = aiResult.handoffReason || (isKeywordTriggered ? `Palabra clave: "${msg.userMessage}"` : "Solicitado por el cliente o la IA");
        const alertMsg = `\u{1F6A8} *\xA1ATENCI\xD3N HUMANA REQUERIDA!*

\u{1F464} *Cliente:* ${msg.pushName} (+${msg.cleanPhone})
\u{1F4DD} *Motivo:* ${reason}

\u{1F449} _La IA ha sido pausada en este chat. Responde desde WhatsApp o tu Panel de Betico._`;
        try {
          await sendMessage(msg.instanceName, adminPhone, alertMsg);
        } catch (adminErr) {
          console.error("[Queue] Error notifying admin of handoff:", adminErr);
        }
      }
      return;
    }
    if (!aiResult || !aiResult.replyText) {
      await markFailed(msg.id, "No AI reply generated");
      return;
    }
    let finalReplyText = aiResult.replyText;
    if (aiResult.isBookingDetected && aiResult.bookingData) {
      try {
        const bResult = await createBookingFromCommand(msg.tenantId, { ...aiResult.bookingData, customerPhone: aiResult.bookingData.customerPhone || msg.cleanPhone, customerName: aiResult.bookingData.customerName || msg.pushName });
        await logAICommand(msg.tenantId, msg.remoteJid, "booking", aiResult.bookingData, "success");
        if (bResult && io) {
          io.to(`tenant_${msg.tenantId}`).emit("appointment:created", bResult);
        }
      } catch (err) {
        console.error("[Queue] Failed to process booking:", err);
        await logAICommand(msg.tenantId, msg.remoteJid, "booking", aiResult.bookingData, "failed", err?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, tuvimos un inconveniente al agendar tu cita porque el horario solicitado ya no est\xE1 disponible o hubo un error en el sistema. \xBFTe gustar\xEDa consultar otro horario?`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit("ai:command_failed", {
            remoteJid: msg.remoteJid,
            commandType: "booking",
            clientName: msg.pushName,
            errorMessage: err?.message || "Error al agendar cita"
          });
        }
      }
    }
    if (aiResult.isCourtBookingDetected && aiResult.courtBookingData) {
      try {
        const cData = aiResult.courtBookingData;
        const allCourts = await getCourtsByTenant(msg.tenantId);
        const matchedCourt = allCourts.find(
          (c) => c.name.toLowerCase().includes((cData.courtName || "").toLowerCase()) || (cData.courtName || "").toLowerCase().includes(c.name.toLowerCase())
        ) || allCourts[0];
        if (matchedCourt) {
          const rawTime = cData.time || "19:00";
          const cleanTime = rawTime.includes(":") ? rawTime.split(":").slice(0, 2).join(":") + ":00" : "19:00:00";
          const newCourtBooking = await createBooking(msg.tenantId, {
            courtId: matchedCourt.id,
            date: cData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            time: cleanTime,
            durationMinutes: cData.durationMinutes || matchedCourt.durationMinutes || 60,
            bookingMode: cData.bookingMode === "seek_match" ? "seek_match" : "full",
            teamAName: cData.teamAName || msg.pushName || "Cliente WhatsApp",
            teamACaptain: msg.pushName || "Cliente WhatsApp",
            teamAPhone: msg.cleanPhone,
            sportType: matchedCourt.sportType,
            totalPrice: matchedCourt.basePrice,
            status: "confirmed"
          });
          console.log(`[Queue] Court booking created for ${msg.pushName} on ${matchedCourt.name} (${newCourtBooking.date} ${newCourtBooking.time})`);
          await logAICommand(msg.tenantId, msg.remoteJid, "court_booking", cData, "success");
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit("courtBooking:created", newCourtBooking);
          }
        }
      } catch (courtErr) {
        console.error("[Queue] Failed to process court booking:", courtErr);
        await logAICommand(msg.tenantId, msg.remoteJid, "court_booking", aiResult.courtBookingData, "failed", courtErr?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, no pudimos apartar la cancha para ese horario porque ya se encuentra ocupada o hubo un inconveniente. \xBFTe gustar\xEDa consultar otro horario?`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit("ai:command_failed", {
            remoteJid: msg.remoteJid,
            commandType: "court_booking",
            clientName: msg.pushName,
            errorMessage: courtErr?.message || "Error al reservar cancha"
          });
        }
      }
    }
    if (aiResult.isOrderDetected && aiResult.orderData) {
      try {
        const orderResult = await createOrderFromWhatsApp(msg.tenantId, { ...aiResult.orderData, customerPhone: aiResult.orderData.customerPhone || msg.cleanPhone, customerName: aiResult.orderData.customerName || msg.pushName });
        await logAICommand(msg.tenantId, msg.remoteJid, "order", aiResult.orderData, "success");
        if (orderResult && io) {
          io.to(`tenant_${msg.tenantId}`).emit("order:created", orderResult);
        }
      } catch (err) {
        console.error("[Queue] Failed to process order:", err);
        await logAICommand(msg.tenantId, msg.remoteJid, "order", aiResult.orderData, "failed", err?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, tuvimos un inconveniente t\xE9cnico al registrar tu orden en el sistema. Un asesor de nuestro equipo se comunicar\xE1 contigo de inmediato para atender tu pedido.`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit("ai:command_failed", {
            remoteJid: msg.remoteJid,
            commandType: "order",
            clientName: msg.pushName,
            errorMessage: err?.message || "Error al procesar orden"
          });
        }
      }
    }
    let sendRes;
    if (aiResult.isMediaDetected && aiResult.mediaData?.mediaUrl) {
      sendRes = await sendMedia(msg.instanceName, msg.cleanPhone, aiResult.mediaData.mediaUrl, finalReplyText || aiResult.mediaData.caption || "");
    } else {
      sendRes = await sendMessage(msg.instanceName, msg.cleanPhone, finalReplyText);
    }
    const aiMsgId = `ai_${Date.now()}`;
    await saveChatMessage(msg.tenantId, { id: aiMsgId, remoteJid: msg.remoteJid, pushName: "Asistente IA", fromMe: true, messageText: finalReplyText, aiResponse: finalReplyText, status: sendRes.success ? "sent" : "failed" });
    if (io) {
      io.to(`tenant_${msg.tenantId}`).emit("chat:message", { id: aiMsgId, tenantId: msg.tenantId, remoteJid: msg.remoteJid, pushName: "Asistente IA", fromMe: true, messageText: finalReplyText, createdAt: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (aiResult.isCancelBookingDetected) {
      try {
        const cancelled = await cancelBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.cancelBookingData);
        if (cancelled) {
          await logAICommand(msg.tenantId, msg.remoteJid, "cancel_booking", aiResult.cancelBookingData, "success");
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit("appointment:updated", cancelled);
          }
        } else {
          await logAICommand(msg.tenantId, msg.remoteJid, "cancel_booking", aiResult.cancelBookingData, "failed", "No se encontr\xF3 cita activa para cancelar");
        }
      } catch (err) {
        console.error("[Queue] Failed to process cancel booking:", err);
        await logAICommand(msg.tenantId, msg.remoteJid, "cancel_booking", aiResult.cancelBookingData, "failed", err?.message);
      }
    }
    if (aiResult.isRescheduleBookingDetected && aiResult.rescheduleBookingData) {
      try {
        const rescheduled = await rescheduleBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.rescheduleBookingData);
        if (rescheduled) {
          await logAICommand(msg.tenantId, msg.remoteJid, "reschedule_booking", aiResult.rescheduleBookingData, "success");
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit("appointment:updated", rescheduled);
          }
        } else {
          await logAICommand(msg.tenantId, msg.remoteJid, "reschedule_booking", aiResult.rescheduleBookingData, "failed", "Horario ocupado o no se encontr\xF3 cita");
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit("ai:command_failed", {
              remoteJid: msg.remoteJid,
              commandType: "reschedule_booking",
              clientName: msg.pushName,
              errorMessage: "Horario ocupado o no se encontr\xF3 la cita"
            });
          }
        }
      } catch (err) {
        console.error("[Queue] Failed to process reschedule booking:", err);
        await logAICommand(msg.tenantId, msg.remoteJid, "reschedule_booking", aiResult.rescheduleBookingData, "failed", err?.message);
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit("ai:command_failed", {
            remoteJid: msg.remoteJid,
            commandType: "reschedule_booking",
            clientName: msg.pushName,
            errorMessage: err?.message || "Error al reagendar cita"
          });
        }
      }
    }
    await markDone(msg.id, aiResult.replyText);
    console.log(`[Queue] \u2705 Processed message for ${msg.pushName} in queue`);
  } catch (error) {
    console.error("[Queue] Error processing message:", error);
    try {
      await markFailed(msg.id, error?.message || "Error inesperado al procesar mensaje");
    } catch (markErr) {
      console.error("[Queue] Error marking message as failed:", markErr);
    }
  }
}

// src/server/services/evolution-api.service.ts
init_evolution();
import crypto3 from "crypto";

// src/server/services/event-bus.service.ts
import { EventEmitter } from "events";
var DomainEventBus = class extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }
};
var domainEventBus = new DomainEventBus();
var ORDER_PAID_EVENT = "order:paid";
function emitOrderPaidEvent(payload) {
  try {
    domainEventBus.emit(ORDER_PAID_EVENT, payload);
  } catch (err) {
    console.error("[DomainEventBus] Error al emitir OrderPaidEvent:", err);
  }
}
function onOrderPaidEvent(handler) {
  domainEventBus.on(ORDER_PAID_EVENT, async (payload) => {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[DomainEventBus] Error en listener de OrderPaidEvent para orden #${payload.orderNumber}:`, err);
    }
  });
}

// src/server/services/evolution-api.service.ts
init_env();
init_pool();
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var EvolutionApiService = class {
  /**
   * Sends a WhatsApp message with exponential backoff retry logic.
   */
  static async sendMessageWithRetry(instanceName, phone, messageText, maxRetries = 3) {
    let cleanPhone = (phone || "").replace(/\D/g, "");
    if (cleanPhone.length === 8) {
      cleanPhone = "506" + cleanPhone;
    }
    if (!cleanPhone || !instanceName) {
      console.warn("[EvolutionApiService] Par\xE1metros incompletos para env\xEDo de WhatsApp.");
      return false;
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sendMessage(instanceName, cleanPhone, messageText);
        return true;
      } catch (err) {
        console.warn(`[EvolutionApiService] Intento ${attempt}/${maxRetries} fallido para ${cleanPhone}:`, err.message);
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 1e3;
          await sleep(backoff);
        }
      }
    }
    console.error(`[EvolutionApiService] No fue posible enviar WhatsApp a ${cleanPhone} tras ${maxRetries} intentos.`);
    return false;
  }
  /**
   * Generates a conversational order for WhatsApp with a secure, non-sequential
   * dynamic payment link and a 60-minute TTL.
   */
  static async createOrderAndGeneratePaymentLink(tenantId, orderData) {
    const paymentLinkToken = crypto3.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
    const store = await getStoreSettings(tenantId);
    const tenant = await getTenantById(tenantId);
    const newOrder = await createOrder(
      tenantId,
      {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress || null,
        source: "whatsapp",
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee || 0,
        total: orderData.total,
        currency: orderData.currency || store?.currency || "CRC",
        status: "pending",
        paymentMethod: "card",
        paymentStatus: "pending",
        deliveryMethod: orderData.deliveryMethod || "pickup",
        notes: orderData.notes || null,
        channelOrigin: "WHATSAPP",
        paymentLinkToken,
        paymentLinkExpiresAt: expiresAt
      },
      orderData.items
    );
    await query(`
      UPDATE orders
      SET channel_origin = 'WHATSAPP',
          payment_link_token = $1,
          payment_link_expires_at = $2
      WHERE id = $3 AND tenant_id = $4
    `, [paymentLinkToken, expiresAt, newOrder.id, tenantId]);
    const baseUrl = env.APP_URL || "https://betico.tech";
    const paymentLink = `${baseUrl.replace(/\/$/, "")}/pay/${paymentLinkToken}`;
    return {
      order: newOrder,
      paymentLink,
      paymentLinkToken,
      expiresAt
    };
  }
};
function initEvolutionPaymentListeners() {
  onOrderPaidEvent(async (payload) => {
    try {
      const tenant = await getTenantById(payload.tenantId);
      if (!tenant?.evolutionInstance) {
        return;
      }
      if (!payload.customerPhone) {
        return;
      }
      const store = await getStoreSettings(payload.tenantId);
      const storeName = store?.storeName || tenant.name || "nuestro negocio";
      const currencySymbol = payload.currency === "USD" ? "$" : "\u20A1";
      const receiptMsg = `\u{1F389} *\xA1PAGO CONFIRMADO CON \xC9XITO!* \u2705

Hola *${payload.customerName}*, confirmamos el pago seguro de tu pedido *#ORD-${payload.orderNumber}* en *${storeName}*.

\u{1F4B0} *Total Cancelado:* ${currencySymbol}${Number(payload.total).toLocaleString("es-CR")}
\u{1F4B3} *Transacci\xF3n Tilopay:* ${payload.tilopayTransactionId || "Aprobada"}
${payload.tilopayAuthCode ? `\u{1F511} *C\xF3digo de Autorizaci\xF3n:* ${payload.tilopayAuthCode}
` : ""}\u{1F4E6} *Estado:* En preparaci\xF3n para entrega

\xA1Muchas gracias por tu preferencia! Te notificaremos ante cualquier avance. \u2B50`;
      await EvolutionApiService.sendMessageWithRetry(
        tenant.evolutionInstance,
        payload.customerPhone,
        receiptMsg,
        3
      );
      let cleanCustomerPhone = payload.customerPhone.replace(/\D/g, "");
      if (cleanCustomerPhone.length === 8) cleanCustomerPhone = "506" + cleanCustomerPhone;
      await query(`
        INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
        VALUES ($1, $2, $3, $4, 'tilopay_payment_confirmed', 'sent')
      `, [
        `notif_${Date.now()}`,
        payload.tenantId,
        cleanCustomerPhone,
        `Confirmaci\xF3n de pago Tilopay para orden #ORD-${payload.orderNumber}`
      ]);
    } catch (err) {
      console.error("[EvolutionPaymentListener] Error enviando WhatsApp de pago:", err);
    }
  });
  console.log("[EvolutionApiService] Listener de OrderPaidEvent inicializado correctamente.");
}

// src/server/routes/auth.routes.ts
import { Router } from "express";

// src/server/middleware/auth.ts
init_env();
import jwt from "jsonwebtoken";
function generateToken(userId, tenantId, role) {
  return jwt.sign({ userId, tenantId, role }, env.JWT_SECRET, { expiresIn: "7d" });
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Forbidden" });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    res.status(403).json({ error: "Superadmin access required" });
    return;
  }
  next();
}

// src/server/routes/auth.routes.ts
init_users_repo();
init_users_repo();

// src/server/db/website.repo.ts
init_pool();
async function getWebsiteSettingsByTenant(tenantId) {
  const res = await query(
    `SELECT * FROM tenant_websites WHERE tenant_id = $1`,
    [tenantId]
  );
  if (res.rows.length === 0) {
    return {
      tenantId,
      websiteEnabled: true,
      headline: "Bienvenido a nuestro sitio oficial",
      subheadline: "Calidad, confianza y la mejor atenci\xF3n personalizada directo a tu WhatsApp.",
      aboutTitle: "Conoce Nuestra Historia",
      aboutText: "Somos un negocio apasionado por brindar el mejor servicio y productos de primera categor\xEDa. Nuestro compromiso es tu satisfacci\xF3n total.",
      primaryColor: "#2563eb",
      accentColor: "#f59e0b",
      fontFamily: "Inter",
      buttonStyle: "rounded",
      buttonHoverEffect: true,
      buttonTextColor: "#ffffff",
      showStoreButton: true,
      showBookingButton: true,
      showCourtsButton: false,
      storeButtonText: "Ver Men\xFA y Productos",
      bookingButtonText: "Agendar Cita en L\xEDnea",
      courtsButtonText: "Reservar Cancha",
      showWhatsappButton: true,
      whatsappButtonText: "WhatsApp Directo",
      headerLayout: "split",
      overlayColor: "#0f172a",
      overlayOpacity: 0,
      showAboutSection: true,
      showFeaturesSection: true,
      showProductsSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showContactSection: true,
      featuresJson: [
        { title: "Calidad Garantizada", desc: "Productos y servicios seleccionados con los m\xE1s altos est\xE1ndares." },
        { title: "Atenci\xF3n R\xE1pida", desc: "Respuestas y pedidos inmediatos con asistencia 24/7." },
        { title: "Pagos Seguros", desc: "Aceptamos SINPE M\xF3vil, transferencias y tarjetas." }
      ],
      testimonialsJson: [
        { name: "Cliente Satisfecho", comment: "\xA1Excelente servicio y atenci\xF3n r\xE1pida! 100% recomendado.", rating: 5 }
      ]
    };
  }
  const r = res.rows[0];
  return {
    id: r.id,
    tenantId: r.tenant_id,
    websiteEnabled: r.website_enabled !== false,
    headline: r.headline || "Bienvenido a nuestro sitio oficial",
    subheadline: r.subheadline || "Calidad, confianza y la mejor atenci\xF3n personalizada directo a tu WhatsApp.",
    aboutTitle: r.about_title || "Conoce Nuestra Historia",
    aboutText: r.about_text || "",
    aboutImageUrl: r.about_image_url,
    bannerImageUrl: r.banner_image_url,
    logoUrl: r.logo_url,
    logoWhiteUrl: r.logo_white_url,
    primaryColor: r.primary_color || "#2563eb",
    accentColor: r.accent_color || "#f59e0b",
    fontFamily: r.font_family || "Inter",
    buttonStyle: r.button_style || "rounded",
    buttonHoverEffect: r.button_hover_effect !== false,
    buttonTextColor: r.button_text_color || "#ffffff",
    showStoreButton: r.show_store_button !== false,
    showBookingButton: r.show_booking_button !== false,
    showCourtsButton: r.show_courts_button === true,
    storeButtonText: r.store_button_text || "Ver Men\xFA y Productos",
    bookingButtonText: r.booking_button_text || "Agendar Cita en L\xEDnea",
    courtsButtonText: r.courts_button_text || "Reservar Cancha",
    showWhatsappButton: r.show_whatsapp_button !== false,
    whatsappButtonText: r.whatsapp_button_text || "WhatsApp Directo",
    headerLayout: r.header_layout || "split",
    overlayColor: r.overlay_color || "#0f172a",
    overlayOpacity: r.overlay_opacity !== void 0 ? Number(r.overlay_opacity) : 0,
    showAboutSection: r.show_about_section !== false,
    showFeaturesSection: r.show_features_section !== false,
    showProductsSection: r.show_products_section !== false,
    showServicesSection: r.show_services_section !== false,
    showTestimonialsSection: r.show_testimonials_section !== false,
    showContactSection: r.show_contact_section !== false,
    featuresJson: Array.isArray(r.features_json) ? r.features_json : [],
    testimonialsJson: Array.isArray(r.testimonials_json) ? r.testimonials_json : [],
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    contactAddress: r.contact_address,
    instagramUrl: r.instagram_url,
    facebookUrl: r.facebook_url,
    tiktokUrl: r.tiktok_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
async function saveWebsiteSettings(tenantId, data) {
  const sql = `
    INSERT INTO tenant_websites (
      tenant_id, website_enabled, headline, subheadline, about_title, about_text,
      about_image_url, banner_image_url, logo_url, logo_white_url, primary_color, accent_color, font_family,
      button_style, button_hover_effect, button_text_color,
      show_store_button, show_booking_button, show_courts_button, store_button_text, booking_button_text, courts_button_text,
      show_whatsapp_button, whatsapp_button_text, header_layout, overlay_color, overlay_opacity,
      show_about_section, show_features_section, show_products_section,
      show_services_section, show_testimonials_section, show_contact_section,
      features_json, testimonials_json, contact_email, contact_phone, contact_address,
      instagram_url, facebook_url, tiktok_url, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16,
      $17, $18, $19, $20, $21, $22,
      $23, $24, $25, $26, $27,
      $28, $29, $30,
      $31, $32, $33,
      $34, $35, $36, $37, $38,
      $39, $40, $41, CURRENT_TIMESTAMP
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      website_enabled = EXCLUDED.website_enabled,
      headline = EXCLUDED.headline,
      subheadline = EXCLUDED.subheadline,
      about_title = EXCLUDED.about_title,
      about_text = EXCLUDED.about_text,
      about_image_url = EXCLUDED.about_image_url,
      banner_image_url = EXCLUDED.banner_image_url,
      logo_url = EXCLUDED.logo_url,
      logo_white_url = EXCLUDED.logo_white_url,
      primary_color = EXCLUDED.primary_color,
      accent_color = EXCLUDED.accent_color,
      font_family = EXCLUDED.font_family,
      button_style = EXCLUDED.button_style,
      button_hover_effect = EXCLUDED.button_hover_effect,
      button_text_color = EXCLUDED.button_text_color,
      show_store_button = EXCLUDED.show_store_button,
      show_booking_button = EXCLUDED.show_booking_button,
      show_courts_button = EXCLUDED.show_courts_button,
      store_button_text = EXCLUDED.store_button_text,
      booking_button_text = EXCLUDED.booking_button_text,
      courts_button_text = EXCLUDED.courts_button_text,
      show_whatsapp_button = EXCLUDED.show_whatsapp_button,
      whatsapp_button_text = EXCLUDED.whatsapp_button_text,
      header_layout = EXCLUDED.header_layout,
      overlay_color = EXCLUDED.overlay_color,
      overlay_opacity = EXCLUDED.overlay_opacity,
      show_about_section = EXCLUDED.show_about_section,
      show_features_section = EXCLUDED.show_features_section,
      show_products_section = EXCLUDED.show_products_section,
      show_services_section = EXCLUDED.show_services_section,
      show_testimonials_section = EXCLUDED.show_testimonials_section,
      show_contact_section = EXCLUDED.show_contact_section,
      features_json = EXCLUDED.features_json,
      testimonials_json = EXCLUDED.testimonials_json,
      contact_email = EXCLUDED.contact_email,
      contact_phone = EXCLUDED.contact_phone,
      contact_address = EXCLUDED.contact_address,
      instagram_url = EXCLUDED.instagram_url,
      facebook_url = EXCLUDED.facebook_url,
      tiktok_url = EXCLUDED.tiktok_url,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const values = [
    tenantId,
    data.websiteEnabled !== false,
    data.headline || "Bienvenido a nuestro sitio oficial",
    data.subheadline || "",
    data.aboutTitle || "Conoce Nuestra Historia",
    data.aboutText || "",
    data.aboutImageUrl || null,
    data.bannerImageUrl || null,
    data.logoUrl || null,
    data.logoWhiteUrl || null,
    data.primaryColor || "#2563eb",
    data.accentColor || "#f59e0b",
    data.fontFamily || "Inter",
    data.buttonStyle || "rounded",
    data.buttonHoverEffect !== false,
    data.buttonTextColor || "#ffffff",
    data.showStoreButton !== false,
    data.showBookingButton !== false,
    data.showCourtsButton === true,
    data.storeButtonText || "Ver Men\xFA y Productos",
    data.bookingButtonText || "Agendar Cita en L\xEDnea",
    data.courtsButtonText || "Reservar Cancha",
    data.showWhatsappButton !== false,
    data.whatsappButtonText || "WhatsApp Directo",
    data.headerLayout || "split",
    data.overlayColor || "#0f172a",
    data.overlayOpacity !== void 0 ? Number(data.overlayOpacity) : 0,
    data.showAboutSection !== false,
    data.showFeaturesSection !== false,
    data.showProductsSection !== false,
    data.showServicesSection !== false,
    data.showTestimonialsSection !== false,
    data.showContactSection !== false,
    JSON.stringify(data.featuresJson || []),
    JSON.stringify(data.testimonialsJson || []),
    data.contactEmail || null,
    data.contactPhone || null,
    data.contactAddress || null,
    data.instagramUrl || null,
    data.facebookUrl || null,
    data.tiktokUrl || null
  ];
  await query(sql, values);
  return getWebsiteSettingsByTenant(tenantId);
}

// src/server/routes/auth.routes.ts
init_pool();

// src/server/db/audit.repo.ts
init_pool();
async function logAuditEvent(tenantId, userId, action, entityType, entityId, details, ipAddress, userAgent) {
  try {
    await query(`
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenantId, userId, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ipAddress || null, userAgent || null]);
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
async function getAuditLogs(tenantId, filters = {}) {
  const conditions = [];
  const params = [];
  let paramIdx = 1;
  if (tenantId) {
    conditions.push(`a.tenant_id = $${paramIdx++}`);
    params.push(tenantId);
  }
  if (filters.action) {
    conditions.push(`a.action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.userId) {
    conditions.push(`a.user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.startDate) {
    conditions.push(`a.created_at >= $${paramIdx++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`a.created_at <= $${paramIdx++}`);
    params.push(filters.endDate);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = Math.min(Math.max(1, parseInt(String(filters.limit || 50), 10) || 50), 200);
  const offset = Math.max(0, parseInt(String(filters.offset || 0), 10) || 0);
  const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);
  const queryParams = [...params, limit, offset];
  const limitIdx = queryParams.length - 1;
  const offsetIdx = queryParams.length;
  const result = await query(`
    SELECT a.id, a.tenant_id as "tenantId", a.user_id as "userId",
           u.name as "userName", u.email as "userEmail",
           a.action, a.entity_type as "entityType", a.entity_id as "entityId",
           a.details, a.ip_address as "ipAddress", a.user_agent as "userAgent",
           a.created_at as "createdAt"
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `, queryParams);
  return { logs: result.rows, total };
}

// src/server/routes/auth.routes.ts
var router = Router();
var loginAttempts = /* @__PURE__ */ new Map();
function checkRateLimit(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt) return { blocked: false, remainingSeconds: 0 };
  if (attempt.blockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1e3);
    return { blocked: true, remainingSeconds };
  }
  if (now - attempt.firstAttempt > 10 * 60 * 1e3) {
    loginAttempts.delete(key);
  }
  return { blocked: false, remainingSeconds: 0 };
}
function recordFailedAttempt(key) {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.blockedUntil = now + 5 * 60 * 1e3;
  }
  loginAttempts.set(key, attempt);
}
function clearAttempts(key) {
  loginAttempts.delete(key);
}
router.get("/tenant-info/:slug", async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const store = await getStoreSettings(tenant.id);
    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      whatsappNumber: tenant.whatsappNumber || "",
      logoUrl: store?.storeLogoUrl || "",
      bannerUrl: store?.storeBannerUrl || "",
      theme: store?.storeTheme || { primaryColor: "#16a34a" }
    });
  } catch (error) {
    console.error("Error al obtener info de tenant:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});
router.post("/register", async (req, res) => {
  try {
    const { businessName, ownerName, email, password, phone, plan } = req.body;
    if (!businessName || !ownerName || !email || !password) {
      res.status(400).json({ error: "Por favor completa todos los campos requeridos." });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "La contrase\xF1a debe tener al menos 6 caracteres." });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await getUserByEmail(void 0, cleanEmail);
    if (existingUser) {
      res.status(400).json({ error: "Ya existe una cuenta con este correo electr\xF3nico." });
      return;
    }
    let baseSlug = businessName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "negocio";
    let generatedSlug = baseSlug;
    let counter = 1;
    while (await getTenantBySlug(generatedSlug)) {
      counter++;
      generatedSlug = `${baseSlug}-${counter}`;
    }
    const selectedPlan = plan === "enterprise" ? "enterprise" : "pro";
    const monthlyPrice = selectedPlan === "enterprise" ? 85e3 : 55e3;
    const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString();
    const tenant = await createTenant({
      name: businessName.trim(),
      slug: generatedSlug,
      plan: selectedPlan,
      aiModel: "gemini-2.5-flash",
      aiProvider: "gemini",
      whatsappNumber: phone ? phone.trim() : void 0,
      active: true,
      settingsJson: {
        customMonthlyPrice: monthlyPrice,
        billingCurrency: "CRC",
        subscriptionStatus: "trial",
        trialEndsAt
      }
    });
    try {
      await query(
        `UPDATE tenants SET custom_monthly_price = $1, billing_currency = 'CRC', subscription_status = 'trial', trial_ends_at = NOW() + INTERVAL '15 days' WHERE id = $2`,
        [monthlyPrice, tenant.id]
      );
    } catch (e) {
    }
    const user = await createUser({
      tenantId: tenant.id,
      name: ownerName.trim(),
      email: cleanEmail,
      password,
      role: "admin"
    });
    await saveAgentConfig(tenant.id, {
      systemPrompt: `Eres Betico, el Asistente Virtual Inteligente de ${businessName}. Atiende a los clientes con amabilidad, responde consultas y ayuda a agendar citas o tomar \xF3rdenes por WhatsApp.`,
      businessName: businessName.trim(),
      currency: "CRC",
      notifyNumber: phone ? phone.trim() : "",
      model: "gemini-2.5-flash",
      temperature: 0.7,
      autoReplyEnabled: true
    });
    await saveStoreSettings(tenant.id, {
      storeName: businessName.trim(),
      storeSlug: generatedSlug,
      currency: "CRC",
      storeEnabled: true,
      storeMode: "retail",
      storeModules: { storeEnabled: true, bookingsEnabled: true }
    });
    await saveWebsiteSettings(tenant.id, {
      websiteEnabled: true,
      headline: `Bienvenidos a ${businessName}`,
      subheadline: "Calidad, confianza y la mejor atenci\xF3n personalizada directo a tu WhatsApp.",
      aboutTitle: "Conoce Nuestra Historia",
      aboutText: `Somos ${businessName}, comprometidos con brindar el mejor servicio y productos de primera categor\xEDa. Nuestro compromiso es tu satisfacci\xF3n total.`,
      primaryColor: "#2563eb",
      accentColor: "#10b981",
      fontFamily: "Inter",
      headerLayout: "split",
      buttonStyle: "rounded",
      buttonHoverEffect: true,
      showWhatsappButton: true,
      showAboutSection: true,
      showFeaturesSection: true,
      showProductsSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showContactSection: true,
      contactEmail: cleanEmail,
      contactPhone: phone ? phone.trim() : "",
      featuresJson: [
        { title: "Atenci\xF3n 24/7 con IA", description: "Respuestas autom\xE1ticas e inmediatas a cualquier hora por WhatsApp." },
        { title: "Calidad Garantizada", description: "Cuidamos cada detalle para ofrecerte solo lo mejor." },
        { title: "Facilidad de Pago", description: "Aceptamos SINPE M\xF3vil verificado y transferencias bancarias." }
      ],
      testimonialsJson: [
        { name: "Cliente Satisfecho", role: "Cliente Frecuente", comment: "Excelente servicio y atenci\xF3n impecable. \xA1100% recomendados!" }
      ]
    });
    await logAuditEvent(tenant.id, user.id, "register_tenant", "auth", tenant.id, { businessName, email: cleanEmail, plan: selectedPlan }, req.ip, req.headers["user-agent"]);
    const token = generateToken(user.id, tenant.id, "admin");
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: "admin",
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: selectedPlan,
        trialEndsAt
      },
      redirect: "/app?tour=true"
    });
  } catch (error) {
    console.error("Error en auto-registro:", error);
    res.status(500).json({ error: error.message || "Error al procesar el registro." });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const ipKey = req.ip || req.headers["x-forwarded-for"] || "unknown_ip";
    const rateLimitKey = `${ipKey}_${(email || "").toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.blocked) {
      await logAuditEvent(null, null, "login_blocked_rate_limit", "security", void 0, { email, ip: ipKey, remainingSeconds: rateCheck.remainingSeconds }, req.ip, req.headers["user-agent"]);
      res.status(429).json({
        error: `Demasiados intentos fallidos. Por seguridad, tu acceso est\xE1 bloqueado temporalmente por ${rateCheck.remainingSeconds} segundos.`
      });
      return;
    }
    if (!email || !password) {
      res.status(400).json({ error: "Email y contrase\xF1a son obligatorios" });
      return;
    }
    let user = null;
    if (tenantSlug) {
      const targetTenant = await getTenantBySlug(tenantSlug.toLowerCase().trim());
      if (targetTenant) {
        user = await getUserByEmail(targetTenant.id, email);
      }
    }
    if (!user) {
      user = await getUserByEmail(null, email);
    }
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      await logAuditEvent(null, null, "login_failed", "user", void 0, { email, reason: "user_not_found" }, req.ip, req.headers["user-agent"]);
      res.status(401).json({ error: "Correo o contrase\xF1a incorrectos" });
      return;
    }
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      await logAuditEvent(user.tenantId, user.id, "login_failed", "user", user.id, { email, reason: "wrong_password" }, req.ip, req.headers["user-agent"]);
      res.status(401).json({ error: "Correo o contrase\xF1a incorrectos" });
      return;
    }
    if (!user.active) {
      res.status(403).json({ error: "Tu cuenta ha sido desactivada. Por favor contacta al administrador." });
      return;
    }
    if (tenantSlug) {
      const targetTenant = await getTenantBySlug(tenantSlug.toLowerCase().trim());
      if (targetTenant && user.role !== "superadmin" && user.tenantId !== targetTenant.id) {
        res.status(403).json({
          error: `Esta cuenta no tiene permisos para acceder a ${targetTenant.name}. Por favor verifica tus credenciales.`
        });
        return;
      }
    }
    clearAttempts(rateLimitKey);
    const token = generateToken(user.id, user.tenantId, user.role);
    const tenant = user.tenantId ? await getTenantById(user.tenantId) : null;
    await logAuditEvent(user.tenantId, user.id, "login", "user", user.id, { email, role: user.role }, req.ip, req.headers["user-agent"]);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name || "Mi Negocio",
        tenantSlug: tenant?.slug || ""
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error del servidor al procesar el ingreso" });
  }
});
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user?.userId);
    const tenant = await getTenantById(req.user?.tenantId);
    const activeTenantId = req.user?.tenantId || user?.tenantId;
    const activeRole = req.user?.role || user?.role || "admin";
    res.json({
      id: user?.id || req.user?.userId,
      email: user?.email || "admin@betico.cr",
      name: user?.name || "Super Admin",
      role: activeRole,
      tenantId: activeTenantId,
      tenantName: tenant?.name || "Mi Negocio",
      tenantSlug: tenant?.slug || ""
    });
  } catch (err) {
    console.error("Error fetching user profile in /me:", err);
    res.status(500).json({ error: "Error al obtener perfil de usuario" });
  }
});
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== "string") {
      res.status(400).json({ error: "Ingresa tu correo o n\xFAmero de tel\xE9fono registrado" });
      return;
    }
    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, "");
    const userRes = await (await Promise.resolve().then(() => (init_pool(), pool_exports))).query(`
      SELECT u.id, u.email, u.name, u.tenant_id as "tenantId", 
             t.name as "tenantName", t.whatsapp_number as "whatsappNumber", t.evolution_instance as "evolutionInstance"
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE LOWER(u.email) = LOWER($1) 
         OR (t.whatsapp_number IS NOT NULL AND ($2 != '' AND t.whatsapp_number LIKE '%' || $2 || '%'))
      LIMIT 1
    `, [cleanInput, cleanPhone]);
    if (userRes.rows.length === 0) {
      res.json({
        success: true,
        message: "Si el correo o tel\xE9fono est\xE1 registrado, recibir\xE1s un c\xF3digo de 6 d\xEDgitos por WhatsApp en breve."
      });
      return;
    }
    const user = userRes.rows[0];
    const targetPhone = (user.whatsappNumber || cleanPhone || "").replace(/\D/g, "");
    if (!targetPhone || targetPhone.length < 8) {
      res.status(400).json({ error: "Tu cuenta no tiene un n\xFAmero de WhatsApp vinculado para recibir el c\xF3digo. Por favor contacta a soporte." });
      return;
    }
    const crypto5 = await import("crypto");
    const otpCode = crypto5.randomInt(1e5, 999999).toString();
    const tokenHash = crypto5.createHash("sha256").update(otpCode + user.id).digest("hex");
    await (await Promise.resolve().then(() => (init_pool(), pool_exports))).query(`
      UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false
    `, [user.id]);
    await (await Promise.resolve().then(() => (init_pool(), pool_exports))).query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, otp_code, phone, expires_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '15 minutes')
    `, [user.id, tokenHash, otpCode, targetPhone]);
    const { sendMessage: sendMessage2 } = await Promise.resolve().then(() => (init_evolution(), evolution_exports));
    const instanceToUse = user.evolutionInstance || "betico_soporte";
    const waText = `\u{1F512} *[Seguridad Betico]* Hola *${user.name}*, recibimos una solicitud para restablecer la contrase\xF1a de tu cuenta en *${user.tenantName || "Betico"}*.

Tu c\xF3digo de verificaci\xF3n es:
\u{1F449} *${otpCode}*

\u23F3 Este c\xF3digo vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje con seguridad.`;
    try {
      await sendMessage2(instanceToUse, targetPhone, waText);
    } catch (waErr) {
      console.error("Error sending reset OTP via WhatsApp:", waErr);
    }
    const maskedPhone = "****" + targetPhone.slice(-4);
    res.json({
      success: true,
      maskedPhone,
      message: `C\xF3digo enviado al WhatsApp terminado en ${maskedPhone}. Ingresa el c\xF3digo de 6 d\xEDgitos para continuar.`
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({ error: "Error del servidor al procesar la solicitud" });
  }
});
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { identifier, otpCode } = req.body;
    if (!identifier || !otpCode) {
      res.status(400).json({ error: "Identificador y c\xF3digo de 6 d\xEDgitos requeridos" });
      return;
    }
    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, "");
    const cleanOtp = (otpCode || "").toString().trim();
    const result = await (await Promise.resolve().then(() => (init_pool(), pool_exports))).query(`
      SELECT prt.id, prt.user_id, prt.expires_at, prt.used
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE prt.otp_code = $1 
        AND prt.used = false 
        AND prt.expires_at > CURRENT_TIMESTAMP
        AND (LOWER(u.email) = LOWER($2) OR ($3 != '' AND t.whatsapp_number LIKE '%' || $3 || '%'))
      ORDER BY prt.created_at DESC
      LIMIT 1
    `, [cleanOtp, cleanInput, cleanPhone]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: "El c\xF3digo ingresado es inv\xE1lido o ha expirado. Solicita un nuevo c\xF3digo." });
      return;
    }
    res.json({ success: true, verified: true });
  } catch (error) {
    console.error("Error verifying reset OTP:", error);
    res.status(500).json({ error: "Error al verificar el c\xF3digo" });
  }
});
router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, otpCode, newPassword } = req.body;
    if (!identifier || !otpCode || !newPassword) {
      res.status(400).json({ error: "Todos los campos son obligatorios" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "La nueva contrase\xF1a debe tener al menos 6 caracteres" });
      return;
    }
    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, "");
    const cleanOtp = (otpCode || "").toString().trim();
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    const { hashPassword: hashPassword2 } = await Promise.resolve().then(() => (init_users_repo(), users_repo_exports));
    const result = await query2(`
      SELECT prt.id as "tokenId", u.id as "userId", u.name, u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE prt.otp_code = $1 
        AND prt.used = false 
        AND prt.expires_at > CURRENT_TIMESTAMP
        AND (LOWER(u.email) = LOWER($2) OR ($3 != '' AND t.whatsapp_number LIKE '%' || $3 || '%'))
      ORDER BY prt.created_at DESC
      LIMIT 1
    `, [cleanOtp, cleanInput, cleanPhone]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: "C\xF3digo inv\xE1lido o expirado. Por favor inicia el proceso nuevamente." });
      return;
    }
    const { tokenId, userId } = result.rows[0];
    const newHash = hashPassword2(newPassword);
    await query2(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [newHash, userId]);
    await query2(`
      UPDATE password_reset_tokens SET used = true WHERE id = $1
    `, [tokenId]);
    res.json({ success: true, message: "\xA1Tu contrase\xF1a ha sido restablecida exitosamente! Ya puedes iniciar sesi\xF3n." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Error del servidor al restablecer contrase\xF1a" });
  }
});
var auth_routes_default = router;

// src/server/routes/tenant.routes.ts
import { Router as Router2 } from "express";
init_users_repo();
var router2 = Router2();
router2.use(authenticateToken);
router2.use(requireSuperAdmin);
router2.get("/", async (req, res) => {
  try {
    const tenants = await getAllTenants();
    const enriched = await Promise.all(tenants.map(async (t) => {
      const admin = await getAdminUserByTenant(t.id);
      return {
        ...t,
        adminEmail: admin?.email || "Sin registrar",
        adminId: admin?.id || null
      };
    }));
    res.json(enriched);
  } catch (error) {
    console.error("Error al obtener inquilinos:", error);
    res.status(500).json({ error: "Error al obtener inquilinos" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const admin = await getAdminUserByTenant(tenant.id);
    res.json({ ...tenant, adminEmail: admin?.email || null });
  } catch (error) {
    console.error("Error al obtener inquilino:", error);
    res.status(500).json({ error: "Error al obtener inquilino" });
  }
});
router2.post("/", async (req, res) => {
  try {
    const {
      name,
      slug,
      plan,
      email,
      adminEmail,
      phone,
      whatsappNumber,
      contactName,
      customMonthlyPrice,
      billingCurrency,
      isTrial,
      trialDays
    } = req.body;
    if (!name) {
      res.status(400).json({ error: "El nombre del negocio es requerido" });
      return;
    }
    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")).toLowerCase().trim();
    const finalEmail = (email || adminEmail || "").toLowerCase().trim();
    const finalPhone = (phone || whatsappNumber || "").trim();
    const finalPlan = plan || "pro";
    let defaultPrice = 55e3;
    if (finalPlan === "enterprise") defaultPrice = 85e3;
    else if (finalPlan === "aliado") defaultPrice = 0;
    else if (finalPlan === "emprendedor") defaultPrice = 35e3;
    else if (finalPlan === "pro") defaultPrice = 55e3;
    const finalPrice = customMonthlyPrice !== void 0 && customMonthlyPrice !== "" ? Number(customMonthlyPrice) : defaultPrice;
    const tempPassword = "admin" + Math.floor(1e3 + Math.random() * 9e3);
    const tenant = await createTenant({
      name: name.trim(),
      slug: cleanSlug,
      plan: finalPlan,
      whatsappNumber: finalPhone || void 0,
      customMonthlyPrice: finalPrice,
      billingCurrency: billingCurrency || "CRC",
      subscriptionStatus: isTrial ? "trial" : "active",
      trialEndsAt: isTrial ? new Date(Date.now() + (Number(trialDays) || 15) * 864e5) : null,
      aiModel: "gemini-2.5-flash",
      aiProvider: "gemini",
      active: true
    });
    if (finalEmail) {
      await createUser({
        tenantId: tenant.id,
        name: contactName ? contactName.trim() : `${name} Admin`,
        email: finalEmail,
        password: tempPassword,
        role: "admin"
      });
    }
    await saveAgentConfig(tenant.id, {
      systemPrompt: `Eres Betico, el Asistente Virtual Inteligente de ${name}. Atiende a los clientes con amabilidad, responde consultas y ayuda a agendar citas o tomar \xF3rdenes por WhatsApp.`,
      businessName: name,
      currency: billingCurrency || "CRC",
      notifyNumber: finalPhone || "",
      model: "gemini-2.5-flash",
      temperature: 0.7,
      autoReplyEnabled: false
    });
    await saveStoreSettings(tenant.id, {
      storeName: name,
      storeSlug: cleanSlug,
      currency: billingCurrency || "CRC",
      storeEnabled: true,
      storeMode: "retail",
      storeModules: { storeEnabled: true, bookingsEnabled: true }
    });
    await logAuditEvent(tenant.id, req.user.userId, "create_tenant", "tenant", tenant.id, { name, slug: cleanSlug, plan: finalPlan, email: finalEmail, phone: finalPhone, customMonthlyPrice: finalPrice }, req.ip, req.headers["user-agent"]);
    res.status(201).json({
      ...tenant,
      adminEmail: finalEmail || null,
      tempPassword
    });
  } catch (error) {
    console.error("Error al crear inquilino:", error);
    res.status(500).json({ error: "Error al crear inquilino" });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const tenantUpdateData = {};
    if (body.name !== void 0) tenantUpdateData.name = body.name;
    if (body.slug !== void 0) tenantUpdateData.slug = body.slug.toLowerCase().trim();
    if (body.plan !== void 0) tenantUpdateData.plan = body.plan;
    if (body.customMonthlyPrice !== void 0) tenantUpdateData.customMonthlyPrice = Number(body.customMonthlyPrice) || 0;
    if (body.billingCurrency !== void 0) tenantUpdateData.billingCurrency = body.billingCurrency;
    if (body.phone !== void 0 || body.whatsappNumber !== void 0) {
      tenantUpdateData.whatsappNumber = body.phone || body.whatsappNumber;
    }
    if (body.active !== void 0) tenantUpdateData.active = Boolean(body.active);
    if (body.isTrial !== void 0) {
      if (body.isTrial) {
        tenantUpdateData.subscriptionStatus = "trial";
        const days = Number(body.trialDays) || 15;
        tenantUpdateData.trialEndsAt = new Date(Date.now() + days * 864e5);
      } else {
        tenantUpdateData.subscriptionStatus = "active";
      }
    }
    if (body.subscriptionStatus !== void 0) {
      tenantUpdateData.subscriptionStatus = body.subscriptionStatus;
    }
    const updated = await updateTenant(id, tenantUpdateData);
    if (!updated) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    if (body.email || body.contactName) {
      try {
        let adminUser = await getAdminUserByTenant(id);
        if (adminUser) {
          await updateUser(adminUser.id, id, {
            email: body.email ? body.email.toLowerCase().trim() : adminUser.email,
            name: body.contactName ? body.contactName.trim() : adminUser.name
          });
        } else if (body.email) {
          await createUser({
            tenantId: id,
            name: body.contactName ? body.contactName.trim() : `${body.name || "Admin"}`,
            email: body.email.toLowerCase().trim(),
            role: "admin",
            password: "password123"
          });
        }
      } catch (userErr) {
        console.warn("Error updating admin user email/name:", userErr);
      }
    }
    await logAuditEvent(id, req.user.userId, "update_tenant", "tenant", id, body, req.ip, req.headers["user-agent"]);
    const freshAdmin = await getAdminUserByTenant(id);
    res.json({
      ...updated,
      adminEmail: freshAdmin?.email || body.email || null,
      adminId: freshAdmin?.id || null
    });
  } catch (error) {
    console.error("Error al actualizar inquilino:", error);
    res.status(500).json({ error: "Error al actualizar inquilino" });
  }
});
router2.post("/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "La nueva contrase\xF1a debe tener al menos 6 caracteres" });
      return;
    }
    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const success = await resetTenantAdminPassword(tenant.id, newPassword);
    if (!success) {
      const adminEmail = `admin@${tenant.slug}.cr`;
      await createUser({
        tenantId: tenant.id,
        name: `${tenant.name} Admin`,
        email: adminEmail,
        password: newPassword,
        role: "admin"
      });
    }
    await logAuditEvent(tenant.id, req.user.userId, "reset_admin_password", "user", tenant.id, { tenantName: tenant.name }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, message: `Contrase\xF1a de administrador actualizada con \xE9xito para ${tenant.name}` });
  } catch (error) {
    console.error("Error al resetear contrase\xF1a de inquilino:", error);
    res.status(500).json({ error: "Error al actualizar la contrase\xF1a" });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    await logAuditEvent(req.user.tenantId, req.user.userId, "delete_tenant", "tenant", req.params.id, {}, req.ip, req.headers["user-agent"]);
    await deleteTenant(req.params.id);
    res.json({ success: true, message: "Inquilino eliminado" });
  } catch (error) {
    console.error("Error al eliminar inquilino:", error);
    res.status(500).json({ error: "Error al eliminar inquilino" });
  }
});
router2.post("/:id/impersonate", async (req, res) => {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const impersonationToken = generateToken(req.user.userId, tenant.id, "admin");
    await logAuditEvent(req.user.tenantId, req.user.userId, "impersonate", "tenant", tenant.id, { tenantName: tenant.name }, req.ip, req.headers["user-agent"]);
    res.json({
      token: impersonationToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan
      }
    });
  } catch (error) {
    console.error("Error al impersonar inquilino:", error);
    res.status(500).json({ error: "Error al impersonar inquilino" });
  }
});
router2.get("/:id/dossier", async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const adminUser = await getAdminUserByTenant(id);
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    const now = /* @__PURE__ */ new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [ordersRes, apptsRes, chatsRes, aiRes, paymentsRes, storeSettingsRes] = await Promise.all([
      query2("SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1", [id]),
      query2("SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1", [id]),
      query2("SELECT COUNT(*) as count FROM chat_messages WHERE tenant_id = $1", [id]),
      query2('SELECT tokens_used as "tokensUsed", requests_count as "requestsCount" FROM tenant_ai_usage WHERE tenant_id = $1 AND month_year = $2', [id, currentMonth]),
      query2('SELECT id, amount, currency, payment_method as "paymentMethod", reference, proof_url as "proofUrl", notes, status, created_at as "createdAt" FROM tenant_payments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [id]),
      query2("SELECT store_modules FROM store_settings WHERE tenant_id = $1", [id])
    ]);
    const ordersCount = parseInt(ordersRes.rows[0]?.count || "0", 10);
    const appointmentsCount = parseInt(apptsRes.rows[0]?.count || "0", 10);
    const chatsCount = parseInt(chatsRes.rows[0]?.count || "0", 10);
    const aiUsage = aiRes.rows[0] || { tokensUsed: 0, requestsCount: 0 };
    const payments = paymentsRes.rows || [];
    const storeModules = storeSettingsRes.rows[0]?.store_modules || { storeEnabled: true, bookingsEnabled: true };
    res.json({
      tenant: {
        ...tenant,
        adminEmail: adminUser?.email || null,
        adminName: adminUser?.name || null,
        adminPhone: tenant.whatsappNumber || null
      },
      storeModules,
      metrics: {
        ordersCount,
        appointmentsCount,
        chatsCount,
        aiTokensUsed: parseInt(aiUsage.tokensUsed || "0", 10),
        aiRequestsCount: parseInt(aiUsage.requestsCount || "0", 10)
      },
      payments,
      internalNotes: tenant.internalNotes || tenant.settingsJson?.internalNotes || ""
    });
  } catch (error) {
    console.error("Error fetching dossier:", error);
    res.status(500).json({ error: "Error al obtener expediente del cliente" });
  }
});
router2.post("/:id/record-payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, paymentMethod, reference, proofUrl, notes, extendDays } = req.body;
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    const tenant = await getTenantById(id);
    if (!tenant) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const payAmount = Number(amount) || Number(tenant.customMonthlyPrice) || 55e3;
    const payCurrency = currency || tenant.billingCurrency || "CRC";
    const daysToExtend = Number(extendDays) || 30;
    await query2(
      `INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, proof_url, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')`,
      [id, payAmount, payCurrency, paymentMethod || "sinpe", reference || "", proofUrl || null, notes || ""]
    );
    await query2(
      `UPDATE tenants SET 
         subscription_status = 'active',
         next_billing_date = COALESCE(GREATEST(next_billing_date, NOW()), NOW()) + ($1 || ' days')::INTERVAL,
         last_payment_proof = $2,
         last_payment_ref = $3,
         last_payment_amount = $4,
         payment_notes = $5
       WHERE id = $6`,
      [daysToExtend, proofUrl || null, reference || null, payAmount, notes || null, id]
    );
    await logAuditEvent(id, req.user.userId, "record_payment", "financial", id, { amount: payAmount, reference, daysToExtend }, req.ip, req.headers["user-agent"]);
    const updated = await getTenantById(id);
    res.json({ success: true, message: "Pago registrado con \xE9xito y suscripci\xF3n extendida", tenant: updated });
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ error: "Error al registrar pago" });
  }
});
router2.put("/:id/next-billing-date", async (req, res) => {
  try {
    const { id } = req.params;
    const { nextBillingDate } = req.body;
    if (!nextBillingDate) {
      res.status(400).json({ error: "Fecha requerida" });
      return;
    }
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    await query2("UPDATE tenants SET next_billing_date = $1 WHERE id = $2", [new Date(nextBillingDate), id]);
    await logAuditEvent(id, req.user.userId, "update_billing_date", "tenant", id, { nextBillingDate }, req.ip, req.headers["user-agent"]);
    res.json({ success: true, nextBillingDate });
  } catch (error) {
    console.error("Error updating billing date:", error);
    res.status(500).json({ error: "Error al actualizar fecha de cobro" });
  }
});
router2.put("/:id/internal-notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    await query2("UPDATE tenants SET internal_notes = $1 WHERE id = $2", [notes || "", id]);
    res.json({ success: true, notes });
  } catch (error) {
    console.error("Error saving notes:", error);
    res.status(500).json({ error: "Error al guardar anotaciones" });
  }
});
router2.get("/billing/collections", async (req, res) => {
  try {
    const tenants = await getAllTenants();
    const { query: query2 } = await Promise.resolve().then(() => (init_pool(), pool_exports));
    const now = /* @__PURE__ */ new Date();
    const in3Days = new Date(Date.now() + 3 * 864e5);
    const in7Days = new Date(Date.now() + 7 * 864e5);
    let totalDueCRC = 0;
    let totalCollectedCRC = 0;
    let countPaid = 0;
    let countDueSoon = 0;
    let countGrace = 0;
    let countOverdue = 0;
    const list = await Promise.all(tenants.map(async (t) => {
      const admin = await getAdminUserByTenant(t.id);
      const nextDate = t.nextBillingDate ? new Date(t.nextBillingDate) : t.trialEndsAt ? new Date(t.trialEndsAt) : new Date(Date.now() + 15 * 864e5);
      const price = Number(t.customMonthlyPrice) || (t.plan === "enterprise" ? 85e3 : t.plan === "aliado" ? 0 : t.plan === "emprendedor" ? 35e3 : 55e3);
      const diffMs = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1e3 * 60 * 60 * 24));
      let trafficLight = "paid";
      let trafficLabel = "Al D\xEDa";
      let trafficColor = "#10b981";
      if (t.subscriptionStatus === "suspended") {
        trafficLight = "overdue";
        trafficLabel = "Suspendido";
        trafficColor = "#ef4444";
        countOverdue++;
      } else if (diffDays < -5) {
        trafficLight = "overdue";
        trafficLabel = "En Mora";
        trafficColor = "#ef4444";
        countOverdue++;
      } else if (diffDays < 0) {
        trafficLight = "grace";
        trafficLabel = "En Gracia";
        trafficColor = "#f97316";
        countGrace++;
      } else if (diffDays <= 3) {
        trafficLight = "due_soon";
        trafficLabel = "Cobro Pr\xF3ximo";
        trafficColor = "#eab308";
        countDueSoon++;
      } else {
        trafficLight = "paid";
        trafficLabel = "Al D\xEDa";
        trafficColor = "#10b981";
        countPaid++;
      }
      totalDueCRC += price;
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        adminEmail: admin?.email || "Sin registrar",
        phone: t.whatsappNumber || "",
        monthlyPrice: price,
        currency: t.billingCurrency || "CRC",
        nextBillingDate: nextDate.toISOString(),
        diffDays,
        trafficLight,
        trafficLabel,
        trafficColor,
        subscriptionStatus: t.subscriptionStatus || "active",
        internalNotes: t.internalNotes || ""
      };
    }));
    res.json({
      summary: {
        totalDueCRC,
        countPaid,
        countDueSoon,
        countGrace,
        countOverdue,
        totalTenants: tenants.length
      },
      collections: list
    });
  } catch (error) {
    console.error("Error getting collections:", error);
    res.status(500).json({ error: "Error al obtener cartera de cobros" });
  }
});
var tenant_routes_default = router2;

// src/server/routes/users.routes.ts
import { Router as Router3 } from "express";

// src/server/middleware/tenantContext.ts
function tenantContext(req, res, next) {
  if (req.user && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
  }
  next();
}

// src/server/routes/users.routes.ts
init_users_repo();
var router3 = Router3();
router3.use(authenticateToken);
router3.use(tenantContext);
router3.get("/", async (req, res) => {
  try {
    const users = await getUsersByTenant(req.tenantId);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});
router3.post("/", requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Nombre, email y contrase\xF1a son requeridos" });
      return;
    }
    if (role === "superadmin" && req.user?.role !== "superadmin") {
      res.status(403).json({ error: "No tienes permisos para crear usuarios con rol superadmin" });
      return;
    }
    const user = await createUser({
      tenantId: req.tenantId,
      name,
      email,
      password,
      role: role || "staff"
    });
    res.status(201).json(user);
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Ya existe un usuario con ese email" });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});
router3.put("/:id", requireRole("superadmin", "admin"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.role === "superadmin" && req.user?.role !== "superadmin") {
      res.status(403).json({ error: "No tienes permisos para asignar el rol superadmin" });
      return;
    }
    const updated = await updateUser(req.params.id, req.tenantId, updateData);
    if (!updated) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});
router3.delete("/:id", requireRole("superadmin", "admin"), async (req, res) => {
  try {
    if (req.params.id === req.user.userId) {
      res.status(400).json({ error: "No puedes eliminar tu propio usuario" });
      return;
    }
    const deleted = await deleteUser(req.params.id, req.tenantId);
    if (!deleted) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
var users_routes_default = router3;

// src/server/routes/services.routes.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.use(authenticateToken);
router4.use(tenantContext);
router4.get("/", async (req, res) => {
  try {
    const services = await getServicesByTenant(req.tenantId);
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener servicios" });
  }
});
router4.post("/", async (req, res) => {
  try {
    const service = await createService(req.tenantId, req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear servicio" });
  }
});
router4.put("/:id", async (req, res) => {
  try {
    const updated = await updateService(req.params.id, req.tenantId, req.body);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar servicio" });
  }
});
router4.delete("/:id", async (req, res) => {
  try {
    await deleteService(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar servicio" });
  }
});
var services_routes_default = router4;

// src/server/routes/appointments.routes.ts
import { Router as Router5 } from "express";
init_evolution();
init_pool();
var router5 = Router5();
router5.get("/public/:slug/info", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const services = await getServicesByTenant(tenant.id);
    const store = await getStoreSettings(tenant.id);
    const schedule = await getScheduleSettings(tenant.id);
    res.json({
      name: tenant.name,
      slug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone,
      logoUrl: store?.storeLogoUrl,
      bannerUrl: store?.storeBannerUrl,
      theme: store?.storeTheme,
      services: services.filter((s) => s.active !== false),
      scheduleMode: schedule?.scheduleMode || "jornada",
      customFields: schedule?.customFields || [],
      vacationConfig: schedule?.vacationConfig
    });
  } catch (error) {
    console.error("Error fetching public booking info:", error);
    res.status(500).json({ error: "Error al obtener informaci\xF3n" });
  }
});
router5.get("/public/:slug/available-slots", async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    if (!date) {
      res.status(400).json({ error: "Fecha requerida (YYYY-MM-DD)" });
      return;
    }
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    const schedule = await getScheduleSettings(tenant.id);
    const dateStr = String(date);
    const nowCR = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/Costa_Rica" }));
    const todayCR = `${nowCR.getFullYear()}-${String(nowCR.getMonth() + 1).padStart(2, "0")}-${String(nowCR.getDate()).padStart(2, "0")}`;
    const currentMinutesNow = nowCR.getHours() * 60 + nowCR.getMinutes();
    if (dateStr < todayCR) {
      res.json({
        date: dateStr,
        availableSlots: [],
        maxParallelSlots: 0,
        totalAvailable: 0,
        message: "No es posible reservar en fechas pasadas"
      });
      return;
    }
    if (schedule?.vacationConfig?.enabled) {
      const v = schedule.vacationConfig;
      if (v.startDate && v.endDate && dateStr >= v.startDate && dateStr <= v.endDate) {
        res.json({
          availableSlots: [],
          isVacation: true,
          vacationMessage: v.message || "Estaremos cerrados temporalmente por vacaciones."
        });
        return;
      }
    }
    const selectedDate = /* @__PURE__ */ new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    let candidateSlots = [];
    if (schedule?.scheduleMode === "jornada" || !schedule) {
      const j = schedule?.jornadaConfig || {
        startHour: "08:00",
        endHour: "17:00",
        slotMinutes: 45,
        hasBreak: true,
        breakStart: "12:00",
        breakEnd: "13:00",
        daysEnabled: [1, 2, 3, 4, 5, 6]
      };
      if (!j.daysEnabled.includes(dayOfWeek)) {
        res.json({ availableSlots: [], message: "Cerrado este d\xEDa" });
        return;
      }
      const [startH, startM] = j.startHour.split(":").map(Number);
      const [endH, endM] = j.endHour.split(":").map(Number);
      const dayBreak = j.perDayBreaks?.[dayOfWeek];
      const hasBreakThisDay = dayBreak !== void 0 ? dayBreak.hasBreak : j.hasBreak !== false;
      const breakStartStr = dayBreak?.breakStart || j.breakStart || "12:00";
      const breakEndStr = dayBreak?.breakEnd || j.breakEnd || "13:00";
      const [breakStartH, breakStartM] = breakStartStr.split(":").map(Number);
      const [breakEndH, breakEndM] = breakEndStr.split(":").map(Number);
      const slotStep = j.slotMinutes || 45;
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const breakStartMinutes = breakStartH * 60 + breakStartM;
      const breakEndMinutes = breakEndH * 60 + breakEndM;
      while (currentMinutes + slotStep <= endMinutes) {
        if (hasBreakThisDay && currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
          currentMinutes += slotStep;
          continue;
        }
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        candidateSlots.push(timeStr);
        currentMinutes += slotStep;
      }
    } else if (schedule?.scheduleMode === "fechas") {
      const f = schedule.fechasConfig || { enabledDates: [], slotsByDate: {} };
      if (!f.enabledDates.includes(dateStr)) {
        res.json({ availableSlots: [], message: "No hay citas habilitadas para esta fecha" });
        return;
      }
      candidateSlots = f.slotsByDate?.[dateStr] || ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    } else if (schedule?.scheduleMode === "bloques") {
      const b = schedule.bloquesConfig || { days: {}, slotMinutes: 45 };
      const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const dayKey = dayKeys[selectedDate.getDay()];
      const blocks = b.days?.[dayKey] || [];
      const slotStep = b.slotMinutes || 45;
      for (const block of blocks) {
        const [bStartH, bStartM] = block.start.split(":").map(Number);
        const [bEndH, bEndM] = block.end.split(":").map(Number);
        let curr = bStartH * 60 + bStartM;
        const end = bEndH * 60 + bEndM;
        while (curr + slotStep <= end) {
          const h = Math.floor(curr / 60);
          const m = curr % 60;
          candidateSlots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
          curr += slotStep;
        }
      }
    }
    let maxParallelSlots = schedule?.globalParallelSlots || 1;
    if (serviceId) {
      const srvRes = await query(`SELECT parallel_slots as "parallelSlots" FROM services WHERE id = $1 AND tenant_id = $2`, [serviceId, tenant.id]);
      if (srvRes.rows[0]?.parallelSlots) {
        maxParallelSlots = srvRes.rows[0].parallelSlots;
      }
    }
    const activeAppts = await query(`
      SELECT time FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND status IN ('pending', 'scheduled', 'confirmed')
    `, [tenant.id, dateStr]);
    const timeCountMap = {};
    for (const row of activeAppts.rows) {
      timeCountMap[row.time] = (timeCountMap[row.time] || 0) + 1;
    }
    const isToday = dateStr === todayCR;
    const availableSlots = candidateSlots.filter((t) => {
      if (isToday) {
        const [sh, sm] = t.split(":").map(Number);
        if (sh * 60 + sm <= currentMinutesNow) {
          return false;
        }
      }
      return (timeCountMap[t] || 0) < maxParallelSlots;
    });
    res.json({
      date: dateStr,
      availableSlots,
      maxParallelSlots,
      totalAvailable: availableSlots.length
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ error: "Error al calcular disponibilidad" });
  }
});
router5.post("/public/:slug/book", async (req, res) => {
  try {
    const { serviceName, serviceId, date, time, customerName, customerPhone, details, vehicleModel, customAnswers } = req.body;
    if (!serviceName || !date || !time || !customerName || !customerPhone) {
      res.status(400).json({ error: "Servicio, fecha, hora, nombre y WhatsApp son requeridos" });
      return;
    }
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Negocio no encontrado" });
      return;
    }
    let amount = 0;
    const services = await getServicesByTenant(tenant.id);
    const matchedService = services.find((s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase());
    if (matchedService) {
      amount = Number(matchedService.price || 0);
    }
    let combinedDetails = details || "";
    if (customAnswers && typeof customAnswers === "object") {
      const answersList = Object.entries(customAnswers).filter(([_, val]) => val && String(val).trim().length > 0).map(([key, val]) => `${key}: ${val}`).join(" | ");
      if (answersList) {
        combinedDetails = combinedDetails ? `${combinedDetails} | ${answersList}` : answersList;
      }
    }
    const finalAmount = req.body.amount !== void 0 ? Number(req.body.amount) : amount;
    const appt = await createAppointment(tenant.id, {
      name: customerName,
      whatsapp: customerPhone,
      service: serviceName,
      date,
      time,
      amount: finalAmount,
      status: "scheduled",
      details: combinedDetails,
      vehicleModel: vehicleModel || "",
      selectedVariables: req.body.selectedVariables
    });
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("appointment:created", appt);
    }
    const cleanCustomerPhone = customerPhone.replace(/\D/g, "");
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const confirmMsg = `\u{1F4C5} *\xA1Cita Programada con \xC9xito!*

Hola *${customerName}*, tu cita para *${serviceName}* ha quedado programada en *${tenant.name}*.

\u{1F5D3}\uFE0F *Fecha:* ${date}
\u23F0 *Hora:* ${time}
\u{1F4B0} *Valor:* \u20A1${amount.toLocaleString("es-CR")}
\u{1F4CC} *Estado:* \u{1F552} Programada
${vehicleModel ? `\u{1F697} *Veh\xEDculo / Detalle:* ${vehicleModel}
` : ""}${combinedDetails ? `\u{1F4DD} *Informaci\xF3n:* ${combinedDetails}
` : ""}
\u{1F449} _Te enviaremos la confirmaci\xF3n oficial antes de tu cita. Si necesitas cancelar o reprogramar, solo responde a este mensaje._ \xA1Te esperamos!`;
      try {
        await sendMessage(tenant.evolutionInstance, cleanCustomerPhone, confirmMsg);
      } catch (err) {
        console.error("Error sending booking confirmation to customer:", err);
      }
    }
    if (tenant.evolutionInstance && tenant.whatsappNumber) {
      const adminPhone = tenant.whatsappNumber.replace(/\D/g, "");
      const adminMsg = `\u{1F514} *\xA1NUEVA CITA AGENDADA EN L\xCDNEA!*

\u{1F464} *Cliente:* ${customerName} (${customerPhone})
\u{1F6E0}\uFE0F *Servicio:* ${serviceName}
\u{1F5D3}\uFE0F *Fecha:* ${date} a las ${time}
\u{1F4B0} *Monto:* \u20A1${amount.toLocaleString("es-CR")}
${combinedDetails ? `\u{1F4DD} *Detalles:* ${combinedDetails}` : ""}`;
      try {
        await sendMessage(tenant.evolutionInstance, adminPhone, adminMsg);
      } catch (err) {
        console.error("Error sending booking alert to admin:", err);
      }
    }
    await query(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'online_booking_created', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenant.id,
      cleanCustomerPhone,
      `Cita online para ${customerName} agendada para ${date} ${time}`
    ]);
    res.status(201).json({
      ...appt,
      businessName: tenant.name,
      whatsappNumber: tenant.whatsappNumber
    });
  } catch (error) {
    console.error("Public booking error:", error);
    res.status(500).json({ error: "Error al procesar reserva" });
  }
});
router5.use(authenticateToken);
router5.use(tenantContext);
router5.get("/schedule", async (req, res) => {
  try {
    const settings = await getScheduleSettings(req.tenantId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener horarios" });
  }
});
router5.post("/schedule", async (req, res) => {
  try {
    const saved = await saveScheduleSettings(req.tenantId, req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Error al guardar horarios" });
  }
});
router5.get("/", async (req, res) => {
  try {
    const list = await getAppointmentsByTenant(req.tenantId, req.query);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener citas" });
  }
});
router5.post("/", async (req, res) => {
  try {
    const appt = await createAppointment(req.tenantId, req.body);
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ error: "Error al agendar cita" });
  }
});
router5.put("/:id/status", async (req, res) => {
  try {
    const { status, notifyCustomer = true } = req.body;
    const updated = await updateAppointmentStatus(req.params.id, req.tenantId, status);
    const tenant = await getTenantById(req.tenantId);
    if (notifyCustomer && updated?.whatsapp && tenant?.evolutionInstance) {
      let statusText = status === "confirmed" ? "\u2705 Confirmada" : status === "scheduled" ? "\u{1F552} Programada" : status === "completed" ? "\u{1F389} Completada" : status === "cancelled" ? "\u274C Cancelada" : status;
      const msg = `*Actualizaci\xF3n de Cita en ${tenant.name}*

Hola *${updated.name}*, el estado de tu cita para *${updated.service}* (${updated.date} a las ${updated.time}) ha sido actualizado a: *${statusText}*.`;
      try {
        await sendMessage(tenant.evolutionInstance, updated.whatsapp, msg);
      } catch (e) {
      }
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado de cita" });
  }
});
router5.delete("/:id", async (req, res) => {
  try {
    await deleteAppointment(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar cita" });
  }
});
var appointments_routes_default = router5;

// src/server/routes/chats.routes.ts
import { Router as Router6 } from "express";
init_evolution();
init_pool();
var router6 = Router6();
router6.use(authenticateToken);
router6.use(tenantContext);
router6.get("/", async (req, res) => {
  try {
    const isSuperAdmin = req.user?.role === "superadmin";
    let msgs = await getChatMessagesByTenant(req.tenantId, 500);
    let sessions = await getAllChatSessions(req.tenantId);
    if (isSuperAdmin && msgs.length === 0) {
      const allMsgsRes = await query(`
        SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
               from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
               status, created_at as "createdAt"
        FROM chat_messages
        ORDER BY created_at DESC
        LIMIT 500
      `);
      msgs = allMsgsRes.rows;
      const allSessionsRes = await query(`
        SELECT remote_jid as "remoteJid", is_human_mode as "isHumanMode", unread, notes, updated_at as "updatedAt"
        FROM chat_sessions
      `);
      sessions = allSessionsRes.rows.reduce((acc, row) => {
        acc[row.remoteJid] = row;
        return acc;
      }, {});
    }
    res.json({ messages: msgs, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener chats" });
  }
});
router6.post("/reply", async (req, res) => {
  try {
    const { remoteJid, messageText, pushName } = req.body;
    let tenantId = req.tenantId;
    const checkTenant = await query(`SELECT tenant_id FROM chat_messages WHERE remote_jid = $1 LIMIT 1`, [remoteJid]);
    if (checkTenant.rows.length > 0) {
      tenantId = checkTenant.rows[0].tenant_id;
    }
    const tenant = await getTenantById(tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${tenantId.slice(0, 8)}`;
    const cleanPhone = (remoteJid || "").replace(/@.+$/, "").replace(/\D/g, "");
    if (cleanPhone && messageText) {
      await sendMessage(instanceName, cleanPhone, messageText);
      await saveChatMessage(tenantId, {
        id: `manual_${Date.now()}`,
        remoteJid,
        pushName: pushName || "Operador",
        fromMe: true,
        messageText,
        status: "sent"
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error enviando mensaje" });
  }
});
router6.post("/toggle-ai", async (req, res) => {
  try {
    const { remoteJid, isHumanMode } = req.body;
    let tenantId = req.tenantId;
    const checkTenant = await query(`SELECT tenant_id FROM chat_messages WHERE remote_jid = $1 LIMIT 1`, [remoteJid]);
    if (checkTenant.rows.length > 0) {
      tenantId = checkTenant.rows[0].tenant_id;
    }
    if (remoteJid) {
      await setChatHumanMode(tenantId, remoteJid, Boolean(isHumanMode));
    }
    res.json({ success: true, remoteJid, isHumanMode: Boolean(isHumanMode) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error cambiando modo humano" });
  }
});
var chats_routes_default = router6;

// src/server/routes/agent.routes.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.use(authenticateToken);
router7.use(tenantContext);
router7.get("/prompt", async (req, res) => {
  try {
    const config = await getAgentConfig(req.tenantId);
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener prompt" });
  }
});
router7.post("/prompt", async (req, res) => {
  try {
    const saved = await saveAgentConfig(req.tenantId, req.body);
    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar prompt" });
  }
});
router7.post("/simulate", async (req, res) => {
  try {
    const { message } = req.body;
    const result = await processWhatsAppMessageWithAI(
      req.tenantId,
      message || "Hola, \xBFqu\xE9 servicios tienen?",
      "50688888888",
      "Cliente Prueba",
      []
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al simular agente: " + String(error) });
  }
});
router7.get("/ai-quota", async (req, res) => {
  try {
    const usage = await getTenantCurrentMonthUsage(req.tenantId);
    const tenant = await getTenantById(req.tenantId);
    const isUsingOwnKey = !!tenant?.aiApiKeyEncrypted;
    res.json({
      success: true,
      ...usage,
      isUsingOwnKey,
      provider: tenant?.aiProvider || "localai"
    });
  } catch (error) {
    console.error("Error fetching tenant AI quota:", error);
    res.status(500).json({ error: "Error al obtener cuota de IA" });
  }
});
var agent_routes_default = router7;

// src/server/routes/evolution.routes.ts
import { Router as Router8 } from "express";
init_evolution();
init_env();
var router8 = Router8();
router8.use(authenticateToken);
router8.use(tenantContext);
router8.get("/status", async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId.slice(0, 8)}`;
    const statusRes = await getInstanceStatus(instanceName);
    const rawData = statusRes.data || {};
    const state = rawData?.instance?.state || rawData?.state || "disconnected";
    if (state === "open" || state === "connected") {
      res.json({
        status: "connected",
        instanceName,
        whatsappNumber: tenant?.whatsappNumber
      });
      return;
    }
    try {
      const connectRes = await connectInstance(instanceName);
      const connectData = connectRes.data || {};
      const qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
      const pairingCode = connectData?.pairingCode || null;
      if (qrcode) {
        res.json({
          status: "qrcode",
          qrcode,
          pairingCode,
          instanceName
        });
        return;
      }
    } catch (e) {
    }
    res.json({
      status: state,
      instanceName
    });
  } catch (error) {
    res.json({ status: "disconnected" });
  }
});
router8.post("/connect", async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    let instanceName = tenant?.evolutionInstance;
    if (!instanceName) {
      instanceName = `tenant_${req.tenantId.slice(0, 8)}`;
      await updateTenant(req.tenantId, { evolutionInstance: instanceName });
    }
    const createRes = await createInstance(instanceName);
    let qrcode = createRes.data?.qrcode?.base64 || createRes.data?.qrcode?.code || null;
    let pairingCode = createRes.data?.qrcode?.pairingCode || null;
    if (!qrcode) {
      const connectRes = await connectInstance(instanceName);
      const connectData = connectRes.data || {};
      qrcode = connectData?.base64 || connectData?.qrcode?.base64 || connectData?.code || null;
      pairingCode = connectData?.pairingCode || null;
    }
    try {
      const appUrl = env.APP_URL || `http://betico_app:80`;
      await setWebhook(instanceName, `${appUrl}/api/webhook/evolution`);
    } catch (e) {
    }
    res.json({
      status: qrcode ? "qrcode" : "connecting",
      qrcode,
      pairingCode,
      instanceName
    });
  } catch (error) {
    console.error("Evolution connect error:", error);
    res.status(500).json({ error: "Error conectando instancia" });
  }
});
router8.post("/disconnect", async (req, res) => {
  try {
    const tenant = await getTenantById(req.tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId.slice(0, 8)}`;
    await disconnectInstance(instanceName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Error desconectando instancia" });
  }
});
var evolution_routes_default = router8;

// src/server/routes/notifications.routes.ts
import { Router as Router9 } from "express";
init_pool();
var router9 = Router9();
router9.use(authenticateToken);
router9.use(tenantContext);
router9.get("/", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, tenant_id as "tenantId", recipient as "recipientPhone", message, 
              trigger_type as "triggerType", status, created_at as "timestamp" 
       FROM notifications_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.tenantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener notificaciones" });
  }
});
var notifications_routes_default = router9;

// src/server/routes/store.routes.ts
import { Router as Router10 } from "express";
var router10 = Router10();
router10.use(authenticateToken);
router10.use(tenantContext);
router10.get("/", async (req, res) => {
  try {
    const settings = await getStoreSettings(req.tenantId);
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n de tienda" });
  }
});
router10.post("/", async (req, res) => {
  try {
    const { storeSlug, storeName } = req.body;
    const cleanSlug = storeSlug ? storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, "") : void 0;
    const saved = await saveStoreSettings(req.tenantId, {
      ...req.body,
      storeSlug: cleanSlug || req.body.storeSlug
    });
    if (cleanSlug) {
      try {
        await updateTenant(req.tenantId, {
          slug: cleanSlug,
          ...storeName ? { name: storeName } : {}
        });
      } catch (err) {
        console.warn("Could not update tenant slug (might be duplicate):", err);
      }
    }
    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al guardar configuraci\xF3n de tienda" });
  }
});
var store_routes_default = router10;

// src/server/routes/products.routes.ts
import { Router as Router11 } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
init_ai_provider();
init_encryption();
init_pool();
var router11 = Router11();
router11.use(authenticateToken);
router11.use(tenantContext);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
router11.get("/", async (req, res) => {
  try {
    const { category, search, active } = req.query;
    let sql = `
      SELECT p.id, p.tenant_id as "tenantId", p.name, p.slug, p.description, p.price, 
             p.compare_at_price as "compareAtPrice", p.currency, p.category, p.tags, 
             p.stock, p.track_stock as "trackStock", p.weight_grams as "weightGrams",
             p.custom_variables as "customVariables", p.sku, p.featured, p.active,
             p.created_at as "createdAt", p.updated_at as "updatedAt",
             COALESCE(
               (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'isPrimary', pi.is_primary))
                FROM product_images pi WHERE pi.product_id = p.id), '[]'::json
             ) as images,
             COALESCE(
               (SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'priceOverride', pv.price_override, 'stock', pv.stock))
                FROM product_variants pv WHERE pv.product_id = p.id), '[]'::json
             ) as variants
      FROM products p
      WHERE p.tenant_id = $1
    `;
    const params = [req.tenantId];
    let paramIdx = 2;
    if (category) {
      sql += ` AND p.category ILIKE $${paramIdx++}`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx} OR p.sku ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (active !== void 0 && active !== "") {
      sql += ` AND p.active = $${paramIdx++}`;
      params.push(active === "true" || active === true);
    }
    sql += ` ORDER BY p.created_at DESC`;
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});
router11.get("/template", (req, res) => {
  try {
    const templateData = [
      {
        Nombre: "Hamburguesa Especial Betico",
        Descripcion: "Deliciosa carne artesanal 100% res con queso cheddar, tocineta crocante y salsa de la casa.",
        Precio: 4500,
        PrecioComparacion: 5500,
        Categoria: "Comidas",
        SKU: "HAMB-001",
        Stock: 50,
        Activo: "SI"
      },
      {
        Nombre: "Refresco Natural Cas 500ml",
        Descripcion: "Bebida natural refrescante preparada con fruta fresca de temporada.",
        Precio: 1500,
        PrecioComparacion: "",
        Categoria: "Bebidas",
        SKU: "BEB-002",
        Stock: 100,
        Activo: "SI"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Disposition", 'attachment; filename="plantilla_productos_betico.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error generando plantilla:", error);
    res.status(500).json({ error: "Error al generar plantilla Excel" });
  }
});
router11.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ error: "Archivo Excel requerido" });
      return;
    }
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400).json({ error: "El archivo Excel no contiene hojas de c\xE1lculo" });
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    if (rows.length === 0) {
      res.status(400).json({ error: "La plantilla no contiene filas de productos para importar" });
      return;
    }
    let createdCount = 0;
    const errors = [];
    const getVal = (row, ...keys) => {
      const normalizedKeys = keys.map((k) => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
      for (const [rKey, rVal] of Object.entries(row)) {
        const normRKey = rKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (normalizedKeys.includes(normRKey)) {
          return rVal;
        }
      }
      return void 0;
    };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawName = getVal(row, "Nombre", "Producto", "Name", "Item");
      const rawPrice = getVal(row, "Precio", "Price", "Monto", "Valor");
      const name = rawName ? String(rawName).trim() : "";
      const price = parseFloat(String(rawPrice || "").replace(/[^\d.-]/g, ""));
      if (!name || isNaN(price) || price < 0) {
        errors.push({ row: i + 2, error: `Fila ${i + 2}: 'Nombre' y 'Precio' v\xE1lido son requeridos.` });
        continue;
      }
      const cleanSlugBase = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const uniqueSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${cleanSlugBase || "prod"}-${uniqueSuffix}`;
      const rawComparePrice = getVal(row, "PrecioComparacion", "Precio Comparaci\xF3n", "Precio_Comparacion", "ComparePrice", "Precio Anterior");
      const compareAtPrice = rawComparePrice ? parseFloat(String(rawComparePrice).replace(/[^\d.-]/g, "")) : null;
      const rawCategory = getVal(row, "Categoria", "Categor\xEDa", "Category", "Secci\xF3n");
      const category = rawCategory ? String(rawCategory).trim() : "General";
      const rawDesc = getVal(row, "Descripcion", "Descripci\xF3n", "Description", "Detalle");
      const description = rawDesc ? String(rawDesc).trim() : "";
      const rawSku = getVal(row, "SKU", "Sku", "C\xF3digo", "Codigo", "Code");
      const sku = rawSku ? String(rawSku).trim() : null;
      const rawStock = getVal(row, "Stock", "Cantidad", "Inventario", "Qty");
      const stock = parseInt(String(rawStock || "10").replace(/\D/g, ""), 10) || 0;
      const rawActive = getVal(row, "Activo", "Active", "Visible", "Estado");
      const activeStr = String(rawActive || "SI").toUpperCase().trim();
      const active = activeStr === "SI" || activeStr === "TRUE" || activeStr === "1" || activeStr === "S" || activeStr === "ACTIVO";
      try {
        await createProduct(req.tenantId, {
          name,
          slug,
          description,
          price,
          compareAtPrice: compareAtPrice || void 0,
          category,
          sku: sku || void 0,
          stock,
          active,
          tags: [],
          customVariables: [],
          currency: "CRC"
        });
        createdCount++;
      } catch (err) {
        errors.push({ row: i + 2, error: `Fila ${i + 2}: ${err.message || "Error al guardar en base de datos"}` });
      }
    }
    res.json({
      success: true,
      createdCount,
      totalRows: rows.length,
      errors
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ error: error.message || "Error procesando archivo Excel" });
  }
});
router11.post("/generate-description", async (req, res) => {
  try {
    const { name, category, keywords } = req.body;
    if (!name) {
      res.status(400).json({ error: "El nombre del producto es requerido" });
      return;
    }
    const tenant = await getTenantById(req.tenantId);
    let apiKey = "";
    let isMarcaBlanca = false;
    if (tenant?.aiApiKeyEncrypted) {
      try {
        apiKey = decrypt(tenant.aiApiKeyEncrypted);
      } catch (e) {
      }
    }
    let config;
    if (apiKey) {
      config = {
        provider: tenant?.aiProvider || "gemini",
        apiKey,
        model: tenant?.aiModel || "gemini-2.5-flash",
        temperature: 0.7
      };
    } else {
      isMarcaBlanca = true;
      const masterConfig = await getMasterAIConfig();
      config = {
        ...masterConfig,
        temperature: 0.7
      };
    }
    const prompt = `Eres un redactor profesional de e-commerce y marketing digital en Costa Rica y Latinoam\xE9rica.
Genera una descripci\xF3n atractiva, persuasiva y profesional para el siguiente producto:

- Nombre del producto: ${name}
- Categor\xEDa: ${category || "General"}
${keywords ? `- Palabras clave o caracter\xEDsticas: ${keywords}` : ""}

Requisitos:
1. Longitud: 2 a 3 oraciones concisas y llamativas.
2. Tono: Cercano, comercial y de alta conversi\xF3n.
3. Incluye 2 o 3 vi\xF1etas breves con los puntos clave destacados (ej: \u2022 Calidad garantizada).
4. Devuelve \xFAnicamente el texto de la descripci\xF3n listo para publicar.`;
    const aiResult = await callAI(config, prompt);
    if (aiResult && aiResult.text) {
      if (isMarcaBlanca && aiResult.tokensUsed > 0) {
        await incrementTenantUsage(req.tenantId, aiResult.tokensUsed);
      }
      res.json({ description: aiResult.text });
      return;
    }
    const categoryLower = (category || "").toLowerCase();
    let richDesc = "";
    if (categoryLower.includes("comida") || categoryLower.includes("hamburguesa") || categoryLower.includes("pizza") || categoryLower.includes("restaurante")) {
      richDesc = `\xA1Delicioso ${name} preparado al momento con los ingredientes m\xE1s frescos y selectos! La combinaci\xF3n perfecta de sabor y calidad para consentir tu paladar.

\u2022 Preparaci\xF3n 100% artesanal con ingredientes frescos de primera calidad.
\u2022 Sabor inigualable y porci\xF3n ideal para disfrutar.
\u2022 Empaque t\xE9rmico especial para que llegue caliente y fresco a tu mesa.`;
    } else if (categoryLower.includes("bebida") || categoryLower.includes("cafe") || categoryLower.includes("refresco")) {
      richDesc = `Disfruta de ${name}, la opci\xF3n perfecta y refrescante para acompa\xF1ar tus momentos especiales.

\u2022 Sabor aut\xE9ntico y refrescante en cada sorbo.
\u2022 Ingredientes seleccionados con los m\xE1s altos est\xE1ndares.
\u2022 Ideal para compartir en cualquier momento del d\xEDa.`;
    } else if (categoryLower.includes("ropa") || categoryLower.includes("moda") || categoryLower.includes("calzado")) {
      richDesc = `Descubre ${name}, dise\xF1ado con materiales de primera calidad que garantizan m\xE1xima comodidad, durabilidad y un estilo moderno que destaca.

\u2022 Material premium resistente, fresco y de tacto suave.
\u2022 Ajuste ergon\xF3mico y acabados de alta costura.
\u2022 Disponible para entrega inmediata con garant\xEDa de satisfacci\xF3n.`;
    } else {
      richDesc = `Presentamos ${name}, una excelente elecci\xF3n pensada para brindarte el mejor rendimiento, comodidad y satisfacci\xF3n total.

\u2022 Calidad garantizada con acabados y materiales de primer nivel.
\u2022 ${keywords ? `Dise\xF1ado especialmente para destacar: ${keywords}.` : "Vers\xE1til, pr\xE1ctico y perfecto para el uso diario."}
\u2022 Disponible para env\xEDo express inmediato directo a tu puerta.`;
    }
    res.json({ description: richDesc });
  } catch (error) {
    console.error("Error generando descripci\xF3n:", error);
    const fallbackDesc = `${req.body.name} de excelente calidad y rendimiento garantizado. Disponible para entrega inmediata.`;
    res.json({ description: fallbackDesc });
  }
});
router11.get("/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id, req.tenantId);
    if (!product) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});
router11.post("/", async (req, res) => {
  try {
    const { name, price, images, ...rest } = req.body;
    if (!name || price === void 0) {
      res.status(400).json({ error: "Nombre y precio son requeridos" });
      return;
    }
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4);
    const product = await createProduct(req.tenantId, {
      ...rest,
      name,
      slug,
      price: parseFloat(price)
    });
    if (Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imgUrl = typeof images[i] === "string" ? images[i] : images[i].url;
        if (imgUrl) {
          await query(
            `INSERT INTO product_images (product_id, tenant_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)`,
            [product.id, req.tenantId, imgUrl, i, i === 0]
          );
        }
      }
    }
    const fullProduct = await getProductById(product.id, req.tenantId);
    res.status(201).json(fullProduct || product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear producto" });
  }
});
router11.put("/:id", async (req, res) => {
  try {
    const { images, ...data } = req.body;
    const updated = await updateProduct(req.params.id, req.tenantId, data);
    if (Array.isArray(images)) {
      await query(`DELETE FROM product_images WHERE product_id = $1 AND tenant_id = $2`, [req.params.id, req.tenantId]);
      for (let i = 0; i < images.length; i++) {
        const imgUrl = typeof images[i] === "string" ? images[i] : images[i].url;
        if (imgUrl) {
          await query(
            `INSERT INTO product_images (product_id, tenant_id, url, sort_order, is_primary) VALUES ($1, $2, $3, $4, $5)`,
            [req.params.id, req.tenantId, imgUrl, i, i === 0]
          );
        }
      }
    }
    const full = await getProductById(req.params.id, req.tenantId);
    res.json(full || updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});
router11.delete("/:id", async (req, res) => {
  try {
    await deleteProduct(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});
var products_routes_default = router11;

// src/server/routes/orders.routes.ts
import { Router as Router12 } from "express";
init_evolution();
init_pool();
var router12 = Router12();
router12.use(authenticateToken);
router12.use(tenantContext);
function normalizeCostaRicaPhone(phone) {
  let clean = (phone || "").replace(/\D/g, "");
  if (clean.length === 8) {
    clean = "506" + clean;
  }
  return clean;
}
async function resolveInstanceName(tenantId) {
  const tenant = await getTenantById(tenantId);
  if (tenant?.evolutionInstance) return tenant.evolutionInstance;
  console.warn(`[OrdersRoute] Tenant ${tenantId} does not have a configured WhatsApp evolutionInstance. Notification skipped.`);
  return void 0;
}
var STATUS_LABELS = {
  pedido_recibido: "Pedido Recibido",
  pedido_aceptado: "Pedido Aceptado",
  procesando: "En Preparaci\xF3n / Cocina",
  listo_entrega: "Listo para Entregar",
  en_camino: "En Camino",
  entregado: "Entregado con \xC9xito",
  cancelado: "Cancelado",
  pending: "Pedido Recibido",
  confirmed: "Pedido Aceptado",
  preparing: "En Preparaci\xF3n",
  shipped: "En Camino",
  delivered: "Entregado"
};
router12.get("/", async (req, res) => {
  try {
    let orders = await getOrdersByTenant(req.tenantId, req.query);
    if (req.user?.role === "superadmin" && orders.length === 0) {
      const allRes = await query(`
        SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
               o.customer_name as "customerName", o.customer_phone as "customerPhone",
               o.customer_email as "customerEmail", o.customer_address as "customerAddress",
               o.customer_location as "customerLocation", o.whatsapp_jid as "whatsappJid",
               o.source, o.subtotal, o.delivery_fee as "deliveryFee", o.discount, o.total,
               o.currency, o.status, o.payment_method as "paymentMethod",
               o.payment_status as "paymentStatus", o.payment_reference as "paymentReference",
               o.notes, o.delivery_method as "deliveryMethod", o.consumption_mode as "consumptionMode",
               o.table_number as "tableNumber", o.driver_id as "driverId", o.waze_url as "wazeUrl",
               o.created_at as "createdAt", o.updated_at as "updatedAt",
               COALESCE(
                 (SELECT json_agg(json_build_object(
                    'id', oi.id,
                    'productName', oi.product_name,
                    'variantName', oi.variant_name,
                    'quantity', oi.quantity,
                    'unitPrice', oi.unit_price,
                    'totalPrice', oi.total_price
                  ))
                  FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
               ) as items
        FROM orders o
        ORDER BY o.created_at DESC
        LIMIT 100
      `);
      orders = allRes.rows;
    }
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener \xF3rdenes" });
  }
});
router12.get("/stats/unread", async (req, res) => {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE (tenant_id = $1 OR $2 = 'superadmin') AND status IN ('pedido_recibido', 'pending')
    `, [req.tenantId, req.user?.role || "user"]);
    res.json({ newOrdersCount: parseInt(result.rows[0]?.count || "0", 10) });
  } catch (error) {
    res.json({ newOrdersCount: 0 });
  }
});
router12.get("/:id", async (req, res) => {
  try {
    const order = await getOrderById(req.params.id, req.tenantId);
    if (!order) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener orden" });
  }
});
router12.put("/:id/proof-status", async (req, res) => {
  try {
    const { proofStatus } = req.body;
    if (!proofStatus || !["pending", "received", "verified"].includes(proofStatus)) {
      res.status(400).json({ error: "Estado de comprobante inv\xE1lido (pending, received, verified)" });
      return;
    }
    const order = await getOrderById(req.params.id, req.tenantId);
    if (!order) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }
    let paymentStatus = order.paymentStatus;
    if (proofStatus === "verified") {
      paymentStatus = "paid";
    } else if (proofStatus === "received") {
      paymentStatus = "proof_sent";
    }
    await query(`
      UPDATE orders 
      SET payment_proof_status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND (tenant_id = $4 OR $5 = 'superadmin')
    `, [proofStatus, paymentStatus, req.params.id, req.tenantId, req.user?.role || "user"]);
    if (req.io) {
      req.io.to(`tenant_${order.tenantId}`).emit("order:updated", {
        id: req.params.id,
        paymentProofStatus: proofStatus,
        paymentStatus
      });
    }
    res.json({ success: true, proofStatus, paymentStatus });
  } catch (error) {
    console.error("Error updating proof status:", error);
    res.status(500).json({ error: "Error al actualizar estado de comprobante" });
  }
});
router12.put("/:id/status", async (req, res) => {
  try {
    const { status, notifyCustomer = true, customMessage } = req.body;
    const order = await getOrderById(req.params.id, req.tenantId);
    if (!order) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }
    const updated = await updateOrderStatus(req.params.id, req.tenantId, status);
    const tenant = await getTenantById(req.tenantId);
    const store = await getStoreSettings(req.tenantId);
    const storeName = store?.storeName || tenant?.name || "nuestro negocio";
    const instanceName = await resolveInstanceName(req.tenantId);
    const cleanCustomerPhone = normalizeCostaRicaPhone(order.customerPhone || "");
    if (notifyCustomer && cleanCustomerPhone && instanceName) {
      let msg = "";
      const templates = store?.notificationTemplates;
      if (customMessage) {
        msg = customMessage;
      } else if (status === "pedido_recibido" || status === "pending") {
        msg = templates?.orderReceived || `\u{1F389} *\xA1Gracias por tu pedido en ${storeName}!*

Hola *${order.customerName}*, hemos recibido con \xE9xito tu orden *#ORD-${order.orderNumber}*.

\u{1F4B0} *Total:* \u20A1${Number(order.total).toLocaleString("es-CR")}
\u{1F4E6} *Estado:* Recibido / En cola

Te estaremos notificando los avances de tu pedido. \xA1Muchas gracias por tu preferencia! \u2B50`;
      } else if (status === "procesando" || status === "preparing" || status === "pedido_aceptado") {
        msg = `\u{1F525} *\xA1Tu pedido ya est\xE1 en preparaci\xF3n!*

Hola *${order.customerName}*, te informamos que tu orden *#ORD-${order.orderNumber}* de *${storeName}* ya est\xE1 siendo preparada con esmero.

\u{1F4E6} *Estado:* En Cocina / Preparaci\xF3n
Te avisaremos en cuanto est\xE9 lista. \u23F1\uFE0F`;
      } else if (status === "listo_entrega") {
        msg = `\u26A1 *\xA1Tu pedido ya est\xE1 listo!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* ya se encuentra completamente lista para ser entregada o retirada. \u{1F6CD}\uFE0F`;
      } else if (status === "en_camino" || status === "shipped") {
        msg = templates?.orderInTransit || `\u{1F6F5} *\xA1Tu pedido ya va en camino!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* acaba de salir y va en camino.

\u{1F4B0} *Monto a pagar:* ${order.paymentStatus === "paid" ? "\u2705 Ya cancelado" : `\u20A1${Number(order.total).toLocaleString("es-CR")}`}
\xA1Pronto estaremos en tu puerta! \u{1F680}`;
      } else if (status === "entregado" || status === "delivered") {
        msg = templates?.orderDelivered || `\u{1F389} *\xA1Tu pedido ha sido entregado con \xE9xito!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* ha sido entregada.

\xA1Muchas gracias por tu preferencia! Esperamos que lo disfrutes. \u2B50`;
      } else if (status === "cancelado" || status === "cancelled") {
        msg = `\u274C *Notificaci\xF3n de Pedido Cancelado*

Hola *${order.customerName}*, te informamos que tu orden *#ORD-${order.orderNumber}* ha sido cancelada. Si consideras que es un error o necesitas ayuda, responde a este chat.`;
      } else {
        const statusLabel = STATUS_LABELS[status] || status;
        msg = `*Actualizaci\xF3n de tu pedido en ${storeName}*

Hola *${order.customerName}*,

Te informamos que tu pedido *#ORD-${order.orderNumber}* ha cambiado a estado:
\u{1F449} *${statusLabel}*`;
      }
      msg = msg.replace(/{cliente}/g, order.customerName).replace(/{pedido}/g, String(order.orderNumber)).replace(/{tienda}/g, storeName).replace(/{total}/g, `\u20A1${Number(order.total).toLocaleString("es-CR")}`).replace(/{cobro}/g, order.paymentStatus === "paid" ? "\u2705 Ya cancelado" : `\u20A1${Number(order.total).toLocaleString("es-CR")}`);
      try {
        await sendMessage(instanceName, cleanCustomerPhone, msg);
        await query(`
          INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
          VALUES ($1, $2, $3, $4, 'order_status_update', 'sent')
        `, [
          `notif_${Date.now()}`,
          order.tenantId || req.tenantId,
          cleanCustomerPhone,
          `Notificaci\xF3n de estado ${status} enviada a ${order.customerName}`
        ]);
      } catch (err) {
        console.error("Error sending WhatsApp order update notification:", err);
      }
    }
    if (req.io) {
      req.io.to(`tenant_${order.tenantId || req.tenantId}`).emit("order:updated", updated);
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});
router12.post("/:id/confirm-payment", async (req, res) => {
  try {
    const { reference, notifyCustomer = true } = req.body;
    const updated = await confirmPayment(req.params.id, req.tenantId, reference);
    const order = await getOrderById(req.params.id, req.tenantId);
    const tenant = await getTenantById(req.tenantId);
    const instanceName = await resolveInstanceName(req.tenantId);
    const cleanCustomerPhone = normalizeCostaRicaPhone(order?.customerPhone || "");
    if (notifyCustomer && cleanCustomerPhone && instanceName && order) {
      const msg = `*Pago Confirmado* \u2705

Hola *${order.customerName}*, hemos confirmado el pago de tu pedido *#ORD-${order.orderNumber}* por un total de *\u20A1${Number(order.total).toLocaleString("es-CR")}*.

Estamos procesando tu orden de inmediato. \xA1Gracias!`;
      try {
        await sendMessage(instanceName, cleanCustomerPhone, msg);
      } catch (e) {
      }
    }
    if (req.io) {
      req.io.to(`tenant_${req.tenantId}`).emit("order:updated", updated || order);
    }
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al confirmar pago" });
  }
});
var orders_routes_default = router12;

// src/server/routes/dashboard.routes.ts
import { Router as Router13 } from "express";
init_pool();
var router13 = Router13();
router13.use(authenticateToken);
router13.use(tenantContext);
router13.get("/stats", async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const firstOfMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1).toISOString().split("T")[0];
    const [chatsRes, appointmentsRes, ordersRes, revenueRes, pendingRes, recentOrdersRes, recentApptsRes] = await Promise.all([
      query(`SELECT COUNT(DISTINCT remote_jid) as count FROM chat_messages WHERE tenant_id = $1 AND created_at::date = $2`, [tenantId, today]),
      query(`SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1 AND date = $2`, [tenantId, today]),
      query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND created_at::date = $2`, [tenantId, today]),
      query(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE tenant_id = $1 AND created_at >= $2 AND payment_status = 'paid'`, [tenantId, firstOfMonth]),
      query(`SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1 AND status = 'pending'`, [tenantId]),
      query(`
        SELECT id, order_number as "orderNumber", customer_name as "customerName", total, status, 
               payment_method as "paymentMethod", created_at as "createdAt"
        FROM orders WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5
      `, [tenantId]),
      query(`
        SELECT id, name, whatsapp, service, date, time, status, created_at as "createdAt"
        FROM appointments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 5
      `, [tenantId])
    ]);
    res.json({
      chats: parseInt(chatsRes.rows[0].count, 10),
      appointments: parseInt(appointmentsRes.rows[0].count, 10),
      orders: parseInt(ordersRes.rows[0].count, 10),
      revenue: parseFloat(revenueRes.rows[0].total),
      pendingOrders: parseInt(pendingRes.rows[0].count, 10),
      recentOrders: recentOrdersRes.rows,
      recentAppointments: recentApptsRes.rows
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Error al obtener estad\xEDsticas" });
  }
});
var dashboard_routes_default = router13;

// src/server/routes/audit.routes.ts
import { Router as Router14 } from "express";
var router14 = Router14();
router14.use(authenticateToken);
router14.use(requireSuperAdmin);
router14.get("/", async (req, res) => {
  try {
    const { action, userId, tenantId, limit, offset, startDate, endDate } = req.query;
    const result = await getAuditLogs(tenantId || null, {
      action,
      userId,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
      startDate,
      endDate
    });
    res.json(result);
  } catch (error) {
    console.error("Audit logs error:", error);
    res.status(500).json({ error: "Error al obtener logs de auditor\xEDa" });
  }
});
var audit_routes_default = router14;

// src/server/routes/upload.routes.ts
import { Router as Router15 } from "express";
import multer2 from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
init_env();
init_pool();
import rateLimit from "express-rate-limit";
var router15 = Router15();
var publicUploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1e3,
  // 5 minutos
  max: 15,
  // máximo 15 comprobantes por IP cada 5 min
  message: { error: "Demasiados intentos de subida. Por favor espera unos minutos." },
  standardHeaders: true,
  legacyHeaders: false
});
var uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storage = multer2.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});
var fileFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten im\xE1genes (jpg, png, webp, gif, svg)"));
  }
};
var upload2 = multer2({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB
});
async function persistFileToDatabase(filename, mimetype, filePath, size) {
  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const dataBase64 = fileBuffer.toString("base64");
      await query(`
        INSERT INTO uploaded_files (filename, mime_type, data_base64, size)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (filename) DO UPDATE SET 
          mime_type = EXCLUDED.mime_type, 
          data_base64 = EXCLUDED.data_base64, 
          size = EXCLUDED.size
      `, [filename, mimetype, dataBase64, size]);
      console.log(`[Upload DB Sync] Persisted ${filename} to PostgreSQL uploaded_files (${size} bytes)`);
    }
  } catch (err) {
    console.error("[Upload DB Sync] Failed to persist file to PostgreSQL:", err);
  }
}
router15.post("/public-proof", publicUploadLimiter, upload2.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No se recibi\xF3 archivo de comprobante" });
    return;
  }
  await persistFileToDatabase(
    req.file.filename,
    req.file.mimetype || "image/jpeg",
    req.file.path,
    req.file.size
  );
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});
router15.use(authenticateToken);
router15.post("/", upload2.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No se subi\xF3 ning\xFAn archivo" });
      return;
    }
    await persistFileToDatabase(
      req.file.filename,
      req.file.mimetype,
      req.file.path,
      req.file.size
    );
    const url = `/uploads/${req.file.filename}`;
    res.json({
      url,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error al subir el archivo" });
  }
});
router15.post("/multiple", upload2.array("files", 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No se subieron archivos" });
      return;
    }
    for (const f of files) {
      await persistFileToDatabase(
        f.filename,
        f.mimetype,
        f.path,
        f.size
      );
    }
    const urls = files.map((f) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size
    }));
    res.json(urls);
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ error: "Error al subir los archivos" });
  }
});
var upload_routes_default = router15;

// src/server/routes/storefront.routes.ts
import { Router as Router16 } from "express";
init_evolution();
init_pool();
init_tenant_payment_repo();

// src/server/services/tilopay-tenant.service.ts
init_tenant_payment_repo();
init_env();
var tokenCache = /* @__PURE__ */ new Map();
var TilopayTenantService = class {
  static getBaseUrl(environment) {
    return "https://app.tilopay.com/api/v1";
  }
  /**
   * Clears cached tokens for a tenant (useful when credentials are saved or rotated).
   */
  static clearTokenCache(tenantId) {
    tokenCache.delete(`tilopay_jwt:${tenantId}:SANDBOX`);
    tokenCache.delete(`tilopay_jwt:${tenantId}:PRODUCTION`);
  }
  /**
   * Diagnostic method to test credentials against Tilopay prior to saving.
   * Uses Tilopay's official authentication endpoint: POST /api/v1/login
   * with email (API User) and password.
   */
  static async verifyCredentials(apiKey, apiUser, apiPassword, environment) {
    if (!apiKey || !apiUser || !apiPassword) {
      return { success: false, message: "Todos los campos de credenciales son requeridos." };
    }
    const baseUrl = this.getBaseUrl(environment);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1e4);
    try {
      const res = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: apiUser.trim(),
          password: apiPassword.trim()
        }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) {
        const errorMsg = data.message || data.error || `HTTP ${res.status}: Credenciales de Tilopay inv\xE1lidas. Verifica tu usuario y contrase\xF1a.`;
        return { success: false, message: errorMsg };
      }
      return { success: true, message: "Credenciales de Tilopay verificadas exitosamente." };
    } catch (err) {
      const isTimeout = err.name === "AbortError" || err.message?.includes("aborted");
      const msg = isTimeout ? "Tiempo de espera agotado al conectar con Tilopay (10s)" : err.message;
      return { success: false, message: `Error de red al conectar con Tilopay: ${msg}` };
    } finally {
      clearTimeout(timeout);
    }
  }
  /**
   * Retrieves or refreshes an isolated SDK JWT token for a specific tenant.
   * Multi-tenant isolated via composite cache key: `tilopay_jwt:${tenantId}:${env}`.
   */
  static async getSdkToken(tenantId) {
    if (!env.TILOPAY_MODULE_ENABLED) {
      throw new Error("El m\xF3dulo de Tilopay se encuentra temporalmente inactivo.");
    }
    const config = await getTenantPaymentConfigRaw(tenantId);
    if (!config || !config.isEnabled) {
      throw new Error("La pasarela de pagos Tilopay no est\xE1 activada para este comercio.");
    }
    if (!config.apiKey || !config.apiUser || !config.apiPassword) {
      throw new Error("Credenciales de Tilopay incompletas para este comercio.");
    }
    const cacheKey = `tilopay_jwt:${tenantId}:${config.environment}`;
    const cached = tokenCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return {
        token: cached.token,
        apiKey: config.apiKey,
        environment: config.environment
      };
    }
    const baseUrl = this.getBaseUrl(config.environment);
    const res = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: config.apiUser.trim(),
        password: config.apiPassword.trim()
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.message || data.error || "No fue posible autenticar con Tilopay");
    }
    const token = data.access_token;
    const expiresInSeconds = Number(data.expires_in) || 86400;
    const expiresAt = now + Math.max(60, expiresInSeconds - 60) * 1e3;
    tokenCache.set(cacheKey, { token, expiresAt });
    return {
      token,
      apiKey: config.apiKey,
      environment: config.environment
    };
  }
  /**
   * Generates client-side session parameters and hosted checkout URL on Tilopay.
   * Calls official POST /api/v1/processPayment with Bearer token.
   */
  static async createPaymentSession(tenantId, orderId) {
    const order = await getOrderById(orderId, tenantId);
    if (!order) {
      throw new Error("Orden no encontrada");
    }
    if (order.paymentStatus === "paid" || order.paymentStatus === "PAID") {
      throw new Error("Esta orden ya se encuentra pagada");
    }
    if (order.status === "cancelado" || order.status === "cancelled") {
      throw new Error("Esta orden fue cancelada y no puede ser procesada");
    }
    const { token: sdkToken, apiKey, environment } = await this.getSdkToken(tenantId);
    const config = await getTenantPaymentConfigRaw(tenantId);
    const baseUrl = this.getBaseUrl(environment);
    const nameParts = (order.customerName || "Cliente").trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const cleanPhone = (order.customerPhone || "88888888").replace(/\D/g, "") || "88888888";
    const appUrl = (env.APP_URL || "https://betico.tech").replace(/\/$/, "");
    const paymentPayload = {
      key: apiKey,
      amount: Number(order.total).toFixed(2),
      currency: (order.currency || "CRC").toUpperCase(),
      billToFirstName: firstName,
      billToLastName: lastName,
      billToEmail: order.customerEmail || "cliente@betico.cr",
      billToAddress: order.customerAddress || "Costa Rica",
      billToAddress2: "N/A",
      billToCity: "San Jose",
      billToState: "SJ",
      billToZip: "10101",
      billToCountry: "CR",
      billToTelephone: cleanPhone,
      orderNumber: `ORD-${order.orderNumber}`,
      redirect: `${appUrl}/order/success/${order.id}`,
      callback: `${appUrl}/api/webhooks/tilopay`
    };
    const paymentRes = await fetch(`${baseUrl}/processPayment`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sdkToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentPayload)
    });
    const paymentData = await paymentRes.json().catch(() => ({}));
    if (!paymentRes.ok || !paymentData.url) {
      console.error("[TilopayProcessPayment] Fall\xF3 la creaci\xF3n de pasarela:", paymentData);
      throw new Error(paymentData.message || paymentData.error || "No fue posible generar el enlace de pago con Tilopay");
    }
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency || "CRC",
      paymentUrl: paymentData.url,
      sdkToken,
      apiKey,
      environment,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      captureMode: config.captureMode || "IMMEDIATE"
    };
  }
};

// src/server/routes/storefront.routes.ts
var router16 = Router16();
router16.get("/:slug", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const settings = await getStoreSettings(tenant.id);
    if (!settings || !settings.storeEnabled) {
      res.status(404).json({ error: "La tienda no est\xE1 disponible p\xFAblicamente" });
      return;
    }
    const paymentConfig = await getTenantPaymentConfig(tenant.id);
    const tilopayEnabled = Boolean(paymentConfig?.isEnabled && paymentConfig?.isConfigured);
    res.json({
      ...settings,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || settings.sinpePhone,
      tilopayEnabled
    });
  } catch (error) {
    console.error("Storefront info error:", error);
    res.status(500).json({ error: "Error al obtener datos de la tienda" });
  }
});
router16.get("/order-public/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await query(`
      SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber", o.customer_name as "customerName",
             o.customer_phone as "customerPhone", o.subtotal, o.delivery_fee as "deliveryFee",
             o.total, o.currency, o.status, o.payment_status as "paymentStatus",
             o.payment_method as "paymentMethod", o.delivery_method as "deliveryMethod",
             o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
             o.created_at as "createdAt",
             COALESCE(ss.store_name, t.name) as "storeName",
             COALESCE(ss.store_slug, t.slug) as "storeSlug",
             t.slug as "tenantSlug",
             COALESCE(ss.sinpe_phone, t.whatsapp_number) as "whatsappNumber",
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'productName', oi.product_name,
                  'variantName', oi.variant_name,
                  'quantity', oi.quantity,
                  'totalPrice', oi.total_price
                ))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      JOIN tenants t ON o.tenant_id = t.id
      LEFT JOIN store_settings ss ON ss.tenant_id = t.id
      WHERE o.id::text = $1 OR o.order_number::text = $1
      LIMIT 1
    `, [orderId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Orden no encontrada" });
      return;
    }
    const orderRow = result.rows[0];
    const resultCode = String(req.query.code || req.query.result_code || req.query.result || "");
    const statusParam = String(req.query.status || "").toLowerCase();
    const isApprovedParam = resultCode === "1" || resultCode === "00" || statusParam === "approved" || statusParam === "success" || statusParam === "paid";
    if (isApprovedParam && orderRow.paymentStatus !== "paid") {
      const txId = String(req.query.transaction_id || req.query.id || req.query.auth || `tilo_${Date.now()}`);
      const authCode = String(req.query.auth_code || req.query.auth || "");
      await executeOrderPaymentConfirmation(orderRow.tenantId, orderRow.id, {
        tilopayTransactionId: txId,
        tilopayAuthCode: authCode,
        paymentMethod: "card",
        paymentReference: txId
      });
      orderRow.paymentStatus = "paid";
      orderRow.paymentMethod = "card";
      if (orderRow.status === "pending" || orderRow.status === "pedido_recibido") {
        orderRow.status = "pedido_aceptado";
      }
    }
    res.json(orderRow);
  } catch (error) {
    console.error("Error fetching public order summary:", error);
    res.status(500).json({ error: "Error al consultar resumen de orden" });
  }
});
router16.post("/:slug/pay-session/:orderId", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const session = await TilopayTenantService.createPaymentSession(tenant.id, req.params.orderId);
    res.json(session);
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(400).json({ error: error.message || "Error al iniciar sesi\xF3n de pago" });
  }
});
router16.get("/pay-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== "string" || token.trim().length < 8) {
      res.status(400).json({ error: "invalid_token", message: "Token de pago inv\xE1lido." });
      return;
    }
    const result = await query(`
      SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
             o.customer_name as "customerName", o.customer_phone as "customerPhone",
             o.customer_email as "customerEmail", o.total, o.currency,
             o.payment_status as "paymentStatus", o.payment_link_expires_at as "paymentLinkExpiresAt",
             t.name as "storeName", t.whatsapp_number as "whatsappNumber",
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'productName', oi.product_name,
                  'variantName', oi.variant_name,
                  'quantity', oi.quantity,
                  'totalPrice', oi.total_price
                ))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.payment_link_token = $1
      LIMIT 1
    `, [token.trim()]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "not_found", message: "El enlace de pago no fue encontrado o ya no est\xE1 disponible." });
      return;
    }
    const order = result.rows[0];
    if (order.paymentStatus === "paid") {
      res.json({
        status: "already_paid",
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: order.storeName
      });
      return;
    }
    if (order.paymentLinkExpiresAt && /* @__PURE__ */ new Date() > new Date(order.paymentLinkExpiresAt)) {
      res.status(410).json({
        error: "expired",
        message: "Este enlace de pago ha expirado por seguridad (vigencia m\xE1xima de 60 minutos). Solicita uno nuevo a nuestro WhatsApp.",
        whatsappNumber: order.whatsappNumber,
        orderNumber: order.orderNumber,
        storeName: order.storeName
      });
      return;
    }
    const tilopaySession = await TilopayTenantService.createPaymentSession(order.tenantId, order.id);
    res.json({
      order,
      tilopaySession
    });
  } catch (error) {
    console.error("Error resolving payment link token:", error);
    res.status(500).json({ error: "server_error", message: error.message || "Error al validar el enlace de pago." });
  }
});
router16.get("/:slug/branches", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const result = await query(`
      SELECT id, name, code, address, phone, sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
             latitude, longitude, is_main as "isMain"
      FROM branches
      WHERE tenant_id = $1 AND active = TRUE
      ORDER BY is_main DESC, name ASC
    `, [tenant.id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Storefront branches error:", error);
    res.status(500).json({ error: "Error al obtener sucursales" });
  }
});
router16.get("/:slug/products", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const products = await getProductsByTenant(tenant.id, true);
    res.json(products);
  } catch (error) {
    console.error("Storefront products error:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});
router16.get("/:slug/products/:productSlug", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const product = await getProductBySlug(req.params.productSlug, tenant.id);
    if (!product || !product.active) {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Storefront single product error:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});
router16.post("/:slug/checkout", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }
    const store = await getStoreSettings(tenant.id);
    const storeName = store?.storeName || tenant.name || "nuestro negocio";
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerLocation,
      consumptionMode = "pickup",
      tableNumber,
      items = [],
      paymentMethod = "sinpe",
      paymentReference,
      paymentProofUrl,
      deliveryMethod = "pickup",
      notes
    } = req.body;
    if (!customerName || !customerPhone || items.length === 0) {
      res.status(400).json({ error: "Nombre, tel\xE9fono y al menos un producto son requeridos" });
      return;
    }
    const productIds = items.map((item) => item.productId || item.id).filter((id) => typeof id === "string" && id.length > 10);
    if (productIds.length === 0) {
      res.status(400).json({ error: "La orden no contiene productos v\xE1lidos" });
      return;
    }
    const dbProductsRes = await query(`
      SELECT p.id, p.name, p.price, p.custom_variables as "customVariables",
             COALESCE((
               SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'priceOverride', pv.price_override))
               FROM product_variants pv WHERE pv.product_id = p.id
             ), '[]'::json) as variants
      FROM products p
      WHERE p.tenant_id = $1 AND p.id = ANY($2::uuid[]) AND p.active = TRUE
    `, [tenant.id, productIds]);
    const dbProductsMap = new Map(dbProductsRes.rows.map((p) => [p.id, p]));
    const formattedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const pid = item.productId || item.id;
      const dbProduct = dbProductsMap.get(pid);
      if (!dbProduct) {
        res.status(400).json({ error: `El producto "${item.productName || item.name || "solicitado"}" no est\xE1 disponible o no existe en esta tienda.` });
        return;
      }
      let verifiedPrice = Number(dbProduct.price || 0);
      if (item.variantId || item.variantName) {
        const matchedVariant = (dbProduct.variants || []).find(
          (v) => item.variantId && v.id === item.variantId || item.variantName && v.name.toLowerCase() === item.variantName.toLowerCase()
        );
        if (matchedVariant && matchedVariant.priceOverride !== null && matchedVariant.priceOverride !== void 0) {
          verifiedPrice = Number(matchedVariant.priceOverride);
        }
      }
      if (item.selectedVariables && Array.isArray(dbProduct.customVariables)) {
        for (const cv of dbProduct.customVariables) {
          const selectedVal = item.selectedVariables[cv.name];
          if (selectedVal && Array.isArray(cv.options)) {
            const vals = Array.isArray(selectedVal) ? selectedVal : [selectedVal];
            for (const v of vals) {
              const opt = cv.options.find((o) => o.name === v);
              if (opt && opt.price && Number(opt.price) > 0) {
                verifiedPrice += Number(opt.price);
              }
            }
          }
        }
      }
      const qty = Math.max(1, parseInt(item.quantity || "1", 10));
      const lineTotal = verifiedPrice * qty;
      subtotal += lineTotal;
      formattedItems.push({
        productId: dbProduct.id,
        productName: item.productName || item.name || dbProduct.name,
        variantName: item.variantName || null,
        selectedVariables: item.selectedVariables || void 0,
        quantity: qty,
        unitPrice: verifiedPrice,
        totalPrice: lineTotal
      });
    }
    const isDelivery = consumptionMode === "delivery" || deliveryMethod === "delivery";
    const deliveryFee = isDelivery && store?.deliveryEnabled ? Number(store.deliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;
    const order = await createOrder(
      tenant.id,
      {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress: customerAddress || null,
        customerLocation: customerLocation || null,
        consumptionMode: consumptionMode || (isDelivery ? "delivery" : "pickup"),
        tableNumber: tableNumber || null,
        source: "store",
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus: paymentProofUrl || paymentReference ? "proof_sent" : "pending",
        paymentReference: paymentReference || null,
        paymentProofUrl: paymentProofUrl || null,
        paymentProofStatus: paymentProofUrl ? "received" : "pending",
        deliveryMethod: isDelivery ? "delivery" : "pickup",
        notes: notes || null,
        status: "pedido_recibido"
      },
      formattedItems
    );
    if (req.body.branchId) {
      const branchCheck = await query(
        `SELECT id FROM branches WHERE id = $1 AND tenant_id = $2`,
        [req.body.branchId, tenant.id]
      );
      if (branchCheck.rows.length > 0) {
        await query(`UPDATE orders SET branch_id = $1 WHERE id = $2 AND tenant_id = $3`, [req.body.branchId, order.id, tenant.id]);
      }
    }
    let tilopaySession = null;
    if (paymentMethod === "card" || paymentMethod === "tilopay") {
      try {
        tilopaySession = await TilopayTenantService.createPaymentSession(tenant.id, order.id);
      } catch (sessErr) {
        console.error("[StorefrontCheckout] Error al inicializar sesi\xF3n Tilopay:", sessErr.message);
        res.status(400).json({
          error: `No fue posible conectar con la pasarela de pagos con tarjeta: ${sessErr.message}. Por favor intenta de nuevo o selecciona otro m\xE9todo de pago.`
        });
        return;
      }
    }
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("order:created", {
        ...order,
        branchId: req.body.branchId || null,
        items: formattedItems,
        storeName
      });
    }
    const orderCode = `#ORD-${order.orderNumber}`;
    let cleanCustomerPhone = customerPhone.replace(/\D/g, "");
    if (cleanCustomerPhone.length === 8) cleanCustomerPhone = "506" + cleanCustomerPhone;
    const itemsSummary = formattedItems.map((i) => `\u2022 ${i.quantity}x ${i.productName} (\u20A1${i.totalPrice.toLocaleString("es-CR")})`).join("\n");
    let modeText = "Retiro en Local / Tienda";
    if (consumptionMode === "dine_in") {
      modeText = `\u{1F37D}\uFE0F Comer en el Local ${tableNumber ? `(Mesa #${tableNumber})` : ""}`;
    } else if (consumptionMode === "delivery" || isDelivery) {
      modeText = `\u{1F6F5} Env\xEDo a Domicilio (${customerAddress || "Direcci\xF3n indicada"})`;
      if (customerLocation?.mapsUrl) {
        modeText += `
\u{1F4CD} *Ubicaci\xF3n GPS:* ${customerLocation.mapsUrl}`;
      }
    } else {
      modeText = `\u{1F961} Para Llevar / Retiro en Local`;
    }
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const customReceived = store?.notificationTemplates?.orderReceived;
      let customerMsg = customReceived || `\u{1F6CD}\uFE0F *\xA1Pedido Confirmado en ${storeName}!*

Hola *${customerName}*, hemos recibido tu orden con el c\xF3digo *${orderCode}*.

\u{1F4E6} *Detalle del Pedido:*
${itemsSummary}

\u{1F4B5} *Subtotal:* \u20A1${subtotal.toLocaleString("es-CR")}
${deliveryFee > 0 ? `\u{1F6F5} *Env\xEDo Express:* \u20A1${deliveryFee.toLocaleString("es-CR")}
` : ""}\u{1F4B0} *Total:* \u20A1${total.toLocaleString("es-CR")}

\u{1F4CC} *Modalidad de Entrega / Consumo:*
${modeText}

\u{1F4B3} *M\xE9todo de Pago:* ${paymentMethod === "sinpe" ? "SINPE M\xF3vil" : paymentMethod === "transfer" ? "Transferencia Bancaria" : "Efectivo / Pago al recibir"}
${paymentReference ? `\u{1F4C4} *Referencia:* ${paymentReference}
` : ""}${paymentProofUrl ? "\u{1F4F8} *Comprobante Adjunto:* Recibido \u2713\n" : paymentMethod === "sinpe" || paymentMethod === "transfer" ? "\n\u{1F4F8} *IMPORTANTE:* Por favor env\xEDa la foto o captura de tu comprobante a este chat para verificar tu pago y proceder con la preparaci\xF3n de tu orden.\n" : ""}
\u{1F449} En breve confirmaremos el inicio de preparaci\xF3n. \xA1Muchas gracias por tu preferencia!`;
      customerMsg = customerMsg.replace(/{cliente}/g, customerName).replace(/{pedido}/g, String(order.orderNumber)).replace(/{tienda}/g, storeName).replace(/{total}/g, `\u20A1${total.toLocaleString("es-CR")}`);
      try {
        await sendMessage(tenant.evolutionInstance, cleanCustomerPhone, customerMsg);
      } catch (err) {
        console.error("Error sending customer WhatsApp confirmation:", err);
      }
    }
    const adminPhone = store?.sinpePhone || tenant.whatsappNumber;
    if (tenant.evolutionInstance && adminPhone) {
      let cleanAdminPhone = adminPhone.replace(/\D/g, "");
      if (cleanAdminPhone.length === 8) cleanAdminPhone = "506" + cleanAdminPhone;
      const adminAlert = `\u{1F514} *\xA1NUEVO PEDIDO RECIBIDO!* ${orderCode}

\u{1F464} *Cliente:* ${customerName} (${customerPhone})
\u{1F4CC} *Modalidad:* ${modeText}
\u{1F4B0} *Total:* \u20A1${total.toLocaleString("es-CR")} (${paymentMethod.toUpperCase()})
${paymentReference ? `\u{1F4C4} *Comprobante:* ${paymentReference}
` : ""}
\u{1F4E6} *Productos / Platillos:*
${itemsSummary}
${notes ? `
\u{1F4DD} *Notas:* ${notes}` : ""}

_Gestiona este pedido en tiempo real desde tu Panel de Betico._`;
      try {
        await sendMessage(tenant.evolutionInstance, cleanAdminPhone, adminAlert);
      } catch (err) {
        console.error("Error sending admin WhatsApp alert:", err);
      }
    }
    await query(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'store_order_created', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenant.id,
      cleanCustomerPhone,
      `Pedido ${orderCode} creado desde cat\xE1logo web`
    ]);
    res.status(201).json({
      ...order,
      orderCode,
      storeName,
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone,
      tilopaySession
    });
  } catch (error) {
    console.error("Storefront checkout error:", error);
    res.status(500).json({ error: "Error procesando checkout" });
  }
});
var storefront_routes_default = router16;

// src/server/routes/webhook.routes.ts
import { Router as Router17 } from "express";
init_evolution();
init_pool();

// src/server/services/audio-transcriber.service.ts
init_env();
var DEFAULT_GEMINI_KEY2 = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || "AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ";
async function transcribeAudioWithGemini(base64Audio, mimetype = "audio/ogg", apiKey) {
  try {
    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, "").trim();
    if (!cleanBase64) {
      return { success: false, text: "", error: "Audio base64 vac\xEDo" };
    }
    const key = apiKey || DEFAULT_GEMINI_KEY2;
    const cleanMime = (mimetype || "audio/ogg").split(";")[0].trim();
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
    for (const modelName of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: cleanMime,
                      data: cleanBase64
                    }
                  },
                  {
                    text: "Por favor transcribe con exactitud lo que dice este mensaje de voz o audio en espa\xF1ol (Costa Rica / Latinoam\xE9rica). Devuelve \xFAnicamente el texto exacto sin saludos, explicaciones ni comentarios adicionales."
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (candidateText) {
            console.log(`[AudioTranscriber] Transcribed audio successfully (${candidateText.length} chars): "${candidateText}"`);
            return { success: true, text: candidateText };
          }
        } else {
          const errText = await response.text();
          console.warn(`[AudioTranscriber] Model ${modelName} returned status ${response.status}: ${errText}`);
        }
      } catch (err) {
        console.warn(`[AudioTranscriber] Error trying ${modelName}:`, err.message);
      }
    }
    return { success: false, text: "", error: "No se pudo transcribir el audio con los modelos disponibles" };
  } catch (error) {
    console.error("[AudioTranscriber] Fatal transcription error:", error);
    return { success: false, text: "", error: error.message || "Error desconocido" };
  }
}
async function transcribeAudioWithWhisper(base64Audio, mimetype = "audio/ogg") {
  try {
    const LOCALAI_URL = process.env.LOCALAI_URL || "https://beticoia-localai.qvtdko.easypanel.host/v1";
    const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, "").trim();
    if (!cleanBase64) return { success: false, text: "", error: "Audio base64 vac\xEDo" };
    const audioBuffer = Buffer.from(cleanBase64, "base64");
    const ext = mimetype.includes("ogg") ? "ogg" : mimetype.includes("mp3") ? "mp3" : mimetype.includes("mp4") ? "mp4" : "ogg";
    const blob = new Blob([audioBuffer], { type: mimetype });
    const formData = new FormData();
    formData.append("file", blob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("language", "es");
    const response = await fetch(`${LOCALAI_URL}/audio/transcriptions`, {
      method: "POST",
      headers: { "Authorization": "Bearer localai" },
      body: formData
    });
    if (response.ok) {
      const data = await response.json();
      const text = data.text?.trim() || "";
      if (text) {
        console.log(`[AudioTranscriber] Whisper transcribed: "${text}"`);
        return { success: true, text };
      }
    }
    console.warn(`[AudioTranscriber] Whisper failed (${response.status}), falling back to Gemini...`);
    return { success: false, text: "", error: `Whisper returned ${response.status}` };
  } catch (error) {
    console.warn("[AudioTranscriber] Whisper error, falling back to Gemini:", error.message);
    return { success: false, text: "", error: error.message };
  }
}
async function transcribeAudio(base64Audio, mimetype = "audio/ogg", apiKey) {
  const whisperResult = await transcribeAudioWithWhisper(base64Audio, mimetype);
  if (whisperResult.success) return whisperResult;
  console.log("[AudioTranscriber] Falling back to Gemini for transcription...");
  return transcribeAudioWithGemini(base64Audio, mimetype, apiKey);
}

// src/server/routes/webhook.routes.ts
var router17 = Router17();
router17.post("/", async (req, res) => {
  res.status(200).json({ status: "received" });
  try {
    const payload = req.body || {};
    const event = (payload.event || "").toLowerCase();
    const instanceName = payload.instance || payload.instanceName;
    console.log(`[Webhook] Received event: '${event}' for instance: '${instanceName}'`);
    if (event !== "messages.upsert") {
      return;
    }
    let data = payload.data;
    if (Array.isArray(data?.messages) && data.messages.length > 0) {
      data = data.messages[0];
    } else if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }
    if (!data) {
      return;
    }
    const key = data.key || {};
    const remoteJid = key.remoteJid || key.remoteJidAlt || "";
    const fromMe = key.fromMe || false;
    const pushName = data.pushName || "Cliente";
    const cleanPhone = remoteJid.replace(/@.+$/, "").replace(/\D/g, "");
    if (remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      return;
    }
    const isAudioMsg = data?.message?.audioMessage || data?.message?.pttMessage || data?.messageType === "audioMessage";
    let isVoiceNote = false;
    let userMessage = (data?.message?.conversation || data?.message?.extendedTextMessage?.text || data?.message?.imageMessage?.caption || data?.message?.videoMessage?.caption || data?.message?.text || "").trim();
    const loc = data?.message?.locationMessage || data?.message?.liveLocationMessage;
    if (loc?.degreesLatitude && loc?.degreesLongitude) {
      const mapsUrl = `https://maps.google.com/?q=${loc.degreesLatitude},${loc.degreesLongitude}`;
      userMessage = `\u{1F4CD} [Ubicaci\xF3n Compartida]: ${mapsUrl} (${loc.name || loc.address || "Ubicaci\xF3n GPS"})`;
    }
    if ((instanceName === "betico_ventas" || instanceName === "betico_soporte") && !fromMe) {
      const { processSuperadminWhatsAppMessage: processSuperadminWhatsAppMessage2 } = await Promise.resolve().then(() => (init_superadmin_bot_service(), superadmin_bot_service_exports));
      await processSuperadminWhatsAppMessage2({
        instanceName,
        remoteJid,
        pushName,
        userMessage
      });
      return;
    }
    let tenant = null;
    if (instanceName) {
      tenant = await getTenantByEvolutionInstance(instanceName);
    }
    if (!tenant) {
      const all = await getAllTenants();
      tenant = all.find((t) => t.slug !== "superadmin") || all[0] || null;
    }
    if (!tenant || !tenant.active) {
      console.warn(`[Webhook] No active tenant found for instance: ${instanceName}`);
      return;
    }
    const targetInstance = tenant.evolutionInstance || instanceName || `tenant_${tenant.id.slice(0, 8)}`;
    if (isAudioMsg && !fromMe) {
      console.log(`[Webhook] Detected Voice Note / Audio from ${remoteJid}! Fetching media base64...`);
      let base64Audio = data?.base64 || data?.message?.base64;
      const audioMime = data?.message?.audioMessage?.mimetype || "audio/ogg";
      if (!base64Audio) {
        const mediaRes = await getBase64FromMediaMessage(targetInstance, key, data.message);
        if (mediaRes.base64) {
          base64Audio = mediaRes.base64;
        }
      }
      if (base64Audio) {
        const transcription = await transcribeAudio(base64Audio, audioMime);
        if (transcription.success && transcription.text) {
          userMessage = transcription.text;
          isVoiceNote = true;
          console.log(`[Webhook] Voice note transcribed successfully: "${userMessage}"`);
        }
      }
    }
    const isImageMsg = data?.message?.imageMessage || data?.messageType === "imageMessage";
    if (isImageMsg && !fromMe) {
      console.log(`[Webhook] Detected Image from ${remoteJid}!`);
      const pendingOrderRes = await query(`
        SELECT id, order_number as "orderNumber", total, customer_name as "customerName", status, payment_status as "paymentStatus"
        FROM orders
        WHERE tenant_id = $1 
          AND (whatsapp_jid = $2 OR customer_phone LIKE $3)
          AND payment_status IN ('pending', 'proof_sent')
        ORDER BY created_at DESC
        LIMIT 1
      `, [tenant.id, remoteJid, `%${cleanPhone.slice(-8)}%`]);
      if (pendingOrderRes.rows.length > 0) {
        const pendingOrder = pendingOrderRes.rows[0];
        console.log(`[Webhook] Found pending order #${pendingOrder.orderNumber} for ${cleanPhone}. Marking proof_sent for manual verification.`);
        await query(`
          UPDATE orders 
          SET payment_status = 'proof_sent', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND tenant_id = $2
        `, [pendingOrder.id, tenant.id]);
        if (req.io) {
          req.io.to(`tenant_${tenant.id}`).emit("order:updated", {
            id: pendingOrder.id,
            orderNumber: pendingOrder.orderNumber,
            status: pendingOrder.status,
            paymentStatus: "proof_sent"
          });
        }
        const receiptReply = `\u{1F4E9} *Comprobante Recibido*

Hemos recibido tu comprobante para el pedido *#${pendingOrder.orderNumber}* (\u20A1${Number(pendingOrder.total).toLocaleString("es-CR")}). Nuestro equipo lo verificar\xE1 y confirmaremos tu pedido en breve. \xA1Gracias! \u2705`;
        await sendMessage(targetInstance, cleanPhone, receiptReply);
        await saveChatMessage(tenant.id, {
          id: `sinpe_${Date.now()}`,
          remoteJid,
          pushName: "Sistema Pagos",
          fromMe: true,
          messageText: receiptReply,
          aiResponse: receiptReply,
          status: "sent"
        });
        return;
      }
      if (!userMessage) {
        userMessage = data?.message?.imageMessage?.caption || "Foto enviada por el cliente";
      }
    }
    console.log(`[Webhook] Parsed message from ${remoteJid} (${pushName}): "${userMessage}" [fromMe=${fromMe}]`);
    if (!userMessage) {
      return;
    }
    const msgId = key.id || `msg_${Date.now()}`;
    if (fromMe) {
      await saveChatMessage(tenant.id, {
        id: msgId,
        remoteJid,
        pushName: "Operador / Asistente",
        fromMe: true,
        messageText: userMessage,
        status: "sent"
      });
      return;
    }
    await saveChatMessage(tenant.id, {
      id: msgId,
      remoteJid,
      pushName,
      fromMe: false,
      messageText: userMessage,
      status: "received"
    });
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("chat:message", {
        id: msgId,
        tenantId: tenant.id,
        remoteJid,
        pushName,
        fromMe: false,
        messageText: userMessage,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const session = await getChatSession(tenant.id, remoteJid);
    if (session?.isHumanMode) {
      console.log(`[Webhook] Chat ${remoteJid} is in HUMAN MODE. Skipping AI auto-reply.`);
      return;
    }
    const agentConfig = await getAgentConfig(tenant.id);
    const handoffEnabled = agentConfig?.humanHandoffEnabled !== false;
    const defaultKeywords = ["humano", "asesor", "persona", "agente", "hablar con alguien", "queja", "reclamo", "urgente"];
    const keywords = agentConfig?.handoffKeywords || defaultKeywords;
    const lowerMsg = userMessage.toLowerCase();
    const isKeywordTriggered = handoffEnabled && keywords.some((k) => lowerMsg.includes(k.toLowerCase().trim()));
    if (agentConfig?.aiChatbotEnabled === false) {
      console.log(`[Webhook] AI Chatbot is DISABLED for tenant '${tenant.name}'. Operating in Notifications-Only mode.`);
      return;
    }
    if (handoffEnabled && isKeywordTriggered) {
      console.log(`[Webhook] Human Handoff keyword triggered for ${remoteJid}!`);
      await setChatHumanMode(tenant.id, remoteJid, true);
      const customerHandoffReply = `\u{1F464} *Atenci\xF3n Personalizada:* Entendido *${pushName}*, te estamos comunicando con un asesor humano para atenderte directamente. En breve te responder\xE1.`;
      await sendMessage(targetInstance, cleanPhone, customerHandoffReply);
      await saveChatMessage(tenant.id, {
        id: `ai_${Date.now()}`,
        remoteJid,
        pushName: "Asistente IA",
        fromMe: true,
        messageText: customerHandoffReply,
        aiResponse: customerHandoffReply,
        status: "sent"
      });
      const adminPhone = (agentConfig?.handoffNotifyPhone || tenant.whatsappNumber || "").replace(/\D/g, "");
      if (adminPhone) {
        const alertMsg = `\u{1F6A8} *\xA1ATENCI\xD3N HUMANA REQUERIDA!*

\u{1F464} *Cliente:* ${pushName} (${cleanPhone})
\u{1F4DD} *Motivo:* El cliente escribi\xF3: "${userMessage}"

\u{1F449} _La IA ha sido pausada. Responde desde WhatsApp o tu Panel de Betico._`;
        try {
          await sendMessage(targetInstance, adminPhone, alertMsg);
        } catch (e) {
        }
      }
      return;
    }
    console.log(`[Webhook] Enqueueing message for AI processing: tenant='${tenant.name}', from=${pushName}`);
    await enqueueMessage(tenant.id, remoteJid, pushName, cleanPhone, userMessage, targetInstance, isVoiceNote);
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("queue:updated", { tenantId: tenant.id });
    }
  } catch (error) {
    console.error("[Webhook] Error processing incoming WhatsApp webhook:", error);
  }
});
var webhook_routes_default = router17;

// src/server/routes/calendar.routes.ts
import { Router as Router18 } from "express";
var router18 = Router18();
function normalizeDateStr(dateVal) {
  if (!dateVal) return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split("T")[0];
  }
  return String(dateVal).split("T")[0].trim();
}
function formatICSDate(dateVal, timeVal) {
  const dateStr = normalizeDateStr(dateVal);
  const cleanDate = dateStr.replace(/\D/g, "");
  const timeStr = String(timeVal || "09:00").trim();
  const [h = "09", m = "00"] = timeStr.split(":");
  return `${cleanDate}T${h.padStart(2, "0")}${m.padStart(2, "0")}00`;
}
function calculateEndTime(dateVal, timeVal, durationMinutes = 45) {
  const dateStr = normalizeDateStr(dateVal);
  const cleanDate = dateStr.replace(/\D/g, "");
  const timeStr = String(timeVal || "09:00").trim();
  const [hStr = "09", mStr = "00"] = timeStr.split(":");
  const hours = parseInt(hStr, 10) || 9;
  const minutes = parseInt(mStr, 10) || 0;
  const totalMinutes = hours * 60 + minutes + (durationMinutes || 45);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${cleanDate}T${String(endHours).padStart(2, "0")}${String(endMins).padStart(2, "0")}00`;
}
function escapeICSText(text) {
  if (!text) return "";
  return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
router18.get("/:slug.ics", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).send("Negocio no encontrado");
      return;
    }
    const appointments = await getAppointmentsByTenant(tenant.id);
    const services = await getServicesByTenant(tenant.id);
    const serviceDurationMap = /* @__PURE__ */ new Map();
    if (Array.isArray(services)) {
      services.forEach((s) => {
        if (s?.name) {
          serviceDurationMap.set(String(s.name).toLowerCase().trim(), s.estimatedMinutes || 45);
        }
      });
    }
    const nowICS = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const calName = escapeICSText(`Citas - ${tenant.name}`);
    let icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Betico SaaS//Agenda Citas v1.0//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${calName}`,
      "X-WR-TIMEZONE:America/Costa_Rica",
      "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
      "X-PUBLISHED-TTL:PT15M"
    ];
    const activeAppts = Array.isArray(appointments) ? appointments.filter((a) => a && a.status !== "cancelled") : [];
    for (const appt of activeAppts) {
      const dtStart = formatICSDate(appt.date, appt.time);
      const svcKey = String(appt.service || "").toLowerCase().trim();
      const duration = serviceDurationMap.get(svcKey) || 45;
      const dtEnd = calculateEndTime(appt.date, appt.time, duration);
      const summary = escapeICSText(`Cita reservada: ${appt.service || "Servicio"}`);
      const descLines = [
        `\u{1F6E0}\uFE0F Servicio: ${appt.service || "Servicio"}`,
        `\u23F1\uFE0F Duraci\xF3n estimada: ${duration} min`,
        `\u{1F4CC} Estado: ${appt.status === "confirmed" ? "Confirmada" : "Programada"}`
      ].filter(Boolean).join("\n");
      const escapedDesc = escapeICSText(descLines);
      icsContent.push("BEGIN:VEVENT");
      icsContent.push(`UID:appt_${appt.id}@betico.cr`);
      icsContent.push(`DTSTAMP:${nowICS}`);
      icsContent.push(`DTSTART:${dtStart}`);
      icsContent.push(`DTEND:${dtEnd}`);
      icsContent.push(`SUMMARY:${summary}`);
      icsContent.push(`DESCRIPTION:${escapedDesc}`);
      icsContent.push(`STATUS:${appt.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"}`);
      icsContent.push("END:VEVENT");
    }
    icsContent.push("END:VCALENDAR");
    const result = icsContent.join("\r\n");
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${tenant.slug}-citas.ics"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(result);
  } catch (error) {
    console.error("Error generating iCal feed:", error);
    res.status(500).send("Error generando calendario");
  }
});
router18.get("/:slug", (req, res) => {
  res.redirect(`/api/calendar/${req.params.slug}.ics`);
});
var calendar_routes_default = router18;

// src/server/routes/drivers.routes.ts
import { Router as Router19 } from "express";
init_drivers_repo();
init_evolution();
init_pool();
var router19 = Router19();
function normalizeCostaRicaPhone2(phone) {
  let clean = (phone || "").replace(/\D/g, "");
  if (clean.length === 8) {
    clean = "506" + clean;
  }
  return clean;
}
async function resolveInstanceName2(tenantId) {
  const tenant = await getTenantById(tenantId);
  if (tenant?.evolutionInstance) return tenant.evolutionInstance;
  const anyActiveInstance = await query(`SELECT evolution_instance FROM tenants WHERE evolution_instance IS NOT NULL AND evolution_instance != '' LIMIT 1`);
  if (anyActiveInstance.rows.length > 0) {
    return anyActiveInstance.rows[0].evolution_instance;
  }
  return void 0;
}
router19.post("/portal/login", async (req, res) => {
  try {
    const { pin, phone } = req.body;
    if (!pin) {
      res.status(400).json({ error: "PIN requerido" });
      return;
    }
    const driver = await getDriverByPin(pin, phone);
    if (!driver) {
      res.status(401).json({ error: "C\xF3digo PIN no encontrado o incorrecto" });
      return;
    }
    const tenant = await getTenantById(driver.tenantId);
    const storeSettings = await getStoreSettings(driver.tenantId);
    res.json({
      success: true,
      driver: {
        id: driver.id,
        tenantId: driver.tenantId,
        name: driver.name,
        phone: driver.phone,
        accessPin: driver.accessPin,
        vehicleType: driver.vehicleType,
        plateNumber: driver.plateNumber,
        businessName: storeSettings?.storeName || tenant?.name || "Comercio"
      }
    });
  } catch (error) {
    console.error("Driver portal login error:", error);
    res.status(500).json({ error: "Error al iniciar sesi\xF3n" });
  }
});
router19.get("/portal/orders", async (req, res) => {
  try {
    const pin = req.headers["x-driver-pin"] || req.query.pin;
    if (!pin) {
      res.status(401).json({ error: "PIN de repartidor no provisto" });
      return;
    }
    const driver = await getDriverByPin(pin);
    if (!driver) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    const orders = await getActiveOrdersForDriver(driver.id);
    res.json({ orders, driverName: driver.name });
  } catch (error) {
    console.error("Driver portal orders error:", error);
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
});
router19.get("/portal/history", async (req, res) => {
  try {
    const pin = req.headers["x-driver-pin"] || req.query.pin;
    const { fromDate, toDate } = req.query;
    if (!pin) {
      res.status(401).json({ error: "PIN no provisto" });
      return;
    }
    const driver = await getDriverByPin(pin);
    if (!driver) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    const { getCompletedOrdersForDriver: getCompletedOrdersForDriver2 } = await Promise.resolve().then(() => (init_drivers_repo(), drivers_repo_exports));
    const orders = await getCompletedOrdersForDriver2(driver.id, fromDate, toDate);
    const totalEarnings = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    res.json({
      orders,
      totalCount: orders.length,
      totalEarnings,
      driverName: driver.name
    });
  } catch (error) {
    console.error("Driver portal history error:", error);
    res.status(500).json({ error: "Error al consultar historial de entregas" });
  }
});
router19.post("/portal/orders/:id/deliver", async (req, res) => {
  try {
    const pin = req.headers["x-driver-pin"] || req.body.pin;
    if (!pin) {
      res.status(401).json({ error: "PIN de repartidor no provisto" });
      return;
    }
    const driver = await getDriverByPin(pin);
    if (!driver) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    const orderId = req.params.id;
    const order = await getOrderById(orderId, driver.tenantId);
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    const updated = await updateOrder(orderId, driver.tenantId, {
      status: "entregado",
      paymentStatus: order.paymentStatus === "pending" && order.paymentMethod === "cash" ? "paid" : order.paymentStatus
    });
    const tenant = await getTenantById(driver.tenantId);
    const storeSettings = await getStoreSettings(driver.tenantId);
    const instanceName = await resolveInstanceName2(driver.tenantId);
    const cleanCustomerPhone = normalizeCostaRicaPhone2(order.customerPhone || "");
    if (instanceName && cleanCustomerPhone) {
      const customTpl = storeSettings?.notificationTemplates?.orderDelivered;
      let deliveredMsg = customTpl || `\u{1F389} *\xA1Tu pedido ha sido entregado con \xE9xito!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* ha sido entregada por nuestro repartidor *{repartidor}*.

\xA1Muchas gracias por tu preferencia! Esperamos que lo disfrutes. \u2B50`;
      deliveredMsg = deliveredMsg.replace(/{cliente}/g, order.customerName).replace(/{pedido}/g, String(order.orderNumber)).replace(/{tienda}/g, storeSettings?.storeName || tenant?.name || "Nuestro Comercio").replace(/{total}/g, `\u20A1${Number(order.total).toLocaleString("es-CR")}`).replace(/{repartidor}/g, driver.name);
      await sendMessage(instanceName, cleanCustomerPhone, deliveredMsg);
    }
    res.json({ success: true, order: updated });
  } catch (error) {
    console.error("Driver deliver error:", error);
    res.status(500).json({ error: "Error al marcar como entregado" });
  }
});
router19.use(authenticateToken);
router19.use(tenantContext);
router19.get("/", async (req, res) => {
  try {
    let drivers = await getDriversByTenant(req.tenantId);
    if (req.user?.role === "superadmin") {
      const allRes = await query(`
        SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
               vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
        FROM delivery_drivers
        ORDER BY created_at DESC
      `);
      drivers = allRes.rows;
    }
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener repartidores" });
  }
});
router19.post("/", async (req, res) => {
  try {
    const driver = await createDriver(req.tenantId, req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar repartidor" });
  }
});
router19.put("/:id", async (req, res) => {
  try {
    const driver = await updateDriver(req.params.id, req.tenantId, req.body);
    if (!driver) {
      if (req.user?.role === "superadmin") {
        const check = await query(`
          UPDATE delivery_drivers
          SET name = COALESCE($2, name),
              phone = COALESCE($3, phone),
              access_pin = COALESCE($4, access_pin),
              vehicle_type = COALESCE($5, vehicle_type),
              plate_number = COALESCE($6, plate_number),
              active = COALESCE($7, active)
          WHERE id = $1
          RETURNING id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
                    vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
        `, [req.params.id, req.body.name, req.body.phone, req.body.accessPin, req.body.vehicleType, req.body.plateNumber, req.body.active]);
        if (check.rows.length > 0) {
          res.json(check.rows[0]);
          return;
        }
      }
      res.status(404).json({ error: "Repartidor no encontrado" });
      return;
    }
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar repartidor" });
  }
});
router19.delete("/:id", async (req, res) => {
  try {
    const ok = await deleteDriver(req.params.id, req.tenantId);
    res.json({ success: ok });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar repartidor" });
  }
});
router19.post("/:id/send-welcome", async (req, res) => {
  try {
    const driver = await getDriverById(req.params.id, req.tenantId);
    if (!driver) {
      res.status(404).json({ error: "Repartidor no encontrado" });
      return;
    }
    const tenant = await getTenantById(req.tenantId);
    const storeSettings = await getStoreSettings(req.tenantId);
    const instanceName = await resolveInstanceName2(req.tenantId);
    const cleanDriverPhone = normalizeCostaRicaPhone2(driver.phone);
    const appOrigin = process.env.APP_URL || "https://betico-app.qvtdko.easypanel.host";
    const driverPortalUrl = `${appOrigin}/repartidor?pin=${driver.accessPin || "1234"}`;
    const businessName = storeSettings?.storeName || tenant?.name || "Nuestro Comercio";
    const welcomeMsg = `\u{1F44B} *\xA1Hola ${driver.name}!*

Has sido registrado como repartidor en *${businessName}*.

\u{1F511} *Tu C\xF3digo PIN de Acceso:* *${driver.accessPin || "1234"}*
\u{1F4F2} *Tu Enlace de Entregas:* ${driverPortalUrl}

Ingresa al enlace para ver tus pedidos asignados, abrir rutas en Waze y marcar entregas en tiempo real. \u{1F6F5}\u{1F4A8}`;
    if (instanceName && cleanDriverPhone) {
      await sendMessage(instanceName, cleanDriverPhone, welcomeMsg);
      res.json({ success: true, message: "WhatsApp de bienvenida enviado con \xE9xito", driverPortalUrl });
    } else {
      res.json({ success: false, error: "No hay instancia de WhatsApp activa o tel\xE9fono inv\xE1lido", driverPortalUrl });
    }
  } catch (error) {
    console.error("Send welcome error:", error);
    res.status(500).json({ error: "Error enviando mensaje de bienvenida" });
  }
});
router19.post("/:id/dispatch-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    const driver = await getDriverById(req.params.id, req.tenantId);
    if (!driver) {
      res.status(404).json({ error: "Repartidor no encontrado" });
      return;
    }
    const order = await getOrderById(orderId, req.tenantId);
    if (!order) {
      res.status(404).json({ error: "Pedido no encontrado" });
      return;
    }
    const tenant = await getTenantById(req.tenantId);
    const storeSettings = await getStoreSettings(req.tenantId);
    const instanceName = await resolveInstanceName2(req.tenantId);
    let wazeUrl = "";
    let mapsUrl = order.customerLocation?.mapsUrl || "";
    if (order.customerLocation?.lat && order.customerLocation?.lng) {
      wazeUrl = `https://waze.com/ul?ll=${order.customerLocation.lat},${order.customerLocation.lng}&navigate=yes`;
      if (!mapsUrl) {
        mapsUrl = `https://maps.google.com/?q=${order.customerLocation.lat},${order.customerLocation.lng}`;
      }
    }
    await updateOrder(orderId, req.tenantId, {
      status: "en_camino",
      driverId: driver.id,
      wazeUrl
    });
    const cleanDriverPhone = normalizeCostaRicaPhone2(driver.phone);
    const cleanCustomerPhone = normalizeCostaRicaPhone2(order.customerPhone || "");
    const itemsList = (order.items || []).map((i) => `\u2022 ${i.quantity}x ${i.productName}`).join("\n");
    const appOrigin = process.env.APP_URL || "https://betico-app.qvtdko.easypanel.host";
    const driverPortalUrl = `${appOrigin}/repartidor?pin=${driver.accessPin || "1234"}`;
    const customDispatchTpl = storeSettings?.notificationTemplates?.driverDispatch;
    let dispatchMsg = customDispatchTpl || `\u{1F6F5} *NUEVA ENTREGA ASIGNADA* (#ORD-{pedido})

Hola *{repartidor}*, tienes un nuevo pedido para entregar:

\u{1F464} *Cliente:* {cliente}
\u{1F4DE} *Tel\xE9fono Cliente:* {telefono}
\u{1F4CD} *Direcci\xF3n:* {direccion}

{waze_line}{maps_line}
\u{1F4E6} *Platillos / Productos:*
{productos}

\u{1F4B0} *Cobro al Cliente:* {cobro}
{notas_line}

\u{1F4F2} *Tu Portal de Repartidor:*
${driverPortalUrl}`;
    const cobroText = order.paymentStatus === "paid" ? "\u2705 Ya pagado (No cobrar)" : `\u20A1${Number(order.total).toLocaleString("es-CR")} (Cobrar al entregar)`;
    const wazeLine = wazeUrl ? `\u{1F697} *Abrir en Waze:* ${wazeUrl}
` : "";
    const mapsLine = mapsUrl ? `\u{1F5FA}\uFE0F *Abrir en Google Maps:* ${mapsUrl}
` : "";
    const notasLine = order.notes ? `
\u{1F4DD} *Notas:* ${order.notes}` : "";
    dispatchMsg = dispatchMsg.replace(/{pedido}/g, String(order.orderNumber)).replace(/{repartidor}/g, driver.name).replace(/{cliente}/g, order.customerName).replace(/{telefono}/g, order.customerPhone || "No registrado").replace(/{direccion}/g, order.customerAddress || "Ver mapa GPS").replace(/{waze_line}/g, wazeLine).replace(/{maps_line}/g, mapsLine).replace(/{productos}/g, itemsList).replace(/{cobro}/g, cobroText).replace(/{notas_line}/g, notasLine);
    if (instanceName && cleanDriverPhone) {
      await sendMessage(instanceName, cleanDriverPhone, dispatchMsg);
    }
    if (instanceName && cleanCustomerPhone) {
      const customInTransitTpl = storeSettings?.notificationTemplates?.orderInTransit;
      let inTransitMsg = customInTransitTpl || `\u{1F6F5} *\xA1Tu pedido ya va en camino!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* acaba de salir y va en camino con nuestro repartidor *{repartidor}*.

\u{1F4B0} *Monto a pagar al recibir:* {cobro}
\xA1Pronto estaremos en tu puerta! \u{1F680}`;
      inTransitMsg = inTransitMsg.replace(/{cliente}/g, order.customerName).replace(/{pedido}/g, String(order.orderNumber)).replace(/{tienda}/g, storeSettings?.storeName || tenant?.name || "Nuestro Comercio").replace(/{repartidor}/g, driver.name).replace(/{cobro}/g, order.paymentStatus === "paid" ? "\u2705 Ya cancelado" : `\u20A1${Number(order.total).toLocaleString("es-CR")}`);
      await sendMessage(instanceName, cleanCustomerPhone, inTransitMsg);
    }
    res.json({
      success: true,
      wazeUrl,
      mapsUrl,
      driverPortalUrl,
      driverName: driver.name,
      dispatchedPhone: cleanDriverPhone
    });
  } catch (error) {
    console.error("Dispatch error:", error);
    res.status(500).json({ error: "Error al despachar pedido al repartidor" });
  }
});
var drivers_routes_default = router19;

// src/server/routes/superadmin-metrics.routes.ts
import { Router as Router20 } from "express";
import os from "os";
init_pool();
var router20 = Router20();
router20.use(authenticateToken);
router20.use(requireSuperAdmin);
var PLAN_PRICING = {
  starter: { crc: 15e3, usd: 30, name: "Plan Starter" },
  pro: { crc: 35e3, usd: 70, name: "Plan Profesional" },
  business: { crc: 65e3, usd: 130, name: "Plan Business" },
  enterprise: { crc: 12e4, usd: 240, name: "Plan Enterprise" }
};
router20.get("/system-metrics", async (req, res) => {
  try {
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuModel = cpus[0]?.model || "Generic CPU";
    let totalIdle = 0;
    let totalTick = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    const cpuUsagePercent = Math.min(100, Math.max(2, Math.round((1 - totalIdle / (totalTick || 1)) * 100 * 2.5)));
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercent = Math.round(usedMem / totalMem * 100);
    const processMem = process.memoryUsage();
    const processUptimeSeconds = Math.floor(process.uptime());
    const osUptimeSeconds = Math.floor(os.uptime());
    let dbSizeMb = 0;
    let activeConnections = 1;
    let totalTablesCount = 16;
    let totalOrdersCount = 0;
    let totalAppointmentsCount = 0;
    let totalMessagesCount = 0;
    let totalProductsCount = 0;
    try {
      const sizeRes = await query(`SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as bytes`);
      if (sizeRes.rows[0]) {
        dbSizeMb = Math.round(Number(sizeRes.rows[0].bytes) / (1024 * 1024) * 10) / 10;
      }
      const connRes = await query(`SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()`);
      if (connRes.rows[0]) {
        activeConnections = Number(connRes.rows[0].count);
      }
      const countsRes = await query(`
        SELECT 
          (SELECT count(*) FROM orders) as orders,
          (SELECT count(*) FROM appointments) as appointments,
          (SELECT count(*) FROM chat_messages) as messages,
          (SELECT count(*) FROM products) as products
      `);
      if (countsRes.rows[0]) {
        totalOrdersCount = Number(countsRes.rows[0].orders || 0);
        totalAppointmentsCount = Number(countsRes.rows[0].appointments || 0);
        totalMessagesCount = Number(countsRes.rows[0].messages || 0);
        totalProductsCount = Number(countsRes.rows[0].products || 0);
      }
    } catch (dbErr) {
      console.warn("Could not fetch advanced postgres stats:", dbErr);
    }
    res.json({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpuModel,
        cpuCount,
        cpuUsagePercent,
        loadAvg: os.loadavg(),
        ram: {
          totalGb: Math.round(totalMem / 1024 ** 3 * 10) / 10,
          usedGb: Math.round(usedMem / 1024 ** 3 * 10) / 10,
          freeGb: Math.round(freeMem / 1024 ** 3 * 10) / 10,
          usagePercent: ramUsagePercent
        },
        uptime: {
          processSeconds: processUptimeSeconds,
          osSeconds: osUptimeSeconds,
          formatted: formatDuration(processUptimeSeconds)
        }
      },
      nodeProcess: {
        version: process.version,
        heapUsedMb: Math.round(processMem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(processMem.heapTotal / (1024 * 1024)),
        rssMb: Math.round(processMem.rss / (1024 * 1024))
      },
      database: {
        status: "online",
        sizeMb: dbSizeMb,
        activeConnections,
        totalTablesCount,
        counts: {
          orders: totalOrdersCount,
          appointments: totalAppointmentsCount,
          messages: totalMessagesCount,
          products: totalProductsCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching system metrics:", error);
    res.status(500).json({ error: "Error al obtener m\xE9tricas del sistema" });
  }
});
router20.get("/api-stats", async (req, res) => {
  try {
    const tenants = await getAllTenants();
    const activeTenantsCount = tenants.filter((t) => t.active).length;
    const whatsappStats = await query(`
      SELECT 
        count(*) as total_messages,
        count(*) FILTER (WHERE from_me = true) as sent_messages,
        count(*) FILTER (WHERE from_me = false) as received_messages,
        count(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_messages
      FROM chat_messages
    `);
    const aiStats = await query(`
      SELECT 
        ai_provider,
        count(*) as count
      FROM tenants
      GROUP BY ai_provider
    `);
    const auditStats = await query(`
      SELECT 
        count(*) FILTER (WHERE action = 'login' AND created_at >= CURRENT_DATE) as logins_today,
        count(*) FILTER (WHERE action LIKE '%failed%' OR action LIKE '%blocked%' AND created_at >= CURRENT_DATE) as blocked_today,
        count(*) as total_audit_events
      FROM audit_logs
    `);
    const wRow = whatsappStats.rows[0] || {};
    const aRow = auditStats.rows[0] || {};
    res.json({
      evolutionApi: {
        status: "healthy",
        activeInstances: activeTenantsCount,
        totalMessagesProcessed: Number(wRow.total_messages || 0),
        messagesSent: Number(wRow.sent_messages || 0),
        messagesReceived: Number(wRow.received_messages || 0),
        messagesToday: Number(wRow.today_messages || 0),
        healthPercent: 99.8
      },
      aiProviders: {
        providersDistribution: aiStats.rows.map((r) => ({ provider: r.ai_provider || "gemini", count: Number(r.count) })),
        estimatedTokensConsumed: Number(wRow.total_messages || 0) * 380,
        aiSuccessRate: 99.4
      },
      securityAudit: {
        loginsToday: Number(aRow.logins_today || 0),
        blockedAttemptsToday: Number(aRow.blocked_today || 0),
        totalAuditEvents: Number(aRow.total_audit_events || 0)
      }
    });
  } catch (error) {
    console.error("Error fetching api stats:", error);
    res.status(500).json({ error: "Error al obtener estad\xEDsticas de APIs" });
  }
});
router20.get("/financials", async (req, res) => {
  try {
    const tenants = await getAllTenants();
    let mrrCrc = 0;
    let mrrUsd = 0;
    const planCounts = { starter: 0, pro: 0, business: 0, enterprise: 0 };
    for (const t of tenants) {
      if (t.active) {
        const planKey = (t.plan || "starter").toLowerCase();
        const pricing = PLAN_PRICING[planKey] || PLAN_PRICING.starter;
        mrrCrc += pricing.crc;
        mrrUsd += pricing.usd;
        planCounts[planKey] = (planCounts[planKey] || 0) + 1;
      }
    }
    const arrCrc = mrrCrc * 12;
    const arrUsd = mrrUsd * 12;
    const gmvRes = await query(`
      SELECT 
        COALESCE(SUM(total), 0) as orders_total,
        count(*) as orders_count
      FROM orders
    `);
    const appGmvRes = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as bookings_total,
        count(*) as bookings_count
      FROM appointments
    `);
    const ordersGmv = Number(gmvRes.rows[0]?.orders_total || 0);
    const ordersCount = Number(gmvRes.rows[0]?.orders_count || 0);
    const bookingsGmv = Number(appGmvRes.rows[0]?.bookings_total || 0);
    const bookingsCount = Number(appGmvRes.rows[0]?.bookings_count || 0);
    const totalGmvCrc = ordersGmv + bookingsGmv;
    const vpsCostCrc = 6240;
    const vpsCostUsd = 12;
    const aiApiCostUsd = Math.max(2, Math.round(tenants.length * 1.5 * 10) / 10);
    const aiApiCostCrc = Math.round(aiApiCostUsd * 520);
    const totalCostsCrc = vpsCostCrc + aiApiCostCrc;
    const totalCostsUsd = vpsCostUsd + aiApiCostUsd;
    const netProfitCrc = mrrCrc - totalCostsCrc;
    const netProfitUsd = mrrUsd - totalCostsUsd;
    const profitMarginPercent = mrrCrc > 0 ? Math.round(netProfitCrc / mrrCrc * 100) : 0;
    const tenantBreakdown = await Promise.all(tenants.map(async (t) => {
      const planKey = (t.plan || "starter").toLowerCase();
      const planInfo = PLAN_PRICING[planKey] || PLAN_PRICING.starter;
      const tOrders = await query(`
        SELECT COALESCE(SUM(total), 0) as total, count(*) as count 
        FROM orders WHERE tenant_id = $1
      `, [t.id]);
      const tApps = await query(`
        SELECT COALESCE(SUM(amount), 0) as total, count(*) as count 
        FROM appointments WHERE tenant_id = $1
      `, [t.id]);
      const oTotal = Number(tOrders.rows[0]?.total || 0);
      const bTotal = Number(tApps.rows[0]?.total || 0);
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        planName: planInfo.name,
        monthlyFeeCrc: planInfo.crc,
        monthlyFeeUsd: planInfo.usd,
        active: t.active,
        ordersCount: Number(tOrders.rows[0]?.count || 0),
        bookingsCount: Number(tApps.rows[0]?.count || 0),
        totalGmvProcessed: oTotal + bTotal,
        paymentStatus: t.active ? "Al D\xEDa" : "Inactivo",
        createdAt: t.createdAt
      };
    }));
    res.json({
      subscriptions: {
        mrrCrc,
        mrrUsd,
        arrCrc,
        arrUsd,
        activeTenantsCount: tenants.filter((t) => t.active).length,
        totalTenantsCount: tenants.length,
        planDistribution: planCounts
      },
      clientGmv: {
        totalGmvCrc,
        ordersGmvCrc: ordersGmv,
        ordersCount,
        bookingsGmvCrc: bookingsGmv,
        bookingsCount,
        totalTransactionsCount: ordersCount + bookingsCount
      },
      operatingCosts: {
        vpsCostCrc,
        vpsCostUsd,
        aiApiCostCrc,
        aiApiCostUsd,
        totalCostsCrc,
        totalCostsUsd
      },
      profitability: {
        netProfitCrc,
        netProfitUsd,
        profitMarginPercent
      },
      tenants: tenantBreakdown
    });
  } catch (error) {
    console.error("Error fetching financial dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos financieros del SaaS" });
  }
});
function formatDuration(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor(seconds % (3600 * 24) / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}
var superadmin_metrics_routes_default = router20;

// src/server/routes/superadmin-platform.routes.ts
import { Router as Router21 } from "express";
init_pool();
init_encryption();
init_evolution();
init_superadmin_notify_service();
init_users_repo();
init_ai_provider();
var router21 = Router21();
router21.post("/submit-payment-proof", authenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { reference, proofUrl, amount, notes } = req.body;
    if (!tenantId) {
      res.status(400).json({ error: "Tenant no identificado" });
      return;
    }
    const tenantRes = await query(`SELECT id, name, slug, billing_currency as currency FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Tenant no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    await query(`
      UPDATE tenants
      SET last_payment_proof = $1,
          last_payment_ref = $2,
          last_payment_amount = $3,
          payment_notes = $4,
          subscription_status = CASE WHEN subscription_status = 'suspended' THEN 'grace_period' ELSE subscription_status END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [proofUrl || null, reference || null, amount ? Number(amount) : null, notes || null, tenantId]);
    await notifyPaymentProofUploaded({
      tenantName: tenant.name,
      slug: tenant.slug,
      amount: Number(amount || 0),
      currency: tenant.currency || "CRC",
      reference: reference || "",
      notes: notes || ""
    });
    res.json({ success: true, message: "Comprobante recibido con \xE9xito. En breve ser\xE1 revisado y aprobado." });
  } catch (error) {
    console.error("Error submitting payment proof:", error);
    res.status(500).json({ error: "Error al enviar comprobante de pago" });
  }
});
router21.use(authenticateToken);
router21.use(requireSuperAdmin);
router21.get("/settings", async (req, res) => {
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
    res.json({
      masterAiProvider: settings.master_ai_provider || "gemini",
      masterAiKey: settings.master_ai_key ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + settings.master_ai_key.slice(-4) : "",
      masterAiModel: settings.master_ai_model || "gemini-2.5-flash",
      localaiUrl: settings.localai_url || "http://localhost:8080/v1",
      localaiModel: settings.localai_model || "llama-3.1-8b-instruct",
      localaiApiKey: settings.localai_api_key ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" + settings.localai_api_key.slice(-4) : "",
      localaiEnabled: settings.localai_enabled !== "false",
      quotaStarterTokens: parseInt(settings.quota_starter_tokens || "25000", 10),
      quotaProTokens: parseInt(settings.quota_pro_tokens || "100000", 10),
      quotaBusinessTokens: parseInt(settings.quota_business_tokens || "300000", 10),
      superadminNotifyPhone: settings.superadmin_notify_phone || "",
      deployWebhookApp: settings.deploy_webhook_app || process.env.DEPLOY_WEBHOOK_APP || "http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b",
      deployWebhookLocalai: settings.deploy_webhook_localai || process.env.DEPLOY_WEBHOOK_LOCALAI || "http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e"
    });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ error: "Error al obtener ajustes de plataforma" });
  }
});
router21.post("/settings", async (req, res) => {
  try {
    const {
      masterAiProvider,
      masterAiKey,
      masterAiModel,
      localaiUrl,
      localaiModel,
      localaiApiKey,
      localaiEnabled,
      quotaStarterTokens,
      quotaProTokens,
      quotaBusinessTokens,
      superadminNotifyPhone,
      deployWebhookApp,
      deployWebhookLocalai
    } = req.body;
    const upsertSetting = async (key, value) => {
      await query(`
        INSERT INTO platform_settings (key, value) VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
      `, [key, value]);
    };
    if (masterAiProvider) await upsertSetting("master_ai_provider", masterAiProvider);
    if (masterAiModel) await upsertSetting("master_ai_model", masterAiModel);
    if (localaiUrl) await upsertSetting("localai_url", localaiUrl.trim());
    if (localaiModel) await upsertSetting("localai_model", localaiModel.trim());
    if (localaiEnabled !== void 0) await upsertSetting("localai_enabled", String(localaiEnabled));
    if (quotaStarterTokens !== void 0) await upsertSetting("quota_starter_tokens", String(quotaStarterTokens));
    if (quotaProTokens !== void 0) await upsertSetting("quota_pro_tokens", String(quotaProTokens));
    if (quotaBusinessTokens !== void 0) await upsertSetting("quota_business_tokens", String(quotaBusinessTokens));
    if (deployWebhookApp) await upsertSetting("deploy_webhook_app", deployWebhookApp.trim());
    if (deployWebhookLocalai) await upsertSetting("deploy_webhook_localai", deployWebhookLocalai.trim());
    if (masterAiKey && !masterAiKey.startsWith("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")) {
      const encrypted = encrypt(masterAiKey.trim());
      await query(`
        INSERT INTO platform_settings (key, value_encrypted) VALUES ('master_ai_key', $1)
        ON CONFLICT (key) DO UPDATE SET value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP
      `, [encrypted]);
    }
    if (localaiApiKey && !localaiApiKey.startsWith("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")) {
      const encrypted = encrypt(localaiApiKey.trim());
      await query(`
        INSERT INTO platform_settings (key, value_encrypted) VALUES ('localai_api_key', $1)
        ON CONFLICT (key) DO UPDATE SET value_encrypted = EXCLUDED.value_encrypted, updated_at = CURRENT_TIMESTAMP
      `, [encrypted]);
    }
    if (superadminNotifyPhone !== void 0) {
      const cleanPhone = (superadminNotifyPhone || "").replace(/\D/g, "");
      await upsertSetting("superadmin_notify_phone", cleanPhone);
    }
    res.json({ success: true, message: "Ajustes de plataforma guardados con \xE9xito" });
  } catch (error) {
    console.error("Error saving platform settings:", error);
    res.status(500).json({ error: error.message || "Error al guardar ajustes de plataforma" });
  }
});
router21.get("/ai-usage", async (req, res) => {
  try {
    const monthYear = req.query.monthYear || void 0;
    const usage = await getAllTenantsMonthlyUsage(monthYear);
    res.json({ success: true, usage });
  } catch (error) {
    console.error("Error fetching AI usage:", error);
    res.status(500).json({ error: "Error al obtener consumo de IA" });
  }
});
router21.post("/deploy/:target", async (req, res) => {
  try {
    const target = req.params.target;
    const settingKey = target === "localai" ? "deploy_webhook_localai" : "deploy_webhook_app";
    const dbRes = await query(`SELECT value FROM platform_settings WHERE key = $1`, [settingKey]);
    let deployUrl = dbRes.rows[0]?.value;
    if (!deployUrl) {
      deployUrl = target === "localai" ? process.env.DEPLOY_WEBHOOK_LOCALAI || "http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e" : process.env.DEPLOY_WEBHOOK_APP || "http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b";
    }
    console.log(`[Deploy] Triggering webhook for ${target} at ${deployUrl}...`);
    try {
      const resp = await fetch(deployUrl, { method: "POST" });
      const respText = await resp.text();
      res.json({ success: true, message: `Despliegue de ${target === "localai" ? "Local AI" : "App Betico"} iniciado con \xE9xito.`, detail: respText });
    } catch (fetchErr) {
      try {
        const resp2 = await fetch(deployUrl, { method: "GET" });
        const respText2 = await resp2.text();
        res.json({ success: true, message: `Despliegue de ${target === "localai" ? "Local AI" : "App Betico"} iniciado (GET).`, detail: respText2 });
      } catch (getErr) {
        res.status(502).json({ error: `No se pudo contactar el webhook de despliegue: ${getErr.message}` });
      }
    }
  } catch (error) {
    console.error("Error triggering deploy:", error);
    res.status(500).json({ error: "Error al ejecutar webhook de despliegue" });
  }
});
router21.get("/instances", async (req, res) => {
  try {
    const result = await query(`
      SELECT id, instance_type as "instanceType", instance_name as "instanceName", 
             phone_number as "phoneNumber", status, qr_code as "qrCode", updated_at as "updatedAt"
      FROM superadmin_instances
      ORDER BY instance_type ASC
    `);
    const instances = result.rows;
    const types = ["ventas", "soporte"];
    const formatted = types.map((t) => {
      const found = instances.find((i) => i.instanceType === t);
      return found || {
        instanceType: t,
        instanceName: `betico_${t}`,
        status: "disconnected",
        qrCode: null
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error("Error fetching superadmin instances:", error);
    res.status(500).json({ error: "Error al consultar instancias" });
  }
});
router21.post("/instances/connect", async (req, res) => {
  try {
    const { instanceType } = req.body;
    if (!instanceType) {
      res.status(400).json({ error: "Tipo de instancia requerido" });
      return;
    }
    const instanceName = `betico_${instanceType}`;
    await createInstance(instanceName);
    const conn = await connectInstance(instanceName);
    let qr = conn.data?.base64 || conn.data?.qrcode?.base64 || conn.data?.code || null;
    let status = conn.data?.state === "open" ? "connected" : qr ? "qr_ready" : "disconnected";
    await query(`
      INSERT INTO superadmin_instances (instance_type, instance_name, status, qr_code)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (instance_type) DO UPDATE SET
        status = EXCLUDED.status,
        qr_code = EXCLUDED.qr_code,
        updated_at = CURRENT_TIMESTAMP
    `, [instanceType, instanceName, status, qr]);
    res.json({
      success: true,
      instanceName,
      status,
      qrCode: qr
    });
  } catch (error) {
    console.error("Error connecting instance:", error);
    res.status(500).json({ error: "Error al conectar WhatsApp de Superadmin" });
  }
});
router21.post("/instances/disconnect", async (req, res) => {
  try {
    const { instanceType } = req.body;
    const instanceName = `betico_${instanceType}`;
    await disconnectInstance(instanceName);
    await query(`
      UPDATE superadmin_instances SET status = 'disconnected', qr_code = null WHERE instance_type = $1
    `, [instanceType]);
    res.json({ success: true, message: "Instancia desconectada" });
  } catch (error) {
    res.status(500).json({ error: "Error al desconectar" });
  }
});
router21.post("/tenants/create", async (req, res) => {
  try {
    const {
      name,
      slug,
      contactName,
      email,
      phone,
      plan,
      customMonthlyPrice,
      billingCurrency,
      isTrial,
      trialDays = 15
    } = req.body;
    if (!name || !email || !slug) {
      res.status(400).json({ error: "Nombre, slug y correo son obligatorios" });
      return;
    }
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const price = Number(customMonthlyPrice || 29);
    const currency = billingCurrency || "CRC";
    const trialEnabled = isTrial !== false;
    const existing = await query(`SELECT id FROM tenants WHERE slug = $1`, [cleanSlug]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: "El identificador (slug) ya est\xE1 en uso por otro comercio" });
      return;
    }
    const tempPassword = "Btc" + Math.floor(1e5 + Math.random() * 9e5) + "!";
    const passwordHash = hashPassword(tempPassword);
    const trialEnd = new Date(Date.now() + (trialDays || 15) * 24 * 60 * 60 * 1e3);
    const tenantRes = await query(`
      INSERT INTO tenants (
        name, slug, plan, whatsapp_number, custom_monthly_price, billing_currency,
        subscription_status, trial_ends_at, next_billing_date, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING id, name, slug, plan, whatsapp_number as "whatsappNumber",
                custom_monthly_price as "customMonthlyPrice", billing_currency as "billingCurrency",
                subscription_status as "subscriptionStatus", trial_ends_at as "trialEndsAt",
                next_billing_date as "nextBillingDate", created_at as "createdAt"
    `, [
      name,
      cleanSlug,
      plan || "starter",
      cleanPhone,
      price,
      currency,
      trialEnabled ? "trial" : "active",
      trialEnabled ? trialEnd : null,
      trialEnabled ? trialEnd : new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
    ]);
    const tenant = tenantRes.rows[0];
    await query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role, active)
      VALUES ($1, $2, $3, $4, 'admin', true)
    `, [tenant.id, contactName || name, email.toLowerCase().trim(), passwordHash]);
    if (cleanPhone && cleanPhone.length >= 8) {
      const trialMsg = trialEnabled ? `\u23F3 Cuentas con *15 d\xEDas de prueba gratis* hasta el *${trialEnd.toLocaleDateString("es-CR")}*.` : "";
      const waText = `\u{1F389} \xA1Hola *${contactName || name}*! Te damos la bienvenida a *Betico.tech*.

Tu plataforma de ventas y WhatsApp con IA est\xE1 lista:

\u{1F517} *Enlace de Acceso:* https://betico.tech/login
\u{1F464} *Usuario:* ${email}
\u{1F511} *Contrase\xF1a Temporal:* ${tempPassword}

${trialMsg}

\u{1F680} \xA1Muchos \xE9xitos automatizando tu negocio!`;
      try {
        await sendMessage("betico_soporte", cleanPhone, waText);
      } catch (waErr) {
        console.error("Error sending welcome WhatsApp to new tenant:", waErr);
      }
    }
    await notifyNewTenantEnrollment({
      tenantName: name,
      slug: cleanSlug,
      contactName: contactName || name,
      email,
      phone: cleanPhone,
      plan: plan || "starter",
      monthlyPrice: price,
      currency,
      trialDays: trialDays || 15,
      isManual: true
    });
    res.status(201).json({
      success: true,
      tenant,
      tempPassword,
      message: "Inquilino creado y credenciales despachadas por WhatsApp"
    });
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ error: error.message || "Error al crear inquilino" });
  }
});
router21.post("/tenants/:id/approve-payment", async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { days = 30 } = req.body;
    const tenantRes = await query(`SELECT id, name, slug, whatsapp_number FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const tenant = tenantRes.rows[0];
    const nextBilling = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1e3);
    await query(`
      UPDATE tenants
      SET subscription_status = 'active',
          next_billing_date = $1,
          grace_period_ends_at = null,
          last_payment_proof = null,
          active = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [nextBilling, tenantId]);
    if (tenant.whatsapp_number) {
      const cleanPhone = tenant.whatsapp_number.replace(/\D/g, "");
      const msg = `\u2705 *[Pago Aprobado - Betico]*

Hola *${tenant.name}*, hemos verificado tu comprobante de pago exitosamente.

Tu suscripci\xF3n ha sido renovada por 30 d\xEDas hasta el *${nextBilling.toLocaleDateString("es-CR")}*. \xA1Gracias por confiar en Betico!`;
      try {
        await sendMessage("betico_soporte", cleanPhone, msg);
      } catch (e) {
      }
    }
    await notifyPaymentApproved({
      tenantName: tenant.name,
      slug: tenant.slug,
      renewedUntil: nextBilling.toLocaleDateString("es-CR")
    });
    res.json({ success: true, message: "Pago aprobado y suscripci\xF3n renovada" });
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).json({ error: "Error al aprobar pago" });
  }
});
router21.post("/tenants/:id/toggle-suspension", async (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenantRes = await query(`SELECT id, name, subscription_status, active FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: "Inquilino no encontrado" });
      return;
    }
    const currentStatus = tenantRes.rows[0].subscription_status;
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const newActive = newStatus === "active";
    await query(`
      UPDATE tenants 
      SET subscription_status = $1, active = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [newStatus, newActive, tenantId]);
    res.json({ success: true, status: newStatus, message: `Estado cambiado a ${newStatus}` });
  } catch (error) {
    res.status(500).json({ error: "Error al cambiar estado" });
  }
});
router21.put("/tenants/:id/subscription", async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { customMonthlyPrice, billingCurrency, subscriptionStatus, nextBillingDate } = req.body;
    await query(`
      UPDATE tenants
      SET custom_monthly_price = COALESCE($1, custom_monthly_price),
          billing_currency = COALESCE($2, billing_currency),
          subscription_status = COALESCE($3, subscription_status),
          next_billing_date = COALESCE($4, next_billing_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [
      customMonthlyPrice !== void 0 ? Number(customMonthlyPrice) : null,
      billingCurrency || null,
      subscriptionStatus || null,
      nextBillingDate ? new Date(nextBillingDate) : null,
      tenantId
    ]);
    res.json({ success: true, message: "Suscripci\xF3n actualizada" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar suscripci\xF3n" });
  }
});
router21.post("/test-ai", async (req, res) => {
  const startTime = Date.now();
  try {
    const { prompt, provider, model, baseUrl } = req.body;
    const master = await getMasterAIConfig();
    const testConfig = {
      provider: provider || master.provider,
      apiKey: master.apiKey,
      model: model || master.model,
      temperature: 0.7,
      baseUrl: baseUrl || master.baseUrl
    };
    const aiResult = await callAI(testConfig, prompt || "Hola, \xBFc\xF3mo funciona este modelo de IA?");
    const latencyMs = Date.now() - startTime;
    res.json({
      success: true,
      text: aiResult.text,
      tokensUsed: aiResult.tokensUsed,
      latencyMs,
      config: {
        provider: testConfig.provider,
        model: testConfig.model,
        baseUrl: testConfig.baseUrl
      }
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in Superadmin AI Playground:", error);
    res.status(500).json({ error: error.message || "Error en prueba de IA", latencyMs });
  }
});
router21.get("/ai-engine-status", async (req, res) => {
  const startTime = Date.now();
  let localaiUrl = (req.query.url || "").trim();
  try {
    if (!localaiUrl) {
      const dbRes = await query("SELECT value FROM platform_settings WHERE key = 'localai_url'");
      localaiUrl = dbRes.rows[0]?.value || "https://beticoia-localai.qvtdko.easypanel.host/v1";
    }
    const baseUrl = localaiUrl.replace(/\/v1\/?$/, "").replace(/\/+$/, "");
    const pingUrl = baseUrl + "/v1/models";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4e3);
    const response = await fetch(pingUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    if (response.ok) {
      const data = await response.json();
      const models = Array.isArray(data.data) ? data.data.map((m) => m.id) : [];
      res.json({
        online: true,
        url: localaiUrl,
        latencyMs,
        models,
        statusText: "Operativo & Respondiendo"
      });
    } else {
      res.json({
        online: false,
        url: localaiUrl,
        latencyMs,
        statusText: "Servidor respondi\xF3 con c\xF3digo " + response.status
      });
    }
  } catch (e) {
    const latencyMs = Date.now() - startTime;
    res.json({
      online: false,
      url: localaiUrl,
      latencyMs,
      statusText: "Servidor no accesible (" + (e.message || "Timeout") + ")"
    });
  }
});
router21.put("/tenants/:id/ai-quota", async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { customTokensLimit } = req.body;
    if (customTokensLimit !== void 0) {
      await query(
        "UPDATE tenants SET settings_json = jsonb_set(COALESCE(settings_json, '{}'::jsonb), '{customAiQuotaTokens}', $1::jsonb) WHERE id = $2",
        [JSON.stringify(Number(customTokensLimit)), tenantId]
      );
    }
    res.json({ success: true, message: "Cuota personalizada actualizada con \xE9xito" });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error actualizando cuota" });
  }
});
router21.get("/audit-logs", async (req, res) => {
  try {
    const result = await query(`
      SELECT a.id, a.user_id as "userId", a.action, a.entity_type as "entityType", 
             a.entity_id as "entityId", a.ip_address as "ipAddress", a.user_agent as "userAgent",
             a.created_at as "createdAt", u.name as "userName", u.email as "userEmail", t.name as "tenantName"
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN tenants t ON t.id = a.tenant_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, logs: result.rows });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error al obtener logs de auditor\xEDa" });
  }
});
router21.get("/system-stats", async (req, res) => {
  try {
    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const uptimeHours = (uptimeSec / 3600).toFixed(1);
    const tenantsCount = await query("SELECT count(*) as total, count(*) filter (where active) as active FROM tenants WHERE slug != 'superadmin'");
    const ordersCount = await query("SELECT count(*) as total FROM orders");
    const appointmentsCount = await query("SELECT count(*) as total FROM appointments");
    const chatsCount = await query("SELECT count(*) as total FROM chat_messages");
    res.json({
      success: true,
      metrics: {
        ramRss: (mem.rss / 1024 / 1024).toFixed(0) + " MB",
        ramHeapUsed: (mem.heapUsed / 1024 / 1024).toFixed(0) + " MB",
        uptime: uptimeHours + " horas",
        nodeVersion: process.version,
        tenantsTotal: parseInt(tenantsCount.rows[0]?.total || "0", 10),
        tenantsActive: parseInt(tenantsCount.rows[0]?.active || "0", 10),
        ordersTotal: parseInt(ordersCount.rows[0]?.total || "0", 10),
        appointmentsTotal: parseInt(appointmentsCount.rows[0]?.total || "0", 10),
        chatsTotal: parseInt(chatsCount.rows[0]?.total || "0", 10)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error al obtener m\xE9tricas del sistema" });
  }
});
router21.post("/tenants/:id/toggle-courts", authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { enabled } = req.body;
    const isEnabled = enabled !== false;
    const current = await query(`SELECT store_modules FROM store_settings WHERE tenant_id = $1`, [tenantId]);
    let modules = { storeEnabled: true, bookingsEnabled: true };
    if (current.rows.length > 0 && current.rows[0].store_modules) {
      modules = current.rows[0].store_modules;
    }
    modules.courtsEnabled = isEnabled;
    if (current.rows.length > 0) {
      await query(`UPDATE store_settings SET store_modules = $1 WHERE tenant_id = $2`, [JSON.stringify(modules), tenantId]);
    } else {
      await query(`INSERT INTO store_settings (tenant_id, store_modules) VALUES ($1, $2)`, [tenantId, JSON.stringify(modules)]);
    }
    res.json({ success: true, courtsEnabled: isEnabled });
  } catch (e) {
    res.status(500).json({ error: e.message || "Error toggling courts module" });
  }
});
var superadmin_platform_routes_default = router21;

// src/server/routes/campaigns.routes.ts
import { Router as Router22 } from "express";
init_pool();
var router22 = Router22();
router22.use(authenticateToken);
router22.get("/reminder-settings", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await query(`SELECT reminder_config as "reminderConfig" FROM tenants WHERE id = $1`, [tenantId]);
    const config = result.rows[0]?.reminderConfig || {
      enabled: true,
      firstReminderEnabled: true,
      firstReminderHoursBefore: 24,
      firstReminderTemplate: "\u{1F44B} Hola *{{nombre}}*, te recordamos tu cita para *{{servicio}}* agendada para el d\xEDa *{{fecha}}* a las *{{hora}}* en *{{negocio}}*. \xA1Te esperamos!",
      secondReminderEnabled: true,
      secondReminderHoursBefore: 2,
      secondReminderTemplate: "\u23F0 Hola *{{nombre}}*, tu cita para *{{servicio}}* en *{{negocio}}* es hoy a las *{{hora}}* (en unas {{horas}} horas). Si necesitas reagendar, av\xEDsanos con tiempo."
    };
    res.json(config);
  } catch (error) {
    console.error("Error getting reminder settings:", error);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n de recordatorios" });
  }
});
router22.post("/reminder-settings", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const config = req.body;
    await query(`UPDATE tenants SET reminder_config = $1 WHERE id = $2`, [JSON.stringify(config), tenantId]);
    res.json({ success: true, config });
  } catch (error) {
    console.error("Error saving reminder settings:", error);
    res.status(500).json({ error: "Error al guardar configuraci\xF3n de recordatorios" });
  }
});
router22.get("/customers", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    await query(`
      INSERT INTO customers (tenant_id, name, phone, email, total_orders, total_spent, last_interaction)
      SELECT 
        $1 as tenant_id,
        customer_name as name,
        customer_phone as phone,
        customer_email as email,
        COUNT(id) as total_orders,
        SUM(total) as total_spent,
        MAX(created_at) as last_interaction
      FROM orders
      WHERE tenant_id = $1 AND customer_phone IS NOT NULL AND customer_phone != ''
      GROUP BY customer_name, customer_phone, customer_email
      ON CONFLICT (tenant_id, phone) DO UPDATE SET
        name = EXCLUDED.name,
        total_orders = EXCLUDED.total_orders,
        total_spent = EXCLUDED.total_spent,
        last_interaction = EXCLUDED.last_interaction
    `, [tenantId]);
    await query(`
      INSERT INTO customers (tenant_id, name, phone, total_orders, total_spent, last_interaction)
      SELECT 
        $1 as tenant_id,
        name,
        whatsapp as phone,
        COUNT(id) as total_orders,
        SUM(amount) as total_spent,
        MAX(created_at) as last_interaction
      FROM appointments
      WHERE tenant_id = $1 AND whatsapp IS NOT NULL AND whatsapp != ''
      GROUP BY name, whatsapp
      ON CONFLICT (tenant_id, phone) DO UPDATE SET
        last_interaction = GREATEST(customers.last_interaction, EXCLUDED.last_interaction)
    `, [tenantId]);
    const result = await query(`
      SELECT id, name, phone, email, tags, total_orders as "totalOrders", 
             total_spent as "totalSpent", last_interaction as "lastInteraction", created_at as "createdAt"
      FROM customers
      WHERE tenant_id = $1
      ORDER BY last_interaction DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Error al obtener lista de clientes" });
  }
});
router22.post("/customers/:id/tags", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { tags } = req.body;
    const result = await query(`
      UPDATE customers SET tags = $1 
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, tags
    `, [tags, req.params.id, tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating customer tags:", error);
    res.status(500).json({ error: "Error al actualizar etiquetas" });
  }
});
router22.get("/whatsapp-contacts", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) {
      res.json({ contacts: [] });
      return;
    }
    const { fetchWhatsAppContacts: fetchWhatsAppContacts2 } = await Promise.resolve().then(() => (init_evolution(), evolution_exports));
    const contacts = await fetchWhatsAppContacts2(tenant.evolutionInstance);
    res.json({ contacts });
  } catch (error) {
    console.error("Error fetching whatsapp contacts for campaign:", error);
    res.status(500).json({ error: "Error al obtener contactos de WhatsApp" });
  }
});
router22.post("/import-to-crm", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { contacts } = req.body;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      res.status(400).json({ error: "No se enviaron contactos para importar" });
      return;
    }
    let count = 0;
    for (const c of contacts) {
      if (!c.phone) continue;
      const cleanPhone = (c.phone || "").replace(/\D/g, "");
      const name = c.name || c.pushName || `Cliente ${cleanPhone}`;
      await query(`
        INSERT INTO customers (tenant_id, name, phone, tags, last_interaction)
        VALUES ($1, $2, $3, ARRAY['WhatsApp', 'Importado'], CURRENT_TIMESTAMP)
        ON CONFLICT (tenant_id, phone) DO UPDATE
        SET name = COALESCE(customers.name, EXCLUDED.name),
            last_interaction = CURRENT_TIMESTAMP
      `, [tenantId, name, cleanPhone]);
      count++;
    }
    res.json({ success: true, importedCount: count });
  } catch (error) {
    console.error("Error importing contacts to CRM:", error);
    res.status(500).json({ error: "Error al importar contactos al CRM" });
  }
});
router22.get("/", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const result = await query(`
      SELECT id, name, message_template as "messageTemplate", media_url as "mediaUrl",
             target_segment as "targetSegment", target_tag as "targetTag",
             total_recipients as "totalRecipients", sent_count as "sentCount",
             failed_count as "failedCount", status, scheduled_for as "scheduledFor",
             target_contacts as "targetContacts", created_at as "createdAt"
      FROM whatsapp_campaigns
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Error al obtener campa\xF1as" });
  }
});
router22.post("/", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, messageTemplate, mediaUrl, targetSegment, targetTag, scheduledFor, targetContacts } = req.body;
    if (!name || !messageTemplate) {
      res.status(400).json({ error: "Nombre de campa\xF1a y mensaje son obligatorios" });
      return;
    }
    let totalRecipients = 0;
    if (targetContacts && Array.isArray(targetContacts) && targetContacts.length > 0) {
      totalRecipients = targetContacts.length;
    } else {
      let countQuery = `SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1`;
      const params = [tenantId];
      if (targetSegment === "tag" && targetTag) {
        countQuery += ` AND $2 = ANY(tags)`;
        params.push(targetTag);
      }
      const countRes = await query(countQuery, params);
      totalRecipients = parseInt(countRes.rows[0]?.count || "0", 10);
    }
    const isScheduled = scheduledFor && new Date(scheduledFor).getTime() > Date.now();
    const initialStatus = isScheduled ? "scheduled" : "draft";
    const result = await query(`
      INSERT INTO whatsapp_campaigns (
        tenant_id, name, message_template, media_url, target_segment, target_tag, 
        total_recipients, status, scheduled_for, target_contacts
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, message_template as "messageTemplate", media_url as "mediaUrl",
                target_segment as "targetSegment", target_tag as "targetTag",
                total_recipients as "totalRecipients", sent_count as "sentCount",
                failed_count as "failedCount", status, scheduled_for as "scheduledFor",
                target_contacts as "targetContacts", created_at as "createdAt"
    `, [
      tenantId,
      name,
      messageTemplate,
      mediaUrl || null,
      targetSegment || "all",
      targetTag || null,
      totalRecipients,
      initialStatus,
      isScheduled ? new Date(scheduledFor) : null,
      targetContacts ? JSON.stringify(targetContacts) : null
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Error al crear campa\xF1a" });
  }
});
router22.post("/:id/send", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const campaignId = req.params.id;
    const campRes = await query(`
      SELECT * FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2
    `, [campaignId, tenantId]);
    if (campRes.rows.length === 0) {
      res.status(404).json({ error: "Campa\xF1a no encontrada" });
      return;
    }
    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) {
      res.status(400).json({ error: "El negocio no tiene una conexi\xF3n de WhatsApp activa para realizar env\xEDos" });
      return;
    }
    await query(`UPDATE whatsapp_campaigns SET status = 'sending' WHERE id = $1`, [campaignId]);
    await enqueueCampaign(campaignId, tenantId);
    res.json({ success: true, message: "Campa\xF1a iniciada y encolada con \xE9xito" });
  } catch (error) {
    console.error("Error starting campaign send:", error);
    res.status(500).json({ error: "Error al enviar campa\xF1a" });
  }
});
router22.post("/:id/pause", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const campaignId = req.params.id;
    const campCheck = await query("SELECT id FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2", [campaignId, tenantId]);
    if (campCheck.rows.length === 0) {
      res.status(404).json({ error: "Campa\xF1a no encontrada" });
      return;
    }
    await pauseCampaign(campaignId, tenantId);
    res.json({ success: true, message: "Campa\xF1a pausada" });
  } catch (error) {
    res.status(500).json({ error: "Error al pausar campa\xF1a" });
  }
});
router22.post("/:id/resume", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const campaignId = req.params.id;
    const campCheck = await query("SELECT id FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2", [campaignId, tenantId]);
    if (campCheck.rows.length === 0) {
      res.status(404).json({ error: "Campa\xF1a no encontrada" });
      return;
    }
    await resumeCampaign(campaignId, tenantId);
    res.json({ success: true, message: "Campa\xF1a reanudada" });
  } catch (error) {
    res.status(500).json({ error: "Error al reanudar campa\xF1a" });
  }
});
router22.post("/:id/cancel", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const campaignId = req.params.id;
    const campCheck = await query("SELECT id FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2", [campaignId, tenantId]);
    if (campCheck.rows.length === 0) {
      res.status(404).json({ error: "Campa\xF1a no encontrada" });
      return;
    }
    await cancelCampaign(campaignId, tenantId);
    res.json({ success: true, message: "Campa\xF1a cancelada" });
  } catch (error) {
    res.status(500).json({ error: "Error al cancelar campa\xF1a" });
  }
});
var campaigns_routes_default = router22;

// src/server/routes/branches.routes.ts
import { Router as Router23 } from "express";

// src/server/db/branches.repo.ts
init_pool();
async function getBranchesByTenant(tenantId) {
  const result = await query(`
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
  const result = await query(`
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
    await query(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1`, [tenantId]);
  }
  const result = await query(`
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
    await query(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1 AND id != $2`, [tenantId, id]);
  }
  const result = await query(`
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
  const result = await query(`DELETE FROM branches WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}

// src/server/routes/branches.routes.ts
var router23 = Router23();
router23.use(authenticateToken);
router23.get("/", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branches = await getBranchesByTenant(tenantId);
    res.json(branches);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: "Error al obtener sucursales" });
  }
});
router23.get("/:id", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branch = await getBranchById(req.params.id, tenantId);
    if (!branch) {
      res.status(404).json({ error: "Sucursal no encontrada" });
      return;
    }
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener sucursal" });
  }
});
router23.post("/", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, code, address, phone, sinpePhone, sinpeName, latitude, longitude, isMain, active } = req.body;
    if (!name) {
      res.status(400).json({ error: "El nombre de la sucursal es obligatorio" });
      return;
    }
    const branch = await createBranch(tenantId, {
      name,
      code,
      address,
      phone,
      sinpePhone,
      sinpeName,
      latitude,
      longitude,
      isMain,
      active
    });
    res.status(201).json(branch);
  } catch (error) {
    console.error("Error creating branch:", error);
    res.status(500).json({ error: "Error al crear sucursal" });
  }
});
router23.put("/:id", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const branch = await updateBranch(req.params.id, tenantId, req.body);
    if (!branch) {
      res.status(404).json({ error: "Sucursal no encontrada" });
      return;
    }
    res.json(branch);
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({ error: "Error al actualizar sucursal" });
  }
});
router23.delete("/:id", async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const success = await deleteBranch(req.params.id, tenantId);
    if (!success) {
      res.status(404).json({ error: "Sucursal no encontrada" });
      return;
    }
    res.json({ success: true, message: "Sucursal eliminada" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ error: "Error al eliminar sucursal" });
  }
});
var branches_routes_default = router23;

// src/server/routes/specialists.routes.ts
import { Router as Router24 } from "express";
init_pool();
var router24 = Router24();
router24.post("/portal/login", async (req, res) => {
  try {
    const { pin, phone } = req.body;
    if (!pin) {
      res.status(400).json({ error: "PIN requerido" });
      return;
    }
    const specialist = await getSpecialistByPin(pin, phone);
    if (!specialist) {
      res.status(401).json({ error: "C\xF3digo PIN no encontrado o incorrecto" });
      return;
    }
    const tenant = await getTenantById(specialist.tenantId);
    res.json({
      success: true,
      specialist: {
        id: specialist.id,
        tenantId: specialist.tenantId,
        name: specialist.name,
        phone: specialist.phone,
        specialty: specialist.specialty,
        accessPin: specialist.accessPin,
        businessName: tenant?.name || "Comercio"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesi\xF3n" });
  }
});
router24.get("/portal/appointments", async (req, res) => {
  try {
    const pin = req.headers["x-specialist-pin"] || req.query.pin;
    if (!pin) {
      res.status(401).json({ error: "PIN no provisto" });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    const appointments = await getActiveAppointmentsForSpecialist(specialist.id);
    res.json({ appointments, specialistName: specialist.name });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo citas" });
  }
});
router24.post("/portal/appointments/:id/status", async (req, res) => {
  try {
    const pin = req.headers["x-specialist-pin"] || req.body.pin;
    const { status } = req.body;
    if (!pin) {
      res.status(401).json({ error: "PIN no provisto" });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    await query("UPDATE appointments SET status = $1 WHERE id = $2 AND specialist_id = $3", [status || "completed", req.params.id, specialist.id]);
    res.json({ success: true, message: "Estado actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});
router24.get("/portal/history", async (req, res) => {
  try {
    const pin = req.headers["x-specialist-pin"] || req.query.pin;
    const { fromDate, toDate } = req.query;
    if (!pin) {
      res.status(401).json({ error: "PIN no provisto" });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: "PIN inv\xE1lido" });
      return;
    }
    const appointments = await getCompletedAppointmentsForSpecialist(specialist.id, fromDate, toDate);
    const totalEarnings = appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    res.json({
      appointments,
      totalCount: appointments.length,
      totalEarnings,
      specialistName: specialist.name
    });
  } catch (error) {
    res.status(500).json({ error: "Error al consultar historial" });
  }
});
router24.use(authenticateToken);
router24.use(tenantContext);
router24.get("/", async (req, res) => {
  try {
    const specialists = await getSpecialistsByTenant(req.tenantId);
    res.json(specialists);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener colaboradores" });
  }
});
router24.post("/", async (req, res) => {
  try {
    const { name, phone, specialty, accessPin } = req.body;
    if (!name) {
      res.status(400).json({ error: "Nombre es requerido" });
      return;
    }
    const created = await createSpecialist(req.tenantId, { name, phone, specialty, accessPin });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Error al crear colaborador" });
  }
});
router24.put("/:id", async (req, res) => {
  try {
    const updated = await updateSpecialist(req.params.id, req.tenantId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar colaborador" });
  }
});
router24.delete("/:id", async (req, res) => {
  try {
    const deleted = await deleteSpecialist(req.params.id, req.tenantId);
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar colaborador" });
  }
});
var specialists_routes_default = router24;

// src/server/routes/website.routes.ts
import { Router as Router25 } from "express";
var router25 = Router25();
router25.use(authenticateToken);
router25.use(tenantContext);
router25.get("/", async (req, res) => {
  try {
    const settings = await getWebsiteSettingsByTenant(req.tenantId);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching website settings:", error);
    res.status(500).json({ error: "Error al obtener la configuraci\xF3n del sitio web" });
  }
});
router25.post("/", async (req, res) => {
  try {
    const updated = await saveWebsiteSettings(req.tenantId, req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Error saving website settings:", error);
    res.status(500).json({ error: "Error al guardar la configuraci\xF3n del sitio web" });
  }
});
var website_routes_default = router25;

// src/server/routes/website-public.routes.ts
import { Router as Router26 } from "express";
var router26 = Router26();
router26.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || !tenant.active) {
      res.status(404).json({ error: "Sitio web no encontrado o inactivo" });
      return;
    }
    const [website, services, products, store] = await Promise.all([
      getWebsiteSettingsByTenant(tenant.id),
      getServicesByTenant(tenant.id),
      getProductsByTenant(tenant.id, true),
      getStoreSettings(tenant.id)
    ]);
    const allServices = services.filter((s) => s.active !== false).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      duration: s.duration || `${s.estimatedMinutes || 45} min`,
      estimatedMinutes: s.estimatedMinutes || 45,
      category: s.category || "General"
    }));
    const featuredServices = allServices;
    const allProducts = products.filter((p) => p.active !== false).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      category: p.category || "General"
    }));
    const featuredProducts = allProducts;
    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        whatsappNumber: tenant.whatsappNumber,
        evolutionInstance: tenant.evolutionInstance
      },
      website,
      store: store ? {
        storeEnabled: store.storeEnabled,
        currency: store.currency || "CRC",
        sinpePhone: store.sinpePhone,
        sinpeName: store.sinpeName
      } : null,
      featuredServices,
      featuredProducts
    });
  } catch (error) {
    console.error("Error fetching public website:", error);
    res.status(500).json({ error: "Error al cargar el sitio web" });
  }
});
var website_public_routes_default = router26;

// src/server/routes/queue.routes.ts
import { Router as Router27 } from "express";
var router27 = Router27();
router27.use(authenticateToken);
router27.use(tenantContext);
router27.get("/pending", async (req, res) => {
  try {
    const tenantId = req.user?.role === "superadmin" && req.query.tenantId ? req.query.tenantId : req.tenantId;
    if (!tenantId) return res.status(400).json({ error: "tenantId required" });
    const messages = await getPendingByTenant(tenantId);
    res.json(messages);
  } catch (error) {
    console.error("[QueueRoute] Error pending:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
router27.get("/stats", async (req, res) => {
  try {
    const tenantId = req.user?.role === "superadmin" && req.query.tenantId ? req.query.tenantId : req.tenantId;
    const stats = await getQueueStats(tenantId || void 0);
    res.json(stats);
  } catch (error) {
    console.error("[QueueRoute] Error stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
var queue_routes_default = router27;

// src/server/routes/courts.routes.ts
import { Router as Router28 } from "express";
init_evolution();
init_pool();
var router28 = Router28();
router28.get("/public/:slug/info", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const storeSettingsRes = await query(`
      SELECT store_name, store_slug, store_description, store_logo_url, store_banner_url, 
             store_theme, sinpe_phone, sinpe_name, bank_account_info, currency, store_modules
      FROM store_settings 
      WHERE tenant_id = $1
    `, [tenant.id]);
    const s = storeSettingsRes.rows[0] || {};
    const courtsConfig = s.store_modules?.courtsConfig || {
      paymentMode: "both",
      matchExpiryHours: 1,
      allowSeekMatch: true,
      sportTypes: ["futbol", "padel", "tenis"]
    };
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        whatsappNumber: tenant.whatsappNumber
      },
      storeName: s.store_name || tenant.name,
      storeSlug: s.store_slug || tenant.slug,
      storeDescription: s.store_description || "",
      storeLogoUrl: s.store_logo_url,
      storeBannerUrl: s.store_banner_url,
      storeTheme: s.store_theme || {},
      sinpePhone: s.sinpe_phone,
      sinpeName: s.sinpe_name,
      bankAccountInfo: s.bank_account_info,
      currency: s.currency || "CRC",
      courtsConfig
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener informaci\xF3n de canchas" });
  }
});
router28.get("/public/:slug/courts", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const courts = await getCourtsByTenant(tenant.id);
    res.json(courts.filter((c) => c.active));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener canchas" });
  }
});
router28.get("/public/:slug/available-slots", async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) return res.status(400).json({ error: "Faltan par\xE1metros courtId o date" });
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const slots = await getAvailableSlots(tenant.id, String(courtId), String(date));
    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener espacios" });
  }
});
router28.post("/public/:slug/book", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const data = req.body;
    const booking = await createBooking(tenant.id, data);
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("courtBooking:created", booking);
    }
    if (tenant.evolutionInstance && booking.teamAPhone) {
      const cleanPhone = booking.teamAPhone.replace(/\D/g, "");
      const dParts = booking.date.split("-");
      const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
      const code = booking.id.substring(0, 8).toUpperCase();
      const timeShort = booking.time.substring(0, 5);
      let msg = "";
      if (booking.bookingMode === "seek_match") {
        const cuota = (booking.pricePerTeam || booking.totalPrice / 2).toLocaleString();
        msg = `\u26BD *\xA1Reto Publicado con \xC9xito!*

Hola *${booking.teamACaptain}*,
Tu b\xFAsqueda de reto para el equipo *${booking.teamAName}* ha sido publicada en el portal.

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName || "Cancha Deportiva"}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}
\u2694\uFE0F *Nivel:* ${booking.skillLevel || "Abierto"}
\u{1F4B0} *Tu cuota (50%):* \u20A1${cuota}

Te notificaremos por este medio cuando un equipo rival acepte el reto. \xA1A entrenar!`;
      } else {
        msg = `\u26BD *\xA1Reserva Confirmada!*

Hola *${booking.teamACaptain}*,
Tu reserva de cancha para el equipo *${booking.teamAName}* ha sido confirmada.

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName || "Cancha Deportiva"}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}
\u{1F4B0} *Total a pagar:* \u20A1${booking.totalPrice.toLocaleString()}

\xA1Los esperamos en la cancha!`;
      }
      await sendMessage(tenant.evolutionInstance, `${cleanPhone}@s.whatsapp.net`, msg).catch(console.error);
    }
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear reserva" });
  }
});
router28.get("/public/:slug/open-matches", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const matches = await getOpenMatches(tenant.id);
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener retadores" });
  }
});
router28.post("/public/:slug/join-match/:bookingId", async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: "Negocio no encontrado" });
    const { bookingId } = req.params;
    const booking = await joinMatch(bookingId, tenant.id, req.body);
    if (!booking) return res.status(404).json({ error: "Match no encontrado" });
    if (req.io) {
      req.io.to(`tenant_${tenant.id}`).emit("courtBooking:matched", booking);
    }
    if (tenant.evolutionInstance) {
      const dParts = booking.date.split("-");
      const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
      const code = booking.id.substring(0, 8).toUpperCase();
      const timeShort = booking.time.substring(0, 5);
      const cuota = (booking.pricePerTeam || booking.totalPrice / 2).toLocaleString();
      const msgA = `\u{1F525} *\xA1Reto Aceptado!*

Hola *${booking.teamACaptain}*,
\xA1Tu reto ya tiene rival! El equipo *${booking.teamBName}* (Capit\xE1n: *${booking.teamBCaptain}*, Tel: ${booking.teamBPhone}) ha aceptado el partido.

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName || "Cancha Deportiva"}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}
\u{1F4B0} *Cuota por equipo:* \u20A1${cuota}

\xA1Nos vemos en la cancha!`;
      const msgB = `\u{1F525} *\xA1Te has unido al partido!*

Hola *${booking.teamBCaptain}*,
Tu equipo *${booking.teamBName}* jugar\xE1 contra *${booking.teamAName}* (Capit\xE1n: *${booking.teamACaptain}*, Tel: ${booking.teamAPhone}).

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName || "Cancha Deportiva"}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}
\u{1F4B0} *Tu cuota:* \u20A1${cuota}

\xA1Prep\xE1rense para el partido!`;
      const cleanA = booking.teamAPhone.replace(/\D/g, "");
      const cleanB = booking.teamBPhone?.replace(/\D/g, "");
      if (cleanA) await sendMessage(tenant.evolutionInstance, `${cleanA}@s.whatsapp.net`, msgA).catch(console.error);
      if (cleanB) await sendMessage(tenant.evolutionInstance, `${cleanB}@s.whatsapp.net`, msgB).catch(console.error);
    }
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al unirse al partido" });
  }
});
router28.use(authenticateToken);
router28.use(tenantContext);
router28.get("/", async (req, res) => {
  try {
    const courts = await getCourtsByTenant(req.tenantId);
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener canchas" });
  }
});
router28.post("/", async (req, res) => {
  try {
    const court = await createCourt(req.tenantId, req.body);
    res.status(201).json(court);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear cancha" });
  }
});
router28.put("/:id", async (req, res) => {
  try {
    const court = await updateCourt(req.params.id, req.tenantId, req.body);
    res.json(court);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar cancha" });
  }
});
router28.delete("/:id", async (req, res) => {
  try {
    await deleteCourt(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar cancha" });
  }
});
router28.get("/bookings", async (req, res) => {
  try {
    const date = req.query.date;
    const bookings = await getBookingsByTenant(req.tenantId, date);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});
router28.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.tenantId);
    if (!booking) return res.status(404).json({ error: "Reserva no encontrada" });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener reserva" });
  }
});
router28.post("/bookings", async (req, res) => {
  try {
    const booking = await createBooking(req.tenantId, req.body);
    if (req.io) {
      req.io.to(`tenant_${req.tenantId}`).emit("courtBooking:created", booking);
    }
    const tRes = await query("SELECT evolution_instance FROM tenants WHERE id = $1", [req.tenantId]);
    const evolutionInstance = tRes.rows[0]?.evolution_instance;
    if (evolutionInstance && booking.teamAPhone) {
      const cleanPhone = booking.teamAPhone.replace(/\D/g, "");
      const msg = `\u{1F3BE} *\xA1Reserva Confirmada!*

Hola ${booking.teamACaptain},
Tu reserva ha sido confirmada manualmente.

\u26BD Cancha: ${booking.courtName || "Reservada"}
\u{1F4C5} Fecha: ${booking.date}
\u23F0 Hora: ${booking.time.substring(0, 5)}
\u{1F4B8} Total: \u20A1${booking.totalPrice}

\xA1Gracias por preferirnos!`;
      await sendMessage(evolutionInstance, `${cleanPhone}@s.whatsapp.net`, msg).catch(console.error);
    }
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear reserva" });
  }
});
router28.put("/bookings/:id", async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, req.body);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar reserva" });
  }
});
router28.delete("/bookings/:id", async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.id, req.tenantId);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cancelar reserva" });
  }
});
router28.put("/bookings/:id/confirm-payment-a", async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, { teamAPaid: true });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al confirmar pago A" });
  }
});
router28.put("/bookings/:id/confirm-payment-b", async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, { teamBPaid: true });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al confirmar pago B" });
  }
});
router28.post("/bookings/:id/send-reminder", async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.tenantId);
    if (!booking) return res.status(404).json({ error: "Reserva no encontrada" });
    const { reminderType, targetTeam, customMessage } = req.body;
    const tRes = await query("SELECT evolution_instance, name FROM tenants WHERE id = $1", [req.tenantId]);
    const evolutionInstance = tRes.rows[0]?.evolution_instance;
    const businessName = tRes.rows[0]?.name || "el complejo deportivo";
    if (!evolutionInstance) {
      return res.status(400).json({ error: "No hay instancia de WhatsApp conectada para este negocio." });
    }
    const sRes = await query("SELECT sinpe_phone, sinpe_name, store_modules FROM store_settings WHERE tenant_id = $1", [req.tenantId]);
    const s = sRes.rows[0] || {};
    const sinpePhone = s.store_modules?.courtsConfig?.theme?.sinpePhone || s.sinpe_phone || "";
    const sinpeName = s.store_modules?.courtsConfig?.theme?.sinpeName || s.sinpe_name || "";
    const dParts = booking.date.split("-");
    const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
    const code = booking.id.substring(0, 8).toUpperCase();
    const timeShort = booking.time.substring(0, 5);
    let sentCount = 0;
    if ((targetTeam === "A" || targetTeam === "both" || !targetTeam) && booking.teamAPhone) {
      const cleanA = booking.teamAPhone.replace(/\D/g, "");
      let msgA = "";
      if (customMessage) {
        msgA = customMessage;
      } else if (reminderType === "payment") {
        const amountA = booking.bookingMode === "seek_match" && !booking.teamBName ? booking.pricePerTeam || booking.totalPrice / 2 : booking.pricePerTeam || booking.totalPrice;
        msgA = `\u{1F44B} *\xA1Recordatorio de Pago!*

Hola *${booking.teamACaptain}*,
Te recordamos el pago pendiente para tu reserva de cancha:

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName}
\u{1F4C5} *Fecha:* ${formattedDate} a las ${timeShort}
\u{1F4B0} *Monto a pagar:* \u20A1${Number(amountA).toLocaleString()}
`;
        if (sinpePhone) {
          msgA += `
\u{1F4F2} *SINPE M\xF3vil:* ${sinpePhone}${sinpeName ? ` (${sinpeName})` : ""}
*Detalle:* #RES-${code}`;
        }
      } else {
        msgA = `\u26BD *\xA1Recordatorio de Partido!*

Hola *${booking.teamACaptain}*,
Te recordamos tu partido programado en *${businessName}*:

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}

\u26A0\uFE0F Por favor presentarse 10 minutos antes de la hora acordada. \xA1Buen partido!`;
      }
      await sendMessage(evolutionInstance, `${cleanA}@s.whatsapp.net`, msgA).catch(console.error);
      sentCount++;
    }
    if ((targetTeam === "B" || targetTeam === "both") && booking.teamBPhone) {
      const cleanB = booking.teamBPhone.replace(/\D/g, "");
      let msgB = "";
      if (customMessage) {
        msgB = customMessage;
      } else if (reminderType === "payment") {
        const amountB = booking.pricePerTeam || booking.totalPrice / 2;
        msgB = `\u{1F44B} *\xA1Recordatorio de Pago!*

Hola *${booking.teamBCaptain}*,
Te recordamos el pago de tu cuota de partido:

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName}
\u{1F4C5} *Fecha:* ${formattedDate} a las ${timeShort}
\u{1F4B0} *Monto:* \u20A1${Number(amountB).toLocaleString()}
`;
        if (sinpePhone) {
          msgB += `
\u{1F4F2} *SINPE M\xF3vil:* ${sinpePhone}${sinpeName ? ` (${sinpeName})` : ""}
*Detalle:* #RES-${code}`;
        }
      } else {
        msgB = `\u26BD *\xA1Recordatorio de Partido!*

Hola *${booking.teamBCaptain}*,
Te recordamos tu partido programado en *${businessName}*:

\u{1F4CB} *C\xF3digo:* #RES-${code}
\u{1F3C6} *Cancha:* ${booking.courtName}
\u{1F4C5} *Fecha:* ${formattedDate}
\u23F0 *Hora:* ${timeShort}

\u26A0\uFE0F Por favor presentarse 10 minutos antes de la hora acordada. \xA1Buen partido!`;
      }
      await sendMessage(evolutionInstance, `${cleanB}@s.whatsapp.net`, msgB).catch(console.error);
      sentCount++;
    }
    res.json({ success: true, sentCount });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).json({ error: "Error al enviar recordatorio" });
  }
});
var courts_routes_default = router28;

// src/server/routes/tilopay-webhook.routes.ts
init_pool();
import { Router as Router29 } from "express";
var router29 = Router29();
router29.post("/", async (req, res) => {
  res.status(200).json({ received: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  try {
    const payload = req.body || {};
    console.log("[TilopayWebhook] Notificaci\xF3n recibida:", JSON.stringify(payload));
    const rawOrderId = payload.orderNumber || payload.order_number || payload.order || payload.order_id || payload.orderId || payload.bill_to || payload.reference || payload.merchant_order_id || req.query.orderId || req.query.orderNumber;
    if (!rawOrderId) {
      console.warn("[TilopayWebhook] Webhook omitido: payload no contiene identificador de orden v\xE1lido.");
      return;
    }
    const cleanOrderId = String(rawOrderId).replace(/^#?ORD-?/i, "").trim();
    const resultCode = String(payload.result_code || payload.result || payload.code || "");
    const status = String(payload.status || "").toLowerCase();
    const isApproved = resultCode === "1" || resultCode === "00" || status === "approved" || status === "success" || status === "paid" || payload.approved === true;
    const orderLookup = await query(`
      SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
             o.customer_name as "customerName", o.customer_phone as "customerPhone",
             o.customer_email as "customerEmail", o.total, o.currency, o.channel_origin as "channelOrigin",
             o.payment_status as "paymentStatus", o.delivery_method as "deliveryMethod"
      FROM orders o
      WHERE o.id::text = $1 OR o.order_number::text = $1 OR o.payment_link_token::text = $1
      LIMIT 1
    `, [cleanOrderId]);
    if (orderLookup.rows.length === 0) {
      console.warn(`[TilopayWebhook] No se encontr\xF3 ninguna orden en BD para el identificador: ${cleanOrderId}`);
      return;
    }
    const order = orderLookup.rows[0];
    const tenantId = order.tenantId;
    const transactionId = String(payload.transaction_id || payload.transactionId || payload.id || `tilo_${Date.now()}`);
    const authCode = String(payload.auth_code || payload.authCode || payload.authorization || "");
    if (isApproved) {
      console.log(`[TilopayWebhook] Procesando pago aprobado para orden #${order.orderNumber} (ID: ${order.id})`);
      const result = await executeOrderPaymentConfirmation(tenantId, order.id, {
        tilopayTransactionId: transactionId,
        tilopayAuthCode: authCode,
        paymentMethod: "card",
        paymentReference: transactionId
      });
      if (!result.success) {
        console.error(`[TilopayWebhook] Error al confirmar orden ${order.id} en BD:`, result.error);
        return;
      }
      if (result.alreadyProcessed) {
        console.log(`[TilopayWebhook] Idempotencia activada: Orden #${order.orderNumber} ya hab\xEDa sido confirmada previamente.`);
        return;
      }
      const updatedOrder = result.order;
      emitOrderPaidEvent({
        tenantId,
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerEmail: updatedOrder.customerEmail,
        total: Number(updatedOrder.total),
        currency: updatedOrder.currency || "CRC",
        channelOrigin: updatedOrder.channelOrigin,
        tilopayTransactionId: transactionId,
        tilopayAuthCode: authCode,
        deliveryMethod: updatedOrder.deliveryMethod,
        items: (updatedOrder.items || []).map((i) => ({
          productId: i.productId,
          productName: i.productName,
          variantName: i.variantName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice || Number(i.unitPrice) * Number(i.quantity))
        }))
      });
      if (req.io) {
        req.io.to(`tenant_${tenantId}`).emit("order:updated", updatedOrder);
      }
    } else {
      console.log(`[TilopayWebhook] Notificaci\xF3n de pago no aprobado o fallido para orden #${order.orderNumber}. Estado: ${status || resultCode}`);
      await query(`
        UPDATE orders
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND payment_status = 'pending'
      `, [order.id]);
      if (req.io) {
        req.io.to(`tenant_${tenantId}`).emit("order:updated", { id: order.id, paymentStatus: "failed" });
      }
    }
  } catch (error) {
    console.error("[TilopayWebhook] Error no controlado en procesamiento de webhook:", error);
  }
});
var tilopay_webhook_routes_default = router29;

// src/server/routes/tenant-payment.routes.ts
import { Router as Router30 } from "express";
init_tenant_payment_repo();
var router30 = Router30();
router30.use(authenticateToken);
router30.use(tenantContext);
router30.get("/", async (req, res) => {
  try {
    const config = await getTenantPaymentConfig(req.tenantId);
    res.json(config || {
      provider: "TILOPAY",
      isEnabled: false,
      environment: "SANDBOX",
      isConfigured: false,
      apiUser: "",
      apiKeyMasked: "",
      apiPasswordMasked: "",
      captureMode: "IMMEDIATE"
    });
  } catch (error) {
    console.error("[TenantPaymentRoutes] Error al obtener configuraci\xF3n de pago:", error);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n de pagos" });
  }
});
router30.post("/test", async (req, res) => {
  try {
    const { apiKey, apiUser, apiPassword, environment = "SANDBOX" } = req.body;
    let testKey = apiKey;
    let testPass = apiPassword;
    if (!testKey || testKey.includes("\u2022\u2022\u2022\u2022") || (!testPass || testPass.includes("\u2022\u2022\u2022\u2022"))) {
      const existing = await Promise.resolve().then(() => (init_tenant_payment_repo(), tenant_payment_repo_exports)).then((m) => m.getTenantPaymentConfigRaw(req.tenantId));
      if (existing) {
        testKey = !testKey || testKey.includes("\u2022\u2022\u2022\u2022") ? existing.apiKey : testKey;
        testPass = !testPass || testPass.includes("\u2022\u2022\u2022\u2022") ? existing.apiPassword : testPass;
      }
    }
    const testResult = await TilopayTenantService.verifyCredentials(
      testKey,
      apiUser,
      testPass,
      environment
    );
    if (testResult.success) {
      res.json({ success: true, message: testResult.message });
    } else {
      res.status(400).json({ success: false, error: testResult.message });
    }
  } catch (error) {
    console.error("[TenantPaymentRoutes] Error en prueba de credenciales:", error);
    res.status(500).json({ error: error.message || "Error en prueba de conexi\xF3n" });
  }
});
router30.post("/", async (req, res) => {
  try {
    const { apiKey, apiUser, apiPassword, environment, isEnabled, captureMode } = req.body;
    const changedBy = req.user?.userId || req.user?.role || "admin";
    TilopayTenantService.clearTokenCache(req.tenantId);
    const updated = await saveTenantPaymentConfig(
      req.tenantId,
      {
        apiKey,
        apiUser,
        apiPassword,
        environment,
        isEnabled,
        captureMode
      },
      changedBy
    );
    res.json({
      success: true,
      message: "Configuraci\xF3n de pasarela Tilopay actualizada con \xE9xito",
      config: updated
    });
  } catch (error) {
    console.error("[TenantPaymentRoutes] Error al guardar configuraci\xF3n de pago:", error);
    res.status(500).json({ error: error.message || "Error al guardar configuraci\xF3n de pagos" });
  }
});
router30.get("/audit", async (req, res) => {
  try {
    const logs = await getPaymentAuditLogs(req.tenantId, 20);
    res.json(logs);
  } catch (error) {
    console.error("[TenantPaymentRoutes] Error al obtener auditor\xEDa de pagos:", error);
    res.status(500).json({ error: "Error al obtener registros de auditor\xEDa" });
  }
});
var tenant_payment_routes_default = router30;

// src/server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const server = http.createServer(app);
  const io2 = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });
  io2.on("connection", (socket) => {
    socket.on("join_tenant", (tenantId) => {
      if (tenantId) {
        socket.join(`tenant_${tenantId}`);
      }
    });
  });
  app.use((req, res, next) => {
    req.io = io2;
    next();
  });
  const uploadPath = env.UPLOAD_DIR || path2.join(process.cwd(), "uploads");
  if (!fs2.existsSync(uploadPath)) {
    fs2.mkdirSync(uploadPath, { recursive: true });
  }
  app.use(helmet({
    contentSecurityPolicy: false,
    // Don't block external Google Fonts or Unsplash CDN images
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));
  const authLimiter = rateLimit2({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes window
    max: 20,
    // 20 attempts per 15 minutes per IP
    message: { error: "Demasiados intentos de acceso fallidos. Por favor espera 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false
  });
  const publicLimiter = rateLimit2({
    windowMs: 1 * 60 * 1e3,
    // 1 minute
    max: 200,
    // 200 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false
  });
  app.get("/uploads/:filename", async (req, res, next) => {
    try {
      const filename = path2.basename(req.params.filename);
      const filePath = path2.join(uploadPath, filename);
      if (fs2.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      const dbFile = await query("SELECT mime_type, data_base64 FROM uploaded_files WHERE filename = $1", [filename]);
      if (dbFile.rows.length > 0) {
        const { mime_type, data_base64 } = dbFile.rows[0];
        const buffer = Buffer.from(data_base64, "base64");
        try {
          fs2.writeFileSync(filePath, buffer);
        } catch (wErr) {
        }
        res.set("Content-Type", mime_type || "image/jpeg");
        res.set("Cache-Control", "public, max-age=31536000");
        return res.send(buffer);
      }
      res.status(404).send("Imagen no encontrada");
    } catch (err) {
      console.error("Error serving upload:", err);
      next();
    }
  });
  app.use("/uploads", express.static(uploadPath));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", brand: "Betico", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth", auth_routes_default);
  app.use("/api/tenants", tenant_routes_default);
  app.use("/api/users", users_routes_default);
  app.use("/api/services", services_routes_default);
  app.use("/api/appointments", appointments_routes_default);
  app.use("/api/chats", chats_routes_default);
  app.use("/api/agent", agent_routes_default);
  app.use("/api/evolution", evolution_routes_default);
  app.use("/api/notifications", notifications_routes_default);
  app.use("/api/store", store_routes_default);
  app.use("/api/products", products_routes_default);
  app.use("/api/orders", orders_routes_default);
  app.use("/api/drivers", drivers_routes_default);
  app.use("/api/dashboard", dashboard_routes_default);
  app.use("/api/audit-logs", audit_routes_default);
  app.use("/api/superadmin", superadmin_metrics_routes_default);
  app.use("/api/superadmin/platform", superadmin_platform_routes_default);
  app.use("/api/upload", upload_routes_default);
  app.use("/api/campaigns", campaigns_routes_default);
  app.use("/api/branches", branches_routes_default);
  app.use("/api/specialists", specialists_routes_default);
  app.use("/api/website-public", publicLimiter, website_public_routes_default);
  app.use("/api/website/public", publicLimiter, website_public_routes_default);
  app.use("/api/website", website_routes_default);
  app.use("/api/storefront", publicLimiter, storefront_routes_default);
  app.use("/api/calendar", calendar_routes_default);
  app.use("/api/tenant/payment-config", tenant_payment_routes_default);
  app.use("/api/webhooks/tilopay", tilopay_webhook_routes_default);
  app.use("/api/webhook/evolution", webhook_routes_default);
  app.use("/api/webhook", webhook_routes_default);
  app.use("/webhook", webhook_routes_default);
  app.use("/api/queue", queue_routes_default);
  app.use("/api/courts", courts_routes_default);
  if (env.NODE_ENV === "production") {
    app.use("/assets", express.static(path2.join(__dirname, "assets"), { maxAge: "1y", immutable: true }));
    app.use(express.static(__dirname));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const distDir = path2.join(__dirname);
      const assetsDir = path2.join(distDir, "assets");
      let html = "";
      const indexPath = path2.join(distDir, "index.html");
      if (fs2.existsSync(indexPath)) {
        html = fs2.readFileSync(indexPath, "utf8");
      } else {
        const fallbackPath = path2.join(process.cwd(), "dist", "index.html");
        if (fs2.existsSync(fallbackPath)) {
          html = fs2.readFileSync(fallbackPath, "utf8");
        } else {
          html = '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><div id="root"></div></body></html>';
        }
      }
      if (fs2.existsSync(assetsDir)) {
        try {
          const jsFiles = fs2.readdirSync(assetsDir).filter((f) => f.startsWith("index-") && f.endsWith(".js"));
          if (jsFiles.length > 0) {
            jsFiles.sort((a, b) => fs2.statSync(path2.join(assetsDir, b)).mtimeMs - fs2.statSync(path2.join(assetsDir, a)).mtimeMs);
            const latestJs = jsFiles[0];
            html = html.replace(/src="\/assets\/index-[A-Za-z0-9_-]+\.js"/g, `src="/assets/${latestJs}"`);
          }
        } catch (e) {
          console.error("Error scanning assets dir:", e);
        }
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not available, skipping dev server middleware");
    }
  }
  try {
    await runMigrations();
    console.log("Database migrations completed.");
    await ensureQueueTable();
    startReminderScheduler();
    recoverInterruptedCampaigns();
    startScheduledCampaignScanner();
    startSubscriptionLifecycleWorker();
    startQueueWorker(io2);
    initEvolutionPaymentListeners();
  } catch (err) {
    console.error("Failed to run database migrations:", err);
  }
  server.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Betico Server listening on http://0.0.0.0:${env.PORT}`);
  });
}
startServer().catch(console.error);
//# sourceMappingURL=server.js.map
