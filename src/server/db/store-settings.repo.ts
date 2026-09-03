import { query } from './pool.js';
import { StoreSettings } from '../../shared/types.js';

export async function getStoreSettings(tenantId: string): Promise<StoreSettings | null> {
  const result = await query(`
    SELECT id, tenant_id as "tenantId", store_enabled as "storeEnabled", store_mode as "storeMode",
           store_modules as "storeModules", restaurant_config as "restaurantConfig",
           delivery_config as "deliveryConfig", correos_cr_config as "correosCrConfig",
           local_delivery_config as "localDeliveryConfig", store_schedule as "storeSchedule",
           custom_stages as "customStages", notification_templates as "notificationTemplates",
           store_name as "storeName", store_slug as "storeSlug", store_description as "storeDescription",
           store_logo_url as "storeLogoUrl", store_banner_url as "storeBannerUrl",
           store_theme as "storeTheme", currency, accept_sinpe as "acceptSinpe",
           accept_sinpe_tilopay as "acceptSinpeTilopay",
           sinpe_phone as "sinpePhone", sinpe_name as "sinpeName", accept_transfer as "acceptTransfer",
           bank_account_info as "bankAccountInfo", accept_cash_on_delivery as "acceptCashOnDelivery",
           delivery_enabled as "deliveryEnabled", delivery_fee as "deliveryFee",
           pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
           min_order_amount as "minOrderAmount", store_message as "storeMessage"
    FROM store_settings 
    WHERE tenant_id = $1
  `, [tenantId]);
  
  const row = result.rows[0];
  if (!row) return null;

  const storeTheme = row.storeTheme || {};
  const storeLogoUrl = row.storeLogoUrl || storeTheme.logoUrl || '';
  const storeBannerUrl = row.storeBannerUrl || storeTheme.bannerUrl || '';

  return {
    ...row,
    storeLogoUrl,
    storeBannerUrl,
    storeModules: row.storeModules || { storeEnabled: true, bookingsEnabled: true },
    storeSchedule: row.storeSchedule || { isOpenManual: true, autoScheduleEnabled: false, schedule: {} },
    correosCrConfig: row.correosCrConfig || {
      enabled: true,
      serviceType: 'pyme',
      originType: 'GAM',
      includeIva: true,
      rates: [
        { label: 'Pymes Liviano (0 a 500 g)', minGrams: 0, maxGrams: 500, gamPrice: 1100, restoPrice: 1350 },
        { label: 'Pymes Especial Gold (0 a 2 kg)', minGrams: 501, maxGrams: 2000, gamPrice: 1769.91, restoPrice: 2477.88 },
        { label: 'Pyme Plus (0 a 3 kg)', minGrams: 2001, maxGrams: 3000, gamPrice: 2425, restoPrice: 3360 },
        { label: 'Carga Liviana (3 a 10 kg)', minGrams: 3001, maxGrams: 10000, gamPrice: 3982.30, restoPrice: 3982.30 },
        { label: 'Pesado Express (10 a 20 kg)', minGrams: 10001, maxGrams: 20000, gamPrice: 9800, restoPrice: 9800, extraPerKg: 1000 },
        { label: 'Pesado Express (20 a 30 kg)', minGrams: 20001, maxGrams: 30000, gamPrice: 14000, restoPrice: 14000, extraPerKg: 1000 }
      ]
    },
    localDeliveryConfig: row.localDeliveryConfig || { enabled: true, fee: 2500, freeAbove: 35000, estimatedHours: '24 a 48 horas' },
    customStages: row.customStages || (row.storeMode === 'restaurant' ? {
      fase_1: 'Comanda Recibida',
      fase_2: 'En Cocina / Preparación',
      fase_3: 'Listo para Servir / Entregar',
      fase_4: 'En Camino (Delivery)',
      fase_5: 'Entregado / Servido'
    } : {
      fase_1: 'Pedido Recibido',
      fase_2: 'En Empaque / Preparación',
      fase_3: 'Listo para Despacho',
      fase_4: 'En Tránsito (Delivery / Guía)',
      fase_5: 'Entregado con Éxito'
    })
  };
}

