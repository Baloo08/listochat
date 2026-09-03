import { query } from './pool.js';
import { Appointment } from '../../shared/types.js';

export async function getAppointmentsByTenant(tenantId: string): Promise<Appointment[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
    FROM appointments 
    WHERE tenant_id = $1
    ORDER BY date DESC, time DESC
  `, [tenantId]);
  return result.rows;
}

export async function getAppointmentById(id: string, tenantId: string): Promise<Appointment | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
    FROM appointments 
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}

export async function createAppointment(tenantId: string, data: Partial<Appointment>): Promise<Appointment> {
  const result = await query(`
    INSERT INTO appointments (
      tenant_id, name, whatsapp, service, date, time, amount, status, details, vehicle_model, selected_variables, specialist_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
  `, [
    tenantId, data.name, data.whatsapp, data.service, data.date, data.time, data.amount, 
    data.status || 'scheduled', data.details, data.vehicleModel,
    data.selectedVariables ? JSON.stringify(data.selectedVariables) : null,
    data.specialistId || null
  ]);
  return result.rows[0];
}

export async function updateAppointment(id: string, tenantId: string, data: Partial<Appointment>): Promise<Appointment | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = ['name', 'whatsapp', 'service', 'date', 'time', 'amount', 'status', 'details', 'vehicleModel', 'selectedVariables', 'specialistId'];
  for (const field of fields) {
    if ((data as any)[field] !== undefined) {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${dbField} = $${paramIdx++}`);
      const val = field === 'selectedVariables' ? JSON.stringify((data as any)[field]) : (data as any)[field];
      params.push(val);
    }
  }

  if (updates.length === 0) return getAppointmentById(id, tenantId);

  const result = await query(`
    UPDATE appointments SET ${updates.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           created_at as "createdAt"
  `, params);

  return result.rows[0] || null;
}

export async function updateAppointmentStatus(id: string, tenantId: string, status: any): Promise<Appointment | null> {
  return updateAppointment(id, tenantId, { status });
}

export async function deleteAppointment(id: string, tenantId: string): Promise<boolean> {
  const result = await query('DELETE FROM appointments WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}
