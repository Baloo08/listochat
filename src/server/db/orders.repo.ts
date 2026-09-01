import { query } from './pool.js';
import { Order, OrderItem } from '../../shared/types.js';

export async function getOrdersByTenant(tenantId: string): Promise<Order[]> {
  const result = await query(`
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber", o.customer_name as "customerName",
           o.customer_phone as "customerPhone", o.customer_email as "customerEmail", o.customer_address as "customerAddress",
           o.whatsapp_jid as "whatsappJid", o.source, o.subtotal, o.delivery_fee as "deliveryFee", o.discount, o.total,
           o.currency, o.status, o.payment_method as "paymentMethod", o.payment_status as "paymentStatus",
           o.payment_reference as "paymentReference", o.payment_proof_url as "paymentProofUrl", o.payment_proof_status as "paymentProofStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber", o.customer_location as "customerLocation",
           o.chat_message_id as "chatMessageId", o.driver_id as "driverId", o.waze_url as "wazeUrl",
           o.branch_id as "branchId", b.name as "branchName",
           o.created_at as "createdAt", o.updated_at as "updatedAt",
           COALESCE(
             (
               SELECT json_agg(
                 json_build_object(
                   'id', oi.id,
                   'productId', oi.product_id,
                   'variantId', oi.variant_id,
                   'productName', oi.product_name,
                   'variantName', oi.variant_name,
                   'selectedVariables', oi.selected_variables,
                   'quantity', oi.quantity,
                   'unitPrice', oi.unit_price,
                   'totalPrice', oi.total_price
                 )
               )
               FROM order_items oi
               WHERE oi.order_id = o.id
             ),
             '[]'::json
           ) as items
    FROM orders o
    LEFT JOIN branches b ON o.branch_id = b.id
    WHERE o.tenant_id = $1
    ORDER BY o.created_at DESC
  `, [tenantId]);
  return result.rows;
}

export async function getOrderById(id: string, tenantId?: string): Promise<Order | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", order_number as "orderNumber", customer_name as "customerName",
           customer_phone as "customerPhone", customer_email as "customerEmail", customer_address as "customerAddress",
           whatsapp_jid as "whatsappJid", source, subtotal, delivery_fee as "deliveryFee", discount, total,
           currency, status, payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl", payment_proof_status as "paymentProofStatus", notes, delivery_method as "deliveryMethod",
           consumption_mode as "consumptionMode", table_number as "tableNumber", customer_location as "customerLocation",
           chat_message_id as "chatMessageId", driver_id as "driverId", waze_url as "wazeUrl",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM orders 
    WHERE id = $1
  `, [id]);
  
  if (result.rows.length === 0) return null;
  const order = result.rows[0];

  const itemsRes = await query(`
    SELECT id, product_id as "productId", variant_id as "variantId", product_name as "productName",
           variant_name as "variantName", selected_variables as "selectedVariables",
           quantity, unit_price as "unitPrice", total_price as "totalPrice"
    FROM order_items WHERE order_id = $1
  `, [id]);
  order.items = itemsRes.rows;
  return order;
}

export async function createOrder(tenantId: string, data: Partial<Order>, items?: OrderItem[]): Promise<Order> {
  const result = await query(`
    INSERT INTO orders (
      tenant_id, customer_name, customer_phone, customer_email, customer_address, whatsapp_jid,
      source, subtotal, delivery_fee, discount, total, currency, status, payment_method, 
      payment_status, payment_reference, payment_proof_url, payment_proof_status, notes, delivery_method, consumption_mode, table_number, customer_location
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
    RETURNING id
  `, [
    tenantId, data.customerName, data.customerPhone, data.customerEmail, data.customerAddress, data.whatsappJid,
    data.source || 'store', data.subtotal, data.deliveryFee || 0, data.discount || 0, data.total, data.currency || 'CRC',
    data.status || 'pedido_recibido', data.paymentMethod, data.paymentStatus || 'pending', data.paymentReference || null,
    data.paymentProofUrl || null, data.paymentProofStatus || (data.paymentProofUrl ? 'received' : 'pending'), data.notes || null, data.deliveryMethod || 'pickup', data.consumptionMode || null, data.tableNumber || null,
    data.customerLocation ? JSON.stringify(data.customerLocation) : null
  ]);
  
  const orderId = result.rows[0].id;
  const orderItems = items || data.items || [];
  
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      await query(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, tenant_id, product_name, variant_name, selected_variables, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        orderId, item.productId || null, item.variantId || null, tenantId, 
        item.productName, item.variantName || null, 
        item.selectedVariables ? JSON.stringify(item.selectedVariables) : null,
        item.quantity, item.unitPrice, Number(item.unitPrice) * Number(item.quantity)
      ]);
    }
  }
  
  return getOrderById(orderId, tenantId) as Promise<Order>;
}

export async function updateOrder(id: string, tenantId: string, data: Partial<Order>): Promise<Order | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = [
    'status', 'paymentStatus', 'paymentReference', 'notes', 
    'driverId', 'wazeUrl', 'consumptionMode', 'tableNumber', 
    'deliveryMethod', 'deliveryFee', 'total', 'customerAddress'
  ];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (field === 'customerLocation') {
        updates.push(`${dbField} = $${paramIdx++}::jsonb`);
        params.push(JSON.stringify((data as any)[field]));
      } else {
        updates.push(`${dbField} = $${paramIdx++}`);
        params.push((data as any)[field]);
      }
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NOT NULL)`, params);
  }
  return getOrderById(id, tenantId);
}

export async function updateOrderStatus(id: string, tenantId: string, status: any) {
  return updateOrder(id, tenantId, { status });
}

export async function confirmPayment(id: string, tenantId: string, paymentReference?: string) {
  return updateOrder(id, tenantId, { paymentStatus: 'paid', paymentReference: paymentReference || 'Confirmado manual' });
}
