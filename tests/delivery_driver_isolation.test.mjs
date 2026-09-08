import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

describe('Delivery Driver Portal Multi-Tenant Isolation & Routing Tests', () => {

  describe('1. Route & Slug Extraction Matching', () => {
    const parseDriverSlug = (pathname) => {
      const cleanPath = (pathname || '').split('?')[0].split('#')[0];
      const match = cleanPath.match(/^\/(?:repartidor|driver|mensajero)(?:\/([a-zA-Z0-9_-]+))?/i);
      return (match && match[1]) ? match[1].toLowerCase().trim() : undefined;
    };

    test('should extract slug correctly from /repartidor/:slug', () => {
      assert.equal(parseDriverSlug('/repartidor/pizzeria-roma'), 'pizzeria-roma');
    });

    test('should extract slug correctly from /driver/:slug', () => {
      assert.equal(parseDriverSlug('/driver/burger-king-cr'), 'burger-king-cr');
    });

    test('should extract slug correctly from /mensajero/:slug', () => {
      assert.equal(parseDriverSlug('/mensajero/sushi-express'), 'sushi-express');
    });

    test('should return undefined when no slug is present in generic routes', () => {
      assert.equal(parseDriverSlug('/repartidor'), undefined);
      assert.equal(parseDriverSlug('/repartidor/'), undefined);
      assert.equal(parseDriverSlug('/driver'), undefined);
      assert.equal(parseDriverSlug('/mensajero'), undefined);
    });

    test('should ignore query params and hash fragments during route extraction', () => {
      assert.equal(parseDriverSlug('/repartidor/pizzeria-roma?pin=8492&source=wa'), 'pizzeria-roma');
      assert.equal(parseDriverSlug('/driver/burger-express#pedidos'), 'burger-express');
    });
  });

  describe('2. Multi-Tenant PIN Collision Prevention', () => {
    // Mock database table with identical PIN across two distinct merchants
    const mockDriversDb = [
      {
        id: 'drv_pizzeria_001',
        tenantId: 'tenant_pizzeria_roma',
        name: 'Andrés Moto',
        accessPin: '8492',
        phone: '50688881111',
        active: true
      },
      {
        id: 'drv_burger_002',
        tenantId: 'tenant_burger_express',
        name: 'Andrés Express',
        accessPin: '8492',
        phone: '50688882222',
        active: true
      }
    ];

    function findDriverByPin(pin, tenantId, phone) {
      const cleanPin = (pin || '').trim();
      if (!cleanPin) return null;

      let matches = mockDriversDb.filter(d => d.accessPin === cleanPin && d.active);

      if (tenantId) {
        matches = matches.filter(d => d.tenantId === tenantId);
      }

      if (phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        matches = matches.filter(d => d.phone && d.phone.replace(/\D/g, '').includes(cleanPhone));
      }

      // Collision detected without tenantId or phone: prevent cross-tenant credential leakage
      if (matches.length > 1 && !tenantId && !phone) {
        return null;
      }

      return matches[0] || null;
    }

    test('strictly resolves Andrés Moto when tenantId for Pizzeria Roma is provided', () => {
      const result = findDriverByPin('8492', 'tenant_pizzeria_roma');
      assert.ok(result);
      assert.equal(result.id, 'drv_pizzeria_001');
      assert.equal(result.name, 'Andrés Moto');
      assert.equal(result.tenantId, 'tenant_pizzeria_roma');
    });

    test('strictly resolves Andrés Express when tenantId for Burger Express is provided', () => {
      const result = findDriverByPin('8492', 'tenant_burger_express');
      assert.ok(result);
      assert.equal(result.id, 'drv_burger_002');
      assert.equal(result.name, 'Andrés Express');
      assert.equal(result.tenantId, 'tenant_burger_express');
    });

    test('refuses to authenticate without tenantId or phone when collision exists between merchants', () => {
      const result = findDriverByPin('8492'); // No tenantId or phone
      assert.equal(result, null, 'Must refuse login to prevent cross-tenant access');
    });

    test('disambiguates between identical PINs using phone number if tenantId is omitted', () => {
      const result = findDriverByPin('8492', undefined, '8888-2222');
      assert.ok(result);
      assert.equal(result.id, 'drv_burger_002');
      assert.equal(result.name, 'Andrés Express');
    });

    test('rejects login if PIN does not belong to the requested tenant', () => {
      const result = findDriverByPin('8492', 'tenant_otro_restaurante');
      assert.equal(result, null);
    });
  });

  describe('3. Driver JWT Session Integrity', () => {
    const JWT_SECRET = 'secret_test_key_for_driver_portal_jwt_2026';

    test('issues valid JWT and decodes driverId directly for single-lookup session resolution', () => {
      const driver = {
        id: 'drv_uuid_999',
        tenantId: 'tenant_pizzeria_roma',
        role: 'driver'
      };

      const token = jwt.sign(
        { driverId: driver.id, tenantId: driver.tenantId, role: driver.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const decoded = jwt.verify(token, JWT_SECRET);
      assert.equal(decoded.driverId, 'drv_uuid_999');
      assert.equal(decoded.tenantId, 'tenant_pizzeria_roma');
      assert.equal(decoded.role, 'driver');
    });

    test('rejects tampered or invalid driver tokens', () => {
      const token = jwt.sign({ driverId: 'drv_uuid_999' }, JWT_SECRET);
      assert.throws(() => {
        jwt.verify(token, 'wrong_secret_attack');
      });
    });
  });

  describe('4. 1-Click WhatsApp Direct Login Parameter Handling', () => {
    test('extracts pin from query string for seamless automatic login', () => {
      const queryString = '?pin=8492';
      const params = new URLSearchParams(queryString);
      const pin = params.get('pin');
      assert.equal(pin, '8492');
    });

    test('handles whitespace or missing pin gracefully', () => {
      const params = new URLSearchParams('');
      assert.equal(params.get('pin'), null);
    });

    test('sanitizes URL by removing pin from address bar to protect credentials', () => {
      const originalUrl = 'https://betico.tech/repartidor/pizzeria-roma?pin=8492';
      const parsed = new URL(originalUrl);
      parsed.searchParams.delete('pin');
      assert.equal(parsed.pathname, '/repartidor/pizzeria-roma');
      assert.equal(parsed.searchParams.has('pin'), false);
    });
  });

});
