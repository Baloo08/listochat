import { query } from './pool.js';
import { ChatMessage } from '../../shared/types.js';

export async function getChatsByTenant(tenantId: string, limit = 1000): Promise<ChatMessage[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
    FROM chat_messages 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [tenantId, limit]);
  return result.rows;
}

export async function createChatMessage(tenantIdOrData: string | Partial<ChatMessage>, optionalData?: Partial<ChatMessage>): Promise<ChatMessage> {
  let tenantId: string;
  let data: Partial<ChatMessage>;

  if (typeof tenantIdOrData === 'string') {
    tenantId = tenantIdOrData;
    data = optionalData || {};
  } else {
    data = tenantIdOrData || {};
    tenantId = data.tenantId || '';
  }

  const msgId = data.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const remoteJid = data.remoteJid || '';
  const pushName = data.pushName || null;
  const fromMe = data.fromMe || false;
  const messageText = data.messageText || '';
  const aiResponse = typeof data.aiResponse === 'boolean' ? (data.aiResponse ? messageText : '') : (data.aiResponse || null);
  const status = data.status || 'received';

  const result = await query(`
    INSERT INTO chat_messages (
      id, tenant_id, remote_jid, push_name, from_me, message_text, ai_response, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      message_text = EXCLUDED.message_text,
      status = EXCLUDED.status
    RETURNING id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
  `, [
    msgId, tenantId, remoteJid, pushName, fromMe, 
    messageText, aiResponse ? true : false, status
  ]);
  return result.rows[0];
}

export async function updateChatStatus(id: string, tenantId: string, status: string): Promise<void> {
  await query(`
    UPDATE chat_messages 
    SET status = $1 
    WHERE id = $2 AND tenant_id = $3
  `, [status, id, tenantId]);
}

export const getChatMessagesByTenant = getChatsByTenant;
export const saveChatMessage = createChatMessage;
