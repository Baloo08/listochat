import { query } from './pool.js';

export interface QueueMessage {
  id: string;
  tenantId: string;
  remoteJid: string;
  pushName: string;
  cleanPhone: string;
  userMessage: string;
  instanceName: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  isVoiceNote: boolean;
  errorMessage?: string;
  aiResponse?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

export async function ensureQueueTable(): Promise<void> {
  const sql = `
    CREATE TABLE IF NOT EXISTS message_queue (
      id TEXT PRIMARY KEY DEFAULT 'mq_' || gen_random_uuid()::text,
      tenant_id TEXT NOT NULL,
      remote_jid TEXT NOT NULL,
      push_name TEXT DEFAULT '',
      clean_phone TEXT DEFAULT '',
      user_message TEXT NOT NULL,
      instance_name TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      is_voice_note BOOLEAN DEFAULT false,
      priority INTEGER DEFAULT 0,
      error_message TEXT,
      ai_response TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_mq_status ON message_queue(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_mq_tenant ON message_queue(tenant_id, status);
  `;
  await query(sql);
}

export async function enqueueMessage(
  tenantId: string,
  remoteJid: string,
  pushName: string,
  cleanPhone: string,
  userMessage: string,
  instanceName: string,
  isVoiceNote: boolean = false
): Promise<QueueMessage> {
  const sql = `
    INSERT INTO message_queue 
    (tenant_id, remote_jid, push_name, clean_phone, user_message, instance_name, status, is_voice_note)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
    RETURNING *;
  `;
  const result = await query(sql, [tenantId, remoteJid, pushName, cleanPhone, userMessage, instanceName, isVoiceNote]);
  return mapToQueueMessage(result.rows[0]);
}

export async function takeNextPending(): Promise<QueueMessage | null> {
  const sql = `
    UPDATE message_queue SET status = 'processing', processed_at = CURRENT_TIMESTAMP
    WHERE id = (
      SELECT id FROM message_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;
  const result = await query(sql);
  if (result.rows.length === 0) return null;
  return mapToQueueMessage(result.rows[0]);
}

export async function markDone(id: string, aiResponse: string): Promise<void> {
  const sql = `
    UPDATE message_queue 
    SET status = 'done', completed_at = CURRENT_TIMESTAMP, ai_response = $1
    WHERE id = $2;
  `;
  await query(sql, [aiResponse, id]);
}

export async function markFailed(id: string, errorMessage: string): Promise<void> {
  const sql = `
    UPDATE message_queue 
    SET status = 'failed', completed_at = CURRENT_TIMESTAMP, error_message = $1
    WHERE id = $2;
  `;
  await query(sql, [errorMessage, id]);
}

export async function getPendingByTenant(tenantId: string): Promise<QueueMessage[]> {
  const sql = `
    SELECT * FROM message_queue 
    WHERE tenant_id = $1 AND status IN ('pending', 'processing')
    ORDER BY created_at ASC;
  `;
  const result = await query(sql, [tenantId]);
  return result.rows.map(mapToQueueMessage);
}

export async function getQueueStats(tenantId?: string): Promise<{pending: number, processing: number, done: number, failed: number}> {
  let sql = `SELECT status, count(*) as count FROM message_queue `;
  const params: any[] = [];
  if (tenantId) {
    sql += `WHERE tenant_id = $1 `;
    params.push(tenantId);
  }
  sql += `GROUP BY status;`;
  
  const result = await query(sql, params);
  const stats = { pending: 0, processing: 0, done: 0, failed: 0 };
  for (const row of result.rows) {
    if (row.status === 'pending') stats.pending = parseInt(row.count, 10);
    if (row.status === 'processing') stats.processing = parseInt(row.count, 10);
    if (row.status === 'done') stats.done = parseInt(row.count, 10);
    if (row.status === 'failed') stats.failed = parseInt(row.count, 10);
  }
  return stats;
}

function mapToQueueMessage(row: any): QueueMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    remoteJid: row.remote_jid,
    pushName: row.push_name,
    cleanPhone: row.clean_phone,
    userMessage: row.user_message,
    instanceName: row.instance_name,
    status: row.status,
    isVoiceNote: row.is_voice_note,
    errorMessage: row.error_message,
    aiResponse: row.ai_response,
    createdAt: row.created_at,
    processedAt: row.processed_at,
    completedAt: row.completed_at
  };
}
