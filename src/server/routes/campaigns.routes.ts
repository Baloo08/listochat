import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { getTenantById } from '../db/tenant.repo.js';
import { enqueueCampaign, pauseCampaign, resumeCampaign, cancelCampaign } from '../services/campaign-queue.service.js';

const router = Router();
router.use(authenticateToken);

// ==========================================
// REMINDER SETTINGS (CUSTOMIZABLE BY TENANT)
// ==========================================
router.get('/reminder-settings', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const result = await query(`SELECT reminder_config as "reminderConfig" FROM tenants WHERE id = $1`, [tenantId]);
    const config = result.rows[0]?.reminderConfig || {
      enabled: true,
      firstReminderEnabled: true,
      firstReminderHoursBefore: 24,
      firstReminderTemplate: '👋 Hola *{{nombre}}*, te recordamos tu cita para *{{servicio}}* agendada para el día *{{fecha}}* a las *{{hora}}* en *{{negocio}}*. ¡Te esperamos!',
      secondReminderEnabled: true,
      secondReminderHoursBefore: 2,
      secondReminderTemplate: '⏰ Hola *{{nombre}}*, tu cita para *{{servicio}}* en *{{negocio}}* es hoy a las *{{hora}}* (en unas {{horas}} horas). Si necesitas reagendar, avísanos con tiempo.'
    };
    res.json(config);
  } catch (error) {
    console.error('Error getting reminder settings:', error);
    res.status(500).json({ error: 'Error al obtener configuración de recordatorios' });
  }
});

router.post('/reminder-settings', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const config = req.body;
    await query(`UPDATE tenants SET reminder_config = $1 WHERE id = $2`, [JSON.stringify(config), tenantId]);
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    res.status(500).json({ error: 'Error al guardar configuración de recordatorios' });
  }
});

// ==========================================
// CUSTOMERS & CRM AUDIENCE
// ==========================================
router.get('/customers', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;

    // Sync recent customers from orders & appointments into customers table
    await query(`
      INSERT INTO customers (tenant_id, name, phone, email, total_orders, total_spent, last_interaction)
      SELECT 
        $1 as tenant_id,
        customer_name as name,
        customer_phone as phone,
        customer_email as email,
        COUNT(id) as total_orders,
        SUM(total) as total_spent,
        MAX(created_at) as last_interaction
      FROM orders
      WHERE tenant_id = $1 AND customer_phone IS NOT NULL AND customer_phone != ''
      GROUP BY customer_name, customer_phone, customer_email
      ON CONFLICT (tenant_id, phone) DO UPDATE SET
        name = EXCLUDED.name,
        total_orders = EXCLUDED.total_orders,
        total_spent = EXCLUDED.total_spent,
        last_interaction = EXCLUDED.last_interaction
    `, [tenantId]);

    // Also sync from appointments
    await query(`
      INSERT INTO customers (tenant_id, name, phone, total_orders, total_spent, last_interaction)
      SELECT 
        $1 as tenant_id,
        name,
        whatsapp as phone,
        COUNT(id) as total_orders,
        SUM(amount) as total_spent,
        MAX(created_at) as last_interaction
      FROM appointments
      WHERE tenant_id = $1 AND whatsapp IS NOT NULL AND whatsapp != ''
      GROUP BY name, whatsapp
      ON CONFLICT (tenant_id, phone) DO UPDATE SET
        last_interaction = GREATEST(customers.last_interaction, EXCLUDED.last_interaction)
    `, [tenantId]);

    const result = await query(`
      SELECT id, name, phone, email, tags, total_orders as "totalOrders", 
             total_spent as "totalSpent", last_interaction as "lastInteraction", created_at as "createdAt"
      FROM customers
      WHERE tenant_id = $1
      ORDER BY last_interaction DESC
    `, [tenantId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Error al obtener lista de clientes' });
  }
});

router.post('/customers/:id/tags', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { tags } = req.body;
    const result = await query(`
      UPDATE customers SET tags = $1 
      WHERE id = $2 AND tenant_id = $3
      RETURNING id, tags
    `, [tags, req.params.id, tenantId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer tags:', error);
    res.status(500).json({ error: 'Error al actualizar etiquetas' });
  }
});

