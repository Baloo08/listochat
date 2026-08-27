import React, { useState, useEffect } from 'react';
import { Search, Send, Bot, User } from 'lucide-react';

interface Chat {
  id: string;
  phone: string;
  pushName: string;
  lastMessageAt: string;
  aiEnabled: boolean;
}

interface Message {
  id: string;
  fromMe: boolean;
  content: string;
  timestamp: string;
}

export default function ChatsInbox() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.phone);
    }
  }, [selectedChat]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phone: string) => {
    try {
      const res = await fetch(`/api/chats/${phone}/messages`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async () => {
    if (!reply.trim() || !selectedChat) return;
    
    try {
      const res = await fetch('/api/chats/reply', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          phone: selectedChat.phone,
          message: reply
        })
      });
      if (res.ok) {
        setMessages([...messages, { id: Date.now().toString(), fromMe: true, content: reply, timestamp: new Date().toISOString() }]);
        setReply('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleAi = async (chat: Chat) => {
    try {
      const res = await fetch('/api/chats/toggle-ai', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          phone: chat.phone,
          enabled: !chat.aiEnabled
        })
      });
      if (res.ok) {
        fetchChats();
        if (selectedChat?.phone === chat.phone) {
          setSelectedChat({ ...chat, aiEnabled: !chat.aiEnabled });
        }
      }
    } catch (error) {
      console.error('Error toggling AI:', error);
    }
  };

  const filteredChats = chats.filter(c => 
    c.pushName?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: 'var(--background)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background)', padding: '8px', borderRadius: '4px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', marginLeft: '8px', width: '100%', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid var(--border)', 
                  cursor: 'pointer',
                  backgroundColor: selectedChat?.id === chat.id ? 'var(--background)' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{chat.pushName || 'Desconocido'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{chat.phone}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleAi(chat); }}
                  title={chat.aiEnabled ? 'Desactivar IA' : 'Activar IA'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: chat.aiEnabled ? 'var(--primary)' : 'var(--text-muted)'
                  }}
                >
                  <Bot size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0 }}>{selectedChat.pushName || selectedChat.phone}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedChat.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Respuesta Automática (IA)</span>
              <button 
                onClick={() => toggleAi(selectedChat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '15px',
                  border: 'none',
                  backgroundColor: selectedChat.aiEnabled ? 'var(--primary)' : 'var(--border)',
                  color: selectedChat.aiEnabled ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Bot size={16} /> {selectedChat.aiEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div 
                key={msg.id} 
                style={{ 
                  alignSelf: msg.fromMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  backgroundColor: msg.fromMe ? '#d9fdd3' : 'white',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                <div style={{ fontSize: '0.7rem', color: 'gray', textAlign: 'right', marginTop: '5px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '15px', backgroundColor: 'var(--surface)', display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Escribe un mensaje..."
              style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid var(--border)', outline: 'none' }}
            />
            <button 
              onClick={handleSend}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white',
                border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
          Selecciona un chat para comenzar
        </div>
      )}
    </div>
  );
}
