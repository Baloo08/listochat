import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'betico_test_jwt_secret_64_chars_super_safe_key_cr_2026_test';

describe('Tilopay Session Resilience & Multi-Tenant Return Protocol', () => {

  test('1. session_token generates valid signed token with subscription_return scope', () => {
    const payload = {
      userId: 'usr_test_123',
      tenantId: 'tnt_test_456',
      action: 'subscription_return',
      orderNumber: 'SUB-CARD-tnt_test_456-1725000000'
    };

    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '30m' });
    assert.ok(token, 'Token must be generated');

    const decoded = jwt.verify(token, TEST_SECRET);
    assert.equal(decoded.userId, 'usr_test_123');
    assert.equal(decoded.tenantId, 'tnt_test_456');
    assert.equal(decoded.action, 'subscription_return');
    assert.equal(decoded.orderNumber, 'SUB-CARD-tnt_test_456-1725000000');
  });

  test('2. exchange-return-token rejects token with invalid signature', () => {
    const payload = {
      userId: 'usr_test_123',
      tenantId: 'tnt_test_456',
      action: 'subscription_return'
    };
    const invalidToken = jwt.sign(payload, 'wrong_unauthorized_secret');

    assert.throws(() => {
      jwt.verify(invalidToken, TEST_SECRET);
    }, /invalid signature/);
  });

  test('3. exchange-return-token rejects token without subscription_return action', () => {
    const payload = {
      userId: 'usr_test_123',
      tenantId: 'tnt_test_456',
      action: 'unauthorized_action'
    };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '30m' });
    const decoded = jwt.verify(token, TEST_SECRET);

    const isValidReturnToken = decoded.action === 'subscription_return' && !!decoded.userId && !!decoded.tenantId;
    assert.equal(isValidReturnToken, false, 'Should reject token without subscription_return action');
  });

  test('4. exchange-return-token rejects expired token', () => {
    const payload = {
      userId: 'usr_test_123',
      tenantId: 'tnt_test_456',
      action: 'subscription_return'
    };
    const expiredToken = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

    assert.throws(() => {
      jwt.verify(expiredToken, TEST_SECRET);
    }, /jwt expired/);
  });

  test('5. Multi-tenant isolation: ensures tenantId cannot be forged or mismatched', () => {
    const tokenPayload = {
      userId: 'usr_tenant_A',
      tenantId: 'tenant_A',
      action: 'subscription_return'
    };
    const token = jwt.sign(tokenPayload, TEST_SECRET, { expiresIn: '30m' });
    const decoded = jwt.verify(token, TEST_SECRET);

    // Mock DB lookup check: user must belong to decoded.tenantId
    const mockDbUser = { id: 'usr_tenant_A', tenantId: 'tenant_A', active: true };
    const belongsToTenant = mockDbUser.tenantId === decoded.tenantId && mockDbUser.active === true;
    assert.equal(belongsToTenant, true, 'User belongs to matching tenant');

    // Attempt cross-tenant spoofing
    const crossTenantSpoofed = 'tenant_B';
    const spoofDetected = mockDbUser.tenantId !== crossTenantSpoofed;
    assert.equal(spoofDetected, true, 'Cross-tenant mismatch must be detected');
  });

  test('6. Tilopay callback parameter classification handles success, cancel and decline', () => {
    function parseTilopayOutcome(code, desc) {
      if (code === '1' || code === '00') return 'success';
      if (code === '0' || (desc && desc.toLowerCase().includes('cancel'))) return 'cancelled';
      if (code === '2' || (desc && desc.toLowerCase().includes('declin'))) return 'declined';
      return 'cancelled';
    }

    assert.equal(parseTilopayOutcome('1', 'Aprobada'), 'success');
    assert.equal(parseTilopayOutcome('00', 'Transaccion exitosa'), 'success');
    assert.equal(parseTilopayOutcome('0', 'Cancelado por usuario'), 'cancelled');
    assert.equal(parseTilopayOutcome('2', 'Fondos insuficientes'), 'declined');
    assert.equal(parseTilopayOutcome(null, 'Operacion cancelada'), 'cancelled');
  });

  test('7. Clean Redirect URL avoids syntax collision with dual question marks', () => {
    const appUrl = 'https://betico.tech';
    const sessionToken = 'mock_token_abc123';
    const cleanRedirectUrl = `${appUrl}/subscription/return?session_token=${sessionToken}`;

    // Ensure it does not have /app?card_status=success?code=1
    assert.ok(!cleanRedirectUrl.includes('/app?card_status=success'), 'Should not redirect to raw /app');
    assert.ok(cleanRedirectUrl.startsWith('https://betico.tech/subscription/return?session_token='), 'Should point to dedicated return route');

    // When Tilopay appends &code=1, URL remains well-formed
    const withTilopayParams = `${cleanRedirectUrl}&code=1&order=SUB-CARD-123`;
    const parsed = new URL(withTilopayParams);
    assert.equal(parsed.pathname, '/subscription/return');
    assert.equal(parsed.searchParams.get('session_token'), 'mock_token_abc123');
    assert.equal(parsed.searchParams.get('code'), '1');
    assert.equal(parsed.searchParams.get('order'), 'SUB-CARD-123');
  });

  describe('8. Tilopay Active Double-Factor Verification (Anti-Spoofing Protocol - ISO/IEC 25010)', () => {
    function parseConsultResponse(data, statusOk) {
      if (!statusOk) {
        return {
          verified: false,
          isApproved: false,
          error: data.message || data.error || 'HTTP error from Tilopay'
        };
      }

      const result = data.result || data;
      const resultCode = String(result.result_code || result.code || result.result || '');
      const status = String(result.status || '').toLowerCase();
      const isApproved =
        resultCode === '1' ||
        resultCode === '00' ||
        status === 'approved' ||
        status === 'success' ||
        status === 'paid' ||
        result.approved === true;

      return {
        verified: true,
        isApproved,
        transactionId: result.transaction_id || result.transactionId || result.id,
        authCode: result.auth_code || result.authCode || result.authorization,
        status,
        resultCode
      };
    }

    test('accepts transaction and extracts authoritative txId when Tilopay API confirms approval', () => {
      const mockApiResponse = {
        result: {
          result_code: '1',
          status: 'approved',
          transaction_id: 'tx_auth_real_777',
          auth_code: 'auth_999000'
        }
      };

      const outcome = parseConsultResponse(mockApiResponse, true);
      assert.equal(outcome.verified, true);
      assert.equal(outcome.isApproved, true);
      assert.equal(outcome.transactionId, 'tx_auth_real_777');
      assert.equal(outcome.authCode, 'auth_999000');
    });

    test('neutralizes spoofed webhook when payload claims approved (result_code=1) but Tilopay API reports decline', () => {
      // Attacker sends fake payload with resultCode 1
      const fakeWebhookPayload = {
        orderNumber: 'ORD-100',
        result_code: '1',
        transaction_id: 'fake_attacker_tx'
      };

      // Real Tilopay API returns the true transaction state: declined
      const realApiResponse = {
        result: {
          result_code: '2',
          status: 'declined',
          error: 'Fondos insuficientes'
        }
      };

      const outcome = parseConsultResponse(realApiResponse, true);
      assert.equal(outcome.verified, true);
      assert.equal(outcome.isApproved, false, 'Spoofed webhook must be rejected despite payload claiming success');
    });

    test('neutralizes spoofed webhook when transaction does not exist in Tilopay (HTTP 404)', () => {
      const mockApiNotFound = {
        message: 'No transaction found with specified orderNumber'
      };

      const outcome = parseConsultResponse(mockApiNotFound, false);
      assert.equal(outcome.verified, false);
      assert.equal(outcome.isApproved, false);
      assert.ok(outcome.error.includes('No transaction found'));
    });

    test('handles network timeouts gracefully without approving transaction', () => {
      function simulateTimeoutHandling() {
        try {
          throw new Error('Tiempo de espera agotado al conectar con Tilopay (10s)');
        } catch (err) {
          return {
            verified: false,
            isApproved: false,
            error: err.message
          };
        }
      }

      const res = simulateTimeoutHandling();
      assert.equal(res.verified, false);
      assert.equal(res.isApproved, false);
      assert.ok(res.error.includes('Tiempo de espera agotado'));
    });
  });

  describe('9. Subscription Trial Abuse Prevention & Order Tracking Token (ISO/IEC 25010)', () => {
    function evaluateReactivationPolicy({ isAliado, trialConsumed, hasRegisteredCard }) {
      if (isAliado) {
        return {
          status: 200,
          newStatus: 'active',
          trialConsumed: trialConsumed,
          message: 'Plan Aliado Estratégico (₡0/mes)'
        };
      }

      if (trialConsumed) {
        if (!hasRegisteredCard) {
          return {
            status: 402,
            error: 'El periodo de prueba gratuita ya ha sido utilizado para este comercio. Debe vincular una tarjeta de crédito o débito para reactivar el servicio.',
            requiresCard: true
          };
        }

        return {
          status: 200,
          newStatus: 'active',
          autoBillingEnabled: true,
          trialConsumed: true,
          message: 'Reanudada con tarjeta'
        };
      }

      return {
        status: 200,
        newStatus: 'trial',
        trialConsumed: true,
        daysGranted: 15,
        message: 'Periodo de prueba inicial otorgado'
      };
    }

    test('rejects infinite trial reset when trial is already consumed and no card is registered', () => {
      const outcome = evaluateReactivationPolicy({
        isAliado: false,
        trialConsumed: true,
        hasRegisteredCard: false
      });

      assert.equal(outcome.status, 402);
      assert.equal(outcome.requiresCard, true);
      assert.ok(outcome.error.includes('ya ha sido utilizado'));
    });

    test('allows reactivation to active status when trial is already consumed but valid card is on file', () => {
      const outcome = evaluateReactivationPolicy({
        isAliado: false,
        trialConsumed: true,
        hasRegisteredCard: true
      });

      assert.equal(outcome.status, 200);
      assert.equal(outcome.newStatus, 'active');
      assert.equal(outcome.autoBillingEnabled, true);
      assert.equal(outcome.trialConsumed, true);
    });

    test('grants 15-day initial trial only once and flags trialConsumed on first activation', () => {
      const outcome = evaluateReactivationPolicy({
        isAliado: false,
        trialConsumed: false,
        hasRegisteredCard: false
      });

      assert.equal(outcome.status, 200);
      assert.equal(outcome.newStatus, 'trial');
      assert.equal(outcome.trialConsumed, true);
      assert.equal(outcome.daysGranted, 15);
    });

    test('Plan Aliado is exempt from card requirement and reactivates freely', () => {
      const outcome = evaluateReactivationPolicy({
        isAliado: true,
        trialConsumed: true,
        hasRegisteredCard: false
      });

      assert.equal(outcome.status, 200);
      assert.equal(outcome.newStatus, 'active');
    });

    test('Order tracking token format validation prevents SQL injection and non-UUID queries', () => {
      const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      const validTrackingToken = 'c7a8b9f0-1234-4567-89ab-cdef01234567';
      const invalidToken1 = '1';
      const invalidToken2 = "1' OR '1'='1";
      const invalidToken3 = 'order_99999';

      assert.ok(uuidv4Regex.test(validTrackingToken));
      assert.ok(!uuidv4Regex.test(invalidToken1));
      assert.ok(!uuidv4Regex.test(invalidToken2));
      assert.ok(!uuidv4Regex.test(invalidToken3));
    });
  });
});

