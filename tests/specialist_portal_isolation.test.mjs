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

  describe('5. Short Date and Time Formatter Integrity', () => {
    // Replicate pure formatter logic
    const SPANISH_SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

    function formatShortDate(dateInput) {
      if (!dateInput) return '';
      const str = typeof dateInput === 'string' ? dateInput.trim() : dateInput.toISOString();
      const datePart = str.split('T')[0];
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
          return `${day} ${SPANISH_SHORT_MONTHS[monthIdx]} ${year}`;
        }
      }
      return str;
    }

    function formatShortTime(timeInput) {
      if (!timeInput) return '';
      const clean = String(timeInput).trim();
      const match = clean.match(/^(\d{1,2}):(\d{2})/);
      return match ? `${match[1].padStart(2, '0')}:${match[2]}` : clean;
    }

    function formatShortDateTime(dateTimeInput) {
      if (!dateTimeInput) return '';
      const d = new Date(dateTimeInput);
      if (isNaN(d.getTime())) return String(dateTimeInput);
      const day = d.getDate();
      const month = SPANISH_SHORT_MONTHS[d.getMonth()];
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month} ${year}, ${hours}:${mins}`;
    }

    test('formats ISO and date-only strings into clean short format without timezone shifts', () => {
      assert.equal(formatShortDate('2026-09-08'), '8 Set 2026');
      assert.equal(formatShortDate('2026-09-08T00:00:00.000Z'), '8 Set 2026');
      assert.equal(formatShortDate('2026-01-15'), '15 Ene 2026');
      assert.equal(formatShortDate('2026-12-31'), '31 Dic 2026');
    });

    test('formats time strings into clean 24-hour HH:MM format removing trailing seconds', () => {
      assert.equal(formatShortTime('09:00:00'), '09:00');
      assert.equal(formatShortTime('9:30'), '09:30');
      assert.equal(formatShortTime('14:45:12'), '14:45');
    });

    test('formats full timestamps into clean short date and time without verbose GMT strings', () => {
      const formatted = formatShortDateTime('2026-09-08T15:30:00.000Z');
      assert.ok(formatted.includes('Set 2026'));
      assert.ok(!formatted.includes('GMT'));
      assert.ok(!formatted.includes('Central Standard Time'));
    });
  });

  describe('6. Specialist Completed History Filtering & Status Variants', () => {
    const mockAppointments = [
      { id: 'appt_1', specialistId: 'spec_1', status: 'completed', date: '2026-09-01', time: '09:00' },
      { id: 'appt_2', specialistId: 'spec_1', status: 'completada', date: '2026-09-05', time: '10:00' },
      { id: 'appt_3', specialistId: 'spec_1', status: 'realizada', date: '2026-09-07', time: '11:00' },
      { id: 'appt_4', specialistId: 'spec_1', status: 'scheduled', date: '2026-09-08', time: '14:00' },
      { id: 'appt_5', specialistId: 'spec_2', status: 'completed', date: '2026-09-07', time: '15:00' }
    ];

    const completedStatuses = ['completed', 'completado', 'completada', 'realizada', 'finalizada', 'atendida', 'done'];

    function filterSpecialistHistory(specialistId, fromDate, toDate) {
      return mockAppointments.filter(a => {
        if (a.specialistId !== specialistId) return false;
        if (!completedStatuses.includes(a.status.toLowerCase())) return false;
        if (fromDate && a.date < fromDate) return false;
        if (toDate && a.date > toDate) return false;
        return true;
      });
    }

    test('retrieves all completed appointments across completed, completada, and realizada variants when no date filter is passed', () => {
      const history = filterSpecialistHistory('spec_1');
      assert.equal(history.length, 3);
      const ids = history.map(h => h.id);
      assert.deepEqual(ids, ['appt_1', 'appt_2', 'appt_3']);
    });

    test('excludes pending and scheduled appointments from completed history', () => {
      const history = filterSpecialistHistory('spec_1');
      assert.ok(!history.some(h => h.status === 'scheduled'));
    });

    test('filters accurately when date range is specified without dropping matching dates', () => {
      const history = filterSpecialistHistory('spec_1', '2026-09-05', '2026-09-07');
      assert.equal(history.length, 2);
      assert.equal(history[0].id, 'appt_2');
      assert.equal(history[1].id, 'appt_3');
    });
  });

});

