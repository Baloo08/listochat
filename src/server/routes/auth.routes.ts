import { Router } from 'express';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { getUserByEmail, getUserById, verifyPassword } from '../db/users.repo.js';
import { getTenantById, getTenantBySlug } from '../db/tenant.repo.js';
import { getStoreSettings, saveStoreSettings } from '../db/store-settings.repo.js';
import { createTenant } from '../db/tenant.repo.js';
import { createUser } from '../db/users.repo.js';
import { saveAgentConfig } from '../db/agent-config.repo.js';
import { saveWebsiteSettings } from '../db/website.repo.js';
import { query } from '../db/pool.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();

// In-memory rate limiting for brute-force protection
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

function checkRateLimit(key: string): { blocked: boolean; remainingSeconds: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt) return { blocked: false, remainingSeconds: 0 };

  if (attempt.blockedUntil > now) {
    const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
    return { blocked: true, remainingSeconds };
  }

  // Reset if window has expired (10 minutes)
  if (now - attempt.firstAttempt > 10 * 60 * 1000) {
    loginAttempts.delete(key);
  }

  return { blocked: false, remainingSeconds: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key) || { count: 0, firstAttempt: now, blockedUntil: 0 };
  attempt.count += 1;

  // If 15 failed attempts in 10 minutes, block for 5 minutes
  if (attempt.count >= 15) {
    attempt.blockedUntil = now + 5 * 60 * 1000;
  }
  loginAttempts.set(key, attempt);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

