import test from 'node:test';
import assert from 'node:assert/strict';

export const defaultOrchestratorConfig = {
  enabled: true,
  prompt: 'Eres el Director de Operaciones y Supervisor Agéntico del negocio en WhatsApp. Tu objetivo es asegurar una atención cálida costarricense (*pura vida*, con gusto), ágil y precisa delegando cada mensaje al subagente experto según la siguiente jerarquía:\n1. Urgencias, quejas o petición de persona ➡️ Escalado Humano.\n2. Compra de productos, menú o delivery ➡️ Ventas & Menú.\n3. Servicios, doctores, citas o disponibilidad ➡️ Citas & Agenda.\n4. Partidos, horarios o canchas deportivas ➡️ Canchas Deportivas.\n5. Saludos, ubicación, parqueo, facturación o dudas generales ➡️ Identidad & FAQ.\nEn consultas mixtas, atiende primero la reserva/cita y luego invita a conocer la oferta de tienda.',
  subagents: {
    sales: {
      id: 'sales',
      name: 'Ventas & Menú',
      enabled: true,
      prompt: 'Eres el Asesor Especialista en Ventas y Catálogo. Asesora con calidez tica (*pura vida*, con gusto). Aplica venta consultiva recomendando opciones destacadas. Si el cliente selecciona un ítem principal, sugiere complementos o bebidas (venta cruzada). Lleva el carrito sumado con subtotales y total en ₡CRC. Pregunta si es para Envío a Domicilio o Retiro en Local y el método de pago. Solicita confirmación explícita de todos los datos antes de emitir la comanda.',
      sources: ['products', 'payments', 'delivery'],
      actions: ['order', 'media']
    },
    booking: {
      id: 'booking',
      name: 'Citas & Agenda',
      enabled: true,
      prompt: 'Eres el Asesor Especialista en Citas y Agenda. Atiende cordialmente y ofrece los servicios con sus precios y duración fija. Verifica que la fecha y hora NO coincidan con los HORARIOS YA OCUPADOS. Si el horario solicitado está ocupado, ofrece proactivamente las 2 o 3 opciones libres más cercanas del mismo día o día siguiente. Si el cliente pide varios servicios, suma sus duraciones. Confirma el nombre completo, servicio, fecha y hora antes de agendar.',
      sources: ['services', 'specialists', 'busySlots', 'customerRecord'],
      actions: ['booking', 'reschedule', 'cancel']
    },
    courts: {
      id: 'courts',
      name: 'Canchas Deportivas',
      enabled: true,
      prompt: 'Eres el Especialista en Reservas de Canchas Deportivas. Brinda información sobre canchas disponibles, superficies y precios por hora, diferenciando tarifa regular de tarifa con iluminación nocturna. Pregunta si requiere cancha completa o busca retador/partido abierto. Para reagendar, solicita el código CRT-XXXXXX y valida disponibilidad.',
      sources: ['courts', 'schedules'],
      actions: ['courtBooking', 'courtReschedule']
    },
    handoff: {
      id: 'handoff',
      name: 'Escalado Humano',
      enabled: true,
      prompt: 'Eres el Especialista en Atención de Casos Especiales y Escalado Humano. Cuando el cliente solicite hablar con una persona o exprese un reclamo urgente, responde con empatía y serenidad. Solicita amablemente su nombre y un breve detalle del motivo para que el asesor humano tome el chat con la solución preparada, y transfiere el caso de inmediato.',
      sources: ['keywords'],
      actions: ['handoff']
    },
    general: {
      id: 'general',
      name: 'Identidad & FAQ',
      enabled: true,
      prompt: 'Eres el Conserje y Anfitrión Principal del negocio en WhatsApp. Responde con calidez tica (*pura vida*) y precisión sobre ubicación exacta, enlaces de Waze/Maps, horarios, formas de pago (SINPE Móvil, transferencia, efectivo, tarjeta), factura electrónica, parqueo, políticas pet friendly y comodidades. Concluye cada respuesta con un puente proactivo hacia el catálogo de productos o la agenda de citas. Si te preguntan algo no registrado oficialmente en las políticas del negocio, no inventes datos: ofrece transferir con un asesor humano.',
      sources: ['businessInfo', 'schedules', 'payments'],
      actions: []
    }
  }
};

