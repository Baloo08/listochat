import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getChatMessagesByTenant, saveChatMessage, getAllChatSessions, setChatHumanMode } from '../db/chats.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();
router.use(authenticateToken);
router.use(tenantContext);

router.get('/', async (req, res) => {
  try {
    const msgs = await getChatMessagesByTenant(req.tenantId!, 500);
    const sessions = await getAllChatSessions(req.tenantId!);
    res.json({ messages: msgs, sessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

router.post('/reply', async (req, res) => {
  try {
    const { remoteJid, messageText, pushName } = req.body;
    let tenantId = req.tenantId!;
    
    // Only if superadmin without specific tenant, find tenant associated with this message
    if ((req as any).user?.role === 'superadmin' && !req.tenantId) {
      const checkTenant = await query(`SELECT tenant_id FROM chat_messages WHERE remote_jid = $1 LIMIT 1`, [remoteJid]);
      if (checkTenant.rows.length > 0) {
        tenantId = checkTenant.rows[0].tenant_id;
      }
    }

    const tenant = await getTenantById(tenantId);
    const instanceName = tenant?.evolutionInstance || `tenant_${tenantId.slice(0, 8)}`;
    const cleanPhone = (remoteJid || '').replace(/@.+$/, '').replace(/\D/g, '');

    if (cleanPhone && messageText) {
      await sendMessage(instanceName, cleanPhone, messageText);
      await saveChatMessage(tenantId, {
        id: `manual_${Date.now()}`,
        remoteJid,
        pushName: pushName || 'Operador',
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
  try {
    const { remoteJid, isHumanMode } = req.body;
    let tenantId = req.tenantId!;
    if ((req as any).user?.role === 'superadmin' && !req.tenantId) {
      const checkTenant = await query(`SELECT tenant_id FROM chat_messages WHERE remote_jid = $1 LIMIT 1`, [remoteJid]);
      if (checkTenant.rows.length > 0) {
        tenantId = checkTenant.rows[0].tenant_id;
      }
    }

    if (remoteJid) {
      await setChatHumanMode(tenantId, remoteJid, Boolean(isHumanMode));
    }
    res.json({ success: true, remoteJid, isHumanMode: Boolean(isHumanMode) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error cambiando modo humano' });
  }
});

export default router;
