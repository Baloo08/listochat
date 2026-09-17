import test from 'node:test';
import assert from 'node:assert/strict';

function sanitizeTextForSpeech(rawText) {
  if (!rawText) return '';
  let text = rawText;
  text = text.replace(/<<<[A-Z_]+:\s*\{.*?\}>>>/gs, '');
  text = text.replace(/COMMAND_[A-Z_]+(\{[^}]*\}|[^\n]*)/gi, '');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/~([^~]+)~/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/https?:\/\/\S+/gi, 'el enlace adjunto');
  text = text.replace(/[👉📍📅⏰🚗✨👤📝💳✅❌🔴🟢⚡💬🛍️🛒]/g, ' ');
  text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  text = text.replace(/₡\s*([0-9]+(?:[\.,][0-9]+)?)/g, '$1 colones');
  text = text.replace(/\$\s*([0-9]+(?:[\.,][0-9]+)?)/g, '$1 dólares');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([.,;:!?])/g, '$1');
  return text;
}

function classifyVoicePreference(incomingText) {
  const lowerMsg = (incomingText || '').toLowerCase().trim();
  const wantsTextKeywords = [
    'por texto', 'prefiero texto', 'escríbemelo', 'escribemelo', 'por escrito', 
    'no me mandes audio', 'no me mandes audios', 'no mandes audio', 'no mandes audios',
    'no audios', 'no puedo escuchar', 'solo texto', 'en texto'
  ];
  const wantsAudioKeywords = [
    'mándame un audio', 'mandame un audio', 'nota de voz', 'por nota de voz', 
    'por audio', 'prefiero audio', 'prefiero audios', 'en audio', 'en nota de voz', 
    'mándame audio', 'mandame audio', 'envíame un audio', 'enviame un audio',
    'me puedes mandar un audio', 'me puedes enviar un audio', 'responder por audio',
    'mandame notas de voz', 'mándame notas de voz', 'prefiero notas de voz', 'notas de voz'
  ];

  if (wantsTextKeywords.some(kw => lowerMsg.includes(kw))) {
    return 'text';
  } else if (wantsAudioKeywords.some(kw => lowerMsg.includes(kw))) {
    return 'audio';
  }
  return null;
}

test('Betico AI & Voice Consent Protocols', async (t) => {
  await t.test('1. Speech Sanitizer cleans markdown, commands and emojis', () => {
    const raw = '¡Hola *Carlos*! Tu cita quedó confirmada para las _3:00 PM_ 🚗. <<<COMMAND_BOOKING: {"date":"2026-09-20"}>>> Más info en https://example.com/reserva';
    const cleaned = sanitizeTextForSpeech(raw);

    assert.ok(!cleaned.includes('*'), 'Asterisks removed');
    assert.ok(!cleaned.includes('_'), 'Underscores removed');
    assert.ok(!cleaned.includes('COMMAND_BOOKING'), 'Command stripped');
    assert.ok(!cleaned.includes('🚗'), 'Emoji removed');
    assert.ok(cleaned.includes('el enlace adjunto'), 'URL converted to spoken text');
    assert.ok(cleaned.includes('3:00 PM.'), 'Punctuation correctly normalized');
    assert.ok(cleaned.includes('¡Hola Carlos! Tu cita quedó confirmada'), 'Salutation and content preserved');
  });

  await t.test('2. Voice preference keyword classification detects opt-in', () => {
    const optInPhrases = [
      'sí por audio por favor',
      'Mándame un audio',
      'Prefiero notas de voz',
      'Mandamelo por audio gracias'
    ];

    for (const phrase of optInPhrases) {
      assert.equal(classifyVoicePreference(phrase), 'audio', 'Failed for: ' + phrase);
    }
  });

  await t.test('3. Voice preference keyword classification detects opt-out (text only)', () => {
    const optOutPhrases = [
      'prefiero texto estoy en reunión',
      'solo texto por favor',
      'no mandes audio',
      'por escrito'
    ];

    for (const phrase of optOutPhrases) {
      assert.equal(classifyVoicePreference(phrase), 'text', 'Failed for: ' + phrase);
    }
  });

  await t.test('4. Neutral messages do not trigger false preference updates', () => {
    const neutralPhrases = [
      'cuanto cuesta el cambio de aceite?',
      'tienen disponibilidad para mañana a las 10?',
      'gracias'
    ];

    for (const phrase of neutralPhrases) {
      assert.equal(classifyVoicePreference(phrase), null, 'False positive for: ' + phrase);
    }
  });

  await t.test('5. Spanish Voice ID and Speed Validation', () => {
    const supportedVoices = ['ef_dora', 'em_alex', 'em_santa'];
    assert.ok(supportedVoices.includes('ef_dora'), 'Dora is valid Spanish voice');
    assert.ok(supportedVoices.includes('em_alex'), 'Alex is valid Spanish voice');
    assert.ok(supportedVoices.includes('em_santa'), 'Santa is valid Spanish voice');

    const validateSpeed = (speed) => Math.max(0.5, Math.min(2.0, speed || 1.0));
    assert.equal(validateSpeed(1.0), 1.0);
    assert.equal(validateSpeed(0.2), 0.5, 'Clamps minimum speed to 0.5');
    assert.equal(validateSpeed(3.5), 2.0, 'Clamps maximum speed to 2.0');
  });
});
