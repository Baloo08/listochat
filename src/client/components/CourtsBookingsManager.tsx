import React, { useState, useEffect } from 'react';
import { 
  Calendar, Trophy, Users, DollarSign, Clock, CheckCircle2, 
  XCircle, AlertCircle, Phone, Search, Filter, Eye, RefreshCw, 
  ChevronLeft, ChevronRight, ShieldCheck, Check, SlidersHorizontal,
  Send, MessageSquare, Copy, Sparkles, Plus, Trash2
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Court, CourtBooking } from '../../shared/types';
import { formatFriendlyDate, formatShortDate, formatTime12h } from '../utils/dateFormat';
import { io } from 'socket.io-client';

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
  
  // Reminder Modal state
  const [reminderBooking, setReminderBooking] = useState<CourtBooking | null>(null);
  const [reminderType, setReminderType] = useState<'reservation' | 'payment'>('payment');
  const [targetTeam, setTargetTeam] = useState<'A' | 'B' | 'both'>('A');
  const [sendingReminder, setSendingReminder] = useState(false);

  // Manual Booking Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [manualCourtId, setManualCourtId] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('');
  const [manualSlots, setManualSlots] = useState<string[]>([]);
  const [manualBookingMode, setManualBookingMode] = useState<'full' | 'seek_match'>('full');
  const [manualTeamAName, setManualTeamAName] = useState('');
  const [manualTeamACaptain, setManualTeamACaptain] = useState('');
  const [manualTeamAPhone, setManualTeamAPhone] = useState('');
  const [manualTeamAPaid, setManualTeamAPaid] = useState(false);
  const [manualTeamBName, setManualTeamBName] = useState('');
  const [manualTeamBCaptain, setManualTeamBCaptain] = useState('');
  const [manualTeamBPhone, setManualTeamBPhone] = useState('');
  const [manualTeamBPaid, setManualTeamBPaid] = useState(false);
  const [manualTotalPrice, setManualTotalPrice] = useState(15000);
  const [manualNotes, setManualNotes] = useState('');

  const api = useApi();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, cData] = await Promise.all([
        api.get('/api/courts/bookings'),
        api.get('/api/courts')
      ]);
      if (bData) setBookings(bData);
      if (cData) {
        setCourts(cData);
        if (cData.length > 0 && !manualCourtId) {
          setManualCourtId(cData[0].id);
          setManualTotalPrice(Number(cData[0].basePrice || 15000));
        }
      }
    } catch (error) {
      console.error('Error loading courts bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const socket = io(window.location.origin);
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    const tenantId = auth.tenantId || auth.user?.tenantId;
    if (tenantId) {
      socket.emit('join_tenant', tenantId);
    }
    socket.on('courtBooking:created', () => {
      loadData();
    });
    socket.on('courtBooking:matched', () => {
      loadData();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch available slots when court or date changes in manual booking modal
  useEffect(() => {
    if (isManualModalOpen && manualCourtId && manualDate) {
      const fetchSlots = async () => {
        try {
          const storeRes = await api.get('/api/store');
          const slug = storeRes?.storeSlug;
          if (slug) {
            const slots = await api.get(`/api/courts/public/${slug}/available-slots?courtId=${manualCourtId}&date=${manualDate}`);
            const parsed = Array.isArray(slots) ? slots : (slots?.availableSlots || []);
            setManualSlots(parsed);
            if (parsed.length > 0 && !manualTime) {
              setManualTime(parsed[0]);
            }
          }
        } catch (e) {
          setManualSlots([]);
        }
      };
      fetchSlots();
    }
  }, [isManualModalOpen, manualCourtId, manualDate]);

  const handleOpenManualModal = () => {
    if (courts.length > 0) {
      const defaultCourt = courts[0];
      setManualCourtId(defaultCourt.id);
      setManualTotalPrice(Number(defaultCourt.basePrice || 15000));
    }
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualTime('');
    setManualBookingMode('full');
    setManualTeamAName('');
    setManualTeamACaptain('');
    setManualTeamAPhone('');
    setManualTeamAPaid(false);
    setManualTeamBName('');
    setManualTeamBCaptain('');
    setManualTeamBPhone('');
    setManualTeamBPaid(false);
    setManualNotes('');
    setIsManualModalOpen(true);
  };

  const handleCourtChange = (courtId: string) => {
    setManualCourtId(courtId);
    const selected = courts.find(c => c.id === courtId);
    if (selected) {
      setManualTotalPrice(Number(selected.basePrice || 15000));
    }
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCourtId || !manualDate || !manualTime || !manualTeamACaptain) {
      alert('Por favor completa los campos obligatorios (*)');
      return;
    }

    setCreatingBooking(true);
    try {
      const payload = {
        courtId: manualCourtId,
        date: manualDate,
        time: manualTime,
        bookingMode: manualBookingMode,
        matchStatus: manualBookingMode === 'seek_match' ? 'open' : 'confirmed',
        teamAName: manualTeamAName || 'Equipo A',
        teamACaptain: manualTeamACaptain,
        teamAPhone: manualTeamAPhone,
        teamAPaid: manualTeamAPaid,
        teamBName: manualBookingMode === 'full' ? manualTeamBName : undefined,
        teamBCaptain: manualBookingMode === 'full' ? manualTeamBCaptain : undefined,
        teamBPhone: manualBookingMode === 'full' ? manualTeamBPhone : undefined,
        teamBPaid: manualBookingMode === 'full' ? manualTeamBPaid : false,
        totalPrice: Number(manualTotalPrice),
        pricePerTeam: manualBookingMode === 'seek_match' ? Number(manualTotalPrice) / 2 : undefined,
        notes: manualNotes || undefined,
        status: 'confirmed'
      };

      const created = await api.post('/api/courts/bookings', payload);
      if (created) {
        setBookings(prev => [created, ...prev]);
        setIsManualModalOpen(false);
        alert('¡Reserva registrada con éxito!');
      }
    } catch (error) {
      alert('Error al registrar reserva');
    } finally {
      setCreatingBooking(false);
    }
  };

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

  const handleSendApiReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderBooking) return;
    
    setSendingReminder(true);
    try {
      const res = await api.post(`/api/courts/bookings/${reminderBooking.id}/send-reminder`, {
        reminderType,
        targetTeam
      });
      if (res && res.success) {
        alert(`¡Recordatorio enviado por WhatsApp exitosamente a ${res.sentCount} destinatario(s)!`);
        setReminderBooking(null);
      } else {
        alert('No se pudo enviar el mensaje por WhatsApp. Verifica la conexión en Conexión WhatsApp.');
      }
    } catch (error: any) {
      alert(error.message || 'Error al enviar recordatorio por WhatsApp');
    } finally {
      setSendingReminder(false);
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
  const openMatchesCount = bookings.filter(b => b.status !== 'cancelled' && (b.matchStatus === 'open' || (b.bookingMode === 'seek_match' && !b.teamBName))).length;

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
      if (b.status === 'cancelled' || (b.matchStatus !== 'open' && (b.bookingMode !== 'seek_match' || !!b.teamBName))) return false;
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
    if (b.matchStatus === 'open' || (b.bookingMode === 'seek_match' && !b.teamBName)) {
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
      return <span style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>100% Pagado</span>;
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
            Control de partidos, recordatorios por WhatsApp, pagos por equipo y retos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* New Manual Booking Button */}
          <button
            type="button"
            onClick={handleOpenManualModal}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800',
              fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)'
            }}
          >
            <Plus size={16} /> Nueva Reserva Manual
          </button>

          {/* View Switcher */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-elevated)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '7px 12px', borderRadius: '7px', border: 'none',
                backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'list' ? 'white' : 'var(--text)',
                fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <SlidersHorizontal size={14} /> Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '7px 12px', borderRadius: '7px', border: 'none',
                backgroundColor: viewMode === 'calendar' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'calendar' ? 'white' : 'var(--text)',
                fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
              }}
            >
              <Calendar size={14} /> Calendario
            </button>
            <button
              type="button"
              onClick={loadData}
              title="Actualizar datos"
              style={{
                padding: '7px', borderRadius: '7px', border: 'none', background: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
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
              const friendlyDate = formatFriendlyDate(b.date);
              const friendlyTime = formatTime12h(b.time);

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
                        {b.courtName || 'Cancha Deportiva'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700' }}>
                        <Calendar size={14} /> {friendlyDate}
                        <Clock size={14} style={{ marginLeft: '6px' }} /> {friendlyTime} ({b.durationMinutes} min)
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
                        Capitán: <strong>{b.teamACaptain}</strong> · Tel: <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openWhatsApp(b.teamAPhone, `Hola ${b.teamACaptain}, te contacto de la cancha sobre tu reserva del ${friendlyDate} a las ${friendlyTime}.`)}>{b.teamAPhone}</span>
                      </div>
                    </div>

                    {/* Team B or Seek Match Status */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>
                      {b.bookingMode === 'seek_match' && !b.teamBName ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', justifyContent: 'center', height: '100%' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#d97706', textTransform: 'uppercase' }}>
                            ⚔️ Busca Reto Abierto
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
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
                              Capitán: <strong>{b.teamBCaptain}</strong> · Tel: <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => openWhatsApp(b.teamBPhone || '', `Hola ${b.teamBCaptain}, te contacto de la cancha sobre tu partido del ${friendlyDate} a las ${friendlyTime}.`)}>{b.teamBPhone}</span>
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

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Enviar Recordatorio WhatsApp Button */}
                      {b.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => setReminderBooking(b)}
                          style={{
                            padding: '7px 12px', borderRadius: '8px', border: '1px solid #86efac',
                            backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '0.8rem',
                            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                          }}
                        >
                          <Send size={13} /> Recordatorio WhatsApp
                        </button>
                      )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>
              Horarios para: <span style={{ color: 'var(--primary)' }}>{formatFriendlyDate(selectedDate)}</span>
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
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
                            backgroundColor: b.status === 'cancelled' ? '#f1f5f9' : (b.matchStatus === 'open' || (b.bookingMode === 'seek_match' && !b.teamBName)) ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${b.status === 'cancelled' ? '#cbd5e1' : (b.matchStatus === 'open' || (b.bookingMode === 'seek_match' && !b.teamBName)) ? '#fcd34d' : '#86efac'}`
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0f172a' }}>{formatTime12h(b.time)}</span>
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

      {/* NEW MANUAL BOOKING MODAL */}
      {isManualModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: '16px', maxWidth: '560px', width: '100%',
            padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                  Nueva Reserva Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Cancha, Fecha y Turno */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Cancha *
                  </label>
                  <select
                    value={manualCourtId}
                    onChange={e => handleCourtChange(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontWeight: '600' }}
                  >
                    {courts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (₡{Number(c.basePrice).toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setManualDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontWeight: '600', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Hora / Turno */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Hora / Turno * {manualDate && <span style={{ color: 'var(--primary)', fontWeight: 'normal' }}>({formatFriendlyDate(manualDate)})</span>}
                </label>
                {manualSlots.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '6px', maxHeight: '120px', overflowY: 'auto', padding: '4px' }}>
                    {manualSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setManualTime(slot)}
                        style={{
                          padding: '7px 4px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700',
                          border: manualTime === slot ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: manualTime === slot ? 'var(--primary)' : 'var(--bg-elevated)',
                          color: manualTime === slot ? 'white' : 'var(--text)',
                          textAlign: 'center'
                        }}
                      >
                        {formatTime12h(slot)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={e => setManualTime(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontWeight: '600', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Modalidad */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Modalidad de Reserva
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: manualBookingMode === 'full' ? 'var(--primary-light)' : 'transparent' }}>
                    <input type="radio" name="manualMode" checked={manualBookingMode === 'full'} onChange={() => setManualBookingMode('full')} />
                    <span>Reserva Completa (2 Equipos)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: manualBookingMode === 'seek_match' ? '#fef3c7' : 'transparent' }}>
                    <input type="radio" name="manualMode" checked={manualBookingMode === 'seek_match'} onChange={() => setManualBookingMode('seek_match')} />
                    <span>⚔️ ¡Busca Reto! (Publicar en web)</span>
                  </label>
                </div>
              </div>

              {/* Equipo A */}
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#2563eb', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Equipo A (Responsable)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                  <input type="text" placeholder="Nombre Equipo (Ej: Los Galácticos)" value={manualTeamAName} onChange={e => setManualTeamAName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                  <input type="text" required placeholder="Capitán / Contacto *" value={manualTeamACaptain} onChange={e => setManualTeamACaptain(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', alignItems: 'center' }}>
                  <input type="tel" placeholder="WhatsApp del Capitán (Ej: 8888-8888)" value={manualTeamAPhone} onChange={e => setManualTeamAPhone(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={manualTeamAPaid} onChange={e => setManualTeamAPaid(e.target.checked)} />
                    <span style={{ fontWeight: 'bold', color: manualTeamAPaid ? '#15803d' : 'var(--text-muted)' }}>¿Pago ya realizado?</span>
                  </label>
                </div>
              </div>

              {/* Equipo B (Solo en reserva completa) */}
              {manualBookingMode === 'full' && (
                <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.82rem', color: '#16a34a', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Equipo B (Rival - Opcional)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Nombre Equipo Rival" value={manualTeamBName} onChange={e => setManualTeamBName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                    <input type="text" placeholder="Capitán Rival" value={manualTeamBCaptain} onChange={e => setManualTeamBCaptain(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', alignItems: 'center' }}>
                    <input type="tel" placeholder="WhatsApp Capitán Rival" value={manualTeamBPhone} onChange={e => setManualTeamBPhone(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={manualTeamBPaid} onChange={e => setManualTeamBPaid(e.target.checked)} />
                      <span style={{ fontWeight: 'bold', color: manualTeamBPaid ? '#15803d' : 'var(--text-muted)' }}>¿Pago ya realizado?</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Monto & Notas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Monto Total (₡) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={manualTotalPrice}
                    onChange={e => setManualTotalPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: 'bold', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                    Notas / Comentarios
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Pagaron por SINPE en recepción"
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingBooking}
                  style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: '800', cursor: 'pointer' }}
                >
                  {creatingBooking ? 'Registrando...' : 'Registrar Reserva'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REMINDER MODAL */}
      {reminderBooking && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: '16px', maxWidth: '480px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text)' }}>
                  Enviar Recordatorio por WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReminderBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendApiReminder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '8px' }}>
                <div><strong>Partido:</strong> {reminderBooking.courtName} · {formatFriendlyDate(reminderBooking.date)} a las {formatTime12h(reminderBooking.time)}</div>
                <div style={{ marginTop: '3px' }}><strong>Equipos:</strong> {reminderBooking.teamAName} {reminderBooking.teamBName ? `vs ${reminderBooking.teamBName}` : ''}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Tipo de Recordatorio:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setReminderType('payment')}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '8px', border: reminderType === 'payment' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: reminderType === 'payment' ? 'var(--primary-light)' : 'var(--bg-elevated)',
                      color: reminderType === 'payment' ? 'var(--primary)' : 'var(--text)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    💳 Recordatorio de Pago (SINPE)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderType('reservation')}
                    style={{
                      flex: 1, padding: '9px', borderRadius: '8px', border: reminderType === 'reservation' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: reminderType === 'reservation' ? 'var(--primary-light)' : 'var(--bg-elevated)',
                      color: reminderType === 'reservation' ? 'var(--primary)' : 'var(--text)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer'
                    }}
                  >
                    ⚽ Recordatorio de Partido
                  </button>
                </div>
              </div>

              {reminderBooking.teamBName && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                    Destinatarios:
                  </label>
                  <select
                    value={targetTeam}
                    onChange={e => setTargetTeam(e.target.value as any)}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontWeight: '600' }}
                  >
                    <option value="both">Ambos Equipos (Equipo A y Equipo B)</option>
                    <option value="A">Solo Equipo A ({reminderBooking.teamAName})</option>
                    <option value="B">Solo Equipo B ({reminderBooking.teamBName})</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReminderBooking(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'transparent', color: 'var(--text)', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingReminder}
                  style={{
                    flex: 1.5, padding: '10px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#16a34a', color: 'white', fontWeight: '800', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Send size={15} />
                  {sendingReminder ? 'Enviando...' : 'Enviar por WhatsApp'}
                </button>
              </div>
            </form>
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
                <span style={{ color: 'var(--text-muted)' }}>Código de Reserva:</span>
                <strong style={{ color: 'var(--primary)', letterSpacing: '0.04em' }}>#RES-{selectedBooking.id.substring(0, 8).toUpperCase()}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cancha:</span>
                <strong style={{ color: 'var(--text)' }}>{selectedBooking.courtName}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fecha & Hora:</span>
                <strong style={{ color: 'var(--text)' }}>{formatFriendlyDate(selectedBooking.date)} a las {formatTime12h(selectedBooking.time)}</strong>
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
