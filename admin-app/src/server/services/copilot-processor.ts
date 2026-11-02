import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as XLSX from 'xlsx';

export interface CatalogItem {
  id?: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
}

export interface FiscalData {
  idType: string; // '01' (Fisica), '02' (Juridica), '03' (DIMEX), '04' (NITE)
  idNumber: string;
  legalName: string;
  email: string;
}

export interface BusinessModules {
  store: boolean;
  bookings: boolean;
  courts: boolean;
  loyalty: boolean;
  billing: boolean;
}

export interface BusinessProfile {
  name: string;
  slug: string;
  whatsappNumber: string;
  plan: string; // 'starter' | 'pro' | 'business' | 'enterprise'
  logoUrl?: string;
  bannerUrl?: string;
  niche?: string;
  modules: BusinessModules;
  fiscal: FiscalData;
  catalogItems: CatalogItem[];
}

export interface ProcessedFileInput {
  name: string;
  mimeType: string;
  data: string; // base64 or raw text
}

export interface ProcessInput {
  message?: string;
  audioBase64?: string;
  files?: ProcessedFileInput[];
  currentProfile?: Partial<BusinessProfile>;
}

export interface ProcessResult {
  assistantMessage: string;
  profileDelta: Partial<BusinessProfile>;
  recognizedFiles: Array<{
    name: string;
    mimeType: string;
    category: string;
    badgeLabel: string;
  }>;
}

/**
 * Regla de Idioma Espanol: Reemplaza cualquier caracter '&' por la conjuncion 'y'
 */
export function sanitizeSpanishText(str: string): string {
  if (!str) return str;
  return str.replace(/\s*&\s*/g, ' y ');
}

/**
 * Clasificador estricto de MIME types y extensiones
 */
export function classifyMimeType(mimeType: string, filename?: string): {
  category: 'image' | 'pdf' | 'spreadsheet' | 'audio' | 'unknown';
  detectedMime: string;
  extension: string;
  badgeLabel: string;
} {
  const cleanMime = (mimeType || '').toLowerCase().trim();
  const cleanName = (filename || '').toLowerCase().trim();
  const ext = cleanName.includes('.') ? cleanName.split('.').pop() || '' : '';

  if (
    cleanMime.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)
  ) {
    let badge = 'IMAGEN';
    if (cleanMime.includes('png') || ext === 'png') badge = 'PNG';
    else if (cleanMime.includes('jpeg') || cleanMime.includes('jpg') || ext === 'jpg' || ext === 'jpeg') badge = 'JPEG';
    else if (cleanMime.includes('webp') || ext === 'webp') badge = 'WEBP';
    return { category: 'image', detectedMime: cleanMime || `image/${ext || 'jpeg'}`, extension: ext || 'png', badgeLabel: badge };
  }

  if (cleanMime === 'application/pdf' || ext === 'pdf') {
    return { category: 'pdf', detectedMime: 'application/pdf', extension: 'pdf', badgeLabel: 'PDF' };
  }

  if (
    cleanMime === 'text/csv' ||
    cleanMime.includes('spreadsheet') ||
    cleanMime.includes('excel') ||
    ['csv', 'xlsx', 'xls'].includes(ext)
  ) {
    let badge = 'EXCEL/CSV';
    if (cleanMime === 'text/csv' || ext === 'csv') badge = 'CSV';
    else if (ext === 'xlsx' || cleanMime.includes('openxmlformats')) badge = 'XLSX';
    return { category: 'spreadsheet', detectedMime: cleanMime || (ext === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), extension: ext || 'csv', badgeLabel: badge };
  }

  if (
    cleanMime.startsWith('audio/') ||
    ['webm', 'mp3', 'wav', 'ogg', 'm4a'].includes(ext)
  ) {
    let badge = 'AUDIO';
    if (cleanMime.includes('webm') || ext === 'webm') badge = 'AUDIO/WEBM';
    else if (cleanMime.includes('mp3') || ext === 'mp3') badge = 'AUDIO/MP3';
    else if (cleanMime.includes('wav') || ext === 'wav') badge = 'AUDIO/WAV';
    return { category: 'audio', detectedMime: cleanMime || `audio/${ext || 'webm'}`, extension: ext || 'webm', badgeLabel: badge };
  }

  return { category: 'unknown', detectedMime: cleanMime || 'application/octet-stream', extension: ext || 'bin', badgeLabel: 'ARCHIVO' };
}

