import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Send, User, Bot, Search, Phone, RefreshCw, ExternalLink, ShieldAlert, UserCheck, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { ChatMessage } from '../../shared/types';

interface Conversation {
  remoteJid: string;
  pushName: string;
  cleanPhone: string;
  lastMessage: string;
  lastTimestamp: string;
  isHumanMode: boolean;
  messages: ChatMessage[];
}

export default function ChatsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sessionMap, setSessionMap] = useState<Record<string, any>>({});
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'human' | 'ai'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const api = useApi();

  const loadChats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const data = await api.get('/api/chats');
      const messages: ChatMessage[] = data?.messages || [];
      const sessions: Record<string, any> = data?.sessions || {};
      setSessionMap(sessions);

      if (Array.isArray(messages)) {
        const map = new Map<string, Conversation>();

        messages.forEach(m => {
          if (!map.has(m.remoteJid)) {
            const cleanPhone = (m.remoteJid || '').replace(/@.+$/, '').replace(/\D/g, '');
            map.set(m.remoteJid, {
              remoteJid: m.remoteJid,
              pushName: m.pushName || cleanPhone || 'Cliente',
              cleanPhone,
              lastMessage: m.messageText,
              lastTimestamp: String(m.createdAt || ''),
              isHumanMode: sessions[m.remoteJid]?.isHumanMode || false,
              messages: []
            });
          }
          const conv = map.get(m.remoteJid)!;
          conv.messages.push(m);
        });

        map.forEach(conv => {
          conv.messages.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
          if (conv.messages.length > 0) {
            const last = conv.messages[conv.messages.length - 1];
            conv.lastMessage = last.messageText;
            conv.lastTimestamp = String(last.createdAt || '');
          }
          conv.isHumanMode = sessions[conv.remoteJid]?.isHumanMode || false;
        });

        const convList = Array.from(map.values());
        convList.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());

        setConversations(convList);

        if (!selectedJid && convList.length > 0) {
          setSelectedJid(convList[0].remoteJid);
        }
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  // Live Polling every 4 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadChats(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedJid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedJid, conversations]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJid || !replyText.trim()) return;

    setSending(true);
    try {
      const activeConv = conversations.find(c => c.remoteJid === selectedJid);
      await api.post('/api/chats/reply', {
        remoteJid: selectedJid,
        messageText: replyText.trim(),
        pushName: activeConv?.pushName || ''
      });

      setReplyText('');
      await loadChats(true);
    } catch (err) {
      alert('Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleToggleHumanMode = async (remoteJid: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await api.post('/api/chats/toggle-ai', {
        remoteJid,
        isHumanMode: newStatus
      });

      setConversations(prev => prev.map(c => c.remoteJid === remoteJid ? { ...c, isHumanMode: newStatus } : c));
      setSessionMap(prev => ({
        ...prev,
        [remoteJid]: { ...(prev[remoteJid] || {}), isHumanMode: newStatus }
      }));
    } catch (e) {
      alert('Error actualizando modo humano');
    }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.pushName.toLowerCase().includes(search.toLowerCase()) ||
                          c.cleanPhone.includes(search) ||
                          c.lastMessage.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterTab === 'human') return c.isHumanMode;
    if (filterTab === 'ai') return !c.isHumanMode;
    return true;
  });

  const selectedConv = conversations.find(c => c.remoteJid === selectedJid);

  const formatMessageTime = (dateStr?: any) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{ maxWidth: '1100px', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 2px 0', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={22} color="var(--primary)" /> Bandeja de WhatsApp en Vivo
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitoreo en tiempo real, cambio a modo humano y respuestas manuales
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Actualización en vivo (4s)</span>
          </label>

          <button
            onClick={() => loadChats(false)}
            style={{ padding: '7px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refrescar
          </button>
        </div>
      </div>

      {/* Main Split Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '640px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        
        {/* Left Column: Conversations List */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', overflow: 'hidden' }}>
          
          {/* Search Box */}
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar por cliente o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Filter Pills with Lucide Icons (No Emojis) */}
          <div style={{ display: 'flex', gap: '4px', padding: '8px 10px', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
            <button
              onClick={() => setFilterTab('all')}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: '6px', border: 'none',
                backgroundColor: filterTab === 'all' ? 'var(--primary)' : 'transparent',
                color: filterTab === 'all' ? 'white' : 'var(--text-muted)',
                fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <MessageSquare size={13} /> Todos ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('human')}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: '6px', border: 'none',
                backgroundColor: filterTab === 'human' ? '#f59e0b' : 'transparent',
                color: filterTab === 'human' ? 'white' : 'var(--text-muted)',
                fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <User size={13} /> Humano ({conversations.filter(c => c.isHumanMode).length})
            </button>
            <button
              onClick={() => setFilterTab('ai')}
              style={{
                flex: 1, padding: '6px 4px', borderRadius: '6px', border: 'none',
                backgroundColor: filterTab === 'ai' ? '#10b981' : 'transparent',
                color: filterTab === 'ai' ? 'white' : 'var(--text-muted)',
                fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
              }}
            >
              <Bot size={13} /> IA ({conversations.filter(c => !c.isHumanMode).length})
            </button>
          </div>

          {/* Conversations Scrollable List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '30px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay conversaciones activas.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedJid === conv.remoteJid;
                return (
                  <div
                    key={conv.remoteJid}
                    onClick={() => setSelectedJid(conv.remoteJid)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: conv.isHumanMode ? '#fef3c7' : '#dcfce7',
                      color: conv.isHumanMode ? '#b45309' : '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}>
                      {conv.pushName.slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {conv.pushName}
                        </strong>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {formatMessageTime(conv.lastTimestamp)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Phone size={11} /> +{conv.cleanPhone}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {conv.lastMessage}
                        </p>

                        {conv.isHumanMode ? (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <User size={10} /> Pausada
                          </span>
                        ) : (
                          <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Bot size={10} /> IA Activa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Chat Thread View */}
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#efeae2', overflow: 'hidden' }}>
            
            {/* Chat Top Bar */}
            <div style={{ padding: '12px 18px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: selectedConv.isHumanMode ? '#fef3c7' : '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: selectedConv.isHumanMode ? '#b45309' : '#15803d' }}>
                  {selectedConv.pushName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b' }}>{selectedConv.pushName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>+{selectedConv.cleanPhone}</span>
                    <a
                      href={`https://wa.me/${selectedConv.cleanPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}
                    >
                      <ExternalLink size={12} /> Abrir WhatsApp Web
                    </a>
                  </div>
                </div>
              </div>

              {/* Mode Toggle Button with Lucide Icons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleToggleHumanMode(selectedConv.remoteJid, selectedConv.isHumanMode)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: selectedConv.isHumanMode ? '#fecaca' : '#bbf7d0',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: selectedConv.isHumanMode ? '#fef2f2' : '#f0fdf4',
                    color: selectedConv.isHumanMode ? '#dc2626' : '#16a34a',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  title="Presiona para pausar o activar la IA para este cliente"
                >
                  {selectedConv.isHumanMode ? (
                    <>
                      <UserCheck size={16} /> Modo Humano (IA Pausada) — Toca para Reactivar IA
                    </>
                  ) : (
                    <>
                      <Bot size={16} /> IA Activa — Toca para Pausar IA (Modo Humano)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chat Thread Messages */}
            <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedConv.messages.map((m, idx) => {
                const isFromMe = m.fromMe;
                const isAI = m.aiResponse || m.pushName === 'Asistente IA';
                const hasLocation = m.messageText.includes('http');

                return (
                  <div
                    key={m.id || idx}
                    style={{
                      alignSelf: isFromMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      backgroundColor: isFromMe ? '#dcf8c6' : '#ffffff',
                      borderRadius: isFromMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      padding: '10px 14px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    {/* Header Tag for AI */}
                    {isFromMe && isAI && (
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bot size={12} /> Asistente IA
                      </div>
                    )}

                    <div style={{ fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {m.messageText}
                    </div>

                    <div style={{ fontSize: '0.65rem', color: '#64748b', alignSelf: 'flex-end', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span>{formatMessageTime(m.createdAt)}</span>
                      {isFromMe && <CheckCircle2 size={12} color="#16a34a" />}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Reply Bar */}
            <form onSubmit={handleSendReply} style={{ padding: '12px 16px', backgroundColor: '#f0f2f5', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={`Escribir respuesta manual a ${selectedConv.pushName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.9rem', outline: 'none' }}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={16} /> {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#f8fafc', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <MessageSquare size={48} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Selecciona una conversación</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Elige un chat de la lista izquierda para ver el historial y responder.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
