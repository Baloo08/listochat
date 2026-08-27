import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/prompt', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener config' });
  }
});

router.post('/prompt', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Configuración guardada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar config' });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { tenantId } = req;
    const { message } = req.body;
    // Call AI service directly
    res.json({ reply: 'Respuesta simulada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en la simulación' });
  }
});

export default router;
