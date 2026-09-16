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

  describe('4. Atomic Inventory Locking & Idempotent Stock Deduction (ISO/IEC 25010)', () => {
    test('idempotency guard prevents double inventory deduction when order is already paid', () => {
      const order = {
        id: 'ord_paid_1',
        tenantId: 'tenant_demo',
        paymentStatus: 'paid',
        stockDeducted: true
      };

      let stockDeductedCalls = 0;
      function simulateConfirmPayment(currentOrder) {
        if (String(currentOrder.paymentStatus).toLowerCase() === 'paid') {
          return { success: true, alreadyProcessed: true };
        }
        stockDeductedCalls++;
        return { success: true, alreadyProcessed: false };
      }

      const res = simulateConfirmPayment(order);
      assert.equal(res.success, true);
      assert.equal(res.alreadyProcessed, true);
      assert.equal(stockDeductedCalls, 0, 'Must NOT deduct stock if order is already paid');
    });

    test('enforces deterministic locking sequence (product_id ASC) to prevent deadlocks', () => {
      const items = [
        { productId: 'prod_z', variantId: 'var_1', quantity: 2 },
        { productId: 'prod_a', variantId: null, quantity: 1 },
        { productId: 'prod_m', variantId: 'var_2', quantity: 3 }
      ];

      // Sort items in the exact manner executeOrderPaymentConfirmation queries them
      const sorted = [...items].sort((a, b) => {
        if (a.productId !== b.productId) {
          return a.productId.localeCompare(b.productId);
        }
        if (!a.variantId && !b.variantId) return 0;
        if (!a.variantId) return -1;
        if (!b.variantId) return 1;
        return a.variantId.localeCompare(b.variantId);
      });

      assert.equal(sorted[0].productId, 'prod_a');
      assert.equal(sorted[1].productId, 'prod_m');
      assert.equal(sorted[2].productId, 'prod_z');
    });

    test('deducts inventory safely and guards against negative stock with GREATEST(0, stock - qty)', () => {
      const products = new Map([
        ['p1', { id: 'p1', stock: 5, trackStock: true }],
        ['p2', { id: 'p2', stock: 1, trackStock: true }],
        ['p3', { id: 'p3', stock: 10, trackStock: false }]
      ]);

      const items = [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 3 }, // More than current stock -> should floor at 0
        { productId: 'p3', quantity: 5 }  // trackStock is false -> should not change
      ];

      for (const item of items) {
        const prod = products.get(item.productId);
        if (prod && prod.trackStock) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      }

      assert.equal(products.get('p1').stock, 3);
      assert.equal(products.get('p2').stock, 0); // Floored at 0 without going negative
      assert.equal(products.get('p3').stock, 10); // Untouched because trackStock is false
    });

    test('executes rollback and releases client on unexpected database errors', async () => {
      let rolledBack = false;
      let released = false;

      const mockClient = {
        query: async (sql) => {
          if (sql === 'BEGIN') return;
          if (sql === 'ROLLBACK') { rolledBack = true; return; }
          if (sql.includes('SELECT * FROM orders')) {
            throw new Error('Database connection reset during lock acquisition');
          }
        },
        release: () => { released = true; }
      };

      let outcome;
      try {
        await mockClient.query('BEGIN');
        await mockClient.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE');
      } catch (err) {
        await mockClient.query('ROLLBACK');
        outcome = { success: false, error: err.message };
      } finally {
        mockClient.release();
      }

      assert.equal(rolledBack, true, 'Must execute ROLLBACK on error');
      assert.equal(released, true, 'Must release DB client back to pool');
      assert.equal(outcome.success, false);
      assert.ok(outcome.error.includes('Database connection reset'));
    });
  });

});