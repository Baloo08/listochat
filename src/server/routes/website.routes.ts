import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getWebsiteSettingsByTenant, saveWebsiteSettings } from '../db/website.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

// GET /api/website - Fetch website settings for the authenticated tenant
router.get('/', async (req, res) => {
  try {
    const settings = await getWebsiteSettingsByTenant(req.tenantId!);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching website settings:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del sitio web' });
  }
});

// POST /api/website - Update website settings
router.post('/', async (req, res) => {
  try {
    const updated = await saveWebsiteSettings(req.tenantId!, req.body);
    res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error saving website settings:', error);
    res.status(500).json({ error: 'Error al guardar la configuración del sitio web' });
  }
});

export default router;
