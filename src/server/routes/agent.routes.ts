import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getAgentConfig, saveAgentConfig } from '../db/agent-config.repo.js';
import { processWhatsAppMessageWithAI } from '../services/agent.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/prompt', async (req, res) => {
  try {
    const config = await getAgentConfig(req.tenantId);
    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener prompt' });
  }
});

router.post('/prompt', async (req, res) => {
  try {
    const saved = await saveAgentConfig(req.tenantId, req.body);
    res.json(saved);
  } catch (error) {
    console.error(error);
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
import { getTenantById } from '../db/tenant.repo.js';

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
