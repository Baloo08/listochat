import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getOrdersByTenant, getOrderById, updateOrderStatus, confirmPayment } from '../db/orders.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';
import { logAuditEvent } from '../db/audit.repo.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

function normalizeCostaRicaPhone(phone: string): string {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.length === 8) {
    clean = '506' + clean;
  }
  return clean;
}

async function resolveInstanceName(tenantId: string): Promise<string | undefined> {
  const tenant = await getTenantById(tenantId);
  if (tenant?.evolutionInstance) return tenant.evolutionInstance;
  console.warn(`[OrdersRoute] Tenant ${tenantId} does not have a configured WhatsApp evolutionInstance. Notification skipped.`);
  return undefined;
}

const STATUS_LABELS: Record<string, string> = {
  pedido_recibido: 'Pedido Recibido',
  pedido_aceptado: 'Pedido Aceptado',
  procesando: 'En Preparación / Cocina',
  listo_entrega: 'Listo para Entregar',
  en_camino: 'En Camino',
  entregado: 'Entregado con Éxito',
  cancelado: 'Cancelado',
  pending: 'Pedido Recibido',
  confirmed: 'Pedido Aceptado',
  preparing: 'En Preparación',
  shipped: 'En Camino',
  delivered: 'Entregado'
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
      WHERE (tenant_id = $1 OR $2 = 'superadmin') AND status IN ('pedido_recibido', 'pending')
    `, [req.tenantId!, (req as any).user?.role || 'user']);
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


router.put('/:id/proof-status', async (req, res) => {
  try {
    const { proofStatus } = req.body;
    if (!proofStatus || !['pending', 'received', 'verified'].includes(proofStatus)) {
      res.status(400).json({ error: 'Estado de comprobante inválido (pending, received, verified)' });
      return;
    }

    const order = await getOrderById(req.params.id, req.tenantId!);
    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    let paymentStatus = order.paymentStatus;
    if (proofStatus === 'verified') {
      paymentStatus = 'paid';
    } else if (proofStatus === 'received') {
      paymentStatus = 'proof_sent';
    }

    await query(`
      UPDATE orders 
      SET payment_proof_status = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND (tenant_id = $4 OR $5 = 'superadmin')
    `, [proofStatus, paymentStatus, req.params.id, req.tenantId, (req as any).user?.role || 'user']);

    if (proofStatus === 'verified') {
      await logAuditEvent(
        order.tenantId,
        (req as any).user?.userId || 'system',
        'payment_proof_verified',
        'order',
        req.params.id,
        { orderNumber: order.orderNumber, total: order.total, customerName: order.customerName },
        req.ip,
        req.headers['user-agent']
      );
    }

    // Emit real-time update
    if ((req as any).io) {
      (req as any).io.to(`tenant_${order.tenantId}`).emit('order:updated', {
        id: req.params.id,
        paymentProofStatus: proofStatus,
        paymentStatus
      });
    }

    res.json({ success: true, proofStatus, paymentStatus });
  } catch (error) {
    console.error('Error updating proof status:', error);
    res.status(500).json({ error: 'Error al actualizar estado de comprobante' });
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
    const storeName = store?.storeName || tenant?.name || 'nuestro negocio';
    const instanceName = await resolveInstanceName(req.tenantId!);
    const cleanCustomerPhone = normalizeCostaRicaPhone(order.customerPhone || '');

    // Notify customer via WhatsApp for ANY stage change
    if (notifyCustomer && cleanCustomerPhone && instanceName) {
      let msg = '';
      const templates = store?.notificationTemplates;

      if (customMessage) {
        msg = customMessage;
      } else if (status === 'pedido_recibido' || status === 'pending') {
        msg = templates?.orderReceived || `🎉 *¡Gracias por tu pedido en ${storeName}!*

Hola *${order.customerName}*, hemos recibido con éxito tu orden *#ORD-${order.orderNumber}*.

💰 *Total:* ₡${Number(order.total).toLocaleString('es-CR')}
📦 *Estado:* Recibido / En cola

Te estaremos notificando los avances de tu pedido. ¡Muchas gracias por tu preferencia! ⭐`;
      } else if (status === 'procesando' || status === 'preparing' || status === 'pedido_aceptado') {
        msg = `🔥 *¡Tu pedido ya está en preparación!*

Hola *${order.customerName}*, te informamos que tu orden *#ORD-${order.orderNumber}* de *${storeName}* ya está siendo preparada con esmero.

📦 *Estado:* En Cocina / Preparación
Te avisaremos en cuanto esté lista. ⏱️`;
      } else if (status === 'listo_entrega') {
        msg = `⚡ *¡Tu pedido ya está listo!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* ya se encuentra completamente lista para ser entregada o retirada. 🛍️`;
      } else if (status === 'en_camino' || status === 'shipped') {
        msg = templates?.orderInTransit || `🛵 *¡Tu pedido ya va en camino!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* acaba de salir y va en camino.

💰 *Monto a pagar:* ${order.paymentStatus === 'paid' ? '✅ Ya cancelado' : `₡${Number(order.total).toLocaleString('es-CR')}`}
¡Pronto estaremos en tu puerta! 🚀`;
      } else if (status === 'entregado' || status === 'delivered') {
        msg = templates?.orderDelivered || `🎉 *¡Tu pedido ha sido entregado con éxito!*

Hola *${order.customerName}*, tu orden *#ORD-${order.orderNumber}* de *${storeName}* ha sido entregada.

¡Muchas gracias por tu preferencia! Esperamos que lo disfrutes. ⭐`;
      } else if (status === 'cancelado' || status === 'cancelled') {
        msg = `❌ *Notificación de Pedido Cancelado*

Hola *${order.customerName}*, te informamos que tu orden *#ORD-${order.orderNumber}* ha sido cancelada. Si consideras que es un error o necesitas ayuda, responde a este chat.`;
      } else {
        const statusLabel = STATUS_LABELS[status] || status;
        msg = `*Actualización de tu pedido en ${storeName}*\n\nHola *${order.customerName}*,\n\nTe informamos que tu pedido *#ORD-${order.orderNumber}* ha cambiado a estado:\n👉 *${statusLabel}*`;
      }

      msg = msg
        .replace(/{cliente}/g, order.customerName)
        .replace(/{pedido}/g, String(order.orderNumber))
        .replace(/{tienda}/g, storeName)
        .replace(/{total}/g, `₡${Number(order.total).toLocaleString('es-CR')}`)
        .replace(/{cobro}/g, order.paymentStatus === 'paid' ? '✅ Ya cancelado' : `₡${Number(order.total).toLocaleString('es-CR')}`);

      try {
        await sendMessage(instanceName, cleanCustomerPhone, msg);
        await query(`
          INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
          VALUES ($1, $2, $3, $4, 'order_status_update', 'sent')
        `, [
          `notif_${Date.now()}`,
          order.tenantId || req.tenantId!,
          cleanCustomerPhone,
          `Notificación de estado ${status} enviada a ${order.customerName}`
        ]);
      } catch (err) {
        console.error('Error sending WhatsApp order update notification:', err);
      }
    }

    // Emit real-time WebSocket event
    if ((req as any).io) {
      (req as any).io.to(`tenant_${order.tenantId || req.tenantId!}`).emit('order:updated', updated);
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
    const instanceName = await resolveInstanceName(req.tenantId!);
    const cleanCustomerPhone = normalizeCostaRicaPhone(order?.customerPhone || '');

    if (notifyCustomer && cleanCustomerPhone && instanceName && order) {
      const msg = `*Pago Confirmado* ✅\n\nHola *${order.customerName}*, hemos confirmado el pago de tu pedido *#ORD-${order.orderNumber}* por un total de *₡${Number(order.total).toLocaleString('es-CR')}*.\n\nEstamos procesando tu orden de inmediato. ¡Gracias!`;
      try {
        await sendMessage(instanceName, cleanCustomerPhone, msg);
      } catch (e) {
        // ignore
      }
    }

    await logAuditEvent(
      req.tenantId!,
      (req as any).user?.userId || 'system',
      'order_payment_confirmed',
      'order',
      req.params.id,
      {
        orderNumber: order?.orderNumber,
        reference: reference || null,
        total: order?.total,
        customerName: order?.customerName
      },
      req.ip,
      req.headers['user-agent']
    );

    // Emit real-time WebSocket event
    if ((req as any).io) {
      (req as any).io.to(`tenant_${req.tenantId!}`).emit('order:updated', updated || order);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

export default router;
