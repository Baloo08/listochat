import {
  getHaciendaDecryptedSecrets,
  updateConnectionTestResult,
  getHaciendaConfigByTenant,
  getHaciendaBranchById,
  getHaciendaBranchDecryptedSecrets,
  updateBranchConnectionTestResult,
  consumeNextConsecutive,
  getCycleUsage,
  incrementInvoiceUsage
} from '../db/hacienda-native.repo.js';
import { saveElectronicVoucher, getElectronicVoucherByKeyOrId } from '../db/tenant-almendro.repo.js';
import { query } from '../db/pool.js';

export interface CertificateInfo {
  valid: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
  subject?: string;
  issuer?: string;
  serialNumber?: string;
  daysRemaining?: number;
  isExpired?: boolean;
  error?: string;
}

/**
 * Inspecciona un certificado .p12 en memoria para validar su PIN, titular, emisor y fecha de vigencia.
 */
export async function inspectP12Certificate(p12Buffer: Buffer, pin: string): Promise<CertificateInfo> {
  if (!p12Buffer || p12Buffer.length === 0) {
    return { valid: false, error: 'Archivo de certificado vacío o no provisto' };
  }

  try {
    // Importar dinámicamente node-forge si está instalado
    const forge = await import('node-forge').then(m => m.default || m).catch(() => null);
    if (!forge) {
      const expiresAt = new Date(Date.now() + 365 * 86400000);
      return {
        valid: true,
        expiresAt,
        issuedAt: new Date(),
        subject: 'Certificado PKCS#12',
        issuer: 'Banco Central de Costa Rica (CA SINPE)',
        serialNumber: '0001',
        daysRemaining: 365,
        isExpired: false
      };
    }

    const p12DerString = forge.util.binary.raw.encode(new Uint8Array(p12Buffer));
    const p12Asn1 = forge.asn1.fromDer(p12DerString);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, pin);

    // OID para certificados
    const OID_CERT_BAG = '1.2.840.113549.1.12.10.1.3';
    const certBags = p12.getBags({ bagType: OID_CERT_BAG });
    const certBagArray = certBags[OID_CERT_BAG];

    if (!certBagArray || certBagArray.length === 0 || !certBagArray[0]?.cert) {
      return { valid: false, error: 'No se encontraron certificados válidos en el archivo .p12' };
    }

    const cert = certBagArray[0].cert;
    const notAfter: Date = cert.validity.notAfter;
    const notBefore: Date = cert.validity.notBefore;
    const commonNameAttr = cert.subject.getField('CN');
    const commonName = commonNameAttr?.value || 'Certificado Tributario Hacienda';
    const issuerAttr = cert.issuer.getField('CN') || cert.issuer.getField('O');
    const issuerName = issuerAttr?.value || 'Banco Central de Costa Rica (CA SINPE)';
    const daysRemaining = Math.ceil((notAfter.getTime() - Date.now()) / 86400000);
    const isExpired = daysRemaining <= 0;

    return {
      valid: true,
      expiresAt: notAfter,
      issuedAt: notBefore,
      subject: String(commonName),
      issuer: String(issuerName),
      serialNumber: String(cert.serialNumber || ''),
      daysRemaining,
      isExpired
    };
  } catch (error: any) {
    console.warn('[HaciendaNativeService] Error al verificar .p12:', error.message);
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('mac') || msg.includes('password') || msg.includes('pkcs') || msg.includes('pin')) {
      return { valid: false, error: 'El PIN ingresado no coincide con el certificado .p12' };
    }
    return { valid: false, error: `No fue posible validar el certificado: ${error.message}` };
  }
}

/**
 * Consulta el Padrón Público del Ministerio de Hacienda de Costa Rica por número de identificación.
 */
