import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, Truck, Package, XCircle, Eye, MessageCircle, AlertCircle, RefreshCw, Send, Check, Utensils, LayoutGrid, List, Navigation, Bike, MapPin, User, Phone, Store } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Order, OrderStatus, DeliveryDriver } from '../../shared/types';

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [dispatchingDriverId, setDispatchingDriverId] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);

  const api = useApi();

  const fetchOrders = async () => {
    try {
      const data = await api.get('/api/orders');
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await api.get('/api/drivers');
      if (data) setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
    const timer = setInterval(fetchOrders, 6000); // Polling every 6s for new orders
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/api/orders/${orderId}/status`, {
        status: newStatus,
        notifyCustomer
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      alert('Error al actualizar estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDispatchToDriver = async (orderId: string, driverId: string) => {
    if (!driverId) {
      alert('Por favor selecciona un repartidor');
      return;
    }
    setDispatching(true);
    try {
      const res = await api.post(`/api/drivers/${driverId}/dispatch-order`, { orderId });
      alert(`¡Pedido despachado exitosamente por WhatsApp a ${res.driverName}!`);
      await fetchOrders();
      if (selectedOrder) setSelectedOrder(null);
    } catch (e: any) {
      alert('Error al despachar: ' + (e.message || 'Verifique'));
    } finally {
      setDispatching(false);
    }
  };

  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pedido_recibido: { label: 'Pedido Recibido', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    pending: { label: 'Pedido Recibido', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    pedido_aceptado: { label: 'Pedido Aceptado', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    confirmed: { label: 'Pedido Aceptado', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    procesando: { label: 'En Preparación', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    preparing: { label: 'En Preparación', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    listo_entrega: { label: 'Listo para Entregar', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
    shipped: { label: 'Listo para Entregar', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
    entregado: { label: 'Entregado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    delivered: { label: 'Entregado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    cancelado: { label: 'Cancelado', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  };

  const KANBAN_COLUMNS = [
    {
      id: 'nuevos',
      title: 'Nuevos / Recibidos',
      statuses: ['pedido_recibido', 'pending'],
      borderColor: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8'
    },
    {
      id: 'cocina',
      title: 'En Cocina / Preparación',
      statuses: ['pedido_aceptado', 'confirmed', 'procesando', 'preparing'],
      borderColor: '#f59e0b',
      badgeBg: '#fefce8',
      badgeColor: '#a16207'
    },
    {
      id: 'listo',
      title: 'Listo / Para Despacho',
      statuses: ['listo_entrega', 'shipped'],
      borderColor: '#8b5cf6',
      badgeBg: '#faf5ff',
      badgeColor: '#7e22ce'
    },
    {
      id: 'entregados',
      title: 'Entregados',
      statuses: ['entregado', 'delivered'],
      borderColor: '#10b981',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d'
    }
  ];

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'new') return o.status === 'pedido_recibido' || o.status === 'pending';
    return o.status === filterStatus;
  });

  const newOrdersCount = orders.filter(o => o.status === 'pedido_recibido' || o.status === 'pending').length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel de comandas y pedidos...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Receptor de Pedidos & Comandas</h2>
            {newOrdersCount > 0 && (
              <span style={{ backgroundColor: '#2563eb', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {newOrdersCount} nuevos
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Control en vivo de cocina, mesas, despacho y asignación de motorizados con Waze
          </p>
        </div>

        {/* View Mode Toggle: Kanban vs List */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px',
                backgroundColor: viewMode === 'kanban' ? 'white' : 'transparent',
                color: viewMode === 'kanban' ? 'var(--primary)' : '#64748b',
                fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: viewMode === 'kanban' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <LayoutGrid size={15} /> Tablero Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px',
                backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                color: viewMode === 'list' ? 'var(--primary)' : '#64748b',
                fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <List size={15} /> Vista Lista
            </button>
          </div>

          <button
            onClick={fetchOrders}
            style={{ padding: '8px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600' }}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {/* ==========================================
          VIEW 1: KANBAN BOARD
      ========================================== */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
          {KANBAN_COLUMNS.map(col => {
            const colOrders = orders.filter(o => col.statuses.includes(o.status));
            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  borderTop: `4px solid ${col.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 200px)',
                  overflow: 'hidden'
                }}
              >
                {/* Column Header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{col.title}</strong>
                  <span style={{ backgroundColor: col.badgeBg, color: col.badgeColor, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards List */}
                <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '0.8rem' }}>
                      Sin pedidos en esta etapa
                    </div>
                  ) : (
                    colOrders.map(order => {
                      const hasGps = Boolean(order.customerLocation?.lat && order.customerLocation?.lng);
                      const wazeLink = hasGps ? `https://waze.com/ul?ll=${order.customerLocation!.lat},${order.customerLocation!.lng}&navigate=yes` : null;

                      return (
                        <div
                          key={order.id}
                          style={{
                            backgroundColor: 'white',
                            borderRadius: '10px',
                            padding: '14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>#ORD-{order.orderNumber}</strong>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{order.customerName}</div>
                            </div>

                            {/* Consumption Badge */}
                            {order.consumptionMode === 'dine_in' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#ffedd5', color: '#ea580c' }}>
                                Mesa #{order.tableNumber || 1}
                              </span>
                            ) : order.deliveryMethod === 'delivery' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                Delivery Express
                              </span>
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#475569' }}>
                                Para Llevar
                              </span>
                            )}
                          </div>

                          {/* Items summary */}
                          <div style={{ fontSize: '0.75rem', color: '#64748b', borderTop: '1px dashed #f1f5f9', paddingTop: '6px' }}>
                            {(order.items || []).map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{it.quantity}x {it.productName}</span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', paddingTop: '4px' }}>
                            <span>Total:</span>
                            <span>₡{Number(order.total).toLocaleString('es-CR')}</span>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              style={{ flex: 1, padding: '6px 10px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            >
                              <Eye size={13} /> Ver
                            </button>

                            {col.id === 'nuevos' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'procesando')}
                                style={{ flex: 1, padding: '6px 10px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                Cocinar
                              </button>
                            )}

                            {col.id === 'cocina' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'listo_entrega')}
                                style={{ flex: 1, padding: '6px 10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                Listo
                              </button>
                            )}

                            {col.id === 'listo' && (
                              <button
                                onClick={() => handleStatusChange(order.id, 'entregado')}
                                style={{ flex: 1, padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                Entregar
                              </button>
                            )}

                            {wazeLink && (
                              <a
                                href={wazeLink}
                                target="_blank"
                                rel="noreferrer"
                                style={{ padding: '6px 8px', backgroundColor: '#0284c7', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}
                                title="Abrir en Waze"
                              >
                                <Navigation size={12} /> Waze
                              </a>
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
        </div>
      )}

      {/* ==========================================
          VIEW 2: TRADITIONAL LIST TABLE
      ========================================== */}
      {viewMode === 'list' && (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}># Pedido</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}>Cliente</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}>Total</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}>Modalidad</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}>Estado</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem' }}>Pago</th>
                <th style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const statusStyle = STATUS_CONFIG[order.status] || STATUS_CONFIG.pedido_recibido;
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      #ORD-{order.orderNumber}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerPhone || 'Sin teléfono'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                      ₡{Number(order.total).toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      {order.consumptionMode === 'dine_in' ? `Mesa #${order.tableNumber || 1}` : order.deliveryMethod === 'delivery' ? 'Delivery Express' : 'Retiro en Local'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: '0.8rem', fontWeight: '600' }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3', color: order.paymentStatus === 'paid' ? '#15803d' : '#854d0e' }}>
                        {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}
                      >
                        <Eye size={14} /> Ver Detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          ORDER DETAILS & DRIVER DISPATCH MODAL WITH MAP
      ========================================== */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>Pedido #ORD-{selectedOrder.orderNumber}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Registrado el {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('es-CR') : 'Hoy'}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            </div>

            {/* Customer & Delivery Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong>Cliente:</strong> {selectedOrder.customerName}</div>
              <div><strong>Teléfono:</strong> {selectedOrder.customerPhone || 'No registrado'}</div>
              <div><strong>Modalidad:</strong> {selectedOrder.consumptionMode === 'dine_in' ? `En Mesa (#${selectedOrder.tableNumber || 1})` : selectedOrder.deliveryMethod === 'delivery' ? 'Delivery Express' : 'Retiro en Local'}</div>
              <div><strong>Método de Pago:</strong> {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus})</div>
              {selectedOrder.customerAddress && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Dirección:</strong> {selectedOrder.customerAddress}
                </div>
              )}
            </div>

            {/* Interactive Embedded Map View (Leaflet OpenStreetMap) */}
            {selectedOrder.customerLocation?.lat && selectedOrder.customerLocation?.lng && (
              <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#2563eb" /> Mapa de Ubicación Exacta
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`https://waze.com/ul?ll=${selectedOrder.customerLocation.lat},${selectedOrder.customerLocation.lng}&navigate=yes`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0284c7', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <Navigation size={12} /> Abrir en Waze
                    </a>
                    <a
                      href={selectedOrder.customerLocation.mapsUrl || `https://maps.google.com/?q=${selectedOrder.customerLocation.lat},${selectedOrder.customerLocation.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#16a34a', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <MapPin size={12} /> Google Maps
                    </a>
                  </div>
                </div>
                
                {/* Embed Map Iframe */}
                <iframe
                  title="Mapa de Entrega"
                  width="100%"
                  height="180"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${selectedOrder.customerLocation.lat},${selectedOrder.customerLocation.lng}&z=15&output=embed`}
                />
              </div>
            )}

            {/* Itemized Products */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Platillos / Productos:</h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '8px 12px' }}>Producto</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px' }}>{item.productName}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>₡{Number(item.totalPrice).toLocaleString('es-CR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                Total a Cobrar: ₡{Number(selectedOrder.total).toLocaleString('es-CR')}
              </div>
            </div>

            {/* Dispatch to Driver Section */}
            {selectedOrder.deliveryMethod === 'delivery' && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bike size={16} /> Despachar a Motorizado / Repartidor
                </h4>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={dispatchingDriverId}
                    onChange={(e) => setDispatchingDriverId(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: '600' }}
                  >
                    <option value="">-- Seleccionar Repartidor --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDispatchToDriver(selectedOrder.id, dispatchingDriverId)}
                    disabled={dispatching || !dispatchingDriverId}
                    style={{ padding: '8px 14px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Send size={14} /> {dispatching ? 'Despachando...' : 'Enviar por WhatsApp'}
                  </button>
                </div>
              </div>
            )}

            {/* Advance Status Controls */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Cambiar Estado del Pedido:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'pedido_recibido')}
                  style={{ padding: '8px 4px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  Recibido
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'procesando')}
                  style={{ padding: '8px 4px', backgroundColor: '#fefce8', color: '#a16207', border: '1px solid #fef08a', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  En Cocina
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'listo_entrega')}
                  style={{ padding: '8px 4px', backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  Listo
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'entregado')}
                  style={{ padding: '8px 4px', backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  Entregado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
