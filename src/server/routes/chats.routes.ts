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
    res.status(500).json({ error: 'Error al obtener mensajes de chat' });
  }
});

router.post('/reply', async (req, res) => {
  try {
    const { tenantId } = req;
    const { message, contactId } = req.body;
    // Manual reply via evolution API logic
    res.json({ message: 'Respuesta enviada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar respuesta' });
  }
});

router.post('/toggle-ai', async (req, res) => {
  try {
    const { tenantId } = req;
    const { contactId, aiEnabled } = req.body;
    res.json({ message: 'Estado de IA actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

export default router;
