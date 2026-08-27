import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Calendar, ShoppingBag, DollarSign, Clock, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface DashboardStats {
  chats: number;
  appointments: number;
  orders: number;
  revenue: number;
  pendingOrders: number;
  recentOrders: any[];
  recentAppointments: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    chats: 0,
    appointments: 0,
    orders: 0,
    revenue: 0,
    pendingOrders: 0,
    recentOrders: [],
    recentAppointments: []
  });
  const [loading, setLoading] = useState(true);

  const api = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/dashboard/stats');
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: 'Clientes Atendidos Hoy',
      value: stats.chats,
      icon: <MessageSquare size={22} color="#2563eb" />,
      bg: '#eff6ff',
      border: '#bfdbfe'
    },
    {
      label: 'Reservas para Hoy',
      value: stats.appointments,
      icon: <Calendar size={22} color="#16a34a" />,
      bg: '#f0fdf4',
      border: '#bbf7d0'
    },
    {
      label: 'Órdenes Nuevas Hoy',
      value: stats.orders,
      icon: <ShoppingBag size={22} color="#7c3aed" />,
      bg: '#f5f3ff',
      border: '#ddd6fe'
    },
    {
      label: 'Ventas del Mes (CRC)',
      value: `₡${stats.revenue.toLocaleString()}`,
      icon: <DollarSign size={22} color="#ea580c" />,
      bg: '#fff7ed',
      border: '#fed7aa'
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Panel de Control</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resumen operativo y métricas en tiempo real de tu negocio</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{c.label}</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>{loading ? '—' : c.value}</span>
            </div>
            <div style={{ width: '48px', height: '48px', backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Two columns: Recent Orders & Recent Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Recent Orders */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="var(--primary)" /> Últimos Pedidos de la Tienda
          </h3>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando pedidos...</div>
          ) : stats.recentOrders.length === 0 ? (
            <div style={{ padding: '25px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No hay pedidos recientes. Los pedidos de WhatsApp o tienda aparecerán aquí.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{order.customerName || 'Cliente'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Orden #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>₡{parseFloat(order.total).toLocaleString()}</div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: order.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: order.status === 'confirmed' ? '#166534' : '#92400e' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#16a34a" /> Próximas Citas y Reservas
          </h3>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando citas...</div>
          ) : stats.recentAppointments.length === 0 ? (
            <div style={{ padding: '25px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No hay citas agendadas todavía. Tu bot de WhatsApp agendará automáticamente cuando un cliente lo solicite.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.recentAppointments.map(appt => (
                <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{appt.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{appt.service} · {appt.whatsapp}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#166534' }}>{appt.date} · {appt.time}</div>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
