import { callAI, TenantAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getTenantById } from '../db/tenant.repo.js';

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

  const now = new Date();
  const crTime = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(now);

  let prompt = `
Eres un asistente virtual inteligente para ${tenant?.name || 'nuestro negocio'} en WhatsApp.
Configuración del asistente:
${agentConfig?.systemPrompt || 'Ayuda a los clientes con sus consultas cordialmente.'}

Información actual:
- Fecha y hora actual en Costa Rica: ${crTime}
- Nombre del cliente: ${senderName}
- Teléfono del cliente: ${senderPhone}

Catálogo de Servicios:
${services.map(s => `- ${s.name}: ${s.description || ''} (Precio: ₡${Number(s.price || 0).toLocaleString()}, Duración: ${s.duration || '60 min'})`).join('\n')}

Catálogo de Productos:
${products.map(p => `- ${p.name}: ${p.description || ''} (Precio: ₡${Number(p.price || 0).toLocaleString()})`).join('\n')}

Historial de Chat:
${chatHistory.map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Último mensaje del cliente:
Cliente: ${userMessage}

Instrucciones Especiales y Comandos Ocultos (NO los muestres al cliente, inclúyelos en tu respuesta SOLAMENTE si se confirman los datos):
- Si el cliente confirma querer agendar un servicio, incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_BOOKING: {"service": "Nombre del servicio", "date": "YYYY-MM-DD", "time": "HH:MM"}>>>
- Si el cliente confirma querer hacer una compra de productos, incluye al final de tu respuesta EXACTAMENTE:
  <<<COMMAND_ORDER: {"items": [{"productName": "Nombre del producto", "quantity": 1}]}>>>
- Si el cliente pide hablar con un humano, incluye al final de tu respuesta:
  <<<COMMAND_HANDOFF: {"reason": "Motivo breve"}>>>

Reglas estrictas:
1. NUNCA inventes productos, servicios o precios que no estén en el catálogo.
2. Usa el formato de WhatsApp para texto (ejemplo: *negrita*, _cursiva_).
3. Sé profesional, conciso y amable.
`;

  let apiKey = '';
  if (tenant?.aiApiKeyEncrypted) {
    try { apiKey = decrypt(tenant.aiApiKeyEncrypted); } catch (e) {}
  }
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '';
  }

  const config: TenantAIConfig = {
    provider: (tenant?.aiProvider as any) || 'gemini',
    apiKey,
    model: tenant?.aiModel || agentConfig?.model || 'gemini-2.5-flash',
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
