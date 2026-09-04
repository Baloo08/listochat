import crypto from 'crypto';
import { query } from './pool.js';
import { User, UserRecord } from '../../shared/types.js';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  // High-security 100,000 iterations PBKDF2 with SHA-512
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `v2:${salt}:${hash}`;
}

export function verifyPassword(password: string, hashString: string): boolean {
  if (!hashString || !password) return false;
  
  // 1. Plain text comparison (constant-time)
  const passBuf = Buffer.from(password);
  const hashBuf = Buffer.from(hashString);
  if (passBuf.length === hashBuf.length && crypto.timingSafeEqual(passBuf, hashBuf)) return true;

  // 2. Modern v2 format: "v2:salt:hash" (PBKDF2 100,000 rounds with sha512)
  if (hashString.startsWith('v2:')) {
    const parts = hashString.split(':');
    const salt = parts[1];
    const storedHash = parts[2];
    if (!salt || !storedHash) return false;
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const b1 = Buffer.from(hash);
    const b2 = Buffer.from(storedHash);
    return b1.length === b2.length && crypto.timingSafeEqual(b1, b2);
  }

  // 3. Salted formats: "salt:hash"
  if (hashString.includes(':')) {
    const [salt, storedHash] = hashString.split(':');
    if (salt && storedHash) {
      // Check PBKDF2 1,000 rounds sha512 (v1 migrations format)
      const hashPbkdf2_1k_512 = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      if (hashPbkdf2_1k_512 === storedHash) return true;

      // Check PBKDF2 100,000 rounds sha512 without v2 prefix
      const hashPbkdf2_100k_512 = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      if (hashPbkdf2_100k_512 === storedHash) return true;

      // Check PBKDF2 1,000 rounds sha256
      const hashPbkdf2_1k_256 = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
      if (hashPbkdf2_1k_256 === storedHash) return true;

      // Check SHA256 (salt + password)
      const hashSha256_1 = crypto.createHash('sha256').update(salt + password).digest('hex');
      if (hashSha256_1 === storedHash) return true;

      // Check SHA256 (password + salt)
      const hashSha256_2 = crypto.createHash('sha256').update(password + salt).digest('hex');
      if (hashSha256_2 === storedHash) return true;
    }
  }

  // 4. Standalone SHA256 hash
  const plainSha256 = crypto.createHash('sha256').update(password).digest('hex');
  if (plainSha256 === hashString) return true;

  return false;
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
    WHERE LOWER(email) = LOWER($1)
  `;
  const params: any[] = [email.trim()];
  
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

export async function getUserByIdAndTenant(id: string, tenantId: string): Promise<User | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return result.rows[0] || null;
}

export async function getAdminUserByTenant(tenantId: string): Promise<User | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", name, email, role, 
           avatar_url as "avatarUrl", provider, active, 
           created_at as "createdAt", updated_at as "updatedAt"
    FROM users 
    WHERE tenant_id = $1
    ORDER BY CASE 
      WHEN role = 'admin' THEN 1 
      WHEN role = 'tenant_admin' THEN 2 
      WHEN role = 'owner' THEN 3 
      ELSE 4 
    END, created_at ASC
    LIMIT 1
  `, [tenantId]);
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
    data.tenantId, data.name, data.email?.toLowerCase().trim(), pwdHash, 
    data.role || 'admin', data.avatarUrl, data.provider || 'local', data.active !== false
  ]);
  return result.rows[0];
}

export async function updateUser(id: string, tenantId: string, data: Partial<UserRecord>): Promise<User | null> {
  const updates: string[] = [];
  const params: any[] = [id, tenantId];
  let paramIdx = 3;

  if (data.name !== undefined) { updates.push(`name = $${paramIdx++}`); params.push(data.name); }
  if (data.email !== undefined) { updates.push(`email = $${paramIdx++}`); params.push(data.email.toLowerCase().trim()); }
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

export async function resetTenantAdminPassword(tenantId: string, newPassword: string): Promise<boolean> {
  const adminUser = await getAdminUserByTenant(tenantId);
  const newHash = hashPassword(newPassword);

  if (adminUser) {
    await query(`
      UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND tenant_id = $3
    `, [newHash, adminUser.id, tenantId]);
    return true;
  }
  return false;
}

export async function deleteUser(id: string, tenantId: string): Promise<boolean> {
  const result = await query('DELETE FROM users WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  return (result.rowCount || 0) > 0;
}
