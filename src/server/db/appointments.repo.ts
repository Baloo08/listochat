import { query } from './pool.js';
import { Appointment } from '../../shared/types.js';

export async function getAppointmentsByTenant(tenantId: string): Promise<Appointment[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
    FROM appointments 
    WHERE tenant_id = $1
    ORDER BY date DESC, time DESC
  `, [tenantId]);
  return result.rows;
}

export async function getAppointmentById(id: string, tenantId?: string): Promise<Appointment | null> {
  const whereClause = tenantId ? 'WHERE id = $1 AND tenant_id = $2' : 'WHERE id = $1';
  const params = tenantId ? [id, tenantId] : [id];
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
    FROM appointments 
    ${whereClause}
  `, params);
  return result.rows[0] || null;
}

export async function createAppointment(tenantId: string, data: Partial<Appointment>): Promise<Appointment> {
  const result = await query(`
    INSERT INTO appointments (
      tenant_id, name, whatsapp, service, date, time, amount, status, details, vehicle_model, selected_variables, specialist_id,
      payment_method, payment_status, payment_reference, payment_proof_url, tilopay_transaction_id, tilopay_auth_code
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
  `, [
    tenantId, data.name, data.whatsapp, data.service, data.date, data.time, data.amount, 
    data.status || 'scheduled', data.details, data.vehicleModel,
    data.selectedVariables ? JSON.stringify(data.selectedVariables) : null,
    data.specialistId || null,
    data.paymentMethod || null,
    data.paymentStatus || 'pending',
    data.paymentReference || null,
    data.paymentProofUrl || null,
    data.tilopayTransactionId || null,
    data.tilopayAuthCode || null
  ]);
  return result.rows[0];
}

export async function updateAppointment(id: string, tenantId: string, data: Partial<Appointment>): Promise<Appointment | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  const fields = [
    'name', 'whatsapp', 'service', 'date', 'time', 'amount', 'status', 'details', 'vehicleModel',
    'selectedVariables', 'specialistId', 'paymentMethod', 'paymentStatus', 'paymentReference',
    'paymentProofUrl', 'tilopayTransactionId', 'tilopayAuthCode'
  ];
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
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
           created_at as "createdAt"
  `, params);

  return result.rows[0] || null;
}

export async function updateAppointmentPayment(id: string, paymentData: {
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  tilopayTransactionId?: string;
  tilopayAuthCode?: string;
}): Promise<Appointment | null> {
  const updates: string[] = [];
  const params: any[] = [id];
  let paramIdx = 2;

  if (paymentData.paymentStatus !== undefined) {
    updates.push(`payment_status = $${paramIdx++}`);
    params.push(paymentData.paymentStatus);
    if (paymentData.paymentStatus === 'paid') {
      updates.push(`status = 'confirmed'`);
    }
  }
  if (paymentData.paymentMethod !== undefined) {
    updates.push(`payment_method = $${paramIdx++}`);
    params.push(paymentData.paymentMethod);
  }
  if (paymentData.paymentReference !== undefined) {
    updates.push(`payment_reference = $${paramIdx++}`);
    params.push(paymentData.paymentReference);
  }
  if (paymentData.tilopayTransactionId !== undefined) {
    updates.push(`tilopay_transaction_id = $${paramIdx++}`);
    params.push(paymentData.tilopayTransactionId);
  }
  if (paymentData.tilopayAuthCode !== undefined) {
    updates.push(`tilopay_auth_code = $${paramIdx++}`);
    params.push(paymentData.tilopayAuthCode);
  }

  if (updates.length === 0) return getAppointmentById(id);

  const result = await query(`
    UPDATE appointments SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING id, tenant_id as "tenantId", name, whatsapp, service, 
           date, time, amount, status, details, vehicle_model as "vehicleModel",
           selected_variables as "selectedVariables", specialist_id as "specialistId",
           payment_method as "paymentMethod", payment_status as "paymentStatus",
           payment_reference as "paymentReference", payment_proof_url as "paymentProofUrl",
           tilopay_transaction_id as "tilopayTransactionId", tilopay_auth_code as "tilopayAuthCode",
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
