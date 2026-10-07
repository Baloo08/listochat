import React, { useState, useEffect } from 'react';
import { 
  Gift, Award, QrCode, LogOut, Check, Copy, ExternalLink, 
  RefreshCw, AlertCircle, Sparkles, User, Lock, Phone, 
  CreditCard, ChevronRight, ShieldCheck, CheckCircle2, Store
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LoyaltyCard, LoyaltyRewardVoucher } from '../../shared/types';

interface LoyaltyWalletCustomerAppProps {
  tenantSlug?: string;
}

export default function LoyaltyWalletCustomerApp({ tenantSlug }: LoyaltyWalletCustomerAppProps) {
  // Auth State
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('betico_loyalty_customer_token') : null;
  });
  const [customer, setCustomer] = useState<{ id: string; identification: string; fullName: string; phone?: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login Form
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form
  const [regName, setRegName] = useState('');
  const [regId, setRegId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Wallet Data State
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [vouchers, setVouchers] = useState<LoyaltyRewardVoucher[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'cards' | 'vouchers'>('cards');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Merchant Branding (if visiting /fidelidad/:slug)
  const [merchantProgram, setMerchantProgram] = useState<any | null>(null);

  // Check login on load
  useEffect(() => {
    if (token) {
      loadProfileAndData(token);
    }
  }, [token]);

  // Load merchant program if slug provided
  useEffect(() => {
    if (tenantSlug) {
      fetch(`/api/loyalty-customer/public/${encodeURIComponent(tenantSlug)}/program`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setMerchantProgram(data);
        })
        .catch(() => {});
    }
  }, [tenantSlug]);

  const loadProfileAndData = async (authToken: string) => {
    setLoadingData(true);
    try {
      // 1. Profile
      const meRes = await fetch('/api/loyalty-customer/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!meRes.ok) {
        // Token expired
        handleLogout();
        return;
      }
      const custData = await meRes.json();
      setCustomer(custData);

      // 2. Wallet Cards
      const [cardsRes, vouchersRes] = await Promise.all([
        fetch('/api/loyalty-customer/me/wallet', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch('/api/loyalty-customer/me/vouchers', { headers: { Authorization: `Bearer ${authToken}` } })
      ]);

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData || []);
      }
      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json();
        setVouchers(vouchersData || []);
      }
    } catch (err) {
      console.error('Error cargando monedero:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/loyalty-customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identification: loginId,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      localStorage.setItem('betico_loyalty_customer_token', data.token);
      setToken(data.token);
      setCustomer(data.customer);
      setLoginPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/loyalty-customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName,
          identification: regId,
          phone: regPhone,
          password: regPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear cuenta');
      }

      localStorage.setItem('betico_loyalty_customer_token', data.token);
      setToken(data.token);
      setCustomer(data.customer);
      setRegPassword('');
    } catch (err: any) {
      setAuthError(err.message || 'Error al registrar cuenta');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('betico_loyalty_customer_token');
    setToken(null);
    setCustomer(null);
    setCards([]);
    setVouchers([]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Poppins', 'Plus Jakarta Sans', system-ui, sans-serif",
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Top Navbar */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            backgroundColor: '#2563eb', color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Gift size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', lineHeight: 1.1, color: '#1e293b' }}>
              Betico <span style={{ color: '#2563eb' }}>Club</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>
              Monedero Universal de Fidelidad
            </div>
          </div>
        </div>

        {customer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b' }}>
                {customer.fullName.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                ID: {customer.identification}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                border: 'none',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : null}
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Optional Merchant Banner if visited via /fidelidad/:slug */}
        {merchantProgram && merchantProgram.tenant && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '12px',
              backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden'
            }}>
              {merchantProgram.tenant.logoUrl ? (
                <img src={merchantProgram.tenant.logoUrl} alt={merchantProgram.tenant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={28} color="#2563eb" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Comercio Afiliado
              </span>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                {merchantProgram.tenant.name}
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                {merchantProgram.program?.programType === 'points' ? 'Acumula puntos con cada compra' : merchantProgram.program?.programType === 'stamps' ? `Completa ${merchantProgram.program?.stampsTarget} sellos y gana premios` : 'Acumula puntos y sellos de regalo'}
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* NON-AUTHENTICATED: LOGIN / REGISTER FORMS */}
        {/* ------------------------------------------------------------- */}
        {!customer ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            
            {/* Tab switch: Iniciar sesión vs Crear cuenta */}
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: '700',
                  backgroundColor: authMode === 'login' ? '#ffffff' : 'transparent',
                  color: authMode === 'login' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: '700',
                  backgroundColor: authMode === 'register' ? '#ffffff' : 'transparent',
                  color: authMode === 'register' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Explanatory badge */}
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
              color: '#1e40af', fontSize: '0.8rem', lineHeight: 1.4,
              display: 'flex', alignItems: 'flex-start', gap: '8px'
            }}>
              <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Tu Cédula es tu identificador único universal:</strong> Conecta automáticamente todas tus tarjetas de puntos y sellos de cualquier comercio Betico en un solo lugar.
              </span>
            </div>

            {/* Error Message */}
            {authError && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                backgroundColor: '#fee2e2', border: '1px solid #fca5a5',
                color: '#991b1b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Número de Cédula
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1-1234-5678 o 112345678"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 12px 12px 38px',
                        borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem'
                      }}
                    />
                    <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Contraseña
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 12px 12px 38px',
                        borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem'
                      }}
                    />
                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    padding: '12px', borderRadius: '10px', border: 'none',
                    backgroundColor: '#2563eb', color: '#ffffff',
                    fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginTop: '4px'
                  }}
                >
                  {authLoading ? <RefreshCw className="animate-spin" size={18} /> : null}
                  <span>{authLoading ? 'Verificando...' : 'Entrar a mi Monedero'}</span>
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Cristopher Jiménez"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Número de Cédula * (Máster ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1-1234-5678"
                    value={regId}
                    onChange={(e) => setRegId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 8888-8888"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', marginBottom: '6px' }}>
                    Crear Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    padding: '12px', borderRadius: '10px', border: 'none',
                    backgroundColor: '#16a34a', color: '#ffffff',
                    fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    marginTop: '4px'
                  }}
                >
                  {authLoading ? <RefreshCw className="animate-spin" size={18} /> : null}
                  <span>{authLoading ? 'Creando cuenta...' : 'Crear mi Cuenta de Fidelidad'}</span>
                </button>
              </form>
            )}

          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* AUTHENTICATED: CUSTOMER DIGITAL WALLET */
          /* ------------------------------------------------------------- */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* User Greeting & Stats Bar */}
            <div style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)'
            }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: '600' }}>MONEDERO DIGITAL</span>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>
                  {customer.fullName}
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                  Cédula: <strong>{customer.identification}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '8px 14px', borderRadius: '10px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#60a5fa' }}>{cards.length}</div>
                  <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Tarjetas</div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '8px 14px', borderRadius: '10px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#34d399' }}>{vouchers.length}</div>
                  <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Premios</div>
                </div>
              </div>
            </div>

            {/* Wallet Section Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '700',
                  backgroundColor: activeTab === 'cards' ? '#2563eb' : 'transparent',
                  color: activeTab === 'cards' ? '#ffffff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <CreditCard size={18} />
                <span>Mis Tarjetas ({cards.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('vouchers')}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '0.9rem', fontWeight: '700',
                  backgroundColor: activeTab === 'vouchers' ? '#2563eb' : 'transparent',
                  color: activeTab === 'vouchers' ? '#ffffff' : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Award size={18} />
                <span>Mis Premios & QR ({vouchers.length})</span>
              </button>
            </div>

            {/* Loading Indicator */}
            {loadingData && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                <RefreshCw className="animate-spin" size={28} color="#2563eb" />
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: MIS TARJETAS */}
            {/* ------------------------------------------------------------- */}
            {!loadingData && activeTab === 'cards' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cards.length === 0 ? (
                  <div style={{
                    backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 20px',
                    textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b'
                  }}>
                    <Gift size={42} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#1e293b' }}>
                      Aún no tienes tarjetas de fidelidad
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem' }}>
                      Cada vez que realices una compra en cualquier comercio afiliado a Betico e indiques tu cédula (<strong>{customer.identification}</strong>), tu tarjeta aparecerá automáticamente aquí.
                    </p>
                  </div>
                ) : (
                  cards.map((card: any) => {
                    const curr = card.currency === 'USD' ? '$' : '₡';
                    const targetStamps = card.stampsTarget || 10;
                    const curStamps = Number(card.currentStamps || 0);
                    const remainingStamps = Math.max(0, targetStamps - curStamps);

                    return (
                      <div
                        key={card.id}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '18px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* Merchant Top Header */}
                        <div style={{
                          padding: '16px 20px',
                          backgroundColor: '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '8px',
                              backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', overflow: 'hidden'
                            }}>
                              {card.tenantLogoUrl ? (
                                <img src={card.tenantLogoUrl} alt={card.tenantName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <Store size={20} color="#64748b" />
                              )}
                            </div>
                            <div>
                              <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>{card.tenantName || 'Comercio Betico'}</strong>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Club de Clientes</div>
                            </div>
                          </div>

                          {card.tenantSlug && (
                            <a
                              href={`/tienda/${card.tenantSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.78rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>Ver Tienda</span>
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          
                          {/* 1. Points Counter (if applicable) */}
                          {(card.programType === 'points' || card.programType === 'both') && (
                            <div style={{
                              backgroundColor: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                              padding: '14px 18px',
                              borderRadius: '12px',
                              border: '1px solid #dbeafe',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>
                                  PUNTOS ACUMULADOS
                                </span>
                                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1d4ed8', lineHeight: 1.1 }}>
                                  {Number(card.pointsBalance).toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>pts</span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Saldo disponible</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a' }}>
                                  {curr}{Math.round(Number(card.pointsBalance) * 10).toLocaleString('es-CR')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. Visual Stamp Punch Board (if applicable) */}
                          {(card.programType === 'stamps' || card.programType === 'both') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Award size={18} color="#f59e0b" />
                                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1e293b' }}>
                                    Tarjeta de Sellos
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#d97706' }}>
                                  {curStamps} de {targetStamps} sellos
                                </span>
                              </div>

                              {/* Stamp Punch Grid */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(targetStamps, 5)}, 1fr)`,
                                gap: '8px',
                                padding: '14px',
                                backgroundColor: '#fffbeb',
                                borderRadius: '12px',
                                border: '1px solid #fef3c7'
                              }}>
                                {Array.from({ length: targetStamps }).map((_, idx) => {
                                  const isStamped = idx < curStamps;
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isStamped ? '#f59e0b' : '#ffffff',
                                        border: isStamped ? '2px solid #d97706' : '2px dashed #cbd5e1',
                                        color: isStamped ? '#ffffff' : '#cbd5e1',
                                        fontSize: '0.8rem',
                                        fontWeight: '800',
                                        boxShadow: isStamped ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {isStamped ? <Check size={18} strokeWidth={3} /> : idx + 1}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Stamp Prize Callout */}
                              <div style={{
                                fontSize: '0.78rem',
                                color: '#78350f',
                                backgroundColor: '#fef3c7',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <Sparkles size={14} color="#d97706" />
                                <span>
                                  {remainingStamps === 0 ? (
                                    <strong>¡Tarjeta completa! Ya puedes canjear tu premio en la pestaña de Premios.</strong>
                                  ) : (
                                    <span>Premio: <strong>{card.stampsPrize || 'Premio de lealtad'}</strong> (Faltan {remainingStamps} sellos)</span>
                                  )}
                                </span>
                              </div>

                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: MIS PREMIOS & CODIGOS QR */}
            {/* ------------------------------------------------------------- */}
            {!loadingData && activeTab === 'vouchers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {vouchers.length === 0 ? (
                  <div style={{
                    backgroundColor: '#ffffff', borderRadius: '16px', padding: '36px 20px',
                    textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b'
                  }}>
                    <Award size={42} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#1e293b' }}>
                      Aún no tienes premios para canjear
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem' }}>
                      Completa los sellos de tus comercios favoritos para desbloquear códigos QR y premios exclusivos en caja.
                    </p>
                  </div>
                ) : (
                  vouchers.map((v: any) => {
                    const isRedeemed = v.status === 'redeemed';
                    return (
                      <div
                        key={v.id}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '18px',
                          border: isRedeemed ? '1px solid #e2e8f0' : '2px solid #10b981',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: isRedeemed ? 0.75 : 1
                        }}
                      >
                        {/* Header */}
                        <div style={{
                          padding: '14px 20px',
                          backgroundColor: isRedeemed ? '#f8fafc' : '#ecfdf5',
                          borderBottom: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <strong style={{ fontSize: '1.02rem', color: isRedeemed ? '#64748b' : '#065f46' }}>
                            {v.tenantName || 'Premio de Lealtad'}
                          </strong>

                          <span style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: '800',
                            backgroundColor: isRedeemed ? '#e2e8f0' : '#10b981',
                            color: isRedeemed ? '#64748b' : '#ffffff'
                          }}>
                            {isRedeemed ? 'CANJEADO' : '¡LISTO PARA CANJE!'}
                          </span>
                        </div>

                        {/* QR Code and Info */}
                        <div style={{
                          padding: '24px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px',
                          textAlign: 'center'
                        }}>
                          {/* QR Code Container */}
                          <div style={{
                            padding: '12px',
                            backgroundColor: '#ffffff',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                          }}>
                            <QRCodeSVG
                              value={v.qrData || v.voucherCode}
                              size={170}
                              level="M"
                            />
                          </div>

                          <div>
                            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                              {v.rewardDescription}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                              Presenta este código en caja al momento de tu compra
                            </div>
                          </div>

                          {/* Code Display with Copy Button */}
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#f1f5f9',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1'
                          }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.05rem', letterSpacing: '1px' }}>
                              {v.voucherCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(v.voucherCode)}
                              title="Copiar código"
                              style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                color: copiedCode === v.voucherCode ? '#16a34a' : '#64748b',
                                display: 'flex', alignItems: 'center'
                              }}
                            >
                              {copiedCode === v.voucherCode ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                          </div>

                          {/* Expiration Note */}
                          {v.expiresAt && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              Válido hasta: {new Date(v.expiresAt).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '16px 20px',
        textAlign: 'center',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        fontSize: '0.75rem',
        color: '#94a3b8'
      }}>
        <div>Betico Tech • Club Universal de Fidelización Costa Rica</div>
      </footer>

    </div>
  );
}
