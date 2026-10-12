/**
 * src/server/services/timezone.service.ts
 * Módulo de normalización temporal pura para Costa Rica (America/Costa_Rica, UTC-6).
 * Libre de dependencias externas.
 */

export const COSTA_RICA_TIMEZONE = 'America/Costa_Rica';
export const COSTA_RICA_OFFSET_HOURS = -6;
export const COSTA_RICA_OFFSET_STRING = '-06:00';

export interface CostaRicaDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 1 = Lunes, ..., 7 = Domingo
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:mm
  totalMinutes: number; // (hour * 60) + minute
}

/**
 * Obtiene la fecha y hora actual desglosada en Costa Rica de forma determinista.
 */
export function getNowCR(referenceDate: Date = new Date()): CostaRicaDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: COSTA_RICA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(referenceDate);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0; // Normalización estándar 24h
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  // Mapeo determinista de día de la semana: 1 = Lunes, ..., 7 = Domingo
  const weekdayMap: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7
  };
  const dayOfWeek = weekdayMap[partMap.weekday] || 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hour)}:${pad(minute)}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek,
    dateStr,
    timeStr,
    totalMinutes: (hour * 60) + minute
  };
}

/**
 * Retorna la fecha de HOY en Costa Rica exactamente en formato 'YYYY-MM-DD'.
 * Garantiza que entre las 18:00 y 23:59 CR (00:00 a 05:59 UTC del día siguiente)
 * no se desplace al día siguiente.
 */
export function getTodayCR(referenceDate: Date = new Date()): string {
  return getNowCR(referenceDate).dateStr;
}

/**
 * Retorna la hora actual en Costa Rica en formato 'HH:mm'.
 */
export function getCurrentTimeCR(referenceDate: Date = new Date()): string {
  return getNowCR(referenceDate).timeStr;
}

/**
 * Retorna la cantidad de minutos transcurridos en el día actual en Costa Rica.
 * Ejemplo: 14:30 => (14 * 60) + 30 = 870 minutos.
 */
export function getCurrentMinutesCR(referenceDate: Date = new Date()): number {
  return getNowCR(referenceDate).totalMinutes;
}

/**
 * Calcula el día de la semana (1 = Lunes, ..., 7 = Domingo) para una fecha YYYY-MM-DD
 * interpretada estrictamente en el calendario costarricense.
 */
export function getDayOfWeekCR(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  // Fecha UTC al mediodía para evitar cualquier cruce horario
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const rawDay = dateObj.getUTCDay(); // 0 = Domingo, 1 = Lunes
  return rawDay === 0 ? 7 : rawDay;
}

/**
 * Determina si una fecha YYYY-MM-DD es anterior a la fecha actual de Costa Rica.
 */
export function isDateInPastCR(dateStr: string, referenceDate: Date = new Date()): boolean {
  return dateStr < getTodayCR(referenceDate);
}

/**
 * Determina si un turno específico (fecha + hora HH:mm) ya pasó con respecto
 * a la hora actual de Costa Rica.
 * @param dateStr Fecha en formato YYYY-MM-DD
 * @param timeStr Hora en formato HH:mm o 'H:mm AM/PM'
 * @param bufferMinutes Minutos de antelación mínima requerida (default 0)
 * @param referenceDate Fecha/hora de referencia para simulación o pruebas
 */
export function isSlotInPastCR(
  dateStr: string,
  timeStr: string,
  bufferMinutes = 0,
  referenceDate: Date = new Date()
): boolean {
  const today = getTodayCR(referenceDate);
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  // Normalizar formato de hora si viene con AM/PM
  let cleanTime = (timeStr || '').trim();
  const isPM = /pm/i.test(cleanTime);
  const isAM = /am/i.test(cleanTime);
  cleanTime = cleanTime.replace(/\s*(am|pm)/i, '');

  const [hPart, mPart = '0'] = cleanTime.split(':');
  let h = parseInt(hPart, 10);
  const m = parseInt(mPart, 10);

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  const slotMinutes = (h * 60) + (isNaN(m) ? 0 : m);
  const nowMinutes = getCurrentMinutesCR(referenceDate);

  return slotMinutes <= (nowMinutes + bufferMinutes);
}

/**
 * Convierte una fecha y hora de Costa Rica en un objeto Date nativo en UTC exacto.
 */
export function parseCRDateAndTimeToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  let cleanTime = (timeStr || '00:00').trim();
  const isPM = /pm/i.test(cleanTime);
  const isAM = /am/i.test(cleanTime);
  cleanTime = cleanTime.replace(/\s*(am|pm)/i, '');

  const [hPart, mPart = '0'] = cleanTime.split(':');
  let hour = parseInt(hPart, 10);
  const minute = parseInt(mPart, 10);

  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;

  // Costa Rica es UTC-6 => hora UTC = hora CR + 6
  return new Date(Date.UTC(year, month - 1, day, hour + 6, minute, 0));
}

/**
 * Formatea una fecha en formato ISO oficial con el offset de Costa Rica (-06:00).
 * Requerido para Comprobantes de Hacienda DGT v4.4.
 * Ejemplo: 2026-10-12T15:30:00-06:00
 */
export function formatCRForHacienda(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COSTA_RICA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  let hh = m.hour;
  if (hh === '24') hh = '00';
  return `${m.year}-${m.month}-${m.day}T${hh}:${m.minute}:${m.second}-06:00`;
}

/**
 * Normaliza cualquier entrada de fecha libre garantizando que el fallback sea HOY en Costa Rica.
 */
export function normalizeDateInput(inputDate: any, referenceDate: Date = new Date()): string {
  if (!inputDate) return getTodayCR(referenceDate);
  const str = String(inputDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: COSTA_RICA_TIMEZONE, dateStyle: 'short' });
    return formatter.format(parsed);
  }
  return getTodayCR(referenceDate);
}
