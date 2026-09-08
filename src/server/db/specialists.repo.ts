import { query } from './pool.js';
import { Specialist, SpecialistScheduleType, SpecialistScheduleConfig } from '../../shared/types.js';

export { Specialist, SpecialistScheduleType, SpecialistScheduleConfig };

function mapSpecialistRow(row: any): Specialist {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    phone: row.phone,
    specialty: row.specialty,
    accessPin: row.access_pin,
    active: row.active !== false,
    scheduleType: row.schedule_type || 'business_hours',
    scheduleConfig: row.schedule_config ? (typeof row.schedule_config === 'string' ? JSON.parse(row.schedule_config) : row.schedule_config) : undefined,
    showEarnings: row.show_earnings !== false,
    createdAt: row.created_at
  };
}

export async function getSpecialistsByTenant(tenantId: string): Promise<Specialist[]> {
  const res = await query(
    'SELECT * FROM specialists WHERE tenant_id = $1 ORDER BY name ASC',
    [tenantId]
  );
  return res.rows.map(mapSpecialistRow);
}

export async function getSpecialistById(id: string): Promise<Specialist | null> {
  const res = await query(
    'SELECT * FROM specialists WHERE id = $1',
    [id]
  );
  return res.rows[0] ? mapSpecialistRow(res.rows[0]) : null;
}

export async function getSpecialistByPin(pin: string, phone?: string, tenantId?: string): Promise<Specialist | null> {
  const cleanPin = (pin || '').trim();
  if (!cleanPin) return null;
  let sql = 'SELECT * FROM specialists WHERE TRIM(access_pin) = $1 AND active = TRUE';
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

  if (res.rows.length > 1 && !tenantId && !phone) {
    console.warn(`[getSpecialistByPin] Colisión de PIN ${cleanPin} detectada entre múltiples comercios.`);
    return null;
  }

  return res.rows[0] ? mapSpecialistRow(res.rows[0]) : null;
}

export async function createSpecialist(tenantId: string, data: Partial<Specialist>): Promise<Specialist> {
  const pin = data.accessPin || Math.floor(1000 + Math.random() * 9000).toString();
  const scheduleJson = data.scheduleConfig ? JSON.stringify(data.scheduleConfig) : null;
  const res = await query(
    `INSERT INTO specialists (
      tenant_id, name, phone, specialty, access_pin, active, schedule_type, schedule_config, show_earnings
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING *`,
    [
      tenantId, data.name || 'Colaborador', data.phone || '', data.specialty || 'General',
      pin, data.active !== false, data.scheduleType || 'business_hours', scheduleJson,
      data.showEarnings !== false
    ]
  );
  return mapSpecialistRow(res.rows[0]);
}

export async function updateSpecialist(id: string, tenantId: string, data: Partial<Specialist>): Promise<Specialist | null> {
  const allowed: Record<string, string> = {
    name: 'name',
    phone: 'phone',
    specialty: 'specialty',
    accessPin: 'access_pin',
    active: 'active',
    scheduleType: 'schedule_type',
    scheduleConfig: 'schedule_config',
    showEarnings: 'show_earnings'
  };

  const processedData: any = { ...data };
  if (data.scheduleConfig !== undefined) {
    processedData.scheduleConfig = data.scheduleConfig ? JSON.stringify(data.scheduleConfig) : null;
  }

  const entries = Object.entries(processedData).filter(([k, v]) => allowed[k] !== undefined && v !== undefined);
  if (entries.length === 0) return getSpecialistById(id);

  const setClause = entries.map(([k], i) => `${allowed[k]} = $${i + 3}`).join(', ');
  const values = entries.map(e => e[1]);

  const res = await query(
    `UPDATE specialists SET ${setClause} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    [id, tenantId, ...values]
  );
  return res.rows[0] ? mapSpecialistRow(res.rows[0]) : null;
}

export async function deleteSpecialist(id: string, tenantId: string): Promise<boolean> {
  const res = await query('DELETE FROM specialists WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

export async function getActiveAppointmentsForSpecialist(specialistId: string): Promise<any[]> {
  const res = await query(
    `SELECT a.id, a.tenant_id as "tenantId", a.name, a.whatsapp, a.service, 
            TO_CHAR(a.date, 'YYYY-MM-DD') as date, 
            TO_CHAR(a.time, 'HH24:MI') as time, 
            a.amount, a.status, a.details, a.vehicle_model as "vehicleModel", 
            a.specialist_id as "specialistId", a.created_at as "createdAt" 
     FROM appointments a 
     WHERE a.specialist_id = $1 
       AND LOWER(a.status) NOT IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done', 'cancelled', 'cancelado', 'cancelada') 
     ORDER BY a.date ASC, a.time ASC`,
    [specialistId]
  );
  return res.rows;
}

export async function getCompletedAppointmentsForSpecialist(specialistId: string, fromDate?: string, toDate?: string): Promise<any[]> {
  let sql = `
    SELECT a.id, a.tenant_id as "tenantId", a.name, a.whatsapp, a.service, 
           TO_CHAR(a.date, 'YYYY-MM-DD') as date, 
           TO_CHAR(a.time, 'HH24:MI') as time, 
           a.amount, a.status, a.details, a.vehicle_model as "vehicleModel", 
           a.specialist_id as "specialistId", a.created_at as "createdAt" 
    FROM appointments a 
    WHERE a.specialist_id = $1 
      AND LOWER(a.status) IN ('completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done')
  `;
  const params: any[] = [specialistId];
  if (fromDate) {
    params.push(fromDate);
    sql += ` AND a.date >= $${params.length}`;
  }
  if (toDate) {
    params.push(toDate);
    sql += ` AND a.date <= $${params.length}`;
  }
  sql += ' ORDER BY a.date DESC, a.time DESC';
  const res = await query(sql, params);
  return res.rows;
}

