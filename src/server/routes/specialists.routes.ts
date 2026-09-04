import { Router } from 'express';
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

// 1. Public Specialist Portal (Login & View by PIN)
router.post('/portal/login', async (req, res) => {
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
    res.json({
      success: true,
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
    const pin = (req.headers['x-specialist-pin'] || req.query.pin) as string;
    if (!pin) {
      res.status(401).json({ error: 'PIN no provisto' });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: 'PIN inválido' });
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
    const pin = (req.headers['x-specialist-pin'] || req.body.pin) as string;
    const { status } = req.body;
    if (!pin) {
      res.status(401).json({ error: 'PIN no provisto' });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: 'PIN inválido' });
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
    const pin = (req.headers['x-specialist-pin'] || req.query.pin) as string;
    const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
    if (!pin) {
      res.status(401).json({ error: 'PIN no provisto' });
      return;
    }
    const specialist = await getSpecialistByPin(pin);
    if (!specialist) {
      res.status(401).json({ error: 'PIN inválido' });
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
