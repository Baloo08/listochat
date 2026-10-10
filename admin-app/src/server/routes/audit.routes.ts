import { Router } from 'express';
import { query } from '../db.js';
import { requireSuperAdmin } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 100);
    const search = req.query.search ? `%${String(req.query.search).toLowerCase()}%` : null;

    let q = `
      SELECT a.id, a.tenant_id as "tenantId", t.name as "tenantName",
             a.user_id as "userId", u.name as "userName", u.email as "userEmail",
             a.action, a.entity_type as "entityType", a.entity_id as "entityId",
             a.details, a.ip_address as "ipAddress", a.created_at as "createdAt"
      FROM audit_logs a
      LEFT JOIN tenants t ON a.tenant_id = t.id
      LEFT JOIN users u ON a.user_id = u.id
    `;

    const params: any[] = [];
    if (search) {
      q += ` WHERE (LOWER(a.action) LIKE $1 OR LOWER(COALESCE(t.name, '')) LIKE $1 OR LOWER(COALESCE(u.email, '')) LIKE $1)`;
      params.push(search);
    }

    q += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(q, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('[Audit Logs] Error:', error);
    res.status(500).json({ error: 'Error al consultar logs de auditoría' });
  }
});

export default router;
