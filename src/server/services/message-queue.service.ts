import { Server as SocketServer } from 'socket.io';
import { takeNextPending, markDone, markFailed, consumePendingForChat, recoverStaleProcessingMessages } from '../db/message-queue.repo.js';
import { processWhatsAppMessageWithAI } from './agent.js';
import { getChatMessagesByTenant, getChatHistoryForContact, getChatSession, setChatHumanMode, setChatVoicePreference, setVoicePreferenceAsked, saveChatMessage } from '../db/chats.repo.js';
import { getAgentConfig } from '../db/agent-config.repo.js';
import { createBookingFromCommand, cancelBookingFromWhatsApp, rescheduleBookingFromWhatsApp } from './booking.service.js';
import { createOrderFromWhatsApp } from './order.service.js';
import { sendMessage, sendMedia } from './evolution.js';
import { getTenantById } from '../db/tenant.repo.js';
import { createBooking as createCourtBooking, getCourtsByTenant, rescheduleCourtBooking } from '../db/courts.repo.js';
import { logAICommand } from '../db/ai-command-logs.repo.js';
import { query } from '../db/pool.js';

let io: SocketServer | null = null;
const activeChats = new Set<string>();
const MAX_CONCURRENT = 5;
let isPolling = false;

export function startQueueWorker(socketIo: SocketServer) {
  io = socketIo;
  console.log('[Queue] Worker started. Multi-tenant concurrent worker active (up to 5 parallel)...');
  
  // Auto-recover stale orphaned messages on startup (ISO 25010 Confiabilidad)
  recoverStaleProcessingMessages(5)
    .then(count => {
      if (count > 0) console.log(`[Queue] Auto-recuperados ${count} mensajes huérfanos atascados en processing`);
    })
    .catch(err => console.error('[Queue] Error al recuperar mensajes atascados:', err));

  // Run cleanup maintenance every 2 minutes
  setInterval(() => {
    recoverStaleProcessingMessages(5)
      .then(count => {
        if (count > 0) console.log(`[Queue Maintenance] Auto-recuperados ${count} mensajes huérfanos`);
      })
      .catch(err => console.error('[Queue Maintenance] Error:', err));
  }, 2 * 60 * 1000);

  setInterval(tickQueue, 1500);
}

async function tickQueue() {
  if (isPolling) return;
  isPolling = true;
  try {
    while (activeChats.size < MAX_CONCURRENT) {
      const excludeKeys = Array.from(activeChats);
      const msg = await takeNextPending(excludeKeys);
      if (!msg) break;

      const chatKey = `${msg.tenantId}:${msg.remoteJid}`;
      activeChats.add(chatKey);

      // Process message in the background without blocking other tenants
      processSingleMessage(msg)
        .catch(err => console.error('[Queue] Uncaught error in processSingleMessage:', err))
        .finally(() => {
          activeChats.delete(chatKey);
        });
    }
  } finally {
    isPolling = false;
  }
}

