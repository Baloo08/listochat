import React, { useState, useEffect } from 'react';
import BillingCollectionsView from './BillingCollectionsView';
import TenantDossierModal from './TenantDossierModal';
import { useApi } from '../hooks/useApi';
import { 
  Building2, Rocket, Server, Cpu, Database, HardDrive, DollarSign, TrendingUp, 
  KeyRound, ExternalLink, ShieldCheck, ShieldAlert, Plus, Edit, Trash2, 
  Activity, Users, RefreshCw, Copy, Check, Lock, CheckCircle, AlertCircle,
  MessageSquare, Bot, ArrowRight, Clock, Award, Wallet, Percent, Layers,
  Phone, Key, Calendar, CheckSquare, XCircle, Sliders, Smartphone, QrCode,
  Zap, Search, Send, Play, FileText, CheckCircle2, MapPin, Navigation, Sparkles,
  AlertTriangle, ChevronDown, ChevronUp, BarChart2
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
  settingsJson?: any;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  postgresTenantId?: string;
  postgresDb?: string;
  postgresSchema?: string;
  evolutionInstance?: string;
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
  activeTabProp?: 'tenants' | 'financials' | 'ai_engine' | 'ai_usage' | 'bots' | 'system' | 'notifications' | 'audit' | 'collections';
  onTabChangeProp?: (tab: string) => void;
  hideTabBar?: boolean;
}

