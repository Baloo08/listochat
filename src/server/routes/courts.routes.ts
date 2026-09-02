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

    if (tenant.evolutionInstance && booking.teamAPhone) {
      const cleanPhone = booking.teamAPhone.replace(/\D/g, '');
      const dParts = booking.date.split('-');
      const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : booking.date;
      const msg = `🎾 *¡Reserva Confirmada!*\n\nHola ${booking.teamACaptain},\nTu reserva ha sido confirmada.\n\n📅 Fecha: ${formattedDate}\n⏰ Hora: ${booking.time.substring(0, 5)}\n⚽ Cancha: ${booking.courtName || 'Reservada'}\n💸 Total a pagar: ₡${booking.totalPrice}\n\n¡Te esperamos!`;
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
    
    const booking = await joinMatch(bookingId, req.body);
    if (!booking) return res.status(404).json({ error: 'Match no encontrado' });

    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('courtBooking:matched', booking);
    }

    if (tenant.evolutionInstance) {
      const msgA = `🔥 *¡Reto Aceptado!*\n\nEl equipo *${booking.teamBName}* ha aceptado tu reto.\nCapitán: ${booking.teamBCaptain}\nTel: ${booking.teamBPhone}\n\n¡Prepárense para el partido!`;
      const msgB = `🔥 *¡Te has unido al partido!*\n\nTe has unido al partido contra *${booking.teamAName}*.\nCapitán rival: ${booking.teamACaptain}\n\n¡Nos vemos en la cancha!`;
      
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

export default router;
