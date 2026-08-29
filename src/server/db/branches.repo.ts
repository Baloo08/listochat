import { query } from './pool.js';

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  sinpePhone?: string;
  sinpeName?: string;
  latitude?: number;
  longitude?: number;
  isMain: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function getBranchesByTenant(tenantId: string): Promise<Branch[]> {
  const result = await query(`
    SELECT 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM branches
    WHERE tenant_id = $1
    ORDER BY is_main DESC, name ASC
  `, [tenantId]);
  return result.rows;
}

export async function getBranchById(id: string, tenantId: string): Promise<Branch | null> {
  const result = await query(`
    SELECT 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM branches
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}

export async function createBranch(tenantId: string, data: Partial<Branch>): Promise<Branch> {
  // If marked as main, unset other main branches
  if (data.isMain) {
    await query(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1`, [tenantId]);
  }

  const result = await query(`
    INSERT INTO branches (
      tenant_id, name, code, address, phone, sinpe_phone, sinpe_name,
      latitude, longitude, is_main, active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId,
    data.name,
    data.code || null,
    data.address || null,
    data.phone || null,
    data.sinpePhone || null,
    data.sinpeName || null,
    data.latitude || null,
    data.longitude || null,
    data.isMain || false,
    data.active !== false
  ]);

  return result.rows[0];
}

export async function updateBranch(id: string, tenantId: string, data: Partial<Branch>): Promise<Branch | null> {
  if (data.isMain) {
    await query(`UPDATE branches SET is_main = FALSE WHERE tenant_id = $1 AND id != $2`, [tenantId, id]);
  }

  const result = await query(`
    UPDATE branches
    SET
      name = COALESCE($1, name),
      code = COALESCE($2, code),
      address = COALESCE($3, address),
      phone = COALESCE($4, phone),
      sinpe_phone = COALESCE($5, sinpe_phone),
      sinpe_name = COALESCE($6, sinpe_name),
      latitude = COALESCE($7, latitude),
      longitude = COALESCE($8, longitude),
      is_main = COALESCE($9, is_main),
      active = COALESCE($10, active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $11 AND tenant_id = $12
    RETURNING 
      id, tenant_id as "tenantId", name, code, address, phone,
      sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
      latitude, longitude, is_main as "isMain", active,
      created_at as "createdAt", updated_at as "updatedAt"
  `, [
    data.name,
    data.code,
    data.address,
    data.phone,
    data.sinpePhone,
    data.sinpeName,
    data.latitude,
    data.longitude,
    data.isMain,
    data.active,
    id,
    tenantId
  ]);

  return result.rows[0] || null;
}

export async function deleteBranch(id: string, tenantId: string): Promise<boolean> {
  const result = await query(`DELETE FROM branches WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return (result.rowCount ?? 0) > 0;
}
