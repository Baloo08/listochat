import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  QrCode,
  RotateCw,
  Power,
  Send,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
  Shield,
  Phone,
  Sparkles,
  ChevronRight,
  Headphones,
  Activity,
  Lock,
  BarChart3,
  Cpu
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

interface Instance {
  instanceType: string;
  instanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string | null;
}

interface Conversation {
  remoteJid: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  evolutionInstance?: string;
  pushName: string;
  lastMessage: string;
  lastMessageTime: string;
  lastFromMe: boolean;
  isHumanMode: boolean;
  totalMessages: number;
  subagent: {
    id: string;
    name: string;
    badgeColor: string;
    badgeBg: string;
  };
}

interface Message {
  id: string;
  tenantId: string;
  remoteJid: string;
  pushName: string;
  fromMe: boolean;
  messageText: string;
  aiResponse: boolean;
  status: string;
  createdAt: string;
  subagent: {
    id: string;
    name: string;
    badgeColor: string;
    badgeBg: string;
  };
}

interface TenantTelemetry {
  id: string;
  name: string;
  slug: string;
  whatsappNumber?: string | null;
  evolutionInstance?: string | null;
  connectionStatus: 'connected' | 'disconnected';
  todayMessagesCount: number;
  activeSubagentsDistribution: {
    sales: number;
    booking: number;
    courts: number;
    loyalty: number;
    general: number;
    handoff: number;
  };
  aiHealth: {
    status: 'ok' | 'no_key' | 'quota_error' | 'recent_errors';
    provider: string;
    model: string;
    byokActive: boolean;
  };
}

