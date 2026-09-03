import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { 
  getCourtsByTenant, getCourtById, createCourt, updateCourt, deleteCourt,
  getBookingsByTenant, getBookingById, createBooking, updateBooking, cancelBooking,
  getOpenMatches, joinMatch, getAvailableSlots
} from '../db/courts.repo.js';
import { getTenantBySlug } from '../db/tenant.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();

// ==========================================
// PUBLIC ROUTES (/public/:slug/...)
// ==========================================

router.get('/public/:slug/info', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    
    // Fetch store settings for theme and courtsConfig
    const storeSettingsRes = await query(`
      SELECT store_name, store_slug, store_description, store_logo_url, store_banner_url, 
             store_theme, sinpe_phone, sinpe_name, bank_account_info, currency, store_modules
      FROM store_settings 
      WHERE tenant_id = $1
    `, [tenant.id]);

    const s = storeSettingsRes.rows[0] || {};
    const courtsConfig = s.store_modules?.courtsConfig || {
      paymentMode: 'both',
      matchExpiryHours: 1,
      allowSeekMatch: true,
      sportTypes: ['futbol', 'padel', 'tenis']
    };

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        whatsappNumber: tenant.whatsappNumber
      },
      storeName: s.store_name || tenant.name,
      storeSlug: s.store_slug || tenant.slug,
      storeDescription: s.store_description || '',
      storeLogoUrl: s.store_logo_url,
      storeBannerUrl: s.store_banner_url,
      storeTheme: s.store_theme || {},
      sinpePhone: s.sinpe_phone,
      sinpeName: s.sinpe_name,
      bankAccountInfo: s.bank_account_info,
      currency: s.currency || 'CRC',
      courtsConfig
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener información de canchas' });
  }
});

router.get('/public/:slug/courts', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    const courts = await getCourtsByTenant(tenant.id);
    res.json(courts.filter(c => c.active));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener canchas' });
  }
});

router.get('/public/:slug/available-slots', async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) return res.status(400).json({ error: 'Faltan parámetros courtId o date' });
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    
    const slots = await getAvailableSlots(tenant.id, String(courtId), String(date));
    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener espacios' });
  }
});

router.post('/public/:slug/book', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    
    const data = req.body;
    const booking = await createBooking(tenant.id, data);
    
    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('courtBooking:created', booking);
    }

    // WhatsApp Notification via Evolution API
    if (tenant.evolutionInstance && booking.teamAPhone) {
      const cleanPhone = booking.teamAPhone.replace(/\D/g, '');
      const dParts = booking.date.split('-');
      const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
      const code = booking.id.substring(0, 8).toUpperCase();
      const timeShort = booking.time.substring(0, 5);

      let msg = '';
      if (booking.bookingMode === 'seek_match') {
        const cuota = (booking.pricePerTeam || (booking.totalPrice / 2)).toLocaleString();
        msg = `⚽ *¡Reto Publicado con Éxito!*\n\nHola *${booking.teamACaptain}*,\nTu búsqueda de reto para el equipo *${booking.teamAName}* ha sido publicada en el portal.\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName || 'Cancha Deportiva'}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n⚔️ *Nivel:* ${booking.skillLevel || 'Abierto'}\n💰 *Tu cuota (50%):* ₡${cuota}\n\nTe notificaremos por este medio cuando un equipo rival acepte el reto. ¡A entrenar!`;
      } else {
        msg = `⚽ *¡Reserva Confirmada!*\n\nHola *${booking.teamACaptain}*,\nTu reserva de cancha para el equipo *${booking.teamAName}* ha sido confirmada.\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName || 'Cancha Deportiva'}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n💰 *Total a pagar:* ₡${booking.totalPrice.toLocaleString()}\n\n¡Los esperamos en la cancha!`;
      }

      await sendMessage(tenant.evolutionInstance, `${cleanPhone}@s.whatsapp.net`, msg).catch(console.error);
    }
    
    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

router.get('/public/:slug/open-matches', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    const matches = await getOpenMatches(tenant.id);
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener retadores' });
  }
});

