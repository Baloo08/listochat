import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNowCR,
  getTodayCR,
  getCurrentTimeCR,
  getCurrentMinutesCR,
  isSlotInPastCR,
  isDateInPastCR,
  getDayOfWeekCR,
  COSTA_RICA_TIMEZONE,
  COSTA_RICA_OFFSET_STRING
} from '../services/timezone.service.js';

const router = Router();

// GET /api/timezone/diagnostic - Diagnóstico y auditoría de sincronización horaria
router.get('/diagnostic', authenticateToken, (req, res) => {
  const now = new Date();
  const cr = getNowCR(now);

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dayName = dayNames[cr.dayOfWeek - 1] || 'Lunes';

  // Detección de si UTC está en el día siguiente respecto a Costa Rica (18:00 - 23:59 CR)
  const utcDateStr = now.toISOString().split('T')[0];
  const isNightShiftActive = utcDateStr !== cr.dateStr;

  res.json({
    vpsUtcTime: now.toISOString(),
    vpsUtcHour: now.getUTCHours(),
    costaRicaLocalTime: `${cr.dateStr} ${cr.timeStr}:${String(cr.second).padStart(2, '0')}`,
    costaRicaDate: cr.dateStr,
    costaRicaTime: cr.timeStr,
    costaRicaDayOfWeek: dayName,
    costaRicaDayNumber: cr.dayOfWeek,
    offsetHours: -6,
    offsetString: COSTA_RICA_OFFSET_STRING,
    timezoneName: COSTA_RICA_TIMEZONE,
    isNightShiftActive,
    nightShiftExplanation: isNightShiftActive
      ? 'La frontera nocturna está ACTIVA: El reloj UTC del servidor ya se encuentra en el día siguiente, pero Betico mantiene estrictamente la fecha de hoy para Costa Rica.'
      : 'La sincronización diurna es nominal: Tanto el UTC como la hora local comparten el mismo día del calendario.',
    status: 'synchronized',
    statusMessage: 'Horarios sincronizados con Costa Rica (UTC-6)'
  });
});

// POST /api/timezone/simulate - Simulador interactivo para verificar cualquier fecha y hora
router.post('/simulate', authenticateToken, (req, res) => {
  const { date, time, simulatedCurrentHour, simulatedCurrentMinute } = req.body;

  let refDate = new Date();
  if (simulatedCurrentHour !== undefined && simulatedCurrentMinute !== undefined) {
    // Simular hora actual en Costa Rica
    const nowParts = getNowCR();
    const [y, m, d] = (date || nowParts.dateStr).split('-').map(Number);
    // UTC = CR + 6
    const utcHour = (Number(simulatedCurrentHour) + 6) % 24;
    refDate = new Date(Date.UTC(y, m - 1, d, utcHour, Number(simulatedCurrentMinute), 0));
  }

  const currentCR = getNowCR(refDate);
  const targetDate = date || currentCR.dateStr;
  const targetTime = time || '10:00';

  const isPastDate = isDateInPastCR(targetDate, refDate);
  const isPastSlot = isSlotInPastCR(targetDate, targetTime, 0, refDate);
  const dayNumber = getDayOfWeekCR(targetDate);
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  res.json({
    simulatedNowCR: `${currentCR.dateStr} ${currentCR.timeStr}`,
    simulatedNowDate: currentCR.dateStr,
    simulatedNowTime: currentCR.timeStr,
    targetDate,
    targetTime,
    targetDayOfWeek: dayNames[dayNumber - 1],
    isPastDate,
    isPastSlot,
    isAllowedForBooking: !isPastSlot,
    verdict: isPastSlot
      ? 'BLOQUEADO: El turno se considera horario pasado en la hora oficial de Costa Rica.'
      : 'DISPONIBLE: El turno es válido para agendamiento y no genera conflicto temporal.'
  });
});

export default router;
