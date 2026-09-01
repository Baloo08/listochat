import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Clock, MessageSquare, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';

interface QueueStats {
  pendingCount: number;
  processingCount: number;
  doneTodayCount: number;
}

interface QueueMessage {
  id: string;
  remoteJid: string;
  pushName: string;
  messageText: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export default function MessageQueuePanel() {
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [stats, setStats] = useState<QueueStats>({ pendingCount: 0, processingCount: 0, doneTodayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const api = useApi();

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const tenantId = auth.tenantId || auth.user?.tenantId;

  const loadData = async (isBackground = false) => {
    if (!tenantId) return;
    try {
      if (!isBackground) setLoading(true);
      
      const [pendingRes, statsRes] = await Promise.all([
        api.get(`/api/queue/pending?tenantId=${tenantId}`),
        api.get(`/api/queue/stats?tenantId=${tenantId}`)
      ]);
      
      if (pendingRes) {
        setMessages(pendingRes.messages || []);
      }
      if (statsRes) {
        setStats(statsRes || { pendingCount: 0, processingCount: 0, doneTodayCount: 0 });
      }
    } catch (err) {
      console.error('Error loading queue data:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Setup websocket listener
    const socket = io(window.location.origin);
    if (tenantId) {
      socket.emit('join_tenant', tenantId);
    }
    socket.on('queue:updated', () => {
      loadData(true);
    });

    return () => {
      socket.disconnect();
    };
  }, [tenantId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, tenantId]);

  const getTimeInQueue = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `hace ${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `hace ${mins}min`;
    const hours = Math.floor(mins / 60);
    return `hace ${hours}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Pendiente
          </span>
        );
      case 'processing':
        return (
          <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Loader size={12} className="lucide-spin" /> Procesando
          </span>
        );
      case 'done':
        return (
          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} /> Completado
          </span>
        );
      case 'failed':
        return (
          <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Fallido
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && messages.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando cola de mensajes...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={24} color="var(--primary)" /> Mensajes por contestar
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Monitorea los mensajes que están en cola esperando ser procesados por la IA
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => loadData()}
            style={{ padding: '8px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500' }}
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresco (5s)</span>
          </label>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Pendientes
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#b45309' }}>{stats.pendingCount || 0}</span>
        </div>
        
        <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Loader size={16} /> Procesando
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1d4ed8' }}>{stats.processingCount || 0}</span>
        </div>
        
        <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} /> Completados hoy
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>{stats.doneTodayCount || 0}</span>
        </div>
      </div>

      {/* Messages List */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Cola actual</h3>
        </div>
        
        {messages.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={32} color="#15803d" />
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>✅ No hay mensajes en cola</span>
            <span style={{ fontSize: '0.9rem' }}>Todos los mensajes han sido procesados o la cola está vacía.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {messages.map(msg => {
              const cleanPhone = (msg.remoteJid || '').replace(/@.+$/, '').replace(/\D/g, '');
              const formattedPhone = cleanPhone ? `+${cleanPhone}` : 'Cliente';
              const displayName = (msg.pushName && msg.pushName.trim() !== '') ? msg.pushName : formattedPhone;
              const truncatedMessage = msg.messageText?.length > 80 ? msg.messageText.substring(0, 80) + '...' : msg.messageText;

              return (
                <div key={msg.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', backgroundColor: msg.status === 'processing' ? '#f0fdf4' : 'transparent' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{displayName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{formattedPhone}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      "{truncatedMessage}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      {getStatusBadge(msg.status)}
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {getTimeInQueue(msg.createdAt)}
                      </span>
                    </div>
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
