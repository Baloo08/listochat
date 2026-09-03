import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShoppingBag, MessageCircle, ArrowLeft, Clock, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface OrderSuccessViewProps {
  orderId: string;
}

export default function OrderSuccessView({ orderId }: OrderSuccessViewProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/storefront/order-public/${orderId}`);
        if (!res.ok) {
          throw new Error('No fue posible cargar los detalles de esta orden.');
        }
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener orden');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} color="#16a34a" className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Cargando confirmación de pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: '440px', width: '100%', backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '1.3rem', color: '#0f172a', margin: '0 0 8px 0' }}>Orden no disponible</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>{error || 'El identificador ingresado no existe.'}</p>
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

  const isPaid = order.paymentStatus === 'paid';
  const cleanPhone = (order.whatsappNumber || '').replace(/\D/g, '');
  const currencySymbol = order.currency === 'USD' ? '$' : '₡';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '30px 16px', fontFamily: 'Inter, sans-serif', color: '#0f172a' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Success Header Banner */}
        <div style={{ backgroundColor: '#f0fdf4', padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid #dcfce7' }}>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle2 size={36} color="#166534" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 'bold', color: '#166534', margin: '0 0 6px 0' }}>
            {isPaid ? '¡Pago Confirmado con Éxito!' : '¡Pedido Recibido con Éxito!'}
          </h1>
          <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>
            Tu orden <strong style={{ color: '#0f172a' }}>#ORD-{order.orderNumber}</strong> ha sido registrada en <strong>{order.storeName}</strong>.
          </p>
        </div>

        {/* Order Details Body */}
        <div style={{ padding: '24px' }}>
          
          {/* Summary Box */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Cliente:</span>
              <strong>{order.customerName} ({order.customerPhone})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Estado del Pago:</span>
              <span style={{ color: isPaid ? '#166534' : '#b45309', fontWeight: 'bold' }}>
                {isPaid ? '✅ Cancelado con Tarjeta / Tilopay' : '⏳ Pendiente de Verificación'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Modalidad:</span>
              <strong>{order.deliveryMethod === 'delivery' ? 'Envío a Domicilio' : 'Retiro en Local'}</strong>
            </div>
          </div>

          {/* Items Summary */}
          <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#334155', margin: '0 0 12px 0' }}>
            Resumen de Productos
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {(order.items || []).map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{item.quantity}x {item.productName}</span>
                  {item.variantName && (
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b' }}>{item.variantName}</span>
                  )}
                </div>
                <strong>{currencySymbol}{Number(item.totalPrice).toLocaleString('es-CR')}</strong>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
              <span>Subtotal:</span>
              <span>{currencySymbol}{Number(order.subtotal).toLocaleString('es-CR')}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Envío:</span>
                <span>{currencySymbol}{Number(order.deliveryFee).toLocaleString('es-CR')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
              <span>Total:</span>
              <span style={{ color: '#16a34a' }}>{currencySymbol}{Number(order.total).toLocaleString('es-CR')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${order.storeName}, acabo de realizar la orden #ORD-${order.orderNumber} por ${currencySymbol}${Number(order.total).toLocaleString('es-CR')}. Mi nombre es ${order.customerName}.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', backgroundColor: '#25d366', color: 'white', borderRadius: '10px',
                  textDecoration: 'none', fontWeight: 'bold', fontSize: '0.92rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)'
                }}
              >
                <MessageCircle size={18} /> Continuar en WhatsApp con el Negocio
              </a>
            )}

            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '12px', backgroundColor: 'transparent', border: '1px solid #cbd5e1',
                borderRadius: '10px', color: '#64748b', fontWeight: '600', fontSize: '0.88rem', cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Volver a la Tienda
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
