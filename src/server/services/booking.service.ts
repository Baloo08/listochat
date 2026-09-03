import { createAppointment, updateAppointment } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getSpecialistsByTenant } from '../db/specialists.repo.js';
import { query } from '../db/pool.js';

export async function createBookingFromCommand(tenantId: string, bookingData: any): Promise<any> {
  try {
    const services = await getServicesByTenant(tenantId);
    const matchedService = services.find(s => 
      s.name.toLowerCase().includes((bookingData.service || '').toLowerCase())
    ) || services[0];

    const price = matchedService ? matchedService.price : 0;
    const bookingDate = bookingData.date || new Date().toISOString().split('T')[0];
    const bookingTime = bookingData.time || '10:00 AM';

    // Verify slot collision (prevent double booking)
    const collisionCheck = await query(`
      SELECT id, name, time 
      FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND time = $3 AND status NOT IN ('cancelled', 'cancelado')
      LIMIT 1
    `, [tenantId, bookingDate, bookingTime]);

    if (collisionCheck.rows.length > 0) {
      console.warn(`[createBookingFromCommand] Conflict detected: Slot ${bookingDate} ${bookingTime} is already booked.`);
      throw new Error(`El horario ${bookingDate} a las ${bookingTime} ya se encuentra reservado.`);
    }

    // Resolve specialist if provided
    let specialistId: string | undefined = undefined;
    if (bookingData.specialistId) {
      specialistId = bookingData.specialistId;
    } else if (bookingData.specialistName) {
      const allSpecs = await getSpecialistsByTenant(tenantId);
      const matchedSpec = allSpecs.find(s => 
        s.name.toLowerCase().includes(bookingData.specialistName.toLowerCase()) ||
        bookingData.specialistName.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matchedSpec) specialistId = matchedSpec.id;
    }

    const appointment = await createAppointment(tenantId, {
      name: bookingData.customerName || 'Cliente WhatsApp',
      whatsapp: bookingData.customerPhone || '',
      service: matchedService ? matchedService.name : (bookingData.service || 'Servicio General'),
      date: bookingDate,
      time: bookingTime,
      amount: Number(price),
      details: bookingData.vehicleInfo || '',
      specialistId,
      status: 'scheduled'
    });

    return appointment;
  } catch (error) {
    console.error('Error creating booking from command:', error);
    throw error;
  }
}

export async function cancelBookingFromWhatsApp(tenantId: string, phone: string, cancelData: any): Promise<any> {
  try {
    const clean = phone.replace(/\D/g, '');
    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params: any[] = [tenantId, clean.slice(-8)];
    let paramIdx = 3;

    if (cancelData?.date) {
      sql += ` AND date = $${paramIdx++}`;
      params.push(cancelData.date);
    }
    if (cancelData?.service) {
      sql += ` AND service ILIKE $${paramIdx++}`;
      params.push(`%${cancelData.service}%`);
    }

    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);

    if (!res.rows[0]) {
      console.log(`[CancelBooking] No active appointment found for phone ${phone} matching criteria:`, cancelData);
      return null;
    }

    const appt = res.rows[0];
    const updated = await updateAppointment(appt.id, tenantId, { status: 'cancelled' });
    console.log(`[CancelBooking] Successfully cancelled appointment ${appt.id} for ${appt.name} (${appt.service} - ${appt.date} ${appt.time})`);
    return updated;
  } catch (error) {
    console.error('Error cancelling booking from WhatsApp:', error);
    return null;
  }
}

export async function rescheduleBookingFromWhatsApp(tenantId: string, phone: string, rescheduleData: any): Promise<any> {
  try {
    const clean = phone.replace(/\D/g, '');
    let sql = `
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
    `;
    const params: any[] = [tenantId, clean.slice(-8)];
    let paramIdx = 3;

    if (rescheduleData?.currentDate || rescheduleData?.date) {
      sql += ` AND date = $${paramIdx++}`;
      params.push(rescheduleData.currentDate || rescheduleData.date);
    }
    if (rescheduleData?.service) {
      sql += ` AND service ILIKE $${paramIdx++}`;
      params.push(`%${rescheduleData.service}%`);
    }

    sql += ` ORDER BY date ASC, time ASC LIMIT 1`;
    const res = await query(sql, params);

    if (!res.rows[0]) {
      console.log(`[RescheduleBooking] No active appointment found for phone ${phone} matching criteria:`, rescheduleData);
      return null;
    }

    const appt = res.rows[0];
    const targetDate = rescheduleData.newDate || appt.date;
    const targetTime = rescheduleData.newTime || appt.time;

    // Check collision for target slot
    const collisionCheck = await query(`
      SELECT id FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND time = $3 AND status NOT IN ('cancelled', 'cancelado') AND id != $4
      LIMIT 1
    `, [tenantId, targetDate, targetTime, appt.id]);

    if (collisionCheck.rows.length > 0) {
      console.warn(`[RescheduleBooking] Conflict detected: Target slot ${targetDate} ${targetTime} is already occupied.`);
      throw new Error(`El horario ${targetDate} a las ${targetTime} ya se encuentra ocupado.`);
    }

    const updated = await updateAppointment(appt.id, tenantId, {
      date: targetDate,
      time: targetTime,
      status: 'scheduled'
    });
    console.log(`[RescheduleBooking] Successfully moved appointment ${appt.id} (${appt.service}) to ${targetDate} ${targetTime}`);
    return updated;
  } catch (error) {
    console.error('Error rescheduling booking from WhatsApp:', error);
    return null;
  }
}
