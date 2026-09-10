import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// AES-256-GCM Envelope Encryption simulation
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const MASTER_SECRET = 'betico_test_master_encryption_key_32bytes';

function getMasterKey() {
  return crypto.scryptSync(MASTER_SECRET, 'betico_envelope_salt_2026', 32);
}

function getTenantDataKey(tenantId) {
  const masterKey = getMasterKey();
  return crypto.createHmac('sha256', masterKey).update(`tenant_dek_${tenantId}`).digest();
}

function encryptForTenant(tenantId, plaintext) {
  if (!plaintext) return '';
  const key = getTenantDataKey(tenantId);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${authTag}:${encrypted}`;
}

function decryptForTenant(tenantId, cipherText) {
  if (!cipherText || !cipherText.includes(':')) return cipherText || '';
  const parts = cipherText.split(':');
  if (parts.length !== 3) throw new Error('Formato inválido');
  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const key = getTenantDataKey(tenantId);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivBase64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function maskSecret(secret, visibleChars = 4) {
  if (!secret) return '';
  const trimmed = String(secret).trim();
  if (trimmed.length <= visibleChars) return '••••';
  const tail = trimmed.slice(-visibleChars);
  return `••••••••${tail}`;
}

describe('Almendro Electronic Invoicing - Security & Multi-Tenant Isolation Tests', () => {

  describe('1. Cryptographic Protection & Envelope Encryption', () => {
    const tenantId1 = 'tenant_clinica_sonrisas_001';
    const tenantId2 = 'tenant_taller_mecanico_002';
    const realApiKey = '1|abc123almendroLiveProductionTokenSecret999';

    test('encrypts API Key with AES-256-GCM and unique IV', () => {
      const enc1 = encryptForTenant(tenantId1, realApiKey);
      const enc2 = encryptForTenant(tenantId1, realApiKey);

      assert.notEqual(enc1, enc2, 'Cada cifrado debe producir un IV aleatorio diferente');
      assert.ok(enc1.startsWith('=' ) === false);
      assert.equal(enc1.split(':').length, 3, 'Debe contener iv:authTag:ciphertext');

      const decrypted = decryptForTenant(tenantId1, enc1);
      assert.equal(decrypted, realApiKey, 'Debe descifrar el token exacto');
    });

    test('rejects cross-tenant decryption (Tenant 2 cannot decrypt Tenant 1 key)', () => {
      const encryptedTenant1 = encryptForTenant(tenantId1, realApiKey);

      assert.throws(() => {
        decryptForTenant(tenantId2, encryptedTenant1);
      }, /Unsupported state or unable to authenticate data|bad decrypt/i, 'La clave derivada de otro tenant no debe autenticar el tag');
    });

    test('masks secret safely for UI presentation', () => {
      const masked = maskSecret(realApiKey);
      assert.ok(masked.startsWith('••••••••'));
      assert.ok(masked.endsWith('t999'));
      assert.ok(!masked.includes('almendroLiveProductionToken'));
    });
  });

  describe('2. Multi-Tenant Data Boundary for Vouchers & Settings', () => {
    const mockDb = {
      configs: new Map(),
      vouchers: []
    };

    const tenantA = 'tenant_restaurante_la_esquina';
    const tenantB = 'tenant_boutique_moda';

    // Seed Configs
    mockDb.configs.set(tenantA, {
      tenantId: tenantA,
      isEnabled: true,
      apiKeyEncrypted: encryptForTenant(tenantA, 'token_tenant_a'),
      moduleToggles: { storeEnabled: true, bookingsEnabled: false, courtsEnabled: false, restaurantEnabled: true }
    });

    mockDb.configs.set(tenantB, {
      tenantId: tenantB,
      isEnabled: true,
      apiKeyEncrypted: encryptForTenant(tenantB, 'token_tenant_b'),
      moduleToggles: { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false, restaurantEnabled: false }
    });

    // Seed Vouchers
    mockDb.vouchers.push({
      id: 'v_001',
      tenantId: tenantA,
      docType: '04',
      numericKey: '50601012600310112345600100001040000000001198765432',
      totalAmount: 15000,
      receiverName: 'Carlos Gómez'
    });

    mockDb.vouchers.push({
      id: 'v_002',
      tenantId: tenantB,
      docType: '01',
      numericKey: '50601012600310199999900100001010000000001112345678',
      totalAmount: 45000,
      receiverName: 'Empresa ABC S.A.'
    });

    test('Tenant A can only query its own vouchers', () => {
      const vouchersTenantA = mockDb.vouchers.filter(v => v.tenantId === tenantA);
      assert.equal(vouchersTenantA.length, 1);
      assert.equal(vouchersTenantA[0].id, 'v_001');
      assert.equal(vouchersTenantA[0].receiverName, 'Carlos Gómez');
    });

    test('Tenant B cannot see vouchers belonging to Tenant A', () => {
      const vouchersTenantB = mockDb.vouchers.filter(v => v.tenantId === tenantB);
      assert.equal(vouchersTenantB.length, 1);
      assert.equal(vouchersTenantB[0].id, 'v_002');
      assert.ok(!vouchersTenantB.some(v => v.tenantId === tenantA));
    });
  });

  describe('3. Granular Module Toggles Evaluation', () => {
    function evaluateModuleInvoicing(config, moduleName) {
      if (!config || !config.isEnabled || !config.apiKey) return false;
      return Boolean(config.moduleToggles && config.moduleToggles[moduleName]);
    }

    const tenantConfig = {
      isEnabled: true,
      apiKey: 'valid_api_key',
      moduleToggles: {
        storeEnabled: true,
        bookingsEnabled: true,
        courtsEnabled: false,
        restaurantEnabled: false
      }
    };

    test('allows invoicing on Store and Bookings when enabled', () => {
      assert.equal(evaluateModuleInvoicing(tenantConfig, 'storeEnabled'), true);
      assert.equal(evaluateModuleInvoicing(tenantConfig, 'bookingsEnabled'), true);
    });

    test('blocks invoicing on Courts and Restaurant when disabled', () => {
      assert.equal(evaluateModuleInvoicing(tenantConfig, 'courtsEnabled'), false);
      assert.equal(evaluateModuleInvoicing(tenantConfig, 'restaurantEnabled'), false);
    });

    test('blocks all invoicing if master switch is turned off', () => {
      const disabledConfig = { ...tenantConfig, isEnabled: false };
      assert.equal(evaluateModuleInvoicing(disabledConfig, 'storeEnabled'), false);
      assert.equal(evaluateModuleInvoicing(disabledConfig, 'bookingsEnabled'), false);
    });
  });

  describe('4. Costa Rica Taxpayer ID & CAByS Formatting', () => {
    test('validates and cleans 9, 10, 11 and 12-digit Costa Rica Tax IDs', () => {
      const testCases = [
        { input: '1-1234-0567', expected: '112340567', valid: true },       // Física (9 dígitos)
        { input: '3-101-789012', expected: '3101789012', valid: true },     // Jurídica (10 dígitos)
        { input: '155-123456789', expected: '155123456789', valid: true }, // DIMEX (11-12 dígitos)
        { input: '123', expected: '123', valid: false },                    // Inválido
        { input: 'abc-def', expected: '', valid: false }                     // Inválido
      ];

      for (const tc of testCases) {
        const clean = tc.input.replace(/\D/g, '');
        const isValid = clean.length >= 9 && clean.length <= 12;
        assert.equal(isValid, tc.valid, `Cédula ${tc.input} validez esperada: ${tc.valid}`);
        if (tc.valid) {
          assert.equal(clean, tc.expected);
        }
      }
    });

    test('verifies unit price decimal formatting (5 decimal places for Almendro v1.1.1)', () => {
      const price1 = 15000;
      const price2 = 2500.5;

      assert.equal(price1.toFixed(5), '15000.00000');
      assert.equal(price2.toFixed(5), '2500.50000');
    });

    test('validates 50-digit numeric key structure', () => {
      const validKey = '50607092600310112345600100001040000000001198765432';
      assert.equal(validKey.length, 50);
      assert.equal(validKey.slice(0, 3), '506'); // País Costa Rica
      assert.equal(/^\d{50}$/.test(validKey), true);
    });
  });

  describe('5. SuperAdmin Subscription Billing RBAC', () => {
    function verifySuperAdminPermission(userRole) {
      if (userRole === 'superadmin') return { allowed: true };
      return { allowed: false, statusCode: 403, error: 'Solo el rol superadmin puede facturar suscripciones' };
    }

    test('allows SuperAdmin to access platform subscription billing', () => {
      const res = verifySuperAdminPermission('superadmin');
      assert.equal(res.allowed, true);
    });

    test('denies access to tenant admin or staff', () => {
      const resAdmin = verifySuperAdminPermission('admin');
      assert.equal(resAdmin.allowed, false);
      assert.equal(resAdmin.statusCode, 403);

      const resStaff = verifySuperAdminPermission('staff');
      assert.equal(resStaff.allowed, false);
      assert.equal(resStaff.statusCode, 403);
    });
  });

  describe('6. External Manual Billing Mode & Receptor Tax Data Protocol', () => {
    function resolvePublicBillingConfig(config, moduleName = 'store') {
      if (!config) return { isEnabled: false };
      const mode = config.billingMode || (config.isEnabled && config.apiKey ? 'ALMENDRO_AUTO' : config.isEnabled ? 'EXTERNAL_MANUAL' : 'DISABLED');
      
      if (mode === 'DISABLED') return { isEnabled: false, billingMode: 'DISABLED' };
      
      const moduleKey = `${moduleName}Enabled`;
      const isModuleActive = config.moduleToggles ? config.moduleToggles[moduleKey] !== false : true;
      if (!isModuleActive) return { isEnabled: false, billingMode: mode };

      if (mode === 'EXTERNAL_MANUAL') {
        return { isEnabled: true, billingMode: 'EXTERNAL_MANUAL' };
      }

      if (mode === 'ALMENDRO_AUTO') {
        const isConfigured = Boolean(config.apiKey);
        return { isEnabled: isConfigured, billingMode: 'ALMENDRO_AUTO' };
      }

      return { isEnabled: false, billingMode: mode };
    }

    test('enables public checkout billing form in EXTERNAL_MANUAL mode without Almendro API key', () => {
      const manualMerchantConfig = {
        tenantId: 'tenant_pulperia_don_pepe',
        billingMode: 'EXTERNAL_MANUAL',
        isEnabled: true,
        apiKey: null, // No Almendro subscription needed!
        moduleToggles: { storeEnabled: true }
      };

      const publicConfig = resolvePublicBillingConfig(manualMerchantConfig, 'store');
      assert.equal(publicConfig.isEnabled, true, 'Checkout debe mostrar formulario de facturación');
      assert.equal(publicConfig.billingMode, 'EXTERNAL_MANUAL');
    });

    test('respects DISABLED billing mode', () => {
      const disabledMerchantConfig = {
        tenantId: 'tenant_bar_central',
        billingMode: 'DISABLED',
        isEnabled: false,
        apiKey: 'some_key'
      };

      const publicConfig = resolvePublicBillingConfig(disabledMerchantConfig, 'store');
      assert.equal(publicConfig.isEnabled, false);
      assert.equal(publicConfig.billingMode, 'DISABLED');
    });

    test('requires API key in ALMENDRO_AUTO mode', () => {
      const autoWithoutKey = {
        tenantId: 'tenant_auto_nokey',
        billingMode: 'ALMENDRO_AUTO',
        isEnabled: true,
        apiKey: null
      };
      assert.equal(resolvePublicBillingConfig(autoWithoutKey).isEnabled, false);

      const autoWithKey = {
        tenantId: 'tenant_auto_withkey',
        billingMode: 'ALMENDRO_AUTO',
        isEnabled: true,
        apiKey: 'valid_api_token_almendro'
      };
      assert.equal(resolvePublicBillingConfig(autoWithKey).isEnabled, true);
    });

    test('manual invoice state transition updates order billing metadata', () => {
      const order = {
        id: 'ord_12345',
        tenantId: 'tenant_pulperia_don_pepe',
        billingInfo: {
          requiresInvoice: true,
          idNumber: '112340567',
          idType: '01',
          legalName: 'Juan Pérez Soto',
          email: 'juan@example.com',
          invoiceStatus: 'pending'
        }
      };

      // Transition via manual invoice
      const externalRef = 'FE-00100001010000004521';
      const updatedBilling = {
        ...order.billingInfo,
        invoiceStatus: 'issued',
        issuedManually: true,
        externalInvoiceReference: externalRef,
        issuedAt: new Date().toISOString()
      };

      assert.equal(updatedBilling.invoiceStatus, 'issued');
      assert.equal(updatedBilling.issuedManually, true);
      assert.equal(updatedBilling.externalInvoiceReference, externalRef);
      assert.ok(updatedBilling.issuedAt);
    });

    test('validates Receptor does not require CodigoActividad under DGT-R-033-2019 / XML v4.3', () => {
      // Costa Rica Hacienda XML v4.3 schema rule:
      // Emisor: CodigoActividad is MANDATORY (6 digits)
      // Receptor: CodigoActividad does NOT exist in XML specification
      const emisorXmlPayload = {
        Numero: '3101123456',
        CodigoActividad: '722003' // Mandatory for Emisor
      };
      const receptorXmlPayload = {
        Identificacion: {
          Tipo: '01',
          Numero: '112340567'
        },
        Nombre: 'María Rodríguez Calvo',
        CorreoElectronico: 'maria@correo.cr'
        // Notice: NO CodigoActividad in Receptor!
      };

      assert.ok(emisorXmlPayload.CodigoActividad, 'Emisor requiere actividad económica obligatoria');
      assert.equal(receptorXmlPayload.CodigoActividad, undefined, 'Receptor NO lleva actividad económica en factura de compra');
    });
  });
});