// ==========================================
// WHATSAPP CAMPAIGNS (MASS BROADCASTS)
// ==========================================
// Fetch live contacts from tenant's WhatsApp instance
router.get('/whatsapp-contacts', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) {
      res.json({ contacts: [] });
      return;
    }

    const { fetchWhatsAppContacts } = await import('../services/evolution.js');
    const contacts = await fetchWhatsAppContacts(tenant.evolutionInstance);
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching whatsapp contacts for campaign:', error);
    res.status(500).json({ error: 'Error al obtener contactos de WhatsApp' });
  }
});

router.get('/', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const result = await query(`
      SELECT id, name, message_template as "messageTemplate", media_url as "mediaUrl",
             target_segment as "targetSegment", target_tag as "targetTag",
             total_recipients as "totalRecipients", sent_count as "sentCount",
             failed_count as "failedCount", status, scheduled_for as "scheduledFor",
             target_contacts as "targetContacts", created_at as "createdAt"
      FROM whatsapp_campaigns
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

router.post('/', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, messageTemplate, mediaUrl, targetSegment, targetTag, scheduledFor, targetContacts } = req.body;

    if (!name || !messageTemplate) {
      res.status(400).json({ error: 'Nombre de campaña y mensaje son obligatorios' });
      return;
    }

    let totalRecipients = 0;
    if (targetContacts && Array.isArray(targetContacts) && targetContacts.length > 0) {
      totalRecipients = targetContacts.length;
    } else {
      let countQuery = `SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1`;
      const params: any[] = [tenantId];

      if (targetSegment === 'tag' && targetTag) {
        countQuery += ` AND $2 = ANY(tags)`;
        params.push(targetTag);
      }

      const countRes = await query(countQuery, params);
      totalRecipients = parseInt(countRes.rows[0]?.count || '0', 10);
    }

    const isScheduled = scheduledFor && new Date(scheduledFor).getTime() > Date.now();
    const initialStatus = isScheduled ? 'scheduled' : 'draft';

    const result = await query(`
      INSERT INTO whatsapp_campaigns (
        tenant_id, name, message_template, media_url, target_segment, target_tag, 
        total_recipients, status, scheduled_for, target_contacts
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, message_template as "messageTemplate", media_url as "mediaUrl",
                target_segment as "targetSegment", target_tag as "targetTag",
                total_recipients as "totalRecipients", sent_count as "sentCount",
                failed_count as "failedCount", status, scheduled_for as "scheduledFor",
                target_contacts as "targetContacts", created_at as "createdAt"
    `, [
      tenantId, 
      name, 
      messageTemplate, 
      mediaUrl || null, 
      targetSegment || 'all', 
      targetTag || null, 
      totalRecipients, 
      initialStatus,
      isScheduled ? new Date(scheduledFor) : null,
      targetContacts ? JSON.stringify(targetContacts) : null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const campaignId = req.params.id;

    const campRes = await query(`
      SELECT * FROM whatsapp_campaigns WHERE id = $1 AND tenant_id = $2
    `, [campaignId, tenantId]);

    if (campRes.rows.length === 0) {
      res.status(404).json({ error: 'Campaña no encontrada' });
      return;
    }

    const tenant = await getTenantById(tenantId);
    if (!tenant || !tenant.evolutionInstance) {
      res.status(400).json({ error: 'El negocio no tiene una conexión de WhatsApp activa para realizar envíos' });
      return;
    }

    // Mark as sending in DB
    await query(`UPDATE whatsapp_campaigns SET status = 'sending' WHERE id = $1`, [campaignId]);

    // Enqueue to Redis persistent worker queue
    await enqueueCampaign(campaignId, tenantId);

    res.json({ success: true, message: 'Campaña iniciada y encolada con éxito' });
  } catch (error) {
    console.error('Error starting campaign send:', error);
    res.status(500).json({ error: 'Error al enviar campaña' });
  }
});

router.post('/:id/pause', async (req, res) => {
  try {
    const campaignId = req.params.id;
    await pauseCampaign(campaignId);
    res.json({ success: true, message: 'Campaña pausada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al pausar campaña' });
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const campaignId = req.params.id;
    await resumeCampaign(campaignId, tenantId);
    res.json({ success: true, message: 'Campaña reanudada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al reanudar campaña' });
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    const campaignId = req.params.id;
    await cancelCampaign(campaignId);
    res.json({ success: true, message: 'Campaña cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar campaña' });
  }
});

export default router;
