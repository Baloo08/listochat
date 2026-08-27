import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getStoreSettings, saveStoreSettings } from '../db/store-settings.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const settings = await getStoreSettings(req.tenantId);
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuración de tienda' });
  }
});

router.post('/', async (req, res) => {
  try {
    const saved = await saveStoreSettings(req.tenantId, req.body);
    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar configuración de tienda' });
  }
});

export default router;
