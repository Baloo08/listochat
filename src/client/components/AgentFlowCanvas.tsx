import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, ShoppingBag, Calendar, Trophy, UserCheck, HelpCircle, 
  Database, Zap, MessageSquare, Sparkles, X, Check, Sliders,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Move
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
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(1.4, prev + 0.1));
  const zoomOut = () => setZoom(prev => Math.max(0.55, prev - 0.1));
  const resetZoom = () => {
    setZoom(0.95);
    setPan({ x: 0, y: 0 });
  };
  const fitToView = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking the canvas background
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentModalAgent = selectedSubagentKey ? subagents[selectedSubagentKey as keyof typeof subagents] : null;

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: isFullscreen ? 'fixed' : 'relative', 
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 999 : 'auto',
        width: '100%', 
        height: isFullscreen ? '100vh' : 'auto',
        backgroundColor: '#0a0f1d', 
        borderRadius: isFullscreen ? '0' : '16px', 
        border: '1px solid #1e293b', 
        overflow: 'hidden', 
        color: '#f8fafc', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      
      {/* Top Canvas Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 20px', 
        borderBottom: '1px solid #1e293b', 
        backgroundColor: '#0f172a',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#38bdf8" /> Betico Flow • Canvas de Orquestación Agéntica
          </span>
          <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px', border: '1px solid #0284c740' }}>
            Multi-Agent Supervisor
          </span>
        </div>

        {/* Toolbar: Zoom & Viewport */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '8px', padding: '2px', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={zoomOut}
              title="Alejar (-)"
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            >
              <ZoomOut size={15} />
            </button>
            <span style={{ fontSize: '0.75rem', color: '#f8fafc', padding: '0 6px', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              title="Acercar (+)"
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              title="Restablecer (100%)"
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px 8px', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', borderLeft: '1px solid #334155' }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <button
            type="button"
            onClick={fitToView}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Ajustar
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            style={{
              backgroundColor: isFullscreen ? '#0284c725' : '#1e293b',
              border: `1px solid ${isFullscreen ? '#38bdf8' : '#334155'}`,
              color: isFullscreen ? '#38bdf8' : '#94a3b8',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Normal' : 'Expandir'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Graph Viewport */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ 
          flex: 1,
          padding: '40px', 
          overflow: 'hidden', 
          minHeight: isFullscreen ? 'calc(100vh - 60px)' : '620px', 
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        
        {/* Subtle Grid Pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.45,
          pointerEvents: 'none'
        }} />

        {/* Scalable & Pannable Canvas Container */}
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            width: '1280px',
            position: 'relative'
          }}
        >

          {/* SVG CONNECTOR CABLES LAYER */}
          <svg 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1280px',
              height: '620px',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <defs>
              <linearGradient id="grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="grad-sales" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-booking" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-courts" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Cable 1: WhatsApp In -> Router Inteligente */}
            <path
              d="M 190 60 C 230 60, 230 200, 100 240"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Cable 2: Router Inteligente -> Sales Subagent */}
            <path
              d="M 210 270 C 400 270, 480 60, 600 60"
              fill="none"
              stroke={activeSimulatedAgentId === 'sales' ? '#38bdf8' : (subagents.sales?.enabled ? '#38bdf860' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'sales' ? '4' : '2'}
            />

            {/* Cable 3: Router Inteligente -> Booking Subagent */}
            <path
              d="M 210 270 C 400 270, 480 175, 600 175"
              fill="none"
              stroke={activeSimulatedAgentId === 'booking' ? '#c084fc' : (subagents.booking?.enabled ? '#c084fc60' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'booking' ? '4' : '2'}
            />

            {/* Cable 4: Router Inteligente -> Courts Subagent */}
            <path
              d="M 210 270 C 400 270, 480 290, 600 290"
              fill="none"
              stroke={activeSimulatedAgentId === 'courts' ? '#facc15' : (subagents.courts?.enabled ? '#facc1560' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'courts' ? '4' : '2'}
            />

            {/* Cable 5: Router Inteligente -> Handoff Subagent */}
            <path
              d="M 210 270 C 400 270, 480 405, 600 405"
              fill="none"
              stroke={activeSimulatedAgentId === 'handoff' ? '#fb7185' : (subagents.handoff?.enabled ? '#fb718560' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'handoff' ? '4' : '2'}
            />

            {/* Cable 6: Router Inteligente -> General Subagent */}
            <path
              d="M 210 270 C 400 270, 480 520, 600 520"
              fill="none"
              stroke={activeSimulatedAgentId === 'general' ? '#94a3b8' : '#334155'}
              strokeWidth={activeSimulatedAgentId === 'general' ? '4' : '2'}
            />

            {/* Data Source to Sales: Catálogo Tienda -> Sales */}
            <path
              d="M 500 50 C 540 50, 560 60, 600 60"
              fill="none"
              stroke="#38bdf880"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Data Source to Booking: Servicios -> Booking */}
            <path
              d="M 500 135 C 540 135, 560 170, 600 170"
              fill="none"
              stroke="#c084fc80"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Data Source to Courts: Canchas -> Courts */}
            <path
              d="M 500 220 C 540 220, 560 285, 600 285"
              fill="none"
              stroke="#facc1580"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Subagents to Actions: Sales -> COMMAND_ORDER */}
            <path
              d="M 890 60 C 940 60, 970 50, 1030 50"
              fill="none"
              stroke={subagents.sales?.enabled ? '#38bdf8' : '#334155'}
              strokeWidth="2"
            />

            {/* Subagents to Actions: Booking -> COMMAND_BOOKING */}
            <path
              d="M 890 175 C 940 175, 970 145, 1030 145"
              fill="none"
              stroke={subagents.booking?.enabled ? '#c084fc' : '#334155'}
              strokeWidth="2"
            />

            {/* Subagents to Actions: Courts -> COMMAND_COURT_BOOKING */}
            <path
              d="M 890 290 C 940 290, 970 240, 1030 240"
              fill="none"
              stroke={subagents.courts?.enabled ? '#facc15' : '#334155'}
              strokeWidth="2"
            />

            {/* Subagents to Actions: Handoff -> COMMAND_HANDOFF */}
            <path
              d="M 890 405 C 940 405, 970 430, 1030 430"
              fill="none"
              stroke={subagents.handoff?.enabled ? '#fb7185' : '#334155'}
              strokeWidth="2"
            />
          </svg>

          {/* 4-COLUMN NODE GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 240px 290px 240px', gap: '50px', position: 'relative', zIndex: 1, alignItems: 'start' }}>
            
            {/* COLUMN 1: TRIGGER & ROUTER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', paddingTop: '20px' }}>
              
              {/* TRIGGER NODE */}
              <div style={{ 
                backgroundColor: '#0f172a', 
                border: '2px solid #22c55e', 
                borderRadius: '14px', 
                padding: '16px',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.25)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ backgroundColor: '#22c55e20', padding: '8px', borderRadius: '10px', color: '#22c55e' }}>
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>Trigger</div>
                    <strong style={{ fontSize: '0.95rem' }}>WhatsApp In</strong>
                  </div>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>Mensajes en tiempo real desde la cola</p>
                
                {/* Port */}
                <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #0f172a' }} />
              </div>

              {/* SUPERVISOR / ROUTER NODE */}
              <div style={{ 
                backgroundColor: '#0f172a', 
                border: activeSimulatedAgentId ? '2px solid #38bdf8' : '2px solid #6366f1', 
                borderRadius: '14px', 
                padding: '18px',
                boxShadow: activeSimulatedAgentId ? '0 0 25px rgba(56, 189, 248, 0.5)' : '0 8px 20px rgba(99, 102, 241, 0.25)',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ backgroundColor: '#6366f120', padding: '8px', borderRadius: '10px', color: '#818cf8' }}>
                    <Bot size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Supervisor</div>
                    <strong style={{ fontSize: '0.95rem' }}>Router Agéntico</strong>
                  </div>
                </div>
                <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0 }}>Enruta en &lt;5ms al subagente experto</p>
                
                {/* Port */}
                <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#818cf8', border: '2px solid #0f172a' }} />
              </div>

            </div>

            {/* COLUMN 2: DATA SOURCES (RAG) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
                📚 Fuentes RAG
              </div>

              {/* Source: Products */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#38bdf8" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Catálogo Tienda</span>
                </div>
                <span style={{ backgroundColor: '#0284c720', color: '#38bdf8', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {dataSourcesSummary?.productsCount ?? 0} ítems
                </span>
              </div>

              {/* Source: Services */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#c084fc" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Servicios & Citas</span>
                </div>
                <span style={{ backgroundColor: '#9333ea20', color: '#c084fc', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {dataSourcesSummary?.servicesCount ?? 0} serv.
                </span>
              </div>

              {/* Source: Courts */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#facc15" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Canchas & Espacios</span>
                </div>
                <span style={{ backgroundColor: '#ca8a0420', color: '#facc15', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {dataSourcesSummary?.courtsCount ?? 0} canchas
                </span>
              </div>

              {/* Source: Specialists */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#10b981" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Staff / Especialistas</span>
                </div>
                <span style={{ backgroundColor: '#05966920', color: '#34d399', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  {dataSourcesSummary?.specialistsCount ?? 0} activos
                </span>
              </div>

              {/* Source: Payments / Schedule */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} color="#fb7185" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>SINPE & Horarios</span>
                </div>
                <span style={{ backgroundColor: '#e11d4820', color: '#fb7185', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                  Conectado
                </span>
              </div>
            </div>

            {/* COLUMN 3: SUBAGENTS NODES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
                🤖 Subagentes
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', textAlign: 'center' }}>
                ⚡ Acciones (Tools)
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', opacity: subagents.sales?.enabled ? 1 : 0.35 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> COMMAND_ORDER
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Crear pedido en tienda/comanda</div>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', opacity: subagents.booking?.enabled ? 1 : 0.35 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> COMMAND_BOOKING
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Crear / Reagendar citas en agenda</div>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', opacity: subagents.courts?.enabled ? 1 : 0.35 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> COMMAND_COURT_BOOKING
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Apartar cancha deportiva</div>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', opacity: subagents.sales?.enabled ? 1 : 0.35 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> COMMAND_SEND_MEDIA
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Enviar fotos oficiales de catálogo</div>
              </div>

              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', opacity: subagents.handoff?.enabled ? 1 : 0.35 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} /> COMMAND_HANDOFF
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Pausar bot y alertar a equipo</div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* SUBAGENT CONFIGURATION MODAL / DRAWER */}
      {selectedSubagentKey && currentModalAgent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #334155', backgroundColor: '#0b1120' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: '14px 18px', borderRadius: '10px', border: '1px solid #334155' }}>
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
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '0.9rem' }}
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
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
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
                          backgroundColor: isChecked ? '#0284c725' : '#1e293b',
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
                          backgroundColor: isChecked ? '#10b98125' : '#1e293b',
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #334155', backgroundColor: '#0b1120' }}>
              <button
                type="button"
                onClick={() => setSelectedSubagentKey(null)}
                style={{
                  backgroundColor: '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  padding: '9px 22px',
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
          backgroundColor: '#0f172a',
          border: isSimActive 
            ? '2px solid #38bdf8' 
            : (isEnabled ? `1px solid ${accentColor}` : '1px solid #334155'),
          borderRadius: '14px',
          padding: '14px',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          boxShadow: isSimActive 
            ? '0 0 25px rgba(56, 189, 248, 0.45)' 
            : (isEnabled ? `0 6px 16px ${accentColor}18` : 'none'),
          opacity: isEnabled ? 1 : 0.45
        }}
      >
        {/* Left Input Port */}
        <div style={{ position: 'absolute', left: '-7px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: accentColor, border: '2px solid #0f172a' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: `${accentColor}25`, padding: '6px', borderRadius: '8px' }}>
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

        <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          {subtitle}
        </p>

        {/* Small Data Source Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(agent.sources || []).slice(0, 3).map(s => (
            <span key={s} style={{ backgroundColor: '#1e293b', color: '#94a3b8', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>
              {getSourceLabel(s)}
            </span>
          ))}
          {(agent.actions || []).slice(0, 2).map(a => (
            <span key={a} style={{ backgroundColor: '#10b98115', color: '#34d399', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10b98130' }}>
              {getActionLabel(a)}
            </span>
          ))}
        </div>

        {/* Right Output Port */}
        <div style={{ position: 'absolute', right: '-7px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: accentColor, border: '2px solid #0f172a' }} />
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
