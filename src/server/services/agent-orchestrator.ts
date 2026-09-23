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
import { getWebsiteSettingsByTenant } from '../db/website.repo.js';
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
  orchestratorConfig?: OrchestratorConfig,
  storeModules?: { storeEnabled?: boolean; bookingsEnabled?: boolean; courtsEnabled?: boolean }
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

  // Check which modules are allowed by tenant store settings
  const courtsAllowed = storeModules ? storeModules.courtsEnabled === true : true;
  const salesAllowed = storeModules ? storeModules.storeEnabled !== false : true;
  const bookingsAllowed = storeModules ? storeModules.bookingsEnabled !== false : true;

  // 2. Canchas deportivas (Only if tenant has courtsEnabled activated)
  const isCourts = /cancha|canchas|partido|futbol|fútbol|padel|pádel|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(context);
  if (isCourts && courtsAllowed) {
    return subagents.courts?.enabled !== false ? 'courts' : 'general';
  }

  // 3. Ventas de tienda / restaurante / pedidos
  const isSales = /precio|costo|cuanto|venden|catalogo|catálogo|menu|menú|producto|productos|comprar|pedir|orden|foto|imagen|plato|comida|pizza|hamburguesa|variante|talla|sabor|llevar|delivery|envio|envío|agregar al carrito|confirmo/i.test(context);

  // 4. Citas y Servicios
  const isBooking = /servicio|servicios|cita|citas|agenda|agendar|turno|atencion|atención|doctor|especialista|cancelar cita|reagendar|disponibilidad de horario|horario de cita/i.test(context);

  if (isSales && salesAllowed && (!isBooking || !bookingsAllowed)) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && bookingsAllowed && (!isSales || !salesAllowed)) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  if (isSales && salesAllowed) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && bookingsAllowed) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  return 'general';
}

export async function processWithOrchestrator(
  tenantId: string,
  userMessage: string,
  senderPhone: string,
  senderName: string,
  chatHistory: { role: 'user' | 'assistant', content: string, createdAt?: Date }[],
  options?: { isWithin2Hours?: boolean; lastInteractionMinutesAgo?: number | null }
): Promise<OrchestratorProcessResult> {
  const tenant = await getTenantById(tenantId);
  const agentConfig: any = await getAgentConfig(tenantId);
  const orchConfig: OrchestratorConfig = agentConfig?.orchestratorConfig || defaultOrchestratorConfig;

  // 1. Fetch base tenant & website settings
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);
  const website = await getWebsiteSettingsByTenant(tenantId).catch(() => null);

  // 2. Supervisor / Router: Determine which subagent handles the turn, respecting tenant active modules
  const routedAgentId = routeIntent(userMessage, chatHistory, orchConfig, store?.storeModules);
  const currentSubagent = orchConfig.subagents[routedAgentId] || defaultOrchestratorConfig.subagents[routedAgentId];
  const routedAgentName = currentSubagent?.name || 'Agente Betico';

  const cleanPhone = senderPhone.replace(/\D/g, '');
  const baseUrl = process.env.APP_URL || 'https://betico.tech';
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : '';
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : '';
  const courtUrl = tenant?.slug ? `${baseUrl}/canchas/${tenant.slug}` : '';
  const mapsUrl = tenant?.googleMapsUrl || '';
  const officialWebUrl = tenant?.customDomain ? `https://${tenant.customDomain}` : (tenant?.slug ? `${baseUrl}/web/${tenant.slug}` : '');
  const socialLinksArr = [
    website?.instagramUrl ? `Instagram: ${website.instagramUrl}` : null,
    website?.facebookUrl ? `Facebook: ${website.facebookUrl}` : null,
    website?.tiktokUrl ? `TikTok: ${website.tiktokUrl}` : null
  ].filter(Boolean);
  const socialLinksStr = socialLinksArr.join(' | ');

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

