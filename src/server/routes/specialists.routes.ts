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
  max: 5,
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
        const res = await query('SELECT * FROM specialists WHERE id = $1', [decoded.specialistId]);
        if (res.rows[0]) {
          return {
            id: res.rows[0].id,
            tenantId: res.rows[0].tenant_id,
            name: res.rows[0].name,
            phone: res.rows[0].phone,
            specialty: res.rows[0].specialty,
            accessPin: res.rows[0].access_pin
          };
        }
      }
    } catch (e) {
      // fallback to PIN
    }
  }

  const pin = (req.headers['x-specialist-pin'] || req.body?.pin || req.query?.pin) as string;
  if (pin) {
    return await getSpecialistByPin(pin);
  }

  return null;
}

// 1. Public Specialist Portal (Login & View by PIN / JWT)
router.post('/portal/login', specialistPortalLoginLimiter, async (req, res) => {
  try {
    const { pin, phone, tenantSlug } = req.body;
    if (!pin) {
      res.status(400).json({ error: 'PIN requerido' });
      return;
    }
    let targetTenantId: string | undefined;
    if (tenantSlug) {
      const targetTenant = await getTenantBySlug(String(tenantSlug).toLowerCase().trim());
      if (targetTenant) targetTenantId = targetTenant.id;
    }
    const specialist = await getSpecialistByPin(pin, phone, targetTenantId);
    if (!specialist) {
      res.status(401).json({ error: 'Código PIN no encontrado o requiere número de teléfono para validar el comercio.' });
      return;
    }
    const tenant = await getTenantById(specialist.tenantId);

    const token = jwt.sign(
      { specialistId: specialist.id, tenantId: specialist.tenantId, role: 'specialist' },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      specialist: {
        id: specialist.id,
        tenantId: specialist.tenantId,
        name: specialist.name,
        phone: specialist.phone,
        specialty: specialist.specialty,
        accessPin: specialist.accessPin,
        businessName: tenant?.name || 'Comercio'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/portal/appointments', async (req, res) => {
  try {
    const specialist = await resolveSpecialistFromRequest(req);
    if (!specialist) {
      res.status(401).json({ error: 'Credenciales de especialista no provistas o inválidas' });
      return;
    }
    const appointments = await getActiveAppointmentsForSpecialist(specialist.id);
    res.json({ appointments, specialistName: specialist.name });
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
    await query('UPDATE appointments SET status = $1 WHERE id = $2 AND specialist_id = $3', [status || 'completed', req.params.id, specialist.id]);
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
    const appointments = await getCompletedAppointmentsForSpecialist(specialist.id, fromDate, toDate);
    const totalEarnings = appointments.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    res.json({
      appointments,
      totalCount: appointments.length,
      totalEarnings,
      specialistName: specialist.name
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar historial' });
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
    const { name, phone, specialty, accessPin } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Nombre es requerido' });
      return;
    }
    const created = await createSpecialist(req.tenantId, { name, phone, specialty, accessPin });
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
