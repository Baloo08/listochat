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
  Headphones
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

interface Instance {
  instanceType: string;
  instanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  whatsappNumber?: string;
  evolutionInstance?: string;
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

export default function MasterBotsAndLiveChats() {
  const api = useAdminApi();

  // Master instances states
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Live chats states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Active chat thread
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const loadTenants = async () => {
    try {
      const data = await api.get('/api/bots-chats/tenants');
      if (Array.isArray(data)) setTenants(data);
    } catch (e: any) {
      console.warn('Error cargando comercios:', e);
    }
  };

  const loadConversations = async (tenantId = selectedTenantFilter) => {
    try {
      setLoadingConversations(true);
      const data = await api.get(`/api/bots-chats/conversations?tenantId=${tenantId}`);
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          selectConversation(data[0]);
        }
      }
    } catch (e: any) {
      console.warn('Error cargando conversaciones:', e);
    } finally {
      setLoadingConversations(false);
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
    loadTenants();
    loadConversations('all');

    // Polling every 12 seconds for fresh chat updates
    const interval = setInterval(() => {
      loadConversations(selectedTenantFilter);
      if (selectedConversation) {
        api.get(`/api/bots-chats/messages?tenantId=${selectedConversation.tenantId}&remoteJid=${encodeURIComponent(selectedConversation.remoteJid)}`)
          .then(res => { if (Array.isArray(res)) setMessages(res); })
          .catch(() => {});
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [selectedTenantFilter, selectedConversation?.remoteJid]);

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
      // Reload message thread
      const updatedMsgs = await api.get(`/api/bots-chats/messages?tenantId=${selectedConversation.tenantId}&remoteJid=${encodeURIComponent(selectedConversation.remoteJid)}`);
      if (Array.isArray(updatedMsgs)) setMessages(updatedMsgs);
      setActionNotice('Mensaje enviado con éxito por WhatsApp');
    } catch (e: any) {
      alert('Error enviando mensaje: ' + (e.message || 'Error'));
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={26} style={{ color: '#34D399' }} />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#FAF8F5' }}>
              Bots Maestros y Monitoreo de Chats en Vivo
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Conexión de bots centrales de WhatsApp y supervisión en tiempo real con clasificador de subagentes IA
          </p>
        </div>
        <button
          onClick={() => {
            loadInstances();
            loadConversations(selectedTenantFilter);
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

      {/* SECCIÓN 1: BOTS MAESTROS DE WHATSAPP (VENTAS Y SOPORTE) */}
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

      {/* SECCIÓN 2: CHATS EN VIVO CON SELECCIÓN DE TENANT Y SEGUIMIENTO DE SUBAGENTES */}
      <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '22px' }}>
        
        {/* Selector de Tenant */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#34D399" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
              Auditoría y Soporte en Vivo por Comercio
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Filtrar Comercio:</span>
            <select
              value={selectedTenantFilter}
              onChange={(e) => {
                setSelectedTenantFilter(e.target.value);
                loadConversations(e.target.value);
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#071213',
                color: '#FAF8F5',
                border: '1px solid #234b4e',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">⚡ Todos los Comercios Activos</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} (/{t.slug})</option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTENEDOR SPLIT: LISTA DE CHATS (IZQUIERDA) Y HILO DE CONVERSACIÓN (DERECHA) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '16px', minHeight: '520px' }}>
          
          {/* LISTA DE CONVERSACIONES */}
          <div style={{ backgroundColor: '#071213', border: '1px solid #1a3e40', borderRadius: '12px', overflowY: 'auto', maxHeight: '580px' }}>
            {loadingConversations ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <RotateCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto', color: '#34D399' }} />
                <span>Cargando conversaciones...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.85rem' }}>
                No hay conversaciones registradas para el filtro seleccionado.
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
                        {conv.pushName || 'Cliente'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {new Date(conv.lastMessageTime).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600, marginBottom: '6px' }}>
                      {conv.tenantName} (/{conv.tenantSlug})
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                      {conv.lastFromMe ? 'Asistente: ' : ''}{conv.lastMessage}
                    </div>

                    {/* SUBAGENT BADGE Y MODO HUMANO */}
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
                      Comercio: <strong>{selectedConversation.tenantName}</strong> • Instancia: <code>{selectedConversation.evolutionInstance || 'N/A'}</code>
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
                <div style={{ flex: 1, padding: '18px', overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                {/* Input de Respuesta Manual de Soporte */}
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
                <p style={{ margin: 0 }}>Selecciona una conversación a la izquierda para ver el historial y actuar.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
