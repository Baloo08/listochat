import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getProductsByTenant, getProductById } from '../db/products.repo.js';
import { createOrder } from '../db/orders.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const settings = await getStoreSettings(tenant.id);
    res.json({
      ...settings,
      name: tenant.name,
      slug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar tienda' });
  }
});

router.get('/:slug/products', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const products = await getProductsByTenant(tenant.id, true);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar productos' });
  }
});

router.get('/:slug/products/:productId', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }
    const product = await getProductById(req.params.productId, tenant.id);
    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar producto' });
  }
});

router.post('/:slug/checkout', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const store = await getStoreSettings(tenant.id);
    const storeName = store?.storeName || tenant.name || 'nuestra tienda';
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      items = [],
      paymentMethod = 'sinpe',
      paymentReference,
      deliveryMethod = 'pickup',
      notes
    } = req.body;

    if (!customerName || !customerPhone || items.length === 0) {
      res.status(400).json({ error: 'Nombre, teléfono y al menos un producto son requeridos' });
      return;
    }

    const subtotal = items.reduce((acc: number, item: any) => {
      const price = Number(item.unitPrice || item.price || 0);
      const qty = parseInt(item.quantity || '1', 10);
      return acc + (price * qty);
    }, 0);

    const deliveryFee = (deliveryMethod === 'delivery' && store?.deliveryEnabled) ? Number(store.deliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;

    const formattedItems = items.map((item: any) => ({
      productId: item.productId || item.id,
      productName: item.productName || item.name || 'Producto',
      variantName: item.variantName || null,
      quantity: parseInt(item.quantity || '1', 10),
      unitPrice: Number(item.unitPrice || item.price || 0),
      totalPrice: Number(item.unitPrice || item.price || 0) * parseInt(item.quantity || '1', 10)
    }));

    const order = await createOrder(
      tenant.id,
      {
        customerName,
        customerPhone,
        customerEmail,
        customerAddress: customerAddress || null,
        source: 'store',
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus: paymentReference ? 'proof_sent' : 'pending',
        paymentReference: paymentReference || null,
        deliveryMethod,
        notes: notes || null,
        status: 'pedido_recibido' as any
      },
      formattedItems
    );

    const orderCode = `#ORD-${order.orderNumber}`;
    const cleanCustomerPhone = customerPhone.replace(/\D/g, '');

    // Format products summary list
    const itemsSummary = formattedItems
      .map(i => `• ${i.quantity}x ${i.productName} (₡${i.totalPrice.toLocaleString('es-CR')})`)
      .join('\n');

    // 1. Send WhatsApp confirmation message to customer
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const customerMsg = `🛍️ *¡Pedido Confirmado en ${storeName}!*

Hola *${customerName}*, hemos recibido tu pedido con el código *${orderCode}*.

📦 *Detalle del Pedido:*
${itemsSummary}

💵 *Subtotal:* ₡${subtotal.toLocaleString('es-CR')}
🛵 *Envío:* ${deliveryFee > 0 ? `₡${deliveryFee.toLocaleString('es-CR')}` : (deliveryMethod === 'delivery' ? 'Gratis' : 'Retiro en Tienda')}
💰 *Total:* ₡${total.toLocaleString('es-CR')}

📍 *Método de Entrega:* ${deliveryMethod === 'delivery' ? `A domicilio (${customerAddress || 'Dirección indicada'})` : 'Retiro en el local'}
💳 *Método de Pago:* ${paymentMethod === 'sinpe' ? 'SINPE Móvil' : paymentMethod === 'transfer' ? 'Transferencia Bancaria' : 'Efectivo / Pago al recibir'}
${paymentReference ? `📄 *Comprobante:* ${paymentReference}` : ''}

👉 En breve un asesor confirmará el inicio de preparación. ¡Muchas gracias por tu compra!`;

      try {
        await sendMessage(tenant.evolutionInstance, cleanCustomerPhone, customerMsg);
      } catch (err) {
        console.error('Error sending customer WhatsApp confirmation:', err);
      }
    }

    // 2. Send WhatsApp alert to store admin/notify phone
    const adminPhone = store?.sinpePhone || tenant.whatsappNumber;
    if (tenant.evolutionInstance && adminPhone) {
      const cleanAdminPhone = adminPhone.replace(/\D/g, '');
      const adminAlert = `🔔 *¡NUEVO PEDIDO RECIBIDO!* ${orderCode}

👤 *Cliente:* ${customerName} (${customerPhone})
📍 *Entrega:* ${deliveryMethod === 'delivery' ? `Domicilio: ${customerAddress || 'No especificada'}` : 'Retiro en tienda'}
💰 *Total:* ₡${total.toLocaleString('es-CR')} (${paymentMethod.toUpperCase()})
${paymentReference ? `📄 *Comprobante:* ${paymentReference}` : ''}

📦 *Productos:*
${itemsSummary}
${notes ? `\n📝 *Notas:* ${notes}` : ''}

_Revisa y gestiona esta orden en tu panel de administración._`;

      try {
        await sendMessage(tenant.evolutionInstance, cleanAdminPhone, adminAlert);
      } catch (err) {
        console.error('Error sending admin WhatsApp alert:', err);
      }
    }

    // Log notification
    await query(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'store_order_created', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenant.id,
      cleanCustomerPhone,
      `Pedido ${orderCode} creado desde tienda web`
    ]);

    res.status(201).json({
      ...order,
      orderCode,
      storeName,
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone
    });
  } catch (error) {
    console.error('Storefront checkout error:', error);
    res.status(500).json({ error: 'Error procesando checkout' });
  }
});

export default router;
