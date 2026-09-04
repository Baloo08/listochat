import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getAppointmentsByTenant } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';

const router = Router();

function normalizeDateStr(dateVal: any): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }
  return String(dateVal).split('T')[0].trim();
}

function formatICSDate(dateVal: any, timeVal: any): string {
  const dateStr = normalizeDateStr(dateVal);
  const cleanDate = dateStr.replace(/\D/g, '');
  const timeStr = String(timeVal || '09:00').trim();
  const [h = '09', m = '00'] = timeStr.split(':');
  return `${cleanDate}T${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

function calculateEndTime(dateVal: any, timeVal: any, durationMinutes: number = 45): string {
  const dateStr = normalizeDateStr(dateVal);
  const cleanDate = dateStr.replace(/\D/g, '');
  const timeStr = String(timeVal || '09:00').trim();
  const [hStr = '09', mStr = '00'] = timeStr.split(':');
  const hours = parseInt(hStr, 10) || 9;
  const minutes = parseInt(mStr, 10) || 0;
  const totalMinutes = (hours * 60) + minutes + (durationMinutes || 45);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  return `${cleanDate}T${String(endHours).padStart(2, '0')}${String(endMins).padStart(2, '0')}00`;
}

function escapeICSText(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

async function handleICSRequest(req: any, res: any, slug: string, tokenParam?: string) {
  try {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      res.status(404).send('Negocio no encontrado');
      return;
    }

    const expectedToken = (tenant as any).calendarToken || (tenant as any).calendar_token;
    const providedToken = tokenParam || (req.query.token as string) || (req.headers['x-calendar-token'] as string);

    if (expectedToken && providedToken !== expectedToken) {
      res.status(403).send('Acceso no autorizado al feed de calendario. Token inválido o ausente.');
      return;
    }

    const appointments = await getAppointmentsByTenant(tenant.id);
    const services = await getServicesByTenant(tenant.id);
    const serviceDurationMap = new Map<string, number>();

    if (Array.isArray(services)) {
      services.forEach((s: any) => {
        if (s?.name) {
          serviceDurationMap.set(String(s.name).toLowerCase().trim(), s.estimatedMinutes || 45);
        }
      });
    }

    const nowICS = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const calName = escapeICSText(`Citas - ${tenant.name}`);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Betico SaaS//Agenda Citas v1.0//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      'X-WR-TIMEZONE:America/Costa_Rica',
      'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
      'X-PUBLISHED-TTL:PT15M'
    ];

    // Filter out cancelled appointments
    const activeAppts = Array.isArray(appointments) ? appointments.filter((a: any) => a && a.status !== 'cancelled') : [];

    for (const appt of activeAppts) {
      const dtStart = formatICSDate(appt.date, appt.time);
      const svcKey = String(appt.service || '').toLowerCase().trim();
      const duration = serviceDurationMap.get(svcKey) || 45;
      const dtEnd = calculateEndTime(appt.date, appt.time, duration);

      const summary = escapeICSText(`Cita reservada: ${appt.service || 'Servicio'}`);
      const descLines = [
        `🛠️ Servicio: ${appt.service || 'Servicio'}`,
        `⏱️ Duración estimada: ${duration} min`,
        `📌 Estado: ${appt.status === 'confirmed' ? 'Confirmada' : 'Programada'}`
      ].filter(Boolean).join('\n');

      const escapedDesc = escapeICSText(descLines);

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:appt_${appt.id}@betico.cr`);
      icsContent.push(`DTSTAMP:${nowICS}`);
      icsContent.push(`DTSTART:${dtStart}`);
      icsContent.push(`DTEND:${dtEnd}`);
      icsContent.push(`SUMMARY:${summary}`);
      icsContent.push(`DESCRIPTION:${escapedDesc}`);
      icsContent.push(`STATUS:${appt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`);
      icsContent.push('END:VEVENT');
    }

    icsContent.push('END:VCALENDAR');

    const result = icsContent.join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${tenant.slug}-citas.ics"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(result);
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    res.status(500).send('Error generando calendario');
  }
}

// Ruta con token en la ruta: /api/calendar/:slug/:token.ics
router.get('/:slug/:token.ics', async (req, res) => {
  await handleICSRequest(req, res, req.params.slug, req.params.token);
});

// Ruta con slug y token en query string: /api/calendar/:slug.ics?token=...
router.get('/:slug.ics', async (req, res) => {
  await handleICSRequest(req, res, req.params.slug, req.query.token as string);
});

// Also support route without .ics extension
router.get('/:slug', (req, res) => {
  const tokenQuery = req.query.token ? `?token=${encodeURIComponent(req.query.token as string)}` : '';
  res.redirect(`/api/calendar/${req.params.slug}.ics${tokenQuery}`);
});

export default router;
