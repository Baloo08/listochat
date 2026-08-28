import { query } from './pool.js';
import { AgentPromptConfig } from '../../shared/types.js';

const defaultSystemPrompt = `You are an AI assistant. Help customers politely and concisely.`;

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
      handoffKeywords: ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente']
    };
  }

  const data = result.rows[0].configJson || {};
  return {
    id: result.rows[0].id,
    tenantId: result.rows[0].tenantId,
    systemPrompt: data.systemPrompt || defaultSystemPrompt,
    model: data.model || 'gemini-2.5-flash',
    temperature: data.temperature ?? 0.7,
    autoReplyEnabled: data.autoReplyEnabled ?? true,
    notifyNumber: data.notifyNumber,
    businessName: data.businessName,
    currency: data.currency,
    humanHandoffEnabled: data.humanHandoffEnabled ?? true,
    handoffKeywords: data.handoffKeywords || ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'],
    handoffNotifyPhone: data.handoffNotifyPhone || data.notifyNumber,
    updatedAt: result.rows[0].updatedAt
  };
}

export async function saveAgentConfig(tenantId: string, config: Partial<AgentPromptConfig>): Promise<AgentPromptConfig> {
  const configJson = {
    systemPrompt: config.systemPrompt,
    model: config.model,
    temperature: config.temperature,
    autoReplyEnabled: config.autoReplyEnabled,
    notifyNumber: config.notifyNumber,
    businessName: config.businessName,
    currency: config.currency,
    humanHandoffEnabled: config.humanHandoffEnabled,
    handoffKeywords: config.handoffKeywords,
    handoffNotifyPhone: config.handoffNotifyPhone
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
    updatedAt: result.rows[0].updatedAt
  };
}
