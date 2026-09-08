import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Customer & Patient Clinical Records Booking Flow Tests (Manual & WhatsApp AI)', () => {

  const mockTenants = ['tenant_clinica_san_jose', 'tenant_taller_autocare'];

  const mockRecords = [
    {
      id: 'rec_pac_101',
      tenantId: 'tenant_clinica_san_jose',
      fullName: 'Dra. Patricia Mora Valverde',
      phone: '50688887777',
      identification: '1-0854-0231',
      clientType: 'paciente',
      allergies: 'Penicilina, Sulfa',
      pathologicalBackground: 'Asma bronquial, Diabetes Mellitus Tipo 2',
      currentMedications: 'Metformina 850mg, Salbutamol',
      notes: 'Paciente con hiperreactividad bronquial en cambios de clima.'
    },
    {
      id: 'rec_gen_102',
      tenantId: 'tenant_clinica_san_jose',
      fullName: 'Roberto Brenes Chinchilla',
      phone: '50687654321',
      identification: '3-0452-0198',
      clientType: 'general',
      notes: 'Cliente para revisiones y chequeos periódicos.'
    },
    {
      id: 'rec_autocare_103',
      tenantId: 'tenant_taller_autocare',
      fullName: 'Patricia Mora Valverde',
      phone: '50688887777',
      identification: '1-0854-0231',
      clientType: 'general',
      notes: 'Dueña de Toyota Prado 2021.'
    }
  ];

  const mockServices = [
    { id: 'srv_med_01', tenantId: 'tenant_clinica_san_jose', name: 'Consulta Médica General', price: 25000 },
    { id: 'srv_med_02', tenantId: 'tenant_clinica_san_jose', name: 'Control de Diabetes', price: 30000 },
    { id: 'srv_auto_01', tenantId: 'tenant_taller_autocare', name: 'Cambio de Aceite', price: 45000 }
  ];

  // In-memory appointments and record entries simulation
  let appointmentsDB = [];
  let recordEntriesDB = [];

  function cleanPhoneForLookup(p) {
    return (p || '').replace(/\D/g, '').slice(-8);
  }

  function lookupRecord(tenantId, { recordId, identification, phone }) {
    if (recordId) {
      const found = mockRecords.find(r => r.id === recordId && r.tenantId === tenantId);
      if (found) return found;
    }
    if (identification) {
      const cleanId = identification.trim().toLowerCase();
      const found = mockRecords.find(r => r.tenantId === tenantId && r.identification.toLowerCase() === cleanId);
      if (found) return found;
    }
    if (phone) {
      const last8 = cleanPhoneForLookup(phone);
      if (last8.length === 8) {
        const found = mockRecords.find(r => r.tenantId === tenantId && cleanPhoneForLookup(r.phone) === last8);
        if (found) return found;
      }
    }
    return null;
  }

  function simulateCreateAppointment(tenantId, payload) {
    let resolvedRecord = null;
    let finalRecordId = payload.recordId;

    if (finalRecordId) {
      resolvedRecord = lookupRecord(tenantId, { recordId: finalRecordId });
    }
    if (!resolvedRecord && payload.identification) {
      resolvedRecord = lookupRecord(tenantId, { identification: payload.identification });
    }
    if (!resolvedRecord && payload.whatsapp) {
      resolvedRecord = lookupRecord(tenantId, { phone: payload.whatsapp });
    }

    if (resolvedRecord) {
      finalRecordId = resolvedRecord.id;
    } else {
      finalRecordId = null;
    }

    const newAppt = {
      id: 'appt_' + (appointmentsDB.length + 1),
      tenantId,
      name: (resolvedRecord ? resolvedRecord.fullName : payload.name) || 'Cliente',
      whatsapp: payload.whatsapp || (resolvedRecord ? resolvedRecord.phone : ''),
      service: payload.service,
      date: payload.date,
      time: payload.time,
      amount: payload.amount || 0,
      recordId: finalRecordId || null,
      specialistId: payload.specialistId || null,
      status: 'scheduled'
    };

    appointmentsDB.push(newAppt);

    if (finalRecordId) {
      recordEntriesDB.push({
        id: 'entry_' + (recordEntriesDB.length + 1),
        tenantId,
        recordId: finalRecordId,
        appointmentId: newAppt.id,
        entryType: 'consultation',
        notes: payload.isWhatsApp
          ? `Cita agendada automáticamente por WhatsApp para ${newAppt.service} el ${newAppt.date} a las ${newAppt.time}.`
          : `Cita registrada en agenda para ${newAppt.service} el ${newAppt.date} a las ${newAppt.time}.`
      });
    }

    return newAppt;
  }

  // ==============================================================
  // TEST SUITE 1: MANUAL AGENDA BOOKING MODAL LOGIC
  // ==============================================================
  describe('1. Manual Agenda Booking Modal Flow', () => {

    test('1.1 Should link existing patient record when selected by recordId', () => {
      const patient = mockRecords[0];
      const created = simulateCreateAppointment('tenant_clinica_san_jose', {
        recordId: patient.id,
        name: patient.fullName,
        whatsapp: patient.phone,
        service: 'Consulta Médica General',
        date: '2026-09-15',
        time: '09:00',
        amount: 25000
      });

      assert.equal(created.recordId, 'rec_pac_101');
      assert.equal(created.name, 'Dra. Patricia Mora Valverde');

      const entry = recordEntriesDB.find(e => e.appointmentId === created.id);
      assert.ok(entry, 'Should create an initial consultation entry in patient record');
      assert.equal(entry.recordId, 'rec_pac_101');
      assert.match(entry.notes, /Cita registrada en agenda para Consulta Médica General/);
    });

    test('1.2 Should auto-resolve record by identification (Cédula/DIMEX) if recordId omitted', () => {
      const created = simulateCreateAppointment('tenant_clinica_san_jose', {
        identification: '1-0854-0231',
        name: 'Patricia Mora',
        whatsapp: '50688887777',
        service: 'Control de Diabetes',
        date: '2026-09-16',
        time: '11:00',
        amount: 30000
      });

      assert.equal(created.recordId, 'rec_pac_101');
      const entry = recordEntriesDB.find(e => e.appointmentId === created.id);
      assert.ok(entry);
    });

    test('1.3 Should auto-resolve record by WhatsApp phone number if recordId omitted', () => {
      const created = simulateCreateAppointment('tenant_clinica_san_jose', {
        name: 'Roberto Brenes',
        whatsapp: '+506 8765-4321',
        service: 'Chequeo Periódico',
        date: '2026-09-17',
        time: '14:00',
        amount: 20000
      });

      assert.equal(created.recordId, 'rec_gen_102');
      assert.equal(created.name, 'Roberto Brenes Chinchilla');
      const entry = recordEntriesDB.find(e => e.appointmentId === created.id);
      assert.ok(entry);
    });

    test('1.4 Should allow creating appointments for non-registered customers without error', () => {
      const created = simulateCreateAppointment('tenant_clinica_san_jose', {
        name: 'Nuevo Visitante Sin Expediente',
        whatsapp: '50689999999',
        service: 'Consulta Rápida',
        date: '2026-09-18',
        time: '16:00',
        amount: 25000
      });

      assert.equal(created.recordId, null);
      assert.equal(created.name, 'Nuevo Visitante Sin Expediente');
      const entry = recordEntriesDB.find(e => e.appointmentId === created.id);
      assert.equal(entry, undefined, 'Should not create record entry when no record linked');
    });
  });

  // ==============================================================
  // TEST SUITE 2: AUTOMATIC WHATSAPP AI BOOKING FLOW
  // ==============================================================
  describe('2. WhatsApp AI Booking Flow & Context Enrichment', () => {

    test('2.1 AI Prompt Builder recognizes registered patient and enriches context', () => {
      const incomingPhone = '50688887777';
      const tenantId = 'tenant_clinica_san_jose';

      const customerRecord = lookupRecord(tenantId, { phone: incomingPhone });
      assert.ok(customerRecord);
      assert.equal(customerRecord.clientType, 'paciente');

      // Build simulated AI prompt
      const isPatient = customerRecord.clientType === 'paciente';
      const customerProfileText = `\nEXPEDIENTE DEL CLIENTE REGISTRADO:
- Nombre Registrado: ${customerRecord.fullName}
- Tipo de Expediente: ${isPatient ? 'PACIENTE MÉDICO / SERVICIOS DE SALUD' : 'CLIENTE GENERAL'}
${customerRecord.identification ? `- Cédula / Identificación / DIMEX: ${customerRecord.identification}` : ''}
${customerRecord.allergies ? `- ⚠️ ALERGIAS CONOCIDAS: ${customerRecord.allergies}` : ''}
${customerRecord.pathologicalBackground ? `- 📋 ANTECEDENTES PATOLÓGICOS: ${customerRecord.pathologicalBackground}` : ''}
${customerRecord.currentMedications ? `- 💊 MEDICACIÓN ACTUAL: ${customerRecord.currentMedications}` : ''}
`;

      assert.match(customerProfileText, /PACIENTE MÉDICO/);
      assert.match(customerProfileText, /Dra. Patricia Mora Valverde/);
      assert.match(customerProfileText, /Penicilina, Sulfa/);
      assert.match(customerProfileText, /Diabetes Mellitus/);
      assert.match(customerProfileText, /Metformina 850mg/);
    });

    test('2.2 AI COMMAND_BOOKING carries recordId and creates linked appointment with note', () => {
      const incomingPhone = '50688887777';
      const tenantId = 'tenant_clinica_san_jose';
      const customerRecord = lookupRecord(tenantId, { phone: incomingPhone });

      // Simulated AI command output
      const aiReply = `Con mucho gusto Dra. Patricia, le confirmo su cita para el control de diabetes el día 20 de setiembre a las 10:00 AM.
<<<COMMAND_BOOKING: {"service":"Control de Diabetes","date":"2026-09-20","time":"10:00","customerName":"${customerRecord.fullName}","recordId":"${customerRecord.id}"}>>>`;

      const match = aiReply.match(/<<<COMMAND_BOOKING:\s*({.*?})>>>/s);
      assert.ok(match);
      const commandData = JSON.parse(match[1]);

      assert.equal(commandData.recordId, 'rec_pac_101');
      assert.equal(commandData.customerName, 'Dra. Patricia Mora Valverde');

      const created = simulateCreateAppointment(tenantId, {
        ...commandData,
        whatsapp: incomingPhone,
        amount: 30000,
        isWhatsApp: true
      });

      assert.equal(created.recordId, 'rec_pac_101');
      const entry = recordEntriesDB.find(e => e.appointmentId === created.id);
      assert.ok(entry);
      assert.match(entry.notes, /Cita agendada automáticamente por WhatsApp/);
      assert.match(entry.notes, /Control de Diabetes/);
    });

    test('2.3 If AI omits recordId in COMMAND_BOOKING, service layer resolves it by sender phone', () => {
      const incomingPhone = '50688887777';
      const tenantId = 'tenant_clinica_san_jose';

      // AI outputs command without recordId
      const commandData = {
        service: 'Consulta Médica General',
        date: '2026-09-22',
        time: '08:30',
        customerName: 'Patricia'
      };

      const created = simulateCreateAppointment(tenantId, {
        ...commandData,
        whatsapp: incomingPhone,
        isWhatsApp: true
      });

      assert.equal(created.recordId, 'rec_pac_101', 'Must resolve recordId from sender phone automatically');
      assert.equal(created.name, 'Dra. Patricia Mora Valverde');
    });
  });

  // ==============================================================
  // TEST SUITE 3: MULTI-TENANT ISOLATION BOUNDARY
  // ==============================================================
  describe('3. Multi-Tenant Strict Isolation for Records & Bookings', () => {

    test('3.1 Same phone in another tenant resolves to that tenant\'s record only', () => {
      const phone = '50688887777';

      // In clinic: returns Dra. Patricia (paciente)
      const clinicRec = lookupRecord('tenant_clinica_san_jose', { phone });
      assert.equal(clinicRec.id, 'rec_pac_101');
      assert.equal(clinicRec.clientType, 'paciente');

      // In auto workshop: returns Patricia (cliente general, taller)
      const autoRec = lookupRecord('tenant_taller_autocare', { phone });
      assert.equal(autoRec.id, 'rec_autocare_103');
      assert.equal(autoRec.clientType, 'general');

      // Booking in auto workshop must link rec_autocare_103, NEVER rec_pac_101
      const createdAuto = simulateCreateAppointment('tenant_taller_autocare', {
        whatsapp: phone,
        service: 'Cambio de Aceite',
        date: '2026-09-25',
        time: '15:00'
      });

      assert.equal(createdAuto.recordId, 'rec_autocare_103');
      assert.notEqual(createdAuto.recordId, 'rec_pac_101');
    });

    test('3.2 Rejects linking recordId from another tenant even if explicitly provided', () => {
      const created = simulateCreateAppointment('tenant_taller_autocare', {
        recordId: 'rec_pac_101',
        whatsapp: '50689990000',
        service: 'Alineación y Tramado',
        date: '2026-09-26',
        time: '10:00'
      });

      assert.notEqual(created.recordId, 'rec_pac_101');
    });
  });

  // ==============================================================
  // TEST SUITE 4: PATIENT CLINICAL ALERTS & ATTRIBUTES INTEGRITY
  // ==============================================================
  describe('4. Clinical Alerts & Expediente Integrity', () => {

    test('4.1 Patient record exposes clinical alerts (allergies, background, meds)', () => {
      const patient = mockRecords[0];
      assert.ok(patient.allergies);
      assert.ok(patient.pathologicalBackground);
      assert.ok(patient.currentMedications);

      const hasCriticalAllergies = Boolean(patient.allergies && patient.allergies.toLowerCase().includes('penicilina'));
      assert.equal(hasCriticalAllergies, true);
    });

    test('4.2 General client does not display false medical warnings', () => {
      const generalClient = mockRecords[1];
      assert.equal(generalClient.allergies, undefined);
      assert.equal(generalClient.pathologicalBackground, undefined);
      assert.equal(generalClient.currentMedications, undefined);
      assert.equal(generalClient.clientType, 'general');
    });
  });

});
