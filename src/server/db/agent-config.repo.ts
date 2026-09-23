import { query } from './pool.js';
import { AgentPromptConfig } from '../../shared/types.js';

const defaultSystemPrompt = `You are an AI assistant. Help customers politely and concisely.`;

export const defaultOrchestratorConfig: OrchestratorConfig = {
  enabled: true,
  prompt: 'Eres el Director de Operaciones y Supervisor Agéntico del negocio en WhatsApp. Tu objetivo es asegurar una atención cálida costarricense (*pura vida*, con gusto), ágil y precisa delegando cada mensaje al subagente experto según la siguiente jerarquía:\n1. Urgencias, quejas o petición de persona ➡️ Escalado Humano.\n2. Compra de productos, menú o delivery ➡️ Ventas & Menú.\n3. Servicios, doctores, citas o disponibilidad ➡️ Citas & Agenda.\n4. Partidos, horarios o canchas deportivas ➡️ Canchas Deportivas.\n5. Saludos, ubicación, parqueo, facturación o dudas generales ➡️ Identidad & FAQ.\nEn consultas mixtas, atiende primero la reserva/cita y luego invita a conocer la oferta de tienda.',
  subagents: {
    sales: {
      id: 'sales',
      name: 'Ventas & Menú',
      enabled: true,
      prompt: 'Eres el Asesor Especialista en Ventas y Catálogo. Asesora con calidez tica (*pura vida*, con gusto). Aplica venta consultiva recomendando opciones destacadas. Si el cliente selecciona un ítem principal, sugiere complementos o bebidas (venta cruzada). Lleva el carrito sumado con subtotales y total en ₡CRC. Pregunta si es para Envío a Domicilio o Retiro en Local y el método de pago. Solicita confirmación explícita de todos los datos antes de emitir la comanda.',
      sources: ['products', 'payments', 'delivery'],
      actions: ['order', 'media']
    },
    booking: {
      id: 'booking',
      name: 'Citas & Agenda',
      enabled: true,
      prompt: 'Eres el Asesor Especialista en Citas y Agenda. Atiende cordialmente y ofrece los servicios con sus precios y duración fija. Verifica que la fecha y hora NO coincidan con los HORARIOS YA OCUPADOS. Si el horario solicitado está ocupado, ofrece proactivamente las 2 o 3 opciones libres más cercanas del mismo día o día siguiente. Si el cliente pide varios servicios, suma sus duraciones. Confirma el nombre completo, servicio, fecha y hora antes de agendar.',
      sources: ['services', 'specialists', 'busySlots', 'customerRecord'],
      actions: ['booking', 'reschedule', 'cancel']
    },
    courts: {
      id: 'courts',
      name: 'Canchas Deportivas',
      enabled: true,
      prompt: 'Eres el Especialista en Reservas de Canchas Deportivas. Brinda información sobre canchas disponibles, superficies y precios por hora, diferenciando tarifa regular de tarifa con iluminación nocturna. Pregunta si requiere cancha completa o busca retador/partido abierto. Para reagendar, solicita el código CRT-XXXXXX y valida disponibilidad.',
      sources: ['courts', 'schedules'],
      actions: ['courtBooking', 'courtReschedule']
    },
    handoff: {
      id: 'handoff',
      name: 'Escalado Humano',
      enabled: true,
      prompt: 'Eres el Especialista en Atención de Casos Especiales y Escalado Humano. Cuando el cliente solicite hablar con una persona o exprese un reclamo urgente, responde con empatía y serenidad. Solicita amablemente su nombre y un breve detalle del motivo para que el asesor humano tome el chat con la solución preparada, y transfiere el caso de inmediato.',
      sources: ['keywords'],
      actions: ['handoff']
    },
    general: {
      id: 'general',
      name: 'Identidad & FAQ',
      enabled: true,
      prompt: 'Eres el Conserje y Anfitrión Principal del negocio en WhatsApp. Responde con calidez tica (*pura vida*) y precisión sobre ubicación exacta, enlaces de Waze/Maps, horarios, formas de pago (SINPE Móvil, transferencia, efectivo, tarjeta), factura electrónica, parqueo, políticas pet friendly y comodidades. Concluye cada respuesta con un puente proactivo hacia el catálogo de productos o la agenda de citas. Si te preguntan algo no registrado oficialmente en las políticas del negocio, no inventes datos: ofrece transferir con un asesor humano.',
      sources: ['businessInfo', 'schedules', 'payments'],
      actions: [],
      links: []
    }
  }
};

