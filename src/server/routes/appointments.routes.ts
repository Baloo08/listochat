import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getAppointmentsByTenant, createAppointment, updateAppointmentStatus, deleteAppointment } from '../db/appointments.repo.js';
import { getScheduleSettings, saveScheduleSettings } from '../db/schedule.repo.js';
import { getTenantBySlug, getTenantById } from '../db/tenant.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';

const router = Router();

// ==========================================
// PUBLIC ROUTES FOR ONLINE BOOKING (/reservas/:slug)
// ==========================================

router.get('/public/:slug/info', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    const services = await getServicesByTenant(tenant.id);
    const store = await getStoreSettings(tenant.id);
    const schedule = await getScheduleSettings(tenant.id);

    res.json({
      name: tenant.name,
      slug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone,
      logoUrl: store?.storeLogoUrl,
      bannerUrl: store?.storeBannerUrl,
      theme: store?.storeTheme,
      services: services.filter((s: any) => s.active !== false),
      scheduleMode: schedule?.scheduleMode || 'jornada',
      customFields: schedule?.customFields || [],
      vacationConfig: schedule?.vacationConfig
    });
  } catch (error) {
    console.error('Error fetching public booking info:', error);
    res.status(500).json({ error: 'Error al obtener información' });
  }
});

router.get('/public/:slug/available-slots', async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    if (!date) {
      res.status(400).json({ error: 'Fecha requerida (YYYY-MM-DD)' });
      return;
    }

    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    const schedule = await getScheduleSettings(tenant.id);
    const dateStr = String(date);

    // 1. Check Vacation Mode / Date Blocking
    if (schedule?.vacationConfig?.enabled) {
      const v = schedule.vacationConfig;
      if (v.startDate && v.endDate && dateStr >= v.startDate && dateStr <= v.endDate) {
        res.json({
          availableSlots: [],
          isVacation: true,
          vacationMessage: v.message || 'Estaremos cerrados temporalmente por vacaciones.'
        });
        return;
      }
    }

    const selectedDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay(); // 1 = Lunes, 7 = Domingo

    let candidateSlots: string[] = [];

    if (schedule?.scheduleMode === 'jornada' || !schedule) {
      const j = schedule?.jornadaConfig || {
        startHour: '08:00',
        endHour: '17:00',
        slotMinutes: 45,
        hasBreak: true,
        breakStart: '12:00',
        breakEnd: '13:00',
        daysEnabled: [1, 2, 3, 4, 5, 6]
      };

      if (!j.daysEnabled.includes(dayOfWeek)) {
        res.json({ availableSlots: [], message: 'Cerrado este día' });
        return;
      }

      const [startH, startM] = j.startHour.split(':').map(Number);
      const [endH, endM] = j.endHour.split(':').map(Number);
      
      // Check per-day break if configured, else global break
      const dayBreak = j.perDayBreaks?.[dayOfWeek];
      const hasBreakThisDay = dayBreak !== undefined ? dayBreak.hasBreak : (j.hasBreak !== false);
      const breakStartStr = dayBreak?.breakStart || j.breakStart || '12:00';
      const breakEndStr = dayBreak?.breakEnd || j.breakEnd || '13:00';

      const [breakStartH, breakStartM] = breakStartStr.split(':').map(Number);
      const [breakEndH, breakEndM] = breakEndStr.split(':').map(Number);

      const slotStep = j.slotMinutes || 45;
      let currentMinutes = (startH * 60) + startM;
      const endMinutes = (endH * 60) + endM;
      const breakStartMinutes = (breakStartH * 60) + breakStartM;
      const breakEndMinutes = (breakEndH * 60) + breakEndM;

      while (currentMinutes + slotStep <= endMinutes) {
        // Skip if overlaps with break time
        if (hasBreakThisDay && currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
          currentMinutes += slotStep;
          continue;
        }

        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        candidateSlots.push(timeStr);
        currentMinutes += slotStep;
      }
    } else if (schedule?.scheduleMode === 'fechas') {
      const f = schedule.fechasConfig || { enabledDates: [], slotsByDate: {} };
      if (!f.enabledDates.includes(dateStr)) {
        res.json({ availableSlots: [], message: 'No hay citas habilitadas para esta fecha' });
        return;
      }
      candidateSlots = f.slotsByDate?.[dateStr] || ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    } else if (schedule?.scheduleMode === 'bloques') {
      const b = schedule.bloquesConfig || { days: {}, slotMinutes: 45 };
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayKey = dayKeys[selectedDate.getDay()];
      const blocks = b.days?.[dayKey] || [];

      const slotStep = b.slotMinutes || 45;
      for (const block of blocks) {
        const [bStartH, bStartM] = block.start.split(':').map(Number);
        const [bEndH, bEndM] = block.end.split(':').map(Number);
        let curr = (bStartH * 60) + bStartM;
        const end = (bEndH * 60) + bEndM;

        while (curr + slotStep <= end) {
          const h = Math.floor(curr / 60);
          const m = curr % 60;
          candidateSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
          curr += slotStep;
        }
      }
    }

    // Determine max parallel capacity (global or per-service)
    let maxParallelSlots = schedule?.globalParallelSlots || 1;
    if (serviceId) {
      const srvRes = await query(`SELECT parallel_slots as "parallelSlots" FROM services WHERE id = $1 AND tenant_id = $2`, [serviceId, tenant.id]);
      if (srvRes.rows[0]?.parallelSlots) {
        maxParallelSlots = srvRes.rows[0].parallelSlots;
      }
    }

    // Fetch active appointments on that date (completed and cancelled appointments free up the slot immediately!)
    const activeAppts = await query(`
      SELECT time FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND status IN ('pending', 'scheduled', 'confirmed')
    `, [tenant.id, dateStr]);

    const timeCountMap: Record<string, number> = {};
    for (const row of activeAppts.rows) {
      timeCountMap[row.time] = (timeCountMap[row.time] || 0) + 1;
    }

    // A slot is available if active bookings at that time are less than the allowed parallel capacity
    const availableSlots = candidateSlots.filter(t => (timeCountMap[t] || 0) < maxParallelSlots);

    res.json({
      date: dateStr,
      availableSlots,
      maxParallelSlots,
      totalAvailable: availableSlots.length
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Error al calcular disponibilidad' });
  }
});

