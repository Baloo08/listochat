import React, { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  AlertTriangle,
  RotateCw,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Cpu,
  Power,
  RefreshCw,
  Sparkles,
  ChevronRight,
  UserCheck,
  Phone,
  Send,
  MapPin,
  Navigation,
  Copy,
  Check,
  CreditCard,
  Plus,
  FileText,
  Key,
  Layers,
  Award,
  Sliders,
  Shield,
  Bot
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function MonitoringCenter() {
  const api = useAdminApi();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'errors' | 'audit' | 'payments'>('errors');

  // Internal Notes State
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Billing Date State
  const [editingDate, setEditingDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  // Quick Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(55000);
  const [payRef, setPayRef] = useState('');
  const [payMethod, setPayMethod] = useState('sinpe');
  const [payNotes, setPayNotes] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  // Tilopay Card Modal & Actions State
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardLast4Input, setCardLast4Input] = useState('');
  const [cardBrandInput, setCardBrandInput] = useState('VISA');
  const [cardHolderInput, setCardHolderInput] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [chargingTilopay, setChargingTilopay] = useState(false);

  // Copy Feedback States
  const [copiedUuid, setCopiedUuid] = useState(false);
  const [copiedInstance, setCopiedInstance] = useState(false);

  // Multi-criteria instant search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get(`/api/monitoring/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setSearchResults(results || []);
      } catch (e) {
        console.warn('Error en búsqueda de clientes:', e);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadDossier = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setLoadingDossier(true);
    setActionMessage(null);
    try {
      const data = await api.get(`/api/monitoring/tenant/${tenantId}`);
      setDossier(data);
      setNotesText(data.tenant.internalNotes || '');
      setSelectedDate(data.tenant.nextBillingDate || '');
      setPayAmount(Number(data.tenant.customMonthlyPrice) || 55000);
    } catch (err: any) {
      alert('Error al cargar expediente del cliente: ' + (err.message || 'Error'));
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTenantId) return;
    setSavingNotes(true);
    try {
      await api.put(`/api/monitoring/tenant/${selectedTenantId}/notes`, { notes: notesText });
      setActionMessage('¡Bitácora interna guardada con éxito en la base de datos!');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error guardando notas: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDate = async () => {
    if (!selectedTenantId || !selectedDate) return;
    setSavingDate(true);
    try {
      await api.put(`/api/monitoring/tenant/${selectedTenantId}/next-billing-date`, { nextBillingDate: selectedDate });
      setEditingDate(false);
      setActionMessage(`Fecha de cobro actualizada a ${selectedDate}`);
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error actualizando fecha: ' + err.message);
    } finally {
      setSavingDate(false);
    }
  };

  const handleQuickAddDays = async (days: number) => {
    if (!selectedTenantId) return;
    const current = selectedDate ? new Date(selectedDate) : new Date();
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    try {
      await api.put(`/api/monitoring/tenant/${selectedTenantId}/next-billing-date`, { nextBillingDate: newDateStr });
      setActionMessage(`Fecha extendida por ${days} días (${newDateStr})`);
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSavingPay(true);
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/record-payment`, {
        amount: payAmount,
        currency: dossier.tenant.billingCurrency || 'CRC',
        paymentMethod: payMethod,
        reference: payRef,
        notes: payNotes,
        extendDays: 30
      });
      setShowPayModal(false);
      setPayRef('');
      setPayNotes('');
      setActionMessage(res.message || 'Pago registrado exitosamente');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error registrando pago: ' + err.message);
    } finally {
      setSavingPay(false);
    }
  };

  const handleToggleModule = async (moduleKey: string, currentVal: boolean) => {
    if (!selectedTenantId) return;
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/toggle-module`, {
        moduleKey,
        enabled: !currentVal
      });
      setActionMessage(res.message);
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error modificando módulo: ' + err.message);
    }
  };

  const handleToggleAutoBilling = async () => {
    if (!selectedTenantId) return;
    const newState = !dossier.tenant.autoBillingEnabled;
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/toggle-auto-billing`, {
        enabled: newState
      });
      setActionMessage(res.message);
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleTilopayCharge = async () => {
    if (!selectedTenantId) return;
    const symbol = dossier.tenant.billingCurrency === 'USD' ? '$' : '₡';
    const amountStr = `${symbol}${Number(dossier.tenant.customMonthlyPrice || 55000).toLocaleString('es-CR')}`;
    if (!confirm(`¿Ejecutar cobro de ${amountStr} con la tarjeta tokenizada en Tilopay para ${dossier.tenant.name}?`)) return;

    setChargingTilopay(true);
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/charge-tilopay`);
      setActionMessage(res.message || 'Cobro procesado exitosamente');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error al cobrar con Tilopay: ' + err.message);
    } finally {
      setChargingTilopay(false);
    }
  };

  const handleRegisterCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    if (cardLast4Input.length !== 4) {
      alert('Debes ingresar exactamente los 4 últimos dígitos');
      return;
    }
    setSavingCard(true);
    try {
      await api.post(`/api/monitoring/tenant/${selectedTenantId}/register-card`, {
        cardLast4: cardLast4Input,
        cardBrand: cardBrandInput,
        cardHolder: cardHolderInput || dossier.tenant.adminName || 'Cliente'
      });
      setShowCardModal(false);
      setCardLast4Input('');
      setActionMessage('Tarjeta registrada y asociada al comercio con éxito');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error registrando tarjeta: ' + err.message);
    } finally {
      setSavingCard(false);
    }
  };

  const openWhatsApp = (customMsg?: string) => {
    const rawPhone = (dossier?.tenant?.whatsappNumber || '').replace(/\D/g, '');
    if (!rawPhone) {
      alert('El cliente no tiene teléfono de WhatsApp registrado.');
      return;
    }
    const cleanPhone = rawPhone.length === 8 ? '506' + rawPhone : rawPhone;
    const defaultMsg = customMsg || `¡Hola ${dossier?.tenant?.name}! Te saludamos del equipo de soporte de Betico. ¿En qué podemos colaborarte el día de hoy?`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  const openBillingReminder = () => {
    const priceFormatted = Number(dossier?.tenant?.customMonthlyPrice || 55000).toLocaleString('es-CR');
    const currency = dossier?.tenant?.billingCurrency || 'CRC';
    const dueDate = dossier?.tenant?.nextBillingDate || 'pronto';
    const msg = `¡Hola ${dossier?.tenant?.name}! Te saludamos cordialmente de Betico. Te recordamos que la suscripción mensual de tu plataforma (${currency} ${priceFormatted}) vence el ${dueDate}. Puedes registrar tu pago por SINPE Móvil o transferencia bancaria. ¡Gracias por preferir a Betico!`;
    openWhatsApp(msg);
  };

  const copyToClipboard = (text: string, type: 'uuid' | 'instance') => {
    navigator.clipboard.writeText(text);
    if (type === 'uuid') {
      setCopiedUuid(true);
      setTimeout(() => setCopiedUuid(false), 2000);
    } else {
      setCopiedInstance(true);
      setTimeout(() => setCopiedInstance(false), 2000);
    }
  };

  const handleRetryQueue = async () => {
    if (!selectedTenantId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/retry-failed-queue`);
      setActionMessage(res.message || 'Mensajes reactivados en la cola');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo reintentar la cola'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async (days = 15) => {
    if (!selectedTenantId) return;
    if (!confirm(`¿Deseas extender el período de prueba por ${days} días adicionales?`)) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/extend-trial`, { days });
      setActionMessage(res.message || 'Período extendido');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo extender el período'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedTenantId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/toggle-status`);
      setActionMessage(res.message || 'Estado actualizado');
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error: ' + (err.message || 'No se pudo cambiar el estado'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedTenantId) return;
    try {
      const res = await api.post(`/api/monitoring/tenant/${selectedTenantId}/impersonate`);
      if (res.launchUrl) {
        window.open(res.launchUrl, '_blank');
      } else {
        alert('Enlace no disponible');
      }
    } catch (err: any) {
      alert('Error al ingresar al portal: ' + (err.message || 'Error'));
    }
  };

  const handleChangePlan = async (newPlan: string) => {
    if (!selectedTenantId) return;
    try {
      await api.post(`/api/monitoring/tenant/${selectedTenantId}/change-plan`, { plan: newPlan });
      setActionMessage(`Plan actualizado a ${newPlan}`);
      await loadDossier(selectedTenantId);
    } catch (err: any) {
      alert('Error al actualizar plan: ' + (err.message || 'Error'));
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner & Search */}
      <div style={{
        backgroundColor: '#0f2426',
        border: '1px solid #1a3e40',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#FAF8F5', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={24} style={{ color: '#34D399' }} />
              Centro de Monitoreo y Diagnóstico 360°
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
              Búsqueda en tiempo real por nombre de cliente, slug, teléfono de WhatsApp o correo administrativo
            </p>
          </div>
          {selectedTenantId && (
            <button
              onClick={() => loadDossier(selectedTenantId)}
              disabled={loadingDossier}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#123032',
                border: '1px solid #234b4e',
                borderRadius: '8px',
                color: '#FAF8F5',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <RefreshCw size={15} className={loadingDossier ? 'animate-spin' : ''} />
              Refrescar Expediente
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Escribe el nombre del negocio, slug, número de WhatsApp o correo electrónico..."
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              backgroundColor: '#091819',
              border: '1px solid #234b4e',
              borderRadius: '12px',
              color: '#FAF8F5',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#34D399', fontSize: '0.8rem' }}>
              Buscando...
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '12px',
            backgroundColor: '#0a1a1b',
            border: '1px solid #1a3e40',
            borderRadius: '10px',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            {searchResults.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  loadDossier(t.id);
                  setSearchResults([]);
                }}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #142e30',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  backgroundColor: selectedTenantId === t.id ? '#123032' : 'transparent'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#FAF8F5', marginRight: '10px' }}>{t.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '10px' }}>({t.slug})</span>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>• {t.adminEmail}</span>
                  {t.whatsappNumber && <span style={{ fontSize: '0.8rem', color: '#34D399', marginLeft: '10px' }}>WA: {t.whatsappNumber}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: t.active ? 'rgba(52, 211, 153, 0.15)' : 'rgba(181, 28, 18, 0.15)',
                    color: t.active ? '#34D399' : '#f87171',
                    fontWeight: 600
                  }}>
                    {t.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <ChevronRight size={16} color="#64748b" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {actionMessage && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          {actionMessage}
        </div>
      )}

      {/* Dossier Content */}
      {loadingDossier && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <RotateCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#34D399' }} />
          <p style={{ margin: 0, fontSize: '1rem' }}>Cargando expediente 360° del cliente...</p>
        </div>
      )}

      {!loadingDossier && dossier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* HEADER CARD CON ACCIONES RÁPIDAS */}
          <div style={{
            backgroundColor: '#0d2224',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '14px',
                  backgroundColor: '#0B3C3D',
                  border: '1px solid #34D399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#34D399'
                }}>
                  {dossier.tenant.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#FAF8F5', fontWeight: 800 }}>
                      {dossier.tenant.name}
                    </h1>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: dossier.tenant.active ? 'rgba(52, 211, 153, 0.2)' : 'rgba(181, 28, 18, 0.2)',
                      color: dossier.tenant.active ? '#34D399' : '#f87171',
                      fontWeight: 700
                    }}>
                      {dossier.tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backgroundColor: '#16383b',
                      color: '#FAF8F5',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      Plan {dossier.tenant.plan}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>Slug: <strong style={{ color: '#cbd5e1' }}>/{dossier.tenant.slug}</strong></span>
                    <span>Admin: <strong style={{ color: '#cbd5e1' }}>{dossier.tenant.adminEmail}</strong></span>
                    <span>WhatsApp: <strong style={{ color: '#34D399' }}>{dossier.tenant.whatsappNumber || 'Sin asignar'}</strong></span>
                  </div>
                </div>
              </div>

              {/* BARRA DE ACCIONES DE ALTO IMPACTO */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleImpersonate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#0B3C3D',
                    border: '1px solid #34D399',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={15} />
                  Entrar al Portal
                </button>

                <button
                  onClick={() => openWhatsApp()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Phone size={15} />
                  WhatsApp
                </button>

                <button
                  onClick={openBillingReminder}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#16383b',
                    border: '1px solid #245053',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Send size={14} />
                  Recordar Cobro WA
                </button>

                <button
                  onClick={handleRetryQueue}
                  disabled={actionLoading || dossier.metrics.queue.failed === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: dossier.metrics.queue.failed > 0 ? '#B51C12' : '#233839',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: dossier.metrics.queue.failed > 0 ? 'pointer' : 'not-allowed',
                    opacity: dossier.metrics.queue.failed > 0 ? 1 : 0.6
                  }}
                >
                  <RotateCw size={14} />
                  Reintentar Cola ({dossier.metrics.queue.failed})
                </button>

                <button
                  onClick={() => handleExtendTrial(15)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#16383b',
                    border: '1px solid #245053',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={14} />
                  +15 Días
                </button>

                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: dossier.tenant.active ? 'rgba(181, 28, 18, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                    border: '1px solid ' + (dossier.tenant.active ? '#B51C12' : '#34D399'),
                    borderRadius: '8px',
                    color: dossier.tenant.active ? '#fca5a5' : '#34D399',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Power size={14} />
                  {dossier.tenant.active ? 'Suspender' : 'Reactivar'}
                </button>
              </div>
            </div>

            {/* INFRAESTRUCTURA Y SERVIDORES VINCULADOS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
              paddingTop: '18px',
              borderTop: '1px solid #163638'
            }}>
              {/* PostgreSQL Tenant UUID */}
              <div style={{ backgroundColor: '#0a1a1c', border: '1px solid #1a3e40', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  🐘 Inquilino PostgreSQL
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
                  Base de Datos: {dossier.infrastructure.postgresDb} ({dossier.infrastructure.postgresSchema})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '8px' }}>
                  <code style={{ fontSize: '0.74rem', color: '#cbd5e1', backgroundColor: '#071213', padding: '4px 8px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dossier.infrastructure.postgresTenantId}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dossier.infrastructure.postgresTenantId, 'uuid')}
                    style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedUuid ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUuid ? 'Copiado' : 'Copiar UUID'}
                  </button>
                </div>
              </div>

              {/* Evolution API Instance */}
              <div style={{ backgroundColor: '#0a1a1c', border: '1px solid #1a3e40', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                  📱 Inquilino Evolution API (WhatsApp)
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: dossier.health.whatsapp.connected ? '#34d399' : '#f59e0b', marginTop: '4px' }}>
                  {dossier.health.whatsapp.connected ? '🟢 Instancia Conectada' : '⚪ Desconectada o Sin Sesión'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '8px' }}>
                  <code style={{ fontSize: '0.74rem', color: '#cbd5e1', backgroundColor: '#071213', padding: '4px 8px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dossier.infrastructure.evolutionInstance}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(dossier.infrastructure.evolutionInstance, 'instance')}
                    style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedInstance ? <Check size={12} /> : <Copy size={12} />}
                    {copiedInstance ? 'Copiada' : 'Copiar Instancia'}
                  </button>
                </div>
              </div>
            </div>

            {/* UBICACIÓN GEOGRÁFICA Y NAVEGACIÓN GPS */}
            <div style={{ marginTop: '14px', backgroundColor: '#0a1a1c', border: '1px solid #1a3e40', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#34d399" /> Ubicación del Negocio y Navegación Guiada
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', color: '#FAF8F5', fontWeight: 600 }}>
                    {dossier.location.address}
                  </div>
                  {dossier.location.latitude && dossier.location.longitude && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' }}>
                      Coordenadas: {dossier.location.latitude}, {dossier.location.longitude}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {dossier.location.googleMapsUrl && (
                    <a
                      href={dossier.location.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0B3C3D',
                        border: '1px solid #34D399',
                        borderRadius: '6px',
                        color: '#FAF8F5',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ExternalLink size={13} /> Google Maps
                    </a>
                  )}
                  {dossier.location.wazeUrl && (
                    <a
                      href={dossier.location.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0284c7',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Navigation size={13} /> Waze
                    </a>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* ESTADO DE IA (BYOK PRIORITARIO) Y FIDELIZACIÓN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* MOTOR DE IA: 100% BYOK */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={20} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>Motor de IA (Prioridad BYOK)</h3>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  backgroundColor: dossier.ai.isByok ? 'rgba(52, 211, 153, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: dossier.ai.isByok ? '#34D399' : '#facc15'
                }}>
                  {dossier.ai.isByok ? '🟢 BYOK Propio Activo' : '🟡 Llave Maestra Plataforma'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Proveedor de IA:</span>
                  <strong style={{ textTransform: 'capitalize', color: '#38bdf8' }}>{dossier.ai.provider}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Modelo Configurado:</span>
                  <strong>{dossier.ai.model}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Tokens Consumidos Este Mes:</span>
                  <strong style={{ color: '#34D399' }}>{dossier.ai.tokensUsed.toLocaleString()} tokens</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Peticiones Procesadas:</span>
                  <strong>{dossier.ai.requestsCount} peticiones</strong>
                </div>
              </div>
            </div>

            {/* CLUB DE FIDELIZACIÓN: TARJETAS Y CUPONES */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#c084fc" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>Club de Fidelización (Sellos y Puntos)</h3>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  backgroundColor: dossier.storeModules.loyaltyEnabled ? 'rgba(192, 132, 252, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                  color: dossier.storeModules.loyaltyEnabled ? '#c084fc' : '#94a3b8'
                }}>
                  {dossier.storeModules.loyaltyEnabled ? 'Módulo Activo' : 'Desactivado'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Tarjetas de Sellos</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c084fc' }}>{dossier.loyalty.cardsCount}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Sellos Acumulados</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34D399' }}>{dossier.loyalty.stampsCount}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Cupones Emitidos</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{dossier.loyalty.vouchersCount}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Cupones Canjeados</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15' }}>{dossier.loyalty.vouchersRedeemed}</span>
                </div>
              </div>
            </div>

          </div>

          {/* TOGGLES DE MÓDULOS ACTIVOS / DESACTIVOS */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={20} color="#34D399" />
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>
                Interruptores de Módulos Operativos (Activar y Desactivar)
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              
              {/* Canchas */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>⚽ Canchas y Padel</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Reservas y busca reto</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('courtsEnabled', dossier.storeModules.courtsEnabled)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.courtsEnabled ? '#34D399' : '#334155',
                    color: dossier.storeModules.courtsEnabled ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.courtsEnabled ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              {/* Tienda y Catalogo */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>🛒 Tienda y Catálogo</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Productos y órdenes</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('storeEnabled', dossier.storeModules.storeEnabled)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.storeEnabled ? '#34D399' : '#334155',
                    color: dossier.storeModules.storeEnabled ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.storeEnabled ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              {/* Citas y Agenda */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>📅 Citas y Agenda</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Servicios y horarios</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('bookingsEnabled', dossier.storeModules.bookingsEnabled)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.bookingsEnabled ? '#34D399' : '#334155',
                    color: dossier.storeModules.bookingsEnabled ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.bookingsEnabled ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              {/* Club Fidelizacion */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>🎁 Club Lealtad</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sellos y recompensas</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('loyaltyEnabled', dossier.storeModules.loyaltyEnabled)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.loyaltyEnabled ? '#34D399' : '#334155',
                    color: dossier.storeModules.loyaltyEnabled ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.loyaltyEnabled ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              {/* Modo Restaurante / KDS */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>🍳 Cocina KDS</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Modo restaurante</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('storeMode', dossier.storeModules.storeMode === 'restaurant')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.storeMode === 'restaurant' ? '#34D399' : '#334155',
                    color: dossier.storeModules.storeMode === 'restaurant' ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.storeMode === 'restaurant' ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

              {/* Chatbot IA WhatsApp */}
              <div style={{ padding: '12px 14px', backgroundColor: '#091819', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>🤖 Chatbot IA</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Respuestas automáticas</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('aiChatbotEnabled', dossier.storeModules.aiChatbotEnabled)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: dossier.storeModules.aiChatbotEnabled ? '#34D399' : '#334155',
                    color: dossier.storeModules.aiChatbotEnabled ? '#061a1b' : '#94a3b8'
                  }}
                >
                  {dossier.storeModules.aiChatbotEnabled ? 'ACTIVO' : 'INACTIVO'}
                </button>
              </div>

            </div>
          </div>

          {/* ESTADO DE CUENTA, COBRANZA Y TARJETA TILOPAY */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={22} color="#34D399" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FAF8F5', fontWeight: 800 }}>
                  Estado de Cuenta y Gestión Financiera
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowPayModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> Registrar Pago (+30 días)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Monto Mensual Pactado</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FAF8F5', marginTop: '2px' }}>
                  {dossier.tenant.billingCurrency === 'USD' ? '$' : '₡'} {Number(dossier.tenant.customMonthlyPrice || 55000).toLocaleString('es-CR')} / mes
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fecha de Próximo Pago</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {!editingDate ? (
                    <>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                        {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'No asignada'}
                      </div>
                      <button
                        onClick={() => setEditingDate(true)}
                        style={{ padding: '4px 8px', backgroundColor: '#1a3e40', color: '#FAF8F5', border: 'none', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
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
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #245053', backgroundColor: '#071213', color: 'white', fontSize: '0.82rem' }}
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
                  <button onClick={() => handleQuickAddDays(15)} style={{ padding: '3px 8px', backgroundColor: '#16383b', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+15d</button>
                  <button onClick={() => handleQuickAddDays(30)} style={{ padding: '3px 8px', backgroundColor: '#16383b', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+30d</button>
                  <button onClick={() => handleQuickAddDays(365)} style={{ padding: '3px 8px', backgroundColor: '#16383b', color: '#94a3b8', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>+1 año</button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Datos de Contacto Admin</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5', marginTop: '2px' }}>
                  {dossier.tenant.adminEmail || 'Sin correo registrado'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>
                  📱 {dossier.tenant.whatsappNumber || 'Sin WhatsApp'}
                </div>
              </div>
            </div>

            {/* SECCIÓN DE TARJETA TOKENIZADA TILOPAY */}
            <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #163638', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Tarjeta de Cobro Tilopay (Tokenizada)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  {dossier.billingCards.length > 0 ? (
                    <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 'bold' }}>
                      💳 {dossier.billingCards[0].cardBrand} terminada en •••• {dossier.billingCards[0].cardLast4} ({dossier.billingCards[0].cardHolder})
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      ⚠️ No hay tarjeta registrada para este comercio
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={dossier.tenant.autoBillingEnabled}
                      onChange={handleToggleAutoBilling}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Cobro Automático Recurrente cada 30 días</span>
                  </label>
                  {dossier.tenant.lastAutoChargeStatus && (
                    <span style={{
                      fontSize: '0.72rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: dossier.tenant.lastAutoChargeStatus === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      color: dossier.tenant.lastAutoChargeStatus === 'success' ? '#34d399' : '#f87171'
                    }}>
                      Último cobro: {dossier.tenant.lastAutoChargeStatus === 'success' ? 'Aprobado' : 'Rechazado'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCardModal(true)}
                  style={{ padding: '8px 12px', backgroundColor: '#1a3e40', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Key size={14} /> {dossier.billingCards.length > 0 ? 'Cambiar Tarjeta' : 'Registrar Tarjeta'}
                </button>

                {dossier.billingCards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTilopayCharge}
                    disabled={chargingTilopay}
                    style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CreditCard size={14} /> {chargingTilopay ? 'Procesando...' : 'Cobrar con Tilopay'}
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* BITÁCORA Y ANOTACIONES INTERNAS DE SOPORTE */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#f59e0b" />
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 800 }}>
                  Bitácora y Anotaciones Internas de Soporte (Solo SuperAdmin)
                </h4>
              </div>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{
                  padding: '7px 16px',
                  backgroundColor: '#0B3C3D',
                  border: '1px solid #34D399',
                  borderRadius: '8px',
                  color: '#FAF8F5',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {savingNotes ? 'Guardando...' : 'Guardar Bitácora'}
              </button>
            </div>
            <textarea
              rows={3}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Escribe acuerdos, negociaciones de pago, prórrogas o notas de seguimiento técnico para este comercio..."
              style={{
                width: '100%',
                padding: '12px 14px',
                backgroundColor: '#071213',
                color: '#FAF8F5',
                border: '1px solid #234b4e',
                borderRadius: '10px',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* HISTORIAL DE PAGOS Y DIAGNÓSTICOS EN PESTAÑAS */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #1a3e40', paddingBottom: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('errors')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'errors' ? '#0B3C3D' : 'transparent',
                  border: activeTab === 'errors' ? '1px solid #34D399' : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} color={dossier.diagnostics.failedMessages.length > 0 ? '#f87171' : '#34D399'} />
                Diagnóstico de Errores ({dossier.diagnostics.failedMessages.length})
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'payments' ? '#0B3C3D' : 'transparent',
                  border: activeTab === 'payments' ? '1px solid #34D399' : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CreditCard size={16} color="#34D399" />
                Historial de Pagos ({dossier.payments.length})
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'audit' ? '#0B3C3D' : 'transparent',
                  border: activeTab === 'audit' ? '1px solid #34D399' : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#FAF8F5',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldCheck size={16} color="#60a5fa" />
                Historial de Auditoría ({dossier.diagnostics.auditLogs.length})
              </button>
            </div>

            {/* TAB: ERRORES EN COLA */}
            {activeTab === 'errors' && (
              <div>
                {dossier.diagnostics.failedMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <CheckCircle2 size={40} color="#34D399" style={{ margin: '0 auto 12px auto' }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>¡Todo en orden! No hay mensajes fallidos en la cola para este cliente.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dossier.diagnostics.failedMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        style={{
                          backgroundColor: '#091819',
                          border: '1px solid rgba(181, 28, 18, 0.3)',
                          borderRadius: '10px',
                          padding: '14px 16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FAF8F5' }}>
                            {msg.pushName || 'Usuario'} • {msg.cleanPhone || msg.remoteJid}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(msg.createdAt).toLocaleString('es-CR')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '8px', fontStyle: 'italic' }}>
                          "{msg.userMessage}"
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#f87171',
                          backgroundColor: 'rgba(181, 28, 18, 0.1)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontFamily: 'monospace'
                        }}>
                          Causa del error: {msg.errorMessage || 'Fallo desconocido'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORIAL DE PAGOS */}
            {activeTab === 'payments' && (
              <div>
                {dossier.payments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No hay pagos registrados aún en este comercio.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1a3e40', textAlign: 'left', color: '#94a3b8' }}>
                          <th style={{ padding: '10px' }}>Fecha</th>
                          <th style={{ padding: '10px' }}>Monto</th>
                          <th style={{ padding: '10px' }}>Método</th>
                          <th style={{ padding: '10px' }}>Referencia</th>
                          <th style={{ padding: '10px' }}>Notas</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dossier.payments.map((p: any) => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #142e30' }}>
                            <td style={{ padding: '10px', color: '#cbd5e1' }}>
                              {new Date(p.createdAt).toLocaleDateString('es-CR')}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#34d399' }}>
                              {p.currency === 'USD' ? '$' : '₡'} {Number(p.amount).toLocaleString('es-CR')}
                            </td>
                            <td style={{ padding: '10px', textTransform: 'uppercase', color: '#94a3b8' }}>
                              {p.paymentMethod}
                            </td>
                            <td style={{ padding: '10px', color: '#cbd5e1' }}>
                              <code>{p.reference || 'N/A'}</code>
                            </td>
                            <td style={{ padding: '10px', color: '#94a3b8' }}>
                              {p.notes || '-'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>
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
            )}

            {/* TAB: HISTORIAL DE AUDITORÍA */}
            {activeTab === 'audit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dossier.diagnostics.auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: '#091819',
                      border: '1px solid #1a3e40',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: '#34D399', fontSize: '0.85rem', marginRight: '10px' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        por {log.userName || log.userEmail || 'Sistema'}
                      </span>
                      {log.details && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '10px' }}>
                          ({JSON.stringify(log.details).substring(0, 70)})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(log.createdAt).toLocaleString('es-CR')}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL: REGISTRAR PAGO MANUAL */}
      {showPayModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0f2426', padding: '26px', borderRadius: '16px', maxWidth: '440px', width: '100%', border: '1px solid #34D399' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#FAF8F5' }}>💵 Registrar Pago del Cliente</h3>
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Monto a Registrar</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Método de Pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Notas de Pago</label>
                <input
                  type="text"
                  placeholder="Ej. Pago de suscripción mensual"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowPayModal(false)} style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={savingPay} style={{ padding: '8px 18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {savingPay ? 'Registrando...' : 'Confirmar y Extender 30 Días'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR TARJETA TILOPAY */}
      {showCardModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#0f2426', padding: '26px', borderRadius: '16px', maxWidth: '440px', width: '100%', border: '1px solid #38bdf8' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800, color: '#FAF8F5' }}>💳 Registrar Tarjeta Tilopay</h3>
            <form onSubmit={handleRegisterCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Titular de la Tarjeta</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={cardHolderInput}
                  onChange={(e) => setCardHolderInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Marca de la Tarjeta</label>
                <select
                  value={cardBrandInput}
                  onChange={(e) => setCardBrandInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                >
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">MasterCard</option>
                  <option value="AMEX">American Express</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Últimos 4 Dígitos</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="Ej. 4242"
                  value={cardLast4Input}
                  onChange={(e) => setCardLast4Input(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#071213', color: 'white', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCardModal(false)} style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={savingCard} style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {savingCard ? 'Guardando...' : 'Guardar Tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
