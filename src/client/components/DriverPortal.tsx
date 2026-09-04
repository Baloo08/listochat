import React, { useState, useEffect } from 'react';
import { Bike, Navigation, MapPin, Phone, MessageSquare, CheckCircle, Package, RefreshCw, LogOut, AlertCircle, Clock, ShieldCheck, DollarSign, Eye, EyeOff, Lock, Calendar, Filter, FileText, ExternalLink } from 'lucide-react';
import { Order } from '../../shared/types';
import InteractiveMapPicker from './InteractiveMapPicker';

export default function DriverPortal({ tenantSlug }: { tenantSlug?: string }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [driver, setDriver] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [deliveredSuccess, setDeliveredSuccess] = useState<string | null>(null);

  // Tabs & History State
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState({ totalCount: 0, totalEarnings: 0 });
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

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

  const fetchHistoryOrders = async () => {
    const p = pin || localStorage.getItem('driver_pin');
    if (!p) return;

    setLoadingHistory(true);
    try {
      let from = '';
      let to = '';
      const now = new Date();

      if (dateFilter === 'today') {
        from = now.toISOString().split('T')[0];
        to = from;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        from = weekAgo.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        from = monthAgo.toISOString().split('T')[0];
        to = now.toISOString().split('T')[0];
      } else if (dateFilter === 'custom') {
        from = customFrom;
        to = customTo;
      }

      let url = `/api/drivers/portal/history?pin=${p}`;
      if (from) url += `&fromDate=${from}`;
      if (to) url += `&toDate=${to}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistoryOrders(data.orders || []);
        setHistoryStats({
          totalCount: data.totalCount || (data.orders || []).length,
          totalEarnings: data.totalEarnings || 0
        });
      }
    } catch (e) {
      console.error('Error fetching driver history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (driver) {
      if (activeTab === 'active') {
        fetchDriverOrders();
      } else {
        fetchHistoryOrders();
      }
    }
  }, [driver, activeTab, dateFilter, customFrom, customTo]);

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
    setPin('');
    setOrders([]);
  };

  // PIN LOGIN FORM
  if (!driver) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        backgroundColor: '#0f172a', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '20px', padding: '36px 28px',
          maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '64px', height: '64px', backgroundColor: '#f0fdf4',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px auto', border: '1px solid #bbf7d0'
            }}>
              <Bike size={32} color="#16a34a" />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>
              Portal de Repartidor
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              Ingresa tu código PIN de 4 dígitos para ver tus entregas
            </p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
              padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                Código PIN Asignado
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  maxLength={6}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 40px 12px 38px', textAlign: 'center',
                    letterSpacing: '6px', fontSize: '1.3rem', fontWeight: 'bold', borderRadius: '8px',
                    border: '1px solid #cbd5e1', boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', backgroundColor: '#16a34a', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px'
              }}
            >
              {loading ? 'Verificando...' : 'Entrar a Mis Entregas'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ACTIVE PORTAL VIEW
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>{driver.businessName}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bike size={18} color="#16a34a" /> {driver.name}
              {driver.plateNumber && (
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                  Placa: {driver.plateNumber}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => activeTab === 'active' ? fetchDriverOrders() : fetchHistoryOrders()}
              style={{ padding: '7px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
              title="Refrescar"
            >
              <RefreshCw size={14} color="#475569" />
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '7px 12px', backgroundColor: '#fee2e2', border: 'none',
                borderRadius: '8px', fontSize: '0.8rem', color: '#991b1b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold'
              }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px 20px' }}>
        
        {deliveredSuccess && (
          <div style={{ padding: '12px 16px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> {deliveredSuccess}
          </div>
        )}

        <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', backgroundColor: activeTab === 'active' ? '#ffffff' : 'transparent',
              color: activeTab === 'active' ? '#16a34a' : '#64748b', boxShadow: activeTab === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Bike size={16} /> Pedidos Asignados ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1, padding: '9px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem',
              cursor: 'pointer', backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#16a34a' : '#64748b', boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Package size={16} /> Historial de Entregas
          </button>
        </div>

        {/* TAB 1: ACTIVE ORDERS */}
        {activeTab === 'active' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <CheckCircle size={42} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>
                  ¡Todo al día!
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  No tienes entregas pendientes asignadas en este momento.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {orders.map(o => {
                  const cleanPhone = (o.customerPhone || '').replace(/\D/g, '');
                  const waUrl = `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(o.customerName)},%20te%20escribe%20${encodeURIComponent(driver.name)}%20tu%20repartidor%20de%20${encodeURIComponent(driver.businessName)}%20con%20tu%20pedido%20%23${o.orderNumber}.`;

                  // Parse coordinates from customerLocation or address
                  let lat = o.customerLocation?.lat;
                  let lng = o.customerLocation?.lng;
                  if ((!lat || !lng) && o.customerAddress) {
                    const match = o.customerAddress.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (match) {
                      lat = parseFloat(match[1]);
                      lng = parseFloat(match[2]);
                    }
                  }

                  // Sane address (Requirement 1): remove raw Google Maps URLs and GPS tags
                  const cleanAddress = (o.customerAddress || '')
                    .replace(/Ubicación GPS:\s*https:\/\/[^\s)]+/gi, '')
                    .replace(/\(GPS:\s*https:\/\/[^\s)]+\)/gi, '')
                    .replace(/\(GPS:\s*-?\d+\.\d+,\s*-?\d+\.\d+\)/gi, '')
                    .trim();

                  const gmapsUrl = lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : undefined;
                  const wazeNavUrl = o.wazeUrl || (lat && lng ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : undefined);

                  return (
                    <div key={o.id} style={{
                      backgroundColor: '#ffffff', borderRadius: '14px', padding: '18px',
                      border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                            Orden #{o.orderNumber}
                          </span>
                          <h4 style={{ margin: '6px 0 2px 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a' }}>
                            {o.customerName}
                          </h4>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#0f172a' }}>
                            ₡{Number(o.total || 0).toLocaleString('es-CR')}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: o.paymentStatus === 'paid' ? '#15803d' : '#b45309', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            {o.paymentStatus === 'paid' ? (
                              <>
                                <CheckCircle size={12} color="#15803d" />
                                {o.paymentMethod === 'card' || o.paymentMethod === 'tilopay' ? 'Pagado con Tarjeta' : 'Pagado'}
                              </>
                            ) : (
                              <>
                                <Clock size={12} color="#b45309" />
                                {o.paymentMethod === 'card' || o.paymentMethod === 'tilopay' ? 'Tarjeta Pendiente' : 'Cobrar al entregar'}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Address & Interactive Map (Requirement 1 & 5) */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '12px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.85rem', color: '#334155', marginBottom: (lat && lng) ? '10px' : '6px' }}>
                          <MapPin size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Dirección:</strong> {cleanAddress || (lat && lng ? 'Ubicación fijada en el mapa' : 'Ubicación registrada')}
                            {o.notes && (
                              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={12} /> <strong>Nota:</strong> {o.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Visual Map with Pin (Requirement 1) */}
                        {lat && lng && (
                          <div style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                            <InteractiveMapPicker
                              initialLat={lat}
                              initialLng={lng}
                              readonly={true}
                              height={180}
                            />
                          </div>
                        )}

                        {/* Clean Navigation Links with SVG icons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                          {wazeNavUrl && (
                            <a
                              href={wazeNavUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '8px', backgroundColor: '#33ccff', color: '#003366',
                                borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                              }}
                            >
                              <Navigation size={13} /> Abrir en Waze
                            </a>
                          )}

                          {gmapsUrl && (
                            <a
                              href={gmapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: '8px', backgroundColor: '#ea4335', color: 'white',
                                borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                              }}
                            >
                              <MapPin size={13} /> Google Maps
                            </a>
                          )}

                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '8px', backgroundColor: '#25D366', color: 'white',
                              borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                            }}
                          >
                            <MessageSquare size={13} /> WhatsApp
                          </a>
                        </div>
                      </div>

                      {/* Items */}
                      {o.items && o.items.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                          <span style={{ fontWeight: 'bold', color: '#334155' }}>Productos ({o.items.length}):</span>
                          <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px' }}>
                            {o.items.map((it: any, idx: number) => (
                              <li key={idx}>
                                {it.quantity}x {it.productName}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Deliver Button with SVG */}
                      <button
                        onClick={() => handleMarkDelivered(o.id)}
                        disabled={deliveringId === o.id}
                        style={{
                          width: '100%', padding: '11px', backgroundColor: '#16a34a', color: 'white',
                          border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                          cursor: deliveringId === o.id ? 'not-allowed' : 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <CheckCircle size={16} />
                        {deliveringId === o.id ? 'Confirmando...' : 'Marcar como Entregado'}
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div>
            {/* Filter Bar */}
            <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {(['today', 'week', 'month', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDateFilter(mode)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                      fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: dateFilter === mode ? '#16a34a' : '#f8fafc',
                      color: dateFilter === mode ? '#ffffff' : '#475569'
                    }}
                  >
                    {mode === 'today' ? 'Hoy' : mode === 'week' ? 'Esta Semana' : mode === 'month' ? 'Este Mes' : 'Rango'}
                  </button>
                ))}
              </div>

              {dateFilter === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                  <span>hasta</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                  />
                </div>
              )}

              {/* KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.72rem', color: '#166534', display: 'block' }}>Entregas Realizadas:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#166534' }}>{historyStats.totalCount}</strong>
                </div>
                <div style={{ backgroundColor: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.72rem', color: '#1e40af', display: 'block' }}>Monto Total Entregado:</span>
                  <strong style={{ fontSize: '1.2rem', color: '#1e40af' }}>₡{historyStats.totalEarnings.toLocaleString('es-CR')}</strong>
                </div>
              </div>
            </div>

            {/* List */}
            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Consultando historial...</div>
            ) : historyOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
                No hay entregas completadas en el rango de fechas seleccionado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historyOrders.map(h => (
                  <div key={h.id} style={{
                    backgroundColor: '#ffffff', borderRadius: '10px', padding: '14px',
                    border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>
                        Orden #{h.orderNumber} • {h.customerName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{h.customerAddress || 'Entrega a domicilio'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '0.95rem' }}>
                        ₡{Number(h.total || 0).toLocaleString('es-CR')}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                        Entregado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
