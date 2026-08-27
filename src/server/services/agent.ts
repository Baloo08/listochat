import { callAI, TenantAIConfig } from './ai-provider.js';
import { decrypt } from './encryption.js';
import * as agentRepo from '../repositories/agent.repo.js';
import * as servicesRepo from '../repositories/services.repo.js';
import * as productsRepo from '../repositories/products.repo.js';
import * as appointmentsRepo from '../repositories/appointments.repo.js';

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
  
  // 1. Fetch data from DB
  const agentConfig: any = await agentRepo.getAgentConfig(tenantId);
  const services: any[] = await servicesRepo.getServices(tenantId);
  
  const storeEnabled = agentConfig?.storeEnabled ?? false;
  const products: any[] = storeEnabled ? await productsRepo.getProducts(tenantId) : [];
  
  // 2. Format date and time in Costa Rica
  const now = new Date();
  const crTime = new Intl.DateTimeFormat('es-CR', {
    timeZone: 'America/Costa_Rica',
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(now);

  const availableSlots = 'Lunes a Viernes 8am-5pm (Simplificado)';
  const paymentMethods = 'Efectivo, Tarjeta, Sinpe Móvil';
  
  // 3. Build dynamic prompt
  let prompt = `
Eres un asistente virtual profesional para un negocio a través de WhatsApp.
Configuración del asistente:
${agentConfig?.systemPrompt || 'Ayuda a los clientes con sus consultas.'}

Información actual:
- Fecha y hora actual en Costa Rica: ${crTime}
- Nombre del cliente: ${senderName}
- Teléfono del cliente: ${senderPhone}

Catálogo de Servicios:
${services.map(s => `- ${s.name}: ${s.description} (Precio: ${s.price}, Duración: ${s.duration} min)`).join('\n')}
`;

  if (storeEnabled) {
    prompt += `
Catálogo de Productos:
${products.map(p => `- ${p.name}: ${p.description} (Precio: ${p.price}, Stock: ${p.stock})`).join('\n')}

Métodos de pago aceptados: ${paymentMethods}
`;
  }

  prompt += `
Disponibilidad: ${availableSlots}

Historial de Chat:
${chatHistory.map(h => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

Último mensaje del cliente:
Cliente: ${userMessage}

Instrucciones Especiales y Comandos Ocultos (NO los muestres al cliente, inclúyelos en tu respuesta SOLAMENTE si se cumplen las condiciones, usa formato exacto):
- Si el cliente confirma querer agendar un servicio, incluye al final de tu respuesta EXACTAMENTE:
  COMMAND_BOOKING: {"serviceName": "Nombre", "date": "YYYY-MM-DD", "time": "HH:MM"}
- Si el cliente confirma querer hacer una compra de productos, incluye al final de tu respuesta EXACTAMENTE:
  COMMAND_ORDER: {"items": [{"productName": "Nombre", "quantity": 1}]}
- Si el cliente pide hablar con un humano o no puedes ayudarle, incluye al final de tu respuesta EXACTAMENTE:
  COMMAND_HANDOFF: {"reason": "Motivo breve"}

Reglas estrictas:
1. NUNCA inventes productos, servicios o precios que no estén en el catálogo.
2. Usa el formato de WhatsApp para texto (ejemplo: *negrita*, _cursiva_).
3. Sé profesional y amable.
4. Responde de forma concisa.
`;

  // 4. Setup AI config
  const config: TenantAIConfig = {
    provider: (agentConfig?.aiProvider as 'gemini' | 'openai' | 'anthropic') || 'gemini',
    apiKey: decrypt(agentConfig?.aiApiKey || ''),
    model: agentConfig?.aiModel || 'gemini-1.5-flash',
    temperature: agentConfig?.temperature || 0.7,
  };

  // 5. Call AI
  const aiResult = await callAI(config, prompt);
  let replyText = aiResult.text;
  
  // 6. Parse response for commands
  let isBookingDetected = false;
  let bookingData;
  let isOrderDetected = false;
  let orderData;
  let isHandoffRequested = false;
  let handoffReason;

  const bookingRegex = /COMMAND_BOOKING:\s*({.*})/i;
  const orderRegex = /COMMAND_ORDER:\s*({.*})/i;
  const handoffRegex = /COMMAND_HANDOFF:\s*({.*})/i;

  const bookingMatch = replyText.match(bookingRegex);
  if (bookingMatch && bookingMatch[1]) {
    isBookingDetected = true;
    try { bookingData = JSON.parse(bookingMatch[1]); } catch (e) { console.error('Failed to parse booking data', e); }
  }

  const orderMatch = replyText.match(orderRegex);
  if (orderMatch && orderMatch[1]) {
    isOrderDetected = true;
    try { orderData = JSON.parse(orderMatch[1]); } catch (e) { console.error('Failed to parse order data', e); }
  }

  const handoffMatch = replyText.match(handoffRegex);
  if (handoffMatch && handoffMatch[1]) {
    isHandoffRequested = true;
    try { handoffReason = JSON.parse(handoffMatch[1]).reason; } catch (e) { console.error('Failed to parse handoff reason', e); }
  }

  // 7. Clean response text
  replyText = replyText
    .replace(bookingRegex, '')
    .replace(orderRegex, '')
    .replace(handoffRegex, '')
    .replace(/\*\*/g, '*') // Fix double asterisks to single asterisk for WhatsApp
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
