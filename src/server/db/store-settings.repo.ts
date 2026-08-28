import { query } from './pool.js';
import { StoreSettings } from '../../shared/types.js';

export async function getStoreSettings(tenantId: string): Promise<StoreSettings | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
           restaurant_config as "restaurantConfig", delivery_config as "deliveryConfig", store_name as "storeName",
           store_slug as "storeSlug", store_description as "storeDescription", store_logo_url as "storeLogoUrl",
           store_banner_url as "storeBannerUrl", store_theme as "storeTheme", currency,
           accept_sinpe as "acceptSinpe", sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
           accept_transfer as "acceptTransfer", bank_account_info as "bankAccountInfo",
           accept_cash_on_delivery as "acceptCashOnDelivery", delivery_enabled as "deliveryEnabled",
           delivery_fee as "deliveryFee", pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
           min_order_amount as "minOrderAmount", store_message as "storeMessage"
    FROM store_settings 
    WHERE tenant_id = $1
  `, [tenantId]);
  
  return result.rows[0] || null;
}

export async function upsertStoreSettings(tenantId: string, data: Partial<StoreSettings>): Promise<StoreSettings> {
  const result = await query(`
    INSERT INTO store_settings (
      tenant_id, store_enabled, store_mode, restaurant_config, delivery_config, store_name, store_slug, store_description, store_logo_url,
      store_banner_url, store_theme, currency, accept_sinpe, sinpe_phone, sinpe_name,
      accept_transfer, bank_account_info, accept_cash_on_delivery, delivery_enabled,
      delivery_fee, pickup_enabled, whatsapp_checkout, min_order_amount, store_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    ON CONFLICT (tenant_id) DO UPDATE SET
      store_enabled = EXCLUDED.store_enabled,
      store_mode = EXCLUDED.store_mode,
      restaurant_config = EXCLUDED.restaurant_config,
      delivery_config = EXCLUDED.delivery_config,
      store_name = EXCLUDED.store_name,
      store_slug = EXCLUDED.store_slug,
      store_description = EXCLUDED.store_description,
      store_logo_url = EXCLUDED.store_logo_url,
      store_banner_url = EXCLUDED.store_banner_url,
      store_theme = EXCLUDED.store_theme,
      currency = EXCLUDED.currency,
      accept_sinpe = EXCLUDED.accept_sinpe,
      sinpe_phone = EXCLUDED.sinpe_phone,
      sinpe_name = EXCLUDED.sinpe_name,
      accept_transfer = EXCLUDED.accept_transfer,
      bank_account_info = EXCLUDED.bank_account_info,
      accept_cash_on_delivery = EXCLUDED.accept_cash_on_delivery,
      delivery_enabled = EXCLUDED.delivery_enabled,
      delivery_fee = EXCLUDED.delivery_fee,
      pickup_enabled = EXCLUDED.pickup_enabled,
      whatsapp_checkout = EXCLUDED.whatsapp_checkout,
      min_order_amount = EXCLUDED.min_order_amount,
      store_message = EXCLUDED.store_message,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
           restaurant_config as "restaurantConfig", delivery_config as "deliveryConfig", store_name as "storeName",
           store_slug as "storeSlug", store_description as "storeDescription", store_logo_url as "storeLogoUrl",
           store_banner_url as "storeBannerUrl", store_theme as "storeTheme", currency,
           accept_sinpe as "acceptSinpe", sinpe_phone as "sinpePhone", sinpe_name as "sinpeName",
           accept_transfer as "acceptTransfer", bank_account_info as "bankAccountInfo",
           accept_cash_on_delivery as "acceptCashOnDelivery", delivery_enabled as "deliveryEnabled",
           delivery_fee as "deliveryFee", pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
           min_order_amount as "minOrderAmount", store_message as "storeMessage"
  `, [
    tenantId, data.storeEnabled || false, data.storeMode || 'retail', data.restaurantConfig ? JSON.stringify(data.restaurantConfig) : null,
    data.deliveryConfig ? JSON.stringify(data.deliveryConfig) : null, data.storeName || '', data.storeSlug || '', data.storeDescription,
    data.storeLogoUrl, data.storeBannerUrl, data.storeTheme ? JSON.stringify(data.storeTheme) : null, data.currency || 'CRC', data.acceptSinpe !== false,
    data.sinpePhone, data.sinpeName, data.acceptTransfer !== false, data.bankAccountInfo,
    data.acceptCashOnDelivery || false, data.deliveryEnabled || false, data.deliveryFee || 0,
    data.pickupEnabled !== false, data.whatsappCheckout !== false, data.minOrderAmount || 0, data.storeMessage
  ]);
  
  return result.rows[0];
}

export const saveStoreSettings = upsertStoreSettings;
