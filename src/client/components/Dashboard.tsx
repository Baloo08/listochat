import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
  MessageSquare, Calendar, ShoppingBag, DollarSign, Clock,
  Filter, CheckCircle2, TrendingUp, Sparkles, CreditCard, ChevronRight, CalendarDays
} from 'lucide-react';
import { formatShortDate, formatShortTime, getLocalDateString } from '../../shared/formatters';

interface DashboardStats {
  range?: string;
  fromDate?: string | null;
  toDate?: string | null;
  chats: number;
  appointments: number;
  appointmentsCompleted?: number;
  orders: number;
  ordersPaid?: number;
  appointmentRevenue?: number;
  orderRevenue?: number;
  courtRevenue?: number;
  courtBookingsCount?: number;
  totalRevenue?: number;
  revenue: number;
  pendingOrders: number;
  recentOrders: any[];
  recentAppointments: any[];
}

type RangeOption = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    chats: 0,
    appointments: 0,
    appointmentsCompleted: 0,
    orders: 0,
    ordersPaid: 0,
    appointmentRevenue: 0,
    orderRevenue: 0,
    totalRevenue: 0,
    revenue: 0,
    pendingOrders: 0,
    recentOrders: [],
    recentAppointments: []
  });
  const [loading, setLoading] = useState(true);

  // Date Range Filtering State
  const [rangeMode, setRangeMode] = useState<RangeOption>('today');
  const [customFrom, setCustomFrom] = useState(getLocalDateString());
  const [customTo, setCustomTo] = useState(getLocalDateString());

  const api = useApi();

  const fetchStats = async (mode: RangeOption = rangeMode, from?: string, to?: string) => {
    try {
      setLoading(true);
      let url = `/api/dashboard/stats?range=${mode}`;
      if (mode === 'custom') {
        const f = from || customFrom;
        const t = to || customTo;
        if (f) url += `&fromDate=${f}`;
        if (t) url += `&toDate=${t}`;
      }
      const data = await api.get(url);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(rangeMode);
  }, []);

  const handleRangeChange = (newMode: RangeOption) => {
    setRangeMode(newMode);
    if (newMode !== 'custom') {
      fetchStats(newMode);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats('custom', customFrom, customTo);
  };

  const appointmentRevenue = stats.appointmentRevenue || 0;
  const orderRevenue = stats.orderRevenue || 0;
  const courtRevenue = stats.courtRevenue || 0;
  const totalRevenue = stats.totalRevenue ?? (appointmentRevenue + orderRevenue + courtRevenue);

  // Percent distribution
  const totalSumForDistribution = (appointmentRevenue + orderRevenue) || 1;
  const apptPercent = Math.round((appointmentRevenue / totalSumForDistribution) * 100);
  const orderPercent = 100 - apptPercent;

  // Dynamic Card Title Labels
  const getPeriodSuffix = () => {
    switch (rangeMode) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      case 'all': return 'Histórico';
      case 'custom': return 'en Período';
      default: return '';
    }
  };

  const periodLabel = getPeriodSuffix();

  const cards = [
    {
      label: `Ingresos Totales (${periodLabel})`,
      value: `₡${Math.round(totalRevenue).toLocaleString('es-CR')}`,
      subtitle: (
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          <strong>₡{Math.round(appointmentRevenue).toLocaleString('es-CR')}</strong> Reservas · <strong>₡{Math.round(orderRevenue).toLocaleString('es-CR')}</strong> Tienda
        </span>
      ),
      icon: <DollarSign size={24} color="#ea580c" />,
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      border: '#fed7aa',
      textColor: '#c2410c'
    },
    {
      label: `Reservas & Citas (${periodLabel})`,
      value: `${stats.appointments}`,
      subtitle: (
        <span style={{ fontSize: '0.75rem', color: '#047857' }}>
          <strong>{stats.appointmentsCompleted || 0}</strong> completadas · <strong>₡{Math.round(appointmentRevenue).toLocaleString('es-CR')}</strong> recaudado
        </span>
      ),
      icon: <Calendar size={24} color="#059669" />,
      bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      border: '#a7f3d0',
      textColor: '#047857'
    },
    {
      label: `Pedidos de Tienda (${periodLabel})`,
      value: `${stats.orders}`,
      subtitle: (
        <span style={{ fontSize: '0.75rem', color: '#6d28d9' }}>
          <strong>{stats.ordersPaid || 0}</strong> pagadas · <strong>₡{Math.round(orderRevenue).toLocaleString('es-CR')}</strong> vendidos
        </span>
      ),
      icon: <ShoppingBag size={24} color="#7c3aed" />,
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      border: '#ddd6fe',
      textColor: '#6d28d9'
    },
    {
      label: `Clientes Atendidos (${periodLabel})`,
      value: `${stats.chats}`,
      subtitle: (
        <span style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
          Contactos únicos por WhatsApp
        </span>
      ),
      icon: <MessageSquare size={24} color="#2563eb" />,
      bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      border: '#bfdbfe',
      textColor: '#1d4ed8'
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)' }}>
            Panel de Control
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Rendimiento financiero y métricas operativas de reservas y ventas en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', fontSize: '0.8rem', fontWeight: '600', color: '#047857' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
          Sistema Operativo & Conectado
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: '14px 18px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
              <Filter size={15} color="var(--primary)" /> Período:
            </span>

            {[
              { id: 'today', label: 'Hoy' },
              { id: 'week', label: 'Esta Semana' },
              { id: 'month', label: 'Este Mes' },
              { id: 'year', label: 'Este Año' },
              { id: 'all', label: 'Todo el Histórico' },
              { id: 'custom', label: 'Personalizado' },
            ].map(opt => {
              const isSelected = rangeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleRangeChange(opt.id as RangeOption)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--background)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Current Date Range Display Badge */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays size={14} />
            <span>
              {stats.fromDate && stats.toDate ? (
                stats.fromDate === stats.toDate ? (
                  <>Fecha: <strong>{formatShortDate(stats.fromDate)}</strong></>
                ) : (
                  <>Desde <strong>{formatShortDate(stats.fromDate)}</strong> hasta <strong>{formatShortDate(stats.toDate)}</strong></>
                )
              ) : (
                <>Mostrando <strong>todo el histórico</strong> registrado</>
              )}
            </span>
          </div>

        </div>

        {/* Custom Range Inputs Drawer */}
        {rangeMode === 'custom' && (
          <form onSubmit={handleApplyCustomRange} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>Desde:</label>
              <input
                type="date"
                required
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text)' }}>Hasta:</label>
              <input
                type="date"
                required
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Consultando...' : 'Aplicar Filtro'}
            </button>
          </form>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '24px' }}>
        {cards.map((c, i) => (
          <div 
            key={i} 
            className="hover-card"
            style={{ 
              backgroundColor: 'var(--surface)', 
              padding: '20px', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border)', 
              boxShadow: 'var(--shadow-xs)', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {c.label}
                </span>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text)' }}>
                  {loading ? '—' : c.value}
                </span>
              </div>
              <div style={{ width: '48px', height: '48px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-xs)', flexShrink: 0 }}>
                {c.icon}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
              {c.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Breakdown & Financial Balance Banner */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
              <TrendingUp size={18} color="#ea580c" />
              Desglose de Ingresos Recaudados ({periodLabel})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Comparativa entre cobros de servicios agendados y ventas de productos en tu tienda
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', fontWeight: '600' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#059669', display: 'inline-block' }}></span>
              <span>Reservas: <strong>{apptPercent}%</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#7c3aed', display: 'inline-block' }}></span>
              <span>Tienda: <strong>{orderPercent}%</strong></span>
            </div>
          </div>
        </div>

        {/* Visual Percentage Distribution Bar */}
        <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
          <div style={{ width: `${apptPercent}%`, backgroundColor: '#059669', transition: 'width 0.4s ease' }} title={`Reservas: ${apptPercent}%`}></div>
          <div style={{ width: `${orderPercent}%`, backgroundColor: '#7c3aed', transition: 'width 0.4s ease' }} title={`Tienda: ${orderPercent}%`}></div>
        </div>

        {/* Two Mini Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#166534" /> Servicios & Reservas
              </span>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                {stats.appointmentsCompleted || 0} completadas
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#166534' }}>
              ₡{Math.round(appointmentRevenue).toLocaleString('es-CR')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
              {stats.appointmentsCompleted ? (
                <>Ticket promedio: ₡{Math.round(appointmentRevenue / stats.appointmentsCompleted).toLocaleString('es-CR')} por cita</>
              ) : (
                <>Sin citas completadas registradas en el período</>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={15} color="#6b21a8" /> Catálogo & Tienda Online
              </span>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                {stats.ordersPaid || 0} pagadas
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#6b21a8' }}>
              ₡{Math.round(orderRevenue).toLocaleString('es-CR')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#7e22ce', marginTop: '2px' }}>
              {stats.ordersPaid ? (
                <>Ticket promedio: ₡{Math.round(orderRevenue / stats.ordersPaid).toLocaleString('es-CR')} por pedido</>
              ) : (
                <>Sin órdenes pagadas registradas en el período</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Recent Orders & Recent Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        
        {/* Recent Orders */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color="var(--primary)" />
              </div>
              Últimos Pedidos
            </h3>
            {stats.pendingOrders > 0 && (
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>
                {stats.pendingOrders} pendiente{stats.pendingOrders !== 1 ? 's' : ''}
              </span>
            )}
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
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Orden #{order.orderNumber} · 📅 {formatShortDate(order.createdAt)} · ⏰ {formatShortTime(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text)' }}>
                      ₡{parseFloat(order.total || 0).toLocaleString('es-CR')}
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: '700', 
                      padding: '3px 8px', 
                      borderRadius: 'var(--radius-full)', 
                      backgroundColor: (order.paymentStatus === 'paid' || order.status === 'confirmed') ? '#dcfce7' : '#fef3c7', 
                      color: (order.paymentStatus === 'paid' || order.status === 'confirmed') ? '#166534' : '#92400e',
                      display: 'inline-block',
                      marginTop: '2px'
                    }}>
                      {order.paymentStatus === 'paid' ? 'Pagado' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Appointments */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              {(stats?.recentAppointments || []).map((appt: any) => {
                const isCompleted = ['completed', 'completado', 'completada', 'realizada', 'finalizada'].includes(String(appt.status).toLowerCase());
                return (
                  <div key={appt.id} className="hover-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--text)' }}>{appt.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {appt.service} · {appt.whatsapp}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: '600', marginTop: '1px' }}>
                        📅 {formatShortDate(appt.date)} · ⏰ {formatShortTime(appt.time)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#16a34a' }}>
                        ₡{Number(appt.amount || 0).toLocaleString('es-CR')}
                      </div>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: '700', 
                        padding: '3px 8px', 
                        borderRadius: 'var(--radius-full)', 
                        backgroundColor: isCompleted ? '#dcfce7' : '#e0e7ff', 
                        color: isCompleted ? '#166534' : '#3730a3',
                        display: 'inline-block',
                        marginTop: '2px'
                      }}>
                        {isCompleted ? 'Completada' : appt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
