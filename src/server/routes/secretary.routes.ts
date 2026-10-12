import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import {
  getAuthorizedPhonesByTenant,
  createAuthorizedPhone,
  updateAuthorizedPhone,
  deleteAuthorizedPhone
} from '../db/secretary.repo.js';
import { getTenantById } from '../db/tenant.repo.js';
import { decrypt } from '../services/encryption.js';
import { callAI } from '../services/ai-provider.js';
import { query } from '../db/pool.js';
import { getTodayCR, getCurrentTimeCR } from '../services/timezone.service.js';

const router = Router();

// =========================================================================
// GESTIÓN DE TELÉFONOS AUTORIZADOS DE SECRETARIO
// =========================================================================

// GET /api/secretary/phones
router.get('/phones', authenticateToken, tenantContext, async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const phones = await getAuthorizedPhonesByTenant(tenantId);
    res.json(phones);
  } catch (error: any) {
    console.error('Error fetching secretary phones:', error);
    res.status(500).json({ error: 'Error al obtener teléfonos autorizados' });
  }
});

// POST /api/secretary/phones
router.post('/phones', authenticateToken, tenantContext, async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const { phone, name, role, pin } = req.body;

    if (!phone || !name || !pin) {
      return res.status(400).json({ error: 'Teléfono, nombre y PIN son obligatorios' });
    }

    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'El PIN debe ser exactamente de 4 dígitos numéricos' });
    }

    const created = await createAuthorizedPhone(tenantId, {
      phone,
      name,
      role: role || 'owner',
      pin: cleanPin
    });

    res.json(created);
  } catch (error: any) {
    console.error('Error creating secretary phone:', error);
    res.status(500).json({ error: 'Error al registrar teléfono autorizado' });
  }
});

// PUT /api/secretary/phones/:id
router.put('/phones/:id', authenticateToken, tenantContext, async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { name, role, pin, active } = req.body;

    if (pin && !/^\d{4}$/.test(String(pin).trim())) {
      return res.status(400).json({ error: 'El PIN debe ser de 4 dígitos numéricos' });
    }

    const updated = await updateAuthorizedPhone(id, tenantId, {
      name,
      role,
      pin: pin ? String(pin).trim() : undefined,
      active
    });

    if (!updated) {
      return res.status(404).json({ error: 'Teléfono autorizado no encontrado' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating secretary phone:', error);
    res.status(500).json({ error: 'Error al actualizar teléfono autorizado' });
  }
});

// DELETE /api/secretary/phones/:id
router.delete('/phones/:id', authenticateToken, tenantContext, async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    const success = await deleteAuthorizedPhone(id, tenantId);
    if (!success) {
      return res.status(404).json({ error: 'Teléfono autorizado no encontrado' });
    }

    res.json({ success: true, message: 'Teléfono autorizado eliminado' });
  } catch (error: any) {
    console.error('Error deleting secretary phone:', error);
    res.status(500).json({ error: 'Error al eliminar teléfono autorizado' });
  }
});

// =========================================================================
// ASESOR ESTRATÉGICO DE NEGOCIOS EN EL PORTAL (COPILOT & METRICS)
// =========================================================================

