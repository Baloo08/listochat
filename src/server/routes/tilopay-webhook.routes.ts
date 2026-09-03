import { Router, Request, Response } from 'express';
import { query } from '../db/pool.js';
import { executeOrderPaymentConfirmation } from '../db/orders.repo.js';
import { emitOrderPaidEvent } from '../services/event-bus.service.js';
import { getAppointmentById, updateAppointmentPayment } from '../db/appointments.repo.js';
import { getBookingById, updateCourtBookingPayment } from '../db/courts.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { sendMessage } from '../services/evolution.js';

const router = Router();

/**
 * Public Webhook endpoint for Tilopay transaction notifications.
 * Mounted at /api/webhooks/tilopay.
 * Fast response (< 2s) and idempotent transaction processing.
 * Supports Multi-Entity:
 * - ORD-*: Orders (Store & Restaurant)
 * - APT-*: Appointments (Citas y Reservas)
 * - CRT-*: Court Bookings (Canchas Deportivas & Busca Rival)
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Always return immediate 200 OK so Tilopay does not time out
  res.status(200).json({ received: true, timestamp: new Date().toISOString() });

  try {
    const payload = req.body || {};
    console.log('[TilopayWebhook] Notificación recibida:', JSON.stringify(payload));

    // Extract Order Identifier (UUID, orderNumber or token)
    const rawOrderId =
      payload.orderNumber ||
      payload.order_number ||
      payload.order ||
      payload.order_id ||
      payload.orderId ||
      payload.bill_to ||
      payload.reference ||
      payload.merchant_order_id ||
      req.query.orderId ||
      req.query.orderNumber;

    if (!rawOrderId) {
      console.warn('[TilopayWebhook] Webhook omitido: payload no contiene identificador de orden válido.');
      return;
    }

    const orderStr = String(rawOrderId).trim();

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

    const transactionId = String(payload.transaction_id || payload.transactionId || payload.id || `tilo_${Date.now()}`);
    const authCode = String(payload.auth_code || payload.authCode || payload.authorization || '');
    const isSinpe = String(payload.payment_type || payload.type || payload.method || '').toLowerCase().includes('sinpe');
    const paymentMethod = isSinpe ? 'sinpe_tilopay' : 'card';
    const paymentLabel = isSinpe ? 'SINPE Móvil Verificado' : 'Tarjeta Débito/Crédito';

    // =========================================================================
    // ROUTING CASE 1: CITAS / APPOINTMENTS (Prefix: APT-)
    // =========================================================================
    if (orderStr.startsWith('APT-')) {
      const cleanAptId = orderStr.replace(/^APT-/i, '').trim();
      const apt = await getAppointmentById(cleanAptId);
      if (!apt) {
        console.warn(`[TilopayWebhook] No se encontró cita en BD para ID: ${cleanAptId}`);
        return;
      }

      if (isApproved) {
        console.log(`[TilopayWebhook] Pago aprobado para cita ${apt.id} (${apt.name} - ${apt.service})`);
        const updatedApt = await updateAppointmentPayment(apt.id, {
          paymentStatus: 'paid',
          paymentMethod,
          paymentReference: transactionId,
          tilopayTransactionId: transactionId,
          tilopayAuthCode: authCode
        });

        if ((req as any).io) {
          (req as any).io.to(`tenant_${apt.tenantId}`).emit('appointment:updated', updatedApt || { ...apt, paymentStatus: 'paid', status: 'confirmed' });
        }

        // Send WhatsApp confirmation to client
        try {
          const tenant = await getTenantById(apt.tenantId);
          if (tenant?.evolutionInstance && apt.whatsapp) {
            const cleanPhone = apt.whatsapp.replace(/\D/g, '');
            const msg = `✅ *¡Pago Confirmado!* (${paymentLabel})\n\nHola *${apt.name}*, tu cita en *${tenant.name}* ha sido confirmada con éxito.\n\n📅 *Fecha:* ${apt.date}\n⏰ *Hora:* ${apt.time}\n💼 *Servicio:* ${apt.service}\n💰 *Monto Pagado:* ₡${Number(apt.amount).toLocaleString('es-CR')}\n🔖 *Comprobante:* #${transactionId}\n\n¡Te esperamos! ⭐`;
            await sendMessage(tenant.evolutionInstance, cleanPhone, msg);
          }
        } catch (msgErr) {
          console.error('[TilopayWebhook] Error al enviar WhatsApp de cita confirmada:', msgErr);
        }
      } else {
        console.log(`[TilopayWebhook] Pago fallido para cita ${apt.id}.`);
        await updateAppointmentPayment(apt.id, { paymentStatus: 'failed' });
        if ((req as any).io) {
          (req as any).io.to(`tenant_${apt.tenantId}`).emit('appointment:updated', { ...apt, paymentStatus: 'failed' });
        }
      }
      return;
    }

    // =========================================================================
    // ROUTING CASE 2: CANCHAS DEPORTIVAS / COURT BOOKINGS (Prefix: CRT-)
    // =========================================================================
    if (orderStr.startsWith('CRT-')) {
      const match = orderStr.match(/^CRT-([AB])-(.+)$/i);
      const team = match ? (match[1].toLowerCase() as 'a' | 'b') : 'a';
      const cleanBookingId = match ? match[2].trim() : orderStr.replace(/^CRT-/i, '').trim();

      const booking = await getBookingById(cleanBookingId);
      if (!booking) {
        console.warn(`[TilopayWebhook] No se encontró reserva de cancha para ID: ${cleanBookingId}`);
        return;
      }

      if (isApproved) {
        console.log(`[TilopayWebhook] Pago aprobado para cancha ${booking.id} (Equipo ${team.toUpperCase()})`);
        const updatedBooking = await updateCourtBookingPayment(booking.id, team, {
          tilopayTxId: transactionId,
          tilopayAuth: authCode,
          paymentMethod,
          paymentReference: transactionId
        });

        if ((req as any).io) {
          (req as any).io.to(`tenant_${booking.tenantId}`).emit('court_booking:updated', updatedBooking || booking);
        }

        // Send WhatsApp confirmation to team captain
        try {
          const tenant = await getTenantById(booking.tenantId);
          const captainPhone = team === 'b' ? booking.teamBPhone : booking.teamAPhone;
          const captainName = team === 'b' ? (booking.teamBCaptain || booking.teamBName || 'Equipo B') : (booking.teamACaptain || booking.teamAName || 'Equipo A');
          if (tenant?.evolutionInstance && captainPhone) {
            const cleanPhone = captainPhone.replace(/\D/g, '');
            const amountPaid = team === 'b' ? (booking.pricePerTeam || booking.totalPrice / 2) : (booking.pricePerTeam || booking.totalPrice);
            const msg = `⚽ *¡Pago de Cancha Confirmado!* (${paymentLabel})\n\nHola *${captainName}*, el pago para la reserva de cancha ha sido confirmado con éxito.\n\n🏟️ *Cancha:* ${booking.courtName || 'Cancha Deportiva'}\n📅 *Fecha:* ${booking.date}\n⏰ *Hora:* ${booking.time} (${booking.durationMinutes} min)\n💰 *Monto Pagado:* ₡${Number(amountPaid).toLocaleString('es-CR')}\n🔖 *Comprobante:* #${transactionId}\n\n¡Nos vemos en la cancha! 🏆`;
            await sendMessage(tenant.evolutionInstance, cleanPhone, msg);
          }
        } catch (msgErr) {
          console.error('[TilopayWebhook] Error al enviar WhatsApp de cancha confirmada:', msgErr);
        }
      }
      return;
    }

    // =========================================================================
    // ROUTING CASE 3: ÓRDENES DE TIENDA Y RESTAURANTE (Prefix: ORD- o ID)
    // =========================================================================
    const cleanOrderId = orderStr.replace(/^#?ORD-?/i, '').trim();

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

    if (isApproved) {
      console.log(`[TilopayWebhook] Procesando pago aprobado para orden #${order.orderNumber} (ID: ${order.id})`);

      // 1. Transacción atómica en BD: Actualiza a PAID y descuenta inventario con rollback
      const result = await executeOrderPaymentConfirmation(tenantId, order.id, {
        tilopayTransactionId: transactionId,
        tilopayAuthCode: authCode,
        paymentMethod,
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
