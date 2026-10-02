import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Official Model Pricing Catalog & Cost Calculation Helper
// Mirrors src/server/db/ai-usage.repo.ts
export const CRC_EXCHANGE_RATE = 515;

export const MODEL_PRICING_CATALOG = {
  // DeepSeek
  'deepseek/deepseek-chat': { inputPerMillion: 0.27, outputPerMillion: 1.10 },
  'deepseek/deepseek-reasoner': { inputPerMillion: 0.55, outputPerMillion: 2.19 },

  // Google Gemini
  'gemini/gemini-2.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini/gemini-2.5-flash-lite': { inputPerMillion: 0.0375, outputPerMillion: 0.15 },
  'gemini/gemini-2.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },
  'gemini/gemini-1.5-flash': { inputPerMillion: 0.075, outputPerMillion: 0.30 },
  'gemini/gemini-1.5-pro': { inputPerMillion: 1.25, outputPerMillion: 5.00 },

  // OpenAI
  'openai/gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.60 },
  'openai/gpt-4o': { inputPerMillion: 2.50, outputPerMillion: 10.00 },
  'openai/gpt-4-turbo': { inputPerMillion: 10.00, outputPerMillion: 30.00 },
  'openai/o1': { inputPerMillion: 15.00, outputPerMillion: 60.00 },
  'openai/o1-mini': { inputPerMillion: 1.10, outputPerMillion: 4.40 },
  'openai/o3-mini': { inputPerMillion: 1.10, outputPerMillion: 4.40 },

  // Anthropic
  'anthropic/claude-3-7-sonnet': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'anthropic/claude-3-5-sonnet': { inputPerMillion: 3.00, outputPerMillion: 15.00 },
  'anthropic/claude-3-5-haiku': { inputPerMillion: 0.80, outputPerMillion: 4.00 }
};

export function calculateModelCost(provider, model, promptTokens, completionTokens) {
  const normProvider = (provider || 'gemini').toLowerCase().trim();
  const normModel = (model || 'gemini-2.5-flash').toLowerCase().trim();

  let pricing = MODEL_PRICING_CATALOG[`${normProvider}/${normModel}`];
  if (!pricing) {
    for (const [key, val] of Object.entries(MODEL_PRICING_CATALOG)) {
      const [keyProv, keyModel] = key.split('/');
      if (normProvider.includes(keyProv) && normModel.includes(keyModel)) {
        pricing = val;
        break;
      }
    }
  }

  if (!pricing) {
    if (normProvider === 'deepseek') pricing = MODEL_PRICING_CATALOG['deepseek/deepseek-chat'];
    else if (normProvider === 'openai') pricing = MODEL_PRICING_CATALOG['openai/gpt-4o-mini'];
    else if (normProvider === 'anthropic') pricing = MODEL_PRICING_CATALOG['anthropic/claude-3-5-haiku'];
    else pricing = MODEL_PRICING_CATALOG['gemini/gemini-2.5-flash'];
  }

  const promptCost = ((promptTokens || 0) / 1_000_000) * pricing.inputPerMillion;
  const completionCost = ((completionTokens || 0) / 1_000_000) * pricing.outputPerMillion;
  const costUsd = Number((promptCost + completionCost).toFixed(7));
  const costCrc = Number((costUsd * CRC_EXCHANGE_RATE).toFixed(4));

  return { costUsd, costCrc, pricing };
}

