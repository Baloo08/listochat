import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { getAppointmentsByTenant, createAppointment, updateAppointment, updateAppointmentStatus, deleteAppointment } from '../db/appointments.repo.js';
import { getScheduleSettings, saveScheduleSettings } from '../db/schedule.repo.js';
import { getTenantBySlug, getTenantById } from '../db/tenant.repo.js';
import { getServicesByTenant } from '../db/services.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { getTenantPaymentConfigRaw } from '../db/tenant-payment.repo.js';
import { TilopayTenantService } from '../services/tilopay-tenant.service.js';
import { sendMessage } from '../services/evolution.js';
import { query } from '../db/pool.js';
import { logAuditEvent } from '../db/audit.repo.js';

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
    const tilopayConfig = await getTenantPaymentConfigRaw(tenant.id);
    const tiloAvailable = Boolean(tilopayConfig && tilopayConfig.isEnabled && tilopayConfig.apiKey);

    let logoUrl = store?.storeLogoUrl || null;
    let bannerUrl = store?.storeBannerUrl || null;
    if (!logoUrl || !bannerUrl) {
      const webRes = await query(`SELECT logo_url, banner_image_url FROM tenant_websites WHERE tenant_id = $1`, [tenant.id]);
      if (webRes.rows[0]) {
        if (!logoUrl) logoUrl = webRes.rows[0].logo_url || null;
        if (!bannerUrl) bannerUrl = webRes.rows[0].banner_image_url || null;
      }
    }

    const specialistsRes = await query(`
      SELECT id, name, specialty, active, schedule_type as "scheduleType", schedule_config as "scheduleConfig"
      FROM specialists 
      WHERE tenant_id = $1 AND active = true 
      ORDER BY name ASC
    `, [tenant.id]);

    res.json({
      name: tenant.name,
      slug: tenant.slug,
      whatsappNumber: tenant.whatsappNumber || store?.sinpePhone,
      logoUrl,
      bannerUrl,
      theme: store?.storeTheme,
      services: services.filter((s: any) => s.active !== false),
      specialists: specialistsRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        active: row.active !== false,
        scheduleType: row.scheduleType || 'business_hours',
        scheduleConfig: row.scheduleConfig ? (typeof row.scheduleConfig === 'string' ? JSON.parse(row.scheduleConfig) : row.scheduleConfig) : undefined
      })),
      scheduleMode: schedule?.scheduleMode || 'jornada',
      bookingPaymentMode: schedule?.bookingPaymentMode || 'all',
      customFields: schedule?.customFields || [],
      vacationConfig: schedule?.vacationConfig,
      paymentSettings: {
        acceptSinpe: store?.acceptSinpe !== false,
        acceptSinpeTilopay: store?.acceptSinpeTilopay === true && tiloAvailable,
        sinpePhone: store?.sinpePhone || '',
        sinpeName: store?.sinpeName || '',
        acceptCard: tiloAvailable,
        acceptCash: store?.acceptCashOnDelivery !== false,
        acceptTransfer: store?.acceptTransfer === true,
        bankAccountInfo: store?.bankAccountInfo || '',
        currency: store?.currency || 'CRC'
      }
    });
  } catch (error) {
    console.error('Error fetching public booking info:', error);
    res.status(500).json({ error: 'Error al obtener información' });
  }
});

