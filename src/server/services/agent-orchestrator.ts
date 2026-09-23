import { callAI, TenantAIConfig, getMasterAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig, defaultOrchestratorConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { incrementTenantUsage } from '../db/ai-usage.repo.js';
import { getSpecialistsByTenant } from '../db/specialists.repo.js';
import { getCourtsByTenant } from '../db/courts.repo.js';
import { getRecordByPhone } from '../db/records.repo.js';
import { query } from '../db/pool.js';
import { getTenantModelName } from './tenant-model.service.js';
import { AgentProcessResult } from './agent.js';
import { OrchestratorConfig } from '../../shared/types.js';

export type SubagentId = 'sales' | 'booking' | 'courts' | 'handoff' | 'general';

export interface OrchestratorProcessResult extends AgentProcessResult {
  routedAgentId: SubagentId;
  routedAgentName: string;
  sourcesUsed: string[];
}

export function safeParseJSON(rawStr: string): any {
  if (!rawStr || typeof rawStr !== 'string') return null;
  let cleaned = rawStr.trim();
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    try {
      const relaxed = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(relaxed);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Fast contextual intent classification (Supervisor / Router) in <5ms
 */
export function routeIntent(
  userMessage: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[],
  orchestratorConfig?: OrchestratorConfig
): SubagentId {
  const lowerMsg = userMessage.toLowerCase().trim();
  const recentHistory = (chatHistory || []).slice(-6).map(h => h.content).join(' ').toLowerCase();
  const context = `${recentHistory} ${lowerMsg}`;

  const subagents = orchestratorConfig?.subagents || defaultOrchestratorConfig.subagents;

  // 1. Escalation / Handoff
  const isHandoff = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente|hablar con un asesor/i.test(lowerMsg);
  if (isHandoff) {
    return subagents.handoff?.enabled !== false ? 'handoff' : 'general';
  }

  // 2. Canchas deportivas
  const isCourts = /cancha|canchas|partido|futbol|fútbol|padel|pádel|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(context);
  if (isCourts) {
    return subagents.courts?.enabled !== false ? 'courts' : 'general';
  }

  // 3. Ventas de tienda / restaurante / pedidos
  const isSales = /precio|costo|cuanto|venden|catalogo|catálogo|menu|menú|producto|productos|comprar|pedir|orden|foto|imagen|plato|comida|pizza|hamburguesa|variante|talla|sabor|llevar|delivery|envio|envío|agregar al carrito|confirmo/i.test(context);

  // 4. Citas y Servicios
  const isBooking = /servicio|servicios|cita|citas|agenda|agendar|turno|atencion|atención|doctor|especialista|cancelar cita|reagendar|disponibilidad de horario|horario de cita/i.test(context);

  if (isSales && !isBooking) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && !isSales) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  if (isSales) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  return 'general';
}

export async function processWithOrchestrator(
  tenantId: string,
  userMessage: string,
  senderPhone: string,
  senderName: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<OrchestratorProcessResult> {
  const tenant = await getTenantById(tenantId);
  const agentConfig: any = await getAgentConfig(tenantId);
  const orchConfig: OrchestratorConfig = agentConfig?.orchestratorConfig || defaultOrchestratorConfig;

  // 1. Supervisor / Router: Determine which subagent handles the turn
  const routedAgentId = routeIntent(userMessage, chatHistory, orchConfig);
  const currentSubagent = orchConfig.subagents[routedAgentId] || defaultOrchestratorConfig.subagents[routedAgentId];
  const routedAgentName = currentSubagent?.name || 'Agente Betico';

  // 2. Fetch base tenant settings
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);
  const cleanPhone = senderPhone.replace(/\D/g, '');
  const baseUrl = process.env.APP_URL || 'https://betico.tech';
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : '';
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : '';

  // Get current Costa Rica time
  const now = new Date();
  const crTime = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    dateStyle: 'full',
    timeStyle: 'medium'
  }).format(now);

  const sourcesUsed: string[] = [];
  let specializedPrompt = '';
  let allowedActions = currentSubagent?.actions || [];

  // 3. Modular Context Assembly per Subagent
  switch (routedAgentId) {
    case 'sales': {
      sourcesUsed.push('products', 'payments', 'storeSettings');
      const products = await getProductsByTenant(tenantId, true);
      const activeProducts = products.filter(p => p.active !== false);

      // Match products relevant to query
      const lowerContext = `${(chatHistory || []).slice(-4).map(h => h.content).join(' ')} ${userMessage}`.toLowerCase();
      let matchedProducts = activeProducts.filter(p => {
        const pName = p.name.toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        return lowerContext.includes(pName) || (pCat && lowerContext.includes(pCat)) || (pDesc && pDesc.split(' ').some(w => w.length > 3 && lowerContext.includes(w)));
      });

      if (matchedProducts.length === 0) {
        matchedProducts = activeProducts.slice(0, 6);
      }

      let catalogText = '🛍️ Catálogo de Productos y Precios:\n' + matchedProducts.map(p => {
        let line = `• *${p.name}* [${p.category || 'General'}]: ₡${Number(p.price || 0).toLocaleString('es-CR')}`;
        if (p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)) {
          line += ` (Antes: ₡${Number(p.compareAtPrice).toLocaleString('es-CR')})`;
        }
        line += ` | Stock: ${p.stock ?? 'disponible'}`;
        if (p.description) line += `\n  Descripción: ${p.description.slice(0, 120)}`;
        if (p.variants && p.variants.length > 0) {
          const varStr = p.variants.map((v: any) => `${v.name}${v.priceOverride ? ` (₡${Number(v.priceOverride).toLocaleString('es-CR')})` : ''}`).join(', ');
          line += `\n  Variantes: ${varStr}`;
        }
        if (p.customVariables && p.customVariables.length > 0) {
          const optStr = p.customVariables.map((cv: any) => `${cv.name}: [${(cv.options || []).map((o: any) => o.name).join(', ')}]`).join(' | ');
          line += `\n  Opciones/Extras: ${optStr}`;
        }
        if (p.images && p.images.length > 0) {
          const pUrl = p.images[0].url.startsWith('http') ? p.images[0].url : `${baseUrl}${p.images[0].url}`;
          line += `\n  Foto oficial: ${pUrl}`;
        }
        return line;
      }).join('\n\n');

      let paymentText = '';
      const pMethods: string[] = [];
      if (store?.acceptSinpe && store.sinpePhone) pMethods.push(`SINPE Móvil al ${store.sinpePhone} (${store.sinpeName || tenant?.name})`);
      if (store?.acceptTransfer && store.bankAccountInfo) pMethods.push(`Transferencia: ${store.bankAccountInfo}`);
      if (store?.acceptCashOnDelivery) pMethods.push('Efectivo contra entrega');
      if (store?.deliveryEnabled) pMethods.push(`Envío a domicilio disponible (₡${Number(store.deliveryFee || 0).toLocaleString('es-CR')})`);
      if (pMethods.length > 0) paymentText = '💳 Métodos de Pago: ' + pMethods.join(' | ') + '\n';

      specializedPrompt = `
ROL: Eres el Asesor Especialista de Ventas y Catálogo de *${tenant?.name || 'nuestro negocio'}*.
${currentSubagent.prompt}

INFORMACIÓN ACTUALIZADA:
Fecha/Hora CR: ${crTime}
${storeUrl ? `Tienda Online: ${storeUrl}\n` : ''}
${paymentText}
${catalogText}

REGLAS DE VENTA:
1. Responde con calidez tica (*pura vida*, con gusto, claro que sí).
2. Si el producto tiene variantes (sabores, tallas) o extras, pregúntale cuál prefiere.
3. Lleva la cuenta sumada de todos los productos solicitados a lo largo de la conversación con el monto total acumulado.
4. Consulta si la entrega es para Envío a Domicilio (solicita dirección) o Retiro en Local, y el método de pago.
5. Cuando el cliente confirme la compra explícitamente ("sí confirmo", "listo", "procedamos"), emite al final:
<<<COMMAND_ORDER: {"items":[{"productName":"Nombre Exacto","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"dirección si aplica", "customerName":"${senderName}"}>>>
6. Si el cliente solicita fotos del producto y hay foto disponible, puedes emitir:
<<<COMMAND_SEND_MEDIA: {"mediaUrl":"URL","caption":"descripción"}>>>
`.trim();
      break;
    }

    case 'booking': {
      sourcesUsed.push('services', 'specialists', 'busySlots', 'schedule');
      const services = await getServicesByTenant(tenantId);
      const activeServices = (services || []).filter((s: any) => s.active !== false);

      let servicesText = '🚗/💼 Servicios Disponibles:\n' + activeServices.map((s: any) => 
        `• ${s.name}: ₡${Number(s.price || 0).toLocaleString('es-CR')} (${s.duration || `${s.estimatedMinutes || 45} min`})`
      ).join('\n') + '\n';

      let busySlotsText = '';
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const busyRes = await query(`
          SELECT date, time, service
          FROM appointments
          WHERE tenant_id = $1 AND date >= $2::date AND status NOT IN ('cancelled', 'cancelado')
          ORDER BY date ASC, time ASC
          LIMIT 30
        `, [tenantId, todayStr]);

        if (busyRes.rows.length > 0) {
          const grouped: Record<string, string[]> = {};
          busyRes.rows.forEach((r: any) => {
            const d = r.date;
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(r.time);
          });
          busySlotsText = '🚫 HORARIOS YA OCUPADOS (PROHIBIDO OFRECERLOS):\n' + 
            Object.entries(grouped).map(([d, times]) => `  • ${d}: ${times.join(', ')} (OCUPADO)`).join('\n') + '\n';
        }
      } catch (e) {}

      let specialistsText = '';
      try {
        const specialists = await getSpecialistsByTenant(tenantId);
        const activeSpecs = (specialists || []).filter((s: any) => s.active !== false);
        if (activeSpecs.length > 0) {
          specialistsText = '👥 Profesionales / Equipo: ' + activeSpecs.map((s: any) => `${s.name}${s.specialty ? ` (${s.specialty})` : ''}`).join(', ') + '\n';
        }
      } catch (e) {}

      let customerRecord: any = null;
      try {
        customerRecord = await getRecordByPhone(senderPhone, tenantId);
      } catch (e) {}

      let scheduleText = '';
      if (schedule?.jornadaConfig) {
        const j = schedule.jornadaConfig;
        scheduleText = `⏰ Horario de Atención: ${j.startHour || '08:00'} a ${j.endHour || '17:00'} (${j.slotMinutes || 45}m por turno)\n`;
      }

      specializedPrompt = `
ROL: Eres el Asesor Especialista de Citas y Servicios de *${tenant?.name || 'nuestro negocio'}*.
${currentSubagent.prompt}

INFORMACIÓN ACTUALIZADA:
Fecha/Hora CR: ${crTime}
${bookingUrl ? `Reservas Online: ${bookingUrl}\n` : ''}
${scheduleText}
${servicesText}
${specialistsText}
${busySlotsText}
${customerRecord?.fullName ? `Cliente Registrado: ${customerRecord.fullName}\n` : ''}

REGLAS DE AGENDAMIENTO:
1. Responde con calidez tica (*pura vida*, con mucho gusto).
2. Pregunta amablemente la fecha y hora preferida, asegurándote de que NO coincida con los HORARIOS YA OCUPADOS.
3. Al acordar la cita completa con el cliente, emite al final:
<<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${customerRecord?.fullName || senderName}","recordId":"${customerRecord?.id || ''}","specialistName":"opcional"}>>>
4. Para reagendar una cita existente confirmada:
<<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD","newTime":"HH:MM"}>>>
5. Para cancelar una cita activa (previa confirmación explícita del cliente):
<<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","service":"opcional","reason":"solicitado por cliente"}>>>
`.trim();
      break;
    }

    case 'courts': {
      sourcesUsed.push('courts', 'schedule');
      const courts = await getCourtsByTenant(tenantId);
      const activeCourts = (courts || []).filter((c: any) => c.active !== false);

      let courtsText = '⚽ CANCHAS DISPONIBLES:\n' + activeCourts.map((c: any) => 
        `• *${c.name}* [${c.sportType || 'Cancha'}${c.surface ? `, ${c.surface}` : ''}]: ₡${Number(c.basePrice || 0).toLocaleString('es-CR')}/hora${c.hasLighting ? ' (iluminación incluida)' : ''}`
      ).join('\n') + '\n';

      specializedPrompt = `
ROL: Eres el Asesor Especialista en Reservas de Canchas Deportivas de *${tenant?.name || 'nuestro negocio'}*.
${currentSubagent.prompt}

INFORMACIÓN DE CANCHAS:
Fecha/Hora CR: ${crTime}
${courtsText}

REGLAS DE CANCHAS:
1. Ofrece las canchas disponibles con sus precios por hora y modalidad ("full" para cancha completa o "seek_match" si busca rival).
2. Cuando el cliente confirme la reserva del partido:
<<<COMMAND_COURT_BOOKING: {"courtName":"nombre cancha", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>
3. Para reagendar una reserva de cancha, solicita su código (ej. CRT-8F2A1C o #RES-) y emite:
<<<COMMAND_RESCHEDULE_COURT: {"bookingCode":"código", "newDate":"YYYY-MM-DD", "newTime":"HH:MM", "newCourtName":"opcional"}>>>
`.trim();
      break;
    }

    case 'handoff': {
      sourcesUsed.push('handoffKeywords');
      specializedPrompt = `
ROL: Eres el Asistente de Escalado y Atención de Emergencia de *${tenant?.name || 'nuestro negocio'}*.
${currentSubagent.prompt}

El cliente ha solicitado comunicarse con un asesor humano o presenta una duda/reclamo urgente.
Responde de forma muy educada, empática y cordial, asegurándole que en este momento un asesor de nuestro equipo tomará el control del chat para atenderle personalmente.
Emite al final:
<<<COMMAND_HANDOFF: {"reason":"Solicitado por cliente"}>>>
`.trim();
      break;
    }

    case 'general':
    default: {
      sourcesUsed.push('businessInfo', 'schedule', 'payments');
      let scheduleText = '';
      if (schedule?.jornadaConfig) {
        const j = schedule.jornadaConfig;
        scheduleText = `⏰ Horario: ${j.startHour || '08:00'} a ${j.endHour || '17:00'}\n`;
      }

      let paymentSummary = '';
      const pArr: string[] = [];
      if (store?.acceptSinpe && store.sinpePhone) pArr.push(`SINPE Móvil (${store.sinpePhone})`);
      if (store?.acceptTransfer) pArr.push('Transferencia');
      if (store?.acceptCashOnDelivery) pArr.push('Efectivo');
      if (pArr.length > 0) paymentSummary = '💳 Pagos: ' + pArr.join(', ') + '\n';

      specializedPrompt = `
ROL: Eres el Asistente Virtual Principal de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.
${currentSubagent?.prompt || 'Atiende cordialmente al cliente con calidez costarricense.'}

Fecha/Hora CR: ${crTime}
${bookingUrl ? `Reservas Web: ${bookingUrl}\n` : ''}
${storeUrl ? `Tienda Web: ${storeUrl}\n` : ''}
${scheduleText}${paymentSummary}

REGLAS GENERALES:
1. Responde amablemente con lenguaje tico (*pura vida*, con gusto, bienvenido).
2. Si el cliente pregunta qué ofrecen, menciona de forma concisa si manejan productos, citas o canchas e invítale a consultar.
3. No inventes precios ni promociones que no figuren en la información oficial.
`.trim();
      break;
    }
  }

  // 4. Construct AI Messages Array
  const isConversationOngoing = (chatHistory && chatHistory.length > 0);
  const antiGreetingInstruction = isConversationOngoing
    ? `⚠️ CONVERSACIÓN EN CURSO: El cliente ya está interactuando contigo. NO vuelvas a saludar ("Hola", "Buenas"). Responde directo al grano con entusiasmo.`
    : `Saluda cordialmente presentándote como asistente de *${tenant?.name || 'nuestro negocio'}*.`;

  const finalSystemPrompt = `${specializedPrompt}\n\n${antiGreetingInstruction}`;

  const structuredMessages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-8);
    for (const h of recent) {
      structuredMessages.push({ role: h.role, content: h.content });
    }
  }
  structuredMessages.push({ role: 'user', content: userMessage });

  // 5. Model Resolution (BYOK vs Betico AI)
  let config: TenantAIConfig;
  const temperature = currentSubagent?.temperature ?? 0.3;
  let isBeticoPlatformAI = false;

  if (tenant?.aiApiKeyEncrypted) {
    try {
      const apiKey = decrypt(tenant.aiApiKeyEncrypted);
      config = {
        provider: tenant.aiProvider || 'gemini',
        apiKey,
        model: tenant.aiModel || agentConfig?.model || 'gemini-2.5-flash',
        temperature
      };
    } catch (e) {
      config = { provider: 'betico_ai', apiKey: 'ollama', model: 'betico-ai', temperature };
      isBeticoPlatformAI = true;
    }
  } else {
    isBeticoPlatformAI = true;
    const masterConfig = await getMasterAIConfig();
    const isLocalOllama = (masterConfig.provider === 'betico_ai' || masterConfig.provider === 'ollama');
    const virtualModel = (tenant && isLocalOllama) ? getTenantModelName(tenant) : masterConfig.model;
    config = {
      provider: masterConfig.provider,
      apiKey: masterConfig.apiKey,
      model: virtualModel,
      temperature,
      baseUrl: masterConfig.baseUrl
    };
  }

  // 6. Execute Inference
  const aiResult = await callAI(config, {
    system: finalSystemPrompt,
    messages: structuredMessages
  });

  if (isBeticoPlatformAI && aiResult.tokensUsed > 0) {
    await incrementTenantUsage(tenantId, aiResult.tokensUsed);
  }

  const rawReply = aiResult.text || '';

  // 7. Parse Structured Action Commands
  let isBookingDetected = false;
  let bookingData: any;
  let isCourtBookingDetected = false;
  let courtBookingData: any;
  let isOrderDetected = false;
  let orderData: any;
  let isHandoffRequested = false;
  let handoffReason: string | undefined;
  let isMediaDetected = false;
  let mediaData: any;
  let isCancelBookingDetected = false;
  let cancelBookingData: any;
  let isRescheduleBookingDetected = false;
  let rescheduleBookingData: any;
  let isRescheduleCourtDetected = false;
  let rescheduleCourtData: any;

  // Booking Command
  const bookingMatch = rawReply.match(/<<<COMMAND_BOOKING:\s*({.*?})>>>/s);
  if (bookingMatch && bookingMatch[1] && allowedActions.includes('booking')) {
    const parsed = safeParseJSON(bookingMatch[1]);
    if (parsed && (parsed.service || parsed.serviceName) && (parsed.date || parsed.time)) {
      isBookingDetected = true;
      bookingData = parsed;
    }
  }

  // Court Booking Command
  const courtMatch = rawReply.match(/<<<COMMAND_COURT_BOOKING:\s*({.*?})>>>/s);
  if (courtMatch && courtMatch[1] && allowedActions.includes('courtBooking')) {
    const parsed = safeParseJSON(courtMatch[1]);
    if (parsed && (parsed.courtName || parsed.courtId) && (parsed.date || parsed.time)) {
      isCourtBookingDetected = true;
      courtBookingData = parsed;
    }
  }

  // Reschedule Court Command
  const courtReschedMatch = rawReply.match(/<<<COMMAND_RESCHEDULE_COURT:\s*({.*?})>>>/s);
  if (courtReschedMatch && courtReschedMatch[1] && allowedActions.includes('courtReschedule')) {
    const parsed = safeParseJSON(courtReschedMatch[1]);
    if (parsed && (parsed.bookingCode || parsed.code)) {
      isRescheduleCourtDetected = true;
      rescheduleCourtData = parsed;
    }
  }

  // Order Command
  const orderMatch = rawReply.match(/<<<COMMAND_ORDER:\s*({.*?})>>>/s);
  if (orderMatch && orderMatch[1] && allowedActions.includes('order')) {
    const parsed = safeParseJSON(orderMatch[1]);
    if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
      isOrderDetected = true;
      orderData = parsed;
    }
  }

  // Media Command
  const mediaMatch = rawReply.match(/<<<COMMAND_SEND_MEDIA:\s*({.*?})>>>/s);
  if (mediaMatch && mediaMatch[1] && allowedActions.includes('media')) {
    const parsed = safeParseJSON(mediaMatch[1]);
    if (parsed && parsed.mediaUrl) {
      isMediaDetected = true;
      mediaData = parsed;
    }
  }

  // Handoff Command
  const handoffMatch = rawReply.match(/<<<COMMAND_HANDOFF:\s*({.*?})>>>/s);
  if (handoffMatch && handoffMatch[1] && allowedActions.includes('handoff')) {
    const parsed = safeParseJSON(handoffMatch[1]);
    isHandoffRequested = true;
    handoffReason = parsed?.reason || 'Solicitado por cliente';
  }

  // Reschedule Booking Command
  const reschedMatch = rawReply.match(/<<<COMMAND_RESCHEDULE_BOOKING:\s*({.*?})>>>/s);
  if (reschedMatch && reschedMatch[1] && allowedActions.includes('reschedule')) {
    const parsed = safeParseJSON(reschedMatch[1]);
    if (parsed && (parsed.newDate || parsed.newTime)) {
      isRescheduleBookingDetected = true;
      rescheduleBookingData = parsed;
    }
  }

  // Cancel Booking Command
  const cancelMatch = rawReply.match(/<<<COMMAND_CANCEL_BOOKING:\s*({.*?})>>>/s);
  if (cancelMatch && cancelMatch[1] && allowedActions.includes('cancel')) {
    const parsed = safeParseJSON(cancelMatch[1]);
    if (parsed) {
      isCancelBookingDetected = true;
      cancelBookingData = parsed;
    }
  }

  // 8. Clean text: strip commands and normalize markdown for WhatsApp
  let cleanReply = rawReply
    .replace(/<<<COMMAND_.*?>>>/gs, '')
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*(.*?)\*\*/g, '*$1*');

  return {
    replyText: cleanReply,
    isBookingDetected,
    bookingData,
    isCourtBookingDetected,
    courtBookingData,
    isOrderDetected,
    orderData,
    isHandoffRequested,
    handoffReason,
    isMediaDetected,
    mediaData,
    isCancelBookingDetected,
    cancelBookingData,
    isRescheduleBookingDetected,
    rescheduleBookingData,
    isRescheduleCourtDetected,
    rescheduleCourtData,
    tokensUsed: aiResult.tokensUsed,
    routedAgentId,
    routedAgentName,
    sourcesUsed
  };
}
