import React, { useState } from 'react';
import { Bot, X, ArrowRight, ShieldCheck, Check, Sparkles, Zap, Lock, Mail, Phone, Building2, User } from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: 'pro' | 'enterprise';
}

export default function RegisterModal({ isOpen, onClose, initialPlan = 'pro' }: RegisterModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<'pro' | 'enterprise'>(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName || !ownerName || !email || !password) {
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
          businessName,
          ownerName,
          email,
          password,
          phone,
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
        // Seamless redirect to App dashboard with tutorial
        window.location.href = '/app?tour=true';
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al registrar tu negocio.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(8, 13, 26, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        width: '100%',
        maxWidth: '520px',
        padding: '32px 28px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
        position: 'relative',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '50px', height: '50px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
          }}>
            <Bot size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Comienza tu Prueba Gratis de 15 Días
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
            Sin tarjeta de crédito. Acceso instantáneo a todas las funciones.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Plan Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
              Plan a Probar (15 días gratis)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div
                onClick={() => setPlan('pro')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: plan === 'pro' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: plan === 'pro' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: plan === 'pro' ? '#34d399' : 'white' }}>Betico Pro</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>₡55.000/mes</div>
              </div>

              <div
                onClick={() => setPlan('enterprise')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: plan === 'enterprise' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: plan === 'enterprise' ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '0.88rem', color: plan === 'enterprise' ? '#34d399' : 'white' }}>Betico Empresa</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multi-Sucursal (₡85k)</div>
              </div>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
              Nombre de tu Negocio o Comercio *
            </label>
            <div style={{ position: 'relative' }}>
              <Building2 size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                placeholder="Ej. Soda Doña Flor, Barbería Classic..."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Owner Name & WhatsApp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                Tu Nombre *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
                WhatsApp *
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="8888-8888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
              Correo Electrónico de Acceso *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#cbd5e1', marginBottom: '4px' }}>
              Contraseña de Acceso *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '0.88rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '0.98rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)'
            }}
          >
            {loading ? 'Creando tu cuenta y sitio web...' : (
              <>
                <Zap size={18} /> Activar 15 Días de Prueba Gratis
              </>
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            <ShieldCheck size={14} color="#10b981" /> 100% Seguro • Cancelas en cualquier momento
          </div>

        </form>

      </div>
    </div>
  );
}
