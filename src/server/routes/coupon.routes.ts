import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getCouponsByTenant,
  createCoupon,
  deleteCoupon,
  toggleCouponActive,
  validateCoupon,
  redeemCoupon
} from '../services/coupon.service.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

// Listar todos los cupones del comercio
router.get('/', async (req, res) => {
  try {
    const coupons = await getCouponsByTenant(req.tenantId!);
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al listar cupones' });
  }
});

// Crear nuevo cupón promocional
router.post('/', async (req, res) => {
  try {
    const coupon = await createCoupon(req.tenantId!, req.body);
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear cupón' });
  }
});

// Eliminar cupón
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteCoupon(req.tenantId!, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }
    res.json({ success: true, message: 'Cupón eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar cupón' });
  }
});

// Activar o pausar cupón
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { active } = req.body;
    const updated = await toggleCouponActive(req.tenantId!, req.params.id, Boolean(active));
    if (!updated) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar cupón' });
  }
});

// Validar cualquier cupón o código de premio (para el panel / caja)
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await validateCoupon(req.tenantId!, code, Number(subtotal || 0));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al validar cupón' });
  }
});

// Canjear en caja cualquier cupón o voucher de fidelidad
router.post('/redeem', async (req, res) => {
  try {
    const { code, orderId, notes } = req.body;
    const result = await redeemCoupon(req.tenantId!, code, orderId, notes);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al canjear cupón' });
  }
});

export default router;
