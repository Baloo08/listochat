import * as appointmentsRepo from '../repositories/appointments.repo.js';
import * as servicesRepo from '../repositories/services.repo.js';

export async function createBookingFromCommand(tenantId: string, bookingData: any): Promise<any> {
  try {
    const serviceName = bookingData.serviceName;
    const service: any = await servicesRepo.getServiceByName(tenantId, serviceName);
    
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const price = service.price;
    const duration = service.duration;

    const startDate = new Date(`${bookingData.date}T${bookingData.time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    const appointment = await appointmentsRepo.createAppointment(tenantId, {
      serviceId: service.id,
      serviceName: service.name,
      date: bookingData.date,
      time: bookingData.time,
      price,
      duration,
      endTime: `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`,
      status: 'confirmed'
    });

    return appointment;
  } catch (error) {
    console.error('Error creating booking from command:', error);
    throw new Error('Failed to create booking');
  }
}
