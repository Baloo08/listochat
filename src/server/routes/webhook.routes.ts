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
  res.status(200).send('OK');

  try {
    const payload = req.body || {};
    const instanceName = payload.instance || payload.instanceName || req.query.instance;
    const data = payload.data || payload;

    if (payload.event && payload.event !== 'messages.upsert' && payload.event !== 'messages-upsert' && payload.event !== 'send.message') {
      return;
    }

    const key = data.key || {};
    const fromMe = key.fromMe || data.fromMe || false;
    const remoteJid = key.remoteJid || data.remoteJid || data.sender;

    if (!remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {
      return;
    }

    const pushName = data.pushName || data.name || 'Cliente';
    const messageObj = data.message || {};
    const userMessage = (
      messageObj.conversation ||
      messageObj.extendedTextMessage?.text ||
      messageObj.imageMessage?.caption ||
      data.message?.text ||
      data.text ||
      ''
    ).trim();

    if (!userMessage) {
      return;
    }

    let tenant = null;
    if (instanceName) {
      tenant = await getTenantByEvolutionInstance(instanceName);
    }
    if (!tenant) {
      const all = await getAllTenants();
      tenant = all[0] || null;
    }

    if (!tenant || !tenant.active) {
      console.warn(`[Webhook] No active tenant found for instance: ${instanceName}`);
      return;
    }

    const msgId = key.id || `msg_${Date.now()}`;

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

    await saveChatMessage({
      id: msgId,
      tenantId: tenant.id,
      remoteJid,
      pushName,
      fromMe: false,
      messageText: userMessage,
      status: 'received'
    });

    const allChats = await getChatMessagesByTenant(tenant.id, 20);
    const history = allChats
      .filter((c: any) => (c.remoteJid || c.remote_jid) === remoteJid)
      .map((c: any) => ({
        role: (c.fromMe || c.from_me) ? 'assistant' : 'user',
        content: c.messageText || c.message_text || c.aiResponse || c.ai_response || ''
      }));

    const cleanPhone = remoteJid.replace(/@.+$/, '').replace(/\D/g, '');
    const aiResult = await processWhatsAppMessageWithAI(
      tenant.id,
      userMessage,
      cleanPhone,
      pushName,
      history
    );

    if (!aiResult || !aiResult.replyText) {
      return;
    }

    const targetInstance = tenant.evolutionInstance || instanceName || `tenant_${tenant.id.slice(0, 8)}`;
    await sendMessage(targetInstance, remoteJid, aiResult.replyText);

    await saveChatMessage({
      id: `ai_${Date.now()}`,
      tenantId: tenant.id,
      remoteJid,
      pushName: 'Asistente IA',
      fromMe: true,
      messageText: aiResult.replyText,
      aiResponse: aiResult.replyText,
      status: 'sent'
    });

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

export default router;