/**
 * Normaliza montos en colones o dolares soportando separadores de miles y decimales
 */
export function parsePrice(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  if (!val) return 0;
  const str = String(val).trim();
  const cleaned = str.replace(/[^\d.,]/g, '');
  if (!cleaned) return 0;

  // Si tiene tanto punto como coma
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastDot > lastComma) {
      // Formato anglosajon: 1,500.00 o 1,500,000.00 (coma miles, punto decimal)
      const noThousands = cleaned.replace(/,/g, '');
      const num = parseFloat(noThousands);
      return isNaN(num) ? 0 : Math.round(num);
    } else {
      // Formato latino/europeo: 1.500,00 o 1.500.000,00 (punto miles, coma decimal)
      const noThousands = cleaned.replace(/\./g, '').replace(/,/g, '.');
      const num = parseFloat(noThousands);
      return isNaN(num) ? 0 : Math.round(num);
    }
  }

  // Si solo tiene puntos
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || parts[1].length === 3) {
      const num = parseFloat(parts.join(''));
      return isNaN(num) ? 0 : Math.round(num);
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num);
  }

  // Si solo tiene comas
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length > 2 || parts[1].length === 3) {
      const num = parseFloat(parts.join(''));
      return isNaN(num) ? 0 : Math.round(num);
    }
    const normalized = cleaned.replace(/,/g, '.');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : Math.round(num);
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/**
 * Genera un slug valido
 */
export function generateSlug(name: string): string {
  const base = sanitizeSpanishText(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `comercio-${Date.now().toString().slice(-4)}`;
}

/**
 * Detecta y limpia cedula fiscal de Costa Rica
 */
export function detectCostaRicaTaxId(text: string): { idType: string; idNumber: string } | null {
  if (!text) return null;

  const jurMatch = text.match(/\b(3[-\s]?\d{3}[-\s]?\d{6})\b/) || text.match(/\b(3\d{9})\b/);
  if (jurMatch) {
    const raw = jurMatch[1].replace(/\D/g, '');
    if (raw.length === 10) {
      return { idType: '02', idNumber: raw };
    }
  }

  const fisMatch = text.match(/\b([1-9][-\s]?\d{4}[-\s]?\d{4})\b/) || text.match(/\b([1-9]\d{8})\b/);
  if (fisMatch) {
    const raw = fisMatch[1].replace(/\D/g, '');
    if (raw.length === 9) {
      return { idType: '01', idNumber: raw };
    }
  }

  const dimMatch = text.match(/\b(\d{11,12})\b/);
  if (dimMatch) {
    return { idType: '03', idNumber: dimMatch[1] };
  }

  return null;
}

/**
 * Extrae catalogos desde buffers de Excel (.xlsx, .xls) o CSV soportando multiples hojas
 */
export function extractCatalogFromSpreadsheet(buffer: Buffer): CatalogItem[] {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames || [];
    if (sheetNames.length === 0) return [];

    const allItems: CatalogItem[] = [];

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (!rows || rows.length === 0) continue;

      let headerRowIdx = -1;
      let nameCol = -1;
      let priceCol = -1;
      let categoryCol = -1;
      let descriptionCol = -1;

      for (let r = 0; r < Math.min(rows.length, 6); r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').toLowerCase().trim();
          if (['nombre', 'producto', 'platillo', 'articulo', 'artículo', 'servicio', 'item', 'name', 'title'].some(k => val.includes(k))) {
            if (nameCol === -1) nameCol = c;
          }
          if (['precio', 'costo', 'monto', 'price', 'valor', 'crc', 'colones'].some(k => val.includes(k))) {
            if (priceCol === -1) priceCol = c;
          }
          if (['categoria', 'categoría', 'seccion', 'sección', 'rubro', 'category'].some(k => val.includes(k))) {
            if (categoryCol === -1) categoryCol = c;
          }
          if (['descripcion', 'descripción', 'detalle', 'description'].some(k => val.includes(k))) {
            if (descriptionCol === -1) descriptionCol = c;
          }
        }
        if (nameCol !== -1 && priceCol !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      // Si no encontramos columnas en esta hoja y hay mas hojas, saltar
      if (headerRowIdx === -1 && (nameCol === -1 || priceCol === -1)) {
        continue;
      }

      if (nameCol === -1) nameCol = 0;
      if (priceCol === -1) priceCol = 1;

      const startRow = headerRowIdx >= 0 ? headerRowIdx + 1 : 0;
      const defaultCategory = !['hoja1', 'sheet1', 'libro', 'datos'].includes(sheetName.toLowerCase())
        ? sanitizeSpanishText(sheetName.trim())
        : 'General';

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;
        const rawName = String(row[nameCol] || '').trim();
        if (!rawName || rawName.toLowerCase() === 'nombre' || rawName.toLowerCase() === 'producto') continue;

        const rawPrice = row[priceCol];
        const price = parsePrice(rawPrice);
        if (price <= 0 && isNaN(price)) continue;

        const category = categoryCol !== -1 && row[categoryCol] ? String(row[categoryCol]).trim() : defaultCategory;
        const description = descriptionCol !== -1 && row[descriptionCol] ? String(row[descriptionCol]).trim() : undefined;

        allItems.push({
          name: sanitizeSpanishText(rawName),
          price,
          category: category ? sanitizeSpanishText(category) : 'General',
          description: description ? sanitizeSpanishText(description) : ''
        });
      }
    }

    return allItems;
  } catch (err) {
    console.warn('[Copilot XLSX Parser] Error procesando archivo de hoja de calculo:', err);
    return [];
  }
}

