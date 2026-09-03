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

// 1.1. Get Active Branches for Store
router.get('/:slug/branches', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const result = await query(`
      SELECT id, name, code, address, phone, sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
             latitude, longitude, is_main as "isMain"
      FROM branches
      WHERE tenant_id = $1 AND active = TRUE
      ORDER BY is_main DESC, name ASC
    `, [tenant.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Storefront branches error:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
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
      paymentProofUrl,
      deliveryMethod = 'pickup',
      notes
    } = req.body;

    if (!customerName || !customerPhone || items.length === 0) {
      res.status(400).json({ error: 'Nombre, teléfono y al menos un producto son requeridos' });
      return;
    }

    const productIds = items
      .map((item: any) => item.productId || item.id)
      .filter((id: any) => typeof id === 'string' && id.length > 10);

    if (productIds.length === 0) {
      res.status(400).json({ error: 'La orden no contiene productos válidos' });
      return;
    }

    const dbProductsRes = await query(`
      SELECT p.id, p.name, p.price, p.custom_variables as "customVariables",
             COALESCE((
               SELECT json_agg(json_build_object('id', pv.id, 'name', pv.name, 'priceOverride', pv.price_override))
               FROM product_variants pv WHERE pv.product_id = p.id
             ), '[]'::json) as variants
      FROM products p
      WHERE p.tenant_id = $1 AND p.id = ANY($2::uuid[]) AND p.active = TRUE
    `, [tenant.id, productIds]);

    const dbProductsMap = new Map<string, any>(dbProductsRes.rows.map((p: any) => [p.id, p]));

    const formattedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const pid = item.productId || item.id;
      const dbProduct = dbProductsMap.get(pid);
      if (!dbProduct) {
        res.status(400).json({ error: `El producto "${item.productName || item.name || 'solicitado'}" no está disponible o no existe en esta tienda.` });
        return;
      }

      let verifiedPrice = Number(dbProduct.price || 0);

      // Verificar sobreescritura de precio de variante
      if (item.variantId || item.variantName) {
        const matchedVariant = (dbProduct.variants || []).find((v: any) =>
          (item.variantId && v.id === item.variantId) ||
          (item.variantName && v.name.toLowerCase() === item.variantName.toLowerCase())
        );
        if (matchedVariant && matchedVariant.priceOverride !== null && matchedVariant.priceOverride !== undefined) {
          verifiedPrice = Number(matchedVariant.priceOverride);
        }
      }

      // Verificar costos adicionales de opciones personalizables
      if (item.selectedVariables && Array.isArray(dbProduct.customVariables)) {
        for (const cv of dbProduct.customVariables) {
          const selectedVal = item.selectedVariables[cv.name];
          if (selectedVal && Array.isArray(cv.options)) {
            const vals = Array.isArray(selectedVal) ? selectedVal : [selectedVal];
            for (const v of vals) {
              const opt = cv.options.find((o: any) => o.name === v);
              if (opt && opt.price && Number(opt.price) > 0) {
                verifiedPrice += Number(opt.price);
              }
            }
          }
        }
      }

      const qty = Math.max(1, parseInt(item.quantity || '1', 10));
      const lineTotal = verifiedPrice * qty;
      subtotal += lineTotal;

      formattedItems.push({
        productId: dbProduct.id,
        productName: item.productName || item.name || dbProduct.name,
        variantName: item.variantName || null,
        selectedVariables: item.selectedVariables || undefined,
        quantity: qty,
        unitPrice: verifiedPrice,
        totalPrice: lineTotal
      });
    }

    const isDelivery = consumptionMode === 'delivery' || deliveryMethod === 'delivery';
    const deliveryFee = (isDelivery && store?.deliveryEnabled) ? Number(store.deliveryFee || 0) : 0;
    const total = subtotal + deliveryFee;

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
        paymentStatus: (paymentProofUrl || paymentReference) ? 'proof_sent' : 'pending',
        paymentReference: paymentReference || null,
        paymentProofUrl: paymentProofUrl || null,
        paymentProofStatus: paymentProofUrl ? 'received' : 'pending',
        deliveryMethod: isDelivery ? 'delivery' : 'pickup',
        notes: notes || null,
        status: 'pedido_recibido' as any
      },
      formattedItems
    );

    // Associate branch if provided
    if (req.body.branchId) {
      await query(`UPDATE orders SET branch_id = $1 WHERE id = $2`, [req.body.branchId, order.id]);
    }

    // Emit real-time WebSocket event to Kitchen Display & Admin Dashboard
    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('order:created', {
        ...order,
        branchId: req.body.branchId || null,
        items: formattedItems,
        storeName
      });
    }

    const orderCode = `#ORD-${order.orderNumber}`;
    let cleanCustomerPhone = customerPhone.replace(/\D/g, '');
    if (cleanCustomerPhone.length === 8) cleanCustomerPhone = '506' + cleanCustomerPhone;

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
      const customReceived = store?.notificationTemplates?.orderReceived;
      let customerMsg = customReceived || `🛍️ *¡Pedido Confirmado en ${storeName}!*

Hola *${customerName}*, hemos recibido tu orden con el código *${orderCode}*.

📦 *Detalle del Pedido:*
${itemsSummary}

💵 *Subtotal:* ₡${subtotal.toLocaleString('es-CR')}
${deliveryFee > 0 ? `🛵 *Envío Express:* ₡${deliveryFee.toLocaleString('es-CR')}\n` : ''}💰 *Total:* ₡${total.toLocaleString('es-CR')}

📌 *Modalidad de Entrega / Consumo:*
${modeText}

💳 *Método de Pago:* ${paymentMethod === 'sinpe' ? 'SINPE Móvil' : paymentMethod === 'transfer' ? 'Transferencia Bancaria' : 'Efectivo / Pago al recibir'}
${paymentReference ? `📄 *Referencia:* ${paymentReference}\n` : ''}${paymentProofUrl ? '📸 *Comprobante Adjunto:* Recibido ✓\n' : ((paymentMethod === 'sinpe' || paymentMethod === 'transfer') ? '\n📸 *IMPORTANTE:* Por favor envía la foto o captura de tu comprobante a este chat para verificar tu pago y proceder con la preparación de tu orden.\n' : '')}
👉 En breve confirmaremos el inicio de preparación. ¡Muchas gracias por tu preferencia!`;

      customerMsg = customerMsg
        .replace(/{cliente}/g, customerName)
        .replace(/{pedido}/g, String(order.orderNumber))
        .replace(/{tienda}/g, storeName)
        .replace(/{total}/g, `₡${total.toLocaleString('es-CR')}`);

      try {
        await sendMessage(tenant.evolutionInstance, cleanCustomerPhone, customerMsg);
      } catch (err) {
        console.error('Error sending customer WhatsApp confirmation:', err);
      }
    }

    // 2. Send WhatsApp alert to store admin/notify phone
    const adminPhone = store?.sinpePhone || tenant.whatsappNumber;
    if (tenant.evolutionInstance && adminPhone) {
      let cleanAdminPhone = adminPhone.replace(/\D/g, '');
      if (cleanAdminPhone.length === 8) cleanAdminPhone = '506' + cleanAdminPhone;
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
