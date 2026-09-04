import { Router } from 'express';
import { authenticateToken, requireSuperAdmin, generateToken } from '../middleware/auth.js';
import { getAllTenants, getAllTenantsWithAdmin, getTenantById, createTenant, updateTenant, deleteTenant } from '../db/tenant.repo.js';
import { createUser, updateUser, getUsersByTenant, getAdminUserByTenant, resetTenantAdminPassword } from '../db/users.repo.js';
import { saveAgentConfig } from '../db/agent-config.repo.js';
import { saveStoreSettings } from '../db/store-settings.repo.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/', async (req, res) => {
  try {
    const tenants = await getAllTenantsWithAdmin();
    res.json(tenants);
  } catch (error) {
    console.error('Error al obtener inquilinos:', error);
    res.status(500).json({ error: 'Error al obtener inquilinos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    const admin = await getAdminUserByTenant(tenant.id);
    res.json({ ...tenant, adminEmail: admin?.email || null });
  } catch (error) {
    console.error('Error al obtener inquilino:', error);
    res.status(500).json({ error: 'Error al obtener inquilino' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { 
      name, slug, plan, email, adminEmail, phone, whatsappNumber, 
      contactName, customMonthlyPrice, billingCurrency, isTrial, trialDays 
    } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'El nombre del negocio es requerido' });
      return;
    }

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')).toLowerCase().trim();
    const finalEmail = (email || adminEmail || '').toLowerCase().trim();
    const finalPhone = (phone || whatsappNumber || '').trim();
    const finalPlan = plan || 'pro';
    
    let defaultPrice = 55000;
    if (finalPlan === 'enterprise') defaultPrice = 85000;
    else if (finalPlan === 'aliado') defaultPrice = 0;
    else if (finalPlan === 'emprendedor') defaultPrice = 35000;
    else if (finalPlan === 'pro') defaultPrice = 55000;

    const finalPrice = customMonthlyPrice !== undefined && customMonthlyPrice !== '' ? Number(customMonthlyPrice) : defaultPrice;
    const tempPassword = 'admin' + Math.floor(1000 + Math.random() * 9000);

    const tenant = await createTenant({
      name: name.trim(),
      slug: cleanSlug,
      plan: finalPlan,
      whatsappNumber: finalPhone || undefined,
      customMonthlyPrice: finalPrice,
      billingCurrency: billingCurrency || 'CRC',
      subscriptionStatus: isTrial ? 'trial' : 'active',
      trialEndsAt: isTrial ? new Date(Date.now() + (Number(trialDays) || 15) * 86400000) : null,
      aiModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
      active: true
    });

    if (finalEmail) {
      await createUser({
        tenantId: tenant.id,
        name: contactName ? contactName.trim() : `${name} Admin`,
        email: finalEmail,
        password: tempPassword,
        role: 'admin'
      });
    }

    await saveAgentConfig(tenant.id, {
      systemPrompt: `Eres Betico, el Asistente Virtual Inteligente de ${name}. Atiende a los clientes con amabilidad, responde consultas y ayuda a agendar citas o tomar órdenes por WhatsApp.`,
      businessName: name,
      currency: billingCurrency || 'CRC',
      notifyNumber: finalPhone || '',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      autoReplyEnabled: false
    });

    await saveStoreSettings(tenant.id, {
      storeName: name,
      storeSlug: cleanSlug,
      currency: billingCurrency || 'CRC',
      storeEnabled: true,
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true }
    });

    await logAuditEvent(tenant.id, req.user!.userId, 'create_tenant', 'tenant', tenant.id, { name, slug: cleanSlug, plan: finalPlan, email: finalEmail, phone: finalPhone, customMonthlyPrice: finalPrice }, req.ip, req.headers['user-agent']);

    res.status(201).json({
      ...tenant,
      adminEmail: finalEmail || null,
      tempPassword
    });
  } catch (error) {
    console.error('Error al crear inquilino:', error);
    res.status(500).json({ error: 'Error al crear inquilino' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const tenantUpdateData: any = {};
    if (body.name !== undefined) tenantUpdateData.name = body.name;
    if (body.slug !== undefined) tenantUpdateData.slug = body.slug.toLowerCase().trim();
    if (body.plan !== undefined) tenantUpdateData.plan = body.plan;
    if (body.customMonthlyPrice !== undefined) tenantUpdateData.customMonthlyPrice = Number(body.customMonthlyPrice) || 0;
    if (body.billingCurrency !== undefined) tenantUpdateData.billingCurrency = body.billingCurrency;
    if (body.phone !== undefined || body.whatsappNumber !== undefined) {
      tenantUpdateData.whatsappNumber = body.phone || body.whatsappNumber;
    }
    if (body.active !== undefined) tenantUpdateData.active = Boolean(body.active);
    
    if (body.isTrial !== undefined) {
      if (body.isTrial) {
        tenantUpdateData.subscriptionStatus = 'trial';
        const days = Number(body.trialDays) || 15;
        tenantUpdateData.trialEndsAt = new Date(Date.now() + days * 86400000);
      } else {
        tenantUpdateData.subscriptionStatus = 'active';
      }
    }
    if (body.subscriptionStatus !== undefined) {
      tenantUpdateData.subscriptionStatus = body.subscriptionStatus;
    }

    const updated = await updateTenant(id, tenantUpdateData);
    if (!updated) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    // Always update or create the tenant's admin user with the new email / contact name
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
            name: body.contactName ? body.contactName.trim() : `${body.name || 'Admin'}`,
            email: body.email.toLowerCase().trim(),
            role: 'admin',
            password: 'password123'
          });
        }
      } catch (userErr) {
        console.warn('Error updating admin user email/name:', userErr);
      }
    }

    await logAuditEvent(id, req.user!.userId, 'update_tenant', 'tenant', id, body, req.ip, req.headers['user-agent']);
    
    // Return updated tenant with fresh adminEmail
    const freshAdmin = await getAdminUserByTenant(id);
    res.json({
      ...updated,
      adminEmail: freshAdmin?.email || body.email || null,
      adminId: freshAdmin?.id || null
    });
  } catch (error) {
    console.error('Error al actualizar inquilino:', error);
    res.status(500).json({ error: 'Error al actualizar inquilino' });
  }
});

