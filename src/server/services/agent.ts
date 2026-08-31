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
    timeStyle: 'long',
  }).format(now);

  const baseUrl = process.env.APP_URL || 'https://betico-app.qvtdko.easypanel.host';
  const storeUrl = tenant?.slug ? `${baseUrl}/tienda/${tenant.slug}` : '';
  const bookingUrl = tenant?.slug ? `${baseUrl}/reservas/${tenant.slug}` : '';

  // Format Payment Methods Info
  let paymentInfo = 'Métodos de Pago Disponibles:\n';
  if (store?.acceptSinpe && store.sinpePhone) {
    paymentInfo += `- SINPE Móvil: ${store.sinpePhone} (Titular: ${store.sinpeName || tenant?.name})\n`;
  }
  if (store?.acceptTransfer && store.bankAccountInfo) {
    paymentInfo += `- Transferencia Bancaria: ${store.bankAccountInfo}\n`;
  }
  if (store?.acceptCashOnDelivery) {
    paymentInfo += `- Efectivo / Contra entrega aceptado\n`;
  }
  if (store?.deliveryEnabled) {
    paymentInfo += `- Envíos a domicilio: Tarifa estándar ₡${Number(store.deliveryFee || 0).toLocaleString('es-CR')}\n`;
  }
  if (store?.pickupEnabled) {
    paymentInfo += `- Retiro en tienda/local disponible gratis\n`;
  }

  // Format Schedule & Availability Info
  let scheduleInfo = 'Horarios y Disponibilidad de Agenda:\n';
  if (schedule?.jornadaConfig) {
    const j = schedule.jornadaConfig;
    scheduleInfo += `- Horario de atención: ${j.startHour || '08:00'} a ${j.endHour || '17:00'}\n`;
    scheduleInfo += `- Duración estándar por cita: ${j.slotMinutes || 45} minutos\n`;
    if (j.hasBreak) {
      scheduleInfo += `- Horario de descanso/almuerzo: ${j.breakStart || '12:00'} a ${j.breakEnd || '13:00'}\n`;
    }
  }

  if (schedule?.vacationConfig?.enabled) {
    const v = schedule.vacationConfig;
    scheduleInfo += `\n⚠️ ATENCIÓN - MODO VACACIONES / CIERRE TEMPORAL ACTIVO:\n`;
    scheduleInfo += `- Período de cierre: del ${v.startDate} al ${v.endDate}\n`;
    scheduleInfo += `- Mensaje al cliente: "${v.message}"\n`;
    scheduleInfo += `- Si el cliente solicita cita dentro de esas fechas, infórmale amablemente del cierre temporal.\n`;
  }

  if (schedule?.customFields && schedule.customFields.length > 0) {
    scheduleInfo += `\nPreguntas específicas que debes hacer al cliente al agendar:\n`;
    schedule.customFields.forEach((f: any) => {
      scheduleInfo += `- ${f.label}${f.required ? ' (Requerido)' : ' (Opcional)'}\n`;
    });
  }

  const formatProductWithPhoto = (p: any) => {
    let photoUrl = '';
    if (p.images && p.images.length > 0) {
      const rawUrl = p.images[0].url;
      photoUrl = rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`;
    }
    return `• ${p.name}: ${p.description || ''} | Precio: ₡${Number(p.price || 0).toLocaleString('es-CR')} | Stock: ${p.stock ?? 'disponible'}${photoUrl ? ` | FotoURL: ${photoUrl}` : ''}`;
  };

  let prompt = `
Eres el Asistente Virtual Oficial con Inteligencia Artificial de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.

Configuración e Instrucciones de Personalidad (System Prompt):
${agentConfig?.systemPrompt || 'Atiende amablemente a los clientes, brinda información de servicios y ayuda a agendar citas o compras.'}

Contexto Operativo y Enlaces Oficiales en Tiempo Real:
- Fecha y hora actual en Costa Rica: ${crTime}
- Nombre del cliente: ${senderName}
- Teléfono del cliente: ${senderPhone}
${bookingUrl ? `- Enlace directo del negocio para agendar citas en línea: ${bookingUrl}` : ''}
${storeUrl ? `- Enlace directo a la tienda / menú en línea: ${storeUrl}` : ''}

${scheduleInfo}

${paymentInfo}

Catálogo Oficial de Servicios Disponibles:
${services.length > 0 ? services.map(s => `• ${s.name}: ${s.description || ''} | Precio: ₡${Number(s.price || 0).toLocaleString('es-CR')} | Duración: ${s.duration || `${s.estimatedMinutes || 45} min`}`).join('\n') : 'No hay servicios registrados actualmente.'}

Catálogo Oficial de Productos Disponibles:
${products.length > 0 ? products.map(p => formatProductWithPhoto(p)).join('\n') : 'No hay productos en inventario actualmente.'}

Historial Reciente de la Conversación:
${chatHistory.map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Último mensaje recibido:
Cliente: ${userMessage}

Instrucciones Especiales y Comandos Ocultos (NO los muestres al cliente en el texto visible, inclúyelos en tu respuesta SOLAMENTE si se confirman los datos o se solicita una foto):
- Si el cliente solicita ver una foto, imagen o cómo luce un producto y dicho producto tiene FotoURL en el catálogo, incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_SEND_MEDIA: {"mediaUrl": "URL_DE_LA_FOTO", "caption": "Descripción breve del producto"}>>>
- Si el cliente pregunta por la tienda, catálogo digital o menú completo, invítalo educadamente y dale el enlace: ${storeUrl || 'nuestro catálogo digital'}
- Si el cliente pregunta cómo agendar una cita o ver los horarios disponibles, dale el enlace: ${bookingUrl || 'nuestro portal de reservas'}
- Si el cliente confirma de forma definitiva querer agendar un servicio (con fecha y hora confirmadas), incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_BOOKING: {"service": "Nombre del servicio", "date": "YYYY-MM-DD", "time": "HH:MM", "customerName": "${senderName}"}>>>
- Si el cliente confirma de forma definitiva querer hacer una compra de productos (con productos específicos y cantidades claras), incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_ORDER: {"items": [{"productName": "Nombre exacto del producto del catálogo", "quantity": 1}]}>>>
- Si el cliente pide hablar con un humano o asesor, incluye al final:
  <<<COMMAND_HANDOFF: {"reason": "Motivo breve"}>>>

Reglas estrictas de comportamiento e Inteligencia:
1. SUPRESIÓN DE SALUDOS REDUNDANTES: Si ya existen mensajes previos en el 'Historial Reciente de la Conversación' (${chatHistory.length} mensajes previos), NO vuelvas a saludar (no digas "¡Hola!", "Buenas tardes", "¿Cómo te ayudo?"). Ve DIRECTO al grano respondiendo lo que el cliente consultó.
2. INTERPRETACIÓN FLEXIBLE DE PRODUCTOS (Fuzzy Matching): Si el cliente pide un producto con palabras coloquiales o incompletas (por ejemplo: "quiero una de pepperoni", "dame una hamburguesa"), asócialo inteligentemente con el producto correspondiente del Catálogo Oficial. Si hay ambigüedad o múltiples variantes/tamaños, pregúntale amablemente cuál prefiere antes de crear la orden.
3. PROHIBICIÓN TOTAL DE ÓRDENES VACÍAS: NUNCA emitas <<<COMMAND_ORDER>>> si el cliente solo está preguntando precios, saludando o consultando opciones. Emite <<<COMMAND_ORDER>>> ÚNICAMENTE cuando el cliente haya confirmado explícitamente qué producto y cantidad desea pedir.
4. NUNCA inventes productos, servicios o precios que no figuren en los catálogos anteriores.
5. Utiliza siempre el formato nativo de WhatsApp (*negrita* para resaltar, _cursiva_ y emojis con moderación).
6. Sé cordial, resolutivo, claro, conciso y empático.
`;

  let apiKey = '';
  let isMarcaBlanca = false;

  if (tenant?.aiApiKeyEncrypted) {
    try { apiKey = decrypt(tenant.aiApiKeyEncrypted); } catch (e) {}
  }

  let config: TenantAIConfig;

  if (apiKey) {
    // Tenant is using their own private API Key (BYOK)
    config = {
      provider: (tenant?.aiProvider as any) || 'gemini',
      apiKey,
      model: tenant?.aiModel || agentConfig?.model || 'gemini-2.5-flash',
      temperature: agentConfig?.temperature || 0.7,
    };
  } else {
    // Tenant is using Betico AI Marca Blanca (LocalAI / Master AI)
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
        // Ensure items have non-empty product names
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
