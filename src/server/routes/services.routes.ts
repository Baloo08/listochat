import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req;
    // DB fetch logic scoped to tenantId
    res.json({ data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tenantId } = req;
    // Create service logic scoped to tenantId
    res.status(201).json({ message: 'Servicio creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { tenantId } = req;
    // Update service logic
    res.json({ message: 'Servicio actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { tenantId } = req;
    // Delete service logic
    res.json({ message: 'Servicio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

export default router;
