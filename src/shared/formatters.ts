/**
 * Formatters for dates and times to present clean, short, human-readable formats
 * across the dashboard, specialist portal, bookings, and customer records.
 */

const SPANISH_SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

/**
 * Formats a date string or Date object into a clean short date, e.g. "8 Set 2026".
 * Avoids raw ISO strings like "2026-09-08T00:00:00.000Z" or verbose localized strings.
 */
export function formatShortDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  try {
    let str = '';
    if (typeof dateInput === 'string') {
      str = dateInput.trim();
    } else if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      const y = dateInput.getFullYear();
      const m = SPANISH_SHORT_MONTHS[dateInput.getMonth()];
      const d = dateInput.getDate();
      return `${d} ${m} ${y}`;
    } else {
      str = String(dateInput);
    }

    const datePart = str.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${SPANISH_SHORT_MONTHS[monthIdx]} ${year}`;
      }
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getDate()} ${SPANISH_SHORT_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }

    return str;
  } catch {
    return String(dateInput || '');
  }
}

/**
 * Formats a time string into clean "HH:MM" (e.g. "09:00:00" -> "09:00").
 */
export function formatShortTime(timeInput?: string | null): string {
  if (!timeInput) return '';
  const clean = String(timeInput).trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }
  return clean;
}

/**
 * Formats a full timestamp (ISO string or Date) into "8 Set 2026, 09:00".
 */
export function formatShortDateTime(dateTimeInput?: string | Date | null): string {
  if (!dateTimeInput) return '';

  try {
    const d = dateTimeInput instanceof Date ? dateTimeInput : new Date(String(dateTimeInput));
    if (isNaN(d.getTime())) return String(dateTimeInput);

    const day = d.getDate();
    const month = SPANISH_SHORT_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${mins}`;
  } catch {
    return String(dateTimeInput || '');
  }
}

/**
 * Helper to combine date and time strings cleanly: "8 Set 2026 · 09:00".
 */
export function formatShortDateAndTime(dateStr?: string | null, timeStr?: string | null): string {
  const d = formatShortDate(dateStr);
  const t = formatShortTime(timeStr);
  if (d && t) return `${d} · ${t}`;
  return d || t || '';
}

/**
 * Helper to get local date in YYYY-MM-DD format (avoids UTC timezone shift of toISOString).
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
