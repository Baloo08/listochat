import { query } from './pool.js';
import { DeliveryDriver, Order } from '../../shared/types.js';

export async function getDriversByTenant(tenantId: string): Promise<DeliveryDriver[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE tenant_id = $1
    ORDER BY name ASC
  `, [tenantId]);
  return res.rows;
}

export async function getDriverById(id: string, tenantId?: string): Promise<DeliveryDriver | null> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE id = $1
  `, [id]);
  return res.rows[0] || null;
}

export async function getDriverByPin(pin: string, phone?: string, tenantId?: string): Promise<DeliveryDriver | null> {
  const cleanPin = (pin || '').trim();
  let sql = `
    SELECT id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
           vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE TRIM(access_pin) = $1 AND active = TRUE
  `;
  const params: any[] = [cleanPin];

  if (tenantId) {
    sql += ` AND tenant_id = $${params.length + 1}`;
    params.push(tenantId);
  }

  if (phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 8) {
      sql += ` AND (REPLACE(phone, '-', '') LIKE '%' || $${params.length + 1} OR phone LIKE '%' || $${params.length + 1})`;
      params.push(clean.slice(-8));
    }
  }

  sql += ` LIMIT 2`;
  const res = await query(sql, params);

  // Si hay más de 1 resultado y no se especificó tenantId ni phone, hay colisión entre inquilinos
  if (res.rows.length > 1 && !tenantId && !phone) {
    console.warn(`[getDriverByPin] Colisión de PIN ${cleanPin} detectada entre múltiples comercios. Se requiere teléfono o tenantId.`);
    return null;
  }

  return res.rows[0] || null;
}

export async function createDriver(tenantId: string, data: Partial<DeliveryDriver>): Promise<DeliveryDriver> {
  const pin = data.accessPin || Math.floor(1000 + Math.random() * 9000).toString();
  const res = await query(`
    INSERT INTO delivery_drivers (tenant_id, name, phone, access_pin, vehicle_type, plate_number, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
              vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
  `, [
    tenantId,
    data.name || 'Repartidor',
    data.phone || '',
    pin,
    data.vehicleType || 'moto',
    data.plateNumber || null,
    data.active !== false
  ]);
  return res.rows[0];
}

export async function updateDriver(id: string, tenantId: string, data: Partial<DeliveryDriver>): Promise<DeliveryDriver | null> {
  const res = await query(`
    UPDATE delivery_drivers
    SET name = COALESCE($3, name),
        phone = COALESCE($4, phone),
        access_pin = COALESCE($5, access_pin),
        vehicle_type = COALESCE($6, vehicle_type),
        plate_number = COALESCE($7, plate_number),
        active = COALESCE($8, active)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, phone, access_pin as "accessPin",
              vehicle_type as "vehicleType", plate_number as "plateNumber", active, created_at as "createdAt"
  `, [id, tenantId, data.name, data.phone, data.accessPin, data.vehicleType, data.plateNumber, data.active]);
  return res.rows[0] || null;
}

export async function deleteDriver(id: string, tenantId: string): Promise<boolean> {
  const res = await query(`DELETE FROM delivery_drivers WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

export async function getActiveOrdersForDriver(driverId: string): Promise<Order[]> {
  const res = await query(`
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
           o.customer_name as "customerName", o.customer_phone as "customerPhone",
           o.customer_address as "customerAddress", o.customer_location as "customerLocation",
           o.total, o.currency, o.status, o.payment_method as "paymentMethod",
           o.payment_status as "paymentStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
           o.driver_id as "driverId", o.waze_url as "wazeUrl", o.created_at as "createdAt"
    FROM orders o
    WHERE o.driver_id = $1
      AND o.status NOT IN ('delivered', 'entregado', 'cancelled', 'cancelado')
    ORDER BY o.created_at DESC
  `, [driverId]);

  const orders: Order[] = [];
  for (const row of res.rows) {
    const itemsRes = await query(`
      SELECT id, product_name as "productName", quantity, unit_price as "unitPrice", total_price as "totalPrice"
      FROM order_items
      WHERE order_id = $1
    `, [row.id]);
    orders.push({ ...row, items: itemsRes.rows });
  }
  return orders;
}

export async function getCompletedOrdersForDriver(driverId: string, fromDate?: string, toDate?: string): Promise<Order[]> {
  let sql = `
    SELECT o.id, o.tenant_id as "tenantId", o.order_number as "orderNumber",
           o.customer_name as "customerName", o.customer_phone as "customerPhone",
           o.customer_address as "customerAddress", o.customer_location as "customerLocation",
           o.total, o.currency, o.status, o.payment_method as "paymentMethod",
           o.payment_status as "paymentStatus", o.notes, o.delivery_method as "deliveryMethod",
           o.consumption_mode as "consumptionMode", o.table_number as "tableNumber",
           o.driver_id as "driverId", o.waze_url as "wazeUrl", o.created_at as "createdAt"
    FROM orders o
    WHERE o.driver_id = $1
      AND o.status IN ('delivered', 'entregado')
  `;
  const params: any[] = [driverId];
  if (fromDate) {
    params.push(fromDate);
    sql += ` AND o.created_at >= $${params.length}::timestamp`;
  }
  if (toDate) {
    params.push(toDate);
    sql += ` AND o.created_at <= $${params.length}::timestamp + interval '1 day'`;
  }
  sql += ` ORDER BY o.created_at DESC`;
  const res = await query(sql, params);

  const orders: Order[] = [];
  for (const row of res.rows) {
    const itemsRes = await query(`
      SELECT id, product_name as "productName", quantity, unit_price as "unitPrice", total_price as "totalPrice"
      FROM order_items
      WHERE order_id = $1
    `, [row.id]);
    orders.push({ ...row, items: itemsRes.rows });
  }
  return orders;
}