router.post('/public/:slug/join-match/:bookingId', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });
    const { bookingId } = req.params;
    
    const booking = await joinMatch(bookingId, tenant.id, req.body);
    if (!booking) return res.status(404).json({ error: 'Match no encontrado' });

    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('courtBooking:matched', booking);
    }

    if (tenant.evolutionInstance) {
      const dParts = booking.date.split('-');
      const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
      const code = booking.id.substring(0, 8).toUpperCase();
      const timeShort = booking.time.substring(0, 5);
      const cuota = (booking.pricePerTeam || (booking.totalPrice / 2)).toLocaleString();

      const msgA = `🔥 *¡Reto Aceptado!*\n\nHola *${booking.teamACaptain}*,\n¡Tu reto ya tiene rival! El equipo *${booking.teamBName}* (Capitán: *${booking.teamBCaptain}*, Tel: ${booking.teamBPhone}) ha aceptado el partido.\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName || 'Cancha Deportiva'}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n💰 *Cuota por equipo:* ₡${cuota}\n\n¡Nos vemos en la cancha!`;
      const msgB = `🔥 *¡Te has unido al partido!*\n\nHola *${booking.teamBCaptain}*,\nTu equipo *${booking.teamBName}* jugará contra *${booking.teamAName}* (Capitán: *${booking.teamACaptain}*, Tel: ${booking.teamAPhone}).\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName || 'Cancha Deportiva'}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n💰 *Tu cuota:* ₡${cuota}\n\n¡Prepárense para el partido!`;
      
      const cleanA = booking.teamAPhone.replace(/\D/g, '');
      const cleanB = booking.teamBPhone?.replace(/\D/g, '');
      if (cleanA) await sendMessage(tenant.evolutionInstance, `${cleanA}@s.whatsapp.net`, msgA).catch(console.error);
      if (cleanB) await sendMessage(tenant.evolutionInstance, `${cleanB}@s.whatsapp.net`, msgB).catch(console.error);
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al unirse al partido' });
  }
});


// ==========================================
// PRIVATE ROUTES (Require Auth)
// ==========================================

router.use(authenticateToken);
router.use(tenantContext);

// -- COURTS --
router.get('/', async (req, res) => {
  try {
    const courts = await getCourtsByTenant(req.tenantId);
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener canchas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const court = await createCourt(req.tenantId, req.body);
    res.status(201).json(court);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear cancha' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const court = await updateCourt(req.params.id, req.tenantId, req.body);
    res.json(court);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cancha' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteCourt(req.params.id, req.tenantId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cancha' });
  }
});

// -- BOOKINGS --
router.get('/bookings', async (req, res) => {
  try {
    const date = req.query.date as string | undefined;
    const bookings = await getBookingsByTenant(req.tenantId, date);
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
});

router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.tenantId);
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
});

router.post('/bookings', async (req, res) => {
  try {
    const booking = await createBooking(req.tenantId, req.body);
    
    if ((req as any).io) {
      (req as any).io.to(`tenant_${req.tenantId}`).emit('courtBooking:created', booking);
    }
    
    // Admin creates booking, we should fetch tenant to get evolutionInstance
    const tRes = await query('SELECT evolution_instance FROM tenants WHERE id = $1', [req.tenantId]);
    const evolutionInstance = tRes.rows[0]?.evolution_instance;
    if (evolutionInstance && booking.teamAPhone) {
      const cleanPhone = booking.teamAPhone.replace(/\D/g, '');
      const msg = `🎾 *¡Reserva Confirmada!*\n\nHola ${booking.teamACaptain},\nTu reserva ha sido confirmada manualmente.\n\n⚽ Cancha: ${booking.courtName || 'Reservada'}\n📅 Fecha: ${booking.date}\n⏰ Hora: ${booking.time.substring(0, 5)}\n💸 Total: ₡${booking.totalPrice}\n\n¡Gracias por preferirnos!`;
      await sendMessage(evolutionInstance, `${cleanPhone}@s.whatsapp.net`, msg).catch(console.error);
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
});

router.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, req.body);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
});

router.delete('/bookings/:id', async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.id, req.tenantId);
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
});

router.put('/bookings/:id/confirm-payment-a', async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, { teamAPaid: true });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pago A' });
  }
});

router.put('/bookings/:id/confirm-payment-b', async (req, res) => {
  try {
    const booking = await updateBooking(req.params.id, req.tenantId, { teamBPaid: true });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al confirmar pago B' });
  }
});

