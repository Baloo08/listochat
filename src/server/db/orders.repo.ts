import { query, getClient } from './pool.js';
import { Order, OrderItem } from '../../shared/types.js';

export async function getOrdersByTenant(tenantId: string, filters?: any): Promise<Order[]> {
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

export async function getOrderById(id: string, tenantId: string): Promise<Order | null> {
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
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  
  if (result.rows.length === 0) return null;
  const order = result.rows[0];

  const itemsRes = await query(`
    SELECT id, product_id as "productId", variant_id as "variantId", product_name as "productName",
           variant_name as "variantName", selected_variables as "selectedVariables",
           quantity, unit_price as "unitPrice", total_price as "totalPrice"
    FROM order_items WHERE order_id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  order.items = itemsRes.rows;
  return order;
}

export async function createOrder(tenantId: string, data: Partial<Order>, items?: OrderItem[], dbClient?: any): Promise<Order> {
  const runQuery = dbClient ? dbClient.query.bind(dbClient) : query;
  const insertSql = `
    INSERT INTO orders (
      tenant_id, customer_name, customer_phone, customer_email, customer_address, whatsapp_jid,
      source, subtotal, delivery_fee, discount, total, currency, status, payment_method, 
      payment_status, payment_reference, payment_proof_url, payment_proof_status, notes, delivery_method, consumption_mode, table_number, customer_location, stock_deducted
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    RETURNING id
  `;

  const params = [
    tenantId, data.customerName, data.customerPhone, data.customerEmail, data.customerAddress, data.whatsappJid,
    data.source || 'store', data.subtotal, data.deliveryFee || 0, data.discount || 0, data.total, data.currency || 'CRC',
    data.status || 'pedido_recibido', data.paymentMethod, data.paymentStatus || 'pending', data.paymentReference || null,
    data.paymentProofUrl || null, data.paymentProofStatus || (data.paymentProofUrl ? 'received' : 'pending'), data.notes || null, data.deliveryMethod || 'pickup', data.consumptionMode || null, data.tableNumber || null,
    data.customerLocation ? JSON.stringify(data.customerLocation) : null,
    Boolean(data.stockDeducted)
  ];

  let result;
  try {
    result = await runQuery(insertSql, params);
  } catch (err: any) {
    if (err && (err.message?.includes('payment_proof_url') || err.message?.includes('payment_proof_status') || err.message?.includes('stock_deducted') || err.code === '42703')) {
      console.log('[createOrder] Column missing detected, auto-migrating orders table...');
      await query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_status VARCHAR(50) DEFAULT 'pending';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_deducted BOOLEAN DEFAULT false;
      `);
      result = await runQuery(insertSql, params);
    } else {
      throw err;
    }
  }
  
  const orderId = result.rows[0].id;
  const orderItems = items || data.items || [];
  
  if (orderItems && orderItems.length > 0) {
    for (const item of orderItems) {
      await runQuery(`
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
    await query(`UPDATE orders SET ${updates.join(', ')} WHERE id = $1 AND tenant_id = $2`, params);
  }
  return getOrderById(id, tenantId);
}

export async function updateOrderStatus(id: string, tenantId: string, status: any) {
  return updateOrder(id, tenantId, { status });
}

export async function confirmPayment(id: string, tenantId: string, paymentReference?: string) {
  const result = await executeOrderPaymentConfirmation(tenantId, id, {
    paymentMethod: 'manual',
    paymentReference: paymentReference || 'Confirmado manual'
  });
  return result.order || getOrderById(id, tenantId);
}

export async function executeOrderPaymentConfirmation(
  tenantId: string,
  orderId: string,
  paymentData: {
    tilopayTransactionId?: string;
    tilopayAuthCode?: string;
    paymentMethod?: string;
    paymentReference?: string;
  }
): Promise<{ success: boolean; alreadyProcessed?: boolean; order?: Order; error?: string }> {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Bloquear la fila de la orden para actualización atómica
    const orderRes = await client.query(`
      SELECT * FROM orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE
    `, [orderId, tenantId]);

    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'Orden no encontrada para este comercio' };
    }

    const currentOrder = orderRes.rows[0];

    // Idempotencia: Si ya está pagada, no se vuelve a cobrar ni a descontar stock
    if (String(currentOrder.payment_status).toLowerCase() === 'paid') {
      await client.query('ROLLBACK');
      const order = await getOrderById(orderId, tenantId);
      return { success: true, alreadyProcessed: true, order: order || undefined };
    }

    // 2. Actualizar estado de pago y orden
    const newPaymentStatus = 'paid';
    const newOrderStatus = currentOrder.status === 'pending' || currentOrder.status === 'pedido_recibido'
      ? 'pedido_aceptado'
      : currentOrder.status;

    await client.query(`
      UPDATE orders
      SET payment_status = $1,
          status = $2,
          tilopay_transaction_id = $3,
          tilopay_auth_code = $4,
          payment_reference = COALESCE($5, payment_reference),
          payment_method = COALESCE($6, payment_method),
          stock_deducted = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND tenant_id = $8
    `, [
      newPaymentStatus,
      newOrderStatus,
      paymentData.tilopayTransactionId || null,
      paymentData.tilopayAuthCode || null,
      paymentData.paymentReference || paymentData.tilopayTransactionId || 'Tilopay',
      paymentData.paymentMethod || 'card',
      orderId,
      tenantId
    ]);

    // 3. Descuento atómico de inventario para todos los ítems de la orden (solo si no se había descontado previamente)
    if (!currentOrder.stock_deducted) {
      const itemsRes = await client.query(`
        SELECT product_id as "productId", variant_id as "variantId", quantity
        FROM order_items
        WHERE order_id = $1 AND tenant_id = $2
      `, [orderId, tenantId]);

      for (const item of itemsRes.rows) {
        const qty = Number(item.quantity || 1);
        if (item.productId) {
          await client.query(`
            UPDATE products
            SET stock = GREATEST(0, stock - $1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND tenant_id = $3 AND track_stock = true
          `, [qty, item.productId, tenantId]);

          if (item.variantId) {
            await client.query(`
              UPDATE product_variants
              SET stock = GREATEST(0, stock - $1)
              WHERE id = $2 AND product_id = $3
            `, [qty, item.variantId, item.productId]);
          }
        }
      }
    }

    await client.query('COMMIT');

    const updatedOrder = await getOrderById(orderId, tenantId);
    return { success: true, alreadyProcessed: false, order: updatedOrder || undefined };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(`[executeOrderPaymentConfirmation] Error en transacción atómica de orden ${orderId}:`, err);
    return { success: false, error: err.message || 'Error en la transacción de confirmación de pago' };
  } finally {
    client.release();
  }
}