// Public endpoint to get tenant branding for dedicated login (/acceso/:slug)
router.get('/tenant-info/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().trim();
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    const store = await getStoreSettings(tenant.id);

    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      whatsappNumber: tenant.whatsappNumber || '',
      logoUrl: store?.storeLogoUrl || '',
      bannerUrl: store?.storeBannerUrl || '',
      theme: store?.storeTheme || { primaryColor: '#16a34a' }
    });
  } catch (error) {
    console.error('Error al obtener info de tenant:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Public Self-Serve Registration Endpoint with 15-Day Free Trial
router.post('/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, password, phone, plan } = req.body;

    if (!businessName || !ownerName || !email || !password) {
      res.status(400).json({ error: 'Por favor completa todos los campos requeridos.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await getUserByEmail(undefined, cleanEmail);
    if (existingUser) {
      res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico.' });
      return;
    }

    // Generate unique slug from business name
    let baseSlug = businessName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'negocio';

    let generatedSlug = baseSlug;
    let counter = 1;
    while (await getTenantBySlug(generatedSlug)) {
      counter++;
      generatedSlug = `${baseSlug}-${counter}`;
    }

    const selectedPlan = plan === 'enterprise' ? 'enterprise' : 'pro';
    const monthlyPrice = selectedPlan === 'enterprise' ? 85000 : 55000;
    const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    // Create tenant with 15-day free trial
    const tenant = await createTenant({
      name: businessName.trim(),
      slug: generatedSlug,
      plan: selectedPlan,
      aiModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
      whatsappNumber: phone ? phone.trim() : undefined,
      active: true,
      settingsJson: {
        customMonthlyPrice: monthlyPrice,
        billingCurrency: 'CRC',
        subscriptionStatus: 'trial',
        trialEndsAt: trialEndsAt
      }
    });

    try {
      await query(
        `UPDATE tenants SET custom_monthly_price = $1, billing_currency = 'CRC', subscription_status = 'trial', trial_ends_at = NOW() + INTERVAL '15 days' WHERE id = $2`,
        [monthlyPrice, tenant.id]
      );
    } catch (e) {
      // Ignore if columns do not exist
    }

    // Create admin user
    const user = await createUser({
      tenantId: tenant.id,
      name: ownerName.trim(),
      email: cleanEmail,
      password: password,
      role: 'admin'
    });

    // Initialize default agent prompt
    await saveAgentConfig(tenant.id, {
      systemPrompt: `Eres Betico, el Asistente Virtual Inteligente de ${businessName}. Atiende a los clientes con amabilidad, responde consultas y ayuda a agendar citas o tomar órdenes por WhatsApp.`,
      businessName: businessName.trim(),
      currency: 'CRC',
      notifyNumber: phone ? phone.trim() : '',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      autoReplyEnabled: true
    });

    // Initialize default store settings
    await saveStoreSettings(tenant.id, {
      storeName: businessName.trim(),
      storeSlug: generatedSlug,
      currency: 'CRC',
      storeEnabled: true,
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true }
    });

    // Initialize default website settings
    await saveWebsiteSettings(tenant.id, {
      websiteEnabled: true,
      headline: `Bienvenidos a ${businessName}`,
      subheadline: 'Calidad, confianza y la mejor atención personalizada directo a tu WhatsApp.',
      aboutTitle: 'Conoce Nuestra Historia',
      aboutText: `Somos ${businessName}, comprometidos con brindar el mejor servicio y productos de primera categoría. Nuestro compromiso es tu satisfacción total.`,
      primaryColor: '#2563eb',
      accentColor: '#10b981',
      fontFamily: 'Inter',
      headerLayout: 'split',
      buttonStyle: 'rounded',
      buttonHoverEffect: true,
      showWhatsappButton: true,
      showAboutSection: true,
      showFeaturesSection: true,
      showProductsSection: true,
      showServicesSection: true,
      showTestimonialsSection: true,
      showContactSection: true,
      contactEmail: cleanEmail,
      contactPhone: phone ? phone.trim() : '',
      featuresJson: [
        { title: 'Atención 24/7 con IA', description: 'Respuestas automáticas e inmediatas a cualquier hora por WhatsApp.' },
        { title: 'Calidad Garantizada', description: 'Cuidamos cada detalle para ofrecerte solo lo mejor.' },
        { title: 'Facilidad de Pago', description: 'Aceptamos SINPE Móvil verificado y transferencias bancarias.' }
      ],
      testimonialsJson: [
        { name: 'Cliente Satisfecho', role: 'Cliente Frecuente', comment: 'Excelente servicio y atención impecable. ¡100% recomendados!' }
      ]
    });

    await logAuditEvent(tenant.id, user.id, 'register_tenant', 'auth', tenant.id, { businessName, email: cleanEmail, plan: selectedPlan }, req.ip, req.headers['user-agent']);

    const token = generateToken(user.id, tenant.id, 'admin');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'admin',
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: selectedPlan,
        trialEndsAt: trialEndsAt
      },
      redirect: '/app?tour=true'
    });
  } catch (error) {
    console.error('Error en auto-registro:', error);
    res.status(500).json({ error: error.message || 'Error al procesar el registro.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const ipKey = req.ip || req.headers['x-forwarded-for'] || 'unknown_ip';
    const rateLimitKey = `${ipKey}_${(email || '').toLowerCase().trim()}`;

    // 1. Rate-limiting check
    const rateCheck = checkRateLimit(rateLimitKey);
    if (rateCheck.blocked) {
      await logAuditEvent(null, null, 'login_blocked_rate_limit', 'security', undefined, { email, ip: ipKey, remainingSeconds: rateCheck.remainingSeconds }, req.ip, req.headers['user-agent']);
      res.status(429).json({
        error: `Demasiados intentos fallidos. Por seguridad, tu acceso está bloqueado temporalmente por ${rateCheck.remainingSeconds} segundos.`
      });
      return;
    }

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
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
      await logAuditEvent(null, null, 'login_failed', 'user', undefined, { email, reason: 'user_not_found' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordFailedAttempt(rateLimitKey);
      await logAuditEvent(user.tenantId, user.id, 'login_failed', 'user', user.id, { email, reason: 'wrong_password' }, req.ip, req.headers['user-agent']);
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }

    if (!user.active) {
      res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Por favor contacta al administrador.' });
      return;
    }

    // If tenantSlug was provided, check if user belongs to this tenant or is superadmin
    if (tenantSlug) {
      const targetTenant = await getTenantBySlug(tenantSlug.toLowerCase().trim());
      if (targetTenant && user.role !== 'superadmin' && user.tenantId !== targetTenant.id) {
        res.status(403).json({
          error: `Esta cuenta no tiene permisos para acceder a ${targetTenant.name}. Por favor verifica tus credenciales.`
        });
        return;
      }
    }

    // Clear failed attempts on successful login
    clearAttempts(rateLimitKey);

    const token = generateToken(user.id, user.tenantId, user.role);
    const tenant = user.tenantId ? await getTenantById(user.tenantId) : null;

    await logAuditEvent(user.tenantId, user.id, 'login', 'user', user.id, { email, role: user.role }, req.ip, req.headers['user-agent']);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name || 'Mi Negocio',
        tenantSlug: tenant?.slug || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error del servidor al procesar el ingreso' });
  }
});

router.get('/me', authenticateToken, async (req: any, res) => {
  try {
    const user = await getUserById(req.user?.userId);
    const tenant = await getTenantById(req.user?.tenantId);
    
    // Always honor the token's active tenantId and role (vital for impersonation!)
    const activeTenantId = req.user?.tenantId || user?.tenantId;
    const activeRole = req.user?.role || user?.role || 'admin';
    
    res.json({
      id: user?.id || req.user?.userId,
      email: user?.email || 'admin@betico.cr',
      name: user?.name || 'Super Admin',
      role: activeRole,
      tenantId: activeTenantId,
      tenantName: tenant?.name || 'Mi Negocio',
      tenantSlug: tenant?.slug || ''
    });
  } catch (err) {
    res.json(req.user);
  }
});

// ==========================================
// PASSWORD RECOVERY VIA WHATSAPP (OTP)
// ==========================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'Ingresa tu correo o número de teléfono registrado' });
      return;
    }

    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const userRes = await (await import('../db/pool.js')).query(`
      SELECT u.id, u.email, u.name, u.tenant_id as "tenantId", 
             t.name as "tenantName", t.whatsapp_number as "whatsappNumber", t.evolution_instance as "evolutionInstance"
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE LOWER(u.email) = LOWER($1) 
         OR (t.whatsapp_number IS NOT NULL AND ($2 != '' AND t.whatsapp_number LIKE '%' || $2 || '%'))
      LIMIT 1
    `, [cleanInput, cleanPhone]);

    if (userRes.rows.length === 0) {
      // Return safe message without exposing whether user exists
      res.json({
        success: true,
        message: 'Si el correo o teléfono está registrado, recibirás un código de 6 dígitos por WhatsApp en breve.'
      });
      return;
    }

    const user = userRes.rows[0];
    const targetPhone = (user.whatsappNumber || cleanPhone || '').replace(/\D/g, '');

    if (!targetPhone || targetPhone.length < 8) {
      res.status(400).json({ error: 'Tu cuenta no tiene un número de WhatsApp vinculado para recibir el código. Por favor contacta a soporte.' });
      return;
    }

    // Generate cryptographically secure 6-digit OTP
    const crypto = await import('crypto');
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const tokenHash = crypto.createHash('sha256').update(otpCode + user.id).digest('hex');

    // Invalidate previous unused tokens for this user
    await (await import('../db/pool.js')).query(`
      UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false
    `, [user.id]);

    // Insert new OTP token (valid for 15 minutes)
    await (await import('../db/pool.js')).query(`
      INSERT INTO password_reset_tokens (user_id, token_hash, otp_code, phone, expires_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + INTERVAL '15 minutes')
    `, [user.id, tokenHash, otpCode, targetPhone]);

    // Dispatch WhatsApp Message
    const { sendMessage } = await import('../services/evolution.js');
    const instanceToUse = user.evolutionInstance || 'betico_soporte' || 'betico_app';
    const waText = `🔒 *[Seguridad Betico]* Hola *${user.name}*, recibimos una solicitud para restablecer la contraseña de tu cuenta en *${user.tenantName || 'Betico'}*.\n\nTu código de verificación es:\n👉 *${otpCode}*\n\n⏳ Este código vence en 15 minutos. Si no solicitaste este cambio, puedes ignorar este mensaje con seguridad.`;

    try {
      await sendMessage(instanceToUse, targetPhone, waText);
    } catch (waErr) {
      console.error('Error sending reset OTP via WhatsApp:', waErr);
    }

    const maskedPhone = '****' + targetPhone.slice(-4);
    res.json({
      success: true,
      maskedPhone,
      message: `Código enviado al WhatsApp terminado en ${maskedPhone}. Ingresa el código de 6 dígitos para continuar.`
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'Error del servidor al procesar la solicitud' });
  }
});

