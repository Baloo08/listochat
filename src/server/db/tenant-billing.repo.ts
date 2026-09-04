import { query } from './pool.js';

export interface TenantBillingCard {
  id: string;
  tenantId: string;
  cardLast4: string;
  cardBrand: string;
  cardHolder: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface TenantBillingCardWithToken extends TenantBillingCard {
  tilopayTokenEncrypted: string;
}

export interface TenantBillingCharge {
  id: string;
  tenantId: string;
  billingCardId?: string;
  amount: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  tilopayOrderNumber: string;
  tilopayTransactionId?: string;
  tilopayAuthCode?: string;
  failureReason?: string;
  attemptCount: number;
  lastAttemptAt: string;
  createdAt: string;
}

/**
 * Returns active registered cards for a tenant (without sensitive tokens).
 */
export async function getBillingCards(tenantId: string): Promise<TenantBillingCard[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", card_last4 as "cardLast4",
           card_brand as "cardBrand", card_holder as "cardHolder",
           is_default as "isDefault", is_active as "isActive",
           created_at as "createdAt"
    FROM tenant_billing_cards
    WHERE tenant_id = $1 AND is_active = true
    ORDER BY is_default DESC, created_at DESC
  `, [tenantId]);

  return res.rows;
}

/**
 * Saves a newly tokenized card for a tenant.
 */
export async function saveBillingCard(
  tenantId: string,
  data: {
    last4: string;
    brand?: string;
    holder?: string;
    tokenEncrypted: string;
    isDefault?: boolean;
  }
): Promise<TenantBillingCard> {
  if (data.isDefault !== false) {
    await query(`
      UPDATE tenant_billing_cards
      SET is_default = false
      WHERE tenant_id = $1
    `, [tenantId]);
  }

  const res = await query(`
    INSERT INTO tenant_billing_cards (
      tenant_id, card_last4, card_brand, card_holder,
      tilopay_token_encrypted, is_default, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING id, tenant_id as "tenantId", card_last4 as "cardLast4",
              card_brand as "cardBrand", card_holder as "cardHolder",
              is_default as "isDefault", is_active as "isActive",
              created_at as "createdAt"
  `, [
    tenantId,
    data.last4,
    data.brand || 'CARD',
    data.holder || 'Cliente',
    data.tokenEncrypted,
    data.isDefault !== false
  ]);

  return res.rows[0];
}

/**
 * Retrieves the default billing card for a tenant along with encrypted token.
 */
export async function getDefaultBillingCard(tenantId: string): Promise<TenantBillingCardWithToken | null> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", card_last4 as "cardLast4",
           card_brand as "cardBrand", card_holder as "cardHolder",
           tilopay_token_encrypted as "tilopayTokenEncrypted",
           is_default as "isDefault", is_active as "isActive",
           created_at as "createdAt"
    FROM tenant_billing_cards
    WHERE tenant_id = $1 AND is_active = true
    ORDER BY is_default DESC, created_at DESC
    LIMIT 1
  `, [tenantId]);

  return res.rows[0] || null;
}

/**
 * Deactivates a billing card.
 */
export async function deactivateBillingCard(cardId: string, tenantId: string): Promise<boolean> {
  const res = await query(`
    UPDATE tenant_billing_cards
    SET is_active = false, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
  `, [cardId, tenantId]);

  return (res.rowCount ?? 0) > 0;
}

/**
 * Records a subscription charge attempt.
 */
export async function createBillingCharge(data: {
  tenantId: string;
  billingCardId?: string;
  amount: number;
  currency: string;
  periodStart?: Date;
  periodEnd?: Date;
  status: 'pending' | 'success' | 'failed';
  tilopayOrderNumber: string;
  tilopayTransactionId?: string;
  tilopayAuthCode?: string;
  failureReason?: string;
}): Promise<TenantBillingCharge> {
  const res = await query(`
    INSERT INTO tenant_billing_charges (
      tenant_id, billing_card_id, amount, currency,
      period_start, period_end, status, tilopay_order_number,
      tilopay_transaction_id, tilopay_auth_code, failure_reason
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, tenant_id as "tenantId", billing_card_id as "billingCardId",
              amount, currency, period_start as "periodStart", period_end as "periodEnd",
              status, tilopay_order_number as "tilopayOrderNumber",
              tilopay_transaction_id as "tilopayTransactionId",
              tilopay_auth_code as "tilopayAuthCode",
              failure_reason as "failureReason",
              attempt_count as "attemptCount",
              last_attempt_at as "lastAttemptAt",
              created_at as "createdAt"
  `, [
    data.tenantId,
    data.billingCardId || null,
    data.amount,
    data.currency || 'CRC',
    data.periodStart || null,
    data.periodEnd || null,
    data.status,
    data.tilopayOrderNumber,
    data.tilopayTransactionId || null,
    data.tilopayAuthCode || null,
    data.failureReason || null
  ]);

  return res.rows[0];
}

/**
 * Updates a billing charge by order number.
 */
export async function updateBillingCharge(
  orderNumber: string,
  update: {
    status: 'pending' | 'success' | 'failed' | 'refunded';
    transactionId?: string;
    authCode?: string;
    failureReason?: string;
  }
): Promise<TenantBillingCharge | null> {
  const res = await query(`
    UPDATE tenant_billing_charges
    SET status = $1,
        tilopay_transaction_id = COALESCE($2, tilopay_transaction_id),
        tilopay_auth_code = COALESCE($3, tilopay_auth_code),
        failure_reason = COALESCE($4, failure_reason),
        last_attempt_at = CURRENT_TIMESTAMP
    WHERE tilopay_order_number = $5
    RETURNING id, tenant_id as "tenantId", billing_card_id as "billingCardId",
              amount, currency, period_start as "periodStart", period_end as "periodEnd",
              status, tilopay_order_number as "tilopayOrderNumber",
              tilopay_transaction_id as "tilopayTransactionId",
              tilopay_auth_code as "tilopayAuthCode",
              failure_reason as "failureReason",
              attempt_count as "attemptCount",
              last_attempt_at as "lastAttemptAt",
              created_at as "createdAt"
  `, [
    update.status,
    update.transactionId || null,
    update.authCode || null,
    update.failureReason || null,
    orderNumber
  ]);

  return res.rows[0] || null;
}

/**
 * Fetches recent billing charges for a tenant.
 */
export async function getBillingCharges(tenantId: string, limit = 20): Promise<TenantBillingCharge[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", billing_card_id as "billingCardId",
           amount, currency, period_start as "periodStart", period_end as "periodEnd",
           status, tilopay_order_number as "tilopayOrderNumber",
           tilopay_transaction_id as "tilopayTransactionId",
           tilopay_auth_code as "tilopayAuthCode",
           failure_reason as "failureReason",
           attempt_count as "attemptCount",
           last_attempt_at as "lastAttemptAt",
           created_at as "createdAt"
    FROM tenant_billing_charges
    WHERE tenant_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [tenantId, limit]);

