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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevJidRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);
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
          const cleanPhone = (m.remoteJid || '').replace(/@.+$/, '').replace(/\D/g, '');
          const formattedPhone = cleanPhone ? `+${cleanPhone}` : 'Cliente';

          if (!map.has(m.remoteJid)) {
            const isBot = m.fromMe || m.pushName === 'Asistente IA' || m.pushName === 'Bot' || m.pushName === 'Sistema';
            const initialName = (!isBot && m.pushName && m.pushName.trim() !== '') ? m.pushName.trim() : formattedPhone;

            map.set(m.remoteJid, {
              remoteJid: m.remoteJid,
              pushName: initialName,
              cleanPhone,
              lastMessage: m.messageText,
              lastTimestamp: String(m.createdAt || ''),
              isHumanMode: sessions[m.remoteJid]?.isHumanMode || false,
              messages: []
            });
          }

          const conv = map.get(m.remoteJid)!;
          // When a real customer message is encountered with a valid name, prioritize it
          if (!m.fromMe && m.pushName && m.pushName.trim() !== '' && m.pushName !== 'Asistente IA' && m.pushName !== 'Bot' && m.pushName !== 'Sistema') {
            conv.pushName = m.pushName.trim();
          }
          conv.messages.push(m);
        });

        map.forEach(conv => {
          conv.messages.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
          if (conv.messages.length > 0) {
            const last = conv.messages[conv.messages.length - 1];
            conv.lastMessage = last.messageText;
            conv.lastTimestamp = String(last.createdAt || '');
          }
          // Safeguard: Ensure pushName is never 'Asistente IA' or 'Bot'
          if (!conv.pushName || conv.pushName === 'Asistente IA' || conv.pushName === 'Bot' || conv.pushName === 'Sistema') {
            conv.pushName = conv.cleanPhone ? `+${conv.cleanPhone}` : 'Cliente';
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

  // Polling in background every 4s without disrupting user scroll
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadChats(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedJid]);

  // Scroll to bottom only on conversation change or when new messages arrive and user is near bottom
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return;
    const el = messagesContainerRef.current;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (force || isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (selectedJid !== prevJidRef.current) {
      prevJidRef.current = selectedJid;
      setTimeout(() => scrollToBottom(true), 50);
    }
  }, [selectedJid]);

  useEffect(() => {
    const currentConv = conversations.find(c => c.remoteJid === selectedJid);
    const count = currentConv?.messages?.length || 0;
    if (count > prevMessageCountRef.current) {
      prevMessageCountRef.current = count;
      scrollToBottom(false);
    }
  }, [conversations, selectedJid]);

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
      setTimeout(() => scrollToBottom(true), 100);
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

  const formatMessageTime = (date?: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && conversations.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando bandeja de WhatsApp...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>Bandeja de WhatsApp en Vivo</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitorea conversaciones, responde manualmente y controla el modo humano / IA
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadChats()}
            style={{ padding: '8px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresco (4s)</span>
          </label>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div style={{ flex: 1, backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '360px 1fr', overflow: 'hidden', minHeight: 0 }}>
        
        {/* Left Column: Contact List */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#ffffff', overflow: 'hidden' }}>
          
          {/* Search Box */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Buscar cliente, número o mensaje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: '#f8fafc' }}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', padding: '4px 8px', gap: '4px' }}>
            <button
              onClick={() => setFilterTab('all')}
              style={{
                flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                backgroundColor: filterTab === 'all' ? '#ffffff' : 'transparent',
                color: filterTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: filterTab === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Todos ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('human')}
              style={{
                flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                backgroundColor: filterTab === 'human' ? '#ffffff' : 'transparent',
                color: filterTab === 'human' ? '#d97706' : 'var(--text-muted)',
                boxShadow: filterTab === 'human' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              👤 Modo Humano ({conversations.filter(c => c.isHumanMode).length})
            </button>
            <button
              onClick={() => setFilterTab('ai')}
              style={{
                flex: 1, padding: '6px', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                backgroundColor: filterTab === 'ai' ? '#ffffff' : 'transparent',
                color: filterTab === 'ai' ? '#16a34a' : 'var(--text-muted)',
                boxShadow: filterTab === 'ai' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              🤖 IA Activa ({conversations.filter(c => !c.isHumanMode).length})
            </button>
          </div>

          {/* Conversations Scroll List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay conversaciones que coincidan.
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = c.remoteJid === selectedJid;

                return (
                  <div
                    key={c.remoteJid}
                    onClick={() => setSelectedJid(c.remoteJid)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
                      transition: 'background-color 0.15s',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      backgroundColor: c.isHumanMode ? '#fef3c7' : '#dcfce7',
                      color: c.isHumanMode ? '#b45309' : '#15803d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '0.9rem', flexShrink: 0
                    }}>
                      {c.pushName.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.pushName}
                        </strong>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {formatMessageTime(c.lastTimestamp)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                        {c.lastMessage}
                      </div>

                      {/* Status Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {c.isHumanMode ? (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <User size={10} /> Modo Humano
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
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
                      <UserCheck size={16} /> Modo Humano Activo — Toca para Reactivar IA
                    </>
                  ) : (
                    <>
                      <Bot size={16} /> IA Activa — Toca para Pausar IA (Modo Humano)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Chat Thread Messages (with ref attached) */}
            <div ref={messagesContainerRef} style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedConv.messages.map((m, idx) => {
                const isFromMe = m.fromMe;
                const isAI = m.aiResponse || m.pushName === 'Asistente IA';

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
                  cursor: sending || !replyText.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: sending || !replyText.trim() ? 0.6 : 1
                }}
              >
                <Send size={15} />
                <span>{sending ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Selecciona una conversación para ver los mensajes
          </div>
        )}
      </div>
    </div>
  );
}
