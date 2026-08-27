import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Send, User, Bot, Search, Phone, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  remoteJid: string;
  pushName?: string;
  fromMe: boolean;
  messageText: string;
  aiResponse?: boolean;
  status?: string;
  createdAt: string;
}

interface Conversation {
  remoteJid: string;
  pushName: string;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}

export default function ChatsInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedJid, setSelectedJid] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const api = useApi();

  const loadChats = async () => {
    try {
      setLoading(true);
      const messages: ChatMessage[] = await api.get('/api/chats');
      if (Array.isArray(messages)) {
        // Group by remoteJid
        const map = new Map<string, Conversation>();

        messages.forEach(m => {
          if (!map.has(m.remoteJid)) {
            map.set(m.remoteJid, {
              remoteJid: m.remoteJid,
              pushName: m.pushName || m.remoteJid.replace('@s.whatsapp.net', ''),
              lastMessage: m.messageText,
              lastTimestamp: m.createdAt,
              messages: []
            });
          }
          const conv = map.get(m.remoteJid)!;
          conv.messages.push(m);
        });

        // Sort messages inside conversation by createdAt ASC
        map.forEach(conv => {
          conv.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          if (conv.messages.length > 0) {
            const last = conv.messages[conv.messages.length - 1];
            conv.lastMessage = last.messageText;
            conv.lastTimestamp = last.createdAt;
          }
        });

        const convList = Array.from(map.values());
        // Sort conversations by lastTimestamp DESC
        convList.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime());

        setConversations(convList);

        if (!selectedJid && convList.length > 0) {
          setSelectedJid(convList[0].remoteJid);
        }
      }
    } catch (err) {
      console.error('Error loading chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

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
      await loadChats();
    } catch (err) {
      alert('Error enviando mensaje');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.pushName.toLowerCase().includes(search.toLowerCase()) || 
    c.remoteJid.includes(search)
  );

  const activeConversation = conversations.find(c => c.remoteJid === selectedJid);

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Bandeja de WhatsApp en Vivo</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Visualiza las conversaciones de tus clientes y responde manualmente si lo deseas</p>
        </div>
        <button 
          onClick={loadChats}
          style={{ padding: '6px 12px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Sidebar: Conversations List */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Buscar conversación..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '8px', top: '9px' }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div style={{ padding: '30px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay conversaciones registradas aún.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.remoteJid === selectedJid;
                const phone = conv.remoteJid.replace('@s.whatsapp.net', '');
                return (
                  <div 
                    key={conv.remoteJid}
                    onClick={() => setSelectedJid(conv.remoteJid)}
                    style={{ 
                      padding: '12px 14px', 
                      borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'inherit' }}>
                        {conv.pushName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{phone}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Message Thread */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f8fafc' }}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div style={{ padding: '12px 20px', backgroundColor: 'white', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {activeConversation.pushName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{activeConversation.pushName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeConversation.remoteJid.replace('@s.whatsapp.net', '')}</div>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${activeConversation.remoteJid.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Phone size={14} /> Abrir en WhatsApp
                </a>
              </div>

              {/* Messages Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeConversation.messages.map((msg, i) => {
                  const isMe = msg.fromMe;
                  const isAi = msg.aiResponse;
                  return (
                    <div 
                      key={msg.id || i}
                      style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ 
                        padding: '10px 14px', 
                        borderRadius: '12px',
                        backgroundColor: isMe ? (isAi ? '#2563eb' : '#0f766e') : 'white',
                        color: isMe ? 'white' : '#1e293b',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                        fontSize: '0.9rem',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.messageText}
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: 'var(--text-muted)', 
                        marginTop: '3px',
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isMe && (isAi ? <Bot size={11} /> : <User size={11} />)}
                        {isMe ? (isAi ? 'Betico IA' : 'Tú (Manual)') : activeConversation.pushName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Bar */}
              <form onSubmit={handleSendReply} style={{ padding: '12px 16px', backgroundColor: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Escribe una respuesta manual al cliente..." 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
                <button 
                  type="submit" 
                  disabled={sending || !replyText.trim()}
                  style={{ padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={16} /> {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Selecciona una conversación para ver el historial
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
