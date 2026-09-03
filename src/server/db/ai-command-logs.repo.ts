import { query } from './pool.js';

export interface AICommandLog {
  id: string;
  tenantId: string;
  remoteJid: string;
  commandType: string;
  payload: any;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export async function logAICommand(
  tenantId: string,
  remoteJid: string,
  commandType: string,
  payload: any,
  status: 'success' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    await query(`
      INSERT INTO ai_command_logs (tenant_id, remote_jid, command_type, payload, status, error_message)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      tenantId,
      remoteJid,
      commandType,
      payload ? JSON.stringify(payload) : null,
      status,
      errorMessage || null
    ]);
  } catch (err: any) {
    if (err && (err.message?.includes('ai_command_logs') || err.code === '42P01')) {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS ai_command_logs (
            id TEXT PRIMARY KEY DEFAULT 'cmd_' || gen_random_uuid()::text,
            tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
            remote_jid VARCHAR(100) NOT NULL,
            command_type VARCHAR(50) NOT NULL,
            payload JSONB,
            status VARCHAR(50) NOT NULL,
            error_message TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await query(`
          INSERT INTO ai_command_logs (tenant_id, remote_jid, command_type, payload, status, error_message)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          tenantId,
          remoteJid,
          commandType,
          payload ? JSON.stringify(payload) : null,
          status,
          errorMessage || null
        ]);
      } catch (innerErr) {
        console.error('[logAICommand] Inner error creating table or inserting:', innerErr);
      }
    } else {
      console.error('[logAICommand] Error logging AI command:', err);
    }
  }
}

export async function getRecentFailedCommands(tenantId: string, remoteJid?: string, limit: number = 10): Promise<AICommandLog[]> {
  try {
    let sql = `
      SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid", command_type as "commandType",
             payload, status, error_message as "errorMessage", created_at as "createdAt"
      FROM ai_command_logs
      WHERE tenant_id = $1 AND status = 'failed'
    `;
    const params: any[] = [tenantId];
    if (remoteJid) {
      sql += ' AND remote_jid = $2';
      params.push(remoteJid);
    }
    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const res = await query(sql, params);
    return res.rows;
  } catch (e) {
    return [];
  }
}
