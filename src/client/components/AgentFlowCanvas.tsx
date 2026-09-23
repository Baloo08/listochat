import React, { useState } from 'react';
import { 
  Bot, ShoppingBag, Calendar, Trophy, UserCheck, HelpCircle, 
  Database, Zap, MessageSquare, Sparkles, X, Check, Sliders
} from 'lucide-react';
import { OrchestratorConfig, SubagentConfig, DataSourcesSummary } from '../../shared/types';

interface AgentFlowCanvasProps {
  orchestratorConfig: OrchestratorConfig;
  onChange: (config: OrchestratorConfig) => void;
  dataSourcesSummary?: DataSourcesSummary;
  activeSimulatedAgentId?: string | null;
  onSelectSubagent?: (subagentId: string) => void;
}

export default function AgentFlowCanvas({
  orchestratorConfig,
  onChange,
  dataSourcesSummary,
  activeSimulatedAgentId
}: AgentFlowCanvasProps) {
  const [selectedSubagentKey, setSelectedSubagentKey] = useState<string | null>(null);

  const subagents = orchestratorConfig?.subagents || {
    sales: { id: 'sales', name: 'Ventas & Menú', enabled: true, prompt: '', sources: ['products', 'payments'], actions: ['order', 'media'] },
    booking: { id: 'booking', name: 'Citas & Agenda', enabled: true, prompt: '', sources: ['services', 'specialists', 'busySlots'], actions: ['booking', 'reschedule', 'cancel'] },
    courts: { id: 'courts', name: 'Canchas Deportivas', enabled: true, prompt: '', sources: ['courts', 'schedules'], actions: ['courtBooking', 'courtReschedule'] },
    handoff: { id: 'handoff', name: 'Escalado Humano', enabled: true, prompt: '', sources: ['keywords'], actions: ['handoff'] },
    general: { id: 'general', name: 'Identidad & FAQ', enabled: true, prompt: '', sources: ['businessInfo', 'schedules'], actions: [] }
  };

  const handleToggleSubagent = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = {
      ...orchestratorConfig,
      subagents: {
        ...subagents,
        [key]: {
          ...subagents[key as keyof typeof subagents],
          enabled: !subagents[key as keyof typeof subagents]?.enabled
        }
      }
    };
    onChange(updated);
  };

  const handleUpdateCurrentSubagent = (updatedAgent: SubagentConfig) => {
    if (!selectedSubagentKey) return;
    const updated = {
      ...orchestratorConfig,
      subagents: {
        ...subagents,
        [selectedSubagentKey]: updatedAgent
      }
    };
    onChange(updated);
  };

  const currentModalAgent = selectedSubagentKey ? subagents[selectedSubagentKey as keyof typeof subagents] : null;

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      
      {/* Top Canvas Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0b1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" /> Betico Flow • Orquestador Agéntico Multi-Agente
          </span>
          <span style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px' }}>
            Supervisor-Worker Pattern
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} /> RAG Fuentes Activas
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Subagente Activo
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }} /> Inactivo
          </span>
        </div>
      </div>

      {/* Main Graph Layout */}
      <div style={{ padding: '28px 24px', overflowX: 'auto', minHeight: '520px', position: 'relative' }}>
        
        {/* Decorative Grid Background */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.6,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '220px 220px 300px 220px', gap: '36px', position: 'relative', zIndex: 1, alignItems: 'center', minWidth: '1050px' }}>
          
          {/* COLUMN 1: TRIGGER & ROUTER */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* TRIGGER NODE */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              border: '2px solid #22c55e', 
              borderRadius: '12px', 
              padding: '16px',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.25)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ backgroundColor: '#22c55e20', padding: '8px', borderRadius: '8px', color: '#22c55e' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>Trigger</div>
                  <strong style={{ fontSize: '0.95rem' }}>WhatsApp In</strong>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Mensaje entrante del cliente analizado en tiempo real</p>
              
              {/* Output connector */}
              <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#22c55e', border: '3px solid #0f172a' }} />
            </div>

            {/* SUPERVISOR / ROUTER NODE */}
            <div style={{ 
              backgroundColor: '#1e293b', 
              border: activeSimulatedAgentId ? '2px solid #38bdf8' : '2px solid #6366f1', 
              borderRadius: '12px', 
              padding: '16px',
              boxShadow: activeSimulatedAgentId ? '0 0 20px rgba(56, 189, 248, 0.5)' : '0 4px 14px rgba(99, 102, 241, 0.25)',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ backgroundColor: '#6366f120', padding: '8px', borderRadius: '8px', color: '#818cf8' }}>
                  <Bot size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Supervisor</div>
                  <strong style={{ fontSize: '0.95rem' }}>Router Inteligente</strong>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>Clasifica intención (&lt;5ms) y delega al subagente experto</p>
              
              {/* Output connector */}
              <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#818cf8', border: '3px solid #0f172a' }} />
            </div>

          </div>

          {/* COLUMN 2: DATA SOURCES (RAG) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
              📚 Fuentes de Datos (RAG)
            </div>

            {/* Source: Products */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="#38bdf8" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Catálogo Tienda</span>
              </div>
              <span style={{ backgroundColor: '#0284c720', color: '#38bdf8', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', fontWeight: 'bold' }}>
                {dataSourcesSummary?.productsCount ?? 0} ítems
              </span>
            </div>

            {/* Source: Services */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="#a855f7" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Servicios & Citas</span>
              </div>
              <span style={{ backgroundColor: '#9333ea20', color: '#c084fc', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', fontWeight: 'bold' }}>
                {dataSourcesSummary?.servicesCount ?? 0} serv.
              </span>
            </div>

            {/* Source: Courts */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="#eab308" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Canchas & Espacios</span>
              </div>
              <span style={{ backgroundColor: '#ca8a0420', color: '#facc15', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', fontWeight: 'bold' }}>
                {dataSourcesSummary?.courtsCount ?? 0} canchas
              </span>
            </div>

            {/* Source: Specialists */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="#10b981" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Especialistas / Staff</span>
              </div>
              <span style={{ backgroundColor: '#05966920', color: '#34d399', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', fontWeight: 'bold' }}>
                {dataSourcesSummary?.specialistsCount ?? 0} activos
              </span>
            </div>

            {/* Source: Payments / Schedule */}
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} color="#f43f5e" />
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>SINPE & Horarios</span>
              </div>
              <span style={{ backgroundColor: '#e11d4820', color: '#fb7185', fontSize: '0.72rem', padding: '2px 7px', borderRadius: '12px', fontWeight: 'bold' }}>
                Conectado
              </span>
            </div>
          </div>

          {/* COLUMN 3: SUBAGENTS NODES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
              🤖 Subagentes Especializados
            </div>

            {/* 1. SALES AGENT */}
            {renderSubagentCard(
              'sales',
              subagents.sales,
              <ShoppingBag size={18} color="#38bdf8" />,
              '#0284c7',
              activeSimulatedAgentId === 'sales',
              'Lee catálogo, opciones/sabores, arma carritos y crea pedidos'
            )}

            {/* 2. BOOKING AGENT */}
            {renderSubagentCard(
              'booking',
              subagents.booking,
              <Calendar size={18} color="#c084fc" />,
              '#9333ea',
              activeSimulatedAgentId === 'booking',
              'Verifica slots ocupados en tiempo real y agenda/reagenda citas'
            )}

            {/* 3. COURTS AGENT */}
            {renderSubagentCard(
              'courts',
              subagents.courts,
              <Trophy size={18} color="#facc15" />,
              '#ca8a04',
              activeSimulatedAgentId === 'courts',
              'Aparta canchas, busca partidos y valida códigos CRT-XXXXXX'
            )}

            {/* 4. HANDOFF AGENT */}
            {renderSubagentCard(
              'handoff',
              subagents.handoff,
              <UserCheck size={18} color="#fb7185" />,
              '#e11d48',
              activeSimulatedAgentId === 'handoff',
              'Detecta reclamos o pedidos de asesor y pausa el bot'
            )}

            {/* 5. GENERAL AGENT */}
            {renderSubagentCard(
              'general',
              subagents.general,
              <HelpCircle size={18} color="#94a3b8" />,
              '#475569',
              activeSimulatedAgentId === 'general',
              'Bienvenida cordial, horarios, pagos y preguntas generales'
            )}
          </div>

          {/* COLUMN 4: EXECUTABLE ACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
              ⚡ Acciones Automatizadas
            </div>

            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', opacity: subagents.sales?.enabled ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> COMMAND_ORDER
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Crear pedido en tienda/comanda</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', opacity: subagents.booking?.enabled ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> COMMAND_BOOKING
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Crear / Reagendar citas en agenda</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', opacity: subagents.courts?.enabled ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> COMMAND_COURT_BOOKING
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apartar cancha deportiva</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', opacity: subagents.sales?.enabled ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> COMMAND_SEND_MEDIA
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Enviar fotos oficiales de catálogo</div>
            </div>

            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '12px', opacity: subagents.handoff?.enabled ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={14} /> COMMAND_HANDOFF
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pausar bot y alertar a equipo</div>
            </div>

          </div>

        </div>

      </div>

      {/* SUBAGENT CONFIGURATION MODAL / DRAWER */}
      {selectedSubagentKey && currentModalAgent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#0284c720', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}>
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Configurar {currentModalAgent.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Subagente especializado de Betico Flow</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedSubagentKey(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Active Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', display: 'block' }}>Estado del Subagente</strong>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {currentModalAgent.enabled ? '🟢 Activo en la orquesta y recibiendo consultas' : '⚪ Deshabilitado (el router no le enviará tráfico)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateCurrentSubagent({ ...currentModalAgent, enabled: !currentModalAgent.enabled })}
                  style={{
                    backgroundColor: currentModalAgent.enabled ? '#10b981' : '#475569',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {currentModalAgent.enabled ? 'Habilitado' : 'Deshabilitado'}
                </button>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Nombre Público del Subagente</label>
                <input 
                  type="text"
                  value={currentModalAgent.name}
                  onChange={e => handleUpdateCurrentSubagent({ ...currentModalAgent, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '0.9rem' }}
                />
              </div>

              {/* Prompt */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>System Prompt Especializado</label>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Instrucciones específicas de este rol</span>
                </div>
                <textarea 
                  rows={6}
                  value={currentModalAgent.prompt}
                  onChange={e => handleUpdateCurrentSubagent({ ...currentModalAgent, prompt: e.target.value })}
                  placeholder="Instrucciones para este subagente..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
                />
              </div>

              {/* Data Sources Connected */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Fuentes de Datos RAG Conectadas
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['products', 'services', 'courts', 'specialists', 'busySlots', 'payments', 'schedule'].map(src => {
                    const isChecked = (currentModalAgent.sources || []).includes(src);
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => {
                          const current = currentModalAgent.sources || [];
                          const updated = isChecked ? current.filter(s => s !== src) : [...current, src];
                          handleUpdateCurrentSubagent({ ...currentModalAgent, sources: updated });
                        }}
                        style={{
                          backgroundColor: isChecked ? '#0284c725' : '#0f172a',
                          border: `1px solid ${isChecked ? '#38bdf8' : '#334155'}`,
                          color: isChecked ? '#38bdf8' : '#94a3b8',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isChecked && <Check size={14} />} {getSourceLabel(src)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allowed Actions */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Acciones Automatizadas Permitidas (Tools)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['order', 'booking', 'courtBooking', 'courtReschedule', 'reschedule', 'cancel', 'media', 'handoff'].map(act => {
                    const isChecked = (currentModalAgent.actions || []).includes(act);
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => {
                          const current = currentModalAgent.actions || [];
                          const updated = isChecked ? current.filter(a => a !== act) : [...current, act];
                          handleUpdateCurrentSubagent({ ...currentModalAgent, actions: updated });
                        }}
                        style={{
                          backgroundColor: isChecked ? '#10b98125' : '#0f172a',
                          border: `1px solid ${isChecked ? '#10b981' : '#334155'}`,
                          color: isChecked ? '#34d399' : '#94a3b8',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {isChecked && <Check size={14} />} {getActionLabel(act)}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #334155', backgroundColor: '#0f172a' }}>
              <button
                type="button"
                onClick={() => setSelectedSubagentKey(null)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Listo y Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );

  function renderSubagentCard(
    key: string,
    agent: SubagentConfig | undefined,
    icon: React.ReactNode,
    accentColor: string,
    isSimActive: boolean,
    subtitle: string
  ) {
    if (!agent) return null;
    const isEnabled = agent.enabled !== false;

    return (
      <div 
        onClick={() => setSelectedSubagentKey(key)}
        style={{
          backgroundColor: '#1e293b',
          border: isSimActive 
            ? '2px solid #38bdf8' 
            : (isEnabled ? `1px solid ${accentColor}` : '1px solid #334155'),
          borderRadius: '12px',
          padding: '14px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          boxShadow: isSimActive 
            ? '0 0 20px rgba(56, 189, 248, 0.4)' 
            : (isEnabled ? `0 4px 12px ${accentColor}15` : 'none'),
          opacity: isEnabled ? 1 : 0.5
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: `${accentColor}20`, padding: '6px', borderRadius: '8px' }}>
              {icon}
            </div>
            <strong style={{ fontSize: '0.9rem', color: isEnabled ? '#f8fafc' : '#94a3b8' }}>
              {agent.name}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={(e) => handleToggleSubagent(key, e)}
              style={{
                backgroundColor: isEnabled ? '#10b981' : '#475569',
                color: '#fff',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
            <Sliders size={14} color="#94a3b8" />
          </div>
        </div>

        <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {subtitle}
        </p>

        {/* Small Data Source Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(agent.sources || []).slice(0, 3).map(s => (
            <span key={s} style={{ backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
              {getSourceLabel(s)}
            </span>
          ))}
          {(agent.actions || []).slice(0, 2).map(a => (
            <span key={a} style={{ backgroundColor: '#10b98115', color: '#34d399', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10b98130' }}>
              {getActionLabel(a)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  function getSourceLabel(src: string): string {
    const map: Record<string, string> = {
      products: 'Catálogo',
      services: 'Servicios',
      courts: 'Canchas',
      specialists: 'Especialistas',
      busySlots: 'Slots Ocupados',
      payments: 'SINPE & Pagos',
      schedule: 'Horarios',
      delivery: 'Delivery',
      keywords: 'Palabras Clave',
      businessInfo: 'Datos Negocio',
      customerRecord: 'Expediente'
    };
    return map[src] || src;
  }

  function getActionLabel(act: string): string {
    const map: Record<string, string> = {
      order: 'Crear Pedido',
      booking: 'Agendar Cita',
      reschedule: 'Reagendar Cita',
      cancel: 'Cancelar Cita',
      courtBooking: 'Reservar Cancha',
      courtReschedule: 'Reagendar Cancha',
      media: 'Enviar Fotos',
      handoff: 'Escalar a Humano'
    };
    return map[act] || act;
  }
}