router.get('/public/:slug/available-slots', async (req, res) => {
  try {
    const { date, serviceId, specialistId } = req.query;
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

    // Filter past dates (Costa Rica UTC-6)
    const nowCR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Costa_Rica' }));
    const todayCR = `${nowCR.getFullYear()}-${String(nowCR.getMonth() + 1).padStart(2, '0')}-${String(nowCR.getDate()).padStart(2, '0')}`;
    const currentMinutesNow = (nowCR.getHours() * 60) + nowCR.getMinutes();

    if (dateStr < todayCR) {
      res.json({
        date: dateStr,
        availableSlots: [],
        maxParallelSlots: 0,
        totalAvailable: 0,
        message: 'No es posible reservar en fechas pasadas'
      });
      return;
    }

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

    // Check specialist if passed
    let specialist: any = null;
    if (specialistId) {
      const specRes = await query(`SELECT * FROM specialists WHERE id = $1 AND tenant_id = $2`, [specialistId, tenant.id]);
      if (!specRes.rows[0]) {
        res.status(404).json({ error: 'Profesional no encontrado' });
        return;
      }
      specialist = specRes.rows[0];
      if (specialist.active === false) {
        res.json({
          date: dateStr,
          availableSlots: [],
          maxParallelSlots: 0,
          totalAvailable: 0,
          message: 'El profesional seleccionado no se encuentra disponible temporalmente'
        });
        return;
      }
    }

    let candidateSlots: string[] = [];
    let isCustomSpecialist = false;

    // Check if specialist has custom_per_day schedule
    if (specialist && specialist.schedule_type === 'custom_per_day' && specialist.schedule_config) {
      const specCfg = typeof specialist.schedule_config === 'string' ? JSON.parse(specialist.schedule_config) : specialist.schedule_config;
      const daySchedule = specCfg.perDaySchedule?.[dayOfWeek] || specCfg.perDaySchedule?.[String(dayOfWeek)];

      if (!daySchedule || daySchedule.enabled === false) {
        res.json({
          date: dateStr,
          availableSlots: [],
          maxParallelSlots: 0,
          totalAvailable: 0,
          message: 'El profesional no atiende este día'
        });
        return;
      }

      isCustomSpecialist = true;
      const slotStep = (schedule?.jornadaConfig?.slotMinutes) || 45;
      const [startH, startM] = (daySchedule.startHour || '08:00').split(':').map(Number);
      const [endH, endM] = (daySchedule.endHour || '17:00').split(':').map(Number);
      let currM = (startH * 60) + startM;
      const endMinutes = (endH * 60) + endM;

      const hasBreak = Boolean(daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd);
      let breakStartM = 0;
      let breakEndM = 0;
      if (hasBreak) {
        const [bsh, bsm] = daySchedule.breakStart.split(':').map(Number);
        const [beh, bem] = daySchedule.breakEnd.split(':').map(Number);
        breakStartM = (bsh * 60) + bsm;
        breakEndM = (beh * 60) + bem;
      }

      while (currM + slotStep <= endMinutes) {
        if (hasBreak && currM >= breakStartM && currM < breakEndM) {
          currM += slotStep;
          continue;
        }
        const h = Math.floor(currM / 60);
        const m = currM % 60;
        candidateSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        currM += slotStep;
      }
    }

    if (!isCustomSpecialist) {
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
    }

    // Determine max parallel capacity (specialist is always 1; otherwise global or per-service)
    let maxParallelSlots = 1;
    let activeApptsRows: any[] = [];

    if (specialistId) {
      maxParallelSlots = 1;
      const activeAppts = await query(`
        SELECT time FROM appointments 
        WHERE tenant_id = $1 AND date = $2 AND specialist_id = $3 AND status IN ('pending', 'scheduled', 'confirmed')
      `, [tenant.id, dateStr, specialistId]);
      activeApptsRows = activeAppts.rows;
    } else {
      maxParallelSlots = schedule?.globalParallelSlots || 1;
      if (serviceId) {
        const srvRes = await query(`SELECT parallel_slots as "parallelSlots" FROM services WHERE id = $1 AND tenant_id = $2`, [serviceId, tenant.id]);
        if (srvRes.rows[0]?.parallelSlots) {
          maxParallelSlots = srvRes.rows[0].parallelSlots;
        }
      }
      const activeAppts = await query(`
        SELECT time FROM appointments 
        WHERE tenant_id = $1 AND date = $2 AND status IN ('pending', 'scheduled', 'confirmed')
      `, [tenant.id, dateStr]);
      activeApptsRows = activeAppts.rows;
    }

    const timeCountMap: Record<string, number> = {};
    for (const row of activeApptsRows) {
      timeCountMap[row.time] = (timeCountMap[row.time] || 0) + 1;
    }

    // A slot is available if active bookings at that time are less than the allowed parallel capacity
    // and if not in the past for today
    const isToday = dateStr === todayCR;
    const availableSlots = candidateSlots.filter(t => {
      if (isToday) {
        const [sh, sm] = t.split(':').map(Number);
        if ((sh * 60 + sm) <= currentMinutesNow) {
          return false;
        }
      }
      return (timeCountMap[t] || 0) < maxParallelSlots;
    });

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
    const { serviceName, serviceId, date, time, customerName, customerPhone, details, vehicleModel, customAnswers, specialistId } = req.body;
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
    const paymentMethod = req.body.paymentMethod || 'cash';
    // solo_reserva = book without payment; does not trigger Tilopay
    const isOnlinePayment = (paymentMethod === 'card' || paymentMethod === 'sinpe_tilopay') && paymentMethod !== 'solo_reserva';

    // Atomic capacity check (Concurrency control - ISO 25010)
    if (specialistId) {
      const specCountRes = await query(`
        SELECT COUNT(*)::int as count 
        FROM appointments 
        WHERE tenant_id = $1 AND date = $2 AND time = $3 AND specialist_id = $4 AND status IN ('pending', 'scheduled', 'confirmed')
      `, [tenant.id, date, time, specialistId]);

      if ((specCountRes.rows[0]?.count || 0) >= 1) {
        res.status(409).json({
          error: 'El profesional seleccionado ya cuenta con una cita en este horario. Por favor selecciona otro turno.'
        });
        return;
      }
    }

    const schedule = await getScheduleSettings(tenant.id);
    let maxParallelSlots = schedule?.globalParallelSlots || 1;
    const targetServiceId = serviceId || matchedService?.id;
    if (targetServiceId) {
      const srvRes = await query(`SELECT parallel_slots as "parallelSlots" FROM services WHERE id = $1 AND tenant_id = $2`, [targetServiceId, tenant.id]);
      if (srvRes.rows[0]?.parallelSlots) {
        maxParallelSlots = srvRes.rows[0].parallelSlots;
      }
    }

    const countRes = await query(`
      SELECT COUNT(*)::int as count 
      FROM appointments 
      WHERE tenant_id = $1 AND date = $2 AND time = $3 AND status IN ('pending', 'scheduled', 'confirmed')
    `, [tenant.id, date, time]);

    if ((countRes.rows[0]?.count || 0) >= maxParallelSlots) {
      res.status(409).json({
        error: 'El horario seleccionado ya no cuenta con cupos disponibles. Por favor selecciona otro turno.'
      });
      return;
    }

    let matchedRecordId: string | undefined = undefined;
    try {
      const { getRecordByPhone } = await import('../db/records.repo.js');
      const rec = await getRecordByPhone(customerPhone, tenant.id);
      if (rec) {
        matchedRecordId = rec.id;
      }
    } catch (e) {}

    const appt = await createAppointment(tenant.id, {
      name: customerName,
      whatsapp: customerPhone,
      service: serviceName,
      date,
      time,
      amount: finalAmount,
      status: 'scheduled',
      specialistId: specialistId || undefined,
      recordId: matchedRecordId || undefined,
      paymentMethod: paymentMethod === 'solo_reserva' ? 'pending' : paymentMethod,
      paymentStatus: paymentMethod === 'sinpe' ? 'proof_sent' : 'pending',
      paymentReference: req.body.paymentReference || null,
      details: combinedDetails,
      vehicleModel: vehicleModel || '',
      selectedVariables: req.body.selectedVariables
    });

    if (matchedRecordId) {
      try {
        const { addRecordEntry } = await import('../db/records.repo.js');
        await addRecordEntry(tenant.id, matchedRecordId, {
          appointmentId: appt.id,
          specialistId: specialistId || undefined,
          entryType: 'consultation',
          notes: `Cita reservada en línea para ${serviceName} el ${date} a las ${time}.`
        });
      } catch (entryErr) {
        console.warn('[Public Booking] Error adding record entry:', entryErr);
      }
    }

    let paymentSession: any = null;
    if (isOnlinePayment && finalAmount > 0) {
      try {
        paymentSession = await TilopayTenantService.createAppointmentPaymentSession(
          tenant.id,
          appt.id,
          req.body.returnUrl
        );
      } catch (err: any) {
        console.error('[Appointments] Error al crear sesión de pago con Tilopay:', err?.message || err);
      }
    }

    // Emit real-time WebSocket event
    if ((req as any).io) {
      (req as any).io.to(`tenant_${tenant.id}`).emit('appointment:created', { ...appt, paymentSession });
    }

    const cleanCustomerPhone = customerPhone.replace(/\D/g, '');

    // 1. Send WhatsApp confirmation to customer
    if (tenant.evolutionInstance && cleanCustomerPhone) {
      const confirmMsg = `📅 *¡Cita Programada con Éxito!*

Hola *${customerName}*, tu cita para *${serviceName}* ha quedado programada en *${tenant.name}*.

🗓️ *Fecha:* ${date}
⏰ *Hora:* ${time}
💰 *Valor:* ₡${amount.toLocaleString('es-CR')}
💳 *Método de Pago:* ${paymentMethod === 'card' ? 'Tarjeta Débito/Crédito' : paymentMethod === 'sinpe_tilopay' ? 'SINPE Móvil Verificado' : paymentMethod === 'sinpe' ? 'SINPE Móvil (Manual)' : 'Efectivo / En Local'}
📌 *Estado:* 🕒 Programada
${vehicleModel ? `🚗 *Vehículo / Detalle:* ${vehicleModel}\n` : ''}${combinedDetails ? `📝 *Información:* ${combinedDetails}\n` : ''}
👉 _Te enviaremos la confirmación oficial antes de tu cita. Si necesitas cancelar o reprogramar, solo responde a este mensaje._ ¡Te esperamos!`;

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
💳 *Pago:* ${paymentMethod}
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
      paymentSession,
      paymentUrl: paymentSession?.paymentUrl || null,
      businessName: tenant.name,
      whatsappNumber: tenant.whatsappNumber
    });
  } catch (error) {
    console.error('Public booking error:', error);
    res.status(500).json({ error: 'Error al procesar reserva' });
  }
});

