import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Derives a 32-byte master key from the master encryption secret.
 */
function getMasterKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || 'betico_master_encryption_key_default_32bytes';
  return crypto.scryptSync(secret, 'betico_envelope_salt_2026', 32);
}

/**
 * Envelope Encryption: Derives a unique 256-bit Data Encryption Key (DEK) per tenant
 * using HMAC-SHA256 of the tenant identifier keyed with the master key.
 */
function getTenantDataKey(tenantId: string): Buffer {
  const masterKey = getMasterKey();
  return crypto.createHmac('sha256', masterKey).update(`tenant_dek_${tenantId}`).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM and a specific 32-byte key.
 */
function encryptWithKey(key: Buffer, plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts ciphertext formatted as iv:authTag:encrypted using AES-256-GCM.
 */
function decryptWithKey(key: Buffer, cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText || '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de texto cifrado inválido');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class CryptoService {
  /**
   * Encrypts tenant sensitive data (e.g. Tilopay API Key, API Password)
   * using the tenant's derived unique Data Encryption Key (Envelope Encryption).
   */
  static encryptForTenant(tenantId: string, plaintext: string): string {
    if (!tenantId) throw new Error('tenantId es requerido para el cifrado de sobre');
    const dek = getTenantDataKey(tenantId);
    return encryptWithKey(dek, plaintext);
  }

  /**
   * Decrypts tenant sensitive data using the tenant's derived Data Encryption Key.
   */
  static decryptForTenant(tenantId: string, cipherText: string): string {
    if (!tenantId || !cipherText) return '';
    const dek = getTenantDataKey(tenantId);
    try {
      return decryptWithKey(dek, cipherText);
    } catch (err) {
      // Fallback: Check if it was encrypted with legacy global key
      try {
        const legacyKey = crypto.scryptSync(process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY || 'legacy_key', 'salt', 32);
        return decryptWithKey(legacyKey, cipherText);
      } catch (fallbackErr) {
        console.error(`[CryptoService] Error descifrando datos para tenant ${tenantId}`);
        throw new Error('Fallo al descifrar credenciales de pago');
      }
    }
  }

  /**
   * General purpose encryption using the Master Key.
   */
  static encrypt(plaintext: string): string {
    const masterKey = getMasterKey();
    return encryptWithKey(masterKey, plaintext);
  }

  /**
   * General purpose decryption using the Master Key.
   */
  static decrypt(cipherText: string): string {
    const masterKey = getMasterKey();
    return decryptWithKey(masterKey, cipherText);
  }

  /**
   * Safely masks a sensitive secret for UI display (e.g. '••••••••abcd').
   * Never exposes the full plaintext.
   */
  static maskSecret(secret?: string | null, visibleChars: number = 4): string {
    if (!secret) return '';
    const trimmed = String(secret).trim();
    if (trimmed.length <= visibleChars) return '••••';
    const tail = trimmed.slice(-visibleChars);
    return `••••••••${tail}`;
  }
}

export default CryptoService;
