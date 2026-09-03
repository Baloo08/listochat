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
      const res = await fetch(`${baseUrl}/loginSdk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim(),
          api_user: apiUser.trim(),
          password: apiPassword.trim()
        }),
        signal: controller.signal
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || (!data.access_token && !data.token)) {
        const errorMsg = data.message || data.error || `HTTP ${res.status}: Autenticación fallida con Tilopay`;
        return { success: false, message: errorMsg };
      }

      return { success: true, message: 'Conexión con Tilopay verificada exitosamente.' };
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
    const res = await fetch(`${baseUrl}/loginSdk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.apiKey,
        api_user: config.apiUser,
        password: config.apiPassword
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || (!data.access_token && !data.token)) {
      throw new Error(data.message || data.error || 'No fue posible autenticar con Tilopay');
    }

    const token = data.access_token || data.token;
    // Buffer of 60 seconds prior to expiration
    const expiresInSeconds = Number(data.expires_in) || 3600;
    const expiresAt = now + Math.max(60, expiresInSeconds - 60) * 1000;

    tokenCache.set(cacheKey, { token, expiresAt });

    return {
      token,
      apiKey: config.apiKey,
      environment: config.environment
    };
  }

  /**
   * Generates client-side session parameters for mounting the Tilopay JS SDK V2.
   * Checks order validity, amount and returns public token + order info.
   */
  static async createPaymentSession(tenantId: string, orderId: string): Promise<{
    orderId: string;
    orderNumber: number;
    amount: number;
    currency: string;
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

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: order.currency || 'CRC',
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
