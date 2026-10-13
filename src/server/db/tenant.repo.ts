import { query } from './pool.js';
import { Tenant } from '../../shared/types.js';

export async function getAllTenants(): Promise<any[]> {
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_model as "aiModel", 
           t.evolution_instance as "evolutionInstance", t.whatsapp_number as "whatsappNumber",
           t.plan, t.active, t.subscription_status as "subscriptionStatus",
           t.billing_currency as "billingCurrency", t.custom_monthly_price as "customMonthlyPrice",
           t.trial_ends_at as "trialEndsAt", t.next_billing_date as "nextBillingDate",
           t.grace_period_ends_at as "gracePeriodEndsAt", t.custom_invoices_quota as "customInvoicesQuota",
           t.settings_json as "settingsJson", 
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "fiscalEmailReceptor",
           t.created_at as "createdAt"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    ORDER BY t.created_at DESC
  `);
  return result.rows;
}

export async function getAllTenantsWithAdmin(): Promise<any[]> {
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_model as "aiModel", 
           t.evolution_instance as "evolutionInstance", t.whatsapp_number as "whatsappNumber",
           t.plan, t.active, t.subscription_status as "subscriptionStatus",
           t.billing_currency as "billingCurrency", t.custom_monthly_price as "customMonthlyPrice",
           t.trial_ends_at as "trialEndsAt", t.next_billing_date as "nextBillingDate",
           t.grace_period_ends_at as "gracePeriodEndsAt", t.custom_invoices_quota as "customInvoicesQuota",
           t.settings_json as "settingsJson", 
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, u.email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, u.email, '') as "fiscalEmailReceptor",
           t.created_at as "createdAt",
           COALESCE(u.email, 'Sin registrar') as "adminEmail",
           u.id as "adminId",
           t.id as "postgresTenantId",
           'whatsapp_saas' as "postgresDb",
           'public' as "postgresSchema",
           (t.settings_json->'easypanel'->>'project') as "easypanelProject",
           (t.settings_json->'easypanel'->>'service') as "easypanelService"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    LEFT JOIN LATERAL (
      SELECT id, email
      FROM users
      WHERE tenant_id = t.id AND role IN ('admin', 'tenant_admin')
      ORDER BY created_at ASC
      LIMIT 1
    ) u ON true
    ORDER BY t.created_at DESC
  `);
  return result.rows;
}

export async function getTenantById(id: string): Promise<any | null> {
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_api_key_encrypted as "aiApiKeyEncrypted",
           t.ai_model as "aiModel", t.evolution_instance as "evolutionInstance", 
           t.whatsapp_number as "whatsappNumber", t.plan, t.active, 
           t.subscription_status as "subscriptionStatus", t.billing_currency as "billingCurrency", 
           t.custom_monthly_price as "customMonthlyPrice", t.trial_ends_at as "trialEndsAt", 
           t.next_billing_date as "nextBillingDate", t.grace_period_ends_at as "gracePeriodEndsAt",
           t.custom_invoices_quota as "customInvoicesQuota",
           t.calendar_token as "calendarToken",
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "billingIdType",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "billingIdNumber",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "billingLegalName",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "billingEmail",
           COALESCE(NULLIF(t.billing_id_type, ''), thc.taxpayer_id_type, '01') as "fiscalTipoIdentificacion",
           COALESCE(NULLIF(t.billing_id_number, ''), thc.taxpayer_id_number, '') as "fiscalIdentificacion",
           COALESCE(NULLIF(t.billing_legal_name, ''), thc.taxpayer_name, t.name) as "fiscalNombreReceptor",
           COALESCE(NULLIF(t.billing_email, ''), thc.taxpayer_email, '') as "fiscalEmailReceptor",
           t.settings_json as "settingsJson", t.created_at as "createdAt",
           t.id as "postgresTenantId",
           'whatsapp_saas' as "postgresDb",
           'public' as "postgresSchema",
           (t.settings_json->'easypanel'->>'project') as "easypanelProject",
           (t.settings_json->'easypanel'->>'service') as "easypanelService"
    FROM tenants t
    LEFT JOIN tenant_hacienda_configs thc ON thc.tenant_id = t.id
    WHERE t.id = $1
  `, [id]);
  return result.rows[0] || null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  const result = await query(`
    SELECT t.id, t.name, t.slug, t.custom_domain as "customDomain", 
           t.ai_provider as "aiProvider", t.ai_api_key_encrypted as "aiApiKeyEncrypted",
           t.ai_model as "aiModel", t.evolution_instance as "evolutionInstance", 
           t.whatsapp_number as "whatsappNumber", t.plan, t.active, 
           t.subscription_status as "subscriptionStatus", t.billing_currency as "billingCurrency",
           t.custom_monthly_price as "customMonthlyPrice", t.trial_ends_at as "trialEndsAt",
           t.calendar_token as "calendarToken",
           t.address, t.latitude, t.longitude, t.google_maps_url as "googleMapsUrl",
           t.is_ai_pilot as "isAiPilot", t.ai_priority_level as "aiPriorityLevel",
           COALESCE(t.requires_subscription_invoice, false) as "requiresSubscriptionInvoice",
           t.billing_id_type as "billingIdType",
           t.billing_id_number as "billingIdNumber",
           t.billing_legal_name as "billingLegalName",
           t.billing_email as "billingEmail",
           t.billing_id_type as "fiscalTipoIdentificacion",
           t.billing_id_number as "fiscalIdentificacion",
           t.billing_legal_name as "fiscalNombreReceptor",
           t.billing_email as "fiscalEmailReceptor",
           t.settings_json as "settingsJson", t.created_at as "createdAt"
    FROM tenants t
    LEFT JOIN store_settings ss ON ss.tenant_id = t.id
    WHERE LOWER(t.slug) = $1 OR LOWER(ss.store_slug) = $1
    LIMIT 1
  `, [cleanSlug]);
  return result.rows[0] || null;
}

export async function getTenantByCustomDomain(domain: string): Promise<Tenant | null> {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE custom_domain = $1
  `, [domain]);
  return result.rows[0] || null;
}

