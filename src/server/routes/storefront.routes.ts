import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { createOrder } from '../db/orders.repo.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const settings = await getStoreSettings(tenant.id);
    res.json({
      ...settings,
      name: tenant.name,
      slug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar tienda' });
  }
});

router.get('/:slug/products', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const products = await getProductsByTenant(tenant.id, true);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar productos' });
  }
});

router.post('/:slug/checkout', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const { customerName, customerPhone, items, paymentMethod, paymentReference } = req.body;
    const subtotal = (items || []).reduce((acc: number, item: any) => acc + (Number(item.unitPrice || 0) * (item.quantity || 1)), 0);

    const order = await createOrder(
      tenant.id,
      {
        customerName,
        customerPhone,
        source: 'store',
        subtotal,
        total: subtotal,
        paymentMethod: paymentMethod || 'sinpe',
        paymentStatus: paymentReference ? 'proof_sent' : 'pending',
        paymentReference: paymentReference || null,
        status: 'pending'
      },
      items || []
    );

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error procesando checkout' });
  }
});

export default router;
