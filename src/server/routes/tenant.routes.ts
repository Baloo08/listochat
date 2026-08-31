import { Router } from 'express';
import { authenticateToken, requireSuperAdmin, generateToken } from '../middleware/auth.js';
import { getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant } from '../db/tenant.repo.js';
import { createUser, updateUser, getUsersByTenant, getAdminUserByTenant, resetTenantAdminPassword } from '../db/users.repo.js';
import { saveAgentConfig } from '../db/agent-config.repo.js';
import { saveStoreSettings } from '../db/store-settings.repo.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();

router.use(authenticateToken);
router.use(requireSuperAdmin);

router.get('/', async (req, res) => {
  try {
    const tenants = await getAllTenants();
    // Enrich with admin user email
    const enriched = await Promise.all(tenants.map(async (t) => {
      const admin = await getAdminUserByTenant(t.id);
      return {
        ...t,
        adminEmail: admin?.email || 'Sin registrar',
        adminId: admin?.id || null
      };
    }));
    res.json(enriched);
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

export default router;
