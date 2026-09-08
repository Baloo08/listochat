import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getSpecialistsByTenant, createSpecialist, updateSpecialist, deleteSpecialist,
  getSpecialistByPin, getActiveAppointmentsForSpecialist,
  getCompletedAppointmentsForSpecialist
} from '../db/specialists.repo.js';
import { getTenantById, getTenantBySlug } from '../db/tenant.repo.js';
import { query } from '../db/pool.js';

const router = Router();

const specialistPortalLoginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const slug = String(req.body?.tenantSlug || req.query?.tenantSlug || req.headers['x-tenant-slug'] || 'general').toLowerCase().trim();
    const rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    return `${rawIp}_${slug}`;
  },
  message: { error: 'Demasiados intentos de acceso fallidos con PIN. Por favor espera 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

async function resolveSpecialistFromRequest(req: any) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.substring(7);
    try {
      const decoded = jwt.verify(rawToken, env.JWT_SECRET) as any;
      if (decoded?.specialistId) {
        const res = await query('SELECT * FROM specialists WHERE id = $1 AND active = TRUE', [decoded.specialistId]);
        if (res.rows[0]) {
          return {
            id: res.rows[0].id,
            tenantId: res.rows[0].tenant_id,
            name: res.rows[0].name,
            phone: res.rows[0].phone,
            specialty: res.rows[0].specialty,
            accessPin: res.rows[0].access_pin,
            showEarnings: res.rows[0].show_earnings !== false
          };
        }
      }
    } catch (e) {
      // fallback to PIN
    }
  }

  const pin = (req.headers['x-specialist-pin'] || req.body?.pin || req.query?.pin) as string;
  if (pin) {
    let tenantId = (req.headers['x-tenant-id'] || req.query?.tenantId) as string | undefined;
    const tenantSlug = (req.headers['x-tenant-slug'] || req.query?.tenantSlug) as string | undefined;
    if (!tenantId && tenantSlug) {
      const tenant = await getTenantBySlug(String(tenantSlug).toLowerCase().trim());
      if (tenant) tenantId = tenant.id;
    }
    return await getSpecialistByPin(pin, undefined, tenantId);
  }

  return null;
}

// 0. Public Specialist Portal Info (Brand, Logo, Colors by Slug)
router.get('/portal/info/:slug', async (req, res) => {
  try {
    const rawSlug = (req.params.slug || '').toLowerCase().trim();
    if (!rawSlug) {
      res.status(400).json({ error: 'Identificador de negocio requerido' });
      return;
    }
    const tenant = await getTenantBySlug(rawSlug);
    if (!tenant || !tenant.active) {
      res.status(404).json({ error: 'Negocio no encontrado o inactivo' });
      return;
    }

    let businessName = tenant.name;
    let logoUrl: string | null = null;
    let primaryColor = '#0284c7';

    try {
      const storeRes = await query('SELECT store_name, store_logo_url, store_theme FROM store_settings WHERE tenant_id = $1', [tenant.id]);
      if (storeRes.rows[0]) {
        const store = storeRes.rows[0];
        if (store.store_name) businessName = store.store_name;
        if (store.store_logo_url) logoUrl = store.store_logo_url;
        if (store.store_theme) {
          const theme = typeof store.store_theme === 'string' ? JSON.parse(store.store_theme) : store.store_theme;
          if (theme?.primaryColor) primaryColor = theme.primaryColor;
          if (!logoUrl && theme?.logoUrl) logoUrl = theme.logoUrl;
        }
      }
    } catch (e) {
      // ignore optional theme lookup failure
    }

    res.json({
      success: true,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      businessName,
      logoUrl,
      primaryColor
    });
  } catch (error) {
    console.error('Error fetching specialist portal info:', error);
    res.status(500).json({ error: 'Error al obtener información del negocio' });
  }
});

// 1. Public Specialist Portal (Login & View by PIN / JWT)
router.post('/portal/login', specialistPortalLoginLimiter, async (req, res) => {
  try {
    const { pin, phone, tenantSlug } = req.body;
    if (!pin) {
      res.status(400).json({ error: 'PIN requerido' });
      return;
    }

    let targetTenant: any = null;
    let targetTenantId: string | undefined;

    if (tenantSlug) {
      const cleanSlug = String(tenantSlug).toLowerCase().trim();
      targetTenant = await getTenantBySlug(cleanSlug);
      if (!targetTenant || !targetTenant.active) {
        res.status(404).json({ error: 'El negocio especificado no existe o está inactivo' });
        return;
      }
      targetTenantId = targetTenant.id;
    }

    const specialist = await getSpecialistByPin(pin, phone, targetTenantId);
    if (!specialist) {
      if (targetTenantId) {
        res.status(401).json({ error: 'Código PIN no válido para este negocio' });
      } else {
        res.status(401).json({ error: 'Código PIN no encontrado o requiere número de teléfono para validar el comercio.' });
      }
      return;
    }

    const tenant = targetTenant || (await getTenantById(specialist.tenantId));

    const token = jwt.sign(
      { specialistId: specialist.id, tenantId: specialist.tenantId, role: 'specialist' },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      specialist: {
        id: specialist.id,
        tenantId: specialist.tenantId,
        tenantSlug: tenant?.slug || tenantSlug || '',
        name: specialist.name,
        phone: specialist.phone,
        specialty: specialist.specialty,
        accessPin: specialist.accessPin,
        businessName: tenant?.name || 'Comercio',
        showEarnings: specialist.showEarnings !== false
      }
    });
  } catch (error) {
    console.error('Specialist login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// 1.1 Verify active session and return specialist profile
router.get('/portal/me', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Sesión no válida o expirada' });
      return;
    }

    const tenant = await getTenantById(specialist.tenantId);

    res.json({
      success: true,
      specialist: {
        id: specialist.id,
        tenantId: specialist.tenantId,
        tenantSlug: tenant?.slug || '',
        name: specialist.name,
        phone: specialist.phone,
        specialty: specialist.specialty,
        accessPin: specialist.accessPin,
        businessName: tenant?.name || 'Comercio',
        showEarnings: specialist.showEarnings !== false
      }
    });
  } catch (error) {
    console.error('Specialist me error:', error);
    res.status(500).json({ error: 'Error al consultar sesión de colaborador' });
  }
});

