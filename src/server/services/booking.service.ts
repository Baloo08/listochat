import { createAppointment, updateAppointment } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getSpecialistsByTenant } from '../db/specialists.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { query } from '../db/pool.js';
import { normalizeDateInput, isSlotInPastCR, getTodayCR, getCurrentMinutesCR, getDayOfWeekCR } from './timezone.service.js';

export async function createBookingFromCommand(tenantId: string, bookingData: any): Promise<any> {
  try {
    const services = await getServicesByTenant(tenantId);
    const matchedService = services.find(s => 
      s.name.toLowerCase().includes((bookingData.service || '').toLowerCase())
    ) || services[0];

    const price = matchedService ? matchedService.price : 0;
    const bookingDate = normalizeDateInput(bookingData.date);
    const bookingTime = bookingData.time || '10:00 AM';

    // Verify slot is not in the past (America/Costa_Rica UTC-6)
    if (isSlotInPastCR(bookingDate, bookingTime)) {
      console.warn(`[createBookingFromCommand] Rejected past slot: ${bookingDate} ${bookingTime}`);
      throw new Error(`El horario ${bookingDate} a las ${bookingTime} ya pasó en la hora de Costa Rica. Por favor selecciona una hora futura.`);
    }

    // Resolve specialist if provided
    let specialistId: string | undefined = undefined;
    if (bookingData.specialistId) {
      specialistId = bookingData.specialistId;
    } else if (bookingData.specialistName) {
      const allSpecs = await getSpecialistsByTenant(tenantId);
      const matchedSpec = allSpecs.find(s => 
        s.name.toLowerCase().includes(bookingData.specialistName.toLowerCase()) ||
        bookingData.specialistName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSpec) specialistId = matchedSpec.id;
    }

    // Verify slot collision (prevent double booking) respecting parallel capacity and specialists
    const schedule = await getScheduleSettings(tenantId);
    const maxParallelSlots = specialistId ? 1 : (schedule?.globalParallelSlots || 1);
    const normalizedTime = normalizeTo24Hour(bookingTime);

    let collisionSql = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE tenant_id = $1 AND date = $2::date 
        AND (time = $3::time OR time = $4)
        AND status NOT IN ('cancelled', 'cancelado')
    `;
    const collisionParams: any[] = [tenantId, bookingDate, normalizedTime || bookingTime, bookingTime];

    if (specialistId) {
      collisionSql += ` AND (specialist_id = $5 OR specialist_id IS NULL)`;
      collisionParams.push(specialistId);
    }

    const collisionCheck = await query(collisionSql, collisionParams);
    const currentBookedCount = parseInt(collisionCheck.rows[0]?.count || '0', 10);

    if (currentBookedCount >= maxParallelSlots) {
      console.warn(`[createBookingFromCommand] Conflict detected: Slot ${bookingDate} ${bookingTime} is fully booked (${currentBookedCount}/${maxParallelSlots}).`);
      throw new Error(`El horario ${bookingDate} a las ${bookingTime} ya se encuentra reservado.`);
    }

    // Resolve registered patient / customer record
    let recordId = bookingData.recordId;
    let customerRecord = null;
    try {
      const { getRecordByPhone, getRecordById, getRecordByIdentification, addRecordEntry } = await import('../db/records.repo.js');
      if (recordId) {
        customerRecord = await getRecordById(recordId, tenantId);
      }
      if (!customerRecord && bookingData.identification) {
        customerRecord = await getRecordByIdentification(bookingData.identification, tenantId);
      }
      if (!customerRecord && (bookingData.customerPhone || bookingData.whatsapp)) {
        customerRecord = await getRecordByPhone(bookingData.customerPhone || bookingData.whatsapp, tenantId);
      }
      if (customerRecord) {
        recordId = customerRecord.id;
        if (!bookingData.customerName || bookingData.customerName === 'Cliente WhatsApp') {
          bookingData.customerName = customerRecord.fullName;
        }
      }
    } catch (recErr) {
      console.warn('[createBookingFromCommand] Error resolving customer record:', recErr);
    }

    const appointment = await createAppointment(tenantId, {
      name: bookingData.customerName || (customerRecord ? customerRecord.fullName : 'Cliente WhatsApp'),
      whatsapp: bookingData.customerPhone || (customerRecord ? customerRecord.phone : ''),
      service: matchedService ? matchedService.name : (bookingData.service || 'Servicio General'),
      date: bookingDate,
      time: bookingTime,
      amount: Number(price),
      details: bookingData.vehicleInfo || '',
      specialistId,
      recordId: recordId || undefined,
      status: 'scheduled'
    });

    if (recordId) {
      try {
        const { addRecordEntry } = await import('../db/records.repo.js');
        await addRecordEntry(tenantId, recordId, {
          appointmentId: appointment.id,
          specialistId,
          entryType: 'consultation',
          notes: `Cita agendada automáticamente por WhatsApp para ${matchedService ? matchedService.name : 'Servicio General'} el ${bookingDate} a las ${bookingTime}.`
        });
      } catch (entryErr) {
        console.warn('[createBookingFromCommand] Error logging record entry:', entryErr);
      }
    }

    return appointment;
  } catch (error) {
    console.error('Error creating booking from command:', error);
    throw error;
  }
}

export async function cancelBookingFromWhatsApp(
  tenantId: string,
  phone: string,
  cancelDataOrDate?: any,
  serviceParam?: string
): Promise<any> {
  try {
    const clean = (phone || '').replace(/\D/g, '');
    let cancelData: { date?: string; service?: string; reason?: string; appointmentId?: string } = {};

    if (typeof cancelDataOrDate === 'string') {
      cancelData = { date: cancelDataOrDate, service: serviceParam };
    } else if (typeof cancelDataOrDate === 'object' && cancelDataOrDate !== null) {
      cancelData = cancelDataOrDate;
    }

    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params: any[] = [tenantId];
    let paramIdx = 2;

    const rawCode = cancelData.appointmentId || (phone && /^(#?APT-|[0-9a-fA-F-]{8,})/i.test(phone.trim()) ? phone.trim() : null);

    if (rawCode) {
      const cleanCode = rawCode.replace(/^#?APT-?/i, '').trim();
      sql += ` AND id::text ILIKE $${paramIdx++} || '%'`;
      params.push(cleanCode);
    } else {
      if (clean && clean.length >= 8) {
        sql += ` AND REPLACE(whatsapp, '+', '') LIKE '%' || $${paramIdx++} || '%'`;
        params.push(clean.slice(-8));
      }
      if (cancelData?.date) {
        sql += ` AND date = $${paramIdx++}::date`;
        params.push(normalizeDateInput(cancelData.date));
      }
      if (cancelData?.service) {
        sql += ` AND service ILIKE $${paramIdx++}`;
        params.push(`%${cancelData.service}%`);
      }
    }

    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);

    if (!res.rows[0]) {
      console.log(`[CancelBooking] No active appointment found for phone ${phone} matching criteria:`, cancelData);
      return null;
    }

    const appt = res.rows[0];
    const updated = await updateAppointment(appt.id, tenantId, { status: 'cancelled' });
    console.log(`[CancelBooking] Successfully cancelled appointment ${appt.id} for ${appt.name} (${appt.service} - ${appt.date} ${appt.time})`);
    return updated || { ...appt, status: 'cancelled' };
  } catch (error) {
    console.error('Error cancelling booking from WhatsApp:', error);
    return null;
  }
}

export async function rescheduleBookingFromWhatsApp(tenantId: string, phone: string, rescheduleData: any): Promise<any> {
  try {
    const clean = phone.replace(/\D/g, '');
    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params: any[] = [tenantId, clean.slice(-8)];
    let paramIdx = 3;

    if (rescheduleData?.currentDate || rescheduleData?.date) {
      sql += ` AND date = $${paramIdx++}::date`;
      params.push(rescheduleData.currentDate || rescheduleData.date);
    }
    if (rescheduleData?.service) {
      sql += ` AND service ILIKE $${paramIdx++}`;
      params.push(`%${rescheduleData.service}%`);
    }

    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);

    if (!res.rows[0]) {
      console.log(`[RescheduleBooking] No active appointment found for phone ${phone} matching criteria:`, rescheduleData);
      return null;
    }

    const appt = res.rows[0];
    const targetDate = rescheduleData.newDate || appt.date;
    const targetTime = rescheduleData.newTime || appt.time;

    // Check collision for target slot
    const collisionCheck = await query(`
      SELECT id FROM appointments 
      WHERE tenant_id = $1 AND date = $2::date AND time = $3 AND status NOT IN ('cancelled', 'cancelado') AND id != $4
      LIMIT 1
    `, [tenantId, targetDate, targetTime, appt.id]);

    if (collisionCheck.rows.length > 0) {
      console.warn(`[RescheduleBooking] Conflict detected: Target slot ${targetDate} ${targetTime} is already occupied.`);
      throw new Error(`El horario ${targetDate} a las ${targetTime} ya se encuentra ocupado.`);
    }

    const updated = await updateAppointment(appt.id, tenantId, {
      date: targetDate,
      time: targetTime,
      status: 'scheduled'
    });
    console.log(`[RescheduleBooking] Successfully moved appointment ${appt.id} (${appt.service}) to ${targetDate} ${targetTime}`);
    return updated;
  } catch (error) {
    console.error('Error rescheduling booking from WhatsApp:', error);
    return null;
  }
}

/**
 * Normaliza cualquier formato de hora (12h o 24h) a 'HH:MM' de 24 horas.
 */
export function normalizeTo24Hour(timeStr: string): string {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) {
    const isPm = /pm/i.test(clean);
    const parts = clean.replace(/am|pm/i, '').trim().split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const parts = clean.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return clean;
}

/**
 * Formatea 'HH:MM' de 24 horas a formato amigable de 12 horas 'HH:MM AM/PM'.
 */
export function format24To12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export interface AvailableSlotsResult {
  date: string;
  availableSlots: string[]; // 12h: ['08:00 AM', ...]
  availableSlots24: string[]; // 24h: ['08:00', ...]
  maxParallelSlots: number;
  totalAvailable: number;
  isClosed: boolean;
  isVacation: boolean;
  vacationMessage?: string;
  summaryText?: string;
}

/**
 * Calcula con veracidad los turnos libres para una fecha determinada,
 * cruzando los horarios configurados del comercio (jornada, recesos, días activos)
 * con las citas ya agendadas y filtrando horarios que ya hayan pasado hoy en Costa Rica.
 */
export async function calculateAvailableSlotsForDate(
  tenantId: string,
  targetDate: string,
  specialistId?: string
): Promise<AvailableSlotsResult> {
  const dateStr = normalizeDateInput(targetDate);
  const schedule = await getScheduleSettings(tenantId);
  const todayCR = getTodayCR();
  const currentMinutesNow = getCurrentMinutesCR();

  // 1. Validar si la fecha ya pasó
  if (dateStr < todayCR) {
    return {
      date: dateStr,
      availableSlots: [],
      availableSlots24: [],
      maxParallelSlots: 0,
      totalAvailable: 0,
      isClosed: true,
      isVacation: false,
      summaryText: 'Fecha pasada (no disponible para reservas)'
    };
  }

  // 2. Validar período de vacaciones
  if (schedule?.vacationConfig?.enabled) {
    const v = schedule.vacationConfig;
    if (v.startDate && v.endDate && dateStr >= v.startDate && dateStr <= v.endDate) {
      return {
        date: dateStr,
        availableSlots: [],
        availableSlots24: [],
        maxParallelSlots: 0,
        totalAvailable: 0,
        isClosed: true,
        isVacation: true,
        vacationMessage: v.message || 'Cerrado temporalmente por vacaciones',
        summaryText: 'Cerrado temporalmente por vacaciones'
      };
    }
  }

  const dayOfWeek = getDayOfWeekCR(dateStr); // 1 = Lunes, ..., 7 = Domingo
  let candidateSlots24: string[] = [];
  let isCustomSpecialist = false;

  // 2.1 Si se especificó especialista, validar si atiende hoy y si tiene horario personalizado
  if (specialistId) {
    const specRes = await query(`SELECT * FROM specialists WHERE id = $1 AND tenant_id = $2`, [specialistId, tenantId]);
    const specialist = specRes.rows[0];
    if (specialist) {
      if (specialist.active === false) {
        return {
          date: dateStr,
          availableSlots: [],
          availableSlots24: [],
          maxParallelSlots: 0,
          totalAvailable: 0,
          isClosed: true,
          isVacation: false,
          summaryText: 'El profesional no se encuentra disponible temporalmente'
        };
      }

      if (specialist.schedule_type === 'custom_per_day' && specialist.schedule_config) {
        const specCfg = typeof specialist.schedule_config === 'string' ? JSON.parse(specialist.schedule_config) : specialist.schedule_config;
        const daySchedule = specCfg.perDaySchedule?.[dayOfWeek] || specCfg.perDaySchedule?.[String(dayOfWeek)];

        if (!daySchedule || daySchedule.enabled === false) {
          return {
            date: dateStr,
            availableSlots: [],
            availableSlots24: [],
            maxParallelSlots: 0,
            totalAvailable: 0,
            isClosed: true,
            isVacation: false,
            summaryText: 'El profesional no atiende este día'
          };
        }

        isCustomSpecialist = true;
        const slotStep = (schedule?.jornadaConfig?.slotMinutes) || 45;
        const [startH, startM] = (daySchedule.startHour || '08:00').split(':').map(Number);
        const [endH, endM] = (daySchedule.endHour || '17:00').split(':').map(Number);
        let currM = (startH * 60) + startM;
        const endMinutes = (endH * 60) + endM;

        const hasBreak = Boolean(daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd);
        let breakStartM = 0;
        let breakEndM = 0;
        if (hasBreak) {
          const [bsh, bsm] = daySchedule.breakStart.split(':').map(Number);
          const [beh, bem] = daySchedule.breakEnd.split(':').map(Number);
          breakStartM = (bsh * 60) + bsm;
          breakEndM = (beh * 60) + bem;
        }

        while (currM + slotStep <= endMinutes) {
          if (hasBreak && currM < breakEndM && (currM + slotStep) > breakStartM) {
            currM = breakEndM;
            continue;
          }
          const h = Math.floor(currM / 60);
          const m = currM % 60;
          candidateSlots24.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          currM += slotStep;
        }
      }
    }
  }

  if (!isCustomSpecialist) {
    if (schedule?.scheduleMode === 'jornada' || !schedule) {
      const j = schedule?.jornadaConfig || {
        startHour: '08:00',
        endHour: '17:00',
        slotMinutes: 45,
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '13:00',
        daysEnabled: [1, 2, 3, 4, 5, 6]
      };

      if (!j.daysEnabled.includes(dayOfWeek)) {
        return {
          date: dateStr,
          availableSlots: [],
          availableSlots24: [],
          maxParallelSlots: 0,
          totalAvailable: 0,
          isClosed: true,
          isVacation: false,
          summaryText: 'Cerrado este día según horario del comercio'
        };
      }

      const [startH, startM] = (j.startHour || '08:00').split(':').map(Number);
      const [endH, endM] = (j.endHour || '17:00').split(':').map(Number);

      const dayBreak = j.perDayBreaks?.[dayOfWeek];
      const hasBreakThisDay = dayBreak !== undefined ? dayBreak.hasBreak : (j.hasBreak !== false);
      const breakStartStr = dayBreak?.breakStart || j.breakStart || '12:00';
      const breakEndStr = dayBreak?.breakEnd || j.breakEnd || '13:00';

      const [breakStartH, breakStartM] = breakStartStr.split(':').map(Number);
      const [breakEndH, breakEndM] = breakEndStr.split(':').map(Number);

      const slotStep = j.slotMinutes || 45;
      let currentMinutes = (startH * 60) + startM;
      const endMinutes = (endH * 60) + endM;
      const breakStartMinutes = (breakStartH * 60) + breakStartM;
      const breakEndMinutes = (breakEndH * 60) + breakEndM;

      while (currentMinutes + slotStep <= endMinutes) {
        if (hasBreakThisDay && currentMinutes < breakEndMinutes && (currentMinutes + slotStep) > breakStartMinutes) {
          currentMinutes = breakEndMinutes;
          continue;
        }
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        candidateSlots24.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        currentMinutes += slotStep;
      }
    } else if (schedule?.scheduleMode === 'fechas') {
      const f = schedule.fechasConfig || { enabledDates: [], slotsByDate: {} };
      if (!f.enabledDates.includes(dateStr)) {
        return {
          date: dateStr,
          availableSlots: [],
          availableSlots24: [],
          maxParallelSlots: 0,
          totalAvailable: 0,
          isClosed: true,
          isVacation: false,
          summaryText: 'Sin citas habilitadas para esta fecha'
        };
      }
      candidateSlots24 = f.slotsByDate?.[dateStr] || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    } else if (schedule?.scheduleMode === 'bloques') {
      const b = schedule.bloquesConfig || { days: {}, slotMinutes: 45 };
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const d = new Date(`${dateStr}T12:00:00Z`);
      const dayKey = dayNames[d.getUTCDay()];
      const blocks = b.days?.[dayKey] || [];
      const slotStep = b.slotMinutes || 45;

      for (const block of blocks) {
        const [bStartH, bStartM] = block.start.split(':').map(Number);
        const [bEndH, bEndM] = block.end.split(':').map(Number);
        let curr = (bStartH * 60) + bStartM;
        const end = (bEndH * 60) + bEndM;

        while (curr + slotStep <= end) {
          const h = Math.floor(curr / 60);
          const m = curr % 60;
          candidateSlots24.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          curr += slotStep;
        }
      }
    }
  }

  // 3. Consultar citas activas para determinar capacidad
  let activeApptsRows: any[] = [];
  let maxParallelSlots = 1;

  if (specialistId) {
    maxParallelSlots = 1;
    const activeAppts = await query(`
      SELECT time FROM appointments
      WHERE tenant_id = $1 AND date = $2::date AND specialist_id = $3 AND status NOT IN ('cancelled', 'cancelado')
    `, [tenantId, dateStr, specialistId]);
    activeApptsRows = activeAppts.rows;
  } else {
    maxParallelSlots = schedule?.globalParallelSlots || 1;
    const activeAppts = await query(`
      SELECT time FROM appointments
      WHERE tenant_id = $1 AND date = $2::date AND status NOT IN ('cancelled', 'cancelado')
    `, [tenantId, dateStr]);
    activeApptsRows = activeAppts.rows;
  }

  // Mapa de ocupación por hora normalizada a 24h
  const timeCountMap: Record<string, number> = {};
  for (const row of activeApptsRows) {
    const rawTime = (row.time || '').trim();
    const t24 = normalizeTo24Hour(rawTime);
    timeCountMap[t24] = (timeCountMap[t24] || 0) + 1;
    if (rawTime !== t24) {
      timeCountMap[rawTime] = (timeCountMap[rawTime] || 0) + 1;
    }
  }

  // 4. Filtrar slots pasados si es hoy, y slots saturados
  const isToday = dateStr === todayCR;
  const filteredSlots24 = candidateSlots24.filter(slot => {
    if (isToday) {
      const [sh, sm] = slot.split(':').map(Number);
      if ((sh * 60 + sm) <= currentMinutesNow) {
        return false;
      }
    }
    return (timeCountMap[slot] || 0) < maxParallelSlots;
  });

  const availableSlots12 = filteredSlots24.map(format24To12Hour);

  return {
    date: dateStr,
    availableSlots: availableSlots12,
    availableSlots24: filteredSlots24,
    maxParallelSlots,
    totalAvailable: availableSlots12.length,
    isClosed: candidateSlots24.length === 0,
    isVacation: false,
    summaryText: availableSlots12.length > 0
      ? `${availableSlots12.length} horarios libres disponibles`
      : 'No hay horarios disponibles'
  };
}

// Re-exportar alias para compatibilidad
export const getAvailableSlotsForDay = calculateAvailableSlotsForDate;
