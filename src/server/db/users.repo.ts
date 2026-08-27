import crypto from 'crypto';
import { query } from './pool.js';
import { User, UserRecord } from '../../shared/types.js';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashString: string): boolean {
  if (!hashString) return false;
  const [salt, storedHash] = hashString.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

export async function getUsersByTenant(tenantId: string): Promise<User[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  return result.rows;
}

export async function getUserByEmail(tenantId: string | null, email: string): Promise<UserRecord | null> {
  let q = `
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, password_hash as "passwordHash",
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE email = $1
  `;
  const params: any[] = [email];
  
  if (tenantId) {
    q += ` AND tenant_id = $2`;
    params.push(tenantId);
  }

  const result = await query(q, params);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users WHERE id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function createUser(data: Partial<UserRecord> & { password?: string }): Promise<User> {
  let pwdHash = null;
  if (data.password) {
    pwdHash = hashPassword(data.password);
  } else if (data.passwordHash) {
    pwdHash = data.passwordHash.includes(':') ? data.passwordHash : hashPassword(data.passwordHash);
  }

  
  const result = await query(`
    INSERT INTO users (
      tenant_id, name, email, password_hash, role, avatar_url, provider, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
  `, [
    data.tenantId, data.name, data.email, pwdHash, 
    data.role || 'admin', data.avatarUrl, data.provider || 'local', data.active !== false
  ]);
  return result.rows[0];
}

export async function updateUser(id: string, tenantId: string, data: Partial<UserRecord>): Promise<User | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  if (data.name !== undefined) { updates.push(`name = $${paramIdx++}`); params.push(data.name); }
  if (data.email !== undefined) { updates.push(`email = $${paramIdx++}`); params.push(data.email); }
  if (data.role !== undefined) { updates.push(`role = $${paramIdx++}`); params.push(data.role); }
  if (data.avatarUrl !== undefined) { updates.push(`avatar_url = $${paramIdx++}`); params.push(data.avatarUrl); }
  if (data.active !== undefined) { updates.push(`active = $${paramIdx++}`); params.push(data.active); }
  
  if ((data as any).password) {
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(hashPassword((data as any).password));
  } else if (data.passwordHash !== undefined) {
    updates.push(`password_hash = $${paramIdx++}`);
    params.push(data.passwordHash);
  }

  if (updates.length === 0) return getUserById(id);

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const result = await query(`
    UPDATE users SET ${updates.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
  `, params);

  return result.rows[0] || null;
}

export async function deleteUser(id: string, tenantId: string): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
