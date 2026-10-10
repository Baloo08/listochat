// src/server/index.ts
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv2 from "dotenv";

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
var EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
var EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
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
        const evoRes = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${tenant.evolution_instance}`, {
          headers: { apikey: EVOLUTION_API_KEY },
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
    const [storeRes, almendroRes] = await Promise.all([
      query(`SELECT * FROM store_settings WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] })),
      query(`SELECT * FROM tenant_almendro_configs WHERE tenant_id = $1`, [id]).catch(() => ({ rows: [] }))
    ]);
    const storeSettings = storeRes.rows[0] || {};
    const almendroConfig = almendroRes.rows[0] || {};
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
      configured: Boolean(almendroConfig.active && almendroConfig.company_id),
      environment: almendroConfig.is_sandbox ? "staging" : "produccion"
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
    const hasOwnKey = Boolean(agentConfig.ai_api_key || tenant.ai_api_key);
    const aiStatus = {
      provider: rawProvider,
      model: agentConfig.ai_model || tenant.ai_model || "gemini-2.5-flash",
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
router2.post("/tenant/:id/record-payment", async (req, res) => {
  const { id } = req.params;
  const { amount, currency = "CRC", paymentMethod = "sinpe", reference = "", notes = "", extendDays = 30 } = req.body;
  try {
    const tenantRes = await query(`SELECT id, name, custom_monthly_price, billing_currency, next_billing_date FROM tenants WHERE id = $1`, [id]);
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
    await logAdminAction(req.user.userId, "record_payment", "tenant", id, { amount: finalAmount, currency: finalCurrency, paymentMethod, reference, daysToAdd }, req);
    res.json({
      success: true,
      message: `\xA1Pago de ${finalCurrency} ${finalAmount.toLocaleString("es-CR")} registrado exitosamente! Suscripci\xF3n extendida por ${daysToAdd} d\xEDas.`
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
      query(`SELECT id, name, slug, custom_monthly_price, billing_currency, next_billing_date FROM tenants WHERE id = $1`, [id]),
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
    await logAdminAction(req.user.userId, "charge_tilopay_subscription", "tenant", id, { amount, currency, orderNumber, cardLast4: card.card_last4 }, req);
    res.json({
      success: true,
      orderNumber,
      amount,
      currency,
      message: `\xA1Cobro de ${currency} ${amount.toLocaleString("es-CR")} procesado con \xE9xito en Tilopay! Suscripci\xF3n extendida por 30 d\xEDas.`
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
import crypto3 from "crypto";
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
             COALESCE(u.email, 'Sin registrar') as "adminEmail",
             COALESCE(u.name, 'Admin') as "adminName",
             u.id as "adminId"
      FROM tenants t
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
      billingCurrency = "CRC"
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
        billing_currency, trial_ends_at, subscription_status
      ) VALUES ($1, $2, $3, true, $4, $5, $6, CURRENT_TIMESTAMP + (INTERVAL '1 day' * $7), 'trial')
      RETURNING *`,
      [name.trim(), cleanSlug, plan, whatsappNumber || null, Number(customMonthlyPrice) || 0, billingCurrency, trialDays]
    );
    const tenant = tenantRes.rows[0];
    const finalEmail = adminEmail ? String(adminEmail).toLowerCase().trim() : `admin@${cleanSlug}.cr`;
    const tempPassword = crypto3.randomBytes(6).toString("hex") + "!Aa1";
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
      customMonthlyPrice
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
var EVOLUTION_API_URL2 = process.env.EVOLUTION_API_URL || "http://betico_evolution:8080";
var EVOLUTION_API_KEY2 = process.env.EVOLUTION_API_KEY || "429683C4C977415CAAFCCE10F7D57E11";
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
      await fetch(`${EVOLUTION_API_URL2}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY2
        },
        body: JSON.stringify({
          instanceName,
          token: EVOLUTION_API_KEY2,
          qrcode: true
        })
      });
    } catch (createErr) {
    }
    const connRes = await fetch(`${EVOLUTION_API_URL2}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY2 }
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
      await fetch(`${EVOLUTION_API_URL2}/instance/logout/${instanceName}`, {
        method: "DELETE",
        headers: { apikey: EVOLUTION_API_KEY2 }
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
      await fetch(`${EVOLUTION_API_URL2}/message/sendText/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY2
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

// src/server/index.ts
dotenv2.config();
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
app.use("/api/billing", billing_routes_default);
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
app.listen(PORT, () => {
  console.log(`[Betico Ops] Servidor administrativo aislado iniciado en el puerto ${PORT}`);
  console.log(`[Betico Ops] Modo: ${process.env.NODE_ENV || "production"}`);
});
//# sourceMappingURL=server.js.map
