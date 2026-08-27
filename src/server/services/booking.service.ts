import { createAppointment } from '../db/appointments.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';

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
      status: 'pending'
    });

    return appointment;
  } catch (error) {
    console.error('Error creating booking from command:', error);
    throw error;
  }
}