// Reset password for tenant admin
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const success = await resetTenantAdminPassword(tenant.id, newPassword);
    if (!success) {
      // If admin user doesn't exist, create one
      const adminEmail = `admin@${tenant.slug}.cr`;
      await createUser({
        tenantId: tenant.id,
        name: `${tenant.name} Admin`,
        email: adminEmail,
        password: newPassword,
        role: 'admin'
      });
    }

    await logAuditEvent(tenant.id, req.user!.userId, 'reset_admin_password', 'user', tenant.id, { tenantName: tenant.name }, req.ip, req.headers['user-agent']);

    res.json({ success: true, message: `Contraseña de administrador actualizada con éxito para ${tenant.name}` });
  } catch (error) {
    console.error('Error al resetear contraseña de inquilino:', error);
    res.status(500).json({ error: 'Error al actualizar la contraseña' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await logAuditEvent(req.user!.tenantId, req.user!.userId, 'delete_tenant', 'tenant', req.params.id, {}, req.ip, req.headers['user-agent']);
    await deleteTenant(req.params.id);
    res.json({ success: true, message: 'Inquilino eliminado' });
  } catch (error) {
    console.error('Error al eliminar inquilino:', error);
    res.status(500).json({ error: 'Error al eliminar inquilino' });
  }
});

// Impersonation endpoint — SuperAdmin accesses a tenant's portal
router.post('/:id/impersonate', async (req, res) => {
  try {
    const tenant = await getTenantById(req.params.id);
    if (!tenant) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const impersonationToken = generateToken(req.user!.userId, tenant.id, 'admin');

    await logAuditEvent(req.user!.tenantId, req.user!.userId, 'impersonate', 'tenant', tenant.id, { tenantName: tenant.name }, req.ip, req.headers['user-agent']);

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
    console.error('Error al impersonar inquilino:', error);
    res.status(500).json({ error: 'Error al impersonar inquilino' });
  }
});


// 360° Client Dossier Endpoint
router.get('/:id/dossier', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await getTenantById(id);
    if (!tenant) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const adminUser = await getAdminUserByTenant(id);
    const { query } = await import('../db/pool.js');

    // Current month-year string 'YYYY-MM'
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Parallel metric queries
    const [ordersRes, apptsRes, chatsRes, aiRes, paymentsRes, storeSettingsRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM orders WHERE tenant_id = $1', [id]),
      query('SELECT COUNT(*) as count FROM appointments WHERE tenant_id = $1', [id]),
      query('SELECT COUNT(*) as count FROM chat_messages WHERE tenant_id = $1', [id]),
      query('SELECT tokens_used as "tokensUsed", requests_count as "requestsCount" FROM tenant_ai_usage WHERE tenant_id = $1 AND month_year = $2', [id, currentMonth]),
      query('SELECT id, amount, currency, payment_method as "paymentMethod", reference, proof_url as "proofUrl", notes, status, created_at as "createdAt" FROM tenant_payments WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50', [id]),
      query('SELECT store_modules FROM store_settings WHERE tenant_id = $1', [id])
    ]);

    const ordersCount = parseInt(ordersRes.rows[0]?.count || '0', 10);
    const appointmentsCount = parseInt(apptsRes.rows[0]?.count || '0', 10);
    const chatsCount = parseInt(chatsRes.rows[0]?.count || '0', 10);
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
        aiTokensUsed: parseInt(aiUsage.tokensUsed || '0', 10),
        aiRequestsCount: parseInt(aiUsage.requestsCount || '0', 10)
      },
      payments,
      internalNotes: tenant.internalNotes || tenant.settingsJson?.internalNotes || ''
    });
  } catch (error) {
    console.error('Error fetching dossier:', error);
    res.status(500).json({ error: 'Error al obtener expediente del cliente' });
  }
});

