import React, { useState, useEffect } from 'react';
import { Utensils, Clock, CheckCircle, Flame, Zap, Truck, Maximize, Minimize, RefreshCw, Eye, X, MapPin, Phone, MessageSquare, AlertCircle, Volume2, VolumeX, Building2, Bike, Package, Smartphone, CreditCard, DollarSign, FileText, Send, UserCheck } from 'lucide-react';
import { Order, OrderStatus } from '../../shared/types';
import { useApi } from '../hooks/useApi';
import { io } from 'socket.io-client';
import { playOrderNotificationSound } from '../utils/sound';

export default function KDSFullscreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customStages, setCustomStages] = useState<Record<string, string>>({});
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dispatchingDriverId, setDispatchingDriverId] = useState<string>('');
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);
  const urlBranch = new URLSearchParams(window.location.search).get('branch');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(urlBranch || 'all');
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const api = useApi();

  const fetchOrders = async () => {
    try {
      const data = await api.get('/api/orders');
      if (data) {
        setOrders(data);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('Error fetching KDS orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await api.get('/api/branches');
      if (Array.isArray(data)) setBranches(data);
    } catch (e) {
      console.error('Error fetching branches in KDS:', e);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const data = await api.get('/api/store');
      if (data?.customStages) {
        setCustomStages(data.customStages);
      }
    } catch (e) {
      console.error('Error fetching store stages in KDS:', e);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await api.get('/api/drivers');
      if (Array.isArray(data)) setDrivers(data);
    } catch (e) {
      console.error('Error fetching drivers in KDS:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    fetchStoreSettings();
    fetchDrivers();

    // Connect to WebSocket for instant 0ms real-time order arrival
    const socket = io(window.location.origin);
    
    socket.on('order:created', (newOrder: Order) => {
      const isMatch = selectedBranchId === 'all' || (newOrder as any).branchId === selectedBranchId;
      if (isMatch && soundEnabled) playOrderNotificationSound();
      setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
      setLastUpdated(new Date());
    });

    socket.on('order:updated', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      setLastUpdated(new Date());
    });

    const interval = setInterval(fetchOrders, 10000); // Polling as secondary backup

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [soundEnabled, selectedBranchId]);

  const handleDispatchDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    setDispatchingOrderId(orderId);
    try {
      await api.post(`/api/drivers/${driverId}/dispatch-order`, { orderId });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, driverId, status: 'en_camino' as OrderStatus } : null);
      }
    } catch (e: any) {
      alert('Error al asignar repartidor: ' + (e.message || 'Verifique'));
    } finally {
      setDispatchingOrderId(null);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus, notifyCustomer: true });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      await fetchOrders();
    } catch (e: any) {
      alert('Error al actualizar estado: ' + (e.message || 'Error'));
    }
  };

  const columns = [
    {
      id: 'recibidos',
      title: customStages.fase_1 || 'Nuevos / Recibidos',
      statuses: ['pedido_recibido', 'pending'],
      borderColor: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      actionBtn: { label: customStages.fase_2 || 'En Cocina', nextStatus: 'procesando' as OrderStatus, color: '#f59e0b', icon: 'flame' }
    },
    {
      id: 'cocina',
      title: customStages.fase_2 || 'En Preparación / Cocina',
      statuses: ['pedido_aceptado', 'confirmed', 'procesando', 'preparing'],
      borderColor: '#f59e0b',
      badgeBg: '#fefce8',
      badgeColor: '#a16207',
      actionBtn: { label: customStages.fase_3 || 'Listo', nextStatus: 'listo_entrega' as OrderStatus, color: '#8b5cf6', icon: 'zap' }
    },
    {
      id: 'listo',
      title: customStages.fase_3 || 'Listo para Entrega / Retiro',
      statuses: ['listo_entrega'],
      borderColor: '#8b5cf6',
      badgeBg: '#faf5ff',
      badgeColor: '#7e22ce',
      actionBtn: null // Dynamic per order mode (delivery vs pickup vs dine_in)
    },
    {
      id: 'en_camino',
      title: customStages.fase_4 || 'En Camino (Delivery)',
      statuses: ['en_camino', 'shipped'],
      borderColor: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      actionBtn: { label: customStages.fase_5 || 'Entregar', nextStatus: 'entregado' as OrderStatus, color: '#10b981', icon: 'check' }
    },
    {
      id: 'entregados',
      title: customStages.fase_5 || 'Entregados Hoy',
      statuses: ['entregado', 'delivered'],
      borderColor: '#10b981',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d',
      actionBtn: null
    }
  ];

  if (loading) {
    return (
      <div style={{ backgroundColor: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Cargando Sistema KDS de Cocina...</h2>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top KDS Control Bar */}
      <header style={{ padding: '12px 20px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#ea580c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>KDS Cocina & Comandas en Vivo</h1>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Actualizado: {lastUpdated.toLocaleTimeString()} (Auto-refresco 5s)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {branches.length >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '8px', padding: '6px 12px' }}>
              <Building2 size={16} color="#38bdf8" />
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBranchId(val);
                  const url = new URL(window.location.href);
                  if (val !== 'all') url.searchParams.set('branch', val);
                  else url.searchParams.delete('branch');
                  window.history.replaceState({}, '', url.toString());
                }}
                style={{ border: 'none', background: 'none', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all" style={{ background: '#1e293b', color: 'white' }}>Todas las Sedes ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} style={{ background: '#1e293b', color: 'white' }}>Sede: {b.name} {b.isMain ? '(Matriz)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playOrderNotificationSound();
            }}
            style={{ padding: '8px 14px', backgroundColor: soundEnabled ? '#1e3a5f' : '#334155', color: 'white', border: `1px solid ${soundEnabled ? '#3b82f6' : '#475569'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar alertas sonoras'}
          >
            {soundEnabled ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#94a3b8" />}
            <span>{soundEnabled ? 'Sonido Activo' : 'Silenciado'}</span>
          </button>

          <button
            onClick={() => fetchOrders()}
            style={{ padding: '8px 14px', backgroundColor: '#334155', color: 'white', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <RefreshCw size={15} /> Refrescar
          </button>

          <button
            onClick={handleToggleFullscreen}
            style={{ padding: '8px 14px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            {isFullscreen ? 'Salir Fullscreen' : 'Pantalla Completa'}
          </button>
        </div>
      </header>

      {/* 5-Column KDS Board */}
      <main style={{ flex: 1, padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', overflowX: 'auto' }}>
        {columns.map(col => {
          const displayedOrders = selectedBranchId === 'all' ? orders : orders.filter(o => (o as any).branchId === selectedBranchId);
          const colOrders = displayedOrders.filter(o => col.statuses.includes(o.status));

          return (
            <div
              key={col.id}
              style={{
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                borderTop: `4px solid ${col.borderColor}`,
                border: '1px solid #334155',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '260px',
                height: 'calc(100vh - 100px)'
              }}
            >
              {/* Column Header */}
              <div style={{ padding: '14px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>{col.title}</strong>
                <span style={{ backgroundColor: col.badgeBg, color: col.badgeColor, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Orders List */}
              <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem', padding: '30px 10px' }}>
                    Sin pedidos en esta etapa
                  </div>
                ) : (
                  colOrders.map(order => {
                    const elapsedMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);

                    return (
                      <div
                        key={order.id}
                        style={{
                          backgroundColor: '#0f172a',
                          borderRadius: '10px',
                          border: '1px solid #334155',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                        }}
                      >
                        {/* Order Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                                #ORD-{order.orderNumber}
                              </div>
                              {order.paymentMethod === 'sinpe_tilopay' ? (
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', backgroundColor: 'rgba(52, 211, 153, 0.25)', color: '#34d399', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Zap size={11} /> SINPE Auto {order.paymentStatus === 'paid' ? 'Verif.' : 'Pend.'}
                                </span>
                              ) : order.paymentMethod === 'card' || order.paymentMethod === 'tilopay' ? (
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <CreditCard size={11} /> Tarjeta {order.paymentStatus === 'paid' ? 'Pagado' : 'Pend.'}
                                </span>
                              ) : order.paymentMethod === 'sinpe' ? (
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Smartphone size={11} /> SINPE {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'proof_sent' ? 'Comp.' : ''}
                                </span>
                              ) : order.paymentMethod === 'transfer' ? (
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Building2 size={11} /> Transf.
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <DollarSign size={11} /> Contra Entrega
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f1f5f9', marginTop: '2px' }}>
                              {order.customerName}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            {order.consumptionMode === 'dine_in' ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#ea580c', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Utensils size={11} /> Mesa #{order.tableNumber || 1}
                              </span>
                            ) : order.deliveryMethod === 'delivery' ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#0284c7', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Bike size={11} /> Delivery
                              </span>
                            ) : (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#64748b', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Package size={11} /> Para Llevar
                              </span>
                            )}
                            <div style={{ fontSize: '0.7rem', color: elapsedMinutes > 20 ? '#ef4444' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '4px' }}>
                              <Clock size={11} /> {elapsedMinutes} min
                            </div>
                          </div>
                        </div>

                        {/* Items Full Breakdown */}
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#e2e8f0', borderBottom: idx < (order.items?.length || 0) - 1 ? '1px dashed #334155' : 'none', paddingBottom: '3px' }}>
                              <span><strong style={{ color: '#f59e0b' }}>{it.quantity}x</strong> {it.productName}</span>
                            </div>
                          ))}
                        </div>

                        {order.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} /> <span>{order.notes}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#34d399', paddingTop: '2px' }}>
                          <span>Total:</span>
                          <span>₡{Number(order.total).toLocaleString('es-CR')}</span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{ padding: '8px 10px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              title="Ver detalles completos"
                            >
                              <Eye size={13} /> Detalle
                            </button>

                            {/* Column 1: advances to Cocina */}
                            {col.id === 'recibidos' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'procesando')}
                                style={{ flex: 1, padding: '8px 10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Flame size={14} /> {customStages.fase_2 || 'En Cocina'}
                              </button>
                            )}

                            {/* Column 2: advances to Listo */}
                            {col.id === 'cocina' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'listo_entrega')}
                                style={{ flex: 1, padding: '8px 10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <Zap size={14} /> {customStages.fase_3 || 'Listo'}
                              </button>
                            )}

                            {/* Column 3: conditional according to deliveryMethod & consumptionMode */}
                            {col.id === 'listo' && (
                              order.consumptionMode === 'dine_in' ? (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'entregado')}
                                  style={{ flex: 1, padding: '8px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Utensils size={14} /> Servir en Mesa
                                </button>
                              ) : order.deliveryMethod === 'delivery' ? (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'en_camino')}
                                  style={{ flex: 1, padding: '8px 10px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Bike size={14} /> {customStages.fase_4 || 'En Camino'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'entregado')}
                                  style={{ flex: 1, padding: '8px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Package size={14} /> Entregar al Cliente
                                </button>
                              )
                            )}

                            {/* Column 4: advances to Entregado */}
                            {col.id === 'en_camino' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'entregado')}
                                style={{ flex: 1, padding: '8px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                              >
                                <CheckCircle size={14} /> {customStages.fase_5 || 'Entregar'}
                              </button>
                            )}
                          </div>

                          {/* Quick Driver Dispatch on card if order is in 'listo' and delivery */}
                          {col.id === 'listo' && order.deliveryMethod === 'delivery' && drivers.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <select
                                value={dispatchingOrderId === order.id ? (dispatchingDriverId || '') : ''}
                                onChange={(e) => {
                                  const dId = e.target.value;
                                  if (dId) {
                                    setDispatchingDriverId(dId);
                                    handleDispatchDriver(order.id, dId);
                                  }
                                }}
                                disabled={dispatchingOrderId === order.id}
                                style={{ flex: 1, padding: '5px 8px', backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                              >
                                <option value="">Despachar con Chofer...</option>
                                {drivers.map(d => (
                                  <option key={d.id} value={d.id}>{d.name} {d.vehiclePlate ? `(${d.vehiclePlate})` : ''}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* DETAIL MODAL IN FULLSCREEN KDS */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #475569', maxWidth: '560px', width: '100%', padding: '24px', color: 'white', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#38bdf8', backgroundColor: '#0f172a', padding: '3px 8px', borderRadius: '4px' }}>
                  ORDEN #ORD-{selectedOrder.orderNumber}
                </span>
                <h2 style={{ margin: '8px 0 2px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>{selectedOrder.customerName}</h2>
                {selectedOrder.customerPhone && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={13} /> {selectedOrder.customerPhone}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{ border: 'none', background: '#334155', color: '#94a3b8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Delivery / Dine-in details */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong>Modalidad:</strong>
                {selectedOrder.consumptionMode === 'dine_in' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', fontWeight: 'bold' }}>
                    <Utensils size={13} /> Comer en Mesa #{selectedOrder.tableNumber || 1}
                  </span>
                ) : selectedOrder.deliveryMethod === 'delivery' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontWeight: 'bold' }}>
                    <Bike size={13} /> Envío Delivery
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontWeight: 'bold' }}>
                    <Package size={13} /> Para Llevar / Retiro
                  </span>
                )}
              </div>
              {selectedOrder.customerAddress && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <MapPin size={13} style={{ marginTop: '3px', flexShrink: 0, color: '#f59e0b' }} />
                  <span><strong>Dirección:</strong> {selectedOrder.customerAddress}</span>
                </div>
              )}
              {selectedOrder.notes && (
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <FileText size={13} style={{ marginTop: '3px', flexShrink: 0 }} />
                  <span><strong>Notas del Cliente:</strong> {selectedOrder.notes}</span>
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong>Pago:</strong>{' '}
                {selectedOrder.paymentMethod === 'sinpe_tilopay' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Zap size={13} color="#34d399" /> SINPE Móvil Automático (Tilopay)</span>
                ) : selectedOrder.paymentMethod === 'card' || selectedOrder.paymentMethod === 'tilopay' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><CreditCard size={13} color="#34d399" /> Tarjeta (Tilopay)</span>
                ) : selectedOrder.paymentMethod === 'sinpe' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Smartphone size={13} color="#38bdf8" /> SINPE Móvil Manual</span>
                ) : selectedOrder.paymentMethod === 'transfer' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Building2 size={13} color="#c084fc" /> Transferencia Bancaria</span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><DollarSign size={13} color="#facc15" /> Contra Entrega</span>
                )}{' '}
                ({selectedOrder.paymentStatus === 'paid' ? (
                  <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}><CheckCircle size={12} /> Pagado</span>
                ) : (
                  <span style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Clock size={12} /> Pendiente</span>
                )})
              </div>
            </div>

            {/* Driver Assignment in Modal for Delivery orders */}
            {selectedOrder.deliveryMethod === 'delivery' && (
              <div style={{ backgroundColor: '#0f172a', padding: '12px 14px', borderRadius: '10px', border: '1px solid #0284c7', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bike size={15} /> Asignar Repartidor al Pedido
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={dispatchingDriverId}
                    onChange={(e) => setDispatchingDriverId(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    <option value="">Seleccionar Chofer ({drivers.length} disponibles)...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} {d.vehiclePlate ? `(${d.vehiclePlate})` : ''} {d.phone ? `- ${d.phone}` : ''}</option>
                    ))}
                  </select>
                  <button
                    disabled={!dispatchingDriverId || dispatchingOrderId === selectedOrder.id}
                    onClick={() => handleDispatchDriver(selectedOrder.id, dispatchingDriverId)}
                    style={{ padding: '8px 14px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: !dispatchingDriverId ? 'not-allowed' : 'pointer', opacity: !dispatchingDriverId ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Send size={14} /> Despachar
                  </button>
                </div>
              </div>
            )}

            {/* Products breakdown */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Platillos / Productos a Preparar:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.9rem' }}>
                    <span><strong style={{ color: '#f59e0b' }}>{it.quantity}x</strong> {it.productName}</span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>₡{Number(it.totalPrice || 0).toLocaleString('es-CR')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold', borderTop: '1px solid #334155', paddingTop: '12px', marginBottom: '20px' }}>
              <span>Total Orden:</span>
              <span style={{ color: '#34d399' }}>₡{Number(selectedOrder.total).toLocaleString('es-CR')}</span>
            </div>

            {/* Quick stage advance buttons - Conditional for delivery vs pickup/dine-in */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedOrder.deliveryMethod === 'delivery' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'procesando' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Flame size={14} /> {customStages.fase_2 || 'En Cocina'}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'listo_entrega' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Zap size={14} /> {customStages.fase_3 || 'Listo'}
              </button>
              {selectedOrder.deliveryMethod === 'delivery' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'en_camino' as OrderStatus)}
                  style={{ padding: '10px 6px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Bike size={14} /> {customStages.fase_4 || 'En Camino'}
                </button>
              )}
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'entregado' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <CheckCircle size={14} /> {selectedOrder.consumptionMode === 'dine_in' ? 'Servir en Mesa' : (customStages.fase_5 || 'Entregado')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
