import net from 'node:net';
import tls from 'node:tls';
import { query } from '../db/pool.js';
import { getHaciendaConfigByTenant, getHaciendaDecryptedSecrets } from '../db/hacienda-native.repo.js';
import { getElectronicVoucherByKeyOrId } from '../db/tenant-almendro.repo.js';
import { env } from '../config/env.js';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface SendEmailResult {
  success: boolean;
  transport: 'resend_tenant' | 'smtp_tenant' | 'resend_platform' | 'smtp_platform' | 'pending_config';
  recipient: string;
  message: string;
}

function escapeXml(val: any): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera el archivo XML oficial del comprobante electrónico conforme al esquema DGT v4.4 de Hacienda Costa Rica.
 */
export function buildOfficialHaciendaXmlBuffer(voucher: any, haciendaConfig: any): Buffer {
  const docType = voucher.docType || '04';
  const rootTag = docType === '01'
    ? 'FacturaElectronica'
    : docType === '03'
      ? 'NotaCreditoElectronica'
      : 'TiqueteElectronico';

  const schemaName = docType === '01'
    ? 'facturaElectronica'
    : docType === '03'
      ? 'notaCreditoElectronica'
      : 'tiqueteElectronico';

  const xmlns = `https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.4/${schemaName}`;
  const numericKey = String(voucher.numericKey || '').padStart(50, '0').slice(0, 50);
  const consecutive = String(voucher.consecutiveNumber || '00100001040000000001').padStart(20, '0').slice(0, 20);
  const activityCode = String(haciendaConfig?.economicActivityCode || '831110').replace(/\D/g, '').padStart(6, '0').slice(0, 6);
  const issuedAt = voucher.createdAt ? new Date(voucher.createdAt).toISOString() : new Date().toISOString();

  const issuerName = haciendaConfig?.taxpayerName || haciendaConfig?.commercialName || 'Emisor Autorizado CR';
  const issuerCommercial = haciendaConfig?.commercialName || issuerName;
  const issuerIdType = haciendaConfig?.taxpayerIdType || '01';
  const issuerIdNumber = String(haciendaConfig?.taxpayerIdNumber || '000000000').replace(/\D/g, '');
  const issuerEmail = haciendaConfig?.taxpayerEmail || 'facturacion@betico.cr';

  const province = String(haciendaConfig?.province || '1').slice(0, 1);
  const canton = String(haciendaConfig?.canton || '01').padStart(2, '0').slice(0, 2);
  const district = String(haciendaConfig?.district || '01').padStart(2, '0').slice(0, 2);
  const neighborhood = String(haciendaConfig?.neighborhood || '01').padStart(2, '0').slice(0, 2);
  const addressDetail = haciendaConfig?.addressDetail || 'Costa Rica';

  const metadata = (voucher.metadata || {}) as any;
  const rawItems = Array.isArray(metadata.items) && metadata.items.length > 0
    ? metadata.items
    : [
        {
          lineNumber: 1,
          cabysCode: haciendaConfig?.defaultCabysCode || '8311100000000',
          description: 'Servicios o productos facturados',
          quantity: 1,
          unitPrice: Number(voucher.subtotal || voucher.totalAmount || 0),
          taxRateCode: Number(voucher.taxAmount || 0) > 0 ? '08' : '10',
          taxRate: Number(voucher.taxAmount || 0) > 0 ? 13 : 0,
          lineSubtotal: Number(voucher.subtotal || voucher.totalAmount || 0),
          lineTax: Number(voucher.taxAmount || 0),
          lineTotal: Number(voucher.totalAmount || 0)
        }
      ];

  let linesXml = '';
  rawItems.forEach((it: any, idx: number) => {
    const lineNum = idx + 1;
    const cabys = String(it.cabysCode || it.cabys_code || '8311100000000').replace(/\D/g, '').padStart(13, '0').slice(0, 13);
    const qty = Number(it.quantity || 1).toFixed(3);
    const unitPrice = Number(it.unitPrice ?? it.unit_price ?? 0).toFixed(5);
    const sub = Number(it.lineSubtotal ?? (Number(it.quantity || 1) * Number(it.unitPrice || 0))).toFixed(5);
    const taxCode = String(it.taxRateCode || '08');
    const taxRateNum = it.taxRate !== undefined ? Number(it.taxRate) : (taxCode === '10' ? 0 : 13);
    const taxAmt = Number(it.lineTax ?? (Number(sub) * (taxRateNum / 100))).toFixed(5);
    const totalLine = Number(it.lineTotal ?? (Number(sub) + Number(taxAmt))).toFixed(5);
    const desc = escapeXml(String(it.description || it.detail || 'Servicio').slice(0, 160));

    linesXml += `
    <LineaDetalle>
      <NumeroLinea>${lineNum}</NumeroLinea>
      <CodigoCabys>${cabys}</CodigoCabys>
      <Cantidad>${qty}</Cantidad>
      <UnidadMedida>Unid</UnidadMedida>
      <Detalle>${desc}</Detalle>
      <PrecioUnitario>${unitPrice}</PrecioUnitario>
      <MontoTotal>${sub}</MontoTotal>
      <SubTotal>${sub}</SubTotal>
      <BaseImponible>${sub}</BaseImponible>
      <Impuesto>
        <Codigo>01</Codigo>
        <CodigoTarifaIVA>${escapeXml(taxCode)}</CodigoTarifaIVA>
        <Tarifa>${taxRateNum.toFixed(2)}</Tarifa>
        <Monto>${taxAmt}</Monto>
      </Impuesto>
      <ImpuestoNeto>${taxAmt}</ImpuestoNeto>
      <MontoTotalLinea>${totalLine}</MontoTotalLinea>
    </LineaDetalle>`;
  });

  const receiverBlock = (voucher.receiverName || voucher.receiverIdNumber || voucher.receiverEmail)
    ? `
  <Receptor>
    <Nombre>${escapeXml(voucher.receiverName || 'Cliente Contado')}</Nombre>${
      voucher.receiverIdNumber
        ? `
    <Identificacion>
      <Tipo>${escapeXml(voucher.receiverIdType || '01')}</Tipo>
      <Numero>${escapeXml(String(voucher.receiverIdNumber).replace(/\D/g, ''))}</Numero>
    </Identificacion>`
        : ''
    }${
      voucher.receiverEmail
        ? `
    <CorreoElectronico>${escapeXml(voucher.receiverEmail)}</CorreoElectronico>`
        : ''
    }
  </Receptor>`
    : '';

  const refKey = voucher.referenceKey || metadata.referenceKey;
  const referenceBlock = refKey
    ? `
  <InformacionReferencia>
    <TipoDocIR>01</TipoDocIR>
    <Numero>${escapeXml(refKey)}</Numero>
    <FechaEmisionIR>${escapeXml(issuedAt)}</FechaEmisionIR>
    <Codigo>01</Codigo>
    <Razon>Anulacion de comprobante de referencia</Razon>
  </InformacionReferencia>`
    : '';

  const subtotalVal = Number(voucher.subtotal || 0).toFixed(5);
  const taxVal = Number(voucher.taxAmount || 0).toFixed(5);
  const totalVal = Number(voucher.totalAmount || 0).toFixed(5);
  const currency = escapeXml(voucher.currency || 'CRC');
  const paymentMethod = escapeXml(metadata.paymentMethod || '01');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${rootTag} xmlns="${xmlns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Clave>${escapeXml(numericKey)}</Clave>
  <ProveedorSistemas>${escapeXml(issuerIdNumber || '3101000000')}</ProveedorSistemas>
  <CodigoActividadEmisor>${escapeXml(activityCode)}</CodigoActividadEmisor>
  <NumeroConsecutivo>${escapeXml(consecutive)}</NumeroConsecutivo>
  <FechaEmision>${escapeXml(issuedAt)}</FechaEmision>
  <Emisor>
    <Nombre>${escapeXml(issuerName)}</Nombre>
    <Identificacion>
      <Tipo>${escapeXml(issuerIdType)}</Tipo>
      <Numero>${escapeXml(issuerIdNumber)}</Numero>
    </Identificacion>
    <NombreComercial>${escapeXml(issuerCommercial)}</NombreComercial>
    <Ubicacion>
      <Provincia>${escapeXml(province)}</Provincia>
      <Canton>${escapeXml(canton)}</Canton>
      <Distrito>${escapeXml(district)}</Distrito>
      <Barrio>${escapeXml(neighborhood)}</Barrio>
      <OtrasSenas>${escapeXml(addressDetail)}</OtrasSenas>
    </Ubicacion>
    <CorreoElectronico>${escapeXml(issuerEmail)}</CorreoElectronico>
  </Emisor>${receiverBlock}
  <CondicionVenta>01</CondicionVenta>
  <MedioPago>
    <TipoMedioPago>${paymentMethod}</TipoMedioPago>
  </MedioPago>
  <DetalleServicio>${linesXml}
  </DetalleServicio>
  <ResumenFactura>
    <CodigoTipoMoneda>
      <CodigoMoneda>${currency}</CodigoMoneda>
      <TipoCambio>1.00000</TipoCambio>
    </CodigoTipoMoneda>
    <TotalVenta>${subtotalVal}</TotalVenta>
    <TotalVentaNeta>${subtotalVal}</TotalVentaNeta>
    <TotalImpuesto>${taxVal}</TotalImpuesto>
    <TotalComprobante>${totalVal}</TotalComprobante>
  </ResumenFactura>${referenceBlock}
</${rootTag}>`;

  return Buffer.from(xml, 'utf8');
}

/**
 * Construye el cuerpo HTML del correo electrónico con el resumen fiscal y enlaces de descarga.
 */
export function buildVoucherEmailHtml(params: {
  voucher: any;
  haciendaConfig: any;
  storeName: string;
  pdfPublicUrl: string;
  xmlPublicUrl: string;
}): string {
  const { voucher, haciendaConfig, storeName, pdfPublicUrl, xmlPublicUrl } = params;
  const docLabel = voucher.docType === '01'
    ? 'Factura Electrónica'
    : voucher.docType === '03'
      ? 'Nota de Crédito Electrónica'
      : 'Tiquete Electrónico';

  const issuerName = haciendaConfig?.taxpayerName || storeName;
  const issuerId = haciendaConfig?.taxpayerIdNumber || 'N/A';
  const branchCode = voucher.branchCode || haciendaConfig?.branchCode || '001';
  const posCode = voucher.posCode || haciendaConfig?.posCode || '00001';
  const consecutive = voucher.consecutiveNumber || '00100001040000000001';
  const numericKey = voucher.numericKey || '';
  const receiverName = voucher.receiverName || 'Estimado cliente';
  const receiverId = voucher.receiverIdNumber || 'Consumidor Final';
  const currency = voucher.currency || 'CRC';
  const symbol = currency === 'USD' ? '$' : '₡';

  const fmt = (n: any) => `${symbol}${Number(n || 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const metadata = (voucher.metadata || {}) as any;
  const items = Array.isArray(metadata.items) && metadata.items.length > 0
    ? metadata.items
    : [
        {
          description: 'Productos o servicios facturados',
          quantity: 1,
          unitPrice: voucher.subtotal || voucher.totalAmount || 0,
          lineTotal: voucher.totalAmount || 0
        }
      ];

  const rowsHtml = items
    .map((it: any) => {
      const qty = Number(it.quantity || 1);
      const unitP = Number(it.unitPrice ?? it.unit_price ?? 0);
      const lineSub = Number(it.lineSubtotal ?? (qty * unitP));
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${qty}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:500;">${escapeXml(it.description || it.detail || 'Item')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#475569;text-align:right;">${fmt(unitP)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${fmt(lineSub)}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeXml(docLabel)} - ${escapeXml(storeName)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:28px 32px;color:#ffffff;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#93c5fd;font-weight:700;margin-bottom:6px;">
        Comprobante Electrónico Oficial DGT v4.4
      </div>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">${escapeXml(docLabel)}</h1>
      <p style="margin:6px 0 0;font-size:14px;color:#cbd5e1;">
        Emitido por <strong>${escapeXml(storeName)}</strong> (${escapeXml(issuerName)} · Cédula ${escapeXml(issuerId)})
      </p>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.5;">
        Hola <strong>${escapeXml(receiverName)}</strong>, adjunto a este correo encontrarás tu <strong>${escapeXml(docLabel)}</strong> en formato <strong>PDF</strong> y su archivo <strong>XML oficial de Hacienda</strong>.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:22px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Consecutivo Hacienda (Sucursal ${escapeXml(branchCode)} · Terminal ${escapeXml(posCode)})</div>
        <div style="font-family:monospace;font-size:15px;font-weight:700;color:#0f172a;margin-bottom:10px;">${escapeXml(consecutive)}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Clave Numérica de 50 Dígitos</div>
        <div style="font-family:monospace;font-size:12px;color:#1e40af;word-break:break-all;font-weight:600;">${escapeXml(numericKey)}</div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:12px;color:#475569;">
          <strong>Receptor:</strong> ${escapeXml(receiverName)} (${escapeXml(receiverId)})
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;text-transform:uppercase;">Cant.</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#475569;text-transform:uppercase;">Detalle</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;text-transform:uppercase;">Precio Unit.</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#475569;text-transform:uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:24px;text-align:right;">
        <div style="font-size:13px;color:#475569;margin-bottom:6px;">Subtotal Neto: <strong>${fmt(voucher.subtotal)}</strong></div>
        <div style="font-size:13px;color:#475569;margin-bottom:8px;">Impuesto (IVA): <strong>${fmt(voucher.taxAmount)}</strong></div>
        <div style="font-size:18px;color:#0f172a;font-weight:800;">Total Comprobante: ${fmt(voucher.totalAmount)}</div>
      </div>

      <div style="text-align:center;margin:26px 0;">
        <a href="${escapeXml(pdfPublicUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;margin-right:8px;">
          Descargar Comprobante PDF
        </a>
        <a href="${escapeXml(xmlPublicUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;">
          Descargar XML Hacienda
        </a>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#64748b;text-align:center;line-height:1.5;">
        Autorizado mediante resolución de Facturación Electrónica DGT-R-033-2019 y versión 4.4 del Ministerio de Hacienda de Costa Rica.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envía un correo MIME multipart/mixed con adjuntos mediante protocolo SMTP nativo (TLS directo en 465 o STARTTLS en 587).
 */
async function sendMimeEmailViaSmtp(
  smtp: { host: string; port: number; user: string; pass: string; fromEmail: string; fromName: string },
  mail: { to: string; replyTo?: string; subject: string; html: string; attachments: EmailAttachment[] }
): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const boundary = `----BeticoBoundary_${Date.now().toString(16)}`;
    const subjectB64 = Buffer.from(mail.subject, 'utf8').toString('base64');
    const fromNameB64 = Buffer.from(smtp.fromName || 'Facturacion Electronica', 'utf8').toString('base64');
    const htmlB64 = Buffer.from(mail.html, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n');

    const headers = [
      `From: =?UTF-8?B?${fromNameB64}?= <${smtp.fromEmail}>`,
      `To: <${mail.to}>`,
      ...(mail.replyTo ? [`Reply-To: <${mail.replyTo}>`] : []),
      `Subject: =?UTF-8?B?${subjectB64}?=`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`
    ];

    const parts: string[] = [];
    parts.push(
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      `${htmlB64}\r\n`
    );

    for (const att of mail.attachments) {
      const attB64 = att.content.toString('base64').replace(/(.{76})/g, '$1\r\n');
      parts.push(
        `--${boundary}\r\n` +
        `Content-Type: ${att.contentType}; name="${att.filename}"\r\n` +
        `Content-Disposition: attachment; filename="${att.filename}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        `${attB64}\r\n`
      );
    }

    parts.push(`--${boundary}--\r\n`);
    const rawMime = `${headers.join('\r\n')}\r\n\r\n${parts.join('')}\r\n.`;

    let socket: net.Socket | tls.TLSSocket;
    let step = 0;
    let buffer = '';
    let finished = false;

    const finish = (result: { ok: boolean; error?: string }) => {
      if (finished) return;
      finished = true;
      try {
        socket?.destroy();
      } catch (_) {}
      resolve(result);
    };

    const timeout = setTimeout(() => {
      finish({ ok: false, error: 'Tiempo de espera agotado conectando al servidor SMTP' });
    }, 12000);

    const sendLine = (cmd: string) => {
      socket.write(`${cmd}\r\n`);
    };

    const handleResponse = (code: number, fullText: string) => {
      if (code >= 400) {
        clearTimeout(timeout);
        finish({ ok: false, error: `Error SMTP (${code}): ${fullText.trim()}` });
        return;
      }

      if (step === 0 && code === 220) {
        step = 1;
        sendLine(`EHLO betico.cr`);
      } else if (step === 1 && code === 250) {
        if (smtp.port !== 465 && !(socket instanceof tls.TLSSocket) && fullText.toUpperCase().includes('STARTTLS')) {
          step = 2;
          sendLine('STARTTLS');
        } else {
          step = 3;
          sendLine('AUTH LOGIN');
        }
      } else if (step === 2 && code === 220) {
        const upgraded = tls.connect(
          { socket, servername: smtp.host, rejectUnauthorized: false },
          () => {
            socket = upgraded;
            attachListeners(upgraded);
            step = 1;
            sendLine(`EHLO betico.cr`);
          }
        );
        upgraded.on('error', (err) => {
          clearTimeout(timeout);
          finish({ ok: false, error: `Error TLS SMTP: ${err.message}` });
        });
      } else if (step === 3 && code === 334) {
        step = 4;
        sendLine(Buffer.from(smtp.user, 'utf8').toString('base64'));
      } else if (step === 4 && code === 334) {
        step = 5;
        sendLine(Buffer.from(smtp.pass, 'utf8').toString('base64'));
      } else if (step === 5 && code === 235) {
        step = 6;
        sendLine(`MAIL FROM:<${smtp.fromEmail}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        sendLine(`RCPT TO:<${mail.to}>`);
      } else if (step === 7 && (code === 250 || code === 251)) {
        step = 8;
        sendLine('DATA');
      } else if (step === 8 && code === 354) {
        step = 9;
        sendLine(rawMime);
      } else if (step === 9 && code === 250) {
        step = 10;
        sendLine('QUIT');
        clearTimeout(timeout);
        finish({ ok: true });
      }
    };

    const attachListeners = (sock: net.Socket | tls.TLSSocket) => {
      sock.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';
        let multiLine = '';
        for (const line of lines) {
          multiLine += line + '\n';
          if (/^\d{3} /.test(line)) {
            const code = parseInt(line.slice(0, 3), 10);
            const msg = multiLine;
            multiLine = '';
            handleResponse(code, msg);
          }
        }
      });
      sock.on('error', (err) => {
        clearTimeout(timeout);
        finish({ ok: false, error: `Error de red SMTP: ${err.message}` });
      });
    };

    try {
      if (smtp.port === 465) {
        socket = tls.connect({ host: smtp.host, port: smtp.port, servername: smtp.host, rejectUnauthorized: false });
      } else {
        socket = net.connect({ host: smtp.host, port: smtp.port });
      }
      attachListeners(socket);
    } catch (err: any) {
      clearTimeout(timeout);
      finish({ ok: false, error: err.message });
    }
  });
}

/**
 * Envía el correo utilizando la API HTTP de Resend con adjuntos en Base64.
 */
async function sendEmailViaResend(
  apiKey: string,
  fromAddress: string,
  mail: { to: string; replyTo?: string; subject: string; html: string; attachments: EmailAttachment[] }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [mail.to],
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        subject: mail.subject,
        html: mail.html,
        attachments: mail.attachments.map(a => ({
          filename: a.filename,
          content: a.content.toString('base64')
        }))
      })
    });

    if (res.ok) {
      return { ok: true };
    }
    const errBody = await res.text().catch(() => '');
    return { ok: false, error: `Resend API (${res.status}): ${errBody.slice(0, 150)}` };
  } catch (err: any) {
    return { ok: false, error: `Error conectando con Resend: ${err.message}` };
  }
}

/**
 * Despacha por correo electrónico (con prioridad alta) la Factura, Tiquete o Nota de Crédito al cliente,
 * adjuntando tanto el PDF oficial como el XML DGT v4.4 de Hacienda.
 */
export async function sendVoucherEmailNotification({
  tenantId,
  voucherKeyOrId,
  overrideEmail
}: {
  tenantId: string;
  voucherKeyOrId: string;
  overrideEmail?: string;
}): Promise<SendEmailResult> {
  const voucher = await getElectronicVoucherByKeyOrId(voucherKeyOrId);
  if (!voucher || voucher.tenantId !== tenantId) {
    return {
      success: false,
      transport: 'pending_config',
      recipient: overrideEmail || '',
      message: 'Comprobante electrónico no encontrado para este negocio.'
    };
  }

  // 1. Resolver el correo electrónico del cliente (priorizando overrideEmail -> voucher.receiverEmail -> orden -> cita)
  let recipientEmail = (overrideEmail || voucher.receiverEmail || '').trim();

  if (!recipientEmail && voucher.orderId) {
    const ordRes = await query(
      `SELECT customer_email, billing_info FROM orders WHERE id = $1 AND tenant_id = $2`,
      [voucher.orderId, tenantId]
    ).catch(() => ({ rows: [] }));
    if (ordRes.rows.length > 0) {
      const r = ordRes.rows[0];
      const bInfo = typeof r.billing_info === 'string' ? JSON.parse(r.billing_info) : (r.billing_info || {});
      recipientEmail = (bInfo?.email || r.customer_email || '').trim();
    }
  }

  if (!recipientEmail && voucher.appointmentId) {
    const appRes = await query(
      `SELECT a.billing_info, cr.email as record_email
       FROM appointments a
       LEFT JOIN customer_records cr ON cr.id = a.record_id
       WHERE a.id = $1 AND a.tenant_id = $2`,
      [voucher.appointmentId, tenantId]
    ).catch(() => ({ rows: [] }));
    if (appRes.rows.length > 0) {
      const r = appRes.rows[0];
      const bInfo = typeof r.billing_info === 'string' ? JSON.parse(r.billing_info) : (r.billing_info || {});
      recipientEmail = (bInfo?.email || r.record_email || '').trim();
    }
  }

  if (!recipientEmail || !recipientEmail.includes('@')) {
    return {
      success: false,
      transport: 'pending_config',
      recipient: '',
      message: 'El cliente no registró una dirección de correo electrónico válida para este comprobante.'
    };
  }

  // Actualizar receiver_email en el comprobante si no estaba guardado o fue actualizado manualmente
  if (recipientEmail !== voucher.receiverEmail) {
    await query(
      `UPDATE electronic_vouchers SET receiver_email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3`,
      [recipientEmail, voucher.id, tenantId]
    ).catch(() => {});
    voucher.receiverEmail = recipientEmail;
  }

  const haciendaConfig = await getHaciendaConfigByTenant(tenantId);
  const secrets = await getHaciendaDecryptedSecrets(tenantId);
  const { getStoreSettings } = await import('../db/store-settings.repo.js');
  const { getTenantById } = await import('../db/tenant.repo.js');
  const { AlmendroService } = await import('./almendro.service.js');

  const store = await getStoreSettings(tenantId).catch(() => null);
  const tenant = await getTenantById(tenantId).catch(() => null);
  const storeName = haciendaConfig?.commercialName || store?.storeName || haciendaConfig?.taxpayerName || tenant?.name || 'Comercio Afiliado';

  // 2. Generar adjuntos oficiales: PDF + XML DGT v4.4
  const pdfResult = await AlmendroService.getVoucherPdf(voucher.numericKey || voucher.id);
  const xmlBuffer = buildOfficialHaciendaXmlBuffer(voucher, haciendaConfig);

  const consecutive = voucher.consecutiveNumber || voucher.numericKey || voucher.id;
  const attachments: EmailAttachment[] = [];

  if (pdfResult.success && pdfResult.buffer) {
    attachments.push({
      filename: `Comprobante_${consecutive}.pdf`,
      contentType: 'application/pdf',
      content: pdfResult.buffer
    });
  }
  attachments.push({
    filename: `Hacienda_${voucher.numericKey || consecutive}.xml`,
    contentType: 'application/xml',
    content: xmlBuffer
  });

  const baseUrl = env.APP_URL || 'https://betico.tech';
  const pdfPublicUrl = `${baseUrl}/api/almendro/public/voucher-pdf/${voucher.numericKey || voucher.id}`;
  const xmlPublicUrl = `${baseUrl}/api/almendro/public/voucher-xml/${voucher.numericKey || voucher.id}`;

  const docName = voucher.docType === '01'
    ? 'Factura Electrónica'
    : voucher.docType === '03'
      ? 'Nota de Crédito Electrónica'
      : 'Tiquete Electrónico';

  const subject = `${docName} #${consecutive} - ${storeName}`;
  const html = buildVoucherEmailHtml({
    voucher,
    haciendaConfig,
    storeName,
    pdfPublicUrl,
    xmlPublicUrl
  });

  const replyTo = haciendaConfig?.taxpayerEmail || undefined;

  // 3. Seleccionar transporte de correo (1: Resend del Tenant, 2: SMTP del Tenant, 3: Resend Plataforma, 4: SMTP Plataforma)
  let transportUsed: SendEmailResult['transport'] = 'pending_config';
  let sendAttempt: { ok: boolean; error?: string } = { ok: false, error: 'Servidor de correo saliente no configurado' };

  if (secrets?.resendApiKey) {
    transportUsed = 'resend_tenant';
    const fromAddr = `${storeName} <${haciendaConfig?.taxpayerEmail || env.SMTP_FROM || 'facturacion@betico.cr'}>`;
    sendAttempt = await sendEmailViaResend(secrets.resendApiKey, fromAddr, {
      to: recipientEmail,
      replyTo,
      subject,
      html,
      attachments
    });
  } else if (secrets?.smtpHost && secrets?.smtpUser && secrets?.smtpPass) {
    transportUsed = 'smtp_tenant';
    sendAttempt = await sendMimeEmailViaSmtp(
      {
        host: secrets.smtpHost,
        port: secrets.smtpPort || 587,
        user: secrets.smtpUser,
        pass: secrets.smtpPass,
        fromEmail: secrets.smtpUser.includes('@') ? secrets.smtpUser : (haciendaConfig?.taxpayerEmail || env.SMTP_FROM),
        fromName: storeName
      },
      { to: recipientEmail, replyTo, subject, html, attachments }
    );
  } else if (env.RESEND_API_KEY) {
    transportUsed = 'resend_platform';
    const fromAddr = `${storeName} <${env.SMTP_FROM || 'facturacion@betico.cr'}>`;
    sendAttempt = await sendEmailViaResend(env.RESEND_API_KEY, fromAddr, {
      to: recipientEmail,
      replyTo,
      subject,
      html,
      attachments
    });
  } else if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transportUsed = 'smtp_platform';
    sendAttempt = await sendMimeEmailViaSmtp(
      {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        fromEmail: env.SMTP_FROM || env.SMTP_USER,
        fromName: storeName
      },
      { to: recipientEmail, replyTo, subject, html, attachments }
    );
  }

  // 4. Registrar estado de entrega en metadata del comprobante y notifications_log
  const currentMeta = (voucher.metadata || {}) as Record<string, any>;
  const updatedMeta = {
    ...currentMeta,
    emailDelivery: {
      status: sendAttempt.ok ? 'sent' : (transportUsed === 'pending_config' ? 'queued_pending_smtp' : 'failed'),
      recipient: recipientEmail,
      transport: transportUsed,
      sentAt: new Date().toISOString(),
      attachmentsCount: attachments.length,
      error: sendAttempt.ok ? undefined : sendAttempt.error
    }
  };

  await query(
    `UPDATE electronic_vouchers SET metadata = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3`,
    [JSON.stringify(updatedMeta), voucher.id, tenantId]
  ).catch(() => {});

  await query(
    `INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
     VALUES ($1, $2, $3, $4, 'electronic_invoice_email', $5)`,
    [
      `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      recipientEmail,
      `${docName} #${consecutive} (PDF + XML) -> ${recipientEmail}`,
      sendAttempt.ok ? 'sent' : 'queued'
    ]
  ).catch(() => {});

  if (sendAttempt.ok) {
    return {
      success: true,
      transport: transportUsed,
      recipient: recipientEmail,
      message: `Comprobante enviado exitosamente por correo electrónico (PDF + XML) a ${recipientEmail}`
    };
  }

  if (transportUsed === 'pending_config') {
    return {
      success: false,
      transport: 'pending_config',
      recipient: recipientEmail,
      message: `El comprobante quedó preparado con PDF y XML para ${recipientEmail}. Para despachar correos en tiempo real, configura el servidor SMTP o Resend en la pestaña "Credenciales y Llave .p12".`
    };
  }

  return {
    success: false,
    transport: transportUsed,
    recipient: recipientEmail,
    message: `No se pudo entregar el correo a ${recipientEmail}: ${sendAttempt.error}`
  };
}

/**
 * Prueba en vivo la configuración de despacho de correo del comercio enviando un email de prueba.
 */
export async function testTenantEmailDelivery(
  tenantId: string,
  params: {
    testEmail?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    resendApiKey?: string;
  }
): Promise<{ success: boolean; message: string }> {
  const config = await getHaciendaConfigByTenant(tenantId);
  const secrets = await getHaciendaDecryptedSecrets(tenantId);

  const recipient = (params.testEmail || config?.taxpayerEmail || '').trim();
  if (!recipient || !recipient.includes('@')) {
    return {
      success: false,
      message: 'Ingresa un correo electrónico destinatario válido para enviar la prueba.'
    };
  }

  const smtpHost = (params.smtpHost !== undefined ? params.smtpHost : secrets?.smtpHost || '').trim();
  const smtpPort = Number(params.smtpPort || secrets?.smtpPort || 587);
  const smtpUser = (params.smtpUser !== undefined ? params.smtpUser : secrets?.smtpUser || '').trim();
  const smtpPass = (params.smtpPass && !params.smtpPass.includes('••••'))
    ? params.smtpPass.trim()
    : (secrets?.smtpPass || '');
  const resendApiKey = (params.resendApiKey && !params.resendApiKey.includes('••••'))
    ? params.resendApiKey.trim()
    : (secrets?.resendApiKey || '');

  const storeName = config?.commercialName || config?.taxpayerName || 'Facturación Electrónica Betico';
  const subject = `Prueba de Envío de Facturación Electrónica - ${storeName}`;
  const html = `<div style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;">
    <h2 style="color:#0f172a;margin-top:0;">Conexión de Correo Verificada</h2>
    <p style="color:#334155;line-height:1.5;">Este es un correo de prueba del módulo de <strong>Facturación Electrónica Hacienda DGT v4.4</strong> de <strong>${escapeXml(storeName)}</strong>.</p>
    <p style="color:#16a34a;font-weight:700;">Las facturas, tiquetes y notas de crédito (con sus archivos PDF y XML adjuntos) llegarán correctamente al correo de tus clientes.</p>
  </div>`;

  if (resendApiKey) {
    const res = await sendEmailViaResend(
      resendApiKey,
      `${storeName} <${config?.taxpayerEmail || env.SMTP_FROM || 'facturacion@betico.cr'}>`,
      { to: recipient, subject, html, attachments: [] }
    );
    return {
      success: res.ok,
      message: res.ok
        ? `Correo de prueba enviado exitosamente a ${recipient} vía Resend API.`
        : (res.error || 'Error enviando correo de prueba vía Resend.')
    };
  }

  if (smtpHost && smtpUser && smtpPass) {
    const res = await sendMimeEmailViaSmtp(
      {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        pass: smtpPass,
        fromEmail: smtpUser.includes('@') ? smtpUser : (config?.taxpayerEmail || env.SMTP_FROM),
        fromName: storeName
      },
      { to: recipient, subject, html, attachments: [] }
    );
    return {
      success: res.ok,
      message: res.ok
        ? `Correo de prueba enviado exitosamente a ${recipient} vía servidor SMTP (${smtpHost}:${smtpPort}).`
        : (res.error || 'Error conectando con el servidor SMTP.')
    };
  }

  if (env.RESEND_API_KEY || (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)) {
    const res = env.RESEND_API_KEY
      ? await sendEmailViaResend(env.RESEND_API_KEY, `${storeName} <${env.SMTP_FROM}>`, { to: recipient, subject, html, attachments: [] })
      : await sendMimeEmailViaSmtp(
          {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT || 587,
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
            fromEmail: env.SMTP_FROM || env.SMTP_USER,
            fromName: storeName
          },
          { to: recipient, subject, html, attachments: [] }
        );
    return {
      success: res.ok,
      message: res.ok
        ? `Correo de prueba enviado exitosamente a ${recipient} usando el servidor global de la plataforma.`
        : (res.error || 'Error enviando correo con el servidor global.')
    };
  }

  return {
    success: false,
    message: 'Configura tu servidor SMTP (ej. Gmail / Workspace / cPanel) o tu API Key de Resend para activar el despacho directo de correos.'
  };
}