export default function SuperAdminPanel({ activeTabProp = 'tenants', onTabChangeProp, hideTabBar = false }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState<string>(activeTabProp || 'tenants');
  const [selectedDossierTenantId, setSelectedDossierTenantId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const api = useApi();

  // 1. TENANTS STATE
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantSearch, setTenantSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [kpiFilter, setKpiFilter] = useState<'all' | 'active' | 'trial' | 'suspended' | 'grace' | 'aliado'>('all');
  const [showGrowthAnalytics, setShowGrowthAnalytics] = useState(false);
  const [growthData, setGrowthData] = useState<any>(null);
  const [loadingGrowth, setLoadingGrowth] = useState(false);
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
    trialDays: 15,
    address: '',
    latitude: '',
    longitude: '',
    googleMapsUrl: ''
  });
  const [savingTenant, setSavingTenant] = useState(false);
  const [extendModalTenant, setExtendModalTenant] = useState<Tenant | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [resetModalTenant, setResetModalTenant] = useState<Tenant | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // 2. AI ENGINE & PLAYGROUND STATE
  const [ollamaUrl, setOllamaUrl] = useState('http://beticoia_ollama:11434/v1');
  const [ollamaModel, setOllamaModel] = useState('betico-ai');
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([
    'betico-ai',
    'qwen2.5:1.5b'
  ]);
  const [kokoroUrl, setKokoroUrl] = useState('http://beticoia_kokoro:80');
  const [kokoroVoice, setKokoroVoice] = useState('ef_dora');
  const [kokoroStatus, setKokoroStatus] = useState<any>(null);
  const [whisperStatus, setWhisperStatus] = useState<any>(null);
  const [localaiUrl, setLocalaiUrl] = useState('http://beticoia_localai:8080/v1');
  const [localaiModel, setLocalaiModel] = useState('whisper-1');
  const [availableLocalModels, setAvailableLocalModels] = useState<string[]>([
    'whisper-1'
  ]);
  const [localaiApiKey, setLocalaiApiKey] = useState('');
  const [localaiEnabled, setLocalaiEnabled] = useState(false);
  const [masterAiProvider, setMasterAiProvider] = useState('gemini');
  const [masterAiKey, setMasterAiKey] = useState('');
  const [masterAiModel, setMasterAiModel] = useState('gemini-2.5-flash');
  const [aiEngineStatus, setAiEngineStatus] = useState<any>(null);
  const [checkingAiEngine, setCheckingAiEngine] = useState(false);
  const [playgroundPrompt, setPlaygroundPrompt] = useState('Hola, ¿cuáles son tus funciones como asistente inteligente de Betico?');
  const [playgroundProvider, setPlaygroundProvider] = useState('betico_ai');
  const [playgroundModel, setPlaygroundModel] = useState('betico-ai');
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);
  const [testingPlayground, setTestingPlayground] = useState(false);

  // 3. AI USAGE & QUOTAS STATE
  const [aiUsageList, setAiUsageList] = useState<any[]>([]);
  const [loadingAiUsage, setLoadingAiUsage] = useState(false);
  const [quotaStarterTokens, setQuotaStarterTokens] = useState(25000);
  const [quotaProTokens, setQuotaProTokens] = useState(100000);
  const [quotaBusinessTokens, setQuotaBusinessTokens] = useState(300000);
  const [quotaOverrideTenant, setQuotaOverrideTenant] = useState<any | null>(null);
  const [overrideTokensAmount, setOverrideTokensAmount] = useState(100000);
  const [savingOverride, setSavingOverride] = useState(false);

  // 4. BOTS STATE
  const [instances, setInstances] = useState<SuperAdminInstance[]>([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [connectingInstance, setConnectingInstance] = useState<string | null>(null);

  // 5. SYSTEM & DEPLOY STATE
  const [deployWebhookApp, setDeployWebhookApp] = useState((import.meta as any).env?.VITE_DEPLOY_WEBHOOK_APP || 'http://2.25.103.200:3000/api/deploy/f5abd18bdaaff3ce20c24522c9c72beac7c756d9260d995b');
  const [deployWebhookLocalai, setDeployWebhookLocalai] = useState((import.meta as any).env?.VITE_DEPLOY_WEBHOOK_LOCALAI || 'http://2.25.103.200:3000/api/deploy/4317a4ff5a1ed51532fc824fb9547b6ae20847cd3ef8ea4e');
  const [deployingTarget, setDeployingTarget] = useState<string | null>(null);
  const [deployMessage, setDeployMessage] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // 6. NOTIFICATIONS STATE
  const [superadminNotifyPhone, setSuperadminNotifyPhone] = useState('');
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [platformSavedToast, setPlatformSavedToast] = useState(false);

  // 7. AUDIT STATE
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Sync props
  useEffect(() => {
    if (activeTabProp) setActiveTab(activeTabProp);
  }, [activeTabProp]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChangeProp) onTabChangeProp(tab);
  };

  // LOADERS
  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const data = await api.get('/api/tenants');
      if (Array.isArray(data)) setTenants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadGrowthAnalytics = async () => {
    try {
      setLoadingGrowth(true);
      const data = await api.get('/api/superadmin/growth');
      if (data) setGrowthData(data);
    } catch (e) {
      console.warn('Error al cargar analítica de crecimiento:', e);
    } finally {
      setLoadingGrowth(false);
    }
  };

  const loadPlatformSettings = async () => {
    try {
      const data = await api.get('/api/superadmin/platform/settings');
      if (data) {
        if (data.ollamaUrl) setOllamaUrl(data.ollamaUrl);
        if (data.ollamaModel) setOllamaModel(data.ollamaModel);
        if (data.kokoroUrl) setKokoroUrl(data.kokoroUrl);
        if (data.kokoroVoice) setKokoroVoice(data.kokoroVoice);
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

  const checkAiEngine = async () => {
    try {
      setCheckingAiEngine(true);
      // 1. Ping Ollama (Betico AI)
      const targetOllama = (ollamaUrl || '').trim();
      const data = await api.get('/api/superadmin/platform/ai-engine-status?engine=ollama&url=' + encodeURIComponent(targetOllama));
      setAiEngineStatus(data);
      if (data && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableOllamaModels(data.models);
      }

      // 2. Ping Kokoro TTS
      try {
        const kData = await api.get('/api/superadmin/platform/ai-engine-status?engine=kokoro');
        setKokoroStatus(kData);
      } catch (err) {}

      // 3. Ping Whisper
      try {
        const wData = await api.get('/api/superadmin/platform/ai-engine-status?engine=whisper');
        setWhisperStatus(wData);
      } catch (err) {}
    } catch (e) {
      setAiEngineStatus({ online: false, statusText: 'Error conectando con el servidor Betico AI' });
    } finally {
      setCheckingAiEngine(false);
    }
  };

  const loadAiUsage = async () => {
    try {
      setLoadingAiUsage(true);
      const res = await api.get('/api/superadmin/platform/ai-usage');
      if (res && res.usage) setAiUsageList(res.usage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAiUsage(false);
    }
  };

  const loadInstances = async () => {
    try {
      setLoadingInstances(true);
      const data = await api.get('/api/superadmin/platform/instances');
      if (Array.isArray(data)) setInstances(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInstances(false);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const data = await api.get('/api/superadmin/platform/system-stats');
      if (data && data.metrics) setSystemMetrics(data.metrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const data = await api.get('/api/superadmin/platform/audit-logs');
      if (data && data.logs) setAuditLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Run loader on activeTab change
  useEffect(() => {
    if (activeTab === 'tenants' || activeTab === 'financials') {
      loadTenants();
      loadGrowthAnalytics();
    }
    if (activeTab === 'ai_engine') {
      loadPlatformSettings();
      checkAiEngine();
    }
    if (activeTab === 'ai_usage') {
      loadPlatformSettings();
      loadAiUsage();
    }
    if (activeTab === 'bots') loadInstances();
    if (activeTab === 'system') {
      loadPlatformSettings();
      loadSystemMetrics();
    }
    if (activeTab === 'notifications') loadPlatformSettings();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  // ACTIONS
  const handleSavePlatformSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingPlatform(true);
    try {
      await api.post('/api/superadmin/platform/settings', {
        ollamaUrl,
        ollamaModel,
        kokoroUrl,
        kokoroVoice,
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
      checkAiEngine();
    } catch (err) {
      alert('Error guardando ajustes: ' + (err.message || 'Error'));
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!playgroundPrompt.trim()) return;
    setTestingPlayground(true);
    setPlaygroundResult(null);
    try {
      const res = await api.post('/api/superadmin/platform/test-ai', {
        prompt: playgroundPrompt,
        provider: playgroundProvider,
        model: playgroundModel,
        baseUrl: (playgroundProvider === 'betico_ai' || playgroundProvider === 'ollama') ? ollamaUrl : localaiUrl
      });
      setPlaygroundResult(res);
    } catch (err) {
      setPlaygroundResult({ success: false, error: err.message || 'Error en prueba' });
    } finally {
      setTestingPlayground(false);
    }
  };

  const handleSaveQuotaOverride = async () => {
    if (!quotaOverrideTenant) return;
    setSavingOverride(true);
    try {
      await api.put('/api/superadmin/platform/tenants/' + quotaOverrideTenant.tenantId + '/ai-quota', {
        customTokensLimit: overrideTokensAmount
      });
      alert('¡Cuota personalizada actualizada con éxito!');
      setQuotaOverrideTenant(null);
      loadAiUsage();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSavingOverride(false);
    }
  };

  const handleTriggerDeploy = async (target) => {
    setDeployingTarget(target);
    setDeployMessage(null);
    try {
      const res = await api.post('/api/superadmin/platform/deploy/' + target, {});
      if (res && res.success) {
        setDeployMessage(res.message || 'Despliegue iniciado correctamente.');
      } else {
        setDeployMessage('Error al iniciar despliegue: ' + (res?.error || 'Desconocido'));
      }
    } catch (e) {
      setDeployMessage('Error al ejecutar webhook: ' + (e.message || 'Fallo'));
    } finally {
      setDeployingTarget(null);
    }
  };

  const handleConnectInstance = async (type) => {
    setConnectingInstance(type);
    try {
      await api.post('/api/superadmin/platform/instances/connect', { instanceType: type });
      loadInstances();
    } catch (err) {
      alert('Error conectando: ' + (err.message || 'Error'));
    } finally {
      setConnectingInstance(null);
    }
  };

  const handleDisconnectInstance = async (type) => {
    try {
      await api.post('/api/superadmin/platform/instances/disconnect', { instanceType: type });
      loadInstances();
    } catch (err) {
      alert('Error desconectando: ' + err.message);
    }
  };

  const handleApprovePayment = async (tenantId) => {
    if (!confirm('¿Aprobar pago y renovar suscripción por 30 días?')) return;
    try {
      await api.post('/api/superadmin/platform/tenants/' + tenantId + '/approve-payment', { days: 30 });
      alert('¡Pago aprobado con éxito! Suscripción renovada.');
      loadTenants();
    } catch (err) {
      alert('Error aprobando pago: ' + err.message);
    }
  };

  const handleImpersonate = async (tenantId) => {
    try {
      const currentToken = localStorage.getItem('token') || '';
      const res = await api.post('/api/tenants/' + tenantId + '/impersonate', {});
      if (res.token) {
        localStorage.setItem('superadmin_token', currentToken);
        localStorage.setItem('impersonated_tenant_name', res.tenant?.name || 'Cliente');
        localStorage.setItem('token', res.token);
        window.location.href = '/';
      }
    } catch (e) {
      alert('Error al acceder al negocio: ' + (e.message || 'Error'));
    }
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    setSavingTenant(true);
    try {
      if (editingTenant) {
        await api.put('/api/tenants/' + editingTenant.id, formData);
        alert('¡Inquilino actualizado con éxito!');
      } else {
        const generatedSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const res = await api.post('/api/tenants', {
          ...formData,
          slug: generatedSlug
        });
        alert(`¡Inquilino ${formData.name} creado exitosamente!\nContraseña temporal: ${res.tempPassword}`);
      }
      setShowModal(false);
      setEditingTenant(null);
      loadTenants();
    } catch (err) {
      alert('Error guardando inquilino: ' + (err.message || 'Verifique'));
    } finally {
      setSavingTenant(false);
    }
  };

  const formatPrice = (price, currency) => {
    const val = Number(price || 29);
    return currency === 'USD' ? '$' + val : '₡' + val.toLocaleString('es-CR');
  };

  const filteredTenants = tenants.filter(t => {
    const term = tenantSearch.toLowerCase().trim();
    const matchesSearch = !term || (
      t.name.toLowerCase().includes(term) || 
      t.slug.toLowerCase().includes(term) ||
      (t.adminEmail && t.adminEmail.toLowerCase().includes(term)) ||
      (t.address && t.address.toLowerCase().includes(term)) ||
      (t.whatsappNumber && t.whatsappNumber.includes(term))
    );

    if (!matchesSearch) return false;

    if (kpiFilter === 'active') {
      return t.active && t.subscriptionStatus === 'active' && t.plan?.toLowerCase() !== 'aliado';
    }
    if (kpiFilter === 'trial') {
      return t.subscriptionStatus === 'trial';
    }
    if (kpiFilter === 'suspended') {
      return t.subscriptionStatus === 'suspended' || (!t.active && t.subscriptionStatus !== 'grace_period');
    }
    if (kpiFilter === 'grace') {
      return t.subscriptionStatus === 'grace_period';
    }
    if (kpiFilter === 'aliado') {
      return t.plan?.toLowerCase() === 'aliado';
    }
    return true;
  });

  const kpiStats = {
    total: tenants.length,
    active: tenants.filter(t => t.active && t.subscriptionStatus === 'active' && t.plan?.toLowerCase() !== 'aliado').length,
    trial: tenants.filter(t => t.subscriptionStatus === 'trial').length,
    suspended: tenants.filter(t => t.subscriptionStatus === 'suspended' || (!t.active && t.subscriptionStatus !== 'grace_period')).length,
    grace: tenants.filter(t => t.subscriptionStatus === 'grace_period').length,
    aliado: tenants.filter(t => t.plan?.toLowerCase() === 'aliado').length,
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* GLOBAL TOAST */}
      {platformSavedToast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <CheckCircle size={18} /> ¡Ajustes guardados con éxito!
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA COBRANZA & CUENTAS POR COBRAR */}
      {/* ========================================================================= */}
      {activeTab === 'collections' && <BillingCollectionsView />}

      {/* ========================================================================= */}
      {/* VISTA 1: INQUILINOS & NEGOCIOS */}
      {/* ========================================================================= */}
      {activeTab === 'tenants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={26} color="var(--primary)" />
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Inquilinos & Negocios</h1>
              </div>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Control maestro de comercios suscritos, planes, credenciales y acceso directo a portales
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setShowGrowthAnalytics(!showGrowthAnalytics);
                  if (!growthData && !loadingGrowth) loadGrowthAnalytics();
                }}
                style={{
                  padding: '9px 15px',
                  backgroundColor: showGrowthAnalytics ? '#eff6ff' : 'var(--surface)',
                  color: showGrowthAnalytics ? '#2563eb' : 'var(--text-main)',
                  border: showGrowthAnalytics ? '1px solid #bfdbfe' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <BarChart2 size={16} />
                {showGrowthAnalytics ? 'Ocultar Analítica' : '📊 Gráficos de Crecimiento'}
                {showGrowthAnalytics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                onClick={() => {
                  setEditingTenant(null);
                  setFormData({
                    name: '', slug: '', contactName: '', email: '', phone: '',
                    plan: 'starter', customMonthlyPrice: 29, billingCurrency: 'CRC', isTrial: true, trialDays: 15,
                    address: '', latitude: '', longitude: '', googleMapsUrl: ''
                  });
                  setShowModal(true);
                }}
                style={{
                  padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Plus size={16} /> Crear Inquilino con Onboarding
              </button>
            </div>
          </div>

          {/* 6 KPI Cards: Total de negocios | Activos | Prueba | Suspendidos | En Gracia | Aliados */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            
            {/* 1. TOTAL DE NEGOCIOS */}
            <div 
              onClick={() => setKpiFilter('all')}
              title="Mostrar todos los negocios"
              style={{
                backgroundColor: 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'all' ? '2px solid var(--primary)' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'all' ? '0 0 0 2px rgba(37,99,235,0.1)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                TOTAL NEGOCIOS
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', marginTop: '4px', color: 'var(--text-main)' }}>
                {kpiStats.total}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {kpiFilter === 'all' ? '● Mostrando todos' : 'Ver todos'}
              </div>
            </div>

            {/* 2. ACTIVOS */}
            <div 
              onClick={() => setKpiFilter(kpiFilter === 'active' ? 'all' : 'active')}
              title="Filtrar comercios activos y al día"
              style={{
                backgroundColor: kpiFilter === 'active' ? '#f0fdf4' : 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'active' ? '2px solid #16a34a' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'active' ? '0 0 0 2px rgba(22,163,74,0.15)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                ACTIVOS
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>
                {kpiStats.active}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#15803d', marginTop: '2px' }}>
                {kpiFilter === 'active' ? '● Filtrado activo' : 'Suscripción al día'}
              </div>
            </div>

            {/* 3. PRUEBA */}
            <div 
              onClick={() => setKpiFilter(kpiFilter === 'trial' ? 'all' : 'trial')}
              title="Filtrar comercios en período de prueba"
              style={{
                backgroundColor: kpiFilter === 'trial' ? '#eff6ff' : 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'trial' ? '2px solid #2563eb' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'trial' ? '0 0 0 2px rgba(37,99,235,0.15)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                PRUEBA
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>
                {kpiStats.trial}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1d4ed8', marginTop: '2px' }}>
                {kpiFilter === 'trial' ? '● Filtrado activo' : 'En período de prueba'}
              </div>
            </div>

            {/* 4. SUSPENDIDOS */}
            <div 
              onClick={() => setKpiFilter(kpiFilter === 'suspended' ? 'all' : 'suspended')}
              title="Filtrar comercios suspendidos o inactivos"
              style={{
                backgroundColor: kpiFilter === 'suspended' ? '#fef2f2' : 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'suspended' ? '2px solid #dc2626' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'suspended' ? '0 0 0 2px rgba(220,38,38,0.15)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                SUSPENDIDOS
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                {kpiStats.suspended}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#b91c1c', marginTop: '2px' }}>
                {kpiFilter === 'suspended' ? '● Filtrado activo' : 'Acceso bloqueado'}
              </div>
            </div>

            {/* 5. EN GRACIA */}
            <div 
              onClick={() => setKpiFilter(kpiFilter === 'grace' ? 'all' : 'grace')}
              title="Filtrar comercios en período de gracia"
              style={{
                backgroundColor: kpiFilter === 'grace' ? '#fffbeb' : 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'grace' ? '2px solid #d97706' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'grace' ? '0 0 0 2px rgba(217,119,6,0.15)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                EN GRACIA
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#d97706', marginTop: '4px' }}>
                {kpiStats.grace}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '2px' }}>
                {kpiFilter === 'grace' ? '● Filtrado activo' : 'Tolerancia de pago'}
              </div>
            </div>

            {/* 6. ALIADOS */}
            <div 
              onClick={() => setKpiFilter(kpiFilter === 'aliado' ? 'all' : 'aliado')}
              title="Filtrar comercios con Plan Aliado (Exentos)"
              style={{
                backgroundColor: kpiFilter === 'aliado' ? '#faf5ff' : 'var(--surface)', padding: '14px 16px', borderRadius: '10px',
                border: kpiFilter === 'aliado' ? '2px solid #8b5cf6' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: kpiFilter === 'aliado' ? '0 0 0 2px rgba(139,92,246,0.15)' : 'none'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                ALIADOS
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '4px' }}>
                {kpiStats.aliado}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7c3aed', marginTop: '2px' }}>
                {kpiFilter === 'aliado' ? '● Filtrado activo' : 'Exentos de por vida'}
              </div>
            </div>

          </div>

          {/* ACTIVE FILTER BANNER */}
          {kpiFilter !== 'all' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem'
            }}>
              <span style={{ color: 'var(--text-main)' }}>
                🔍 Filtrando por estado: <strong style={{ textTransform: 'uppercase' }}>{kpiFilter === 'active' ? 'Activos' : kpiFilter === 'trial' ? 'Prueba' : kpiFilter === 'suspended' ? 'Suspendidos' : kpiFilter === 'grace' ? 'En Gracia' : 'Aliados'}</strong> ({filteredTenants.length} resultados)
              </span>
              <button
                type="button"
                onClick={() => setKpiFilter('all')}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem' }}
              >
                ✕ Ver todos ({tenants.length})
              </button>
            </div>
          )}

          {/* GROWTH & USERS ANALYTICS PANEL (Collapsible) */}
          {showGrowthAnalytics && (
            <div style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
              padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={20} color="var(--primary)" />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold' }}>
                    Analítica de Crecimiento & Usuarios
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={loadGrowthAnalytics}
                  disabled={loadingGrowth}
                  style={{
                    padding: '5px 12px', fontSize: '0.75rem', borderRadius: '6px',
                    border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                  }}
                >
                  <RefreshCw size={12} className={loadingGrowth ? 'animate-spin' : ''} />
                  {loadingGrowth ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>

              {/* Counters Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL USUARIOS EQUIPO</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '2px' }}>
                    {growthData?.totals?.users?.total || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>En todos los comercios</div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>ADMINISTRADORES</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#16a34a', marginTop: '2px' }}>
                    {growthData?.totals?.users?.admins || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#15803d' }}>Dueños de negocio</div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>STAFF & COLABORADORES</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#2563eb', marginTop: '2px' }}>
                    {growthData?.totals?.users?.staff || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#1d4ed8' }}>Especialistas / Operadores</div>
                </div>

                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600 }}>NUEVOS EN ÚLTIMOS 30 DÍAS</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '2px' }}>
                    +{growthData?.totals?.users?.new_last_30_days || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#7c3aed' }}>Usuarios registrados</div>
                </div>
              </div>

              {/* SVG Charts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                
                {/* Chart 1: Negocios por Mes */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} color="var(--primary)" /> Comercios Registrados por Mes
                  </div>
                  {growthData?.tenantsByMonth && growthData.tenantsByMonth.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '120px', paddingTop: '20px', borderBottom: '1px solid var(--border)' }}>
                      {growthData.tenantsByMonth.map((item: any) => {
                        const maxCount = Math.max(...growthData.tenantsByMonth.map((m: any) => m.count), 1);
                        const heightPercent = Math.max(18, Math.round((item.count / maxCount) * 100));
                        return (
                          <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                              {item.count}
                            </span>
                            <div 
                              style={{
                                width: '100%', maxWidth: '42px', height: `${heightPercent}%`,
                                backgroundColor: 'var(--primary)', borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease'
                              }}
                              title={`${item.month}: ${item.count} comercios`}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                      Cargando histórico de comercios...
                    </div>
                  )}
                </div>

                {/* Chart 2: Nuevos Usuarios por Mes */}
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="#16a34a" /> Nuevos Usuarios de Equipo por Mes
                  </div>
                  {growthData?.usersByMonth && growthData.usersByMonth.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '120px', paddingTop: '20px', borderBottom: '1px solid var(--border)' }}>
                      {growthData.usersByMonth.map((item: any) => {
                        const maxCount = Math.max(...growthData.usersByMonth.map((m: any) => m.count), 1);
                        const heightPercent = Math.max(18, Math.round((item.count / maxCount) * 100));
                        return (
                          <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#16a34a' }}>
                              {item.count}
                            </span>
                            <div 
                              style={{
                                width: '100%', maxWidth: '42px', height: `${heightPercent}%`,
                                backgroundColor: '#16a34a', borderRadius: '4px 4px 0 0',
                                transition: 'height 0.3s ease'
                              }}
                              title={`${item.month}: ${item.count} usuarios`}
                            />
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {item.month}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                      Cargando histórico de usuarios...
                    </div>
                  )}
                </div>

              </div>

              {/* Distribution by Plan */}
              {growthData?.plansDistribution && growthData.plansDistribution.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                    Distribución por Plan:
                  </span>
                  {growthData.plansDistribution.map((p: any) => (
                    <span 
                      key={p.plan}
                      style={{
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                        backgroundColor: p.plan === 'aliado' ? '#faf5ff' : p.plan === 'enterprise' ? '#fef3c7' : '#eff6ff',
                        color: p.plan === 'aliado' ? '#7c3aed' : p.plan === 'enterprise' ? '#b45309' : '#1d4ed8',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {p.plan.toUpperCase()}: <strong>{p.count}</strong>
                    </span>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* Search & View Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Buscar por nombre, slug o correo..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold',
                  backgroundColor: viewMode === 'grid' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--text-muted)'
                }}
              >
                Cuadrícula
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold',
                  backgroundColor: viewMode === 'list' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-muted)'
                }}
              >
                Lista Detallada
              </button>
            </div>
          </div>

          {/* List or Grid Render */}
          {loadingTenants ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando comercios...</div>
          ) : filteredTenants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron comercios.</div>
          ) : viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredTenants.map(t => (
                <div key={t.id} style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{t.name}</h3>
                      <code style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>/{t.slug}</code>
                    </div>
                    <span style={{
                      padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                      backgroundColor: t.subscriptionStatus === 'suspended' ? '#fee2e2' : t.subscriptionStatus === 'trial' ? '#eff6ff' : '#dcfce7',
                      color: t.subscriptionStatus === 'suspended' ? '#991b1b' : t.subscriptionStatus === 'trial' ? '#1e40af' : '#15803d'
                    }}>
                      {t.subscriptionStatus === 'suspended' ? '🔴 Suspendido' : t.subscriptionStatus === 'trial' ? '🔵 En Prueba' : '🟢 Activo'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📧 {t.adminEmail || 'Sin correo registrado'}</div>
                    <div>📱 WhatsApp: {t.whatsappNumber ? '🟢 Conectado (' + t.whatsappNumber + ')' : '⚪ No vinculado'}</div>
                    <div>💎 Plan: <strong style={{ textTransform: 'uppercase', color: 'var(--text-main)' }}>{t.plan}</strong> ({formatPrice(t.customMonthlyPrice, t.billingCurrency)}/mes)</div>
                  </div>

                  {/* Ubicación Física y Enlace Maps */}
                  {(t.address || t.googleMapsUrl || t.latitude) ? (
                    <div style={{ fontSize: '0.76rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }} title={t.address || 'Ubicación registrada'}>
                        📍 {t.address || 'Ubicación registrada'}
                      </span>
                      {(t.googleMapsUrl || (t.latitude && t.longitude)) && (
                        <a
                          href={t.googleMapsUrl || `https://maps.google.com/?q=${t.latitude},${t.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.72rem', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}
                        >
                          <Navigation size={11} /> Maps ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📍 Sin ubicación registrada
                    </div>
                  )}

                  {/* Infraestructura Backend (Solo Lectura) */}
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🐘 Postgres ID:</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const val = t.postgresTenantId || t.id;
                          navigator.clipboard.writeText(val);
                          setCopiedSlug(`pg_${t.id}`);
                          setTimeout(() => setCopiedSlug(null), 2000);
                        }}
                        title={`Copiar UUID completo: ${t.postgresTenantId || t.id}`}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'monospace' }}
                      >
                        {copiedSlug === `pg_${t.id}` ? '✅ Copiado' : `${(t.postgresTenantId || t.id).slice(0, 8)}... 📋`}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>📱 Evolution API:</span>
                      {t.evolutionInstance ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(t.evolutionInstance || '');
                            setCopiedSlug(`evo_${t.id}`);
                            setTimeout(() => setCopiedSlug(null), 2000);
                          }}
                          title={`Copiar Instancia Evolution: ${t.evolutionInstance}`}
                          style={{
                            background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '4px', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 600,
                            color: '#15803d', cursor: 'pointer', fontFamily: 'monospace'
                          }}
                        >
                          {copiedSlug === `evo_${t.id}` ? '✅ Copiado' : `${t.evolutionInstance} 📋`}
                        </button>
                      ) : (
                        <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          ⚪ Sin vincular
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleImpersonate(t.id)}
                      style={{ flex: 1, padding: '7px 10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Key size={13} /> Entrar al Portal
                    </button>
                    <button
                      onClick={() => setSelectedDossierTenantId(t.id)}
                      title="Ver Expediente 360°"
                      style={{ padding: '7px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTenant(t);
                        let defP = 55000;
                        if (t.plan === 'enterprise') defP = 85000;
                        else if (t.plan === 'aliado') defP = 0;
                        else if (t.plan === 'emprendedor') defP = 35000;
                        
                        const actualPrice = (t.customMonthlyPrice !== undefined && t.customMonthlyPrice !== null && Number(t.customMonthlyPrice) !== 29)
                          ? Number(t.customMonthlyPrice)
                          : defP;

                        setFormData({
                          name: t.name || '', 
                          slug: t.slug || '', 
                          contactName: '', 
                          email: (t.adminEmail && t.adminEmail !== 'Sin registrar') ? t.adminEmail : '', 
                          phone: t.whatsappNumber || '',
                          plan: t.plan || 'pro', 
                          customMonthlyPrice: actualPrice, 
                          billingCurrency: t.billingCurrency || 'CRC',
                          isTrial: t.subscriptionStatus === 'trial', 
                          trialDays: 15,
                          address: t.address || '',
                          latitude: t.latitude != null ? String(t.latitude) : '',
                          longitude: t.longitude != null ? String(t.longitude) : '',
                          googleMapsUrl: t.googleMapsUrl || ''
                        });
                        setShowModal(true);
                      }}
                      style={{ padding: '7px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setResetModalTenant(t);
                        setNewPassword('');
                      }}
                      title="Restablecer Contraseña"
                      style={{ padding: '7px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <Lock size={13} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 14px' }}>Comercio</th>
                    <th style={{ padding: '12px 14px' }}>Plan & Precio</th>
                    <th style={{ padding: '12px 14px' }}>WhatsApp</th>
                    <th style={{ padding: '12px 14px' }}>Estado</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <strong>{t.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.adminEmail} • <code>/{t.slug}</code></div>
                        
                        {/* Ubicación en tabla */}
                        {(t.address || t.googleMapsUrl || t.latitude) ? (
                          <div style={{ fontSize: '0.73rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.address || 'Ubicación registrada'}>
                              📍 {t.address || 'Ubicación registrada'}
                            </span>
                            {(t.googleMapsUrl || (t.latitude && t.longitude)) && (
                              <a
                                href={t.googleMapsUrl || `https://maps.google.com/?q=${t.latitude},${t.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.71rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                              >
                                Maps ↗
                              </a>
                            )}
                          </div>
                        ) : null}

                        {/* Infraestructura Backend (Solo Lectura) */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const val = t.postgresTenantId || t.id;
                              navigator.clipboard.writeText(val);
                              setCopiedSlug(`pg_${t.id}`);
                              setTimeout(() => setCopiedSlug(null), 2000);
                            }}
                            title={`Copiar Postgres UUID: ${t.postgresTenantId || t.id}`}
                            style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.69rem', cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            🐘 {copiedSlug === `pg_${t.id}` ? '✅ Copiado' : `PG: ${(t.postgresTenantId || t.id).slice(0, 8)}... 📋`}
                          </button>
                          {t.evolutionInstance ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(t.evolutionInstance || '');
                                setCopiedSlug(`evo_${t.id}`);
                                setTimeout(() => setCopiedSlug(null), 2000);
                              }}
                              title={`Copiar Instancia Evolution API: ${t.evolutionInstance}`}
                              style={{
                                background: 'rgba(34, 197, 94, 0.08)',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: '4px',
                                padding: '2px 6px',
                                fontSize: '0.69rem',
                                fontWeight: 600,
                                color: '#15803d',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              📱 {copiedSlug === `evo_${t.id}` ? '✅ Copiado' : `Evo: ${t.evolutionInstance} 📋`}
                            </button>
                          ) : (
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.69rem',
                              fontWeight: 500,
                              backgroundColor: '#f8fafc',
                              border: '1px solid var(--border)',
                              color: 'var(--text-muted)'
                            }}>
                              📱 Evo: Sin vincular
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{t.plan}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatPrice(t.customMonthlyPrice, t.billingCurrency)}/mes</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {t.whatsappNumber ? (
                          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>🟢 {t.whatsappNumber}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>⚪ No vinculado</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold',
                          backgroundColor: t.subscriptionStatus === 'suspended' ? '#fee2e2' : t.subscriptionStatus === 'trial' ? '#eff6ff' : '#dcfce7',
                          color: t.subscriptionStatus === 'suspended' ? '#991b1b' : t.subscriptionStatus === 'trial' ? '#1e40af' : '#15803d'
                        }}>
                          {t.subscriptionStatus === 'suspended' ? 'Suspendido' : t.subscriptionStatus === 'trial' ? 'Prueba' : 'Activo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleImpersonate(t.id)}
                            style={{ padding: '5px 9px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Entrar
                          </button>
                          <button
                            onClick={() => setSelectedDossierTenantId(t.id)}
                            title="Expediente 360°"
                            style={{ padding: '5px 8px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            <FileText size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTenant(t);
                              let defP = 55000;
                              if (t.plan === 'enterprise') defP = 85000;
                              else if (t.plan === 'aliado') defP = 0;
                              else if (t.plan === 'emprendedor') defP = 35000;
                              
                              const actualPrice = (t.customMonthlyPrice !== undefined && t.customMonthlyPrice !== null && Number(t.customMonthlyPrice) !== 29)
                                ? Number(t.customMonthlyPrice)
                                : defP;

                              setFormData({
                                name: t.name || '', 
                                slug: t.slug || '', 
                                contactName: '', 
                                email: (t.adminEmail && t.adminEmail !== 'Sin registrar') ? t.adminEmail : '', 
                                phone: t.whatsappNumber || '',
                                plan: t.plan || 'pro', 
                                customMonthlyPrice: actualPrice, 
                                billingCurrency: t.billingCurrency || 'CRC',
                                isTrial: t.subscriptionStatus === 'trial', 
                                trialDays: 15,
                                address: t.address || '',
                                latitude: t.latitude != null ? String(t.latitude) : '',
                                longitude: t.longitude != null ? String(t.longitude) : '',
                                googleMapsUrl: t.googleMapsUrl || ''
                              });
                              setShowModal(true);
                            }}
                            style={{ padding: '5px 8px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <Edit size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: FINANZAS & FACTURACIÓN */}
      {/* ========================================================================= */}
      {activeTab === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={26} color="#16a34a" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Finanzas & Suscripciones</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Control de ingresos recurrentes (MRR), aprobación de comprobantes SINPE y gestión de prórrogas
            </p>
          </div>

          {/* Pending Proofs Alert & List */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Comprobantes de Pago por Verificar</h3>
            </div>

            {tenants.filter(t => t.lastPaymentProof || t.lastPaymentRef).length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay comprobantes pendientes de aprobación en este momento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tenants.filter(t => t.lastPaymentProof || t.lastPaymentRef).map(t => (
                  <div key={t.id} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem' }}>{t.name}</strong> <code>/{t.slug}</code>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Ref SINPE: <strong>{t.lastPaymentRef || 'Sin referencia escrita'}</strong> • Monto: <strong>{formatPrice(t.lastPaymentAmount, t.billingCurrency)}</strong>
                      </div>
                      {t.paymentNotes && <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>Nota: {t.paymentNotes}</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {t.lastPaymentProof && (
                        <a href={t.lastPaymentProof} target="_blank" rel="noreferrer" style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', color: '#1e293b', textDecoration: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold' }}>
                          Ver Comprobante ↗
                        </a>
                      )}
                      <button
                        onClick={() => handleApprovePayment(t.id)}
                        style={{ padding: '8px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle size={15} /> Aprobar (+30 días)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: MOTOR LOCALAI & MODELOS */}
      {/* ========================================================================= */}
      {activeTab === 'ai_engine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={26} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Motor Betico IA & Modelos</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Centro neurálgico de tu Inteligencia Artificial privada. Configura modelos, prueba inferencia y monitorea el estado del servidor.
            </p>
          </div>

          {/* Engine Health Card */}
          <div style={{
            backgroundColor: aiEngineStatus?.online ? '#f0fdf4' : '#fef2f2',
            border: aiEngineStatus?.online ? '1px solid #bbf7d0' : '1px solid #fecaca',
            borderRadius: '14px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: aiEngineStatus?.online ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={22} color={aiEngineStatus?.online ? '#16a34a' : '#dc2626'} />
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', color: aiEngineStatus?.online ? '#166534' : '#991b1b' }}>
                  {aiEngineStatus?.online ? '🟢 Motor Betico IA (Ollama) Operativo & Respondiendo' : '🔴 Motor Betico IA Fuera de Línea'}
                </strong>
                <div style={{ fontSize: '0.8rem', color: aiEngineStatus?.online ? '#15803d' : '#b91c1c', marginTop: '2px' }}>
                  Endpoint: <code>{ollamaUrl}</code> {aiEngineStatus?.latencyMs ? '• Latencia Ping: ' + aiEngineStatus.latencyMs + 'ms' : ''} • Modelo: <strong>{ollamaModel}</strong>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem' }}>
                  <span style={{ color: kokoroStatus?.online ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                    {kokoroStatus?.online ? '🟢 Kokoro TTS (Audio MP3)' : '⚪ Kokoro TTS'}
                  </span>
                  <span style={{ color: whisperStatus?.online ? '#166534' : '#991b1b', fontWeight: 'bold' }}>
                    {whisperStatus?.online ? '🟢 Whisper (Transcripción)' : '⚪ Whisper'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={checkAiEngine}
              disabled={checkingAiEngine}
              style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> {checkingAiEngine ? 'Verificando...' : 'Probar Ping'}
            </button>
          </div>

          {/* Server Config & Failover Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
            
            {/* Ollama Betico AI Config */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={18} color="var(--primary)" /> Configuración de Betico IA (Ollama Local)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>URL del Servidor Ollama</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Modelo Principal</label>
                  <select
                    value={ollamaModel}
                    onChange={(e) => {
                      setOllamaModel(e.target.value);
                      setPlaygroundModel(e.target.value);
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    {availableOllamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 'betico-ai' ? '⚡ (Modelo Propio Optimizado - Rápido)' : m === 'qwen2.5:1.5b' ? '📦 (Base Qwen 2.5 1.5B)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleSavePlatformSettings()}
                  disabled={savingPlatform}
                  style={{ marginTop: '8px', padding: '10px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {savingPlatform ? 'Guardando...' : 'Guardar Motor Betico IA'}
                </button>
              </div>
            </div>

            {/* Kokoro TTS & Whisper Config */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bot size={18} color="#0284c7" /> Audio: Voz (Kokoro) & Transcripción (Whisper)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>URL de Kokoro TTS (Generación de Voz)</label>
                  <input
                    type="text"
                    value={kokoroUrl}
                    onChange={(e) => setKokoroUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Voz Predeterminada (Español)</label>
                  <select
                    value={kokoroVoice}
                    onChange={(e) => setKokoroVoice(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="ef_dora">Dora (Femenina - Español)</option>
                    <option value="em_alex">Alex (Masculina - Español)</option>
                    <option value="em_santa">Santa (Masculina Cálida - Español)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>URL de Whisper (Transcripción de Audios)</label>
                  <input
                    type="text"
                    value={localaiUrl}
                    onChange={(e) => setLocalaiUrl(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  onClick={() => handleSavePlatformSettings()}
                  disabled={savingPlatform}
                  style={{ marginTop: '8px', padding: '10px 16px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {savingPlatform ? 'Guardando...' : 'Guardar Ajustes de Audio'}
                </button>
              </div>
            </div>

            {/* Master Failover Config */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={18} color="#16a34a" /> Respaldo Failover (Gemini / OpenAI)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.78rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  ℹ️ <strong>Betico AI es 100% gratuita</strong> para los inquilinos. Las llamadas a APIs externas comerciales de pago solo se efectúan si un tenant configuró su propia llave BYOK.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Proveedor de Respaldo</label>
                  <select
                    value={masterAiProvider}
                    onChange={(e) => setMasterAiProvider(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  >
                    <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                    <option value="openai">OpenAI (GPT-4o Mini)</option>
                    <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Modelo de Respaldo</label>
                  <input
                    type="text"
                    value={masterAiModel}
                    onChange={(e) => setMasterAiModel(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>API Key Maestra</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={masterAiKey}
                    onChange={(e) => setMasterAiKey(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                  />
                </div>

                <button
                  onClick={() => handleSavePlatformSettings()}
                  disabled={savingPlatform}
                  style={{ marginTop: '8px', padding: '10px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {savingPlatform ? 'Guardando...' : 'Guardar Llave de Respaldo'}
                </button>
              </div>
            </div>

          </div>

          {/* AI PLAYGROUND / TESTER */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Play size={20} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Playground / Probador en Vivo de IA</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Envía una consulta directa a tu servidor de IA para comprobar velocidad de respuesta, latencia en ms y calidad del texto generado.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Motor a probar</label>
                <select
                  value={playgroundProvider}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setPlaygroundProvider(prov);
                    if (prov === 'betico_ai' || prov === 'ollama') {
                      setPlaygroundModel(ollamaModel || 'betico-ai');
                    } else if (prov === 'gemini') {
                      setPlaygroundModel('gemini-2.5-flash');
                    } else if (prov === 'openai') {
                      setPlaygroundModel('gpt-4o-mini');
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="betico_ai">⚡ Betico AI (Ollama Local - Gratuito)</option>
                  <option value="gemini">🟢 Google Gemini (Respaldo)</option>
                  <option value="openai">🟣 OpenAI (Respaldo)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Modelo</label>
                <input
                  type="text"
                  value={playgroundModel}
                  onChange={(e) => setPlaygroundModel(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <textarea
              rows={3}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Escribe aquí el mensaje de prueba para la IA..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', resize: 'vertical', marginBottom: '12px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button
                onClick={handleRunPlayground}
                disabled={testingPlayground}
                style={{ padding: '10px 22px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} /> {testingPlayground ? 'Generando respuesta...' : 'Ejecutar Prueba'}
              </button>
            </div>

            {playgroundResult && (
              <div style={{ backgroundColor: playgroundResult.success ? '#f8fafc' : '#fef2f2', border: playgroundResult.success ? '1px solid #cbd5e1' : '1px solid #fecaca', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Motor: <strong>{playgroundResult.config?.provider} ({playgroundResult.config?.model})</strong></span>
                  <span>Latencia: <strong style={{ color: 'var(--primary)' }}>{playgroundResult.latencyMs} ms</strong> • Tokens: <strong>{playgroundResult.tokensUsed || 0}</strong></span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: playgroundResult.success ? '#1e293b' : '#dc2626', lineHeight: '1.5' }}>
                  {playgroundResult.text || playgroundResult.error}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: CONSUMO & CUOTAS */}
      {/* ========================================================================= */}
      {activeTab === 'ai_usage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={26} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Monitoreo de Consumo & Cuotas de Tokens</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Monitorea el uso de tokens de cada cliente, ajusta cuotas globales por plan y asigna límites personalizados a clientes VIP
            </p>
          </div>

          {/* Global Quota Limits by Plan */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={18} color="#ea580c" /> Límites Globales de Tokens por Plan
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Plan Starter (Tokens/mes)</label>
                <input
                  type="number"
                  value={quotaStarterTokens}
                  onChange={(e) => setQuotaStarterTokens(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Plan Pro (Tokens/mes)</label>
                <input
                  type="number"
                  value={quotaProTokens}
                  onChange={(e) => setQuotaProTokens(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Plan Business (Tokens/mes)</label>
                <input
                  type="number"
                  value={quotaBusinessTokens}
                  onChange={(e) => setQuotaBusinessTokens(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleSavePlatformSettings()}
                disabled={savingPlatform}
                style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                {savingPlatform ? 'Guardando...' : 'Actualizar Cuotas Globales'}
              </button>
            </div>
          </div>

          {/* Tenants AI Usage Table */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Consumo en el Mes Actual por Inquilino</h3>
              <button
                onClick={loadAiUsage}
                style={{ padding: '6px 12px', border: '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}
              >
                Refrescar
              </button>
            </div>

            {loadingAiUsage ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando consumo de IA...</div>
            ) : aiUsageList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay consumo registrado este mes aún.</div>
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
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Cuota Personalizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiUsageList.map(u => (
                      <tr key={u.tenantId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <strong>{u.tenantName}</strong>
                          <code style={{ fontSize: '0.72rem', display: 'block', color: 'var(--primary)' }}>/{u.slug}</code>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{u.plan}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>
                            <strong>{Number(u.tokensUsed || 0).toLocaleString('es-CR')}</strong> / {Number(u.limit || 25000).toLocaleString('es-CR')} ({u.percentageUsed}%)
                          </div>
                          <div style={{ width: '130px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
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
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setQuotaOverrideTenant(u);
                              setOverrideTokensAmount(u.limit || 50000);
                            }}
                            style={{ padding: '4px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            ⚙️ Ajustar Límite
                          </button>
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

      {/* ========================================================================= */}
      {/* VISTA 5: BOTS DE WHATSAPP */}
      {/* ========================================================================= */}
      {activeTab === 'bots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={26} color="#16a34a" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Bots Maestros de WhatsApp</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Instancias maestras para atención de ventas/demo y soporte técnico centralizado
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
            
            {/* Bot de Ventas */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem' }}>🤖 Bot de Ventas & Demos</strong>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                  betico_ventas
                </span>
              </div>

              {instances.find(i => i.instanceType === 'ventas')?.qrCode ? (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <img src={instances.find(i => i.instanceType === 'ventas').qrCode} alt="QR" style={{ width: '180px', height: '180px', margin: '0 auto' }} />
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Estado: {instances.find(i => i.instanceType === 'ventas')?.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleConnectInstance('ventas')}
                    disabled={connectingInstance === 'ventas'}
                    style={{ padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    {connectingInstance === 'ventas' ? 'Conectando...' : 'Conectar QR'}
                  </button>
                  <button
                    onClick={() => handleDisconnectInstance('ventas')}
                    style={{ padding: '7px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>

            {/* Bot de Soporte */}
            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem' }}>🛠️ Bot de Soporte Técnico</strong>
                <span style={{ fontSize: '0.72rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                  betico_soporte
                </span>
              </div>

              {instances.find(i => i.instanceType === 'soporte')?.qrCode ? (
                <div style={{ textAlign: 'center', padding: '12px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <img src={instances.find(i => i.instanceType === 'soporte').qrCode} alt="QR" style={{ width: '180px', height: '180px', margin: '0 auto' }} />
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Estado: {instances.find(i => i.instanceType === 'soporte')?.status === 'connected' ? '🟢 Conectado' : '⚪ Desconectado'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleConnectInstance('soporte')}
                    disabled={connectingInstance === 'soporte'}
                    style={{ padding: '7px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    {connectingInstance === 'soporte' ? 'Conectando...' : 'Conectar QR'}
                  </button>
                  <button
                    onClick={() => handleDisconnectInstance('soporte')}
                    style={{ padding: '7px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 6: SERVIDOR & DESPLIEGUES */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={26} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Servidor, DB & Despliegues</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Métricas reales del servidor, estado de PostgreSQL y disparadores de compilación en VPS
            </p>
          </div>

          {/* VPS Auto-Deploy Box */}
          <div style={{ backgroundColor: '#0f172a', color: 'white', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Rocket size={20} color="#38bdf8" />
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 'bold', color: '#f8fafc' }}>Despliegue Instantáneo en Servidor VPS</h4>
              </div>
              <span style={{ fontSize: '0.72rem', backgroundColor: '#1e293b', padding: '4px 8px', borderRadius: '6px', color: '#94a3b8' }}>
                IP: 2.25.103.200
              </span>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              Dispara el ciclo de compilación, git pull y reinicio automático de tus contenedores directamente en tu VPS.
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

          {/* System Metrics Grid */}
          {systemMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>MEMORIA RAM (RSS)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{systemMetrics.ramRss}</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TIEMPO ACTIVO (UPTIME)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{systemMetrics.uptime}</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOTAL PEDIDOS DB</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{systemMetrics.ordersTotal}</div>
              </div>
              <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TOTAL MENSAJES DB</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '4px' }}>{systemMetrics.chatsTotal}</div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 7: ALERTAS & NOTIFICACIONES */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={26} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Alertas & Notificaciones</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Configura a qué número de WhatsApp deseas recibir avisos de nuevos registros, comprobantes y avisos de morosidad
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
              📱 Teléfono WhatsApp de SuperAdmin
            </label>
            <input
              type="text"
              placeholder="50688888888"
              value={superadminNotifyPhone}
              onChange={(e) => setSuperadminNotifyPhone(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', marginBottom: '8px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>
              Formato internacional sin signos (ejemplo: 50688888888).
            </span>

            <button
              onClick={() => handleSavePlatformSettings()}
              disabled={savingPlatform}
              style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {savingPlatform ? 'Guardando...' : 'Guardar Número de Alertas'}
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 8: AUDITORÍA & ACCESOS */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={26} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Auditoría & Seguridad</h1>
            </div>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Registro cronológico de inicios de sesión, cambios de contraseña y accesos administrativos
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px' }}>
            {loadingAudit ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando logs de auditoría...</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No hay registros de auditoría aún.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 12px' }}>Fecha y Hora</th>
                      <th style={{ padding: '10px 12px' }}>Usuario</th>
                      <th style={{ padding: '10px 12px' }}>Acción</th>
                      <th style={{ padding: '10px 12px' }}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleString('es-CR')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <strong>{log.userName || log.userEmail || 'Sistema'}</strong>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {log.ipAddress || '127.0.0.1'}
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

      {/* ========================================================================= */}
      {/* MODAL: ASIGNAR CUOTA PERSONALIZADA DE IA */}
      {/* ========================================================================= */}
      {quotaOverrideTenant && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '440px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 'bold' }}>Asignar Cuota Especial</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Comercio: <strong>{quotaOverrideTenant.tenantName}</strong> (/{quotaOverrideTenant.slug})
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>Tokens Mensuales Permitidos</label>
              <input
                type="number"
                value={overrideTokensAmount}
                onChange={(e) => setOverrideTokensAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Ejemplo: 500,000 tokens para clientes VIP de alto volumen.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setQuotaOverrideTenant(null)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveQuotaOverride}
                disabled={savingOverride}
                style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {savingOverride ? 'Guardando...' : 'Aplicar Cuota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR / EDITAR INQUILINO */}
      {/* ========================================================================= */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '580px', width: '100%', padding: '26px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {editingTenant ? '✏️ Editar Inquilino: ' + editingTenant.name : '🚀 Crear Nuevo Inquilino con Onboarding'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSaveTenant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>Nombre del Negocio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Barbería Clásica CR"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
              </div>

              {!editingTenant && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>Slug / Identificador (URL) *</label>
                  <input
                    type="text"
                    placeholder="barberia-clasica (Opcional, se genera automático)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>Correo de Acceso *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@barberia.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp de Contacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="50688888888"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => {
                      const newPlan = e.target.value;
                      let defaultPrice = 55000;
                      if (newPlan === 'enterprise') defaultPrice = 85000;
                      if (newPlan === 'aliado') defaultPrice = 0;
                      if (newPlan === 'emprendedor') defaultPrice = 35000;
                      setFormData({
                        ...formData,
                        plan: newPlan,
                        customMonthlyPrice: defaultPrice
                      });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                  >
                    <option value="pro">Plan Betico Pro (₡55.000 / mes)</option>
                    <option value="enterprise">Plan Betico Empresa (₡85.000 / mes - Multi-sucursal)</option>
                    <option value="aliado">🌟 Plan Betico Aliado (₡0 / mes - Gratis de por Vida) [Oculto]</option>
                    <option value="emprendedor">💎 Plan Betico Emprendedor (₡35.000 / mes - Tarifa Especial) [Oculto]</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '4px' }}>Precio Mensual Acordado</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="number"
                      value={formData.customMonthlyPrice}
                      onChange={(e) => setFormData({ ...formData, customMonthlyPrice: Number(e.target.value) })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    />
                    <select
                      value={formData.billingCurrency}
                      onChange={(e) => setFormData({ ...formData, billingCurrency: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
                    >
                      <option value="CRC">₡ CRC</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* UBICACIÓN DEL NEGOCIO & NAVEGACIÓN GPS */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="#ef4444" /> Ubicación Física & Enlace GPS
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        alert('La geolocalización no está soportada por su navegador.');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = Number(pos.coords.latitude.toFixed(7));
                          const lng = Number(pos.coords.longitude.toFixed(7));
                          const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
                          setFormData(prev => ({
                            ...prev,
                            latitude: String(lat),
                            longitude: String(lng),
                            googleMapsUrl: prev.googleMapsUrl || mapsUrl
                          }));
                          alert(`📍 Coordenadas detectadas: ${lat}, ${lng}`);
                        },
                        (err) => {
                          alert('No se pudo obtener la ubicación GPS: ' + err.message);
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    }}
                    style={{
                      padding: '4px 9px', fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1',
                      border: '1px solid #bae6fd', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600
                    }}
                  >
                    <Navigation size={12} /> Detectar mi GPS
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    Dirección Física Exacta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 100m Este de la Iglesia, Local Esquinero, San José"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-muted)' }}>
                      Latitud GPS
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 9.9333"
                      value={formData.latitude || ''}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-muted)' }}>
                      Longitud GPS
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: -84.0833"
                      value={formData.longitude || ''}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-muted)' }}>
                    Enlace Google Maps (o pegar link corto maps.app.goo.gl)
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=... o https://maps.app.goo.gl/..."
                    value={formData.googleMapsUrl || ''}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              {/* METADATOS DE INFRAESTRUCTURA (SOLO LECTURA - NO EDITABLE) */}
              {editingTenant && (
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={15} color="#3b82f6" /> Infraestructura Asignada (Solo Lectura)
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>🔒 Protegido</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.71rem', fontWeight: 600 }}>🐘 Base de Datos PostgreSQL</span>
                      <code style={{ fontSize: '0.74rem', color: '#0369a1' }}>whatsapp_saas (public)</code>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.71rem', fontWeight: 600 }}>UUID del Tenant en Postgres</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <code style={{ fontSize: '0.72rem', wordBreak: 'break-all', backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>
                          {editingTenant.postgresTenantId || editingTenant.id}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editingTenant.postgresTenantId || editingTenant.id);
                            alert('UUID de Postgres copiado');
                          }}
                          style={{ padding: '2px 5px', fontSize: '0.65rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.71rem', fontWeight: 600 }}>📱 Instancia Evolution API</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <code style={{ fontSize: '0.74rem', color: editingTenant.evolutionInstance ? '#15803d' : 'var(--text-muted)', backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>
                          {editingTenant.evolutionInstance || '⚪ Sin vincular'}
                        </code>
                        {editingTenant.evolutionInstance && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(editingTenant.evolutionInstance || '');
                              alert('Nombre de instancia Evolution copiado');
                            }}
                            title="Copiar nombre de instancia"
                            style={{ padding: '2px 5px', fontSize: '0.65rem', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.71rem', fontWeight: 600 }}>WhatsApp Vinculado</span>
                      <span style={{ fontWeight: 600, color: editingTenant.whatsappNumber ? '#15803d' : 'var(--text-muted)' }}>
                        {editingTenant.whatsappNumber ? `🟢 ${editingTenant.whatsappNumber}` : '⚪ No vinculado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '9px 18px', border: '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTenant}
                  style={{ padding: '9px 20px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {savingTenant ? 'Guardando...' : editingTenant ? 'Guardar Cambios' : 'Crear Inquilino'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EXPEDIENTE 360° */}
      {selectedDossierTenantId && (
        <TenantDossierModal
          tenantId={selectedDossierTenantId}
          onClose={() => setSelectedDossierTenantId(null)}
          onRefresh={loadTenants}
        />
      )}

      {/* MODAL: RESTABLECER CONTRASEÑA */}
      {/* ========================================================================= */}
      {resetModalTenant && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '420px', width: '100%', padding: '24px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 'bold' }}>Restablecer Contraseña</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Comercio: <strong>{resetModalTenant.name}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '6px' }}>Nueva Contraseña *</label>
              <input
                type="text"
                placeholder="Escribe la nueva contraseña temporal..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setResetModalTenant(null)}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={resettingPassword || !newPassword}
                onClick={async () => {
                  setResettingPassword(true);
                  try {
                    await api.post('/api/tenants/' + resetModalTenant.id + '/reset-password', { newPassword });
                    alert('¡Contraseña actualizada con éxito!');
                    setResetModalTenant(null);
                  } catch (e) {
                    alert('Error: ' + e.message);
                  } finally {
                    setResettingPassword(false);
                  }
                }}
                style={{ padding: '8px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {resettingPassword ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
