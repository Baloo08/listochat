import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Loader2,
  Lock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function SubscriptionReturnView() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'cancelled' | 'declined' | 'error'>('loading' as any);
  const [description, setDescription] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(4);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    async function processReturn() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code') || params.get('result_code') || params.get('result');
        const desc = params.get('description') || params.get('message') || '';
        const sessionToken = params.get('session_token');
        const cardStatus = params.get('card_status');

        setDescription(desc);

        // 1. Attempt session resumption / handoff if session_token is present
        if (sessionToken) {
          try {
            const res = await fetch('/api/tenant/subscription/exchange-return-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_token: sessionToken })
            });

            if (res.ok) {
              const data = await res.json();
              if (data?.token) {
                localStorage.setItem('token', data.token);
                if (data.tenant?.slug) {
                  localStorage.setItem('last_tenant_slug', data.tenant.slug);
                }
                localStorage.setItem('betico_tour_active', 'true');
              }
            }
          } catch (e) {
            console.warn('[SubscriptionReturn] No fue posible canjear el session_token:', e);
          }
        }

        // 2. Classify status based on Tilopay response codes
        // Tilopay codes: '1' or '00' = Approved/Success, '0' = Cancelled/User Exit, '2' = Declined/Rejected
        if (code === '1' || code === '00' || cardStatus === 'success') {
          setStatus('success');
        } else if (code === '0' || desc.toLowerCase().includes('cancel') || desc.toLowerCase().includes('abort')) {
          setStatus('cancelled');
        } else if (code === '2' || desc.toLowerCase().includes('declin') || desc.toLowerCase().includes('rechaz')) {
          setStatus('declined');
        } else {
          // Default to friendly cancelled state if user exited without payment
          setStatus('cancelled');
        }
      } catch (err: any) {
        console.error('[SubscriptionReturn] Error procesando retorno:', err);
        setStatus('cancelled');
      } finally {
        setLoading(false);
      }
    }

    processReturn();
  }, []);

  // Auto-redirect to panel on success after countdown
  useEffect(() => {
    if (status !== 'success') return;

    if (countdown <= 0) {
      window.location.href = '/panel?tour=true&card_status=success';
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleRetryLink = async () => {
    try {
      setRetrying(true);
      setRetryError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const res = await fetch('/api/tenant/subscription/create-card-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data?.error || 'No fue posible abrir la pasarela de pagos.');
      }
    } catch (e: any) {
      setRetryError(e.message || 'Error al conectar con la pasarela bancaria.');
      setRetrying(false);
    }
  };

  const handleGoToPanel = () => {
    window.location.href = '/panel?tour=true';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0b3c3d',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Loader2 size={44} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#10b981' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 8px 0' }}>
            Verificando estado con la pasarela...
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Restaurando tu sesión de forma segura
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        padding: '36px 28px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        {/* LOGO */}
        <img
          src="/logo.png"
          alt="Betico"
          style={{
            height: '42px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto 20px auto'
          }}
        />

        {/* CASO 1: ÉXITO */}
        {status === 'success' && (
          <div>
            <div style={{
              width: '68px',
              height: '68px',
              backgroundColor: '#ecfdf5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '2px solid #a7f3d0'
            }}>
              <CheckCircle2 size={38} color="#059669" />
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              ¡Tarjeta Vinculada Exitosamente! 🎉
            </h1>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 22px 0' }}>
              Tu cuenta está activada con <strong>15 días de prueba gratis</strong> ($0 cobrado hoy). La renovación automática está configurada para que tu negocio nunca pierda servicio.
            </p>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#166534' }}>
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span><strong>$0 cobrado hoy:</strong> Tu primer cobro será al vencer tus 15 días de prueba.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#166534' }}>
                <Clock size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                <span><strong>Aviso previo 24h:</strong> Te recordaremos por WhatsApp antes de finalizar tu prueba.</span>
              </div>
            </div>

            <button
              onClick={handleGoToPanel}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0b3c3d',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '0.98rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(11, 60, 61, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <span>Ingresar a mi Panel de Control</span>
              <ArrowRight size={18} />
            </button>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '12px', margin: '12px 0 0 0' }}>
              Redirigiendo automáticamente en {countdown} segundos...
            </p>
          </div>
        )}

        {/* CASO 2: CANCELACIÓN / SALIDA VOLUNTARIA */}
        {status === 'cancelled' && (
          <div>
            <div style={{
              width: '68px',
              height: '68px',
              backgroundColor: '#f0fdfa',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '2px solid #99f6e4'
            }}>
              <ShieldCheck size={38} color="#0d9488" />
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Proceso de Tarjeta Cancelado
            </h1>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              No te preocupes, <strong>no se realizó ningún cobro a tu tarjeta</strong>. Tienes activos tus <strong>15 días de prueba gratis</strong> para explorar y usar toda la plataforma.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                <Sparkles size={18} color="#0d9488" style={{ flexShrink: 0 }} />
                <span><strong>Acceso completo:</strong> Puedes usar tu asistente de WhatsApp, tienda y reservas hoy mismo.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                <Lock size={18} color="#64748b" style={{ flexShrink: 0 }} />
                <span>Podrás vincular tu tarjeta más adelante en cualquier momento desde tu panel.</span>
              </div>
            </div>

            {retryError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                {retryError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleGoToPanel}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(11, 60, 61, 0.25)'
                }}
              >
                <span>Entrar a mi Panel de Control</span>
                <ChevronRight size={18} />
              </button>

              <button
                onClick={handleRetryLink}
                disabled={retrying}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={16} />
                <span>{retrying ? 'Abriendo pasarela Tilopay...' : 'Reintentar vinculación de tarjeta'}</span>
              </button>
            </div>
          </div>
        )}

        {/* CASO 3: RECHAZO BANCARIO */}
        {status === 'declined' && (
          <div>
            <div style={{
              width: '68px',
              height: '68px',
              backgroundColor: '#fffbeb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '2px solid #fde68a'
            }}>
              <AlertCircle size={38} color="#d97706" />
            </div>

            <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              La Tarjeta no pudo ser procesada
            </h1>
            <p style={{ color: '#475569', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {description || 'El banco emisor no autorizó la operación. Puede deberse a bloqueos de compras por internet o datos incorrectos.'}
            </p>

            <div style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'left',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#92400e'
            }}>
              <strong>Tu prueba gratis no se ha perdido:</strong> Tienes acceso a tu panel y puedes probar con otra tarjeta bancaria cuando gustes.
            </div>

            {retryError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                textAlign: 'left'
              }}>
                {retryError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleRetryLink}
                disabled={retrying}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0b3c3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '700',
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RotateCcw size={17} />
                <span>{retrying ? 'Conectando con Tilopay...' : 'Intentar con otra tarjeta'}</span>
              </button>

              <button
                onClick={handleGoToPanel}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Continuar al panel de prueba gratis →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
