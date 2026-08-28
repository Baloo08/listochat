import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getDriversByTenant, createDriver, updateDriver, deleteDriver, getDriverById, getDriverByPin, getActiveOrdersForDriver } from '../db/drivers.repo.js';
import { getOrderById, updateOrder } from '../db/orders.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { sendMessage } from '../services/evolution.js';

const router = Router();

// =======================================================
// PUBLIC DRIVER PORTAL ROUTES (Authenticated via PIN)
// =======================================================

// 1. PIN Login / Verification
router.post('/portal/login', async (req, res) => {
  try {
    const { pin, phone } = req.body;
    if (!pin) {
      res.status(400).json({ error: 'PIN requerido' });
      return;
    }

    const driver = await getDriverByPin(pin, phone);
    if (!driver) {
      res.status(401).json({ error: 'PIN o teléfono inválido' });
      return;
    }

    const tenant = await getTenantById(driver.tenantId);
    const storeSettings = await getStoreSettings(driver.tenantId);

    res.json({
      success: true,
      driver: {
        id: driver.id,
        tenantId: driver.tenantId,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        plateNumber: driver.plateNumber,
        businessName: storeSettings?.storeName || tenant?.name || 'Comercio'
      }
    });
  } catch (error) {
    console.error('Driver portal login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// 2. Get active orders for this driver
router.get('/portal/orders', async (req, res) => {
  try {
    const pin = (req.headers['x-driver-pin'] || req.query.pin) as string;
    if (!pin) {
      res.status(401).json({ error: 'PIN de repartidor no provisto' });
      return;
    }

    const driver = await getDriverByPin(pin);
    if (!driver) {
      res.status(401).json({ error: 'PIN inválido' });
      return;
    }

    const orders = await getActiveOrdersForDriver(driver.id, driver.tenantId);
    res.json({ orders, driverName: driver.name });
  } catch (error) {
    console.error('Driver portal orders error:', error);
    res.status(500).json({ error: 'Error obteniendo pedidos' });
  }
});

// 3. Mark order as delivered by driver
router.post('/portal/orders/:id/deliver', async (req, res) => {
  try {
    const pin = (req.headers['x-driver-pin'] || req.body.pin) as string;
    if (!pin) {
      res.status(401).json({ error: 'PIN de repartidor no provisto' });
      return;
    }

    const driver = await getDriverByPin(pin);
    if (!driver) {
      res.status(401).json({ error: 'PIN inválido' });
      return;
    }

    const orderId = req.params.id;
    const order = await getOrderById(orderId, driver.tenantId);
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    // Update order status to entregado
    const updated = await updateOrder(orderId, driver.tenantId, {
      status: 'entregado' as any,
      paymentStatus: order.paymentStatus === 'pending' && order.paymentMethod === 'cash' ? 'paid' : order.paymentStatus
    });

    // Notify customer via WhatsApp
    const tenant = await getTenantById(driver.tenantId);
    const storeSettings = await getStoreSettings(driver.tenantId);
    const instanceName = tenant?.evolutionInstance;
    const cleanCustomerPhone = (order.customerPhone || '').replace(/\D/g, '');

    if (instanceName && cleanCustomerPhone) {
      const customTpl = storeSettings?.notificationTemplates?.orderDelivered;
      let deliveredMsg = customTpl || `🎉 *¡Tu pedido ha sido entregado con éxito!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* ha sido entregada por nuestro repartidor *{repartidor}*.

¡Muchas gracias por tu preferencia! Esperamos que lo disfrutes. ⭐`;

      deliveredMsg = deliveredMsg
        .replace(/{cliente}/g, order.customerName)
        .replace(/{pedido}/g, String(order.orderNumber))
        .replace(/{tienda}/g, storeSettings?.storeName || tenant?.name || 'Nuestro Comercio')
        .replace(/{total}/g, `₡${Number(order.total).toLocaleString('es-CR')}`)
        .replace(/{repartidor}/g, driver.name);

      await sendMessage(instanceName, cleanCustomerPhone, deliveredMsg);
    }

    res.json({ success: true, order: updated });
  } catch (error) {
    console.error('Driver deliver error:', error);
    res.status(500).json({ error: 'Error al marcar como entregado' });
  }
});

// =======================================================
// ADMIN AUTHENTICATED ROUTES
// =======================================================

router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const drivers = await getDriversByTenant(req.tenantId!);
    res.json(drivers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener repartidores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const driver = await createDriver(req.tenantId!, req.body);
    res.status(201).json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar repartidor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const driver = await updateDriver(req.params.id, req.tenantId!, req.body);
    if (!driver) {
      res.status(404).json({ error: 'Repartidor no encontrado' });
      return;
    }
    res.json(driver);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar repartidor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteDriver(req.params.id, req.tenantId!);
    res.json({ success: ok });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar repartidor' });
  }
});

// Dispatch order to driver via WhatsApp & set status to "en_camino"
router.post('/:id/dispatch-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    const driver = await getDriverById(req.params.id, req.tenantId!);
    if (!driver) {
      res.status(404).json({ error: 'Repartidor no encontrado' });
      return;
    }

    const order = await getOrderById(orderId, req.tenantId!);
    if (!order) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    const tenant = await getTenantById(req.tenantId!);
    const storeSettings = await getStoreSettings(req.tenantId!);
    const instanceName = tenant?.evolutionInstance;

    // Generate Waze navigation URL if coordinates exist
    let wazeUrl = '';
    let mapsUrl = order.customerLocation?.mapsUrl || '';
    if (order.customerLocation?.lat && order.customerLocation?.lng) {
      wazeUrl = `https://waze.com/ul?ll=${order.customerLocation.lat},${order.customerLocation.lng}&navigate=yes`;
      if (!mapsUrl) {
        mapsUrl = `https://maps.google.com/?q=${order.customerLocation.lat},${order.customerLocation.lng}`;
      }
    }

    // Update order with assigned driver, waze URL, and set status to "en_camino"
    await updateOrder(orderId, req.tenantId!, {
      status: 'en_camino' as any
    });

    const cleanDriverPhone = driver.phone.replace(/\D/g, '');
    const cleanCustomerPhone = (order.customerPhone || '').replace(/\D/g, '');

    // Format WhatsApp Dispatch Message for Driver
    const itemsList = (order.items || [])
      .map(i => `• ${i.quantity}x ${i.productName}`)
      .join('\n');

    const appOrigin = process.env.APP_URL || 'https://betico-app.qvtdko.easypanel.host';
    const driverPortalUrl = `${appOrigin}/repartidor?pin=${driver.accessPin || '1234'}`;

    const customDispatchTpl = storeSettings?.notificationTemplates?.driverDispatch;
    let dispatchMsg = customDispatchTpl || `🛵 *NUEVA ENTREGA ASIGNADA* (#ORD-{pedido})

Hola *{repartidor}*, tienes un nuevo pedido para entregar:

👤 *Cliente:* {cliente}
📞 *Teléfono Cliente:* {telefono}
📍 *Dirección:* {direccion}

{waze_line}{maps_line}
📦 *Platillos / Productos:*
{productos}

💰 *Cobro al Cliente:* {cobro}
{notas_line}

📲 *Tu Portal de Repartidor:*
${driverPortalUrl}`;

    const cobroText = order.paymentStatus === 'paid' ? '✅ Ya pagado (No cobrar)' : `₡${Number(order.total).toLocaleString('es-CR')} (Cobrar al entregar)`;
    const wazeLine = wazeUrl ? `🚗 *Abrir en Waze:* ${wazeUrl}\n` : '';
    const mapsLine = mapsUrl ? `🗺️ *Abrir en Google Maps:* ${mapsUrl}\n` : '';
    const notasLine = order.notes ? `\n📝 *Notas:* ${order.notes}` : '';

    dispatchMsg = dispatchMsg
      .replace(/{pedido}/g, String(order.orderNumber))
      .replace(/{repartidor}/g, driver.name)
      .replace(/{cliente}/g, order.customerName)
      .replace(/{telefono}/g, order.customerPhone || 'No registrado')
      .replace(/{direccion}/g, order.customerAddress || 'Ver mapa GPS')
      .replace(/{waze_line}/g, wazeLine)
      .replace(/{maps_line}/g, mapsLine)
      .replace(/{productos}/g, itemsList)
      .replace(/{cobro}/g, cobroText)
      .replace(/{notas_line}/g, notasLine);

    if (instanceName && cleanDriverPhone) {
      await sendMessage(instanceName, cleanDriverPhone, dispatchMsg);
    }

    // Notify Customer that order is in transit
    if (instanceName && cleanCustomerPhone) {
      const customInTransitTpl = storeSettings?.notificationTemplates?.orderInTransit;
      let inTransitMsg = customInTransitTpl || `🛵 *¡Tu pedido ya va en camino!*

Hola *{cliente}*, tu orden *#ORD-{pedido}* de *{tienda}* acaba de salir y va en camino con nuestro repartidor *{repartidor}*.

💰 *Monto a pagar al recibir:* {cobro}
¡Pronto estaremos en tu puerta! 🚀`;

      inTransitMsg = inTransitMsg
        .replace(/{cliente}/g, order.customerName)
        .replace(/{pedido}/g, String(order.orderNumber))
        .replace(/{tienda}/g, storeSettings?.storeName || tenant?.name || 'Nuestro Comercio')
        .replace(/{repartidor}/g, driver.name)
        .replace(/{cobro}/g, order.paymentStatus === 'paid' ? '✅ Ya cancelado' : `₡${Number(order.total).toLocaleString('es-CR')}`);

      await sendMessage(instanceName, cleanCustomerPhone, inTransitMsg);
    }

    res.json({
      success: true,
      wazeUrl,
      mapsUrl,
      driverPortalUrl,
      driverName: driver.name,
      dispatchedPhone: cleanDriverPhone
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    res.status(500).json({ error: 'Error al despachar pedido al repartidor' });
  }
});

export default router;
