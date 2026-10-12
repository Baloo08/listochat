import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

export const COSTA_RICA_TIMEZONE = 'America/Costa_Rica';
export const COSTA_RICA_OFFSET_HOURS = -6;
export const COSTA_RICA_OFFSET_STRING = '-06:00';

export function getNowCR(referenceDate = new Date()) {
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
  const partMap = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10);
  const day = parseInt(partMap.day, 10);
  let hour = parseInt(partMap.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(partMap.minute, 10);
  const second = parseInt(partMap.second, 10);

  const weekdayMap = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7
  };
  const dayOfWeek = weekdayMap[partMap.weekday] || 1;

  const pad = (n) => String(n).padStart(2, '0');
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

export function getTodayCR(referenceDate = new Date()) {
  return getNowCR(referenceDate).dateStr;
}

export function getCurrentTimeCR(referenceDate = new Date()) {
  return getNowCR(referenceDate).timeStr;
}

export function getCurrentMinutesCR(referenceDate = new Date()) {
  return getNowCR(referenceDate).totalMinutes;
}

export function getDayOfWeekCR(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const rawDay = dateObj.getUTCDay();
  return rawDay === 0 ? 7 : rawDay;
}

export function isDateInPastCR(dateStr, referenceDate = new Date()) {
  return dateStr < getTodayCR(referenceDate);
}