router.post('/public/:slug/book', async (req, res) => {
  try {
    const { serviceName, serviceId, date, time, customerName, customerPhone, details, vehicleModel, customAnswers } = req.body;
    if (!serviceName || !date || !time || !customerName || !customerPhone) {
      res.status(400).json({ error: 'Servicio, fecha, hora, nombre y WhatsApp son requeridos' });
      return;
    }

    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) {
      res.status(404).json({ error: 'Negocio no encontrado' });
      return;
    }

    // Get service price
    let amount = 0;
    const services = await getServicesByTenant(tenant.id);
    const matchedService = services.find((s: any) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase());
    if (matchedService) {
      amount = Number(matchedService.price || 0);
    }

    let combinedDetails = details || '';
    if (customAnswers && typeof customAnswers === 'object') {
      const answersList = Object.entries(customAnswers)
        .filter(([_, val]) => val && String(val).trim().length > 0)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
      if (answersList) {
        combinedDetails = combinedDetails ? `${combinedDetails} | ${answersList}` : answersList;
      }
    }

    const finalAmount = req.body.amount !== undefined ? Number(req.body.amount) : amount;

    const appt = await createAppointment(tenant.id, {
      name: customerName,
      whatsapp: customerPhone,
      service: serviceName,
      date,
      time,
      amount: finalAmount,
      status: 'confirmed',
      details: combinedDetails,
      vehicleModel: vehicleModel || '',
      selectedVariables: req.body.selectedVariables
    });

    const cleanCustomerPhone = customerPhone.replace(/\D/g, '');

    // 1. Send WhatsApp confirmation to customer
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const confirmMsg = `📅 *¡Cita Confirmada con Éxito!*

Hola *${customerName}*, tu cita para *${serviceName}* ha quedado agendada en *${tenant.name}*.

🗓️ *Fecha:* ${date}
⏰ *Hora:* ${time}
💰 *Valor:* ₡${amount.toLocaleString('es-CR')}
${vehicleModel ? `🚗 *Vehículo / Detalle:* ${vehicleModel}` : ''}
${combinedDetails ? `📝 *Información:* ${combinedDetails}` : ''}

👉 _Te enviaremos un recordatorio antes de tu cita. Si necesitas reprogramar, por favor responde a este mensaje._ ¡Te esperamos!`;

      try {
        await sendMessage(tenant.evolutionInstance, cleanCustomerPhone, confirmMsg);
      } catch (err) {
        console.error('Error sending booking confirmation to customer:', err);
      }
    }

    // 2. Send WhatsApp alert to business admin
    if (tenant.evolutionInstance && tenant.whatsappNumber) {
      const adminPhone = tenant.whatsappNumber.replace(/\D/g, '');
      const adminMsg = `🔔 *¡NUEVA CITA AGENDADA EN LÍNEA!*

👤 *Cliente:* ${customerName} (${customerPhone})
🛠️ *Servicio:* ${serviceName}
🗓️ *Fecha:* ${date} a las ${time}
💰 *Monto:* ₡${amount.toLocaleString('es-CR')}
${combinedDetails ? `📝 *Detalles:* ${combinedDetails}` : ''}`;

      try {
        await sendMessage(tenant.evolutionInstance, adminPhone, adminMsg);
      } catch (err) {
        console.error('Error sending booking alert to admin:', err);
      }
    }

    // Log notification
    await query(`
      INSERT INTO notifications_log (id, tenant_id, recipient, message, trigger_type, status)
      VALUES ($1, $2, $3, $4, 'online_booking_created', 'sent')
    `, [
      `notif_${Date.now()}`,
      tenant.id,
      cleanCustomerPhone,
      `Cita online para ${customerName} agendada para ${date} ${time}`
    ]);

    res.status(201).json({
      ...appt,
      businessName: tenant.name,
      whatsappNumber: tenant.whatsappNumber
    });
  } catch (error) {
    console.error('Public booking error:', error);
    res.status(500).json({ error: 'Error al procesar reserva' });
  }
});

