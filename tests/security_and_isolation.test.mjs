import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// PBKDF2 100,000 rounds SHA-512 (OWASP ASVS V2.4 / H-01)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `v2:${salt}:${hash}`;
}

function verifyPassword(password, hashString) {
  if (!hashString || !password) return false;
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
  return false;
}

// AES-256-GCM Authenticated Encryption (ISO/IEC 27001 A.8.24 / H-09)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TEST_KEY = 'test_encryption_key_for_unit_tests_32b!';

function getEncryptionKey(rawKey = TEST_KEY) {
  return crypto.scryptSync(rawKey, 'salt', 32);
}

function encrypt(plaintext, rawKey = TEST_KEY) {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey(rawKey);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedData, rawKey = TEST_KEY) {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    const [ivBase64, authTagBase64, encryptedBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const key = getEncryptionKey(rawKey);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error('Failed to decrypt data: ' + err.message);
  }
}

// Costa Rica Phone Normalization
function normalizeCostaRicaPhone(phone) {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.length === 8) {
    clean = '506' + clean;
  }
  return clean;
}

// --- Test Suites ---

describe('Security & Cryptographic Hardening Tests (ISO/IEC 25010, OWASP ASVS)', () => {

  describe('Password Hashing (PBKDF2 100,000 rounds sha512)', () => {
    test('should hash passwords with v2 prefix and 16-byte random salt', () => {
      const password = 'SuperSecurePassword2026!';
      const hash = hashPassword(password);
      assert.ok(hash.startsWith('v2:'), 'Hash must start with v2:');
      const parts = hash.split(':');
      assert.equal(parts.length, 3, 'Hash must contain prefix, salt, and digest');
      assert.equal(parts[1].length, 32, 'Salt hex length must be 32 (16 bytes)');
      assert.equal(parts[2].length, 128, 'SHA-512 digest hex length must be 128 (64 bytes)');
    });

    test('should verify correct password successfully', () => {
      const password = 'TenantSecretPassword123#';
      const hash = hashPassword(password);
      assert.equal(verifyPassword(password, hash), true, 'Correct password must verify as true');
    });

    test('should reject incorrect password', () => {
      const password = 'CorrectPassword';
      const hash = hashPassword(password);
      assert.equal(verifyPassword('WrongPassword', hash), false, 'Wrong password must verify as false');
    });

    test('should generate different salts and hashes for identical passwords', () => {
      const password = 'SamePasswordTwice';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      assert.notEqual(hash1, hash2, 'Subsequent hashes must have different salts');
      assert.equal(verifyPassword(password, hash1), true);
      assert.equal(verifyPassword(password, hash2), true);
    });

    test('should safely reject empty or invalid inputs', () => {
      assert.equal(verifyPassword('', 'v2:abc:123'), false);
      assert.equal(verifyPassword('pass', ''), false);
      assert.equal(verifyPassword('pass', null), false);
    });
  });

  describe('Symmetric Authenticated Encryption (AES-256-GCM)', () => {
    test('should encrypt and decrypt plaintext payloads intact', () => {
      const secretPayload = 'Tilopay_API_Key_Secret_sk_live_998877665544';
      const ciphertext = encrypt(secretPayload);
      assert.ok(ciphertext.includes(':'), 'Encrypted string must contain colon-separated IV and auth tag');
      
      const decrypted = decrypt(ciphertext);
      assert.equal(decrypted, secretPayload, 'Decrypted value must match original plaintext');
    });

    test('should produce unique IVs for each encryption invocation', () => {
      const secret = 'SameSecretText';
      const c1 = encrypt(secret);
      const c2 = encrypt(secret);
      assert.notEqual(c1, c2, 'Ciphertext must differ due to randomized IV');
      assert.equal(decrypt(c1), secret);
      assert.equal(decrypt(c2), secret);
    });

    test('should reject tampered ciphertext with authentication error (MAC failure)', () => {
      const secret = 'Confidential_Data_ISO27001';
      const encrypted = encrypt(secret);
      const parts = encrypted.split(':');
      
      // Flip characters in the ciphertext payload
      const tamperedCiphertext = parts[2].slice(0, -2) + 'AA';
      const tampered = `${parts[0]}:${parts[1]}:${tamperedCiphertext}`;
      
      assert.throws(() => {
        decrypt(tampered);
      }, /Failed to decrypt data/, 'Tampered ciphertext must fail GCM authentication check');
    });

    test('should reject tampered auth tag', () => {
      const secret = 'Confidential_Data_ISO27001';
      const encrypted = encrypt(secret);
      const parts = encrypted.split(':');
      
      // Tamper the auth tag with 16 random bytes
      const tamperedAuthTag = crypto.randomBytes(16).toString('base64');
      const tampered = `${parts[0]}:${tamperedAuthTag}:${parts[2]}`;
      
      assert.throws(() => {
        decrypt(tampered);
      }, /Failed to decrypt data/, 'Tampered auth tag must fail GCM validation');
    });
  });

  describe('JWT Access Tokens & Anti-Forgery (OWASP ASVS V3.5, V4.1)', () => {
    const JWT_SECRET = 'unit_test_jwt_secret_betico_2026_isolated';
    const FORGERY_SECRET = 'malicious_attacker_forged_secret_key';

    test('should generate signed token and verify valid payload', () => {
      const claims = { userId: 'usr_123', tenantId: 'tenant_abc', role: 'admin' };
      const token = jwt.sign(claims, JWT_SECRET, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, JWT_SECRET);
      assert.equal(decoded.userId, claims.userId);
      assert.equal(decoded.tenantId, claims.tenantId);
      assert.equal(decoded.role, claims.role);
    });

    test('should reject tokens signed with an unauthorized secret (forgery rejection)', () => {
      const forgedClaims = { userId: 'usr_hacker', tenantId: 'tenant_victim', role: 'superadmin' };
      const forgedToken = jwt.sign(forgedClaims, FORGERY_SECRET, { expiresIn: '1h' });

      assert.throws(() => {
        jwt.verify(forgedToken, JWT_SECRET);
      }, (err) => {
        return err.name === 'JsonWebTokenError' && err.message === 'invalid signature';
      }, 'Forged token must be rejected with invalid signature');
    });

    test('should reject expired tokens', async () => {
      const claims = { userId: 'usr_123', tenantId: 'tenant_abc', role: 'admin' };
      const expiredToken = jwt.sign(claims, JWT_SECRET, { expiresIn: '1ms' });
      
      await new Promise(resolve => setTimeout(resolve, 50));

      assert.throws(() => {
        jwt.verify(expiredToken, JWT_SECRET);
      }, (err) => {
        return err.name === 'TokenExpiredError';
      }, 'Expired token must throw TokenExpiredError');
    });
  });

  describe('Costa Rica Phone Normalization (E.164 alignment)', () => {
    test('should add 506 country code to 8-digit mobile numbers', () => {
      assert.equal(normalizeCostaRicaPhone('88887777'), '50688887777');
      assert.equal(normalizeCostaRicaPhone('70123456'), '50670123456');
      assert.equal(normalizeCostaRicaPhone('60010020'), '50660010020');
    });

    test('should strip punctuation, dashes, spaces and international prefix', () => {
      assert.equal(normalizeCostaRicaPhone('+506 8888-7777'), '50688887777');
      assert.equal(normalizeCostaRicaPhone('(+506) 7012 3456'), '50670123456');
      assert.equal(normalizeCostaRicaPhone('8888-7777'), '50688887777');
    });

    test('should preserve already formatted 506 11-digit numbers', () => {
      assert.equal(normalizeCostaRicaPhone('50688887777'), '50688887777');
    });

    test('should handle empty or null values gracefully', () => {
      assert.equal(normalizeCostaRicaPhone(''), '');
      assert.equal(normalizeCostaRicaPhone(null), '');
      assert.equal(normalizeCostaRicaPhone(undefined), '');
    });
  });

  describe('Multi-Tenant Data Boundary Protection', () => {
    test('should enforce tenant boundary matching', () => {
      const authenticatedTenantId = 'tenant_company_a';
      const requestedResourceTenantId = 'tenant_company_b';
      
      const isAuthorized = (reqTenant, resourceTenant) => reqTenant === resourceTenant;
      
      assert.equal(isAuthorized(authenticatedTenantId, authenticatedTenantId), true);
      assert.equal(isAuthorized(authenticatedTenantId, requestedResourceTenantId), false);
    });
  });
});
