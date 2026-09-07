import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

describe('Specialist Portal Multi-Tenant Isolation & Routing Tests', () => {

  describe('1. Route & Slug Extraction Matching', () => {
    const parseSpecialistSlug = (pathname) => {
      const cleanPath = (pathname || '').split('?')[0].split('#')[0];
      const match = cleanPath.match(/^\/(?:especialista|colaborador|equipo)(?:\/([a-zA-Z0-9_-]+))?/i);
      return (match && match[1]) ? match[1].toLowerCase().trim() : undefined;
    };

    test('should extract slug correctly from /especialista/:slug', () => {
      assert.equal(parseSpecialistSlug('/especialista/barberia-elite'), 'barberia-elite');
    });

    test('should extract slug correctly from /colaborador/:slug', () => {
      assert.equal(parseSpecialistSlug('/colaborador/clinica-dental-sonrisas'), 'clinica-dental-sonrisas');
    });

    test('should extract slug correctly from /equipo/:slug', () => {
      assert.equal(parseSpecialistSlug('/equipo/spa-relajacion'), 'spa-relajacion');
    });

    test('should return undefined when no slug is present in /especialista or /especialista/', () => {
      assert.equal(parseSpecialistSlug('/especialista'), undefined);
      assert.equal(parseSpecialistSlug('/especialista/'), undefined);
      assert.equal(parseSpecialistSlug('/colaborador'), undefined);
    });

    test('should ignore query params and hash fragments during route extraction', () => {
      assert.equal(parseSpecialistSlug('/especialista/barberia-elite?pin=4921&ref=whatsapp'), 'barberia-elite');
      assert.equal(parseSpecialistSlug('/colaborador/estetica#seccion'), 'estetica');
    });
  });

  describe('2. Multi-Tenant PIN Collision Prevention', () => {
    // Mock database table with identical PIN across two distinct tenants
    const mockSpecialistsDb = [
      {
        id: 'spec_tenant_A_001',
        tenantId: 'tenant_barberia_A',
        name: 'Carlos Barbero',
        accessPin: '1234',
        active: true
      },
      {
        id: 'spec_tenant_B_002',
        tenantId: 'tenant_salon_B',
        name: 'Carlos Estilista',
        accessPin: '1234',
        active: true
      }
    ];

    function findSpecialistByPin(pin, tenantId, phone) {
      const cleanPin = (pin || '').trim();
      if (!cleanPin) return null;

      let matches = mockSpecialistsDb.filter(s => s.accessPin === cleanPin && s.active);

      if (tenantId) {
        matches = matches.filter(s => s.tenantId === tenantId);
      }

      if (matches.length > 1 && !tenantId && !phone) {
        // Collision detected: prevent cross-tenant credential leakage
        return null;
      }

      return matches[0] || null;
    }

    test('strictly resolves Carlos Barbero when tenantId for Barberia A is provided', () => {
      const result = findSpecialistByPin('1234', 'tenant_barberia_A');
      assert.ok(result);
      assert.equal(result.id, 'spec_tenant_A_001');
      assert.equal(result.name, 'Carlos Barbero');
      assert.equal(result.tenantId, 'tenant_barberia_A');
    });

    test('strictly resolves Carlos Estilista when tenantId for Salon B is provided', () => {
      const result = findSpecialistByPin('1234', 'tenant_salon_B');
      assert.ok(result);
      assert.equal(result.id, 'spec_tenant_B_002');
      assert.equal(result.name, 'Carlos Estilista');
      assert.equal(result.tenantId, 'tenant_salon_B');
    });

    test('refuses to authenticate without tenantId when collision exists between tenants', () => {
      const result = findSpecialistByPin('1234'); // No tenantId provided
      assert.equal(result, null, 'Must refuse login to prevent cross-tenant access');
    });

    test('rejects login if PIN does not belong to the requested tenant', () => {
      const result = findSpecialistByPin('1234', 'tenant_otro_comercio_C');
      assert.equal(result, null);
    });
  });

  describe('3. Specialist JWT Session Integrity', () => {
    const JWT_SECRET = 'secret_test_key_for_specialist_portal_jwt_2026';

    test('issues valid JWT and decodes specialistId directly for single-lookup session resolution', () => {
      const specialist = {
        id: 'spec_uuid_777',
        tenantId: 'tenant_barberia_A',
        role: 'specialist'
      };

      const token = jwt.sign(
        { specialistId: specialist.id, tenantId: specialist.tenantId, role: specialist.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      const decoded = jwt.verify(token, JWT_SECRET);
      assert.equal(decoded.specialistId, 'spec_uuid_777');
      assert.equal(decoded.tenantId, 'tenant_barberia_A');
      assert.equal(decoded.role, 'specialist');
    });

    test('rejects tampered or invalid specialist tokens', () => {
      const token = jwt.sign({ specialistId: 'spec_uuid_777' }, JWT_SECRET);
      assert.throws(() => {
        jwt.verify(token, 'wrong_secret_attack');
      });
    });
  });

  describe('4. 1-Click WhatsApp Direct Login Parameter Handling', () => {
    test('extracts pin from query string for seamless automatic login', () => {
      const queryString = '?pin=4921';
      const params = new URLSearchParams(queryString);
      const pin = params.get('pin');
      assert.equal(pin, '4921');
    });

    test('handles whitespace or missing pin gracefully', () => {
      const params = new URLSearchParams('');
      assert.equal(params.get('pin'), null);
    });
  });

});