export async function getAgentConfig(tenantId: string): Promise<AgentPromptConfig> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", config_json as "configJson", updated_at as "updatedAt"
    FROM agent_settings 
    WHERE tenant_id = $1
  `, [tenantId]);

  if (result.rows.length === 0) {
    return {
      tenantId,
      systemPrompt: defaultSystemPrompt,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      autoReplyEnabled: true,
      humanHandoffEnabled: true,
      handoffKeywords: ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'],
      showBookingLink: true,
      showStoreLink: true,
      orchestratorConfig: defaultOrchestratorConfig
    };
  }

  const data = result.rows[0].configJson || {};
  return {
    id: result.rows[0].id,
    tenantId: result.rows[0].tenantId,
    systemPrompt: data.systemPrompt || defaultSystemPrompt,
    model: data.model || 'gemini-2.5-flash',
    temperature: data.temperature ?? 0.7,
    aiChatbotEnabled: data.aiChatbotEnabled ?? true,
    autoReplyEnabled: data.autoReplyEnabled ?? true,
    notifyNumber: data.notifyNumber,
    businessName: data.businessName,
    currency: data.currency,
    humanHandoffEnabled: data.humanHandoffEnabled ?? true,
    handoffKeywords: data.handoffKeywords || ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'],
    handoffNotifyPhone: data.handoffNotifyPhone || data.notifyNumber,
    showBookingLink: data.showBookingLink ?? true,
    showStoreLink: data.showStoreLink ?? true,
    orchestratorConfig: data.orchestratorConfig || defaultOrchestratorConfig,
    updatedAt: result.rows[0].updatedAt
  };
}

export async function saveAgentConfig(tenantId: string, config: Partial<AgentPromptConfig>): Promise<AgentPromptConfig> {
  const configJson = {
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: config.temperature,
    aiChatbotEnabled: config.aiChatbotEnabled,
    autoReplyEnabled: config.autoReplyEnabled,
    notifyNumber: config.notifyNumber,
    businessName: config.businessName,
    currency: config.currency,
    humanHandoffEnabled: config.humanHandoffEnabled,
    handoffKeywords: config.handoffKeywords,
    handoffNotifyPhone: config.handoffNotifyPhone,
    showBookingLink: config.showBookingLink,
    showStoreLink: config.showStoreLink,
    orchestratorConfig: config.orchestratorConfig
  };

  const result = await query(`
    INSERT INTO agent_settings (tenant_id, config_json, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id) 
    DO UPDATE SET config_json = EXCLUDED.config_json, updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", config_json as "configJson", updated_at as "updatedAt"
  `, [tenantId, configJson]);

  const data = result.rows[0].configJson;
  return {
    id: result.rows[0].id,
    tenantId: result.rows[0].tenantId,
    systemPrompt: data.systemPrompt,
    model: data.model,
    temperature: data.temperature,
    autoReplyEnabled: data.autoReplyEnabled,
    notifyNumber: data.notifyNumber,
    businessName: data.businessName,
    currency: data.currency,
    humanHandoffEnabled: data.humanHandoffEnabled,
    handoffKeywords: data.handoffKeywords,
    handoffNotifyPhone: data.handoffNotifyPhone,
    showBookingLink: data.showBookingLink ?? true,
    showStoreLink: data.showStoreLink ?? true,
    orchestratorConfig: data.orchestratorConfig || defaultOrchestratorConfig,
    updatedAt: result.rows[0].updatedAt
  };
}