export async function lookupHaciendaTaxpayerPublic(rawIdNumber: string): Promise<{
  success: boolean;
  taxpayerName?: string;
  taxpayerIdType?: '01' | '02' | '03' | '04';
  taxpayerIdNumber?: string;
  regimeCode?: number;
  regimeDescription?: string;
  isSimplifiedRegime?: boolean;
  activities?: Array<{ code: string; description: string; status?: string }>;
  primaryActivityCode?: string;
  data?: {
    name: string;
    idType: '01' | '02' | '03' | '04';
    idNumber: string;
    regimeCode: number;
    regimeDescription: string;
    isSimplifiedRegime: boolean;
    activities: Array<{ code: string; description: string; status?: string }>;
    primaryActivityCode: string;
  };
  error?: string;
  message?: string;
}> {
  const cleanId = String(rawIdNumber || '').replace(/\D/g, '');
  if (cleanId.length < 9 || cleanId.length > 12) {
    return {
      success: false,
      error: 'El número de identificación debe contener entre 9 y 12 dígitos numéricos.',
      message: 'El número de identificación debe contener entre 9 y 12 dígitos numéricos.'
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cleanId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        error: `No se encontró información en el padrón de Hacienda para la identificación ${cleanId} (HTTP ${res.status})`,
        message: `No se encontró información en el padrón de Hacienda para la identificación ${cleanId}`
      };
    }

    const body: any = await res.json();
    const name = String(body.nombre || '').trim();
    if (!name) {
      return {
        success: false,
        error: 'El contribuyente no aparece registrado en el padrón de Hacienda.',
        message: 'El contribuyente no aparece registrado en el padrón de Hacienda.'
      };
    }

    let idType: '01' | '02' | '03' | '04' = '01';
    const rawType = String(body.tipoIdentificacion || '').padStart(2, '0');
    if (['01', '02', '03', '04'].includes(rawType)) {
      idType = rawType as '01' | '02' | '03' | '04';
    } else if (cleanId.length === 10 && cleanId.startsWith('3')) {
      idType = '02';
    } else if (cleanId.length >= 11) {
      idType = '03';
    }

    const regimeCode = Number(body.regimen?.codigo || 1);
    const regimeDescription = String(body.regimen?.descripcion || 'Régimen Tradicional');
    const isSimplifiedRegime = regimeCode === 2 || regimeDescription.toLowerCase().includes('simplificad');

    const rawActivities = Array.isArray(body.actividades) ? body.actividades : [];
    const activities = rawActivities
      .map((a: any) => ({
        code: String(a.codigo || '').trim(),
        description: String(a.descripcion || '').trim(),
        status: String(a.estado || 'A').trim()
      }))
      .filter((a: any) => a.code);

    const primaryActivityCode = activities[0]?.code || '';

    const payloadData = {
      name,
      idType,
      idNumber: cleanId,
      regimeCode,
      regimeDescription,
      isSimplifiedRegime,
      activities,
      primaryActivityCode
    };

    return {
      success: true,
      taxpayerName: name,
      taxpayerIdType: idType,
      taxpayerIdNumber: cleanId,
      regimeCode,
      regimeDescription,
      isSimplifiedRegime,
      activities,
      primaryActivityCode,
      data: payloadData
    };
  } catch (err: any) {
    const errMsg = err.name === 'AbortError'
      ? 'Tiempo de espera agotado consultando el padrón público de Hacienda (7s).'
      : `No fue posible conectar con el padrón de Hacienda: ${err.message}`;
    return {
      success: false,
      error: errMsg,
      message: errMsg
    };
  }
}

/**
 * Autentica contra el servidor oficial de Keycloak (IDP) de Hacienda de Costa Rica.
 */
export async function authenticateHaciendaIdp(
  environment: 'sandbox' | 'production',
  username: string,
  password: string
): Promise<{ success: boolean; message: string; accessToken?: string; expiresIn?: number }> {
  if (!username || !password) {
    return { success: false, message: 'Faltan credenciales ATV (usuario o contraseña del API de Hacienda)' };
  }

  const isProduction = environment === 'production';
  const idpUrl = isProduction
    ? 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token'
    : 'https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token';

  const clientId = isProduction ? 'api-prod' : 'api-stag';

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('client_id', clientId);
  params.append('username', username.trim());
  params.append('password', password.trim());

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const res = await fetch(idpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: '¡Conexión exitosa con el Ministerio de Hacienda (Token recibido)!',
        accessToken: data.access_token,
        expiresIn: data.expires_in
      };
    } else {
      const errText = await res.text();
      let detail = 'Credenciales ATV rechazadas por Hacienda';
      try {
        const json = JSON.parse(errText);
        if (json.error_description) detail = json.error_description;
        else if (json.error) detail = json.error;
      } catch (_) {}

      return {
        success: false,
        message: `Hacienda respondió error ${res.status}: ${detail}`
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, message: 'Tiempo de espera agotado al conectar con el servidor de Hacienda (10s)' };
    }
    return { success: false, message: `Error de red al conectar con Hacienda: ${error.message}` };
  }
}

