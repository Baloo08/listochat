import { query } from './pool.js';
import { Tenant } from '../../shared/types.js';

export async function getAllTenants(): Promise<Tenant[]> {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants 
    ORDER BY created_at DESC
  `);
  return result.rows;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const result = await query(`
    SELECT id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_api_key_encrypted as "aiApiKeyEncrypted",
           ai_model as "aiModel", evolution_instance as "evolutionInstance", 
           whatsapp_number as "whatsappNumber", plan, active, 
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE id = $1
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
           settings_json as "settingsJson", created_at as "createdAt"
    FROM tenants WHERE evolution_instance = $1
  `, [instanceName]);
  return result.rows[0] || null;
}

export async function createTenant(data: Partial<Tenant>): Promise<Tenant> {
  const result = await query(`
    INSERT INTO tenants (
      name, slug, custom_domain, ai_provider, ai_api_key_encrypted, 
      ai_model, evolution_instance, whatsapp_number, plan, active, settings_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, settings_json as "settingsJson", created_at as "createdAt"
  `, [
    data.name, data.slug, data.customDomain, data.aiProvider || 'gemini', 
    data.aiApiKeyEncrypted, data.aiModel || 'gemini-2.5-flash', data.evolutionInstance, 
    data.whatsappNumber, data.plan || 'starter', data.active !== false, data.settingsJson
  ]);
  return result.rows[0];
}

export async function updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
  const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'createdAt');
  if (keys.length === 0) return getTenantById(id);

  const setClause = keys.map((key, index) => {
    const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return `${dbKey} = $${index + 2}`;
  }).join(', ');

  const values = keys.map(k => (data as any)[k]);

  const result = await query(`
    UPDATE tenants SET ${setClause}
    WHERE id = $1
    RETURNING id, name, slug, custom_domain as "customDomain", 
           ai_provider as "aiProvider", ai_model as "aiModel", 
           evolution_instance as "evolutionInstance", whatsapp_number as "whatsappNumber",
           plan, active, settings_json as "settingsJson", created_at as "createdAt"
  `, [id, ...values]);

  return result.rows[0] || null;
}

export async function deleteTenant(id: string): Promise<boolean> {
  const result = await query('DELETE FROM tenants WHERE id = $1', [id]);
  return (result.rowCount || 0) > 0;
}
