import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { LoyaltyCard } from '../../shared/types.js';

/**
 * Calculador de CRC32 estándar (IEEE 802.3) para empaquetado ZIP sin dependencias externas
 */
function calculateCrc32(buf: Buffer): number {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Empaqueta un conjunto de archivos en un archivo ZIP (formato PKZIP / .pkpass)
 */
export function buildZipArchive(files: Array<{ name: string; data: Buffer | string }>): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const dataBuf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8');
    const fileCrc = calculateCrc32(dataBuf);
    const size = dataBuf.length;

    // Local Header (30 bytes + nombre)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
    localHeader.writeUInt16LE(20, 4);         // versión mínima 2.0
    localHeader.writeUInt16LE(0, 6);          // flags
    localHeader.writeUInt16LE(0, 8);          // método 0 = stored (sin compresión)
    localHeader.writeUInt16LE(0, 10);         // tiempo
    localHeader.writeUInt16LE(0, 12);         // fecha
    localHeader.writeUInt32LE(fileCrc, 14);    // crc32
    localHeader.writeUInt32LE(size, 18);       // tamaño comprimido
    localHeader.writeUInt32LE(size, 22);       // tamaño original
    localHeader.writeUInt16LE(nameBuf.length, 26); // longitud del nombre
    localHeader.writeUInt16LE(0, 28);         // longitud campos extra
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, dataBuf);

    // Central Directory Header (46 bytes + nombre)
    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // PK\x01\x02
    centralHeader.writeUInt16LE(20, 4);         // versión creada
    centralHeader.writeUInt16LE(20, 6);         // versión necesaria
    centralHeader.writeUInt16LE(0, 8);          // flags
    centralHeader.writeUInt16LE(0, 10);         // método 0
    centralHeader.writeUInt16LE(0, 12);         // tiempo
    centralHeader.writeUInt16LE(0, 14);         // fecha
    centralHeader.writeUInt32LE(fileCrc, 16);    // crc32
    centralHeader.writeUInt32LE(size, 20);       // tamaño comprimido
    centralHeader.writeUInt32LE(size, 24);       // tamaño original
    centralHeader.writeUInt16LE(nameBuf.length, 28); // longitud nombre
    centralHeader.writeUInt16LE(0, 30);         // campos extra
    centralHeader.writeUInt16LE(0, 32);         // comentario longitud
    centralHeader.writeUInt16LE(0, 34);         // número de disco
    centralHeader.writeUInt16LE(0, 36);         // atributos internos
    centralHeader.writeUInt32LE(0, 38);         // atributos externos
    centralHeader.writeUInt32LE(offset, 42);    // offset del encabezado local
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + dataBuf.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const ch of centralHeaders) {
    centralDirSize += ch.length;
  }

  // End of Central Directory (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // PK\x05\x06
  eocd.writeUInt16LE(0, 4);          // número de disco
  eocd.writeUInt16LE(0, 6);          // disco de inicio
  eocd.writeUInt16LE(files.length, 8); // entradas en este disco
  eocd.writeUInt16LE(files.length, 10); // total de entradas
  eocd.writeUInt32LE(centralDirSize, 12);   // tamaño directorio central
  eocd.writeUInt32LE(centralDirOffset, 16); // offset directorio central
  eocd.writeUInt16LE(0, 20);         // longitud comentario

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

/**
 * Genera la estructura oficial de Apple Wallet (pass.json) para una tarjeta de fidelidad
 */
