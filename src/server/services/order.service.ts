import * as ordersRepo from '../repositories/orders.repo.js';
import * as productsRepo from '../repositories/products.repo.js';
import { sendMessage } from './evolution.js';

export async function createOrderFromWhatsApp(tenantId: string, orderData: any): Promise<any> {
  try {
    const items = [];
    let total = 0;
    
    for (const item of orderData.items) {
      const product: any = await productsRepo.getProductByName(tenantId, item.productName);
      if (product) {
        items.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        });
        total += product.price * item.quantity;
        
        await productsRepo.updateProductStock(tenantId, product.id, product.stock - item.quantity);
      }
    }

    const order = await ordersRepo.createOrder(tenantId, {
      total,
      status: 'pending',
      items
    });

    return order;
  } catch (error) {
    console.error('Error creating order from WhatsApp:', error);
    throw new Error('Failed to create order');
  }
}

export async function createOrderFromStorefront(
  tenantId: string,
  cartId: string,
  customerData: any,
  paymentMethod: string,
  deliveryMethod: string
): Promise<any> {
  try {
    const order = await ordersRepo.createOrder(tenantId, {
      customerData,
      paymentMethod,
      deliveryMethod,
      status: 'pending',
      total: 0,
      items: [] 
    });
    return order;
  } catch (error) {
    console.error('Error creating order from storefront:', error);
    throw new Error('Failed to create order');
  }
}

export async function updateOrderStatus(
  tenantId: string, 
  orderId: string, 
  status: string, 
  instanceName?: string, 
  customerPhone?: string
): Promise<any> {
  try {
    const updatedOrder = await ordersRepo.updateOrderStatus(tenantId, orderId, status);
    
    if (instanceName && customerPhone) {
      const text = `Tu orden #${orderId} ha cambiado de estado a: ${status}.`;
      await sendMessage(instanceName, customerPhone, text);
    }
    
    return updatedOrder;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
}

export async function confirmPayment(tenantId: string, orderId: string, reference: string): Promise<any> {
  try {
    return await ordersRepo.updatePaymentStatus(tenantId, orderId, 'paid', reference);
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw new Error('Failed to confirm payment');
  }
}
