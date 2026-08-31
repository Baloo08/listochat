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
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#bfdbfe',
      textColor: '#1d4ed8'
    },
    {
      label: 'Reservas para Hoy',
      value: stats.appointments,
      icon: <Calendar size={22} color="#059669" />,
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '#a7f3d0',
      textColor: '#047857'
    },
    {
      label: 'Órdenes Nuevas Hoy',
      value: stats.orders,
      icon: <ShoppingBag size={22} color="#7c3aed" />,
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      border: '#ddd6fe',
      textColor: '#6d28d9'
    },
    {
      label: 'Ventas del Mes (CRC)',
      value: `₡${((stats?.revenue || 0)).toLocaleString()}`,
      icon: <DollarSign size={22} color="#ea580c" />,
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: '#fed7aa',
      textColor: '#c2410c'
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)' }}>Panel de Control</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Resumen operativo y métricas en tiempo real de tu negocio</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.8rem', fontWeight: '600', color: '#047857' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
          Sistema Operativo & Conectado
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {cards.map((c, i) => (
          <div 
            key={i} 
            className="hover-card"
            style={{ 
              backgroundColor: 'var(--surface)', 
              padding: '22px', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow-xs)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{c.label}</span>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)' }}>{loading ? '—' : c.value}</span>
            </div>
            <div style={{ width: '52px', height: '52px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)' }}>
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Two columns: Recent Orders & Recent Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
        {/* Recent Orders */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color="var(--primary)" />
              </div>
              Últimos Pedidos
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando pedidos...</div>
          ) : (stats?.recentOrders || []).length === 0 ? (
            <div style={{ padding: '35px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <ShoppingBag size={30} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>Sin pedidos recientes</div>
              <div style={{ fontSize: '0.8rem' }}>Los nuevos pedidos de WhatsApp o de tu tienda se mostrarán aquí.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.recentOrders || []).map((order: any) => (
                <div key={order.id} className="hover-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text)' }}>{order.customerName || 'Cliente'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Orden #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text)' }}>₡{parseFloat(order.total).toLocaleString()}</div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: '700', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-full)', 
                      backgroundColor: order.status === 'confirmed' ? '#dcfce7' : '#fef3c7', 
                      color: order.status === 'confirmed' ? '#166534' : '#92400e',
                      display: 'inline-block',
                      marginTop: '2px'
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} color="#059669" />
              </div>
              Próximas Citas y Reservas
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando citas...</div>
          ) : (stats?.recentAppointments || []).length === 0 ? (
            <div style={{ padding: '35px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
              <Calendar size={30} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: '600', marginBottom: '2px' }}>Sin citas agendadas</div>
              <div style={{ fontSize: '0.8rem' }}>Las citas agendadas por el agente de WhatsApp se reflejarán aquí automáticamente.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats?.recentAppointments || []).map((appt: any) => (
                <div key={appt.id} className="hover-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text)' }}>{appt.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{appt.service} · {appt.whatsapp}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#047857' }}>{appt.date} · {appt.time}</div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: '700', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-full)', 
                      backgroundColor: '#e0e7ff', 
                      color: '#3730a3',
                      display: 'inline-block',
                      marginTop: '2px'
                    }}>
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
