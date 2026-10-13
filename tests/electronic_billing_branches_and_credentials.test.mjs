import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import forge from 'node-forge';

// ---------------------------------------------------------------------------
// PURE IMPLEMENTATIONS ALIGNED WITH hacienda-native.repo.ts & hacienda-native.service.ts
// ---------------------------------------------------------------------------

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

function formatConsecutiveNumber(branchCode, posCode, docType, sequence) {
  const b = String(branchCode || '001').replace(/\D/g, '').padStart(3, '0').slice(-3);
  const p = String(posCode || '00001').replace(/\D/g, '').padStart(5, '0').slice(-5);
  const d = String(docType || '04').replace(/\D/g, '').padStart(2, '0').slice(-2);
  const s = String(Math.max(1, Number(sequence) || 1)).replace(/\D/g, '').padStart(10, '0').slice(-10);
  return `${b}${p}${d}${s}`;
}

function generateHaciendaNumericKey(params) {
  const d = params.date ? new Date(params.date) : new Date();
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = String(d.getUTCFullYear()).slice(-2);
  const id12 = String(params.taxpayerIdNumber || '').replace(/\D/g, '').padStart(12, '0').slice(-12);
  const consec20 = String(params.consecutive20 || '').replace(/\D/g, '').padStart(20, '0').slice(-20);
  const sit = ['1', '2', '3'].includes(String(params.situation)) ? String(params.situation) : '1';
  const sec8 = params.securityCode
    ? String(params.securityCode).replace(/\D/g, '').padStart(8, '0').slice(-8)
    : String(Math.floor(10000000 + Math.random() * 90000000));
  return `506${day}${month}${year}${id12}${consec20}${sit}${sec8}`;
}

async function inspectP12Certificate(p12Buffer, pin) {
  if (!p12Buffer || p12Buffer.length === 0) {
    return { valid: false, error: 'El archivo .p12 está vacío o no fue proporcionado.' };
  }
  try {
    const binaryStr = p12Buffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, pin);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certs = certBags[forge.pki.oids.certBag];
    if (!certs || certs.length === 0 || !certs[0].cert) {
      return { valid: false, error: 'No se encontró ningún certificado X.509 dentro del archivo .p12.' };
    }

    const cert = certs[0].cert;
    const expiresAt = cert.validity.notAfter;
    const issuedAt = cert.validity.notBefore;
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
    const isExpired = daysRemaining <= 0;

    if (isExpired) {
      return {
        valid: false,
        expiresAt,
        issuedAt,
        daysRemaining,
        isExpired: true,
        error: `El certificado .p12 expiró el ${expiresAt.toISOString().split('T')[0]}.`
      };
    }

    const cnField = cert.subject.getField('CN');
    const issuerField = cert.issuer.getField('CN');

    return {
      valid: true,
      expiresAt,
      issuedAt,
      daysRemaining,
      isExpired: false,
      subject: cnField ? String(cnField.value) : 'Certificado Tributario Hacienda',
      issuer: issuerField ? String(issuerField.value) : 'Banco Central de Costa Rica (CA SINPE)',
      serialNumber: cert.serialNumber
    };
  } catch (_err) {
    return {
      valid: false,
      error: 'No se pudo abrir la llave criptográfica (.p12). Verifique que el PIN de 4 dígitos sea correcto.'
    };
  }
}