  return res.rows;
}

/**
 * Finds a charge by order number (e.g. for Tilopay webhook).
 */
export async function getChargeByOrderNumber(orderNumber: string): Promise<TenantBillingCharge | null> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", billing_card_id as "billingCardId",
           amount, currency, period_start as "periodStart", period_end as "periodEnd",
           status, tilopay_order_number as "tilopayOrderNumber",
           tilopay_transaction_id as "tilopayTransactionId",
           tilopay_auth_code as "tilopayAuthCode",
           failure_reason as "failureReason",
           attempt_count as "attemptCount",
           last_attempt_at as "lastAttemptAt",
           created_at as "createdAt"
    FROM tenant_billing_charges
    WHERE tilopay_order_number = $1
  `, [orderNumber]);

  return res.rows[0] || null;
}

/**
 * Finds tenants that have auto_billing_enabled = true and next_billing_date <= NOW().
 */
export async function getTenantsDueForAutoBilling(): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  customMonthlyPrice: number;
  billingCurrency: string;
  evolutionInstance?: string;
  subscriptionStatus: string;
}>> {
  const res = await query(`
    SELECT id, name, slug, whatsapp_number as "whatsappNumber",
           custom_monthly_price as "customMonthlyPrice",
           billing_currency as "billingCurrency",
           evolution_instance as "evolutionInstance",
           subscription_status as "subscriptionStatus"
    FROM tenants
    WHERE auto_billing_enabled = true
      AND active = true
      AND next_billing_date IS NOT NULL
      AND next_billing_date <= CURRENT_TIMESTAMP
  `);

  return res.rows;
}