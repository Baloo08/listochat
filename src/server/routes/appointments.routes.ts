import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tenantId } = req;
    res.status(201).json({ message: 'Cita creada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

export default router;
