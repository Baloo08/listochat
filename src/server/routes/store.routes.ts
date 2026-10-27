import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getStoreSettings, saveStoreSettings } from '../db/store-settings.repo.js';
import { updateTenant } from '../db/tenant.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const settings = await getStoreSettings(req.tenantId!);
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener configuración de tienda' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { storeSlug, storeName } = req.body;
    const cleanSlug = storeSlug ? storeSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : undefined;

    const saved = await saveStoreSettings(req.tenantId!, {
      ...req.body,
      storeSlug: cleanSlug || req.body.storeSlug
    });

    // Synchronize tenant slug and name as well
    if (cleanSlug) {
      try {
        await updateTenant(req.tenantId!, {
          slug: cleanSlug,
          ...(storeName ? { name: storeName } : {})
        });
      } catch (err) {
        console.warn('Could not update tenant slug (might be duplicate):', err);
      }
    }

    res.json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar configuración de tienda' });
  }
});

const updateModulesHandler = async (req: any, res: any) => {
  try {
    const existing = await getStoreSettings(req.tenantId!);
    const incomingModules = req.body?.storeModules || req.body || {};
    const currentModules = existing?.storeModules || { storeEnabled: true, bookingsEnabled: true };
    const mergedModules = {
      ...currentModules,
      ...incomingModules
    };
    const nextStoreMode = req.body?.storeMode || existing?.storeMode || 'retail';
    const nextStoreEnabled = mergedModules.storeEnabled !== false;

    if (existing) {
      const saved = await saveStoreSettings(req.tenantId!, {
        ...existing,
        storeEnabled: nextStoreEnabled,
        storeMode: nextStoreMode,
        storeModules: mergedModules
      });
      res.json({
        success: true,
        storeMode: saved.storeMode || nextStoreMode,
        storeModules: saved.storeModules || mergedModules
      });
    } else {
      const saved = await saveStoreSettings(req.tenantId!, {
        storeEnabled: nextStoreEnabled,
        storeMode: nextStoreMode,
        storeModules: mergedModules
      });
      res.json({
        success: true,
        storeMode: saved.storeMode || nextStoreMode,
        storeModules: saved.storeModules || mergedModules
      });
    }
  } catch (error) {
    console.error('Error al actualizar módulos del panel:', error);
    res.status(500).json({ error: 'Error al actualizar configuración de módulos' });
  }
};

router.post('/modules', updateModulesHandler);
router.patch('/modules', updateModulesHandler);

export default router;
