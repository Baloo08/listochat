import { Router } from 'express';
import { query } from '../db.js';
import { requireSuperAdmin, AuthenticatedRequest, logAdminAction } from '../auth.js';

const router = Router();
router.use(requireSuperAdmin);

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://betico_evolution:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';

// Subagent Classifier Helper
export function classifySubagent(messageText: string): {
  id: 'sales' | 'booking' | 'courts' | 'loyalty' | 'handoff' | 'general';
  name: string;
  badgeColor: string;
  badgeBg: string;
} {
  const lower = (messageText || '').toLowerCase();

  if (/humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente|atenci[oó]n personalizada/i.test(lower)) {
    return {
      id: 'handoff',
      name: 'Escalado Humano',
      badgeColor: '#f87171',
      badgeBg: 'rgba(239, 68, 68, 0.15)'
    };
  }

  if (/cancha|canchas|partido|f[uú]tbol|p[aá]del|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(lower)) {
    return {
      id: 'courts',
      name: 'Canchas & Deportes',
      badgeColor: '#fb923c',
      badgeBg: 'rgba(249, 115, 22, 0.15)'
    };
  }

  if (/servicio|servicios|cita|citas|agenda|agendar|turno|atenci[oó]n|doctor|especialista|disponibilidad de horario/i.test(lower)) {
    return {
      id: 'booking',
      name: 'Citas & Agenda',
      badgeColor: '#facc15',
      badgeBg: 'rgba(234, 179, 8, 0.15)'
    };
  }

  if (/puntos?|sellos?|tarjeta de sellos?|lealtad|fidelidad|fidelizaci[oó]n|premio|premios|canjear|recompensas?|club de clientes/i.test(lower)) {
    return {
      id: 'loyalty',
      name: 'Club de Fidelización',
      badgeColor: '#c084fc',
      badgeBg: 'rgba(192, 132, 252, 0.15)'
    };
  }

  if (/precio|costo|cu[aá]nto|venden|cat[aá]logo|men[uú]|producto|productos|comprar|pedir|orden|pedido|foto|llevar|delivery|env[ií]o|carrito|sinpe|transferencia|efectivo|tarjeta|pago|pagar/i.test(lower)) {
    return {
      id: 'sales',
      name: 'Ventas & Catálogo',
      badgeColor: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.15)'
    };
  }

  return {
    id: 'general',
    name: 'Asistente General / FAQ',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96, 165, 250, 0.15)'
  };
}

// ========================================================
// 1. MASTER BOTS (betico_ventas y betico_soporte)
// ========================================================

