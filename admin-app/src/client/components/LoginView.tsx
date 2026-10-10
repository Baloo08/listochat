import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, pass: string) => Promise<any>;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#071213',
      backgroundImage: 'radial-gradient(circle at 50% 20%, #0d282a 0%, #071213 80%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#0f2223',
        border: '1px solid #1a383a',
        borderRadius: '16px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            color: '#34D399',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{
            margin: '0 0 6px 0',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#FAF8F5',
            letterSpacing: '-0.02em'
          }}>
            Betico Ops • Control Central
          </h1>
          <p style={{
            margin: 0,
            fontSize: '0.85rem',
            color: '#94a3b8'
          }}>
            Acceso exclusivo y restringido para SuperAdministradores
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(181, 28, 18, 0.15)',
            border: '1px solid rgba(181, 28, 18, 0.4)',
            color: '#fca5a5',
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Correo de SuperAdmin
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@betico.cr"
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  backgroundColor: '#091617',
                  border: '1px solid #1a383a',
                  borderRadius: '10px',
                  color: '#FAF8F5',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Contraseña Maestra
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  backgroundColor: '#091617',
                  border: '1px solid #1a383a',
                  borderRadius: '10px',
                  color: '#FAF8F5',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px 16px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              borderRadius: '10px',
              color: '#FAF8F5',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px 0 rgba(52, 211, 153, 0.2)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <Lock size={18} />
                <span>Ingresar al Centro de Control</span>
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #162f31',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <span>Cifrado PBKDF2 SHA-512 • Sesión Protegida con JWT</span>
        </div>
      </div>
    </div>
  );
}
