import { query } from '../db/pool.js';
import { DiscountCoupon, CouponValidationResult } from '../../shared/types.js';

/**
 * Normaliza un código de cupón a mayúsculas sin espacios
 */
export function normalizeCouponCode(code: string): string {
  return (code || '').trim().toUpperCase();
}

/**
 * Valida un código de cupón contra:
 * 1. La tabla de cupones promocionales del comercio (discount_coupons)
 * 2. O la tabla de vouchers/premios de fidelidad (loyalty_rewards_vouchers)
 */
export async function validateCoupon(
  tenantId: string,
  rawCode: string,
  orderSubtotal: number = 0
): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { valid: false, error: 'Por favor ingresa un código de cupón' };
  }

  // 1. Verificar primero en cupones promocionales del comercio
  const promoRes = await query(`
    SELECT id, tenant_id, code, description, discount_type, discount_value,
           min_order_amount, max_discount_amount, usage_limit, used_count,
           valid_from, valid_until, active
    FROM discount_coupons
    WHERE tenant_id = $1 AND code = $2
  `, [tenantId, code]);

  if (promoRes.rows.length > 0) {
    const coupon: any = promoRes.rows[0];

    if (!coupon.active) {
      return { valid: false, error: `El cupón ${code} está inactivo o pausado` };
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, error: `El cupón ${code} aún no está vigente` };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, error: `El cupón ${code} ha expirado` };
    }

    if (coupon.usage_limit && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
      return { valid: false, error: `El cupón ${code} ha alcanzado el límite de usos permitidos` };
    }

    const minAmount = Number(coupon.min_order_amount || 0);
    if (orderSubtotal > 0 && orderSubtotal < minAmount) {
      return {
        valid: false,
        error: `Este cupón requiere una compra mínima de ₡${minAmount.toLocaleString('es-CR')}`
      };
    }

    const dType = coupon.discount_type === 'fixed' ? 'fixed' : 'percentage';
    const dVal = Number(coupon.discount_value || 0);
    let calculatedDiscount = 0;

    if (dType === 'percentage') {
      calculatedDiscount = Math.round((orderSubtotal * dVal) / 100);
      if (coupon.max_discount_amount && Number(coupon.max_discount_amount) > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, Number(coupon.max_discount_amount));
      }
    } else {
      calculatedDiscount = orderSubtotal > 0 ? Math.min(dVal, orderSubtotal) : dVal;
    }

    return {
      valid: true,
      code: coupon.code,
      couponType: 'promo',
      discountType: dType,
      discountValue: dVal,
      discountAmount: calculatedDiscount,
      description: coupon.description || (dType === 'percentage' ? `${dVal}% de descuento` : `₡${dVal.toLocaleString('es-CR')} de descuento`)
    };
  }

  // 2. Si no es cupón comercial estándar, verificar si es un Voucher de Fidelidad (Betico Club)
  const voucherRes = await query(`
    SELECT v.id, v.tenant_id, v.voucher_code, v.reward_description, v.reward_type,
           v.discount_amount, v.status, v.expires_at, v.redeemed_at,
           c.customer_name, c.identification
    FROM loyalty_rewards_vouchers v
    LEFT JOIN loyalty_cards c ON v.card_id = c.id
    WHERE v.tenant_id = $1 AND v.voucher_code = $2
  `, [tenantId, code]);

  if (voucherRes.rows.length > 0) {
    const voucher: any = voucherRes.rows[0];

    if (voucher.status === 'redeemed') {
      return {
        valid: false,
        error: `El cupón de premio ${code} ya fue canjeado previamente (${voucher.customer_name || 'Cliente'})`
      };
    }

    if (voucher.status === 'expired' || (voucher.expires_at && new Date(voucher.expires_at) < new Date())) {
      return { valid: false, error: `El cupón de premio ${code} ha expirado` };
    }

    if (voucher.status !== 'active') {
      return { valid: false, error: `El cupón de premio ${code} no está disponible` };
    }

    const rawDiscount = Number(voucher.discount_amount || 0);
    const calculatedDiscount = orderSubtotal > 0 && rawDiscount > 0
      ? Math.min(rawDiscount, orderSubtotal)
      : rawDiscount;

    return {
      valid: true,
      code: voucher.voucher_code,
      couponType: 'loyalty_voucher',
      discountType: 'fixed',
      discountValue: rawDiscount,
      discountAmount: calculatedDiscount,
      description: `${voucher.reward_description} (${voucher.customer_name || 'Cliente'})`
    };
  }

  return {
    valid: false,
    error: `El código "${code}" no existe o no corresponde a este comercio`
  };
}

/**
 * Canjea un cupón (ya sea promocional o voucher de fidelidad)
 */