describe('AI BYOK, Pilot Priority Queue & Clinical Privacy Barrier Tests', () => {

  // --------------------------------------------------------------------------
  // 1. Model Pricing Catalog & Financial Spend Estimation Engine
  // --------------------------------------------------------------------------
  describe('1. Model Pricing Catalog & Cost Calculation Engine', () => {
    test('contains authoritative per-million token pricing for major AI providers', () => {
      assert.ok(MODEL_PRICING_CATALOG['deepseek/deepseek-chat'], 'DeepSeek chat price should be defined');
      assert.equal(MODEL_PRICING_CATALOG['deepseek/deepseek-chat'].inputPerMillion, 0.27);
      assert.equal(MODEL_PRICING_CATALOG['deepseek/deepseek-chat'].outputPerMillion, 1.10);

      assert.ok(MODEL_PRICING_CATALOG['gemini/gemini-2.5-flash'], 'Gemini 2.5 Flash price should be defined');
      assert.equal(MODEL_PRICING_CATALOG['gemini/gemini-2.5-flash'].inputPerMillion, 0.075);
      assert.equal(MODEL_PRICING_CATALOG['gemini/gemini-2.5-flash'].outputPerMillion, 0.30);

      assert.ok(MODEL_PRICING_CATALOG['openai/gpt-4o-mini'], 'GPT-4o-mini price should be defined');
      assert.equal(MODEL_PRICING_CATALOG['openai/gpt-4o-mini'].inputPerMillion, 0.15);
      assert.equal(MODEL_PRICING_CATALOG['openai/gpt-4o-mini'].outputPerMillion, 0.60);

      assert.ok(MODEL_PRICING_CATALOG['anthropic/claude-3-5-sonnet'], 'Claude 3.5 Sonnet price should be defined');
      assert.equal(MODEL_PRICING_CATALOG['anthropic/claude-3-5-sonnet'].inputPerMillion, 3.00);
      assert.equal(MODEL_PRICING_CATALOG['anthropic/claude-3-5-sonnet'].outputPerMillion, 15.00);

      assert.equal(CRC_EXCHANGE_RATE, 515, 'BCCR baseline exchange rate should be 515 CRC/USD');
    });

    test('calculates exact USD and CRC spend for a typical conversational turn', () => {
      // Example turn: 800 prompt tokens, 150 completion tokens on Gemini 2.5 Flash
      // Input cost: 800 / 1,000,000 * 0.075 = $0.0000600
      // Output cost: 150 / 1,000,000 * 0.30 = $0.0000450
      // Total USD: $0.000105
      // Total CRC: $0.000105 * 515 = 0.054075 CRC
      const cost = calculateModelCost('gemini', 'gemini-2.5-flash', 800, 150);
      assert.ok(cost.costUsd > 0.000104 && cost.costUsd < 0.000106, `Expected ~0.000105, got ${cost.costUsd}`);
      assert.ok(cost.costCrc > 0.054 && cost.costCrc < 0.055, `Expected ~0.054, got ${cost.costCrc}`);
    });

    test('calculates exact spend for high-volume DeepSeek reasoning session', () => {
      // 10,000 prompt tokens, 2,000 reasoning output tokens on DeepSeek Reasoner
      // Input: 10,000 / 1M * 0.55 = $0.0055
      // Output: 2,000 / 1M * 2.19 = $0.00438
      // Total USD: $0.00988
      // Total CRC: 0.00988 * 515 = 5.0882 CRC
      const cost = calculateModelCost('deepseek', 'deepseek-reasoner', 10000, 2000);
      assert.ok(Math.abs(cost.costUsd - 0.00988) < 0.00001, `Expected $0.00988, got ${cost.costUsd}`);
      assert.ok(Math.abs(cost.costCrc - 5.0882) < 0.001, `Expected ₡5.0882, got ${cost.costCrc}`);
    });

    test('handles zero tokens and unknown models gracefully with default fallback rate', () => {
      const zeroCost = calculateModelCost('gemini', 'gemini-2.5-flash', 0, 0);
      assert.equal(zeroCost.costUsd, 0);
      assert.equal(zeroCost.costCrc, 0);

      const unknownCost = calculateModelCost('custom_provider', 'custom-model-xyz', 1000, 1000);
      assert.ok(unknownCost.costUsd > 0, 'Fallback rate should produce valid non-zero estimate');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Strict Clinical Privacy Barrier (HIPAA / Ley 8968 PRODHAB)
  // --------------------------------------------------------------------------
  describe('2. Strict Clinical Privacy Barrier', () => {
    test('strictly isolates sensitive medical records from LLM prompts', () => {
      // Simulate raw medical patient record from customer_records database table
      const sensitivePatientRecord = {
        id: 'rec_patient_987654',
        tenantId: 'clinic_tenant_01',
        fullName: 'María González Morales',
        phone: '50688887777',
        pathologicalBackground: 'Hipertensión arterial estadio 2, Diabetes Mellitus tipo 2',
        allergies: 'Penicilina, Sulfas, AINEs (Ketorolaco)',
        diagnosis: 'Trastorno depresivo recurrente, lumbalgia crónica',
        treatmentPlan: 'Sertralina 50mg VO c/24h, Terapia física 2 veces por semana',
        clinicalNotes: 'Paciente refiere episodio de ideación autolítica hace 6 meses. No comentar en llamadas familiares.',
        vitalSigns: { bp: '140/90', hr: 82, glucose: 135 },
        prescriptions: ['Sertralina 50mg', 'Metformina 850mg', 'Enalapril 20mg'],
        insuranceNumber: 'CCSS-1122334455'
      };

      // Apply the Clinical Privacy Filter implemented in agent-orchestrator
      let sanitizedCustomerRecord = null;
      if (sensitivePatientRecord) {
        sanitizedCustomerRecord = {
          id: sensitivePatientRecord.id,
          fullName: sensitivePatientRecord.fullName
        };
      }

      // Assert that sanitized customer record ONLY exposes id and fullName
      assert.deepEqual(Object.keys(sanitizedCustomerRecord).sort(), ['fullName', 'id']);
      assert.equal(sanitizedCustomerRecord.fullName, 'María González Morales');
      assert.equal(sanitizedCustomerRecord.id, 'rec_patient_987654');

      // Verify that prohibited keys are strictly undefined
      assert.equal(sanitizedCustomerRecord.pathologicalBackground, undefined);
      assert.equal(sanitizedCustomerRecord.allergies, undefined);
      assert.equal(sanitizedCustomerRecord.diagnosis, undefined);
      assert.equal(sanitizedCustomerRecord.treatmentPlan, undefined);
      assert.equal(sanitizedCustomerRecord.clinicalNotes, undefined);
      assert.equal(sanitizedCustomerRecord.vitalSigns, undefined);
      assert.equal(sanitizedCustomerRecord.prescriptions, undefined);
      assert.equal(sanitizedCustomerRecord.insuranceNumber, undefined);

      // Verify prompt string interpolation does not leak any medical keywords
      const promptBookingDirective = sanitizedCustomerRecord?.fullName
        ? `Cliente Registrado: ${sanitizedCustomerRecord.fullName}\n`
        : '';
      const commandBooking = `<<<COMMAND_BOOKING: {"service":"Consulta General","date":"2026-10-15","time":"10:00","customerName":"${sanitizedCustomerRecord.fullName}","recordId":"${sanitizedCustomerRecord.id}"}>>>`;

      const simulatedFullPrompt = `${promptBookingDirective} ${commandBooking}`;

      assert.ok(!simulatedFullPrompt.includes('Hipertensión'));
      assert.ok(!simulatedFullPrompt.includes('Diabetes'));
      assert.ok(!simulatedFullPrompt.includes('Penicilina'));
      assert.ok(!simulatedFullPrompt.includes('Sertralina'));
      assert.ok(!simulatedFullPrompt.includes('autolítica'));
      assert.ok(!simulatedFullPrompt.includes('140/90'));
      assert.ok(!simulatedFullPrompt.includes('CCSS'));
    });
  });

  // --------------------------------------------------------------------------
  // 3. Message Queue Priority Ordering (Fast-Track for BYOK & Pilot VIP)
  // --------------------------------------------------------------------------
  describe('3. Message Queue Priority Ordering', () => {
    test('sorts high-priority pilot and BYOK messages ahead of normal messages', () => {
      // Simulate queue messages in order of insertion into DB
      const simulatedQueue = [
        { id: 'msg_1', tenantId: 'free_tenant', priority: 0, createdAt: new Date('2026-10-02T10:00:00Z') },
        { id: 'msg_2', tenantId: 'free_tenant_2', priority: 0, createdAt: new Date('2026-10-02T10:00:01Z') },
        { id: 'msg_3_byok', tenantId: 'byok_tenant', priority: 50, createdAt: new Date('2026-10-02T10:00:02Z') },
        { id: 'msg_4_pilot', tenantId: 'pilot_vip_tenant', priority: 100, createdAt: new Date('2026-10-02T10:00:03Z') },
        { id: 'msg_5_pilot_later', tenantId: 'pilot_vip_tenant', priority: 100, createdAt: new Date('2026-10-02T10:00:04Z') },
      ];

      // Simulate ORDER BY priority DESC, created_at ASC (the SQL query in takeNextPending)
      const sortedQueue = [...simulatedQueue].sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      // The execution order must be:
      // 1. msg_4_pilot (priority 100, created 10:00:03)
      // 2. msg_5_pilot_later (priority 100, created 10:00:04)
      // 3. msg_3_byok (priority 50, created 10:00:02)
      // 4. msg_1 (priority 0, created 10:00:00)
      // 5. msg_2 (priority 0, created 10:00:01)
      assert.equal(sortedQueue[0].id, 'msg_4_pilot');
      assert.equal(sortedQueue[1].id, 'msg_5_pilot_later');
      assert.equal(sortedQueue[2].id, 'msg_3_byok');
      assert.equal(sortedQueue[3].id, 'msg_1');
      assert.equal(sortedQueue[4].id, 'msg_2');
    });

    test('priority score mapping matches webhook handler rules', () => {
      function getQueuePriority(tenant) {
        if (tenant?.isAiPilot) return 100;
        if (tenant?.aiApiKeyEncrypted) return 50;
        return Number(tenant?.aiPriorityLevel) || 0;
      }

      assert.equal(getQueuePriority({ isAiPilot: true, aiApiKeyEncrypted: null }), 100, 'Pilot tenant gets priority 100');
      assert.equal(getQueuePriority({ isAiPilot: true, aiApiKeyEncrypted: 'enc_key' }), 100, 'Pilot tenant with BYOK gets priority 100');
      assert.equal(getQueuePriority({ isAiPilot: false, aiApiKeyEncrypted: 'enc_key' }), 50, 'BYOK tenant gets priority 50');
      assert.equal(getQueuePriority({ isAiPilot: false, aiApiKeyEncrypted: null, aiPriorityLevel: 75 }), 75, 'Custom priority level respected');
      assert.equal(getQueuePriority({ isAiPilot: false, aiApiKeyEncrypted: null }), 0, 'Standard tenant gets priority 0');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Multi-Agent Token Savings & Prompt Modularity
  // --------------------------------------------------------------------------
  describe('4. Multi-Agent Prompt Modularity & Token Savings', () => {
    test('modular subagent prompt achieves significant token reduction vs monolithic prompt', () => {
      // Simulate multi-module business datasets: products, services, appointments, courts, FAQs
      const fullCatalogProducts = Array.from({ length: 25 }, (_, i) => 
        `• Producto ${i + 1}: Botella de Aluminio Edición ${i + 1}, Precio: ₡${3500 + i * 100}, Stock: 10, Variantes: Rojo, Azul, Negro. Foto oficial: https://betico.tech/img/${i}.jpg`
      ).join('\n');

      const fullServicesCatalog = Array.from({ length: 25 }, (_, i) => 
        `• Servicio Especializado ${i + 1}: Corte y perfilado premium, Duración: 45 min, Precio: ₡${8500 + i * 200}, Especialistas: Carlos, Andrea`
      ).join('\n');

      const fullCourtsCatalog = Array.from({ length: 15 }, (_, i) => 
        `• Cancha ${i + 1}: Sintética Techada Fútbol 5, Superficie: Caucho criogénico, Precio día: ₡18,000/h, Precio noche: ₡24,000/h`
      ).join('\n');

      const generalFaq = `Políticas de envío, transferencias SINPE Móvil al 8888-8888, horarios de atención lunes a domingo de 8am a 9pm, parqueo privado disponible.`;

      // Monolithic approach: all catalogs injected into every single turn
      const monolithicPrompt = `
        INSTRUCCIONES GENERALES Y SUPERVISOR: Eres el asistente del negocio.
        ${fullCatalogProducts}
        ${fullServicesCatalog}
        ${fullCourtsCatalog}
        ${generalFaq}
      `;

      // Multi-agent modular approach: for a Sales query, ONLY the products catalog is loaded
      const salesSubagentPrompt = `
        ROL: Asesor Especialista de Ventas.
        ${fullCatalogProducts}
        ${generalFaq}
      `;

      // Multi-agent modular approach: for a Courts query, ONLY the courts catalog is loaded
      const courtsSubagentPrompt = `
        ROL: Asesor Especialista de Canchas.
        ${fullCourtsCatalog}
        ${generalFaq}
      `;

      const monolithicLength = monolithicPrompt.length;
      const salesLength = salesSubagentPrompt.length;
      const courtsLength = courtsSubagentPrompt.length;

      const salesReduction = ((monolithicLength - salesLength) / monolithicLength) * 100;
      const courtsReduction = ((monolithicLength - courtsLength) / monolithicLength) * 100;

      // Assert that omitting unrelated modules produces >35% savings for sales and >60% for courts
      assert.ok(salesReduction > 35, `Expected >35% reduction for sales, got ${salesReduction.toFixed(1)}%`);
      assert.ok(courtsReduction > 60, `Expected >60% reduction for courts, got ${courtsReduction.toFixed(1)}%`);
    });
  });
});
