import { query } from './pool.js';
import { ScheduleSettings } from '../../shared/types.js';

export async function getScheduleSettings(tenantId: string): Promise<ScheduleSettings | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", schedule_mode as "scheduleMode", config_json as config, updated_at as "updatedAt"
    FROM schedule_settings
    WHERE tenant_id = $1
  `, [tenantId]);

  const defaultCustomFields = [
    { id: 'vehicleModel', label: 'Detalle o Vehículo (Opcional)', placeholder: 'Ej: Toyota RAV4 2022 o Consulta General', type: 'text' as const, required: false },
    { id: 'details', label: 'Notas o Comentarios Adicionales', placeholder: 'Cualquier indicación especial para tu cita...', type: 'textarea' as const, required: false }
  ];

  if (result.rows.length === 0) {
    // Default schedule configuration
    return {
      tenantId,
      scheduleMode: 'jornada',
      jornadaConfig: {
        startHour: '08:00',
        endHour: '17:00',
        slotMinutes: 45,
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '13:00',
        daysEnabled: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
      },
      customFields: defaultCustomFields,
      vacationConfig: {
        enabled: false,
        startDate: '',
        endDate: '',
        message: 'Estaremos cerrados temporalmente por vacaciones. ¡Pronto estaremos de vuelta!'
      }
    };
  }

  const row = result.rows[0];
  const config = row.config || {};
  return {
    id: row.id,
    tenantId: row.tenantId,
    scheduleMode: row.scheduleMode || 'jornada',
    jornadaConfig: config.jornadaConfig,
    fechasConfig: config.fechasConfig,
    bloquesConfig: config.bloquesConfig,
    customFields: Array.isArray(config.customFields) ? config.customFields : defaultCustomFields,
    vacationConfig: config.vacationConfig || {
      enabled: false,
      startDate: '',
      endDate: '',
      message: 'Estaremos cerrados temporalmente por vacaciones. ¡Pronto estaremos de vuelta!'
    },
    updatedAt: row.updatedAt
  };
}

export async function saveScheduleSettings(tenantId: string, data: Partial<ScheduleSettings>): Promise<ScheduleSettings> {
  const configJson = {
    jornadaConfig: data.jornadaConfig,
    fechasConfig: data.fechasConfig,
    bloquesConfig: data.bloquesConfig,
    customFields: data.customFields,
    vacationConfig: data.vacationConfig
  };

  const result = await query(`
    INSERT INTO schedule_settings (tenant_id, schedule_mode, config_json, updated_at)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) DO UPDATE SET
      schedule_mode = EXCLUDED.schedule_mode,
      config_json = EXCLUDED.config_json,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", schedule_mode as "scheduleMode", config_json as config, updated_at as "updatedAt"
  `, [tenantId, data.scheduleMode || 'jornada', JSON.stringify(configJson)]);

  const row = result.rows[0];
  const config = row.config || {};
  return {
    id: row.id,
    tenantId: row.tenantId,
    scheduleMode: row.scheduleMode,
    jornadaConfig: config.jornadaConfig,
    fechasConfig: config.fechasConfig,
    bloquesConfig: config.bloquesConfig,
    customFields: config.customFields,
    vacationConfig: config.vacationConfig,
    updatedAt: row.updatedAt
  };
}
