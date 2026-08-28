import React, { useState, useEffect } from 'react';
import { Bike, Navigation, MapPin, Phone, MessageSquare, CheckCircle, Package, RefreshCw, LogOut, AlertCircle, Clock, ShieldCheck, DollarSign, Eye, EyeOff, Lock } from 'lucide-react';
import { Order } from '../../shared/types';

export default function DriverPortal() {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [driver, setDriver] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliveredSuccess, setDeliveredSuccess] = useState<string | null>(null);

  // Check URL params for pin (?pin=1234) or saved localStorage PIN
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pinFromUrl = urlParams.get('pin');
    const savedPin = localStorage.getItem('driver_pin');

    const effectivePin = pinFromUrl || savedPin;
    if (effectivePin) {
      setPin(effectivePin);
      handleLogin(effectivePin);
    }
  }, []);

  const handleLogin = async (pinToUse?: string) => {
    const p = pinToUse || pin;
    if (!p) {
      setLoginError('Por favor ingresa tu código PIN de repartidor');
      return;
    }
    setLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/drivers/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Código PIN incorrecto o inactivo');
      }

      const data = await res.json();
      setDriver(data.driver);
      localStorage.setItem('driver_pin', p.trim());
      await fetchDriverOrders(p.trim());
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverOrders = async (pinToUse?: string) => {
    const p = pinToUse || pin || localStorage.getItem('driver_pin');
    if (!p) return;

    try {
      const res = await fetch(`/api/drivers/portal/orders?pin=${p}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error('Error fetching driver orders:', e);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    const p = pin || localStorage.getItem('driver_pin');
    if (!confirm('¿Confirmas que ya entregaste este pedido al cliente?')) return;

    setDeliveringId(orderId);
    try {
      const res = await fetch(`/api/drivers/portal/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      });

      if (!res.ok) throw new Error('Error al confirmar entrega');
      
      setDeliveredSuccess(`¡Pedido marcado como entregado con éxito! Se notificó al cliente.`);
      setTimeout(() => setDeliveredSuccess(null), 4000);
      await fetchDriverOrders(p || undefined);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setDeliveringId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_pin');
    setDriver(null);
    setOrders([]);
    setPin('');
  };

  // 1. PIN LOGIN SCREEN (Masked and strictly protected)
  if (!driver) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', maxWidth: '380px', width: '100%', padding: '32px 24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', color: 'white' }}>
          
          <div style={{ width: '64px', height: '64px', backgroundColor: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Bike size={32} color="white" />
          </div>

          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 'bold' }}>Portal de Entregas</h2>
          <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Ingresa tu código PIN único para ver tus pedidos asignados
          </p>

          {loginError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
              <AlertCircle size={18} color="#ef4444" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                Código PIN de Acceso
              </label>
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '12px', color: '#64748b' }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 38px',
                    borderRadius: '10px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '1.4rem',
                    letterSpacing: showPin ? '2px' : '6px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px',
                backgroundColor: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ShieldCheck size={20} />
              {loading ? 'Verificando...' : 'Acceder al Portal'}
            </button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Lock size={12} /> Acceso protegido y cifrado
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE DELIVERIES SCREEN
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '40px' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#0f172a', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#0d9488', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bike size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{driver.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{driver.businessName || 'Comercio'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchDriverOrders()}
            style={{ padding: '8px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
            title="Actualizar pedidos"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '8px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: '#fca5a5', cursor: 'pointer' }}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '16px' }}>
        
        {deliveredSuccess && (
          <div style={{ padding: '14px 18px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <CheckCircle size={20} color="#16a34a" />
            <span>{deliveredSuccess}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
            Tus Entregas Asignadas ({orders.length})
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #cbd5e1' }}>
            Vehículo: {driver.vehicleType?.toUpperCase()} {driver.plateNumber ? `(${driver.plateNumber})` : ''}
          </span>
        </div>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', marginTop: '20px' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', color: '#0f766e' }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: 'bold', color: '#1e293b' }}>¡Todo al día!</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              No tienes entregas pendientes en este momento. Cuando la tienda te asigne un pedido, aparecerá aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => {
              const hasGps = Boolean(order.customerLocation?.lat && order.customerLocation?.lng);
              const wazeLink = hasGps 
                ? `https://waze.com/ul?ll=${order.customerLocation!.lat},${order.customerLocation!.lng}&navigate=yes`
                : null;
              const mapsLink = hasGps 
                ? `https://maps.google.com/?q=${order.customerLocation!.lat},${order.customerLocation!.lng}`
                : null;
              const cleanCustomerPhone = (order.customerPhone || '').replace(/\D/g, '');

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '2px solid #0d9488',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0f766e', textTransform: 'uppercase', backgroundColor: '#ccfbf1', padding: '2px 8px', borderRadius: '4px' }}>
                        ORDEN #{order.orderNumber}
                      </span>
                      <h3 style={{ margin: '6px 0 2px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {order.customerName}
                      </h3>
                      {order.customerPhone && (
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          📞 {order.customerPhone}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f766e' }}>
                        ₡{Number(order.total).toLocaleString('es-CR')}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: order.paymentStatus === 'paid' ? '#15803d' : '#ea580c' }}>
                        {order.paymentStatus === 'paid' ? '✅ Pagado (No cobrar)' : '💰 Cobrar al entregar'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Address & GPS */}
                  <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <MapPin size={18} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>Dirección de Entrega:</strong>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                          {order.customerAddress || (hasGps ? 'Ubicación GPS indicada' : 'Dirección no especificada')}
                        </div>
                        {order.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#ea580c', marginTop: '4px', fontWeight: '500' }}>
                            📝 Nota: {order.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items list breakdown */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Productos a Entregar:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#1e293b', padding: '4px 0', borderBottom: '1px dashed #f1f5f9' }}>
                          <span><strong>{it.quantity}x</strong> {it.productName}</span>
                          <span style={{ color: '#64748b' }}>₡{Number(it.totalPrice || 0).toLocaleString('es-CR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons: Waze & Google Maps */}
                  {hasGps && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {wazeLink && (
                        <a
                          href={wazeLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '12px',
                            backgroundColor: '#33ccff',
                            color: '#0f172a',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(51, 204, 255, 0.3)'
                          }}
                        >
                          <Navigation size={18} /> Abrir en Waze
                        </a>
                      )}

                      {mapsLink && (
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '12px',
                            backgroundColor: '#4285F4',
                            color: 'white',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <MapPin size={18} /> Google Maps
                        </a>
                      )}
                    </div>
                  )}

                  {/* Contact Customer Buttons */}
                  {cleanCustomerPhone && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <a
                        href={`tel:${cleanCustomerPhone}`}
                        style={{
                          padding: '10px',
                          backgroundColor: '#f1f5f9',
                          color: '#1e293b',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        <Phone size={15} /> Llamar Cliente
                      </a>

                      <a
                        href={`https://wa.me/${cleanCustomerPhone.length === 8 ? '506' + cleanCustomerPhone : cleanCustomerPhone}?text=${encodeURIComponent(`Hola ${order.customerName}, soy tu repartidor de ${driver.businessName || 'la tienda'}. Voy con tu orden #ORD-${order.orderNumber}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '10px',
                          backgroundColor: '#25D366',
                          color: 'white',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <MessageSquare size={15} /> WhatsApp
                      </a>
                    </div>
                  )}

                  {/* Primary Deliver Button */}
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    disabled={deliveringId === order.id}
                    style={{
                      marginTop: '4px',
                      padding: '16px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <CheckCircle size={22} />
                    {deliveringId === order.id ? 'Marcando...' : '✅ Marcar como Entregado'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