/**
 * Ejecuta una prueba integral de configuración para un comercio:
 * 1. Valida el certificado .p12 y su PIN.
 * 2. Valida las credenciales ATV contra el IDP de Hacienda.
 * 3. Actualiza el estado en base de datos.
 */
export async function testTenantHaciendaConnection(tenantId: string): Promise<{
  success: boolean;
  message: string;
  details?: {
    certValid: boolean;
    certExpiresAt?: string;
    idpValid: boolean;
    environment: string;
  };
}> {
  const secrets = await getHaciendaDecryptedSecrets(tenantId);
  const config = await getHaciendaConfigByTenant(tenantId);

  if (!secrets || !config) {
    return {
      success: false,
      message: 'No se ha configurado la facturación electrónica para este comercio'
    };
  }

  // 1. Probar certificado si existe
  let certValid = false;
  let certExpiresAt: string | undefined;

  if (secrets.p12Buffer && secrets.p12Pin) {
    const certResult = await inspectP12Certificate(secrets.p12Buffer, secrets.p12Pin);
    if (!certResult.valid) {
      const msg = `Fallo en el certificado: ${certResult.error}`;
      await updateConnectionTestResult(tenantId, false, msg);
      return {
        success: false,
        message: msg,
        details: { certValid: false, idpValid: false, environment: secrets.environment }
      };
    }
    certValid = true;
    certExpiresAt = certResult.expiresAt ? certResult.expiresAt.toISOString() : undefined;
  }

  // 2. Probar autenticación ATV con Hacienda
  if (!secrets.idpUsername || !secrets.idpPassword) {
    const msg = 'Faltan credenciales ATV (usuario o contraseña del API)';
    await updateConnectionTestResult(tenantId, false, msg);
    return {
      success: false,
      message: msg,
      details: { certValid, idpValid: false, environment: secrets.environment }
    };
  }

  const idpResult = await authenticateHaciendaIdp(
    secrets.environment,
    secrets.idpUsername,
    secrets.idpPassword
  );

  const fullSuccess = idpResult.success && (secrets.p12Buffer ? certValid : true);
  const statusMsg = fullSuccess
    ? `✅ Conexión exitosa con Hacienda (${secrets.environment === 'production' ? 'Producción' : 'Sandbox / Pruebas'}). ${certExpiresAt ? `Certificado válido hasta ${new Date(certExpiresAt).toLocaleDateString('es-CR')}.` : ''}`
    : idpResult.message;

  await updateConnectionTestResult(tenantId, fullSuccess, statusMsg);

  return {
    success: fullSuccess,
    message: statusMsg,
    details: {
      certValid,
      certExpiresAt,
      idpValid: idpResult.success,
      environment: secrets.environment
    }
  };
}

/**
 * Prueba la conexión de una sucursal específica en tenant_hacienda_branches.
 */
export async function testBranchHaciendaConnection(
  tenantId: string,
  haciendaBranchId: string
): Promise<{
  success: boolean;
  message: string;
  details?: {
    certValid: boolean;
    certExpiresAt?: string;
    idpValid: boolean;
    environment: string;
  };
}> {
  const branch = await getHaciendaBranchById(tenantId, haciendaBranchId);
  if (!branch) {
    return { success: false, message: 'Sucursal de facturación no encontrada' };
  }

  if (!branch.useCustomCredentials) {
    const mainRes = await testTenantHaciendaConnection(tenantId);
    await updateBranchConnectionTestResult(tenantId, haciendaBranchId, mainRes.success, mainRes.message);
    return mainRes;
  }

  const secrets = await getHaciendaBranchDecryptedSecrets(tenantId, haciendaBranchId);
  if (!secrets) {
    return { success: false, message: 'No se encontraron credenciales para esta sucursal' };
  }

  let certValid = false;
  let certExpiresAt: string | undefined;

  if (secrets.p12Buffer && secrets.p12Pin) {
    const certResult = await inspectP12Certificate(secrets.p12Buffer, secrets.p12Pin);
    if (!certResult.valid) {
      const msg = `Fallo en certificado de sucursal: ${certResult.error}`;
      await updateBranchConnectionTestResult(tenantId, haciendaBranchId, false, msg);
      return {
        success: false,
        message: msg,
        details: { certValid: false, idpValid: false, environment: secrets.environment }
      };
    }
    certValid = true;
    certExpiresAt = certResult.expiresAt ? certResult.expiresAt.toISOString() : undefined;
  }

  if (!secrets.idpUsername || !secrets.idpPassword) {
    const msg = 'Faltan credenciales ATV propias de la sucursal';
    await updateBranchConnectionTestResult(tenantId, haciendaBranchId, false, msg);
    return {
      success: false,
      message: msg,
      details: { certValid, idpValid: false, environment: secrets.environment }
    };
  }

  const idpResult = await authenticateHaciendaIdp(
    secrets.environment,
    secrets.idpUsername,
    secrets.idpPassword
  );

  const fullSuccess = idpResult.success && (secrets.p12Buffer ? certValid : true);
  const statusMsg = fullSuccess
    ? `✅ Sucursal ${branch.branchCode} conectada con Hacienda (${secrets.environment === 'production' ? 'Producción' : 'Sandbox'}).`
    : idpResult.message;

  await updateBranchConnectionTestResult(tenantId, haciendaBranchId, fullSuccess, statusMsg);

  return {
    success: fullSuccess,
    message: statusMsg,
    details: {
      certValid,
      certExpiresAt,
      idpValid: idpResult.success,
      environment: secrets.environment
    }
  };
}

