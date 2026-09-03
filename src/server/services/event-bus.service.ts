import { EventEmitter } from 'events';

export interface OrderPaidEventPayload {
  tenantId: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  total: number;
  currency: string;
  channelOrigin?: 'WEB_STORE' | 'WHATSAPP';
  tilopayTransactionId?: string;
  tilopayAuthCode?: string;
  deliveryMethod?: string;
  items: Array<{
    productId?: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
}

class DomainEventBus extends EventEmitter {
  constructor() {
    super();
    // Allow multiple listeners without warning leaks
    this.setMaxListeners(50);
  }
}

export const domainEventBus = new DomainEventBus();

export const ORDER_PAID_EVENT = 'order:paid';

export function emitOrderPaidEvent(payload: OrderPaidEventPayload): void {
  try {
    domainEventBus.emit(ORDER_PAID_EVENT, payload);
  } catch (err) {
    console.error('[DomainEventBus] Error al emitir OrderPaidEvent:', err);
  }
}

export function onOrderPaidEvent(handler: (payload: OrderPaidEventPayload) => Promise<void> | void): void {
  domainEventBus.on(ORDER_PAID_EVENT, async (payload: OrderPaidEventPayload) => {
    try {
      await handler(payload);
    } catch (err) {
      console.error(`[DomainEventBus] Error en listener de OrderPaidEvent para orden #${payload.orderNumber}:`, err);
    }
  });
}
