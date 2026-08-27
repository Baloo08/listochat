import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get('/status', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ status: 'disconnected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const { tenantId } = req;
    // Evolution API connect logic
    res.json({ qrCode: 'data:image/png;base64,...' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al conectar instancia' });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Instancia desconectada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desconectar' });
  }
});

router.post('/send-message', async (req, res) => {
  try {
    const { tenantId } = req;
    res.json({ message: 'Mensaje enviado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

export default router;
