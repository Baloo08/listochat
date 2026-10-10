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
var pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/whatsapp_saas",
  max: 15,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3
});
pool.on("error", (err) => {
  console.error("[Admin DB] Error inesperado en el pool de PostgreSQL:", err);
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
var JWT_SECRET = process.env.JWT_SECRET || "betico-super-secret-jwt-key-2025";
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
var router2 = Router2();
router2.use(requireSuperAdmin);
var MAIN_APP_URL = process.env.MAIN_APP_URL || "https://betico.tech";
var EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "http://evolution:8080";
var EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "B6D711FCDE4D4FD5936544120E713976";
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
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as "todayMsgs",
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as "weekMsgs",
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as "monthMsgs"
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
    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        active: tenant.active,
        customMonthlyPrice: tenant.custom_monthly_price || 0,
        billingCurrency: tenant.billing_currency || "CRC",
        trialEndsAt: tenant.trial_ends_at,
        gracePeriodEndsAt: tenant.grace_period_ends_at,
        whatsappNumber: tenant.whatsapp_number,
        evolutionInstance: tenant.evolution_instance,
        aiProvider: tenant.ai_provider || "gemini",
        aiModel: tenant.ai_model || "gemini-2.5-flash",
        createdAt: tenant.created_at,
        adminName: tenant.adminName,
        adminEmail: tenant.adminEmail,
        adminId: tenant.adminId
      },
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
    res.status(500).json({ error: "Error al obtener el expediente 360\xB0 del cliente" });
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
       SET trial_ends_at = CURRENT_TIMESTAMP + (INTERVAL '1 day' * $1),
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
import crypto2 from "crypto";
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
    const tempPassword = crypto2.randomBytes(6).toString("hex") + "!Aa1";
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
