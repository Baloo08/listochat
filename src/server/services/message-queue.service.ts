import { Server as SocketServer } from 'socket.io';
import { takeNextPending, markDone, markFailed } from '../db/message-queue.repo.js';
import { processWhatsAppMessageWithAI } from './agent.js';
import { getChatMessagesByTenant, getChatSession, setChatHumanMode, saveChatMessage } from '../db/chats.repo.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { createBookingFromCommand, cancelBookingFromWhatsApp, rescheduleBookingFromWhatsApp } from './booking.service.js';
import { createOrderFromWhatsApp } from './order.service.js';
import { sendMessage, sendMedia } from './evolution.js';
import { query } from '../db/pool.js';

let io: SocketServer | null = null;
let isProcessing = false;

export function startQueueWorker(socketIo: SocketServer) {
  io = socketIo;
  console.log('[Queue] Worker started. Polling every 2 seconds...');
  setInterval(processNextInQueue, 2000);
}

async function processNextInQueue() {
  if (isProcessing) return; // Only process one at a time on CPU
  isProcessing = true;
  try {
    const msg = await takeNextPending();
    if (!msg) { isProcessing = false; return; }
    
    console.log(`[Queue] Processing message from ${msg.pushName} (${msg.cleanPhone}): "${msg.userMessage.slice(0, 50)}..."`);
    
    // Check if in human mode
    const session = await getChatSession(msg.tenantId, msg.remoteJid);
    if (session?.isHumanMode) {
      console.log(`[Queue] Chat ${msg.remoteJid} is in HUMAN MODE. Skipping.`);
      await markDone(msg.id, 'HUMAN_MODE_SKIP');
      isProcessing = false;
      return;
    }
    
    // Check if AI is enabled
    const agentConfig: any = await getAgentConfig(msg.tenantId);
    if (agentConfig?.aiChatbotEnabled === false) {
      await markDone(msg.id, 'AI_DISABLED');
      isProcessing = false;
      return;
    }
    
    // Fetch history
    const allChats = await getChatMessagesByTenant(msg.tenantId, 20);
    const history = allChats
      .filter((c: any) => (c.remoteJid || c.remote_jid) === msg.remoteJid)
      .map((c: any) => ({
        role: (c.fromMe || c.from_me) ? 'assistant' as const : 'user' as const,
        content: c.messageText || c.message_text || c.aiResponse || c.ai_response || ''
      }));
    
    // Process with AI
    const aiResult = await processWhatsAppMessageWithAI(
      msg.tenantId,
      msg.userMessage,
      msg.cleanPhone,
      msg.pushName,
      history
    );
    
    // Handle human handoff
    const handoffEnabled = agentConfig?.humanHandoffEnabled !== false;
    const defaultKeywords = ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'];
    const keywords: string[] = agentConfig?.handoffKeywords || defaultKeywords;
    const isKeywordTriggered = handoffEnabled && keywords.some((k: string) => msg.userMessage.toLowerCase().includes(k.toLowerCase().trim()));
    
    if (handoffEnabled && (isKeywordTriggered || aiResult.isHandoffRequested)) {
      await setChatHumanMode(msg.tenantId, msg.remoteJid, true);
      const customerHandoffReply = `👤 *Atención Personalizada:* Entendido *${msg.pushName}*, te estamos comunicando con un asesor humano para atenderte directamente. En breve te responderá.`;
      await sendMessage(msg.instanceName, msg.cleanPhone, customerHandoffReply);
      await saveChatMessage(msg.tenantId, { id: `ai_${Date.now()}`, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: customerHandoffReply, aiResponse: customerHandoffReply, status: 'sent' });
      await markDone(msg.id, customerHandoffReply);
      
      // Emit via WebSocket
      if (io) io.to(`tenant_${msg.tenantId}`).emit('chat:message', { id: `ai_${Date.now()}`, tenantId: msg.tenantId, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: customerHandoffReply, createdAt: new Date().toISOString() });
      isProcessing = false;
      return;
    }
    
    if (!aiResult || !aiResult.replyText) {
      await markFailed(msg.id, 'No AI reply generated');
      isProcessing = false;
      return;
    }
    
    // Send reply
    let sendRes;
    if (aiResult.isMediaDetected && aiResult.mediaData?.mediaUrl) {
      sendRes = await sendMedia(msg.instanceName, msg.cleanPhone, aiResult.mediaData.mediaUrl, aiResult.replyText || aiResult.mediaData.caption || '');
    } else {
      sendRes = await sendMessage(msg.instanceName, msg.cleanPhone, aiResult.replyText);
    }
    
    // Save AI reply
    const aiMsgId = `ai_${Date.now()}`;
    await saveChatMessage(msg.tenantId, { id: aiMsgId, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: aiResult.replyText, aiResponse: aiResult.replyText, status: sendRes.success ? 'sent' : 'failed' });
    
    // Emit via WebSocket
    if (io) {
      io.to(`tenant_${msg.tenantId}`).emit('chat:message', { id: aiMsgId, tenantId: msg.tenantId, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: aiResult.replyText, createdAt: new Date().toISOString() });
    }
    
    // Handle booking command
    if (aiResult.isBookingDetected && aiResult.bookingData) {
      try {
        await createBookingFromCommand(msg.tenantId, { ...aiResult.bookingData, customerPhone: aiResult.bookingData.customerPhone || msg.cleanPhone, customerName: aiResult.bookingData.customerName || msg.pushName });
      } catch (err) { console.error('[Queue] Failed to process booking:', err); }
    }
    
    // Handle order command
    if (aiResult.isOrderDetected && aiResult.orderData) {
      try {
        await createOrderFromWhatsApp(msg.tenantId, { ...aiResult.orderData, customerPhone: aiResult.orderData.customerPhone || msg.cleanPhone, customerName: aiResult.orderData.customerName || msg.pushName });
      } catch (err) { console.error('[Queue] Failed to process order:', err); }
    }

    // Handle cancel booking command
    if (aiResult.isCancelBookingDetected) {
      try {
        const cancelled = await cancelBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.cancelBookingData);
        if (cancelled && io) {
          io.to(`tenant_${msg.tenantId}`).emit('appointment:updated', cancelled);
        }
      } catch (err) { console.error('[Queue] Failed to process cancel booking:', err); }
    }

    // Handle reschedule booking command
    if (aiResult.isRescheduleBookingDetected && aiResult.rescheduleBookingData) {
      try {
        const rescheduled = await rescheduleBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.rescheduleBookingData);
        if (rescheduled && io) {
          io.to(`tenant_${msg.tenantId}`).emit('appointment:updated', rescheduled);
        }
      } catch (err) { console.error('[Queue] Failed to process reschedule booking:', err); }
    }
    
    await markDone(msg.id, aiResult.replyText);
    console.log(`[Queue] ✅ Processed message for ${msg.pushName} in queue`);
    
  } catch (error: any) {
    console.error('[Queue] Error processing message:', error);
    // Don't leave messages stuck in processing
  } finally {
    isProcessing = false;
  }
}
