import React, { useState, useEffect } from 'react';
import { Calendar, User, Phone, CheckCircle2, Clock, Play, Check, Search, Filter, DollarSign, LogOut, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

interface SpecialistInfo {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  specialty?: string;
  accessPin: string;
  businessName: string;
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

export default function SpecialistPortal() {
  const [specialist, setSpecialist] = useState<SpecialistInfo | null>(null);
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // History State
  const [historyAppts, setHistoryAppts] = useState<AppointmentItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState({ totalCount: 0, totalEarnings: 0 });
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Auto-restore session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('betico_specialist_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSpecialist(parsed);
      } catch (e) {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!pin.trim()) {
      setLoginError('Por favor ingresa tu código PIN');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await fetch('/api/specialists/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), phone: phone.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN incorrecto');
      }

      setSpecialist(data.specialist);
      localStorage.setItem('betico_specialist_session', JSON.stringify(data.specialist));
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('betico_specialist_session');
    setSpecialist(null);
    setPin('');
    setAppointments([]);
  };

  const loadActiveAppointments = async () => {
    if (!specialist) return;
    setLoadingAppts(true);
    try {
      const res = await fetch('/api/specialists/portal/appointments', {
        headers: { 'x-specialist-pin': specialist.accessPin }
      });
      const data = await res.json();
      if (Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error(e);
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

      if (dateFilter === 'today') {
        from = now.toISOString().split('T')[0];
        to = from;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = weekAgo.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        from = monthAgo.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        from = customFrom;
        to = customTo;
      }

      let url = '/api/specialists/portal/history';
      if (from) url += `?fromDate=${from}`;
      if (to) url += `${from ? '&' : '?'}toDate=${to}`;

      const res = await fetch(url, {
        headers: { 'x-specialist-pin': specialist.accessPin }
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
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (specialist) {
      if (activeTab === 'active') {
        loadActiveAppointments();
      } else {
        loadHistoryAppointments();
      }
    }
  }, [specialist, activeTab, dateFilter, customFrom, customTo]);

  const handleUpdateStatus = async (apptId: string, status: string) => {
    if (!specialist) return;
    try {
      await fetch(`/api/specialists/portal/appointments/${apptId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-specialist-pin': specialist.accessPin
        },
        body: JSON.stringify({ status })
      });
      loadActiveAppointments();
    } catch (e) {
      alert('Error al actualizar cita');
    }
  };

  // LOGIN SCREEN
  if (!specialist) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        backgroundColor: '#0f172a', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '20px', padding: '36px 28px',
          maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', backgroundColor: '#e0f2fe',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px auto', border: '1px solid #bae6fd'
            }}>
              <Calendar size={32} color="#0284c7" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>
              Portal de Especialistas
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Ingresa con tu código PIN asignado
            </p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Código PIN (4 dígitos)
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
                  fontSize: '1.3rem', fontWeight: 'bold', borderRadius: '8px', border: '1px solid #cbd5e1',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Teléfono (Opcional si compartes PIN)
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
                width: '100%', padding: '12px', backgroundColor: '#0284c7', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem',
                cursor: loggingIn ? 'not-allowed' : 'pointer', marginTop: '6px'
              }}
            >
              {loggingIn ? 'Accediendo...' : 'Ingresar al Portal'}
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
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{specialist.businessName}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={18} color="#0284c7" /> {specialist.name}
              <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px' }}>
                {specialist.specialty || 'Especialista'}
              </span>
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
        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', backgroundColor: activeTab === 'active' ? '#ffffff' : 'transparent',
              color: activeTab === 'active' ? '#0284c7' : '#64748b', boxShadow: activeTab === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📋 Citas Asignadas ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#0284c7' : '#64748b', boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            📊 Historial de Atenciones
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
                  const cleanPhone = (a.whatsapp || '').replace(/\\D/g, '');
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
                          <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 'bold' }}>
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

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Fecha y Hora:</span>
                          <strong>📅 {a.date} • ⏰ {a.time}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Monto:</span>
                          <strong>₡{Number(a.amount || 0).toLocaleString('es-CR')}</strong>
                        </div>
                        {a.vehicleModel && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Detalle / Vehículo:</span>
                            <span>{a.vehicleModel}</span>
                          </div>
                        )}
                        {a.details && (
                          <div style={{ gridColumn: 'span 2' }}>
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

                        {a.status !== 'in_progress' ? (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'in_progress')}
                            style={{
                              flex: 1, padding: '8px', backgroundColor: '#0284c7', color: 'white',
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
                {(['today', 'week', 'month', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilter(mode)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                      fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: dateFilter === mode ? '#0284c7' : '#f8fafc',
                      color: dateFilter === mode ? '#ffffff' : '#475569'
                    }}
                  >
                    {mode === 'today' ? 'Hoy' : mode === 'week' ? 'Esta Semana' : mode === 'month' ? 'Este Mes' : 'Rango'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>Citas Realizadas:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>{historyStats.totalCount}</strong>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.72rem', color: '#1e40af', display: 'block' }}>Total Atendido:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#1e40af' }}>₡{historyStats.totalEarnings.toLocaleString('es-CR')}</strong>
                </div>
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
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.service} • {h.date} {h.time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '0.95rem' }}>
                        ₡{Number(h.amount || 0).toLocaleString('es-CR')}
                      </div>
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

      </div>
    </div>
  );
}
