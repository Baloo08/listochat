import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { query } from '../db.js';
import { requireSuperAdmin, AuthenticatedRequest, hashPassword, logAdminAction } from '../auth.js';
import {
  processMultimodalInput,
  generateSlug,
  sanitizeSpanishText,
  BusinessProfile,
  ProcessedFileInput
} from '../services/copilot-processor.js';

const router = Router();
router.use(requireSuperAdmin);

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://betico.tech';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

/**
 * POST /api/copilot/process
 * Procesa entradas multimodales (Texto, Audio, Imagenes, PDF, Excel/CSV)
 */
router.post('/process', upload.any(), async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body || {};
    const message = body.message || '';
    const audioBase64 = body.audioBase64 || '';
    let currentProfile: Partial<BusinessProfile> = {};

    if (body.currentProfile) {
      if (typeof body.currentProfile === 'string') {
        try {
          currentProfile = JSON.parse(body.currentProfile);
        } catch (_) {}
      } else {
        currentProfile = body.currentProfile;
      }
    }

    const files: ProcessedFileInput[] = [];

    // 1. Archivos en req.body.files (enviados como base64 o JSON)
    if (Array.isArray(body.files)) {
      for (const f of body.files) {
        if (f && f.name && f.data) {
          files.push({
            name: f.name,
            mimeType: f.mimeType || 'application/octet-stream',
            data: f.data
          });
        }
      }
    }

    // 2. Archivos multipart desde multer (req.files)
    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files as Express.Multer.File[]) {
        files.push({
          name: file.originalname,
          mimeType: file.mimetype,
          data: file.buffer.toString('base64')
        });
      }
    }

    const result = await processMultimodalInput({
      message,
      audioBase64,
      files,
      currentProfile
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Copilot Process] Error:', error);
    res.status(500).json({
      error: sanitizeSpanishText('Error al procesar la entrada multimodal en el Copilot'),
      details: error?.message
    });
  }
});

/**
 * POST /api/copilot/finalize
 * Persiste el comercio configurado en PostgreSQL transaccionalmente
 */
