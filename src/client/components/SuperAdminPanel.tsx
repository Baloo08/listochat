import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Building2, Server, Cpu, Database, HardDrive, DollarSign, TrendingUp, 
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

  // Platform Settings State
  const [masterAiProvider, setMasterAiProvider] = useState('gemini');
  const [masterAiKey, setMasterAiKey] = useState('');
  const [masterAiModel, setMasterAiModel] = useState('gemini-2.5-flash');
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
        if (data.superadminNotifyPhone) setSuperadminNotifyPhone(data.superadminNotifyPhone);
      }
    } catch (e) {
      console.error(e);
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
    if (activeTab === 'platform') loadPlatformSettings();
  }, [activeTab]);

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      await api.post('/api/superadmin/platform/settings', {
        masterAiProvider,
        masterAiModel,
        masterAiKey,
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

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setSavingTenant(true);
    try {
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
      setShowModal(false);
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
      alert('Error creando inquilino: ' + (err.message || 'Verifique los datos'));
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

      {/* TAB 3: PLATFORM AJUSTES & NOTIFICACIONES */}
      {activeTab === 'platform' && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', maxWidth: '750px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Sliders size={24} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Ajustes Globales y Notificaciones de SuperAdmin</h3>
          </div>
          <p style={{ margin: '0 0 24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Configura la Llave Maestra de IA de Betico y el número telefónico para recibir alertas en tiempo real de registros, comprobantes y morosidad.
          </p>

          {platformSavedToast && (
            <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 'bold' }}>
              <CheckCircle size={18} /> ¡Ajustes guardados con éxito!
            </div>
          )}

          <form onSubmit={handleSavePlatformSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* SuperAdmin Notification Phone */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
                📱 Teléfono de WhatsApp para Notificaciones de SuperAdmin
              </label>
              <input
                type="text"
                placeholder="50688888888"
                value={superadminNotifyPhone}
                onChange={(e) => setSuperadminNotifyPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #93c5fd', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block', marginTop: '4px' }}>
                El sistema enviará a este WhatsApp las alertas automáticas de nuevos negocios inscritos, comprobantes recibidos y cuentas suspendidas.
              </span>
            </div>

            {/* Master AI Provider */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                Proveedor de IA Maestro de la Plataforma
              </label>
              <select
                value={masterAiProvider}
                onChange={(e) => {
                  setMasterAiProvider(e.target.value);
                  setMasterAiModel(e.target.value === 'gemini' ? 'gemini-2.5-flash' : e.target.value === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku-20241022');
                }}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              >
                <option value="gemini">Google Gemini (Recomendado - Multimodal Flash)</option>
                <option value="openai">OpenAI (GPT-4o Mini / GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.7 / 3.5)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                Modelo Neuronal Maestro
              </label>
              <input
                type="text"
                value={masterAiModel}
                onChange={(e) => setMasterAiModel(e.target.value)}
                placeholder="gemini-2.5-flash, gpt-4o-mini, etc."
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                Llave de API Maestra (Cifrado AES-256)
              </label>
              <input
                type="password"
                value={masterAiKey}
                onChange={(e) => setMasterAiKey(e.target.value)}
                placeholder="Pega aquí la API Key maestra de la plataforma"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={savingPlatform}
                style={{ padding: '10px 22px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {savingPlatform ? 'Guardando...' : 'Guardar Ajustes de Plataforma'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* CREATE TENANT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '14px', maxWidth: '580px', width: '100%', padding: '26px', border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Crear Inquilino con Onboarding</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
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
                  {savingTenant ? 'Creando...' : 'Crear y Enviar Credenciales'}
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