// GET /api/bots-chats/instances
router.get('/instances', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, instance_type as "instanceType", instance_name as "instanceName",
             phone_number as "phoneNumber", status, qr_code as "qrCode", updated_at as "updatedAt"
      FROM superadmin_instances
      ORDER BY instance_type ASC
    `);

    const types = ['ventas', 'soporte'];
    const formatted = types.map((t) => {
      const found = result.rows.find((i: any) => i.instanceType === t);
      return (
        found || {
          instanceType: t,
          instanceName: `betico_${t}`,
          status: 'disconnected',
          qrCode: null
        }
      );
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('[Bots] Error fetching instances:', error);
    res.status(500).json({ error: 'Error al consultar instancias maestras' });
  }
});

// POST /api/bots-chats/instances/connect
router.post('/instances/connect', async (req: AuthenticatedRequest, res) => {
  try {
    const { instanceType } = req.body;
    if (!instanceType) {
      res.status(400).json({ error: 'El tipo de instancia es requerido (ventas o soporte)' });
      return;
    }

    const instanceName = `betico_${instanceType}`;

    // 1. Ensure instance exists in Evolution
    try {
      await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          instanceName,
          token: EVOLUTION_API_KEY,
          qrcode: true
        })
      });
    } catch (createErr) {
      // Instance might already exist, continue
    }

    // 2. Connect and fetch QR code
    const connRes = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { apikey: EVOLUTION_API_KEY }
    });

    const connData = (await connRes.json().catch(() => ({}))) as any;
    const qr = connData?.base64 || connData?.qrcode?.base64 || connData?.code || null;
    const isConnected = connData?.instance?.state === 'open' || connData?.state === 'open';
    const status = isConnected ? 'connected' : qr ? 'qr_ready' : 'disconnected';

    await query(
      `INSERT INTO superadmin_instances (instance_type, instance_name, status, qr_code, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (instance_type) DO UPDATE SET
         status = EXCLUDED.status,
         qr_code = EXCLUDED.qr_code,
         updated_at = CURRENT_TIMESTAMP`,
      [instanceType, instanceName, status, qr]
    );

    await logAdminAction(req.user!.userId, 'connect_master_bot', 'evolution', instanceName, { instanceType, status }, req);

    res.json({
      success: true,
      instanceName,
      status,
      qrCode: qr
    });
  } catch (error: any) {
    console.error('[Bots] Error connecting instance:', error);
    res.status(500).json({ error: 'Error al conectar bot maestro en Evolution API' });
  }
});

// POST /api/bots-chats/instances/disconnect
router.post('/instances/disconnect', async (req: AuthenticatedRequest, res) => {
  try {
    const { instanceType } = req.body;
    const instanceName = `betico_${instanceType}`;

    try {
      await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { apikey: EVOLUTION_API_KEY }
      });
    } catch (e) {
      console.warn('[Bots Disconnect] Warning logging out:', e);
    }

    await query(
      `UPDATE superadmin_instances SET status = 'disconnected', qr_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE instance_type = $1`,
      [instanceType]
    );

    await logAdminAction(req.user!.userId, 'disconnect_master_bot', 'evolution', instanceName, { instanceType }, req);

    res.json({ success: true, message: `Instancia ${instanceName} desconectada con éxito` });
  } catch (error: any) {
    console.error('[Bots] Error disconnecting instance:', error);
    res.status(500).json({ error: 'Error al desconectar bot maestro' });
  }
});

// ========================================================
// 2. LIVE SUPPORT CHATS & SUBAGENT TRACKER
// ========================================================

// GET /api/bots-chats/tenants (Selector dropdown list)
router.get('/tenants', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", evolution_instance as "evolutionInstance", active
      FROM tenants
      WHERE slug != 'superadmin'
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener lista de comercios' });
  }
});

// GET /api/bots-chats/conversations?tenantId=xxx
router.get('/conversations', async (req, res) => {
  try {
    const tenantId = req.query.tenantId as string;

    let queryText = `
      SELECT DISTINCT ON (m.tenant_id, m.remote_jid)
        m.remote_jid as "remoteJid",
        m.tenant_id as "tenantId",
        t.name as "tenantName",
        t.slug as "tenantSlug",
        t.evolution_instance as "evolutionInstance",
        COALESCE(m.push_name, 'Cliente') as "pushName",
        m.message_text as "lastMessage",
        m.created_at as "lastMessageTime",
        m.from_me as "lastFromMe",
        COALESCE(s.is_human_mode, false) as "isHumanMode",
        (SELECT COUNT(*) FROM chat_messages cm WHERE cm.tenant_id = m.tenant_id AND cm.remote_jid = m.remote_jid) as "totalMessages"
      FROM chat_messages m
      JOIN tenants t ON t.id = m.tenant_id
      LEFT JOIN chat_sessions s ON s.tenant_id = m.tenant_id AND s.remote_jid = m.remote_jid
    `;

    const params: any[] = [];
    if (tenantId && tenantId !== 'all') {
      queryText += ` WHERE m.tenant_id = $1 `;
      params.push(tenantId);
    }

    queryText += ` ORDER BY m.tenant_id, m.remote_jid, m.created_at DESC LIMIT 50`;

    const result = await query(queryText, params);

    // Annotate each conversation with its active subagent
    const conversations = result.rows.map((conv: any) => {
      const subagent = classifySubagent(conv.lastMessage || '');
      return {
        ...conv,
        totalMessages: parseInt(conv.totalMessages || '1', 10),
        subagent
      };
    });

    // Sort by lastMessageTime descending
    conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    res.json(conversations);
  } catch (error: any) {
    console.error('[Live Chats] Error loading conversations:', error);
    res.status(500).json({ error: 'Error al cargar conversaciones en vivo' });
  }
});

// GET /api/bots-chats/messages?tenantId=xxx&remoteJid=yyy
router.get('/messages', async (req, res) => {
  const { tenantId, remoteJid } = req.query;
  if (!tenantId || !remoteJid) {
    res.status(400).json({ error: 'tenantId y remoteJid son requeridos' });
    return;
  }

  try {
    const result = await query(
      `SELECT id, tenant_id as "tenantId", remote_jid as "remoteJid",
              push_name as "pushName", from_me as "fromMe", message_text as "messageText",
              ai_response as "aiResponse", status, created_at as "createdAt"
       FROM chat_messages
       WHERE tenant_id = $1 AND remote_jid = $2
       ORDER BY created_at ASC
       LIMIT 100`,
      [tenantId, remoteJid]
    );

    const messages = result.rows.map((msg: any) => {
      const subagent = classifySubagent(msg.messageText || '');
      return {
        ...msg,
        subagent
      };
    });

    res.json(messages);
  } catch (error: any) {
    console.error('[Live Chats] Error loading messages:', error);
    res.status(500).json({ error: 'Error al cargar mensajes del chat' });
  }
});

// POST /api/bots-chats/reply
router.post('/reply', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId, remoteJid, messageText, pushName } = req.body;

    if (!tenantId || !remoteJid || !messageText) {
      res.status(400).json({ error: 'tenantId, remoteJid y messageText son requeridos' });
      return;
    }

    const tenantRes = await query(`SELECT id, name, slug, evolution_instance FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }
    const tenant = tenantRes.rows[0];
    const instanceName = tenant.evolution_instance || `tenant_${tenant.slug}`;
    const cleanPhone = String(remoteJid).replace(/@.+$/, '').replace(/\D/g, '');

    // Send via Evolution API
    try {
      await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: messageText,
          options: {
            delay: 1200,
            presence: 'composing'
          }
        })
      });
    } catch (evoErr: any) {
      console.warn('[Live Chats Reply] Evolution dispatch warning:', evoErr.message);
    }

    // Save in chat_messages
    const msgId = `manual_sa_${Date.now()}`;
    await query(
      `INSERT INTO chat_messages (id, tenant_id, remote_jid, push_name, from_me, message_text, ai_response, status)
       VALUES ($1, $2, $3, $4, true, $5, false, 'sent')`,
      [msgId, tenantId, remoteJid, pushName || 'Soporte Betico', messageText]
    );

    // Auto-enable human mode when an operator intervenes
    await query(
      `INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, updated_at)
       VALUES ($1, $2, true, CURRENT_TIMESTAMP)
       ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET is_human_mode = true, updated_at = CURRENT_TIMESTAMP`,
      [tenantId, remoteJid]
    );

    await logAdminAction(req.user!.userId, 'reply_support_chat', 'chat', remoteJid, { tenantId, cleanPhone, messageLength: messageText.length }, req);

    res.json({
      success: true,
      messageId: msgId,
      message: 'Respuesta despachada con éxito por WhatsApp'
    });
  } catch (error: any) {
    console.error('[Live Chats Reply] Error:', error);
    res.status(500).json({ error: 'Error al enviar respuesta por WhatsApp' });
  }
});