export async function getTenantByEvolutionInstance(instanceName: string): Promise<Tenant | null> {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE evolution_instance = $1
  `, [instanceName]);
  return result.rows[0] || null;
}

export async function createTenant(data: Partial<Tenant> & Record<string, any>): Promise<any> {
  const finalPrice = data.customMonthlyPrice !== undefined 
    ? Number(data.customMonthlyPrice) 
    : (data.plan === 'enterprise' ? 85000 : data.plan === 'aliado' ? 0 : data.plan === 'emprendedor' ? 35000 : 55000);

  const idType = data.billingIdType || data.fiscalTipoIdentificacion || '01';
  const idNumber = (data.billingIdNumber || data.fiscalIdentificacion || '').replace(/\D/g, '');
  const legalName = data.billingLegalName || data.fiscalNombreReceptor || '';
  const billEmail = data.billingEmail || data.fiscalEmailReceptor || '';

  const result = await query(`
    INSERT INTO tenants (
      name, slug, custom_domain, ai_provider, ai_api_key_encrypted, 
      ai_model, evolution_instance, whatsapp_number, plan, active,
      custom_monthly_price, billing_currency, subscription_status, trial_ends_at, settings_json,
      address, latitude, longitude, google_maps_url, is_ai_pilot, ai_priority_level,
      requires_subscription_invoice, billing_id_type, billing_id_number, billing_legal_name, billing_email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, custom_monthly_price as "customMonthlyPrice", billing_currency as "billingCurrency",
           subscription_status as "subscriptionStatus", trial_ends_at as "trialEndsAt",
           settings_json as "settingsJson", address, latitude, longitude, google_maps_url as "googleMapsUrl",
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           requires_subscription_invoice as "requiresSubscriptionInvoice",
           billing_id_type as "billingIdType",
           billing_id_number as "billingIdNumber",
           billing_legal_name as "billingLegalName",
           billing_email as "billingEmail",
           billing_id_type as "fiscalTipoIdentificacion",
           billing_id_number as "fiscalIdentificacion",
           billing_legal_name as "fiscalNombreReceptor",
           billing_email as "fiscalEmailReceptor",
           created_at as "createdAt"
  `, [
    data.name, data.slug, data.customDomain, data.aiProvider || 'gemini', 
    data.aiApiKeyEncrypted, data.aiModel || 'gemini-2.5-flash', data.evolutionInstance, 
    data.whatsappNumber || data.phone || null, data.plan || 'pro', data.active !== false,
    finalPrice, data.billingCurrency || 'CRC', data.subscriptionStatus || 'active',
    data.trialEndsAt || null, data.settingsJson || null,
    data.address || null, data.latitude ? Number(data.latitude) : null,
    data.longitude ? Number(data.longitude) : null, data.googleMapsUrl || data.google_maps_url || null,
    Boolean(data.isAiPilot), Number(data.aiPriorityLevel) || 0,
    Boolean(data.requiresSubscriptionInvoice),
    idType,
    idNumber,
    legalName,
    billEmail
  ]);
  return result.rows[0];
}

export async function updateTenant(id: string, data: Record<string, any>): Promise<any | null> {
  const allowedColumns: Record<string, string> = {
    name: 'name',
    slug: 'slug',
    customDomain: 'custom_domain',
    custom_domain: 'custom_domain',
    aiProvider: 'ai_provider',
    ai_provider: 'ai_provider',
    aiApiKeyEncrypted: 'ai_api_key_encrypted',
    ai_api_key_encrypted: 'ai_api_key_encrypted',
    aiModel: 'ai_model',
    ai_model: 'ai_model',
    evolutionInstance: 'evolution_instance',
    evolution_instance: 'evolution_instance',
    whatsappNumber: 'whatsapp_number',
    whatsapp_number: 'whatsapp_number',
    phone: 'whatsapp_number',
    plan: 'plan',
    active: 'active',
    settingsJson: 'settings_json',
    settings_json: 'settings_json',
    subscriptionStatus: 'subscription_status',
    subscription_status: 'subscription_status',
    billingCurrency: 'billing_currency',
    billing_currency: 'billing_currency',
    customMonthlyPrice: 'custom_monthly_price',
    custom_monthly_price: 'custom_monthly_price',
    trialEndsAt: 'trial_ends_at',
    trial_ends_at: 'trial_ends_at',
    nextBillingDate: 'next_billing_date',
    next_billing_date: 'next_billing_date',
    gracePeriodEndsAt: 'grace_period_ends_at',
    grace_period_ends_at: 'grace_period_ends_at',
    address: 'address',
    latitude: 'latitude',
    longitude: 'longitude',
    googleMapsUrl: 'google_maps_url',
    google_maps_url: 'google_maps_url',
    isAiPilot: 'is_ai_pilot',
    is_ai_pilot: 'is_ai_pilot',
    aiPriorityLevel: 'ai_priority_level',
    ai_priority_level: 'ai_priority_level',
    requiresSubscriptionInvoice: 'requires_subscription_invoice',
    requires_subscription_invoice: 'requires_subscription_invoice',
    billingIdType: 'billing_id_type',
    billing_id_type: 'billing_id_type',
    fiscalTipoIdentificacion: 'billing_id_type',
    billingIdNumber: 'billing_id_number',
    billing_id_number: 'billing_id_number',
    fiscalIdentificacion: 'billing_id_number',
    billingLegalName: 'billing_legal_name',
    billing_legal_name: 'billing_legal_name',
    fiscalNombreReceptor: 'billing_legal_name',
    billingEmail: 'billing_email',
    billing_email: 'billing_email',
    fiscalEmailReceptor: 'billing_email'
  };

  // Deduplicate by target DB column
  const seenColumns = new Set<string>();
  const validEntries: Array<[string, any]> = [];
  for (const [k, v] of Object.entries(data)) {
    const col = allowedColumns[k];
    if (col && v !== undefined && !seenColumns.has(col)) {
      seenColumns.add(col);
      validEntries.push([col, v]);
    }
  }
  if (validEntries.length === 0) return getTenantById(id);

  const setClause = validEntries.map(([dbColumn], index) => {
    return `${dbColumn} = $${index + 2}`;
  }).join(', ');

  const values = validEntries.map(([, val]) => val);

  const result = await query(`
    UPDATE tenants SET ${setClause}
    WHERE id = $1
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, subscription_status as "subscriptionStatus",
           billing_currency as "billingCurrency", custom_monthly_price as "customMonthlyPrice",
           trial_ends_at as "trialEndsAt", settings_json as "settingsJson",
           address, latitude, longitude, google_maps_url as "googleMapsUrl",
           is_ai_pilot as "isAiPilot", ai_priority_level as "aiPriorityLevel",
           requires_subscription_invoice as "requiresSubscriptionInvoice",
           billing_id_type as "billingIdType",
           billing_id_number as "billingIdNumber",
           billing_legal_name as "billingLegalName",
           billing_email as "billingEmail",
           billing_id_type as "fiscalTipoIdentificacion",
           billing_id_number as "fiscalIdentificacion",
           billing_legal_name as "fiscalNombreReceptor",
           billing_email as "fiscalEmailReceptor",
           created_at as "createdAt"
  `, [id, ...values]);

  return result.rows[0] || null;
}

export async function deleteTenant(id: string): Promise<boolean> {
  const result = await query('DELETE FROM tenants WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}
