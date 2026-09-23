import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, ShoppingBag, Calendar, Trophy, UserCheck, HelpCircle, 
  Database, Zap, MessageSquare, Sparkles, X, Check, Sliders,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Move,
  ArrowDown, Network, Globe, Plus, Trash2
} from 'lucide-react';
import { OrchestratorConfig, SubagentConfig, DataSourcesSummary, NodePosition } from '../../shared/types';

interface AgentFlowCanvasProps {
  orchestratorConfig: OrchestratorConfig;
  onChange: (config: OrchestratorConfig) => void;
  dataSourcesSummary?: DataSourcesSummary;
  activeSimulatedAgentId?: string | null;
  onSelectSubagent?: (subagentId: string) => void;
  storeModules?: {
    storeEnabled?: boolean;
    bookingsEnabled?: boolean;
    courtsEnabled?: boolean;
  };
}

// Default Hierarchical Top-to-Bottom Node Layout
const DEFAULT_NODE_POSITIONS: Record<string, NodePosition> = {
  whatsapp: { x: 670, y: 30 },
  orchestrator: { x: 640, y: 165 },
  sales: { x: 30, y: 350 },
  booking: { x: 350, y: 350 },
  courts: { x: 670, y: 350 },
  handoff: { x: 990, y: 350 },
  general: { x: 1310, y: 350 }
};

const NODE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  whatsapp: { w: 260, h: 80 },
  orchestrator: { w: 320, h: 115 },
  sales: { w: 290, h: 370 },
  booking: { w: 290, h: 370 },
  courts: { w: 290, h: 370 },
  handoff: { w: 290, h: 370 },
  general: { w: 290, h: 370 }
};

