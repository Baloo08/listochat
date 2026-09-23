import test from 'node:test';
import assert from 'node:assert/strict';

export const defaultOrchestratorConfig = {
  enabled: true,
  subagents: {
    sales: {
      id: 'sales',
      name: 'Ventas & Menú',
      enabled: true,
      prompt: 'Eres el especialista en ventas y catálogo. Asesora activamente con amabilidad y calidez costarricense (*pura vida*, con gusto). Destaca beneficios, presenta variantes (tallas, sabores, presentaciones) y extras/aderezos. Lleva la cuenta sumada del carrito con subtotales y total. Consulta si es para Envío a Domicilio o Retiro en Local y el método de pago.',
      sources: ['products', 'payments', 'delivery'],
      actions: ['order', 'media']
    },
    booking: {
      id: 'booking',
      name: 'Citas & Agenda',
      enabled: true,
      prompt: 'Eres el especialista de agenda y servicios. Ofrece los servicios disponibles con su duración y precios fijos. Verifica que la fecha y hora NO choquen con horarios ocupados. Sé puntual, cordial y confirma los datos del cliente antes de agendar.',
      sources: ['services', 'specialists', 'busySlots', 'customerRecord'],
      actions: ['booking', 'reschedule', 'cancel']
    },
    courts: {
      id: 'courts',
      name: 'Canchas Deportivas',
      enabled: true,
      prompt: 'Eres el especialista en reservas de canchas y partidos deportivos. Brinda información sobre canchas disponibles, superficies, precios por hora e iluminación. Para reagendar, solicita el código CRT-XXXXXX o #RES- y valida disponibilidad.',
      sources: ['courts', 'schedules'],
      actions: ['courtBooking', 'courtReschedule']
    },
    handoff: {
      id: 'handoff',
      name: 'Escalado Humano',
      enabled: true,
      prompt: 'Detecta solicitudes de hablar con una persona, asesor o quejas y reclamos urgentes. Responde con empatía y comunica que un asesor humano atenderá el caso de inmediato.',
      sources: ['keywords'],
      actions: ['handoff']
    },
    general: {
      id: 'general',
      name: 'Identidad & FAQ',
      enabled: true,
      prompt: 'Eres el anfitrión principal del negocio en WhatsApp. Brinda bienvenida cordial, responde dudas sobre horarios, ubicación, métodos de pago y canaliza adecuadamente al cliente con calidez costarricense.',
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

export function routeIntent(userMessage, chatHistory, orchestratorConfig) {
  const lowerMsg = userMessage.toLowerCase().trim();
  const recentHistory = (chatHistory || []).slice(-6).map(h => h.content).join(' ').toLowerCase();
  const context = `${recentHistory} ${lowerMsg}`;

  const subagents = orchestratorConfig?.subagents || defaultOrchestratorConfig.subagents;

  // 1. Escalation / Handoff
  const isHandoff = /humano|asesor|persona|agente|hablar con alguien|queja|reclamo|urgente|hablar con un asesor/i.test(lowerMsg);
  if (isHandoff) {
    return subagents.handoff?.enabled !== false ? 'handoff' : 'general';
  }

  // 2. Canchas deportivas
  const isCourts = /cancha|canchas|partido|futbol|fútbol|padel|pádel|mejenga|gramilla|reservar cancha|alquiler cancha|crt-|#res-/i.test(context);
  if (isCourts) {
    return subagents.courts?.enabled !== false ? 'courts' : 'general';
  }

  // 3. Ventas de tienda / restaurante / pedidos
  const isSales = /precio|costo|cuanto|venden|catalogo|catálogo|menu|menú|producto|productos|comprar|pedir|orden|foto|imagen|plato|comida|pizza|hamburguesa|variante|talla|sabor|llevar|delivery|envio|envío|agregar al carrito|confirmo/i.test(context);

  // 4. Citas y Servicios
  const isBooking = /servicio|servicios|cita|citas|agenda|agendar|turno|atencion|atención|doctor|especialista|cancelar cita|reagendar|disponibilidad de horario|horario de cita/i.test(context);

  if (isSales && !isBooking) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking && !isSales) {
    return subagents.booking?.enabled !== false ? 'booking' : 'general';
  }

  if (isSales) {
    return subagents.sales?.enabled !== false ? 'sales' : 'general';
  }

  if (isBooking) {
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

});
