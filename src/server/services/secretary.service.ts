import { query } from '../db/pool.js';
import { getTenantById } from '../db/tenant.repo.js';
import { sendMessage } from './evolution.js';
import { saveChatMessage } from '../db/chats.repo.js';
import { decrypt } from './encryption.js';
import { callAI } from './ai-provider.js';
import {
  getAuthorizedPhoneByNumber,
  verifyPin,
  resetFailedAttempts,
  registerFailedPinAttempt,
  getSecretarySession,
  authenticateSecretarySession
} from '../db/secretary.repo.js';
import { getTodayCR, getCurrentTimeCR, getNowCR, getTomorrowCR } from './timezone.service.js';
import {
  createBookingFromCommand,
  cancelBookingFromWhatsApp,
  calculateAvailableSlotsForDate,
  format24To12Hour,
  AvailableSlotsResult
} from './booking.service.js';
import { createBooking as createCourtBooking, getCourtsByTenant } from '../db/courts.repo.js';

export interface SecretaryProcessResult {
  handled: boolean;
  replyText?: string;
  status: 'authenticated' | 'challenge_sent' | 'locked' | 'byok_required' | 'ai_replied';
}

/**
 * Convierte cualquier formato de hora (12h con AM/PM o 24h con o sin segundos) a minutos desde la medianoche (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
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

/**
 * Limpia y normaliza una hora a formato amigable 12 horas 'HH:MM AM/PM' eliminando segundos.
 */
