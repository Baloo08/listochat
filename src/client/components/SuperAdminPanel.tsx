import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Building2, Rocket, Server, Cpu, Database, HardDrive, DollarSign, TrendingUp, 
  KeyRound, ExternalLink, ShieldCheck, ShieldAlert, Plus, Edit, Trash2, 
  Activity, Users, RefreshCw, Copy, Check, Lock, CheckCircle, AlertCircle,
  MessageSquare, Bot, ArrowRight, Clock, Award, Wallet, Percent, Layers,
  Phone, Key, Calendar, CheckSquare, XCircle, Sliders, Smartphone, QrCode
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  adminEmail?: string;
  whatsappNumber?: string;
  customMonthlyPrice?: number;
  billingCurrency?: string;
  subscriptionStatus?: 'active' | 'trial' | 'grace_period' | 'suspended';
  trialEndsAt?: string;
  nextBillingDate?: string;
  gracePeriodEndsAt?: string;
  lastPaymentProof?: string;
  lastPaymentRef?: string;
  lastPaymentAmount?: number;
  paymentNotes?: string;
  createdAt: string;
}

interface SuperAdminInstance {
  id?: string;
  instanceType: string;
  instanceName: string;
  phoneNumber?: string;
  status: string;
  qrCode?: string | null;
}

interface SuperAdminPanelProps {
  activeTabProp?: 'tenants' | 'bots' | 'platform' | 'system' | 'apis' | 'financials' | 'audit';
  onTabChangeProp?: (tab: 'tenants' | 'bots' | 'platform' | 'system' | 'apis' | 'financials' | 'audit') => void;
  hideTabBar?: boolean;
}

