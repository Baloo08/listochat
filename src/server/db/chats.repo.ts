import { query } from './pool.js';
import { ChatMessage } from '../../shared/types.js';

export async function getChatsByTenant(tenantId: string): Promise<ChatMessage[]> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
    FROM chat_messages 
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT 1000
  `, [tenantId]);
  return result.rows;
}

export async function createChatMessage(tenantId: string, data: Partial<ChatMessage>): Promise<ChatMessage> {
  const result = await query(`
    INSERT INTO chat_messages (
      id, tenant_id, remote_jid, push_name, from_me, message_text, ai_response, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, tenant_id as "tenantId", remote_jid as "remoteJid", push_name as "pushName",
           from_me as "fromMe", message_text as "messageText", ai_response as "aiResponse",
           status, created_at as "createdAt"
  `, [
    data.id, tenantId, data.remoteJid, data.pushName, data.fromMe || false, 
    data.messageText, data.aiResponse || false, data.status
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