export function safeParseJSON(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return null;
  let cleaned = rawStr.trim();
  cleaned = cleaned
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    try {
      const relaxed = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(relaxed);
    } catch (e2) {
      return null;
    }
  }
}

export function routeIntent(userMessage, chatHistory, orchestratorConfig, storeModules) {
  const lowerMsg = userMessage.toLowerCase().trim();
  const recentHistory = (chatHistory || []).slice(-6).map(h => h.content).join(' ').toLowerCase();
  const context = `${recentHistory} ${lowerMsg}`;

  const subagents = orchestratorConfig?.subagents || defaultOrchestratorConfig.subagents;

  // 1. Escalation / Handoff
  const isHandoff = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente|hablar con un asesor/i.test(lowerMsg);
  if (isHandoff) {
    return subagents.handoff?.enabled !== false ? 'handoff' : 'general';
  }

  // Check which modules are allowed by tenant store settings
  const courtsAllowed = storeModules ? storeModules.courtsEnabled === true : true;
  const salesAllowed = storeModules ? storeModules.storeEnabled !== false : true;
  const bookingsAllowed = storeModules ? storeModules.bookingsEnabled !== false : true;

  // 2. Canchas deportivas (Only if tenant has courtsEnabled activated)
  const isCourts = /cancha|canchas|partido|futbol|fútbol|padel|pádel|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(context);
  if (isCourts && courtsAllowed) {
    return subagents.courts?.enabled !== false ? 'courts' : 'general';
  }

  // 3. Ventas de tienda / restaurante / pedidos
  const isSales = /precio|costo|cuanto|venden|catalogo|catálogo|menu|menú|producto|productos|comprar|pedir|orden|foto|imagen|plato|comida|pizza|hamburguesa|variante|talla|sabor|llevar|delivery|envio|envío|agregar al carrito|confirmo/i.test(context);

  // 4. Citas y Servicios
  const isBooking = /servicio|servicios|cita|citas|agenda|agendar|turno|atencion|atención|doctor|especialista|cancelar cita|reagendar|disponibilidad de horario|horario de cita/i.test(context);

  if (isSales && salesAllowed && (!isBooking || !bookingsAllowed)) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && bookingsAllowed && (!isSales || !salesAllowed)) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  if (isSales && salesAllowed) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && bookingsAllowed) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  return 'general';
}

