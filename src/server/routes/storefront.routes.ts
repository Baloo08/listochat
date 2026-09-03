import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getProductsByTenant, getProductBySlug } from '../db/products.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { createOrder } from '../db/orders.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';
import { getTenantPaymentConfig } from '../db/tenant-payment.repo.js';
import { TilopayTenantService } from '../services/tilopay-tenant.service.js';

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

    const paymentConfig = await getTenantPaymentConfig(tenant.id);
    const tilopayEnabled = Boolean(paymentConfig?.isEnabled && paymentConfig?.isConfigured);

    res.json({
      ...settings,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || settings.sinpePhone,
      tilopayEnabled
    });
  } catch (error) {
    console.error('Storefront info error:', error);
    res.status(500).json({ error: 'Error al obtener datos de la tienda' });
  }
});

// 1.1. Resumen público de orden para /order/success/:id
router.get('/order-public/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await query(`
      SELECT o.id, o.order_number as "orderNumber", o.customer_name as "customerName",
             o.customer_phone as "customerPhone", o.subtotal, o.delivery_fee as "deliveryFee",
             o.total, o.currency, o.status, o.payment_status as "paymentStatus",
             o.payment_method as "paymentMethod", o.delivery_method as "deliveryMethod",
             o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
             o.created_at as "createdAt",
             t.name as "storeName", t.whatsapp_number as "whatsappNumber",
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'productName', oi.product_name,
                  'variantName', oi.variant_name,
                  'quantity', oi.quantity,
                  'totalPrice', oi.total_price
                ))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.id::text = $1 OR o.order_number::text = $1
      LIMIT 1
    `, [orderId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching public order summary:', error);
    res.status(500).json({ error: 'Error al consultar resumen de orden' });
  }
});

// 1.2. Iniciar sesión de pago Tilopay para una orden
router.post('/:slug/pay-session/:orderId', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Tienda no encontrada' });
      return;
    }

    const session = await TilopayTenantService.createPaymentSession(tenant.id, req.params.orderId);
    res.json(session);
  } catch (error: any) {
    console.error('Error creating payment session:', error);
    res.status(400).json({ error: error.message || 'Error al iniciar sesión de pago' });
  }
});

// 1.3. Hosted Checkout Token Resolution (Dynamic WhatsApp Links with 60m TTL)
router.get('/pay-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string' || token.trim().length < 8) {
      res.status(400).json({ error: 'invalid_token', message: 'Token de pago inválido.' });
      return;
    }

    const result = await query(`
      SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
             o.customer_name as "customerName", o.customer_phone as "customerPhone",
             o.customer_email as "customerEmail", o.total, o.currency,
             o.payment_status as "paymentStatus", o.payment_link_expires_at as "paymentLinkExpiresAt",
             t.name as "storeName", t.whatsapp_number as "whatsappNumber",
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'productName', oi.product_name,
                  'variantName', oi.variant_name,
                  'quantity', oi.quantity,
                  'totalPrice', oi.total_price
                ))
                FROM order_items oi WHERE oi.order_id = o.id), '[]'::json
             ) as items
      FROM orders o
      JOIN tenants t ON o.tenant_id = t.id
      WHERE o.payment_link_token = $1
      LIMIT 1
    `, [token.trim()]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'not_found', message: 'El enlace de pago no fue encontrado o ya no está disponible.' });
      return;
    }

    const order = result.rows[0];

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      res.json({
        status: 'already_paid',
        orderId: order.id,
        orderNumber: order.orderNumber,
        storeName: order.storeName
      });
      return;
    }

    // Check TTL (60 minutes expiration)
    if (order.paymentLinkExpiresAt && new Date() > new Date(order.paymentLinkExpiresAt)) {
      res.status(410).json({
        error: 'expired',
        message: 'Este enlace de pago ha expirado por seguridad (vigencia máxima de 60 minutos). Solicita uno nuevo a nuestro WhatsApp.',
        whatsappNumber: order.whatsappNumber,
        orderNumber: order.orderNumber,
        storeName: order.storeName
      });
      return;
    }

    // Generate secure Tilopay Session
    const tilopaySession = await TilopayTenantService.createPaymentSession(order.tenantId, order.id);

    res.json({
      order,
      tilopaySession
    });
  } catch (error: any) {
    console.error('Error resolving payment link token:', error);
    res.status(500).json({ error: 'server_error', message: error.message || 'Error al validar el enlace de pago.' });
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

    // Associate branch if provided (validando aislamiento multi-tenant)
    if (req.body.branchId) {
      const branchCheck = await query(
        `SELECT id FROM branches WHERE id = $1 AND tenant_id = $2`,
        [req.body.branchId, tenant.id]
      );
      if (branchCheck.rows.length > 0) {
        await query(`UPDATE orders SET branch_id = $1 WHERE id = $2 AND tenant_id = $3`, [req.body.branchId, order.id, tenant.id]);
      }
    }

    // Si el método de pago es tarjeta/Tilopay, inicializamos la sesión segura
    let tilopaySession = null;
    if (paymentMethod === 'card' || paymentMethod === 'tilopay') {
      try {
        tilopaySession = await TilopayTenantService.createPaymentSession(tenant.id, order.id);
      } catch (sessErr: any) {
        console.error('[StorefrontCheckout] Error al inicializar sesión Tilopay:', sessErr.message);
        res.status(400).json({
          error: `No fue posible conectar con la pasarela de pagos con tarjeta: ${sessErr.message}. Por favor intenta de nuevo o selecciona otro método de pago.`
        });
        return;
      }
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
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone,
      tilopaySession
    });
  } catch (error) {
    console.error('Storefront checkout error:', error);
    res.status(500).json({ error: 'Error procesando checkout' });
  }
});

export default router;
