import crypto from 'crypto';
import { query } from './pool.js';
import { getTodayCR } from '../services/timezone.service.js';

export interface SecretaryAuthorizedPhone {
  id: string;
  tenantId: string;
  phone: string;
  name: string;
  role: 'owner' | 'manager' | 'receptionist';
  failedAttempts: number;
  lockedUntil: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecretarySession {
  id: string;
  tenantId: string;
  authorizedPhoneId: string;
  sessionDate: string;
  isAuthenticated: boolean;
  authenticatedAt: string | null;
  lastActivityAt: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Hashea un PIN de 4 dígitos con salt criptográfico usando PBKDF2 (10,000 iteraciones).
 */
export function hashPin(pin: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, useSalt, 10000, 32, 'sha256').toString('hex');
  return `${useSalt}:${hash}`;
}

/**
 * Verifica si un PIN coincide con el hash almacenado.
 */
export function verifyPin(pin: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const computed = crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(originalHash));
}

function mapPhoneRow(r: any): SecretaryAuthorizedPhone {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    phone: r.phone,
    name: r.name,
    role: r.role || 'owner',
    failedAttempts: r.failed_attempts || 0,
    lockedUntil: r.locked_until ? new Date(r.locked_until).toISOString() : null,
    active: r.active !== false,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

/**
 * Lista todos los teléfonos autorizados para un tenant.
 */
export async function getAuthorizedPhonesByTenant(tenantId: string): Promise<SecretaryAuthorizedPhone[]> {
  const res = await query(`
    SELECT * FROM secretary_authorized_phones
    WHERE tenant_id = $1
    ORDER BY created_at ASC
  `, [tenantId]);
  return res.rows.map(mapPhoneRow);
}

/**
 * Busca un teléfono autorizado específico dentro de un tenant.
 */
export async function getAuthorizedPhoneByNumber(tenantId: string, cleanPhone: string): Promise<SecretaryAuthorizedPhone | null> {
  const norm = cleanPhone.replace(/\D/g, '');
  const res = await query(`
    SELECT * FROM secretary_authorized_phones
    WHERE tenant_id = $1 AND (phone = $2 OR phone = $3)
    LIMIT 1
  `, [tenantId, norm, norm.startsWith('506') ? norm.slice(3) : `506${norm}`]);
  return res.rows[0] ? mapPhoneRow(res.rows[0]) : null;
}

/**
 * Crea un nuevo teléfono autorizado con PIN.
 */
export async function createAuthorizedPhone(
  tenantId: string,
  data: { phone: string; name: string; role?: 'owner' | 'manager' | 'receptionist'; pin: string }
): Promise<SecretaryAuthorizedPhone> {
  const clean = data.phone.replace(/\D/g, '');
  const normalizedPhone = clean.length === 8 ? `506${clean}` : clean;
  const pinHash = hashPin(data.pin);

  const res = await query(`
    INSERT INTO secretary_authorized_phones (tenant_id, phone, name, role, pin_hash)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tenant_id, phone)
    DO UPDATE SET name = $3, role = $4, pin_hash = $5, active = true, failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [tenantId, normalizedPhone, data.name.trim(), data.role || 'owner', pinHash]);

  return mapPhoneRow(res.rows[0]);
}

/**
 * Actualiza un teléfono autorizado existente.
 */
export async function updateAuthorizedPhone(
  id: string,
  tenantId: string,
  data: Partial<{ name: string; role: 'owner' | 'manager' | 'receptionist'; pin: string; active: boolean }>
): Promise<SecretaryAuthorizedPhone | null> {
  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const values: any[] = [id, tenantId];
  let pIdx = 3;

  if (data.name !== undefined) {
    updates.push(`name = $${pIdx++}`);
    values.push(data.name.trim());
  }
  if (data.role !== undefined) {
    updates.push(`role = $${pIdx++}`);
    values.push(data.role);
  }
  if (data.pin !== undefined && data.pin.trim().length > 0) {
    updates.push(`pin_hash = $${pIdx++}`);
    values.push(hashPin(data.pin));
    updates.push(`failed_attempts = 0`);
    updates.push(`locked_until = NULL`);
  }
  if (data.active !== undefined) {
    updates.push(`active = $${pIdx++}`);
    values.push(data.active);
  }

  const res = await query(`
    UPDATE secretary_authorized_phones
    SET ${updates.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `, values);

  return res.rows[0] ? mapPhoneRow(res.rows[0]) : null;
}

/**
 * Elimina un teléfono autorizado.
 */
export async function deleteAuthorizedPhone(id: string, tenantId: string): Promise<boolean> {
  const res = await query(`
    DELETE FROM secretary_authorized_phones
    WHERE id = $1 AND tenant_id = $2
  `, [id, tenantId]);
  return (res.rowCount || 0) > 0;
}

/**
 * Registra intento fallido de PIN. Si acumula 3, bloquea por 15 minutos.
 */
export async function registerFailedPinAttempt(id: string): Promise<{ locked: boolean; remainingAttempts: number }> {
  const cur = await query(`SELECT failed_attempts FROM secretary_authorized_phones WHERE id = $1`, [id]);
  const attempts = (cur.rows[0]?.failed_attempts || 0) + 1;

  if (attempts >= 3) {
    await query(`
      UPDATE secretary_authorized_phones
      SET failed_attempts = $1, locked_until = CURRENT_TIMESTAMP + INTERVAL '15 minutes', updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [attempts, id]);
    return { locked: true, remainingAttempts: 0 };
  } else {
    await query(`
      UPDATE secretary_authorized_phones
      SET failed_attempts = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [attempts, id]);
    return { locked: false, remainingAttempts: 3 - attempts };
  }
}

/**
 * Restablece los intentos fallidos a cero tras login exitoso.
 */
export async function resetFailedAttempts(id: string): Promise<void> {
  await query(`
    UPDATE secretary_authorized_phones
    SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [id]);
}

/**
 * Obtiene la sesión del día para un teléfono autorizado.
 */
export async function getSecretarySession(authorizedPhoneId: string, sessionDate: string): Promise<SecretarySession | null> {
  const res = await query(`
    SELECT * FROM secretary_sessions
    WHERE authorized_phone_id = $1 AND session_date = $2::date
    LIMIT 1
  `, [authorizedPhoneId, sessionDate]);

  if (!res.rows[0]) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    tenantId: r.tenant_id,
    authorizedPhoneId: r.authorized_phone_id,
    sessionDate: r.session_date,
    isAuthenticated: r.is_authenticated === true,
    authenticatedAt: r.authenticated_at,
    lastActivityAt: r.last_activity_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at
  };
}

/**
 * Autentica o crea una sesión diaria válida hasta el final del día en Costa Rica.
 */
export async function authenticateSecretarySession(
  tenantId: string,
  authorizedPhoneId: string,
  sessionDate: string
): Promise<SecretarySession> {
  const res = await query(`
    INSERT INTO secretary_sessions (
      tenant_id, authorized_phone_id, session_date, is_authenticated,
      authenticated_at, last_activity_at, expires_at
    )
    VALUES (
      $1, $2, $3::date, true,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, (CURRENT_TIMESTAMP + INTERVAL '24 hours')
    )
    ON CONFLICT (authorized_phone_id, session_date)
    DO UPDATE SET
      is_authenticated = true,
      authenticated_at = CURRENT_TIMESTAMP,
      last_activity_at = CURRENT_TIMESTAMP,
      expires_at = (CURRENT_TIMESTAMP + INTERVAL '24 hours')
    RETURNING *
  `, [tenantId, authorizedPhoneId, sessionDate]);

  const r = res.rows[0];
  return {
    id: r.id,
    tenantId: r.tenant_id,
    authorizedPhoneId: r.authorized_phone_id,
    sessionDate: r.session_date,
    isAuthenticated: true,
    authenticatedAt: r.authenticated_at,
    lastActivityAt: r.last_activity_at,
    expiresAt: r.expires_at,
    createdAt: r.created_at
  };
}
