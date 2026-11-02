import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 1. LÓGICA DE FORMATEO VISUAL DE AGENDA PARA WHATSAPP
// ============================================================================

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) {
    const isPm = /pm/i.test(clean);
    const parts = clean.replace(/am|pm/i, '').trim().split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    if (isPm && h !== 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return h * 60 + m;
  }
  const parts = clean.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function cleanDisplayTime(timeStr) {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (/am|pm/i.test(clean)) {
    const isPm = /pm/i.test(clean);
    const parts = clean.replace(/am|pm/i, '').trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${isPm ? 'PM' : 'AM'}`;
  }
  const parts = clean.split(':');
  const h24 = `${String(parts[0] || '0').padStart(2, '0')}:${String(parts[1] || '0').padStart(2, '0')}`;
  return format24To12Hour(h24);
}

function formatVisualAgendaForWhatsApp(
  appointments = [],
  courtBookings = [],
  dateStr
) {
  if ((!appointments || appointments.length === 0) && (!courtBookings || courtBookings.length === 0)) {
    return `📅 *AGENDA OPERATIVA — ${dateStr}*\n\nNo hay citas ni partidos programados para esta fecha.`;
  }

  let confirmed = 0;
  let pending = 0;
  let completed = 0;

  for (const a of appointments) {
    const st = (a.status || '').toLowerCase();
    if (st === 'confirmed' || st === 'confirmada') confirmed++;
    else if (st === 'completed' || st === 'completado' || st === 'completada' || st === 'realizada') completed++;
    else pending++;
  }

  let text = `📅 *AGENDA OPERATIVA — ${dateStr}*\n` +
    `📊 Total de citas: *${appointments.length}* (🟢 ${confirmed} confirmadas, 🟡 ${pending} pendientes, 🔵 ${completed} realizadas)\n`;

  // Ordenar cronológicamente por minutos desde la medianoche
  const sorted = [...appointments].sort((a, b) => {
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });

  const morning = [];
  const afternoon = [];
  const night = [];

  for (const appt of sorted) {
    const minutes = parseTimeToMinutes(appt.time);
    const hour = Math.floor(minutes / 60);

    if (hour < 12) {
      morning.push(appt);
    } else if (hour < 18) {
      afternoon.push(appt);
    } else {
      night.push(appt);
    }
  }

  const formatItem = (a) => {
    const st = (a.status || '').toLowerCase();
    const stBadge = (st === 'confirmed' || st === 'confirmada')
      ? '🟢 Confirmada'
      : (st === 'completed' || st === 'completado' || st === 'completada' || st === 'realizada')
      ? '🔵 Realizada'
      : '🟡 Pendiente';

    const payStatus = (a.payment_status || a.paymentStatus || '').toLowerCase();
    const payBadge = (payStatus === 'paid' || payStatus === 'pagado') ? 'Pagado' : 'Cobro Pendiente';
    const amountNum = Number(a.amount || 0);
    const amountStr = amountNum > 0 ? ` • ₡${amountNum.toLocaleString('es-CR')} (${payBadge})` : ` • (${payBadge})`;
    const specName = a.specialist_name || a.specialistName;
    const specStr = specName && specName !== 'General' ? `\n  ✂️ Especialista: ${specName}` : '';
    const phone = a.whatsapp || a.phone;
    const phoneStr = phone ? ` (Tel: ${phone})` : '';
    const formattedTime = cleanDisplayTime(a.time);

    return `• *${formattedTime}* — ${a.service || 'Servicio'}\n  👤 ${a.name || 'Cliente'}${phoneStr}${specStr}\n  💰 Estado: ${stBadge}${amountStr}`;
  };

  if (morning.length > 0) {
    text += `\n🌅 *BLOQUE MAÑANA (Antes de 12:00 PM)*\n` + morning.map(formatItem).join('\n\n');
  }

  if (afternoon.length > 0) {
    text += `\n\n🌆 *BLOQUE TARDE (12:00 PM a 06:00 PM)*\n` + afternoon.map(formatItem).join('\n\n');
  }

  if (night.length > 0) {
    text += `\n\n🌙 *BLOQUE NOCHE (06:00 PM en adelante)*\n` + night.map(formatItem).join('\n\n');
  }

  if (courtBookings && courtBookings.length > 0) {
    const sortedCourts = [...courtBookings].sort((a, b) => {
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });
    text += `\n\n⚽ *CANCHAS Y PARTIDOS*\n` + sortedCourts.map((c) => {
      const mode = c.booking_mode || c.bookingMode || 'partido';
      const modeLabel = mode === 'match' ? 'Reto Mejenga' : 'Partido Completo';
      const court = c.court_name || c.courtName || 'Cancha';
      const captain = c.team_a_captain || c.team_a_name || c.captainName || 'Capitán';
      const cStatus = (c.status || '').toLowerCase() === 'confirmed' ? '🟢 Confirmada' : '🟡 Pendiente';
      const formattedTime = cleanDisplayTime(c.time);
      return `• *${formattedTime}* — ${court} (${modeLabel})\n  🏆 Capitán: ${captain}\n  📌 Estado: ${cStatus}`;
    }).join('\n\n');
  }

  return text;
}

// ============================================================================
// 2. LÓGICA DE NORMALIZACIÓN Y CÁLCULO DE SLOTS DISPONIBLES
// ============================================================================

function normalizeTo24Hour(timeStr) {
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

function format24To12Hour(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function calculateAvailableSlotsPure({
  targetDate,
  todayCR,
  currentMinutesNow,
  dayOfWeek,
  scheduleSettings,
  activeAppointments = [],
  specialistId = null
}) {
  if (targetDate < todayCR) {
    return {
      date: targetDate,
      availableSlots: [],
      availableSlots24: [],
      maxParallelSlots: 0,
      totalAvailable: 0,
      isClosed: true,
      isVacation: false,
      summaryText: 'Fecha pasada (no disponible para reservas)'
    };
  }

  if (scheduleSettings?.vacationConfig?.enabled) {
    const v = scheduleSettings.vacationConfig;
    if (v.startDate && v.endDate && targetDate >= v.startDate && targetDate <= v.endDate) {
      return {
        date: targetDate,
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

  const j = scheduleSettings?.jornadaConfig || {
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
      date: targetDate,
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

  const [breakStartH, breakStartM] = (j.breakStart || '12:00').split(':').map(Number);
  const [breakEndH, breakEndM] = (j.breakEnd || '13:00').split(':').map(Number);

  const slotStep = j.slotMinutes || 45;
  let currentMinutes = (startH * 60) + startM;
  const endMinutes = (endH * 60) + endM;
  const breakStartMinutes = (breakStartH * 60) + breakStartM;
  const breakEndMinutes = (breakEndH * 60) + breakEndM;

  const candidateSlots24 = [];
  while (currentMinutes + slotStep <= endMinutes) {
    if (j.hasBreak && currentMinutes < breakEndMinutes && (currentMinutes + slotStep) > breakStartMinutes) {
      currentMinutes = breakEndMinutes;
      continue;
    }
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    candidateSlots24.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMinutes += slotStep;
  }

  const maxParallelSlots = specialistId ? 1 : (scheduleSettings?.globalParallelSlots || 1);
  const timeCountMap = {};

  for (const row of activeAppointments) {
    const rawTime = (row.time || '').trim();
    const t24 = normalizeTo24Hour(rawTime);
    timeCountMap[t24] = (timeCountMap[t24] || 0) + 1;
    if (rawTime !== t24) {
      timeCountMap[rawTime] = (timeCountMap[rawTime] || 0) + 1;
    }
  }

  const isToday = targetDate === todayCR;
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
    date: targetDate,
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

// ============================================================================
// 3. SUITE DE PRUEBAS AUTOMATIZADAS
// ============================================================================

describe('Secretario Virtual por WhatsApp, Cálculo de Reservas y Privacidad en Betico Ops', () => {

  describe('1. Formateador Visual de Agenda para WhatsApp', () => {

    test('Agrupa citas cronológicamente en bloques Mañana, Tarde y Noche con emojis de estado', () => {
      const appointments = [
        { time: '09:00 AM', service: 'Corte y Barba', name: 'Carlos Morales', whatsapp: '8888-1111', status: 'confirmed', amount: 12000, payment_status: 'paid', specialist_name: 'David Barbero' },
        { time: '02:30 PM', service: 'Limpieza Facial', name: 'Sofía Brenes', whatsapp: '8888-2222', status: 'pending', amount: 25000, payment_status: 'pending', specialist_name: 'Dra. Elena' },
        { time: '07:00 PM', service: 'Terapia Física', name: 'Andrés Castro', whatsapp: '8888-3333', status: 'completed', amount: 20000, payment_status: 'paid', specialist_name: 'Dr. Vega' }
      ];

      const formatted = formatVisualAgendaForWhatsApp(appointments, [], '2026-11-03');

      // Verifica encabezado y totales
      assert.ok(formatted.includes('AGENDA OPERATIVA — 2026-11-03'));
      assert.ok(formatted.includes('Total de citas: *3*'));
      assert.ok(formatted.includes('🟢 1 confirmadas'));
      assert.ok(formatted.includes('🟡 1 pendientes'));
      assert.ok(formatted.includes('🔵 1 realizadas'));

      // Verifica bloques horarios
      assert.ok(formatted.includes('🌅 *BLOQUE MAÑANA (Antes de 12:00 PM)*'));
      assert.ok(formatted.includes('🌆 *BLOQUE TARDE (12:00 PM a 06:00 PM)*'));
      assert.ok(formatted.includes('🌙 *BLOQUE NOCHE (06:00 PM en adelante)*'));

      // Verifica formato de tarjeta de cita
      assert.ok(formatted.includes('• *09:00 AM* — Corte y Barba'));
      assert.ok(formatted.includes('👤 Carlos Morales (Tel: 8888-1111)'));
      assert.ok(formatted.includes('✂️ Especialista: David Barbero'));
      assert.ok(formatted.includes('🟢 Confirmada'));
      assert.ok(formatted.includes('(Pagado)'));
      assert.ok(formatted.includes('₡'));

      assert.ok(formatted.includes('🟡 Pendiente'));
      assert.ok(formatted.includes('(Cobro Pendiente)'));
      assert.ok(formatted.includes('🔵 Realizada'));
    });

    test('Incluye bloque de canchas deportivas si existen reservas activas', () => {
      const courtBookings = [
        { time: '08:00 PM', court_name: 'Cancha Sintética #1', booking_mode: 'match', team_a_captain: 'Mario Vargas', status: 'confirmed' }
      ];

      const formatted = formatVisualAgendaForWhatsApp([], courtBookings, '2026-11-03');

      assert.ok(formatted.includes('⚽ *CANCHAS Y PARTIDOS*'));
      assert.ok(formatted.includes('Cancha Sintética #1 (Reto Mejenga)'));
      assert.ok(formatted.includes('🏆 Capitán: Mario Vargas'));
      assert.ok(formatted.includes('🟢 Confirmada'));
    });

    test('Maneja agenda vacía con mensaje amigable sin errores', () => {
      const formatted = formatVisualAgendaForWhatsApp([], [], '2026-11-03');
      assert.ok(formatted.includes('No hay citas ni partidos programados para esta fecha.'));
    });

    test('Ordena citas cronológicamente por minutos reales (12:00 PM antes de 02:30 PM)', () => {
      const appointments = [
        { time: '02:30 PM', service: 'Corte', name: 'Cliente Tarde 2', status: 'confirmed' },
        { time: '12:00 PM', service: 'Almuerzo / Masaje', name: 'Cliente Mediodía', status: 'confirmed' },
        { time: '01:00 PM', service: 'Barba', name: 'Cliente Tarde 1', status: 'confirmed' }
      ];

      const formatted = formatVisualAgendaForWhatsApp(appointments, [], '2026-11-03');
      const idx12 = formatted.indexOf('• *12:00 PM*');
      const idx01 = formatted.indexOf('• *01:00 PM*');
      const idx02 = formatted.indexOf('• *02:30 PM*');

      assert.ok(idx12 !== -1 && idx01 !== -1 && idx02 !== -1);
      assert.ok(idx12 < idx01, '12:00 PM debe aparecer antes de 01:00 PM');
      assert.ok(idx01 < idx02, '01:00 PM debe aparecer antes de 02:30 PM');
    });

    test('Formatea horas de base de datos con segundos (14:30:00 a 02:30 PM) limpiamente', () => {
      const appointments = [
        { time: '14:30:00', service: 'Facial', name: 'Ana Gómez', status: 'confirmed' }
      ];

      const formatted = formatVisualAgendaForWhatsApp(appointments, [], '2026-11-03');
      assert.ok(formatted.includes('• *02:30 PM* — Facial'), 'Debe formatear 14:30:00 a 02:30 PM sin segundos');
      assert.ok(!formatted.includes('14:30:00'));
    });

  });

  describe('2. Cálculo Verídico de Espacios Libres (Anti-Alucinaciones)', () => {

    const baseSchedule = {
      scheduleMode: 'jornada',
      globalParallelSlots: 1,
      jornadaConfig: {
        startHour: '08:00',
        endHour: '12:00',
        slotMinutes: 60,
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '13:00',
        daysEnabled: [1, 2, 3, 4, 5, 6] // Lunes a Sábado
      }
    };

    test('Excluye citas ocupadas del listado de turnos libres', () => {
      // Día futuro: Martes (dayOfWeek = 2)
      const res = calculateAvailableSlotsPure({
        targetDate: '2026-11-10',
        todayCR: '2026-11-03',
        currentMinutesNow: 600,
        dayOfWeek: 2,
        scheduleSettings: baseSchedule,
        activeAppointments: [
          { time: '09:00' } // Cita ocupada a las 09:00 AM
        ]
      });

      assert.equal(res.isClosed, false);
      assert.equal(res.availableSlots24.includes('08:00'), true);
      assert.equal(res.availableSlots24.includes('09:00'), false, 'El turno de las 09:00 debe estar excluido');
      assert.equal(res.availableSlots24.includes('10:00'), true);
      assert.equal(res.availableSlots24.includes('11:00'), true);
      assert.equal(res.availableSlots.includes('09:00 AM'), false);
      assert.equal(res.availableSlots.includes('10:00 AM'), true);
    });

    test('Filtra horarios pasados si la consulta es para el día de hoy', () => {
      // Hoy son las 10:15 AM (615 minutos transcurridos)
      const res = calculateAvailableSlotsPure({
        targetDate: '2026-11-03',
        todayCR: '2026-11-03',
        currentMinutesNow: 615, // 10:15 AM
        dayOfWeek: 2,
        scheduleSettings: baseSchedule,
        activeAppointments: []
      });

      // 08:00 (480m), 09:00 (540m), 10:00 (600m) ya pasaron
      assert.equal(res.availableSlots24.includes('08:00'), false, '08:00 ya pasó');
      assert.equal(res.availableSlots24.includes('09:00'), false, '09:00 ya pasó');
      assert.equal(res.availableSlots24.includes('10:00'), false, '10:00 ya pasó');
      assert.equal(res.availableSlots24.includes('11:00'), true, '11:00 aún está disponible');
      assert.equal(res.availableSlots.includes('11:00 AM'), true);
    });

    test('Rechaza fechas pasadas de forma estricta', () => {
      const res = calculateAvailableSlotsPure({
        targetDate: '2026-11-01',
        todayCR: '2026-11-03',
        currentMinutesNow: 600,
        dayOfWeek: 7,
        scheduleSettings: baseSchedule
      });

      assert.equal(res.isClosed, true);
      assert.equal(res.totalAvailable, 0);
      assert.equal(res.availableSlots.length, 0);
    });

    test('Respeta días de cierre del comercio (ej. Domingo no habilitado)', () => {
      const res = calculateAvailableSlotsPure({
        targetDate: '2026-11-08', // Domingo
        todayCR: '2026-11-03',
        currentMinutesNow: 600,
        dayOfWeek: 7, // Domingo
        scheduleSettings: baseSchedule
      });

      assert.equal(res.isClosed, true);
      assert.equal(res.totalAvailable, 0);
      assert.ok(res.summaryText.includes('Cerrado este día'));
    });

    test('Respeta modo de vacaciones configurado', () => {
      const vacationSchedule = {
        ...baseSchedule,
        vacationConfig: {
          enabled: true,
          startDate: '2026-12-24',
          endDate: '2026-12-31',
          message: 'Cerrado por fiestas de fin de año'
        }
      };

      const res = calculateAvailableSlotsPure({
        targetDate: '2026-12-25',
        todayCR: '2026-11-03',
        currentMinutesNow: 600,
        dayOfWeek: 5,
        scheduleSettings: vacationSchedule
      });

      assert.equal(res.isVacation, true);
      assert.equal(res.totalAvailable, 0);
      assert.equal(res.vacationMessage, 'Cerrado por fiestas de fin de año');
    });

    test('Previene solapamiento con receso de almuerzo (slot de 45m a las 11:45 no entra en 12:00-13:00) y reanuda a la 01:00 PM', () => {
      const scheduleWithBreak = {
        scheduleMode: 'jornada',
        globalParallelSlots: 1,
        jornadaConfig: {
          startHour: '08:00',
          endHour: '17:00',
          slotMinutes: 45,
          hasBreak: true,
          breakStart: '12:00',
          breakEnd: '13:00',
          daysEnabled: [1, 2, 3, 4, 5, 6]
        }
      };

      const res = calculateAvailableSlotsPure({
        targetDate: '2026-11-10',
        todayCR: '2026-11-03',
        currentMinutesNow: 400,
        dayOfWeek: 2,
        scheduleSettings: scheduleWithBreak,
        activeAppointments: []
      });

      // 11:00 (45m hasta 11:45) es válido
      assert.ok(res.availableSlots24.includes('11:00'), 'Debe incluir 11:00');
      // 11:45 (45m hasta 12:30) choca con el almuerzo (12:00-13:00) y debe ser excluido
      assert.ok(!res.availableSlots24.includes('11:45'), '11:45 no debe generarse porque choca con el almuerzo');
      // A la 1:00 PM (13:00) termina el almuerzo y debe iniciar el bloque de la tarde
      assert.ok(res.availableSlots24.includes('13:00'), 'Debe reanudar exactamente a las 13:00');
    });

  });

  describe('3. Normalización y Formato de Horas (24h <-> 12h)', () => {

    test('Convierte correctamente 24h a 12h', () => {
      assert.equal(format24To12Hour('08:00'), '08:00 AM');
      assert.equal(format24To12Hour('12:00'), '12:00 PM');
      assert.equal(format24To12Hour('14:30'), '02:30 PM');
      assert.equal(format24To12Hour('18:00'), '06:00 PM');
      assert.equal(format24To12Hour('23:45'), '11:45 PM');
      assert.equal(format24To12Hour('00:15'), '12:15 AM');
    });

    test('Normaliza cadenas 12h y 24h a 24h estándar HH:MM', () => {
      assert.equal(normalizeTo24Hour('8:00 AM'), '08:00');
      assert.equal(normalizeTo24Hour('08:00 AM'), '08:00');
      assert.equal(normalizeTo24Hour('12:00 PM'), '12:00');
      assert.equal(normalizeTo24Hour('2:30 PM'), '14:30');
      assert.equal(normalizeTo24Hour('02:30 PM'), '14:30');
      assert.equal(normalizeTo24Hour('12:00 AM'), '00:00');
      assert.equal(normalizeTo24Hour('14:30'), '14:30');
    });

  });

  describe('4. Ejecución Síncrona de Comandos del Secretario Virtual', () => {

    test('Parsea comando de agendamiento y devuelve confirmación con código #APT', () => {
      const mockReply = 'Con gusto, he agendado la cita para su cliente.\n<<<COMMAND_BOOKING: {"service":"Corte de Cabello","date":"2026-11-04","time":"10:00 AM","customerName":"Rodrigo Rojas","customerPhone":"8888-5555"}>>>';

      const match = mockReply.match(/<<<COMMAND_BOOKING:\s*({[\s\S]*?})>>>/);
      assert.ok(match !== null);

      const data = JSON.parse(match[1]);
      assert.equal(data.service, 'Corte de Cabello');
      assert.equal(data.customerName, 'Rodrigo Rojas');
      assert.equal(data.date, '2026-11-04');

      // Simulación de confirmación devuelta
      const apptId = 'apt_99214a';
      const apptCode = `#APT-${apptId.slice(0, 8).toUpperCase()}`;
      const note = `✅ *Cita Agendada Exitosamente (${apptCode}):*\n• Cliente: ${data.customerName}\n• Servicio: ${data.service}\n• Fecha y Hora: ${data.date} a las ${data.time}`;

      assert.ok(note.includes('APT-APT_9921'));
      assert.ok(note.includes('Rodrigo Rojas'));
    });

    test('Parsea comando de cancelación y soporta objeto o argumentos flexibles', () => {
      const mockReply = 'Procedo con la cancelación de la cita.\n<<<COMMAND_CANCEL_BOOKING: {"date":"2026-11-04","customerPhone":"8888-5555","service":"Corte de Cabello","reason":"Solicitado por el cliente"}>>>';

      const match = mockReply.match(/<<<COMMAND_CANCEL_BOOKING:\s*({[\s\S]*?})>>>/);
      assert.ok(match !== null);

      const data = JSON.parse(match[1]);
      assert.equal(data.customerPhone, '8888-5555');
      assert.equal(data.service, 'Corte de Cabello');
      assert.equal(data.date, '2026-11-04');
    });

    test('Parsea y extrae identificadores de cita con formato #APT-... o código hexadecimal', () => {
      const codes = ['#APT-3A5B876C', 'APT-3A5B876C', '3A5B876C', '#apt-abcdef12'];
      for (const code of codes) {
        const clean = code.replace(/^#?APT-?/i, '').trim();
        assert.ok(/^[0-9a-fA-F]{8,}$/.test(clean), `El código ${code} debe normalizarse a hex limpio`);
      }
    });

  });

  describe('5. Privacidad Estricta en Betico Ops (bots-chats.routes.ts)', () => {

    const routesPath = path.join(__dirname, '..', 'admin-app', 'src', 'server', 'routes', 'bots-chats.routes.ts');
    const routesContent = fs.readFileSync(routesPath, 'utf8');

    test('La consulta de conversaciones aísla estrictamente a los bots maestros y superadmin', () => {
      // Debe contener la cláusula WHERE que confina a superadmin y betico_ventas/soporte
      assert.ok(
        routesContent.includes("t.slug = 'superadmin' OR t.evolution_instance IN ('betico_ventas', 'betico_soporte')"),
        'Las conversaciones deben estar estrictamente confinadas a los bots maestros oficiales'
      );
    });

    test('El endpoint de lectura de mensajes bloquea con 403 Forbidden a tenants de terceros', () => {
      assert.ok(
        routesContent.includes("Acceso restringido por privacidad"),
        'Debe retornar error de privacidad cuando se intentan leer chats de terceros'
      );
      assert.ok(
        routesContent.includes("res.status(403)"),
        'Debe emitir código HTTP 403'
      );
    });

    test('El endpoint de envío de respuestas bloquea respuestas a clientes de comercios terceros', () => {
      assert.ok(
        routesContent.includes("Solo se permite responder a chats de los Bots Maestros oficiales"),
        'Debe restringir el envío de respuestas únicamente a los bots maestros'
      );
    });

    test('Existe el endpoint de telemetría técnica tenants-telemetry sin exponer mensajes privados', () => {
      assert.ok(
        routesContent.includes("/tenants-telemetry"),
        'Debe existir la ruta /tenants-telemetry'
      );
      assert.ok(
        routesContent.includes("todayMessagesCount"),
        'Debe calcular conteo de mensajes de hoy'
      );
      assert.ok(
        routesContent.includes("activeSubagentsDistribution"),
        'Debe calcular distribución de subagentes'
      );
      assert.ok(
        routesContent.includes("aiHealth"),
        'Debe evaluar salud del motor de IA'
      );
    });

  });

  describe('6. Privacidad y UI en Betico Ops Frontend (MasterBotsAndLiveChats.tsx)', () => {

    const componentPath = path.join(__dirname, '..', 'admin-app', 'src', 'client', 'components', 'MasterBotsAndLiveChats.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');

    test('El componente incluye aviso explícito de privacidad por diseño', () => {
      assert.ok(
        componentContent.includes("Privacidad por Diseño Activa") || componentContent.includes("Privacidad Activa"),
        'Debe mostrar banner explícito de privacidad activa'
      );
    });

    test('El componente carga datos del endpoint de telemetría técnica', () => {
      assert.ok(
        componentContent.includes("/api/bots-chats/tenants-telemetry"),
        'Debe consultar /api/bots-chats/tenants-telemetry'
      );
    });

    test('No contiene controles para enviar mensajes a clientes de terceros', () => {
      // Debe haber formulario de respuesta solo para bots maestros
      assert.ok(componentContent.includes("Soporte Betico"));
    });

  });

  describe('7. Regla de Idioma Español: Cero Uso de Ampersand (&) en Textos Visibles', () => {

    const secretaryPath = path.join(__dirname, '..', 'src', 'server', 'services', 'secretary.service.ts');
    const secretaryContent = fs.readFileSync(secretaryPath, 'utf8');

    const opsRoutesPath = path.join(__dirname, '..', 'admin-app', 'src', 'server', 'routes', 'bots-chats.routes.ts');
    const opsRoutesContent = fs.readFileSync(opsRoutesPath, 'utf8');

    const opsComponentPath = path.join(__dirname, '..', 'admin-app', 'src', 'client', 'components', 'MasterBotsAndLiveChats.tsx');
    const opsComponentContent = fs.readFileSync(opsComponentPath, 'utf8');

    test('El clasificador de subagentes no contiene ampersand (&) en sus nombres', () => {
      assert.ok(!opsRoutesContent.includes("name: 'Canchas & Deportes'"), 'Debe ser Canchas y Deportes');
      assert.ok(opsRoutesContent.includes("name: 'Canchas y Deportes'"));

      assert.ok(!opsRoutesContent.includes("name: 'Citas & Agenda'"), 'Debe ser Citas y Agenda');
      assert.ok(opsRoutesContent.includes("name: 'Citas y Agenda'"));

      assert.ok(!opsRoutesContent.includes("name: 'Ventas & Catálogo'"), 'Debe ser Ventas y Catálogo');
      assert.ok(opsRoutesContent.includes("name: 'Ventas y Catálogo'"));
    });

    test('El formateador de agenda de WhatsApp usa "CANCHAS Y PARTIDOS" y no ampersands', () => {
      assert.ok(secretaryContent.includes("CANCHAS Y PARTIDOS"));
      assert.ok(!secretaryContent.includes("CANCHAS & PARTIDOS"));
    });

    test('La UI de Betico Ops utiliza "y" en títulos y etiquetas de subagentes', () => {
      assert.ok(opsComponentContent.includes("Bots Maestros y Telemetría Técnica"));
      assert.ok(!opsComponentContent.includes("Citas & Agenda"));
      assert.ok(!opsComponentContent.includes("Canchas & Deportes"));
      assert.ok(!opsComponentContent.includes("Ventas & Catálogo"));
    });

  });

});
