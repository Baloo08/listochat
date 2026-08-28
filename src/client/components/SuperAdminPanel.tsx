import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Building2, Server, Cpu, Database, HardDrive, DollarSign, TrendingUp, 
  KeyRound, ExternalLink, ShieldCheck, ShieldAlert, Plus, Edit, Trash2, 
  Activity, Users, RefreshCw, Copy, Check, Lock, CheckCircle, AlertCircle,
  MessageSquare, Bot, ArrowRight, Clock, Award, Wallet, Percent, Layers
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  adminEmail?: string;
  whatsappNumber?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userName?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

interface SystemMetrics {
  timestamp: string;
  server: {
    hostname: string;
    platform: string;
    arch: string;
    cpuModel: string;
    cpuCount: number;
    cpuUsagePercent: number;
    loadAvg: number[];
    ram: {
      totalGb: number;
      usedGb: number;
      freeGb: number;
      usagePercent: number;
    };
    uptime: {
      processSeconds: number;
      osSeconds: number;
      formatted: string;
    };
  };
  nodeProcess: {
    version: string;
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
  database: {
    status: string;
    sizeMb: number;
    activeConnections: number;
    totalTablesCount: number;
    counts: {
      orders: number;
      appointments: number;
      messages: number;
      products: number;
    };
  };
}

interface ApiStats {
  evolutionApi: {
    status: string;
    activeInstances: number;
    totalMessagesProcessed: number;
    messagesSent: number;
    messagesReceived: number;
    messagesToday: number;
    healthPercent: number;
  };
  aiProviders: {
    providersDistribution: Array<{ provider: string; count: number }>;
    estimatedTokensConsumed: number;
    aiSuccessRate: number;
  };
  securityAudit: {
    loginsToday: number;
    blockedAttemptsToday: number;
    totalAuditEvents: number;
  };
}

interface Financials {
  subscriptions: {
    mrrCrc: number;
    mrrUsd: number;
    arrCrc: number;
    arrUsd: number;
    activeTenantsCount: number;
    totalTenantsCount: number;
    planDistribution: Record<string, number>;
  };
  clientGmv: {
    totalGmvCrc: number;
    ordersGmvCrc: number;
    ordersCount: number;
    bookingsGmvCrc: number;
    bookingsCount: number;
    totalTransactionsCount: number;
  };
  operatingCosts: {
    vpsCostCrc: number;
    vpsCostUsd: number;
    aiApiCostCrc: number;
    aiApiCostUsd: number;
    totalCostsCrc: number;
    totalCostsUsd: number;
  };
  profitability: {
    netProfitCrc: number;
    netProfitUsd: number;
    profitMarginPercent: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    planName: string;
    monthlyFeeCrc: number;
    monthlyFeeUsd: number;
    active: boolean;
    ordersCount: number;
    bookingsCount: number;
    totalGmvProcessed: number;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export default function SuperAdminPanel() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'system' | 'apis' | 'financials' | 'audit'>('tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // System & Financials Metrics
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Modals & Reset Password
  const [showModal, setShowModal] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'starter',
    adminEmail: '',
    adminPassword: ''
  });
  const [saving, setSaving] = useState(false);

