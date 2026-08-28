import { Router } from 'express';
import { getTenantByEvolutionInstance, getAllTenants } from '../db/tenant.repo.js';
import { getChatMessagesByTenant, saveChatMessage } from '../db/chats.repo.js';
import { processWhatsAppMessageWithAI } from '../services/agent.js';
import { sendMessage } from '../services/evolution.js';
import { createBookingFromCommand } from '../services/booking.service.js';
import { createOrderFromWhatsApp } from '../services/order.service.js';
import { query } from '../db/pool.js';

const router = Router();

const handleWebhook = async (req: any, res: any) => {
  // Return immediate 200 OK to Evolution API
  res.status(200).send({ status: 'SUCCESS' });

  try {
    const payload = req.body || {};
    const eventName = (payload.event || '').toLowerCase().replace(/_/g, '.');
    const instanceName = payload.instance || payload.instanceName || req.query.instance;

    console.log(`[Webhook] Received event: '${payload.event}' for instance: '${instanceName}'`);

    // Filter non-message events
    if (eventName && !eventName.includes('message') && !eventName.includes('upsert')) {
      return;
    }

    const data = payload.data || payload;
    // Evolution API v2 sends messages inside data.messages array or directly in data
    const msgItem = (Array.isArray(data?.messages) ? data.messages[0] : data) || {};
    const key = msgItem.key || data?.key || {};

    const fromMe = key.fromMe === true || msgItem.fromMe === true || data?.fromMe === true;
    const remoteJid = key.remoteJid || msgItem.remoteJid || data?.remoteJid || data?.sender;

    // Ignore broadcast and group messages
    if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {
      return;
    }

    const pushName = msgItem.pushName || data?.pushName || data?.name || 'Cliente';
    const messageObj = msgItem.message || data?.message || {};

    const userMessage = (
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      messageObj.imageMessage?.caption ||
      messageObj.videoMessage?.caption ||
      data?.text ||
      data?.message?.text ||
      ''
    ).trim();

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

    // If message was sent from the business phone itself
    if (fromMe) {
      await saveChatMessage({
        id: msgId,
        tenantId: tenant.id,
        remoteJid,
        pushName: 'Asistente IA',
        fromMe: true,
        messageText: userMessage,
        status: 'sent'
      });
      return;
    }

    // Save incoming user message
    await saveChatMessage({
      id: msgId,
      tenantId: tenant.id,
      remoteJid,
      pushName,
      fromMe: false,
      messageText: userMessage,
      status: 'received'
    });

    // Fetch conversation history
    const allChats = await getChatMessagesByTenant(tenant.id, 20);
    const history = allChats
      .filter((c: any) => (c.remoteJid || c.remote_jid) === remoteJid)
      .map((c: any) => ({
        role: (c.fromMe || c.from_me) ? 'assistant' : 'user',
        content: c.messageText || c.message_text || c.aiResponse || c.ai_response || ''
      }));

    const cleanPhone = remoteJid.replace(/@.+$/, '').replace(/\D/g, '');

    console.log(`[Webhook] Processing with AI for tenant '${tenant.name}'...`);
    const aiResult = await processWhatsAppMessageWithAI(
      tenant.id,
      userMessage,
      cleanPhone,
      pushName,
      history
    );

    if (!aiResult || !aiResult.replyText) {
      console.warn('[Webhook] No AI reply generated');
      return;
    }

    console.log(`[Webhook] AI generated reply: "${aiResult.replyText.slice(0, 100)}..."`);

    // Send reply back via Evolution API
    const targetInstance = tenant.evolutionInstance || instanceName || `tenant_${tenant.id.slice(0, 8)}`;
    const sendRes = await sendMessage(targetInstance, cleanPhone, aiResult.replyText);
    console.log(`[Webhook] SendMessage status: success=${sendRes.success}`);

    // Save AI reply to database
    await saveChatMessage({
      id: `ai_${Date.now()}`,
      tenantId: tenant.id,
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
      } catch (bookErr) {
        console.error('[Webhook] Error creating booking from command:', bookErr);
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
          `Nueva orden registrada por IA para ${pushName}`
        ]);
      } catch (orderErr) {
        console.error('[Webhook] Error creating order from command:', orderErr);
      }
    }

  } catch (error) {
    console.error('[Webhook] Error processing incoming webhook:', error);
  }
};

router.post('/', handleWebhook);
router.post('/evolution', handleWebhook);
router.post('/messages-upsert', handleWebhook);
router.post('/messages_upsert', handleWebhook);

export default router;