export default function SuperAdminPanel({ activeTabProp, onTabChangeProp, hideTabBar = false }: SuperAdminPanelProps = {}) {
  const [activeTab, setActiveTab] = useState<'tenants' | 'bots' | 'platform' | 'system' | 'apis' | 'financials' | 'audit'>(activeTabProp || 'tenants');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>({ cpu: '12%', ram: '410MB / 1GB', dbSize: '24MB', uptime: '99.9%' });

  // Platform Settings State
  const [masterAiProvider, setMasterAiProvider] = useState('gemini');
  const [masterAiKey, setMasterAiKey] = useState('');
  const [masterAiModel, setMasterAiModel] = useState('gemini-2.5-flash');
  const [localaiUrl, setLocalaiUrl] = useState('http://localhost:8080/v1');
  const [localaiModel, setLocalaiModel] = useState('llama-3.1-8b-instruct');
  const [localaiApiKey, setLocalaiApiKey] = useState('');
  const [localaiEnabled, setLocalaiEnabled] = useState(true);
  const [quotaStarterTokens, setQuotaStarterTokens] = useState(25000);
  const [quotaProTokens, setQuotaProTokens] = useState(100000);
  const [quotaBusinessTokens, setQuotaBusinessTokens] = useState(300000);
  const [deployWebhookApp, setDeployWebhookApp] = useState('http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b');
  const [deployWebhookLocalai, setDeployWebhookLocalai] = useState('http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e');
  const [deployingTarget, setDeployingTarget] = useState<string | null>(null);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);

  // AI Usage State
  const [aiUsageList, setAiUsageList] = useState<any[]>([]);
  const [loadingAiUsage, setLoadingAiUsage] = useState(false);

  const [superadminNotifyPhone, setSuperadminNotifyPhone] = useState('');
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformSavedToast, setPlatformSavedToast] = useState(false);

  // SuperAdmin Instances (Ventas & Soporte)
  const [instances, setInstances] = useState<SuperAdminInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState<string | null>(null);

  // Create / Edit Tenant Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactName: '',
    email: '',
    phone: '',
    plan: 'starter',
    customMonthlyPrice: 29,
    billingCurrency: 'CRC',
    isTrial: true,
    trialDays: 15
  });
  const [savingTenant, setSavingTenant] = useState(false);

  // Extend / Prórroga Modal
  const [extendModalTenant, setExtendModalTenant] = useState<Tenant | null>(null);
  const [extendDays, setExtendDays] = useState(30);

  // Password reset modal
  const [resetModalTenant, setResetModalTenant] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
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

  const loadPlatformSettings = async () => {
    try {
      const data = await api.get('/api/superadmin/platform/settings');
      if (data) {
        if (data.masterAiProvider) setMasterAiProvider(data.masterAiProvider);
        if (data.masterAiModel) setMasterAiModel(data.masterAiModel);
        if (data.masterAiKey) setMasterAiKey(data.masterAiKey);
        if (data.localaiUrl) setLocalaiUrl(data.localaiUrl);
        if (data.localaiModel) setLocalaiModel(data.localaiModel);
        if (data.localaiApiKey) setLocalaiApiKey(data.localaiApiKey);
        if (data.localaiEnabled !== undefined) setLocalaiEnabled(data.localaiEnabled);
        if (data.quotaStarterTokens) setQuotaStarterTokens(data.quotaStarterTokens);
        if (data.quotaProTokens) setQuotaProTokens(data.quotaProTokens);
        if (data.quotaBusinessTokens) setQuotaBusinessTokens(data.quotaBusinessTokens);
        if (data.deployWebhookApp) setDeployWebhookApp(data.deployWebhookApp);
        if (data.deployWebhookLocalai) setDeployWebhookLocalai(data.deployWebhookLocalai);
        if (data.superadminNotifyPhone) setSuperadminNotifyPhone(data.superadminNotifyPhone);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAiUsage = async () => {
    try {
      setLoadingAiUsage(true);
      const res = await api.get('/api/superadmin/platform/ai-usage');
      if (res && res.usage) {
        setAiUsageList(res.usage);
      }
    } catch (e) {
      console.error('Error loading AI usage:', e);
    } finally {
      setLoadingAiUsage(false);
    }
  };

  const handleTriggerDeploy = async (target: 'app' | 'localai') => {
    setDeployingTarget(target);
    setDeployMessage(null);
    try {
      const res = await api.post(`/api/superadmin/platform/deploy/${target}`, {});
      if (res && res.success) {
        setDeployMessage(res.message || 'Despliegue iniciado con éxito.');
      } else {
        setDeployMessage('Error al iniciar despliegue: ' + (res?.error || 'Desconocido'));
      }
    } catch (e: any) {
      setDeployMessage('Error al ejecutar webhook: ' + (e.message || 'Fallo de conexión'));
    } finally {
      setDeployingTarget(null);
    }
  };

  const loadInstances = async () => {
    try {
      setLoadingInstances(true);
      const data = await api.get('/api/superadmin/platform/instances');
      if (Array.isArray(data)) {
        setInstances(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInstances(false);
    }
  };

  useEffect(() => {
    if (activeTabProp) setActiveTab(activeTabProp);
  }, [activeTabProp]);

  useEffect(() => {
    if (activeTab === 'tenants') loadTenants();
    if (activeTab === 'bots') loadInstances();
    if (activeTab === 'platform') {
      loadPlatformSettings();
      loadAiUsage();
    }
  }, [activeTab]);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      await api.post('/api/superadmin/platform/settings', {
        masterAiProvider,
        masterAiModel,
        masterAiKey,
        localaiUrl,
        localaiModel,
        localaiApiKey,
        localaiEnabled,
        quotaStarterTokens,
        quotaProTokens,
        quotaBusinessTokens,
        deployWebhookApp,
        deployWebhookLocalai,
        superadminNotifyPhone
      });
      setPlatformSavedToast(true);
      setTimeout(() => setPlatformSavedToast(false), 3000);
    } catch (err: any) {
      alert('Error guardando ajustes: ' + (err.message || 'Verifique'));
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleConnectInstance = async (type: string) => {
    setConnectingInstance(type);
    try {
      await api.post('/api/superadmin/platform/instances/connect', { instanceType: type });
      loadInstances();
    } catch (err: any) {
      alert('Error conectando: ' + (err.message || 'Intente de nuevo'));
    } finally {
      setConnectingInstance(null);
    }
  };

  const handleDisconnectInstance = async (type: string) => {
    if (!confirm('¿Seguro que deseas desconectar este WhatsApp?')) return;
    try {
      await api.post('/api/superadmin/platform/instances/disconnect', { instanceType: type });
      loadInstances();
    } catch (e) {
      alert('Error al desconectar');
    }
  };

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      name: t.name,
      slug: t.slug,
      contactName: t.name,
      email: t.adminEmail || '',
      phone: t.whatsappNumber || '',
      plan: t.plan || 'starter',
      customMonthlyPrice: t.customMonthlyPrice || 29,
      billingCurrency: t.billingCurrency || 'CRC',
      isTrial: t.subscriptionStatus === 'trial',
      trialDays: 15
    });
    setShowModal(true);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSavingTenant(true);
    try {
      if (editingTenant) {
        await api.put(`/api/tenants/${editingTenant.id}`, {
          name: formData.name,
          plan: formData.plan,
          whatsappNumber: formData.phone,
          customMonthlyPrice: formData.customMonthlyPrice,
          billingCurrency: formData.billingCurrency
        });
        alert(`¡Inquilino ${formData.name} actualizado con éxito!`);
      } else {
        const generatedSlug = formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const res = await api.post('/api/superadmin/platform/tenants/create', {
          name: formData.name,
          slug: generatedSlug,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          plan: formData.plan,
          customMonthlyPrice: formData.customMonthlyPrice,
          billingCurrency: formData.billingCurrency,
          isTrial: formData.isTrial,
          trialDays: formData.trialDays
        });
        alert(`¡Inquilino ${formData.name} creado exitosamente!\nContraseña temporal: ${res.tempPassword}\n(Credenciales despachadas por WhatsApp)`);
      }
      setShowModal(false);
      setEditingTenant(null);
      setFormData({
        name: '',
        slug: '',
        contactName: '',
        email: '',
        phone: '',
        plan: 'starter',
        customMonthlyPrice: 29,
        billingCurrency: 'CRC',
        isTrial: true,
        trialDays: 15
      });
      loadTenants();
    } catch (err: any) {
      alert('Error guardando inquilino: ' + (err.message || 'Verifique los datos'));
    } finally {
      setSavingTenant(false);
    }
  };

  const handleApprovePayment = async (tenantId: string) => {
    if (!confirm('¿Confirmas que has verificado el comprobante de pago y deseas renovar la suscripción por 30 días?')) return;
    try {
      await api.post(`/api/superadmin/platform/tenants/${tenantId}/approve-payment`, { days: 30 });
      alert('¡Pago aprobado con éxito! Se notificó al cliente y al SuperAdmin por WhatsApp.');
      loadTenants();
    } catch (err: any) {
      alert('Error aprobando pago: ' + (err.message || 'Intente de nuevo'));
    }
  };

  const handleToggleSuspension = async (tenantId: string) => {
    try {
      const res = await api.post(`/api/superadmin/platform/tenants/${tenantId}/toggle-suspension`, {});
      alert(`Estado actualizado: ${res.status}`);
      loadTenants();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleSaveExtension = async () => {
    if (!extendModalTenant) return;
    try {
      const nextDate = new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000);
      await api.put(`/api/superadmin/platform/tenants/${extendModalTenant.id}/subscription`, {
        nextBillingDate: nextDate.toISOString(),
        subscriptionStatus: 'active'
      });
      alert(`¡Prórroga de ${extendDays} días otorgada exitosamente!`);
      setExtendModalTenant(null);
      loadTenants();
    } catch (e: any) {
      alert('Error al otorgar prórroga');
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const res = await api.post(`/api/tenants/${tenantId}/impersonate`, {});
      if (res && res.token) {
        localStorage.setItem('token', res.token);
        window.location.href = '/';
      }
    } catch (e) {
      alert('Error al acceder al negocio');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTenant || !newPassword) return;
    setResettingPassword(true);
    try {
      await api.post(`/api/tenants/${resetModalTenant.id}/reset-password`, { newPassword });
      setResetSuccessToast(true);
      setTimeout(() => {
        setResetSuccessToast(false);
        setResetModalTenant(null);
        setNewPassword('');
      }, 2000);
    } catch (e) {
      alert('Error al restablecer contraseña');
    } finally {
      setResettingPassword(false);
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    const val = Number(price || 29);
    return currency === 'USD' ? `$${val}` : `₡${val.toLocaleString('es-CR')}`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={26} color="var(--primary)" />
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>Panel de SuperAdmin Betico</h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Gestión global de inquilinos, suscripciones, bots de ventas/soporte y motor de IA
          </p>
        </div>

        {activeTab === 'tenants' && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Plus size={16} /> Crear Inquilino con Onboarding
          </button>
        )}
      </div>

      {/* Tabs */}
      {!hideTabBar && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '24px', gap: '10px', overflowX: 'auto' }}>
          <button
            onClick={() => { setActiveTab('tenants'); onTabChangeProp?.('tenants'); }}
            style={{
              padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'tenants' ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Building2 size={18} /> Inquilinos & Suscripciones ({tenants.length})
          </button>

          <button
            onClick={() => { setActiveTab('bots'); onTabChangeProp?.('bots'); }}
            style={{
              padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'bots' ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'bots' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <MessageSquare size={18} /> Bots WhatsApp SuperAdmin
          </button>

          <button
            onClick={() => { setActiveTab('platform'); onTabChangeProp?.('platform'); }}
            style={{
              padding: '12px 18px', border: 'none',
              borderBottom: activeTab === 'platform' ? '2px solid var(--primary)' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'platform' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Sliders size={18} /> Ajustes & Notificaciones
          </button>
        </div>
      )}

      {/* TAB 1: INQUILINOS CON TARJETAS DE SUSCRIPCIÓN */}
      {activeTab === 'tenants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Master Control: Hardware KPIs & Live Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            
            <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Inquilinos Activos</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {tenants.filter(t => t.active).length} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {tenants.length} total</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} color="#16a34a" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>MRR Proyectado</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a' }}>
                  ₡{tenants.reduce((acc, t) => acc + (t.billingCurrency === 'USD' ? (t.customMonthlyPrice || 29) * 520 : (t.customMonthlyPrice || 15000)), 0).toLocaleString('es-CR')}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={22} color="#9333ea" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>CPU & Servidor</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>
                  {systemMetrics.cpu} • <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Saludable</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} color="#ea580c" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>PostgreSQL & RAM</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>
                  {systemMetrics.ram}
                </div>
              </div>
            </div>

          </div>

          {/* Master Control: Dual WhatsApp Live QR Instances */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Instancias Maestras de WhatsApp SuperAdmin</h3>
              </div>
              <button
                onClick={loadInstances}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} /> Refrescar QRs
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {[
                { type: 'ventas', name: 'betico_ventas', label: 'Bot de Ventas & Demo', desc: 'Atiende prospectos que desean contratar Betico SaaS' },
                { type: 'soporte', name: 'betico_soporte', label: 'Bot de Soporte Técnico', desc: 'Atiende incidencias y consultas de comercios clientes' }
              ].map(item => {
                const inst = instances.find(i => i.instanceType === item.type);
                const isConnected = inst?.status === 'open' || inst?.status === 'connected';

                return (
                  <div key={item.type} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '0.95rem' }}>{item.label}</strong>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold',
                          backgroundColor: isConnected ? '#dcfce7' : '#fee2e2',
                          color: isConnected ? '#15803d' : '#b91c1c'
                        }}>
                          {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>{item.desc}</div>
                      
                      {inst?.phoneNumber && (
                        <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} /> +{inst.phoneNumber}
                        </div>
                      )}

                      {/* Live QR Code preview if disconnected */}
                      {!isConnected && inst?.qrCode && (
                        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '10px' }}>
                          <img src={inst.qrCode} alt="QR WhatsApp" style={{ width: '160px', height: '160px', margin: '0 auto', display: 'block' }} />
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Escanea con WhatsApp en tu celular</div>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                      {!isConnected ? (
                        <button
                          onClick={() => handleConnectInstance(item.type)}
                          disabled={connectingInstance === item.type}
                          style={{ flex: 1, padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <QrCode size={14} /> {connectingInstance === item.type ? 'Generando...' : 'Generar QR de Conexión'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDisconnectInstance(item.type)}
                          style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Desconectar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tenants Section Header & Grid/List View Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Comercios e Inquilinos</h2>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total registrados: {tenants.length}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--text-muted)'
                }}
              >
                🔲 Cuadrícula
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold',
                  backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-muted)'
                }}
              >
                📄 Lista Detallada
              </button>
            </div>
          </div>

          {/* Render List View */}
          {viewMode === 'list' && (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 16px' }}>Inquilino</th>
                    <th style={{ padding: '12px 16px' }}>Plan / Tarifa</th>
                    <th style={{ padding: '12px 16px' }}>WhatsApp</th>
                    <th style={{ padding: '12px 16px' }}>Estado / Próximo Cobro</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const status = t.subscriptionStatus || (t.active ? 'active' : 'suspended');
                    const hasWhatsapp = !!(t.whatsappNumber || (t as any).evolutionInstance);
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                          <code style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{t.slug}</code>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div><strong>{t.plan?.toUpperCase()}</strong></div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatPrice(t.customMonthlyPrice, t.billingCurrency)}/mes</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 'bold', backgroundColor: hasWhatsapp ? '#dcfce7' : '#f1f5f9', color: hasWhatsapp ? '#15803d' : '#64748b' }}>
                            {hasWhatsapp ? `🟢 +${t.whatsappNumber || 'Conectado'}` : '⚪ No vinculado'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 'bold',
                              backgroundColor: status === 'active' ? '#dcfce7' : status === 'trial' ? '#e0f2fe' : '#fee2e2',
                              color: status === 'active' ? '#15803d' : status === 'trial' ? '#0369a1' : '#b91c1c'
                            }}>
                              {status === 'active' ? '🟢 Al Día' : status === 'trial' ? '⏳ Prueba' : '🔴 Suspendido'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#2563eb', display: 'block', marginTop: '2px' }}>
                            {t.nextBillingDate ? new Date(t.nextBillingDate).toLocaleDateString('es-CR') : 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(t)}
                              style={{ padding: '5px 10px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleImpersonate(t.id)}
                              style={{ padding: '5px 10px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
                            >
                              Acceder Portal ↗
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

          {/* Render Grid View */}
          {viewMode === 'grid' && (
            <div>
              {loadingTenants ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando inquilinos...</div>
              ) : tenants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  No hay comercios registrados aún.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                  {tenants.map(t => {
                    const isSuperAdminTenant = t.slug === 'superadmin';
                    const status = t.subscriptionStatus || (t.active ? 'active' : 'suspended');
                    const hasProof = !!t.lastPaymentProof;

                    return (
                      <div key={t.id} style={{
                        backgroundColor: 'var(--surface)',
                        border: hasProof ? '2px solid #f59e0b' : '1px solid var(--border)',
                        borderRadius: '14px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        position: 'relative'
                      }}>
                        <div>
                          {/* Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 2px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>{t.name}</h3>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Slug: <code style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{t.slug}</code>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span style={{
                              padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                              backgroundColor: hasProof ? '#fef3c7' : status === 'active' ? '#dcfce7' : status === 'trial' ? '#e0f2fe' : status === 'grace_period' ? '#ffedd5' : '#fee2e2',
                              color: hasProof ? '#b45309' : status === 'active' ? '#15803d' : status === 'trial' ? '#0369a1' : status === 'grace_period' ? '#c2410c' : '#b91c1c'
                            }}>
                              {hasProof ? '💳 Comprobante Adjunto' : status === 'active' ? '🟢 Al Día' : status === 'trial' ? '⏳ Período de Prueba' : status === 'grace_period' ? '🟠 En Gracia (Moroso)' : '🔴 Suspendido'}
                            </span>
                          </div>

                          {/* Info grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'var(--background)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '14px', border: '1px solid var(--border)' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Plan / Tarifa:</span>
                              <strong>{t.plan?.toUpperCase()} • {formatPrice(t.customMonthlyPrice, t.billingCurrency)}/mes</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>WhatsApp Vinculado:</span>
                              <strong>{t.whatsappNumber ? `+${t.whatsappNumber}` : 'No configurado'}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Próximo Cobro:</span>
                              <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                                {t.nextBillingDate ? new Date(t.nextBillingDate).toLocaleDateString('es-CR') : t.trialEndsAt ? `Prueba hasta ${new Date(t.trialEndsAt).toLocaleDateString('es-CR')}` : 'Sin fecha'}
                              </span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Días de Gracia:</span>
                              <span style={{ color: status === 'grace_period' ? '#ea580c' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                {t.gracePeriodEndsAt ? `Vence: ${new Date(t.gracePeriodEndsAt).toLocaleDateString('es-CR')}` : '15 días estándar'}
                              </span>
                            </div>
                          </div>

                          {/* Payment Proof Preview if present */}
                          {hasProof && (
                            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px', marginBottom: '14px', fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '4px' }}>
                                🧾 Comprobante Pendiente de Aprobación:
                              </div>
                              <div>Monto: <strong>₡{Number(t.lastPaymentAmount || 0).toLocaleString('es-CR')}</strong> • Ref: <strong>{t.lastPaymentRef || 'N/A'}</strong></div>
                              {t.lastPaymentProof && (
                                <a href={t.lastPaymentProof} target="_blank" rel="noreferrer" style={{ color: '#b45309', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' }}>
                                  Ver Foto de Comprobante ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          
                          {/* Subscription Action Buttons */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleApprovePayment(t.id)}
                              style={{ flex: 1, padding: '7px 10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <Check size={14} /> Aprobar Pago (+30d)
                            </button>

                            <button
                              onClick={() => handleOpenEdit(t)}
                              style={{ padding: '7px 10px', backgroundColor: 'transparent', color: '#0f172a', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit size={14} /> Editar
                            </button>

                            <button
                              onClick={() => setExtendModalTenant(t)}
                              style={{ padding: '7px 10px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Clock size={14} /> Prórroga
                            </button>

                            {!isSuperAdminTenant && (
                              <button
                                onClick={() => handleToggleSuspension(t.id)}
                                style={{ padding: '7px 10px', backgroundColor: t.active ? '#fee2e2' : '#dcfce7', color: t.active ? '#991b1b' : '#166534', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                              >
                                {t.active ? 'Suspender' : 'Reactivar'}
                              </button>
                            )}
                          </div>

                          {/* Portal & Password Buttons */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleImpersonate(t.id)}
                              style={{ flex: 1, padding: '6px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <ExternalLink size={13} /> Entrar al Panel
                            </button>

                            <button
                              onClick={() => setResetModalTenant(t)}
                              style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                              title="Restablecer contraseña"
                            >
                              <Key size={13} />
                            </button>
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOTS DE SUPERADMIN (VENTAS & SOPORTE) */}
      {activeTab === 'bots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', color: '#166534', fontSize: '0.88rem' }}>
            <strong>🤖 Conexiones de WhatsApp de SuperAdmin:</strong> Conecta dos números de WhatsApp independientes para atender prospectos en vivo desde la web (Bot de Ventas) y resolver dudas técnicas de clientes (Bot de Soporte).
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            
            {/* VENTAS BOT */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Bot de Ventas & Demos</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instancia: <code>betico_ventas</code></span>
                </div>
              </div>

              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Atiende leads que entran por la landing page, comparte enlaces de demos y crea cuentas automáticas con <strong>15 días de prueba gratis</strong>.
              </p>

              {/* Status & QR */}
              {instances.find(i => i.instanceType === 'ventas')?.qrCode ? (
                <div style={{ textAlign: 'center', padding: '14px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Escanea con WhatsApp:</div>
                  <img src={instances.find(i => i.instanceType === 'ventas')!.qrCode!} alt="QR" style={{ width: '180px', height: '180px', margin: '0 auto' }} />
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Estado: {instances.find(i => i.instanceType === 'ventas')?.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleConnectInstance('ventas')}
                    disabled={connectingInstance === 'ventas'}
                    style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {connectingInstance === 'ventas' ? 'Conectando...' : 'Conectar QR'}
                  </button>
                  <button
                    onClick={() => handleDisconnectInstance('ventas')}
                    style={{ padding: '8px 14px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>

            {/* SOPORTE BOT */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} color="#38bdf8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Bot de Soporte Técnico</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instancia: <code>betico_soporte</code></span>
                </div>
              </div>

              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                Responde dudas operativas de la plataforma basándose en la base de conocimientos oficial sin revelar secretos de infraestructura.
              </p>

              {/* Status & QR */}
              {instances.find(i => i.instanceType === 'soporte')?.qrCode ? (
                <div style={{ textAlign: 'center', padding: '14px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}>Escanea con WhatsApp:</div>
                  <img src={instances.find(i => i.instanceType === 'soporte')!.qrCode!} alt="QR" style={{ width: '180px', height: '180px', margin: '0 auto' }} />
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Estado: {instances.find(i => i.instanceType === 'soporte')?.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleConnectInstance('soporte')}
                    disabled={connectingInstance === 'soporte'}
                    style={{ padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {connectingInstance === 'soporte' ? 'Conectando...' : 'Conectar QR'}
                  </button>
                  <button
                    onClick={() => handleDisconnectInstance('soporte')}
                    style={{ padding: '8px 14px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: PLATFORM AJUSTES, IA MARCA BLANCA & DESPLIEGUES */}
      {activeTab === 'platform' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
          
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Sliders size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Ajustes Globales, IA Marca Blanca & Despliegue</h3>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Configura tu motor LocalAI privado, límites de tokens por plan, llaves de respaldo y dispara despliegues en la VPS.
            </p>
          </div>

          {platformSavedToast && (
            <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}>
              <CheckCircle size={18} /> ¡Ajustes globales guardados con éxito!
            </div>
          )}

          {/* SECTION: REMOTE AUTO-DEPLOY WEBHOOKS */}
          <div style={{ backgroundColor: '#0f172a', color: 'white', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Rocket size={20} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#f8fafc' }}>Despliegue Instantáneo en Servidor VPS</h4>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#1e293b', padding: '4px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                Webhooks Remotos
              </span>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              Dispara el ciclo de compilación, git pull y reinicio automático de tus contenedores directamente en tu VPS (2.25.103.200).
            </p>

            {deployMessage && (
              <div style={{ padding: '10px 14px', backgroundColor: '#1e293b', border: '1px solid #38bdf8', borderRadius: '8px', marginBottom: '14px', fontSize: '0.82rem', color: '#38bdf8' }}>
                {deployMessage}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleTriggerDeploy('app')}
                disabled={deployingTarget === 'app'}
                style={{
                  padding: '10px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <RefreshCw size={15} /> {deployingTarget === 'app' ? 'Desplegando App...' : '🚀 Desplegar App Betico'}
              </button>

              <button
                type="button"
                onClick={() => handleTriggerDeploy('localai')}
                disabled={deployingTarget === 'localai'}
                style={{
                  padding: '10px 18px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px',
                  fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Bot size={15} /> {deployingTarget === 'localai' ? 'Desplegando LocalAI...' : '⚡ Desplegar Local AI'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePlatformSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* SECTION: LOCALAI / IA MARCA BLANCA */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Bot size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Motor de IA de Marca Blanca (LocalAI / Privado)</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    URL del Servidor LocalAI / Endpoint OpenAI-Compatible *
                  </label>
                  <input
                    type="text"
                    required
                    value={localaiUrl}
                    onChange={(e) => setLocalaiUrl(e.target.value)}
                    placeholder="http://localhost:8080/v1 o http://2.25.103.200:8080/v1"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Endpoint donde está corriendo tu contenedor de LocalAI en la VPS.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Modelo Local Principal
                    </label>
                    <input
                      type="text"
                      value={localaiModel}
                      onChange={(e) => setLocalaiModel(e.target.value)}
                      placeholder="llama-3.1-8b-instruct, qwen2.5-7b, etc."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Llave de API de LocalAI (Opcional)
                    </label>
                    <input
                      type="password"
                      value={localaiApiKey}
                      onChange={(e) => setLocalaiApiKey(e.target.value)}
                      placeholder="•••••••• (Si configuraste token en LocalAI)"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION: TOKEN QUOTA LIMITS PER PLAN */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldAlert size={20} color="#ea580c" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Límites y Cuotas Mensuales de Tokens por Plan</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Plan Starter (Tokens/mes)
                  </label>
                  <input
                    type="number"
                    value={quotaStarterTokens}
                    onChange={(e) => setQuotaStarterTokens(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aprox. 800 mensajes</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Plan Pro (Tokens/mes)
                  </label>
                  <input
                    type="number"
                    value={quotaProTokens}
                    onChange={(e) => setQuotaProTokens(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aprox. 3,500 mensajes</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Plan Business (Tokens/mes)
                  </label>
                  <input
                    type="number"
                    value={quotaBusinessTokens}
                    onChange={(e) => setQuotaBusinessTokens(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aprox. 10,000 mensajes</span>
                </div>
              </div>
            </div>

            {/* SECTION: BACKUP MASTER KEY & NOTIFICATIONS */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Key size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Llave Maestra de Respaldo (Fallback Failover)</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Proveedor de Respaldo
                    </label>
                    <select
                      value={masterAiProvider}
                      onChange={(e) => {
                        setMasterAiProvider(e.target.value);
                        setMasterAiModel(e.target.value === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');
                      }}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="gemini">Google Gemini (Recomendado)</option>
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="anthropic">Anthropic (Claude)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Modelo de Respaldo
                    </label>
                    <input
                      type="text"
                      value={masterAiModel}
                      onChange={(e) => setMasterAiModel(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    API Key Maestra de Respaldo (AES-256)
                  </label>
                  <input
                    type="password"
                    value={masterAiKey}
                    onChange={(e) => setMasterAiKey(e.target.value)}
                    placeholder="Pega aquí tu llave de respaldo de Google AI Studio o OpenAI"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                {/* SuperAdmin Notification Phone */}
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                    📱 WhatsApp de Notificaciones de SuperAdmin
                  </label>
                  <input
                    type="text"
                    placeholder="50688888888"
                    value={superadminNotifyPhone}
                    onChange={(e) => setSuperadminNotifyPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #93c5fd' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={savingPlatform}
                style={{ padding: '11px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {savingPlatform ? 'Guardando Ajustes...' : 'Guardar Todos los Ajustes'}
              </button>
            </div>

          </form>

          {/* SECTION: AI USAGE PER TENANT TABLE */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>Monitoreo de Consumo de IA por Inquilino (Mes Actual)</h4>
              </div>
              <button
                type="button"
                onClick={loadAiUsage}
                style={{ padding: '5px 10px', border: '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
              >
                Refrescar
              </button>
            </div>

            {loadingAiUsage ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Cargando métricas de IA...</div>
            ) : aiUsageList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay consumo registrado este mes aún.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Inquilino</th>
                      <th style={{ padding: '10px 12px' }}>Plan</th>
                      <th style={{ padding: '10px 12px' }}>Tokens Usados / Límite</th>
                      <th style={{ padding: '10px 12px' }}>Consultas</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsageList.map(u => (
                      <tr key={u.tenantId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong>{u.tenantName}</strong>
                          <code style={{ fontSize: '0.72rem', display: 'block', color: 'var(--primary)' }}>{u.slug}</code>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>
                            <strong>{Number(u.tokensUsed || 0).toLocaleString('es-CR')}</strong> / {Number(u.limit || 25000).toLocaleString('es-CR')} ({u.percentageUsed}%)
                          </div>
                          <div style={{ width: '120px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: Math.min(100, u.percentageUsed) + '%',
                              height: '100%',
                              backgroundColor: u.isExceeded ? '#ef4444' : u.percentageUsed > 70 ? '#f59e0b' : '#10b981'
                            }} />
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong>{u.requestsCount || 0}</strong>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 'bold',
                            backgroundColor: u.isExceeded ? '#fee2e2' : '#dcfce7',
                            color: u.isExceeded ? '#991b1b' : '#15803d'
                          }}>
                            {u.isExceeded ? '🔴 Excedido' : '🟢 Al Día'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CREATE TENANT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '580px', width: '100%', padding: '26px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingTenant ? `Editar Inquilino: ${editingTenant.name}` : 'Crear Inquilino con Onboarding'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingTenant(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre del Negocio / Comercio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pizzería Bella Vista"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre del Contacto</label>
                  <input
                    type="text"
                    placeholder="Carlos Murillo"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp del Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="50688888888"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Correo Electrónico de Administrador *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@pizzeriabella.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Plan & Custom Pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="starter">Emprendedor</option>
                    <option value="pro">Profesional</option>
                    <option value="business">Franquicia</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Precio Mensual Acordado</label>
                  <input
                    type="number"
                    value={formData.customMonthlyPrice}
                    onChange={(e) => setFormData({ ...formData, customMonthlyPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Moneda</label>
                  <select
                    value={formData.billingCurrency}
                    onChange={(e) => setFormData({ ...formData, billingCurrency: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="CRC">Colones (₡ CRC)</option>
                    <option value="USD">Dólares ($ USD)</option>
                  </select>
                </div>
              </div>

              {/* 15 Days Trial Checkbox */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 'bold', color: '#166534', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isTrial}
                    onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })}
                  />
                  Activar 15 Días de Prueba Gratis (Primer cobro en 15 días)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 16px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTenant}
                  style={{ padding: '9px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {savingTenant ? 'Guardando...' : editingTenant ? 'Guardar Cambios' : 'Crear y Enviar Credenciales'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EXTEND / PRÓRROGA MODAL */}
      {extendModalTenant && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '400px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Otorgar Prórroga a {extendModalTenant.name}</h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Extiende el período de gracia o vigencia de servicio para este inquilino.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Días a extender:</label>
              <select
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value={7}>7 días de prórroga</option>
                <option value={15}>15 días de prórroga</option>
                <option value={30}>30 días (1 mes completo)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setExtendModalTenant(null)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSaveExtension} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Guardar Prórroga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalTenant && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '400px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Restablecer Clave de {resetModalTenant.name}</h3>

            {resetSuccessToast ? (
              <div style={{ color: '#166534', backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                ¡Contraseña actualizada con éxito!
              </div>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setResetModalTenant(null)} style={{ padding: '8px 14px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={resettingPassword} style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {resettingPassword ? 'Guardando...' : 'Restablecer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
