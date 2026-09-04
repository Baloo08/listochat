import { query } from '../db/pool.js';
import { sendMessage } from './evolution.js';
import { notifyGracePeriodStarted, notifyAccountSuspended } from './superadmin-notify.service.js';
import { TilopaySubscriptionService } from './tilopay-subscription.service.js';

/**
 * Checks all tenant subscriptions and executes transitions for trials, grace periods, and suspensions.
 */
export async function checkSubscriptionLifecycles() {
  try {
    const now = new Date();

    // 0. Automatic Recurring Billing via Tilopay (for tenants with auto_billing_enabled = true)
    try {
      await TilopaySubscriptionService.processRecurringBillingBatch();
    } catch (billingErr: any) {
      console.error('[Subscription] Error en lote de cobro recurrente Tilopay:', billingErr.message);
    }

    // 0.1 Check 24-hour advance reminders for Trial and Recurring Renewals
    try {
      // A) Trial ends in <= 24h and reminder not sent yet
      const trialReminders = await query(`
        SELECT id, name, slug, whatsapp_number as "whatsappNumber",
               custom_monthly_price as "monthlyPrice", billing_currency as "currency",
               plan, evolution_instance as "evolutionInstance"
        FROM tenants
        WHERE subscription_status = 'trial'
          AND trial_ends_at IS NOT NULL
          AND trial_ends_at <= CURRENT_TIMESTAMP + INTERVAL '24 hours'
          AND COALESCE(trial_reminder_sent, false) = false
          AND LOWER(COALESCE(plan, '')) != 'aliado'
          AND COALESCE(custom_monthly_price, 29) > 0
      `);

      for (const t of trialReminders.rows) {
        const price = Number(t.monthlyPrice || 55000);
        const currency = t.currency || 'CRC';
        const formattedPrice = currency === 'USD' ? `$${price}` : `₡${price.toLocaleString('es-CR')}`;

        if (t.whatsappNumber) {
          const cleanPhone = t.whatsappNumber.replace(/\D/g, '');
          const reminderMsg = `🔔 *[Recordatorio de Suscripción Betico]*\n\n` +
            `Hola *${t.name}*, te recordamos que mañana concluye tu periodo de prueba gratis de 15 días en Betico.\n\n` +
            `Se realizará la activación y débito mensual de tu plan *${t.plan || 'Pro'}* (*${formattedPrice}*) con tu tarjeta registrada.\n\n` +
            `Si deseas cancelar tu suscripción y evitar el cobro, puedes hacerlo desde tu panel en la sección *Mi Suscripción* antes de que termine el plazo.\n\n` +
            `¡Gracias por confiar en Betico! 🚀`;

          try {
            const instance = t.evolutionInstance || 'betico_soporte' || 'betico_app';
            await sendMessage(instance, cleanPhone, reminderMsg);
          } catch (e) {}
        }

        await query(`UPDATE tenants SET trial_reminder_sent = true WHERE id = $1`, [t.id]);
      }

      // B) Active subscription renewal in <= 24h and reminder not sent in last 25 days
      const billingReminders = await query(`
        SELECT id, name, slug, whatsapp_number as "whatsappNumber",
               custom_monthly_price as "monthlyPrice", billing_currency as "currency",
               plan, evolution_instance as "evolutionInstance"
        FROM tenants
        WHERE subscription_status = 'active'
          AND auto_billing_enabled = true
          AND next_billing_date IS NOT NULL
          AND next_billing_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours'
          AND (billing_reminder_sent_at IS NULL OR billing_reminder_sent_at < CURRENT_TIMESTAMP - INTERVAL '25 days')
          AND LOWER(COALESCE(plan, '')) != 'aliado'
          AND COALESCE(custom_monthly_price, 29) > 0
      `);

      for (const t of billingReminders.rows) {
        const price = Number(t.monthlyPrice || 55000);
        const currency = t.currency || 'CRC';
        const formattedPrice = currency === 'USD' ? `$${price}` : `₡${price.toLocaleString('es-CR')}`;

        if (t.whatsappNumber) {
          const cleanPhone = t.whatsappNumber.replace(/\D/g, '');
          const reminderMsg = `🔔 *[Próxima Renovación Mensual - Betico]*\n\n` +
            `Hola *${t.name}*, te recordamos que en 24 horas se procesará el cobro automático de tu plan *${t.plan || 'Pro'}* (*${formattedPrice}*) con tu tarjeta vinculada.\n\n` +
            `Puedes consultar tu factura o gestionar tu suscripción en cualquier momento desde tu panel en la sección *Mi Suscripción*.\n\n` +
            `¡Gracias por tu confianza! ⭐`;

          try {
            const instance = t.evolutionInstance || 'betico_soporte' || 'betico_app';
            await sendMessage(instance, cleanPhone, reminderMsg);
          } catch (e) {}
        }

        await query(`UPDATE tenants SET billing_reminder_sent_at = CURRENT_TIMESTAMP WHERE id = $1`, [t.id]);
      }
    } catch (reminderErr: any) {
      console.error('[Subscription] Error en escaneo de recordatorios:', reminderErr.message);
    }

    // 1. Check expired trials -> Move to grace_period (moroso) - EXEMPT Plan Aliado
    const expiredTrials = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", 
             custom_monthly_price as "monthlyPrice", billing_currency as "currency",
             evolution_instance as "evolutionInstance"
      FROM tenants
      WHERE subscription_status = 'trial' 
        AND trial_ends_at IS NOT NULL 
        AND trial_ends_at <= CURRENT_TIMESTAMP
        AND LOWER(COALESCE(plan, '')) != 'aliado'
        AND COALESCE(custom_monthly_price, 29) > 0
    `);

    for (const t of expiredTrials.rows) {
      console.log(`[Subscription] Tenant ${t.name} trial has ended. Moving to 15-day grace period...`);
      
      await query(`
        UPDATE tenants
        SET subscription_status = 'grace_period',
            grace_period_ends_at = CURRENT_TIMESTAMP + INTERVAL '15 days',
            next_billing_date = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [t.id]);

      const price = Number(t.monthlyPrice || 29);
      const currency = t.currency || 'CRC';
      const formattedPrice = currency === 'USD' ? `$${price}` : `₡${price.toLocaleString('es-CR')}`;

      // Notify tenant via WhatsApp
      if (t.whatsappNumber) {
        const cleanPhone = t.whatsappNumber.replace(/\D/g, '');
        const reminderMsg = `👋 ¡Hola *${t.name}*! Esperamos que estés disfrutando de Betico.\n\n` +
          `Tu período de prueba de 15 días ha finalizado. Tu mensualidad acordada es de *${formattedPrice}*.` +
          `\n\nCuenta con un *período de gracia de 15 días* para realizar tu pago por SINPE Móvil o transferencia y subir tu comprobante en el panel para continuar disfrutando del servicio sin interrupciones.\n\n¡Gracias por tu confianza!`;
        
        try {
          const instance = t.evolutionInstance || 'betico_soporte' || 'betico_app';
          await sendMessage(instance, cleanPhone, reminderMsg);
        } catch (e) {
          console.error('[Subscription] Error sending tenant reminder:', e);
        }
      }

      // Notify Superadmin
      await notifyGracePeriodStarted({
        tenantName: t.name,
        slug: t.slug,
        phone: t.whatsappNumber || '',
        monthlyPrice: price,
        currency
      });
    }

    // 2. Check expired grace periods -> Move to suspended - EXEMPT Plan Aliado
    const expiredGrace = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber", evolution_instance as "evolutionInstance"
      FROM tenants
      WHERE subscription_status = 'grace_period'
        AND grace_period_ends_at IS NOT NULL
        AND grace_period_ends_at <= CURRENT_TIMESTAMP
        AND LOWER(COALESCE(plan, '')) != 'aliado'
        AND COALESCE(custom_monthly_price, 29) > 0
    `);

    for (const t of expiredGrace.rows) {
      console.log(`[Subscription] Tenant ${t.name} grace period ended. Suspending account...`);

      await query(`
        UPDATE tenants
        SET subscription_status = 'suspended'
        WHERE id = $1
      `, [t.id]);

      // Notify tenant via WhatsApp
      if (t.whatsappNumber) {
        const cleanPhone = t.whatsappNumber.replace(/\D/g, '');
        const suspendedMsg = `🔒 *[Aviso de Suspensión - Betico]*\n\nHola *${t.name}*, tu cuenta ha sido pausada temporalmente tras cumplirse los 15 días de gracia sin registrar pago.\n\nPara reactivar tu tienda y asistente de WhatsApp de inmediato, ingresa a tu panel y adjunta tu comprobante de pago o contáctanos por este medio. ¡Estamos para ayudarte!`;
        
        try {
          const instance = t.evolutionInstance || 'betico_soporte' || 'betico_app';
          await sendMessage(instance, cleanPhone, suspendedMsg);
        } catch (e) {
          console.error('[Subscription] Error sending suspension notice to tenant:', e);
        }
      }

      // Notify Superadmin
      await notifyAccountSuspended({
        tenantName: t.name,
        slug: t.slug,
        phone: t.whatsappNumber || ''
      });
    }

  } catch (error) {
    console.error('[Subscription] Error checking subscription lifecycles:', error);
  }
}

/**
 * Starts the hourly cron worker to check subscription statuses.
 */
export function startSubscriptionLifecycleWorker() {
  console.log('[Subscription] Starting subscription lifecycle worker (checks hourly)...');
  
  // Run initial check after 5 seconds
  setTimeout(() => {
    checkSubscriptionLifecycles();
  }, 5000);

  // Check every hour
  setInterval(() => {
    checkSubscriptionLifecycles();
  }, 60 * 60 * 1000);
}