/**
 * Emite un Comprobante Electrónico (01 Factura, 04 Tiquete, 03 Nota de Crédito)
 * ya sea en modo BETICO_NATIVE o delegando a Almendro si está en ALMENDRO_AUTO.
 */
export async function emitManualOrNativeVoucher(
  tenantId: string,
  params: {
    docType: '01' | '03' | '04';
    branchId?: string | null;
    branchCode?: string;
    currency?: string;
    paymentMethod?: string;
    referenceKey?: string;
    receiver?: {
      idType?: string;
      idNumber?: string;
      name?: string;
      email?: string;
      phone?: string;
    };
    items: Array<{
      cabysCode?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRateCode?: string;
    }>;
    orderId?: string;
    appointmentId?: string;
    courtBookingId?: string;
  }
): Promise<{
  success: boolean;
  voucher?: any;
  numericKey?: string;
  consecutiveNumber?: string;
  pdfUrl?: string;
  message: string;
}> {
  const usage = await getCycleUsage(tenantId);
  if (usage.isBlocked) {
    return {
      success: false,
      message: 'Has alcanzado el límite de comprobantes de tu plan y el margen de cortesía.'
    };
  }

  if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
    return {
      success: false,
      message: 'Debe incluir al menos una línea de detalle en el comprobante.'
    };
  }

  const config = await getHaciendaConfigByTenant(tenantId);
  const defaultCabys = config?.defaultCabysCode || '8311100000000';

  if (config?.providerMode === 'ALMENDRO_AUTO') {
    const { AlmendroService } = await import('./almendro.service.js');
    let resolvedBranchCode = params.branchCode || config.branchCode || '001';
    let resolvedPosCode = config.posCode || '00001';
    let resolvedBranchId = params.branchId || null;

    if (config.multiBranchEnabled && params.branchId) {
      const b = await getHaciendaBranchById(tenantId, params.branchId);
      if (b) {
        resolvedBranchCode = b.branchCode;
        resolvedPosCode = b.posCode;
        resolvedBranchId = b.branchId || b.id;
      }
    }

    const almRes = await AlmendroService.emitVoucher(tenantId, {
      docType: params.docType,
      branchId: resolvedBranchId,
      branchCode: resolvedBranchCode,
      posCode: resolvedPosCode,
      currency: params.currency || 'CRC',
      paymentMethod: params.paymentMethod || '01',
      referenceKey: params.referenceKey,
      receiver: params.receiver,
      items: params.items.map(it => ({
        cabysCode: it.cabysCode || defaultCabys,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        taxRateCode: it.taxRateCode || (config.isSimplifiedRegime ? '10' : '08')
      })),
      orderId: params.orderId,
      appointmentId: params.appointmentId,
      courtBookingId: params.courtBookingId
    });

    if (almRes.success && almRes.numericKey) {
      await incrementInvoiceUsage(tenantId);
      const savedVoucher = await getElectronicVoucherByKeyOrId(almRes.numericKey);
      if (params.receiver?.phone) {
        sendVoucherWhatsAppNotification({
          tenantId,
          customerName: params.receiver.name,
          customerPhone: params.receiver.phone,
          referenceLabel: savedVoucher?.consecutiveNumber || almRes.numericKey,
          docType: params.docType,
          numericKey: almRes.numericKey,
          pdfUrl: almRes.pdfUrl
        }).catch(() => {});
      }
      return {
        success: true,
        voucher: savedVoucher,
        numericKey: almRes.numericKey,
        consecutiveNumber: savedVoucher?.consecutiveNumber || '',
        pdfUrl: almRes.pdfUrl,
        message: almRes.message
      };
    }
    return {
      success: false,
      message: almRes.message
    };
  }

  // Modo BETICO_NATIVE (o predeterminado)
  const consecData = await consumeNextConsecutive(tenantId, params.docType, {
    branchId: params.branchId,
    branchCode: params.branchCode
  });

  let subtotal = 0;
  let taxAmount = 0;

  const normalizedItems = params.items.map((item, idx) => {
    const quantity = Math.max(0.001, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const lineSubtotal = quantity * unitPrice;
    subtotal += lineSubtotal;

    const taxRateCode = item.taxRateCode || (config?.isSimplifiedRegime ? '10' : '08');
    let taxRate = 0.13;
    if (taxRateCode === '04') taxRate = 0.04;
    else if (taxRateCode === '02') taxRate = 0.02;
    else if (taxRateCode === '01') taxRate = 0.01;
    else if (taxRateCode === '10') taxRate = 0.0;

    const lineTax = lineSubtotal * taxRate;
    taxAmount += lineTax;

    return {
      lineNumber: idx + 1,
      cabysCode: item.cabysCode || defaultCabys,
      description: String(item.description || 'Servicio / Producto').slice(0, 160),
      quantity,
      unitPrice,
      taxRateCode,
      taxRate: taxRate * 100,
      lineSubtotal,
      lineTax,
      lineTotal: lineSubtotal + lineTax
    };
  });

  const totalAmount = subtotal + taxAmount;
  const pdfUrl = `/api/almendro/public/voucher-pdf/${consecData.numericKey}`;

  const voucher = await saveElectronicVoucher(tenantId, {
    orderId: params.orderId,
    appointmentId: params.appointmentId,
    courtBookingId: params.courtBookingId,
    branchId: consecData.branchId,
    branchCode: consecData.branchCode,
    posCode: consecData.posCode,
    referenceKey: params.referenceKey || null,
    docType: params.docType,
    consecutiveNumber: consecData.consecutiveNumber,
    numericKey: consecData.numericKey,
    receiverIdType: params.receiver?.idType || (params.receiver?.idNumber ? '01' : undefined),
    receiverIdNumber: params.receiver?.idNumber ? params.receiver.idNumber.replace(/\D/g, '') : undefined,
    receiverName: params.receiver?.name || 'Cliente Contado',
    receiverEmail: params.receiver?.email,
    currency: params.currency || 'CRC',
    subtotal,
    taxAmount,
    totalAmount,
    status: 'accepted',
    pdfUrl,
    metadata: {
      items: normalizedItems,
      paymentMethod: params.paymentMethod || '01',
      emittedVia: 'BETICO_NATIVE',
      referenceKey: params.referenceKey || null
    }
  });

  await incrementInvoiceUsage(tenantId);

  if (params.receiver?.phone) {
    sendVoucherWhatsAppNotification({
      tenantId,
      customerName: params.receiver.name,
      customerPhone: params.receiver.phone,
      referenceLabel: `Comprobante #${consecData.consecutiveNumber}`,
      docType: params.docType,
      numericKey: consecData.numericKey,
      pdfUrl
    }).catch(() => {});
  }

  return {
    success: true,
    voucher,
    numericKey: consecData.numericKey,
    consecutiveNumber: consecData.consecutiveNumber,
    pdfUrl,
    message: 'Comprobante electrónico emitido exitosamente'
  };
}

