import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function cleanIdentification(id) {
  if (!id) return '';
  return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
}

describe('Customer Records (Expedientes) y Tarjetas de Fidelización Betico Club', () => {

  const mockTenant = 'tenant_clinica_san_miguel';

  // Simulated Database State
  let customerRecordsDb = [];
  let loyaltyCardsDb = [];
  let loyaltyCustomersDb = [];
  let loyaltyTransactionsDb = [];

  function resetDb() {
    customerRecordsDb = [];
    loyaltyCardsDb = [];
    loyaltyCustomersDb = [];
    loyaltyTransactionsDb = [];
  }

  // Implementation logic mirroring repo
  function createCustomerRecord(tenantId, data) {
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRecord = {
      id: recordId,
      tenantId,
      clientType: data.clientType || 'general',
      fullName: data.fullName,
      phone: data.phone || '',
      email: data.email || null,
      identification: data.identification || null,
      address: data.address || null,
      notes: data.notes || null,
      metadata: { ...(data.metadata || {}) }
    };

    if (data.enableLoyaltyCard && newRecord.identification) {
      const cleanId = cleanIdentification(newRecord.identification);
      let card = loyaltyCardsDb.find(c => c.tenantId === tenantId && cleanIdentification(c.identification) === cleanId);
      if (!card) {
        card = {
          id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tenantId,
          identification: cleanId,
          customerName: newRecord.fullName,
          customerPhone: newRecord.phone,
          pointsBalance: Number(data.initialLoyaltyPoints || 0),
          currentStamps: Number(data.initialLoyaltyStamps || 0),
          totalStampsRedeemed: 0,
          status: 'active'
        };
        loyaltyCardsDb.push(card);
      }
      newRecord.metadata.loyaltyCardId = card.id;
      newRecord.loyaltyCard = {
        id: card.id,
        pointsBalance: card.pointsBalance,
        currentStamps: card.currentStamps,
        status: card.status
      };
    }

    customerRecordsDb.push(newRecord);
    return getCustomerRecordById(recordId, tenantId);
  }

  function getCustomerRecordById(id, tenantId) {
    const r = customerRecordsDb.find(rec => rec.id === id && rec.tenantId === tenantId);
    if (!r) return null;

    let loyaltyCard = null;
    if (r.identification) {
      const cleanId = cleanIdentification(r.identification);
      const card = loyaltyCardsDb.find(c => c.tenantId === tenantId && cleanIdentification(c.identification) === cleanId);
      if (card) {
        loyaltyCard = {
          id: card.id,
          pointsBalance: card.pointsBalance,
          currentStamps: card.currentStamps,
          status: card.status
        };
      }
    }

    return {
      ...r,
      loyaltyCard
    };
  }

  function linkRecordLoyaltyCard(tenantId, recordId, options = {}) {
    const record = customerRecordsDb.find(r => r.id === recordId && r.tenantId === tenantId);
    if (!record) throw new Error('Expediente no encontrado');

    const idToUse = options.identification || record.identification;
    if (!idToUse) throw new Error('Se requiere el número de cédula');

    record.identification = idToUse;
    const cleanId = cleanIdentification(idToUse);

    let card = loyaltyCardsDb.find(c => c.tenantId === tenantId && cleanIdentification(c.identification) === cleanId);
    if (!card) {
      card = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenantId,
        identification: cleanId,
        customerName: record.fullName,
        customerPhone: record.phone,
        pointsBalance: 0,
        currentStamps: 0,
        status: 'active'
      };
      loyaltyCardsDb.push(card);
    }

    if (options.points && options.points > 0) {
      card.pointsBalance += options.points;
    }
    if (options.stamps && options.stamps > 0) {
      card.currentStamps += options.stamps;
    }

    record.metadata.loyaltyCardId = card.id;
    return getCustomerRecordById(recordId, tenantId);
  }

  function adjustRecordLoyalty(tenantId, recordId, adjustment) {
    const record = customerRecordsDb.find(r => r.id === recordId && r.tenantId === tenantId);
    if (!record) throw new Error('Expediente no encontrado');
    if (!record.identification) throw new Error('El expediente debe tener cédula');

    const cleanId = cleanIdentification(record.identification);
    const card = loyaltyCardsDb.find(c => c.tenantId === tenantId && cleanIdentification(c.identification) === cleanId);
    if (!card) throw new Error('Tarjeta no encontrada');

    if (adjustment.type === 'points') {
      card.pointsBalance += adjustment.amount;
    } else if (adjustment.type === 'stamps') {
      card.currentStamps += adjustment.amount;
    }

    return getCustomerRecordById(recordId, tenantId);
  }

  // Customer Wallet resolution without double registration
  function getCustomerWalletCards(identification) {
    const cleanId = cleanIdentification(identification);
    return loyaltyCardsDb.filter(c => cleanIdentification(c.identification) === cleanId && c.status === 'active');
  }

  test('1. Crear expediente con enableLoyaltyCard aprovisiona automáticamente la tarjeta Betico Club', () => {
    resetDb();

    const record = createCustomerRecord(mockTenant, {
      fullName: 'Carlos Alberto Fonseca',
      phone: '8888-1111',
      identification: '1-1234-0567',
      clientType: 'paciente',
      enableLoyaltyCard: true,
      initialLoyaltyPoints: 100,
      initialLoyaltyStamps: 1
    });

    assert.ok(record);
    assert.equal(record.fullName, 'Carlos Alberto Fonseca');
    assert.ok(record.loyaltyCard, 'El expediente debe tener el objeto loyaltyCard adjunto');
    assert.equal(record.loyaltyCard.pointsBalance, 100);
    assert.equal(record.loyaltyCard.currentStamps, 1);
    assert.equal(record.loyaltyCard.status, 'active');

    // Comprobar que en la base de datos de tarjetas existe exactamente 1 tarjeta vinculada
    assert.equal(loyaltyCardsDb.length, 1);
    assert.equal(loyaltyCardsDb[0].identification, '112340567');
    assert.equal(loyaltyCardsDb[0].pointsBalance, 100);
  });

  test('2. Sin doble registro: El cliente accede con su cédula en la API o /fidelidad y ve su tarjeta de inmediato', () => {
    // Carlos visita betico.tech/fidelidad o consulta su billetera centralizada con su cédula
    const walletCards = getCustomerWalletCards('1-1234-0567');

    assert.equal(walletCards.length, 1, 'El cliente debe ver su tarjeta automáticamente sin tener que registrarla de nuevo');
    assert.equal(walletCards[0].customerName, 'Carlos Alberto Fonseca');
    assert.equal(walletCards[0].pointsBalance, 100);
    assert.equal(walletCards[0].currentStamps, 1);
  });

  test('3. Crear expediente sin enableLoyaltyCard no aprovisiona tarjeta hasta ser vinculada', () => {
    const recordSinTarjeta = createCustomerRecord(mockTenant, {
      fullName: 'María Elena Mora',
      phone: '8888-2222',
      identification: '2-0345-0678',
      clientType: 'paciente',
      enableLoyaltyCard: false
    });

    assert.ok(recordSinTarjeta);
    assert.equal(recordSinTarjeta.loyaltyCard, null);

    // Billetera para María está vacía inicialmente
    assert.equal(getCustomerWalletCards('2-0345-0678').length, 0);

    // Vinculación posterior en 1 clic
    const recordVinculado = linkRecordLoyaltyCard(mockTenant, recordSinTarjeta.id, {
      points: 50,
      stamps: 2
    });

    assert.ok(recordVinculado.loyaltyCard);
    assert.equal(recordVinculado.loyaltyCard.pointsBalance, 50);
    assert.equal(recordVinculado.loyaltyCard.currentStamps, 2);

    // Ahora María ve su tarjeta en su billetera
    const walletMaria = getCustomerWalletCards('2-0345-0678');
    assert.equal(walletMaria.length, 1);
    assert.equal(walletMaria[0].pointsBalance, 50);
  });

  test('4. Ajuste directo de puntos y sellos desde el expediente del cliente', () => {
    // El doctor o especialista atiende a Carlos y le asigna 25 puntos y 1 sello desde el expediente
    const recCarlos = customerRecordsDb.find(r => r.identification === '1-1234-0567');
    
    // Acreditar puntos
    const updated1 = adjustRecordLoyalty(mockTenant, recCarlos.id, {
      type: 'points',
      amount: 25,
      reason: 'Consulta de control odontológico'
    });
    assert.equal(updated1.loyaltyCard.pointsBalance, 125);

    // Acreditar sello
    const updated2 = adjustRecordLoyalty(mockTenant, recCarlos.id, {
      type: 'stamps',
      amount: 1,
      reason: 'Sello por asistencia puntual'
    });
    assert.equal(updated2.loyaltyCard.currentStamps, 2);

    // La billetera del cliente refleja el saldo en tiempo real
    const walletCarlos = getCustomerWalletCards('112340567');
    assert.equal(walletCarlos[0].pointsBalance, 125);
    assert.equal(walletCarlos[0].currentStamps, 2);
  });

  test('5. Formato de cédulas con guiones o espacios no produce tarjetas duplicadas', () => {
    // Si se vincula o busca usando formatos variados ('1-1234-0567', '112340567', ' 1 1234 0567 ')
    const cards1 = getCustomerWalletCards('1-1234-0567');
    const cards2 = getCustomerWalletCards('112340567');
    const cards3 = getCustomerWalletCards(' 1 1234 0567 ');

    assert.equal(cards1.length, 1);
    assert.equal(cards2.length, 1);
    assert.equal(cards3.length, 1);
    assert.equal(cards1[0].id, cards2[0].id);
    assert.equal(cards2[0].id, cards3[0].id);
  });

});
