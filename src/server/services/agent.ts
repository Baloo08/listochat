import { callAI, TenantAIConfig, getMasterAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { getTenantCurrentMonthUsage, incrementTenantUsage } from '../db/ai-usage.repo.js';
import { query } from '../db/pool.js';

export interface AgentProcessResult {
  replyText: string;
  isBookingDetected: boolean;
  bookingData?: any;
  isOrderDetected: boolean;
  orderData?: any;
  isHandoffRequested: boolean;
  handoffReason?: string;
  isMediaDetected?: boolean;
  mediaData?: { mediaUrl: string; caption?: string };
  isCancelBookingDetected?: boolean;
  cancelBookingData?: any;
  isRescheduleBookingDetected?: boolean;
  rescheduleBookingData?: any;
  tokensUsed?: number;
}

export async function processWhatsAppMessageWithAI(
  tenantId: string,
  userMessage: string,
  senderPhone: string,
  senderName: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<AgentProcessResult> {
  const tenant = await getTenantById(tenantId);
  const agentConfig: any = await getAgentConfig(tenantId);
  const services: any[] = await getServicesByTenant(tenantId);
  const products: any[] = await getProductsByTenant(tenantId, true);
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);

  const now = new Date();
  const crTime = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);

  const baseUrl = process.env.APP_URL || 'https://betico.tech';
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : '';
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : '';

  // 1. SMART INTENT DETECTION & KEYWORD MATCHING
  const lowerMsg = userMessage.toLowerCase().trim();
  const isPureGreeting = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|alo|hi|saludos|pura vida|hola que tal|hola como estas)[s!.,?]*$/i.test(lowerMsg);
  const asksForServices = /servicio|cita|reserva|agenda|agendar|horario|hora|fecha|disponib|turno|atencion|lavado|pulido|mantenimiento/i.test(lowerMsg);
  const asksForProducts = /precio|costo|cuanto|venden|catalogo|menu|producto|comprar|pedir|orden|foto|imagen|quiero|plato|comida|pizza|hamburguesa|cera/i.test(lowerMsg);
  const asksForPayments = /sinpe|transferencia|pago|pagar|cuenta|banco|efectivo|tarjeta|cuentas/i.test(lowerMsg);
  const asksForLocation = /ubicacion|donde|direccion|llegar|local|tienda|sucursal|mapa/i.test(lowerMsg);
  const asksForHuman = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente/i.test(lowerMsg);

  // 2. ENRICHED RAG BLOCKS (Concise, High Density)
  let paymentInfo = '';
  if (asksForPayments || asksForProducts || !isPureGreeting) {
    const methods: string[] = [];
    if (store?.acceptSinpe && store.sinpePhone) methods.push(`SINPE Móvil: ${store.sinpePhone} (${store.sinpeName || tenant?.name})`);
    if (store?.acceptTransfer && store.bankAccountInfo) methods.push(`Transferencia: ${store.bankAccountInfo}`);
    if (store?.acceptCashOnDelivery) methods.push('Efectivo contra entrega');
    if (store?.deliveryEnabled) methods.push(`Envío: ₡${Number(store.deliveryFee || 0).toLocaleString('es-CR')}`);
    if (methods.length > 0) paymentInfo = '💳 Pagos: ' + methods.join(' | ') + '\n';
  }

  let scheduleInfo = '';
  if (asksForServices || asksForLocation || !isPureGreeting) {
    if (schedule?.jornadaConfig) {
      const j = schedule.jornadaConfig;
      scheduleInfo = `⏰ Horario: ${j.startHour || '08:00'} a ${j.endHour || '17:00'} (${j.slotMinutes || 45}m por cita)\n`;
    }
    if (schedule?.vacationConfig?.enabled) {
      const v = schedule.vacationConfig;
      scheduleInfo += `⚠️ Cierre temporal: ${v.startDate} al ${v.endDate} (${v.message})\n`;
    }
  }

  // Smart Filtering for Services
  let relevantServicesText = '';
  if (!isPureGreeting && services.length > 0) {
    const userWords = lowerMsg.split(/\s+/).filter(w => w.length > 2);
    let matchedServices = services.filter(s => {
      const sName = s.name.toLowerCase();
      const sCat = (s.category || '').toLowerCase();
      return userWords.some(w => sName.includes(w) || sCat.includes(w));
    });

    if (matchedServices.length === 0) {
      matchedServices = services.slice(0, 4); // Top 4 if generic query
    }

    if (matchedServices.length > 0) {
      relevantServicesText = '🚗 Servicios:\n' + matchedServices.map(s => 
        `• ${s.name}: ₡${Number(s.price || 0).toLocaleString('es-CR')} (${s.duration || `${s.estimatedMinutes || 45}m`})`
      ).join('\n') + '\n';
    }
  }

  // Smart Filtering for Products
  let relevantProductsText = '';
  if (!isPureGreeting && products.length > 0) {
    const userWords = lowerMsg.split(/\s+/).filter(w => w.length > 2);
    let matchedProducts = products.filter(p => {
      const pName = p.name.toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pTags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
      return userWords.some(w => pName.includes(w) || pCat.includes(w) || pTags.includes(w));
    });

    if (matchedProducts.length === 0) {
      matchedProducts = products.slice(0, 4); // Top 4 if generic query
    }

    if (matchedProducts.length > 0) {
      relevantProductsText = '🛍️ Productos:\n' + matchedProducts.map(p => {
        let photoUrl = '';
        if (p.images && p.images.length > 0) {
          const rawUrl = p.images[0].url;
          photoUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
        }
        return `• ${p.name}: ₡${Number(p.price || 0).toLocaleString('es-CR')} (Stock: ${p.stock ?? 'disp'})${photoUrl ? ` [Foto:${photoUrl}]` : ''}`;
      }).join('\n') + '\n';
    }
  }
  // 3. FETCH ACTIVE BOOKINGS FOR THIS CUSTOMER
  let activeCustomerBookingsText = '';
  try {
    const cleanPhone = senderPhone.replace(/\D/g, '');
    const activeAppts = await query(`
      SELECT service, date, time, status 
      FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
      ORDER BY date ASC, time ASC
      LIMIT 3
    `, [tenantId, cleanPhone.slice(-8)]);

    if (activeAppts.rows.length > 0) {
      activeCustomerBookingsText = '\nCITAS ACTIVAS DE ESTE CLIENTE:\n' + activeAppts.rows.map((a: any) => 
        `- ${a.service} para el ${a.date} a las ${a.time} (Estado: ${a.status === 'confirmed' ? 'Confirmada' : 'Programada'})`
      ).join('\n') + '\n';
    }
  } catch (e) {}

  // 4. BUILD OPTIMIZED SINGLE PROMPT (with strong guardrails for 8B model)
  let prompt = `Eres el asistente virtual de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.
IDIOMA: Responde SIEMPRE en español de Costa Rica. NUNCA en otro idioma.
${agentConfig?.systemPrompt || 'Atiende amablemente a los clientes.'}

Datos del negocio:
${crTime}
${(agentConfig?.showBookingLink !== false && bookingUrl) ? `Reservas online: ${bookingUrl}` : ''}${(agentConfig?.showStoreLink !== false && storeUrl) ? ` | Tienda online: ${storeUrl}` : ''}
${scheduleInfo}${paymentInfo}${relevantServicesText}${relevantProductsText}${activeCustomerBookingsText}
REGLAS OBLIGATORIAS:
1. Responde SOLO en español. Nunca portugués, inglés ni otro idioma.
2. Usa el nombre EXACTO del cliente como aparece abajo. No lo modifiques ni abrevies.
3. Usa *negrita* y emojis para dar calidez. Sé conciso (1-2 párrafos máximo).
4. Solo menciona servicios, productos y precios que aparezcan arriba en "Datos del negocio". Si no aparece, di "consultaré con el equipo".
5. NUNCA inventes URLs, links, procesos, pasos ni información que no esté en los datos.
6. Si hay historial de conversación, no repitas el saludo. Continúa la conversación naturalmente.
7. Para pagos SINPE/Transferencia, da los datos de pago del negocio y pide el comprobante.
8. GESTIÓN DE CITAS:
- Para AGENDAR: Cuando el cliente elija servicio, fecha y hora, añade <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}"}>>>.
- Para CANCELAR: Si el cliente pide cancelar una cita activa, SIEMPRE pregúntale primero para confirmar: "¿Estás seguro de que deseas cancelar tu cita de [Servicio] para el [Fecha] a las [Hora]?". SOLO si el cliente responde confirmando ("sí", "confirmo", "correcto", "cancélala"), añade <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD", "reason":"solicitado por cliente"}>>>.
- Para REAGENDAR: Ofrécele los horarios libres disponibles y cuando confirme la nueva fecha y hora, añade <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD", "newTime":"HH:MM"}>>>.

Acciones (añade al final SOLO cuando corresponda):
Cita: <<<COMMAND_BOOKING: {"service":"nombre","date":"YYYY-MM-DD","time":"HH:MM","customerName":"${senderName}"}>>>
Cancelar: <<<COMMAND_CANCEL_BOOKING: {"date":"YYYY-MM-DD","reason":"motivo"}>>>
Reagendar: <<<COMMAND_RESCHEDULE_BOOKING: {"newDate":"YYYY-MM-DD","newTime":"HH:MM"}>>>
Compra: <<<COMMAND_ORDER: {"items":[{"productName":"nombre","quantity":1}]}>>>
Foto: <<<COMMAND_SEND_MEDIA: {"mediaUrl":"URL","caption":"desc"}>>>
Humano: <<<COMMAND_HANDOFF: {"reason":"motivo"}>>>

${chatHistory.slice(-3).map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Cliente (${senderName}): ${userMessage}
Asistente:`;

  let apiKey = '';
  let isMarcaBlanca = false;

  if (tenant?.aiApiKeyEncrypted) {
    try { apiKey = decrypt(tenant.aiApiKeyEncrypted); } catch (e) {}
  }

  let config: TenantAIConfig;

  if (apiKey) {
    config = {
      provider: (tenant?.aiProvider as any) || 'gemini',
      apiKey,
      model: tenant?.aiModel || agentConfig?.model || 'gemini-2.5-flash',
      temperature: agentConfig?.temperature || 0.7,
    };
  } else {
    isMarcaBlanca = true;
    const usage = await getTenantCurrentMonthUsage(tenantId);
    if (usage.isExceeded) {
      return {
        replyText: 'Hola, el asistente virtual de este negocio ha completado su cuota mensual de atención automática. Un asesor humano te responderá en breve.',
        isBookingDetected: false,
        isOrderDetected: false,
        isHandoffRequested: true,
        handoffReason: 'Límite de cuota mensual de IA alcanzado',
        tokensUsed: 0
      };
    }

    const masterConfig = await getMasterAIConfig();
    config = {
      ...masterConfig,
      temperature: agentConfig?.temperature || 0.7
    };
  }

  const aiResult = await callAI(config, prompt);
  let replyText = aiResult.text;

  // Track token usage for Marca Blanca tenants
  if (isMarcaBlanca && aiResult.tokensUsed > 0) {
    await incrementTenantUsage(tenantId, aiResult.tokensUsed);
  }

  let isBookingDetected = false;
  let bookingData;
  let isOrderDetected = false;
  let orderData;
  let isHandoffRequested = false;
  let handoffReason;
  let isMediaDetected = false;
  let mediaData;
  let isCancelBookingDetected = false;
  let cancelBookingData;
  let isRescheduleBookingDetected = false;
  let rescheduleBookingData;

  const bookingRegex = /<<<COMMAND_BOOKING:\s*({.*?})>>>/s;
  const orderRegex = /<<<COMMAND_ORDER:\s*({.*?})>>>/s;
  const handoffRegex = /<<<COMMAND_HANDOFF:\s*({.*?})>>>/s;
  const mediaRegex = /<<<COMMAND_SEND_MEDIA:\s*({.*?})>>>/s;
  const cancelRegex = /<<<COMMAND_CANCEL_BOOKING:\s*({.*?})>>>/s;
  const rescheduleRegex = /<<<COMMAND_RESCHEDULE_BOOKING:\s*({.*?})>>>/s;

  const bookingMatch = replyText.match(bookingRegex);
  if (bookingMatch && bookingMatch[1]) {
    try {
      const parsed = JSON.parse(bookingMatch[1]);
      if (parsed && parsed.service && (parsed.date || parsed.time)) {
        isBookingDetected = true;
        bookingData = parsed;
      }
    } catch (e) {}
  }

  const cancelMatch = replyText.match(cancelRegex);
  if (cancelMatch && cancelMatch[1]) {
    try {
      isCancelBookingDetected = true;
      cancelBookingData = JSON.parse(cancelMatch[1]);
    } catch (e) {}
  }

  const rescheduleMatch = replyText.match(rescheduleRegex);
  if (rescheduleMatch && rescheduleMatch[1]) {
    try {
      const parsed = JSON.parse(rescheduleMatch[1]);
      if (parsed && (parsed.newDate || parsed.newTime)) {
        isRescheduleBookingDetected = true;
        rescheduleBookingData = parsed;
      }
    } catch (e) {}
  }

  const orderMatch = replyText.match(orderRegex);
  if (orderMatch && orderMatch[1]) {
    try {
      const parsed = JSON.parse(orderMatch[1]);
      if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
        const validItems = parsed.items.filter((it: any) => it.productName && it.productName.trim().length > 0);
        if (validItems.length > 0) {
          isOrderDetected = true;
          orderData = { ...parsed, items: validItems };
        }
      }
    } catch (e) {}
  }

  const handoffMatch = replyText.match(handoffRegex);
  if (handoffMatch && handoffMatch[1]) {
    isHandoffRequested = true;
    try { handoffReason = JSON.parse(handoffMatch[1]).reason; } catch (e) {}
  }

  const mediaMatch = replyText.match(mediaRegex);
  if (mediaMatch && mediaMatch[1]) {
    isMediaDetected = true;
    try { mediaData = JSON.parse(mediaMatch[1]); } catch (e) {}
  }

  replyText = replyText
    .replace(bookingRegex, '')
    .replace(orderRegex, '')
    .replace(handoffRegex, '')
    .replace(mediaRegex, '')
    .replace(cancelRegex, '')
    .replace(rescheduleRegex, '')
    .replace(/\*\*/g, '*')
    .trim();

  return {
    replyText,
    isBookingDetected,
    bookingData,
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
    tokensUsed: aiResult.tokensUsed
  };
}