router.post('/public/:slug/pay/:id', async (req, res) => {
  try {
    const tenant = await getTenantBySlug(req.params.slug);
    if (!tenant) return res.status(404).json({ error: 'Negocio no encontrado' });

    const session = await TilopayTenantService.createAppointmentPaymentSession(
      tenant.id,
      req.params.id,
      req.body.returnUrl
    );
    res.json(session);
  } catch (error: any) {
    console.error('[Appointments] Error al generar sesión de pago:', error);
    res.status(400).json({ error: error.message || 'Error al generar sesión de pago' });
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
    const list = await getAppointmentsByTenant(req.tenantId!);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

router.post('/', async (req, res) => {
  try {
    let recordId = req.body.recordId;
    if (!recordId) {
      try {
        const { getRecordByPhone, getRecordByIdentification } = await import('../db/records.repo.js');
        if (req.body.identification) {
          const rec = await getRecordByIdentification(req.body.identification, req.tenantId!);
          if (rec) recordId = rec.id;
        }
        if (!recordId && req.body.whatsapp) {
          const rec = await getRecordByPhone(req.body.whatsapp, req.tenantId!);
          if (rec) recordId = rec.id;
        }
      } catch (e) {
        console.warn('[Appointments] Record lookup error:', e);
      }
    }

    const appt = await createAppointment(req.tenantId!, {
      ...req.body,
      recordId: recordId || undefined
    });

    if (recordId) {
      try {
        const { addRecordEntry } = await import('../db/records.repo.js');
        await addRecordEntry(req.tenantId!, recordId, {
          appointmentId: appt.id,
          specialistId: req.body.specialistId || undefined,
          entryType: 'consultation',
          notes: `Cita registrada en agenda para ${appt.service} el ${appt.date} a las ${appt.time}.`
        });
      } catch (entryErr) {
        console.warn('[Appointments] Error logging record entry:', entryErr);
      }
    }

    if ((req as any).io) {
      (req as any).io.to(`tenant_${req.tenantId}`).emit('appointment:created', appt);
    }

    res.status(201).json(appt);
  } catch (error) {
    console.error('Error al agendar cita:', error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateAppointment(req.params.id, req.tenantId!, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Cita no encontrada' });
      return;
    }
    if ((req as any).io) {
      (req as any).io.to(`tenant_${req.tenantId}`).emit('appointment:updated', updated);
    }

    if (req.body.paymentStatus === 'paid' || req.body.status === 'confirmed') {
      await logAuditEvent(
        req.tenantId!,
        (req as any).user?.userId || 'system',
        'appointment_status_updated',
        'appointment',
        req.params.id,
        { clientName: updated.name, service: updated.service, status: updated.status, paymentStatus: updated.paymentStatus, amount: updated.amount },
        req.ip,
        req.headers['user-agent']
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, notifyCustomer = true } = req.body;
    const validStatuses = ['pending', 'scheduled', 'confirmed', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Estado inválido. Estados permitidos: ${validStatuses.join(', ')}` });
      return;
    }
    const updated = await updateAppointmentStatus(req.params.id, req.tenantId!, status);
    if (!updated) {
      res.status(404).json({ error: 'Cita no encontrada o no pertenece a este comercio' });
      return;
    }
    const tenant = await getTenantById(req.tenantId!);

    // If changing to confirmed, send confirmation
    if (notifyCustomer && updated?.whatsapp && tenant?.evolutionInstance) {
      let statusText = status === 'confirmed' ? '✅ Confirmada' : status === 'scheduled' ? '🕒 Programada' : status === 'completed' ? '🎉 Completada' : status === 'cancelled' ? '❌ Cancelada' : status;
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
