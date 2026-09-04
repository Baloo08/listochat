import { Router } from 'express';
import { env } from '../config/env.js';
import { getTenantByEvolutionInstance, getAllTenants } from '../db/tenant.repo.js';
import { sendMessage, sendMedia, getBase64FromMediaMessage } from '../services/evolution.js';
import { saveChatMessage, getChatMessagesByTenant, getChatSession, setChatHumanMode } from '../db/chats.repo.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { query } from '../db/pool.js';
import { transcribeAudio } from '../services/audio-transcriber.service.js';
import { enqueueMessage } from '../db/message-queue.repo.js';

const router = Router();

router.post('/', async (req, res) => {
  // Validate authentication if provided or configured (OWASP ASVS V13.1)
  const incomingApiKey = (req.headers['apikey'] || req.headers['x-api-key'] || req.query['apikey'] || req.query['token']) as string;
  const expectedKey = env.EVOLUTION_API_KEY;
  if (expectedKey && incomingApiKey && incomingApiKey !== expectedKey) {
    console.warn(`[Security Alert] Rechazado webhook de WhatsApp con apikey no autorizada desde IP ${req.ip}`);
    res.status(401).json({ error: 'Unauthorized webhook' });
    return;
  }

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
    const cleanPhone = remoteJid.replace(/@.+$/, '').replace(/\D/g, '');

    // Ignore group chats or broadcast status updates
    if (remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') {
      return;
    }

    // 1. Check for Voice Notes / Audio Messages
    const isAudioMsg = data?.message?.audioMessage || data?.message?.pttMessage || data?.messageType === 'audioMessage';
    let isVoiceNote = false;

    // 2. Extract text or location
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

    // Check if incoming message belongs to a Superadmin Bot (Ventas o Soporte)
    if ((instanceName === 'betico_ventas' || instanceName === 'betico_soporte') && !fromMe) {
      const { processSuperadminWhatsAppMessage } = await import('../services/superadmin-bot.service.js');
      await processSuperadminWhatsAppMessage({
        instanceName,
        remoteJid,
        pushName,
        userMessage
      });
      return;
    }

    // Resolve tenant early
    let tenant = null;
    if (instanceName) {
      tenant = await getTenantByEvolutionInstance(instanceName);
    }

    if (!tenant || !tenant.active) {
      console.warn(`[Webhook] No active tenant found for instance: ${instanceName}`);
      return;
    }

    const targetInstance = tenant.evolutionInstance || instanceName || `tenant_${tenant.id.slice(0, 8)}`;

    // Process Voice Notes with Gemini Multimodal
    if (isAudioMsg && !fromMe) {
      console.log(`[Webhook] Detected Voice Note / Audio from ${remoteJid}! Fetching media base64...`);
      let base64Audio = data?.base64 || data?.message?.base64;
      const audioMime = data?.message?.audioMessage?.mimetype || 'audio/ogg';

      if (!base64Audio) {
        const mediaRes = await getBase64FromMediaMessage(targetInstance, key, data.message);
        if (mediaRes.base64) {
          base64Audio = mediaRes.base64;
        }
      }

      if (base64Audio) {
        const transcription = await transcribeAudio(base64Audio, audioMime);
        if (transcription.success && transcription.text) {
          userMessage = transcription.text;
          isVoiceNote = true;
          console.log(`[Webhook] Voice note transcribed successfully: "${userMessage}"`);
        }
      }
    }

    // 3. Process Image Messages — Manual Verification (no AI processing)
    const isImageMsg = data?.message?.imageMessage || data?.messageType === 'imageMessage';
    if (isImageMsg && !fromMe) {
      console.log(`[Webhook] Detected Image from ${remoteJid}!`);

      // Check if there's a pending order for this customer
      const phonePattern = cleanPhone && cleanPhone.length >= 8 ? `%${cleanPhone.slice(-8)}%` : null;
      const pendingOrderRes = await query(`
        SELECT id, order_number as "orderNumber", total, customer_name as "customerName", status, payment_status as "paymentStatus"
        FROM orders
        WHERE tenant_id = $1 
          AND (whatsapp_jid = $2 OR ($3::text IS NOT NULL AND customer_phone LIKE $3))
          AND payment_status IN ('pending', 'proof_sent')
        ORDER BY created_at DESC
        LIMIT 1
      `, [tenant.id, remoteJid, phonePattern]);

      if (pendingOrderRes.rows.length > 0) {
        const pendingOrder = pendingOrderRes.rows[0];
        console.log(`[Webhook] Found pending order #${pendingOrder.orderNumber} for ${cleanPhone}. Marking proof_sent for manual verification.`);

        // Mark order as proof_sent (admin verifies manually from the chat card)
        await query(`
          UPDATE orders 
          SET payment_status = 'proof_sent', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND tenant_id = $2
        `, [pendingOrder.id, tenant.id]);

        // Emit WebSocket event so admin panel updates in real time
        if ((req as any).io) {
          (req as any).io.to(`tenant_${tenant.id}`).emit('order:updated', {
            id: pendingOrder.id,
            orderNumber: pendingOrder.orderNumber,
            status: pendingOrder.status,
            paymentStatus: 'proof_sent'
          });
        }

        // Reply to customer
        const receiptReply = `📩 *Comprobante Recibido*\n\nHemos recibido tu comprobante para el pedido *#${pendingOrder.orderNumber}* (₡${Number(pendingOrder.total).toLocaleString('es-CR')}). Nuestro equipo lo verificará y confirmaremos tu pedido en breve. ¡Gracias! ✅`;
        await sendMessage(targetInstance, cleanPhone, receiptReply);

        await saveChatMessage(tenant.id, {
          id: `sinpe_${Date.now()}`,
          remoteJid,
          pushName: 'Sistema Pagos',
          fromMe: true,
          messageText: receiptReply,
          aiResponse: receiptReply,
          status: 'sent'
        });

        return;
      }

      if (!userMessage) {
        userMessage = data?.message?.imageMessage?.caption || 'Foto enviada por el cliente';
      }
    }

    console.log(`[Webhook] Parsed message from ${remoteJid} (${pushName}): "${userMessage}" [fromMe=${fromMe}]`);

    if (!userMessage) {
      return;
    }

    const msgId = key.id || `msg_${Date.now()}`;

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

    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('chat:message', {
        id: msgId,
        tenantId: tenant.id,
        remoteJid,
        pushName,
        fromMe: false,
        messageText: userMessage,
        createdAt: new Date().toISOString()
      });
    }

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

    // Check if AI Chatbot is enabled or if tenant is in Notifications-Only mode
    if (agentConfig?.aiChatbotEnabled === false) {
      console.log(`[Webhook] AI Chatbot is DISABLED for tenant '${tenant.name}'. Operating in Notifications-Only mode.`);
      return;
    }

    // Handle immediate Human Handoff keywords (before enqueueing)
    if (handoffEnabled && isKeywordTriggered) {
      console.log(`[Webhook] Human Handoff keyword triggered for ${remoteJid}!`);
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
        const alertMsg = `🚨 *¡ATENCIÓN HUMANA REQUERIDA!*\n\n👤 *Cliente:* ${pushName} (${cleanPhone})\n📝 *Motivo:* El cliente escribió: "${userMessage}"\n\n👉 _La IA ha sido pausada. Responde desde WhatsApp o tu Panel de Betico._`;
        try { await sendMessage(targetInstance, adminPhone, alertMsg); } catch (e) {}
      }
      return;
    }

    // ENQUEUE for async AI processing (worker handles everything)
    console.log(`[Webhook] Enqueueing message for AI processing: tenant='${tenant.name}', from=${pushName}`);
    await enqueueMessage(tenant.id, remoteJid, pushName, cleanPhone, userMessage, targetInstance, isVoiceNote);

    // Emit queue event for admin panel
    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('queue:updated', { tenantId: tenant.id });
    }

  } catch (error) {
    console.error('[Webhook] Error processing incoming WhatsApp webhook:', error);
  }
});

export default router;
