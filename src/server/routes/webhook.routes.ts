import { Router } from 'express';
import { getTenantByEvolutionInstance, getAllTenants } from '../db/tenant.repo.js';
import { processWhatsAppMessageWithAI } from '../services/agent.js';
import { sendMessage } from '../services/evolution.js';
import { createBookingFromCommand } from '../services/booking.service.js';
import { createOrderFromWhatsApp } from '../services/order.service.js';
import { saveChatMessage, getChatMessagesByTenant, getChatSession, setChatHumanMode } from '../db/chats.repo.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { query } from '../db/pool.js';

const router = Router();

router.post('/', async (req, res) => {
  // Always return immediate 200 OK to WhatsApp/Evolution API
  res.status(200).json({ status: 'received' });

  try {
    const payload = req.body || {};
    const event = (payload.event || '').toLowerCase();
    const instanceName = payload.instance || payload.instanceName;

    console.log(`[Webhook] Received event: '${event}' for instance: '${instanceName}'`);

    // Only process message upsert events
    if (event !== 'messages.upsert') {
      return;
    }

    // Evolution API v2 structure
    let data = payload.data;
    if (Array.isArray(data?.messages) && data.messages.length > 0) {
      data = data.messages[0];
    } else if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    if (!data) {
      return;
    }

    const key = data.key || {};
    const remoteJid = key.remoteJid || key.remoteJidAlt || '';
    const fromMe = key.fromMe || false;
    const pushName = data.pushName || 'Cliente';

    // Ignore group chats or broadcast status updates
    if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
      return;
    }

    // Extract text or location
    let userMessage = (
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      data?.message?.videoMessage?.caption ||
      data?.message?.text ||
      ''
    ).trim();

    // Check for native WhatsApp Location Message
    const loc = data?.message?.locationMessage || data?.message?.liveLocationMessage;
    if (loc?.degreesLatitude && loc?.degreesLongitude) {
      const mapsUrl = `https://maps.google.com/?q=${loc.degreesLatitude},${loc.degreesLongitude}`;
      userMessage = `📍 [Ubicación Compartida]: ${mapsUrl} (${loc.name || loc.address || 'Ubicación GPS'})`;
    }

    console.log(`[Webhook] Parsed message from ${remoteJid} (${pushName}): "${userMessage}" [fromMe=${fromMe}]`);

    if (!userMessage) {
      return;
    }

    let tenant = null;
    if (instanceName) {
      tenant = await getTenantByEvolutionInstance(instanceName);
    }
    if (!tenant) {
      const all = await getAllTenants();
      tenant = all.find(t => t.slug !== 'superadmin') || all[0] || null;
    }

    if (!tenant || !tenant.active) {
      console.warn(`[Webhook] No active tenant found for instance: ${instanceName}`);
      return;
    }

    const msgId = key.id || `msg_${Date.now()}`;
    const cleanPhone = remoteJid.replace(/@.+$/, '').replace(/\D/g, '');

    // If message was sent from the business phone itself (manual operator)
    if (fromMe) {
      await saveChatMessage(tenant.id, {
        id: msgId,
        remoteJid,
        pushName: 'Operador / Asistente',
        fromMe: true,
        messageText: userMessage,
        status: 'sent'
      });
      return;
    }

    // Save incoming user message
    await saveChatMessage(tenant.id, {
      id: msgId,
      remoteJid,
      pushName,
      fromMe: false,
      messageText: userMessage,
      status: 'received'
    });

    // Check if conversation is currently in Human Mode (AI paused)
    const session = await getChatSession(tenant.id, remoteJid);
    if (session?.isHumanMode) {
      console.log(`[Webhook] Chat ${remoteJid} is in HUMAN MODE. Skipping AI auto-reply.`);
      return;
    }

    // Fetch tenant's agent configuration
    const agentConfig: any = await getAgentConfig(tenant.id);

    // Check for Human Handoff trigger keywords
    const handoffEnabled = agentConfig?.humanHandoffEnabled !== false;
    const defaultKeywords = ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'];
    const keywords: string[] = agentConfig?.handoffKeywords || defaultKeywords;
    const lowerMsg = userMessage.toLowerCase();
    const isKeywordTriggered = handoffEnabled && keywords.some(k => lowerMsg.includes(k.toLowerCase().trim()));

    // Fetch conversation history
    const allChats = await getChatMessagesByTenant(tenant.id, 20);
    const history = allChats
      .filter((c: any) => (c.remoteJid || c.remote_jid) === remoteJid)
      .map((c: any) => ({
        role: (c.fromMe || c.from_me) ? 'assistant' : 'user',
        content: c.messageText || c.message_text || c.aiResponse || c.ai_response || ''
      }));

    console.log(`[Webhook] Processing with AI for tenant '${tenant.name}'...`);
    const aiResult = await processWhatsAppMessageWithAI(
      tenant.id,
      userMessage,
      cleanPhone,
      pushName,
      history
    );

    const targetInstance = tenant.evolutionInstance || instanceName || `tenant_${tenant.id.slice(0, 8)}`;

    // Handle Human Handoff (either keyword or AI COMMAND_HANDOFF)
    if (handoffEnabled && (isKeywordTriggered || aiResult.isHandoffRequested)) {
      console.log(`[Webhook] Human Handoff triggered for ${remoteJid}!`);
      await setChatHumanMode(tenant.id, remoteJid, true);

      const customerHandoffReply = `👤 *Atención Personalizada:* Entendido *${pushName}*, te estamos comunicando con un asesor humano para atenderte directamente. En breve te responderá.`;
      await sendMessage(targetInstance, cleanPhone, customerHandoffReply);

      await saveChatMessage(tenant.id, {
        id: `ai_${Date.now()}`,
        remoteJid,
        pushName: 'Asistente IA',
        fromMe: true,
        messageText: customerHandoffReply,
        aiResponse: customerHandoffReply,
        status: 'sent'
      });

      // Send alert notification to admin
      const adminPhone = (agentConfig?.handoffNotifyPhone || tenant.whatsappNumber || '').replace(/\D/g, '');
      if (adminPhone) {
        const reason = aiResult.handoffReason || (isKeywordTriggered ? `El cliente escribió: "${userMessage}"` : 'El cliente solicita hablar con un asesor humano.');
        const alertMsg = `🚨 *¡ATENCIÓN HUMANA REQUERIDA!*

👤 *Cliente:* ${pushName} (${cleanPhone})
📝 *Resumen / Motivo:* ${reason}

👉 _La IA ha sido pausada automáticamente para este chat. Puedes responderle directamente desde WhatsApp o desde tu Panel de Betico._`;

        try {
          await sendMessage(targetInstance, adminPhone, alertMsg);
        } catch (e) {
          console.error('Error sending handoff alert to admin:', e);
        }
      }
      return;
    }

    if (!aiResult || !aiResult.replyText) {
      console.warn('[Webhook] No AI reply generated');
      return;
    }

    console.log(`[Webhook] AI generated reply: "${aiResult.replyText.slice(0, 100)}..."`);

    // Send reply back via Evolution API
    const sendRes = await sendMessage(targetInstance, cleanPhone, aiResult.replyText);
    console.log(`[Webhook] SendMessage status: success=${sendRes.success}`);

    // Save AI reply to database
    await saveChatMessage(tenant.id, {
      id: `ai_${Date.now()}`,
      remoteJid,
      pushName: 'Asistente IA',
      fromMe: true,
      messageText: aiResult.replyText,
      aiResponse: aiResult.replyText,
      status: sendRes.success ? 'sent' : 'failed'
    });

    // Handle detected booking command
    if (aiResult.isBookingDetected && aiResult.bookingData) {
      try {
        await createBookingFromCommand(tenant.id, {
          ...aiResult.bookingData,
          customerPhone: aiResult.bookingData.customerPhone || cleanPhone,
          customerName: aiResult.bookingData.customerName || pushName
        });
        await query(`
          INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
          VALUES ($1, $2, $3, $4, 'booking_created', 'sent')
        `, [
          `notif_${Date.now()}`,
          tenant.id,
          cleanPhone,
          `Nueva cita agendada por IA para ${pushName}`
        ]);
      } catch (err) {
        console.error('[Webhook] Failed to process booking command:', err);
      }
    }

    // Handle detected order command
    if (aiResult.isOrderDetected && aiResult.orderData) {
      try {
        await createOrderFromWhatsApp(tenant.id, {
          ...aiResult.orderData,
          customerPhone: aiResult.orderData.customerPhone || cleanPhone,
          customerName: aiResult.orderData.customerName || pushName
        });
        await query(`
          INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
          VALUES ($1, $2, $3, $4, 'order_created', 'sent')
        `, [
          `notif_${Date.now()}`,
          tenant.id,
          cleanPhone,
          `Nuevo pedido registrado por IA para ${pushName}`
        ]);
      } catch (err) {
        console.error('[Webhook] Failed to process order command:', err);
      }
    }
  } catch (error) {
    console.error('[Webhook] Error processing incoming WhatsApp webhook:', error);
  }
});

export default router;
