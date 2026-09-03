import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Clock, MessageCircle, ArrowLeft, Loader2, CheckCircle2, ShoppingBag } from 'lucide-react';
import TilopayPaymentForm from '../client/components/TilopayPaymentForm.js';

interface HostedCheckoutViewProps {
  token: string;
}

export default function HostedCheckoutView({ token }: HostedCheckoutViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function resolveToken() {
      try {
        const res = await fetch(`/api/storefront/pay-token/${token}`);
        const resData = await res.json();

        if (!res.ok) {
          setErrorStatus(resData.error || 'error');
          setErrorMessage(resData.message || 'No fue posible validar este enlace de pago.');
          setData(resData);
          return;
        }

        if (resData.status === 'already_paid') {
          window.location.href = `/order/success/${resData.orderId}`;
          return;
        }

        setData(resData);
      } catch (err: any) {
        setErrorStatus('network_error');
        setErrorMessage('Error de conexión al cargar la pasarela de pago.');
      } finally {
        setLoading(false);
      }
    }

    resolveToken();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} color="#16a34a" className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#0f172a' }}>Cargando pasarela de pago seguro...</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Verificando enlace dinámico de WhatsApp</p>
        </div>
      </div>
    );
  }

  // Handle Expired Link (60 min TTL)
  if (errorStatus === 'expired') {
    const cleanPhone = (data?.whatsappNumber || '').replace(/\D/g, '');
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'white', padding: '32px 24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid #fee2e2' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Clock size={32} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 'bold', color: '#991b1b', margin: '0 0 8px 0' }}>Enlace Expirado</h2>
          <p style={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
            {errorMessage || 'Por razones de seguridad bancaria, los enlaces de pago dinámicos tienen una vigencia máxima de 60 minutos.'}
          </p>

          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola, mi enlace de pago para la orden #${data?.orderNumber || ''} ha expirado. ¿Podrían enviarme un nuevo enlace de pago, por favor?`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', backgroundColor: '#25d366', color: 'white', borderRadius: '10px',
                textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)'
              }}
            >
              <MessageCircle size={18} /> Solicitar Nuevo Enlace por WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  // Handle General Error
  if (errorStatus || !data?.order || !data?.tilopaySession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'white', padding: '32px 24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>Enlace No Válido</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
            {errorMessage || 'El enlace que intentas abrir no existe o ya ha sido procesado.'}
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = '/'; }}
            style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  const { order, tilopaySession } = data;
  const currencySymbol = order.currency === 'USD' ? '$' : '₡';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '24px 16px', fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Store & Order Header Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Comercio</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{order.storeName}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>PEDIDO</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#16a34a' }}>#ORD-{order.orderNumber}</div>
            </div>
          </div>

          {/* Items Preview */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#334155' }}>{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                <strong style={{ color: '#0f172a' }}>{currencySymbol}{Number(item.totalPrice).toLocaleString('es-CR')}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Tilopay Payment Form */}
        <TilopayPaymentForm
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={order.total}
          currency={order.currency}
          sdkToken={tilopaySession.sdkToken}
          apiKey={tilopaySession.apiKey}
          environment={tilopaySession.environment}
          customerName={order.customerName}
          customerEmail={order.customerEmail || `${order.customerPhone ? order.customerPhone.replace(/\D/g, '') : 'cliente'}@betico.cr`}
          customerPhone={order.customerPhone}
          themeColor="#16a34a"
          onSuccess={() => {
            window.location.href = `/order/success/${order.id}`;
          }}
          onError={(err) => {
            console.warn('[HostedCheckout] Error en pasarela:', err);
          }}
        />

        {/* Security assurance */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color="#16a34a" />
          <span>Pago protegido con autenticación de 2 factores (3D Secure)</span>
        </div>

      </div>
    </div>
  );
}