router.post('/bookings/:id/send-reminder', async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.tenantId);
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

    const { reminderType, targetTeam, customMessage } = req.body;

    const tRes = await query('SELECT evolution_instance, name FROM tenants WHERE id = $1', [req.tenantId]);
    const evolutionInstance = tRes.rows[0]?.evolution_instance;
    const businessName = tRes.rows[0]?.name || 'el complejo deportivo';

    if (!evolutionInstance) {
      return res.status(400).json({ error: 'No hay instancia de WhatsApp conectada para este negocio.' });
    }

    const sRes = await query('SELECT sinpe_phone, sinpe_name, store_modules FROM store_settings WHERE tenant_id = $1', [req.tenantId]);
    const s = sRes.rows[0] || {};
    const sinpePhone = s.store_modules?.courtsConfig?.theme?.sinpePhone || s.sinpe_phone || '';
    const sinpeName = s.store_modules?.courtsConfig?.theme?.sinpeName || s.sinpe_name || '';

    const dParts = booking.date.split('-');
    const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
    const code = booking.id.substring(0, 8).toUpperCase();
    const timeShort = booking.time.substring(0, 5);

    let sentCount = 0;

    // Send to Team A
    if ((targetTeam === 'A' || targetTeam === 'both' || !targetTeam) && booking.teamAPhone) {
      const cleanA = booking.teamAPhone.replace(/\D/g, '');
      let msgA = '';
      if (customMessage) {
        msgA = customMessage;
      } else if (reminderType === 'payment') {
        const amountA = (booking.bookingMode === 'seek_match' && !booking.teamBName) ? (booking.pricePerTeam || booking.totalPrice / 2) : (booking.pricePerTeam || booking.totalPrice);
        msgA = `👋 *¡Recordatorio de Pago!*\n\nHola *${booking.teamACaptain}*,\nTe recordamos el pago pendiente para tu reserva de cancha:\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName}\n📅 *Fecha:* ${formattedDate} a las ${timeShort}\n💰 *Monto a pagar:* ₡${Number(amountA).toLocaleString()}\n`;
        if (sinpePhone) {
          msgA += `\n📲 *SINPE Móvil:* ${sinpePhone}${sinpeName ? ` (${sinpeName})` : ''}\n*Detalle:* #RES-${code}`;
        }
      } else {
        msgA = `⚽ *¡Recordatorio de Partido!*\n\nHola *${booking.teamACaptain}*,\nTe recordamos tu partido programado en *${businessName}*:\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n\n⚠️ Por favor presentarse 10 minutos antes de la hora acordada. ¡Buen partido!`;
      }

      await sendMessage(evolutionInstance, `${cleanA}@s.whatsapp.net`, msgA).catch(console.error);
      sentCount++;
    }

    // Send to Team B
    if ((targetTeam === 'B' || targetTeam === 'both') && booking.teamBPhone) {
      const cleanB = booking.teamBPhone.replace(/\D/g, '');
      let msgB = '';
      if (customMessage) {
        msgB = customMessage;
      } else if (reminderType === 'payment') {
        const amountB = booking.pricePerTeam || (booking.totalPrice / 2);
        msgB = `👋 *¡Recordatorio de Pago!*\n\nHola *${booking.teamBCaptain}*,\nTe recordamos el pago de tu cuota de partido:\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName}\n📅 *Fecha:* ${formattedDate} a las ${timeShort}\n💰 *Monto:* ₡${Number(amountB).toLocaleString()}\n`;
        if (sinpePhone) {
          msgB += `\n📲 *SINPE Móvil:* ${sinpePhone}${sinpeName ? ` (${sinpeName})` : ''}\n*Detalle:* #RES-${code}`;
        }
      } else {
        msgB = `⚽ *¡Recordatorio de Partido!*\n\nHola *${booking.teamBCaptain}*,\nTe recordamos tu partido programado en *${businessName}*:\n\n📋 *Código:* #RES-${code}\n🏆 *Cancha:* ${booking.courtName}\n📅 *Fecha:* ${formattedDate}\n⏰ *Hora:* ${timeShort}\n\n⚠️ Por favor presentarse 10 minutos antes de la hora acordada. ¡Buen partido!`;
      }

      await sendMessage(evolutionInstance, `${cleanB}@s.whatsapp.net`, msgB).catch(console.error);
      sentCount++;
    }

    res.json({ success: true, sentCount });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Error al enviar recordatorio' });
  }
});

export default router;
