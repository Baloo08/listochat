import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getChatMessagesByTenant, saveChatMessage } from '../db/chats.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { sendMessage } from '../services/evolution.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const msgs = await getChatMessagesByTenant(req.tenantId, 300);
    res.json(msgs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

router.post('/reply', async (req, res) => {
  try {
    const { remoteJid, messageText, pushName } = req.body;
    const tenant = await getTenantById(req.tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${req.tenantId.slice(0,8)}`;

    if (remoteJid && messageText) {
      await sendMessage(instanceName, remoteJid, messageText);
      await saveChatMessage({
        id: `manual_${Date.now()}`,
        tenantId: req.tenantId,
        remoteJid,
        pushName: pushName || '',
        fromMe: true,
        messageText,
        status: 'sent'
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
});

router.post('/toggle-ai', async (req, res) => {
  res.json({ success: true });
});

export default router;
