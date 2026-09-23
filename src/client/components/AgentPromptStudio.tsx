import React, { useState, useEffect } from 'react';
import { 
  Bot, Save, Play, Sparkles, CheckCircle, GitFork, 
  CheckCircle2, MessageSquare, Zap, ShieldCheck
} from 'lucide-react';
import AgentFlowCanvas from './AgentFlowCanvas';
import { OrchestratorConfig, DataSourcesSummary } from '../../shared/types';

export default function AgentPromptStudio() {
  const cachedPrompt = typeof window !== 'undefined' ? sessionStorage.getItem('betico_cached_agent_prompt') : null;
  const initialData = cachedPrompt ? (()=>{ try { return JSON.parse(cachedPrompt); } catch(e){ return null; } })() : null;

  const defaultOrchestrator: OrchestratorConfig = {
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

  const [config, setConfig] = useState({
    aiChatbotEnabled: initialData ? (initialData.aiChatbotEnabled !== false) : true,
    systemPrompt: initialData?.systemPrompt || '',
    businessName: initialData?.businessName || '',
    currency: initialData?.currency || 'CRC',
    notifyNumber: initialData?.notifyNumber || '',
    showBookingLink: initialData ? (initialData.showBookingLink !== false) : true,
    showStoreLink: initialData ? (initialData.showStoreLink !== false) : true,
    humanHandoffEnabled: initialData ? (initialData.humanHandoffEnabled !== false) : true,
    handoffNotifyPhone: initialData?.handoffNotifyPhone || '',
    handoffKeywords: Array.isArray(initialData?.handoffKeywords) ? initialData.handoffKeywords : ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'],
    orchestratorConfig: initialData?.orchestratorConfig || defaultOrchestrator
  });

  const [dataSourcesSummary, setDataSourcesSummary] = useState<DataSourcesSummary>({
    productsCount: 0,
    servicesCount: 0,
    courtsCount: 0,
    specialistsCount: 0
  });

  const [simInput, setSimInput] = useState('');
  const [simOutput, setSimOutput] = useState('');
  const [activeSimulatedAgentId, setActiveSimulatedAgentId] = useState<string | null>(null);
  const [simMetadata, setSimMetadata] = useState<{ agentName?: string; sources?: string[]; command?: string } | null>(null);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          const newConf = {
            aiChatbotEnabled: data.aiChatbotEnabled !== false,
            systemPrompt: data.systemPrompt || '',
            businessName: data.businessName || '',
            currency: data.currency || 'CRC',
            notifyNumber: data.notifyNumber || '',
            showBookingLink: data.showBookingLink !== false,
            showStoreLink: data.showStoreLink !== false,
            humanHandoffEnabled: data.humanHandoffEnabled !== false,
            handoffNotifyPhone: data.handoffNotifyPhone || '',
            handoffKeywords: Array.isArray(data.handoffKeywords) ? data.handoffKeywords : ['humano', 'asesor', 'persona', 'agente', 'hablar con alguien', 'queja', 'reclamo', 'urgente'],
            orchestratorConfig: data.orchestratorConfig || defaultOrchestrator
          };
          setConfig(newConf);
          if (data.dataSourcesSummary) {
            setDataSourcesSummary(data.dataSourcesSummary);
          }
          try { sessionStorage.setItem('betico_cached_agent_prompt', JSON.stringify(newConf)); } catch(e) {}
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prompt:', error);
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
        alert('Error al guardar la orquesta del agente.');
      }
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async (customText?: string) => {
    const textToSimulate = (customText || simInput).trim();
    if (!textToSimulate) return;
    
    setSimOutput('Analizando intención con el Router y ejecutando subagente...');
    setActiveSimulatedAgentId(null);
    setSimMetadata(null);

    try {
      const res = await fetch('/api/agent/simulate', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: textToSimulate })
      });
      if (res.ok) {
        const data = await res.json();
        setSimOutput(data.replyText || data.reply || data.text || 'Sin respuesta.');
        if (data.routedAgentId) {
          setActiveSimulatedAgentId(data.routedAgentId);
          let cmd = '';
          if (data.isOrderDetected) cmd = 'COMMAND_ORDER';
          else if (data.isBookingDetected) cmd = 'COMMAND_BOOKING';
          else if (data.isCourtBookingDetected) cmd = 'COMMAND_COURT_BOOKING';
          else if (data.isHandoffRequested) cmd = 'COMMAND_HANDOFF';
          else if (data.isMediaDetected) cmd = 'COMMAND_SEND_MEDIA';

          setSimMetadata({
            agentName: data.routedAgentName,
            sources: data.sourcesUsed,
            command: cmd || undefined
          });
        }
      } else {
        setSimOutput('Error en la simulación.');
      }
    } catch (error) {
      setSimOutput('Error en la simulación.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Cargando Orquestador Agéntico...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <GitFork size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 'bold', margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Orquestador Multi-Agente IA
            </h1>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Flujo agéntico visual: cada subagente es especialista en su área con sus propias fuentes y permisos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quick Active Switch */}
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', padding: '8px 14px', backgroundColor: config.aiChatbotEnabled !== false ? '#f0fdf4' : '#f8fafc', borderRadius: '10px', border: `1px solid ${config.aiChatbotEnabled !== false ? '#bbf7d0' : '#cbd5e1'}` }}>
            <input
              type="checkbox"
              checked={config.aiChatbotEnabled !== false}
              onChange={(e) => setConfig({ ...config, aiChatbotEnabled: e.target.checked })}
              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: config.aiChatbotEnabled !== false ? '#166534' : '#64748b' }}>
              {config.aiChatbotEnabled !== false ? '🟢 Bot Activo' : '⚪ Solo Notificaciones'}
            </span>
          </label>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 22px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Orquesta'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ padding: '12px 18px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '0.9rem' }}>
          <CheckCircle size={18} /> ¡Configuración agéntica guardada y sincronizada exitosamente con la orquesta!
        </div>
      )}

      {/* INTERACTIVE AGENT FLOW CANVAS (N8N STYLE WITH ZOOM & CONNECTORS) */}
      <AgentFlowCanvas
        orchestratorConfig={config.orchestratorConfig || defaultOrchestrator}
        onChange={(newOrch) => setConfig({ ...config, orchestratorConfig: newOrch })}
        dataSourcesSummary={dataSourcesSummary}
        activeSimulatedAgentId={activeSimulatedAgentId}
      />

      {/* LIVE ORCHESTRATOR SIMULATOR WITH VISUAL TRACE */}
      <div style={{ backgroundColor: 'var(--surface)', padding: '22px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={17} color="var(--primary)" /> Simulador de Conversación Agéntica en Vivo
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Prueba un mensaje para ver qué subagente toma el control y cómo se ilumina la orquesta
            </span>
          </div>

          {simMetadata?.agentName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', backgroundColor: '#38bdf815', color: '#0284c7', border: '1px solid #38bdf840', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> Atendido por: {simMetadata.agentName}
              </span>
              {simMetadata.command && (
                <span style={{ fontSize: '0.8rem', backgroundColor: '#10b98115', color: '#059669', border: '1px solid #10b98140', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> Acción: {simMetadata.command}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Probar con:</span>
          {[
            '¿Qué precio tiene el producto y cómo puedo pedir?',
            'Quiero agendar una cita para mañana',
            '¿Tienen cancha libre para un partido el viernes?',
            'Necesito hablar con una persona urgente'
          ].map(sample => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setSimInput(sample);
                handleSimulate(sample);
              }}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              "{sample}"
            </button>
          ))}
        </div>

        {/* Input box */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSimulate()}
            placeholder="Escribe un mensaje de prueba como si fueras un cliente en WhatsApp..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
          />
          <button
            type="button"
            onClick={() => handleSimulate()}
            style={{ padding: '0 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Play size={16} /> Probar
          </button>
        </div>

        {/* Output Box */}
        {simOutput && (
          <div style={{ backgroundColor: '#0a0f1d', color: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.5', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              <MessageSquare size={16} color="#38bdf8" />
              <strong style={{ fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase' }}>Respuesta de WhatsApp</strong>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{simOutput}</div>
          </div>
        )}

      </div>

    </div>
  );
}