export function cleanDisplayTime(timeStr: string): string {
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

/**
 * Formatea la agenda de citas y partidos de un día específico en un formato visual ejecutivo
 * optimizado para WhatsApp, ordenado por bloques horarios (Mañana, Tarde, Noche)
 * y con emojis descriptivos para estados, servicios y montos en colones ₡.
 */
export function formatVisualAgendaForWhatsApp(
  appointments: any[] = [],
  courtBookings: any[] = [],
  dateStr: string
): string {
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

  const morning: any[] = [];
  const afternoon: any[] = [];
  const night: any[] = [];

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

  const formatItem = (a: any) => {
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
    text += `\n\n⚽ *CANCHAS Y PARTIDOS*\n` + sortedCourts.map((c: any) => {
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

/**
 * Consulta citas registradas para una fecha determinada con datos de especialista.
 */
export async function getAppointmentsForDate(tenantId: string, dateStr: string): Promise<any[]> {
  try {
    const res = await query(`
      SELECT a.id, a.date, a.time, a.service, a.name, a.whatsapp, a.status, a.payment_status, a.amount,
             COALESCE(s.name, 'General') as specialist_name
      FROM appointments a
      LEFT JOIN specialists s ON a.specialist_id = s.id
      WHERE a.tenant_id = $1 AND a.date = $2::date AND a.status NOT IN ('cancelled', 'cancelado')
      ORDER BY a.time ASC
    `, [tenantId, dateStr]);
    return res.rows;
  } catch (err) {
    console.error('[SecretaryService] Error consultando citas por fecha:', err);
    return [];
  }
}

/**
 * Consulta reservas de canchas para una fecha determinada.
 */
export async function getCourtBookingsForDate(tenantId: string, dateStr: string): Promise<any[]> {
  try {
    const res = await query(`
      SELECT cb.id, cb.date, cb.time, cb.booking_mode, cb.team_a_name, cb.team_a_captain, cb.status, c.name as court_name
      FROM court_bookings cb
      JOIN courts c ON cb.court_id = c.id
      WHERE cb.tenant_id = $1 AND cb.date = $2::date AND cb.status NOT IN ('cancelled')
      ORDER BY cb.time ASC
    `, [tenantId, dateStr]);
    return res.rows;
  } catch (err) {
    console.error('[SecretaryService] Error consultando reservas de canchas:', err);
    return [];
  }
}

/**
 * Intercepta mensajes entrantes de WhatsApp para validar si provienen de un Secretario autorizado.
 * Retorna null si el teléfono NO es un secretario registrado (continúa flujo normal).
 */
export async function handleSecretaryInboundMessage(
  tenantId: string,
  cleanPhone: string,
  remoteJid: string,
  userMessage: string,
  pushName: string,
  instanceName: string
): Promise<SecretaryProcessResult | null> {
  // 1. Verificar si el número está en la lista de secretarios autorizados del tenant
  const secretary = await getAuthorizedPhoneByNumber(tenantId, cleanPhone);
  if (!secretary || !secretary.active) {
    return null; // No es secretario, seguir flujo normal de cliente
  }

  const tenant = await getTenantById(tenantId);
  const tenantName = tenant?.name || 'Tu Negocio';
  const todayStr = getTodayCR();
  const timeStr = getCurrentTimeCR();

  // 2. Chequeo de bloqueo por intentos fallidos
  if (secretary.lockedUntil && new Date(secretary.lockedUntil) > new Date()) {
    const lockMsg = `🔒 *Acceso Temporalmente Bloqueado*\n\nHola *${secretary.name}*, has superado el límite de intentos permitidos para tu PIN. Por seguridad, el acceso al Modo Secretario estará bloqueado durante 15 minutos.`;
    await sendMessage(instanceName, cleanPhone, lockMsg);
    await saveSecretaryLog(tenantId, remoteJid, lockMsg);
    return { handled: true, replyText: lockMsg, status: 'locked' };
  }

  // 3. Chequeo de sesión para el día de hoy (Costa Rica UTC-6)
  const session = await getSecretarySession(secretary.id, todayStr);
  const isAuthenticatedToday = Boolean(session && session.isAuthenticated);

  // 4. Si NO está autenticado hoy: desafiar o validar PIN de 4 dígitos
  if (!isAuthenticatedToday) {
    const isPinFormat = /^\s*\d{4}\s*$/.test(userMessage);

    if (isPinFormat) {
      const pin = userMessage.trim();
      const isValid = verifyPin(pin, (secretary as any).pin_hash || (await getPinHash(secretary.id)));

      if (isValid) {
        await resetFailedAttempts(secretary.id);
        await authenticateSecretarySession(tenantId, secretary.id, todayStr);

        // Obtener resumen del día para el mensaje de bienvenida
        const dailySummary = await buildDailyOperationalSummary(tenantId, todayStr);
        const welcomeMsg = `✅ *¡Bienvenido al Modo Secretario, ${secretary.name}!* 🎉\n` +
          `🔐 Sesión autenticada con éxito para hoy (*${todayStr}*, ${timeStr} CR).\n\n` +
          `📋 *RESUMEN OPERATIVO DE HOY:*\n` +
          `${dailySummary}\n\n` +
          `💬 *¿Qué deseas gestionar?*\n` +
          `Puedes pedirme:\n` +
          `• *"Ver agenda de hoy"* o de cualquier fecha\n` +
          `• *"Disponibilidad de canchas"* o turnos libres\n` +
          `• *"Agendar cita"* (indicando cliente, servicio y hora)\n` +
          `• *"Cancelar cita"* de un cliente\n` +
          `• *"Ingresos del día"* y cobros pendientes`;

        await sendMessage(instanceName, cleanPhone, welcomeMsg);
        await saveSecretaryLog(tenantId, remoteJid, welcomeMsg);
        return { handled: true, replyText: welcomeMsg, status: 'authenticated' };
      } else {
        const { locked, remainingAttempts } = await registerFailedPinAttempt(secretary.id);
        let errorMsg = '';
        if (locked) {
          errorMsg = `🔒 *PIN Incorrecto.* Has acumulado 3 intentos fallidos. Tu acceso al Modo Secretario ha sido bloqueado por 15 minutos por seguridad.`;
        } else {
          errorMsg = `❌ *PIN Incorrecto.*\nTe quedan *${remainingAttempts} intento(s)* antes de bloquear el acceso.\n\nPor favor ingresa tu PIN de 4 dígitos:`;
        }
        await sendMessage(instanceName, cleanPhone, errorMsg);
        await saveSecretaryLog(tenantId, remoteJid, errorMsg);
        return { handled: true, replyText: errorMsg, status: locked ? 'locked' : 'challenge_sent' };
      }
    } else {
      // El mensaje no es un PIN -> enviar desafío solicitándolo
      const roleLabel = secretary.role === 'owner' ? 'Dueño' : secretary.role === 'manager' ? 'Administrador' : 'Recepcionista';
      const challengeMsg = `🔒 *Modo Secretario Betico — ${tenantName}*\n\n` +
        `Hola *${secretary.name}* (${roleLabel}). Para ingresar al panel operativo y administrativo de hoy, por favor ingresa tu *PIN de 4 dígitos*:`;

      await sendMessage(instanceName, cleanPhone, challengeMsg);
      await saveSecretaryLog(tenantId, remoteJid, challengeMsg);
      return { handled: true, replyText: challengeMsg, status: 'challenge_sent' };
    }
  }

  // 5. El secretario YA está autenticado para hoy -> Procesar solicitud con IA
  // Verificación estricta de BYOK: el secretario requiere clave propia de IA del tenant
  if (!tenant?.aiApiKeyEncrypted) {
    const byokNotice = `⚠️ *Modo Secretario Requiere Clave Propia (BYOK)*\n\n` +
      `Hola *${secretary.name}*, para utilizar la asistencia avanzada del Secretario Virtual por WhatsApp, ` +
      `tu negocio debe configurar su propia API Key de IA en el portal web (*Ajustes > Inteligencia Artificial*).\n\n` +
      `Esto garantiza privacidad total, procesamiento sin límites de cuota y auditoría directa.`;

    await sendMessage(instanceName, cleanPhone, byokNotice);
    await saveSecretaryLog(tenantId, remoteJid, byokNotice);
    return { handled: true, replyText: byokNotice, status: 'byok_required' };
  }

  // 6. Ejecutar Subagente Secretario con IA (BYOK activo)
  const apiKey = decrypt(tenant.aiApiKeyEncrypted);
  const aiConfig = {
    provider: tenant.aiProvider || 'gemini',
    apiKey,
    model: tenant.aiModel || 'gemini-2.5-flash',
    temperature: 0.3
  };

  // Construir contexto operativo completo (citas, canchas, servicios y disponibilidad real)
  const tomorrowStr = getTomorrowCR();
  const [
    appointmentsContext,
    courtsContext,
    servicesList,
    todaySlots,
    tomorrowSlots,
    todayApptsList,
    todayCourtsList,
    tomorrowApptsList,
    tomorrowCourtsList
  ] = await Promise.all([
    queryAppointmentsForSecretary(tenantId, todayStr),
    queryCourtsForSecretary(tenantId, todayStr),
    queryServicesForSecretary(tenantId),
    calculateAvailableSlotsForDate(tenantId, todayStr),
    calculateAvailableSlotsForDate(tenantId, tomorrowStr),
    getAppointmentsForDate(tenantId, todayStr),
    getCourtBookingsForDate(tenantId, todayStr),
    getAppointmentsForDate(tenantId, tomorrowStr),
    getCourtBookingsForDate(tenantId, tomorrowStr)
  ]);

  const todayVisualAgenda = formatVisualAgendaForWhatsApp(todayApptsList, todayCourtsList, todayStr);
  const tomorrowVisualAgenda = formatVisualAgendaForWhatsApp(tomorrowApptsList, tomorrowCourtsList, tomorrowStr);

  const secretarySystemPrompt = `
Eres el Secretario Virtual Interno de ${tenantName}.
Tu interlocutor es ${secretary.name} (${secretary.role}), personal autorizado de la empresa.
Fecha y hora actual oficial en Costa Rica: ${todayStr} a las ${timeStr} (UTC-6).

INFORMACIÓN OPERATIVA DEL COMERCIO:
📅 AGENDA OPERATIVA PREFORMATEADA DE HOY (${todayStr}):
${todayVisualAgenda}

📅 AGENDA OPERATIVA PREFORMATEADA DE MAÑANA (${tomorrowStr}):
${tomorrowVisualAgenda}

📅 CITAS AGENDADAS (Próximos días):
${appointmentsContext || 'No hay citas registradas para hoy ni próximos días.'}

⚽ CANCHAS Y RESERVAS DEPORTIVAS:
${courtsContext || 'No hay reservas de canchas para hoy.'}

⏰ HORARIOS LIBRES REALES CALCULADOS:
• Hoy (${todayStr}): ${todaySlots.availableSlots.length > 0 ? todaySlots.availableSlots.join(', ') : 'Sin turnos disponibles'}
• Mañana (${tomorrowStr}): ${tomorrowSlots.availableSlots.length > 0 ? tomorrowSlots.availableSlots.join(', ') : 'Sin turnos disponibles'}

🛠️ CATÁLOGO DE SERVICIOS:
${servicesList}

INSTRUCCIONES Y REGLAS DE RESPUESTA:
1. Responde de forma ejecutiva, clara, ordenada y con respeto y calidez tica.
2. FORMATO VISUAL DE AGENDA (Al consultar agenda o citas del día):
   Estructura obligatoriamente la respuesta por bloques horarios con viñetas y emojis:
   - 🌅 *BLOQUE MAÑANA (Antes de 12:00 PM)*
   - 🌆 *BLOQUE TARDE (12:00 PM a 06:00 PM)*
   - 🌙 *BLOQUE NOCHE (06:00 PM en adelante)*
   Para cada cita muestra:
   • *HH:MM* — [Servicio]
     👤 [Nombre Cliente] (Tel: [Teléfono])
     ✂️ Especialista: [Nombre Especialista]
     💰 Estado: [🟢 Confirmada / 🟡 Pendiente / 🔵 Realizada] • ₡[Monto] ([Pagado / Cobro Pendiente])
   Si hay reservas de canchas, incluye el bloque:
   - ⚽ *CANCHAS Y PARTIDOS*
     • *HH:MM* — [Nombre Cancha] ([Modo])
       🏆 Capitán: [Nombre Capitán]
       📌 Estado: [🟢 Confirmada / 🟡 Pendiente]
3. CONSULTA DE HORARIOS LIBRES / DISPONIBILIDAD:
   Usa ÚNICAMENTE los turnos listados en HORARIOS LIBRES REALES CALCULADOS. Jamás inventes horas que no estén en esa lista. Si no hay espacios libres, indícalo con franqueza.
4. COMANDOS DE AGENDAMIENTO:
   Si el personal te pide agendar una cita para un cliente, emite al final del mensaje:
<<<COMMAND_BOOKING: {"service":"nombre servicio","date":"YYYY-MM-DD","time":"HH:MM","customerName":"Nombre Cliente","customerPhone":"Teléfono","specialistName":"Especialista opcional"}>>>
5. COMANDOS DE CANCELACIÓN:
   Si el personal te pide cancelar una cita, emite al final del mensaje:
<<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","customerPhone":"Teléfono o ID","service":"Servicio opcional","reason":"solicitado por administración"}>>>
6. NUNCA inventes información. Si un horario está ocupado, dilo claramente.
7. REGLA DE IDIOMA EN ESPAÑOL:
   En texto en español NUNCA uses el signo '&', siempre usa la conjunción copulativa 'y'.
`.trim();

  try {
    const aiResponse = await callAI(aiConfig, {
      system: secretarySystemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const replyText = aiResponse.text || 'Entendido. ¿En qué más puedo asistirte?';

    // Parsear y ejecutar comandos de agendamiento o cancelación de forma síncrona
    const { executionNotes } = await executeSecretaryCommands(tenantId, replyText);

    // Limpiar comandos técnicos del texto visible al secretario
    let cleanReply = replyText.replace(/<<<COMMAND_[^>]+>>>/g, '').trim();

    if (executionNotes.length > 0) {
      cleanReply += '\n\n' + executionNotes.join('\n\n');
    }

    await sendMessage(instanceName, cleanPhone, cleanReply);
    await saveSecretaryLog(tenantId, remoteJid, cleanReply);

    return { handled: true, replyText: cleanReply, status: 'ai_replied' };
  } catch (aiErr: any) {
    console.error('[SecretaryService] AI call error:', aiErr);
    const fallbackMsg = `⚠️ No pude procesar tu solicitud en este momento debido a un error con la clave de IA configurada: ${aiErr?.message || 'Error de conexión'}. Por favor verifica en el portal web.`;
    await sendMessage(instanceName, cleanPhone, fallbackMsg);
    await saveSecretaryLog(tenantId, remoteJid, fallbackMsg);
    return { handled: true, replyText: fallbackMsg, status: 'byok_required' };
  }
}

/**
 * Obtiene el hash del PIN directamente desde la base de datos si no venía precargado.
 */
async function getPinHash(secretaryId: string): Promise<string> {
  const res = await query(`SELECT pin_hash FROM secretary_authorized_phones WHERE id = $1`, [secretaryId]);
  return res.rows[0]?.pin_hash || '';
}

/**
 * Construye el resumen de citas, ingresos y turnos del día para el mensaje de bienvenida.
 */
async function buildDailyOperationalSummary(tenantId: string, todayStr: string): Promise<string> {
  try {
    const apptsRes = await query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
             COUNT(*) FILTER (WHERE status = 'pending') as pending,
             COUNT(*) FILTER (WHERE status IN ('completed', 'completado', 'completada', 'realizada')) as completed,
             COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0) as paid_amount
      FROM appointments
      WHERE tenant_id = $1 AND date = $2::date
    `, [tenantId, todayStr]);

    const courtsRes = await query(`
      SELECT COUNT(*) as total
      FROM court_bookings
      WHERE tenant_id = $1 AND date = $2::date AND status NOT IN ('cancelled')
    `, [tenantId, todayStr]);

    const a = apptsRes.rows[0] || {};
    const courtsCount = courtsRes.rows[0]?.total || 0;

    return `• Citas hoy: ${a.total || 0} (🟢 ${a.confirmed || 0} confirmadas, 🟡 ${a.pending || 0} pendientes, 🔵 ${a.completed || 0} realizadas)\n` +
      `• Partidos/Canchas hoy: ${courtsCount} reservas activas\n` +
      `• Cobrado en citas hoy: ₡${Number(a.paid_amount || 0).toLocaleString('es-CR')}`;
  } catch (err) {
    return '• Información del día disponible mediante consulta.';
  }
}

/**
 * Consulta citas formateadas para el contexto del LLM.
 */
async function queryAppointmentsForSecretary(tenantId: string, todayStr: string): Promise<string> {
  const res = await query(`
    SELECT a.date, a.time, a.service, a.name, a.whatsapp, a.status, a.payment_status, a.amount,
           COALESCE(s.name, 'General') as specialist_name
    FROM appointments a
    LEFT JOIN specialists s ON a.specialist_id = s.id
    WHERE a.tenant_id = $1 AND a.date >= $2::date AND a.status NOT IN ('cancelled', 'cancelado')
    ORDER BY a.date ASC, a.time ASC
    LIMIT 25
  `, [tenantId, todayStr]);

  if (res.rows.length === 0) return '';
  return res.rows.map((r: any) =>
    `  • ${r.date} a las ${r.time}: ${r.service} para ${r.name || 'Cliente'} (Tel: ${r.whatsapp || 'N/A'}, Especialista: ${r.specialist_name}) [Estado: ${r.status}, Pago: ${r.payment_status}]`
  ).join('\n');
}

/**
 * Consulta reservas de canchas para el contexto del LLM.
 */
async function queryCourtsForSecretary(tenantId: string, todayStr: string): Promise<string> {
  const res = await query(`
    SELECT cb.date, cb.time, cb.booking_mode, cb.team_a_name, cb.team_a_captain, cb.status, c.name as court_name
    FROM court_bookings cb
    JOIN courts c ON cb.court_id = c.id
    WHERE cb.tenant_id = $1 AND cb.date >= $2::date AND cb.status NOT IN ('cancelled')
    ORDER BY cb.date ASC, cb.time ASC
    LIMIT 20
  `, [tenantId, todayStr]);

  if (res.rows.length === 0) return '';
  return res.rows.map((r: any) =>
    `  • ${r.date} a las ${r.time}: ${r.court_name} (${r.booking_mode}) - Equipo: ${r.team_a_name || r.team_a_captain} [Estado: ${r.status}]`
  ).join('\n');
}

/**
 * Consulta catálogo de servicios activos para el secretario.
 */
async function queryServicesForSecretary(tenantId: string): Promise<string> {
  const res = await query(`
    SELECT name, price, duration, category
    FROM services
    WHERE tenant_id = $1 AND active = true
    ORDER BY name ASC
  `, [tenantId]);

  if (res.rows.length === 0) return 'No hay servicios configurados.';
  return res.rows.map((s: any) =>
    `  • ${s.name}: ₡${Number(s.price || 0).toLocaleString('es-CR')} (${s.duration || '60m'}${s.category ? `, Cat: ${s.category}` : ''})`
  ).join('\n');
}

/**
 * Parsea y ejecuta comandos emitidos por el secretario IA de forma síncrona.
 * Devuelve notas de ejecución descriptivas para incorporar a la respuesta final.
 */
export async function executeSecretaryCommands(
  tenantId: string,
  replyText: string
): Promise<{ executionNotes: string[]; createdBooking?: any; cancelledBooking?: any }> {
  const executionNotes: string[] = [];
  let createdBooking: any = null;
  let cancelledBooking: any = null;

  const bookingMatch = replyText.match(/<<<COMMAND_BOOKING:\s*({[\s\S]*?})>>>/);
  if (bookingMatch) {
    try {
      const data = JSON.parse(bookingMatch[1]);
      const appt = await createBookingFromCommand(tenantId, data);
      createdBooking = appt;
      const apptCode = appt?.id ? `#APT-${String(appt.id).slice(0, 8).toUpperCase()}` : '#APT-CONFIRMADA';
      executionNotes.push(
        `✅ *Cita Agendada Exitosamente (${apptCode}):*\n` +
        `• Cliente: ${appt.name || data.customerName || 'Cliente'}\n` +
        `• Servicio: ${appt.service || data.service}\n` +
        `• Fecha y Hora: ${appt.date} a las ${appt.time}\n` +
        `• Monto: ₡${Number(appt.amount || 0).toLocaleString('es-CR')}`
      );
      console.log('[SecretaryService] Cita agendada por secretario IA:', appt);
    } catch (err: any) {
      console.error('[SecretaryService] Error ejecutando COMMAND_BOOKING:', err);
      executionNotes.push(
        `⚠️ *No se pudo agendar la cita:* ${err?.message || 'El horario solicitado no está disponible o colisiona con otra cita.'}`
      );
    }
  }

  const cancelMatch = replyText.match(/<<<COMMAND_CANCEL_BOOKING:\s*({[\s\S]*?})>>>/);
  if (cancelMatch) {
    try {
      const data = JSON.parse(cancelMatch[1]);
      const cancelled = await cancelBookingFromWhatsApp(
        tenantId,
        data.customerPhone || '',
        {
          date: data.date,
          service: data.service,
          reason: data.reason,
          appointmentId: data.appointmentId || data.id
        }
      );
      if (cancelled) {
        cancelledBooking = cancelled;
        const apptCode = cancelled?.id ? `#APT-${String(cancelled.id).slice(0, 8).toUpperCase()}` : '';
        executionNotes.push(
          `🗑️ *Cita Cancelada Exitosamente${apptCode ? ' (' + apptCode + ')' : ''}:*\n` +
          `Se canceló la cita de *${cancelled.name || data.customerPhone}* para *${cancelled.service || 'Servicio'}* el día *${cancelled.date}* a las *${cancelled.time}*.`
        );
        console.log('[SecretaryService] Cita cancelada por secretario IA:', cancelled);
      } else {
        executionNotes.push(
          `⚠️ *No se encontró ninguna cita activa* para cancelar con los datos proporcionados (Fecha: ${data.date || 'N/A'}, Teléfono: ${data.customerPhone || 'N/A'}).`
        );
      }
    } catch (err: any) {
      console.error('[SecretaryService] Error ejecutando COMMAND_CANCEL_BOOKING:', err);
      executionNotes.push(`⚠️ *Error al procesar la cancelación:* ${err?.message || 'No fue posible cancelar la cita.'}`);
    }
  }

  return { executionNotes, createdBooking, cancelledBooking };
}

/**
 * Registra el mensaje en el historial del chat.
 */
async function saveSecretaryLog(tenantId: string, remoteJid: string, text: string): Promise<void> {
  try {
    await saveChatMessage(tenantId, {
      id: `sec_${Date.now()}`,
      remoteJid,
      pushName: 'Secretario Betico',
      fromMe: true,
      messageText: text,
      aiResponse: text,
      status: 'sent'
    });
  } catch (err) {
    console.error('[SecretaryService] Error guardando log en chats:', err);
  }
}
