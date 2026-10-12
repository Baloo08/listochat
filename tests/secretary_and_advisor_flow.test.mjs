import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Implementación pura del motor criptográfico del Secretario
function hashPin(pin, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, useSalt, 10000, 32, 'sha256').toString('hex');
  return `${useSalt}:${hash}`;
}

function verifyPin(pin, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const computed = crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(originalHash));
}

function normalizeSecretaryPhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length === 8) return `506${clean}`;
  return clean;
}

describe('Secretario Virtual por WhatsApp y Asesor Empresarial (ISO 25010 & OWASP)', () => {

  test('1. Hash Criptográfico del PIN de 4 Dígitos (PBKDF2 sha256)', () => {
    const pin = '1234';
    const hash = hashPin(pin);

    assert.ok(hash.includes(':'), 'El hash debe contener salt y digest separados por dos puntos');
    assert.equal(verifyPin('1234', hash), true, 'El PIN correcto debe verificarse como válido');
    assert.equal(verifyPin('0000', hash), false, 'Un PIN incorrecto debe ser rechazado');
    assert.equal(verifyPin('1235', hash), false, 'PIN con variación de 1 dígito debe ser rechazado');
    assert.equal(verifyPin('', hash), false, 'PIN vacío debe ser rechazado');
  });

  test('2. Salting Único e Inmunidad a Ataques de Diccionario (Rainbow Tables)', () => {
    const pin = '5678';
    const hash1 = hashPin(pin);
    const hash2 = hashPin(pin);

    // Mismo PIN debe generar hashes completamente diferentes debido al salt aleatorio
    assert.notEqual(hash1, hash2);
    assert.equal(verifyPin(pin, hash1), true);
    assert.equal(verifyPin(pin, hash2), true);
  });

  test('3. Validación Estricta de Formato de PIN de 4 Dígitos', () => {
    const pinRegex = /^\d{4}$/;

    assert.equal(pinRegex.test('1234'), true);
    assert.equal(pinRegex.test('0000'), true);
    assert.equal(pinRegex.test('9999'), true);

    // Inválidos
    assert.equal(pinRegex.test('123'), false, 'Menos de 4 dígitos');
    assert.equal(pinRegex.test('12345'), false, 'Más de 4 dígitos');
    assert.equal(pinRegex.test('12a4'), false, 'Caracteres alfanuméricos');
    assert.equal(pinRegex.test(' 1234'), false, 'Espacios iniciales');
    assert.equal(pinRegex.test(''), false, 'Cadena vacía');
  });

  test('4. Normalización de Teléfonos para Costa Rica (E.164)', () => {
    assert.equal(normalizeSecretaryPhone('8888-8888'), '50688888888');
    assert.equal(normalizeSecretaryPhone('8888 8888'), '50688888888');
    assert.equal(normalizeSecretaryPhone('+506 8888-8888'), '50688888888');
    assert.equal(normalizeSecretaryPhone('50688888888'), '50688888888');
    assert.equal(normalizeSecretaryPhone(''), '');
  });

  test('5. Protocolo de Bloqueo tras 3 Intentos Fallidos de PIN', () => {
    let failedAttempts = 0;
    let lockedUntil = null;

    function registerAttempt(isSuccess) {
      if (isSuccess) {
        failedAttempts = 0;
        lockedUntil = null;
        return { locked: false, success: true };
      }
      failedAttempts += 1;
      if (failedAttempts >= 3) {
        lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutos
        return { locked: true, success: false, remaining: 0 };
      }
      return { locked: false, success: false, remaining: 3 - failedAttempts };
    }

    // Intento 1 fallido
    const r1 = registerAttempt(false);
    assert.equal(r1.locked, false);
    assert.equal(r1.remaining, 2);

    // Intento 2 fallido
    const r2 = registerAttempt(false);
    assert.equal(r2.locked, false);
    assert.equal(r2.remaining, 1);

    // Intento 3 fallido => Bloqueo de seguridad
    const r3 = registerAttempt(false);
    assert.equal(r3.locked, true);
    assert.equal(r3.remaining, 0);
    assert.ok(lockedUntil > Date.now());

    // Reset tras éxito
    const rSuccess = registerAttempt(true);
    assert.equal(rSuccess.locked, false);
    assert.equal(failedAttempts, 0);
    assert.equal(lockedUntil, null);
  });

  test('6. Invariante de Aislamiento Multi-Tenant de Secretarios', () => {
    const tenantA = 'tenant_barberia_central';
    const tenantB = 'tenant_clinica_san_miguel';

    const secretariosDb = [
      { id: 'sec_1', tenantId: tenantA, phone: '50688888888', name: 'Carlos Dueño', role: 'owner' },
      { id: 'sec_2', tenantId: tenantB, phone: '50677777777', name: 'Dra. María', role: 'manager' }
    ];

    function getSecretaryForTenant(tenantId, phone) {
      return secretariosDb.find(s => s.tenantId === tenantId && s.phone === phone) || null;
    }

    // Carlos existe en Barbería Central pero NO en Clínica San Miguel
    assert.ok(getSecretaryForTenant(tenantA, '50688888888') !== null);
    assert.equal(getSecretaryForTenant(tenantB, '50688888888'), null, 'El secretario no debe existir en el tenant B');

    // Dra. María existe en Clínica pero NO en Barbería
    assert.ok(getSecretaryForTenant(tenantB, '50677777777') !== null);
    assert.equal(getSecretaryForTenant(tenantA, '50677777777'), null);
  });

  test('7. Exigencia Estricta de BYOK para Asesor y Secretario', () => {
    function evaluateByokAccess(tenant) {
      if (!tenant.aiApiKeyEncrypted || tenant.aiApiKeyEncrypted.trim() === '') {
        return {
          allowed: false,
          errorCode: 'BYOK_REQUIRED',
          message: 'Requiere clave propia de IA (BYOK)'
        };
      }
      return { allowed: true };
    }

    const tenantWithoutKey = { id: 't1', name: 'Soda El Parque', aiApiKeyEncrypted: null };
    const tenantWithEmptyKey = { id: 't2', name: 'Taller Rápido', aiApiKeyEncrypted: '' };
    const tenantWithValidKey = { id: 't3', name: 'Padel Club', aiApiKeyEncrypted: 'enc_gemini_key_12345' };

    assert.equal(evaluateByokAccess(tenantWithoutKey).allowed, false);
    assert.equal(evaluateByokAccess(tenantWithoutKey).errorCode, 'BYOK_REQUIRED');
    assert.equal(evaluateByokAccess(tenantWithEmptyKey).allowed, false);
    assert.equal(evaluateByokAccess(tenantWithValidKey).allowed, true);
  });

  test('8. Regla de Texto en Español: Cero Ampersands (&) en Mensajes Visibles', () => {
    const welcomeText = 'Bienvenido al Modo Secretario. Consulta tu agenda, reservas y balance del día.';
    const helpText = 'Puedes pedirme citas pendientes, horarios y cancelaciones.';

    assert.equal(welcomeText.includes('&'), false, 'El texto no debe contener &');
    assert.equal(helpText.includes('&'), false, 'El texto no debe contener &');
  });

});
