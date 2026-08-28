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

  const anyActiveInstance = await query(`SELECT evolution_instance FROM tenants WHERE evolution_instance IS NOT NULL AND evolution_instance != '' LIMIT 1`);
  if (anyActiveInstance.rows.length > 0) {
    return anyActiveInstance.rows[0].evolution_instance;
  }
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
    let orders = await getOrdersByTenant(req.tenantId!, req.query as any);
    if ((req as any).user?.role === 'superadmin' && orders.length === 0) {
      const allRes = await query(`
        SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
               o.customer_name as "customerName", o.customer_phone as "customerPhone",
               o.customer_email as "customerEmail", o.customer_address as "customerAddress",
               o.customer_location as "customerLocation", o.whatsapp_jid as "whatsappJid",
               o.source, o.subtotal, o.delivery_fee as "deliveryFee", o.discount, o.total,
               o.currency, o.status, o.payment_method as "paymentMethod",
               o.payment_status as "paymentStatus", o.payment_reference as "paymentReference",
               o.notes, o.delivery_method as "deliveryMethod", o.consumption_mode as "consumptionMode",
               o.table_number as "tableNumber", o.driver_id as "driverId", o.waze_url as "wazeUrl",
               o.created_at as "createdAt", o.updated_at as "updatedAt"
        FROM orders o
        ORDER BY o.created_at DESC
      `);

      const allOrders = [];
      for (const row of allRes.rows) {
        const itemsRes = await query(`
          SELECT id, product_name as "productName", variant_name as "variantName",
                 quantity, unit_price as "unitPrice", total_price as "totalPrice"
          FROM order_items
          WHERE order_id = $1
        `, [row.id]);
        allOrders.push({ ...row, items: itemsRes.rows });
      }
      orders = allOrders;
    }
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

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
});

export default router;
