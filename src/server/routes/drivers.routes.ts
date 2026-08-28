import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getDriversByTenant, createDriver, updateDriver, deleteDriver, getDriverById } from '../db/drivers.repo.js';
import { getOrderById, updateOrder } from '../db/orders.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { sendMessage } from '../services/evolution.js';

const router = Router();
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

// Dispatch order to driver via WhatsApp
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

    // Update order with assigned driver and waze URL
    await updateOrder(orderId, req.tenantId!, {
      status: 'procesando' as any
    });

    // Format WhatsApp Dispatch Message for Driver
    const itemsList = (order.items || [])
      .map(i => `• ${i.quantity}x ${i.productName}`)
      .join('\n');

    const cleanDriverPhone = driver.phone.replace(/\D/g, '');

    const dispatchMsg = `🛵 *NUEVA ENTREGA ASIGNADA* (#ORD-${order.orderNumber})

Hola *${driver.name}*, tienes un nuevo pedido para entregar:

👤 *Cliente:* ${order.customerName}
📞 *Teléfono Cliente:* ${order.customerPhone || 'No registrado'}
📍 *Dirección:* ${order.customerAddress || 'Ver ubicación GPS'}

${wazeUrl ? `🚗 *Abrir en Waze:* ${wazeUrl}\n` : ''}${mapsUrl ? `🗺️ *Abrir en Google Maps:* ${mapsUrl}\n` : ''}
📦 *Platillos / Productos:*
${itemsList}

💰 *Cobro al Cliente:* ${order.paymentStatus === 'paid' ? '✅ Ya pagado (No cobrar)' : `₡${Number(order.total).toLocaleString('es-CR')} (Cobrar al entregar)`}
${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}`;

    if (instanceName && cleanDriverPhone) {
      await sendMessage(instanceName, cleanDriverPhone, dispatchMsg);
    }

    res.json({
      success: true,
      wazeUrl,
      mapsUrl,
      driverName: driver.name,
      dispatchedPhone: cleanDriverPhone
    });
  } catch (error) {
    console.error('Dispatch error:', error);
    res.status(500).json({ error: 'Error al despachar pedido al repartidor' });
  }
});

export default router;