export default function AgentFlowCanvas({
  orchestratorConfig,
  onChange,
  dataSourcesSummary,
  activeSimulatedAgentId,
  storeModules
}: AgentFlowCanvasProps) {
  const isSalesVisible = storeModules ? storeModules.storeEnabled !== false : true;
  const isBookingVisible = storeModules ? storeModules.bookingsEnabled !== false : true;
  const isCourtsVisible = storeModules ? storeModules.courtsEnabled === true : true;

  const [selectedSubagentKey, setSelectedSubagentKey] = useState<string | null>(null);
  const [isOrchestratorModalOpen, setIsOrchestratorModalOpen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Draggable Node State
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(() => {
    return {
      ...DEFAULT_NODE_POSITIONS,
      ...(orchestratorConfig?.nodePositions || {})
    };
  });

  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external nodePositions changes if any
  useEffect(() => {
    if (orchestratorConfig?.nodePositions) {
      setNodePositions(prev => ({
        ...prev,
        ...orchestratorConfig.nodePositions
      }));
    }
  }, [orchestratorConfig?.nodePositions]);

  const subagents = orchestratorConfig?.subagents || {
    sales: { id: 'sales', name: 'Ventas & Menú', enabled: true, prompt: '', sources: ['products', 'payments', 'delivery'], actions: ['order', 'media'] },
    booking: { id: 'booking', name: 'Citas & Agenda', enabled: true, prompt: '', sources: ['services', 'specialists', 'busySlots', 'customerRecord'], actions: ['booking', 'reschedule', 'cancel'] },
    courts: { id: 'courts', name: 'Canchas Deportivas', enabled: true, prompt: '', sources: ['courts', 'schedules'], actions: ['courtBooking', 'courtReschedule'] },
    handoff: { id: 'handoff', name: 'Escalado Humano', enabled: true, prompt: '', sources: ['keywords'], actions: ['handoff'] },
    general: { id: 'general', name: 'Identidad & FAQ', enabled: true, prompt: '', sources: ['businessInfo', 'schedules', 'payments'], actions: [] }
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

  const handleUpdateSupervisorPrompt = (newPrompt: string) => {
    const updated: OrchestratorConfig = {
      ...orchestratorConfig,
      prompt: newPrompt
    };
    onChange(updated);
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(1.4, Math.round((prev + 0.1) * 100) / 100));
  const zoomOut = () => setZoom(prev => Math.max(0.5, Math.round((prev - 0.1) * 100) / 100));
  const resetZoom = () => {
    setZoom(0.85);
    setPan({ x: 0, y: 0 });
  };
  const fitToView = () => {
    setZoom(0.75);
    setPan({ x: 40, y: 10 });
  };

  // Auto-Layout: Reset all node positions to hierarchical default, adapting dynamically to visible subagents
  const handleResetHierarchicalLayout = () => {
    const visibleSubagents = [
      isSalesVisible ? 'sales' : null,
      isBookingVisible ? 'booking' : null,
      isCourtsVisible ? 'courts' : null,
      'handoff',
      'general'
    ].filter(Boolean) as string[];

    const subagentSpacing = 320;
    const totalW = visibleSubagents.length * 290 + (visibleSubagents.length - 1) * 30;
    const centerX = 800;
    const startX = Math.max(30, centerX - totalW / 2);

    const dynamicPositions: Record<string, NodePosition> = {
      whatsapp: { x: centerX - 130, y: 30 },
      orchestrator: { x: centerX - 160, y: 165 }
    };

    visibleSubagents.forEach((key, idx) => {
      dynamicPositions[key] = { x: startX + idx * subagentSpacing, y: 350 };
    });

    setNodePositions(dynamicPositions);
    onChange({
      ...orchestratorConfig,
      nodePositions: dynamicPositions
    });
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return;
    }
    e.stopPropagation();

    const currentPos = nodePositions[id] || DEFAULT_NODE_POSITIONS[id] || { x: 100, y: 100 };
    setDraggingNode({
      id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: currentPos.x,
      startNodeY: currentPos.y
    });
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Global Mouse Move & Up for Smooth Dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startMouseX) / zoom;
      const dy = (e.clientY - draggingNode.startMouseY) / zoom;
      const newX = Math.round(draggingNode.startNodeX + dx);
      const newY = Math.round(draggingNode.startNodeY + dy);

      setNodePositions(prev => ({
        ...prev,
        [draggingNode.id]: { x: newX, y: newY }
      }));
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) {
      onChange({
        ...orchestratorConfig,
        nodePositions: {
          ...nodePositions
        }
      });
      setDraggingNode(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Helper to calculate top-to-bottom Bézier SVG path
  const getTopToBottomCurve = (sourceId: string, targetId: string) => {
    const srcPos = nodePositions[sourceId] || DEFAULT_NODE_POSITIONS[sourceId];
    const srcDim = NODE_DIMENSIONS[sourceId] || { w: 280, h: 100 };
    const tgtPos = nodePositions[targetId] || DEFAULT_NODE_POSITIONS[targetId];
    const tgtDim = NODE_DIMENSIONS[targetId] || { w: 280, h: 100 };

    if (!srcPos || !tgtPos) return '';

    // Source bottom center
    const x1 = srcPos.x + srcDim.w / 2;
    const y1 = srcPos.y + srcDim.h;

    // Target top center
    const x2 = tgtPos.x + tgtDim.w / 2;
    const y2 = tgtPos.y;

    const deltaY = Math.max(35, Math.abs(y2 - y1) * 0.45);
    return `M ${x1} ${y1} C ${x1} ${y1 + deltaY}, ${x2} ${y2 - deltaY}, ${x2} ${y2}`;
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
        zIndex: isFullscreen ? 9999 : 'auto',
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
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Network size={18} color="#38bdf8" /> Betico Flow • Jerarquía Agéntica Visual
          </span>
          <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '20px', border: '1px solid #0284c740', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDown size={12} /> Top-to-Bottom & Nodos Arrastrables
          </span>
        </div>

        {/* Toolbar: Auto-Layout, Zoom & Viewport */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleResetHierarchicalLayout}
            title="Reordenar en árbol jerárquico perfecto (De arriba a abajo)"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={13} />
            <span>Auto-Alinear Jerarquía</span>
          </button>

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
              title="Restablecer (85%)"
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
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          flex: 1,
          padding: '20px', 
          overflow: 'hidden', 
          minHeight: isFullscreen ? 'calc(100vh - 60px)' : '750px', 
          position: 'relative',
          cursor: isPanning ? 'grabbing' : (draggingNode ? 'move' : 'grab'),
          userSelect: 'none'
        }}
      >
        
        {/* Subtle Grid Pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(#334155 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
          opacity: 0.45,
          pointerEvents: 'none'
        }} />

        {/* Floating UX Hint */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          backgroundColor: '#0f172aee',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '0.72rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 5,
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)'
        }}>
          <Move size={13} color="#38bdf8" />
          <span>Haz clic y arrastra cualquier nodo para posicionarlo libremente. Haz clic en "Configurar" en cualquier nodo para ajustar sus directrices.</span>
        </div>

        {/* Scalable & Pannable Canvas Container */}
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: (isPanning || draggingNode) ? 'none' : 'transform 0.15s ease-out',
            width: '1650px',
            height: '840px',
            position: 'relative'
          }}
        >

          {/* DYNAMIC SVG CONNECTOR CABLES LAYER */}
          <svg 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1650px',
              height: '840px',
              pointerEvents: 'none',
              zIndex: 0
            }}
          >
            <defs>
              <linearGradient id="grad-active" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <linearGradient id="grad-wa-orch" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="grad-sales" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="grad-booking" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="grad-courts" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
              <linearGradient id="grad-handoff" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
              <linearGradient id="grad-general" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>

            {/* Level 1 -> Level 2: WhatsApp In -> Supervisor Orquestador */}
            <path
              d={getTopToBottomCurve('whatsapp', 'orchestrator')}
              fill="none"
              stroke="url(#grad-wa-orch)"
              strokeWidth="3"
              strokeDasharray={activeSimulatedAgentId ? "4 4" : "none"}
            />

            {/* Level 2 -> Level 3: Orquestador -> Sales Subagent */}
            {isSalesVisible && (
              <path
                d={getTopToBottomCurve('orchestrator', 'sales')}
                fill="none"
                stroke={activeSimulatedAgentId === 'sales' ? '#38bdf8' : (subagents.sales?.enabled ? 'url(#grad-sales)' : '#334155')}
                strokeWidth={activeSimulatedAgentId === 'sales' ? '4' : '2.5'}
                strokeDasharray={subagents.sales?.enabled ? (activeSimulatedAgentId === 'sales' ? "6 3" : "none") : "4 4"}
              />
            )}

            {/* Level 2 -> Level 3: Orquestador -> Booking Subagent */}
            {isBookingVisible && (
              <path
                d={getTopToBottomCurve('orchestrator', 'booking')}
                fill="none"
                stroke={activeSimulatedAgentId === 'booking' ? '#c084fc' : (subagents.booking?.enabled ? 'url(#grad-booking)' : '#334155')}
                strokeWidth={activeSimulatedAgentId === 'booking' ? '4' : '2.5'}
                strokeDasharray={subagents.booking?.enabled ? (activeSimulatedAgentId === 'booking' ? "6 3" : "none") : "4 4"}
              />
            )}

            {/* Level 2 -> Level 3: Orquestador -> Courts Subagent */}
            {isCourtsVisible && (
              <path
                d={getTopToBottomCurve('orchestrator', 'courts')}
                fill="none"
                stroke={activeSimulatedAgentId === 'courts' ? '#facc15' : (subagents.courts?.enabled ? 'url(#grad-courts)' : '#334155')}
                strokeWidth={activeSimulatedAgentId === 'courts' ? '4' : '2.5'}
                strokeDasharray={subagents.courts?.enabled ? (activeSimulatedAgentId === 'courts' ? "6 3" : "none") : "4 4"}
              />
            )}

            {/* Level 2 -> Level 3: Orquestador -> Handoff Subagent */}
            <path
              d={getTopToBottomCurve('orchestrator', 'handoff')}
              fill="none"
              stroke={activeSimulatedAgentId === 'handoff' ? '#fb7185' : (subagents.handoff?.enabled ? 'url(#grad-handoff)' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'handoff' ? '4' : '2.5'}
              strokeDasharray={subagents.handoff?.enabled ? (activeSimulatedAgentId === 'handoff' ? "6 3" : "none") : "4 4"}
            />

            {/* Level 2 -> Level 3: Orquestador -> General Subagent */}
            <path
              d={getTopToBottomCurve('orchestrator', 'general')}
              fill="none"
              stroke={activeSimulatedAgentId === 'general' ? '#94a3b8' : (subagents.general?.enabled ? 'url(#grad-general)' : '#334155')}
              strokeWidth={activeSimulatedAgentId === 'general' ? '4' : '2.5'}
              strokeDasharray={subagents.general?.enabled ? (activeSimulatedAgentId === 'general' ? "6 3" : "none") : "4 4"}
            />
          </svg>

          {/* ============================================================== */}
          {/* LEVEL 1: NODO WHATSAPP (ENTRADA / TRIGGER) */}
          {/* ============================================================== */}
          <div 
            onMouseDown={(e) => handleNodeMouseDown('whatsapp', e)}
            style={{
              position: 'absolute',
              left: `${nodePositions.whatsapp?.x ?? DEFAULT_NODE_POSITIONS.whatsapp.x}px`,
              top: `${nodePositions.whatsapp?.y ?? DEFAULT_NODE_POSITIONS.whatsapp.y}px`,
              width: `${NODE_DIMENSIONS.whatsapp.w}px`,
              backgroundColor: '#0f172a',
              border: '2px solid #22c55e',
              borderRadius: '14px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px rgba(34, 197, 94, 0.25)',
              cursor: 'move',
              zIndex: draggingNode?.id === 'whatsapp' ? 100 : 2
            }}
          >
            {/* Grip handle bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#22c55e20', padding: '6px', borderRadius: '8px', color: '#22c55e' }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#86efac', textTransform: 'uppercase', fontWeight: 'bold' }}>Canal de Entrada</div>
                  <strong style={{ fontSize: '0.92rem' }}>WhatsApp In</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#22c55e15', padding: '2px 8px', borderRadius: '12px', border: '1px solid #22c55e40' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                <span style={{ fontSize: '0.68rem', color: '#86efac', fontWeight: 'bold' }}>Trigger</span>
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>Mensajes en tiempo real desde la cola</p>

            {/* Bottom Output Port */}
            <div style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              border: '2px solid #0f172a',
              boxShadow: '0 0 8px #22c55e'
            }} />
          </div>

          {/* ============================================================== */}
          {/* LEVEL 2: NODO AGENTE ORQUESTADOR (SUPERVISOR / ROUTER) */}
          {/* ============================================================== */}
          <div 
            onMouseDown={(e) => handleNodeMouseDown('orchestrator', e)}
            style={{
              position: 'absolute',
              left: `${nodePositions.orchestrator?.x ?? DEFAULT_NODE_POSITIONS.orchestrator.x}px`,
              top: `${nodePositions.orchestrator?.y ?? DEFAULT_NODE_POSITIONS.orchestrator.y}px`,
              width: `${NODE_DIMENSIONS.orchestrator.w}px`,
              backgroundColor: '#0f172a',
              border: activeSimulatedAgentId ? '2px solid #38bdf8' : '2px solid #6366f1',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: activeSimulatedAgentId ? '0 0 30px rgba(56, 189, 248, 0.45)' : '0 10px 25px rgba(99, 102, 241, 0.3)',
              cursor: 'move',
              zIndex: draggingNode?.id === 'orchestrator' ? 100 : 2,
              transition: draggingNode ? 'none' : 'box-shadow 0.3s ease, border-color 0.3s ease'
            }}
          >
            {/* Top Input Port */}
            <div style={{
              position: 'absolute',
              top: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              border: '2px solid #0f172a',
              boxShadow: '0 0 8px #6366f1'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#6366f125', padding: '8px', borderRadius: '10px', color: '#818cf8' }}>
                  <Bot size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 'bold' }}>Supervisor de Flujo</div>
                  <strong style={{ fontSize: '0.95rem' }}>Agente Orquestador</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOrchestratorModalOpen(true);
                  }}
                  title="Configurar directrices del supervisor y prioridades de enrutamiento"
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#38bdf8',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold'
                  }}
                >
                  <Sliders size={12} />
                  <span>Configurar</span>
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '0 0 8px 0', lineHeight: '1.3' }}>
              Supervisa la intención del cliente, prioriza jerarquías comerciales y delega en &lt;5ms al subagente experto.
            </p>

            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsOrchestratorModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
                color: '#64748b',
                borderTop: '1px solid #1e293b',
                paddingTop: '6px',
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="#38bdf8" /> 5 Subagentes vinculados
              </span>
              <span style={{ color: '#818cf8', fontWeight: '600' }}>
                Directrices Supervisor &gt;
              </span>
            </div>

            {/* Bottom Output Port */}
            <div style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#818cf8',
              border: '2px solid #0f172a',
              boxShadow: '0 0 8px #818cf8'
            }} />
          </div>

          {/* ============================================================== */}
          {/* LEVEL 3: CADA AGENTE CON SUS FUENTES Y ACCIONES ASIGNADAS */}
          {/* ============================================================== */}

          {/* 1. AGENTE VENTAS & MENÚ */}
          {isSalesVisible && renderSubagentHierarchicalNode(
            'sales',
            subagents.sales,
            <ShoppingBag size={18} color="#38bdf8" />,
            '#0284c7',
            '#38bdf8',
            activeSimulatedAgentId === 'sales',
            'Venta consultiva, sugerencias cruzadas (*up-selling*) y comanda.',
            [
              { icon: <Database size={12} color="#38bdf8" />, label: 'Catálogo Tienda', detail: `${dataSourcesSummary?.productsCount ?? 0} ítems` },
              { icon: <Database size={12} color="#38bdf8" />, label: 'Pasarela SINPE & Pagos', detail: 'Conectado' },
              { icon: <Database size={12} color="#38bdf8" />, label: 'Venta Cruzada', detail: 'Complementos/Extras' }
            ],
            [
              { name: 'COMMAND_ORDER', label: 'Crear pedido en tienda' },
              { name: 'COMMAND_SEND_MEDIA', label: 'Enviar fotos de catálogo' }
            ]
          )}

          {/* 2. AGENTE CITAS & AGENDA */}
          {isBookingVisible && renderSubagentHierarchicalNode(
            'booking',
            subagents.booking,
            <Calendar size={18} color="#c084fc" />,
            '#9333ea',
            '#c084fc',
            activeSimulatedAgentId === 'booking',
            'Agenda citas, propone huecos libres alternativos y suma tiempos.',
            [
              { icon: <Database size={12} color="#c084fc" />, label: 'Servicios del Negocio', detail: `${dataSourcesSummary?.servicesCount ?? 0} serv.` },
              { icon: <Database size={12} color="#c084fc" />, label: 'Staff / Especialistas', detail: `${dataSourcesSummary?.specialistsCount ?? 0} activos` },
              { icon: <Database size={12} color="#c084fc" />, label: 'Disponibilidad de Horario', detail: 'Propuesta de huecos' }
            ],
            [
              { name: 'COMMAND_BOOKING', label: 'Crear cita en agenda' },
              { name: 'COMMAND_RESCHEDULE', label: 'Reagendar turno' },
              { name: 'COMMAND_CANCEL', label: 'Cancelar cita' }
            ]
          )}

          {/* 3. AGENTE CANCHAS DEPORTIVAS */}
          {isCourtsVisible && renderSubagentHierarchicalNode(
            'courts',
            subagents.courts,
            <Trophy size={18} color="#facc15" />,
            '#ca8a04',
            '#facc15',
            activeSimulatedAgentId === 'courts',
            'Aparta canchas, tarifas nocturnas con luz y códigos CRT.',
            [
              { icon: <Database size={12} color="#facc15" />, label: 'Canchas & Espacios', detail: `${dataSourcesSummary?.courtsCount ?? 0} canchas` },
              { icon: <Database size={12} color="#facc15" />, label: 'Tarifa Iluminación', detail: 'Nocturna activa' }
            ],
            [
              { name: 'COMMAND_COURT_BOOKING', label: 'Apartar cancha deportiva' },
              { name: 'COMMAND_COURT_RESCHEDULE', label: 'Mover hora de partido' }
            ]
          )}

          {/* 4. AGENTE ESCALADO HUMANO */}
          {renderSubagentHierarchicalNode(
            'handoff',
            subagents.handoff,
            <UserCheck size={18} color="#fb7185" />,
            '#e11d48',
            '#fb7185',
            activeSimulatedAgentId === 'handoff',
            'Contención empática, toma previa de datos y pausa del bot.',
            [
              { icon: <Database size={12} color="#fb7185" />, label: 'Palabras Clave de Alerta', detail: 'humano, queja...' },
              { icon: <Database size={12} color="#fb7185" />, label: 'Captura de Motivo', detail: 'Datos para asesor' }
            ],
            [
              { name: 'COMMAND_HANDOFF', label: 'Pausar bot y alertar equipo' }
            ]
          )}

          {/* 5. AGENTE IDENTIDAD, POLÍTICAS & FAQ */}
          {renderSubagentHierarchicalNode(
            'general',
            subagents.general,
            <HelpCircle size={18} color="#94a3b8" />,
            '#475569',
            '#94a3b8',
            activeSimulatedAgentId === 'general',
            'Conserje y anfitrión: horarios, ubicación, políticas y puente comercial.',
            [
              { icon: <Database size={12} color="#94a3b8" />, label: 'Ubicación & Waze', detail: 'Datos Negocio' },
              { icon: <Database size={12} color="#94a3b8" />, label: 'Formas de Pago & Factura', detail: 'SINPE / Electrónica' },
              { icon: <Database size={12} color="#94a3b8" />, label: 'Políticas & Comodidades', detail: 'Parqueo, Pet Friendly' },
              ...(subagents.general?.links || []).filter(l => l && l.label).map(l => ({
                icon: <Globe size={12} color="#38bdf8" />,
                label: l.label,
                detail: l.url ? (l.url.replace(/^https?:\/\//i, '').slice(0, 16) + (l.url.length > 18 ? '...' : '')) : 'Enlace'
              }))
            ],
            [
              { name: 'RESPUESTA_DIRECTA', label: 'Conversación natural WhatsApp' },
              { name: 'PUENTE_COMERCIAL', label: 'Invitación a catálogo / cita' }
            ]
          )}

        </div>

      </div>

      {/* ============================================================== */}
      {/* SUPERVISOR ORCHESTRATOR CONFIGURATION MODAL */}
      {/* ============================================================== */}
      {isOrchestratorModalOpen && (
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
                <div style={{ backgroundColor: '#6366f125', padding: '10px', borderRadius: '10px', color: '#818cf8' }}>
                  <Bot size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Configurar Agente Orquestador (Supervisor)</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Directrices maestras de atención y reglas de delegación</span>
                </div>
              </div>

              <button 
                onClick={() => setIsOrchestratorModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
                <strong style={{ fontSize: '0.88rem', color: '#38bdf8', display: 'block', marginBottom: '4px' }}>
                  🎯 Rol del Orquestador Supervisor
                </strong>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                  El orquestador recibe el mensaje entrante de WhatsApp, evalúa la intención del cliente en &lt;5ms y asigna la conversación al subagente experto (Ventas, Citas, Canchas, Escalado o FAQ). Sus directrices aplican a toda la orquesta.
                </p>
              </div>

              {/* Supervisor Prompt */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Directrices Maestras del Supervisor</label>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Reglas de prioridad y tono corporativo</span>
                </div>
                <textarea 
                  rows={8}
                  value={orchestratorConfig.prompt || ''}
                  onChange={e => handleUpdateSupervisorPrompt(e.target.value)}
                  placeholder="Ej: Eres el Director de Operaciones y Supervisor Agéntico de nuestro negocio. Prioriza siempre reclamos hacia Escalado Humano..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '0.85rem', lineHeight: '1.5', fontFamily: 'monospace' }}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  💡 Define aquí cómo resolver consultas mixtas (ej. si el cliente pide cita y producto a la vez) y la calidez costarricense esperada.
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #334155', backgroundColor: '#0b1120' }}>
              <button
                type="button"
                onClick={() => setIsOrchestratorModalOpen(false)}
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

      {/* ============================================================== */}
      {/* SUBAGENT CONFIGURATION MODAL / DRAWER */}
      {/* ============================================================== */}
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
                  rows={7}
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

              {/* Custom Links & Web Resources (Fuentes RAG de FAQ) */}
              <div style={{
                backgroundColor: '#0b1324',
                border: '1.5px solid #1e3a5f',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: '700', color: '#38bdf8' }}>
                      <Globe size={16} /> Enlaces & Recursos Web Oficiales (Fuentes RAG)
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Añade links oficiales (Menú PDF, Google Drive, Políticas, etc.). Se sumarán a las fuentes RAG y el bot los entregará bajo demanda en WhatsApp.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentLinks = currentModalAgent.links || [];
                      const updated = [...currentLinks, { label: '', url: '', description: '' }];
                      handleUpdateCurrentSubagent({ ...currentModalAgent, links: updated });
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Plus size={14} /> Añadir Enlace
                  </button>
                </div>

                {(!currentModalAgent.links || currentModalAgent.links.length === 0) ? (
                  <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px dashed #334155', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    No hay enlaces configurados aún. Toca <strong>"+ Añadir Enlace"</strong> para registrar cartas digitales, catálogos en Drive, o recursos oficiales.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentModalAgent.links.map((link, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              placeholder="Nombre/Título (ej: Menú en PDF)"
                              value={link.label || ''}
                              onChange={(e) => {
                                const currentLinks = [...(currentModalAgent.links || [])];
                                currentLinks[idx] = { ...currentLinks[idx], label: e.target.value };
                                handleUpdateCurrentSubagent({ ...currentModalAgent, links: currentLinks });
                              }}
                              style={{ flex: 1, minWidth: '160px', padding: '7px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.8rem' }}
                            />
                            <input
                              type="url"
                              placeholder="URL (ej: https://midominio.com/menu.pdf)"
                              value={link.url || ''}
                              onChange={(e) => {
                                const currentLinks = [...(currentModalAgent.links || [])];
                                currentLinks[idx] = { ...currentLinks[idx], url: e.target.value };
                                handleUpdateCurrentSubagent({ ...currentModalAgent, links: currentLinks });
                              }}
                              style={{ flex: 2, minWidth: '220px', padding: '7px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '0.8rem' }}
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Detalle o cuándo entregarlo (ej: Entregar únicamente si el cliente pide el archivo descargable)"
                            value={link.description || ''}
                            onChange={(e) => {
                              const currentLinks = [...(currentModalAgent.links || [])];
                              currentLinks[idx] = { ...currentLinks[idx], description: e.target.value };
                              handleUpdateCurrentSubagent({ ...currentModalAgent, links: currentLinks });
                            }}
                            style={{ width: '100%', padding: '6px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem' }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const currentLinks = (currentModalAgent.links || []).filter((_, i) => i !== idx);
                            handleUpdateCurrentSubagent({ ...currentModalAgent, links: currentLinks });
                          }}
                          title="Eliminar este enlace"
                          style={{
                            backgroundColor: '#ef444420',
                            border: '1px solid #ef444450',
                            color: '#f87171',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '2px'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

  /**
   * Renders each specialized subagent as a hierarchical draggable card
   * with its connected RAG data sources and assigned executable actions.
   */
  function renderSubagentHierarchicalNode(
    key: string,
    agent: SubagentConfig | undefined,
    icon: React.ReactNode,
    accentBorder: string,
    accentColor: string,
    isSimActive: boolean,
    subtitle: string,
    sourcesList: Array<{ icon: React.ReactNode; label: string; detail: string }>,
    actionsList: Array<{ name: string; label: string }>
  ) {
    if (!agent) return null;
    const isEnabled = agent.enabled !== false;
    const pos = nodePositions[key] || DEFAULT_NODE_POSITIONS[key] || { x: 100, y: 350 };
    const dim = NODE_DIMENSIONS[key] || { w: 290, h: 370 };

    return (
      <div 
        key={key}
        onMouseDown={(e) => handleNodeMouseDown(key, e)}
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: `${dim.w}px`,
          backgroundColor: '#0f172a',
          border: isSimActive 
            ? `2px solid ${accentColor}` 
            : (isEnabled ? `1.5px solid ${accentBorder}` : '1.5px solid #334155'),
          borderRadius: '16px',
          padding: '16px',
          boxShadow: isSimActive 
            ? `0 0 30px ${accentColor}60` 
            : (isEnabled ? `0 10px 25px ${accentBorder}25` : 'none'),
          opacity: isEnabled ? 1 : 0.5,
          cursor: 'move',
          zIndex: draggingNode?.id === key ? 100 : 2,
          transition: draggingNode?.id === key ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Top Input Port (Receives cable from Orchestrator) */}
        <div style={{
          position: 'absolute',
          top: '-7px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: accentColor,
          border: '2px solid #0f172a',
          boxShadow: `0 0 8px ${accentColor}`
        }} />

        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ backgroundColor: `${accentColor}25`, padding: '6px', borderRadius: '8px' }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: accentColor, textTransform: 'uppercase', fontWeight: 'bold' }}>Subagente Experto</div>
              <strong style={{ fontSize: '0.92rem', color: isEnabled ? '#f8fafc' : '#94a3b8' }}>
                {agent.name}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={(e) => handleToggleSubagent(key, e)}
              title={isEnabled ? 'Desactivar subagente' : 'Activar subagente'}
              style={{
                backgroundColor: isEnabled ? '#10b981' : '#475569',
                color: '#fff',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSubagentKey(key);
              }}
              title="Configurar prompt, fuentes y acciones"
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#94a3b8',
                padding: '4px 6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Sliders size={13} />
            </button>
          </div>
        </div>

        {/* Subtitle / Role description */}
        <p style={{ fontSize: '0.73rem', color: '#94a3b8', margin: 0, lineHeight: '1.3' }}>
          {subtitle}
        </p>

        {/* SECTION 1: FUENTES RAG ASIGNADAS */}
        <div style={{
          backgroundColor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '0.68rem', color: accentColor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={12} /> Fuentes RAG Asignadas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sourcesList.map((src, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  {src.icon}
                  <span>{src.label}</span>
                </div>
                <span style={{ backgroundColor: '#1e293b', color: accentColor, fontSize: '0.65rem', padding: '1px 6px', borderRadius: '8px', fontWeight: 'bold' }}>
                  {src.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: ACCIONES ASIGNADAS (TOOLS) */}
        <div style={{
          backgroundColor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '10px 12px'
        }}>
          <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={12} /> Acciones Asignadas (Tools)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {actionsList.map((act, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: '#86efac', fontWeight: '600', fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {act.name}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>
                  {act.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer: Drag info & Quick edit */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSubagentKey(key);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
            color: '#64748b',
            borderTop: '1px solid #1e293b',
            paddingTop: '8px',
            marginTop: '2px',
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Move size={11} color="#64748b" /> Arrastrar para mover
          </span>
          <span style={{ color: accentColor, fontWeight: '600' }}>
            Configurar Prompt &gt;
          </span>
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
