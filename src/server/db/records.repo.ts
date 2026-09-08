import { query } from './pool.js';
import { CustomerRecord, RecordEntry, VitalSigns } from '../../shared/types.js';

function mapRecordRow(row: any): CustomerRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    clientType: row.client_type || 'general',
    fullName: row.full_name,
    phone: row.phone || '',
    email: row.email || '',
    identification: row.identification || '',
    address: row.address || '',
    dateOfBirth: row.date_of_birth ? row.date_of_birth.toISOString?.().split('T')[0] || String(row.date_of_birth) : undefined,
    gender: row.gender || '',
    bloodType: row.blood_type || '',
    allergies: row.allergies || '',
    pathologicalBackground: row.pathological_background || '',
    currentMedications: row.current_medications || '',
    emergencyContactName: row.emergency_contact_name || '',
    emergencyContactPhone: row.emergency_contact_phone || '',
    notes: row.notes || '',
    metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalAppointments: row.total_appointments ? Number(row.total_appointments) : undefined,
    lastAppointmentDate: row.last_appointment_date || undefined,
    latestVitalSigns: row.latest_vital_signs ? (typeof row.latest_vital_signs === 'string' ? JSON.parse(row.latest_vital_signs) : row.latest_vital_signs) : undefined,
    recentEntriesCount: row.recent_entries_count ? Number(row.recent_entries_count) : undefined
  };
}