router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { identifier, otpCode } = req.body;
    if (!identifier || !otpCode) {
      res.status(400).json({ error: 'Identificador y código de 6 dígitos requeridos' });
      return;
    }

    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');
    const cleanOtp = (otpCode || '').toString().trim();

    const result = await (await import('../db/pool.js')).query(`
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
      res.status(400).json({ error: 'El código ingresado es inválido o ha expirado. Solicita un nuevo código.' });
      return;
    }

    res.json({ success: true, verified: true });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({ error: 'Error al verificar el código' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { identifier, otpCode, newPassword } = req.body;
    if (!identifier || !otpCode || !newPassword) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const cleanInput = identifier.trim();
    const cleanPhone = cleanInput.replace(/\D/g, '');
    const cleanOtp = (otpCode || '').toString().trim();

    const { query } = await import('../db/pool.js');
    const { hashPassword } = await import('../db/users.repo.js');

    const result = await query(`
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
      res.status(400).json({ error: 'Código inválido o expirado. Por favor inicia el proceso nuevamente.' });
      return;
    }

    const { tokenId, userId } = result.rows[0];
    const newHash = hashPassword(newPassword);

    // Update password
    await query(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [newHash, userId]);

    // Mark token as used
    await query(`
      UPDATE password_reset_tokens SET used = true WHERE id = $1
    `, [tokenId]);

    res.json({ success: true, message: '¡Tu contraseña ha sido restablecida exitosamente! Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Error del servidor al restablecer contraseña' });
  }
});

export default router;
