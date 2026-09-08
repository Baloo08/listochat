import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Customer & Patient Clinical Records (Expedientes) Isolation & Logic Tests', () => {

  const mockTenants = ['tenant_dental_sonrisas', 'tenant_estetica_glow'];

  const mockSpecialists = [
    { id: 'spec_dr_mario', tenantId: 'tenant_dental_sonrisas', name: 'Dr. Mario Gómez' },
    { id: 'spec_dra_lucia', tenantId: 'tenant_dental_sonrisas', name: 'Dra. Lucía Rivera' },
    { id: 'spec_estetica_ana', tenantId: 'tenant_estetica_glow', name: 'Ana Estilista' }
  ];

  const mockRecords = [
    {
      id: 'rec_paciente_001',
      tenantId: 'tenant_dental_sonrisas',
      fullName: 'Carlos Alberto Fonseca',
      phone: '50688881111',
      identification: '1-1234-0567',
      clientType: 'paciente',
      allergies: 'Penicilina, AINEs',
      currentMedications: 'Losartán 50mg',
      pathologicalBackground: 'Hipertensión arterial controlada',
      vitalSigns: { bloodPressure: '120/80', heartRate: 72, weightKg: 75, heightCm: 175, bmi: 24.49 }
    },
    {
      id: 'rec_paciente_002',
      tenantId: 'tenant_dental_sonrisas',
      fullName: 'María Elena Mora',
      phone: '50688882222',
      identification: '2-0345-0678',
      clientType: 'paciente',
      allergies: 'Ninguna',
      currentMedications: 'Ninguno',
      vitalSigns: { bloodPressure: '110/70', heartRate: 68, weightKg: 60, heightCm: 165, bmi: 22.04 }
    },
    {
      id: 'rec_general_003',
      tenantId: 'tenant_dental_sonrisas',
      fullName: 'Jorge Solano',
      phone: '50688883333',
      clientType: 'cliente_general'
    },
    {
      id: 'rec_glow_004',
      tenantId: 'tenant_estetica_glow',
      fullName: 'Valeria Castro',
      phone: '50688884444',
      identification: '1-0987-0654',
      clientType: 'paciente'
    }
  ];

  const mockAppointments = [
    {
      id: 'appt_001',
      tenantId: 'tenant_dental_sonrisas',
      specialistId: 'spec_dr_mario',
      name: 'Carlos Alberto Fonseca',
      whatsapp: '50688881111',
      recordId: 'rec_paciente_001',
      service: 'Endodoncia',
      date: '2026-09-10',
      time: '10:00',
      status: 'confirmed'
    },
    {
      id: 'appt_002',
      tenantId: 'tenant_dental_sonrisas',
      specialistId: 'spec_dra_lucia',
      name: 'María Elena Mora',
      whatsapp: '50688882222',
      recordId: 'rec_paciente_002',
      service: 'Ortodoncia Control',
      date: '2026-09-11',
      time: '14:00',
      status: 'confirmed'
    },
    {
      id: 'appt_003',
      tenantId: 'tenant_estetica_glow',
      specialistId: 'spec_estetica_ana',
      name: 'Valeria Castro',
      whatsapp: '50688884444',
      recordId: 'rec_glow_004',
      service: 'Limpieza Facial Profunda',
      date: '2026-09-12',
      time: '11:00',
      status: 'completed'
    }
  ];

  const mockRecordEntries = [
    {
      id: 'entry_001',
      tenantId: 'tenant_dental_sonrisas',
      recordId: 'rec_paciente_001',
      specialistId: 'spec_dr_mario',
      entryType: 'consultation',
      notes: 'Apertura cameral pieza 16 bajo anestesia local.',
      vitalSigns: { bloodPressure: '120/80', heartRate: 72, weightKg: 75, heightCm: 175, bmi: 24.49 },
      createdAt: '2026-09-01T15:00:00Z'
    }
  ];

  describe('1. Multi-Tenant Boundary Isolation for Customer Records', () => {
    function getRecordsByTenant(tenantId, search) {
      let filtered = mockRecords.filter(r => r.tenantId === tenantId);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q)) ||
          (r.identification && r.identification.toLowerCase().includes(q))
        );
      }
      return filtered;
    }

    test('Tenant Dental Sonrisas only gets its own 3 records', () => {
      const records = getRecordsByTenant('tenant_dental_sonrisas');
      assert.equal(records.length, 3);
      assert.ok(records.every(r => r.tenantId === 'tenant_dental_sonrisas'));
      assert.ok(!records.some(r => r.id === 'rec_glow_004'));
    });

    test('Tenant Estetica Glow only gets its own 1 record', () => {
      const records = getRecordsByTenant('tenant_estetica_glow');
      assert.equal(records.length, 1);
      assert.equal(records[0].id, 'rec_glow_004');
      assert.equal(records[0].fullName, 'Valeria Castro');
    });

    test('Search filters strictly within tenant boundary', () => {
      const dentalResults = getRecordsByTenant('tenant_dental_sonrisas', 'Valeria');
      assert.equal(dentalResults.length, 0);

      const glowResults = getRecordsByTenant('tenant_estetica_glow', 'Valeria');
      assert.equal(glowResults.length, 1);
      assert.equal(glowResults[0].fullName, 'Valeria Castro');
    });
  });

  describe('2. Strict Specialist Patient Scoping & Data Isolation', () => {
    function getRecordsForSpecialist(specialistId, tenantId, search) {
      const assignedRecordIds = new Set(
        mockAppointments
          .filter(a => a.tenantId === tenantId && a.specialistId === specialistId && a.recordId)
          .map(a => a.recordId)
      );

      let records = mockRecords.filter(r => r.tenantId === tenantId && assignedRecordIds.has(r.id));
      if (search) {
        const q = search.toLowerCase();
        records = records.filter(r =>
          r.fullName.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q)) ||
          (r.identification && r.identification.toLowerCase().includes(q))
        );
      }
      return records;
    }

    function getRecordForSpecialistById(recordId, specialistId, tenantId) {
      const hasRelation = mockAppointments.some(
        a => a.tenantId === tenantId && a.specialistId === specialistId && a.recordId === recordId
      );
      if (!hasRelation) return null;
      return mockRecords.find(r => r.id === recordId && r.tenantId === tenantId) || null;
    }

    test('Dr. Mario only sees Carlos Alberto Fonseca (appt_001)', () => {
      const drMarioRecords = getRecordsForSpecialist('spec_dr_mario', 'tenant_dental_sonrisas');
      assert.equal(drMarioRecords.length, 1);
      assert.equal(drMarioRecords[0].id, 'rec_paciente_001');
      assert.equal(drMarioRecords[0].fullName, 'Carlos Alberto Fonseca');
    });

    test('Dra. Lucia only sees María Elena Mora (appt_002)', () => {
      const draLuciaRecords = getRecordsForSpecialist('spec_dra_lucia', 'tenant_dental_sonrisas');
      assert.equal(draLuciaRecords.length, 1);
      assert.equal(draLuciaRecords[0].id, 'rec_paciente_002');
      assert.equal(draLuciaRecords[0].fullName, 'María Elena Mora');
    });

    test('Dr. Mario CANNOT access Dra. Lucia patient record by ID (403 Forbidden check)', () => {
      const attempt = getRecordForSpecialistById('rec_paciente_002', 'spec_dr_mario', 'tenant_dental_sonrisas');
      assert.equal(attempt, null, 'Dr. Mario must NOT have access to patient without assigned appointment');
    });

    test('Cross-tenant specialist query returns null even with valid ID', () => {
      const attempt = getRecordForSpecialistById('rec_paciente_001', 'spec_estetica_ana', 'tenant_dental_sonrisas');
      assert.equal(attempt, null);
    });
  });

  describe('3. Clinical Evolution Notes & Specialist Authoring Permissions', () => {
    function addRecordEntryAsSpecialist(specialistId, tenantId, recordId, entryData) {
      const hasRelation = mockAppointments.some(
        a => a.tenantId === tenantId && a.specialistId === specialistId && a.recordId === recordId
      );
      if (!hasRelation) {
        throw new Error('403: Acceso no autorizado para registrar evolución en este paciente');
      }

      const newEntry = {
        id: 'entry_' + Date.now(),
        tenantId,
        recordId,
        specialistId,
        entryType: entryData.entryType || 'consultation',
        notes: entryData.notes,
        diagnosis: entryData.diagnosis,
        prescription: entryData.prescription,
        vitalSigns: entryData.vitalSigns,
        createdAt: new Date().toISOString()
      };
      mockRecordEntries.push(newEntry);
      return newEntry;
    }

    test('Dr. Mario can write a clinical evolution on his assigned patient (Carlos)', () => {
      const entry = addRecordEntryAsSpecialist(
        'spec_dr_mario',
        'tenant_dental_sonrisas',
        'rec_paciente_001',
        {
          entryType: 'consultation',
          notes: 'Obturación de conducto radicular con gutapercha. Asintomático.',
          diagnosis: 'Cicatrización periapical favorable'
        }
      );

      assert.ok(entry.id);
      assert.equal(entry.specialistId, 'spec_dr_mario');
      assert.equal(entry.recordId, 'rec_paciente_001');
      assert.equal(entry.notes, 'Obturación de conducto radicular con gutapercha. Asintomático.');
    });

    test('Dr. Mario CANNOT write a clinical note on Dra. Lucia patient (María Elena)', () => {
      assert.throws(() => {
        addRecordEntryAsSpecialist(
          'spec_dr_mario',
          'tenant_dental_sonrisas',
          'rec_paciente_002',
          { notes: 'Intento de acceso indebido' }
        );
      }, /403: Acceso no autorizado/);
    });
  });

  describe('4. Vital Signs & BMI Calculation Accuracy', () => {
    function calculateBMI(weightKg, heightCm) {
      if (!weightKg || !heightCm || heightCm <= 0) return undefined;
      const heightM = heightCm / 100;
      return parseFloat((weightKg / (heightM * heightM)).toFixed(2));
    }

    test('Calculates BMI accurately according to WHO formulas', () => {
      const bmi1 = calculateBMI(70, 175);
      assert.equal(bmi1, 22.86);

      const bmi2 = calculateBMI(85, 170);
      assert.equal(bmi2, 29.41);

      const bmi3 = calculateBMI(55, 162);
      assert.equal(bmi3, 20.96);
    });

    test('Handles missing or invalid height/weight without throwing', () => {
      assert.equal(calculateBMI(0, 170), undefined);
      assert.equal(calculateBMI(70, 0), undefined);
      assert.equal(calculateBMI(undefined, 170), undefined);
      assert.equal(calculateBMI(70, undefined), undefined);
    });
  });

  describe('5. Auto-Linking Appointments to Customer Record by Phone', () => {
    test('Links existing unlinked appointments when customer record is created with matching phone', () => {
      const appointmentsToLink = [
        { id: 'appt_historical_1', tenantId: 'tenant_dental_sonrisas', whatsapp: '+506 8888-9999', recordId: null },
        { id: 'appt_historical_2', tenantId: 'tenant_dental_sonrisas', whatsapp: '50688889999', recordId: null },
        { id: 'appt_other_tenant', tenantId: 'tenant_estetica_glow', whatsapp: '50688889999', recordId: null }
      ];

      const cleanPhone = (phone) => String(phone || '').replace(/\D/g, '');

      function autoLinkAppointments(tenantId, recordId, phone) {
        const targetClean = cleanPhone(phone);
        let linkedCount = 0;
        for (const appt of appointmentsToLink) {
          if (appt.tenantId === tenantId && cleanPhone(appt.whatsapp) === targetClean) {
            appt.recordId = recordId;
            linkedCount++;
          }
        }
        return linkedCount;
      }

      const linked = autoLinkAppointments('tenant_dental_sonrisas', 'rec_new_005', '50688889999');
      assert.equal(linked, 2, 'Should link both historical appointments for tenant_dental_sonrisas');
      assert.equal(appointmentsToLink[0].recordId, 'rec_new_005');
      assert.equal(appointmentsToLink[1].recordId, 'rec_new_005');
      assert.equal(appointmentsToLink[2].recordId, null, 'Must NOT touch other tenant appointments');
    });
  });

});