function mapEntryRow(row: any): RecordEntry {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    recordId: row.record_id,
    appointmentId: row.appointment_id || undefined,
    specialistId: row.specialist_id || undefined,
    specialistName: row.specialist_name || undefined,
    entryType: row.entry_type || 'consultation',
    vitalSigns: row.vital_signs ? (typeof row.vital_signs === 'string' ? JSON.parse(row.vital_signs) : row.vital_signs) : undefined,
    diagnosis: row.diagnosis || '',
    treatmentPlan: row.treatment_plan || '',
    prescription: row.prescription || '',
    notes: row.notes || '',
    attachments: row.attachments ? (typeof row.attachments === 'string' ? JSON.parse(row.attachments) : row.attachments) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getRecordsByTenant(
  tenantId: string,
  options: { search?: string; type?: string; limit?: number; offset?: number } = {}
): Promise<{ records: CustomerRecord[]; total: number }> {
  const { search, type, limit = 50, offset = 0 } = options;

  let whereClause = 'WHERE r.tenant_id = $1';
  const params: any[] = [tenantId];

  if (type && type !== 'all') {
    params.push(type);
    whereClause += ` AND r.client_type = $${params.length}`;
  }

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    params.push(`%${cleanSearch}%`);
    const pIdx = params.length;
    whereClause += ` AND (
      r.full_name ILIKE $${pIdx} OR 
      r.phone ILIKE $${pIdx} OR 
      r.email ILIKE $${pIdx} OR 
      r.identification ILIKE $${pIdx}
    )`;
  }

  const countSql = `SELECT COUNT(*) as count FROM customer_records r ${whereClause}`;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0]?.count || '0', 10);

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a.date) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    ${whereClause}
    ORDER BY r.updated_at DESC
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
  `;

  const dataRes = await query(dataSql, dataParams);
  return {
    records: dataRes.rows.map(mapRecordRow),
    total
  };
}

export async function getRecordById(id: string, tenantId: string): Promise<CustomerRecord | null> {
  const sql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a.date) FROM appointments a WHERE a.tenant_id = r.tenant_id AND (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    WHERE r.id = $1 AND r.tenant_id = $2
  `;
  const res = await query(sql, [id, tenantId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}

export async function getRecordByPhone(phone: string, tenantId: string): Promise<CustomerRecord | null> {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  if (cleanPhone.length < 8) return null;

  const sql = `
    SELECT r.* FROM customer_records r
    WHERE r.tenant_id = $1 AND REPLACE(r.phone, '-', '') LIKE '%' || $2
    ORDER BY r.updated_at DESC LIMIT 1
  `;
  const res = await query(sql, [tenantId, cleanPhone.slice(-8)]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}

export async function getRecordByIdentification(identification: string, tenantId: string): Promise<CustomerRecord | null> {
  const cleanId = (identification || '').trim();
  if (!cleanId) return null;

  const sql = `
    SELECT r.* FROM customer_records r
    WHERE r.tenant_id = $1 AND r.identification ILIKE $2
    ORDER BY r.updated_at DESC LIMIT 1
  `;
  const res = await query(sql, [tenantId, cleanId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}

export async function createRecord(tenantId: string, data: Partial<CustomerRecord>): Promise<CustomerRecord> {
  const sql = `
    INSERT INTO customer_records (
      tenant_id, client_type, full_name, phone, email, identification, address,
      date_of_birth, gender, blood_type, allergies, pathological_background,
      current_medications, emergency_contact_name, emergency_contact_phone, notes, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *
  `;
  const res = await query(sql, [
    tenantId,
    data.clientType || 'general',
    data.fullName || 'Cliente Sin Nombre',
    data.phone || '',
    data.email || null,
    data.identification || null,
    data.address || null,
    data.dateOfBirth || null,
    data.gender || null,
    data.bloodType || null,
    data.allergies || null,
    data.pathologicalBackground || null,
    data.currentMedications || null,
    data.emergencyContactName || null,
    data.emergencyContactPhone || null,
    data.notes || null,
    data.metadata ? JSON.stringify(data.metadata) : '{}'
  ]);

  const newRecord = mapRecordRow(res.rows[0]);

  // If new record has phone, auto-link existing appointments for this tenant
  if (newRecord.phone) {
    const clean = newRecord.phone.replace(/\D/g, '');
    if (clean.length >= 8) {
      await query(
        `UPDATE appointments 
         SET record_id = $1 
         WHERE tenant_id = $2 
           AND record_id IS NULL 
           AND REPLACE(whatsapp, '-', '') LIKE '%' || $3`,
        [newRecord.id, tenantId, clean.slice(-8)]
      ).catch(() => {});
    }
  }

  return newRecord;
}

export async function updateRecord(id: string, tenantId: string, data: Partial<CustomerRecord>): Promise<CustomerRecord | null> {
  const allowedFields: Record<string, string> = {
    clientType: 'client_type',
    fullName: 'full_name',
    phone: 'phone',
    email: 'email',
    identification: 'identification',
    address: 'address',
    dateOfBirth: 'date_of_birth',
    gender: 'gender',
    bloodType: 'blood_type',
    allergies: 'allergies',
    pathologicalBackground: 'pathological_background',
    currentMedications: 'current_medications',
    emergencyContactName: 'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone',
    notes: 'notes'
  };

  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [id, tenantId];
  let pIdx = 3;

  for (const [key, col] of Object.entries(allowedFields)) {
    if ((data as any)[key] !== undefined) {
      updates.push(`${col} = $${pIdx++}`);
      params.push((data as any)[key] === '' ? null : (data as any)[key]);
    }
  }

  if (data.metadata !== undefined) {
    updates.push(`metadata = $${pIdx++}`);
    params.push(JSON.stringify(data.metadata));
  }

  const sql = `
    UPDATE customer_records
    SET ${updates.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;

  const res = await query(sql, params);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}

export async function deleteRecord(id: string, tenantId: string): Promise<boolean> {
  // Disassociate from appointments before deleting
  await query('UPDATE appointments SET record_id = NULL WHERE record_id = $1 AND tenant_id = $2', [id, tenantId]).catch(() => {});
  const res = await query('DELETE FROM customer_records WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

// ==========================================
// Clinical Notes & Vital Signs Entries
// ==========================================

export async function addRecordEntry(tenantId: string, recordId: string, data: Partial<RecordEntry>): Promise<RecordEntry> {
  const sql = `
    INSERT INTO record_entries (
      tenant_id, record_id, appointment_id, specialist_id, entry_type,
      vital_signs, diagnosis, treatment_plan, prescription, notes, attachments
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const res = await query(sql, [
    tenantId,
    recordId,
    data.appointmentId || null,
    data.specialistId || null,
    data.entryType || 'consultation',
    data.vitalSigns ? JSON.stringify(data.vitalSigns) : null,
    data.diagnosis || null,
    data.treatmentPlan || null,
    data.prescription || null,
    data.notes || null,
    data.attachments ? JSON.stringify(data.attachments) : '[]'
  ]);

  // Touch record updated_at
  await query('UPDATE customer_records SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2', [recordId, tenantId]).catch(() => {});

  const entry = mapEntryRow(res.rows[0]);
  if (entry.specialistId) {
    const specRes = await query('SELECT name FROM specialists WHERE id = $1', [entry.specialistId]);
    entry.specialistName = specRes.rows[0]?.name;
  }
  return entry;
}

export async function getRecordEntries(recordId: string, tenantId: string): Promise<RecordEntry[]> {
  const sql = `
    SELECT re.*, s.name as specialist_name
    FROM record_entries re
    LEFT JOIN specialists s ON s.id = re.specialist_id
    WHERE re.record_id = $1 AND re.tenant_id = $2
    ORDER BY re.created_at DESC
  `;
  const res = await query(sql, [recordId, tenantId]);
  return res.rows.map(mapEntryRow);
}

export async function deleteRecordEntry(entryId: string, tenantId: string): Promise<boolean> {
  const res = await query('DELETE FROM record_entries WHERE id = $1 AND tenant_id = $2', [entryId, tenantId]);
  return (res.rowCount || 0) > 0;
}

export async function getAppointmentsForRecord(recordId: string, tenantId: string): Promise<any[]> {
  const rec = await getRecordById(recordId, tenantId);
  const cleanPhone = rec?.phone ? rec.phone.replace(/\D/g, '') : '';

  let sql = `
    SELECT a.*, s.name as "specialistName"
    FROM appointments a
    LEFT JOIN specialists s ON s.id = a.specialist_id
    WHERE a.tenant_id = $1 AND (a.record_id = $2
  `;
  const params: any[] = [tenantId, recordId];

  if (cleanPhone.length >= 8) {
    params.push(cleanPhone.slice(-8));
    sql += ` OR REPLACE(a.whatsapp, '-', '') LIKE '%' || $3`;
  }
  sql += `) ORDER BY a.date DESC, a.time DESC`;

  const res = await query(sql, params);
  return res.rows;
}

// =======================================================================
// STRICT SPECIALIST ACCESS: Only patients with appointments for this specialist
// =======================================================================

export async function getRecordsForSpecialist(
  specialistId: string,
  tenantId: string,
  search?: string
): Promise<CustomerRecord[]> {
  let whereClause = `WHERE a.specialist_id = $1 AND r.tenant_id = $2`;
  const params: any[] = [specialistId, tenantId];

  if (search && search.trim()) {
    params.push(`%${search.trim()}%`);
    whereClause += ` AND (r.full_name ILIKE $${params.length} OR r.phone ILIKE $${params.length} OR r.identification ILIKE $${params.length})`;
  }

  const sql = `
    SELECT DISTINCT r.*,
      (SELECT COUNT(*) FROM appointments a2 WHERE a2.specialist_id = $1 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a2.date) FROM appointments a2 WHERE a2.specialist_id = $1 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    JOIN appointments a ON (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))
    ${whereClause}
    ORDER BY r.updated_at DESC
  `;

  const res = await query(sql, params);
  return res.rows.map(mapRecordRow);
}

export async function getRecordForSpecialistById(
  recordId: string,
  specialistId: string,
  tenantId: string
): Promise<CustomerRecord | null> {
  const sql = `
    SELECT DISTINCT r.*,
      (SELECT COUNT(*) FROM appointments a2 WHERE a2.specialist_id = $2 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as total_appointments,
      (SELECT MAX(a2.date) FROM appointments a2 WHERE a2.specialist_id = $2 AND (a2.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a2.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))) as last_appointment_date,
      (SELECT re.vital_signs FROM record_entries re WHERE re.record_id = r.id AND re.vital_signs IS NOT NULL ORDER BY re.created_at DESC LIMIT 1) as latest_vital_signs,
      (SELECT COUNT(*) FROM record_entries re WHERE re.record_id = r.id) as recent_entries_count
    FROM customer_records r
    JOIN appointments a ON (a.record_id = r.id OR (r.phone IS NOT NULL AND r.phone != '' AND REPLACE(a.whatsapp, '-', '') LIKE '%' || RIGHT(REPLACE(r.phone, '-', ''), 8)))
    WHERE r.id = $1 AND a.specialist_id = $2 AND r.tenant_id = $3
  `;

  const res = await query(sql, [recordId, specialistId, tenantId]);
  return res.rows[0] ? mapRecordRow(res.rows[0]) : null;
}
