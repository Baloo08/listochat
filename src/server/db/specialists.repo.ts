import { query } from './pool.js';

export interface Specialist {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  specialty?: string;
  accessPin: string;
  active: boolean;
  createdAt: string;
}

export async function getSpecialistsByTenant(tenantId: string): Promise<Specialist[]> {
  const res = await query(
    'SELECT id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt" FROM specialists WHERE tenant_id = $1 ORDER BY name ASC',
    [tenantId]
  );
  return res.rows;
}

export async function getSpecialistById(id: string): Promise<Specialist | null> {
  const res = await query(
    'SELECT id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt" FROM specialists WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
}

export async function getSpecialistByPin(pin: string, phone?: string, tenantId?: string): Promise<Specialist | null> {
  const cleanPin = (pin || '').trim();
  let sql = 'SELECT id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt" FROM specialists WHERE TRIM(access_pin) = $1 AND active = TRUE';
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

  sql += ' LIMIT 2';
  const res = await query(sql, params);

  // Si hay más de 1 resultado y no se especificó tenantId ni phone, hay colisión entre inquilinos
  if (res.rows.length > 1 && !tenantId && !phone) {
    console.warn(`[getSpecialistByPin] Colisión de PIN ${cleanPin} detectada entre múltiples comercios. Se requiere teléfono o tenantId para desambiguar.`);
    return null;
  }

  return res.rows[0] || null;
}

export async function createSpecialist(tenantId: string, data: Partial<Specialist>): Promise<Specialist> {
  const pin = data.accessPin || Math.floor(1000 + Math.random() * 9000).toString();
  const res = await query(
    'INSERT INTO specialists (tenant_id, name, phone, specialty, access_pin, active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt"',
    [tenantId, data.name || 'Colaborador', data.phone || '', data.specialty || 'General', pin, data.active !== false]
  );
  return res.rows[0];
}

export async function updateSpecialist(id: string, tenantId: string, data: Partial<Specialist>): Promise<Specialist | null> {
  const res = await query(
    'UPDATE specialists SET name = COALESCE($3, name), phone = COALESCE($4, phone), specialty = COALESCE($5, specialty), access_pin = COALESCE($6, access_pin), active = COALESCE($7, active) WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id as "tenantId", name, phone, specialty, access_pin as "accessPin", active, created_at as "createdAt"',
    [id, tenantId, data.name, data.phone, data.specialty, data.accessPin, data.active]
  );
  return res.rows[0] || null;
}

export async function deleteSpecialist(id: string, tenantId: string): Promise<boolean> {
  const res = await query('DELETE FROM specialists WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

export async function getActiveAppointmentsForSpecialist(specialistId: string): Promise<any[]> {
  const res = await query(
    "SELECT a.id, a.tenant_id as \"tenantId\", a.name, a.whatsapp, a.service, a.date, a.time, a.amount, a.status, a.details, a.vehicle_model as \"vehicleModel\", a.specialist_id as \"specialistId\", a.created_at as \"createdAt\" FROM appointments a WHERE a.specialist_id = $1 AND a.status NOT IN ('completed', 'completado', 'cancelled', 'cancelado') ORDER BY a.date ASC, a.time ASC",
    [specialistId]
  );
  return res.rows;
}

export async function getCompletedAppointmentsForSpecialist(specialistId: string, fromDate?: string, toDate?: string): Promise<any[]> {
  let sql = "SELECT a.id, a.tenant_id as \"tenantId\", a.name, a.whatsapp, a.service, a.date, a.time, a.amount, a.status, a.details, a.vehicle_model as \"vehicleModel\", a.specialist_id as \"specialistId\", a.created_at as \"createdAt\" FROM appointments a WHERE a.specialist_id = $1 AND a.status IN ('completed', 'completado')";
  const params = [specialistId];
  if (fromDate) {
    params.push(fromDate);
    sql += ' AND a.date >= $' + params.length;
  }
  if (toDate) {
    params.push(toDate);
    sql += ' AND a.date <= $' + params.length;
  }
  sql += ' ORDER BY a.date DESC, a.time DESC';
  const res = await query(sql, params);
  return res.rows;
}
