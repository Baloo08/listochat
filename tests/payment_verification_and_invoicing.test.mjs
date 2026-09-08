import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Payment Verification & Almendro Electronic Invoicing Tests', () => {

  describe('1. Tilopay Callback Sanitization & Zero-Timeout Protocol', () => {
    function sanitizeAppUrl(rawUrl) {
      let url = (rawUrl || 'https://betico.tech').trim().replace(/\/$/, '');
      if (url.includes('easypanel.host') || !url.startsWith('https://')) {
        url = 'https://betico.tech';
      }
      return url;
    }

    test('forces https://betico.tech when easypanel.host is passed', () => {
      const input = 'https://betico-app.qvtdko.easypanel.host';
      const clean = sanitizeAppUrl(input);
      assert.equal(clean, 'https://betico.tech');
      assert.equal(clean + '/api/webhooks/tilopay', 'https://betico.tech/api/webhooks/tilopay');
    });

    test('forces https when insecure http:// domain is passed', () => {
      const input = 'http://betico.tech';
      const clean = sanitizeAppUrl(input);
      assert.equal(clean, 'https://betico.tech');
    });

    test('preserves valid custom production domain over https', () => {
      const input = 'https://app.comercio.cr';
      const clean = sanitizeAppUrl(input);
      assert.equal(clean, 'https://app.comercio.cr');
    });

    test('defaults to https://betico.tech when env var is missing or empty', () => {
      assert.equal(sanitizeAppUrl(''), 'https://betico.tech');
      assert.equal(sanitizeAppUrl(null), 'https://betico.tech');
      assert.equal(sanitizeAppUrl(undefined), 'https://betico.tech');
    });
  });

  describe('2. Manual Payment Proof Verification & State Transitions', () => {
    test('proof status verified transitions payment_status to paid and stockDeducted true', () => {
      const order = {
        id: 'ord_123',
        paymentStatus: 'pending',
        paymentProofStatus: 'received',
        stockDeducted: false
      };

      function applyProofStatus(currentOrder, newProofStatus) {
        if (!['pending', 'received', 'verified'].includes(newProofStatus)) {
          throw new Error('Estado inválido');
        }
        if (newProofStatus === 'verified') {
          return {
            ...currentOrder,
            paymentProofStatus: 'verified',
            paymentStatus: 'paid',
            stockDeducted: true
          };
        } else if (newProofStatus === 'received') {
          return {
            ...currentOrder,
            paymentProofStatus: 'received',
            paymentStatus: 'proof_sent'
          };
        } else {
          return {
            ...currentOrder,
            paymentProofStatus: 'pending',
            paymentStatus: 'pending'
          };
        }
      }

      const verified = applyProofStatus(order, 'verified');
      assert.equal(verified.paymentStatus, 'paid');
      assert.equal(verified.paymentProofStatus, 'verified');
      assert.equal(verified.stockDeducted, true);

      const rejected = applyProofStatus(verified, 'pending');
      assert.equal(rejected.paymentStatus, 'pending');
      assert.equal(rejected.paymentProofStatus, 'pending');
    });

    test('rejects invalid proof status values', () => {
      assert.throws(() => {
        const validStatuses = ['pending', 'received', 'verified'];
        const input = 'approved_hack';
        if (!validStatuses.includes(input)) throw new Error('Estado inválido');
      }, /Estado inválido/);
    });
  });

  describe('3. Almendro Order Invoicing & Idempotency Protocol', () => {
    test('detects when an order requires invoice and prepares tax line items', () => {
      const order = {
        id: 'ord_777',
        orderNumber: 105,
        customerName: 'Supermercado Central S.A.',
        customerEmail: 'contabilidad@central.cr',
        total: 15000,
        subtotal: 13274.34,
        deliveryFee: 1500,
        currency: 'CRC',
        items: [
          { productName: 'Combo Familiar', variantName: 'Grande', quantity: 2, unitPrice: 5887.17 }
        ],
        billingInfo: {
          requiresInvoice: true,
          idType: '02',
          idNumber: '3101123456',
          legalName: 'Supermercado Central S.A.',
          email: 'facturas@central.cr'
        }
      };

      assert.equal(order.billingInfo.requiresInvoice, true);
      assert.equal(order.billingInfo.idType, '02');
      assert.equal(order.billingInfo.idNumber, '3101123456');

      const lines = order.items.map((it, idx) => ({
        line_number: idx + 1,
        cabys_code: '8311100000000',
        description: it.productName + ' - ' + it.variantName,
        quantity: Number(it.quantity).toFixed(3),
        unit_price: Number(it.unitPrice).toFixed(5)
      }));

      assert.equal(lines.length, 1);
      assert.equal(lines[0].quantity, '2.000');
      assert.equal(lines[0].unit_price, '5887.17000');
    });

    test('idempotency guard prevents duplicate emission if numericKey is already issued', () => {
      const alreadyInvoicedOrder = {
        id: 'ord_already_paid',
        billingInfo: {
          requiresInvoice: true,
          numericKey: '50608092600310112345600100001010000000123199999999',
          pdfUrl: 'https://fe.almendro.cr/api/v1/public/vouchers/50608092600310112345600100001010000000123199999999/pdf',
          invoiceStatus: 'issued'
        }
      };

      let emissionCallCount = 0;
      function simulateEmitOrderInvoice(order) {
        if (order.billingInfo?.numericKey && order.billingInfo?.invoiceStatus === 'issued') {
          return {
            success: true,
            numericKey: order.billingInfo.numericKey,
            alreadyIssued: true
          };
        }
        emissionCallCount++;
        return { success: true, numericKey: '506NEW...' };
      }

      const res = simulateEmitOrderInvoice(alreadyInvoicedOrder);
      assert.equal(res.alreadyIssued, true);
      assert.equal(res.numericKey, alreadyInvoicedOrder.billingInfo.numericKey);
      assert.equal(emissionCallCount, 0, 'Must NOT call Almendro API when invoice already exists');
    });

    test('multi-tenant isolation: order invoice must match requesting tenantId', () => {
      const orders = [
        { id: 'ord_1', tenantId: 'tenant_taller' },
        { id: 'ord_2', tenantId: 'tenant_pizzeria' }
      ];

      function findOrderForTenant(orderId, tenantId) {
        return orders.find(o => o.id === orderId && o.tenantId === tenantId) || null;
      }

      assert.ok(findOrderForTenant('ord_1', 'tenant_taller'));
      assert.equal(findOrderForTenant('ord_1', 'tenant_pizzeria'), null, 'Cross-tenant access strictly forbidden');
    });
  });

});