REGLAS DE VENTA CONSULTIVA:
1. Responde con calidez tica (*pura vida*, con gusto, claro que sí).
2. Aplica venta consultiva: si el cliente duda o pide recomendaciones, sugiérele los productos destacados del catálogo.
3. Venta cruzada (up-selling): si el cliente elige un plato o producto principal, sugiere amablemente un acompañamiento, bebida o extra del catálogo.
4. Si el producto tiene variantes (sabores, tallas) u opciones, pregúntale cuál prefiere antes de continuar.
5. Desglose transparente: Lleva la cuenta sumada del pedido (Subtotal + Envío si aplica = Total en ₡CRC).
6. Pregunta si la entrega es para Envío a Domicilio (solicita dirección exacta) o Retiro en Local, y el método de pago.
7. Confirmación obligatoria: Pregunta '¿Deseas que ingrese tu orden con estos detalles a nombre de ${senderName}?' y SOLO cuando confirme explícitamente emite al final:
<<<COMMAND_ORDER: {"items":[{"productName":"Nombre Exacto","variantName":"opcional","quantity":1}], "deliveryMethod":"delivery"|"pickup", "deliveryAddress":"dirección si aplica", "customerName":"${senderName}"}>>>
8. Si el cliente solicita fotos del producto y hay foto disponible en el catálogo, puedes emitir:
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

REGLAS DE AGENDAMIENTO PROACTIVO:
1. Responde con calidez tica (*pura vida*, con mucho gusto).
2. Pregunta amablemente la fecha y hora preferida, asegurándote de que NO coincida con los HORARIOS YA OCUPADOS.
3. REGLA DE ORO ANTE HORARIOS OCUPADOS: Si la hora solicitada choca con un horario ocupado, NUNCA te limites a decir 'no está disponible'. PROPÓN PROACTIVAMENTE las 2 o 3 opciones libres más cercanas del mismo día o del día siguiente.
4. Si el cliente solicita múltiples servicios, suma los tiempos de duración estimados para agendar un bloque continuo suficiente.
5. Al acordar la cita completa con el cliente (nombre, servicio, fecha y hora confirmada), emite al final:
<<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${customerRecord?.fullName || senderName}","recordId":"${customerRecord?.id || ''}","specialistName":"opcional"}>>>
6. Para reagendar una cita existente confirmada:
<<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD","newTime":"HH:MM"}>>>
7. Para cancelar una cita activa (previa confirmación explícita del cliente):
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

