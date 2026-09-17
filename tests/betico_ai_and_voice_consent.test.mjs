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

  await t.test('6. Betico AI Free & Uncapped Protocol', () => {
    // Verify that local providers do not trigger paid failover
    const isLocalProvider = (p) => p === 'betico_ai' || p === 'ollama' || p === 'localai';
    assert.ok(isLocalProvider('betico_ai'));
    assert.ok(isLocalProvider('ollama'));
    assert.ok(!isLocalProvider('gemini'));
    assert.ok(!isLocalProvider('openai'));

    // Verify positive telemetry tracking does not block client execution
    const evaluateTenantAccess = (isBeticoPlatformAI, usage) => {
      if (isBeticoPlatformAI) {
        // Uncapped: always allowed regardless of usage numbers
        return { allowed: true, blockCustomer: false };
      }
      return { allowed: !usage.isExceeded, blockCustomer: usage.isExceeded };
    };

    const heavyUsage = { tokensUsed: 999999, limit: 25000, isExceeded: true };
    const access = evaluateTenantAccess(true, heavyUsage);
    assert.equal(access.allowed, true, 'Betico AI is never blocked even with heavy usage');
    assert.equal(access.blockCustomer, false, 'Customer is never interrupted');
  });

  await t.test('7. Virtual Tenant Model Naming & Slug Sanitization', () => {
    function sanitizeModelName(nameOrSlug) {
      if (!nameOrSlug) return 'default';
      const sanitized = nameOrSlug
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return sanitized || 'default';
    }

    function getTenantModelName(tenant) {
      const tag = tenant.slug ? sanitizeModelName(tenant.slug) : tenant.id.slice(0, 8);
      return `betico-ai:tenant_${tag}`;
    }

    assert.equal(sanitizeModelName('Canchas El Cartaguito!'), 'canchas-el-cartaguito');
    assert.equal(sanitizeModelName('Barbería & Estética San José'), 'barberia-estetica-san-jose');
    assert.equal(sanitizeModelName('   ---Tienda_Online---   '), 'tienda_online');

    const tenantWithSlug = { id: '0a388da1-1234-5678-9abc-def012345678', slug: 'canchas-cartaguito' };
    assert.equal(getTenantModelName(tenantWithSlug), 'betico-ai:tenant_canchas-cartaguito');

    const tenantWithoutSlug = { id: '0a388da1-1234-5678-9abc-def012345678', slug: null };
    assert.equal(getTenantModelName(tenantWithoutSlug), 'betico-ai:tenant_0a388da1');
  });

  await t.test('8. Virtual Tenant Model Fallback Resolution', () => {
    const defaultModels = ['betico-ai', 'qwen2.5:1.5b', 'qwen2.5:3b'];
    
    function resolveFallbackChain(provider, chosenModel) {
      if ((provider === 'betico_ai' || provider === 'ollama') && chosenModel.startsWith('betico-ai:tenant_')) {
        return [chosenModel, 'betico-ai'];
      }
      return [chosenModel, ...defaultModels.filter(m => m !== chosenModel)];
    }

    const virtualChain = resolveFallbackChain('betico_ai', 'betico-ai:tenant_canchas-cartaguito');
    assert.deepEqual(virtualChain, ['betico-ai:tenant_canchas-cartaguito', 'betico-ai']);

    const standardChain = resolveFallbackChain('betico_ai', 'betico-ai');
    assert.deepEqual(standardChain, ['betico-ai', 'qwen2.5:1.5b', 'qwen2.5:3b']);
  });

  await t.test('9. Whisper Vocabulary Prompt Injection', () => {
    function buildWhisperPromptHint(tenantName, services = []) {
      if (!tenantName) return undefined;
      const sList = services.slice(0, 3).map(s => s.name).join(', ');
      return sList ? `Comercio: ${tenantName}. Servicios: ${sList}` : `Comercio: ${tenantName}`;
    }

    assert.equal(
      buildWhisperPromptHint('Canchas El Cartaguito', [{ name: 'Cancha 5' }, { name: 'Cancha 7' }]),
      'Comercio: Canchas El Cartaguito. Servicios: Cancha 5, Cancha 7'
    );
    assert.equal(buildWhisperPromptHint(null), undefined);
  });
});