  const [resetModalTenant, setResetModalTenant] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const api = useApi();

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const data = await api.get('/api/tenants');
      if (Array.isArray(data)) {
        setTenants(data);
      }
    } catch (err) {
      console.error('Error loading tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      setMetricsLoading(true);
      const [sys, apis, fin] = await Promise.all([
        api.get('/api/superadmin/system-metrics'),
        api.get('/api/superadmin/api-stats'),
        api.get('/api/superadmin/financials')
      ]);
      if (sys) setSystemMetrics(sys);
      if (apis) setApiStats(apis);
      if (fin) setFinancials(fin);
    } catch (err) {
      console.error('Error loading system metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const data = await api.get('/api/audit-logs?limit=50');
      if (data && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (activeTab === 'system' || activeTab === 'apis' || activeTab === 'financials') {
      loadSystemMetrics();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const handleNameChange = (val: string) => {
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug
    }));
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTenant) {
        await api.put(`/api/tenants/${editTenant.id}`, {
          name: formData.name,
          plan: formData.plan
        });
      } else {
        await api.post('/api/tenants', formData);
      }
      setShowModal(false);
      setEditTenant(null);
      setFormData({ name: '', slug: '', plan: 'starter', adminEmail: '', adminPassword: '' });
      loadTenants();
    } catch (err: any) {
      alert('Error guardando inquilino: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTenant || !newPassword) return;

    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setResettingPassword(true);
    try {
      await api.post(`/api/tenants/${resetModalTenant.id}/reset-password`, { newPassword });
      setResetSuccessToast(true);
      setTimeout(() => {
        setResetSuccessToast(false);
        setResetModalTenant(null);
        setNewPassword('');
      }, 1500);
    } catch (err: any) {
      alert('Error actualizando contraseña: ' + (err.message || 'Intente de nuevo'));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (confirm(`¿Estás completamente seguro de eliminar el inquilino "${name}" y todos sus datos asociados?`)) {
      try {
        await api.del(`/api/tenants/${id}`);
        loadTenants();
      } catch (err) {
        alert('Error al eliminar inquilino');
      }
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const res = await api.post(`/api/tenants/${tenantId}/impersonate`, {});
      if (res && res.token) {
        localStorage.setItem('superadmin_token', localStorage.getItem('token') || '');
        localStorage.setItem('token', res.token);
        localStorage.setItem('impersonated_tenant_name', res.tenant?.name || 'Inquilino');
        window.location.reload();
      }
    } catch (err) {
      alert('Error al impersonar inquilino');
    }
  };

  const copyLoginUrl = (slug: string) => {
    const url = `${window.location.origin}/acceso/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={28} color="#d97706" />
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 'bold' }}>Panel Maestro de Super Admin</h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gestión global de inquilinos, monitoreo de servidor, analítica de APIs y finanzas del SaaS
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'tenants' && (
            <button
              onClick={() => {
                setEditTenant(null);
                setFormData({ name: '', slug: '', plan: 'starter', adminEmail: '', adminPassword: '' });
                setShowModal(true);
              }}
              style={{
                padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Plus size={16} /> Crear Nuevo Negocio
            </button>
          )}

          {(activeTab === 'system' || activeTab === 'apis' || activeTab === 'financials') && (
            <button
              onClick={loadSystemMetrics}
              disabled={metricsLoading}
              style={{
                padding: '10px 16px', backgroundColor: 'var(--surface)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <RefreshCw size={15} className={metricsLoading ? 'animate-spin' : ''} />
              {metricsLoading ? 'Actualizando...' : 'Actualizar Métricas'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('tenants')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'tenants' ? '2px solid var(--primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={18} /> Inquilinos & Accesos ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'system' ? '2px solid #2563eb' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'system' ? '#2563eb' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}
        >
          <Server size={18} /> Servidor & Recursos
        </button>

        <button
          onClick={() => setActiveTab('apis')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'apis' ? '2px solid #0d9488' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'apis' ? '#0d9488' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}
        >
          <Activity size={18} /> APIs & Tráfico
        </button>

        <button
          onClick={() => setActiveTab('financials')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'financials' ? '2px solid #16a34a' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'financials' ? '#16a34a' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}
        >
          <DollarSign size={18} /> Finanzas del SaaS
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '12px 18px', border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid #8b5cf6' : '2px solid transparent',
            backgroundColor: 'transparent',
            color: activeTab === 'audit' ? '#8b5cf6' : 'var(--text-muted)',
            fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'
          }}
        >
          <ShieldAlert size={18} /> Auditoría & Seguridad
        </button>
      </div>

      {/* ==============================================================
          TAB 1: TENANTS & ACCESS MANAGEMENT
      ============================================================== */}
      {activeTab === 'tenants' && (
        <div>
          {loadingTenants ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando lista de inquilinos...</div>
          ) : tenants.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              No hay inquilinos registrados todavía. ¡Crea el primero!
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px' }}>Negocio / Inquilino</th>
                    <th style={{ padding: '12px 16px' }}>Plan</th>
                    <th style={{ padding: '12px 16px' }}>Admin Login URL</th>
                    <th style={{ padding: '12px 16px' }}>Admin Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones & Seguridad</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const isCopied = copiedSlug === t.slug;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b' }}>{t.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>slug: <code>{t.slug}</code></div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                            backgroundColor: t.plan === 'enterprise' ? '#ede9fe' : t.plan === 'business' ? '#dbeafe' : t.plan === 'pro' ? '#dcfce7' : '#f1f5f9',
                            color: t.plan === 'enterprise' ? '#6d28d9' : t.plan === 'business' ? '#1e40af' : t.plan === 'pro' ? '#166534' : '#475569'
                          }}>
                            {t.plan}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <a
                              href={`/acceso/${t.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              /acceso/{t.slug} <ExternalLink size={12} />
                            </a>
                            <button
                              onClick={() => copyLoginUrl(t.slug)}
                              style={{
                                border: '1px solid #cbd5e1', backgroundColor: isCopied ? '#dcfce7' : 'white',
                                color: isCopied ? '#166534' : '#64748b', borderRadius: '4px',
                                padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem'
                              }}
                              title="Copiar enlace de acceso para el cliente"
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                              {isCopied ? '¡Copiado!' : 'Copiar'}
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {t.adminEmail || 'admin@' + t.slug + '.cr'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => handleImpersonate(t.id)}
                              style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              title="Ingresar a la vista de este negocio"
                            >
                              Ingresar al Portal
                            </button>

                            <button
                              onClick={() => { setResetModalTenant(t); setNewPassword(''); }}
                              style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Cambiar contraseña de este administrador"
                            >
                              <KeyRound size={13} /> Clave
                            </button>

                            <button
                              onClick={() => {
                                setEditTenant(t);
                                setFormData({ name: t.name, slug: t.slug, plan: t.plan, adminEmail: t.adminEmail || '', adminPassword: '' });
                                setShowModal(true);
                              }}
                              style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                              title="Editar inquilino"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDeleteTenant(t.id, t.name)}
                              style={{ padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              title="Eliminar inquilino"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==============================================================
          TAB 2: SYSTEM & SERVER RESOURCES METRICS
      ============================================================== */}
      {activeTab === 'system' && systemMetrics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Quick Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* CPU Card */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Uso de Procesador (CPU)</span>
                <Cpu size={20} color="#2563eb" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: systemMetrics.server.cpuUsagePercent > 80 ? '#ef4444' : '#1e293b' }}>
                {systemMetrics.server.cpuUsagePercent}%
              </div>
              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${systemMetrics.server.cpuUsagePercent}%`, height: '100%', backgroundColor: systemMetrics.server.cpuUsagePercent > 80 ? '#ef4444' : '#2563eb', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {systemMetrics.server.cpuCount} Núcleos • {systemMetrics.server.cpuModel.slice(0, 24)}...
              </div>
            </div>

            {/* RAM Memory Card */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Memoria RAM del Sistema</span>
                <HardDrive size={20} color="#16a34a" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: systemMetrics.server.ram.usagePercent > 85 ? '#ef4444' : '#1e293b' }}>
                {systemMetrics.server.ram.usagePercent}%
              </div>
              <div style={{ backgroundColor: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden', margin: '8px 0' }}>
                <div style={{ width: `${systemMetrics.server.ram.usagePercent}%`, height: '100%', backgroundColor: systemMetrics.server.ram.usagePercent > 85 ? '#ef4444' : '#16a34a', transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {systemMetrics.server.ram.usedGb} GB Usados de {systemMetrics.server.ram.totalGb} GB ({systemMetrics.server.ram.freeGb} GB Libres)
              </div>
            </div>

            {/* Node Heap & Uptime Card */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Uptime de la App</span>
                <Clock size={20} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1e293b' }}>
                {systemMetrics.server.uptime.formatted}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Node.js {systemMetrics.nodeProcess.version} • Heap: {systemMetrics.nodeProcess.heapUsedMb} MB / {systemMetrics.nodeProcess.heapTotalMb} MB
              </div>
            </div>

            {/* Database PostgreSQL Health */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Base de Datos PostgreSQL</span>
                <Database size={20} color="#0d9488" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={20} /> En Línea
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Tamaño: {systemMetrics.database.sizeMb} MB • {systemMetrics.database.activeConnections} conexiones activas
              </div>
            </div>
          </div>

          {/* Database Entities Volume Breakdown */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--primary)" /> Registros Activos en Base de Datos
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Mensajes WhatsApp</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0d9488' }}>
                  {systemMetrics.database.counts.messages.toLocaleString('es-CR')}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Órdenes Procesadas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {systemMetrics.database.counts.orders.toLocaleString('es-CR')}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Citas Agendadas</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ea580c' }}>
                  {systemMetrics.database.counts.appointments.toLocaleString('es-CR')}
                </div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Productos en Catálogo</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#16a34a' }}>
                  {systemMetrics.database.counts.products.toLocaleString('es-CR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: APIS & TRAFFIC MAPPING
      ============================================================== */}
      {activeTab === 'apis' && apiStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            
            {/* Evolution API Card */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={22} color="#166534" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>WhatsApp Evolution API</h3>
                  <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold' }}>● Salud de Conexión: {apiStats.evolutionApi.healthPercent}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mensajes Hoy</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{apiStats.evolutionApi.messagesToday}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Histórico</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1e293b' }}>{apiStats.evolutionApi.totalMessagesProcessed}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Instancias de WhatsApp activas: <strong>{apiStats.evolutionApi.activeInstances} negocios</strong>
              </div>
            </div>

            {/* AI Providers Card */}
            <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={22} color="#6d28d9" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Modelos de Inteligencia Artificial</h3>
                  <div style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: 'bold' }}>Tasa de éxito: {apiStats.aiProviders.aiSuccessRate}%</div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tokens Consumidos Estimados</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#6d28d9' }}>
                  {apiStats.aiProviders.estimatedTokensConsumed.toLocaleString('es-CR')} tokens
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Distribución de Proveedores:
                {apiStats.aiProviders.providersDistribution.map((p, i) => (
                  <span key={i} style={{ marginLeft: '6px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {p.provider} ({p.count})
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Security & Access Attempt Events */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#16a34a" /> Control de Accesos & Seguridad Anti Fuerza Bruta
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold' }}>Inicios de Sesión Hoy</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>{apiStats.securityAudit.loginsToday}</div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 'bold' }}>Intentos Bloqueados (Rate Limit)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{apiStats.securityAudit.blockedAttemptsToday}</div>
              </div>

              <div style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Total Eventos Auditados</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{apiStats.securityAudit.totalAuditEvents}</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==============================================================
          TAB 4: SAAS FINANCIALS & CLIENT SALES
      ============================================================== */}
      {activeTab === 'financials' && financials && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            
            {/* MRR Card */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534' }}>MRR (Ingresos Recurrentes / Mes)</span>
                <DollarSign size={22} color="#166534" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#14532d' }}>
                ₡{financials.subscriptions.mrrCrc.toLocaleString('es-CR')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '4px' }}>
                ≈ ${financials.subscriptions.mrrUsd} USD / mes • {financials.subscriptions.activeTenantsCount} suscripciones activas
              </div>
            </div>

            {/* ARR Card */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af' }}>ARR (Proyección Anual)</span>
                <TrendingUp size={22} color="#1e40af" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                ₡{financials.subscriptions.arrCrc.toLocaleString('es-CR')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: '4px' }}>
                ≈ ${financials.subscriptions.arrUsd.toLocaleString('es-CR')} USD / año
              </div>
            </div>

            {/* Client GMV Transacted */}
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#92400e' }}>GMV (Ventas de Clientes en Betico)</span>
                <Wallet size={22} color="#d97706" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#78350f' }}>
                ₡{financials.clientGmv.totalGmvCrc.toLocaleString('es-CR')}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '4px' }}>
                {financials.clientGmv.totalTransactionsCount} transacciones procesadas
              </div>
            </div>

            {/* Net Profit Margin */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Ganancia Neta del SaaS</span>
                <Percent size={22} color="#16a34a" />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 'bold', color: '#16a34a' }}>
                ₡{financials.profitability.netProfitCrc.toLocaleString('es-CR')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Margen Neto: <strong>{financials.profitability.profitMarginPercent}%</strong> (Costos: ₡{financials.operatingCosts.totalCostsCrc.toLocaleString('es-CR')})
              </div>
            </div>

          </div>

          {/* Detailed Tenant Financials Breakdown Table */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Desglose de Facturación por Inquilino</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{financials.tenants.length} cuentas registradas</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '12px 16px' }}>Negocio</th>
                  <th style={{ padding: '12px 16px' }}>Plan Contratado</th>
                  <th style={{ padding: '12px 16px' }}>Cuota Mensual</th>
                  <th style={{ padding: '12px 16px' }}>Órdenes / Citas</th>
                  <th style={{ padding: '12px 16px' }}>Volumen Procesado</th>
                  <th style={{ padding: '12px 16px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {financials.tenants.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{t.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f1f5f9' }}>
                        {t.planName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#16a34a' }}>
                      ₡{t.monthlyFeeCrc.toLocaleString('es-CR')} (${t.monthlyFeeUsd})
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {t.ordersCount} pedidos • {t.bookingsCount} citas
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      ₡{t.totalGmvProcessed.toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: t.active ? '#dcfce7' : '#fee2e2',
                        color: t.active ? '#166534' : '#b91c1c'
                      }}>
                        {t.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ==============================================================
          TAB 5: AUDIT LOGS
      ============================================================== */}
      {activeTab === 'audit' && (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Registro Histórico de Auditoría y Seguridad</h3>
            <button onClick={loadAuditLogs} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
              <RefreshCw size={13} /> Refrescar
            </button>
          </div>

          {auditLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando eventos de auditoría...</div>
          ) : auditLogs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay eventos registrados.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '10px 16px' }}>Fecha / Hora</th>
                  <th style={{ padding: '10px 16px' }}>Acción</th>
                  <th style={{ padding: '10px 16px' }}>Usuario / Email</th>
                  <th style={{ padding: '10px 16px' }}>IP Origen</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(log.createdAt).toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: log.action.includes('failed') || log.action.includes('blocked') ? '#fee2e2' : log.action.includes('login') ? '#dcfce7' : '#f1f5f9',
                        color: log.action.includes('failed') || log.action.includes('blocked') ? '#b91c1c' : log.action.includes('login') ? '#166534' : '#334155'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>{log.userEmail || log.userName || 'Sistema / Público'}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ==============================================================
          MODAL 1: CREATE / EDIT TENANT
      ============================================================== */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {editTenant ? 'Editar Negocio' : 'Registrar Nuevo Negocio en Betico'}
            </h3>

            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Nombre del Negocio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Clínica Dental Sonrisas"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Slug / Enlace URL *</label>
                <input
                  type="text"
                  required
                  disabled={!!editTenant}
                  placeholder="clinicasonrisas"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem', backgroundColor: editTenant ? '#f1f5f9' : 'white' }}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Acceso del cliente: /acceso/{formData.slug || 'slug'}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Plan de Suscripción</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="starter">Plan Starter (₡15.000 / $30)</option>
                  <option value="pro">Plan Profesional (₡35.000 / $70)</option>
                  <option value="business">Plan Business (₡65.000 / $130)</option>
                  <option value="enterprise">Plan Enterprise (₡120.000 / $240)</option>
                </select>
              </div>

              {!editTenant && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Correo de Administrador para el Cliente *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@clinicasonrisas.cr"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Contraseña Inicial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {saving ? 'Guardando...' : editTenant ? 'Actualizar' : 'Crear Negocio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL 2: RESET TENANT ADMIN PASSWORD
      ============================================================== */}
      {resetModalTenant && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <KeyRound size={22} color="#d97706" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Cambiar Contraseña de Administrador</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Asigna una nueva clave para el administrador de <strong>{resetModalTenant.name}</strong> ({resetModalTenant.adminEmail || 'admin@' + resetModalTenant.slug + '.cr'}).
            </p>

            {resetSuccessToast && (
              <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                <CheckCircle size={16} /> ¡Contraseña actualizada exitosamente!
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Nueva Contraseña *</label>
                <input
                  type="text"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResetModalTenant(null)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  style={{ padding: '8px 18px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {resettingPassword ? 'Actualizando...' : 'Guardar Nueva Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