export function generateApplePassJson(
  card: LoyaltyCard & { stampsTarget?: number; stampsPrize?: string; programType?: string },
  customer: { identification: string; fullName: string }
): Record<string, any> {
  const isPoints = card.programType === 'points';
  const stampsTarget = card.stampsTarget || 10;
  const prize = card.stampsPrize || 'Premio de lealtad';

  const primaryValue = isPoints
    ? `${Number(card.pointsBalance || 0).toLocaleString()} pts`
    : `${Number(card.currentStamps || 0)} de ${stampsTarget} sellos`;

  const primaryLabel = isPoints ? 'Puntos Acumulados' : 'Sellos Obtenidos';

  return {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || 'pass.cr.betico.club',
    serialNumber: `card_${card.id}`,
    teamIdentifier: process.env.APPLE_TEAM_ID || 'BETICO_CR',
    organizationName: card.tenantName || 'Betico Club',
    description: `Tarjeta de Fidelidad - ${card.tenantName || 'Betico Club'}`,
    logoText: card.tenantName || 'Betico Club',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(30, 41, 59)',
    labelColor: 'rgb(148, 163, 184)',
    storeCard: {
      primaryFields: [
        {
          key: 'balance',
          label: primaryLabel,
          value: primaryValue
        }
      ],
      secondaryFields: [
        {
          key: 'holderName',
          label: 'Titular',
          value: customer.fullName || 'Cliente'
        },
        {
          key: 'holderId',
          label: 'Cédula',
          value: customer.identification
        }
      ],
      auxiliaryFields: [
        {
          key: 'rewardPrize',
          label: 'Meta o Premio',
          value: prize
        }
      ],
      backFields: [
        {
          key: 'terms',
          label: 'Términos y Condiciones',
          value: `Tarjeta de fidelidad emitida por ${card.tenantName || 'el comercio'}. Válido para compras en la tienda y caja física dictando tu número de cédula.`
        },
        {
          key: 'customerService',
          label: 'Atención al Cliente',
          value: 'Presenta este pase digital o tu número de cédula oficial al realizar tus pagos.'
        },
        {
          key: 'poweredBy',
          label: 'Plataforma',
          value: 'Betico Club y Billetera Digital de Fidelidad Multi-comercio.'
        }
      ]
    },
    barcodes: [
      {
        format: 'PKBarcodeFormatCode128',
        message: customer.identification,
        messageEncoding: 'iso-8859-1',
        altText: customer.identification
      },
      {
        format: 'PKBarcodeFormatQR',
        message: `https://betico.app/fidelidad/${card.tenantSlug || ''}?id=${encodeURIComponent(customer.identification)}`,
        messageEncoding: 'iso-8859-1',
        altText: 'Escanear en Caja'
      }
    ]
  };
}

/**
 * Empaqueta el archivo binario descargable .pkpass para Apple Wallet
 */
export function generateApplePassBundle(
  card: LoyaltyCard & { stampsTarget?: number; stampsPrize?: string; programType?: string },
  customer: { identification: string; fullName: string }
): Buffer {
  const passJsonObj = generateApplePassJson(card, customer);
  const passJsonBuffer = Buffer.from(JSON.stringify(passJsonObj, null, 2), 'utf8');

  // Manifiesto con hash SHA-1 de pass.json
  const sha1 = crypto.createHash('sha1').update(passJsonBuffer).digest('hex');
  const manifest = {
    'pass.json': sha1
  };
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');

  return buildZipArchive([
    { name: 'pass.json', data: passJsonBuffer },
    { name: 'manifest.json', data: manifestBuffer }
  ]);
}

/**
 * Genera la URL oficial de Google Wallet (Save Pass via JWT)
 */
export function generateGoogleWalletSaveUrl(
  card: LoyaltyCard & { stampsTarget?: number; stampsPrize?: string; programType?: string },
  customer: { identification: string; fullName: string }
): { url: string; jwt: string; loyaltyObject: any } {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022222222';
  const classId = `${issuerId}.betico_club_${card.tenantId.replace(/-/g, '_')}`;
  const objectId = `${issuerId}.card_${card.id.replace(/-/g, '_')}`;

  const isPoints = card.programType === 'points';
  const stampsTarget = card.stampsTarget || 10;
  const balanceStr = isPoints
    ? `${Number(card.pointsBalance || 0).toLocaleString()} pts`
    : `${Number(card.currentStamps || 0)}/${stampsTarget} sellos`;

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
    },
    loyaltyPoints: {
      label: isPoints ? 'Puntos' : 'Sellos',
      balance: {
        string: balanceStr
      }
    },
    infoModuleData: {
      labelValueRows: [
        {
          columns: [
            {
              label: 'Premio o Meta',
              value: card.stampsPrize || 'Premio de Fidelidad'
            },
            {
              label: 'Comercio',
              value: card.tenantName || 'Betico'
            }
          ]
        }
      ]
    }
  };

  const claims: any = {
    iss: process.env.GOOGLE_WALLET_CLIENT_EMAIL || 'betico-wallet@betico-saas.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    origins: ['https://betico.app'],
    payload: {
      loyaltyClasses: [loyaltyClass],
      loyaltyObjects: [loyaltyObject]
    }
  };

  // Firma del token
  let token: string;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  if (privateKey) {
    try {
      token = jwt.sign(claims, privateKey.replace(/\\n/g, '\n'), { algorithm: 'RS256' });
    } catch (_) {
      token = jwt.sign(claims, env.JWT_SECRET);
    }
  } else {
    token = jwt.sign(claims, env.JWT_SECRET);
  }

  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  return {
    url: saveUrl,
    jwt: token,
    loyaltyObject
  };
}
