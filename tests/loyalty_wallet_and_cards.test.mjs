import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Pure implementations matching repository and service algorithms for clean unit testing

function cleanIdentification(id) {
  if (!id) return '';
  return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

function generateVoucherCode() {
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `VOUCH-${randomBytes.slice(0, 4)}-${randomBytes.slice(4, 8)}`;
}

function calculateOrderLoyalty({
  orderTotal,
  program,
  promotions = [],
  currentCard
}) {
  if (!program || !program.isActive) return null;

  let pointsEarned = 0;
  let stampsEarned = 0;

  // 1. Points
  if (program.programType === 'points' || program.programType === 'both') {
    const spendRatio = program.pointsSpendRatio || 1000;
    let pts = Math.floor(orderTotal / spendRatio);

    const doublePointsPromo = promotions.find(p => p.active && p.promoType === 'double_points' && orderTotal >= p.minSpend);
    if (doublePointsPromo) {
      pts = Math.round(pts * Number(doublePointsPromo.multiplier));
    }

    pointsEarned = pts;
  }

  // 2. Stamps
  if (program.programType === 'stamps' || program.programType === 'both') {
    const minSpend = program.minSpendPerStamp || 0;
    if (orderTotal >= minSpend) {
      let stp = 1;
      const bonusStampPromo = promotions.find(p => p.active && p.promoType === 'bonus_stamps' && orderTotal >= p.minSpend);
      if (bonusStampPromo) {
        stp += 1;
      }
      stampsEarned = stp;
    }
  }

  // Update card simulation
  const newBalance = Number(currentCard.pointsBalance) + pointsEarned;
  const newStampsTotal = Number(currentCard.currentStamps) + stampsEarned;
  const target = Number(program.stampsTarget || 10);

  let voucher = null;
  let finalStamps = newStampsTotal;
  let totalRedeemed = Number(currentCard.totalStampsRedeemed || 0);

  if (target > 0 && newStampsTotal >= target) {
    const completedCycles = Math.floor(newStampsTotal / target);
    finalStamps = newStampsTotal % target;
    totalRedeemed += completedCycles;

    voucher = {
      id: `vouch_${Date.now()}`,
      voucherCode: generateVoucherCode(),
      rewardDescription: program.stampsPrize || 'Premio de lealtad',
      status: 'active',
      expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString()
    };
  }

  return {
    pointsEarned,
    stampsEarned,
    updatedCard: {
      ...currentCard,
      pointsBalance: newBalance,
      currentStamps: finalStamps,
      totalStampsRedeemed: totalRedeemed
    },
    voucher
  };
}

function formatLoyaltySummaryForBot(program, card, appBaseUrl = 'https://betico.tech') {
  if (!program || !program.isActive) {
    return 'En este momento nuestro programa de lealtad no se encuentra activo.';
  }

  const currSymbol = program.currency === 'USD' ? '$' : '₡';
  const lines = [];

  lines.push(`🌟 *Club de Lealtad - Resumen de tu Tarjeta*`);
  lines.push(`Titular: *${card.customerName}* (Cédula: ${card.identification})`);

  if (program.programType === 'points' || program.programType === 'both') {
    const moneyEquivalent = Math.round(Number(card.pointsBalance) * Number(program.pointsRedeemRatio));
    lines.push(`\n💰 *Puntos acumulados:* ${Number(card.pointsBalance).toLocaleString()} puntos`);
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

  lines.push(`\n📱 Puedes ver tu tarjeta digital y código QR en: ${appBaseUrl}/fidelidad`);

  return lines.join('\n');
}

test('Loyalty Wallet & Cards Module Test Suite', async (t) => {

  await t.test('1. Master Cédula Sanitization and Equality', () => {
    assert.equal(cleanIdentification('1-1234-5678'), '112345678');
    assert.equal(cleanIdentification(' 1 1234 5678 '), '112345678');
    assert.equal(cleanIdentification('3-101-123456'), '3101123456');
    assert.equal(cleanIdentification('dimex-12345678901'), 'DIMEX12345678901');

    // Both formats map to the same universal key
    assert.equal(cleanIdentification('1-1234-5678'), cleanIdentification('112345678'));
  });

  await t.test('2. Loyalty Customer Cryptographic Authentication', () => {
    const rawPass = 'MiClaveSegura2026!';
    const hashed = hashPassword(rawPass);

    assert.notEqual(hashed, rawPass);
    assert.ok(hashed.includes(':'));

    // Correct password succeeds
    assert.ok(verifyPassword(rawPass, hashed));

    // Incorrect password fails
    assert.strictEqual(verifyPassword('OtraClaveErronea', hashed), false);
    assert.strictEqual(verifyPassword('', hashed), false);
  });

  await t.test('3. Points Accumulation and Monetary Redeem Value', () => {
    const program = {
      isActive: true,
      programType: 'points',
      currency: 'CRC',
      pointsSpendRatio: 1000, // 1 point per 1,000 CRC
      pointsRedeemRatio: 10,   // 1 point = 10 CRC
      pointsExpiryMonths: 12
    };

    const card = {
      id: 'card_1',
      identification: '112345678',
      customerName: 'Cristopher Jiménez',
      pointsBalance: 50,
      currentStamps: 0,
      totalStampsRedeemed: 0
    };

    // Purchase of ₡25,400 -> 25 points earned
    const result = calculateOrderLoyalty({
      orderTotal: 25400,
      program,
      currentCard: card
    });

    assert.equal(result.pointsEarned, 25);
    assert.equal(result.updatedCard.pointsBalance, 75);

    // Value of 75 points: 75 * 10 = 750 CRC
    const monetaryValue = result.updatedCard.pointsBalance * program.pointsRedeemRatio;
    assert.equal(monetaryValue, 750);
  });

  await t.test('4. Promotional Multipliers (Double Points)', () => {
    const program = {
      isActive: true,
      programType: 'points',
      pointsSpendRatio: 1000,
      pointsRedeemRatio: 10
    };

    const promo = {
      active: true,
      promoType: 'double_points',
      multiplier: 2,
      minSpend: 10000
    };

    const card = {
      id: 'card_1',
      pointsBalance: 0,
      currentStamps: 0
    };

    // Case A: Below minSpend -> normal points
    const resA = calculateOrderLoyalty({
      orderTotal: 8000,
      program,
      promotions: [promo],
      currentCard: card
    });
    assert.equal(resA.pointsEarned, 8);

    // Case B: Above minSpend -> double points (15,000 / 1000 = 15 * 2 = 30)
    const resB = calculateOrderLoyalty({
      orderTotal: 15000,
      program,
      promotions: [promo],
      currentCard: card
    });
    assert.equal(resB.pointsEarned, 30);
  });

  await t.test('5. Digital Stamp Card and Target Completion QR Voucher', () => {
    const program = {
      isActive: true,
      programType: 'stamps',
      stampsTarget: 5,
      stampsPrize: 'Hamburguesa clásica gratis',
      minSpendPerStamp: 4000
    };

    const card = {
      id: 'card_stamp_1',
      identification: '205550999',
      customerName: 'Laura Mora',
      pointsBalance: 0,
      currentStamps: 4, // Needs only 1 more stamp!
      totalStampsRedeemed: 0
    };

    // Order with ₡6,000 (qualifies for 1 stamp)
    const result = calculateOrderLoyalty({
      orderTotal: 6000,
      program,
      currentCard: card
    });

    assert.equal(result.stampsEarned, 1);
    assert.equal(result.updatedCard.currentStamps, 0); // Board resets to 0 for next card
    assert.equal(result.updatedCard.totalStampsRedeemed, 1);

    // Voucher generated
    assert.ok(result.voucher, 'Voucher must be generated upon completing target');
    assert.ok(result.voucher.voucherCode.startsWith('VOUCH-'));
    assert.equal(result.voucher.rewardDescription, 'Hamburguesa clásica gratis');
    assert.equal(result.voucher.status, 'active');
  });

  await t.test('6. WhatsApp Bot Warm Colloquial Response Formatting', () => {
    const program = {
      isActive: true,
      programType: 'both',
      currency: 'CRC',
      pointsRedeemRatio: 10,
      pointsExpiryMonths: 12,
      stampsTarget: 10,
      stampsPrize: 'Café americano + queque seco'
    };

    const card = {
      id: 'card_7',
      identification: '1-1234-5678',
      customerName: 'Esteban Alpízar',
      pointsBalance: 420,
      currentStamps: 7
    };

    const text = formatLoyaltySummaryForBot(program, card, 'https://betico.tech');

    assert.ok(text.includes('🌟 *Club de Lealtad - Resumen de tu Tarjeta*'));
    assert.ok(text.includes('Esteban Alpízar'));
    assert.ok(text.includes('420 puntos'));
    assert.ok(/₡\s*4[.,\s]?200/.test(text));
    assert.ok(text.includes('7 de 10 sellos completados'));
    assert.ok(text.includes('¡Te faltan solo *3 sello(s)* para ganar tu premio'));
    assert.ok(text.includes('https://betico.tech/fidelidad'));
  });

  await t.test('7. Multi-Tenant Wallet Aggregation Simulation', () => {
    const customerCedula = '112345678';

    // Simulate 3 separate merchant accounts
    const merchantCards = [
      {
        id: 'card_soda_1',
        tenantId: 'tenant_soda',
        tenantName: 'Soda La Amistad',
        identification: customerCedula,
        pointsBalance: 120,
        currentStamps: 3
      },
      {
        id: 'card_barber_2',
        tenantId: 'tenant_barber',
        tenantName: 'Barbershop San José',
        identification: customerCedula,
        pointsBalance: 800,
        currentStamps: 8
      },
      {
        id: 'card_pizza_3',
        tenantId: 'tenant_pizza',
        tenantName: 'Pizzería Napolitana',
        identification: customerCedula,
        pointsBalance: 350,
        currentStamps: 1
      }
    ];

    // Filter wallet by master Cédula
    const customerWallet = merchantCards.filter(c => cleanIdentification(c.identification) === cleanIdentification(customerCedula));

    assert.equal(customerWallet.length, 3);
    const storeNames = customerWallet.map(c => c.tenantName);
    assert.deepEqual(storeNames, [
      'Soda La Amistad',
      'Barbershop San José',
      'Pizzería Napolitana'
    ]);
  });

  await t.test('8. Order Processing Idempotency Protection', () => {
    const processedOrders = new Set();

    function tryRewardOrder(orderId) {
      if (processedOrders.has(orderId)) {
        return { rewarded: false, reason: 'duplicate' };
      }
      processedOrders.add(orderId);
      return { rewarded: true, points: 25 };
    }

    const firstRun = tryRewardOrder('ord_1001');
    assert.strictEqual(firstRun.rewarded, true);

    const secondRun = tryRewardOrder('ord_1001');
    assert.strictEqual(secondRun.rewarded, false);
    assert.strictEqual(secondRun.reason, 'duplicate');
  });

});
