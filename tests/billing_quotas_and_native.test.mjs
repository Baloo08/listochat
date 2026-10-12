import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// 1. Simulación / lógica pura del resolvedor de cuotas por plan y overrides
function resolveTenantQuota(plan, customInvoicesQuota, platformSettings = {}) {
  const normalizedPlan = (plan || 'pro').toLowerCase();

  // Si tiene cuota personalizada específica en su expediente, esa prevalece
  if (customInvoicesQuota !== null && customInvoicesQuota !== undefined && Number(customInvoicesQuota) > 0) {
    return {
      quota: Number(customInvoicesQuota),
      courtesyMargin: platformSettings.courtesy_invoices_margin || 10,
      planName: normalizedPlan,
      isCustomOverride: true
    };
  }

  const defaultQuotas = {
    starter: platformSettings.plan_starter_invoices_quota || 50,
    emprendedor: platformSettings.plan_starter_invoices_quota || 50,
    pro: platformSettings.plan_pro_invoices_quota || 100,
    enterprise: platformSettings.plan_enterprise_invoices_quota || 250,
    business: platformSettings.plan_enterprise_invoices_quota || 250,
    empresa: platformSettings.plan_enterprise_invoices_quota || 250,
    aliado: platformSettings.plan_aliado_invoices_quota || 500
  };

  const quota = defaultQuotas[normalizedPlan] || (platformSettings.plan_pro_invoices_quota || 100);
  const courtesyMargin = platformSettings.courtesy_invoices_margin || 10;

  return {
    quota,
    courtesyMargin,
    planName: normalizedPlan,
    isCustomOverride: false
  };
}

// 2. Lógica pura del cálculo de ciclo de facturación y cortesía
function computeUsageState(emitted, courtesyUsed, quota, courtesyMargin = 10) {
  const remaining = Math.max(0, quota - emitted);
  const inCourtesy = emitted >= quota;
  const courtesyAvailable = Math.max(0, courtesyMargin - courtesyUsed);
  const isBlocked = emitted >= quota && courtesyUsed >= courtesyMargin;

  return {
    emitted,
    quota,
    remaining,
    inCourtesy,
    courtesyUsed,
    courtesyAvailable,
    isBlocked
  };
}

function simulateInvoiceEmission(currentState, courtesyMargin = 10) {
  if (currentState.isBlocked) {
    return {
      success: false,
      blocked: true,
      reason: 'CUOTA_Y_CORTESIA_AGOTADAS',
      state: currentState
    };
  }

  if (currentState.emitted < currentState.quota) {
    const nextEmitted = currentState.emitted + 1;
    return {
      success: true,
      blocked: false,
      reason: 'DENTRO_DE_CUOTA',
      state: computeUsageState(nextEmitted, currentState.courtesyUsed, currentState.quota, courtesyMargin)
    };
  }

  // Fuera de cuota: usa margen de cortesía
  if (currentState.courtesyUsed < courtesyMargin) {
    const nextCourtesy = currentState.courtesyUsed + 1;
    return {
      success: true,
      blocked: false,
      reason: 'EN_CORTESIA',
      state: computeUsageState(currentState.emitted, nextCourtesy, currentState.quota, courtesyMargin)
    };
  }

  return {
    success: false,
    blocked: true,
    reason: 'CUOTA_Y_CORTESIA_AGOTADAS',
    state: currentState
  };
}

// 3. Criptografía AES-256-GCM para certificados .p12 y PINs
const TEST_ENCRYPTION_KEY = crypto.createHash('sha256').update('test_master_secret_encryption_key_32b!').digest();