export default function MasterBotsAndLiveChats() {
  const api = useAdminApi();

  // Estados de instancias maestras
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Estados de chats de bots maestros
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Hilo de mensajes en vivo del bot maestro
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Estados de telemetría de comercios
  const [telemetryList, setTelemetryList] = useState<TenantTelemetry[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [telemetrySearch, setTelemetrySearch] = useState('');

  const loadInstances = async () => {
    try {
      setLoadingInstances(true);
      const data = await api.get('/api/bots-chats/instances');
      if (Array.isArray(data)) setInstances(data);
    } catch (e: any) {
      console.warn('Error cargando instancias:', e);
    } finally {
      setLoadingInstances(false);
    }
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const data = await api.get('/api/bots-chats/conversations');
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          selectConversation(data[0]);
        }
      }
    } catch (e: any) {
      console.warn('Error cargando conversaciones de bots maestros:', e);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadTelemetry = async () => {
    try {
      setLoadingTelemetry(true);
      const data = await api.get('/api/bots-chats/tenants-telemetry');
      if (Array.isArray(data)) setTelemetryList(data);
    } catch (e: any) {
      console.warn('Error cargando telemetría de comercios:', e);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    setLoadingMessages(true);
    setActionNotice(null);
    try {
      const data = await api.get(`/api/bots-chats/messages?tenantId=${conv.tenantId}&remoteJid=${encodeURIComponent(conv.remoteJid)}`);
      if (Array.isArray(data)) setMessages(data);
    } catch (e: any) {
      console.warn('Error cargando mensajes:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadInstances();
    loadConversations();
    loadTelemetry();

    // Polling cada 12 segundos para actualización de telemetría y mensajes
    const interval = setInterval(() => {
      loadConversations();
      loadTelemetry();
      if (selectedConversation) {
        api.get(`/api/bots-chats/messages?tenantId=${selectedConversation.tenantId}&remoteJid=${encodeURIComponent(selectedConversation.remoteJid)}`)
          .then(res => { if (Array.isArray(res)) setMessages(res); })
          .catch(() => {});
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [selectedConversation?.remoteJid]);

  const handleConnectInstance = async (type: string) => {
    setConnectingType(type);
    try {
      const res = await api.post('/api/bots-chats/instances/connect', { instanceType: type });
      await loadInstances();
      if (res?.qrCode) {
        setActionNotice(`Código QR generado para betico_${type}. Escanéalo con WhatsApp.`);
      }
    } catch (e: any) {
      alert('Error conectando bot maestro: ' + (e.message || 'Error'));
    } finally {
      setConnectingType(null);
    }
  };

  const handleDisconnectInstance = async (type: string) => {
    if (!confirm(`¿Desconectar la sesión de WhatsApp de betico_${type}?`)) return;
    try {
      await api.post('/api/bots-chats/instances/disconnect', { instanceType: type });
      await loadInstances();
    } catch (e: any) {
      alert('Error desconectando: ' + (e.message || 'Error'));
    }
  };

  const handleToggleHumanMode = async () => {
    if (!selectedConversation) return;
    const newMode = !selectedConversation.isHumanMode;
    try {
      await api.post('/api/bots-chats/toggle-ai', {
        tenantId: selectedConversation.tenantId,
        remoteJid: selectedConversation.remoteJid,
        isHumanMode: newMode
      });
      setSelectedConversation({ ...selectedConversation, isHumanMode: newMode });
      setConversations(conversations.map(c => 
        (c.remoteJid === selectedConversation.remoteJid && c.tenantId === selectedConversation.tenantId) 
          ? { ...c, isHumanMode: newMode } 
          : c
      ));
      setActionNotice(newMode ? 'Modo Humano ACTIVADO (El bot de IA no responderá a este chat)' : 'Modo Asistente IA ACTIVADO');
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Error'));
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !replyText.trim()) return;

    setSendingReply(true);
    try {
      await api.post('/api/bots-chats/reply', {
        tenantId: selectedConversation.tenantId,
        remoteJid: selectedConversation.remoteJid,
        messageText: replyText.trim(),
        pushName: 'Soporte Betico'
      });
      setReplyText('');
      const updatedMsgs = await api.get(`/api/bots-chats/messages?tenantId=${selectedConversation.tenantId}&remoteJid=${encodeURIComponent(selectedConversation.remoteJid)}`);
      if (Array.isArray(updatedMsgs)) setMessages(updatedMsgs);
      setActionNotice('Mensaje enviado con éxito por WhatsApp');
    } catch (e: any) {
      alert('Error enviando mensaje: ' + (e.message || 'Error'));
    } finally {
      setSendingReply(false);
    }
  };

  const filteredTelemetry = telemetryList.filter(t => 
    t.name.toLowerCase().includes(telemetrySearch.toLowerCase()) ||
    t.slug.toLowerCase().includes(telemetrySearch.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ENCABEZADO PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={26} style={{ color: '#34D399' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#FAF8F5' }}>
              Bots Maestros y Telemetría Técnica
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Atención en vivo para prospectos de Betico y panel de salud técnica para comercios con privacidad garantizada
          </p>
        </div>
        <button
          onClick={() => {
            loadInstances();
            loadConversations();
            loadTelemetry();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '8px',
            color: '#FAF8F5',
            fontSize: '0.82rem',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <RotateCw size={14} />
          Actualizar Todo
        </button>
      </div>

      {actionNotice && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          {actionNotice}
        </div>
      )}

      {/* SECCIÓN 1: INSTANCIAS MAESTRAS DE WHATSAPP (VENTAS Y SOPORTE) */}
      <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={18} color="#34D399" />
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#FAF8F5' }}>
            Instancias Maestras de SuperAdmin (Atención Centralizada)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          
          {/* Bot de Ventas */}
          {(() => {
            const ventas = instances.find(i => i.instanceType === 'ventas') || { instanceType: 'ventas', instanceName: 'betico_ventas', status: 'disconnected', qrCode: null };
            const isConn = ventas.status === 'connected';
            return (
              <div style={{ backgroundColor: '#091819', border: '1px solid #1a3e40', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={18} color="#34D399" />
                    <strong style={{ fontSize: '0.95rem', color: '#FAF8F5' }}>Bot de Ventas y Demostración</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#0d2224', color: '#34D399', border: '1px solid #1a3e40', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    betico_ventas
                  </span>
                </div>

                {ventas.qrCode && (
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <img src={ventas.qrCode} alt="Código QR de Conexión" style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block' }} />
                    <span style={{ fontSize: '0.72rem', color: '#091819', fontWeight: 'bold' }}>Escanea con WhatsApp</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a3e40', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: isConn ? '#34D399' : '#94a3b8', fontWeight: 700 }}>
                    {isConn ? '🟢 Conectado' : '⚪ Desconectado'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleConnectInstance('ventas')}
                      disabled={connectingType === 'ventas'}
                      style={{ padding: '6px 12px', backgroundColor: '#0B3C3D', border: '1px solid #34D399', color: '#FAF8F5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {connectingType === 'ventas' ? 'Generando...' : 'Conectar QR'}
                    </button>
                    {isConn && (
                      <button
                        onClick={() => handleDisconnectInstance('ventas')}
                        style={{ padding: '6px 12px', backgroundColor: 'rgba(181, 28, 18, 0.2)', border: '1px solid #B51C12', color: '#fca5a5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bot de Soporte */}
          {(() => {
            const soporte = instances.find(i => i.instanceType === 'soporte') || { instanceType: 'soporte', instanceName: 'betico_soporte', status: 'disconnected', qrCode: null };
            const isConn = soporte.status === 'connected';
            return (
              <div style={{ backgroundColor: '#091819', border: '1px solid #1a3e40', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Headphones size={18} color="#38bdf8" />
                    <strong style={{ fontSize: '0.95rem', color: '#FAF8F5' }}>Bot de Soporte Técnico Central</strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#0d2224', color: '#38bdf8', border: '1px solid #1a3e40', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    betico_soporte
                  </span>
                </div>

                {soporte.qrCode && (
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '10px' }}>
                    <img src={soporte.qrCode} alt="Código QR de Conexión" style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block' }} />
                    <span style={{ fontSize: '0.72rem', color: '#091819', fontWeight: 'bold' }}>Escanea con WhatsApp</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a3e40', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: isConn ? '#34D399' : '#94a3b8', fontWeight: 700 }}>
                    {isConn ? '🟢 Conectado' : '⚪ Desconectado'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleConnectInstance('soporte')}
                      disabled={connectingType === 'soporte'}
                      style={{ padding: '6px 12px', backgroundColor: '#0B3C3D', border: '1px solid #38bdf8', color: '#FAF8F5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {connectingType === 'soporte' ? 'Generando...' : 'Conectar QR'}
                    </button>
                    {isConn && (
                      <button
                        onClick={() => handleDisconnectInstance('soporte')}
                        style={{ padding: '6px 12px', backgroundColor: 'rgba(181, 28, 18, 0.2)', border: '1px solid #B51C12', color: '#fca5a5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Desconectar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* SECCIÓN 2: CHATS EN VIVO EXCLUSIVOS DE LOS BOTS MAESTROS DE BETICO */}
      <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '22px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} color="#34D399" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
              Bandeja de Chats en Vivo — Bots Maestros de Betico
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
            Atención en tiempo real para prospectos y usuarios que contactan directamente los números oficiales de Betico.
          </p>
        </div>

        {/* CONTENEDOR SPLIT: LISTA DE CHATS MAESTROS (IZQUIERDA) Y HILO DE CONVERSACIÓN (DERECHA) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '16px', minHeight: '480px' }}>
          
          {/* LISTA DE CONVERSACIONES MAESTRAS */}
          <div style={{ backgroundColor: '#071213', border: '1px solid #1a3e40', borderRadius: '12px', overflowY: 'auto', maxHeight: '520px' }}>
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#34D399' }} />
                <span>Cargando conversaciones...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.85rem' }}>
                No hay conversaciones recientes en los bots maestros de Betico.
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = selectedConversation?.remoteJid === conv.remoteJid && selectedConversation?.tenantId === conv.tenantId;
                return (
                  <div
                    key={`${conv.tenantId}-${conv.remoteJid}`}
                    onClick={() => selectConversation(conv)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #142e30',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      backgroundColor: isSelected ? '#0d2224' : 'transparent',
                      borderLeft: isSelected ? '4px solid #34D399' : '4px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FAF8F5' }}>
                        {conv.pushName || 'Prospecto Betico'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(conv.lastMessageTime).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600, marginBottom: '6px' }}>
                      Instancia: {conv.evolutionInstance || 'betico_oficial'}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                      {conv.lastFromMe ? 'Asistente: ' : ''}{conv.lastMessage}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        backgroundColor: conv.subagent.badgeBg,
                        color: conv.subagent.badgeColor
                      }}>
                        {conv.subagent.name}
                      </span>

                      {conv.isHumanMode && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171'
                        }}>
                          👤 Asesor Humano
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* HILO DE CONVERSACIÓN SELECCIONADO */}
          <div style={{ backgroundColor: '#071213', border: '1px solid #1a3e40', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Header del Chat */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a3e40', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ fontSize: '1rem', color: '#FAF8F5' }}>{selectedConversation.pushName}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        ({selectedConversation.remoteJid.replace(/@.+$/, '')})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '2px' }}>
                      Bot Maestro Oficial • Instancia: <code>{selectedConversation.evolutionInstance || 'betico'}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleToggleHumanMode}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: selectedConversation.isHumanMode ? '#B51C12' : '#0B3C3D',
                        color: '#FAF8F5'
                      }}
                    >
                      {selectedConversation.isHumanMode ? '🔴 Pausar Asesor (Volver a IA)' : '🟢 Intervenir con Asesor Humano'}
                    </button>
                  </div>
                </div>

                {/* Área de Mensajes */}
                <div style={{ flex: 1, padding: '18px', overflowY: 'auto', maxHeight: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#34D399' }} />
                      <span>Cargando mensajes del chat...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      No hay mensajes en este chat aún.
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: msg.fromMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.fromMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          backgroundColor: msg.fromMe ? '#0B3C3D' : '#162e30',
                          border: msg.fromMe ? '1px solid #34D399' : '1px solid #234b4e',
                          color: '#FAF8F5',
                          borderRadius: msg.fromMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          wordBreak: 'break-word'
                        }}>
                          {msg.messageText}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {new Date(msg.createdAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {msg.fromMe && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 700,
                              backgroundColor: msg.subagent.badgeBg,
                              color: msg.subagent.badgeColor
                            }}>
                              {msg.subagent.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario de Respuesta Manual de Soporte */}
                <form onSubmit={handleSendReply} style={{ padding: '12px 16px', borderTop: '1px solid #1a3e40', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe una respuesta como operador para enviar por WhatsApp..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: '#0a1a1b',
                      color: '#FAF8F5',
                      border: '1px solid #234b4e',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#0B3C3D',
                      border: '1px solid #34D399',
                      borderRadius: '8px',
                      color: '#FAF8F5',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={15} />
                    {sendingReply ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>

              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px auto', color: '#163638' }} />
                <p style={{ margin: 0 }}>Selecciona una conversación a la izquierda para interactuar en vivo con el cliente de Betico.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECCIÓN 3: PANEL DE TELEMETRÍA TÉCNICA Y DIAGNÓSTICO DE SALUD DE COMERCIOS */}
      <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '22px' }}>
        
        {/* Banner de Privacidad Estricta */}
        <div style={{
          backgroundColor: '#091c1e',
          border: '1px solid #1b4b4e',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Lock size={22} style={{ color: '#34D399', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#FAF8F5', fontSize: '0.9rem' }}>
              🔒 Privacidad por Diseño Activa (GDPR y Protección de Datos)
            </strong>
            <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              Las conversaciones y números de teléfono de clientes de comercios pertenecen exclusivamente al panel privado de cada comercio. Betico Ops solo monitoriza telemetría técnica agregada, volumen de mensajes y salud del motor de IA.
            </p>
          </div>
        </div>

        {/* Header de Telemetría con Buscador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="#34D399" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
              Telemetría Técnica y Diagnóstico de Salud de Comercios
            </h2>
          </div>

          <input
            type="text"
            value={telemetrySearch}
            onChange={(e) => setTelemetrySearch(e.target.value)}
            placeholder="Buscar por comercio o slug..."
            style={{
              padding: '8px 14px',
              backgroundColor: '#071213',
              color: '#FAF8F5',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              fontSize: '0.85rem',
              outline: 'none',
              width: '240px'
            }}
          />
        </div>

        {/* GRID DE TARJETAS DE TELEMETRÍA */}
        {loadingTelemetry ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#34D399' }} />
            <span>Cargando telemetría de comercios...</span>
          </div>
        ) : filteredTelemetry.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.85rem' }}>
            No se encontraron comercios registrados para los criterios de búsqueda.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
            {filteredTelemetry.map(t => {
              const isConnected = t.connectionStatus === 'connected';
              return (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: '#091819',
                    border: '1px solid #1a3e40',
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Encabezado del Comercio */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} color="#34D399" />
                        <strong style={{ fontSize: '1rem', color: '#FAF8F5' }}>{t.name}</strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>
                        /{t.slug} {t.whatsappNumber ? `• Tel: +${t.whatsappNumber}` : ''}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: isConnected ? '#34D399' : '#94a3b8',
                      border: isConnected ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)'
                    }}>
                      {isConnected ? '🟢 WhatsApp Conectado' : '⚪ Desconectado'}
                    </span>
                  </div>

                  {/* Volumen de Mensajes Hoy */}
                  <div style={{ backgroundColor: '#071213', border: '1px solid #142e30', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mensajes procesados hoy:</span>
                    <strong style={{ fontSize: '0.95rem', color: '#FAF8F5' }}>
                      💬 {t.todayMessagesCount.toLocaleString('es-CR')}
                    </strong>
                  </div>

                  {/* Desglose de Subagentes Activos */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        Distribución de Subagentes:
                      </span>
                      <BarChart3 size={13} color="#94a3b8" />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontWeight: 700 }}>
                        Ventas {t.activeSubagentsDistribution.sales}%
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#facc15', fontWeight: 700 }}>
                        Citas {t.activeSubagentsDistribution.booking}%
                      </span>
                      {t.activeSubagentsDistribution.courts > 0 && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', fontWeight: 700 }}>
                          Canchas {t.activeSubagentsDistribution.courts}%
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', fontWeight: 700 }}>
                        Fidelización {t.activeSubagentsDistribution.loyalty}%
                      </span>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa', fontWeight: 700 }}>
                        General {t.activeSubagentsDistribution.general}%
                      </span>
                    </div>
                  </div>

                  {/* Estado de Salud de IA / BYOK */}
                  <div style={{ borderTop: '1px solid #142e30', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} color="#34D399" />
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Motor de IA:</span>
                    </div>

                    {t.aiHealth.byokActive ? (
                      <span style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        BYOK Activo ({t.aiHealth.model})
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} />
                        Sin Clave Propia (BYOK)
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
