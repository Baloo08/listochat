import React, { useState, useEffect } from 'react';
import { Bike, Navigation, MapPin, Phone, MessageSquare, CheckCircle, Package, RefreshCw, LogOut, AlertCircle, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import { Order } from '../../shared/types';

export default function DriverPortal() {
  const [pin, setPin] = useState('');
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
        throw new Error(data.error || 'Código PIN inválido');
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

  // 1. PIN LOGIN SCREEN
  if (!driver) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', maxWidth: '400px', width: '100%', padding: '32px 24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          
          <div style={{ width: '64px', height: '64px', backgroundColor: '#0f766e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'white' }}>
            <Bike size={32} />
          </div>

          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>
            Portal de Repartidores
          </h2>
          <p style={{ margin: '0 0 24px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Ingresa tu código PIN de acceso único para ver tus entregas asignadas
          </p>

          {loginError && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', borderRadius: '8px', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> {loginError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', textAlign: 'left', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '6px' }}>
                Código PIN del Repartidor
              </label>
              <input
                type="text"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ej: 8492"
                style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', fontSize: '1.3rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !pin}
              style={{ width: '100%', padding: '14px', backgroundColor: '#0d9488', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}
            >
              <ShieldCheck size={18} /> {loading ? 'Verificando...' : 'Entrar a mis Entregas'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. ACTIVE ORDERS LIST (DRIVER PORTAL)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '40px' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#0f766e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Bike size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>{driver.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{driver.businessName} • {driver.vehicleType?.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => fetchDriverOrders()}
              style={{ padding: '8px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: '#cbd5e1', cursor: 'pointer' }}
              title="Refrescar entregas"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={handleLogout}
              style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', cursor: 'pointer' }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Delivery Feed */}
      <main style={{ maxWidth: '650px', margin: '20px auto', padding: '0 16px' }}>
        
        {deliveredSuccess && (
          <div style={{ padding: '14px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <CheckCircle size={20} /> {deliveredSuccess}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="#2dd4bf" /> Entregas Pendientes ({orders.length})
          </h2>
        </div>

        {orders.length === 0 ? (
          <div style={{ backgroundColor: '#1e293b', borderRadius: '14px', border: '1px solid #334155', padding: '40px 20px', textAlign: 'center' }}>
            <CheckCircle size={48} color="#2dd4bf" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'white' }}>¡Todo al día!</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>No tienes pedidos pendientes de entrega en este momento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => {
              const hasGps = Boolean(order.customerLocation?.lat && order.customerLocation?.lng);
              const wazeUrl = hasGps ? `https://waze.com/ul?ll=${order.customerLocation!.lat},${order.customerLocation!.lng}&navigate=yes` : null;
              const mapsUrl = order.customerLocation?.mapsUrl || (hasGps ? `https://maps.google.com/?q=${order.customerLocation!.lat},${order.customerLocation!.lng}` : null);
              const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '14px',
                    border: '1px solid #334155',
                    padding: '20px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        PEDIDO #{order.orderNumber}
                      </span>
                      <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
                        {order.customerName}
                      </h3>
                    </div>

                    <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#0284c7', color: 'white' }}>
                      En Camino
                    </span>
                  </div>

                  {/* Address & Navigation */}
                  <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px' }}>
                      <MapPin size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ fontSize: '0.9rem', color: '#e2e8f0', wordBreak: 'break-word' }}>
                        {order.customerAddress || 'Ubicación enviada por GPS'}
                      </div>
                    </div>

                    {/* Quick Action Navigation Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {wazeUrl ? (
                        <a
                          href={wazeUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '12px', backgroundColor: '#0284c7', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <Navigation size={16} /> Abrir en Waze
                        </a>
                      ) : (
                        <button disabled style={{ padding: '12px', backgroundColor: '#334155', color: '#64748b', borderRadius: '8px', border: 'none', fontSize: '0.85rem' }}>
                          Sin GPS Waze
                        </button>
                      )}

                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ padding: '12px', backgroundColor: '#15803d', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <MapPin size={16} /> Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Customer Direct Contact Bar */}
                  {cleanPhone && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <a
                        href={`tel:${cleanPhone}`}
                        style={{ padding: '10px', backgroundColor: '#334155', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Phone size={15} /> Llamar Cliente
                      </a>

                      <a
                        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${order.customerName}, soy tu repartidor ${driver.name} de ${driver.businessName}, ya voy llegando con tu pedido.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: '10px', backgroundColor: '#16a34a', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <MessageSquare size={15} /> WhatsApp
                      </a>
                    </div>
                  )}

                  {/* Items List */}
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#94a3b8' }}>Artículos a Entregar:</strong>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {(order.items || []).map((it, idx) => (
                        <li key={idx}><strong>{it.quantity}x</strong> {it.productName}</li>
                      ))}
                    </ul>
                    {order.notes && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#f59e0b' }}>
                        <strong>Nota:</strong> {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: order.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', borderRadius: '8px', border: `1px solid ${order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b'}` }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {order.paymentStatus === 'paid' ? 'Estado del Pago:' : 'Cobro al Cliente:'}
                    </span>
                    <strong style={{ fontSize: '1.1rem', color: order.paymentStatus === 'paid' ? '#34d399' : '#fbbf24' }}>
                      {order.paymentStatus === 'paid' ? '✅ Ya Pagado' : `Cobrar ₡${Number(order.total).toLocaleString('es-CR')}`}
                    </strong>
                  </div>

                  {/* MARK AS DELIVERED BUTTON */}
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    disabled={deliveringId === order.id}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
                      marginTop: '4px'
                    }}
                  >
                    <CheckCircle size={22} />
                    {deliveringId === order.id ? 'Confirmando Entrega...' : 'Marcar como Entregado'}
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