export async function redeemCoupon(
  tenantId: string,
  rawCode: string,
  orderId?: string,
  cashierNotes?: string
): Promise<{ success: boolean; message: string; discountAmount?: number; couponType?: string }> {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { success: false, message: 'Código de cupón requerido' };
  }

  // 1. Intentar como cupón promocional
  const promoRes = await query(`
    SELECT id, code, discount_type, discount_value, usage_limit, used_count, active, valid_until
    FROM discount_coupons
    WHERE tenant_id = $1 AND code = $2
  `, [tenantId, code]);

  if (promoRes.rows.length > 0) {
    const coupon: any = promoRes.rows[0];
    if (!coupon.active) {
      return { success: false, message: `El cupón ${code} está inactivo` };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { success: false, message: `El cupón ${code} ha expirado` };
    }
    if (coupon.usage_limit && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
      return { success: false, message: `El cupón ${code} ha alcanzado su límite de usos` };
    }

    await query(`
      UPDATE discount_coupons
      SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [coupon.id]);

    return {
      success: true,
      message: `¡Cupón promocional ${code} aplicado y registrado con éxito!`,
      couponType: 'promo',
      discountAmount: Number(coupon.discount_value || 0)
    };
  }

  // 2. Intentar como voucher de fidelidad
  const voucherRes = await query(`
    SELECT v.id, v.voucher_code, v.reward_description, v.discount_amount, v.status,
           c.customer_name, c.identification
    FROM loyalty_rewards_vouchers v
    LEFT JOIN loyalty_cards c ON v.card_id = c.id
    WHERE v.tenant_id = $1 AND v.voucher_code = $2
  `, [tenantId, code]);

  if (voucherRes.rows.length > 0) {
    const voucher: any = voucherRes.rows[0];
    if (voucher.status === 'redeemed') {
      return { success: false, message: `Este premio ya fue canjeado anteriormente por ${voucher.customer_name || 'el cliente'}` };
    }
    if (voucher.status !== 'active') {
      return { success: false, message: `El premio ${code} no está en estado activo` };
    }

    await query(`
      UPDATE loyalty_rewards_vouchers
      SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [voucher.id]);

    return {
      success: true,
      message: `¡Premio "${voucher.reward_description}" canjeado exitosamente para ${voucher.customer_name}!`,
      couponType: 'loyalty_voucher',
      discountAmount: Number(voucher.discount_amount || 0)
    };
  }

  return { success: false, message: `El código "${code}" no fue encontrado en este comercio` };
}

/**
 * Obtiene todos los cupones comerciales creados por el comercio
 */
export async function getCouponsByTenant(tenantId: string): Promise<DiscountCoupon[]> {
  const res = await query(`
    SELECT id, tenant_id as "tenantId", code, description,
           discount_type as "discountType", discount_value as "discountValue",
           min_order_amount as "minOrderAmount", max_discount_amount as "maxDiscountAmount",
           usage_limit as "usageLimit", used_count as "usedCount",
           valid_from as "validFrom", valid_until as "validUntil",
           active, created_at as "createdAt", updated_at as "updatedAt"
    FROM discount_coupons
    WHERE tenant_id = $1
    ORDER BY created_at DESC
  `, [tenantId]);
  return res.rows;
}

/**
 * Crea un nuevo cupón comercial
 */
export async function createCoupon(tenantId: string, data: Partial<DiscountCoupon>): Promise<DiscountCoupon> {
  const code = normalizeCouponCode(data.code || '');
  if (!code) {
    throw new Error('El código del cupón es obligatorio');
  }
  const discountType = data.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Number(data.discountValue || 0);
  if (discountValue <= 0) {
    throw new Error('El valor del descuento debe ser mayor a 0');
  }

  const res = await query(`
    INSERT INTO discount_coupons (
      tenant_id, code, description, discount_type, discount_value,
      min_order_amount, max_discount_amount, usage_limit,
      valid_from, valid_until, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, tenant_id as "tenantId", code, description,
              discount_type as "discountType", discount_value as "discountValue",
              min_order_amount as "minOrderAmount", max_discount_amount as "maxDiscountAmount",
              usage_limit as "usageLimit", used_count as "usedCount",
              valid_from as "validFrom", valid_until as "validUntil",
              active, created_at as "createdAt", updated_at as "updatedAt"
  `, [
    tenantId,
    code,
    data.description || null,
    discountType,
    discountValue,
    Number(data.minOrderAmount || 0),
    data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
    data.usageLimit ? Number(data.usageLimit) : null,
    data.validFrom ? new Date(data.validFrom) : new Date(),
    data.validUntil ? new Date(data.validUntil) : null,
    data.active !== false
  ]);

  return res.rows[0];
}

/**
 * Elimina un cupón comercial
 */
export async function deleteCoupon(tenantId: string, couponId: string): Promise<boolean> {
  const res = await query(`
    DELETE FROM discount_coupons
    WHERE id = $1 AND tenant_id = $2
  `, [couponId, tenantId]);
  return (res.rowCount || 0) > 0;
}

/**
 * Activa o desactiva un cupón comercial
 */
export async function toggleCouponActive(tenantId: string, couponId: string, active: boolean): Promise<DiscountCoupon | null> {
  const res = await query(`
    UPDATE discount_coupons
    SET active = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
    RETURNING id, tenant_id as "tenantId", code, description,
              discount_type as "discountType", discount_value as "discountValue",
              min_order_amount as "minOrderAmount", max_discount_amount as "maxDiscountAmount",
              usage_limit as "usageLimit", used_count as "usedCount",
              valid_from as "validFrom", valid_until as "validUntil",
              active, created_at as "createdAt", updated_at as "updatedAt"
  `, [couponId, tenantId, active]);
  return res.rows[0] || null;
}
