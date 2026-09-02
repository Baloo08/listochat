import { createAppointment, updateAppointment } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { query } from '../db/pool.js';

export async function createBookingFromCommand(tenantId: string, bookingData: any): Promise<any> {
  try {
    const services = await getServicesByTenant(tenantId);
    const matchedService = services.find(s => 
      s.name.toLowerCase().includes((bookingData.service || '').toLowerCase())
    ) || services[0];

    const price = matchedService ? matchedService.price : 0;

    const appointment = await createAppointment(tenantId, {
      name: bookingData.customerName || 'Cliente WhatsApp',
      whatsapp: bookingData.customerPhone || '',
      service: matchedService ? matchedService.name : (bookingData.service || 'Servicio General'),
      date: bookingData.date || new Date().toISOString().split('T')[0],
      time: bookingData.time || '10:00 AM',
      amount: Number(price),
      details: bookingData.vehicleInfo || '',
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
    const res = await query(`
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
      ORDER BY date ASC, time ASC
      LIMIT 1
    `, [tenantId, clean.slice(-8)]);

    if (!res.rows[0]) {
      console.log(`[CancelBooking] No active appointment found for phone ${phone}`);
      return null;
    }

    const appt = res.rows[0];
    const updated = await updateAppointment(appt.id, tenantId, { status: 'cancelled' });
    console.log(`[CancelBooking] Successfully cancelled appointment ${appt.id} for ${appt.name}`);
    return updated;
  } catch (error) {
    console.error('Error cancelling booking from WhatsApp:', error);
    return null;
  }
}

export async function rescheduleBookingFromWhatsApp(tenantId: string, phone: string, rescheduleData: any): Promise<any> {
  try {
    const clean = phone.replace(/\D/g, '');
    const res = await query(`
      SELECT * FROM appointments 
      WHERE tenant_id = $1 AND REPLACE(whatsapp, '+', '') LIKE '%' || $2 || '%' 
        AND status IN ('scheduled', 'confirmed', 'pending')
      ORDER BY date ASC, time ASC
      LIMIT 1
    `, [tenantId, clean.slice(-8)]);

    if (!res.rows[0]) {
      console.log(`[RescheduleBooking] No active appointment found for phone ${phone}`);
      return null;
    }

    const appt = res.rows[0];
    const updated = await updateAppointment(appt.id, tenantId, {
      date: rescheduleData.newDate || appt.date,
      time: rescheduleData.newTime || appt.time,
      status: 'scheduled'
    });
    console.log(`[RescheduleBooking] Successfully moved appointment ${appt.id} to ${rescheduleData.newDate} ${rescheduleData.newTime}`);
    return updated;
  } catch (error) {
    console.error('Error rescheduling booking from WhatsApp:', error);
    return null;
  }
}
