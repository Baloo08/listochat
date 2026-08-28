import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getOrdersByTenant, getOrderById, updateOrderStatus, confirmPayment } from '../db/orders.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

const STATUS_LABELS: Record<string, string> = {
  pedido_recibido: '📥 Pedido Recibido',
  pedido_aceptado: '✅ Pedido Aceptado',
  procesando: '🍳 En Preparación / Procesando',
  listo_entrega: '🛵 Listo para Entregar / Retirar',
  entregado: '🎉 Entregado con Éxito',
  cancelado: '❌ Cancelado',
  pending: '📥 Pedido Recibido',
  confirmed: '✅ Pedido Aceptado',
  preparing: '🍳 En Preparación',
  shipped: '🛵 En Camino',
  delivered: '🎉 Entregado'
};

router.get('/', async (req, res) => {
  try {
    const orders = await getOrdersByTenant(req.tenantId!, req.query as any);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

router.get('/stats/unread', async (req, res) => {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM orders 
      WHERE tenant_id = $1 AND status IN ('pedido_recibido', 'pending')
    `, [req.tenantId!]);
    res.json({ newOrdersCount: parseInt(result.rows[0]?.count || '0', 10) });
  } catch (error) {
    res.json({ newOrdersCount: 0 });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await getOrderById(req.params.id, req.tenantId!);
    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, notifyCustomer = true, customMessage } = req.body;
    const order = await getOrderById(req.params.id, req.tenantId!);
    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    const updated = await updateOrderStatus(req.params.id, req.tenantId!, status);
    const tenant = await getTenantById(req.tenantId!);
    const store = await getStoreSettings(req.tenantId!);
    const storeName = store?.storeName || tenant?.name || 'la tienda';

    // Notify customer via WhatsApp if enabled and customer has phone
    if (notifyCustomer && order.customerPhone && tenant?.evolutionInstance) {
      const statusLabel = STATUS_LABELS[status] || status;
      let msg = customMessage || `*Actualización de tu pedido en ${storeName}*\n\nHola *${order.customerName}*,\n\nTe informamos que tu pedido *#ORD-${order.orderNumber}* ha cambiado a estado:\n👉 *${statusLabel}*`;

      if (status === 'listo_entrega' || status === 'shipped') {
        msg += `\n\n🛵 ¡Tu pedido ya está listo para ser entregado o retirado!`;
      } else if (status === 'entregado' || status === 'delivered') {
        msg += `\n\n🎉 ¡Muchas gracias por tu compra! Esperamos que disfrutes tus productos.`;
      }

      msg += `\n\n_Cualquier consulta puedes responder a este mensaje._`;

      try {
        await sendMessage(tenant.evolutionInstance, order.customerPhone, msg);
        await query(`
          INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
          VALUES ($1, $2, $3, $4, 'order_status_update', 'sent')
        `, [
          `notif_${Date.now()}`,
          tenant.id,
          order.customerPhone,
          `Notificación de estado ${status} enviada a ${order.customerName}`
        ]);
      } catch (err) {
        console.error('Error sending WhatsApp order update notification:', err);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const { reference, notifyCustomer = true } = req.body;
    const updated = await confirmPayment(req.params.id, req.tenantId!, reference);
    const order = await getOrderById(req.params.id, req.tenantId!);
    const tenant = await getTenantById(req.tenantId!);

    if (notifyCustomer && order?.customerPhone && tenant?.evolutionInstance) {
      const msg = `*Pago Confirmado* ✅\n\nHola *${order.customerName}*, hemos confirmado el pago de tu pedido *#ORD-${order.orderNumber}* por un total de *₡${Number(order.total).toLocaleString('es-CR')}*.\n\nEstamos procesando tu orden de inmediato. ¡Gracias!`;
      try {
        await sendMessage(tenant.evolutionInstance, order.customerPhone, msg);
      } catch (e) {
        // ignore
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

export default router;