router.get('/portal/appointments', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de especialista no provistas o inválidas' });
      return;
    }
    const showEarnings = (specialist as any).showEarnings !== false;
    let appointments = await getActiveAppointmentsForSpecialist(specialist.id);
    if (!showEarnings) {
      appointments = appointments.map((a: any) => ({ ...a, amount: 0 }));
    }
    res.json({ appointments, specialistName: specialist.name, showEarnings });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo citas' });
  }
});

router.post('/portal/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de especialista no provistas o inválidas' });
      return;
    }
    await query(
      `UPDATE appointments 
       SET status = $1, specialist_id = COALESCE(specialist_id, $3) 
       WHERE id = $2 AND tenant_id = $4 AND (specialist_id = $3 OR specialist_id IS NULL)`,
      [status || 'completed', req.params.id, specialist.id, specialist.tenantId]
    );
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.get('/portal/history', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de especialista no provistas o inválidas' });
      return;
    }
    const showEarnings = (specialist as any).showEarnings !== false;
    let appointments = await getCompletedAppointmentsForSpecialist(specialist.id, fromDate, toDate);
    const totalEarnings = showEarnings
      ? appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0)
      : 0;

    if (!showEarnings) {
      appointments = appointments.map((a: any) => ({ ...a, amount: 0 }));
    }

    res.json({
      appointments,
      totalCount: appointments.length,
      totalEarnings,
      showEarnings,
      specialistName: specialist.name
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar historial' });
  }
});

// 2.3 Specialist Portal Records Consultation (Strictly filtered to this specialist's patients)
router.get('/portal/records', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de colaborador no provistas o inválidas' });
      return;
    }

    const { getRecordsForSpecialist } = await import('../db/records.repo.js');
    const search = req.query.search ? String(req.query.search) : undefined;
    const records = await getRecordsForSpecialist(specialist.id, specialist.tenantId, search);

    res.json({
      success: true,
      records,
      specialistName: specialist.name
    });
  } catch (error) {
    console.error('Specialist portal records error:', error);
    res.status(500).json({ error: 'Error al consultar expedientes asignados' });
  }
});

// 2.4 Get single patient record details for specialist
router.get('/portal/records/:id', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de colaborador no provistas o inválidas' });
      return;
    }

    const { getRecordForSpecialistById, getRecordEntries, getAppointmentsForRecord } = await import('../db/records.repo.js');
    const record = await getRecordForSpecialistById(req.params.id, specialist.id, specialist.tenantId);
    if (!record) {
      res.status(403).json({ error: 'Acceso no autorizado: este expediente no tiene citas asociadas con tu perfil.' });
      return;
    }

    const [appointments, entries] = await Promise.all([
      getAppointmentsForRecord(record.id, specialist.tenantId),
      getRecordEntries(record.id, specialist.tenantId)
    ]);

    res.json({
      record,
      appointments: appointments.filter(a => a.specialist_id === specialist.id || a.specialistId === specialist.id),
      entries
    });
  } catch (error) {
    console.error('Specialist portal record detail error:', error);
    res.status(500).json({ error: 'Error al consultar detalle del expediente' });
  }
});

// 2.5 Specialist adds a clinical note / vital signs / evolution to their patient
router.post('/portal/records/:id/entries', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de colaborador no provistas o inválidas' });
      return;
    }

    const { getRecordForSpecialistById, addRecordEntry } = await import('../db/records.repo.js');
    const record = await getRecordForSpecialistById(req.params.id, specialist.id, specialist.tenantId);
    if (!record) {
      res.status(403).json({ error: 'Acceso no autorizado: este expediente no tiene citas asociadas con tu perfil.' });
      return;
    }

    const entry = await addRecordEntry(specialist.tenantId, record.id, {
      ...req.body,
      specialistId: specialist.id,
      entryType: req.body.entryType || 'consultation'
    });

    res.status(201).json({
      success: true,
      entry
    });
  } catch (error) {
    console.error('Specialist add record entry error:', error);
    res.status(500).json({ error: 'Error al registrar nota clínica en el expediente' });
  }
});

// 2. Tenant Management Routes
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req: any, res) => {
  try {
    const specialists = await getSpecialistsByTenant(req.tenantId);
    res.json(specialists);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener colaboradores' });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const { name, phone, specialty, accessPin, scheduleType, scheduleConfig, showEarnings } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Nombre es requerido' });
      return;
    }
    const created = await createSpecialist(req.tenantId, {
      name,
      phone,
      specialty,
      accessPin,
      scheduleType,
      scheduleConfig,
      showEarnings: showEarnings !== false
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear colaborador' });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    const updated = await updateSpecialist(req.params.id, req.tenantId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar colaborador' });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    const deleted = await deleteSpecialist(req.params.id, req.tenantId);
    res.json({ success: deleted });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar colaborador' });
  }
});

export default router;
