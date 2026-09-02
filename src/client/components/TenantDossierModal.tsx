import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
  X, User, Calendar, CreditCard, Bot, ShoppingBag, MessageSquare, 
  Clock, DollarSign, FileText, CheckCircle, AlertTriangle, Send, 
  ExternalLink, Key, Plus, RefreshCw, Phone, Mail, ShieldCheck, Tag
} from 'lucide-react';

interface Props {
  tenantId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function TenantDossierModal({ tenantId, onClose, onRefresh }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  
  // Quick payment registration modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(55000);
  const [payRef, setPayRef] = useState('');
  const [payMethod, setPayMethod] = useState('sinpe');
  const [payNotes, setPayNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  const api = useApi();

  const loadDossier = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/tenants/${tenantId}/dossier`);
      if (res) {
        setData(res);
        setNotesText(res.internalNotes || '');
        if (res.tenant?.nextBillingDate) {
          setSelectedDate(res.tenant.nextBillingDate.split('T')[0]);
        }
        setPayAmount(Number(res.tenant?.customMonthlyPrice) || 55000);
      }
    } catch (err: any) {
      alert('Error cargando expediente: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [tenantId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.put(`/api/tenants/${tenantId}/internal-notes`, { notes: notesText });
      alert('¡Anotaciones internas guardadas!');
    } catch (err: any) {
      alert('Error guardando notas: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDate = async () => {
    if (!selectedDate) return;
    setSavingDate(true);
    try {
      await api.put(`/api/tenants/${tenantId}/next-billing-date`, { nextBillingDate: selectedDate });
      setEditingDate(false);
      loadDossier();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error actualizando fecha: ' + err.message);
    } finally {
      setSavingDate(false);
    }
  };

  const handleQuickAddDays = async (days: number) => {
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    try {
      await api.put(`/api/tenants/${tenantId}/next-billing-date`, { nextBillingDate: newDateStr });
      loadDossier();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPay(true);
    try {
      await api.post(`/api/tenants/${tenantId}/record-payment`, {
        amount: payAmount,
        currency: data?.tenant?.billingCurrency || 'CRC',
        paymentMethod: payMethod,
        reference: payRef,
        notes: payNotes,
        extendDays: 30
      });
      alert('¡Pago registrado con éxito! Suscripción extendida 30 días.');
      setShowPayModal(false);
      setPayRef('');
      setPayNotes('');
      loadDossier();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert('Error registrando pago: ' + err.message);
    } finally {
      setSavingPay(false);
    }
  };

  const handleImpersonate = async () => {
    try {
      const currentToken = localStorage.getItem('token') || '';
      const res = await api.post(`/api/tenants/${tenantId}/impersonate`, {});
      if (res.token) {
        localStorage.setItem('superadmin_token', currentToken);
        localStorage.setItem('impersonated_tenant_name', data?.tenant?.name || 'Cliente');
        localStorage.setItem('token', res.token);
        window.location.href = '/panel';
      }
    } catch (e: any) {
      alert('Error al acceder al portal: ' + e.message);
    }
  };

  const handleToggleCourts = async () => {
    try {
      const currentlyEnabled = data?.storeModules?.courtsEnabled === true;
      await api.post(`/api/superadmin/platform/tenants/${tenantId}/toggle-courts`, { enabled: !currentlyEnabled });
      alert(`Módulo de Canchas ${!currentlyEnabled ? 'ACTIVADO' : 'DESACTIVADO'} para ${data?.tenant?.name}`);
      loadDossier();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const openWhatsApp = (msg?: string) => {
    const rawPhone = (data?.tenant?.whatsappNumber || data?.tenant?.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone) {
      alert('El cliente no tiene teléfono de WhatsApp registrado.');
      return;
    }
    const cleanPhone = rawPhone.length === 8 ? '506' + rawPhone : rawPhone;
    const defaultMsg = msg || `¡Hola ${data?.tenant?.name}! Te saludamos del equipo de Betico. ¿En qué podemos ayudarte hoy?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  const openBillingReminder = () => {
    const priceFormatted = (Number(data?.tenant?.customMonthlyPrice) || 55000).toLocaleString('es-CR');
    const msg = `¡Hola ${data?.tenant?.name}! Te saludamos de Betico. Te recordamos que tu suscripción mensual (${data?.tenant?.billingCurrency || 'CRC'} ${priceFormatted}) vence pronto. Puedes realizar tu pago por SINPE Móvil o transferencia. ¡Gracias por confiar en Betico!`;
    openWhatsApp(msg);
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '30px', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <RefreshCw className="animate-spin" size={24} color="#3b82f6" />
          <span>Cargando expediente integral del cliente...</span>
        </div>
      </div>
    );
  }

  const tenant = data?.tenant || {};
  const metrics = data?.metrics || {};
  const payments = data?.payments || [];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: '20px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        
        {/* HEADER */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', backgroundColor: '#1e293b' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: 'rgba(37, 99, 235, 0.2)', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800', color: '#60a5fa' }}>
              {tenant.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc' }}>{tenant.name}</h2>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  backgroundColor: tenant.subscriptionStatus === 'suspended' ? 'rgba(239, 68, 68, 0.2)' : tenant.subscriptionStatus === 'trial' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: tenant.subscriptionStatus === 'suspended' ? '#f87171' : tenant.subscriptionStatus === 'trial' ? '#60a5fa' : '#34d399',
                  border: '1px solid currentColor'
                }}>
                  {tenant.subscriptionStatus === 'suspended' ? '🔴 Suspendido' : tenant.subscriptionStatus === 'trial' ? '🔵 En Prueba' : '🟢 Activo'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>Slug: <strong style={{ color: '#cbd5e1' }}>/{tenant.slug}</strong></span>
                <span>•</span>
                <span>Registro: <strong style={{ color: '#cbd5e1' }}>{new Date(tenant.createdAt).toLocaleDateString('es-CR')}</strong></span>
                <span>•</span>
                <span>Plan: <strong style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{tenant.plan}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleImpersonate}
              style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Key size={15} /> Entrar al Portal
            </button>
            <button
              onClick={() => openWhatsApp()}
              style={{ padding: '8px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Phone size={15} /> WhatsApp
            </button>
            <button
              onClick={handleToggleCourts}
              style={{ padding: '8px 14px', backgroundColor: data?.storeModules?.courtsEnabled ? '#f59e0b' : '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              ⚽ {data?.storeModules?.courtsEnabled ? 'Desactivar Canchas' : 'Activar Canchas'}
            </button>
            <button onClick={onClose} style={{ padding: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* RESOURCE USAGE KPI CARDS */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
              📊 Consumo de Recursos y Tráfico del Comercio
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              
              <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.8rem', fontWeight: '700' }}>
                  <Bot size={16} /> Tokens IA Este Mes
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', marginTop: '6px' }}>
                  {metrics.aiTokensUsed.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  {metrics.aiRequestsCount} peticiones procesadas
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.8rem', fontWeight: '700' }}>
                  <ShoppingBag size={16} /> Órdenes Totales
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', marginTop: '6px' }}>
                  {metrics.ordersCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  en tienda y WhatsApp
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.8rem', fontWeight: '700' }}>
                  <Calendar size={16} /> Citas Agendadas
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', marginTop: '6px' }}>
                  {metrics.appointmentsCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  reservas en agenda
                </div>
              </div>

              <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', fontSize: '0.8rem', fontWeight: '700' }}>
                  <MessageSquare size={16} /> Mensajes Bot
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#f8fafc', marginTop: '6px' }}>
                  {metrics.chatsCount}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  chats respondidos
                </div>
              </div>

            </div>
          </div>

          {/* BILLING & SUBSCRIPTION SECTION */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Estado de Cuenta & Próximo Cobro</h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={openBillingReminder}
                  style={{ padding: '7px 12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Recordatorio Cobro WhatsApp
                </button>
                <button
                  onClick={() => setShowPayModal(true)}
                  style={{ padding: '7px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Registrar Pago (+30 días)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monto Mensual Pactado</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', marginTop: '2px' }}>
                  {tenant.billingCurrency === 'USD' ? '$' : '₡'} {(Number(tenant.customMonthlyPrice) || 55000).toLocaleString('es-CR')} / mes
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fecha de Próximo Pago</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {!editingDate ? (
                    <>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8' }}>
                        {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'No asignada'}
                      </div>
                      <button
                        onClick={() => setEditingDate(true)}
                        style={{ padding: '4px 8px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        Cambiar
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '0.82rem' }}
                      />
                      <button
                        onClick={handleSaveDate}
                        disabled={savingDate}
                        style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {savingDate ? '...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Add Days Pills */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button onClick={() => handleQuickAddDays(30)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+30d</button>
                  <button onClick={() => handleQuickAddDays(15)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+15d</button>
                  <button onClick={() => handleQuickAddDays(365)} style={{ padding: '3px 8px', backgroundColor: '#334155', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+1 año</button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Datos de Contacto Admin</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', marginTop: '2px' }}>
                  {tenant.adminEmail || 'Sin correo registrado'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                  📱 {tenant.whatsappNumber || 'Sin WhatsApp'}
                </div>
              </div>

            </div>
          </div>

          {/* PAYMENT HISTORY TABLE */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#34d399" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Historial de Pagos Registrados</h4>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{payments.length} pagos</span>
            </div>

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem' }}>
                No hay pagos registrados aún en este comercio.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '8px 10px' }}>Fecha</th>
                      <th style={{ padding: '8px 10px' }}>Monto</th>
                      <th style={{ padding: '8px 10px' }}>Método</th>
                      <th style={{ padding: '8px 10px' }}>Referencia</th>
                      <th style={{ padding: '8px 10px' }}>Notas</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                          {new Date(p.createdAt).toLocaleDateString('es-CR')}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#34d399' }}>
                          {p.currency === 'USD' ? '$' : '₡'} {Number(p.amount).toLocaleString('es-CR')}
                        </td>
                        <td style={{ padding: '8px 10px', textTransform: 'uppercase', color: '#94a3b8' }}>
                          {p.paymentMethod}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                          <code>{p.reference || 'N/A'}</code>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                          {p.notes || '-'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.72rem', fontWeight: 'bold' }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* INTERNAL NOTES / BITACORA */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#f59e0b" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>Bitácora & Anotaciones Internas de Soporte (Solo SuperAdmin)</h4>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {savingNotes ? 'Guardando...' : 'Guardar Notas'}
              </button>
            </div>
            <textarea
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Escribe acuerdos, detalles de contacto, prórrogas de pago o notas del cliente..."
              style={{ width: '100%', padding: '10px 14px', backgroundColor: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '10px', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
          </div>

        </div>

        {/* MODAL INTERNO: REGISTRAR PAGO */}
        {showPayModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', maxWidth: '440px', width: '100%', border: '1px solid #3b82f6' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>💵 Registrar Pago de Cliente</h3>
              <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Monto a Registrar</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Método de Pago</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                  >
                    <option value="sinpe">SINPE Móvil</option>
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="cash">Efectivo / Depósito</option>
                    <option value="card">Tarjeta</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Número de Comprobante / Referencia</label>
                  <input
                    type="text"
                    placeholder="Ej. SINPE #847291"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Notas de Pago</label>
                  <input
                    type="text"
                    placeholder="Ej. Pago de mensualidad Septiembre"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowPayModal(false)} style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px' }}>Cancelar</button>
                  <button type="submit" disabled={savingPay} style={{ padding: '8px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                    {savingPay ? 'Registrando...' : 'Confirmar & Extender 30 Días'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