// POST /api/bots-chats/toggle-ai
router.post('/toggle-ai', async (req: AuthenticatedRequest, res) => {
  try {
    const { tenantId, remoteJid, isHumanMode } = req.body;

    if (!tenantId || !remoteJid) {
      res.status(400).json({ error: 'tenantId y remoteJid son requeridos' });
      return;
    }

    await query(
      `INSERT INTO chat_sessions (tenant_id, remote_jid, is_human_mode, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (tenant_id, remote_jid) DO UPDATE SET is_human_mode = EXCLUDED.is_human_mode, updated_at = CURRENT_TIMESTAMP`,
      [tenantId, remoteJid, Boolean(isHumanMode)]
    );

    await logAdminAction(req.user!.userId, 'toggle_chat_human_mode', 'chat', remoteJid, { tenantId, isHumanMode: Boolean(isHumanMode) }, req);

    res.json({
      success: true,
      isHumanMode: Boolean(isHumanMode),
      message: isHumanMode ? 'Modo Humano ACTIVADO (IA pausada)' : 'Modo Asistente IA ACTIVADO'
    });
  } catch (error: any) {
    console.error('[Live Chats Toggle AI] Error:', error);
    res.status(500).json({ error: 'Error al alternar modo del chat' });
  }
});

export default router;
