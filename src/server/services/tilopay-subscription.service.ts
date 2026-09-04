import { query } from '../db/pool.js';
import { getTenantPaymentConfigRaw } from '../db/tenant-payment.repo.js';
import { CryptoService } from './crypto.service.js';
import {
  saveBillingCard,
  getDefaultBillingCard,
  createBillingCharge,
  updateBillingCharge,
  getTenantsDueForAutoBilling
} from '../db/tenant-billing.repo.js';
import { sendMessage } from './evolution.js';
import { env } from '../config/env.js';

interface PlatformTilopayConfig {
  apiKey: string;
  apiUser: string;
  apiPassword: string;
  environment: 'SANDBOX' | 'PRODUCTION';
}

/**
 * Retrieves Tilopay credentials for the platform (SuperAdmin billing to tenants).
 */
export async function getPlatformTilopayConfig(): Promise<PlatformTilopayConfig | null> {
  // 1. Check environment variables
  if (process.env.TILOPAY_PLATFORM_KEY && process.env.TILOPAY_PLATFORM_USER && process.env.TILOPAY_PLATFORM_PASSWORD) {
    return {
      apiKey: process.env.TILOPAY_PLATFORM_KEY,
      apiUser: process.env.TILOPAY_PLATFORM_USER,
      apiPassword: process.env.TILOPAY_PLATFORM_PASSWORD,
      environment: (process.env.TILOPAY_PLATFORM_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX')
    };
  }

  // 2. Check superadmin tenant in tenant_payment_configs
  try {
    const superadminTenant = await query(`SELECT id FROM tenants WHERE slug = 'superadmin' LIMIT 1`);
    if (superadminTenant.rows.length > 0) {
      const config = await getTenantPaymentConfigRaw(superadminTenant.rows[0].id);
      if (config && config.isEnabled && config.apiKey && config.apiUser && config.apiPassword) {
        return {
          apiKey: config.apiKey,
          apiUser: config.apiUser,
          apiPassword: config.apiPassword,
          environment: config.environment || 'SANDBOX'
        };
      }
    }
  } catch (e) {}

  // 3. Fallback: Any active tenant payment config with isEnabled
  try {
    const anyConfigRes = await query(`
      SELECT t.id, c.api_key, c.api_user, c.api_password_encrypted, c.environment
      FROM tenant_payment_configs c
      JOIN tenants t ON t.id = c.tenant_id
      WHERE c.is_enabled = true AND c.api_key IS NOT NULL
      ORDER BY t.created_at ASC
      LIMIT 1
    `);
    if (anyConfigRes.rows.length > 0) {
      const r = anyConfigRes.rows[0];
      const apiPassword = CryptoService.decryptForTenant(r.id, r.api_password_encrypted);
      return {
        apiKey: r.api_key,
        apiUser: r.api_user,
        apiPassword,
        environment: r.environment || 'SANDBOX'
      };
    }
  } catch (e) {}

  return null;
}

/**
 * Service for managing Tenant Subscriptions with Tilopay.
 */
export class TilopaySubscriptionService {
  private static getBaseUrl(envType: 'SANDBOX' | 'PRODUCTION'): string {
    return 'https://app.tilopay.com/api/v1';
  }

  /**
   * Gets SDK JWT token for platform Tilopay account.
   */
  private static async getPlatformJwt(cfg: PlatformTilopayConfig): Promise<string> {
    const baseUrl = this.getBaseUrl(cfg.environment);
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cfg.apiUser.trim(),
        password: cfg.apiPassword.trim()
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.message || data.error || 'Fallo de autenticación con Tilopay (Plataforma).');
    }

    return data.access_token;
  }

  /**
   * Tokenizes a credit/debit card and stores the encrypted token in DB.
   */
  static async registerTenantCard(
    tenantId: string,
    cardData: {
      cardNumber: string;
      expMonth: string;
      expYear: string;
      cvv: string;
      cardHolder: string;
    }
  ): Promise<{ success: boolean; cardLast4: string; cardBrand: string }> {
    const platformCfg = await getPlatformTilopayConfig();
    if (!platformCfg) {
      throw new Error('La plataforma no tiene credenciales de Tilopay configuradas para cobro de suscripciones.');
    }

    const cleanCardNumber = cardData.cardNumber.replace(/\s+/g, '');
    const last4 = cleanCardNumber.slice(-4);
    
    // Determine card brand from number
    let brand = 'CARD';
    if (/^4/.test(cleanCardNumber)) brand = 'VISA';
    else if (/^5[1-5]/.test(cleanCardNumber)) brand = 'MASTERCARD';
    else if (/^3[47]/.test(cleanCardNumber)) brand = 'AMEX';

    const jwt = await this.getPlatformJwt(platformCfg);
    const baseUrl = this.getBaseUrl(platformCfg.environment);

    // Call Tilopay tokenize endpoint
    const tokenizeRes = await fetch(`${baseUrl}/tokenize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: platformCfg.apiKey,
        cardNumber: cleanCardNumber,
        expMonth: cardData.expMonth.padStart(2, '0'),
        expYear: cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear,
        cvv: cardData.cvv,
        cardHolder: cardData.cardHolder.trim()
      })
    });

    const tokenizeData = await tokenizeRes.json().catch(() => ({}));

    // In Tilopay, the token is returned in `token`, `card_token`, or `id`
    const token = tokenizeData.token || tokenizeData.card_token || tokenizeData.id;
    if (!tokenizeRes.ok || !token) {
      console.error('[TilopaySubscription] Falló tokenización:', tokenizeData);
      throw new Error(tokenizeData.message || tokenizeData.error || 'Tilopay no pudo tokenizar la tarjeta. Verifica los datos.');
    }

    // Encrypt token using CryptoService for this tenant
    const encryptedToken = CryptoService.encryptForTenant(tenantId, token);

    // Save to tenant_billing_cards
    await saveBillingCard(tenantId, {
      last4,
      brand: tokenizeData.brand || brand,
      holder: cardData.cardHolder.trim(),
      tokenEncrypted: encryptedToken,
      isDefault: true
    });

    return {
      success: true,
      cardLast4: last4,
      cardBrand: tokenizeData.brand || brand
    };
  }

  /**
   * Executes a subscription charge for a tenant using their saved card token.
   */
  static async chargeTenantSubscription(
    tenantId: string,
    isManual = false
  ): Promise<{ success: boolean; message: string; transactionId?: string; orderNumber: string }> {
    // 1. Fetch tenant data
    const tenantRes = await query(`
      SELECT id, name, slug, whatsapp_number as "whatsappNumber",
             custom_monthly_price as "customMonthlyPrice",
             billing_currency as "billingCurrency",
             evolution_instance as "evolutionInstance"
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (tenantRes.rows.length === 0) {
      throw new Error('Tenant no encontrado.');
    }

    const tenant = tenantRes.rows[0];
    const amount = Number(tenant.customMonthlyPrice || 29);
    const currency = tenant.billingCurrency || 'CRC';

    // 2. Fetch default billing card
    const card = await getDefaultBillingCard(tenantId);
    if (!card) {
      throw new Error('El tenant no tiene ninguna tarjeta de pago registrada.');
    }

    // 3. Decrypt card token
    const cardToken = CryptoService.decryptForTenant(tenantId, card.tilopayTokenEncrypted);
    if (!cardToken) {
      throw new Error('No fue posible recuperar el token de la tarjeta.');
    }

    // 4. Fetch platform Tilopay credentials
    const platformCfg = await getPlatformTilopayConfig();
    if (!platformCfg) {
      throw new Error('Credenciales de Tilopay de la plataforma no configuradas.');
    }

    const jwt = await this.getPlatformJwt(platformCfg);
    const baseUrl = this.getBaseUrl(platformCfg.environment);

    const orderNumber = `SUB-${tenant.slug.substring(0, 8)}-${Date.now()}`;
    const cleanPhone = (tenant.whatsappNumber || '88888888').replace(/\D/g, '') || '88888888';
    const appUrl = (env.APP_URL || 'https://betico.tech').replace(/\/$/, '');

    // Record pending charge
    const charge = await createBillingCharge({
      tenantId,
      billingCardId: card.id,
      amount,
      currency,
      status: 'pending',
      tilopayOrderNumber: orderNumber
    });

    // 5. Call Tilopay Charge endpoint
    const chargePayload = {
      key: platformCfg.apiKey,
      token: cardToken,
      amount: amount.toFixed(2),
      currency: currency,
      billToFirstName: tenant.name.split(' ')[0] || 'Cliente',
      billToLastName: tenant.name.split(' ').slice(1).join(' ') || 'Tenant',
      billToEmail: 'billing@betico.cr',
      billToAddress: 'Costa Rica',
      billToAddress2: 'N/A',
      billToCity: 'San Jose',
      billToState: 'SJ',
      billToZip: '10101',
      billToCountry: 'CR',
      billToTelephone: cleanPhone,
      orderNumber,
      redirect: `${appUrl}/admin`,
      callback: `${appUrl}/api/webhooks/tilopay`
    };

    let chargeRes: Response;
    let chargeData: any = {};
    try {
      chargeRes = await fetch(`${baseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chargePayload)
      });
      chargeData = await chargeRes.json().catch(() => ({}));
    } catch (netErr: any) {
      await updateBillingCharge(orderNumber, {
        status: 'failed',
        failureReason: `Error de red: ${netErr.message}`
      });
      throw new Error(`Error de conexión con Tilopay: ${netErr.message}`);
    }

    const isApproved =
      chargeRes.ok &&
      (chargeData.status === 'approved' ||
       chargeData.status === 'success' ||
       chargeData.result_code === '1' ||
       chargeData.result_code === '00' ||
       chargeData.approved === true);

    const transactionId = chargeData.transaction_id || chargeData.transactionId || chargeData.id;
    const authCode = chargeData.auth_code || chargeData.authCode;

    if (isApproved) {
      // SUCCESS: Update charge record
      await updateBillingCharge(orderNumber, {
        status: 'success',
        transactionId: String(transactionId || ''),
        authCode: String(authCode || '')
      });

      // Update tenant subscription: +30 days, status active
      await query(`
        UPDATE tenants
        SET subscription_status = 'active',
            next_billing_date = CURRENT_TIMESTAMP + INTERVAL '30 days',
            grace_period_ends_at = null,
            last_payment_amount = $1,
            last_payment_ref = $2,
            last_auto_charge_at = CURRENT_TIMESTAMP,
            last_auto_charge_status = 'success',
            active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [amount, `Tilopay #${transactionId || orderNumber}`, tenantId]);

      // Record in tenant_payments history
      await query(`
        INSERT INTO tenant_payments (tenant_id, amount, currency, payment_method, reference, notes, status)
        VALUES ($1, $2, $3, 'card', $4, $5, 'approved')
      `, [tenantId, amount, currency, String(transactionId || orderNumber), `Cobro automático de suscripción (Tarjeta termina en ${card.cardLast4})`]);

      // Send WhatsApp receipt to tenant
      if (tenant.whatsappNumber) {
        const priceStr = currency === 'USD' ? `$${amount}` : `₡${amount.toLocaleString('es-CR')}`;
        const receiptMsg = `✅ *[Pago de Suscripción Exitoso - Betico]*\n\n` +
          `Hola *${tenant.name}*, tu mensualidad de *${priceStr}* ha sido cobrada exitosamente a tu tarjeta terminada en *${card.cardLast4}*.\n\n` +
          `📋 *Referencia:* ${transactionId || orderNumber}\n` +
          `📅 *Próximo cobro:* ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CR')}\n\n` +
          `¡Gracias por seguir impulsando tu negocio con Betico! 🚀`;

        try {
          await sendMessage('betico_soporte', cleanPhone, receiptMsg);
        } catch (e) {}
      }

      return {
        success: true,
        message: 'Cobro procesado exitosamente y suscripción renovada por 30 días.',
        transactionId: String(transactionId || ''),
        orderNumber
      };
    } else {
      // FAILED
      const reason = chargeData.message || chargeData.error || `HTTP ${chargeRes.status}: Transacción rechazada por el banco emisor.`;
      
      await updateBillingCharge(orderNumber, {
        status: 'failed',
        failureReason: reason
      });

      await query(`
        UPDATE tenants
        SET last_auto_charge_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [tenantId]);

      return {
        success: false,
        message: `Cobro rechazado: ${reason}`,
        orderNumber
      };
    }
  }

  /**
   * Background batch worker for automatic recurring billing.
   * Scans for tenants with auto_billing_enabled = true and next_billing_date <= NOW().
   */
  static async processRecurringBillingBatch(): Promise<{ processed: number; successCount: number; failedCount: number }> {
    console.log('[TilopayAutoBilling] Escaneando suscripciones vencidas para cobro automático...');
    const dueTenants = await getTenantsDueForAutoBilling();
    console.log(`[TilopayAutoBilling] Encontrados ${dueTenants.length} tenants listos para cobro automático.`);

    let successCount = 0;
    let failedCount = 0;

    for (const t of dueTenants) {
      try {
        console.log(`[TilopayAutoBilling] Procesando cobro automático para: ${t.name} (${t.slug})...`);
        const res = await this.chargeTenantSubscription(t.id, false);
        if (res.success) {
          successCount++;
          console.log(`[TilopayAutoBilling] ✅ Cobro exitoso para ${t.name}: ${res.transactionId}`);
        } else {
          failedCount++;
          console.warn(`[TilopayAutoBilling] ❌ Cobro rechazado para ${t.name}: ${res.message}`);
        }
      } catch (err: any) {
        failedCount++;
        console.error(`[TilopayAutoBilling] Error procesando cobro para ${t.name}:`, err.message);
      }
    }

    return { processed: dueTenants.length, successCount, failedCount };
  }
}