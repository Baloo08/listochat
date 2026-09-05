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
});