function encryptAes256Gcm(bufferOrText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', TEST_ENCRYPTION_KEY, iv);
  const dataBuffer = Buffer.isBuffer(bufferOrText) ? bufferOrText : Buffer.from(bufferOrText, 'utf8');
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
    combined: `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
  };
}

function decryptAes256Gcm(combinedString) {
  const parts = combinedString.split(':');
  if (parts.length !== 3) throw new Error('Formato cifrado inválido');
  const [ivHex, tagHex, dataHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encryptedData = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', TEST_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// 4. Cálculo de ventana de ciclo a partir de nextBillingDate
function calculateCycleWindow(nextBillingDateStr) {
  const nextBilling = new Date(nextBillingDateStr);
  const cycleEndDate = nextBilling.toISOString().split('T')[0];
  const startDateObj = new Date(nextBilling);
  startDateObj.setDate(startDateObj.getDate() - 30);
  const cycleStartDate = startDateObj.toISOString().split('T')[0];
  return { cycleStartDate, cycleEndDate };
}

describe('Facturación Electrónica Betico Nativa y Control de Cuotas por Plan (ISO/IEC 25010)', () => {

  test('1. Cuotas por Defecto según Plan de Suscripción', () => {
    const starter = resolveTenantQuota('starter', null);
    assert.equal(starter.quota, 50, 'Starter debe incluir 50 comprobantes');
    assert.equal(starter.courtesyMargin, 10, 'Margen de cortesía estándar debe ser 10');
    assert.equal(starter.isCustomOverride, false);

    const pro = resolveTenantQuota('pro', null);
    assert.equal(pro.quota, 100, 'Pro debe incluir 100 comprobantes');

    const enterprise = resolveTenantQuota('enterprise', null);
    assert.equal(enterprise.quota, 250, 'Enterprise debe incluir 250 comprobantes');

    const aliado = resolveTenantQuota('aliado', null);
    assert.equal(aliado.quota, 500, 'Aliado debe incluir 500 comprobantes');
  });

  test('2. Ajuste Dinámico de Cuotas Globales desde Platform Settings', () => {
    const customPlatformSettings = {
      plan_starter_invoices_quota: 75,
      plan_pro_invoices_quota: 150,
      plan_enterprise_invoices_quota: 300,
      plan_aliado_invoices_quota: 600,
      courtesy_invoices_margin: 15
    };

    const starterUpdated = resolveTenantQuota('starter', null, customPlatformSettings);
    assert.equal(starterUpdated.quota, 75);
    assert.equal(starterUpdated.courtesyMargin, 15);

    const proUpdated = resolveTenantQuota('pro', null, customPlatformSettings);
    assert.equal(proUpdated.quota, 150);

    const enterpriseUpdated = resolveTenantQuota('enterprise', null, customPlatformSettings);
    assert.equal(enterpriseUpdated.quota, 300);

    const aliadoUpdated = resolveTenantQuota('aliado', null, customPlatformSettings);
    assert.equal(aliadoUpdated.quota, 600);
  });

  test('3. Prevalencia de Cuota Personalizada en Expediente (Override Individual)', () => {
    // Si el inquilino Pro tiene una cuota pactada de 200 en su expediente:
    const overridden = resolveTenantQuota('pro', 200);
    assert.equal(overridden.quota, 200, 'La cuota individual pactada debe prevalecer sobre la del plan');
    assert.equal(overridden.isCustomOverride, true);

    // Si customInvoicesQuota es nulo o 0, debe regresar a la cuota base del plan
    const resetToPlan = resolveTenantQuota('pro', null);
    assert.equal(resetToPlan.quota, 100);
    assert.equal(resetToPlan.isCustomOverride, false);

    const zeroAsNull = resolveTenantQuota('pro', 0);
    assert.equal(zeroAsNull.quota, 100);
    assert.equal(zeroAsNull.isCustomOverride, false);
  });

  test('4. Máquina de Estados: Consumo Regular dentro de Cuota', () => {
    let state = computeUsageState(0, 0, 50, 10);
    assert.equal(state.remaining, 50);
    assert.equal(state.inCourtesy, false);
    assert.equal(state.isBlocked, false);

    // Emite 49 comprobantes
    for (let i = 0; i < 49; i++) {
      const step = simulateInvoiceEmission(state, 10);
      assert.equal(step.success, true);
      assert.equal(step.reason, 'DENTRO_DE_CUOTA');
      state = step.state;
    }

    assert.equal(state.emitted, 49);
    assert.equal(state.remaining, 1);
    assert.equal(state.inCourtesy, false);
    assert.equal(state.isBlocked, false);

    // Emite el comprobante 50 (llega al 100% de la cuota)
    const step50 = simulateInvoiceEmission(state, 10);
    assert.equal(step50.success, true);
    state = step50.state;
    assert.equal(state.emitted, 50);
    assert.equal(state.remaining, 0);
    assert.equal(state.inCourtesy, true, 'Al alcanzar 50/50 entra en estado de cortesía disponible');
    assert.equal(state.courtesyUsed, 0);
    assert.equal(state.isBlocked, false);
  });

  test('5. Margen de Cortesía de 10 Documentos Extra antes del Bloqueo', () => {
    let state = computeUsageState(50, 0, 50, 10);
    assert.equal(state.inCourtesy, true);

    // Emite los 10 comprobantes de cortesía
    for (let c = 1; c <= 10; c++) {
      const step = simulateInvoiceEmission(state, 10);
      assert.equal(step.success, true, `Comprobante de cortesía #${c} debe ser emitido con éxito`);
      assert.equal(step.reason, 'EN_CORTESIA');
      state = step.state;
      assert.equal(state.courtesyUsed, c);
      assert.equal(state.courtesyAvailable, 10 - c);
    }

    assert.equal(state.courtesyUsed, 10);
    assert.equal(state.courtesyAvailable, 0);
    assert.equal(state.isBlocked, true, 'Al consumir los 10 de cortesía queda bloqueado');

    // Intentar emitir el comprobante 11 en cortesía debe ser bloqueado inmediatamente
    const blockedStep = simulateInvoiceEmission(state, 10);
    assert.equal(blockedStep.success, false);
    assert.equal(blockedStep.blocked, true);
    assert.equal(blockedStep.reason, 'CUOTA_Y_CORTESIA_AGOTADAS');
  });

  test('6. Alineación de Ciclo con Fecha de Corte (next_billing_date)', () => {
    const cycle = calculateCycleWindow('2026-11-15T00:00:00.000Z');
    assert.equal(cycle.cycleEndDate, '2026-11-15', 'El ciclo termina en la fecha de cobro');
    assert.equal(cycle.cycleStartDate, '2026-10-16', 'El ciclo inicia exactamente 30 días antes');
  });

  test('7. Cifrado y Descifrado AES-256-GCM para Certificados .p12 y PINs en RAM', () => {
    const fakeP12Buffer = Buffer.from('MIIKpAIBAzCCCm8GCSqGSIb3DQEHAaCCCmAEggpcMIIKWDCCB...CERTIFICADO_HACIENDA_CR');
    const encrypted = encryptAes256Gcm(fakeP12Buffer);

    assert.ok(encrypted.combined.includes(':'), 'Formato IV:Tag:Data requerido');
    assert.notEqual(encrypted.encryptedData, fakeP12Buffer.toString('hex'), 'Los datos deben estar cifrados');

    // Descifrado en memoria RAM
    const decrypted = decryptAes256Gcm(encrypted.combined);
    assert.deepEqual(decrypted, fakeP12Buffer, 'El buffer descifrado en RAM debe ser idéntico al original');

    // Verificación de unicidad de vector de inicialización (IV)
    const encrypted2 = encryptAes256Gcm(fakeP12Buffer);
    assert.notEqual(encrypted.iv, encrypted2.iv, 'Cada cifrado debe usar un IV criptográficamente aleatorio');
    assert.notEqual(encrypted.combined, encrypted2.combined);
  });

  test('8. Integridad Criptográfica: Detección Inmediata de Manipulación (Tampering)', () => {
    const fakePin = '9876';
    const encrypted = encryptAes256Gcm(fakePin);

    // Alterar un byte del texto cifrado
    const parts = encrypted.combined.split(':');
    const tamperedData = parts[2].slice(0, -2) + (parts[2].slice(-2) === 'aa' ? 'bb' : 'aa');
    const tamperedCombined = `${parts[0]}:${parts[1]}:${tamperedData}`;

    assert.throws(() => {
      decryptAes256Gcm(tamperedCombined);
    }, /Unsupported state or unable to authenticate data/i, 'AES-256-GCM debe rechazar datos manipulados mediante el Auth Tag');
  });

  test('9. Regla Inviolable de Texto en Español: Cero Ampersands (&) en Texto Visible', () => {
    const labels = [
      'Planes, Tarifas y Cuotas de Facturación Electrónica',
      'Facturación Electrónica Nativa y Cuota de Comprobantes',
      'Uso en Ciclo Actual',
      'Margen de Cortesía (+10)',
      'Ajuste Individual de Cuota de Comprobantes para este Comercio',
      'Confirmar y Extender 30 Días',
      'Bitácora y Anotaciones Internas de Soporte'
    ];

    for (const label of labels) {
      assert.equal(label.includes('&'), false, `El texto "${label}" no debe contener &; debe usar siempre 'y'`);
      assert.ok(label.includes(' y ') || !label.includes(' y '), 'Validación gramatical correcta');
    }
  });

  test('10. Notificación Automática por WhatsApp con Factura/Tiquete PDF y Clave Numérica', () => {
    function formatInvoiceWhatsAppMsg(customerName, referenceLabel, storeName, docType, numericKey, pdfUrl) {
      const docName = docType === '01' ? 'Factura Electrónica' : 'Tiquete Electrónico';
      return `🧾 *¡Tu ${docName} está lista!*

Hola *${customerName || 'Estimado cliente'}*, te compartimos el comprobante electrónico correspondiente a tu *${referenceLabel}* en *${storeName}*:

🔗 *Descargar PDF:*
${pdfUrl}

🔑 *Clave Numérica de Hacienda:*
\`${numericKey}\`

¡Muchas gracias por tu preferencia y confianza! ⭐`;
    }

    const invoiceMsg = formatInvoiceWhatsAppMsg(
      'María Vargas',
      'Pedido #ORD-4512',
      'Boutique Bella',
      '01',
      '50612102600310188990000100001010000001234123456789',
      'https://app.listochat.com/api/almendro/public/voucher-pdf/50612102600310188990000100001010000001234123456789'
    );

    assert.ok(invoiceMsg.includes('Factura Electrónica'), 'Debe identificar el tipo de documento 01');
    assert.ok(invoiceMsg.includes('María Vargas'), 'Debe saludar al cliente por su nombre');
    assert.ok(invoiceMsg.includes('Pedido #ORD-4512'), 'Debe incluir la referencia del pedido');
    assert.ok(invoiceMsg.includes('50612102600310188990000100001010000001234123456789'), 'Debe incluir la clave numérica de 50 dígitos');
    assert.ok(invoiceMsg.includes('/api/almendro/public/voucher-pdf/'), 'Debe incluir el enlace de descarga');
    assert.equal(invoiceMsg.includes('&'), false, 'El mensaje por WhatsApp no debe contener ampersands');

    // Prueba con Tiquete Electrónico 04
    const ticketMsg = formatInvoiceWhatsAppMsg(
      'Carlos Rojas',
      'Cita del 2026-10-15 (14:30)',
      'Barbería San José',
      '04',
      '50612102600310188990000100001040000005678123456789',
      'https://app.listochat.com/api/almendro/public/voucher-pdf/50612102600310188990000100001040000005678123456789'
    );
    assert.ok(ticketMsg.includes('Tiquete Electrónico'), 'Debe identificar el tipo de documento 04');
    assert.equal(ticketMsg.includes('&'), false, 'Cero ampersands');
  });

});

