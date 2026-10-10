import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireSuperAdmin, AuthenticatedRequest, hashPassword, generateToken, logAdminAction } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'https://betico.tech';

// 1. Get all tenants with primary admin email and metrics
router.get('/', async (req, res) => {
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
  } catch (error: any) {
    console.error('[Tenants List] Error:', error);
    res.status(500).json({ error: 'Error al obtener la lista de clientes' });
  }
});

// 2. Create tenant
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const {
      name,
      slug,
      plan = 'starter',
      adminEmail,
      whatsappNumber,
      customMonthlyPrice = 0,
      billingCurrency = 'CRC'
    } = req.body;

    if (!name || !slug) {
      res.status(400).json({ error: 'Nombre y slug son requeridos' });
      return;
    }

    const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
    const existing = await query('SELECT id FROM tenants WHERE slug = $1', [cleanSlug]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'El slug ya está en uso por otro comercio' });
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

    // Create primary admin user
    const finalEmail = (adminEmail ? String(adminEmail).toLowerCase().trim() : `admin@${cleanSlug}.cr`);
    const tempPassword = crypto.randomBytes(6).toString('hex') + '!Aa1';
    const pwdHash = hashPassword(tempPassword);

    await query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, 'admin', true)`,
      [tenant.id, `${name.trim()} Admin`, finalEmail, pwdHash]
    );

    // Initialize default store settings
    await query(
      `INSERT INTO store_settings (tenant_id, store_name, store_slug, currency, store_enabled)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id, name.trim(), cleanSlug, billingCurrency]
    ).catch(() => {});

    await logAdminAction(req.user!.userId, 'create_tenant', 'tenant', tenant.id, {
      name, slug: cleanSlug, plan, adminEmail: finalEmail, customMonthlyPrice
    }, req);

    res.status(201).json({
      ...tenant,
      adminEmail: finalEmail,
      tempPassword
    });
  } catch (error: any) {
    console.error('[Create Tenant] Error:', error);
    res.status(500).json({ error: 'Error al crear el comercio' });
  }
});

// 3. Update tenant
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const body = req.body || {};

  try {
    const fields: string[] = [];
    const params: any[] = [id];
    let idx = 2;

    if (body.name !== undefined) { fields.push(`name = $${idx++}`); params.push(body.name.trim()); }
    if (body.slug !== undefined) { fields.push(`slug = $${idx++}`); params.push(body.slug.toLowerCase().trim()); }
    if (body.plan !== undefined) { fields.push(`plan = $${idx++}`); params.push(body.plan); }
    if (body.active !== undefined) { fields.push(`active = $${idx++}`); params.push(Boolean(body.active)); }
    if (body.whatsappNumber !== undefined) { fields.push(`whatsapp_number = $${idx++}`); params.push(body.whatsappNumber); }
    if (body.customMonthlyPrice !== undefined) { fields.push(`custom_monthly_price = $${idx++}`); params.push(Number(body.customMonthlyPrice) || 0); }
    if (body.billingCurrency !== undefined) { fields.push(`billing_currency = $${idx++}`); params.push(body.billingCurrency); }
    if (body.address !== undefined) { fields.push(`address = $${idx++}`); params.push(body.address); }
    if (body.googleMapsUrl !== undefined) { fields.push(`google_maps_url = $${idx++}`); params.push(body.googleMapsUrl); }

    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      await query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = $1`, params);
    }

    // Update admin user email or name if provided
    if (body.adminEmail || body.adminName) {
      const adminRes = await query(
        `SELECT id FROM users WHERE tenant_id = $1 AND role IN ('admin', 'tenant_admin') ORDER BY created_at ASC LIMIT 1`,
        [id]
      );
      if (adminRes.rows.length > 0) {
        const uId = adminRes.rows[0].id;
        const uFields: string[] = [];
        const uParams: any[] = [uId];
        let uIdx = 2;
        if (body.adminEmail) { uFields.push(`email = $${uIdx++}`); uParams.push(body.adminEmail.toLowerCase().trim()); }
        if (body.adminName) { uFields.push(`name = $${uIdx++}`); uParams.push(body.adminName.trim()); }
        if (uFields.length > 0) {
          uFields.push(`updated_at = CURRENT_TIMESTAMP`);
          await query(`UPDATE users SET ${uFields.join(', ')} WHERE id = $1`, uParams);
        }
      }
    }

    await logAdminAction(req.user!.userId, 'update_tenant', 'tenant', id, body, req);

    res.json({ success: true, message: 'Comercio actualizado correctamente' });
  } catch (error: any) {
    console.error('[Update Tenant] Error:', error);
    res.status(500).json({ error: 'Error al actualizar el comercio' });
  }
});

// 4. Reset admin password
router.post('/:id/reset-password', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
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
      // Create user if missing
      const tRes = await query('SELECT slug, name FROM tenants WHERE id = $1', [id]);
      const t = tRes.rows[0];
      await query(
        `INSERT INTO users (tenant_id, name, email, password_hash, role, active)
         VALUES ($1, $2, $3, $4, 'admin', true)`,
        [id, `${t.name} Admin`, `admin@${t.slug}.cr`, pwdHash]
      );
    }

    await logAdminAction(req.user!.userId, 'reset_tenant_password', 'tenant', id, {}, req);

    res.json({ success: true, message: 'Contraseña del administrador actualizada con éxito' });
  } catch (error: any) {
    console.error('[Reset Tenant Password] Error:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

// 5. Delete tenant
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    await logAdminAction(req.user!.userId, 'delete_tenant', 'tenant', id, {}, req);
    await query('DELETE FROM tenants WHERE id = $1', [id]);
    res.json({ success: true, message: 'Comercio eliminado definitivamente' });
  } catch (error: any) {
    console.error('[Delete Tenant] Error:', error);
    res.status(500).json({ error: 'Error al eliminar el comercio' });
  }
});

// 6. Impersonate tenant
router.post('/:id/impersonate', async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    const tRes = await query('SELECT id, name, slug, plan FROM tenants WHERE id = $1', [id]);
    if (tRes.rows.length === 0) {
      res.status(404).json({ error: 'Comercio no encontrado' });
      return;
    }
    const tenant = tRes.rows[0];
    const token = generateToken(req.user!.userId, tenant.id, 'admin');

    await logAdminAction(req.user!.userId, 'impersonate_tenant', 'tenant', id, { name: tenant.name }, req);

    const launchUrl = `${MAIN_APP_URL}/?impersonateToken=${encodeURIComponent(token)}`;

    res.json({
      token,
      launchUrl,
      tenant
    });
  } catch (error: any) {
    console.error('[Impersonate Tenant] Error:', error);
    res.status(500).json({ error: 'Error al generar enlace de impersonación' });
  }
});

export default router;
