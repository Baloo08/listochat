import { query } from './pool.js';

export async function logAuditEvent(
  tenantId: string | null,
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await query(`
      INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenantId, userId, action, entityType || null, entityId || null, details ? JSON.stringify(details) : null, ipAddress || null, userAgent || null]);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export async function getAuditLogs(
  tenantId: string | null,
  filters: { action?: string; userId?: string; limit?: number; offset?: number; startDate?: string; endDate?: string } = {}
): Promise<{ logs: any[]; total: number }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  if (tenantId) {
    conditions.push(`a.tenant_id = $${paramIdx++}`);
    params.push(tenantId);
  }
  if (filters.action) {
    conditions.push(`a.action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.userId) {
    conditions.push(`a.user_id = $${paramIdx++}`);
    params.push(filters.userId);
  }
  if (filters.startDate) {
    conditions.push(`a.created_at >= $${paramIdx++}`);
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    conditions.push(`a.created_at <= $${paramIdx++}`);
    params.push(filters.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;

  const countRes = await query(`SELECT COUNT(*) as total FROM audit_logs a ${whereClause}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const result = await query(`
    SELECT a.id, a.tenant_id as "tenantId", a.user_id as "userId",
           u.name as "userName", u.email as "userEmail",
           a.action, a.entity_type as "entityType", a.entity_id as "entityId",
           a.details, a.ip_address as "ipAddress", a.user_agent as "userAgent",
           a.created_at as "createdAt"
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params);

  return { logs: result.rows, total };
}