REGLAS DE CANCHAS Y PARTIDOS:
1. Ofrece las canchas disponibles con sus precios por hora y modalidad ('full' para cancha completa o 'seek_match' si busca rival/partido abierto).
2. Aclara si la reserva es nocturna (a partir de las 5:30pm/6:00pm) y si la tarifa incluye iluminación.
3. Cuando el cliente confirme la reserva del partido con fecha, hora y cancha:
<<<COMMAND_COURT_BOOKING: {"courtName":"nombre cancha", "date":"YYYY-MM-DD", "time":"HH:MM", "bookingMode":"full"|"seek_match", "teamAName":"${senderName}"}>>>
4. Para reagendar o consultar una reserva de cancha, solicita su código (ej. CRT-8F2A1C o #RES-) y emite:
<<<COMMAND_RESCHEDULE_COURT: {"bookingCode":"código", "newDate":"YYYY-MM-DD", "newTime":"HH:MM", "newCourtName":"opcional"}>>>
`.trim();
      break;
    }

    case 'handoff': {
      sourcesUsed.push('handoffKeywords');
      specializedPrompt = `
ROL: Eres el Especialista en Atención de Casos Especiales y Escalado Humano de *${tenant?.name || 'nuestro negocio'}*.
${currentSubagent.prompt}

El cliente ha solicitado comunicarse con un asesor humano o presenta una duda/reclamo urgente.
PROTOCOLO DE EMPATÍA Y ESCALADO:
1. Responde de forma muy educada, empática y serena, validando su solicitud.
2. Solicita amablemente su nombre y un breve detalle de lo sucedido para que el asesor humano entre al chat con la solución preparada.
3. Emite al final:
<<<COMMAND_HANDOFF: {"reason":"Solicitado por cliente", "customerName":"${senderName}"}>>>
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
      if (store?.acceptTransfer) pArr.push('Transferencia Bancaria');
      if (store?.acceptCashOnDelivery) pArr.push('Efectivo');
      if (pArr.length > 0) paymentSummary = '💳 Formas de Pago: ' + pArr.join(', ') + ' (Facturación electrónica disponible)\n';

      let customLinksText = '';
      const validLinks = (currentSubagent?.links || []).filter((l: any) => l && l.url && l.label);
      if (validLinks.length > 0) {
        sourcesUsed.push('customLinks');
        customLinksText = '🔗 ENLACES Y RECURSOS OFICIALES (ENTREGAR ÚNICAMENTE BAJO DEMANDA):\n' +
          validLinks.map((l: any) => `• *${l.label}*: ${l.url}${l.description ? ` (${l.description})` : ''}`).join('\n') + '\n';
      }

      specializedPrompt = `
ROL: Eres el Conserje y Anfitrión Principal de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.
${currentSubagent?.prompt || 'Atiende cordialmente con calidez costarricense (*pura vida*).'}

INFORMACIÓN GENERAL DEL NEGOCIO:
Fecha/Hora CR: ${crTime}
${tenant?.address ? `📍 Dirección Física: ${tenant.address}\n` : ''}
${mapsUrl ? `🗺️ Waze / Google Maps: ${mapsUrl}\n` : ''}
${officialWebUrl ? `🌐 Sitio Web Oficial: ${officialWebUrl}\n` : ''}
${socialLinksStr ? `📱 Redes Sociales: ${socialLinksStr}\n` : ''}
${storeUrl ? `🛍️ Tienda Web: ${storeUrl}\n` : ''}
${bookingUrl ? `📅 Reservas Web: ${bookingUrl}\n` : ''}
${courtUrl ? `⚽ Canchas Deportivas: ${courtUrl}\n` : ''}
${scheduleText}${paymentSummary}${customLinksText}

REGLAS DE CONSERJE FRONT-DESK:
1. Responde amablemente con calidez tica (*pura vida*, con gusto, bienvenido).
2. Responde con precisión sobre horarios, ubicación física, formas de pago (SINPE Móvil, transferencia, efectivo, tarjeta) y facturación electrónica.
3. Si el cliente pregunta por comodidades (parqueo, wifi, pet-friendly), responde con amabilidad y honestidad.
4. PUENTE COMERCIAL OBLIGATORIO: Concluye siempre tu respuesta invitando proactivamente a la acción principal del comercio (ej: '¿Deseas que te muestre nuestro catálogo/menú de hoy o prefieres agendar una cita?').
5. LÍMITE ESTRICTO ANTI-ALUCINACIÓN: Si te preguntan algo que no esté registrado en las políticas oficiales del negocio, NO inventes datos. Ofrece amablemente conectar con un asesor humano.
`.trim();
      break;
    }
  }

  // 4. Construct AI Messages Array with Supervisor Directives & 2-Hour Session Memory
  let isSessionActive = options?.isWithin2Hours ?? false;
  let lastMinutes = options?.lastInteractionMinutesAgo ?? null;
  if (options?.isWithin2Hours === undefined && chatHistory && chatHistory.length > 0) {
    const lastMsg = chatHistory[chatHistory.length - 1];
    if (lastMsg.createdAt) {
      const diff = Math.floor((Date.now() - new Date(lastMsg.createdAt).getTime()) / (1000 * 60));
      isSessionActive = diff < 120;
      lastMinutes = diff;
    } else {
      isSessionActive = chatHistory.length >= 2;
    }
  }

  const sessionGreetingDirective = isSessionActive
    ? `⚠️ SESIÓN ACTIVA EN CURSO (${lastMinutes !== null ? `última interacción hace ${lastMinutes} min` : 'interacción reciente'}):
El cliente ya está en medio de una conversación activa contigo. ESTÁ ESTRICTAMENTE PROHIBIDO volver a saludar ("Hola", "Buenas tardes", "¿En qué te puedo ayudar hoy?"). Responde de forma directa, ágil, fluida y amable a lo que pregunta sin presentaciones repetitivas.`
    : `Saluda cordialmente presentándote como asistente de *${tenant?.name || 'nuestro negocio'}*.`;

  const chatFirstDirectives = `
REGLA DE ORO "CHAT-FIRST" Y MANEJO DE ENLACES:
1. VENTA Y ASESORÍA CONVERSACIONAL DIRECTA: Tu objetivo principal es atender, asesorar, cotizar y cerrar pedidos o citas directamente en este chat de WhatsApp.
2. ENLACES DE TIENDA Y RESERVAS (ESTRICTAMENTE BAJO DEMANDA):
   - PROHIBIDO enviar los enlaces de la tienda (${storeUrl}) o reservas (${bookingUrl}) por iniciativa propia si el cliente solo está preguntando por productos, precios, menú, citas o turnos. Atiéndelo y cierra la venta por aquí.
   - SOLO y ÚNICAMENTE entrega el link de la tienda web o reservas web SI EL CLIENTE LO PIDE EXPRESAMENTE (ej: "pásame el link", "¿tienen página web?", "mándame el catálogo en línea", "prefiero pedir por la web").
3. ENLACES INFORMATIVOS GENERALES (BAJO DEMANDA NATURAL):
   - Si el cliente pregunta cómo llegar, dónde están o por ubicación: comparte la dirección física y el enlace de Waze / Google Maps (${mapsUrl || 'disponible previa solicitud'}).
   - Si el cliente pregunta por redes sociales o página web: comparte los perfiles oficiales (${socialLinksStr || officialWebUrl || 'disponibles previa solicitud'}).
`.trim();

  const supervisorDirectives = orchConfig.prompt ? `DIRECTRICES DEL SUPERVISOR:\n${orchConfig.prompt}\n\n` : '';
  const finalSystemPrompt = `${supervisorDirectives}${specializedPrompt}\n\n${chatFirstDirectives}\n\n${sessionGreetingDirective}`;

  const structuredMessages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-8);
    for (const h of recent) {
      structuredMessages.push({ role: h.role, content: h.content });
    }
  }
  structuredMessages.push({ role: 'user', content: userMessage });

  // 5. Model Resolution with Resilient Cross-Fallback
  let primaryConfig: TenantAIConfig;
  let fallbackConfig: TenantAIConfig;
  const temperature = currentSubagent?.temperature ?? 0.3;
  let isBeticoPlatformAI = false;

  const masterConfig = await getMasterAIConfig();

  if (tenant?.aiApiKeyEncrypted) {
    try {
      const apiKey = decrypt(tenant.aiApiKeyEncrypted);
      primaryConfig = {
        provider: tenant.aiProvider || 'gemini',
        apiKey,
        model: tenant.aiModel || agentConfig?.model || 'gemini-2.5-flash',
        temperature
      };
      // For BYOK accounts, cross-fallback is Local Betico AI on VPS!
      fallbackConfig = {
        provider: 'betico_ai',
        apiKey: 'ollama',
        model: 'betico-ai',
        temperature,
        baseUrl: masterConfig.baseUrl || process.env.OLLAMA_URL || 'http://beticoia_ollama:11434/v1'
      };
      isBeticoPlatformAI = false;
    } catch (e) {
      primaryConfig = { provider: 'betico_ai', apiKey: 'ollama', model: 'betico-ai', temperature, baseUrl: masterConfig.baseUrl };
      fallbackConfig = { provider: 'gemini', apiKey: masterConfig.apiKey, model: 'gemini-2.5-flash', temperature };
      isBeticoPlatformAI = true;
    }
  } else {
    isBeticoPlatformAI = true;
    const isLocalOllama = (masterConfig.provider === 'betico_ai' || masterConfig.provider === 'ollama');
    const virtualModel = (tenant && isLocalOllama) ? getTenantModelName(tenant) : masterConfig.model;
    primaryConfig = {
      provider: masterConfig.provider,
      apiKey: masterConfig.apiKey,
      model: virtualModel,
      temperature,
      baseUrl: masterConfig.baseUrl
    };
    // For Betico AI accounts, cross-fallback is Gemini Flash Master!
    fallbackConfig = {
      provider: 'gemini',
      apiKey: masterConfig.apiKey,
      model: 'gemini-2.5-flash',
      temperature
    };
  }

  // 6. Execute Inference with Resilient Cross-Fallback
  const aiResult = await callAI(primaryConfig, {
    system: finalSystemPrompt,
    messages: structuredMessages
  }, fallbackConfig);

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
