import { getTenantPaymentConfigRaw } from '../db/tenant-payment.repo.js';
import { getOrderById } from '../db/orders.repo.js';
import { env } from '../config/env.js';

interface TokenCacheEntry {
  token: string;
  expiresAt: number; // Unix timestamp ms
}

const tokenCache = new Map<string, TokenCacheEntry>();

export class TilopayTenantService {
  private static getBaseUrl(environment: 'SANDBOX' | 'PRODUCTION'): string {
    // La API oficial de Tilopay (tanto en pruebas/sandbox como producción) opera sobre app.tilopay.com
    return 'https://app.tilopay.com/api/v1';
  }

  /**
   * Clears cached tokens for a tenant (useful when credentials are saved or rotated).
   */
  static clearTokenCache(tenantId: string): void {
    tokenCache.delete(`tilopay_jwt:${tenantId}:SANDBOX`);
    tokenCache.delete(`tilopay_jwt:${tenantId}:PRODUCTION`);
  }

  /**
   * Diagnostic method to test credentials against Tilopay prior to saving.
   * Uses Tilopay's official authentication endpoint: POST /api/v1/login
   * with email (API User) and password.
   */
  static async verifyCredentials(
    apiKey: string,
    apiUser: string,
    apiPassword: string,
    environment: 'SANDBOX' | 'PRODUCTION'
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey || !apiUser || !apiPassword) {
      return { success: false, message: 'Todos los campos de credenciales son requeridos.' };
    }

    const baseUrl = this.getBaseUrl(environment);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: apiUser.trim(),
          password: apiPassword.trim()
        }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) {
        const errorMsg = data.message || data.error || `HTTP ${res.status}: Credenciales de Tilopay inválidas. Verifica tu usuario y contraseña.`;
        return { success: false, message: errorMsg };
      }

      return { success: true, message: 'Credenciales de Tilopay verificadas exitosamente.' };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
      const msg = isTimeout ? 'Tiempo de espera agotado al conectar con Tilopay (10s)' : err.message;
      return { success: false, message: `Error de red al conectar con Tilopay: ${msg}` };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Retrieves or refreshes an isolated SDK JWT token for a specific tenant.
   * Multi-tenant isolated via composite cache key: `tilopay_jwt:${tenantId}:${env}`.
   */
  static async getSdkToken(tenantId: string): Promise<{ token: string; apiKey: string; environment: 'SANDBOX' | 'PRODUCTION' }> {
    if (!env.TILOPAY_MODULE_ENABLED) {
      throw new Error('El módulo de Tilopay se encuentra temporalmente inactivo.');
    }

    const config = await getTenantPaymentConfigRaw(tenantId);
    if (!config || !config.isEnabled) {
      throw new Error('La pasarela de pagos Tilopay no está activada para este comercio.');
    }
    if (!config.apiKey || !config.apiUser || !config.apiPassword) {
      throw new Error('Credenciales de Tilopay incompletas para este comercio.');
    }

    const cacheKey = `tilopay_jwt:${tenantId}:${config.environment}`;
    const cached = tokenCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return {
        token: cached.token,
        apiKey: config.apiKey,
        environment: config.environment
      };
    }

    const baseUrl = this.getBaseUrl(config.environment);
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: config.apiUser.trim(),
        password: config.apiPassword.trim()
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.message || data.error || 'No fue posible autenticar con Tilopay');
    }

    const token = data.access_token;
    // Buffer of 60 seconds prior to expiration (expires_in is in seconds, e.g. 86400)
    const expiresInSeconds = Number(data.expires_in) || 86400;
    const expiresAt = now + Math.max(60, expiresInSeconds - 60) * 1000;

    tokenCache.set(cacheKey, { token, expiresAt });

    return {
      token,
      apiKey: config.apiKey,
      environment: config.environment
    };
  }

  /**
   * Generates client-side session parameters and hosted checkout URL on Tilopay.
   * Calls official POST /api/v1/processPayment with Bearer token.
   */
  static async createPaymentSession(tenantId: string, orderId: string): Promise<{
    orderId: string;
    orderNumber: number;
    amount: number;
    currency: string;
    paymentUrl: string;
    sdkToken: string;
    apiKey: string;
    environment: 'SANDBOX' | 'PRODUCTION';
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    captureMode: string;
  }> {
    const order = await getOrderById(orderId, tenantId);
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    if (order.paymentStatus === 'paid' || (order.paymentStatus as any) === 'PAID') {
      throw new Error('Esta orden ya se encuentra pagada');
    }

    if (order.status === 'cancelado' || (order.status as any) === 'cancelled') {
      throw new Error('Esta orden fue cancelada y no puede ser procesada');
    }

    const { token: sdkToken, apiKey, environment } = await this.getSdkToken(tenantId);
    const config = (await getTenantPaymentConfigRaw(tenantId))!;
    const baseUrl = this.getBaseUrl(environment);

    const nameParts = (order.customerName || 'Cliente').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Cliente';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const cleanPhone = (order.customerPhone || '88888888').replace(/\D/g, '') || '88888888';
    const appUrl = (env.APP_URL || 'https://betico.tech').replace(/\/$/, '');

    const paymentPayload = {
      key: apiKey,
      amount: Number(order.total).toFixed(2),
      currency: (order.currency || 'CRC').toUpperCase(),
      billToFirstName: firstName,
      billToLastName: lastName,
      billToEmail: order.customerEmail || 'cliente@betico.cr',
      billToAddress: order.customerAddress || 'Costa Rica',
      billToAddress2: 'N/A',
      billToCity: 'San Jose',
      billToState: 'SJ',
      billToZip: '10101',
      billToCountry: 'CR',
      billToTelephone: cleanPhone,
      orderNumber: `ORD-${order.orderNumber}`,
      redirect: `${appUrl}/order/success/${order.id}`,
      callback: `${appUrl}/api/webhooks/tilopay`
    };

    const paymentRes = await fetch(`${baseUrl}/processPayment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sdkToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await paymentRes.json().catch(() => ({}));
    if (!paymentRes.ok || !paymentData.url) {
      console.error('[TilopayProcessPayment] Falló la creación de pasarela:', paymentData);
      throw new Error(paymentData.message || paymentData.error || 'No fue posible generar el enlace de pago con Tilopay');
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency || 'CRC',
      paymentUrl: paymentData.url,
      sdkToken,
      apiKey,
      environment,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      captureMode: config.captureMode || 'IMMEDIATE'
    };
  }
}