async function processSingleMessage(msg: any) {
  try {
    console.log(`[Queue] Processing message from ${msg.pushName} (${msg.cleanPhone}): "${msg.userMessage.slice(0, 50)}..."`);
    
    // Check if in human mode
    const session = await getChatSession(msg.tenantId, msg.remoteJid);
    if (session?.isHumanMode) {
      console.log(`[Queue] Chat ${msg.remoteJid} is in HUMAN MODE. Skipping.`);
      await markDone(msg.id, 'HUMAN_MODE_SKIP');
      return;
    }
    
    // Check if AI is enabled
    const agentConfig: any = await getAgentConfig(msg.tenantId);
    if (agentConfig?.aiChatbotEnabled === false) {
      await markDone(msg.id, 'AI_DISABLED');
      return;
    }
    
    // Absorb any additional burst messages queued for this chat before running AI
    const additionalMessages = await consumePendingForChat(msg.tenantId, msg.remoteJid, msg.id);
    let fullUserMessage = msg.userMessage;
    if (additionalMessages.length > 0) {
      fullUserMessage += '\n' + additionalMessages.join('\n');
      console.log(`[Queue] Debounced ${additionalMessages.length} burst messages for ${msg.pushName}`);
    }

    // Fetch contact-specific history with 2-hour session awareness (ISO 25010 Confiabilidad & Usabilidad)
    const { messages: history, isWithin2Hours, lastInteractionMinutesAgo } = await getChatHistoryForContact(msg.tenantId, msg.remoteJid, 20);
    
    // Process with AI
    const aiResult = await processWhatsAppMessageWithAI(
      msg.tenantId,
      fullUserMessage,
      msg.cleanPhone,
      msg.pushName,
      history,
      { isWithin2Hours, lastInteractionMinutesAgo }
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

      // Notify admin phone via WhatsApp
      const tenant = await getTenantById(msg.tenantId);
      const adminPhone = (agentConfig?.handoffNotifyPhone || tenant?.whatsappNumber || '').replace(/\D/g, '');
      if (adminPhone) {
        const reason = aiResult.handoffReason || (isKeywordTriggered ? `Palabra clave: "${msg.userMessage}"` : 'Solicitado por el cliente o la IA');
        const alertMsg = `🚨 *¡ATENCIÓN HUMANA REQUERIDA!*\n\n👤 *Cliente:* ${msg.pushName} (+${msg.cleanPhone})\n📝 *Motivo:* ${reason}\n\n👉 _La IA ha sido pausada en este chat. Responde desde WhatsApp o tu Panel de Betico._`;
        try {
          await sendMessage(msg.instanceName, adminPhone, alertMsg);
        } catch (adminErr) {
          console.error('[Queue] Error notifying admin of handoff:', adminErr);
        }
      }
      return;
    }
    
    if (!aiResult || !aiResult.replyText) {
      await markFailed(msg.id, 'No AI reply generated');
      return;
    }
    
    let finalReplyText = aiResult.replyText;

    // 1. Handle booking command prior to dispatching WhatsApp message
    if (aiResult.isBookingDetected && aiResult.bookingData) {
      try {
        const bResult = await createBookingFromCommand(msg.tenantId, { ...aiResult.bookingData, customerPhone: aiResult.bookingData.customerPhone || msg.cleanPhone, customerName: aiResult.bookingData.customerName || msg.pushName });
        await logAICommand(msg.tenantId, msg.remoteJid, 'booking', aiResult.bookingData, 'success');
        if (bResult && io) {
          io.to(`tenant_${msg.tenantId}`).emit('appointment:created', bResult);
        }
      } catch (err: any) {
        console.error('[Queue] Failed to process booking:', err);
        await logAICommand(msg.tenantId, msg.remoteJid, 'booking', aiResult.bookingData, 'failed', err?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, tuvimos un inconveniente al agendar tu cita porque el horario solicitado ya no está disponible o hubo un error en el sistema. ¿Te gustaría consultar otro horario?`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
            remoteJid: msg.remoteJid,
            commandType: 'booking',
            clientName: msg.pushName,
            errorMessage: err?.message || 'Error al agendar cita'
          });
        }
      }
    }

    // 2. Handle court booking command prior to dispatching WhatsApp message
    if (aiResult.isCourtBookingDetected && aiResult.courtBookingData) {
      try {
        const cData = aiResult.courtBookingData;
        const allCourts = await getCourtsByTenant(msg.tenantId);
        const matchedCourt = allCourts.find((c: any) => 
          c.name.toLowerCase().includes((cData.courtName || '').toLowerCase()) ||
          (cData.courtName || '').toLowerCase().includes(c.name.toLowerCase())
        ) || allCourts[0];

        if (matchedCourt) {
          const rawTime = cData.time || '19:00';
          const cleanTime = rawTime.includes(':') ? rawTime.split(':').slice(0, 2).join(':') + ':00' : '19:00:00';
          const newCourtBooking = await createCourtBooking(msg.tenantId, {
            courtId: matchedCourt.id,
            date: cData.date || new Date().toISOString().split('T')[0],
            time: cleanTime,
            durationMinutes: cData.durationMinutes || matchedCourt.durationMinutes || 60,
            bookingMode: cData.bookingMode === 'seek_match' ? 'seek_match' : 'full',
            teamAName: cData.teamAName || msg.pushName || 'Cliente WhatsApp',
            teamACaptain: msg.pushName || 'Cliente WhatsApp',
            teamAPhone: msg.cleanPhone,
            sportType: matchedCourt.sportType,
            totalPrice: matchedCourt.basePrice,
            status: 'confirmed'
          });
          console.log(`[Queue] Court booking created for ${msg.pushName} on ${matchedCourt.name} (${newCourtBooking.date} ${newCourtBooking.time})`);
          await logAICommand(msg.tenantId, msg.remoteJid, 'court_booking', cData, 'success');
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit('courtBooking:created', newCourtBooking);
          }
        }
      } catch (courtErr: any) {
        console.error('[Queue] Failed to process court booking:', courtErr);
        await logAICommand(msg.tenantId, msg.remoteJid, 'court_booking', aiResult.courtBookingData, 'failed', courtErr?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, no pudimos apartar la cancha para ese horario porque ya se encuentra ocupada o hubo un inconveniente. ¿Te gustaría consultar otro horario?`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
            remoteJid: msg.remoteJid,
            commandType: 'court_booking',
            clientName: msg.pushName,
            errorMessage: courtErr?.message || 'Error al reservar cancha'
          });
        }
      }
    }

    // 2.5 Handle court reschedule command prior to dispatching WhatsApp message
    if (aiResult.isRescheduleCourtDetected && aiResult.rescheduleCourtData) {
      try {
        const rcData = aiResult.rescheduleCourtData;
        const bookingCode = rcData.bookingCode || rcData.code;

        let targetCourtId: string | undefined;
        if (rcData.newCourtName) {
          const allCourts = await getCourtsByTenant(msg.tenantId);
          const matchedCourt = allCourts.find((c: any) => 
            c.name.toLowerCase().includes((rcData.newCourtName || '').toLowerCase()) ||
            (rcData.newCourtName || '').toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchedCourt) targetCourtId = matchedCourt.id;
        }

        const rawTime = rcData.newTime || '19:00';
        const cleanTime = rawTime.includes(':') ? rawTime.split(':').slice(0, 2).join(':') + ':00' : '19:00:00';

        const updatedCourtBooking = await rescheduleCourtBooking(bookingCode, msg.tenantId, {
          newCourtId: targetCourtId,
          newDate: rcData.newDate,
          newTime: cleanTime,
          changedBy: `WhatsApp (${msg.pushName})`
        });

        if (updatedCourtBooking) {
          console.log(`[Queue] Court booking ${updatedCourtBooking.bookingCode} rescheduled via WhatsApp for ${msg.pushName}`);
          await logAICommand(msg.tenantId, msg.remoteJid, 'reschedule_court', rcData, 'success');
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit('courtBooking:updated', updatedCourtBooking);
          }
        }
      } catch (courtErr: any) {
        console.error('[Queue] Failed to process court reschedule:', courtErr);
        await logAICommand(msg.tenantId, msg.remoteJid, 'reschedule_court', aiResult.rescheduleCourtData, 'failed', courtErr?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, no pudimos reagendar tu partido: ${courtErr?.message || 'el horario no está disponible o no se encontró la reserva'}. ¿Deseas verificar tu código o consultar otro horario?`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
            remoteJid: msg.remoteJid,
            commandType: 'reschedule_court',
            clientName: msg.pushName,
            errorMessage: courtErr?.message || 'Error al reagendar cancha'
          });
        }
      }
    }
    
    // 3. Handle order command prior to dispatching WhatsApp message
    if (aiResult.isOrderDetected && aiResult.orderData) {
      try {
        const orderResult = await createOrderFromWhatsApp(msg.tenantId, { ...aiResult.orderData, customerPhone: aiResult.orderData.customerPhone || msg.cleanPhone, customerName: aiResult.orderData.customerName || msg.pushName });
        await logAICommand(msg.tenantId, msg.remoteJid, 'order', aiResult.orderData, 'success');
        if (orderResult && io) {
          io.to(`tenant_${msg.tenantId}`).emit('order:created', orderResult);
        }
      } catch (err: any) {
        console.error('[Queue] Failed to process order:', err);
        await logAICommand(msg.tenantId, msg.remoteJid, 'order', aiResult.orderData, 'failed', err?.message);
        finalReplyText = `Disculpa *${msg.pushName}*, tuvimos un inconveniente técnico al registrar tu orden en el sistema. Un asesor de nuestro equipo se comunicará contigo de inmediato para atender tu pedido.`;
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
            remoteJid: msg.remoteJid,
            commandType: 'order',
            clientName: msg.pushName,
            errorMessage: err?.message || 'Error al procesar orden'
          });
        }
      }
    }

    // 3.5 Log Loyalty Commands
    if (aiResult.isLoyaltyRegisterDetected) {
      await logAICommand(msg.tenantId, msg.remoteJid, 'loyalty_register', aiResult.loyaltyRegisterData, 'success');
      if (io && aiResult.loyaltyResult?.card) {
        io.to(`tenant_${msg.tenantId}`).emit('loyaltyCard:created', aiResult.loyaltyResult.card);
      }
    } else if (aiResult.isLoyaltyRedeemStampsDetected) {
      await logAICommand(msg.tenantId, msg.remoteJid, 'loyalty_redeem_stamps', aiResult.loyaltyRedeemStampsData, 'success');
      if (io && aiResult.loyaltyResult?.voucher) {
        io.to(`tenant_${msg.tenantId}`).emit('loyaltyVoucher:created', aiResult.loyaltyResult.voucher);
      }
    } else if (aiResult.isLoyaltyRedeemPointsDetected) {
      await logAICommand(msg.tenantId, msg.remoteJid, 'loyalty_redeem_points', aiResult.loyaltyRedeemPointsData, 'success');
    } else if (aiResult.isLoyaltyCheckDetected) {
      await logAICommand(msg.tenantId, msg.remoteJid, 'loyalty_check', aiResult.loyaltyCheckData, 'success');
    }

    // 4. Send reply guaranteed to match database state
    let sendRes;

    if (aiResult.isMediaDetected && aiResult.mediaData?.mediaUrl) {
      const captionText = (finalReplyText || aiResult.mediaData.caption || '').slice(0, 1000);
      sendRes = await sendMedia(
        msg.instanceName,
        msg.cleanPhone,
        aiResult.mediaData.mediaUrl,
        captionText,
        aiResult.mediaData.mediaType,
        aiResult.mediaData.fileName
      );
      // Fallback: If sending media failed (e.g. invalid external image URL or WhatsApp timeout), ensure client receives reply via text!
      if (!sendRes?.success && finalReplyText) {
        console.warn(`[Queue] sendMedia failed for ${msg.pushName} (+${msg.cleanPhone}), falling back to text:`, sendRes?.error);
        sendRes = await sendMessage(msg.instanceName, msg.cleanPhone, finalReplyText);
      }
    } else {
      // Outbound replies dispatched directly as fast, structured WhatsApp text (~1.5s latency, zero TTS CPU overhead)
      sendRes = await sendMessage(msg.instanceName, msg.cleanPhone, finalReplyText);
    }
    
    // Save AI reply
    const aiMsgId = `ai_${Date.now()}`;
    await saveChatMessage(msg.tenantId, { id: aiMsgId, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: finalReplyText, aiResponse: finalReplyText, status: sendRes.success ? 'sent' : 'failed' });
    
    // Emit via WebSocket
    if (io) {
      io.to(`tenant_${msg.tenantId}`).emit('chat:message', { id: aiMsgId, tenantId: msg.tenantId, remoteJid: msg.remoteJid, pushName: 'Asistente IA', fromMe: true, messageText: finalReplyText, createdAt: new Date().toISOString() });
    }

    // Handle cancel booking command
    if (aiResult.isCancelBookingDetected) {
      try {
        const cancelled = await cancelBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.cancelBookingData);
        if (cancelled) {
          await logAICommand(msg.tenantId, msg.remoteJid, 'cancel_booking', aiResult.cancelBookingData, 'success');
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit('appointment:updated', cancelled);
          }
        } else {
          await logAICommand(msg.tenantId, msg.remoteJid, 'cancel_booking', aiResult.cancelBookingData, 'failed', 'No se encontró cita activa para cancelar');
        }
      } catch (err: any) {
        console.error('[Queue] Failed to process cancel booking:', err);
        await logAICommand(msg.tenantId, msg.remoteJid, 'cancel_booking', aiResult.cancelBookingData, 'failed', err?.message);
      }
    }

    // Handle reschedule booking command
    if (aiResult.isRescheduleBookingDetected && aiResult.rescheduleBookingData) {
      try {
        const rescheduled = await rescheduleBookingFromWhatsApp(msg.tenantId, msg.cleanPhone, aiResult.rescheduleBookingData);
        if (rescheduled) {
          await logAICommand(msg.tenantId, msg.remoteJid, 'reschedule_booking', aiResult.rescheduleBookingData, 'success');
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit('appointment:updated', rescheduled);
          }
        } else {
          await logAICommand(msg.tenantId, msg.remoteJid, 'reschedule_booking', aiResult.rescheduleBookingData, 'failed', 'Horario ocupado o no se encontró cita');
          if (io) {
            io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
              remoteJid: msg.remoteJid,
              commandType: 'reschedule_booking',
              clientName: msg.pushName,
              errorMessage: 'Horario ocupado o no se encontró la cita'
            });
          }
        }
      } catch (err: any) {
        console.error('[Queue] Failed to process reschedule booking:', err);
        await logAICommand(msg.tenantId, msg.remoteJid, 'reschedule_booking', aiResult.rescheduleBookingData, 'failed', err?.message);
        if (io) {
          io.to(`tenant_${msg.tenantId}`).emit('ai:command_failed', {
            remoteJid: msg.remoteJid,
            commandType: 'reschedule_booking',
            clientName: msg.pushName,
            errorMessage: err?.message || 'Error al reagendar cita'
          });
        }
      }
    }
    
    await markDone(msg.id, aiResult.replyText);
    console.log(`[Queue] ✅ Processed message for ${msg.pushName} in queue`);
    
  } catch (error: any) {
    console.error('[Queue] Error processing message:', error);
    try {
      await markFailed(msg.id, error?.message || 'Error inesperado al procesar mensaje');
    } catch (markErr) {
      console.error('[Queue] Error marking message as failed:', markErr);
    }
  }
}