/**
 * Extrae texto de un buffer PDF
 */
export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const textChunks: string[] = [];

  const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
  let match;
  while ((match = tjRegex.exec(content)) !== null) {
    textChunks.push(match[1]);
  }

  const hexRegex = /<([0-9A-Fa-f]+)>\s*Tj/g;
  while ((match = hexRegex.exec(content)) !== null) {
    try {
      const decoded = Buffer.from(match[1], 'hex').toString('utf8');
      textChunks.push(decoded);
    } catch (_) {}
  }

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  while ((match = streamRegex.exec(content)) !== null) {
    const rawStream = match[1];
    const cleanStream = rawStream.replace(/[^\x20-\x7E\r\n]/g, ' ');
    if (cleanStream.length > 40) {
      textChunks.push(cleanStream);
    }
  }

  return textChunks.join(' ');
}

/**
 * Extrae datos fiscales de Costa Rica de un documento PDF o texto
 */
export function extractFiscalDataFromText(text: string): Partial<FiscalData> | null {
  if (!text) return null;

  const taxId = detectCostaRicaTaxId(text);
  const result: Partial<FiscalData> = {};

  if (taxId) {
    result.idType = taxId.idType;
    result.idNumber = taxId.idNumber;
  }

  const namePatterns = [
    /(?:Razón Social|Razon Social|Nombre o Razón Social|Contribuyente|Denominación|Nombre)[\s:]+([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,]+?)(?=\s*(?:Cédula|Cedula|Identificación|Identificacion|\b(?:y\s+)?correo\b|\b(?:y\s+)?email\b|Fecha|Estado|Tipo|$))/i,
    /(?:Sociedad|Empresa|Comercio)[\s:]+([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,]+?)(?=\s*(?:Cédula|Cedula|\b(?:y\s+)?correo\b|\b(?:y\s+)?email\b|$))/i
  ];

  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      let legal = m[1].trim().replace(/[\r\n]+/g, ' ');
      legal = legal.replace(/\s+y$/i, '').trim();
      if (legal.length > 3) {
        result.legalName = sanitizeSpanishText(legal);
        break;
      }
    }
  }

  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    result.email = emailMatch[1].toLowerCase().trim();
  }

  if (Object.keys(result).length === 0) {
    return null;
  }

  return result;
}