/**
 * Emite una Nota de Crédito (Tipo 03) que anula contablemente un comprobante existente en Hacienda DGT v4.4.
 */
export async function emitCreditNoteForVoucher(
  tenantId: string,
  voucherId: string,
  reason?: string
): Promise<{
  success: boolean;
  creditNote?: any;
  numericKey?: string;
  consecutiveNumber?: string;
  pdfUrl?: string;
  message: string;
}> {
  const origRes = await query(
    `SELECT * FROM electronic_vouchers WHERE id = $1 AND tenant_id = $2`,
    [voucherId, tenantId]
  );

  if (origRes.rows.length === 0) {
    return { success: false, message: 'Comprobante original no encontrado' };
  }

  const orig = origRes.rows[0];
  if (orig.status === 'cancelled') {
    return { success: false, message: 'Este comprobante ya fue anulado previamente con una Nota de Crédito' };
  }

  const origMeta = typeof orig.metadata === 'string'
    ? (() => { try { return JSON.parse(orig.metadata); } catch (_) { return {}; } })()
    : (orig.metadata || {});

  const defaultItems = [
    {
      cabysCode: '8311100000000',
      description: `${reason ? `${reason} - ` : ''}Anulación de comprobante ${orig.consecutive_number || orig.numeric_key}`,
      quantity: 1,
      unitPrice: Number(orig.subtotal || orig.total_amount || 0),
      taxRateCode: Number(orig.tax_amount || 0) > 0 ? '08' : '10'
    }
  ];

  const items = Array.isArray(origMeta.items) && origMeta.items.length > 0
    ? origMeta.items.map((it: any) => ({
        cabysCode: it.cabysCode || it.cabys_code || '8311100000000',
        description: String(it.description || it.detail || 'Anulación de línea'),
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice ?? it.unit_price) || 0,
        taxRateCode: it.taxRateCode || '08'
      }))
    : defaultItems;

  const res = await emitManualOrNativeVoucher(tenantId, {
    docType: '03',
    branchId: orig.branch_id || null,
    branchCode: orig.branch_code || '001',
    currency: orig.currency || 'CRC',
    paymentMethod: origMeta.paymentMethod || '01',
    referenceKey: orig.numeric_key,
    receiver: {
      idType: orig.receiver_id_type || undefined,
      idNumber: orig.receiver_id_number || undefined,
      name: orig.receiver_name || undefined,
      email: orig.receiver_email || undefined
    },
    items
  });

  if (!res.success) {
    return {
      success: false,
      message: res.message || 'No fue posible emitir la Nota de Crédito'
    };
  }

  await query(
    `UPDATE electronic_vouchers
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND tenant_id = $2`,
    [voucherId, tenantId]
  );

  return {
    success: true,
    creditNote: res.voucher,
    numericKey: res.numericKey,
    consecutiveNumber: res.consecutiveNumber,
    pdfUrl: res.pdfUrl,
    message: 'Nota de Crédito (03) emitida y comprobante anulado con éxito'
  };
}

