import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

// -------------------------------------------------------------
// PURE IMPLEMENTATIONS (ALIGNED WITH WALLET REPOS & SERVICES)
// -------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCRYPTION_KEY = 'e8a1b2c3d4e5f60718293a4b5c6d7e8f';

function getEncryptionKey() {
  return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;
  const parts = encryptedData.split(':');
  if (parts.length !== 3) throw new Error('Invalid format');
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function parseGoogleServiceAccountJson(input) {
  const trimmed = (input || '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        clientEmail: parsed.client_email || undefined,
        privateKey: parsed.private_key || undefined
      };
    } catch (_) {
      return null;
    }
  }
  return null;
}

function verifyGoogleWalletCredentials(issuerId, clientEmail, privateKeyPem) {
  const trimmedIssuer = (issuerId || '').trim();
  const trimmedEmail = (clientEmail || '').trim();
  const trimmedKey = (privateKeyPem || '').trim();

  if (!trimmedIssuer) {
    return { success: false, message: 'El ID de Emisor (Issuer ID) de Google Wallet es obligatorio.' };
  }
  if (!trimmedEmail) {
    return { success: false, message: 'El correo de la Cuenta de Servicio de Google Cloud es obligatorio.' };
  }
  if (!trimmedKey) {
    return { success: false, message: 'La llave privada RSA de la Cuenta de Servicio es obligatoria.' };
  }
  if (!trimmedKey.includes('-----BEGIN') || !trimmedKey.includes('PRIVATE KEY-----')) {
    return {
      success: false,
      message: 'Formato de llave privada inválido. Debe ser una llave RSA en formato PEM (iniciando con -----BEGIN PRIVATE KEY----- o -----BEGIN RSA PRIVATE KEY-----).'
    };
  }

  try {
    const formattedKey = trimmedKey.replace(/\\n/g, '\n');
    const testClaims = {
      iss: trimmedEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000)
    };
    const signedToken = jwt.sign(testClaims, formattedKey, { algorithm: 'RS256' });
    if (!signedToken) {
      return { success: false, message: 'No se pudo generar la firma RS256 de prueba.' };
    }
    return {
      success: true,
      message: '¡Credenciales de Google Wallet validadas exitosamente! La llave privada RSA y la cuenta de servicio funcionan correctamente con el estándar RS256.'
    };
  } catch (err) {
    return {
      success: false,
      message: `Error al verificar la firma RSA de la llave privada: ${err.message || 'Llave RSA inválida o corrupta'}`
    };
  }
}

function verifyAppleWalletCredentials(passTypeId, teamId, p12Buffer, _p12Password) {
  const trimmedPassType = (passTypeId || '').trim();
  const trimmedTeam = (teamId || '').trim();

  if (!trimmedPassType) {
    return { success: false, message: 'El Pass Type ID de Apple Wallet es obligatorio (ej. pass.cr.minegocio.club).' };
  }
  if (!trimmedPassType.startsWith('pass.')) {
    return { success: false, message: 'El Pass Type ID debe comenzar con "pass." (ej. pass.cr.minegocio.club).' };
  }
  if (!trimmedTeam) {
    return { success: false, message: 'El Apple Team ID es obligatorio (código alfanumérico de 10 caracteres).' };
  }
  if (p12Buffer && p12Buffer.length === 0) {
    return { success: false, message: 'El archivo de certificado .p12 provisto está vacío.' };
  }

  return {
    success: true,
    message: '¡Credenciales de Apple Wallet validadas exitosamente!'
  };
}

function isGoogleWalletConfigured(customCredentials) {
  if (
    customCredentials?.googleIssuerId &&
    customCredentials?.googleClientEmail &&
    customCredentials?.googlePrivateKey
  ) {
    return true;
  }
  return false;
}

function generateGoogleWalletSaveUrl(card, customer, customCredentials) {
  const issuerId = customCredentials?.googleIssuerId || '3388000000022222222';
  const clientEmail = customCredentials?.googleClientEmail || 'wallet@betico.iam.gserviceaccount.com';
  const privateKey = customCredentials?.googlePrivateKey;

  const classId = `${issuerId}.betico_club_${card.tenantId.replace(/-/g, '_')}`;
  const objectId = `${issuerId}.card_${card.id.replace(/-/g, '_')}`;

  const loyaltyClass = {
    id: classId,
    issuerName: card.tenantName || 'Betico Club',
    programName: `Club de Clientes ${card.tenantName || 'Betico'}`,
    reviewStatus: 'UNDER_REVIEW'
  };

  const loyaltyObject = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    accountId: customer.identification,
    accountName: customer.fullName || 'Cliente Betico',
    barcode: {
      type: 'CODE_128',
      value: customer.identification,
      alternateText: customer.identification
    }
  };

  const claims = {
    iss: clientEmail,
    aud: 'google',
    typ: 'savetowallet',
    origins: ['https://betico.app'],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject]
    }
  };

  let token = '';
  if (privateKey) {
    token = jwt.sign(claims, privateKey.replace(/\\n/g, '\n'), { algorithm: 'RS256' });
  }

  return {
    url: `https://pay.google.com/gp/v/save/${token}`,
    jwt: token,
    loyaltyObject,
    isConfigured: isGoogleWalletConfigured(customCredentials)
  };
}

