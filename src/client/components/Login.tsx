import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#0f172a',
      backgroundImage: 'radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '36px 30px', 
        borderRadius: '20px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '16px',
              padding: 0
            }}
          >
            ← Volver a Betico.tech
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px', height: '60px', backgroundColor: '#e0f2fe',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px auto', border: '1px solid #bae6fd'
          }}>
            <Bot size={32} color="#0284c7" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>Betico</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Plataforma Inteligente de WhatsApp AI SaaS</p>
        </div>
        
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            color: '#991b1b', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            fontSize: '0.85rem',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
              Correo Electrónico
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '11px 12px 11px 38px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '11px 38px 11px 38px', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
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

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              fontSize: '0.95rem',
              marginTop: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem' }}>
          <ShieldCheck size={16} color="#16a34a" />
          <span>Acceso Seguro Encriptado SSL & PBKDF2</span>
        </div>
      </div>
    </div>
  );
}
