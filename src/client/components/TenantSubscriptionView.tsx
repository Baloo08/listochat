import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Receipt,
  Sparkles,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface SubscriptionData {
  tenantId: string;
  tenantName: string;
  plan: string;
  isAliado: boolean;
  subscriptionStatus: string;
  active: boolean;
  daysRemaining: number;
  targetDate: string | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  gracePeriodEndsAt: string | null;
  monthlyPrice: number;
  currency: string;
  autoBillingEnabled: boolean;
  card: {
    id: string;
    cardLast4: string;
    cardBrand: string;
    cardHolder: string;
    createdAt: string;
  } | null;
  paymentHistory: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    reference: string;
    notes: string;
    status: string;
    createdAt: string;
  }>;
}

export default function TenantSubscriptionView() {
  const api = useApi();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkingCard, setLinkingCard] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tenant/subscription');
      if (res) {
        setData(res);
      }
    } catch (err: any) {
      console.error('Error cargando suscripción:', err);
      setErrorMsg(err.message || 'No fue posible cargar el estado de tu suscripción.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Check if user just returned from card setup
    const params = new URLSearchParams(window.location.search);
    if (params.get('card_status') === 'success') {
      setActionSuccess('¡Tarjeta vinculada exitosamente! Tu cuenta está configurada para renovación automática.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLinkCard = async () => {
    try {
      setLinkingCard(true);
      setErrorMsg(null);
      const res = await api.post('/api/tenant/subscription/create-card-session', {});
      if (res?.paymentUrl) {
        // Redirect to Tilopay's secure hosted payment form
        window.location.href = res.paymentUrl;
      } else {
        throw new Error(res?.error || 'No se pudo generar la sesión segura con Tilopay.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con la pasarela bancaria.');
      setLinkingCard(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      setErrorMsg(null);
      const res = await api.post('/api/tenant/subscription/cancel', { reason: cancelReason });
      if (res?.success) {
        setShowCancelModal(false);
        setActionSuccess(res.message || 'Suscripción cancelada correctamente.');
        await fetchSubscription();
      } else {
        throw new Error(res?.error || 'No se pudo cancelar la suscripción.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la cancelación.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.post('/api/tenant/subscription/reactivate', {});
      if (res?.success) {
        setActionSuccess('¡Cuenta reactivada exitosamente!');
        await fetchSubscription();
      } else {
        throw new Error(res?.error || 'Error al reactivar cuenta.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al reactivar suscripción.');
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <p>Cargando información de tu suscripción...</p>
      </div>
    );
  }

  const isAliado = data?.isAliado || data?.plan?.toLowerCase() === 'aliado';
  const status = data?.subscriptionStatus || 'trial';
  const priceFormatted = data?.currency === 'USD'
    ? `$${data.monthlyPrice}`
    : `₡${Number(data?.monthlyPrice || 55000).toLocaleString('es-CR')}`;

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
          Mi Suscripción & Pagos
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Gestiona tu plan recurrente de Betico, método de cobro bancario e historial de facturación.
        </p>
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 16px', borderRadius: '12px', color: '#15803d', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontWeight: '500' }}>
          <CheckCircle size={20} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '14px 16px', borderRadius: '12px', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '20px', fontWeight: '500', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
          {errorMsg.toLowerCase().includes('pasarela') && (
            <a
              href="https://wa.me/50688888888?text=Hola%20Betico,%20necesito%20asistencia%20con%20la%20vinculaci%C3%B3n%20de%20mi%20tarjeta%20de%20suscripci%C3%B3n."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              Contactar Soporte
            </a>
          )}
        </div>
      )}

      {/* Main Status Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Plan & Cost */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Plan Actual</span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              backgroundColor: isAliado ? '#fef3c7' : '#dbeafe',
              color: isAliado ? '#b45309' : '#1e40af'
            }}>
              {isAliado ? 'PLAN ALIADO 🌟' : `BETICO ${data?.plan?.toUpperCase() || 'PRO'}`}
            </span>
          </div>

          <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
            {isAliado ? '₡0' : priceFormatted}
            <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#64748b' }}> / mes</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            {isAliado
              ? 'Plan de cortesía para comercios aliados. Sin costos recurrentes.'
              : 'Incluye catálogo web, asistente WhatsApp con IA y reservas.'}
          </p>
        </div>

        {/* Card 2: Semáforo / Days Remaining */}
        <div style={{
          backgroundColor: isAliado ? '#f8fafc' : (status === 'grace_period' ? '#fffbeb' : (status === 'suspended' || status === 'cancelled' ? '#fef2f2' : '#f0fdf4')),
          border: '1px solid',
          borderColor: isAliado ? '#e2e8f0' : (status === 'grace_period' ? '#fde68a' : (status === 'suspended' || status === 'cancelled' ? '#fecaca' : '#bbf7d0')),
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Estado de Cuenta</span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '700',
              backgroundColor: status === 'active' ? '#16a34a' : (status === 'trial' ? '#0284c7' : (status === 'grace_period' ? '#d97706' : '#dc2626')),
              color: 'white'
            }}>
              {isAliado ? 'Activo Permanente' : (
                status === 'trial' ? 'Prueba Gratuita (15d)' :
                status === 'active' ? 'Al Día' :
                status === 'grace_period' ? 'En Gracia (15d)' :
                status === 'cancelled' ? 'Cancelado' : 'Suspendido'
              )}
            </span>
          </div>

          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>
            {isAliado ? (
              'Sin Vencimiento'
            ) : (
              status === 'trial'
                ? `${data?.daysRemaining} días restantes`
                : status === 'active'
                ? `Próximo cobro en ${data?.daysRemaining} días`
                : status === 'grace_period'
                ? `${data?.daysRemaining} días de gracia`
                : 'Servicio en Pausa'
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: '#475569', margin: 0 }}>
            {data?.targetDate ? `Fecha objetivo: ${new Date(data.targetDate).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'Suscripción activa'}
          </p>
        </div>

        {/* Card 3: Tokenized Payment Card */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tarjeta Vinculada</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#16a34a', fontWeight: 'bold' }}>
              <ShieldCheck size={14} /> PCI-DSS SAQ A
            </span>
          </div>

          {data?.card ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CreditCard size={24} color="#2563eb" />
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
                    {data.card.cardBrand} •••• {data.card.cardLast4}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Titular: {data.card.cardHolder}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLinkCard}
                disabled={linkingCard}
                style={{
                  marginTop: '8px',
                  padding: '8px 14px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  color: '#334155',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {linkingCard ? 'Cargando...' : 'Actualizar Tarjeta con Tilopay'}
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 10px 0' }}>
                {isAliado ? 'No requieres vincular tarjeta para el plan aliado.' : 'Vincula tu tarjeta ahora ($0 cobrado hoy) para asegurar tu servicio tras los 15 días gratis.'}
              </p>
              {!isAliado && (
                <button
                  onClick={handleLinkCard}
                  disabled={linkingCard}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#0b3c3d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Lock size={15} />
                  {linkingCard ? 'Iniciando pasarela...' : 'Vincular Tarjeta (Tilopay $0)'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informative Notice on 24-hour Advance WhatsApp Alerts */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#dbeafe', padding: '10px', borderRadius: '12px' }}>
          <Calendar size={22} color="#1d4ed8" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 3px 0', fontSize: '0.92rem', fontWeight: 'bold', color: '#1e3a8a' }}>
            Notificación Preventiva por WhatsApp
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#2563eb' }}>
            Recibirás un mensaje automático a tu WhatsApp <strong>24 horas antes</strong> de cada vencimiento o cobro recurrente. Tienes control total para cancelar o cambiar tu tarjeta en cualquier momento sin penalizaciones.
          </p>
        </div>
      </div>

      {/* Payment History / Receipts Section */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} color="#0f172a" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
              Historial de Facturación y Recibos
            </h3>
          </div>
          <button
            onClick={fetchSubscription}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {data?.paymentHistory && data.paymentHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Fecha</th>
                  <th style={{ padding: '10px 12px' }}>Detalle</th>
                  <th style={{ padding: '10px 12px' }}>Método</th>
                  <th style={{ padding: '10px 12px' }}>Referencia</th>
                  <th style={{ padding: '10px 12px' }}>Monto</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentHistory.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{new Date(p.createdAt).toLocaleDateString('es-CR')}</td>
                    <td style={{ padding: '12px' }}>{p.notes || 'Mensualidad Betico'}</td>
                    <td style={{ padding: '12px', textTransform: 'uppercase' }}>{p.paymentMethod}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>#{p.reference?.slice(-8) || p.id.slice(0, 8)}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {p.currency === 'USD' ? '$' : '₡'}{Number(p.amount).toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        backgroundColor: p.status === 'approved' ? '#dcfce7' : '#fef3c7',
                        color: p.status === 'approved' ? '#166534' : '#b45309'
                      }}>
                        {p.status === 'approved' ? 'Aprobado' : p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
            No hay pagos registrados aún en esta cuenta.
          </div>
        )}
      </div>

      {/* Danger Zone / Cancel Subscription */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #fecaca', borderRadius: '16px', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 'bold', color: '#991b1b' }}>
            {status === 'cancelled' ? 'Reactivar Suscripción' : 'Cancelar Suscripción'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', maxWidth: '550px' }}>
            {isAliado
              ? 'Tu cuenta cuenta con el Plan Aliado Estratégico (₡0/mes). Este plan es gratuito de por vida y no requiere cancelación de cobros.'
              : (status === 'cancelled'
                ? 'Tu cuenta se encuentra cancelada. Puedes reactivarla en cualquier momento para restaurar el acceso a tus tiendas y bots.'
                : 'Si cancelas tu suscripción, se detendrán los cobros automáticos y tus servicios de tienda y WhatsApp IA se pausarán.')}
          </p>
        </div>

        <div>
          {isAliado ? (
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#15803d', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              Plan Aliado Exento de Cancelación
            </span>
          ) : status === 'cancelled' ? (
            <button
              onClick={handleReactivate}
              style={{
                padding: '10px 18px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Reactivar Suscripción
            </button>
          ) : (
            <button
              onClick={() => setShowCancelModal(true)}
              style={{
                padding: '10px 18px',
                backgroundColor: '#fef2f2',
                border: '1px solid #f87171',
                borderRadius: '10px',
                color: '#dc2626',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancelar Suscripción
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(3px)',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#fee2e2', padding: '10px', borderRadius: '12px' }}>
                <AlertTriangle size={24} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                  ¿Confirmar Cancelación?
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Comercio: <strong>{data?.tenantName}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Al confirmar, tu suscripción quedará en estado <strong>Cancelada</strong> y no se debitará ninguna mensualidad a tu tarjeta registrada. Tu tienda pública, asistentes de WhatsApp y catálogo web se desactivarán.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                ¿Podrías decirnos el motivo? (Opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Ej. Cambio de negocio, costo del plan, ya no lo necesito..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Volver y Mantener
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: cancelling ? 'not-allowed' : 'pointer'
                }}
              >
                {cancelling ? 'Cancelando...' : 'Sí, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
