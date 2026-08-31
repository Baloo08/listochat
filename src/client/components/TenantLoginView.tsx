import React, { useState, useEffect } from 'react';
import { Bot, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Store, AlertCircle, LogOut, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ForgotPasswordModal from './ForgotPasswordModal';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  whatsappNumber?: string;
  logoUrl?: string;
  bannerUrl?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    cardRadius?: string;
    fontFamily?: string;
  };
}

interface TenantLoginViewProps {
  slug: string;
}

export default function TenantLoginView({ slug }: TenantLoginViewProps) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoadingTenant(true);
        const res = await fetch(`/api/auth/tenant-info/${slug}`);
        if (!res.ok) {
          throw new Error('No se encontró el negocio solicitado');
        }
        const data = await res.json();
        setTenant(data);
      } catch (err: any) {
        setTenantError(err.message || 'Error al cargar información del negocio');
      } finally {
        setLoadingTenant(false);
      }
    };

    if (slug) {
      fetchTenant();
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      // Call login with tenantSlug constraint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          tenantSlug: slug
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        setSuccessMessage(true);
        // Refresh page to load tenant dashboard cleanly
        setTimeout(() => {
          window.location.href = '/app';
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = tenant?.theme?.primaryColor || '#16a34a';

  if (loadingTenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <div style={{ width: '48px', height: '48px', border: `3px solid ${primaryColor}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#64748b', fontWeight: '500' }}>Cargando portal de acceso seguro...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1e293b' }}>Negocio No Encontrado</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
            El enlace de acceso <strong>/acceso/{slug}</strong> no coincide con ninguna cuenta registrada en Betico.
          </p>
          <a
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}
          >
            Ir al Acceso Principal de Betico
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)',
      padding: '20px',
      fontFamily: tenant.theme?.fontFamily ? `${tenant.theme.fontFamily}, sans-serif` : 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>

        {/* Existing Session Detected Warning */}
        {isAuthenticated && user && (
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '16px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Sesión activa en este dispositivo:</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: user.role === 'superadmin' ? '#d97706' : '#2563eb', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>
                {user.role === 'superadmin' ? 'Super Admin' : user.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => { window.location.href = '/'; }}
                style={{ flex: 1, padding: '8px', backgroundColor: primaryColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                Ir a mi Dashboard
              </button>
              <button
                onClick={() => { logout(); window.location.reload(); }}
                style={{ padding: '8px 12px', backgroundColor: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                <LogOut size={14} /> Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '36px 30px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>

          {/* Logo & Business Branding */}
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                style={{ width: '72px', height: '72px', borderRadius: '14px', objectFit: 'cover', margin: '0 auto 12px auto', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}
              />
            ) : (
              <div style={{
                width: '64px', height: '64px', backgroundColor: `${primaryColor}15`,
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto', border: `1px solid ${primaryColor}30`
              }}>
                <Store size={32} color={primaryColor} />
              </div>
            )}

            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.45rem', fontWeight: 'bold', color: '#0f172a' }}>
              {tenant.name}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Portal de Administración & Control
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600'
            }}>
              <CheckCircle size={18} />
              <span>¡Acceso correcto! Ingresando a tu panel...</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Correo Electrónico de Administrador
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@tunegocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
                  Contraseña
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 38px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px' }}>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: primaryColor,
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                boxShadow: `0 4px 12px ${primaryColor}40`,
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Verificando credenciales...' : 'Iniciar Sesión'}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <span>Acceso Seguro Encriptado SSL & PBKDF2</span>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <a
              href={`/tienda/${tenant.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Ver Menú / Tienda Pública <ExternalLink size={12} />
            </a>
          </div>

          <ForgotPasswordModal
            isOpen={showForgotModal}
            onClose={() => setShowForgotModal(false)}
            initialIdentifier={email}
          />
        </div>

        {/* Betico Powered By */}
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Bot size={16} color="#38bdf8" />
          <span>Impulsado por <strong>Betico WhatsApp AI SaaS</strong></span>
        </div>

      </div>
    </div>
  );
}
