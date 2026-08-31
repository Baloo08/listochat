import { query } from './pool.js';

export interface TenantAIUsageSummary {
  tenantId: string;
  tenantName: string;
  slug: string;
  plan: string;
  monthYear: string;
  tokensUsed: number;
  requestsCount: number;
  limit: number;
  percentageUsed: number;
  isExceeded: boolean;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getPlanQuota(planName: string): Promise<number> {
  const normalizedPlan = (planName || 'starter').toLowerCase();
  const key = `quota_${normalizedPlan}_tokens`;
  
  try {
    const res = await query(`SELECT value FROM platform_settings WHERE key = $1`, [key]);
    if (res.rows.length > 0 && res.rows[0].value) {
      return parseInt(res.rows[0].value, 10);
    }
  } catch (e) {
    // ignore
  }

  // Default fallbacks per plan
  if (normalizedPlan === 'starter') return 25000;
  if (normalizedPlan === 'pro') return 100000;
  if (normalizedPlan === 'business' || normalizedPlan === 'enterprise') return 300000;
  return 25000;
}

export async function getTenantCurrentMonthUsage(tenantId: string): Promise<TenantAIUsageSummary> {
  const monthYear = getCurrentMonthYear();

  const tenantRes = await query(`SELECT id, name, slug, plan FROM tenants WHERE id = $1`, [tenantId]);
  const tenant = tenantRes.rows[0] || { id: tenantId, name: 'Desconocido', slug: '', plan: 'starter' };

  const limit = await getPlanQuota(tenant.plan);

  const usageRes = await query(`
    SELECT tokens_used, requests_count
    FROM tenant_ai_usage
    WHERE tenant_id = $1 AND month_year = $2
  `, [tenantId, monthYear]);

  const tokensUsed = usageRes.rows.length > 0 ? parseInt(usageRes.rows[0].tokens_used || '0', 10) : 0;
  const requestsCount = usageRes.rows.length > 0 ? parseInt(usageRes.rows[0].requests_count || '0', 10) : 0;
  const percentageUsed = limit > 0 ? Math.min(100, Math.round((tokensUsed / limit) * 100)) : 0;
  const isExceeded = limit > 0 && tokensUsed >= limit;

  return {
    tenantId,
    tenantName: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    monthYear,
    tokensUsed,
    requestsCount,
    limit,
    percentageUsed,
    isExceeded
  };
}

export async function incrementTenantUsage(tenantId: string, tokens: number): Promise<void> {
  if (!tenantId || tokens <= 0) return;
  const monthYear = getCurrentMonthYear();

  try {
    await query(`
      INSERT INTO tenant_ai_usage (tenant_id, month_year, tokens_used, requests_count, updated_at)
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (tenant_id, month_year)
      DO UPDATE SET
        tokens_used = tenant_ai_usage.tokens_used + $3,
        requests_count = tenant_ai_usage.requests_count + 1,
        updated_at = CURRENT_TIMESTAMP
    `, [tenantId, monthYear, tokens]);
  } catch (err) {
    console.error(`[AI-Usage] Error incrementing usage for tenant ${tenantId}:`, err);
  }
}

export async function getAllTenantsMonthlyUsage(monthYearParam?: string): Promise<TenantAIUsageSummary[]> {
  const monthYear = monthYearParam || getCurrentMonthYear();

  const starterQuota = await getPlanQuota('starter');
  const proQuota = await getPlanQuota('pro');
  const businessQuota = await getPlanQuota('business');

  const res = await query(`
    SELECT 
      t.id as tenant_id,
      t.name as tenant_name,
      t.slug,
      t.plan,
      COALESCE(u.tokens_used, 0) as tokens_used,
      COALESCE(u.requests_count, 0) as requests_count
    FROM tenants t
    LEFT JOIN tenant_ai_usage u ON u.tenant_id = t.id AND u.month_year = $1
    WHERE t.slug != 'superadmin'
    ORDER BY tokens_used DESC, t.name ASC
  `, [monthYear]);

  return res.rows.map(r => {
    const plan = (r.plan || 'starter').toLowerCase();
    const limit = plan === 'starter' ? starterQuota : plan === 'pro' ? proQuota : businessQuota;
    const tokensUsed = parseInt(r.tokens_used || '0', 10);
    const requestsCount = parseInt(r.requests_count || '0', 10);
    const percentageUsed = limit > 0 ? Math.min(100, Math.round((tokensUsed / limit) * 100)) : 0;
    const isExceeded = limit > 0 && tokensUsed >= limit;

    return {
      tenantId: r.tenant_id,
      tenantName: r.tenant_name,
      slug: r.slug,
      plan: r.plan,
      monthYear,
      tokensUsed,
      requestsCount,
      limit,
      percentageUsed,
      isExceeded
    };
  });
}
