import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getWebsiteSettingsByTenant } from '../db/website.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';

const router = Router();

// GET /api/website/public/:slug - Public endpoint to load website data for storefront/visitor
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || !tenant.active) {
      res.status(404).json({ error: 'Sitio web no encontrado o inactivo' });
      return;
    }

    const [website, services, products, store] = await Promise.all([
      getWebsiteSettingsByTenant(tenant.id),
      getServicesByTenant(tenant.id),
      getProductsByTenant(tenant.id, true),
      getStoreSettings(tenant.id)
    ]);

    const allServices = services.filter(s => s.active !== false).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      duration: s.duration || `${s.estimatedMinutes || 45} min`,
      estimatedMinutes: s.estimatedMinutes || 45,
      category: s.category || 'General'
    }));
    const featuredServices = allServices;

    const featuredProducts = products.slice(0, 8).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      images: p.images,
      category: p.category
    }));

    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        whatsappNumber: tenant.whatsappNumber,
        evolutionInstance: tenant.evolutionInstance
      },
      website,
      store: store ? {
        storeEnabled: store.storeEnabled,
        currency: store.currency || 'CRC',
        sinpePhone: store.sinpePhone,
        sinpeName: store.sinpeName
      } : null,
      featuredServices,
      featuredProducts
    });
  } catch (error) {
    console.error('Error fetching public website:', error);
    res.status(500).json({ error: 'Error al cargar el sitio web' });
  }
});

export default router;
