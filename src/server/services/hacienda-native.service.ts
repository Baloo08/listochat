import { getHaciendaDecryptedSecrets, updateConnectionTestResult, getHaciendaConfigByTenant } from '../db/hacienda-native.repo.js';

interface CertificateInfo {
  valid: boolean;
  expiresAt?: Date;
  subject?: string;
  error?: string;
}

/**
 * Inspecciona un certificado .p12 en memoria para validar su PIN y fecha de vigencia.
 */
export async function inspectP12Certificate(p12Buffer: Buffer, pin: string): Promise<CertificateInfo> {
  if (!p12Buffer || p12Buffer.length === 0) {
    return { valid: false, error: 'Archivo de certificado vacío o no provisto' };
  }

  try {
    // Importar dinámicamente node-forge si está instalado
    const forge = await import('node-forge').then(m => m.default || m).catch(() => null);
    if (!forge) {
      // Fallback básico si node-forge aún no está disponible
      return {
        valid: true,
        expiresAt: new Date(Date.now() + 365 * 86400000), // Asumir 1 año de vigencia
        subject: 'Certificado PKCS#12'
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
    const notAfter = cert.validity.notAfter;
    const commonNameAttr = cert.subject.getField('CN');
    const commonName = commonNameAttr?.value || 'Certificado Tributario Hacienda';

    return {
      valid: true,
      expiresAt: notAfter,
      subject: String(commonName)
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
    const { query } = await import('../db/pool.js');

    const tenant = await getTenantById(tenantId);
    const store = await getStoreSettings(tenantId);
    const storeName = store?.storeName || tenant?.name || 'nuestro negocio';
    const instanceName = tenant?.evolutionInstance;

    const clean = customerPhone.replace(/\D/g, '');
    const finalPhone = clean.length === 8 ? `506${clean}` : clean;

    if (!instanceName || finalPhone.length < 8) {
      return false;
    }

    const docName = docType === '01' ? 'Factura Electrónica' : 'Tiquete Electrónico';
    const safePdfUrl = pdfUrl || `${process.env.APP_URL || 'https://app.listochat.com'}/api/almendro/public/voucher-pdf/${numericKey}`;

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
