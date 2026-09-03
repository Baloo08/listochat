import React, { useState, useEffect } from 'react';
import {
  Calendar, Palette, Sliders, Upload, Image, RefreshCw,
  CalendarDays,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  Copy,
  ExternalLink,
  Settings,
  Save,
  Trash2,
  Share2,
  Users,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  FileText,
  DollarSign,
  Palmtree,
  HelpCircle,
  FormInput,
  Check,
  X
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Appointment, DayBreakConfig, BookingField } from '../../shared/types';

const DAYS_OF_WEEK = [
  { num: 1, name: 'Lunes', key: 'monday' },
  { num: 2, name: 'Martes', key: 'tuesday' },
  { num: 3, name: 'Miércoles', key: 'wednesday' },
  { num: 4, name: 'Jueves', key: 'thursday' },
  { num: 5, name: 'Viernes', key: 'friday' },
  { num: 6, name: 'Sábado', key: 'saturday' },
  { num: 7, name: 'Domingo', key: 'sunday' }
];

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'schedule' | 'calendarSync' | 'team' | 'reminders'>('list');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [copiedBookingLink, setCopiedBookingLink] = useState(false);
  const [copiedCalendarLink, setCopiedCalendarLink] = useState(false);
  const [tenantSlug, setTenantSlug] = useState('clinicasonrisas');

  // Calendar View State
  const [currentCalDate, setCurrentCalDate] = useState<Date>(new Date());

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

  // Custom Form Fields State (empty by default so deleted fields don't resurrect)
  const [customFields, setCustomFields] = useState<BookingField[]>([]);

  // Vacation Mode State
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationMessage, setVacationMessage] = useState('Estaremos cerrados temporalmente por vacaciones. ¡Pronto estaremos de vuelta!');
  const [globalParallelSlots, setGlobalParallelSlots] = useState(1);

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSavedToast, setScheduleSavedToast] = useState(false);

  // Booking Theme Customization State
  const [bookingTheme, setBookingTheme] = useState<{
    primaryColor: string;
    backgroundColor: string;
    cardBackgroundColor: string;
    titleColor: string;
    bodyTextColor: string;
    fontFamily: string;
    cardRadius: string;
    cardShadow: string;
    logoUrl?: string;
    bannerUrl?: string;
  }>({
    primaryColor: '#16a34a',
    backgroundColor: '#f8fafc',
    cardBackgroundColor: '#ffffff',
    titleColor: '#0f172a',
    bodyTextColor: '#64748b',
    fontFamily: 'Inter',
    cardRadius: 'md',
    cardShadow: 'md'
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSavedToast, setThemeSavedToast] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Specialists Team State
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<any | null>(null);
  const [specialistForm, setSpecialistForm] = useState({ name: '', phone: '', specialty: '', accessPin: '' });

  // Reminders Configuration State
  const [reminderConfig, setReminderConfig] = useState({
    enabled: true,
    timing: '24h',
    template: '👋 Hola {cliente}, te recordamos tu cita de *{servicio}* programada para el *{fecha}* a las *{hora}* en *{negocio}*. ¡Te esperamos con gusto!'
  });
  const [savingReminders, setSavingReminders] = useState(false);
  const [reminderSavedToast, setReminderSavedToast] = useState(false);

  // New Appointment Form State
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newService, setNewService] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newAmount, setNewAmount] = useState(15000);
  const [newDetails, setNewDetails] = useState('');
  const [newSpecialistId, setNewSpecialistId] = useState('');

  const api = useApi();

  const normalizeDate = (d?: string): string => {
    if (!d) return '';
    const clean = d.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return clean;
  };

  const formatShortDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
      const mIdx = parseInt(month, 10) - 1;
      return `${day} ${months[mIdx] || month} ${year}`;
    }
    return dateStr;
  };

  const fetchAppointments = async () => {
    try {
      const data = await api.get('/api/appointments');
      if (data && Array.isArray(data)) setAppointments(data);
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
        if (sch.globalParallelSlots) setGlobalParallelSlots(sch.globalParallelSlots);
        if (sch.jornadaConfig) {
          setStartHour(sch.jornadaConfig.startHour || '08:00');
          setEndHour(sch.jornadaConfig.endHour || '17:00');
          setSlotMinutes(sch.jornadaConfig.slotMinutes || 45);
          setHasBreak(sch.jornadaConfig.hasBreak !== false);
          setBreakStart(sch.jornadaConfig.breakStart || '12:00');
          setBreakEnd(sch.jornadaConfig.breakEnd || '13:00');
          if (sch.jornadaConfig.daysEnabled && Array.isArray(sch.jornadaConfig.daysEnabled)) {
            setDaysEnabled(sch.jornadaConfig.daysEnabled);
          }
          if (sch.jornadaConfig.perDayBreaks && typeof sch.jornadaConfig.perDayBreaks === 'object') {
            setPerDayBreaks(sch.jornadaConfig.perDayBreaks);
          }
        }
        if (sch.fechasConfig && Array.isArray(sch.fechasConfig.enabledDates)) {
          setEnabledDates(sch.fechasConfig.enabledDates);
        }
        if (sch.bloquesConfig && sch.bloquesConfig.days && typeof sch.bloquesConfig.days === 'object') {
          setBloquesDays(sch.bloquesConfig.days);
        }
        if (sch.customFields && Array.isArray(sch.customFields)) {
          setCustomFields(sch.customFields);
        }
        if (sch.vacationConfig) {
          setVacationEnabled(!!sch.vacationConfig.enabled);
          setVacationStart(sch.vacationConfig.startDate || '');
          setVacationEnd(sch.vacationConfig.endDate || '');
          if (sch.vacationConfig.message) setVacationMessage(sch.vacationConfig.message);
        }
      }

      const tenantRes = await api.get('/api/auth/me');
      if (tenantRes?.tenantSlug) {
        setTenantSlug(tenantRes.tenantSlug);
      }

      // Fetch Store/Booking Theme
      try {
        const storeData = await api.get('/api/store');
        if (storeData?.storeTheme) {
          setBookingTheme(prev => ({
            ...prev,
            ...storeData.storeTheme,
            logoUrl: storeData.storeLogoUrl || storeData.storeTheme.logoUrl,
            bannerUrl: storeData.storeBannerUrl || storeData.storeTheme.bannerUrl
          }));
        }
      } catch (e) {
        // theme fallback
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const fetchSpecialists = async () => {
    setLoadingSpecialists(true);
    try {
      const data = await api.get('/api/specialists');
      if (Array.isArray(data)) setSpecialists(data);
    } catch (e) {
      console.error('Error fetching specialists:', e);
    } finally {
      setLoadingSpecialists(false);
    }
  };

  const handleSaveSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialistForm.name) return;
    try {
      if (editingSpecialist) {
        await api.put(`/api/specialists/${editingSpecialist.id}`, specialistForm);
      } else {
        await api.post('/api/specialists', specialistForm);
      }
      setShowSpecialistModal(false);
      setEditingSpecialist(null);
      setSpecialistForm({ name: '', phone: '', specialty: '', accessPin: '' });
      fetchSpecialists();
    } catch (e) {
      alert('Error al guardar colaborador');
    }
  };

  const handleDeleteSpecialist = async (id: string) => {
    if (!confirm('¿Seguro de eliminar este colaborador?')) return;
    try {
      await api.del(`/api/specialists/${id}`);
      fetchSpecialists();
    } catch (e) {
      alert('Error al eliminar colaborador');
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchScheduleAndTenant();
    fetchSpecialists();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newWhatsapp || !newDate || !newTime) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await api.post('/api/appointments', {
        name: newName,
        whatsapp: newWhatsapp,
        service: newService || 'Consulta General',
        date: newDate,
        time: newTime,
        amount: Number(newAmount),
        details: newDetails,
        specialistId: newSpecialistId || undefined
      });

      setShowNewModal(false);
      setNewName('');
      setNewWhatsapp('');
      setNewService('');
      setNewDate('');
      setNewTime('');
      setNewDetails('');
      setNewSpecialistId('');
      fetchAppointments();
    } catch (err) {
      alert('Error al registrar la cita');
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status: 'completed', notifyCustomer: true });
      alert('¡Cita marcada como completada! Se envió la notificación de agradecimiento por WhatsApp y el espacio ha sido liberado.');
      fetchAppointments();
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: 'completed' as any });
      }
    } catch (err: any) {
      alert('Error al completar la cita: ' + (err.message || 'Verifique'));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.put(`/api/appointments/${id}/status`, { status: newStatus });
      fetchAppointments();
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus as any });
      }
    } catch (err) {
      alert('Error al actualizar el estado');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;
    try {
      await api.del(`/api/appointments/${id}`);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      alert('Error al eliminar la cita');
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.post('/api/appointments/schedule', {
        scheduleMode,
        globalParallelSlots: Number(globalParallelSlots),
        jornadaConfig: {
          startHour,
          endHour,
          slotMinutes: Number(slotMinutes),
          hasBreak,
          breakStart,
          breakEnd,
          daysEnabled: daysEnabled || [],
          perDayBreaks: perDayBreaks || {}
        },
        fechasConfig: {
          enabledDates: enabledDates || []
        },
        bloquesConfig: {
          days: bloquesDays || {},
          slotMinutes: Number(slotMinutes)
        },
        customFields: customFields || [],
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
    if (!newDateToAdd || (enabledDates || []).includes(newDateToAdd)) return;
    setEnabledDates(prev => [...prev, newDateToAdd].sort());
    setNewDateToAdd('');
  };

  const removeSpecificDate = (dateStr: string) => {
    setEnabledDates(prev => (prev || []).filter(d => d !== dateStr));
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
    setCustomFields(prev => [...(prev || []), newField]);
  };

  const updateCustomField = (id: string, key: keyof BookingField, val: any) => {
    setCustomFields(prev => (prev || []).map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const removeCustomField = (id: string) => {
    setCustomFields(prev => (prev || []).filter(f => f.id !== id));
  };


  const handleSaveBookingTheme = async () => {
    setSavingTheme(true);
    try {
      const storeData = await api.get('/api/store');
      await api.post('/api/store', {
        ...storeData,
        storeLogoUrl: bookingTheme.logoUrl || storeData?.storeLogoUrl,
        storeBannerUrl: bookingTheme.bannerUrl || storeData?.storeBannerUrl,
        storeTheme: {
          ...(storeData?.storeTheme || {}),
          ...bookingTheme
        }
      });
      setThemeSavedToast(true);
      setTimeout(() => setThemeSavedToast(false), 3000);
    } catch (e) {
      alert('Error al guardar diseño de reservas');
    } finally {
      setSavingTheme(false);
    }
  };

  const handleBookingFileUpload = async (file: File, type: 'logo' | 'banner') => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setBookingTheme(prev => ({
        ...prev,
        [type === 'logo' ? 'logoUrl' : 'bannerUrl']: data.url
      }));
    } catch (err) {
      alert('Error al subir imagen: ' + err);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const publicBookingUrl = `${window.location.origin}/reservas/${tenantSlug}`;
  const hostNoProtocol = window.location.host;
  const calendarIcsUrl = `${window.location.origin}/api/calendar/${tenantSlug}.ics`;
  const calendarWebcalUrl = `webcal://${hostNoProtocol}/api/calendar/${tenantSlug}.ics`;

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

  const filtered = (appointments || []).filter(a => {
    const matchesDate = !filterDate || normalizeDate(a.date) === normalizeDate(filterDate);
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesDate && matchesStatus;
  });

  // Calendar Helpers
  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const prevMonth = () => setCurrentCalDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentCalDate(new Date(year, month + 1, 1));

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando agenda de citas...</div>;
  }

  return (
    <div style={{ maxWidth: '1080px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Agenda y Reservas</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Control de citas, calendario interactivo, horarios de disponibilidad y sincronización externa
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

      {/* Public Booking Link Banner */}
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
            <Copy size={15} /> {copiedBookingLink ? 'Copiado' : 'Copiar Enlace'}
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

      {/* Clean SVG Tabs (Zero emojis) */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={18} /> Citas Agendadas ({(appointments || []).length})
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'calendar' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'calendar' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CalendarDays size={18} /> Vista Calendario
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
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={18} /> Horarios & Disponibilidad
        </button>

        <button
          onClick={() => setActiveTab('team')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'team' ? '2px solid #0284c7' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'team' ? '#0284c7' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={18} /> Colaboradores ({specialists.length})
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'reminders' ? '2px solid #059669' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'reminders' ? '#059669' : 'var(--text-muted)',
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Clock size={18} /> Recordatorios
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
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Share2 size={18} /> Sincronizar Calendarios
        </button>
      </div>

      {/* ==============================================================
          TAB 1: LISTA DE CITAS
      ============================================================== */}
      {activeTab === 'list' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Filter size={16} color="var(--text-muted)" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem' }}
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', fontSize: '0.85rem' }}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="scheduled">Programadas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <button
              onClick={fetchAppointments}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>

          {/* Appointments Table */}
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              No se encontraron citas con los filtros aplicados.
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Cliente</th>
                    <th style={{ padding: '12px 16px' }}>Servicio</th>
                    <th style={{ padding: '12px 16px' }}>Fecha & Hora</th>
                    <th style={{ padding: '12px 16px' }}>Monto & Pago</th>
                    <th style={{ padding: '12px 16px' }}>Estado</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600' }}>{app.name}</div>
                        <a
                          href={`https://wa.me/${app.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.8rem', color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                        >
                          <MessageCircle size={13} /> {app.whatsapp}
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '500' }}>{app.service}</div>
                        {app.details && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.details}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600' }}>{formatShortDate(app.date)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.time}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600' }}>₡{Number(app.amount || 0).toLocaleString('es-CR')}</div>
                        <div style={{ marginTop: '3px' }}>
                          {app.paymentStatus === 'paid' ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', display: 'inline-block' }}>
                              ✅ Verificado ({app.paymentMethod === 'sinpe_tilopay' ? 'SINPE Auto' : app.paymentMethod === 'card' ? 'Tarjeta' : 'Pagado'})
                            </span>
                          ) : app.paymentStatus === 'proof_sent' ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', display: 'inline-block' }}>
                              📱 SINPE (Comprobante)
                            </span>
                          ) : app.paymentMethod === 'cash' ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-block' }}>
                              💵 En Local
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', display: 'inline-block' }}>
                              ⏳ Pendiente
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            border: '1px solid var(--border)',
                            backgroundColor:
                              app.status === 'confirmed' ? '#f0fdf4' :
                              app.status === 'scheduled' ? '#e0e7ff' :
                              app.status === 'completed' ? '#eff6ff' :
                              app.status === 'cancelled' ? '#fef2f2' : '#fefce8',
                            color:
                              app.status === 'confirmed' ? '#16a34a' :
                              app.status === 'scheduled' ? '#4338ca' :
                              app.status === 'completed' ? '#2563eb' :
                              app.status === 'cancelled' ? '#dc2626' : '#ca8a04'
                          }}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="scheduled">Programada</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedAppointment(app)}
                          style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', marginRight: '6px' }}
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(app.id)}
                          style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          title="Eliminar cita"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 2: VISTA CALENDARIO MENSUAL
      ============================================================== */}
      {activeTab === 'calendar' && (
        <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          {/* Calendar Month Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={22} color="var(--primary)" /> {monthNames[month]} {year}
            </h3>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={prevMonth}
                style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600' }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button
                onClick={() => setCurrentCalDate(new Date())}
                style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
              >
                Hoy
              </button>
              <button
                onClick={nextMonth}
                style={{ padding: '8px 12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: '600' }}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px', textAlign: 'center' }}>
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
              <div key={i} style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {/* Blank offset days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} style={{ minHeight: '95px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #e2e8f0', opacity: 0.5 }} />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayAppointments = (appointments || []).filter(a => normalizeDate(a.date) === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dayNum}
                  style={{
                    minHeight: '95px',
                    backgroundColor: isToday ? '#f0fdf4' : 'white',
                    border: isToday ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isToday ? 'var(--primary)' : 'var(--text)' }}>
                      {dayNum}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: 'white' }}>
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments list in day cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '75px' }}>
                    {dayAppointments.map(app => {
                      const isConfirmed = app.status === 'confirmed';
                      const isCompleted = app.status === 'completed';
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedAppointment(app)}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            backgroundColor: isConfirmed ? '#dcfce7' : isCompleted ? '#dbeafe' : '#fef9c3',
                            border: `1px solid ${isConfirmed ? '#86efac' : isCompleted ? '#93c5fd' : '#fde047'}`,
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            color: isConfirmed ? '#166534' : isCompleted ? '#1e40af' : '#854d0e',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={`${app.time} - ${app.name} (${app.service})`}
                        >
                          {app.time} {app.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: HORARIOS & FORMULARIO
      ============================================================== */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Schedule Settings Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Modalidad de Disponibilidad y Horarios</h3>
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

            {/* Parallel Slots Capacity Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '18px 20px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Users size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Capacidad de Atención Simultánea (Cupos en Paralelo)</h4>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Define cuántos clientes pueden agendar y ser atendidos al mismo tiempo en un mismo horario.
              </p>

              <div style={{ maxWidth: '300px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  Cupos Globales por Horario:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={globalParallelSlots}
                  onChange={(e) => setGlobalParallelSlots(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 'bold' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                  Ej: Si tienes 3 especialistas o sillas disponibles, pon 3 para aceptar hasta 3 citas a la misma hora.
                </span>
              </div>
            </div>

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
                      const isEnabled = (daysEnabled || []).includes(d.num);
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
                    {DAYS_OF_WEEK.filter(d => (daysEnabled || []).includes(d.num)).map(d => (
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
                    const currentBreak = (perDayBreaks || {})[selectedDayForBreak] || {
                      hasBreak: hasBreak,
                      breakStart: breakStart,
                      breakEnd: breakEnd
                    };

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!currentBreak.hasBreak}
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
                                value={currentBreak.breakStart || '12:00'}
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
                                value={currentBreak.breakEnd || '13:00'}
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

                  {((bloquesDays || {})[selectedDayForBlock] || []).length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>No hay bloques configurados para este día (cerrado).</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {((bloquesDays || {})[selectedDayForBlock] || []).map((block, idx) => (
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
                    onChange={(e) => setNewDateToAdd(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={addSpecificDate}
                    style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Habilitar Fecha
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(enabledDates || []).map(dateStr => (
                    <span
                      key={dateStr}
                      style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {formatShortDate(dateStr)}
                      <X
                        size={14}
                        style={{ cursor: 'pointer', color: '#ef4444' }}
                        onClick={() => removeSpecificDate(dateStr)}
                      />
                    </span>
                  ))}
                  {(enabledDates || []).length === 0 && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>No hay fechas específicas agregadas.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Form Questions Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Preguntas del Formulario de Reserva</h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Personaliza las preguntas que responderá el cliente al agendar</p>
              </div>
              <button
                type="button"
                onClick={addCustomField}
                style={{ padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Nueva Pregunta
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(customFields || []).map((field, idx) => (
                <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr auto auto', gap: '10px', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
                    placeholder="Título de la pregunta"
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => updateCustomField(field.id, 'placeholder', e.target.value)}
                    placeholder="Texto de ayuda"
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateCustomField(field.id, 'type', e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: 'white' }}
                  >
                    <option value="text">Texto corto</option>
                    <option value="textarea">Texto largo</option>
                    <option value="number">Número</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateCustomField(field.id, 'required', e.target.checked)}
                    />
                    <span>Requerido</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCustomField(field.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Vacation Mode Card */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
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

      {/* ==============================================================
          TAB 4: SINCRONIZACIÓN CON CALENDARIOS EXTERNOS
      ============================================================== */}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>iPhone, iPad y Mac (Apple Calendar)</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Abre este enlace directamente en Safari o copia la URL en Ajustes - Calendario - Cuentas - Añadir cuenta suscrita.
                </p>
                <a
                  href={calendarWebcalUrl}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#0f172a', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <ExternalLink size={14} /> Suscribir en Apple Calendar
                </a>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Google Calendar & Android</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  En Google Calendar web, haz clic en Otros calendarios (+) - Desde URL y pega el enlace copiado arriba.
                </p>
                <button
                  onClick={copyCalendarLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <Copy size={14} /> Copiar URL para Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: DETALLES DE CITA
      ============================================================== */}
      {selectedAppointment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '520px', width: '100%', padding: '26px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Detalles de la Cita</h3>
              </div>
              <button onClick={() => setSelectedAppointment(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Cliente:</span>
                  <strong style={{ fontSize: '0.95rem' }}>{selectedAppointment.name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>WhatsApp:</span>
                  <a
                    href={`https://wa.me/${selectedAppointment.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <MessageCircle size={14} /> {selectedAppointment.whatsapp}
                  </a>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Servicio:</span>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedAppointment.service}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Monto:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--primary)' }}>
                    ₡{Number(selectedAppointment.amount || 0).toLocaleString('es-CR')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fecha:</span>
                  <span style={{ fontWeight: '600' }}>{formatShortDate(selectedAppointment.date)}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Hora:</span>
                  <span style={{ fontWeight: '600' }}>{selectedAppointment.time}</span>
                </div>
              </div>

              {selectedAppointment.details && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Detalles / Respuestas del Formulario:</span>
                  <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                    {selectedAppointment.details}
                  </div>
                </div>
              )}

              {/* Bloque de Información de Pago */}
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: selectedAppointment.paymentStatus === 'paid' ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${selectedAppointment.paymentStatus === 'paid' ? '#86efac' : '#e2e8f0'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>ESTADO DEL PAGO</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px',
                    backgroundColor: selectedAppointment.paymentStatus === 'paid' ? '#dcfce7' : selectedAppointment.paymentStatus === 'proof_sent' ? '#fef3c7' : '#f1f5f9',
                    color: selectedAppointment.paymentStatus === 'paid' ? '#15803d' : selectedAppointment.paymentStatus === 'proof_sent' ? '#b45309' : '#64748b'
                  }}>
                    {selectedAppointment.paymentStatus === 'paid' ? '✅ Pago Verificado' : selectedAppointment.paymentStatus === 'proof_sent' ? '📱 Comprobante Enviado' : '⏳ Pendiente de Pago'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  <strong>Método:</strong> {selectedAppointment.paymentMethod === 'sinpe_tilopay' ? '⚡ SINPE Móvil Automático (Tilopay)' : selectedAppointment.paymentMethod === 'card' ? '💳 Tarjeta de Crédito/Débito (Tilopay)' : selectedAppointment.paymentMethod === 'sinpe' ? '📱 SINPE Móvil (Manual)' : '💵 Efectivo / En Establecimiento'}
                </div>
                {selectedAppointment.tilopayTransactionId && (
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '4px' }}>
                    <strong>ID Transacción:</strong> #{selectedAppointment.tilopayTransactionId} {selectedAppointment.tilopayAuthCode ? `(Auth: ${selectedAppointment.tilopayAuthCode})` : ''}
                  </div>
                )}
                {selectedAppointment.paymentReference && !selectedAppointment.tilopayTransactionId && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    <strong>Referencia / Comprobante:</strong> {selectedAppointment.paymentReference}
                  </div>
                )}
                {selectedAppointment.paymentStatus !== 'paid' && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/api/appointments/${selectedAppointment.id}`, { paymentStatus: 'paid', status: 'confirmed' });
                          alert('¡Pago confirmado manualmente!');
                          fetchAppointments();
                          setSelectedAppointment({ ...selectedAppointment, paymentStatus: 'paid', status: 'confirmed' });
                        } catch (e: any) {
                          alert('Error al confirmar pago: ' + e?.message);
                        }
                      }}
                      style={{ padding: '5px 10px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      ✓ Marcar como Pagado
                    </button>
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Cambiar Estado:</span>
                <select
                  value={selectedAppointment.status}
                  onChange={(e) => handleStatusChange(selectedAppointment.id, e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: 'white' }}
                >
                  <option value="pending">Pendiente</option>
                  <option value="scheduled">Programada</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada (Libera cupo de horario)</option>
                  <option value="cancelled">Cancelada (Libera cupo de horario)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                style={{ padding: '8px 14px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} /> Eliminar Cita
              </button>

              <button
                onClick={() => setSelectedAppointment(null)}
                style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB: TEAM & SPECIALISTS MANAGEMENT
      ======================================================== */}
      {activeTab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header & Portal Link */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#0284c7" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 'bold', color: '#0369a1' }}>Portal Móvil de Especialistas</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#0284c7' }}>
                  Tus colaboradores pueden ingresar a <strong>{window.location.origin}/especialista</strong> con su código PIN asignado.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingSpecialist(null);
                setSpecialistForm({ name: '', phone: '', specialty: '', accessPin: '' });
                setShowSpecialistModal(true);
              }}
              style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Agregar Colaborador
            </button>
          </div>

          {/* Specialists List */}
          {loadingSpecialists ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Cargando colaboradores...</div>
          ) : specialists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Users size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>No hay colaboradores registrados</h4>
              <p style={{ margin: '0 0 14px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Agrega a los miembros de tu equipo para asignarles citas y que ellos puedan ver su agenda desde su teléfono.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {specialists.map(s => (
                <div key={s.id} style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>{s.name}</h4>
                        <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: '600' }}>{s.specialty || 'Especialista General'}</span>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                        PIN: {s.accessPin}
                      </span>
                    </div>

                    {s.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                        <Phone size={13} /> {s.phone}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <button
                      onClick={() => {
                        setEditingSpecialist(s);
                        setSpecialistForm({ name: s.name, phone: s.phone || '', specialty: s.specialty || '', accessPin: s.accessPin });
                        setShowSpecialistModal(true);
                      }}
                      style={{ flex: 1, padding: '6px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteSpecialist(s.id)}
                      style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          TAB: AUTOMATIC REMINDERS CONFIGURATION
      ======================================================== */}
      {activeTab === 'reminders' && (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Recordatorios Automáticos por WhatsApp</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              El sistema enviará automáticamente un mensaje de WhatsApp a cada cliente para confirmar su asistencia.
            </p>
          </div>

          {reminderSavedToast && (
            <div style={{ padding: '10px 14px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
              ✓ Configuración de recordatorios guardada con éxito
            </div>
          )}

          {/* Periodicidad Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>
              ¿Con cuánta anticipación enviar el recordatorio?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {[
                { id: '24h', label: '24 Horas Antes', desc: '1 día antes de la cita' },
                { id: '2h', label: '2 Horas Antes', desc: 'El mismo día de la cita' },
                { id: '48h', label: '48 Horas Antes', desc: '2 días antes de la cita' },
                { id: '30m', label: '30 Minutos Antes', desc: 'Recordatorio express' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setReminderConfig(prev => ({ ...prev, timing: opt.id }))}
                  style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    border: reminderConfig.timing === opt.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: reminderConfig.timing === opt.id ? '#eff6ff' : 'transparent'
                  }}
                >
                  <strong style={{ fontSize: '0.9rem', color: reminderConfig.timing === opt.id ? 'var(--primary)' : 'inherit' }}>
                    {opt.label}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
              Plantilla del Mensaje de WhatsApp
            </label>
            <textarea
              rows={4}
              value={reminderConfig.template}
              onChange={(e) => setReminderConfig(prev => ({ ...prev, template: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Etiquetas disponibles: <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{'{cliente}'}</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{'{servicio}'}</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{'{fecha}'}</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{'{hora}'}</code>, <code style={{ backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: '3px' }}>{'{negocio}'}</code>
            </div>
          </div>

          <button
            onClick={() => {
              setSavingReminders(true);
              setTimeout(() => {
                setSavingReminders(false);
                setReminderSavedToast(true);
                setTimeout(() => setReminderSavedToast(false), 3000);
              }, 600);
            }}
            disabled={savingReminders}
            style={{ alignSelf: 'flex-start', padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
          >
            {savingReminders ? 'Guardando...' : 'Guardar Configuración'}
          </button>

        </div>
      )}

      {/* Specialist Modal */}
      {showSpecialistModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', maxWidth: '420px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {editingSpecialist ? 'Editar Colaborador' : 'Nuevo Colaborador'}
            </h3>

            <form onSubmit={handleSaveSpecialist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dr. Carlos Pérez"
                  value={specialistForm.name}
                  onChange={(e) => setSpecialistForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Especialidad / Rol</label>
                <input
                  type="text"
                  placeholder="Ej: Odontólogo, Barbero, Mecánico..."
                  value={specialistForm.specialty}
                  onChange={(e) => setSpecialistForm(prev => ({ ...prev, specialty: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Teléfono WhatsApp</label>
                <input
                  type="text"
                  placeholder="50688888888"
                  value={specialistForm.phone}
                  onChange={(e) => setSpecialistForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Código PIN de Acceso (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ej: 1234 (se genera auto si está vacío)"
                  value={specialistForm.accessPin}
                  onChange={(e) => setSpecialistForm(prev => ({ ...prev, accessPin: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSpecialistModal(false)}
                  style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: NUEVA CITA MANUAL
      ============================================================== */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Agendar Nueva Cita</h3>
              <button onClick={() => setShowNewModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofía Herrera"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 50688889999"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Servicio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Limpieza Dental"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Especialista Asignado</label>
                  <select
                    value={newSpecialistId}
                    onChange={(e) => setNewSpecialistId(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {specialists.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.specialty || 'General'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Hora *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Monto (₡ CRC)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Detalles / Notas</label>
                  <input
                    type="text"
                    placeholder="Notas..."
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
