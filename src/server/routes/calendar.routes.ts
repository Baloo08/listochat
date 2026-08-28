import { Router } from 'express';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { getAppointmentsByTenant } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';

const router = Router();

function formatICSDate(dateStr: string, timeStr: string): string {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = (timeStr || '09:00').replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

function calculateEndTime(dateStr: string, timeStr: string, durationMinutes: number = 45): string {
  const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);
  const totalMinutes = (hours * 60) + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMins = totalMinutes % 60;
  const cleanDate = dateStr.replace(/-/g, '');
  const endStr = `${String(endHours).padStart(2, '0')}${String(endMins).padStart(2, '0')}00`;
  return `${cleanDate}T${endStr}`;
}

function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

router.get('/:slug.ics', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).send('Negocio no encontrado');
      return;
    }

    const appointments = await getAppointmentsByTenant(tenant.id);
    const services = await getServicesByTenant(tenant.id);
    const serviceDurationMap = new Map<string, number>();

    services.forEach((s: any) => {
      serviceDurationMap.set(s.name.toLowerCase(), s.estimatedMinutes || 45);
    });

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
    const activeAppts = appointments.filter((a: any) => a.status !== 'cancelled');

    for (const appt of activeAppts) {
      const dtStart = formatICSDate(appt.date, appt.time);
      const duration = serviceDurationMap.get((appt.service || '').toLowerCase()) || 45;
      const dtEnd = calculateEndTime(appt.date, appt.time, duration);

      const summary = escapeICSText(`Cita: ${appt.name} (${appt.service})`);
      const descLines = [
        `👤 Cliente: ${appt.name}`,
        `📱 WhatsApp: ${appt.whatsapp || 'No especificado'}`,
        `🛠️ Servicio: ${appt.service}`,
        `💰 Monto: ₡${Number(appt.amount || 0).toLocaleString('es-CR')}`,
        appt.vehicleModel ? `🚗 Detalle: ${appt.vehicleModel}` : '',
        appt.details ? `📝 Notas: ${appt.details}` : '',
        `📌 Estado: ${appt.status}`
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
});

// Also support route without .ics extension
router.get('/:slug', (req, res) => {
  res.redirect(`/api/calendar/${req.params.slug}.ics`);
});

export default router;
