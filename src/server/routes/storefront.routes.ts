import { Router } from 'express';
import { domainResolver } from '../middleware/domainResolver.js';

const router = Router();

router.use(domainResolver);

router.get('/:slug', async (req, res) => {
  try {
    res.json({ data: { storeName: 'Tienda ' + req.params.slug } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener tienda' });
  }
});

router.get('/:slug/products', async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/:slug/products/:productSlug', async (req, res) => {
  try {
    res.json({ data: {} });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/:slug/cart', async (req, res) => {
  try {
    res.json({ message: 'Carrito actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar carrito' });
  }
});

router.post('/:slug/checkout', async (req, res) => {
  try {
    res.status(201).json({ message: 'Orden creada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

export default router;
