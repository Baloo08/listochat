import { query } from './pool.js';
import { DeliveryDriver } from '../../shared/types.js';

export async function getDriversByTenant(tenantId: string): Promise<DeliveryDriver[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, vehicle_type as "vehicleType",
           plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE tenant_id = $1
    ORDER BY name ASC
  `, [tenantId]);
  return res.rows;
}

export async function getDriverById(id: string, tenantId: string): Promise<DeliveryDriver | null> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", name, phone, vehicle_type as "vehicleType",
           plate_number as "plateNumber", active, created_at as "createdAt"
    FROM delivery_drivers
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return res.rows[0] || null;
}

export async function createDriver(tenantId: string, data: Partial<DeliveryDriver>): Promise<DeliveryDriver> {
  const res = await query(`
    INSERT INTO delivery_drivers (tenant_id, name, phone, vehicle_type, plate_number, active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, tenant_id as "tenantId", name, phone, vehicle_type as "vehicleType",
              plate_number as "plateNumber", active, created_at as "createdAt"
  `, [
    tenantId,
    data.name || 'Repartidor',
    data.phone || '',
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
        vehicle_type = COALESCE($5, vehicle_type),
        plate_number = COALESCE($6, plate_number),
        active = COALESCE($7, active)
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, phone, vehicle_type as "vehicleType",
              plate_number as "plateNumber", active, created_at as "createdAt"
  `, [id, tenantId, data.name, data.phone, data.vehicleType, data.plateNumber, data.active]);
  return res.rows[0] || null;
}

export async function deleteDriver(id: string, tenantId: string): Promise<boolean> {
  const res = await query(`DELETE FROM delivery_drivers WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}
