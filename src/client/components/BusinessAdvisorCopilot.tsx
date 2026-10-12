import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, X, Send, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Calendar, Package, RefreshCw, ChevronRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

interface MetricsSnapshot {
  todayDate: string;
  currentTime: string;
  todayAppointments: number;
  todayCompleted: number;
  todayRevenue: number;
  monthAppointments: number;
  monthRevenue: number;
  lowStockCount: number;
  topServices: string[];
}

export const BusinessAdvisorCopilot: React.FC = () => {
  const api = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 ¡Hola! Soy tu **Asesor Estratégico de Negocios**. Puedo analizar tus métricas en tiempo real, ingresos, ocupación de citas y recomendarte tácticas para hacer crecer tus ventas. ¿En qué te gustaría enfocarte hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [byokError, setByokError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setByokError(null);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.post('/api/secretary/business-advisor/chat', {
        message: textToSend.trim(),
        conversationHistory: historyPayload
      });

      if (res?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        if (res.metricsSnapshot) {
          setMetrics(res.metricsSnapshot);
        }
      }
    } catch (err: any) {
      if (err?.error === 'BYOK_REQUIRED' || err?.message?.includes('BYOK')) {
        setByokError('Para conversar con el Asesor Estratégico, necesitas conectar tu propia API Key en Ajustes > Inteligencia Artificial.');
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ Ocurrió un error al procesar tu consulta con la IA. Por favor verifica que tu clave API de IA esté activa.'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            height: '52px',
            padding: '0 20px',
            borderRadius: '26px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4), 0 8px 10px -6px rgba(15, 23, 42, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            zIndex: 999,
            fontWeight: 600,
            fontSize: '14px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#ffffff" />
          </div>
          Asesor Copilot
        </button>
      )}

      {/* Floating Drawer / Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
          height: '620px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Asesor de Negocios</h4>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Copilot Estratégico Betico</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics Bar (if available) */}
          {metrics && (
            <div style={{
              padding: '10px 16px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 600 }}>
                <DollarSign size={13} color="#16a34a" />
                Hoy: ₡{metrics.todayRevenue.toLocaleString('es-CR')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                <Calendar size={13} color="#2563eb" />
                Citas: {metrics.todayAppointments}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                <TrendingUp size={13} color="#7c3aed" />
                Mes: ₡{metrics.monthRevenue.toLocaleString('es-CR')}
              </div>
            </div>
          )}

          {/* Messages Body */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#ffffff'
          }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 14px',
                  borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  backgroundColor: m.role === 'user' ? '#0f172a' : '#f1f5f9',
                  color: m.role === 'user' ? '#ffffff' : '#1e293b',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.content}
                </div>
                {m.time && (
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', padding: '0 4px' }}>
                    {m.time}
                  </span>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', padding: '8px' }}>
                <RefreshCw size={14} className="animate-spin" />
                El Asesor está analizando tus métricas...
              </div>
            )}

            {byokError && (
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                color: '#92400e',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                  <AlertTriangle size={15} color="#d97706" />
                  Requiere Clave Propia (BYOK)
                </div>
                {byokError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {messages.length <= 2 && (
            <div style={{ padding: '8px 16px', display: 'flex', gap: '6px', overflowX: 'auto', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => handleSend('¿Cómo van mis ventas e ingresos de este mes?')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                📊 Resumen de ventas
              </button>
              <button
                onClick={() => handleSend('¿Cuáles son mis horas con menor ocupación?')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ⏰ Horas muertas
              </button>
              <button
                onClick={() => handleSend('Recomiéndame una promoción para clientes fieles')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '16px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🎁 Ideas de promociones
              </button>
            </div>
          )}

          {/* Input Footer */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Pregunta sobre tus métricas o estrategias..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const BusinessAdvisorView: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
          Asesor Estratégico de Negocios
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          Análisis cuantitativo de ingresos, tasas de conversión y recomendaciones para optimizar la rentabilidad de tu negocio en Costa Rica.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
            <TrendingUp size={18} />
            Monitoreo en Tiempo Real
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>Auditoría Diaria</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
            El Asesor cruza automáticamente las citas atendidas, cancelaciones, reservas de canchas y ventas de tienda para detectar horas pico y horas de baja demanda.
          </p>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>
            <Sparkles size={18} />
            Estrategias Personalizadas
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '16px', color: '#0f172a' }}>Tácticas Accionables</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
            Recibe recomendaciones concretas para reactivar clientes inactivos mediante promociones de lealtad en Betico Club y cupones de descuento.
          </p>
        </div>
      </div>

      {/* Embedded Copilot Widget */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Diálogo Estratégico con el Asesor
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Utiliza el botón flotante en la esquina inferior derecha o interactúa con el Copilot en cualquier sección del portal.
            </span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
          Haz clic en el botón <strong>Asesor Copilot</strong> para abrir la ventana de diálogo inteligente y comenzar a evaluar tus métricas de hoy.
        </p>
      </div>
    </div>
  );
};

export default BusinessAdvisorCopilot;
