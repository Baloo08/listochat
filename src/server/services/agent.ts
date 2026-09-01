import { callAI, TenantAIConfig, getMasterAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { getTenantCurrentMonthUsage, incrementTenantUsage } from '../db/ai-usage.repo.js';

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

  // 3. MASTER SYSTEM PROMPT (SUPREME AUTHORITY + ENRICHED RAG)
  const masterSystemPrompt = `Eres el Asistente Virtual Oficial con IA de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.

=== INSTRUCCIONES MAESTRAS DEL NEGOCIO (MÁXIMA PRIORIDAD) ===
${agentConfig?.systemPrompt || 'Atiende amablemente a los clientes, brinda información de servicios y ayuda a agendar citas o compras.'}
==============================================================

=== FUENTE DE VERDAD OFICIAL (CATÁLOGO, HORARIOS Y PAGOS) ===
- Fecha/Hora (Costa Rica): ${crTime}
${bookingUrl ? `- Enlace de Citas: ${bookingUrl}` : ''}
${storeUrl ? `- Enlace de Tienda: ${storeUrl}` : ''}
${scheduleInfo}${paymentInfo}${relevantServicesText}${relevantProductsText}=============================================================

REGLAS DE ATENCIÓN:
1. Adopta fielmente la personalidad y tono de las INSTRUCCIONES MAESTRAS.
2. Usa ÚNICAMENTE los datos del catálogo oficial. NUNCA inventes precios ni productos fuera de lista.
3. Formato WhatsApp: Usa *negrita* para resaltar nombres/precios y emojis amigables.
4. Respuestas concisas (1 a 2 párrafos). Si hay historial previo, no repitas el saludo de bienvenida.
5. Si el cliente pide pagar con SINPE o Transferencia, dale los datos y pídele enviar el comprobante a este chat.

COMANDOS DE ACCIÓN (Añade al final de tu respuesta solo si se confirma la acción):
- Confirmar Cita: <<<COMMAND_BOOKING: {"service": "Nombre exacto", "date": "YYYY-MM-DD", "time": "HH:MM", "customerName": "${senderName}"}>>>
- Confirmar Compra: <<<COMMAND_ORDER: {"items": [{"productName": "Nombre exacto", "quantity": 1}]}>>>
- Enviar Foto: <<<COMMAND_SEND_MEDIA: {"mediaUrl": "URL", "caption": "Descripción"}>>>
- Pasar a Humano: <<<COMMAND_HANDOFF: {"reason": "Motivo"}>>>
`;

  let prompt = `Historial Reciente:
${chatHistory.slice(-4).map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Cliente (${senderName} / ${senderPhone}): ${userMessage}
`;

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
      temperature: agentConfig?.temperature || 0.2,
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
      temperature: agentConfig?.temperature || 0.2
    };
  }

  const aiResult = await callAI(config, prompt, masterSystemPrompt);
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

  const bookingRegex = /<<<COMMAND_BOOKING:\s*({.*?})>>>/s;
  const orderRegex = /<<<COMMAND_ORDER:\s*({.*?})>>>/s;
  const handoffRegex = /<<<COMMAND_HANDOFF:\s*({.*?})>>>/s;
  const mediaRegex = /<<<COMMAND_SEND_MEDIA:\s*({.*?})>>>/s;

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
    tokensUsed: aiResult.tokensUsed
  };
}
