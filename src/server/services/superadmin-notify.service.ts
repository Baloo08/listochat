import { query } from '../db/pool.js';
import { sendMessage } from './evolution.js';

/**
 * Retrieves the superadmin notification phone configured in platform_settings.
 */
export async function getSuperadminNotifyPhone(): Promise<string | null> {
  try {
    const res = await query(`SELECT value FROM platform_settings WHERE key = 'superadmin_notify_phone'`);
    if (res.rows.length > 0 && res.rows[0].value) {
      return res.rows[0].value.replace(/\D/g, '');
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Sends a notification message to the SuperAdmin's WhatsApp number.
 */
export async function sendSuperadminAlert(message: string): Promise<boolean> {
  try {
    const phone = await getSuperadminNotifyPhone();
    if (!phone || phone.length < 8) {
      return false;
    }

    // Use default platform/soporte instance to deliver the alert
    const instanceRes = await query(`
      SELECT instance_name FROM superadmin_instances WHERE status = 'connected' LIMIT 1
    `);
    const instanceName = instanceRes.rows[0]?.instance_name || 'betico_soporte' || 'betico_app';

    await sendMessage(instanceName, phone, message);
    return true;
  } catch (err) {
    console.error('[SuperadminNotify] Error sending alert to superadmin:', err);
    return false;
  }
}

/**
 * Notifies SuperAdmin of a newly enrolled tenant.
 */
export async function notifyNewTenantEnrollment(params: {
  tenantName: string;
  slug: string;
  contactName: string;
  email: string;
  phone: string;
  plan: string;
  monthlyPrice: number;
  currency: string;
  trialDays: number;
  isManual: boolean;
}) {
  const priceFormatted = params.currency === 'USD' ? `$${params.monthlyPrice}` : `₡${params.monthlyPrice.toLocaleString('es-CR')}`;
  const originText = params.isManual ? 'Manual desde Panel' : 'Bot Autónomo de WhatsApp';
  
  const text = `🎉 *[Nuevo Negocio Registrado - Betico]*\n\n` +
    `🏢 *Negocio:* ${params.tenantName} (\`${params.slug}\`)\n` +
    `👤 *Contacto:* ${params.contactName}\n` +
    `📧 *Correo:* ${params.email}\n` +
    `📱 *WhatsApp:* +${params.phone}\n` +
    `📦 *Plan:* ${params.plan.toUpperCase()}\n` +
    `💵 *Tarifa Acordada:* ${priceFormatted}/mes\n` +
    `⏳ *Período de Prueba:* ${params.trialDays} días gratis\n` +
    `📍 *Origen:* ${originText}`;

  await sendSuperadminAlert(text);
}

/**
 * Notifies SuperAdmin when a tenant uploads a payment receipt.
 */
export async function notifyPaymentProofUploaded(params: {
  tenantName: string;
  slug: string;
  amount: number;
  currency: string;
  reference: string;
  notes?: string;
}) {
  const priceFormatted = params.currency === 'USD' ? `$${params.amount}` : `₡${params.amount.toLocaleString('es-CR')}`;

  const text = `💳 *[Comprobante de Pago Recibido - Betico]*\n\n` +
    `🏢 *Negocio:* ${params.tenantName} (\`${params.slug}\`)\n` +
    `💰 *Monto Reportado:* ${priceFormatted}\n` +
    `🔢 *Referencia / SINPE:* ${params.reference || 'No especificada'}\n` +
    `${params.notes ? `📝 *Nota:* ${params.notes}\n` : ''}\n` +
    `👉 Ingresa a tu panel de SuperAdmin en la pestaña *Inquilinos* para verificar el comprobante y renovar la suscripción.`;

  await sendSuperadminAlert(text);
}

/**
 * Notifies SuperAdmin when a tenant enters the 15-day grace period (moroso).
 */
export async function notifyGracePeriodStarted(params: {
  tenantName: string;
  slug: string;
  phone: string;
  monthlyPrice: number;
  currency: string;
}) {
  const priceFormatted = params.currency === 'USD' ? `$${params.monthlyPrice}` : `₡${params.monthlyPrice.toLocaleString('es-CR')}`;

  const text = `⏳ *[Inicio de Periodo de Gracia - Morosidad]*\n\n` +
    `🏢 *Negocio:* ${params.tenantName} (\`${params.slug}\`)\n` +
    `📱 *Teléfono:* +${params.phone}\n` +
    `💵 *Monto Pendiente:* ${priceFormatted}\n` +
    `⚠️ Ha vencido su período de prueba o suscripción. Cuenta con *15 días de gracia* para realizar el pago antes de la suspensión automática del servicio.`;

  await sendSuperadminAlert(text);
}

/**
 * Notifies SuperAdmin when a tenant account is suspended after grace period.
 */
export async function notifyAccountSuspended(params: {
  tenantName: string;
  slug: string;
  phone: string;
}) {
  const text = `🔒 *[Cuenta Suspendida por Morosidad]*\n\n` +
    `🏢 *Negocio:* ${params.tenantName} (\`${params.slug}\`)\n` +
    `📱 *Teléfono:* +${params.phone}\n` +
    `🚫 Se han cumplido los 15 días de gracia sin registrar pago. El acceso al panel y el bot de WhatsApp del negocio han sido suspendidos automáticamente.`;

  await sendSuperadminAlert(text);
}

/**
 * Notifies SuperAdmin when a payment is approved and renewed.
 */
export async function notifyPaymentApproved(params: {
  tenantName: string;
  slug: string;
  renewedUntil: string;
}) {
  const text = `✅ *[Suscripción Renovada con Éxito]*\n\n` +
    `🏢 *Negocio:* ${params.tenantName} (\`${params.slug}\`)\n` +
    `🎉 Has aprobado el pago. El servicio se encuentra activo y la próxima fecha de cobro es el *${params.renewedUntil}*.`;

  await sendSuperadminAlert(text);
}
