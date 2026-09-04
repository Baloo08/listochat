import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, Check, Sparkles, Zap, Lock, Mail, Phone, Building2, User, CreditCard, CheckCircle, Bell } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'pro' | 'enterprise';
}

export default function RegisterModal({ isOpen, onClose, initialPlan = 'pro' }: RegisterModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'pro' | 'enterprise'>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [linkingCard, setLinkingCard] = useState(false);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName.trim() || !ownerName.trim() || !email.trim() || !password) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          plan
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el registro.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.tenant?.slug) {
          localStorage.setItem('last_tenant_slug', data.tenant.slug);
        }
        localStorage.setItem('betico_tour_active', 'true');
        setRegisteredToken(data.token);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar tu negocio.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCardOnboarding = async () => {
    try {
      setLinkingCard(true);
      const token = registeredToken || localStorage.getItem('token');
      const res = await fetch('/api/tenant/subscription/create-card-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (resData?.paymentUrl) {
        window.location.href = resData.paymentUrl;
      } else {
        window.location.href = '/panel?tour=true';
      }
    } catch (e) {
      window.location.href = '/panel?tour=true';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 60, 61, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '32px 16px 32px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '520px',
          padding: '32px 28px',
          boxShadow: '0 25px 60px rgba(11, 60, 61, 0.18)',
          position: 'relative',
          color: '#0f172a',
          fontFamily: "'Poppins', sans-serif",
          margin: 'auto 0',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            color: '#64748b',
            cursor: 'pointer',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {step === 2 ? (
          <div style={{ textAlign: 'center', padding: '6px 4px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#eff6ff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <CreditCard size={30} color="#2563eb" />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', margin: '0 0 6px 0', color: '#0f172a' }}>
              ¡Tu cuenta ha sido creada! 🎉
            </h2>
            <p style={{ color: '#475569', fontSize: '0.86rem', margin: '0 0 18px 0', lineHeight: '1.45' }}>
              Tienes <strong>15 días de prueba gratis</strong> ($0 cobrado hoy). Para activar tu cuenta y asegurar la continuidad de tu servicio, vincula tu tarjeta bancaria con Tilopay.
            </p>

            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', textAlign: 'left', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircle size={17} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                  <strong>$0 cobrado hoy:</strong> No se realizará ningún cobro a tu tarjeta durante los 15 días de prueba.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Bell size={17} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                  <strong>Aviso preventivo 24h antes:</strong> Te enviaremos un WhatsApp antes de finalizar la prueba para que puedas cancelar en 1 clic sin costo si no deseas continuar.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldCheck size={17} color="#0b3c3d" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                  <strong>Banca Segura PCI-DSS:</strong> Tus datos se tokenizan de forma cifrada directamente en Tilopay.
                </div>
              </div>
            </div>

            <button
              onClick={handleLinkCardOnboarding}
              disabled={linkingCard}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0b3c3d',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '800',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(11, 60, 61, 0.25)',
                marginBottom: '10px'
              }}
            >
              <Lock size={16} />
              {linkingCard ? 'Abriendo pasarela Tilopay...' : 'Vincular Tarjeta con Tilopay ($0 hoy)'}
            </button>

            <button
              onClick={() => { window.location.href = '/panel?tour=true'; }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#64748b',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Continuar al panel y vincular tarjeta después →
            </button>
          </div>
        ) : (
          <>
            {/* Header with Prominent BE TICO Logo */}
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <img
                src="/logo.png"
                alt="Betico"
                style={{
                  height: '46px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto 10px auto'
                }}
              />
              <h2 style={{ fontSize: '1.45rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px', color: '#0f172a' }}>
                Comienza tu Prueba Gratis de 15 Días
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.86rem', margin: 0 }}>
                Sin tarjeta de crédito. Acceso instantáneo a todas las funciones.
              </p>
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fff1f0',
                border: '1px solid #ffc7c4',
                color: '#b51c12',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.84rem',
                marginBottom: '16px',
                fontWeight: '600'
              }}>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {/* Plan Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Plan a Probar (15 días gratis)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setPlan('pro')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: plan === 'pro' ? '2px solid #0b3c3d' : '1px solid #e2e8f0',
                      backgroundColor: plan === 'pro' ? '#eff7f7' : '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: plan === 'pro' ? '0 2px 8px rgba(11,60,61,0.08)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: plan === 'pro' ? '#0b3c3d' : '#0f172a' }}>
                      Betico Pro
                    </div>
                    <div style={{ fontSize: '0.76rem', color: plan === 'pro' ? '#134b4c' : '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      ₡55.000/mes
                    </div>
                  </div>

                  <div
                    onClick={() => setPlan('enterprise')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: plan === 'enterprise' ? '2px solid #0b3c3d' : '1px solid #e2e8f0',
                      backgroundColor: plan === 'enterprise' ? '#eff7f7' : '#f8fafc',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                      boxShadow: plan === 'enterprise' ? '0 2px 8px rgba(11,60,61,0.08)' : 'none'
                    }}
                  >
                    <div style={{ fontWeight: '800', fontSize: '0.9rem', color: plan === 'enterprise' ? '#0b3c3d' : '#0f172a' }}>
                      Betico Empresa
                    </div>
                    <div style={{ fontSize: '0.76rem', color: plan === 'enterprise' ? '#134b4c' : '#64748b', fontWeight: '600', marginTop: '2px' }}>
                      Multi-Sucursal (₡85k)
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Nombre de tu Negocio o Comercio *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="#0b3c3d" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    name="betico_reg_biz"
                    required
                    placeholder="Ej. Soda Doña Flor, Barbería Classic..."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Owner Name & WhatsApp */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Tu Nombre *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#0b3c3d" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      name="betico_reg_owner"
                      required
                      placeholder="Tu nombre"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    WhatsApp *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="#0b3c3d" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      name="betico_reg_phone"
                      placeholder="8888-8888"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 38px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Email - Isolated to prevent autofill */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Correo Electrónico de Acceso *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#0b3c3d" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    name="betico_reg_email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password - With autoComplete="new-password" to stop autofill */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Contraseña de Acceso *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#0b3c3d" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    name="betico_reg_password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '8px',
                  padding: '14px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(11, 60, 61, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Creando tu cuenta y sitio web...' : (
                  <>
                    <Zap size={18} /> Activar 15 Días de Prueba Gratis
                  </>
                )}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                <ShieldCheck size={15} color="#0b3c3d" />
                <span>100% Seguro • Cancelas en cualquier momento</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