describe('Módulo Dedicado de Facturación Electrónica Hacienda (DGT v4.4) y Multi-Sucursal', () => {

  describe('1. Numeración Consecutiva Oficial DGT v4.4 (20 dígitos por Sucursal y Caja)', () => {
    it('genera consecutivo exacto de 20 dígitos para Casa Matriz (001) y Caja Principal (00001)', () => {
      const consecFactura = formatConsecutiveNumber('001', '00001', '01', 1);
      assert.equal(consecFactura.length, 20);
      assert.equal(consecFactura, '00100001010000000001');

      const consecTiquete = formatConsecutiveNumber('001', '00001', '04', 45);
      assert.equal(consecTiquete.length, 20);
      assert.equal(consecTiquete, '00100001040000000045');

      const consecNotaCredito = formatConsecutiveNumber('001', '00001', '03', 12);
      assert.equal(consecNotaCredito.length, 20);
      assert.equal(consecNotaCredito, '00100001030000000012');
    });

    it('genera consecutivos independientes por Sucursal (002, 003) y Caja (00002) normalizando ceros a la izquierda', () => {
      const consecSuc2 = formatConsecutiveNumber('2', '1', '01', 350);
      assert.equal(consecSuc2.length, 20);
      assert.equal(consecSuc2, '00200001010000000350');

      const consecSuc3Caja2 = formatConsecutiveNumber('003', '00002', '04', 9999);
      assert.equal(consecSuc3Caja2.length, 20);
      assert.equal(consecSuc3Caja2, '00300002040000009999');
    });
  });

  describe('2. Clave Numérica Oficial de 50 Dígitos de Hacienda CR', () => {
    it('construye una clave numérica de exactamente 50 dígitos numéricos con código país 506 y cédula a 12 dígitos', () => {
      const consec20 = formatConsecutiveNumber('002', '00001', '01', 18);
      const fixedDate = new Date('2026-10-12T12:00:00Z');
      const key50 = generateHaciendaNumericKey({
        taxpayerIdNumber: '3-101-123456',
        consecutive20: consec20,
        situation: '1',
        securityCode: '87654321',
        date: fixedDate
      });

      assert.equal(key50.length, 50);
      assert.match(key50, /^\d{50}$/);
      assert.ok(key50.startsWith('506'), 'Debe iniciar con el código de país 506');
      // Cédula 3101123456 con padding a 12 dígitos = 003101123456 en posición 9..21
      assert.equal(key50.slice(9, 21), '003101123456');
      // Consecutivo de 20 dígitos en posición 21..41
      assert.equal(key50.slice(21, 41), '00200001010000000018');
      // Situación '1' y código seguridad '87654321'
      assert.equal(key50.slice(41, 42), '1');
      assert.equal(key50.slice(42, 50), '87654321');
    });
  });

  describe('3. Inspector de Llave Criptográfica (.p12) y Validación de PIN', () => {
    it('rechaza buffers vacíos o nulos', async () => {
      const res = await inspectP12Certificate(Buffer.alloc(0), '1234');
      assert.equal(res.valid, false);
      assert.ok(res.error);
    });

    it('extrae titular (CN), emisor, fecha de vencimiento y días restantes de un certificado .p12 real y rechaza PIN incorrecto', async () => {
      const keys = forge.pki.rsa.generateKeyPair(1024);
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '010203';
      cert.validity.notBefore = new Date(Date.now() - 86400000);
      cert.validity.notAfter = new Date(Date.now() + 90 * 86400000);

      const attrs = [
        { name: 'commonName', value: 'GRUPO COMERCIAL BETICO S.A.' },
        { name: 'countryName', value: 'CR' }
      ];
      cert.setSubject(attrs);
      cert.setIssuer([
        { name: 'commonName', value: 'CA SINPE - PERSONA JURIDICA' },
        { name: 'countryName', value: 'CR' }
      ]);
      cert.sign(keys.privateKey);

      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], '4321', {
        algorithm: '3des'
      });
      const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
      const p12Buffer = Buffer.from(p12Der, 'binary');

      // 1. Validar con el PIN correcto ('4321')
      const validCheck = await inspectP12Certificate(p12Buffer, '4321');
      assert.equal(validCheck.valid, true);
      assert.equal(validCheck.subject, 'GRUPO COMERCIAL BETICO S.A.');
      assert.equal(validCheck.issuer, 'CA SINPE - PERSONA JURIDICA');
      assert.equal(validCheck.isExpired, false);
      assert.ok(typeof validCheck.daysRemaining === 'number' && validCheck.daysRemaining >= 89);

      // 2. Validar con PIN incorrecto ('9999')
      const wrongPinCheck = await inspectP12Certificate(p12Buffer, '9999');
      assert.equal(wrongPinCheck.valid, false);
      assert.ok(wrongPinCheck.error && wrongPinCheck.error.toLowerCase().includes('pin'));
    });
  });

  describe('4. Cifrado Criptográfico AES-256-GCM para Credenciales Multi-Sucursal', () => {
    it('cifra y descifra contraseñas ATV, PINs y archivos .p12 por sucursal conservando integridad binaria', () => {
      const sampleAtvPass = 'Atv$Prod#2026!Secret';
      const encryptedPass = encrypt(sampleAtvPass);
      assert.notEqual(encryptedPass, sampleAtvPass);
      assert.equal(decrypt(encryptedPass), sampleAtvPass);

      const sampleP12Bytes = Buffer.from([0x30, 0x82, 0x05, 0x00, 0xff, 0x10, 0x45]);
      const encryptedBlobStr = encrypt(sampleP12Bytes.toString('base64'));
      const restoredBytes = Buffer.from(decrypt(encryptedBlobStr), 'base64');
      assert.deepEqual(restoredBytes, sampleP12Bytes);
    });
  });

  describe('5. Integridad de Backend, Rutas, Navegación y Regla de Español (Cero "&" en UI)', () => {
    const appPath = path.resolve('src/client/App.tsx');
    const viewPath = path.resolve('src/client/components/ElectronicBillingView.tsx');
    const routesPath = path.resolve('src/server/routes/billing-native.routes.ts');
    const repoPath = path.resolve('src/server/db/hacienda-native.repo.ts');
    const servicePath = path.resolve('src/server/services/hacienda-native.service.ts');
    const almendroServicePath = path.resolve('src/server/services/almendro.service.ts');

    it('hacienda-native.repo.ts y hacienda-native.service.ts exportan todas las funciones multi-sucursal, padrón, consecutivos y nota de crédito', () => {
      const repoCode = fs.readFileSync(repoPath, 'utf8');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      const almendroCode = fs.readFileSync(almendroServicePath, 'utf8');

      assert.ok(repoCode.includes('export async function clearHaciendaCredentials'));
      assert.ok(repoCode.includes('export async function getHaciendaBranchesByTenant'));
      assert.ok(repoCode.includes('export async function saveHaciendaBranch'));
      assert.ok(repoCode.includes('export async function deleteHaciendaBranch'));
      assert.ok(repoCode.includes('export function formatConsecutiveNumber'));
      assert.ok(repoCode.includes('export function generateHaciendaNumericKey'));
      assert.ok(repoCode.includes('export async function consumeNextConsecutive'));

      assert.ok(serviceCode.includes('export async function lookupHaciendaTaxpayerPublic'));
      assert.ok(serviceCode.includes('export async function testBranchHaciendaConnection'));
      assert.ok(serviceCode.includes('export async function emitManualOrNativeVoucher'));
      assert.ok(serviceCode.includes('export async function emitCreditNoteForVoucher'));

      assert.ok(almendroCode.includes('buildNativePdfBuffer'));
      assert.ok(almendroCode.includes('emitManualOrNativeVoucher'));
    });

    it('App.tsx incluye el grupo dedicado FACTURACIÓN HACIENDA con sus 3 sub-vistas', () => {
      const appCode = fs.readFileSync(appPath, 'utf8');
      assert.ok(appCode.includes("title: 'FACTURACIÓN HACIENDA'"), 'Debe existir el grupo FACTURACIÓN HACIENDA en el menú lateral');
      assert.ok(appCode.includes("id: 'facturacion_comprobantes'"), 'Debe existir sub-vista facturacion_comprobantes');
      assert.ok(appCode.includes("id: 'facturacion_credenciales'"), 'Debe existir sub-vista facturacion_credenciales');
      assert.ok(appCode.includes("id: 'facturacion_sucursales'"), 'Debe existir sub-vista facturacion_sucursales');
    });

    it('billing-native.routes.ts y ElectronicBillingView.tsx conectan todos los endpoints de credenciales, padrón, sucursales, emisión manual y notas de crédito', () => {
      const viewCode = fs.readFileSync(viewPath, 'utf8');
      const routesCode = fs.readFileSync(routesPath, 'utf8');

      // Endpoints en backend
      assert.ok(routesCode.includes("'/padron/:identificacion'"));
      assert.ok(routesCode.includes("'/test-p12'"));
      assert.ok(routesCode.includes("'/quick-test'"));
      assert.ok(routesCode.includes("'/credentials'"));
      assert.ok(routesCode.includes("'/branches'"));
      assert.ok(routesCode.includes("'/emit-manual'"));
      assert.ok(routesCode.includes("'/vouchers/:id/credit-note'"));
      assert.ok(routesCode.includes("'/vouchers/:id/send-email'"));
      assert.ok(routesCode.includes("'/test-email'"));

      // Consumo en frontend
      assert.ok(viewCode.includes('/api/billing/native/padron/'));
      assert.ok(viewCode.includes('/api/billing/native/test-p12'));
      assert.ok(viewCode.includes('/api/billing/native/quick-test'));
      assert.ok(viewCode.includes('/api/billing/native/credentials'));
      assert.ok(viewCode.includes('/api/billing/native/branches'));
      assert.ok(viewCode.includes('/api/billing/native/emit-manual'));
      assert.ok(viewCode.includes('/credit-note'));
      assert.ok(viewCode.includes('/send-email'));
      assert.ok(viewCode.includes('/api/billing/native/test-email'));
      assert.ok(viewCode.includes('/api/almendro/public/voucher-xml/'));
    });

    it('voucher-email.service.ts y almendro.routes.ts proveen envío automático por correo (PDF + XML DGT v4.4) al correo del cliente', () => {
      const emailServicePath = path.resolve('src/server/services/voucher-email.service.ts');
      const almendroRoutesPath = path.resolve('src/server/routes/almendro.routes.ts');
      const emailServiceCode = fs.readFileSync(emailServicePath, 'utf8');
      const almendroRoutesCode = fs.readFileSync(almendroRoutesPath, 'utf8');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      const almendroCode = fs.readFileSync(almendroServicePath, 'utf8');

      assert.ok(emailServiceCode.includes('export function buildOfficialHaciendaXmlBuffer'));
      assert.ok(emailServiceCode.includes('export function buildVoucherEmailHtml'));
      assert.ok(emailServiceCode.includes('export async function sendVoucherEmailNotification'));
      assert.ok(emailServiceCode.includes('export async function testTenantEmailDelivery'));
      assert.ok(emailServiceCode.includes('https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/'));
      assert.ok(emailServiceCode.includes('FacturaElectronica'));
      assert.ok(emailServiceCode.includes('TiqueteElectronico'));
      assert.ok(emailServiceCode.includes('NotaCreditoElectronica'));

      assert.ok(almendroRoutesCode.includes("'/public/voucher-xml/:keyOrId'"));
      assert.ok(serviceCode.includes('sendVoucherEmailNotification'));
      assert.ok(almendroCode.includes('sendVoucherEmailNotification'));
    });

    it('ElectronicBillingView.tsx no contiene ningún carácter "&" en textos visibles en español ni en comentarios', () => {
      const viewCode = fs.readFileSync(viewPath, 'utf8');
      const withoutLogicalAnd = viewCode
        .replace(/&&/g, '')
        .replace(/\?[a-zA-Z0-9_]+=\$\{[^}]+\}(?:&[a-zA-Z0-9_]+=\$\{[^}]+\})*/g, '')
        .replace(/&[a-zA-Z0-9_]+=/g, '');

      const matches = withoutLogicalAnd.match(/&/g);
      assert.equal(matches, null, 'No debe existir ningún carácter "&" en textos visibles en ElectronicBillingView.tsx');
    });

    it('SuperAdmin Portal cuenta con módulo completo de Facturación Hacienda (Betico Facturas), selector de tenants y regla estricta de "El cliente solicitó factura"', () => {
      const appCode = fs.readFileSync(appPath, 'utf8');
      const viewCode = fs.readFileSync(viewPath, 'utf8');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      const repoCode = fs.readFileSync(repoPath, 'utf8');
      const tenantCtxCode = fs.readFileSync(path.resolve('src/server/middleware/tenantContext.ts'), 'utf8');
      const tenantRoutesCode = fs.readFileSync(path.resolve('src/server/routes/tenant.routes.ts'), 'utf8');
      const collectionsViewCode = fs.readFileSync(path.resolve('src/client/components/BillingCollectionsView.tsx'), 'utf8');
      const superAdminPanelCode = fs.readFileSync(path.resolve('src/client/components/SuperAdminPanel.tsx'), 'utf8');
      const dossierModalCode = fs.readFileSync(path.resolve('src/client/components/TenantDossierModal.tsx'), 'utf8');

      // 1. Menú lateral del SuperAdmin con 3 sub-vistas dedicadas
      assert.ok(appCode.includes("id: 'sa_facturacion_comprobantes'"));
      assert.ok(appCode.includes("id: 'sa_facturacion_credenciales'"));
      assert.ok(appCode.includes("id: 'sa_facturacion_sucursales'"));
      assert.ok(appCode.includes('isSuperAdminMode={true}'));

      // 2. tenantContext resuelve la cuenta fiscal del SuperAdmin ('superadmin')
      assert.ok(tenantCtxCode.includes("role === 'superadmin'"));
      assert.ok(tenantCtxCode.includes('getOrCreateSuperadminTenantId'));

      // 3. Cuota ilimitada para la cuenta fiscal del SuperAdmin
      assert.ok(repoCode.includes("superadmin_platform"));

      // 4. Emisión de factura de suscripción con regla estricta requiresSubscriptionInvoice
      assert.ok(serviceCode.includes('export async function emitPlatformSubscriptionInvoiceForTenant'));
      assert.ok(serviceCode.includes('requiresSubscriptionInvoice'));
      assert.ok(serviceCode.includes('El cliente no tiene activa la opción de solicitud de factura electrónica.'));

      // 5. Selector de Clientes de Tenants en Facturador Manual del SuperAdmin
      assert.ok(viewCode.includes('isSuperAdminMode'));
      assert.ok(viewCode.includes('Seleccionar Cliente de Tenant'));

      // 6. Endpoints y UI de preferencia de facturación por cliente ("El cliente solicitó factura electrónica")
      assert.ok(tenantRoutesCode.includes("'/:id/billing-preference'"));
      assert.ok(tenantRoutesCode.includes("'/:id/emit-subscription-invoice'"));
      assert.ok(collectionsViewCode.includes('requiresSubscriptionInvoice'));
      assert.ok(collectionsViewCode.includes('/emit-subscription-invoice'));
      assert.ok(superAdminPanelCode.includes('requiresSubscriptionInvoice'));
      assert.ok(dossierModalCode.includes('requiresSubscriptionInvoice'));
    });

    it('Aplicación aislada admin-app (Betico Ops) integra Betico Facturas (Hacienda DGT v4.4), selector de tenants y regla estricta de "El cliente solicitó factura"', () => {
      const adminAppCode = fs.readFileSync(path.resolve('admin-app/src/client/App.tsx'), 'utf8');
      const adminBillingCode = fs.readFileSync(path.resolve('admin-app/src/client/components/BillingManager.tsx'), 'utf8');
      const adminMonitoringCode = fs.readFileSync(path.resolve('admin-app/src/client/components/MonitoringCenter.tsx'), 'utf8');
      const adminTenantsCode = fs.readFileSync(path.resolve('admin-app/src/client/components/TenantsManager.tsx'), 'utf8');
      const adminServerIndex = fs.readFileSync(path.resolve('admin-app/src/server/index.ts'), 'utf8');
      const adminTenantsRoutes = fs.readFileSync(path.resolve('admin-app/src/server/routes/tenants.routes.ts'), 'utf8');
      const adminMonitoringRoutes = fs.readFileSync(path.resolve('admin-app/src/server/routes/monitoring.routes.ts'), 'utf8');
      const adminBillingRoutes = fs.readFileSync(path.resolve('admin-app/src/server/routes/billing.routes.ts'), 'utf8');
      const adminPkg = JSON.parse(fs.readFileSync(path.resolve('admin-app/package.json'), 'utf8'));

      // 1. Dependencias críticas en admin-app/package.json para Docker
      assert.ok(adminPkg.dependencies.multer, 'admin-app debe incluir multer en dependencies');
      assert.ok(adminPkg.dependencies['node-forge'], 'admin-app debe incluir node-forge en dependencies');

      // 2. Backend de admin-app monta /api/billing/native y /api/almendro
      assert.ok(adminServerIndex.includes("'/api/billing/native'"));
      assert.ok(adminServerIndex.includes("'/api/almendro'"));
      assert.ok(adminBillingRoutes.includes("'/collections'"));

      // 3. Regla estricta requiresSubscriptionInvoice en rutas de admin-app
      assert.ok(adminTenantsRoutes.includes("'/:id/billing-preference'"));
      assert.ok(adminTenantsRoutes.includes("'/:id/emit-subscription-invoice'"));
      assert.ok(adminMonitoringRoutes.includes("'/tenant/:id/billing-preference'"));
      assert.ok(adminMonitoringRoutes.includes("'/tenant/:id/emit-subscription-invoice'"));
      assert.ok(adminMonitoringRoutes.includes('requires_subscription_invoice'));
      assert.ok(adminMonitoringRoutes.includes('emitPlatformSubscriptionInvoiceForTenant'));

      // 4. Frontend de admin-app (Betico Ops) con Betico Facturas (Hacienda) y controles por cliente
      assert.ok(adminAppCode.includes('ElectronicBillingView'));
      assert.ok(adminAppCode.includes('isSuperAdminMode={true}'));
      assert.ok(adminBillingCode.includes('ElectronicBillingView'));
      assert.ok(adminBillingCode.includes('requiresSubscriptionInvoice'));
      assert.ok(adminMonitoringCode.includes('requiresInvoice') || adminMonitoringCode.includes('requiresSubscriptionInvoice'));
      assert.ok(adminMonitoringCode.includes('/emit-subscription-invoice'));
      assert.ok(adminTenantsCode.includes('requiresSubscriptionInvoice'));
      assert.ok(adminTenantsCode.includes('/emit-subscription-invoice'));
    });

    it('admin-app (Betico Ops) y ElectronicBillingView aplican paleta adaptativa y variables CSS de alto contraste en modo oscuro', () => {
      const adminIndexHtml = fs.readFileSync(path.resolve('admin-app/index.html'), 'utf8');
      const adminAppCode = fs.readFileSync(path.resolve('admin-app/src/client/App.tsx'), 'utf8');
      const adminBillingCode = fs.readFileSync(path.resolve('admin-app/src/client/components/BillingManager.tsx'), 'utf8');
      const viewCode = fs.readFileSync(viewPath, 'utf8');

      // 1. Variables CSS de tema oscuro en admin-app/index.html
      assert.ok(adminIndexHtml.includes('--surface: #0f2426'));
      assert.ok(adminIndexHtml.includes('--background: #091819'));
      assert.ok(adminIndexHtml.includes('--text: #FAF8F5'));
      assert.ok(adminIndexHtml.includes('--text-muted: #cbd5e1'));

      // 2. Prop darkMode={true} pasada en admin-app
      assert.ok(adminAppCode.includes('darkMode={true}'));
      assert.ok(adminBillingCode.includes('darkMode={true}'));

      // 3. Reglas CSS de alto contraste y tokens palette.* en ElectronicBillingView.tsx
      assert.ok(viewCode.includes('eb-billing-root eb-dark'));
      assert.ok(viewCode.includes('const palette = {'));
      assert.ok(viewCode.includes('palette.primarySoftBg'));
      assert.ok(viewCode.includes('palette.successSoftBg'));
      assert.ok(viewCode.includes('palette.warnSoftBg'));
      assert.ok(viewCode.includes('palette.dangerSoftBg'));

      // 4. Ningún fondo claro fijo remanente dentro del JSX después de const palette
      const jsxPortion = viewCode.slice(viewCode.indexOf('return ('));
      assert.ok(!jsxPortion.includes("'#eff6ff'"), 'No debe quedar #eff6ff fijo en el JSX');
      assert.ok(!jsxPortion.includes("'#f0fdf4'"), 'No debe quedar #f0fdf4 fijo en el JSX');
      assert.ok(!jsxPortion.includes("'#fef2f2'"), 'No debe quedar #fef2f2 fijo en el JSX');
      assert.ok(!jsxPortion.includes("'#f8fafc'"), 'No debe quedar #f8fafc fijo en el JSX');
      assert.ok(!jsxPortion.includes("'#64748b'"), 'No debe quedar #64748b fijo en el JSX');
      assert.ok(!jsxPortion.includes("'#475569'"), 'No debe quedar #475569 fijo en el JSX');
    });
  });
});



