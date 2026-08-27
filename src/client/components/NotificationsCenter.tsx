import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';

interface Notification {
  id: string;
  recipientPhone: string;
  triggerType: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchNotifications = async () => {
    try {
      // Usar endpoint genérico para obtener la lista
      const res = await fetch('/api/notifications', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Bell size={24} /> Historial de Notificaciones
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background)', padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Buscar por número..." 
            style={{ border: 'none', background: 'transparent', marginLeft: '8px', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Cargando...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Destinatario</th>
              <th style={{ padding: '12px' }}>Tipo de Evento</th>
              <th style={{ padding: '12px' }}>Fecha y Hora</th>
              <th style={{ padding: '12px' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay notificaciones recientes.</td>
              </tr>
            ) : (
              notifications.map(notif => (
                <tr key={notif.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{notif.recipientPhone}</td>
                  <td style={{ padding: '12px' }}>{notif.triggerType}</td>
                  <td style={{ padding: '12px' }}>{new Date(notif.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', 
                      backgroundColor: notif.status === 'sent' ? '#dcfce7' : (notif.status === 'failed' ? '#fee2e2' : '#fef3c7'),
                      color: notif.status === 'sent' ? '#166534' : (notif.status === 'failed' ? '#991b1b' : '#92400e')
                    }}>
                      {notif.status === 'sent' ? 'Enviado' : (notif.status === 'failed' ? 'Fallido' : 'Pendiente')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
