import { callAI, TenantAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';

export interface AgentProcessResult {
  replyText: string;
  isBookingDetected: boolean;
  bookingData?: any;
  isOrderDetected: boolean;
  orderData?: any;
  isHandoffRequested: boolean;
  handoffReason?: string;
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

  let prompt = `
Eres el Asistente Virtual Oficial con Inteligencia Artificial de *${tenant?.name || 'nuestro negocio'}* en WhatsApp.

Configuración e Instrucciones de Personalidad (System Prompt):
${agentConfig?.systemPrompt || 'Atiende amablemente a los clientes, brinda información de servicios y ayuda a agendar citas o compras.'}

Contexto Operativo en Tiempo Real:
- Fecha y hora actual en Costa Rica: ${crTime}
- Nombre del cliente: ${senderName}
- Teléfono del cliente: ${senderPhone}
${bookingUrl ? `- Enlace directo para agendar en línea: ${bookingUrl}` : ''}
${storeUrl ? `- Enlace directo a la tienda en línea: ${storeUrl}` : ''}

${scheduleInfo}

${paymentInfo}

Catálogo Oficial de Servicios Disponibles:
${services.length > 0 ? services.map(s => `• ${s.name}: ${s.description || ''} | Precio: ₡${Number(s.price || 0).toLocaleString('es-CR')} | Duración: ${s.duration || `${s.estimatedMinutes || 45} min`}`).join('\n') : 'No hay servicios registrados actualmente.'}

Catálogo Oficial de Productos Disponibles:
${products.length > 0 ? products.map(p => `• ${p.name}: ${p.description || ''} | Precio: ₡${Number(p.price || 0).toLocaleString('es-CR')} | Stock: ${p.stock ?? 'disponible'}`).join('\n') : 'No hay productos en inventario actualmente.'}

Historial Reciente de la Conversación:
${chatHistory.map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Último mensaje recibido:
Cliente: ${userMessage}

Instrucciones Especiales y Comandos Ocultos (NO los muestres al cliente en el texto visible, inclúyelos en tu respuesta SOLAMENTE si se confirman los datos):
- Si el cliente confirma querer agendar un servicio, incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_BOOKING: {"service": "Nombre del servicio", "date": "YYYY-MM-DD", "time": "HH:MM", "customerName": "${senderName}"}>>>
- Si el cliente confirma querer hacer una compra de productos, incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_ORDER: {"items": [{"productName": "Nombre del producto", "quantity": 1}]}>>>
- Si el cliente pide hablar con un humano o asesor, incluye al final:
  <<<COMMAND_HANDOFF: {"reason": "Motivo breve"}>>>

Reglas estrictas de comportamiento:
1. NUNCA inventes productos, servicios o precios que no figuren en los catálogos anteriores.
2. Utiliza siempre el formato nativo de WhatsApp (*negrita* para resaltar, _cursiva_ y emojis con moderación).
3. Sé cordial, resolutivo, claro y conciso.
`;

  let apiKey = '';
  if (tenant?.aiApiKeyEncrypted) {
    try { apiKey = decrypt(tenant.aiApiKeyEncrypted); } catch (e) {}
  }
  if (!apiKey) {
    apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || 'AQ.Ab8RN6IHcdDKDITkdIOjt8SznSc6lS_1grotOA6SQ6fjZnd2SQ';
  }

  const model = tenant?.aiModel === 'gemini-2.5-flash' ? 'gemini-1.5-flash' : (tenant?.aiModel || agentConfig?.model || 'gemini-1.5-flash');

  const config: TenantAIConfig = {
    provider: (tenant?.aiProvider as any) || 'gemini',
    apiKey,
    model,
    temperature: agentConfig?.temperature || 0.7,
  };

  const aiResult = await callAI(config, prompt);
  let replyText = aiResult.text;

  let isBookingDetected = false;
  let bookingData;
  let isOrderDetected = false;
  let orderData;
  let isHandoffRequested = false;
  let handoffReason;

  const bookingRegex = /<<<COMMAND_BOOKING:\s*({.*?})>>>/s;
  const orderRegex = /<<<COMMAND_ORDER:\s*({.*?})>>>/s;
  const handoffRegex = /<<<COMMAND_HANDOFF:\s*({.*?})>>>/s;

  const bookingMatch = replyText.match(bookingRegex);
  if (bookingMatch && bookingMatch[1]) {
    isBookingDetected = true;
    try { bookingData = JSON.parse(bookingMatch[1]); } catch (e) {}
  }

  const orderMatch = replyText.match(orderRegex);
  if (orderMatch && orderMatch[1]) {
    isOrderDetected = true;
    try { orderData = JSON.parse(orderMatch[1]); } catch (e) {}
  }

  const handoffMatch = replyText.match(handoffRegex);
  if (handoffMatch && handoffMatch[1]) {
    isHandoffRequested = true;
    try { handoffReason = JSON.parse(handoffMatch[1]).reason; } catch (e) {}
  }

  replyText = replyText
    .replace(bookingRegex, '')
    .replace(orderRegex, '')
    .replace(handoffRegex, '')
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
    tokensUsed: aiResult.tokensUsed
  };
}
