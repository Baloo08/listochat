import { createOrder, updateOrderStatus as updateOrderRepoStatus, confirmPayment as confirmPaymentRepo } from '../db/orders.repo.js';
import { getProductsByTenant, updateProduct } from '../db/products.repo.js';
import { sendMessage } from './evolution.js';

export async function createOrderFromWhatsApp(tenantId: string, orderData: any): Promise<any> {
  try {
    const allProducts = await getProductsByTenant(tenantId, true);
    const items = [];
    let subtotal = 0;

    for (const item of (orderData.items || [])) {
      const product = allProducts.find(p => 
        p.name.toLowerCase().includes((item.productName || '').toLowerCase())
      );
      
      const unitPrice = product ? Number(product.price) : (item.unitPrice || 0);
      const qty = item.quantity || 1;
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      items.push({
        productId: product?.id || null,
        productName: product?.name || item.productName || 'Producto',
        quantity: qty,
        unitPrice,
        totalPrice
      });

      if (product && product.trackStock) {
        await updateProduct(product.id, tenantId, {
          stock: Math.max(0, (product.stock || 0) - qty)
        });
      }
    }

    const order = await createOrder(
      tenantId,
      {
        customerName: orderData.customerName || 'Cliente WhatsApp',
        customerPhone: orderData.customerPhone || '',
        source: 'whatsapp',
        subtotal,
        total: subtotal,
        currency: 'CRC',
        status: 'pending',
        paymentMethod: orderData.paymentMethod || 'sinpe',
        paymentStatus: 'pending'
      },
      items
    );

    return order;
  } catch (error) {
    console.error('Error creating order from WhatsApp:', error);
    throw error;
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
      paymentReference: paymentReference || null,
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
