import { callAI, getMasterAIConfig } from './ai-provider.js';
import { sendMessage } from './evolution.js';
import { query } from '../db/pool.js';
import { hashPassword } from '../db/users.repo.js';
import { notifyNewTenantEnrollment } from './superadmin-notify.service.js';
import { env } from '../config/env.js';

/**
 * Handles incoming WhatsApp messages for SuperAdmin instances (betico_ventas and betico_soporte).
 */
export async function processSuperadminWhatsAppMessage(params: {
  instanceName: string;
  remoteJid: string;
  pushName: string;
  userMessage: string;
}): Promise<boolean> {
  const { instanceName, remoteJid, pushName, userMessage } = params;
  const cleanPhone = remoteJid.replace(/@.+$/, '').replace(/\D/g, '');

  if (!userMessage.trim()) return false;

  const isSales = instanceName.includes('ventas');
  const masterAI = await getMasterAIConfig();

  if (isSales) {
    // SALES & DEMO BOT
    const systemPrompt = `Eres Betico Sales AI, el Asistente Oficial de Ventas y Demos de Betico.tech en Costa Rica.
Atiendes a prospectos que te escriben por WhatsApp interesados en la plataforma.

🎯 TUS CAPACIDADES Y REGLAS:
1. Habla con tono profesional, tico cálido y convincente (usa "pura vida", formato WhatsApp con *negritas* y emojis amigables).
2. Explica que Betico es la plataforma todo-en-uno que automatiza:
   - Atención por WhatsApp 24/7 con IA (entiende audios y notas de voz ticas).
   - Tienda Online propia sin comisiones (catálogo, variantes, envíos por GPS con Waze).
   - Agenda de Citas y Reservas en línea 24/7 con recordatorios automáticos (reduce 80% inasistencias).
   - Verificación instantánea de SINPE Móvil con visión artificial en 0 segundos.
   - Pantalla de cocina KDS en vivo para restaurantes y multi-sucursal.
3. Comparte los enlaces de demostración en vivo cuando el cliente pregunte:
   - 🍔 Tienda Demo: https://betico-app.qvtdko.easypanel.host/tienda/sabor-urbano
   - 📅 Agenda Demo: https://betico-app.qvtdko.easypanel.host/reservas/estetica-bella
   - 🌐 Web Oficial: https://betico-app.qvtdko.easypanel.host/
4. Planes:
   - Emprendedor: $29/mes (Tienda/Menú QR, WhatsApp IA texto).
   - Profesional: $59/mes (Notas de voz con IA, SINPE automático, KDS de cocina, Difusiones).
   - Franquicias: $119/mes (Hasta 5 sucursales independientes).
5. OFERTA ESPECIAL DE ONBOARDING:
   - Ofrece *15 días de prueba gratis* sin compromiso ni tarjeta de crédito.
   - Si el prospecto desea probar o activar su cuenta, pídele amablemente:
     1. Nombre de su negocio
     2. Nombre de la persona encargada
     3. Correo electrónico para el acceso
   - Cuando el prospecto te entregue estos 3 datos (nombre, negocio y correo), al final de tu respuesta agrega EXACTAMENTE esta etiqueta oculta para que el sistema cree su cuenta:
     [REGISTRO_TRIAL: {"nombre": "Nombre Persona", "negocio": "Nombre Negocio", "correo": "correo@ejemplo.com"}]
`;

    const prompt = `${systemPrompt}\n\nCliente (${pushName || 'Prospecto'}, +${cleanPhone}): "${userMessage}"\nResponde como Betico Sales AI:`;
    const aiResult = await callAI(masterAI, prompt);
    let replyText = aiResult.text || '';

    // Check if AI generated REGISTRO_TRIAL tag
    const trialMatch = replyText.match(/\[REGISTRO_TRIAL:\s*(\{.*?\})\]/s);
    if (trialMatch) {
      try {
        const leadData = JSON.parse(trialMatch[1]);
        replyText = replyText.replace(/\[REGISTRO_TRIAL:\s*\{.*?\}\]/s, '').trim();

        // Create tenant and admin user automatically
        const bName = leadData.negocio || leadData.nombre || 'Mi Negocio';
        const cName = leadData.nombre || pushName || 'Emprendedor';
        const email = (leadData.correo || `${cleanPhone}@betico.cr`).toLowerCase().trim();
        const baseSlug = bName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);
        const slug = baseSlug + '-' + Math.floor(100 + Math.random() * 900);

        const tempPassword = 'Btc' + Math.floor(100000 + Math.random() * 900000) + '!';
        const passwordHash = hashPassword(tempPassword);
        const trialEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

        const tenantRes = await query(`
          INSERT INTO tenants (name, slug, plan, whatsapp_number, custom_monthly_price, billing_currency, subscription_status, trial_ends_at, next_billing_date, active)
          VALUES ($1, $2, 'starter', $3, 29, 'CRC', 'trial', $4, $4, true)
          RETURNING id
        `, [bName, slug, cleanPhone, trialEnd]);

        const tenantId = tenantRes.rows[0].id;

        await query(`
          INSERT INTO users (tenant_id, name, email, password_hash, role, active)
          VALUES ($1, $2, $3, $4, 'admin', true)
        `, [tenantId, cName, email, passwordHash]);

        // Send credentials in follow-up message
        const appLoginUrl = (env.APP_URL || 'https://betico.tech').replace(/\/$/, '') + '/login';
        const welcomeCreds = `🎉 ¡Tu cuenta para *${bName}* ha sido creada exitosamente!\n\n` +
          `🔗 *Enlace de Acceso:* ${appLoginUrl}\n` +
          `👤 *Usuario:* ${email}\n` +
          `🔑 *Contraseña Temporal:* ${tempPassword}\n\n` +
          `⏳ Cuentas con *15 días de prueba gratis* hasta el *${trialEnd.toLocaleDateString('es-CR')}*.\n` +
          `¡Puedes ingresar ahora mismo y escanear el QR de tu WhatsApp!`;

        replyText += '\n\n' + welcomeCreds;

        // Notify Superadmin
        await notifyNewTenantEnrollment({
          tenantName: bName,
          slug,
          contactName: cName,
          email,
          phone: cleanPhone,
          plan: 'starter',
          monthlyPrice: 29,
          currency: 'CRC',
          trialDays: 15,
          isManual: false
        });
      } catch (err) {
        console.error('[SuperadminBot] Error auto-enrolling tenant from WhatsApp lead:', err);
      }
    }

    await sendMessage(instanceName, cleanPhone, replyText);
    return true;

  } else {
    // SUPPORT BOT
    const systemPrompt = `Eres Betico Support AI, el Asistente Oficial de Soporte de Betico.tech.
Tu misión es resolver dudas operativas a usuarios y clientes de la plataforma.

📚 BASE DE CONOCIMIENTOS BETICO:
- Conexión de WhatsApp: Se realiza desde el menú "WhatsApp", haciendo clic en "Conectar" y escaneando el código QR con la app de WhatsApp del celular.
- Tienda Online: Se gestiona en "Productos" y "Ajustes de Tienda". El enlace público es tudominio/tienda/tu-slug.
- Agenda de Citas: Se configura en "Servicios" y "Horarios". El enlace público es tudominio/reservas/tu-slug.
- SINPE Móvil: Los comprobantes se validan automáticamente con visión por computadora si el cliente envía una captura del banco.
- Multi-Sucursal: Disponible en la pestaña "Sucursales" para gestionar múltiples sedes, KDS de cocina separados e inventario.
- Precios y Planes: Emprendedor ($29/mes), Profesional ($59/mes), Franquicias ($119/mes).

🔒 REGLAS DE SEGURIDAD:
- Nunca reveles llaves de API, contraseñas de bases de datos ni secretos de infraestructura.
- Sé cordial, claro, conciso y responde en español costarricense profesional con formato *WhatsApp*.
`;

    const prompt = `${systemPrompt}\n\nUsuario (${pushName || 'Usuario'}, +${cleanPhone}): "${userMessage}"\nResponde como Betico Support AI:`;
    const aiResult = await callAI(masterAI, prompt);
    const replyText = aiResult.text || 'Hola, con gusto te ayudamos. Por favor indícanos con qué módulo necesitas asistencia.';

    await sendMessage(instanceName, cleanPhone, replyText);
    return true;
  }
}
