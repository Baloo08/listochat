import { createOrder, updateOrderStatus as updateOrderRepoStatus, confirmPayment as confirmPaymentRepo } from '../db/orders.repo.js';
import { getProductsByTenant, updateProduct } from '../db/products.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { sendMessage } from './evolution.js';
import { query, getClient } from '../db/pool.js';

export async function createOrderFromWhatsApp(tenantId: string, orderData: any): Promise<any> {
  const allProducts = await getProductsByTenant(tenantId, true);
  const items = [];
  let subtotal = 0;

  // 1. Pre-validate stock for all requested items
  for (const item of (orderData.items || [])) {
    const product = allProducts.find(p => 
      p.name.toLowerCase().includes((item.productName || '').toLowerCase()) ||
      (item.productName || '').toLowerCase().includes(p.name.toLowerCase())
    );
    const qty = item.quantity || 1;
    if (product && product.trackStock) {
      if (item.variantName && product.variants && product.variants.length > 0) {
        const matchedVariant = product.variants.find((v: any) => 
          v.name.toLowerCase().includes(item.variantName.toLowerCase()) ||
          item.variantName.toLowerCase().includes(v.name.toLowerCase())
        );
        if (matchedVariant && (matchedVariant.stock ?? 0) < qty) {
          throw new Error(`Stock insuficiente para la variante "${matchedVariant.name}" de "${product.name}". Disponible: ${matchedVariant.stock ?? 0}`);
        }
      } else if ((product.stock ?? 0) < qty) {
        throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock ?? 0}`);
      }
    }
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    for (const item of (orderData.items || [])) {
      const product = allProducts.find(p => 
        p.name.toLowerCase().includes((item.productName || '').toLowerCase()) ||
        (item.productName || '').toLowerCase().includes(p.name.toLowerCase())
      );
      
      let unitPrice = product ? Number(product.price) : (item.unitPrice || 0);
      let variantName = item.variantName || null;
      let variantId = null;

      if (product && item.variantName && product.variants && product.variants.length > 0) {
        const matchedVariant = product.variants.find((v: any) => 
          v.name.toLowerCase().includes(item.variantName.toLowerCase()) ||
          item.variantName.toLowerCase().includes(v.name.toLowerCase())
        );
        if (matchedVariant) {
          variantId = matchedVariant.id;
          variantName = matchedVariant.name;
          if (matchedVariant.priceOverride && Number(matchedVariant.priceOverride) > 0) {
            unitPrice = Number(matchedVariant.priceOverride);
          }
        }
      }

      const qty = item.quantity || 1;
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      items.push({
        productId: product?.id || undefined,
        variantId: variantId || undefined,
        productName: product?.name || item.productName || 'Producto',
        variantName: variantName || undefined,
        quantity: qty,
        unitPrice,
        totalPrice
      });

      if (product && product.trackStock) {
        await client.query(
          'UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3',
          [qty, product.id, tenantId]
        );
        if (variantId) {
          await client.query(
            'UPDATE product_variants SET stock = GREATEST(0, stock - $1) WHERE id = $2 AND product_id = $3',
            [qty, variantId, product.id]
          );
        }
      }
    }

    const deliveryMethod = orderData.deliveryMethod || (orderData.deliveryAddress ? 'delivery' : 'pickup');
    const customerAddress = orderData.deliveryAddress || orderData.customerAddress || '';

    const store = await getStoreSettings(tenantId);
    const isDelivery = deliveryMethod === 'delivery';
    const deliveryFee = isDelivery ? Number(store?.deliveryFee || 0) : 0;
    const finalTotal = subtotal + deliveryFee;

    const order = await createOrder(
      tenantId,
      {
        customerName: orderData.customerName || 'Cliente WhatsApp',
        customerPhone: orderData.customerPhone || '',
        customerAddress,
        deliveryMethod,
        source: 'whatsapp',
        subtotal,
        deliveryFee,
        total: finalTotal,
        currency: store?.currency || 'CRC',
        status: 'pedido_recibido',
        paymentMethod: orderData.paymentMethod || 'sinpe',
        paymentStatus: 'pending',
        stockDeducted: true,
        notes: orderData.notes || (deliveryMethod === 'delivery' && customerAddress ? `Entrega a: ${customerAddress}` : undefined)
      },
      items,
      client
    );

    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order from WhatsApp:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function createOrderFromStorefront(
  tenantId: string,
  customerData: any,
  items: any[],
  paymentMethod: string,
  paymentReference?: string
): Promise<any> {
  const subtotal = items.reduce((acc, i) => acc + (Number(i.unitPrice || 0) * (i.quantity || 1)), 0);
  return await createOrder(
    tenantId,
    {
      customerName: customerData.name,
      customerPhone: customerData.phone,
      customerAddress: customerData.address,
      source: 'store',
      subtotal,
      total: subtotal,
      paymentMethod: paymentMethod as any,
      paymentStatus: paymentReference ? 'proof_sent' : 'pending',
      paymentReference: paymentReference || undefined,
      status: 'pending'
    },
    items
  );
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: string): Promise<any> {
  return await updateOrderRepoStatus(orderId, tenantId, status);
}

export async function confirmPayment(tenantId: string, orderId: string, reference?: string): Promise<any> {
  return await confirmPaymentRepo(orderId, tenantId, reference || 'Confirmado manual');
}
