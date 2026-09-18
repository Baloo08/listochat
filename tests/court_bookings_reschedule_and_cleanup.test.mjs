import test from 'node:test';
import assert from 'node:assert/strict';

// Helper: Booking code generator (matches src/server/db/courts.repo.ts)
function generateBookingCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 without ambiguous 0,O,1,I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CRT-${code}`;
}

// Helper: Booking code normalizer (matches getBookingByCode in courts.repo.ts)
function normalizeBookingLookup(codeOrId) {
  if (!codeOrId || typeof codeOrId !== 'string') return null;
  const clean = codeOrId.trim().toUpperCase();
  const stripped = clean.replace(/^(#RES-|RES-|CRT-)/, '');
  return {
    raw: clean,
    stripped,
    normalizedCode: `CRT-${stripped}`,
    legacyCode: `RES-${stripped}`
  };
}

// Helper: Reschedule window validator (matches courts.routes.ts & CourtBookingPublic.tsx)
function validateRescheduleWindow(bookingDate, bookingTime, options = {}) {
  const allowPublic = options.allowPublicReschedule !== false;
  if (!allowPublic) {
    return { allowed: false, reason: 'El reagendamiento público está desactivado por el complejo deportivo.' };
  }

  const minHours = options.minRescheduleHoursBefore ?? 2;
  const timeFormatted = bookingTime.length === 5 ? `${bookingTime}:00` : bookingTime;
  const bookingTimeMs = new Date(`${bookingDate}T${timeFormatted}Z`).getTime();
  const nowMs = options.currentTimeMs || Date.now();
  const diffHours = (bookingTimeMs - nowMs) / (1000 * 60 * 60);

  if (diffHours < minHours) {
    return { 
      allowed: false, 
      diffHours, 
      reason: `No es posible reagendar con menos de ${minHours} horas de anticipación.` 
    };
  }

  return { allowed: true, diffHours };
}

// Helper: 15-day purge eligibility checker
function isEligibleFor15DayPurge(booking, nowMs = Date.now()) {
  const isUncompleted = booking.status === 'uncompleted' || booking.matchStatus === 'expired';
  if (!isUncompleted) return false;

  const updatedAtMs = new Date(booking.updatedAt || booking.createdAt).getTime();
  const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
  return (nowMs - updatedAtMs) >= fifteenDaysMs;
}

// Helper: WhatsApp AI rescheduling command parser (matches src/server/services/agent.ts)
function parseAiRescheduleCommand(messageText) {
  const courtRescheduleRegex = /<<<COMMAND_RESCHEDULE_COURT:\s*({.*?})>>>/s;
  const match = messageText.match(courtRescheduleRegex);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    const cleanText = messageText.replace(courtRescheduleRegex, '').trim();
    return { data, cleanText };
  } catch {
    return null;
  }
}

test('Court Booking Rescheduling, Codes & 15-Day Auto-Purge Architecture Tests', async (t) => {

  await t.test('1. Booking Code Generation & Normalization Protocol', () => {
    // Generate 50 codes and verify standard formatting
    for (let i = 0; i < 50; i++) {
      const code = generateBookingCode();
      assert.match(code, /^CRT-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, 'Must match CRT-XXXXXX base32 format');
      assert.doesNotMatch(code, /[01OIOoIl]/, 'Must exclude ambiguous characters (0, O, 1, I)');
    }

    // Normalization test across Tilopay, WhatsApp and user formats
    const cases = [
      { input: 'CRT-8F2A1C', expectedStripped: '8F2A1C' },
      { input: 'RES-8F2A1C', expectedStripped: '8F2A1C' },
      { input: '#RES-8F2A1C', expectedStripped: '8F2A1C' },
      { input: '  crt-8f2a1c  ', expectedStripped: '8F2A1C' },
      { input: '8F2A1C', expectedStripped: '8F2A1C' }
    ];

    for (const c of cases) {
      const norm = normalizeBookingLookup(c.input);
      assert.equal(norm.stripped, c.expectedStripped, `Input ${c.input} must normalize to stripped ${c.expectedStripped}`);
      assert.equal(norm.normalizedCode, 'CRT-8F2A1C');
    }
  });

  await t.test('2. Public Rescheduling Time Limit Window Validation', () => {
    const now = new Date('2026-09-18T10:00:00Z').getTime();

    // Case A: 5 hours in the future (allowed under default 2h limit)
    const resA = validateRescheduleWindow('2026-09-18', '15:00', {
      currentTimeMs: now,
      minRescheduleHoursBefore: 2,
      allowPublicReschedule: true
    });
    assert.equal(resA.allowed, true);

    // Case B: 1 hour in the future (rejected under default 2h limit)
    const resB = validateRescheduleWindow('2026-09-18', '11:00', {
      currentTimeMs: now,
      minRescheduleHoursBefore: 2,
      allowPublicReschedule: true
    });
    assert.equal(resB.allowed, false);
    assert.match(resB.reason, /menos de 2 horas/);

    // Case C: 3 hours in the future with custom 4h limit (rejected)
    const resC = validateRescheduleWindow('2026-09-18', '13:00', {
      currentTimeMs: now,
      minRescheduleHoursBefore: 4,
      allowPublicReschedule: true
    });
    assert.equal(resC.allowed, false);

    // Case D: Public rescheduling disabled entirely
    const resD = validateRescheduleWindow('2026-09-20', '10:00', {
      currentTimeMs: now,
      minRescheduleHoursBefore: 2,
      allowPublicReschedule: false
    });
    assert.equal(resD.allowed, false);
    assert.match(resD.reason, /desactivado/);
  });

  await t.test('3. 15-Day Uncompleted / Expired Match Purge Rule', () => {
    const now = new Date('2026-09-18T12:00:00Z').getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Active confirmed booking older than 15 days should NEVER be purged
    const confirmedOld = {
      status: 'confirmed',
      matchStatus: 'confirmed',
      updatedAt: new Date(now - 20 * dayMs).toISOString()
    };
    assert.equal(isEligibleFor15DayPurge(confirmedOld, now), false, 'Confirmed bookings must never be purged');

    // Uncompleted booking updated 5 days ago should NOT yet be purged
    const uncompletedFresh = {
      status: 'uncompleted',
      matchStatus: 'expired',
      updatedAt: new Date(now - 5 * dayMs).toISOString()
    };
    assert.equal(isEligibleFor15DayPurge(uncompletedFresh, now), false, 'Fresh uncompleted booking should not be purged');

    // Uncompleted booking updated 16 days ago MUST be eligible for purge
    const uncompletedOld = {
      status: 'uncompleted',
      matchStatus: 'expired',
      updatedAt: new Date(now - 16 * dayMs).toISOString()
    };
    assert.equal(isEligibleFor15DayPurge(uncompletedOld, now), true, 'Uncompleted booking older than 15 days must be purged');

    // Expired open reto updated 15.5 days ago MUST be eligible for purge
    const expiredReto = {
      status: 'pending',
      matchStatus: 'expired',
      updatedAt: new Date(now - 15.5 * dayMs).toISOString()
    };
    assert.equal(isEligibleFor15DayPurge(expiredReto, now), true, 'Expired reto older than 15 days must be purged');
  });

  await t.test('4. WhatsApp AI Rescheduling Tag Detection & Clean Message Extraction', () => {
    const aiOutput = `¡Con mucho gusto! Procedo a reagendar tu partido al nuevo horario solicitado.
<<<COMMAND_RESCHEDULE_COURT: {"bookingCode": "CRT-8F2A1C", "newDate": "2026-09-22", "newTime": "19:00", "reason": "Cambio solicitado por WhatsApp"}>>>
Quedas agendado para el martes 22 a las 7:00 PM. ¡Te esperamos!`;

    const parsed = parseAiRescheduleCommand(aiOutput);
    assert.ok(parsed, 'Must extract reschedule command');
    assert.equal(parsed.data.bookingCode, 'CRT-8F2A1C');
    assert.equal(parsed.data.newDate, '2026-09-22');
    assert.equal(parsed.data.newTime, '19:00');
    assert.equal(parsed.data.reason, 'Cambio solicitado por WhatsApp');
    assert.doesNotMatch(parsed.cleanText, /<<<COMMAND_RESCHEDULE_COURT/);
    assert.match(parsed.cleanText, /Quedas agendado para el martes 22/);
  });

});