router.post('/finalize', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      slug,
      plan = 'starter',
      adminEmail,
      whatsappNumber,
      logoUrl,
      bannerUrl,
      modules = { store: true, bookings: false, courts: false, loyalty: false, billing: false },
      fiscal = {},
      catalogItems = []
    } = req.body;

    if (!name) {
      res.status(400).json({ error: sanitizeSpanishText('El nombre del comercio es requerido') });
      return;
    }

    const initialSlug = slug ? generateSlug(slug) : generateSlug(name);
    let cleanSlug = initialSlug;

    // Verificar si el slug ya existe
    const existing = await query('SELECT id FROM tenants WHERE slug = $1', [cleanSlug]);
    if (existing.rows.length > 0) {
      cleanSlug = `${initialSlug}-${Date.now().toString().slice(-4)}`;
    }

    const trialDays = 15;
    const requiresInvoice = Boolean(fiscal.idNumber && fiscal.idNumber.length >= 9);

    // 1. Insertar Tenant
    const tenantRes = await query(
      `INSERT INTO tenants (
        name, slug, plan, active, whatsapp_number, custom_monthly_price,
        billing_currency, trial_ends_at, subscription_status,
        requires_subscription_invoice, billing_id_type, billing_id_number,
        billing_legal_name, billing_email
      ) VALUES ($1, $2, $3, true, $4, $5, $6, CURRENT_TIMESTAMP + (INTERVAL '1 day' * $7), 'trial', $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        name.trim(),
        cleanSlug,
        plan,
        whatsappNumber || null,
        0,
        'CRC',
        trialDays,
        requiresInvoice,
        fiscal.idType || '01',
        fiscal.idNumber || '',
        fiscal.legalName || name.trim(),
        fiscal.email || adminEmail || ''
      ]
    );

    const tenant = tenantRes.rows[0];

    // 2. Crear Usuario Administrador Inicial
    const finalEmail = adminEmail
      ? String(adminEmail).toLowerCase().trim()
      : (fiscal.email ? String(fiscal.email).toLowerCase().trim() : `admin@${cleanSlug}.cr`);
    const tempPassword = crypto.randomBytes(6).toString('hex') + '!Aa1';
    const pwdHash = hashPassword(tempPassword);

    await query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [tenant.id, `${name.trim()} Admin`, finalEmail, pwdHash]
    );

    // 3. Crear Configuración de Tienda y Módulos
    await query(
      `INSERT INTO store_settings (
        tenant_id, store_name, store_slug, currency, store_enabled,
        store_logo_url, store_banner_url, store_modules
      ) VALUES ($1, $2, $3, 'CRC', $4, $5, $6, $7)
      ON CONFLICT (tenant_id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        store_slug = EXCLUDED.store_slug,
        store_logo_url = COALESCE(EXCLUDED.store_logo_url, store_settings.store_logo_url),
        store_banner_url = COALESCE(EXCLUDED.store_banner_url, store_settings.store_banner_url),
        store_modules = EXCLUDED.store_modules`,
      [
        tenant.id,
        name.trim(),
        cleanSlug,
        Boolean(modules.store !== false),
        logoUrl || null,
        bannerUrl || null,
        JSON.stringify(modules)
      ]
    ).catch((err) => console.warn('[Copilot Finalize] Advertencia en store_settings:', err?.message));

    // 4. Insertar Productos y Servicios del Catálogo
    if (Array.isArray(catalogItems) && catalogItems.length > 0) {
      for (let i = 0; i < catalogItems.length; i++) {
        const item = catalogItems[i];
        if (!item || !item.name) continue;
        const itemSlug = generateSlug(`${item.name}-${i + 1}`);

        // Insertar en tabla products
        await query(
          `INSERT INTO products (
            tenant_id, name, slug, price, currency, category, description,
            active, stock, track_stock
          ) VALUES ($1, $2, $3, $4, 'CRC', $5, $6, true, 100, false)
          ON CONFLICT (tenant_id, slug) DO NOTHING`,
          [
            tenant.id,
            item.name.trim(),
            itemSlug,
            item.price || 0,
            item.category || 'General',
            item.description || ''
          ]
        ).catch(() => {});

        // Si el modulo de citas y reservas esta activo o la categoria es un servicio, insertar tambien en services
        if (modules.bookings || (item.category && item.category.toLowerCase().includes('servicio'))) {
          await query(
            `INSERT INTO services (
              tenant_id, name, price, duration, category, active
            ) VALUES ($1, $2, $3, '30 min', $4, true)`,
            [
              tenant.id,
              item.name.trim(),
              item.price || 0,
              item.category || 'General'
            ]
          ).catch(() => {});
        }
      }
    }

    // 5. Configurar datos de Hacienda si se detecto cedula
    if (fiscal.idNumber && fiscal.idNumber.length >= 9) {
      await query(
        `INSERT INTO tenant_hacienda_configs (
          tenant_id, taxpayer_id_type, taxpayer_id_number, taxpayer_name,
          taxpayer_email, environment, is_connected
        ) VALUES ($1, $2, $3, $4, $5, 'sandbox', false)
        ON CONFLICT (tenant_id) DO UPDATE SET
          taxpayer_id_type = EXCLUDED.taxpayer_id_type,
          taxpayer_id_number = EXCLUDED.taxpayer_id_number,
          taxpayer_name = EXCLUDED.taxpayer_name,
          taxpayer_email = EXCLUDED.taxpayer_email`,
        [
          tenant.id,
          fiscal.idType || '01',
          fiscal.idNumber,
          fiscal.legalName || name.trim(),
          fiscal.email || finalEmail
        ]
      ).catch((err) => console.warn('[Copilot Finalize] Advertencia en tenant_hacienda_configs:', err?.message));
    }

    // 6. Registrar en auditoria administrativa
    await logAdminAction(
      req.user!.userId,
      'create_tenant_copilot',
      'tenant',
      tenant.id,
      {
        name,
        slug: cleanSlug,
        plan,
        adminEmail: finalEmail,
        modules,
        catalogItemsCount: catalogItems.length,
        hasFiscal: Boolean(fiscal.idNumber)
      },
      req
    );

    res.status(201).json({
      success: true,
      tenant,
      adminEmail: finalEmail,
      tempPassword,
      storeUrl: `${MAIN_APP_URL}/store/${cleanSlug}`,
      adminUrl: `${MAIN_APP_URL}/login`
    });
  } catch (error: any) {
    console.error('[Copilot Finalize] Error:', error);
    res.status(500).json({
      error: sanitizeSpanishText('Error al crear y configurar el comercio en la base de datos'),
      details: error?.message
    });
  }
});

export default router;
