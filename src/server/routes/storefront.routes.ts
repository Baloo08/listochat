import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getProductsByTenant, getProductBySlug } from '../db/products.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { createOrder } from '../db/orders.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();

// 1. Get Store Details & Branding
router.get('/:slug', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const settings = await getStoreSettings(tenant.id);
    if (!settings || !settings.storeEnabled) {
      res.status(404).json({ error: 'La tienda no está disponible públicamente' });
      return;
    }

    res.json({
      ...settings,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || settings.sinpePhone
    });
  } catch (error) {
    console.error('Storefront info error:', error);
    res.status(500).json({ error: 'Error al obtener datos de la tienda' });
  }
});

// 2. List Active Products
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
    console.error('Storefront products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// 3. Get Single Product
router.get('/:slug/products/:productSlug', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const product = await getProductBySlug(req.params.productSlug, tenant.id);
    if (!product || !product.active) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Storefront single product error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// 4. Create Order / Checkout
router.post('/:slug/checkout', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const store = await getStoreSettings(tenant.id);
    const storeName = store?.storeName || tenant.name || 'nuestro negocio';
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerLocation,
      consumptionMode = 'pickup',
      tableNumber,
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

    const isDelivery = consumptionMode === 'delivery' || deliveryMethod === 'delivery';
    const deliveryFee = (isDelivery && store?.deliveryEnabled) ? Number(store.deliveryFee || 0) : 0;
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
        customerLocation: customerLocation || null,
        consumptionMode: (consumptionMode as any) || (isDelivery ? 'delivery' : 'pickup'),
        tableNumber: tableNumber || null,
        source: 'store',
        subtotal,
        deliveryFee,
        total,
        paymentMethod,
        paymentStatus: paymentReference ? 'proof_sent' : 'pending',
        paymentReference: paymentReference || null,
        deliveryMethod: isDelivery ? 'delivery' : 'pickup',
        notes: notes || null,
        status: 'pedido_recibido' as any
      },
      formattedItems
    );

    const orderCode = `#ORD-${order.orderNumber}`;
    const cleanCustomerPhone = customerPhone.replace(/\D/g, '');

    // Format items list for WhatsApp
    const itemsSummary = formattedItems
      .map(i => `• ${i.quantity}x ${i.productName} (₡${i.totalPrice.toLocaleString('es-CR')})`)
      .join('\n');

    // Format consumption mode description
    let modeText = 'Retiro en Local / Tienda';
    if (consumptionMode === 'dine_in') {
      modeText = `🍽️ Comer en el Local ${tableNumber ? `(Mesa #${tableNumber})` : ''}`;
    } else if (consumptionMode === 'delivery' || isDelivery) {
      modeText = `🛵 Envío a Domicilio (${customerAddress || 'Dirección indicada'})`;
      if (customerLocation?.mapsUrl) {
        modeText += `\n📍 *Ubicación GPS:* ${customerLocation.mapsUrl}`;
      }
    } else {
      modeText = `🥡 Para Llevar / Retiro en Local`;
    }

    // 1. Send WhatsApp confirmation message to customer
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const customerMsg = `🛍️ *¡Pedido Confirmado en ${storeName}!*

Hola *${customerName}*, hemos recibido tu orden con el código *${orderCode}*.

📦 *Detalle del Pedido:*
${itemsSummary}

💵 *Subtotal:* ₡${subtotal.toLocaleString('es-CR')}
${deliveryFee > 0 ? `🛵 *Envío Express:* ₡${deliveryFee.toLocaleString('es-CR')}\n` : ''}💰 *Total:* ₡${total.toLocaleString('es-CR')}

📌 *Modalidad de Entrega / Consumo:*
${modeText}

💳 *Método de Pago:* ${paymentMethod === 'sinpe' ? 'SINPE Móvil' : paymentMethod === 'transfer' ? 'Transferencia Bancaria' : 'Efectivo / Pago al recibir'}
${paymentReference ? `📄 *Comprobante:* ${paymentReference}\n` : ''}
👉 En breve confirmaremos el inicio de preparación. ¡Muchas gracias por tu preferencia!`;

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
📌 *Modalidad:* ${modeText}
💰 *Total:* ₡${total.toLocaleString('es-CR')} (${paymentMethod.toUpperCase()})
${paymentReference ? `📄 *Comprobante:* ${paymentReference}\n` : ''}
📦 *Productos / Platillos:*
${itemsSummary}
${notes ? `\n📝 *Notas:* ${notes}` : ''}

_Gestiona este pedido en tiempo real desde tu Panel de Betico._`;

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
      `Pedido ${orderCode} creado desde catálogo web`
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
