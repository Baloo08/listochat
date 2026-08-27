import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getServicesByTenant, getServiceById, createService, updateService, deleteService } from '../db/services.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const services = await getServicesByTenant(req.tenantId);
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

router.post('/', async (req, res) => {
  try {
    const service = await createService(req.tenantId, req.body);
    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateService(req.params.id, req.tenantId, req.body);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteService(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
