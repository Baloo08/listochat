import { query } from './pool.js';
import { hashPassword, verifyPassword } from './users.repo.js';
import {
  LoyaltyProgram,
  LoyaltyCard,
  LoyaltyCustomer,
  LoyaltyRewardVoucher,
  LoyaltyPromotion,
  LoyaltyTransaction
} from '../../shared/types.js';

function mapProgramRow(row: any): LoyaltyProgram {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    isActive: row.is_active === true,
    programType: row.program_type || 'points',
    currency: row.currency || 'CRC',
    pointsSpendRatio: Number(row.points_spend_ratio) || 1000,
    pointsRedeemRatio: Number(row.points_redeem_ratio) || 10,
    pointsExpiryMonths: row.points_expiry_months !== null && row.points_expiry_months !== undefined ? Number(row.points_expiry_months) : null,
    stampsTarget: Number(row.stamps_target) || 10,
    stampsPrize: row.stamps_prize || 'Premio sorpresa',
    minSpendPerStamp: Number(row.min_spend_per_stamp) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCardRow(row: any): LoyaltyCard {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id || undefined,
    identification: row.identification,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    pointsBalance: Number(row.points_balance) || 0,
    currentStamps: Number(row.current_stamps) || 0,
    totalStampsRedeemed: Number(row.total_stamps_redeemed) || 0,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at || null,
    status: row.status || 'active',
    tenantName: row.tenant_name || undefined,
    tenantSlug: row.tenant_slug || undefined,
    tenantLogoUrl: row.tenant_logo_url || undefined,
    currency: row.currency || 'CRC',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapVoucherRow(row: any): LoyaltyRewardVoucher {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    cardId: row.card_id,
    voucherCode: row.voucher_code,
    qrData: row.qr_data,
    rewardDescription: row.reward_description,
    rewardType: row.reward_type || 'stamps_complete',
    discountAmount: row.discount_amount ? Number(row.discount_amount) : 0,
    status: row.status || 'active',
    expiresAt: row.expires_at,
    redeemedAt: row.redeemed_at || null,
    tenantName: row.tenant_name || undefined,
    tenantSlug: row.tenant_slug || undefined,
    createdAt: row.created_at
  };
}

function cleanIdentification(id: string): string {
  if (!id) return '';
  return id.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
}

// =========================================================================
// 1. GESTIÓN DEL PROGRAMA POR TENANT
// =========================================================================

export async function getLoyaltyProgram(tenantId: string): Promise<LoyaltyProgram | null> {
  const res = await query('SELECT * FROM loyalty_programs WHERE tenant_id = $1', [tenantId]);
  if (res.rows.length === 0) return null;
  return mapProgramRow(res.rows[0]);
}

export async function upsertLoyaltyProgram(tenantId: string, data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
  const current = await getLoyaltyProgram(tenantId);
  if (current) {
    const res = await query(`
      UPDATE loyalty_programs SET
        is_active = COALESCE($1, is_active),
        program_type = COALESCE($2, program_type),
        currency = COALESCE($3, currency),
        points_spend_ratio = COALESCE($4, points_spend_ratio),
        points_redeem_ratio = COALESCE($5, points_redeem_ratio),
        points_expiry_months = $6,
        stamps_target = COALESCE($7, stamps_target),
        stamps_prize = COALESCE($8, stamps_prize),
        min_spend_per_stamp = COALESCE($9, min_spend_per_stamp),
        updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $10
      RETURNING *
    `, [
      data.isActive !== undefined ? data.isActive : null,
      data.programType || null,
      data.currency || null,
      data.pointsSpendRatio !== undefined ? data.pointsSpendRatio : null,
      data.pointsRedeemRatio !== undefined ? data.pointsRedeemRatio : null,
      data.pointsExpiryMonths !== undefined ? data.pointsExpiryMonths : null,
      data.stampsTarget !== undefined ? data.stampsTarget : null,
      data.stampsPrize || null,
      data.minSpendPerStamp !== undefined ? data.minSpendPerStamp : null,
      tenantId
    ]);
    return mapProgramRow(res.rows[0]);
  } else {
    const res = await query(`
      INSERT INTO loyalty_programs (
        tenant_id, is_active, program_type, currency, points_spend_ratio,
        points_redeem_ratio, points_expiry_months, stamps_target, stamps_prize, min_spend_per_stamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      data.isActive !== undefined ? data.isActive : true,
      data.programType || 'points',
      data.currency || 'CRC',
      data.pointsSpendRatio || 1000,
      data.pointsRedeemRatio || 10,
      data.pointsExpiryMonths || null,
      data.stampsTarget || 10,
      data.stampsPrize || 'Premio de lealtad',
      data.minSpendPerStamp || 0
    ]);
    return mapProgramRow(res.rows[0]);
  }
}

// =========================================================================
// 2. CLIENTE CENTRALIZADO (BILLETERA MULTITIENDA betico.tech/fidelidad)
// =========================================================================

export async function createLoyaltyCustomer(data: {
  identification: string;
  fullName: string;
  phone?: string;
  password: string;
}): Promise<LoyaltyCustomer> {
  const cleanId = cleanIdentification(data.identification);
  if (!cleanId) throw new Error('Cédula requerida');
  if (!data.password || data.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

  const hashed = hashPassword(data.password);
  const res = await query(`
    INSERT INTO loyalty_customers (identification, full_name, phone, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, identification, full_name, phone, created_at, updated_at
  `, [cleanId, data.fullName.trim(), data.phone ? data.phone.trim() : null, hashed]);

  const customer = {
    id: res.rows[0].id,
    identification: res.rows[0].identification,
    fullName: res.rows[0].full_name,
    phone: res.rows[0].phone || undefined,
    createdAt: res.rows[0].created_at,
    updatedAt: res.rows[0].updated_at
  };

  // Auto-vinculación retroactiva de tarjetas previamente emitidas con esa cédula
  await query(`
    UPDATE loyalty_cards SET customer_id = $1 WHERE UPPER(REPLACE(REPLACE(identification, '-', ''), ' ', '')) = $2
  `, [customer.id, cleanId]).catch(() => {});

  return customer;
}

export async function getLoyaltyCustomerByIdentification(identification: string): Promise<any | null> {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return null;
  const res = await query('SELECT * FROM loyalty_customers WHERE UPPER(REPLACE(REPLACE(identification, \'-\', \'\'), \' \', \'\')) = $1', [cleanId]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function verifyLoyaltyCustomerLogin(identification: string, password: string): Promise<LoyaltyCustomer | null> {
  const userRow = await getLoyaltyCustomerByIdentification(identification);
  if (!userRow) return null;
  const valid = verifyPassword(password, userRow.password_hash);
  if (!valid) return null;
  return {
    id: userRow.id,
    identification: userRow.identification,
    fullName: userRow.full_name,
    phone: userRow.phone || undefined,
    createdAt: userRow.created_at,
    updatedAt: userRow.updated_at
  };
}

export async function getCustomerWalletCards(identification: string): Promise<LoyaltyCard[]> {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return [];

  const res = await query(`
    SELECT c.*, t.name as tenant_name, t.slug as tenant_slug,
           COALESCE(s.store_logo_url, s.store_theme->>'logoUrl') as tenant_logo_url,
           p.currency as currency, p.stamps_target, p.stamps_prize, p.program_type
    FROM loyalty_cards c
    JOIN tenants t ON t.id = c.tenant_id
    LEFT JOIN store_settings s ON s.tenant_id = c.tenant_id
    LEFT JOIN loyalty_programs p ON p.tenant_id = c.tenant_id
    WHERE UPPER(REPLACE(REPLACE(c.identification, '-', ''), ' ', '')) = $1
      AND c.status = 'active'
    ORDER BY c.last_activity_at DESC
  `, [cleanId]);

  return res.rows.map(row => ({
    ...mapCardRow(row),
    stampsTarget: row.stamps_target ? Number(row.stamps_target) : 10,
    stampsPrize: row.stamps_prize || 'Premio de lealtad',
    programType: row.program_type || 'both'
  } as any));
}

export async function getCustomerVouchers(identification: string): Promise<LoyaltyRewardVoucher[]> {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return [];

  const res = await query(`
    SELECT v.*, t.name as tenant_name, t.slug as tenant_slug
    FROM loyalty_rewards_vouchers v
    JOIN loyalty_cards c ON c.id = v.card_id
    JOIN tenants t ON t.id = v.tenant_id
    WHERE UPPER(REPLACE(REPLACE(c.identification, '-', ''), ' ', '')) = $1
    ORDER BY v.created_at DESC
  `, [cleanId]);

  return res.rows.map(mapVoucherRow);
}

// =========================================================================
// 3. TARJETAS DE FIDELIDAD POR COMERCIO
// =========================================================================

export async function getLoyaltyCardById(tenantId: string, cardId: string): Promise<LoyaltyCard | null> {
  const res = await query('SELECT * FROM loyalty_cards WHERE id = $1 AND tenant_id = $2', [cardId, tenantId]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}

export async function getLoyaltyCardByIdentification(tenantId: string, identification: string): Promise<LoyaltyCard | null> {
  const cleanId = cleanIdentification(identification);
  if (!cleanId) return null;
  const res = await query(`
    SELECT * FROM loyalty_cards 
    WHERE tenant_id = $1 AND UPPER(REPLACE(REPLACE(identification, '-', ''), ' ', '')) = $2
    LIMIT 1
  `, [tenantId, cleanId]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}

export async function getLoyaltyCardByPhone(tenantId: string, phone: string): Promise<LoyaltyCard | null> {
  const cleanPh = phone.replace(/\D/g, '');
  if (!cleanPh) return null;
  const res = await query(`
    SELECT * FROM loyalty_cards 
    WHERE tenant_id = $1 AND (
      customer_phone = $2 OR 
      customer_phone LIKE '%' || $2 OR
      $2 LIKE '%' || customer_phone
    )
    ORDER BY last_activity_at DESC
    LIMIT 1
  `, [tenantId, cleanPh]);
  if (res.rows.length === 0) return null;
  return mapCardRow(res.rows[0]);
}

export async function findOrCreateLoyaltyCard(tenantId: string, data: {
  identification: string;
  customerName: string;
  customerPhone?: string;
}): Promise<LoyaltyCard> {
  const cleanId = cleanIdentification(data.identification);
  if (!cleanId) throw new Error('Cédula requerida para crear o buscar tarjeta de fidelidad');

  const existing = await getLoyaltyCardByIdentification(tenantId, cleanId);
  if (existing) {
    if (data.customerPhone && !existing.customerPhone) {
      await query('UPDATE loyalty_cards SET customer_phone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        data.customerPhone.replace(/\D/g, ''),
        existing.id
      ]);
      existing.customerPhone = data.customerPhone.replace(/\D/g, '');
    }
    return existing;
  }

  const customer = await getLoyaltyCustomerByIdentification(cleanId);

  const res = await query(`
    INSERT INTO loyalty_cards (
      tenant_id, customer_id, identification, customer_name, customer_phone,
      points_balance, current_stamps, total_stamps_redeemed, status
    ) VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 'active')
    ON CONFLICT (tenant_id, identification) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_phone = COALESCE(EXCLUDED.customer_phone, loyalty_cards.customer_phone),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    tenantId,
    customer?.id || null,
    cleanId,
    data.customerName.trim(),
    data.customerPhone ? data.customerPhone.replace(/\D/g, '') : null
  ]);

  return mapCardRow(res.rows[0]);
}

export async function listLoyaltyCards(tenantId: string, filters?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ cards: LoyaltyCard[]; total: number }> {
  const params: any[] = [tenantId];
  let where = 'WHERE tenant_id = $1';

  if (filters?.search) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    where += ` AND (LOWER(customer_name) LIKE $${params.length} OR identification LIKE $${params.length} OR customer_phone LIKE $${params.length})`;
  }

  if (filters?.status) {
    params.push(filters.status);
    where += ` AND status = $${params.length}`;
  }

  const countRes = await query(`SELECT COUNT(*) as total FROM loyalty_cards ${where}`, params);
  const total = parseInt(countRes.rows[0].total, 10);

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  params.push(limit, offset);

  const listRes = await query(`
    SELECT * FROM loyalty_cards 
    ${where}
    ORDER BY last_activity_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  return {
    cards: listRes.rows.map(mapCardRow),
    total
  };
}

// =========================================================================
// 4. OPERACIONES DE PUNTOS, SELLOS Y LIBRO MAYOR (LEDGER)
// =========================================================================

export async function addPoints(tenantId: string, cardId: string, points: number, meta?: {
  orderId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<LoyaltyCard> {
  if (points <= 0) throw new Error('Los puntos a sumar deben ser mayores a cero');

  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error('Tarjeta no encontrada');

  const newBalance = Number(card.pointsBalance) + points;

  const res = await query(`
    UPDATE loyalty_cards SET
      points_balance = $1,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `, [newBalance, cardId, tenantId]);

  await query(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'earn_points', $3, 0, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    points,
    newBalance,
    card.currentStamps,
    meta?.orderId || null,
    meta?.notes || 'Puntos acumulados',
    meta?.createdBy || 'system'
  ]);

  return mapCardRow(res.rows[0]);
}

export async function redeemPoints(tenantId: string, cardId: string, points: number, meta?: {
  orderId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<LoyaltyCard> {
  if (points <= 0) throw new Error('Los puntos a canjear deben ser mayores a cero');

  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error('Tarjeta no encontrada');
  if (card.pointsBalance < points) throw new Error(`Saldo insuficiente. Puntos disponibles: ${card.pointsBalance}`);

  const newBalance = Number(card.pointsBalance) - points;

  const res = await query(`
    UPDATE loyalty_cards SET
      points_balance = $1,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `, [newBalance, cardId, tenantId]);

  await query(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'redeem_points', $3, 0, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    -points,
    newBalance,
    card.currentStamps,
    meta?.orderId || null,
    meta?.notes || 'Canje de puntos',
    meta?.createdBy || 'system'
  ]);

  return mapCardRow(res.rows[0]);
}

export async function addStamps(tenantId: string, cardId: string, stampsCount: number = 1, meta?: {
  orderId?: string;
  notes?: string;
  createdBy?: string;
}): Promise<{ card: LoyaltyCard; voucher?: LoyaltyRewardVoucher }> {
  if (stampsCount <= 0) throw new Error('La cantidad de sellos debe ser mayor a cero');

  const card = await getLoyaltyCardById(tenantId, cardId);
  if (!card) throw new Error('Tarjeta no encontrada');

  const program = await getLoyaltyProgram(tenantId);
  const target = program?.stampsTarget || 10;
  const prize = program?.stampsPrize || 'Premio de fidelidad';

  let newStamps = card.currentStamps + stampsCount;
  let totalRedeemed = card.totalStampsRedeemed;
  let createdVoucher: LoyaltyRewardVoucher | undefined = undefined;

  if (newStamps >= target) {
    totalRedeemed += 1;
    newStamps = newStamps - target;

    const code = `PRM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const baseUrl = process.env.APP_URL || 'https://betico.tech';
    const qrData = `${baseUrl}/fidelidad/canje/${code}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 45);

    const vRes = await query(`
      INSERT INTO loyalty_rewards_vouchers (
        tenant_id, card_id, voucher_code, qr_data, reward_description,
        reward_type, discount_amount, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, 'stamps_complete', 0, 'active', $6)
      RETURNING *
    `, [tenantId, cardId, code, qrData, prize, expiresAt.toISOString()]);

    createdVoucher = mapVoucherRow(vRes.rows[0]);
  }

  const res = await query(`
    UPDATE loyalty_cards SET
      current_stamps = $1,
      total_stamps_redeemed = $2,
      last_activity_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND tenant_id = $4
    RETURNING *
  `, [newStamps, totalRedeemed, cardId, tenantId]);

  await query(`
    INSERT INTO loyalty_transactions (
      tenant_id, card_id, type, points_delta, stamps_delta,
      balance_after, stamps_after, order_id, notes, created_by
    ) VALUES ($1, $2, 'earn_stamp', 0, $3, $4, $5, $6, $7, $8)
  `, [
    tenantId,
    cardId,
    stampsCount,
    card.pointsBalance,
    newStamps,
    meta?.orderId || null,
    createdVoucher ? `Sello otorgado (¡Meta alcanzada! Cupón ${createdVoucher.voucherCode} emitido)` : (meta?.notes || 'Sello acumulado'),
    meta?.createdBy || 'system'
  ]);

  return {
    card: mapCardRow(res.rows[0]),
    voucher: createdVoucher
  };
}

export async function redeemVoucher(tenantId: string, voucherIdOrCode: string): Promise<LoyaltyRewardVoucher> {
  const isCode = voucherIdOrCode.startsWith('PRM-');
  const where = isCode ? 'voucher_code = $1' : 'id = $1';

  const check = await query(`SELECT * FROM loyalty_rewards_vouchers WHERE ${where} AND tenant_id = $2`, [voucherIdOrCode, tenantId]);
  if (check.rows.length === 0) throw new Error('Cupón o recompensa no encontrada');
  const v = check.rows[0];

  if (v.status === 'redeemed') throw new Error('Este cupón ya fue canjeado con anterioridad');
  if (new Date(v.expires_at) < new Date()) throw new Error('Este cupón ha expirado');

  const res = await query(`
    UPDATE loyalty_rewards_vouchers SET
      status = 'redeemed',
      redeemed_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `, [v.id, tenantId]);

  return mapVoucherRow(res.rows[0]);
}

export async function listTenantVouchers(tenantId: string, status?: string): Promise<LoyaltyRewardVoucher[]> {
  const params: any[] = [tenantId];
  let where = 'WHERE v.tenant_id = $1';
  if (status) {
    params.push(status);
    where += ` AND v.status = $2`;
  }
  const res = await query(`
    SELECT v.*, c.customer_name, c.identification as customer_id_num
    FROM loyalty_rewards_vouchers v
    JOIN loyalty_cards c ON c.id = v.card_id
    ${where}
    ORDER BY v.created_at DESC
  `, params);

  return res.rows.map(row => ({
    ...mapVoucherRow(row),
    customerName: row.customer_name,
    customerIdentification: row.customer_id_num
  } as any));
}

export async function getCardTransactions(tenantId: string, cardId: string): Promise<LoyaltyTransaction[]> {
  const res = await query(`
    SELECT * FROM loyalty_transactions
    WHERE card_id = $1 AND tenant_id = $2
    ORDER BY created_at DESC
    LIMIT 100
  `, [cardId, tenantId]);

  return res.rows.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    cardId: row.card_id,
    type: row.type,
    pointsDelta: Number(row.points_delta) || 0,
    stampsDelta: Number(row.stamps_delta) || 0,
    balanceAfter: Number(row.balance_after) || 0,
    stampsAfter: Number(row.stamps_after) || 0,
    orderId: row.order_id || undefined,
    notes: row.notes || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at
  }));
}

// =========================================================================
// 5. PROMOCIONES DE FIDELIDAD
// =========================================================================

export async function listPromotions(tenantId: string): Promise<LoyaltyPromotion[]> {
  const res = await query(`
    SELECT * FROM loyalty_promotions 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC
  `, [tenantId]);

  return res.rows.map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description || undefined,
    promoType: row.promo_type || 'double_points',
    multiplier: Number(row.multiplier) || 2.0,
    minSpend: Number(row.min_spend) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === true,
    createdAt: row.created_at
  }));
}

export async function createPromotion(tenantId: string, data: Partial<LoyaltyPromotion>): Promise<LoyaltyPromotion> {
  const res = await query(`
    INSERT INTO loyalty_promotions (
      tenant_id, title, description, promo_type, multiplier, min_spend, start_date, end_date, active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    tenantId,
    data.title || 'Promoción especial',
    data.description || null,
    data.promoType || 'double_points',
    data.multiplier || 2.0,
    data.minSpend || 0,
    data.startDate || new Date().toISOString().split('T')[0],
    data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    data.active !== false
  ]);

  const row = res.rows[0];
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description || undefined,
    promoType: row.promo_type,
    multiplier: Number(row.multiplier),
    minSpend: Number(row.min_spend),
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active === true,
    createdAt: row.created_at
  };
}

export async function deletePromotion(tenantId: string, promoId: string): Promise<boolean> {
  const res = await query('DELETE FROM loyalty_promotions WHERE id = $1 AND tenant_id = $2', [promoId, tenantId]);
  return (res.rowCount || 0) > 0;
}
