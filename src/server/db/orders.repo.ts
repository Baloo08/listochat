import { query } from './pool.js';
import { Order, OrderItem } from '../../shared/types.js';

export async function getOrdersByTenant(tenantId: string): Promise<Order[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", order_number as "orderNumber", customer_name as "customerName",
           customer_phone as "customerPhone", customer_email as "customerEmail", customer_address as "customerAddress",
           whatsapp_jid as "whatsappJid", source, subtotal, delivery_fee as "deliveryFee", discount, total,
           currency, status, payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", notes, delivery_method as "deliveryMethod",
           chat_message_id as "chatMessageId", created_at as "createdAt", updated_at as "updatedAt"
    FROM orders 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  
  return result.rows.map(row => ({ ...row, items: [] }));
}

export async function getOrderById(id: string, tenantId: string): Promise<Order | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", order_number as "orderNumber", customer_name as "customerName",
           customer_phone as "customerPhone", customer_email as "customerEmail", customer_address as "customerAddress",
           whatsapp_jid as "whatsappJid", source, subtotal, delivery_fee as "deliveryFee", discount, total,
           currency, status, payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", notes, delivery_method as "deliveryMethod",
           chat_message_id as "chatMessageId", created_at as "createdAt", updated_at as "updatedAt"
    FROM orders 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  
  if (result.rows.length === 0) return null;
  const order = result.rows[0];

  const itemsRes = await query(`
    SELECT id, product_id as "productId", variant_id as "variantId", product_name as "productName",
           variant_name as "variantName", quantity, unit_price as "unitPrice", total_price as "totalPrice"
    FROM order_items WHERE order_id = $1
  `, [id]);
  
  order.items = itemsRes.rows;
  return order;
}

export async function createOrder(tenantId: string, data: Partial<Order>): Promise<Order> {
  const result = await query(`
    INSERT INTO orders (
      tenant_id, customer_name, customer_phone, customer_email, customer_address, whatsapp_jid,
      source, subtotal, delivery_fee, discount, total, currency, status, payment_method, 
      payment_status, notes, delivery_method
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING id
  `, [
    tenantId, data.customerName, data.customerPhone, data.customerEmail, data.customerAddress, data.whatsappJid,
    data.source || 'store', data.subtotal, data.deliveryFee || 0, data.discount || 0, data.total, data.currency || 'CRC',
    data.status || 'pending', data.paymentMethod, data.paymentStatus || 'pending', data.notes, data.deliveryMethod
  ]);
  
  const orderId = result.rows[0].id;
  
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      await query(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, tenant_id, product_name, variant_name, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [orderId, item.productId, item.variantId, tenantId, item.productName, item.variantName, item.quantity, item.unitPrice, item.totalPrice]);
    }
  }
  
  return getOrderById(orderId, tenantId) as Promise<Order>;
}

export async function updateOrder(id: string, tenantId: string, data: Partial<Order>): Promise<Order | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = ['status', 'paymentStatus', 'paymentReference', 'notes'];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      params.push((data as any)[field]);
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2`, params);
  }
  return getOrderById(id, tenantId);
}

export async function updateOrderStatus(id: string, tenantId: string, status: any) {
  return updateOrder(id, tenantId, { status });
}
export async function confirmPayment(id: string, tenantId: string, paymentReference?: string) {
  return updateOrder(id, tenantId, { paymentStatus: 'paid', paymentReference: paymentReference || 'Confirmado manual' });
}
