import { getTenantById, getAllTenants } from '../db/tenant.repo.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getProductsByTenant } from '../db/products.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getScheduleSettings } from '../db/schedule.repo.js';
import { getCourtsByTenant } from '../db/courts.repo.js';

const debounceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Sanitizes a string to be a valid Ollama model tag component:
 * Lowercase alphanumeric, hyphens, and underscores only.
 */
export function sanitizeModelName(nameOrSlug: string): string {
  if (!nameOrSlug) return 'default';
  const sanitized = nameOrSlug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized || 'default';
}

/**
 * Returns the canonical Ollama virtual model tag for a given tenant.
 * Example: betico-ai:tenant_canchas-el-cartaguito
 */
export function getTenantModelName(tenant: { id: string; slug?: string | null }): string {
  const tag = tenant.slug ? sanitizeModelName(tenant.slug) : tenant.id.slice(0, 8);
  return `betico-ai:tenant_${tag}`;
}

/**
 * Escapes triple quotes and special characters to prevent Modelfile syntax breaking.
 */
function escapeModelfileContent(text: string): string {
  if (!text) return '';
  return text.replace(/"""/g, '\"\"\"');
}

/**
 * Builds the static Modelfile content for a tenant:
 * - Business identity & personality
 * - Catalog of services & products
 * - Payment options & static schedule
 * - WhatsApp formatting rules & command guidelines
 */
export async function buildTenantModelfile(tenantId: string): Promise<{ modelfile: string; modelName: string }> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const modelName = getTenantModelName(tenant);
  const agentConfig: any = await getAgentConfig(tenantId);
  const services: any[] = await getServicesByTenant(tenantId);
  const products: any[] = await getProductsByTenant(tenantId, true);
  const store = await getStoreSettings(tenantId);
  const schedule = await getScheduleSettings(tenantId);
  const courts: any[] = await getCourtsByTenant(tenantId);

  const businessName = agentConfig?.businessName || tenant.name || 'Nuestro Negocio';
  const currency = agentConfig?.currency || 'CRC';
  const currencySymbol = currency === 'USD' ? '$' : '₡';
  const customPrompt = agentConfig?.systemPrompt || '';

  // 1. Static Services Block
  let servicesBlock = '';
  if (services && services.length > 0) {
    const activeServices = services.filter(s => s.active !== false);
    if (activeServices.length > 0) {
      servicesBlock = '\nCATÁLOGO DE SERVICIOS:\n' + activeServices.map(s => 
        `- ${s.name}: ${currencySymbol}${Number(s.price || 0).toLocaleString('es-CR')} (${s.duration || `${s.estimatedMinutes || 45} min`})${s.description ? ` - ${s.description}` : ''}`
      ).join('\n');
    }
  }

  // 2. Static Products Block (up to 25 items for concise pre-compilation)
  let productsBlock = '';
  if (products && products.length > 0) {
    const activeProducts = products.filter(p => p.active !== false).slice(0, 25);
    if (activeProducts.length > 0) {
      productsBlock = '\nCATÁLOGO DE PRODUCTOS:\n' + activeProducts.map(p => 
        `- ${p.name}: ${currencySymbol}${Number(p.price || 0).toLocaleString('es-CR')}${p.description ? ` - ${p.description.slice(0, 80)}` : ''}`
      ).join('\n');
    }
  }

  // 3. Static Courts Block
  let courtsBlock = '';
  if (courts && courts.length > 0) {
    const activeCourts = courts.filter(c => c.active !== false);
    if (activeCourts.length > 0) {
      courtsBlock = '\nCANCHAS / ESPACIOS DISPONIBLES:\n' + activeCourts.map(c => 
        `- ${c.name} (${c.type || 'Sintética'}): ${currencySymbol}${Number(c.price_per_hour || c.pricePerHour || 0).toLocaleString('es-CR')}/hora`
      ).join('\n');
    }
  }

  // 4. Payment Methods Block
  let paymentBlock = '';
  const pMethods: string[] = [];
  if (store?.acceptSinpe && store.sinpePhone) {
    pMethods.push(`SINPE Móvil al ${store.sinpePhone} (${store.sinpeName || businessName})`);
  }
  if (store?.acceptTransfer && store.bankAccountInfo) {
    pMethods.push(`Transferencia Bancaria: ${store.bankAccountInfo}`);
  }
  if (store?.acceptCashOnDelivery) {
    pMethods.push('Efectivo contra entrega');
  }
  if (pMethods.length > 0) {
    paymentBlock = '\nMÉTODOS DE PAGO ACEPTADOS:\n' + pMethods.map(m => `- ${m}`).join('\n');
  }

  // 5. Schedule Block
  let scheduleBlock = '';
  if (schedule?.jornadaConfig) {
    const j = schedule.jornadaConfig;
    scheduleBlock = `\nHORARIO DE ATENCIÓN:\n- Horario regular: ${j.startHour || '08:00'} a ${j.endHour || '17:00'} (${j.slotMinutes || 45} min por turno)`;
  }

  // System Prompt Compilation
  const systemPrompt = `Eres el asistente virtual inteligente y cordial de "${businessName}".
Tu objetivo es atender a los clientes por WhatsApp, responder sus dudas, agendar citas o canchas, tomar pedidos y ofrecer una atención de primer nivel.

REGLAS DE ATENCIÓN:
1. Responde de forma amable, clara y concisa (ideal para WhatsApp). Usa negrita (*palabra*) para resaltar datos importantes.
2. Nunca inventes servicios, productos, horarios ni precios que no estén en tu catálogo oficial.
3. Si un cliente solicita agendar una cita o cancha, solicita su nombre, fecha y hora preferida.
4. Si un cliente solicita hacer un pedido, confirma los productos, cantidades y método de pago o entrega.
5. Si el cliente solicita hablar con un humano o asesor, o si notas frustración o un reclamo urgente, responde amablemente indicando que le comunicarás con un asesor humano e incluye la directiva <<<COMMAND_HANDOFF: {"reason": "Solicitado por cliente"}>>>.
6. Cuando se acuerden los datos completos para una cita, emite al final de tu mensaje la directiva:
<<<COMMAND_BOOKING: {"customerName": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "serviceName": "..."}>>>
7. Cuando se acuerde una reserva de cancha, emite al final de tu mensaje:
<<<COMMAND_COURT_BOOKING: {"courtName": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "durationHours": 1}>>>
8. Cuando se confirme un pedido de productos, emite al final:
<<<COMMAND_ORDER: {"customerName": "...", "items": [{"productName": "...", "quantity": 1}], "deliveryMethod": "pickup|delivery"}>>>

${customPrompt ? `INSTRUCCIONES ESPECÍFICAS DEL COMERCIO:\n${customPrompt}\n` : ''}
${servicesBlock}
${courtsBlock}
${productsBlock}
${paymentBlock}
${scheduleBlock}
`.trim();

  const escapedSystem = escapeModelfileContent(systemPrompt);
  const temperature = agentConfig?.temperature ? Math.min(1.0, Math.max(0.1, Number(agentConfig.temperature))) : 0.3;

  const modelfile = `FROM betico-ai
SYSTEM """${escapedSystem}"""
PARAMETER temperature ${temperature.toFixed(2)}
PARAMETER stop "Cliente:"
PARAMETER stop "Human:"
PARAMETER stop "Usuario:"
PARAMETER stop "User:"
`;

  return { systemPrompt, temperature, modelfile, modelName };
}

/**
 * Synchronizes a tenant's virtual model in Ollama:
 * Uses the structured from + system API of Ollama for instant manifest creation.
 */
export async function syncTenantVirtualModel(tenantId: string): Promise<{ success: boolean; modelName: string; error?: string }> {
  try {
    const { systemPrompt, temperature, modelfile, modelName } = await buildTenantModelfile(tenantId);
    const ollamaUrl = process.env.OLLAMA_URL || 'http://beticoia_ollama:11434/v1';
    const baseUrl = ollamaUrl.replace(/\/v1\/?$/, '');

    console.log(`[VirtualModel] Creando/Actualizando modelo virtual en Ollama: ${modelName}...`);
    const res = await fetch(`${baseUrl}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: modelName,
        from: 'betico-ai',
        system: systemPrompt,
        parameters: {
          temperature: Number(temperature.toFixed(2))
        },
        stream: false
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[VirtualModel] Ollama respondió con status ${res.status}: ${errBody}`);
      return { success: false, modelName, error: `HTTP ${res.status}: ${errBody}` };
    }

    console.log(`[VirtualModel] ✅ Modelo virtual ${modelName} sincronizado con éxito en Ollama.`);
    return { success: true, modelName };
  } catch (err: any) {
    console.warn(`[VirtualModel] Error al sincronizar modelo virtual para tenant ${tenantId}:`, err.message);
    return { success: false, modelName: `tenant_${tenantId}`, error: err.message };
  }
}

/**
 * Deletes a tenant's virtual model from Ollama when a tenant is deleted.
 */
export async function deleteTenantVirtualModel(tenantId: string): Promise<void> {
  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) return;
    const modelName = getTenantModelName(tenant);
    const ollamaUrl = process.env.OLLAMA_URL || 'http://beticoia_ollama:11434/v1';
    const baseUrl = ollamaUrl.replace(/\/v1\/?$/, '');

    await fetch(`${baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });
    console.log(`[VirtualModel] Modelo virtual ${modelName} eliminado de Ollama.`);
  } catch (err: any) {
    console.warn(`[VirtualModel] Error al eliminar modelo de Ollama:`, err.message);
  }
}

/**
 * Debounced sync for tenant models. Ensures that frequent consecutive edits
 * (e.g., adding several products or services in a few seconds) only trigger one compilation.
 */
export function debounceSyncTenantModel(tenantId: string, delayMs: number = 5000): void {
  const existing = debounceTimers.get(tenantId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(tenantId);
    syncTenantVirtualModel(tenantId).catch(err => {
      console.error(`[VirtualModel] Error en debounceSyncTenantModel para ${tenantId}:`, err);
    });
  }, delayMs);

  debounceTimers.set(tenantId, timer);
}

/**
 * Startup sanity check: audits all active tenants and creates their virtual models in Ollama if missing.
 */
export async function ensureAllVirtualModels(): Promise<void> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://beticoia_ollama:11434/v1';
    const baseUrl = ollamaUrl.replace(/\/v1\/?$/, '');

    // Check existing models in Ollama
    const tagsRes = await fetch(`${baseUrl}/api/tags`, { method: 'GET' }).catch(() => null);
    if (!tagsRes || !tagsRes.ok) {
      console.warn('[VirtualModel] Ollama no disponible para sincronización inicial de modelos virtuales.');
      return;
    }

    const tagsData = await tagsRes.json().catch(() => ({ models: [] }));
    const existingModels = new Set<string>((tagsData.models || []).map((m: any) => m.name));

    const tenants = await getAllTenants();
    const activeTenants = tenants.filter(t => t.active !== false);

    console.log(`[VirtualModel] Verificando modelos virtuales para ${activeTenants.length} tenants activos...`);

    for (const t of activeTenants) {
      // Only create if tenant uses Betico AI / Ollama platform engine
      const usesLocalAI = !t.aiProvider || t.aiProvider === 'betico_ai' || t.aiProvider === 'ollama' || t.aiProvider === 'localai';
      if (!usesLocalAI) continue;

      const targetModel = getTenantModelName(t);
      const isAlreadyCreated = existingModels.has(targetModel) || existingModels.has(`${targetModel}:latest`);

      if (!isAlreadyCreated) {
        console.log(`[VirtualModel] Modelo virtual faltante para ${t.name} (${targetModel}), creando...`);
        await syncTenantVirtualModel(t.id);
      }
    }
    console.log('[VirtualModel] Auditoría de modelos virtuales finalizada.');
  } catch (err: any) {
    console.error('[VirtualModel] Error en ensureAllVirtualModels:', err.message);
  }
}