// ==========================================
// AUTHENTICATED TENANT APPOINTMENTS & SCHEDULE
// ==========================================

router.use(authenticateToken);
router.use(tenantContext);

router.get('/schedule', async (req, res) => {
  try {
    const settings = await getScheduleSettings(req.tenantId!);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener horarios' });
  }
});

router.post('/schedule', async (req, res) => {
  try {
    const saved = await saveScheduleSettings(req.tenantId!, req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar horarios' });
  }
});

router.get('/', async (req, res) => {
  try {
    const list = await getAppointmentsByTenant(req.tenantId!, req.query as any);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const appt = await createAppointment(req.tenantId!, req.body);
    res.status(201).json(appt);
  } catch (error) {
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, notifyCustomer = true } = req.body;
    const updated = await updateAppointmentStatus(req.params.id, req.tenantId!, status);
    const tenant = await getTenantById(req.tenantId!);

    // If changing to confirmed, send confirmation
    if (notifyCustomer && updated?.whatsapp && tenant?.evolutionInstance) {
      let statusText = status === 'confirmed' ? '✅ Confirmada' : status === 'completed' ? '🎉 Completada' : status === 'cancelled' ? '❌ Cancelada' : status;
      const msg = `*Actualización de Cita en ${tenant.name}*\n\nHola *${updated.name}*, el estado de tu cita para *${updated.service}* (${updated.date} a las ${updated.time}) ha sido actualizado a: *${statusText}*.`;
      try {
        await sendMessage(tenant.evolutionInstance, updated.whatsapp, msg);
      } catch (e) {
        // ignore
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado de cita' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteAppointment(req.params.id, req.tenantId!);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cita' });
  }
});

export default router;
