import React, { useState, useEffect } from 'react';
import { Bot, Save, Play, Sparkles, Wand2, CheckCircle, HelpCircle, X, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AgentPromptStudio() {
  const [config, setConfig] = useState({
    systemPrompt: '',
    businessName: '',
    currency: 'CRC',
    notifyNumber: ''
  });
  const [simInput, setSimInput] = useState('');
  const [simOutput, setSimOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 10-Question Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState({
    businessName: '',
    industry: '',
    targetAudience: 'Familias, profesionales y público general',
    tone: 'Cálido, profesional, empático y resolutivo',
    valueProposition: 'Atención personalizada, calidad garantizada y respuesta rápida',
    primaryGoal: 'Agendar citas y responder dudas sobre catálogo de servicios/productos',
    locationAndHours: 'San José, Costa Rica. Lunes a Sábado de 8:00 AM a 6:00 PM',
    appointmentPolicies: 'Confirmar asistencia con anticipación, tolerancia máxima de 10 minutos',
    paymentMethods: 'SINPE Móvil, Transferencia Bancaria, Efectivo y Tarjeta',
    goldenRules: 'No inventar promociones ni precios fuera del catálogo. Siempre ser cortés y usar formato de WhatsApp (*negrita* y emojis).',
    humanEscalation: 'Si el cliente solicita hablar con un asesor humano o presenta un reclamo urgente'
  });

  useEffect(() => {
    fetchPrompt();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchPrompt = async () => {
    try {
      const res = await fetch('/api/agent/prompt', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfig({
            systemPrompt: data.systemPrompt || '',
            businessName: data.businessName || '',
            currency: data.currency || 'CRC',
            notifyNumber: data.notifyNumber || ''
          });
          if (data.businessName) {
            setWizardAnswers(prev => ({ ...prev, businessName: data.businessName }));
          }
        }
      }

      // Also pre-fetch store and schedule settings to pre-fill wizard with existing business info
      try {
        const storeRes = await fetch('/api/store', { headers: getHeaders() });
        const scheduleRes = await fetch('/api/appointments/schedule', { headers: getHeaders() });
        const store = storeRes.ok ? await storeRes.json() : null;
        const sch = scheduleRes.ok ? await scheduleRes.json() : null;

        if (store || sch) {
          setWizardAnswers(prev => {
            let pm = prev.paymentMethods;
            if (store) {
              const methods: string[] = [];
              if (store.acceptSinpe && store.sinpePhone) methods.push(`SINPE Móvil (${store.sinpePhone})`);
              if (store.acceptTransfer) methods.push('Transferencia Bancaria IBAN');
              if (store.acceptCashOnDelivery) methods.push('Efectivo contra entrega');
              if (methods.length > 0) pm = methods.join(', ');
            }

            let lh = prev.locationAndHours;
            if (sch?.jornadaConfig) {
              lh = `Lunes a Sábado de ${sch.jornadaConfig.startHour || '08:00'} a ${sch.jornadaConfig.endHour || '17:00'}`;
            }

            return {
              ...prev,
              businessName: store?.storeName || prev.businessName,
              paymentMethods: pm,
              locationAndHours: lh
            };
          });
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error fetching prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent/prompt', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Error al guardar el prompt.');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (!simInput.trim()) return;
    setSimOutput('Simulando respuesta con IA...');
    try {
      const res = await fetch('/api/agent/simulate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: simInput })
      });
      if (res.ok) {
        const data = await res.json();
        setSimOutput(data.replyText || data.reply || data.text || 'Sin respuesta.');
      } else {
        setSimOutput('Error en la simulación.');
      }
    } catch (error) {
      setSimOutput('Error en la simulación.');
    }
  };

  const applyPreset = (preset: string) => {
    let text = '';
    switch (preset) {
      case 'auto':
        text = `Eres el Asistente Virtual Oficial de detallado automotriz. Tu objetivo es asesorar a los clientes en servicios de lavado, pulido, corrección de pintura y protección cerámica, y facilitar el agendamiento de citas.
- Tono: Profesional, experto en autos y muy servicial.
- Siempre invita amablemente a indicar el modelo de vehículo y elegir la fecha ideal para su servicio.`;
        break;
      case 'medical':
        text = `Eres la Recepcionista Virtual Oficial de la clínica. Tu objetivo es brindar información clara y empática sobre nuestros tratamientos de salud y agendar citas médicas o de valoración.
- Tono: Respetuoso, empático, cálido y confidencial.
- Recuerda siempre indicar la importancia de puntualidad y solicitar el motivo de consulta.`;
        break;
      case 'restaurant':
        text = `Eres el Anfitrión Virtual del restaurante. Tu objetivo es presentar nuestro menú, tomar pedidos para llevar o entregas a domicilio y reservar mesas.
- Tono: Amigable, dinámico y enfocado en una experiencia culinaria deliciosa.
- Confirma siempre la cantidad de personas y hora estimada.`;
        break;
      case 'store':
        text = `Eres el Asesor de Ventas Oficial de la tienda. Tu objetivo es orientar a los clientes en nuestro catálogo de productos, disponibilidad de stock, tallas/colores y coordinar compras por WhatsApp o entrega a domicilio.
- Tono: Entusiasta, cercano y eficiente.`;
        break;
    }
    if (text) setConfig({ ...config, systemPrompt: text });
  };

  // Generate robust prompt from 10 questions
  const generatePromptFromWizard = () => {
    const generated = `Eres el Asistente Virtual Oficial de WhatsApp de *${wizardAnswers.businessName || config.businessName || 'nuestro negocio'}* (${wizardAnswers.industry || 'Servicios y Productos'}).

🎯 *MISIÓN Y OBJETIVO PRINCIPAL:*
${wizardAnswers.primaryGoal || 'Atender amablemente a nuestros clientes, brindar información precisa sobre nuestros servicios y productos, y coordinar citas o pedidos.'}

👥 *PÚBLICO OBJETIVO Y TONO DE COMUNICACIÓN:*
- Público: ${wizardAnswers.targetAudience}
- Tono: ${wizardAnswers.tone}. Usa un lenguaje natural, utiliza formato de WhatsApp (*negrita* para resaltar puntos clave) y emojis con moderación para que la interacción sea agradable.

⭐ *PROPUESTA DE VALOR:*
${wizardAnswers.valueProposition}

📍 *UBICACIÓN Y HORARIOS DE ATENCIÓN:*
${wizardAnswers.locationAndHours}

📋 *POLÍTICAS DE RESERVAS Y CITAS:*
${wizardAnswers.appointmentPolicies}

💳 *MÉTODOS DE PAGO Y CONDICIONES:*
${wizardAnswers.paymentMethods}

🚫 *REGLAS DE ORO Y LÍMITES:*
- ${wizardAnswers.goldenRules}
- Nunca inventes precios, promociones o servicios que no estén en la base de datos o catálogo.
- Si no conoces una respuesta específica, no desinformes: ofrece consultar con el equipo humano.

👤 *ESCALADO A ASESOR HUMANO:*
- ${wizardAnswers.humanEscalation}
- Si el cliente lo requiere, infórmale cordialmente que un asesor humano continuará la conversación en breve.`;

    setConfig({
      ...config,
      systemPrompt: generated,
      businessName: wizardAnswers.businessName || config.businessName
    });
    setIsWizardOpen(false);
    setWizardStep(1);
  };

  return (
    <div style={{ maxWidth: '1050px' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bot size={26} color="var(--primary)" /> Estudio del Agente IA
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Personaliza el comportamiento, instrucciones y personalidad del bot de WhatsApp
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsWizardOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.25)' }}
          >
            <Sparkles size={16} /> 🧙‍♂️ Asistente de Prompt (10 Preguntas)
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
          <CheckCircle size={18} /> ¡Instrucciones del Agente IA guardadas exitosamente!
        </div>
      )}

      {/* Main Grid: Studio Editor + Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Prompt Configuration */}
        <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Nombre Comercial del Negocio</label>
              <input
                type="text"
                value={config.businessName}
                onChange={e => setConfig({ ...config, businessName: e.target.value })}
                placeholder="Ej: Clínica Dental Sonrisas"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '0.85rem' }}>Moneda Principal</label>
              <input
                type="text"
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value })}
                placeholder="CRC o USD"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Instrucciones del Sistema (System Prompt)</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Define la personalidad y reglas</span>
            </div>

            <textarea
              rows={14}
              value={config.systemPrompt}
              onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="Escribe las instrucciones detalladas del agente aquí..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
            />
          </div>

          {/* Human Handoff & Escalation Card */}
          <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px solid #fef08a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🚨</span>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#854d0e', display: 'block' }}>Escalado y Modo de Atención Humana</strong>
                  <span style={{ fontSize: '0.75rem', color: '#a16207' }}>Pausa la IA y notifica al administrador cuando el cliente requiera un asesor humano</span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#854d0e' }}>
                <input
                  type="checkbox"
                  checked={config.humanHandoffEnabled !== false}
                  onChange={e => setConfig({ ...config, humanHandoffEnabled: e.target.checked })}
                />
                <span>Habilitado</span>
              </label>
            </div>

            {config.humanHandoffEnabled !== false && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#854d0e', marginBottom: '3px' }}>
                    📱 Teléfono del Administrador para Alertas (WhatsApp):
                  </label>
                  <input
                    type="tel"
                    value={config.handoffNotifyPhone || config.notifyNumber || ''}
                    onChange={e => setConfig({ ...config, handoffNotifyPhone: e.target.value, notifyNumber: e.target.value })}
                    placeholder="Ej: 50688888888"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #fde047', backgroundColor: 'white', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#a16207', display: 'block', marginTop: '2px' }}>
                    Recibirá un resumen por WhatsApp cuando la IA detecte que un cliente solicita atención humana.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#854d0e', marginBottom: '3px' }}>
                    🔑 Palabras Clave de Activación (separadas por comas):
                  </label>
                  <input
                    type="text"
                    value={(config.handoffKeywords || ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente']).join(', ')}
                    onChange={e => setConfig({ ...config, handoffKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="humano, asesor, persona, queja, hablar con alguien"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #fde047', backgroundColor: 'white', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              ⚡ Plantillas Rápidas por Industria:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => applyPreset('auto')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>🚗 Taller / Detallado</button>
              <button onClick={() => applyPreset('medical')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>🏥 Clínica Médica/Dental</button>
              <button onClick={() => applyPreset('restaurant')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>🍔 Restaurante / Café</button>
              <button onClick={() => applyPreset('store')} style={{ padding: '6px 10px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>🛍️ Tienda de Ropa / Retail</button>
            </div>
          </div>
        </div>

        {/* Right Column: Built-in Live Simulator */}
        <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', position: 'sticky', top: '20px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Play size={18} color="var(--primary)" /> Simulador de Conversación
          </h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Prueba cómo responderá tu agente a los mensajes de los clientes en tiempo real.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Mensaje de Prueba del Cliente:</label>
              <input
                type="text"
                value={simInput}
                onChange={e => setSimInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimulate()}
                placeholder="Ej: Hola, ¿qué servicios tienen para mañana?"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <button
              onClick={handleSimulate}
              style={{ padding: '9px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Play size={14} /> Enviar al Simulador
            </button>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Respuesta de la IA:</label>
              <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', minHeight: '140px', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap', border: '1px solid var(--border)' }}>
                {simOutput || 'Escribe un mensaje arriba y presiona Enviar para probar.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          10-QUESTION PROMPT GENERATOR WIZARD MODAL
      ========================================== */}
      {isWizardOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '680px', width: '100%', padding: '30px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', backgroundColor: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wand2 size={20} color="#7c3aed" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1e1b4b' }}>
                    Asistente de Creación de System Prompt
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Responde estas 10 preguntas para generar un prompt robusto y 100% personalizado
                  </p>
                </div>
              </div>

              <button onClick={() => setIsWizardOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={22} />
              </button>
            </div>

            {/* Questions Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Q1 & Q2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                    1. Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    value={wizardAnswers.businessName}
                    onChange={e => setWizardAnswers({ ...wizardAnswers, businessName: e.target.value })}
                    placeholder="Ej: Clínica Sonrisas"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                    2. Industria / Rubro *
                  </label>
                  <input
                    type="text"
                    value={wizardAnswers.industry}
                    onChange={e => setWizardAnswers({ ...wizardAnswers, industry: e.target.value })}
                    placeholder="Ej: Odontología, Detallado de autos"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Q3 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  3. ¿Quién es tu cliente ideal y público objetivo?
                </label>
                <input
                  type="text"
                  value={wizardAnswers.targetAudience}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, targetAudience: e.target.value })}
                  placeholder="Ej: Familias, jóvenes profesionales, amantes de los autos..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q4 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  4. ¿Cuál es el tono de comunicación deseado?
                </label>
                <input
                  type="text"
                  value={wizardAnswers.tone}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, tone: e.target.value })}
                  placeholder="Ej: Cálido, empático, formal, jovial, resolutivo..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q5 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  5. ¿Cuál es tu principal propuesta de valor o promesa de marca?
                </label>
                <input
                  type="text"
                  value={wizardAnswers.valueProposition}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, valueProposition: e.target.value })}
                  placeholder="Ej: Calidad garantizada, tecnología sin dolor, entrega express en 24h..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q6 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  6. ¿Cuál es el rol principal del bot en WhatsApp?
                </label>
                <input
                  type="text"
                  value={wizardAnswers.primaryGoal}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, primaryGoal: e.target.value })}
                  placeholder="Ej: Agendar citas, vender productos, resolver preguntas frecuentes..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q7 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  7. Ubicación física y horarios de atención
                </label>
                <input
                  type="text"
                  value={wizardAnswers.locationAndHours}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, locationAndHours: e.target.value })}
                  placeholder="Ej: San Pedro, Montes de Oca. Lunes a Viernes 8am-6pm, Sábados 9am-2pm"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q8 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  8. Políticas de citas, cancelaciones o entregas
                </label>
                <input
                  type="text"
                  value={wizardAnswers.appointmentPolicies}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, appointmentPolicies: e.target.value })}
                  placeholder="Ej: Confirmar asistencia con 2 horas de anticipación, 10 min de tolerancia..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q9 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  9. Métodos y condiciones de pago aceptados
                </label>
                <input
                  type="text"
                  value={wizardAnswers.paymentMethods}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, paymentMethods: e.target.value })}
                  placeholder="Ej: SINPE Móvil, Transferencia bancaria, Efectivo y Tarjeta contra entrega"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>

              {/* Q10 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>
                  10. Reglas clave: ¿Qué cosas NUNCA debe decir o hacer el bot?
                </label>
                <textarea
                  rows={2}
                  value={wizardAnswers.goldenRules}
                  onChange={e => setWizardAnswers({ ...wizardAnswers, goldenRules: e.target.value })}
                  placeholder="Ej: No dar diagnósticos médicos finales, no inventar precios fuera de catálogo..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '25px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsWizardOpen(false)}
                style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={generatePromptFromWizard}
                style={{ flex: 2, padding: '12px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Sparkles size={18} /> ✨ Generar System Prompt Personalizado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
