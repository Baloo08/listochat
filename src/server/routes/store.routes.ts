import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

router.put('/', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Configuraciones actualizadas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar configuraciones' });
  }
});

export default router;
