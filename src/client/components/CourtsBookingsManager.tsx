import React, { useState, useEffect } from 'react';
import { 
  Calendar, Trophy, Users, DollarSign, Clock, CheckCircle2, 
  XCircle, AlertCircle, Phone, Search, Filter, Eye, RefreshCw, 
  ChevronLeft, ChevronRight, ShieldCheck, Check, SlidersHorizontal
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking } from '../../shared/types';

export default function CourtsBookingsManager() {
  const [bookings, setBookings] = useState<CourtBooking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Views & Filters
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_pay' | 'paid' | 'seeking' | 'matched' | 'confirmed' | 'cancelled'>('all');
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected detail modal
  const [selectedBooking, setSelectedBooking] = useState<CourtBooking | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const api = useApi();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData] = await Promise.all([
        api.get('/api/courts/bookings'),
        api.get('/api/courts')
      ]);
      if (bData) setBookings(bData);
      if (cData) setCourts(cData);
    } catch (error) {
      console.error('Error loading courts bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePaymentA = async (b: CourtBooking) => {
    setUpdatingId(b.id);
    try {
      await api.put(`/api/courts/bookings/${b.id}`, { teamAPaid: !b.teamAPaid });
      setBookings(prev => prev.map(item => item.id === b.id ? { ...item, teamAPaid: !b.teamAPaid } : item));
      if (selectedBooking?.id === b.id) {
        setSelectedBooking(prev => prev ? { ...prev, teamAPaid: !b.teamAPaid } : null);
      }
    } catch (error) {
      alert('Error al actualizar estado de pago');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePaymentB = async (b: CourtBooking) => {
    setUpdatingId(b.id);
    try {
      await api.put(`/api/courts/bookings/${b.id}`, { teamBPaid: !b.teamBPaid });
      setBookings(prev => prev.map(item => item.id === b.id ? { ...item, teamBPaid: !b.teamBPaid } : item));
      if (selectedBooking?.id === b.id) {
        setSelectedBooking(prev => prev ? { ...prev, teamBPaid: !b.teamBPaid } : null);
      }
    } catch (error) {
      alert('Error al actualizar estado de pago');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;
    setUpdatingId(id);
    try {
      await api.del(`/api/courts/bookings/${id}`);
      setBookings(prev => prev.map(item => item.id === id ? { ...item, status: 'cancelled' } : item));
      if (selectedBooking?.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (error) {
      alert('Error al cancelar reserva');
    } finally {
      setUpdatingId(null);
    }
  };

  const openWhatsApp = (phone: string, text: string) => {
    const clean = phone.replace(/\D/g, '');
    if (!clean) return;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // KPIs
  const totalBookings = bookings.length;
  const pendingPayCount = bookings.filter(b => b.status !== 'cancelled' && (!b.teamAPaid || (b.teamBName && !b.teamBPaid))).length;
  const fullyPaidCount = bookings.filter(b => b.status !== 'cancelled' && b.teamAPaid && (!b.teamBName || b.teamBPaid)).length;
  const openMatchesCount = bookings.filter(b => b.status !== 'cancelled' && b.matchStatus === 'open').length;

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (selectedCourtFilter !== 'all' && b.courtId !== selectedCourtFilter) return false;
    
    if (statusFilter === 'pending_pay') {
      if (b.status === 'cancelled') return false;
      const isPending = !b.teamAPaid || (b.teamBName && !b.teamBPaid);
      if (!isPending) return false;
    } else if (statusFilter === 'paid') {
      if (b.status === 'cancelled') return false;
      const isPaid = b.teamAPaid && (!b.teamBName || b.teamBPaid);
      if (!isPaid) return false;
    } else if (statusFilter === 'seeking') {
      if (b.matchStatus !== 'open' || b.status === 'cancelled') return false;
    } else if (statusFilter === 'matched') {
      if (b.matchStatus !== 'matched' || b.status === 'cancelled') return false;
    } else if (statusFilter === 'confirmed') {
      if (b.status !== 'confirmed') return false;
    } else if (statusFilter === 'cancelled') {
      if (b.status !== 'cancelled') return false;
    }

    if (viewMode === 'calendar') {
      if (b.date !== selectedDate) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCourt = (b.courtName || '').toLowerCase().includes(q);
      const matchTeamA = (b.teamAName || '').toLowerCase().includes(q) || (b.teamACaptain || '').toLowerCase().includes(q);
      const matchTeamB = (b.teamBName || '').toLowerCase().includes(q) || (b.teamBCaptain || '').toLowerCase().includes(q);
      const matchDate = (b.date || '').includes(q);
      if (!matchCourt && !matchTeamA && !matchTeamB && !matchDate) return false;
    }

    return true;
  });

  const getStatusBadge = (b: CourtBooking) => {
    if (b.status === 'cancelled') {
      return <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>Cancelado</span>;
    }
    if (b.matchStatus === 'open') {
      return <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>Esperando Reto</span>;
    }
    if (b.matchStatus === 'matched') {
      return <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>Reto Aceptado</span>;
    }
    return <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>Confirmado</span>;
  };

  const getPaymentBadge = (b: CourtBooking) => {
    if (b.status === 'cancelled') return null;
    const isPaid = b.teamAPaid && (!b.teamBName || b.teamBPaid);
    const isPartial = (b.teamAPaid && !b.teamBPaid) || (!b.teamAPaid && b.teamBPaid);
    
    if (isPaid) {
      return <span style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>Pagado Completo</span>;
    }
    if (isPartial) {
      return <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>Pago Parcial (1 Eq.)</span>;
    }
    return <span style={{ backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>Pendiente Pago</span>;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)' }}>
            Reservas Deportivas
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Control de partidos, pagos por equipo, retadores y agenda deportiva.
          </p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text)',
              fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <SlidersHorizontal size={15} /> Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
              color: viewMode === 'calendar' ? 'white' : 'var(--text)',
              fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Calendar size={15} /> Calendario
          </button>
          <button
            type="button"
            onClick={loadData}
            title="Actualizar datos"
            style={{
              padding: '8px', borderRadius: '8px', border: 'none', background: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div 
          onClick={() => setStatusFilter('all')}
          style={{ 
            backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', 
            border: `1.5px solid ${statusFilter === 'all' ? 'var(--primary)' : 'var(--border)'}`, 
            cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Total Reservas</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text)' }}>{totalBookings}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending_pay')}
          style={{ 
            backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', 
            border: `1.5px solid ${statusFilter === 'pending_pay' ? '#ea580c' : 'var(--border)'}`, 
            cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', marginBottom: '6px' }}>Pendientes Pago</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ea580c' }}>{pendingPayCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('paid')}
          style={{ 
            backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', 
            border: `1.5px solid ${statusFilter === 'paid' ? '#059669' : 'var(--border)'}`, 
            cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#059669', textTransform: 'uppercase', marginBottom: '6px' }}>100% Pagados</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#059669' }}>{fullyPaidCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('seeking')}
          style={{ 
            backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', 
            border: `1.5px solid ${statusFilter === 'seeking' ? '#d97706' : 'var(--border)'}`, 
            cursor: 'pointer', transition: 'all 0.2s' 
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', marginBottom: '6px' }}>Esperando Reto</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#d97706' }}>{openMatchesCount}</div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div style={{ 
        backgroundColor: 'var(--surface)', padding: '14px', borderRadius: '12px', 
        border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', 
        flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' 
      }}>
        
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por equipo, capitán, cancha o fecha..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px',
              border: '1px solid var(--border)', backgroundColor: 'var(--background)',
              color: 'var(--text)', fontSize: '0.85rem', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Status Dropdown Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={{
              padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)',
              backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600'
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="pending_pay">⏳ Pendientes de Pago</option>
            <option value="paid">✅ 100% Pagados</option>
            <option value="seeking">⚔️ Esperando Reto</option>
            <option value="matched">🎾 Reto Aceptado</option>
            <option value="confirmed">Confirmados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          {/* Court Filter */}
          <select
            value={selectedCourtFilter}
            onChange={e => setSelectedCourtFilter(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)',
              backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600'
            }}
          >
            <option value="all">Todas las canchas</option>
            {courts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Calendar Day Picker (when calendar mode) */}
        {viewMode === 'calendar' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.85rem', fontWeight: '700'
              }}
            />
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', cursor: 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              style={{
                padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--primary)',
                backgroundColor: 'transparent', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Hoy
            </button>
          </div>
        )}
      </div>

      {/* CONTENT: LIST VIEW */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBookings.length === 0 ? (
            <div style={{ backgroundColor: 'var(--surface)', padding: '50px 20px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              <Trophy size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)', marginBottom: '4px' }}>No hay reservas con los filtros aplicados</div>
              <div style={{ fontSize: '0.85rem' }}>Prueba ajustando los filtros de estado o fecha.</div>
            </div>
          ) : (
            filteredBookings.map(b => {
              const total = Number(b.totalPrice || 0);
              const perTeam = b.pricePerTeam || (total / 2);

              return (
                <div
                  key={b.id}
                  style={{
                    backgroundColor: 'var(--surface)', borderRadius: '12px',
                    border: '1px solid var(--border)', padding: '16px 20px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    transition: 'border-color 0.2s'
                  }}
                >
                  {/* Top Bar: Court + Date/Time + Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>
                        {b.courtName || 'Cancha'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                        <Calendar size={14} /> {b.date}
                        <Clock size={14} style={{ marginLeft: '6px' }} /> {b.time.substring(0, 5)} ({b.durationMinutes} min)
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(b)}
                      {getPaymentBadge(b)}
                    </div>
                  </div>

                  {/* Middle Content: Teams & Payment Controls */}
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '12px', backgroundColor: 'var(--bg-elevated)', padding: '12px 14px', 
                    borderRadius: '10px', border: '1px solid var(--border)' 
                  }}>
                    
                    {/* Team A */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                          Equipo A {b.bookingMode === 'seek_match' ? '(Retador)' : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePaymentA(b)}
                          disabled={updatingId === b.id || b.status === 'cancelled'}
                          style={{
                            padding: '3px 8px', borderRadius: '6px', border: 'none',
                            backgroundColor: b.teamAPaid ? '#dcfce7' : '#fee2e2',
                            color: b.teamAPaid ? '#15803d' : '#dc2626',
                            fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          {b.teamAPaid ? <Check size={12} /> : <XCircle size={12} />}
                          {b.teamAPaid ? 'Pagado' : 'Pendiente'}
                        </button>
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text)' }}>
                        {b.teamAName || 'Equipo A'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Capitán: <strong>{b.teamACaptain}</strong> · Tel: <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => openWhatsApp(b.teamAPhone, `Hola ${b.teamACaptain}, te contacto de la cancha sobre tu reserva del ${b.date} a las ${b.time}.`)}>{b.teamAPhone}</span>
                      </div>
                    </div>

                    {/* Team B or Seek Match Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                      {b.bookingMode === 'seek_match' && !b.teamBName ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center', height: '100%' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase' }}>
                            ⚔️ Busca Reto Abierto
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Nivel: <strong>{b.skillLevel || 'Cualquiera'}</strong>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#d97706' }}>
                            Publicado en página web esperando retador
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
                              Equipo B {b.matchStatus === 'matched' ? '(Aceptó Reto)' : ''}
                            </span>
                            {b.teamBName && (
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentB(b)}
                                disabled={updatingId === b.id || b.status === 'cancelled'}
                                style={{
                                  padding: '3px 8px', borderRadius: '6px', border: 'none',
                                  backgroundColor: b.teamBPaid ? '#dcfce7' : '#fee2e2',
                                  color: b.teamBPaid ? '#15803d' : '#dc2626',
                                  fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                {b.teamBPaid ? <Check size={12} /> : <XCircle size={12} />}
                                {b.teamBPaid ? 'Pagado' : 'Pendiente'}
                              </button>
                            )}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text)' }}>
                            {b.teamBName || 'Por asignar'}
                          </div>
                          {b.teamBCaptain && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Capitán: <strong>{b.teamBCaptain}</strong> · Tel: <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => openWhatsApp(b.teamBPhone || '', `Hola ${b.teamBCaptain}, te contacto de la cancha sobre tu partido del ${b.date} a las ${b.time}.`)}>{b.teamBPhone}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Footer: Price + Quick Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Monto Total:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>₡{total.toLocaleString()}</span>
                      {b.bookingMode === 'seek_match' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>(₡{perTeam.toLocaleString()} por equipo)</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        style={{
                          padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-elevated)', color: 'var(--text)', fontSize: '0.8rem',
                          fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                        }}
                      >
                        <Eye size={14} /> Detalle
                      </button>

                      {b.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b.id)}
                          style={{
                            padding: '7px 12px', borderRadius: '8px', border: '1px solid #fecaca',
                            backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '0.8rem',
                            fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENT: CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>
              Horarios para el {selectedDate}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {filteredBookings.length} reserva(s) programada(s)
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {courts.map(court => {
              const courtBookings = filteredBookings.filter(b => b.courtId === court.id);
              return (
                <div key={court.id} style={{ backgroundColor: 'var(--bg-elevated)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '800', fontSize: '1.0rem', color: 'var(--text)', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                    {court.name}
                  </div>

                  {courtBookings.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '20px 0', textAlign: 'center' }}>
                      Sin reservas hoy
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {courtBookings.map(b => (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            padding: '10px', borderRadius: '8px', cursor: 'pointer',
                            backgroundColor: b.status === 'cancelled' ? '#f1f5f9' : b.matchStatus === 'open' ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${b.status === 'cancelled' ? '#cbd5e1' : b.matchStatus === 'open' ? '#fcd34d' : '#86efac'}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a' }}>{b.time.substring(0, 5)}</span>
                            {getStatusBadge(b)}
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155' }}>
                            {b.teamAName} {b.teamBName ? `vs ${b.teamBName}` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            ₡{Number(b.totalPrice).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedBooking && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: '16px', maxWidth: '520px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>Detalle de Reserva</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cancha:</span>
                <strong style={{ color: 'var(--text)' }}>{selectedBooking.courtName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fecha & Hora:</span>
                <strong style={{ color: 'var(--text)' }}>{selectedBooking.date} a las {selectedBooking.time.substring(0, 5)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duración:</span>
                <strong style={{ color: 'var(--text)' }}>{selectedBooking.durationMinutes} minutos</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                <div>{getStatusBadge(selectedBooking)}</div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

              {/* Equipo A */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: '800', color: '#2563eb', marginBottom: '6px' }}>Equipo A</div>
                <div>Nombre: <strong>{selectedBooking.teamAName}</strong></div>
                <div>Capitán: {selectedBooking.teamACaptain}</div>
                <div>Teléfono: {selectedBooking.teamAPhone}</div>
                <div style={{ marginTop: '6px' }}>
                  Pago Equipo A: {selectedBooking.teamAPaid ? <span style={{ color: '#15803d', fontWeight: 'bold' }}>✅ Confirmado</span> : <span style={{ color: '#dc2626', fontWeight: 'bold' }}>❌ Pendiente</span>}
                </div>
              </div>

              {/* Equipo B */}
              {selectedBooking.teamBName && (
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: '800', color: '#16a34a', marginBottom: '6px' }}>Equipo B</div>
                  <div>Nombre: <strong>{selectedBooking.teamBName}</strong></div>
                  <div>Capitán: {selectedBooking.teamBCaptain}</div>
                  <div>Teléfono: {selectedBooking.teamBPhone}</div>
                  <div style={{ marginTop: '6px' }}>
                    Pago Equipo B: {selectedBooking.teamBPaid ? <span style={{ color: '#15803d', fontWeight: 'bold' }}>✅ Confirmado</span> : <span style={{ color: '#dc2626', fontWeight: 'bold' }}>❌ Pendiente</span>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '8px' }}>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>Monto Total:</span>
                <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.1rem' }}>₡{Number(selectedBooking.totalPrice).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontWeight: '700', cursor: 'pointer' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
