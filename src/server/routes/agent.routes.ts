import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getAgentConfig, saveAgentConfig } from '../db/agent-config.repo.js';
import { processWhatsAppMessageWithAI } from '../services/agent.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

import { encrypt } from '../services/encryption.js';
import { query } from '../db/pool.js';
import { debounceSyncTenantModel } from '../services/tenant-model.service.js';

import { getProductsByTenant } from '../db/products.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getCourtsByTenant } from '../db/courts.repo.js';
import { getSpecialistsByTenant } from '../db/specialists.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getTenantById } from '../db/tenant.repo.js';

router.get('/prompt', async (req, res) => {
  try {
    const config = await getAgentConfig(req.tenantId);
    const tenant = await getTenantById(req.tenantId);
    const store = await getStoreSettings(req.tenantId).catch(() => null);

    // Fetch counts for live visual node data badges
    let dataSourcesSummary = {
      productsCount: 0,
      servicesCount: 0,
      courtsCount: 0,
      specialistsCount: 0
    };
    try {
      const [products, services, courts, specialists] = await Promise.all([
        getProductsByTenant(req.tenantId, true).catch(() => []),
        getServicesByTenant(req.tenantId).catch(() => []),
        getCourtsByTenant(req.tenantId).catch(() => []),
        getSpecialistsByTenant(req.tenantId).catch(() => [])
      ]);
      dataSourcesSummary = {
        productsCount: (products || []).filter((p: any) => p.active !== false).length,
        servicesCount: (services || []).filter((s: any) => s.active !== false).length,
        courtsCount: (courts || []).filter((c: any) => c.active !== false).length,
        specialistsCount: (specialists || []).filter((s: any) => s.active !== false).length
      };
    } catch (e) {
      console.warn('[AgentRoute] Error fetching data source summary:', e);
    }

    res.json({
      ...config,
      provider: tenant?.aiProvider || config?.provider || 'betico_ai',
      model: tenant?.aiModel || config?.model || 'betico-ai',
      isUsingOwnKey: !!tenant?.aiApiKeyEncrypted,
      dataSourcesSummary,
      storeModules: store?.storeModules || { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener prompt' });
  }
});

router.post('/prompt', async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    // Handle BYOK vs Betico AI platform engine
    if (provider) {
      if (provider === 'betico_ai' || provider === 'ollama' || provider === 'localai' || (!apiKey && !req.body.isKeepingExistingKey)) {
        // Switch back to Betico AI platform engine: clear custom API key
        await query(
          `UPDATE tenants SET ai_provider = $1, ai_model = $2, ai_api_key_encrypted = NULL WHERE id = $3`,
          ['betico_ai', model || 'betico-ai', req.tenantId]
        );
      } else if (apiKey && apiKey.trim()) {
        // Save encrypted custom API key
        const encrypted = encrypt(apiKey.trim());
        await query(
          `UPDATE tenants SET ai_provider = $1, ai_model = $2, ai_api_key_encrypted = $3 WHERE id = $4`,
          [provider, model, encrypted, req.tenantId]
        );
      } else if (model) {
        // Just update model name
        await query(
          `UPDATE tenants SET ai_provider = $1, ai_model = $2 WHERE id = $3`,
          [provider, model, req.tenantId]
        );
      }
    }

    const saved = await saveAgentConfig(req.tenantId, req.body);
    debounceSyncTenantModel(req.tenantId);
    res.json(saved);
  } catch (error) {
    console.error('Error al guardar prompt:', error);
    res.status(500).json({ error: 'Error al guardar prompt' });
  }
});

router.post('/simulate', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await processWhatsAppMessageWithAI(
      req.tenantId,
      message || 'Hola, ¿qué servicios tienen?',
      '50688888888',
      'Cliente Prueba',
      []
    );
    res.json(result);
  } catch (error) {
    console.error('Error al simular agente:', error);
    res.status(500).json({ error: 'Error al simular la respuesta del agente IA. Verifica la configuración de tu proveedor.' });
  }
});

import { getTenantCurrentMonthUsage } from '../db/ai-usage.repo.js';

router.get('/ai-quota', async (req, res) => {
  try {
    const usage = await getTenantCurrentMonthUsage(req.tenantId);
    const tenant = await getTenantById(req.tenantId);
    const isUsingOwnKey = !!tenant?.aiApiKeyEncrypted;

    res.json({
      success: true,
      ...usage,
      isUsingOwnKey,
      provider: tenant?.aiProvider || 'localai'
    });
  } catch (error) {
    console.error('Error fetching tenant AI quota:', error);
    res.status(500).json({ error: 'Error al obtener cuota de IA' });
  }
});

export default router;
