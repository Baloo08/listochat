import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, User, Phone, CheckCircle2, Clock, Play, Check, Search, Filter,
  DollarSign, LogOut, MessageSquare, AlertCircle, Sparkles, Building2,
  FileText, Activity, Plus, X, Eye, Heart
} from 'lucide-react';
import { CustomerRecord, RecordEntry, VitalSigns } from '../../shared/types';
import { formatShortDate, formatShortTime, formatShortDateTime, getLocalDateString } from '../../shared/formatters';

interface SpecialistInfo {
  id: string;
  tenantId: string;
  tenantSlug?: string;
  name: string;
  phone?: string;
  specialty?: string;
  accessPin: string;
  businessName: string;
  showEarnings?: boolean;
}

interface AppointmentItem {
  id: string;
  name: string;
  whatsapp: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  details?: string;
  vehicleModel?: string;
  createdAt?: string;
}

interface BusinessInfo {
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  logoUrl?: string | null;
  primaryColor?: string;
}

export default function SpecialistPortal({ tenantSlug }: { tenantSlug?: string }) {
  const [specialist, setSpecialist] = useState<SpecialistInfo | null>(null);
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [customSlugInput, setCustomSlugInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'records'>('active');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // History State
  const [historyAppts, setHistoryAppts] = useState<AppointmentItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState({ totalCount: 0, totalEarnings: 0 });
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Expedientes State
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsSearch, setRecordsSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);
  const [recordEntries, setRecordEntries] = useState<RecordEntry[]>([]);
  const [loadingRecordDetail, setLoadingRecordDetail] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entrySuccessToast, setEntrySuccessToast] = useState(false);
  const [entryForm, setEntryForm] = useState<{
    entryType: 'consultation' | 'clinical_note' | 'vital_signs' | 'diagnosis' | 'treatment';
    notes: string;
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weightKg: string;
    heightCm: string;
    oxygenSaturation: string;
    diagnosis: string;
    prescription: string;
  }>({
    entryType: 'consultation',
    notes: '',
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weightKg: '',
    heightCm: '',
    oxygenSaturation: '',
    diagnosis: '',
    prescription: ''
  });
  const [savingEntry, setSavingEntry] = useState(false);

  const effectiveSlug = (tenantSlug || customSlugInput || (typeof window !== 'undefined' ? localStorage.getItem('betico_specialist_tenant_slug') : '') || '').toLowerCase().trim();

  // 1. Fetch public business branding if slug exists
  useEffect(() => {
    const slugToFetch = effectiveSlug;
    if (!slugToFetch) return;

    let cancelled = false;
    const fetchInfo = async () => {
      setLoadingInfo(true);
      try {
        const res = await fetch(`/api/specialists/portal/info/${encodeURIComponent(slugToFetch.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.success) {
            setBusinessInfo(data);
          }
        }
      } catch (err) {
        console.warn('Error fetching business info for portal:', err);
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    };

    fetchInfo();
    return () => { cancelled = true; };
  }, [tenantSlug, customSlugInput]);

  const autoLoginAttemptedRef = useRef<string | null>(null);

  // 2. Auto-restore session from localStorage & check 1-click URL pin
  useEffect(() => {
    const savedSession = localStorage.getItem('betico_specialist_session');
    const savedToken = localStorage.getItem('betico_specialist_token');

    if (savedSession && savedToken) {
      try {
        const parsed = JSON.parse(savedSession);
        const isMatchingTenant = !effectiveSlug || !parsed.tenantSlug || parsed.tenantSlug.toLowerCase() === effectiveSlug.toLowerCase();
        if (isMatchingTenant) {
          setSpecialist(parsed);
        } else {
          setSpecialist(null);
          setPin('');
        }
      } catch (e) {}
    }

    // Check URL parameters for 1-click login: ?pin=1234
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin')?.trim();
    if (pinFromUrl && !specialist) {
      const attemptKey = `${effectiveSlug || 'generic'}_${pinFromUrl}`;
      if (autoLoginAttemptedRef.current !== attemptKey) {
        autoLoginAttemptedRef.current = attemptKey;
        setPin(pinFromUrl);
        handleLogin(pinFromUrl);
      }
    }
  }, [effectiveSlug]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('betico_specialist_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (specialist?.accessPin) {
      headers['x-specialist-pin'] = specialist.accessPin;
    }
    const currentSlug = tenantSlug || specialist?.tenantSlug || localStorage.getItem('betico_specialist_tenant_slug');
    if (currentSlug) {
      headers['x-tenant-slug'] = currentSlug;
    }
    return headers;
  };

  const handleLogin = async (pinOverride?: string) => {
    const pinToUse = (typeof pinOverride === 'string' ? pinOverride : pin).trim();
    setLoginError('');
    if (!pinToUse) {
      setLoginError('Por favor ingresa tu código PIN');
      return;
    }

    const currentSlug = (tenantSlug || customSlugInput || localStorage.getItem('betico_specialist_tenant_slug') || '').toLowerCase().trim();

    setLoggingIn(true);
    try {
      const res = await fetch('/api/specialists/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToUse,
          phone: phone.trim() || undefined,
          tenantSlug: currentSlug || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto o no autorizado');
      }

      setSpecialist(data.specialist);
      if (data.token) {
        localStorage.setItem('betico_specialist_token', data.token);
      }
      localStorage.setItem('betico_specialist_session', JSON.stringify(data.specialist));
      if (data.specialist.tenantSlug || currentSlug) {
        localStorage.setItem('betico_specialist_tenant_slug', data.specialist.tenantSlug || currentSlug);
      }

      // Clean ?pin= from address bar for security
      if (window.location.search.includes('pin=')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('betico_specialist_session');
    localStorage.removeItem('betico_specialist_token');
    setSpecialist(null);
    setPin('');
    setAppointments([]);
    setHistoryAppts([]);
  };

  const loadActiveAppointments = async () => {
    if (!specialist) return;
    setLoadingAppts(true);
    try {
      const res = await fetch('/api/specialists/portal/appointments', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error('Error loading active appointments:', e);
    } finally {
      setLoadingAppts(false);
    }
  };

  const loadHistoryAppointments = async () => {
    if (!specialist) return;
    setLoadingHistory(true);
    try {
      let from = '';
      let to = '';
      const now = new Date();

      if (dateFilter === 'all') {
        from = '';
        to = '';
      } else if (dateFilter === 'today') {
        from = getLocalDateString(now);
        to = from;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = getLocalDateString(weekAgo);
        to = getLocalDateString(now);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        from = getLocalDateString(monthAgo);
        to = getLocalDateString(now);
      } else if (dateFilter === 'custom') {
        from = customFrom;
        to = customTo;
      }

      let url = '/api/specialists/portal/history';
      if (from) url += `?fromDate=${from}`;
      if (to) url += `${from ? '&' : '?'}toDate=${to}`;

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (Array.isArray(data.appointments)) {
        setHistoryAppts(data.appointments);
        setHistoryStats({
          totalCount: data.totalCount || data.appointments.length,
          totalEarnings: data.totalEarnings || 0
        });
      }
    } catch (e) {
      console.error('Error loading history appointments:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSpecialistRecords = async (searchTerm?: string) => {
    if (!specialist) return;
    setLoadingRecords(true);
    try {
      let url = '/api/specialists/portal/records';
      const term = searchTerm !== undefined ? searchTerm : recordsSearch;
      if (term) url += `?search=${encodeURIComponent(term)}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (Array.isArray(data.records)) {
        setRecords(data.records);
      }
    } catch (e) {
      console.error('Error loading specialist records:', e);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSelectRecord = async (record: CustomerRecord) => {
    setSelectedRecord(record);
    setLoadingRecordDetail(true);
    try {
      const res = await fetch(`/api/specialists/portal/records/${record.id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.record) {
        setSelectedRecord(data.record);
      }
      if (Array.isArray(data.entries)) {
        setRecordEntries(data.entries);
      }
    } catch (e) {
      console.error('Error fetching record detail:', e);
    } finally {
      setLoadingRecordDetail(false);
    }
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSavingEntry(true);
    try {
      const weightNum = entryForm.weightKg ? parseFloat(entryForm.weightKg) : undefined;
      const heightNum = entryForm.heightCm ? parseFloat(entryForm.heightCm) : undefined;
      let bmi: number | undefined;
      if (weightNum && heightNum && heightNum > 0) {
        const heightM = heightNum / 100;
        bmi = parseFloat((weightNum / (heightM * heightM)).toFixed(2));
      }

      const vitalSigns: VitalSigns = {
        bloodPressure: entryForm.bloodPressure.trim() || undefined,
        heartRate: entryForm.heartRate ? parseInt(entryForm.heartRate) : undefined,
        temperature: entryForm.temperature ? parseFloat(entryForm.temperature) : undefined,
        weightKg: weightNum,
        heightCm: heightNum,
        bmi,
        oxygenSaturation: entryForm.oxygenSaturation ? parseInt(entryForm.oxygenSaturation) : undefined,
        recordedAt: new Date().toISOString()
      };

      const payload = {
        entryType: entryForm.entryType,
        notes: entryForm.notes,
        diagnosis: entryForm.diagnosis.trim() || undefined,
        prescription: entryForm.prescription.trim() || undefined,
        vitalSigns: (vitalSigns.bloodPressure || vitalSigns.heartRate || vitalSigns.temperature || vitalSigns.weightKg || vitalSigns.oxygenSaturation) ? vitalSigns : undefined
      };

      const res = await fetch(`/api/specialists/portal/records/${selectedRecord.id}/entries`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar');
      }

      setShowAddEntryModal(false);
      setEntrySuccessToast(true);
      setTimeout(() => setEntrySuccessToast(false), 3000);
      setEntryForm({
        entryType: 'consultation',
        notes: '',
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weightKg: '',
        heightCm: '',
        oxygenSaturation: '',
        diagnosis: '',
        prescription: ''
      });
      // Refresh entries
      handleSelectRecord(selectedRecord);
    } catch (err: any) {
      alert(err.message || 'Error al guardar nota clínica');
    } finally {
      setSavingEntry(false);
    }
  };

  useEffect(() => {
    if (specialist) {
      if (activeTab === 'active') {
        loadActiveAppointments();
      } else if (activeTab === 'history') {
        loadHistoryAppointments();
      } else if (activeTab === 'records') {
        loadSpecialistRecords();
      }
    }
  }, [specialist, activeTab, dateFilter, customFrom, customTo]);

  const handleUpdateStatus = async (apptId: string, status: string) => {
    if (!specialist) return;
    try {
      await fetch(`/api/specialists/portal/appointments/${apptId}/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      loadActiveAppointments();
    } catch (e) {
      alert('Error al actualizar estado de la cita');
    }
  };

  const primaryColor = businessInfo?.primaryColor || '#0284c7';
  const brandName = businessInfo?.businessName || specialist?.businessName || (effectiveSlug ? `Comercio (${effectiveSlug})` : 'Tu Negocio');

  // LOGIN SCREEN
  if (!specialist) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        backgroundColor: '#0f172a', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '24px', padding: '36px 28px',
          maxWidth: '420px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {businessInfo?.logoUrl ? (
              <img
                src={businessInfo.logoUrl}
                alt={brandName}
                style={{
                  maxHeight: '64px',
                  maxWidth: '180px',
                  objectFit: 'contain',
                  margin: '0 auto 14px auto',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                width: '64px', height: '64px', backgroundColor: `${primaryColor}15`,
                borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto', border: `1px solid ${primaryColor}30`
              }}>
                <Calendar size={32} color={primaryColor} />
              </div>
            )}

            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
              Portal de Colaboradores
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
              {brandName}
            </p>

            {effectiveSlug && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginTop: '8px', padding: '3px 10px', backgroundColor: '#f1f5f9',
                borderRadius: '999px', fontSize: '0.75rem', color: '#475569', fontWeight: '600'
              }}>
                <Building2 size={12} color="#64748b" /> {effectiveSlug}
              </div>
            )}
          </div>

          {loginError && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* If accessed via generic /especialista without slug, allow specifying business */}
            {!tenantSlug && !localStorage.getItem('betico_specialist_tenant_slug') && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Identificador del Negocio (Slug)
                </label>
                <input
                  type="text"
                  placeholder="ej: barberia-elite"
                  value={customSlugInput}
                  onChange={(e) => setCustomSlugInput(e.target.value.toLowerCase().trim())}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '0.9rem', boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Código PIN de Acceso
              </label>
              <input
                type="password"
                required
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{
                  width: '100%', padding: '12px', textAlign: 'center', letterSpacing: '6px',
                  fontSize: '1.4rem', fontWeight: 'bold', borderRadius: '10px', border: '1px solid #cbd5e1',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Teléfono (Opcional)
              </label>
              <input
                type="text"
                placeholder="50688888888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '0.9rem', boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              style={{
                width: '100%', padding: '13px', backgroundColor: primaryColor, color: 'white',
                border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '0.95rem',
                cursor: loggingIn ? 'not-allowed' : 'pointer', marginTop: '6px',
                boxShadow: `0 4px 12px ${primaryColor}40`, transition: 'all 0.2s'
              }}
            >
              {loggingIn ? 'Validando credenciales...' : 'Ingresar a mi Agenda'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // LOGGED IN VIEW
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {businessInfo?.logoUrl && (
              <img
                src={businessInfo.logoUrl}
                alt={specialist.businessName}
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
            )}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{specialist.businessName}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={18} color={primaryColor} /> {specialist.name}
                <span style={{ fontSize: '0.72rem', backgroundColor: `${primaryColor}15`, color: primaryColor, padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                  {specialist.specialty || 'Especialista'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '7px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
              borderRadius: '8px', fontSize: '0.8rem', color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'
            }}
          >
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 20px' }}>
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '3px', marginBottom: '20px', gap: '3px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.82rem',
              cursor: 'pointer', backgroundColor: activeTab === 'active' ? '#ffffff' : 'transparent',
              color: activeTab === 'active' ? primaryColor : '#64748b', boxShadow: activeTab === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📋 Citas ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.82rem',
              cursor: 'pointer', backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? primaryColor : '#64748b', boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📊 Historial
          </button>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.82rem',
              cursor: 'pointer', backgroundColor: activeTab === 'records' ? '#ffffff' : 'transparent',
              color: activeTab === 'records' ? primaryColor : '#64748b', boxShadow: activeTab === 'records' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📁 Expedientes ({records.length})
          </button>
        </div>

        {/* TAB 1: ACTIVE APPOINTMENTS */}
        {activeTab === 'active' && (
          <div>
            {loadingAppts ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando citas...</div>
            ) : appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>
                  ¡Todo al día!
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  No tienes citas pendientes asignadas en este momento.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {appointments.map(a => {
                  const cleanPhone = (a.whatsapp || '').replace(/\D/g, '');
                  const waUrl = `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(a.name)},%20te%20escribo%20de%20${encodeURIComponent(specialist.businessName)}%20sobre%20tu%20cita%20de%20${encodeURIComponent(a.service)}.`;

                  return (
                    <div key={a.id} style={{
                      backgroundColor: '#ffffff', borderRadius: '14px', padding: '18px',
                      border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
                            {a.name}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: primaryColor, fontWeight: 'bold' }}>
                            {a.service}
                          </span>
                        </div>
                        <span style={{
                          padding: '3px 9px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                          backgroundColor: a.status === 'in_progress' ? '#fef3c7' : '#e0f2fe',
                          color: a.status === 'in_progress' ? '#b45309' : '#0369a1'
                        }}>
                          {a.status === 'in_progress' ? 'En Atención' : 'Pendiente'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: specialist?.showEarnings !== false ? '1fr 1fr' : '1fr', gap: '8px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Fecha y Hora:</span>
                          <strong>📅 {formatShortDate(a.date)} • ⏰ {formatShortTime(a.time)}</strong>
                        </div>
                        {specialist?.showEarnings !== false && (
                          <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Monto:</span>
                            <strong>₡{Number(a.amount || 0).toLocaleString('es-CR')}</strong>
                          </div>
                        )}
                        {a.vehicleModel && (
                          <div style={{ gridColumn: specialist?.showEarnings !== false ? 'span 2' : 'span 1' }}>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Detalle / Vehículo:</span>
                            <span>{a.vehicleModel}</span>
                          </div>
                        )}
                        {a.details && (
                          <div style={{ gridColumn: specialist?.showEarnings !== false ? 'span 2' : 'span 1' }}>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Notas:</span>
                            <span>{a.details}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '8px 12px', backgroundColor: '#25D366', color: 'white',
                            borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <MessageSquare size={15} /> WhatsApp
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setRecordsSearch(a.name || a.whatsapp);
                            setActiveTab('records');
                            loadSpecialistRecords(a.name || a.whatsapp);
                          }}
                          style={{
                            padding: '8px 12px', backgroundColor: '#f0fdfa', color: '#0d9488',
                            border: '1px solid #99f6e4', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <FileText size={15} /> Expediente
                        </button>

                        {a.status !== 'in_progress' ? (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'in_progress')}
                            style={{
                              flex: 1, padding: '8px', backgroundColor: primaryColor, color: 'white',
                              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                            }}
                          >
                            <Play size={14} /> Iniciar Atención
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'completed')}
                            style={{
                              flex: 1, padding: '8px', backgroundColor: '#10b981', color: 'white',
                              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                            }}
                          >
                            <Check size={16} /> Completar Cita
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div>
            {/* Filter Bar */}
            <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(['all', 'today', 'week', 'month', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilter(mode)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                      fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: dateFilter === mode ? primaryColor : '#f8fafc',
                      color: dateFilter === mode ? '#ffffff' : '#475569'
                    }}
                  >
                    {mode === 'all' ? 'Todas' : mode === 'today' ? 'Hoy' : mode === 'week' ? 'Esta Semana' : mode === 'month' ? 'Este Mes' : 'Rango'}
                  </button>
                ))}
              </div>

              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                  <span>hasta</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              {/* KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: specialist?.showEarnings !== false ? '1fr 1fr' : '1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>Citas Realizadas:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>{historyStats.totalCount}</strong>
                </div>
                {specialist?.showEarnings !== false && (
                  <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '0.72rem', color: '#1e40af', display: 'block' }}>Total Atendido:</span>
                    <strong style={{ fontSize: '1.2rem', color: '#1e40af' }}>₡{historyStats.totalEarnings.toLocaleString('es-CR')}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* List */}
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Consultando historial...</div>
            ) : historyAppts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                No hay atenciones completadas en el rango de fechas seleccionado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historyAppts.map(h => (
                  <div key={h.id} style={{
                    backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px',
                    border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>{h.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.service} • {formatShortDate(h.date)} • {formatShortTime(h.time)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {specialist?.showEarnings !== false && (
                        <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '0.95rem' }}>
                          ₡{Number(h.amount || 0).toLocaleString('es-CR')}
                        </div>
                      )}
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                        Completada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPEDIENTES (RECORDS CONSULTATION & EVOLUTIONS) */}
        {activeTab === 'records' && (
          <div>
            {/* Header & Search */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
                    Expedientes de Pacientes y Clientes Asignados
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Solo puedes consultar los expedientes de pacientes con citas asignadas a tu perfil.
                  </p>
                </div>
              </div>

              {entrySuccessToast && (
                <div style={{ padding: '8px 12px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '12px' }}>
                  ✓ Nota clínica y evolución registrada exitosamente en el expediente.
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre, cédula o teléfono..."
                    value={recordsSearch}
                    onChange={(e) => {
                      setRecordsSearch(e.target.value);
                      loadSpecialistRecords(e.target.value);
                    }}
                    style={{
                      width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px',
                      border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box'
                    }}
                  />
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <button
                  type="button"
                  onClick={() => loadSpecialistRecords()}
                  style={{
                    padding: '9px 14px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1',
                    borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: '#334155'
                  }}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Records List */}
            {loadingRecords ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando expedientes asignados...</div>
            ) : records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '45px 20px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <FileText size={38} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a' }}>
                  No se encontraron expedientes
                </h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.84rem' }}>
                  {recordsSearch ? 'No hay pacientes que coincidan con la búsqueda.' : 'No tienes pacientes asignados actualmente.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {records.map(r => (
                  <div key={r.id} style={{
                    backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px',
                    border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
                            {r.fullName}
                          </h4>
                          <span style={{
                            fontSize: '0.72rem', padding: '2px 7px', borderRadius: '10px', fontWeight: 'bold',
                            backgroundColor: r.clientType === 'paciente' ? '#ede9fe' : '#e0f2fe',
                            color: r.clientType === 'paciente' ? '#6d28d9' : '#0369a1'
                          }}>
                            {r.clientType === 'paciente' ? '🏥 Paciente' : '👤 General'}
                          </span>
                        </div>
                        {r.identification && (
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            ID: <strong style={{ color: '#334155' }}>{r.identification}</strong>
                          </div>
                        )}
                      </div>

                      {r.phone && (
                        <a
                          href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '4px 10px', backgroundColor: '#25D36615', color: '#16a34a',
                            borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <MessageSquare size={13} /> {r.phone}
                        </a>
                      )}
                    </div>

                    {/* Vitals Summary if available */}
                    {r.vitalSigns && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '8px 0', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        {r.vitalSigns.bloodPressure && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            PA: {r.vitalSigns.bloodPressure}
                          </span>
                        )}
                        {r.vitalSigns.heartRate && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            FC: {r.vitalSigns.heartRate} lpm
                          </span>
                        )}
                        {r.vitalSigns.weightKg && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            Peso: {r.vitalSigns.weightKg} kg
                          </span>
                        )}
                        {r.vitalSigns.bmi && (
                          <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            IMC: {r.vitalSigns.bmi}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleSelectRecord(r)}
                        style={{
                          flex: 1, padding: '8px', backgroundColor: '#f8fafc', color: '#334155',
                          border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem',
                          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <Eye size={15} color="#475569" /> Ver Historial & Citas
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecord(r);
                          setShowAddEntryModal(true);
                        }}
                        style={{
                          flex: 1, padding: '8px', backgroundColor: primaryColor, color: 'white',
                          border: 'none', borderRadius: '8px', fontSize: '0.82rem',
                          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <Plus size={15} /> + Nota / Evolución
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ==============================================================
          MODAL: DETALLE DEL EXPEDIENTE (HISTORIAL Y EVOLUCIONES)
      ============================================================== */}
      {selectedRecord && !showAddEntryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                    {selectedRecord.fullName}
                  </h3>
                  <span style={{
                    fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold',
                    backgroundColor: selectedRecord.clientType === 'paciente' ? '#ede9fe' : '#e0f2fe',
                    color: selectedRecord.clientType === 'paciente' ? '#6d28d9' : '#0369a1'
                  }}>
                    {selectedRecord.clientType === 'paciente' ? '🏥 Paciente' : '👤 Cliente General'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {selectedRecord.identification && `ID: ${selectedRecord.identification} • `}
                  {selectedRecord.phone && `Tel: ${selectedRecord.phone}`}
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={22} />
              </button>
            </div>

            {/* Clinical Background (if Paciente) */}
            {selectedRecord.clientType === 'paciente' && (
              <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '0.84rem' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 'bold', color: '#6b21a8' }}>
                  🩺 Antecedentes Clínicos del Paciente
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#7e22ce', fontWeight: '600', fontSize: '0.75rem', display: 'block' }}>Alergias:</span>
                    <span>{selectedRecord.allergies || 'Ninguna reportada'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#7e22ce', fontWeight: '600', fontSize: '0.75rem', display: 'block' }}>Medicamentos Actuales:</span>
                    <span>{selectedRecord.currentMedications || 'Ninguno'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#7e22ce', fontWeight: '600', fontSize: '0.75rem', display: 'block' }}>Patologías / Diagnósticos Previos:</span>
                    <span>{selectedRecord.pathologicalBackground || selectedRecord.diagnosis || 'Sin registro'}</span>
                  </div>
                  {selectedRecord.emergencyContactName && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#7e22ce', fontWeight: '600', fontSize: '0.75rem', display: 'block' }}>Contacto de Emergencia:</span>
                      <span>{selectedRecord.emergencyContactName} {selectedRecord.emergencyContactPhone ? `(${selectedRecord.emergencyContactPhone})` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action button: add evolution */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>
                Evoluciones y Notas Clínicas ({recordEntries.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEntryModal(true)}
                style={{
                  padding: '7px 12px', backgroundColor: primaryColor, color: 'white',
                  border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Plus size={14} /> + Agregar Nota
              </button>
            </div>

            {/* Entries List */}
            {loadingRecordDetail ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Cargando evoluciones...</div>
            ) : recordEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                No hay notas ni evoluciones clínicas registradas aún para este paciente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recordEntries.map(e => (
                  <div key={e.id} style={{
                    backgroundColor: '#f8fafc', borderRadius: '10px', padding: '12px 14px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                        backgroundColor: '#e0f2fe', color: '#0369a1'
                      }}>
                        {e.entryType === 'consultation' ? '🩺 Consulta' : e.entryType === 'vital_signs' ? '📊 Signos Vitales' : e.entryType === 'diagnosis' ? '🔬 Diagnóstico' : '📝 Nota de Evolución'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatShortDateTime(e.createdAt)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'pre-wrap', marginBottom: '6px' }}>
                      {e.notes}
                    </div>

                    {e.vitalSigns && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1' }}>
                        {e.vitalSigns.bloodPressure && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            PA: {e.vitalSigns.bloodPressure}
                          </span>
                        )}
                        {e.vitalSigns.heartRate && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            FC: {e.vitalSigns.heartRate} lpm
                          </span>
                        )}
                        {e.vitalSigns.temperature && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            Temp: {e.vitalSigns.temperature}°C
                          </span>
                        )}
                        {e.vitalSigns.weightKg && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            Peso: {e.vitalSigns.weightKg} kg
                          </span>
                        )}
                        {e.vitalSigns.heightCm && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            Talla: {e.vitalSigns.heightCm} cm
                          </span>
                        )}
                        {e.vitalSigns.bmi && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            IMC: {e.vitalSigns.bmi}
                          </span>
                        )}
                        {e.vitalSigns.oxygenSaturation && (
                          <span style={{ fontSize: '0.72rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            SpO2: {e.vitalSigns.oxygenSaturation}%
                          </span>
                        )}
                      </div>
                    )}

                    {e.diagnosis && (
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#0f766e' }}>
                        <strong>Diagnóstico:</strong> {e.diagnosis}
                      </div>
                    )}

                    {e.prescription && (
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#4338ca' }}>
                        <strong>Tratamiento:</strong> {e.prescription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ padding: '8px 18px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: AGREGAR NOTA CLÍNICA / EVOLUCIÓN (COLABORADOR)
      ============================================================== */}
      {showAddEntryModal && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                  Registrar Nota Clínica / Evolución
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Paciente: <strong style={{ color: '#0f172a' }}>{selectedRecord.fullName}</strong>
                </div>
              </div>
              <button onClick={() => setShowAddEntryModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                  Tipo de Registro *
                </label>
                <select
                  value={entryForm.entryType}
                  onChange={(e) => setEntryForm({ ...entryForm, entryType: e.target.value as any })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="consultation">🩺 Consulta de Atención</option>
                  <option value="clinical_note">📝 Nota de Evolución</option>
                  <option value="vital_signs">📊 Toma de Signos Vitales</option>
                  <option value="diagnosis">🔬 Diagnóstico / Hallazgos</option>
                  <option value="treatment">💊 Tratamiento / Prescripción</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                  Observaciones / Notas Clínicas *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detalles de la sesión, sintomatología, procedimiento efectuado, respuesta del paciente..."
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Vital Signs Section (optional) */}
              <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>
                  📊 Signos Vitales (Opcional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Presión Arterial (PA)</label>
                    <input
                      type="text"
                      placeholder="Ej: 120/80"
                      value={entryForm.bloodPressure}
                      onChange={(e) => setEntryForm({ ...entryForm, bloodPressure: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Frecuencia Cardíaca (lpm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 75"
                      value={entryForm.heartRate}
                      onChange={(e) => setEntryForm({ ...entryForm, heartRate: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Temperatura (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 36.5"
                      value={entryForm.temperature}
                      onChange={(e) => setEntryForm({ ...entryForm, temperature: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Saturación SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="Ej: 98"
                      value={entryForm.oxygenSaturation}
                      onChange={(e) => setEntryForm({ ...entryForm, oxygenSaturation: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 70.5"
                      value={entryForm.weightKg}
                      onChange={(e) => setEntryForm({ ...entryForm, weightKg: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Talla (cm)</label>
                    <input
                      type="number"
                      placeholder="Ej: 170"
                      value={entryForm.heightCm}
                      onChange={(e) => setEntryForm({ ...entryForm, heightCm: e.target.value })}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                  Diagnóstico Clínico (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Gingivitis marginal moderada"
                  value={entryForm.diagnosis}
                  onChange={(e) => setEntryForm({ ...entryForm, diagnosis: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#334155' }}>
                  Tratamiento / Indicaciones al Paciente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Enjuague con clorhexidina 0.12% c/12h por 7 días"
                  value={entryForm.prescription}
                  onChange={(e) => setEntryForm({ ...entryForm, prescription: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEntryModal(false)}
                  style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEntry}
                  style={{
                    padding: '8px 18px', backgroundColor: primaryColor, color: 'white',
                    border: 'none', borderRadius: '6px', cursor: savingEntry ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold', fontSize: '0.85rem'
                  }}
                >
                  {savingEntry ? 'Guardando...' : 'Guardar Evolución'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
