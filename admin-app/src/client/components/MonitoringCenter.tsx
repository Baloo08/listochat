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
  UserCheck
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
  const [activeTab, setActiveTab] = useState<'errors' | 'audit'>('errors');

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
    } catch (err: any) {
      alert('Error al cargar expediente del cliente: ' + (err.message || 'Error'));
    } finally {
      setLoadingDossier(false);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Card */}
          <div style={{
            backgroundColor: '#0d2224',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#FAF8F5', fontWeight: 800 }}>
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
                  <span>Slug: <strong>{dossier.tenant.slug}</strong></span>
                  <span>Admin: <strong>{dossier.tenant.adminEmail}</strong></span>
                  <span>WhatsApp: <strong>{dossier.tenant.whatsappNumber || 'Sin asignar'}</strong></span>
                </div>
              </div>

              {/* 1-Click Support Actions Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleImpersonate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    backgroundColor: '#0B3C3D',
                    border: '1px solid #34D399',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(52, 211, 153, 0.2)'
                  }}
                >
                  <ExternalLink size={15} />
                  Entrar al Portal
                </button>

                <button
                  onClick={handleRetryQueue}
                  disabled={actionLoading || dossier.metrics.queue.failed === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    backgroundColor: dossier.metrics.queue.failed > 0 ? '#B51C12' : '#233839',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: dossier.metrics.queue.failed > 0 ? 'pointer' : 'not-allowed',
                    opacity: dossier.metrics.queue.failed > 0 ? 1 : 0.6
                  }}
                >
                  <RotateCw size={15} />
                  Reintentar Cola ({dossier.metrics.queue.failed})
                </button>

                <button
                  onClick={() => handleExtendTrial(15)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    backgroundColor: '#16383b',
                    border: '1px solid #245053',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Calendar size={15} />
                  +15 Días Prueba
                </button>

                <button
                  onClick={handleToggleStatus}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 14px',
                    backgroundColor: dossier.tenant.active ? 'rgba(181, 28, 18, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                    border: '1px solid ' + (dossier.tenant.active ? '#B51C12' : '#34D399'),
                    borderRadius: '8px',
                    color: dossier.tenant.active ? '#fca5a5' : '#34D399',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Power size={15} />
                  {dossier.tenant.active ? 'Suspender' : 'Reactivar'}
                </button>

                {/* Plan Dropdown */}
                <select
                  value={dossier.tenant.plan}
                  onChange={(e) => handleChangePlan(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    backgroundColor: '#091819',
                    border: '1px solid #234b4e',
                    borderRadius: '8px',
                    color: '#FAF8F5',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="starter">Plan Starter</option>
                  <option value="pro">Plan Pro</option>
                  <option value="business">Plan Business</option>
                  <option value="enterprise">Plan Enterprise</option>
                </select>
              </div>
            </div>

            {/* Health Indicators Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              paddingTop: '20px',
              borderTop: '1px solid #163638'
            }}>
              {/* WhatsApp Evolution Status */}
              <div style={{
                backgroundColor: '#0a1a1c',
                border: '1px solid #1a3e40',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Bot WhatsApp (Evolution)</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: dossier.health.whatsapp.connected ? 'rgba(52, 211, 153, 0.2)' : 'rgba(181, 28, 18, 0.2)',
                    color: dossier.health.whatsapp.connected ? '#34D399' : '#f87171',
                    fontWeight: 700
                  }}>
                    {dossier.health.whatsapp.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FAF8F5' }}>
                  {dossier.health.whatsapp.instanceName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Estado: {dossier.health.whatsapp.state}
                </div>
              </div>

              {/* Payment Gateways */}
              <div style={{
                backgroundColor: '#0a1a1c',
                border: '1px solid #1a3e40',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Pasarelas de Pago</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: dossier.health.gateway.tilopayConfigured ? 'rgba(52, 211, 153, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                    color: dossier.health.gateway.tilopayConfigured ? '#34D399' : '#facc15',
                    fontWeight: 700
                  }}>
                    {dossier.health.gateway.tilopayConfigured ? 'Tilopay Listo' : 'SINPE / Manual'}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FAF8F5' }}>
                  {dossier.health.gateway.tilopayConfigured ? 'Tarjetas y SINPE' : 'Transferencia Bancaria'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Tienda Online: {dossier.health.gateway.storeEnabled ? 'Habilitada' : 'Deshabilitada'}
                </div>
              </div>

              {/* Electronic Invoicing */}
              <div style={{
                backgroundColor: '#0a1a1c',
                border: '1px solid #1a3e40',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Facturación Electrónica</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: dossier.health.invoicing.configured ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                    color: dossier.health.invoicing.configured ? '#34D399' : '#94a3b8',
                    fontWeight: 700
                  }}>
                    {dossier.health.invoicing.configured ? 'Almendro Hacienda' : 'No Configurado'}
                  </span>
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FAF8F5' }}>
                  {dossier.health.invoicing.configured ? `Ambiente ${dossier.health.invoicing.environment}` : 'Sin Factura Electrónica'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Comprobantes emitidos automáticamente
                </div>
              </div>
            </div>
          </div>

          {/* Consumption & Activity Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {/* WhatsApp Volume */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <MessageSquare size={20} color="#34D399" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>Consumo de Mensajería</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#091819', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Mensajes hoy:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34D399' }}>{dossier.metrics.messages.today}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#091819', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Últimos 7 días:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FAF8F5' }}>{dossier.metrics.messages.week}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#091819', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Últimos 30 días:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FAF8F5' }}>{dossier.metrics.messages.month}</span>
                </div>
              </div>
            </div>

            {/* Message Queue Live State */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Clock size={20} color="#facc15" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>Estado de la Cola (Worker)</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>En Espera</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#facc15' }}>{dossier.metrics.queue.pending}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Procesando</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>{dossier.metrics.queue.processing}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Completados</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34D399' }}>{dossier.metrics.queue.done}</span>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#091819', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>Fallidos</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: dossier.metrics.queue.failed > 0 ? '#f87171' : '#64748b' }}>
                    {dossier.metrics.queue.failed}
                  </span>
                </div>
              </div>
            </div>

            {/* Catalog & Commercial Volume */}
            <div style={{
              backgroundColor: '#0f2426',
              border: '1px solid #1a3e40',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShoppingCart size={20} color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#FAF8F5', fontWeight: 700 }}>Actividad Comercial</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Productos en catálogo:</span>
                  <strong>{dossier.metrics.catalog.products}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Citas y Reservas:</span>
                  <strong>{dossier.metrics.catalog.bookings}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Partidos en Canchas:</span>
                  <strong>{dossier.metrics.catalog.courtBookings}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <span>Órdenes Registradas:</span>
                  <strong>{dossier.metrics.catalog.orders}</strong>
                </div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1a3e40', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#34D399', fontWeight: 700 }}>
                  <span>Volumen Total (CRC):</span>
                  <span>₡{Number(dossier.metrics.catalog.gmvCrc).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostics Section: Tabs for Failed Messages and Audit Logs */}
          <div style={{
            backgroundColor: '#0f2426',
            border: '1px solid #1a3e40',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #1a3e40', paddingBottom: '14px', marginBottom: '20px' }}>
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
                            {new Date(msg.createdAt).toLocaleString()}
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
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
