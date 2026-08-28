import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Filter, CheckCircle, XCircle, AlertCircle, RefreshCw, MessageCircle, Link as LinkIcon, Copy, ExternalLink, Settings, Save, Trash2, Sun, Palmtree, HelpCircle, FormInput, Smartphone, Monitor, Share2, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Appointment, ScheduleSettings, DayBreakConfig, BookingField } from '../../shared/types';

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<'list' | 'schedule' | 'calendarSync'>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [copiedBookingLink, setCopiedBookingLink] = useState(false);
  const [copiedCalendarLink, setCopiedCalendarLink] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('clinicasonrisas');

  // Schedule Settings State
  const [scheduleMode, setScheduleMode] = useState<'jornada' | 'fechas' | 'bloques'>('jornada');
  const [startHour, setStartHour] = useState('08:00');
  const [endHour, setEndHour] = useState('17:00');
  const [slotMinutes, setSlotMinutes] = useState(45);
  const [hasBreak, setHasBreak] = useState(true);
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [daysEnabled, setDaysEnabled] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [perDayBreaks, setPerDayBreaks] = useState<Record<number, DayBreakConfig>>({});
  const [selectedDayForBreak, setSelectedDayForBreak] = useState<number>(1);

  // Fechas Concretas State
  const [enabledDates, setEnabledDates] = useState<string[]>([]);
  const [newDateToAdd, setNewDateToAdd] = useState('');

  // Bloques de Tiempo State
  const [bloquesDays, setBloquesDays] = useState<Record<string, Array<{ start: string; end: string }>>>({
    monday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    tuesday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    wednesday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    thursday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    friday: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
    saturday: [{ start: '08:00', end: '13:00' }],
    sunday: []
  });
  const [selectedDayForBlock, setSelectedDayForBlock] = useState('monday');

  // Custom Form Fields State
  const [customFields, setCustomFields] = useState<BookingField[]>([
    { id: 'f_1', label: 'Detalle o Motivo de Consulta', placeholder: 'Ej: Consulta General o Síntomas', type: 'text', required: false },
    { id: 'f_2', label: 'Notas o Comentarios Adicionales', placeholder: 'Cualquier indicación especial...', type: 'textarea', required: false }
  ]);

  // Vacation Mode State
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationMessage, setVacationMessage] = useState('Estaremos cerrados temporalmente por vacaciones. ¡Pronto estaremos de vuelta!');

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSavedToast, setScheduleSavedToast] = useState(false);

  // New Appointment Form State
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newService, setNewService] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newAmount, setNewAmount] = useState(15000);
  const [newDetails, setNewDetails] = useState('');

  const api = useApi();

  const fetchAppointments = async () => {
    try {
      const data = await api.get('/api/appointments');
      if (data) setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleAndTenant = async () => {
    try {
      const sch = await api.get('/api/appointments/schedule');
      if (sch) {
        setScheduleMode(sch.scheduleMode || 'jornada');
        if (sch.jornadaConfig) {
          setStartHour(sch.jornadaConfig.startHour || '08:00');
          setEndHour(sch.jornadaConfig.endHour || '17:00');
          setSlotMinutes(sch.jornadaConfig.slotMinutes || 45);
          setHasBreak(sch.jornadaConfig.hasBreak !== false);
          setBreakStart(sch.jornadaConfig.breakStart || '12:00');
          setBreakEnd(sch.jornadaConfig.breakEnd || '13:00');
          if (sch.jornadaConfig.daysEnabled) setDaysEnabled(sch.jornadaConfig.daysEnabled);
          if (sch.jornadaConfig.perDayBreaks) setPerDayBreaks(sch.jornadaConfig.perDayBreaks);
        }
        if (sch.fechasConfig?.enabledDates) {
          setEnabledDates(sch.fechasConfig.enabledDates);
        }
        if (sch.bloquesConfig?.days) {
          setBloquesDays(sch.bloquesConfig.days);
        }
        if (sch.customFields && sch.customFields.length > 0) {
          setCustomFields(sch.customFields);
        }
        if (sch.vacationConfig) {
          setVacationEnabled(sch.vacationConfig.enabled || false);
          setVacationStart(sch.vacationConfig.startDate || '');
          setVacationEnd(sch.vacationConfig.endDate || '');
          setVacationMessage(sch.vacationConfig.message || 'Estaremos cerrados temporalmente por vacaciones.');
        }
      }

      const me = await api.get('/api/auth/me');
      if (me?.tenantSlug) setTenantSlug(me.tenantSlug);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchScheduleAndTenant();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/appointments', {
        name: newName,
        whatsapp: newWhatsapp,
        service: newService,
        date: newDate,
        time: newTime,
        amount: newAmount,
        details: newDetails,
        status: 'confirmed'
      });
      setShowNewModal(false);
      setNewName('');
      setNewWhatsapp('');
      setNewService('');
      setNewDate('');
      setNewTime('');
      await fetchAppointments();
    } catch (err) {
      alert('Error al agendar cita');
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status, notifyCustomer: true });
      await fetchAppointments();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.post('/api/appointments/schedule', {
        scheduleMode,
        jornadaConfig: {
          startHour,
          endHour,
          slotMinutes: Number(slotMinutes),
          hasBreak,
          breakStart,
          breakEnd,
          daysEnabled,
          perDayBreaks
        },
        fechasConfig: {
          enabledDates
        },
        bloquesConfig: {
          days: bloquesDays,
          slotMinutes: Number(slotMinutes)
        },
        customFields,
        vacationConfig: {
          enabled: vacationEnabled,
          startDate: vacationStart,
          endDate: vacationEnd,
          message: vacationMessage
        }
      });
      setScheduleSavedToast(true);
      setTimeout(() => setScheduleSavedToast(false), 3000);
    } catch (err) {
      alert('Error al guardar configuración de horarios');
    } finally {
      setSavingSchedule(false);
    }
  };

  const toggleDay = (day: number) => {
    setDaysEnabled(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const addBlockToDay = (dayKey: string) => {
    setBloquesDays(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), { start: '08:00', end: '12:00' }]
    }));
  };

  const removeBlockFromDay = (dayKey: string, index: number) => {
    setBloquesDays(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter((_, i) => i !== index)
    }));
  };

  const updateBlock = (dayKey: string, index: number, field: 'start' | 'end', value: string) => {
    setBloquesDays(prev => {
      const dayBlocks = [...(prev[dayKey] || [])];
      dayBlocks[index] = { ...dayBlocks[index], [field]: value };
      return { ...prev, [dayKey]: dayBlocks };
    });
  };

  const addSpecificDate = () => {
    if (!newDateToAdd || enabledDates.includes(newDateToAdd)) return;
    setEnabledDates(prev => [...prev, newDateToAdd].sort());
    setNewDateToAdd('');
  };

  const removeSpecificDate = (dateStr: string) => {
    setEnabledDates(prev => prev.filter(d => d !== dateStr));
  };

  // Custom Fields Handlers
  const addCustomField = () => {
    const newField: BookingField = {
      id: `f_${Date.now()}`,
      label: 'Nueva Pregunta',
      placeholder: 'Escribe tu respuesta...',
      type: 'text',
      required: false
    };
    setCustomFields(prev => [...prev, newField]);
  };

  const updateCustomField = (id: string, key: keyof BookingField, val: any) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  const publicBookingUrl = `${window.location.origin}/reservas/${tenantSlug}`;
  const hostNoProtocol = window.location.host;
  const calendarIcsUrl = `${window.location.origin}/api/calendar/${tenantSlug}.ics`;
  const calendarWebcalUrl = `webcal://${hostNoProtocol}/api/calendar/${tenantSlug}.ics`;
  const googleCalendarSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarWebcalUrl)}`;

  const copyBookingLink = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopiedBookingLink(true);
    setTimeout(() => setCopiedBookingLink(false), 2000);
  };

  const copyCalendarLink = () => {
    navigator.clipboard.writeText(calendarIcsUrl);
    setCopiedCalendarLink(true);
    setTimeout(() => setCopiedCalendarLink(false), 2000);
  };

  const filtered = appointments.filter(a => {
    const matchesDate = !filterDate || a.date === filterDate;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  const DAYS_OF_WEEK = [
    { num: 1, name: 'Lunes', key: 'monday' },
    { num: 2, name: 'Martes', key: 'tuesday' },
    { num: 3, name: 'Miércoles', key: 'wednesday' },
    { num: 4, name: 'Jueves', key: 'thursday' },
    { num: 5, name: 'Viernes', key: 'friday' },
    { num: 6, name: 'Sábado', key: 'saturday' },
    { num: 7, name: 'Domingo', key: 'sunday' }
  ];

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando agenda de citas...</div>;
  }

  return (
    <div style={{ maxWidth: '980px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Agenda y Reservas</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Control de citas, horarios, preguntas del formulario y sincronización con Apple/Google Calendar
          </p>
        </div>

        {activeTab === 'list' && (
          <button
            onClick={() => setShowNewModal(true)}
            style={{ padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
          >
            <Plus size={16} /> Nueva Cita
          </button>
        )}
      </div>

      {/* Public Booking Link Card */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px 20px', marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#1d4ed8" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#1d4ed8', fontWeight: 'bold', textTransform: 'uppercase' }}>Portal Público de Reservas</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e40af', wordBreak: 'break-all' }}>{publicBookingUrl}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={copyBookingLink}
            style={{ padding: '8px 14px', backgroundColor: 'white', border: '1px solid #93c5fd', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#1d4ed8' }}
          >
            <Copy size={15} /> {copiedBookingLink ? '¡Copiado!' : 'Copiar'}
          </button>
          <a
            href={publicBookingUrl}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <ExternalLink size={15} /> Ver Portal
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={18} /> Citas Agendadas ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'schedule' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'schedule' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Settings size={18} /> ⚙️ Horarios & Formulario
        </button>

        <button
          onClick={() => setActiveTab('calendarSync')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'calendarSync' ? '2px solid #7c3aed' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'calendarSync' ? '#7c3aed' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Share2 size={18} /> 📲 Sincronizar con Apple / Google Calendar
        </button>
      </div>

      {/* TAB 1: APPOINTMENTS LIST */}
      {activeTab === 'list' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: 'white' }}
            >
              <option value="all">Todos los estados</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            {(filterDate || filterStatus !== 'all') && (
              <button
                onClick={() => { setFilterDate(''); setFilterStatus('all'); }}
                style={{ padding: '8px 12px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Appointments List */}
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <Calendar size={36} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay citas agendadas con los filtros seleccionados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(appt => (
                <div
                  key={appt.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '15px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ backgroundColor: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{appt.date}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{appt.time}</div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{appt.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span>🛠️ {appt.service}</span>
                        {appt.whatsapp && <span>📱 {appt.whatsapp}</span>}
                      </div>
                      {appt.details && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>📝 {appt.details}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text)' }}>
                      ₡{Number(appt.amount || 0).toLocaleString('es-CR')}
                    </div>

                    <select
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: appt.status === 'confirmed' ? '#dcfce7' : appt.status === 'completed' ? '#dbeafe' : appt.status === 'cancelled' ? '#fee2e2' : '#fef9c3',
                        color: appt.status === 'confirmed' ? '#15803d' : appt.status === 'completed' ? '#1d4ed8' : appt.status === 'cancelled' ? '#b91c1c' : '#854d0e',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>

                    {appt.whatsapp && (
                      <a
                        href={`https://wa.me/${appt.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${appt.name}, nos comunicamos para dar seguimiento a tu cita de ${appt.service} el ${appt.date} a las ${appt.time}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '6px', backgroundColor: '#25d366', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: SCHEDULE & CUSTOM FORM FIELDS CONFIGURATION */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Schedule Mode Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Modalidad de Disponibilidad</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Selecciona cómo deseas que los clientes puedan agendar citas</p>
              </div>

              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
              >
                <Save size={16} /> {savingSchedule ? 'Guardando...' : 'Guardar Configuración'}
              </button>
            </div>

            {scheduleSavedToast && (
              <div style={{ padding: '10px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                <CheckCircle size={16} /> ¡Configuración de horarios y formulario guardada exitosamente!
              </div>
            )}

            {/* Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '25px' }}>
              {[
                { id: 'jornada', title: 'Por Jornada Continua', desc: 'Horas fijas con descansos programados' },
                { id: 'bloques', title: 'Por Bloques de Tiempo', desc: 'Bloques de mañana y tarde por día' },
                { id: 'fechas', title: 'Por Fechas Concretas', desc: 'Habilitar días y horas específicas' }
              ].map(m => (
                <div
                  key={m.id}
                  onClick={() => setScheduleMode(m.id as any)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: `2px solid ${scheduleMode === m.id ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: scheduleMode === m.id ? 'rgba(22, 163, 74, 0.05)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: scheduleMode === m.id ? 'var(--primary)' : 'var(--text)' }}>{m.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* MODE 1: JORNADA CONTINUA */}
            {scheduleMode === 'jornada' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Hora de Apertura</label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Hora de Cierre</label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>Intervalo por Cita</label>
                    <select
                      value={slotMinutes}
                      onChange={(e) => setSlotMinutes(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', backgroundColor: 'white' }}
                    >
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>1 hora (60 min)</option>
                      <option value={90}>1 hora 30 min</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>
                </div>

                {/* Days Enabled */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Días de Atención Habilitados</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {DAYS_OF_WEEK.map(d => {
                      const isEnabled = daysEnabled.includes(d.num);
                      return (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleDay(d.num)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: isEnabled ? '2px solid var(--primary)' : '1px solid var(--border)',
                            backgroundColor: isEnabled ? 'var(--primary)' : 'white',
                            color: isEnabled ? 'white' : 'var(--text)',
                            fontWeight: 'bold',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Day Break Configuration */}
                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Descansos / Almuerzo por Día</h4>
                  
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '14px' }}>
                    {DAYS_OF_WEEK.filter(d => daysEnabled.includes(d.num)).map(d => (
                      <button
                        key={d.num}
                        type="button"
                        onClick={() => setSelectedDayForBreak(d.num)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: selectedDayForBreak === d.num ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: selectedDayForBreak === d.num ? 'var(--primary)' : 'white',
                          color: selectedDayForBreak === d.num ? 'white' : 'var(--text)',
                          fontWeight: '600',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const currentBreak = perDayBreaks[selectedDayForBreak] || {
                      hasBreak: hasBreak,
                      breakStart: breakStart,
                      breakEnd: breakEnd
                    };

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={currentBreak.hasBreak}
                            onChange={(e) => {
                              setPerDayBreaks(prev => ({
                                ...prev,
                                [selectedDayForBreak]: { ...currentBreak, hasBreak: e.target.checked }
                              }));
                            }}
                          />
                          <span>Habilitar descanso para {DAYS_OF_WEEK.find(d => d.num === selectedDayForBreak)?.name}</span>
                        </label>

                        {currentBreak.hasBreak && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '360px' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Inicio del descanso:</span>
                              <input
                                type="time"
                                value={currentBreak.breakStart}
                                onChange={(e) => {
                                  setPerDayBreaks(prev => ({
                                    ...prev,
                                    [selectedDayForBreak]: { ...currentBreak, breakStart: e.target.value }
                                  }));
                                }}
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                              />
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Fin del descanso:</span>
                              <input
                                type="time"
                                value={currentBreak.breakEnd}
                                onChange={(e) => {
                                  setPerDayBreaks(prev => ({
                                    ...prev,
                                    [selectedDayForBreak]: { ...currentBreak, breakEnd: e.target.value }
                                  }));
                                }}
                                style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MODE 2: BLOQUES DE TIEMPO */}
            {scheduleMode === 'bloques' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Configura bloques de atención independientes (por ejemplo: turno de mañana y turno de tarde) para cada día de la semana.
                </p>

                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setSelectedDayForBlock(d.key)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: selectedDayForBlock === d.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: selectedDayForBlock === d.key ? 'var(--primary)' : 'white',
                        color: selectedDayForBlock === d.key ? 'white' : 'var(--text)',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold' }}>
                      Bloques para {DAYS_OF_WEEK.find(d => d.key === selectedDayForBlock)?.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => addBlockToDay(selectedDayForBlock)}
                      style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Agregar Bloque
                    </button>
                  </div>

                  {(bloquesDays[selectedDayForBlock] || []).length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>No hay bloques configurados para este día (cerrado).</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(bloquesDays[selectedDayForBlock] || []).map((block, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Bloque {idx + 1}:</span>
                          <input
                            type="time"
                            value={block.start}
                            onChange={(e) => updateBlock(selectedDayForBlock, idx, 'start', e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                          />
                          <span>a</span>
                          <input
                            type="time"
                            value={block.end}
                            onChange={(e) => updateBlock(selectedDayForBlock, idx, 'end', e.target.value)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeBlockFromDay(selectedDayForBlock, idx)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 3: FECHAS CONCRETAS */}
            {scheduleMode === 'fechas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Habilita únicamente fechas puntuales en el calendario donde se aceptarán reservas.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={newDateToAdd}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewDateToAdd(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={addSpecificDate}
                    style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    + Habilitar Fecha
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  {enabledDates.map(dateStr => (
                    <div
                      key={dateStr}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f1f5f9', borderRadius: '20px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                      <span>🗓️ {dateStr}</span>
                      <button
                        type="button"
                        onClick={() => removeSpecificDate(dateStr)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CUSTOM BOOKING FORM QUESTIONS / FIELDS */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>📝 Preguntas del Formulario de Reservas</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Personaliza qué información deseas solicitar a los clientes al agendar una cita</p>
              </div>

              <button
                type="button"
                onClick={addCustomField}
                style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> + Agregar Pregunta
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {customFields.map((field, idx) => (
                <div key={field.id} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto auto', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Pregunta / Etiqueta</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Texto de ayuda (Placeholder)</label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateCustomField(field.id, 'placeholder', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Tipo</label>
                    <select
                      value={field.type}
                      onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: 'white' }}
                    >
                      <option value="text">Texto corto</option>
                      <option value="textarea">Texto largo</option>
                      <option value="number">Número</option>
                    </select>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '2px' }}>Obligatorio</label>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', marginTop: '12px' }}
                      title="Eliminar pregunta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VACATION MODE / DATE BLOCKING CARD */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Palmtree size={22} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Modo Vacaciones y Cierre Temporal</h3>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: vacationEnabled ? '16px' : '0' }}>
              <input
                type="checkbox"
                checked={vacationEnabled}
                onChange={(e) => setVacationEnabled(e.target.checked)}
              />
              <span>Activar Modo Vacaciones (bloquea la agenda en las fechas indicadas)</span>
            </label>

            {vacationEnabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Fecha de Inicio de Vacaciones</label>
                    <input
                      type="date"
                      value={vacationStart}
                      onChange={(e) => setVacationStart(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Fecha de Fin de Vacaciones</label>
                    <input
                      type="date"
                      value={vacationEnd}
                      onChange={(e) => setVacationEnd(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Mensaje Informativo para el Cliente</label>
                  <textarea
                    rows={2}
                    value={vacationMessage}
                    onChange={(e) => setVacationMessage(e.target.value)}
                    placeholder="Estaremos cerrados por vacaciones de Semana Santa del 10 al 15 de abril..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR SYNC (APPLE / GOOGLE / OUTLOOK) */}
      {activeTab === 'calendarSync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', padding: '26px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', backgroundColor: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={22} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Suscripción en Tiempo Real a Calendarios</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Visualiza todas las citas agendadas por WhatsApp o la web en tu iPhone, Mac, Android o Google Calendar automáticamente.
                </p>
              </div>
            </div>

            {/* Calendar Link Box */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Enlace Universal de Calendario (iCal / Webcal)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={calendarIcsUrl}
                  style={{ flex: 1, minWidth: '260px', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.9rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={copyCalendarLink}
                  style={{ padding: '10px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedCalendarLink ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                  {copiedCalendarLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                </button>
              </div>
            </div>

            {/* Quick 1-Click Subscription Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '30px' }}>
              
              {/* Apple Calendar Button */}
              <a
                href={calendarWebcalUrl}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '10px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              >
                <Smartphone size={28} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Apple Calendar</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Abrir en iPhone, iPad o Mac</div>
                </div>
              </a>

              {/* Google Calendar Button */}
              <a
                href={googleCalendarSubscribeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '10px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
              >
                <Calendar size={28} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Google Calendar</div>
                  <div style={{ fontSize: '0.75rem', color: '#bfdbfe' }}>Añadir a Google Calendar (Web / Android)</div>
                </div>
              </a>
            </div>

            {/* Step-by-step Instructions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>📖 Instrucciones de Configuración Rápida:</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>🍏 En iPhone o iPad:</strong>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                    <li>Toca el botón negro <strong>Apple Calendar</strong> arriba.</li>
                    <li>iOS te preguntará si deseas suscribirte al calendario. Toca <strong>Suscribirse</strong>.</li>
                    <li>Elige el color deseado y toca <strong>Añadir</strong>. ¡Listo!</li>
                  </ol>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>📅 En Google Calendar:</strong>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                    <li>Toca el botón azul <strong>Google Calendar</strong> arriba.</li>
                    <li>Se abrirá Google Calendar y te preguntará <strong>¿Añadir calendario?</strong></li>
                    <li>Presiona <strong>Añadir</strong> y verás todas las citas sincronizadas en tu cuenta.</li>
                  </ol>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '6px' }}>💻 En Outlook o Windows:</strong>
                  <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                    <li>Copia el enlace de arriba con el botón <strong>Copiar Enlace</strong>.</li>
                    <li>En Outlook, ve a Calendario -&gt; <strong>Agregar calendario</strong>.</li>
                    <li>Selecciona <strong>Suscribirse desde la web</strong> y pega la URL.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          NEW APPOINTMENT MODAL
      ========================================== */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Agendar Nueva Cita</h3>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Daniel Vega"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  placeholder="Ej: 8888-8888"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Servicio *</label>
                <input
                  type="text"
                  required
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Ej: Consulta Dental / Detallado de Auto"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Hora *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Monto (₡)</label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>Notas o Detalles</label>
                <input
                  type="text"
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  placeholder="Detalles adicionales..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