export async function upsertStoreSettings(tenantId: string, data: Partial<StoreSettings>): Promise<StoreSettings> {
  const result = await query(`
    INSERT INTO store_settings (
      tenant_id, store_enabled, store_mode, store_modules, restaurant_config, delivery_config,
      correos_cr_config, local_delivery_config, store_schedule, custom_stages, notification_templates,
      store_name, store_slug, store_description, store_logo_url,
      store_banner_url, store_theme, currency, accept_sinpe, accept_sinpe_tilopay, sinpe_phone, sinpe_name,
      accept_transfer, bank_account_info, accept_cash_on_delivery, delivery_enabled,
      delivery_fee, pickup_enabled, whatsapp_checkout, min_order_amount, store_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
    ON CONFLICT (tenant_id) DO UPDATE SET
      store_enabled = EXCLUDED.store_enabled,
      store_mode = EXCLUDED.store_mode,
      store_modules = EXCLUDED.store_modules,
      restaurant_config = EXCLUDED.restaurant_config,
      delivery_config = EXCLUDED.delivery_config,
      correos_cr_config = EXCLUDED.correos_cr_config,
      local_delivery_config = EXCLUDED.local_delivery_config,
      store_schedule = EXCLUDED.store_schedule,
      custom_stages = EXCLUDED.custom_stages,
      notification_templates = EXCLUDED.notification_templates,
      store_name = EXCLUDED.store_name,
      store_slug = EXCLUDED.store_slug,
      store_description = EXCLUDED.store_description,
      store_logo_url = CASE 
        WHEN EXCLUDED.store_logo_url IS NOT NULL AND EXCLUDED.store_logo_url != '' THEN EXCLUDED.store_logo_url 
        ELSE store_settings.store_logo_url 
      END,
      store_banner_url = CASE 
        WHEN EXCLUDED.store_banner_url IS NOT NULL AND EXCLUDED.store_banner_url != '' THEN EXCLUDED.store_banner_url 
        ELSE store_settings.store_banner_url 
      END,
      store_theme = CASE
        WHEN EXCLUDED.store_theme IS NOT NULL AND COALESCE(EXCLUDED.store_theme->>'logoUrl', '') != '' THEN EXCLUDED.store_theme
        WHEN store_settings.store_logo_url IS NOT NULL AND store_settings.store_logo_url != '' THEN 
          jsonb_set(
            jsonb_set(COALESCE(EXCLUDED.store_theme, '{}'::jsonb), '{logoUrl}', to_jsonb(store_settings.store_logo_url)),
            '{bannerUrl}', to_jsonb(COALESCE(store_settings.store_banner_url, ''))
          )
        ELSE EXCLUDED.store_theme
      END,
      currency = EXCLUDED.currency,
      accept_sinpe = EXCLUDED.accept_sinpe,
      accept_sinpe_tilopay = EXCLUDED.accept_sinpe_tilopay,
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
              store_modules as "storeModules", restaurant_config as "restaurantConfig",
              delivery_config as "deliveryConfig", correos_cr_config as "correosCrConfig",
              local_delivery_config as "localDeliveryConfig", store_schedule as "storeSchedule",
              custom_stages as "customStages", notification_templates as "notificationTemplates",
              store_name as "storeName", store_slug as "storeSlug", store_description as "storeDescription",
              store_logo_url as "storeLogoUrl", store_banner_url as "storeBannerUrl",
              store_theme as "storeTheme", currency, accept_sinpe as "acceptSinpe",
              accept_sinpe_tilopay as "acceptSinpeTilopay",
              sinpe_phone as "sinpePhone", sinpe_name as "sinpeName", accept_transfer as "acceptTransfer",
              bank_account_info as "bankAccountInfo", accept_cash_on_delivery as "acceptCashOnDelivery",
              delivery_enabled as "deliveryEnabled", delivery_fee as "deliveryFee",
              pickup_enabled as "pickupEnabled", whatsapp_checkout as "whatsappCheckout",
              min_order_amount as "minOrderAmount", store_message as "storeMessage"
  `, [
    tenantId,
    data.storeEnabled !== false,
    data.storeMode || 'retail',
    JSON.stringify(data.storeModules || { storeEnabled: true, bookingsEnabled: true }),
    JSON.stringify(data.restaurantConfig || {}),
    JSON.stringify(data.deliveryConfig || {}),
    JSON.stringify(data.correosCrConfig || {}),
    JSON.stringify(data.localDeliveryConfig || {}),
    JSON.stringify(data.storeSchedule || {}),
    JSON.stringify(data.customStages || {}),
    JSON.stringify(data.notificationTemplates || {}),
    data.storeName || 'Mi Negocio',
    data.storeSlug || 'tienda',
    data.storeDescription || '',
    data.storeLogoUrl || (data.storeTheme as any)?.logoUrl || '',
    data.storeBannerUrl || (data.storeTheme as any)?.bannerUrl || '',
    JSON.stringify(data.storeTheme || { primaryColor: '#16a34a', cardRadius: 'rounded', cardShadow: 'md', fontFamily: 'Inter' }),
    data.currency || 'CRC',
    data.acceptSinpe !== false,
    data.acceptSinpeTilopay === true,
    data.sinpePhone || '',
    data.sinpeName || '',
    data.acceptTransfer !== false,
    data.bankAccountInfo || '',
    data.acceptCashOnDelivery || false,
    data.deliveryEnabled || false,
    data.deliveryFee || 0,
    data.pickupEnabled !== false,
    data.whatsappCheckout !== false,
    data.minOrderAmount || 0,
    data.storeMessage || ''
  ]);

  return result.rows[0];
}

export const saveStoreSettings = upsertStoreSettings;
