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
import { getTodayCR, getCurrentTimeCR, getNowCR } from './timezone.service.js';
import { createBookingFromCommand, cancelBookingFromWhatsApp } from './booking.service.js';
import { createBooking as createCourtBooking, getCourtsByTenant } from '../db/courts.repo.js';

export interface SecretaryProcessResult {
  handled: boolean;
  replyText?: string;
  status: 'authenticated' | 'challenge_sent' | 'locked' | 'byok_required' | 'ai_replied';
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

  // Construir contexto operativo completo (citas, canchas, servicios)
  const [appointmentsContext, courtsContext, servicesList] = await Promise.all([
    queryAppointmentsForSecretary(tenantId, todayStr),
    queryCourtsForSecretary(tenantId, todayStr),
    queryServicesForSecretary(tenantId)
  ]);

  const secretarySystemPrompt = `
Eres el Secretario Virtual Interno de ${tenantName}.
Tu interlocutor es ${secretary.name} (${secretary.role}), personal autorizado de la empresa.
Fecha y hora actual oficial en Costa Rica: ${todayStr} a las ${timeStr} (UTC-6).

INFORMACIÓN OPERATIVA DEL COMERCIO:
📅 CITAS AGENDADAS (Próximos días):
${appointmentsContext || 'No hay citas registradas para hoy ni próximos días.'}

⚽ CANCHAS Y RESERVAS DEPORTIVAS:
${courtsContext || 'No hay reservas de canchas para hoy.'}

🛠️ CATÁLOGO DE SERVICIOS:
${servicesList}

INSTRUCCIONES Y REGLAS DE RESPUESTA:
1. Responde de forma ejecutiva, clara, ordenada y con respeto y calidez tica.
2. Tienes acceso completo a la información operativa. Si te preguntan por la agenda, da el listado ordenado por hora con el nombre del cliente, teléfono y estado.
3. Si el secretario te pide agendar una cita para un cliente, emite al final del mensaje:
<<<COMMAND_BOOKING: {"service":"nombre servicio","date":"YYYY-MM-DD","time":"HH:MM","customerName":"Nombre Cliente","customerPhone":"Teléfono"}>>>
4. Si el secretario te pide cancelar una cita, emite al final del mensaje:
<<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","customerPhone":"Teléfono o ID","reason":"solicitado por administración"}>>>
5. NUNCA inventes información. Si un horario está ocupado, dilo claramente.
6. En texto en español NUNCA uses el signo '&', siempre usa la conjunción 'y'.
`.trim();

  try {
    const aiResponse = await callAI(aiConfig, {
      system: secretarySystemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const replyText = aiResponse.text || 'Entendido. ¿En qué más puedo asistirte?';

    // Parsear y ejecutar comandos de agendamiento o cancelación si los emite el LLM
    await executeSecretaryCommands(tenantId, replyText);

    // Limpiar comandos técnicos del texto visible al secretario
    const cleanReply = replyText.replace(/<<<COMMAND_[^>]+>>>/g, '').trim();

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

    return `• Citas hoy: ${a.total || 0} (${a.confirmed || 0} confirmadas, ${a.pending || 0} pendientes, ${a.completed || 0} realizadas)\n` +
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
    SELECT date, time, service, name, whatsapp, status, payment_status, amount
    FROM appointments
    WHERE tenant_id = $1 AND date >= $2::date AND status NOT IN ('cancelled', 'cancelado')
    ORDER BY date ASC, time ASC
    LIMIT 25
  `, [tenantId, todayStr]);

  if (res.rows.length === 0) return '';
  return res.rows.map((r: any) =>
    `  • ${r.date} a las ${r.time}: ${r.service} para ${r.name || 'Cliente'} (Tel: ${r.whatsapp || 'N/A'}) [Estado: ${r.status}, Pago: ${r.payment_status}]`
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
 * Parsea y ejecuta comandos emitidos por el secretario IA.
 */
async function executeSecretaryCommands(tenantId: string, replyText: string): Promise<void> {
  const bookingMatch = replyText.match(/<<<COMMAND_BOOKING:\s*({[\s\S]*?})>>>/);
  if (bookingMatch) {
    try {
      const data = JSON.parse(bookingMatch[1]);
      await createBookingFromCommand(tenantId, data);
      console.log('[SecretaryService] Cita agendada por secretario IA:', data);
    } catch (err) {
      console.error('[SecretaryService] Error ejecutando COMMAND_BOOKING:', err);
    }
  }

  const cancelMatch = replyText.match(/<<<COMMAND_CANCEL_BOOKING:\s*({[\s\S]*?})>>>/);
  if (cancelMatch) {
    try {
      const data = JSON.parse(cancelMatch[1]);
      await cancelBookingFromWhatsApp(tenantId, data.customerPhone || '', data.date || '', data.service || '');
      console.log('[SecretaryService] Cita cancelada por secretario IA:', data);
    } catch (err) {
      console.error('[SecretaryService] Error ejecutando COMMAND_CANCEL_BOOKING:', err);
    }
  }
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
