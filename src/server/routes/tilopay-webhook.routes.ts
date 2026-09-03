import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { executeOrderPaymentConfirmation } from '../db/orders.repo.js';
import { emitOrderPaidEvent } from '../services/event-bus.service.js';

const router = Router();

/**
 * Public Webhook endpoint for Tilopay transaction notifications.
 * Mounted at /api/webhooks/tilopay.
 * Fast response (< 2s) and idempotent transaction processing.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Always return immediate 200 OK so Tilopay does not time out
  res.status(200).json({ received: true, timestamp: new Date().toISOString() });

  try {
    const payload = req.body || {};
    console.log('[TilopayWebhook] Notificación recibida:', JSON.stringify(payload));

    // Extract Order Identifier (UUID, orderNumber or token)
    const rawOrderId =
      payload.order_id ||
      payload.orderId ||
      payload.bill_to ||
      payload.reference ||
      payload.merchant_order_id ||
      req.query.orderId;

    if (!rawOrderId) {
      console.warn('[TilopayWebhook] Webhook omitido: payload no contiene identificador de orden válido.');
      return;
    }

    const cleanOrderId = String(rawOrderId).replace(/^#ORD-/, '').trim();

    // Check transaction status from Tilopay payload
    const resultCode = String(payload.result_code || payload.result || payload.code || '');
    const status = String(payload.status || '').toLowerCase();
    const isApproved =
      resultCode === '1' ||
      resultCode === '00' ||
      status === 'approved' ||
      status === 'success' ||
      status === 'paid' ||
      payload.approved === true;

    // Resolve order in database
    const orderLookup = await query(`
      SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
             o.customer_name as "customerName", o.customer_phone as "customerPhone",
             o.customer_email as "customerEmail", o.total, o.currency, o.channel_origin as "channelOrigin",
             o.payment_status as "paymentStatus", o.delivery_method as "deliveryMethod"
      FROM orders o
      WHERE o.id::text = $1 OR o.order_number::text = $1 OR o.payment_link_token::text = $1
      LIMIT 1
    `, [cleanOrderId]);

    if (orderLookup.rows.length === 0) {
      console.warn(`[TilopayWebhook] No se encontró ninguna orden en BD para el identificador: ${cleanOrderId}`);
      return;
    }

    const order = orderLookup.rows[0];
    const tenantId = order.tenantId;

    const transactionId = String(payload.transaction_id || payload.transactionId || payload.id || `tilo_${Date.now()}`);
    const authCode = String(payload.auth_code || payload.authCode || payload.authorization || '');

    if (isApproved) {
      console.log(`[TilopayWebhook] Procesando pago aprobado para orden #${order.orderNumber} (ID: ${order.id})`);

      // 1. Transacción atómica en BD: Actualiza a PAID y descuenta inventario con rollback
      const result = await executeOrderPaymentConfirmation(tenantId, order.id, {
        tilopayTransactionId: transactionId,
        tilopayAuthCode: authCode,
        paymentMethod: 'card',
        paymentReference: transactionId
      });

      if (!result.success) {
        console.error(`[TilopayWebhook] Error al confirmar orden ${order.id} en BD:`, result.error);
        return;
      }

      if (result.alreadyProcessed) {
        console.log(`[TilopayWebhook] Idempotencia activada: Orden #${order.orderNumber} ya había sido confirmada previamente.`);
        return;
      }

      const updatedOrder = result.order!;

      // 2. Emitir evento desacoplado OrderPaidEvent hacia el EventBus
      emitOrderPaidEvent({
        tenantId,
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerEmail: updatedOrder.customerEmail,
        total: Number(updatedOrder.total),
        currency: updatedOrder.currency || 'CRC',
        channelOrigin: updatedOrder.channelOrigin as any,
        tilopayTransactionId: transactionId,
        tilopayAuthCode: authCode,
        deliveryMethod: updatedOrder.deliveryMethod,
        items: (updatedOrder.items || []).map(i => ({
          productId: i.productId,
          productName: i.productName,
          variantName: i.variantName,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice || Number(i.unitPrice) * Number(i.quantity))
        }))
      });

      // 3. Emitir WebSocket en tiempo real hacia KDS y Dashboard del tenant
      if ((req as any).io) {
        (req as any).io.to(`tenant_${tenantId}`).emit('order:updated', updatedOrder);
      }
    } else {
      console.log(`[TilopayWebhook] Notificación de pago no aprobado o fallido para orden #${order.orderNumber}. Estado: ${status || resultCode}`);
      await query(`
        UPDATE orders
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND payment_status = 'pending'
      `, [order.id]);

      if ((req as any).io) {
        (req as any).io.to(`tenant_${tenantId}`).emit('order:updated', { id: order.id, paymentStatus: 'failed' });
      }
    }
  } catch (error) {
    console.error('[TilopayWebhook] Error no controlado en procesamiento de webhook:', error);
  }
});

export default router;
