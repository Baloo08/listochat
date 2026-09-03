import crypto from 'crypto';
import { sendMessage } from './evolution.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { createOrder, getOrderById } from '../db/orders.repo.js';
import { onOrderPaidEvent, OrderPaidEventPayload } from './event-bus.service.js';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class EvolutionApiService {
  /**
   * Sends a WhatsApp message with exponential backoff retry logic.
   */
  static async sendMessageWithRetry(
    instanceName: string,
    phone: string,
    messageText: string,
    maxRetries: number = 3
  ): Promise<boolean> {
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 8) {
      cleanPhone = '506' + cleanPhone;
    }
    if (!cleanPhone || !instanceName) {
      console.warn('[EvolutionApiService] Parámetros incompletos para envío de WhatsApp.');
      return false;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sendMessage(instanceName, cleanPhone, messageText);
        return true;
      } catch (err: any) {
        console.warn(`[EvolutionApiService] Intento ${attempt}/${maxRetries} fallido para ${cleanPhone}:`, err.message);
        if (attempt < maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          await sleep(backoff);
        }
      }
    }

    console.error(`[EvolutionApiService] No fue posible enviar WhatsApp a ${cleanPhone} tras ${maxRetries} intentos.`);
    return false;
  }

  /**
   * Generates a conversational order for WhatsApp with a secure, non-sequential
   * dynamic payment link and a 60-minute TTL.
   */
  static async createOrderAndGeneratePaymentLink(
    tenantId: string,
    orderData: {
      customerName: string;
      customerPhone: string;
      customerAddress?: string;
      items: Array<{
        productId?: string;
        variantId?: string;
        productName: string;
        variantName?: string;
        quantity: number;
        unitPrice: number;
        totalPrice?: number;
      }>;
      subtotal: number;
      deliveryFee?: number;
      total: number;
      currency?: string;
      notes?: string;
      deliveryMethod?: 'pickup' | 'delivery';
    }
  ): Promise<{
    order: any;
    paymentLink: string;
    paymentLinkToken: string;
    expiresAt: Date;
  }> {
    const paymentLinkToken = crypto.randomUUID();
    // 60 minutes TTL
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const store = await getStoreSettings(tenantId);
    const tenant = await getTenantById(tenantId);

    const newOrder = await createOrder(
      tenantId,
      {
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress || null,
        source: 'whatsapp',
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee || 0,
        total: orderData.total,
        currency: orderData.currency || store?.currency || 'CRC',
        status: 'pending',
        paymentMethod: 'card',
        paymentStatus: 'pending',
        deliveryMethod: orderData.deliveryMethod || 'pickup',
        notes: orderData.notes || null,
        channelOrigin: 'WHATSAPP',
        paymentLinkToken,
        paymentLinkExpiresAt: expiresAt
      } as any,
      orderData.items as any
    );

    // Explicitly update token and expiration in case createOrder didn't persist partials
    await query(`
      UPDATE orders
      SET channel_origin = 'WHATSAPP',
          payment_link_token = $1,
          payment_link_expires_at = $2
      WHERE id = $3 AND tenant_id = $4
    `, [paymentLinkToken, expiresAt, newOrder.id, tenantId]);

    const baseUrl = env.APP_URL || 'https://betico.tech';
    const paymentLink = `${baseUrl.replace(/\/$/, '')}/pay/${paymentLinkToken}`;

    return {
      order: newOrder,
      paymentLink,
      paymentLinkToken,
      expiresAt
    };
  }
}

/**
 * Initializes the asynchronous listener for OrderPaidEvent.
 * When an order is marked as paid by Tilopay, this listener sends the WhatsApp confirmation.
 */
export function initEvolutionPaymentListeners(): void {
  onOrderPaidEvent(async (payload: OrderPaidEventPayload) => {
    try {
      const tenant = await getTenantById(payload.tenantId);
      if (!tenant?.evolutionInstance) {
        return;
      }

      if (!payload.customerPhone) {
        return;
      }

      const store = await getStoreSettings(payload.tenantId);
      const storeName = store?.storeName || tenant.name || 'nuestro negocio';
      const currencySymbol = payload.currency === 'USD' ? '$' : '₡';

      const receiptMsg = `🎉 *¡PAGO CONFIRMADO CON ÉXITO!* ✅

Hola *${payload.customerName}*, confirmamos el pago seguro de tu pedido *#ORD-${payload.orderNumber}* en *${storeName}*.

💰 *Total Cancelado:* ${currencySymbol}${Number(payload.total).toLocaleString('es-CR')}
💳 *Transacción Tilopay:* ${payload.tilopayTransactionId || 'Aprobada'}
${payload.tilopayAuthCode ? `🔑 *Código de Autorización:* ${payload.tilopayAuthCode}\n` : ''}📦 *Estado:* En preparación para entrega

¡Muchas gracias por tu preferencia! Te notificaremos ante cualquier avance. ⭐`;

      await EvolutionApiService.sendMessageWithRetry(
        tenant.evolutionInstance,
        payload.customerPhone,
        receiptMsg,
        3
      );

      // Log notification
      let cleanCustomerPhone = payload.customerPhone.replace(/\D/g, '');
      if (cleanCustomerPhone.length === 8) cleanCustomerPhone = '506' + cleanCustomerPhone;

      await query(`
        INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
        VALUES ($1, $2, $3, $4, 'tilopay_payment_confirmed', 'sent')
      `, [
        `notif_${Date.now()}`,
        payload.tenantId,
        cleanCustomerPhone,
        `Confirmación de pago Tilopay para orden #ORD-${payload.orderNumber}`
      ]);
    } catch (err) {
      console.error('[EvolutionPaymentListener] Error enviando WhatsApp de pago:', err);
    }
  });

  console.log('[EvolutionApiService] Listener de OrderPaidEvent inicializado correctamente.');
}
