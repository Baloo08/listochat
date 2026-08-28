import { query } from '../db/pool.js';
import { sendMessage } from './evolution.js';
import { ReminderConfig } from '../../shared/types.js';

const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  firstReminderEnabled: true,
  firstReminderHoursBefore: 24,
  firstReminderTemplate: '👋 Hola *{{nombre}}*, te recordamos tu cita para *{{servicio}}* agendada para el día *{{fecha}}* a las *{{hora}}* en *{{negocio}}*. ¡Te esperamos!',
  secondReminderEnabled: true,
  secondReminderHoursBefore: 2,
  secondReminderTemplate: '⏰ Hola *{{nombre}}*, tu cita para *{{servicio}}* en *{{negocio}}* es hoy a las *{{hora}}* (en unas {{horas}} horas). Si necesitas reagendar, avísanos con tiempo.'
};

export function startReminderScheduler() {
  console.log('[ReminderService] Starting automated appointment reminder scheduler (interval: 3 mins)...');
  
  // Run once on startup after 10 seconds, then every 3 minutes
  setTimeout(checkAndSendReminders, 10000);
  setInterval(checkAndSendReminders, 3 * 60 * 1000);
}

async function checkAndSendReminders() {
  try {
    // 1. Fetch tenants with an active evolution instance
    const tenantsRes = await query(`
      SELECT id, name, slug, evolution_instance as "evolutionInstance", 
             reminder_config as "reminderConfig", settings_json as "settingsJson"
      FROM tenants 
      WHERE active = true AND evolution_instance IS NOT NULL AND evolution_instance != ''
    `);

    if (tenantsRes.rows.length === 0) return;

    const now = new Date();

    for (const tenant of tenantsRes.rows) {
      try {
        const config: ReminderConfig = {
          ...DEFAULT_REMINDER_CONFIG,
          ...(tenant.reminderConfig || tenant.settingsJson?.reminderConfig || {})
        };

        if (!config.enabled) continue;

        // 2. Fetch upcoming appointments for this tenant for today and the next 3 days
        const apptsRes = await query(`
          SELECT id, name, whatsapp, service, date, time, amount, details, vehicle_model as "vehicleModel",
                 reminder_1_sent as "reminder1Sent", reminder_2_sent as "reminder2Sent"
          FROM appointments
          WHERE tenant_id = $1 
            AND status IN ('pending', 'scheduled', 'confirmed')
            AND date >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
            AND date <= TO_CHAR(CURRENT_DATE + INTERVAL '3 days', 'YYYY-MM-DD')
        `, [tenant.id]);

        for (const appt of apptsRes.rows) {
          if (!appt.whatsapp || !appt.date || !appt.time) continue;

          // Parse appointment datetime
          // date: YYYY-MM-DD, time: HH:MM
          const [year, month, day] = appt.date.split('-').map(Number);
          const [hour, minute] = appt.time.split(':').map(Number);
          const apptDate = new Date(year, month - 1, day, hour, minute || 0);

          const diffMs = apptDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // If appointment has already passed, skip
          if (diffHours < 0) continue;

          const cleanPhone = appt.whatsapp.replace(/\D/g, '');
          if (!cleanPhone) continue;

          const replacePlaceholders = (template: string, hoursRemaining: number) => {
            return template
              .replace(/\{\{nombre\}\}/gi, appt.name || 'estimado cliente')
              .replace(/\{\{servicio\}\}/gi, appt.service || 'su cita')
              .replace(/\{\{fecha\}\}/gi, appt.date)
              .replace(/\{\{hora\}\}/gi, appt.time)
              .replace(/\{\{negocio\}\}/gi, tenant.name)
              .replace(/\{\{monto\}\}/gi, appt.amount ? `₡${Number(appt.amount).toLocaleString('es-CR')}` : '')
              .replace(/\{\{detalles\}\}/gi, appt.vehicleModel || appt.details || '')
              .replace(/\{\{horas\}\}/gi, String(Math.round(hoursRemaining)));
          };

          // 1st Reminder (e.g. 24h before)
          if (
            config.firstReminderEnabled && 
            !appt.reminder1Sent && 
            diffHours <= config.firstReminderHoursBefore &&
            diffHours > (config.secondReminderEnabled ? config.secondReminderHoursBefore : 0)
          ) {
            const message = replacePlaceholders(config.firstReminderTemplate, diffHours);
            const sent = await sendMessage(tenant.evolutionInstance, cleanPhone, message);
            if (sent.success) {
              await query(`UPDATE appointments SET reminder_1_sent = true WHERE id = $1`, [appt.id]);
              console.log(`[ReminderService] Sent 1st reminder (${config.firstReminderHoursBefore}h) for appt ${appt.id} to ${cleanPhone}`);
            }
          }

          // 2nd Reminder (e.g. 2h before)
          if (
            config.secondReminderEnabled && 
            !appt.reminder2Sent && 
            diffHours <= config.secondReminderHoursBefore &&
            diffHours > 0
          ) {
            const message = replacePlaceholders(config.secondReminderTemplate, diffHours);
            const sent = await sendMessage(tenant.evolutionInstance, cleanPhone, message);
            if (sent.success) {
              await query(`UPDATE appointments SET reminder_2_sent = true, reminder_1_sent = true WHERE id = $1`, [appt.id]);
              console.log(`[ReminderService] Sent 2nd reminder (${config.secondReminderHoursBefore}h) for appt ${appt.id} to ${cleanPhone}`);
            }
          }
        }
      } catch (tErr) {
        console.error(`[ReminderService] Error processing reminders for tenant ${tenant.id}:`, tErr);
      }
    }
  } catch (err) {
    console.error('[ReminderService] General error in checkAndSendReminders:', err);
  }
}
