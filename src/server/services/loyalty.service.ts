import {
  getLoyaltyProgram,
  getLoyaltyCardByIdentification,
  getLoyaltyCardByPhone,
  findOrCreateLoyaltyCard,
  addPoints,
  addStamps,
  listPromotions
} from '../db/loyalty.repo.js';
import { getStoreSettings } from '../db/store-settings.repo.js';
import { query } from '../db/pool.js';
import { LoyaltyProgram, LoyaltyCard, LoyaltyRewardVoucher } from '../../shared/types.js';

export interface OrderLoyaltyResult {
  card: LoyaltyCard;
  pointsEarned: number;
  stampsEarned: number;
  voucherCreated?: LoyaltyRewardVoucher;
  message?: string;
}

export async function processOrderLoyalty(
  tenantId: string,
  orderData: {
    id?: string;
    total: number;
    customerName: string;
    customerPhone?: string;
    identification?: string;
    billingInfo?: any;
  }
): Promise<OrderLoyaltyResult | null> {
  try {
    const store = await getStoreSettings(tenantId);
    if (store?.storeModules?.loyaltyEnabled === false) return null;

    const program = await getLoyaltyProgram(tenantId);
    if (!program || !program.isActive) return null;

    // Obtener cédula de billingInfo o identification directo
    const identification = orderData.identification || 
      orderData.billingInfo?.identification || 
      orderData.billingInfo?.receiverIdNumber || 
      orderData.billingInfo?.cedula;

    let card: LoyaltyCard | null = null;

    if (identification) {
      card = await findOrCreateLoyaltyCard(tenantId, {
        identification,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone
      });
    } else if (orderData.customerPhone) {
      // Intentar vincular por teléfono si la tarjeta ya existía
      card = await getLoyaltyCardByPhone(tenantId, orderData.customerPhone);
    }

    if (!card) return null;

    if (orderData.id) {
      const existingTx = await query(
        "SELECT id FROM loyalty_transactions WHERE tenant_id = $1 AND order_id = $2 AND type IN ('earn_points', 'earn_stamps') LIMIT 1",
        [tenantId, String(orderData.id)]
      );
      if (existingTx.rows.length > 0) {
        return null; // Ya se procesaron recompensas de lealtad para esta orden
      }
    }

    const promotions = await listPromotions(tenantId);
    const today = new Date().toISOString().split('T')[0];
    const activePromos = promotions.filter(p => p.active && p.startDate <= today && p.endDate >= today);

    let pointsEarned = 0;
    let stampsEarned = 0;
    let voucherCreated: LoyaltyRewardVoucher | undefined = undefined;

    // 1. Acumulación de Puntos
    if (program.programType === 'points' || program.programType === 'both') {
      const spendRatio = program.pointsSpendRatio || 1000;
      let calculatedPoints = Math.floor(Number(orderData.total || 0) / spendRatio);

      // Multiplicador promocional
      const doublePointsPromo = activePromos.find(p => p.promoType === 'double_points' && Number(orderData.total) >= Number(p.minSpend));
      if (doublePointsPromo) {
        calculatedPoints = Math.round(calculatedPoints * Number(doublePointsPromo.multiplier));
      }

      if (calculatedPoints > 0) {
        pointsEarned = calculatedPoints;
        card = await addPoints(tenantId, card.id, pointsEarned, {
          orderId: orderData.id,
          notes: `Puntos por orden #${orderData.id || ''} (Total: ₡${Number(orderData.total).toLocaleString('es-CR')})`
        });
      }
    }

    // 2. Acumulación de Sellos
    if (program.programType === 'stamps' || program.programType === 'both') {
      const minSpend = program.minSpendPerStamp || 0;
      if (Number(orderData.total || 0) >= minSpend) {
        let stampCount = 1;
        const bonusStampPromo = activePromos.find(p => p.promoType === 'bonus_stamps' && Number(orderData.total) >= Number(p.minSpend));
        if (bonusStampPromo) {
          stampCount += 1;
        }

        stampsEarned = stampCount;
        const stampRes = await addStamps(tenantId, card.id, stampsEarned, {
          orderId: orderData.id,
          notes: `Sello otorgado por orden #${orderData.id || ''}`
        });
        card = stampRes.card;
        voucherCreated = stampRes.voucher;
      }
    }

    return {
      card,
      pointsEarned,
      stampsEarned,
      voucherCreated
    };
  } catch (error) {
    console.error('[LoyaltyService] Error processing order loyalty:', error);
    return null;
  }
}

export async function getLoyaltySummaryForBot(
  tenantId: string,
  identifier: string // Cédula o Teléfono
): Promise<{
  program: LoyaltyProgram | null;
  card: LoyaltyCard | null;
  formattedText: string;
}> {
  const program = await getLoyaltyProgram(tenantId);
  if (!program || !program.isActive) {
    return {
      program: null,
      card: null,
      formattedText: 'En este momento nuestro programa de lealtad no se encuentra activo.'
    };
  }

  // Buscar primero por cédula, luego por teléfono
  let card = await getLoyaltyCardByIdentification(tenantId, identifier);
  if (!card) {
    card = await getLoyaltyCardByPhone(tenantId, identifier);
  }

  if (!card) {
    return {
      program,
      card: null,
      formattedText: `No encontramos una tarjeta registrada con la identificación o teléfono provisto (*${identifier}*). ¿Deseas que te registremos en nuestro Club de Fidelidad? Solo indícanos tu número de cédula y nombre completo.`
    };
  }

  // Generar respuesta natural y cálida estilo WhatsApp
  const currSymbol = program.currency === 'USD' ? '$' : '₡';
  let lines: string[] = [];

  lines.push(`🌟 *Club de Lealtad - Resumen de tu Tarjeta*`);
  lines.push(`Titular: *${card.customerName}* (Cédula: ${card.identification})`);

  if (program.programType === 'points' || program.programType === 'both') {
    const moneyEquivalent = Math.round(Number(card.pointsBalance) * Number(program.pointsRedeemRatio));
    lines.push(`\n💰 *Puntos acumulados:* ${card.pointsBalance.toLocaleString()} puntos`);
    lines.push(`Equivalente a saldo disponible: *${currSymbol}${moneyEquivalent.toLocaleString('es-CR')}* para canjear en tus compras.`);
    if (program.pointsExpiryMonths) {
      lines.push(`⏱️ *Vigencia:* Los puntos tienen una caducidad de ${program.pointsExpiryMonths} meses.`);
    } else {
      lines.push(`⏱️ *Vigencia:* ¡Tus puntos no vencen!`);
    }
  }

  if (program.programType === 'stamps' || program.programType === 'both') {
    const remaining = Math.max(0, Number(program.stampsTarget) - Number(card.currentStamps));
    lines.push(`\n🏷️ *Tarjeta de Sellos:* ${card.currentStamps} de ${program.stampsTarget} sellos completados.`);
    if (remaining === 0) {
      lines.push(`🎉 *¡Felicidades!* Has completado tu tarjeta. Revisa tu premio: *${program.stampsPrize}*.`);
    } else {
      lines.push(`¡Te faltan solo *${remaining} sello(s)* para ganar tu premio: *${program.stampsPrize}*! 🎁`);
    }
  }

  const baseUrl = process.env.APP_URL || 'https://betico.tech';
  lines.push(`\n📱 Puedes ver tu tarjeta digital y código QR en: ${baseUrl}/fidelidad`);

  return {
    program,
    card,
    formattedText: lines.join('\n')
  };
}