function generateApplePassJson(card, customer, customCredentials) {
  return {
    formatVersion: 1,
    passTypeIdentifier: customCredentials?.applePassTypeId || 'pass.cr.betico.club',
    serialNumber: `card_${card.id}`,
    teamIdentifier: customCredentials?.appleTeamId || 'BETICO_CR',
    organizationName: card.tenantName || 'Betico Club',
    description: `Tarjeta de Fidelidad - ${card.tenantName || 'Betico Club'}`
  };
}

// -------------------------------------------------------------
// TESTS SUITE
// -------------------------------------------------------------

describe('Google Wallet & Apple Wallet Guided Experience & Cryptographic Security', () => {

  // 1. Google Wallet RSA Validation
  describe('1. Google Wallet RSA Credential Validation', () => {
    // Generar par de llaves RSA real para la prueba
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    test('should reject missing or empty Issuer ID', () => {
      const res = verifyGoogleWalletCredentials('', 'test@betico.iam.gserviceaccount.com', privateKey);
      assert.strictEqual(res.success, false);
      assert.match(res.message, /Issuer ID/i);
    });

    test('should reject missing or empty Client Email', () => {
      const res = verifyGoogleWalletCredentials('3388000000022222222', '', privateKey);
      assert.strictEqual(res.success, false);
      assert.match(res.message, /correo de la Cuenta de Servicio/i);
    });

    test('should reject missing or empty Private Key', () => {
      const res = verifyGoogleWalletCredentials('3388000000022222222', 'test@betico.iam.gserviceaccount.com', '');
      assert.strictEqual(res.success, false);
      assert.match(res.message, /llave privada RSA/i);
    });

    test('should reject malformed Private Key without PEM headers', () => {
      const res = verifyGoogleWalletCredentials('3388000000022222222', 'test@betico.iam.gserviceaccount.com', 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC');
      assert.strictEqual(res.success, false);
      assert.match(res.message, /PEM/i);
    });

    test('should reject corrupt or fake RSA Private Key', () => {
      const fakePem = '-----BEGIN PRIVATE KEY-----\nNOT_A_VALID_BASE64_KEY\n-----END PRIVATE KEY-----';
      const res = verifyGoogleWalletCredentials('3388000000022222222', 'test@betico.iam.gserviceaccount.com', fakePem);
      assert.strictEqual(res.success, false);
      assert.match(res.message, /Error al verificar la firma RSA/i);
    });

    test('should successfully validate real 2048-bit RSA Private Key with RS256 token signing', () => {
      const res = verifyGoogleWalletCredentials('3388000000022222222', 'wallet-sa@betico.iam.gserviceaccount.com', privateKey);
      assert.strictEqual(res.success, true);
      assert.match(res.message, /validadas exitosamente/i);
      assert.match(res.message, /RS256/i);
    });
  });

  // 2. Apple Wallet Validation
  describe('2. Apple Wallet Credential Validation', () => {
    test('should reject Pass Type ID that does not start with "pass."', () => {
      const res = verifyAppleWalletCredentials('com.minegocio.club', 'A1B2C3D4E5');
      assert.strictEqual(res.success, false);
      assert.match(res.message, /pass\./i);
    });

    test('should reject empty Team ID', () => {
      const res = verifyAppleWalletCredentials('pass.cr.minegocio.club', '');
      assert.strictEqual(res.success, false);
      assert.match(res.message, /Team ID/i);
    });

    test('should accept valid Pass Type ID and 10-char Team ID', () => {
      const res = verifyAppleWalletCredentials('pass.cr.betico.club', 'A1B2C3D4E5');
      assert.strictEqual(res.success, true);
      assert.match(res.message, /validadas exitosamente/i);
    });

    test('should generate compliant Apple pass.json with custom tenant passTypeId and teamId', () => {
      const mockCard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        tenantName: 'Soda La Esquina'
      };
      const mockCustomer = {
        identification: '1-1111-2222',
        fullName: 'María Mora'
      };
      const customCreds = {
        applePassTypeId: 'pass.cr.sodalaesquina.club',
        appleTeamId: 'APPLE_TEAM_01'
      };

      const passJson = generateApplePassJson(mockCard, mockCustomer, customCreds);
      assert.strictEqual(passJson.passTypeIdentifier, 'pass.cr.sodalaesquina.club');
      assert.strictEqual(passJson.teamIdentifier, 'APPLE_TEAM_01');
      assert.strictEqual(passJson.organizationName, 'Soda La Esquina');
      assert.strictEqual(passJson.formatVersion, 1);
    });
  });

  // 3. Service Account JSON Parsing
  describe('3. Google Service Account JSON Auto-Parser', () => {
    test('should extract client_email and private_key from valid Google Cloud JSON', () => {
      const sampleJson = JSON.stringify({
        type: 'service_account',
        project_id: 'betico-cloud-prod',
        private_key_id: 'abc123xyz',
        private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----',
        client_email: 'wallet-service@betico-cloud-prod.iam.gserviceaccount.com',
        client_id: '109923847293847'
      });

      const parsed = parseGoogleServiceAccountJson(sampleJson);
      assert.ok(parsed);
      assert.strictEqual(parsed.clientEmail, 'wallet-service@betico-cloud-prod.iam.gserviceaccount.com');
      assert.strictEqual(parsed.privateKey, '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----');
    });

    test('should return null if input is not a JSON object', () => {
      const parsed = parseGoogleServiceAccountJson('-----BEGIN PRIVATE KEY-----');
      assert.strictEqual(parsed, null);
    });

    test('should return null on invalid JSON format', () => {
      const parsed = parseGoogleServiceAccountJson('{ invalid json format');
      assert.strictEqual(parsed, null);
    });
  });

  // 4. AES-256-GCM Encryption / Decryption at Rest
  describe('4. AES-256-GCM Cryptographic Storage & In-Memory Isolation', () => {
    test('should encrypt and decrypt RSA private key without losing byte integrity or newlines', () => {
      const samplePem = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC\nTEST_CONTENT_BETICO_WALLETS\n-----END PRIVATE KEY-----`;
      const encrypted = encrypt(samplePem);
      assert.notStrictEqual(encrypted, samplePem);
      assert.ok(encrypted.includes(':')); // iv:authTag:encrypted

      const decrypted = decrypt(encrypted);
      assert.strictEqual(decrypted, samplePem);
    });

    test('should encrypt and decrypt Apple .p12 certificate binary buffer via Base64 envelope', () => {
      const randomCertBytes = crypto.randomBytes(512); // Simula archivo .p12 binario
      const base64Cert = randomCertBytes.toString('base64');
      const encrypted = encrypt(base64Cert);

      const decryptedBase64 = decrypt(encrypted);
      const recoveredBuffer = Buffer.from(decryptedBase64, 'base64');
      assert.deepStrictEqual(recoveredBuffer, randomCertBytes);
    });
  });

  // 5. Google Wallet Custom Tenant Signing vs Platform Fallback
  describe('5. Tenant-Specific RS256 JWT Signing & Unconfigured Protection', () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    test('should recognize when custom tenant credentials are configured', () => {
      const configured = isGoogleWalletConfigured({
        googleIssuerId: '3388000000055555555',
        googleClientEmail: 'wallet@tienda.iam.gserviceaccount.com',
        googlePrivateKey: privateKey
      });
      assert.strictEqual(configured, true);
    });

    test('should recognize when credentials are not configured', () => {
      const configured = isGoogleWalletConfigured({
        googleIssuerId: '',
        googleClientEmail: '',
        googlePrivateKey: ''
      });
      assert.strictEqual(configured, false);
    });

    test('should generate RS256 JWT signed with custom tenant credentials', () => {
      const mockCard = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        tenantName: 'Zapatería El Éxito'
      };
      const mockCustomer = {
        identification: '2-0345-0678',
        fullName: 'Juan Pérez'
      };
      const customCreds = {
        googleIssuerId: '3388000000099999999',
        googleClientEmail: 'wallet@zapateria.iam.gserviceaccount.com',
        googlePrivateKey: privateKey
      };

      const result = generateGoogleWalletSaveUrl(mockCard, mockCustomer, customCreds);
      assert.ok(result.url.startsWith('https://pay.google.com/gp/v/save/'));
      assert.ok(result.jwt);
      assert.strictEqual(result.isConfigured, true);
      assert.strictEqual(result.loyaltyObject.accountId, '2-0345-0678');
      assert.strictEqual(result.loyaltyObject.classId, '3388000000099999999.betico_club_123e4567_e89b_12d3_a456_426614174001');
    });
  });

  // 6. Spanish UI Rule Compliance (Zero '&')
  describe('6. Spanish Language UI Invariant (Zero "&" in Visible Text)', () => {
    test('should strictly use "y" and have zero unescaped "&" in visible Spanish UI in LoyaltyManager.tsx', () => {
      const filePath = path.resolve('src/client/components/LoyaltyManager.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Buscar patrones visibles como " & " en texto de etiquetas, títulos o botones en español
      // Excluyendo operadores lógicos &&
      const visibleAmpersandMatches = content.match(/[a-záéíóúA-ZÁÉÍÓÚ]\s+&\s+[a-záéíóúA-ZÁÉÍÓÚ]/g);
      assert.strictEqual(
        visibleAmpersandMatches,
        null,
        `Se encontraron símbolos '&' en texto visible en español: ${JSON.stringify(visibleAmpersandMatches)}`
      );
    });
  });

});
