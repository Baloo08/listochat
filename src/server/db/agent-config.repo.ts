import { query } from './pool.js';
import { AgentPromptConfig } from '../../shared/types.js';

const defaultSystemPrompt = `You are an AI assistant. Help customers politely and concisely.`;

export const defaultOrchestratorConfig: OrchestratorConfig = {
  enabled: true,
  subagents: {
    sales: {
      id: 'sales',
      name: 'Ventas & Menú',
      enabled: true,
      prompt: 'Eres el especialista en ventas y catálogo. Asesora activamente con amabilidad y calidez costarricense (*pura vida*, con gusto). Destaca beneficios, presenta variantes (tallas, sabores, presentaciones) y extras/aderezos. Lleva la cuenta sumada del carrito con subtotales y total. Consulta si es para Envío a Domicilio o Retiro en Local y el método de pago.',
      sources: ['products', 'payments', 'delivery'],
      actions: ['order', 'media']
    },
    booking: {
      id: 'booking',
      name: 'Citas & Agenda',
      enabled: true,
      prompt: 'Eres el especialista de agenda y servicios. Ofrece los servicios disponibles con su duración y precios fijos. Verifica que la fecha y hora NO choquen con horarios ocupados. Sé puntual, cordial y confirma los datos del cliente antes de agendar.',
      sources: ['services', 'specialists', 'busySlots', 'customerRecord'],
      actions: ['booking', 'reschedule', 'cancel']
    },
    courts: {
      id: 'courts',
      name: 'Canchas Deportivas',
      enabled: true,
      prompt: 'Eres el especialista en reservas de canchas y partidos deportivos. Brinda información sobre canchas disponibles, superficies, precios por hora e iluminación. Para reagendar, solicita el código CRT-XXXXXX o #RES- y valida disponibilidad.',
      sources: ['courts', 'schedules'],
      actions: ['courtBooking', 'courtReschedule']
    },
    handoff: {
      id: 'handoff',
      name: 'Escalado Humano',
      enabled: true,
      prompt: 'Detecta solicitudes de hablar con una persona, asesor o quejas y reclamos urgentes. Responde con empatía y comunica que un asesor humano atenderá el caso de inmediato.',
      sources: ['keywords'],
      actions: ['handoff']
    },
    general: {
      id: 'general',
      name: 'Identidad & FAQ',
      enabled: true,
      prompt: 'Eres el anfitrión principal del negocio en WhatsApp. Brinda bienvenida cordial, responde dudas sobre horarios, ubicación, métodos de pago y canaliza adecuadamente al cliente con calidez costarricense.',
      sources: ['businessInfo', 'schedules', 'payments'],
      actions: []
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