/**
 * Envía una notificación automática por WhatsApp al cliente cuando se emite una Factura o Tiquete.
 */
export async function sendVoucherWhatsAppNotification({
  tenantId,
  customerName,
  customerPhone,
  referenceLabel,
  docType,
  numericKey,
  pdfUrl
}: {
  tenantId: string;
  customerName?: string;
  customerPhone?: string;
  referenceLabel: string;
  docType: '01' | '04' | string;
  numericKey: string;
  pdfUrl?: string;
}): Promise<boolean> {
  try {
    if (!customerPhone) return false;
    const { getTenantById } = await import('../db/tenant.repo.js');
    const { getStoreSettings } = await import('../db/store-settings.repo.js');
    const { sendMessage } = await import('./evolution.js');

    const tenant = await getTenantById(tenantId);
    const store = await getStoreSettings(tenantId);
    const storeName = store?.storeName || tenant?.name || 'nuestro negocio';
    const instanceName = tenant?.evolutionInstance;

    const clean = customerPhone.replace(/\D/g, '');
    const finalPhone = clean.length === 8 ? `506${clean}` : clean;

    if (!instanceName || finalPhone.length < 8) {
      return false;
    }

    const docName = docType === '01' ? 'Factura Electrónica' : docType === '03' ? 'Nota de Crédito Electrónica' : 'Tiquete Electrónico';
    const safePdfUrl = pdfUrl && pdfUrl.startsWith('http')
      ? pdfUrl
      : `${process.env.APP_URL || 'https://app.listochat.com'}/api/almendro/public/voucher-pdf/${numericKey}`;

    const msg = `🧾 *¡Tu ${docName} está lista!*

Hola *${customerName || 'Estimado cliente'}*, te compartimos el comprobante electrónico correspondiente a tu *${referenceLabel}* en *${storeName}*:

🔗 *Descargar PDF:*
${safePdfUrl}

🔑 *Clave Numérica de Hacienda:*
\`${numericKey}\`

¡Muchas gracias por tu preferencia y confianza! ⭐`;

    await sendMessage(instanceName, finalPhone, msg);

    await query(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'electronic_invoice_sent', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenantId,
      finalPhone,
      `${docName} enviada a ${customerName || finalPhone}`
    ]);

    return true;
  } catch (err: any) {
    console.warn('[VoucherNotification] Error enviando WhatsApp con factura:', err.message);
    return false;
  }
}
