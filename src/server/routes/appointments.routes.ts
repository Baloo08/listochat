import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getAppointmentsByTenant, createAppointment, updateAppointmentStatus, deleteAppointment } from '../db/appointments.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const list = await getAppointmentsByTenant(req.tenantId, req.query as any);
    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const appt = await createAppointment(req.tenantId, req.body);
    res.status(201).json(appt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateAppointmentStatus(req.params.id, req.tenantId!, status);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await updateAppointmentStatus(req.params.id, req.tenantId!, status);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado de cita' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteAppointment(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});

export default router;