// POST /api/secretary/business-advisor/chat
router.post('/business-advisor/chat', authenticateToken, tenantContext, async (req: any, res) => {
  try {
    const tenantId = req.tenantId;
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // 1. Verificación estricta de BYOK (Bring Your Own Key)
    const tenant = await getTenantById(tenantId);
    if (!tenant?.aiApiKeyEncrypted) {
      return res.status(403).json({
        error: 'BYOK_REQUIRED',
        message: 'El Asesor Estratégico de Negocios requiere que configures tu propia clave de IA (BYOK) en Ajustes > Inteligencia Artificial para operar.'
      });
    }

    // 2. Extracción de métricas de negocio en tiempo real (Costa Rica UTC-6)
    const todayStr = getTodayCR();
    const timeStr = getCurrentTimeCR();

    const [todayStatsRes, monthStatsRes, lowStockRes, topServicesRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) FILTER (WHERE date = $2::date) as today_appointments,
          COUNT(*) FILTER (WHERE date = $2::date AND (payment_status = 'paid' OR status IN ('completed', 'realizada'))) as today_completed,
          COALESCE(SUM(amount) FILTER (WHERE date = $2::date AND payment_status = 'paid'), 0) as today_revenue
        FROM appointments
        WHERE tenant_id = $1
      `, [tenantId, todayStr]),

      query(`
        SELECT 
          COUNT(*) as month_appointments,
          COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0) as month_revenue
        FROM appointments
        WHERE tenant_id = $1 AND date >= DATE_TRUNC('month', $2::date)::date
      `, [tenantId, todayStr]),

      query(`
        SELECT name, stock, price
        FROM products
        WHERE tenant_id = $1 AND active = true AND stock <= 5
        LIMIT 5
      `, [tenantId]),

      query(`
        SELECT service, COUNT(*) as count, SUM(amount) as total
        FROM appointments
        WHERE tenant_id = $1 AND status NOT IN ('cancelled', 'cancelado')
        GROUP BY service
        ORDER BY count DESC
        LIMIT 5
      `, [tenantId])
    ]);

    const todayStats = todayStatsRes.rows[0] || {};
    const monthStats = monthStatsRes.rows[0] || {};
    const lowStockItems = lowStockRes.rows || [];
    const topServices = topServicesRes.rows || [];

    const metricsSnapshot = {
      todayDate: todayStr,
      currentTime: timeStr,
      todayAppointments: parseInt(todayStats.today_appointments || '0', 10),
      todayCompleted: parseInt(todayStats.today_completed || '0', 10),
      todayRevenue: Number(todayStats.today_revenue || 0),
      monthAppointments: parseInt(monthStats.month_appointments || '0', 10),
      monthRevenue: Number(monthStats.month_revenue || 0),
      lowStockCount: lowStockItems.length,
      topServices: topServices.map((s: any) => s.service)
    };

    // 3. Ejecución del LLM con la clave propia del tenant
    const apiKey = decrypt(tenant.aiApiKeyEncrypted);
    const aiConfig = {
      provider: tenant.aiProvider || 'gemini',
      apiKey,
      model: tenant.aiModel || 'gemini-2.5-flash',
      temperature: 0.3
    };

    const systemPrompt = `
Eres el Asesor Estratégico de Negocios y Copilot Empresarial de ${tenant.name || 'este negocio'}.
Tu objetivo es analizar con rigor gerencial y cercanía profesional los datos y operaciones del comercio en Costa Rica para ayudar al dueño a tomar decisiones estratégicas, maximizar sus ingresos y optimizar sus horarios.

MÉTRICAS OFICIALES EN TIEMPO REAL (${todayStr} a las ${timeStr} CR):
• Ingresos cobrados hoy en citas: ₡${metricsSnapshot.todayRevenue.toLocaleString('es-CR')}
• Citas agendadas hoy: ${metricsSnapshot.todayAppointments} (${metricsSnapshot.todayCompleted} completadas)
• Ingresos acumulados del mes: ₡${metricsSnapshot.monthRevenue.toLocaleString('es-CR')} (${metricsSnapshot.monthAppointments} citas en total)
• Servicios más solicitados: ${topServices.map((s: any) => `${s.service} (${s.count} veces)`).join(', ') || 'Sin citas registradas aún'}
• Productos con alerta de stock bajo (<= 5 unid): ${lowStockItems.map((p: any) => `${p.name} (Quedan: ${p.stock})`).join(', ') || 'Inventario saludable'}

PAUTAS DE RESPUESTA:
1. Responde de forma clara, directa, con formato ejecutivo (viñetas, negritas) y calidez costarricense.
2. Si el usuario te hace una pregunta general sobre cómo mejorar ventas, fidelización o reducir cancelaciones, fundamenta tus consejos en las métricas actuales del negocio.
3. Propón tácticas accionables: promociones en horas de baja demanda, recordatorios preventivos y campañas de reactivación.
4. En texto en español NUNCA utilices el signo '&', siempre utiliza la conjunción 'y'.
`.trim();

    const formattedHistory = (conversationHistory || []).map((m: any) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content || ''
    }));

    const response = await callAI(aiConfig, {
      system: systemPrompt,
      messages: [...formattedHistory, { role: 'user', content: message }]
    });

    res.json({
      reply: response.text,
      tokensUsed: response.tokensUsed,
      metricsSnapshot
    });
  } catch (error: any) {
    console.error('Error in business advisor chat:', error);
    res.status(500).json({
      error: 'Error en consulta del asesor',
      message: error?.message || 'Error procesando solicitud con IA'
    });
  }
});

export default router;
