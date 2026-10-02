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

export interface ModelPricingRates {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const MODEL_PRICING_CATALOG: Record<string, ModelPricingRates> = {
  // Google Gemini
  'gemini-2.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.300 },
  'gemini-2.5-flash-lite': { inputPerMillion: 0.050, outputPerMillion: 0.200 },
  'gemini-2.5-pro': { inputPerMillion: 1.250, outputPerMillion: 5.000 },
  'gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.300 },
  'gemini-1.5-pro': { inputPerMillion: 1.250, outputPerMillion: 5.000 },
  // DeepSeek
  'deepseek-chat': { inputPerMillion: 0.140, outputPerMillion: 0.280 },
  'deepseek-reasoner': { inputPerMillion: 0.550, outputPerMillion: 2.190 },
  // OpenAI
  'gpt-4o-mini': { inputPerMillion: 0.150, outputPerMillion: 0.600 },
  'gpt-4o': { inputPerMillion: 2.500, outputPerMillion: 10.000 },
  'o1-mini': { inputPerMillion: 1.100, outputPerMillion: 4.400 },
  'o3-mini': { inputPerMillion: 1.100, outputPerMillion: 4.400 },
  // Anthropic
  'claude-3-5-haiku-20241022': { inputPerMillion: 0.800, outputPerMillion: 4.000 },
  'claude-3-5-sonnet-20241022': { inputPerMillion: 3.000, outputPerMillion: 15.000 },
  'claude-3-7-sonnet': { inputPerMillion: 3.000, outputPerMillion: 15.000 },
  // Local / Sovereign
  'betico-ai': { inputPerMillion: 0, outputPerMillion: 0 },
  'localai': { inputPerMillion: 0, outputPerMillion: 0 }
};

export function calculateModelCost(provider: string, model: string, promptTokens: number, completionTokens: number): number {
  if (provider === 'betico_ai' || provider === 'ollama' || provider === 'localai') {
    return 0; // Local VPS compute has zero API inference charge
  }

  const cleanModel = (model || '').toLowerCase();
  let rates: ModelPricingRates | undefined;

  for (const [key, val] of Object.entries(MODEL_PRICING_CATALOG)) {
    if (cleanModel.includes(key.toLowerCase())) {
      rates = val;
      break;
    }
  }

  if (!rates) {
    if (provider === 'deepseek') rates = { inputPerMillion: 0.140, outputPerMillion: 0.280 };
    else if (provider === 'gemini') rates = { inputPerMillion: 0.075, outputPerMillion: 0.300 };
    else if (provider === 'openai') rates = { inputPerMillion: 0.150, outputPerMillion: 0.600 };
    else if (provider === 'anthropic') rates = { inputPerMillion: 0.800, outputPerMillion: 4.000 };
    else rates = { inputPerMillion: 0.150, outputPerMillion: 0.600 };
  }

  const inputCost = (promptTokens / 1_000_000) * rates.inputPerMillion;
  const outputCost = (completionTokens / 1_000_000) * rates.outputPerMillion;
  return Number((inputCost + outputCost).toFixed(6));
}

export async function logTokenUsage(
  tenantId: string,
  data: {
    subagent?: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs?: number;
    isByok: boolean;
  }
): Promise<void> {
  if (!tenantId) return;
  const promptTokens = Math.max(0, data.promptTokens || 0);
  const completionTokens = Math.max(0, data.completionTokens || 0);
  const totalTokens = promptTokens + completionTokens;
  const costUsd = calculateModelCost(data.provider, data.model, promptTokens, completionTokens);
  const latencyMs = Math.max(0, data.latencyMs || 0);
  const subagent = data.subagent || 'general';

  // 1. Asynchronously log granular turn in tenant_ai_token_logs
  try {
    await query(`
      INSERT INTO tenant_ai_token_logs 
      (tenant_id, subagent, provider, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, is_byok)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [tenantId, subagent, data.provider, data.model, promptTokens, completionTokens, totalTokens, costUsd, latencyMs, data.isByok]);
  } catch (err) {
    console.error(`[AI-Usage] Error inserting token log for tenant ${tenantId}:`, err);
  }

  // 2. Increment monthly aggregate counter
  if (totalTokens > 0) {
    await incrementTenantUsage(tenantId, totalTokens);
  }
}

export interface TenantConsumptionMetrics {
  monthYear: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  estimatedCostCrc: number;
  requestsCount: number;
  avgLatencyMs: number;
  isUsingOwnKey: boolean;
  provider: string;
  model: string;
  isAiPilot: boolean;
  subagentBreakdown: Record<string, { tokens: number; costUsd: number; requestsCount: number }>;
}

export async function getTenantConsumptionMetrics(tenantId: string, monthYearParam?: string): Promise<TenantConsumptionMetrics> {
  const monthYear = monthYearParam || getCurrentMonthYear();
  const [year, month] = monthYear.split('-');
  const startDate = `${year}-${month}-01 00:00:00Z`;

  const tenantRes = await query(`
    SELECT ai_provider as "aiProvider", ai_model as "aiModel", 
           ai_api_key_encrypted as "aiApiKeyEncrypted",
           is_ai_pilot as "isAiPilot"
    FROM tenants WHERE id = $1
  `, [tenantId]);
  const tenant = tenantRes.rows[0] || {};
  const isUsingOwnKey = Boolean(tenant.aiApiKeyEncrypted);

  let summary = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost_usd: 0, avg_latency_ms: 0, requests_count: 0 };
  const subagentBreakdown: Record<string, { tokens: number; costUsd: number; requestsCount: number }> = {};

  try {
    const logsRes = await query(`
      SELECT 
        COALESCE(SUM(prompt_tokens), 0)::int as prompt_tokens,
        COALESCE(SUM(completion_tokens), 0)::int as completion_tokens,
        COALESCE(SUM(total_tokens), 0)::int as total_tokens,
        COALESCE(SUM(cost_usd), 0)::numeric as cost_usd,
        COALESCE(AVG(latency_ms), 0)::int as avg_latency_ms,
        COUNT(*)::int as requests_count
      FROM tenant_ai_token_logs
      WHERE tenant_id = $1 
        AND created_at >= $2::timestamptz 
        AND created_at < ($2::timestamptz + INTERVAL '1 month')
    `, [tenantId, startDate]);

    if (logsRes.rows.length > 0) {
      summary = logsRes.rows[0];
    }

    const subagentRes = await query(`
      SELECT 
        subagent,
        COALESCE(SUM(total_tokens), 0)::int as tokens,
        COALESCE(SUM(cost_usd), 0)::numeric as cost_usd,
        COUNT(*)::int as requests_count
      FROM tenant_ai_token_logs
      WHERE tenant_id = $1 
        AND created_at >= $2::timestamptz 
        AND created_at < ($2::timestamptz + INTERVAL '1 month')
      GROUP BY subagent
    `, [tenantId, startDate]);

    for (const row of subagentRes.rows) {
      subagentBreakdown[row.subagent || 'general'] = {
        tokens: Number(row.tokens || 0),
        costUsd: Number(Number(row.cost_usd || 0).toFixed(4)),
        requestsCount: Number(row.requests_count || 0)
      };
    }
  } catch (err) {
    console.warn(`[AI-Usage] Error reading token logs for tenant ${tenantId} (table might be new):`, err);
  }

  // BCCR standard indicative rate: ₡515 per USD
  const bccrExchangeRate = 515;
  const costUsd = Number(Number(summary.cost_usd || 0).toFixed(4));
  const costCrc = Math.round(costUsd * bccrExchangeRate);

  return {
    monthYear,
    totalTokens: Number(summary.total_tokens || 0),
    promptTokens: Number(summary.prompt_tokens || 0),
    completionTokens: Number(summary.completion_tokens || 0),
    estimatedCostUsd: costUsd,
    estimatedCostCrc: costCrc,
    requestsCount: Number(summary.requests_count || 0),
    avgLatencyMs: Number(summary.avg_latency_ms || 0),
    isUsingOwnKey,
    provider: tenant.aiProvider || 'betico_ai',
    model: tenant.aiModel || 'betico-ai',
    isAiPilot: Boolean(tenant.isAiPilot),
    subagentBreakdown
  };
}