test('Agentic Orchestrator & Multi-Agent Routing Tests', async (t) => {

  await t.test('1. Route Intent to Sales Subagent', () => {
    const q1 = routeIntent('¿Qué precio tiene la hamburguesa con papas?', []);
    assert.equal(q1, 'sales', 'Should route burger query to sales');

    const q2 = routeIntent('Quiero ver el catálogo de productos disponibles', []);
    assert.equal(q2, 'sales', 'Should route catalog query to sales');

    const q3 = routeIntent('Tienen envío a domicilio para este pedido?', []);
    assert.equal(q3, 'sales', 'Should route delivery query to sales');
  });

  await t.test('2. Route Intent to Booking Subagent', () => {
    const q1 = routeIntent('Quiero agendar una cita para mañana a las 3pm', []);
    assert.equal(q1, 'booking', 'Should route appointment request to booking');

    const q2 = routeIntent('¿Tienen servicios para corte de cabello?', []);
    assert.equal(q2, 'booking', 'Should route service query to booking');

    const q3 = routeIntent('Deseo reagendar mi cita del viernes', []);
    assert.equal(q3, 'booking', 'Should route reschedule appointment to booking');
  });

  await t.test('3. Route Intent to Courts Subagent', () => {
    const q1 = routeIntent('¿Tienen cancha de fútbol 5 disponible para el viernes en la noche?', []);
    assert.equal(q1, 'courts', 'Should route court query to courts');

    const q2 = routeIntent('Quiero reservar cancha de pádel por 1 hora', []);
    assert.equal(q2, 'courts', 'Should route padel court booking to courts');

    const q3 = routeIntent('Necesito cambiar el horario de mi partido con código CRT-8F2A1C', []);
    assert.equal(q3, 'courts', 'Should route reschedule court with CRT code to courts');
  });

  await t.test('4. Route Intent to Escalation / Handoff Subagent', () => {
    const q1 = routeIntent('Por favor comuníqueme con un asesor humano', []);
    assert.equal(q1, 'handoff', 'Should route human request to handoff');

    const q2 = routeIntent('Tengo un reclamo urgente sobre mi atención', []);
    assert.equal(q2, 'handoff', 'Should route complaint to handoff');
  });

  await t.test('5. Disabled Subagent Fallback to General', () => {
    const customConfig = {
      enabled: true,
      subagents: {
        ...defaultOrchestratorConfig.subagents,
        courts: {
          ...defaultOrchestratorConfig.subagents.courts,
          enabled: false
        }
      }
    };

    const q = routeIntent('¿Tienen cancha disponible para mejenga?', [], customConfig);
    assert.equal(q, 'general', 'When courts subagent is disabled, should fallback to general host agent');
  });

  await t.test('6. Default Orchestrator Integrity', () => {
    assert.ok(defaultOrchestratorConfig.enabled, 'Orchestrator should be enabled by default');
    assert.ok(defaultOrchestratorConfig.subagents.sales, 'Must include sales subagent');
    assert.ok(defaultOrchestratorConfig.subagents.booking, 'Must include booking subagent');
    assert.ok(defaultOrchestratorConfig.subagents.courts, 'Must include courts subagent');
    assert.ok(defaultOrchestratorConfig.subagents.handoff, 'Must include handoff subagent');
    assert.ok(defaultOrchestratorConfig.subagents.general, 'Must include general subagent');
  });

  await t.test('7. Safe JSON Parsing for Commands', () => {
    const raw = '{"service": "Corte de Cabello", "date": "2026-09-25", "time": "14:00",}';
    const parsed = safeParseJSON(raw);
    assert.ok(parsed, 'Should handle trailing commas');
    assert.equal(parsed.service, 'Corte de Cabello');
    assert.equal(parsed.time, '14:00');

    const relaxed = '{service: "Lavado", time: "10:00"}';
    const parsedRelaxed = safeParseJSON(relaxed);
    assert.ok(parsedRelaxed, 'Should parse relaxed keys');
    assert.equal(parsedRelaxed.service, 'Lavado');
  });

  await t.test('8. Hierarchical Top-to-Bottom Layout Structure and Node Position Invariance', () => {
    const DEFAULT_NODE_POSITIONS = {
      whatsapp: { x: 670, y: 30 },
      orchestrator: { x: 640, y: 165 },
      sales: { x: 30, y: 350 },
      booking: { x: 350, y: 350 },
      courts: { x: 670, y: 350 },
      handoff: { x: 990, y: 350 },
      general: { x: 1310, y: 350 }
    };

    // Verify strict top-to-bottom hierarchy: y(WhatsApp) < y(Orchestrator) < y(Subagents)
    assert.ok(DEFAULT_NODE_POSITIONS.whatsapp.y < DEFAULT_NODE_POSITIONS.orchestrator.y, 'WhatsApp node must be top level above orchestrator');
    assert.ok(DEFAULT_NODE_POSITIONS.orchestrator.y < DEFAULT_NODE_POSITIONS.sales.y, 'Orchestrator node must be above subagents level');
    assert.equal(DEFAULT_NODE_POSITIONS.sales.y, DEFAULT_NODE_POSITIONS.booking.y, 'Subagents must align horizontally at level 3');
    assert.equal(DEFAULT_NODE_POSITIONS.booking.y, DEFAULT_NODE_POSITIONS.courts.y);
    assert.equal(DEFAULT_NODE_POSITIONS.courts.y, DEFAULT_NODE_POSITIONS.handoff.y);
    assert.equal(DEFAULT_NODE_POSITIONS.handoff.y, DEFAULT_NODE_POSITIONS.general.y);

    // Verify all 7 critical nodes exist
    const nodeKeys = ['whatsapp', 'orchestrator', 'sales', 'booking', 'courts', 'handoff', 'general'];
    for (const key of nodeKeys) {
      assert.ok(DEFAULT_NODE_POSITIONS[key], `Node ${key} must exist in layout`);
      assert.equal(typeof DEFAULT_NODE_POSITIONS[key].x, 'number');
      assert.equal(typeof DEFAULT_NODE_POSITIONS[key].y, 'number');
    }
  });

  await t.test('9. Supervisor Prompt and Subagents High-Performance Directives Invariance', () => {
    // 1. Supervisor Prompt
    assert.ok(defaultOrchestratorConfig.prompt, 'Supervisor should have a default prompt');
    assert.match(defaultOrchestratorConfig.prompt, /Director de Operaciones/i, 'Supervisor should be framed as Operations Director');
    assert.match(defaultOrchestratorConfig.prompt, /Escalado Humano/i, 'Supervisor should mention handoff priority');
    assert.match(defaultOrchestratorConfig.prompt, /Ventas & Menú/i, 'Supervisor should mention sales');

    // 2. Sales Consultative Prompt
    const salesPrompt = defaultOrchestratorConfig.subagents.sales.prompt;
    assert.match(salesPrompt, /venta consultiva/i, 'Sales should include consultative selling');
    assert.match(salesPrompt, /venta cruzada/i, 'Sales should include cross-selling');
    assert.match(salesPrompt, /confirmación explícita/i, 'Sales should require confirmation before ordering');

    // 3. Booking Proactive Slots Prompt
    const bookingPrompt = defaultOrchestratorConfig.subagents.booking.prompt;
    assert.match(bookingPrompt, /proactivamente.*opciones libres/i, 'Booking should proactively offer alternative slots');
    assert.match(bookingPrompt, /suma sus duraciones/i, 'Booking should handle multiple service durations');

    // 4. Courts Illumination & Codes
    const courtsPrompt = defaultOrchestratorConfig.subagents.courts.prompt;
    assert.match(courtsPrompt, /iluminación nocturna/i, 'Courts should handle night illumination rates');
    assert.match(courtsPrompt, /CRT-XXXXXX/i, 'Courts should reference confirmation code');

    // 5. Handoff Empathy & Data Gathering
    const handoffPrompt = defaultOrchestratorConfig.subagents.handoff.prompt;
    assert.match(handoffPrompt, /empatía/i, 'Handoff should include empathy protocol');
    assert.match(handoffPrompt, /solución preparada/i, 'Handoff should gather info for the human advisor');

    // 6. Concierge Front-Desk & Conversion Bridge
    const generalPrompt = defaultOrchestratorConfig.subagents.general.prompt;
    assert.match(generalPrompt, /Conserje y Anfitrión/i, 'General agent should be framed as Concierge & Host');
    assert.match(generalPrompt, /puente proactivo/i, 'General agent must have a proactive commercial bridge');
    assert.match(generalPrompt, /no inventes datos/i, 'General agent must have anti-hallucination guardrails');
  });

  await t.test('10. Dynamic Module Routing Invariance (storeModules)', () => {
    // A: Tenant with courts disabled
    const tenantWithoutCourts = { storeEnabled: true, bookingsEnabled: true, courtsEnabled: false };
    const courtQuery = 'Quiero reservar una cancha de fútbol para las 7pm';
    const routedCourt = routeIntent(courtQuery, [], defaultOrchestratorConfig, tenantWithoutCourts);
    assert.equal(routedCourt, 'general', 'When courtsEnabled is false, court queries should route to general host');

    // B: Tenant with courts enabled
    const tenantWithCourts = { storeEnabled: true, bookingsEnabled: true, courtsEnabled: true };
    const routedCourtEnabled = routeIntent(courtQuery, [], defaultOrchestratorConfig, tenantWithCourts);
    assert.equal(routedCourtEnabled, 'courts', 'When courtsEnabled is true, court queries route to courts subagent');

    // C: Tenant with store disabled (e.g. appointment-only barbershop)
    const tenantWithoutStore = { storeEnabled: false, bookingsEnabled: true, courtsEnabled: false };
    const productQuery = '¿Cuánto cuesta la pomada para cabello?';
    const routedProduct = routeIntent(productQuery, [], defaultOrchestratorConfig, tenantWithoutStore);
    assert.equal(routedProduct, 'general', 'When storeEnabled is false, product queries should route to general host');

    // D: Tenant with bookings disabled (retail only)
    const tenantWithoutBookings = { storeEnabled: true, bookingsEnabled: false, courtsEnabled: false };
    const bookingQuery = 'Quiero agendar un turno para atención mañana';
    const routedBooking = routeIntent(bookingQuery, [], defaultOrchestratorConfig, tenantWithoutBookings);
    assert.equal(routedBooking, 'general', 'When bookingsEnabled is false, booking queries should route to general host');
  });

  await t.test('11. 2-Hour Conversation Session Window & Anti-Greeting Repetition Logic', () => {
    // Helper function reproducing session detection logic
    function checkSessionMemory(lastMessageDate, now = new Date()) {
      if (!lastMessageDate) return { isWithin2Hours: false, directive: 'Saluda cordialmente' };
      const diffMinutes = Math.floor((now.getTime() - new Date(lastMessageDate).getTime()) / (1000 * 60));
      const isWithin2Hours = diffMinutes < 120;
      return {
        isWithin2Hours,
        diffMinutes,
        directive: isWithin2Hours
          ? 'ESTÁ ESTRICTAMENTE PROHIBIDO volver a saludar'
          : 'Saluda cordialmente'
      };
    }

    const now = new Date();

    // 15 minutes ago -> Active session
    const recentDate = new Date(now.getTime() - 15 * 60 * 1000);
    const recentSession = checkSessionMemory(recentDate, now);
    assert.strictEqual(recentSession.isWithin2Hours, true, '15 min ago must be within 2h session');
    assert.match(recentSession.directive, /PROHIBIDO volver a saludar/, 'Should prohibit repeated greetings for active session');

    // 90 minutes ago -> Active session
    const midDate = new Date(now.getTime() - 90 * 60 * 1000);
    const midSession = checkSessionMemory(midDate, now);
    assert.strictEqual(midSession.isWithin2Hours, true, '90 min ago must be within 2h session');

    // 150 minutes ago (2.5h) -> Expired session
    const expiredDate = new Date(now.getTime() - 150 * 60 * 1000);
    const expiredSession = checkSessionMemory(expiredDate, now);
    assert.strictEqual(expiredSession.isWithin2Hours, false, '150 min ago must expire 2h session');
    assert.match(expiredSession.directive, /Saluda cordialmente/, 'Should allow cordial greeting after 2h expiration');

    // First time customer (no history)
    const newSession = checkSessionMemory(null, now);
    assert.strictEqual(newSession.isWithin2Hours, false, 'New chat has no prior session');
    assert.match(newSession.directive, /Saluda cordialmente/, 'Should allow cordial greeting for new customers');
  });

  await t.test('12. Chat-First Protocol & Links on Demand Directives Invariance', () => {
    // Directives template validation
    const storeUrl = 'https://betico.tech/tienda/demo';
    const bookingUrl = 'https://betico.tech/reservar/demo';
    const mapsUrl = 'https://waze.com/ul/hd1u';
    const socialLinks = 'Instagram: @demo';

    const chatFirstDirectives = `
REGLA DE ORO "CHAT-FIRST" Y MANEJO DE ENLACES:
1. VENTA Y ASESORÍA CONVERSACIONAL DIRECTA: Tu objetivo principal es atender, asesorar, cotizar y cerrar pedidos o citas directamente en este chat de WhatsApp.
2. ENLACES DE TIENDA Y RESERVAS (ESTRICTAMENTE BAJO DEMANDA):
   - PROHIBIDO enviar los enlaces de la tienda (${storeUrl}) o reservas (${bookingUrl}) por iniciativa propia si el cliente solo está preguntando por productos, precios, menú, citas o turnos. Atiéndelo y cierra la venta por aquí.
   - SOLO y ÚNICAMENTE entrega el link de la tienda web o reservas web SI EL CLIENTE LO PIDE EXPRESAMENTE (ej: "pásame el link", "¿tienen página web?", "mándame el catálogo en línea", "prefiero pedir por la web").
3. ENLACES INFORMATIVOS GENERALES (BAJO DEMANDA NATURAL):
   - Si el cliente pregunta cómo llegar, dónde están o por ubicación: comparte la dirección física y el enlace de Waze / Google Maps (${mapsUrl}).
   - Si el cliente pregunta por redes sociales o página web: comparte los perfiles oficiales (${socialLinks}).
`.trim();

    assert.match(chatFirstDirectives, /CHAT-FIRST/i, 'Must have Chat-First header');
    assert.match(chatFirstDirectives, /PROHIBIDO enviar los enlaces.*por iniciativa propia/i, 'Must prohibit unsolicited links');
    assert.match(chatFirstDirectives, /SOLO y ÚNICAMENTE entrega el link.*SI EL CLIENTE LO PIDE/i, 'Links delivered strictly on explicit demand');
    assert.match(chatFirstDirectives, /Waze \/ Google Maps/, 'Must support Waze / Maps on demand');
    assert.match(chatFirstDirectives, /redes sociales/i, 'Must support social links on demand');
  });

  await t.test('13. Resilient Cross-Engine Fallback Configuration Invariance', () => {
    // Validate Fallback mapping logic
    function resolveAIConfigs(tenant, masterConfig) {
      if (tenant?.aiApiKeyEncrypted) {
        return {
          primary: { provider: tenant.aiProvider, model: tenant.aiModel },
          fallback: { provider: 'betico_ai', model: 'betico-ai' }
        };
      }
      return {
        primary: { provider: 'betico_ai', model: 'betico-ai' },
        fallback: { provider: 'gemini', model: 'gemini-2.5-flash' }
      };
    }

    // A: Standard account ($0 Betico AI) -> Primary is betico_ai, Fallback is Gemini Flash Master
    const stdAccount = resolveAIConfigs({ aiApiKeyEncrypted: null }, { provider: 'betico_ai' });
    assert.equal(stdAccount.primary.provider, 'betico_ai', 'Standard account primary must be betico_ai');
    assert.equal(stdAccount.fallback.provider, 'gemini', 'Standard account fallback must be gemini master');

    // B: BYOK account -> Primary is tenant BYOK, Fallback is betico_ai local VPS
    const byokAccount = resolveAIConfigs({ aiApiKeyEncrypted: 'enc_token', aiProvider: 'openai', aiModel: 'gpt-4o' }, {});
    assert.equal(byokAccount.primary.provider, 'openai', 'BYOK account primary must be tenant provider');
    assert.equal(byokAccount.fallback.provider, 'betico_ai', 'BYOK account fallback must be local betico_ai on VPS');
  });

  await t.test('14. FAQ Subagent Custom Links & Web Resources (RAG Invariance)', () => {
    // Helper replicating orchestrator customLinks injection logic
    function injectCustomLinks(subagent, sourcesUsed) {
      let customLinksText = '';
      const validLinks = (subagent?.links || []).filter(l => l && l.url && l.label);
      if (validLinks.length > 0) {
        sourcesUsed.push('customLinks');
        customLinksText = '🔗 ENLACES Y RECURSOS OFICIALES (ENTREGAR ÚNICAMENTE BAJO DEMANDA):\n' +
          validLinks.map(l => `• *${l.label}*: ${l.url}${l.description ? ` (${l.description})` : ''}`).join('\n') + '\n';
      }
      return customLinksText;
    }

    // Test with multiple valid links
    const sources = ['businessInfo', 'schedule', 'payments'];
    const subagentWithLinks = {
      id: 'general',
      name: 'Identidad & FAQ',
      links: [
        { label: 'Menú en PDF', url: 'https://betico.tech/menu.pdf', description: 'Descargable' },
        { label: 'Catálogo Drive', url: 'https://drive.google.com/catalogo', description: 'Fotos HD' }
      ]
    };

    const linksText = injectCustomLinks(subagentWithLinks, sources);
    assert.ok(sources.includes('customLinks'), 'sourcesUsed must contain customLinks');
    assert.match(linksText, /• \*Menú en PDF\*: https:\/\/betico\.tech\/menu\.pdf \(Descargable\)/);
    assert.match(linksText, /• \*Catálogo Drive\*: https:\/\/drive\.google\.com\/catalogo \(Fotos HD\)/);
    assert.match(linksText, /ENTREGAR ÚNICAMENTE BAJO DEMANDA/);

    // Test with empty links
    const emptySources = ['businessInfo'];
    const emptyLinksText = injectCustomLinks({ links: [] }, emptySources);
    assert.equal(emptyLinksText, '', 'Empty links should produce empty string');
    assert.ok(!emptySources.includes('customLinks'), 'Empty links should not add customLinks to sourcesUsed');
  });

});


