import { Router } from 'express';
import { authenticateToken, requireSuperAdmin, generateToken } from '../middleware/auth.js';
import { getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant } from '../db/tenant.repo.js';
import { createUser, getAdminUserByTenant, resetTenantAdminPassword } from '../db/users.repo.js';
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
    const { name, slug, plan, adminEmail, adminPassword } = req.body;
    if (!name || !slug) {
      res.status(400).json({ error: 'Nombre y slug requeridos' });
      return;
    }

    const tenant = await createTenant({
      name,
      slug: slug.toLowerCase().trim(),
      plan: plan || 'starter',
      aiModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
      active: true
    });

    if (adminEmail && adminPassword) {
      await createUser({
        tenantId: tenant.id,
        name: `${name} Admin`,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
    }

    await saveAgentConfig(tenant.id, {
      systemPrompt: `Eres Betico, el Asistente Virtual Inteligente de ${name}. Atiende a los clientes con amabilidad, responde consultas y ayuda a agendar citas o tomar órdenes por WhatsApp.`,
      businessName: name,
      currency: 'CRC',
      notifyNumber: '',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      autoReplyEnabled: false
    });

    await saveStoreSettings(tenant.id, {
      storeName: name,
      storeSlug: slug.toLowerCase().trim(),
      currency: 'CRC',
      storeEnabled: true,
      storeMode: 'retail',
      storeModules: { storeEnabled: true, bookingsEnabled: true }
    });

    await logAuditEvent(tenant.id, req.user!.userId, 'create_tenant', 'tenant', tenant.id, { name, slug, plan }, req.ip, req.headers['user-agent']);

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Error al crear inquilino:', error);
    res.status(500).json({ error: 'Error al crear inquilino' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateTenant(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Inquilino no encontrado' });
      return;
    }
    await logAuditEvent(req.params.id, req.user!.userId, 'update_tenant', 'tenant', req.params.id, req.body, req.ip, req.headers['user-agent']);
    res.json(updated);
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
