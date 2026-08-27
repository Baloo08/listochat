import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Calendar, ClipboardList, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    chats: 0,
    appointments: 0,
    orders: 0,
    revenue: 0
  });
  const api = useApi();

  useEffect(() => {
    // In a real app, these would be actual API calls
    const fetchStats = async () => {
      try {
        // Mocking API responses for now
        setStats({
          chats: 124,
          appointments: 12,
          orders: 5,
          revenue: 1250.00
        });
      } catch (err) {
        console.error('Error fetching stats', err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Chats Totales', value: stats.chats, icon: <MessageSquare size={24} color="var(--primary)" />, color: '#dbeafe' },
    { title: 'Reservas Hoy', value: stats.appointments, icon: <Calendar size={24} color="var(--success)" />, color: '#dcfce7' },
    { title: 'Órdenes Hoy', value: stats.orders, icon: <ClipboardList size={24} color="var(--warning)" />, color: '#fef3c7' },
    { title: 'Ingresos del Mes', value: `$${stats.revenue.toFixed(2)}`, icon: <DollarSign size={24} color="#8b5cf6" />, color: '#ede9fe' },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {cards.map((card, i) => (
          <div key={i} style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '15px', borderRadius: '50%', backgroundColor: card.color }}>
              {card.icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{card.title}</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '8px', color: '#991b1b' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Acciones Pendientes</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Conectar cuenta de WhatsApp (Escanea el código QR en la sección WhatsApp)</li>
          <li>Configurar proveedor de IA (Añade tu API Key en Configuración)</li>
        </ul>
      </div>
    </div>
  );
}