export function isSlotInPastCR(dateStr, timeStr, bufferMinutes = 0, referenceDate = new Date()) {
  const today = getTodayCR(referenceDate);
  if (dateStr < today) return true;
  if (dateStr > today) return false;

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

export function parseCRDateAndTimeToUtc(dateStr, timeStr) {
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

  return new Date(Date.UTC(year, month - 1, day, hour + 6, minute, 0));
}

export function formatCRForHacienda(date = new Date()) {
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
  const m = {};
  for (const p of parts) m[p.type] = p.value;
  let hh = m.hour;
  if (hh === '24') hh = '00';
  return `${m.year}-${m.month}-${m.day}T${hh}:${m.minute}:${m.second}-06:00`;
}

export function normalizeDateInput(inputDate, referenceDate = new Date()) {
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

describe('Timezone & Scheduling Integrity Tests (America/Costa_Rica UTC-6)', () => {

  test('1. Timezone Constants & Base Settings', () => {
    assert.equal(COSTA_RICA_TIMEZONE, 'America/Costa_Rica');
    assert.equal(COSTA_RICA_OFFSET_STRING, '-06:00');
  });

  test('2. Daytime Evaluation (10:30 AM CR)', () => {
    // 2026-10-12 10:30 AM CR = 2026-10-12 16:30 UTC
    const simulatedDate = new Date(Date.UTC(2026, 9, 12, 16, 30, 0));
    const parts = getNowCR(simulatedDate);

    assert.equal(parts.year, 2026);
    assert.equal(parts.month, 10);
    assert.equal(parts.day, 12);
    assert.equal(parts.hour, 10);
    assert.equal(parts.minute, 30);
    assert.equal(parts.dateStr, '2026-10-12');
    assert.equal(parts.timeStr, '10:30');
    assert.equal(parts.totalMinutes, (10 * 60) + 30);
    assert.equal(parts.dayOfWeek, 1); // 2026-10-12 is Monday
  });

  test('3. CRITICAL: Evening Shift Boundary (18:05 CR = 00:05 UTC Next Day)', () => {
    // 2026-10-12 18:05 CR = 2026-10-13 00:05 UTC
    const eveningUtc = new Date(Date.UTC(2026, 9, 13, 0, 5, 0));

    // Standard toISOString() has drifted to the next day!
    assert.equal(eveningUtc.toISOString().split('T')[0], '2026-10-13');

    // Our canonical helper preserves the actual local date in Costa Rica!
    const todayCR = getTodayCR(eveningUtc);
    assert.equal(todayCR, '2026-10-12', 'getTodayCR must strictly stay on Oct 12 at 18:05 CR');

    const parts = getNowCR(eveningUtc);
    assert.equal(parts.hour, 18);
    assert.equal(parts.minute, 5);
    assert.equal(parts.dateStr, '2026-10-12');
  });

  test('4. CRITICAL: Late Night Boundary (23:45 CR = 05:45 UTC Next Day)', () => {
    // 2026-10-12 23:45 CR = 2026-10-13 05:45 UTC
    const lateNightUtc = new Date(Date.UTC(2026, 9, 13, 5, 45, 0));

    // toISOString() is already deep into next day
    assert.equal(lateNightUtc.toISOString().split('T')[0], '2026-10-13');

    // getTodayCR must still be Oct 12
    const todayCR = getTodayCR(lateNightUtc);
    assert.equal(todayCR, '2026-10-12', 'getTodayCR must remain Oct 12 at 23:45 CR');

    const currentTime = getCurrentTimeCR(lateNightUtc);
    assert.equal(currentTime, '23:45');
  });

  test('5. Midnight Boundary Transition (00:01 CR = 06:01 UTC)', () => {
    // 2026-10-13 00:01 CR = 2026-10-13 06:01 UTC
    const midnightUtc = new Date(Date.UTC(2026, 9, 13, 6, 1, 0));

    const todayCR = getTodayCR(midnightUtc);
    assert.equal(todayCR, '2026-10-13', 'getTodayCR transitions to Oct 13 only after midnight CR');

    const currentTime = getCurrentTimeCR(midnightUtc);
    assert.equal(currentTime, '00:01');
  });

  test('6. Past Slot Blocking In The Same Day', () => {
    // Current time: 2026-10-12 15:00 CR (21:00 UTC)
    const refDate = new Date(Date.UTC(2026, 9, 12, 21, 0, 0));

    // Slots that already passed today
    assert.equal(isSlotInPastCR('2026-10-12', '09:00', 0, refDate), true);
    assert.equal(isSlotInPastCR('2026-10-12', '14:30', 0, refDate), true);
    assert.equal(isSlotInPastCR('2026-10-12', '15:00', 0, refDate), true);

    // Future slots today
    assert.equal(isSlotInPastCR('2026-10-12', '15:30', 0, refDate), false);
    assert.equal(isSlotInPastCR('2026-10-12', '18:00', 0, refDate), false);

    // AM/PM format support
    assert.equal(isSlotInPastCR('2026-10-12', '2:30 PM', 0, refDate), true);
    assert.equal(isSlotInPastCR('2026-10-12', '4:00 PM', 0, refDate), false);

    // Other dates
    assert.equal(isSlotInPastCR('2026-10-11', '18:00', 0, refDate), true, 'Yesterday is in the past');
    assert.equal(isSlotInPastCR('2026-10-13', '08:00', 0, refDate), false, 'Tomorrow is in the future');
  });

  test('7. Past Date Detection', () => {
    const refDate = new Date(Date.UTC(2026, 9, 12, 21, 0, 0));

    assert.equal(isDateInPastCR('2026-10-11', refDate), true);
    assert.equal(isDateInPastCR('2026-10-12', refDate), false);
    assert.equal(isDateInPastCR('2026-10-13', refDate), false);
  });

  test('8. Deterministic Day of Week (1=Mon ... 7=Sun)', () => {
    assert.equal(getDayOfWeekCR('2026-10-12'), 1);
    assert.equal(getDayOfWeekCR('2026-10-13'), 2);
    assert.equal(getDayOfWeekCR('2026-10-14'), 3);
    assert.equal(getDayOfWeekCR('2026-10-15'), 4);
    assert.equal(getDayOfWeekCR('2026-10-16'), 5);
    assert.equal(getDayOfWeekCR('2026-10-17'), 6);
    assert.equal(getDayOfWeekCR('2026-10-18'), 7);
  });

  test('9. normalizeDateInput Fallback & Parsing', () => {
    const refDate = new Date(Date.UTC(2026, 9, 13, 2, 0, 0));

    assert.equal(normalizeDateInput('', refDate), '2026-10-12');
    assert.equal(normalizeDateInput(null, refDate), '2026-10-12');
    assert.equal(normalizeDateInput(undefined, refDate), '2026-10-12');

    assert.equal(normalizeDateInput('2026-10-25'), '2026-10-25');
    assert.equal(normalizeDateInput('2026-10-25T14:30:00.000Z'), '2026-10-25');
    assert.equal(normalizeDateInput('25/10/2026'), '2026-10-25');
  });

  test('10. formatCRForHacienda Official Format (v4.4)', () => {
    const refDate = new Date(Date.UTC(2026, 9, 12, 16, 30, 45));
    const formatted = formatCRForHacienda(refDate);

    assert.match(formatted, /^2026-10-12T10:30:45-06:00$/);
    assert.ok(formatted.endsWith('-06:00'));
  });

  test('11. parseCRDateAndTimeToUtc Precision', () => {
    const utcDate = parseCRDateAndTimeToUtc('2026-10-12', '10:30');
    assert.equal(utcDate.toISOString(), '2026-10-12T16:30:00.000Z');

    const nightUtc = parseCRDateAndTimeToUtc('2026-10-12', '20:00');
    assert.equal(nightUtc.toISOString(), '2026-10-13T02:00:00.000Z');
  });

});