export function capitalizeItemName(str: string): string {
  const clean = sanitizeSpanishText(str.trim());
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Limpia prefijos de accion conversacional para obtener el nombre limpio del item
 */
export function cleanItemName(name: string): string {
  let cleaned = sanitizeSpanishText(name.trim());
  cleaned = cleaned.replace(/^(?:(?:y\s+)?(?:agrega(?:r)?|añade|añadir|incluye|incluir|servicio(?:\s+de)?|producto(?:\s+de)?|platillo(?:\s+de)?)\s+)+/i, '');
  return cleaned.trim();
}

/**
 * Extrae catalogo de lineas de texto plano o dictado soportando multiples items por linea
 */
export function extractCatalogFromText(text: string): CatalogItem[] {
  const items: CatalogItem[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const itemRegex = /(?:^|[-*•\s])\s*([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]+?)\s*(?:[:=–—-]|\bpor\b|\ba\b|\ben\b)\s*(?:₡|CRC|\$)?\s*([0-9]+(?:[.,][0-9]+)*)\s*(?:colones|crc)?(?:\s*\(([^)]+)\))?/i;

  for (const line of lines) {
    const parts = line.split(/(?:;|\.\s+|,\s*|\s+y\s+)/);
    for (const part of parts) {
      const match = part.match(itemRegex);
      if (match) {
        const rawName = match[1].trim();
        const rawPrice = match[2];
        const category = match[3]?.trim();

        const cleanedName = cleanItemName(rawName);
        const lowerName = cleanedName.toLowerCase();
        if (['whatsapp', 'telefono', 'teléfono', 'cedula', 'cédula', 'plan', 'correo', 'email'].some(k => lowerName.includes(k))) {
          continue;
        }

        const price = parsePrice(rawPrice);
        if (cleanedName.length >= 2 && price > 0) {
          items.push({
            name: capitalizeItemName(cleanedName),
            price,
            category: category ? sanitizeSpanishText(category) : 'General'
          });
        }
      }
    }
  }

  return items;
}

/**
 * Detecta nicho comercial y modulos sugeridos
 */
export function detectNicheAndModules(text: string): { niche?: string; modules: Partial<BusinessModules> } {
  const lower = text.toLowerCase();
  const modules: Partial<BusinessModules> = {};
  let niche: string | undefined;

  // Restaurante / Alimentos y Bebidas / Pizzerias
  if (['restaurante', 'comida', 'pizza', 'pizzas', 'pizzeria', 'pizzería', 'pasta', 'pastas', 'hamburguesa', 'cafeteria', 'cafetería', 'cafe', 'café', 'sushi', 'bar', 'comidas', 'comanda', 'platillo'].some(w => lower.includes(w))) {
    niche = 'restaurante';
    modules.store = true;
  }

  // Citas / Servicios (Barberia, Salon, Clinica)
  if (['barberia', 'barbería', 'barbero', 'peluqueria', 'peluquería', 'salon', 'salón', 'spa', 'estetica', 'estética', 'clinica', 'clínica', 'consultorio', 'veterinaria', 'dentista', 'uñas', 'citas', 'reservas', 'corte'].some(w => lower.includes(w))) {
    niche = 'citas_servicios';
    modules.bookings = true;
  }

  // Canchas y Clubes Deportivos
  if (['padel', 'pádel', 'cancha', 'canchas', 'futbol', 'fútbol', 'tenis', 'basket', 'deportivo', 'club deportivo'].some(w => lower.includes(w))) {
    niche = 'canchas';
    modules.courts = true;
  }

  // Fidelizacion
  if (['fidelizacion', 'fidelización', 'puntos', 'sellos', 'cashback', 'recompensas', 'lealtad'].some(w => lower.includes(w))) {
    modules.loyalty = true;
  }

  // Facturacion Electronica
  if (['factura', 'facturas', 'facturacion', 'facturación', 'hacienda', 'tiquete', 'cabys', 'tributaria', 'comprobante'].some(w => lower.includes(w))) {
    modules.billing = true;
  }

  return { niche, modules };
}

/**
 * Detecta plan de suscripcion sugerido
 */
export function detectPlan(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('plan enterprise') || lower.includes('enterprise')) return 'enterprise';
  if (lower.includes('plan business') || lower.includes('business')) return 'business';
  if (lower.includes('plan pro') || lower.includes('pro')) return 'pro';
  if (lower.includes('plan starter') || lower.includes('starter')) return 'starter';
  return undefined;
}

/**
 * Detecta nombre del negocio
 */