// Record a Payment
router.post('/:id/record-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, paymentMethod, reference, proofUrl, notes, extendDays } = req.body;
    const { query } = await import('../db/pool.js');

    const tenant = await getTenantById(id);
    if (!tenant) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }

    const payAmount = Number(amount) || Number(tenant.customMonthlyPrice) || 55000;
    const payCurrency = currency || tenant.billingCurrency || 'CRC';
    const daysToExtend = Number(extendDays) || 30;

    // 1. Insert into tenant_payments
    await query(
      `INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, proof_url, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')`,
      [id, payAmount, payCurrency, paymentMethod || 'sinpe', reference || '', proofUrl || null, notes || '']
    );

    // 2. Update tenant next_billing_date and set active
    await query(
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

    await logAuditEvent(id, req.user!.userId, 'record_payment', 'financial', id, { amount: payAmount, reference, daysToExtend }, req.ip, req.headers['user-agent']);

    const updated = await getTenantById(id);
    res.json({ success: true, message: 'Pago registrado con éxito y suscripción extendida', tenant: updated });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// Update Next Billing Date
router.put('/:id/next-billing-date', async (req, res) => {
  try {
    const { id } = req.params;
    const { nextBillingDate } = req.body;
    if (!nextBillingDate) {
      res.status(400).json({ error: 'Fecha requerida' });
      return;
    }

    const { query } = await import('../db/pool.js');
    await query('UPDATE tenants SET next_billing_date = $1 WHERE id = $2', [new Date(nextBillingDate), id]);
    await logAuditEvent(id, req.user!.userId, 'update_billing_date', 'tenant', id, { nextBillingDate }, req.ip, req.headers['user-agent']);

    res.json({ success: true, nextBillingDate });
  } catch (error) {
    console.error('Error updating billing date:', error);
    res.status(500).json({ error: 'Error al actualizar fecha de cobro' });
  }
});

// Update Internal Notes
router.put('/:id/internal-notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { query } = await import('../db/pool.js');
    await query('UPDATE tenants SET internal_notes = $1 WHERE id = $2', [notes || '', id]);
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({ error: 'Error al guardar anotaciones' });
  }
});

// Collections & Billing Overview Endpoint
router.get('/billing/collections', async (req, res) => {
  try {
    const tenants = await getAllTenants();
    const { query } = await import('../db/pool.js');

    const now = new Date();
    const in3Days = new Date(Date.now() + 3 * 86400000);
    const in7Days = new Date(Date.now() + 7 * 86400000);

    let totalDueCRC = 0;
    let totalCollectedCRC = 0;
    let countPaid = 0;
    let countDueSoon = 0;
    let countGrace = 0;
    let countOverdue = 0;

    const list = await Promise.all(tenants.map(async (t) => {
      const admin = await getAdminUserByTenant(t.id);
      const nextDate = t.nextBillingDate ? new Date(t.nextBillingDate) : (t.trialEndsAt ? new Date(t.trialEndsAt) : new Date(Date.now() + 15 * 86400000));
      const price = Number(t.customMonthlyPrice) || (t.plan === 'enterprise' ? 85000 : t.plan === 'aliado' ? 0 : t.plan === 'emprendedor' ? 35000 : 55000);
      
      const diffMs = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let trafficLight = 'paid'; // green
      let trafficLabel = 'Al Día';
      let trafficColor = '#10b981'; // green

      if (t.subscriptionStatus === 'suspended') {
        trafficLight = 'overdue';
        trafficLabel = 'Suspendido';
        trafficColor = '#ef4444';
        countOverdue++;
      } else if (diffDays < -5) {
        trafficLight = 'overdue';
        trafficLabel = 'En Mora';
        trafficColor = '#ef4444';
        countOverdue++;
      } else if (diffDays < 0) {
        trafficLight = 'grace';
        trafficLabel = 'En Gracia';
        trafficColor = '#f97316';
        countGrace++;
      } else if (diffDays <= 3) {
        trafficLight = 'due_soon';
        trafficLabel = 'Cobro Próximo';
        trafficColor = '#eab308';
        countDueSoon++;
      } else {
        trafficLight = 'paid';
        trafficLabel = 'Al Día';
        trafficColor = '#10b981';
        countPaid++;
      }

      totalDueCRC += price;

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        adminEmail: admin?.email || 'Sin registrar',
        phone: t.whatsappNumber || '',
        monthlyPrice: price,
        currency: t.billingCurrency || 'CRC',
        nextBillingDate: nextDate.toISOString(),
        diffDays,
        trafficLight,
        trafficLabel,
        trafficColor,
        subscriptionStatus: t.subscriptionStatus || 'active',
        internalNotes: t.internalNotes || ''
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
    console.error('Error getting collections:', error);
    res.status(500).json({ error: 'Error al obtener cartera de cobros' });
  }
});

export default router;