export function detectBusinessName(text: string): string | undefined {
  const patterns = [
    // 1. Asignaciones explícitas con dos puntos o igual (ej. Nuevo negocio: Cafetería El Grano de Oro)
    /(?:nuevo\s+)?(?:comercio|negocio|restaurante|barbería|barberia|cafetería|cafeteria|panadería|panaderia|clínica|clinica)\s*[:=]\s*["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    /(?:nombre(?:\s*comercial|\s*del\s*negocio|\s*del\s*comercio)?)\s*[:=]\s*["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    // 2. Patrones con llamado / llamada / con nombre explícito
    /(?:crear?|montar?|configurar?|alta|abrir|registrar?|nuevo)?\s*(?:un|una)?\s*(?:comercio|negocio|restaurante|barbería|barberia|cafetería|cafeteria|panadería|panaderia|taller|clínica|clinica|gimnasio)\s+(?:llamado|llamada|con nombre|nombre)\s*[:]?\s*["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    /(?:se\s*llama|llamado|llamada)\s+["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    // 3. Patrones de creación directa sin la palabra 'llamado' (ej. Crear restaurante La Cabaña del Chef con...)
    /(?:crear?|montar?|configurar?|alta|abrir|registrar?)\s+(?:un|una)?\s*(?:comercio|negocio|restaurante|barbería|barberia|cafetería|cafeteria|panadería|panaderia|taller|clínica|clinica|gimnasio)\s+["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    // 4. Notas de voz dictadas y entrecomillados
    /(?:nota\s*de\s*voz\s*dictada|dictado|dictada|nota\s*de\s*audio)\s*[:]\s*["']?([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,50}?)["']?(?=\s*(?:,|con|\.|\n|plan|slug|whatsapp|correo|email|y|$))/i,
    /["']([A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]{3,40})["']/i
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const clean = match[1].trim();
      const lower = clean.toLowerCase();
      if (!['un', 'el', 'la', 'mi', 'nuevo', 'comercio', 'negocio'].includes(lower)) {
        return sanitizeSpanishText(clean);
      }
    }
  }
  return undefined;
}

/**
 * Detecta numero de WhatsApp de Costa Rica
 */
export function detectCostaRicaPhone(text: string): string | undefined {
  const crMatch = text.match(/(?:\+?506[\s-]?)?([245678]\d{3}[-\s]?\d{4})\b/);
  if (crMatch) {
    const raw = crMatch[1].replace(/\D/g, '');
    if (raw.length === 8) {
      return `${raw.slice(0, 4)}-${raw.slice(4)}`;
    }
  }
  return undefined;
}

/**
 * Genera el mensaje conversacional en espanol respetando la regla de cero '&'
 */
export function generateAssistantResponse(
  delta: Partial<BusinessProfile>,
  filesProcessed: string[],
  voiceTranscription?: string
): string {
  const parts: string[] = [];

  if (voiceTranscription) {
    parts.push(`He transcrito tu nota de voz: "${voiceTranscription}".`);
  }
  if (delta.name) {
    parts.push(`He registrado el nombre comercial **${delta.name}**.`);
  }
  if (delta.slug) {
    parts.push(`Asigné el slug público \`${delta.slug}\`.`);
  }
  if (delta.whatsappNumber) {
    parts.push(`Configuré el número de WhatsApp **${delta.whatsappNumber}**.`);
  }
  if (delta.plan) {
    parts.push(`Seleccioné el plan **${delta.plan.toUpperCase()}**.`);
  }
  if (delta.logoUrl) {
    parts.push(`Guardé el logotipo institucional.`);
  }
  if (delta.bannerUrl) {
    parts.push(`Asigné el banner de portada.`);
  }
  if (delta.modules) {
    const activeMods: string[] = [];
    if (delta.modules.store) activeMods.push('Tienda en Línea');
    if (delta.modules.bookings) activeMods.push('Citas y Reservas');
    if (delta.modules.courts) activeMods.push('Canchas Deportivas');
    if (delta.modules.loyalty) activeMods.push('Club de Fidelización');
    if (delta.modules.billing) activeMods.push('Facturación Electrónica');
    if (activeMods.length > 0) {
      parts.push(`Habilité los módulos de ${activeMods.join(', ')}.`);
    }
  }
  if (delta.fiscal?.idNumber) {
    parts.push(`Detecté los datos fiscales de Costa Rica: Cédula ${delta.fiscal.idNumber} y Razón Social "${delta.fiscal.legalName || 'Registrada'}".`);
  } else if (delta.fiscal?.email) {
    parts.push(`Registré el correo fiscal ${delta.fiscal.email}.`);
  }
  if (delta.catalogItems && delta.catalogItems.length > 0) {
    parts.push(`Extraje ${delta.catalogItems.length} elementos iniciales para el catálogo con precios en colones.`);
  }

  if (filesProcessed && filesProcessed.length > 0) {
    parts.unshift(`Procesé con éxito los archivos adjuntos (${filesProcessed.join(', ')}).`);
  }

  if (parts.length === 0) {
    return sanitizeSpanishText(
      '¡Hola! Soy tu Copilot de Onboarding Betico. Dime el nombre de tu comercio, qué tipo de negocio es (restaurante, barbería, canchas deportivas, etc.), sube tu logotipo, listas de precios en Excel o constancia de situación tributaria en PDF, o graba una nota de voz para configurarlo todo automáticamente.'
    );
  }

  return sanitizeSpanishText(
    `¡Listo! ${parts.join(' ')} Revisa la vista previa en vivo en el panel derecho y presiona "Confirmar y Crear Comercio" para guardarlo en Betico Ops.`
  );
}

/**
 * Guarda archivo en disco dentro del directorio uploads
 */
export function saveUploadFile(filename: string, buffer: Buffer): string {
  const uploadDir = process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const safeFilename = `copilot_${Date.now()}_${cleanName}`;
  const filePath = path.join(uploadDir, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${safeFilename}`;
}

/**
 * Transcribe un archivo de audio o nota de voz usando el servicio de transcripcion
 */
async function tryTranscribeAudio(base64Audio: string, mimetype: string): Promise<string> {
  try {
    const mod = await import('../../../../src/server/services/audio-transcriber.service.js');
    if (mod && typeof mod.transcribeAudio === 'function') {
      const res = await mod.transcribeAudio(base64Audio, mimetype);
      if (res && res.success && res.text) {
        return res.text.trim();
      }
    }
  } catch (err) {
    // Modo offline o fallback graciable
  }
  return '';
}

/**
 * Aplica extraccion de entidades desde una cadena de texto
 */
function applyTextEntities(
  text: string,
  current: Partial<BusinessProfile>,
  delta: Partial<BusinessProfile>
) {
  if (!text || !text.trim()) return;

  const foundName = detectBusinessName(text);
  if (foundName) {
    delta.name = foundName;
    if (!current.slug) {
      delta.slug = generateSlug(foundName);
    }
  }

  const foundPhone = detectCostaRicaPhone(text);
  if (foundPhone) delta.whatsappNumber = foundPhone;

  const foundPlan = detectPlan(text);
  if (foundPlan) delta.plan = foundPlan;

  const { niche, modules } = detectNicheAndModules(text);
  if (niche) delta.niche = niche;
  if (Object.keys(modules).length > 0) {
    delta.modules = {
      store: modules.store ?? delta.modules?.store ?? current.modules?.store ?? false,
      bookings: modules.bookings ?? delta.modules?.bookings ?? current.modules?.bookings ?? false,
      courts: modules.courts ?? delta.modules?.courts ?? current.modules?.courts ?? false,
      loyalty: modules.loyalty ?? delta.modules?.loyalty ?? current.modules?.loyalty ?? false,
      billing: modules.billing ?? delta.modules?.billing ?? current.modules?.billing ?? false
    };
  }

  const fiscalFromText = extractFiscalDataFromText(text);
  if (fiscalFromText) {
    delta.fiscal = {
      idType: fiscalFromText.idType || delta.fiscal?.idType || current.fiscal?.idType || '01',
      idNumber: fiscalFromText.idNumber || delta.fiscal?.idNumber || current.fiscal?.idNumber || '',
      legalName: fiscalFromText.legalName || delta.fiscal?.legalName || current.fiscal?.legalName || delta.name || current.name || '',
      email: fiscalFromText.email || delta.fiscal?.email || current.fiscal?.email || ''
    };
    if (fiscalFromText.idNumber) {
      if (!delta.modules) delta.modules = { ...(current.modules || { store: true, bookings: false, courts: false, loyalty: false, billing: false }) };
      delta.modules.billing = true;
    }
  }

  const textCatalog = extractCatalogFromText(text);
  if (textCatalog.length > 0) {
    delta.catalogItems = [...(delta.catalogItems || current.catalogItems || []), ...textCatalog];
  }
}

/**
 * Procesa entradas multimodales integradas (Texto, Voz, Archivos)
 */
export async function processMultimodalInput(input: ProcessInput): Promise<ProcessResult> {
  const current = input.currentProfile || {};
  const delta: Partial<BusinessProfile> = {};
  const recognizedFiles: ProcessResult['recognizedFiles'] = [];
  const processedNames: string[] = [];
  let voiceTranscription: string | undefined;

  const textInput = (input.message || '').trim();

  // 1. Extraer entidades del texto plano enviado
  if (textInput) {
    applyTextEntities(textInput, current, delta);
  }

  // 2. Procesar nota de voz si viene en audioBase64
  if (input.audioBase64) {
    recognizedFiles.push({
      name: 'Nota de voz.webm',
      mimeType: 'audio/webm',
      category: 'audio',
      badgeLabel: 'AUDIO/VOZ'
    });
    processedNames.push('Nota de voz');

    try {
      const b64 = input.audioBase64.includes(';base64,')
        ? input.audioBase64.split(';base64,')[1]
        : input.audioBase64;
      const audioBuffer = Buffer.from(b64, 'base64');
      saveUploadFile('nota_de_voz.webm', audioBuffer);

      const transcribed = await tryTranscribeAudio(b64, 'audio/webm');
      if (transcribed) {
        voiceTranscription = transcribed;
        applyTextEntities(transcribed, current, delta);
      }
    } catch (aErr) {
      console.warn('[Copilot AudioBase64] Advertencia procesando nota de voz:', aErr);
    }
  }

  // 3. Procesar archivos adjuntos (imagenes, pdfs, hojas de calculo, audios)
  if (Array.isArray(input.files) && input.files.length > 0) {
    for (const file of input.files) {
      const { category, detectedMime, badgeLabel } = classifyMimeType(file.mimeType, file.name);

      recognizedFiles.push({
        name: file.name,
        mimeType: detectedMime,
        category,
        badgeLabel
      });
      processedNames.push(file.name);

      let buffer: Buffer;
      let rawBase64 = file.data;
      if (file.data.startsWith('data:')) {
        const base64Index = file.data.indexOf(';base64,');
        rawBase64 = base64Index !== -1 ? file.data.substring(base64Index + 8) : file.data;
        buffer = Buffer.from(rawBase64, 'base64');
      } else {
        try {
          buffer = Buffer.from(file.data, 'base64');
        } catch (_) {
          buffer = Buffer.from(file.data, 'utf8');
        }
      }

      if (category === 'image') {
        const lowerName = file.name.toLowerCase();
        const savedUrl = saveUploadFile(file.name, buffer);

        if (['banner', 'portada', 'cover', 'fondo', 'encabezado'].some(k => lowerName.includes(k))) {
          delta.bannerUrl = savedUrl;
        } else if (['logo', 'logotipo', 'icono', 'icon', 'avatar', 'perfil'].some(k => lowerName.includes(k))) {
          delta.logoUrl = savedUrl;
        } else if (!current.logoUrl && !delta.logoUrl) {
          delta.logoUrl = savedUrl;
        } else {
          delta.bannerUrl = savedUrl;
        }
      } else if (category === 'spreadsheet') {
        const extracted = extractCatalogFromSpreadsheet(buffer);
        if (extracted.length > 0) {
          delta.catalogItems = [...(delta.catalogItems || current.catalogItems || []), ...extracted];
          if (!delta.modules) delta.modules = { ...(current.modules || { store: true, bookings: false, courts: false, loyalty: false, billing: false }) };
          delta.modules.store = true;
        }
      } else if (category === 'pdf') {
        const pdfText = extractTextFromPdfBuffer(buffer);
        const fiscal = extractFiscalDataFromText(pdfText);
        if (fiscal) {
          delta.fiscal = {
            idType: fiscal.idType || current.fiscal?.idType || '01',
            idNumber: fiscal.idNumber || current.fiscal?.idNumber || '',
            legalName: fiscal.legalName || current.fiscal?.legalName || delta.name || current.name || '',
            email: fiscal.email || current.fiscal?.email || ''
          };
          if (!delta.modules) delta.modules = { ...(current.modules || { store: true, bookings: false, courts: false, loyalty: false, billing: false }) };
          delta.modules.billing = true;
        }

        const pdfCatalog = extractCatalogFromText(pdfText);
        if (pdfCatalog.length > 0) {
          delta.catalogItems = [...(delta.catalogItems || current.catalogItems || []), ...pdfCatalog];
        }
      } else if (category === 'audio') {
        saveUploadFile(file.name, buffer);
        const transcribed = await tryTranscribeAudio(rawBase64, detectedMime);
        if (transcribed) {
          voiceTranscription = (voiceTranscription ? `${voiceTranscription} | ` : '') + transcribed;
          applyTextEntities(transcribed, current, delta);
        }
      }
    }
  }

  const assistantMessage = generateAssistantResponse(delta, processedNames, voiceTranscription);

  return {
    assistantMessage: sanitizeSpanishText(assistantMessage),
    profileDelta: delta,
    recognizedFiles
  };
}
