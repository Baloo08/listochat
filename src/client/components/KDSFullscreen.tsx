import React, { useState, useEffect } from 'react';
import { Utensils, Clock, CheckCircle, Flame, Zap, Truck, Maximize, Minimize, RefreshCw, Eye, X, MapPin, Phone, MessageSquare, AlertCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../shared/types';
import { useApi } from '../hooks/useApi';

export default function KDSFullscreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
      title: 'Nuevos / Recibidos',
      statuses: ['pedido_recibido', 'pending'],
      borderColor: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8',
      actionBtn: { label: '🔥 En Cocina', nextStatus: 'procesando' as OrderStatus, color: '#f59e0b' }
    },
    {
      id: 'cocina',
      title: 'En Preparación / Cocina',
      statuses: ['pedido_aceptado', 'confirmed', 'procesando', 'preparing'],
      borderColor: '#f59e0b',
      badgeBg: '#fefce8',
      badgeColor: '#a16207',
      actionBtn: { label: '⚡ Listo', nextStatus: 'listo_entrega' as OrderStatus, color: '#8b5cf6' }
    },
    {
      id: 'listo',
      title: 'Listo para Entrega / Retiro',
      statuses: ['listo_entrega'],
      borderColor: '#8b5cf6',
      badgeBg: '#faf5ff',
      badgeColor: '#7e22ce',
      actionBtn: { label: '🛵 En Camino', nextStatus: 'en_camino' as OrderStatus, color: '#0284c7' }
    },
    {
      id: 'en_camino',
      title: 'En Camino (Delivery)',
      statuses: ['en_camino', 'shipped'],
      borderColor: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      actionBtn: { label: '✅ Entregar', nextStatus: 'entregado' as OrderStatus, color: '#10b981' }
    },
    {
      id: 'entregados',
      title: 'Entregados Hoy',
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
          const colOrders = orders.filter(o => col.statuses.includes(o.status));

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
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                              #ORD-{order.orderNumber}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f1f5f9', marginTop: '2px' }}>
                              {order.customerName}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            {order.consumptionMode === 'dine_in' ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#ea580c', color: 'white' }}>
                                Mesa #{order.tableNumber || 1}
                              </span>
                            ) : order.deliveryMethod === 'delivery' ? (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#0284c7', color: 'white' }}>
                                Delivery
                              </span>
                            ) : (
                              <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#64748b', color: 'white' }}>
                                Para Llevar
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
                          <div style={{ fontSize: '0.75rem', color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            📝 {order.notes}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: '#34d399', paddingTop: '2px' }}>
                          <span>Total:</span>
                          <span>₡{Number(order.total).toLocaleString('es-CR')}</span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            style={{ padding: '8px 10px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            title="Ver detalles completos"
                          >
                            <Eye size={13} /> Detalle
                          </button>

                          {col.actionBtn && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, col.actionBtn!.nextStatus)}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                backgroundColor: col.actionBtn.color,
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.8rem'
                              }}
                            >
                              {col.actionBtn.label}
                            </button>
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
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>📞 {selectedOrder.customerPhone}</div>
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
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <strong>Modalidad:</strong> {selectedOrder.consumptionMode === 'dine_in' ? `Comer en Mesa #${selectedOrder.tableNumber || 1}` : selectedOrder.deliveryMethod === 'delivery' ? 'Envío Delivery' : 'Para Llevar'}
              </div>
              {selectedOrder.customerAddress && (
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <strong>Dirección:</strong> {selectedOrder.customerAddress}
                </div>
              )}
              {selectedOrder.notes && (
                <div style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                  <strong>Notas del Cliente:</strong> {selectedOrder.notes}
                </div>
              )}
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <strong>Pago:</strong> {selectedOrder.paymentMethod?.toUpperCase()} ({selectedOrder.paymentStatus === 'paid' ? '✅ Pagado' : '💰 Pendiente'})
              </div>
            </div>

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

            {/* Quick stage advance buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'procesando' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                🔥 En Cocina
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'listo_entrega' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                ⚡ Listo
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'en_camino' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                🛵 En Camino
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'entregado' as OrderStatus)}
                style={{ padding: '10px 6px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
              >
                ✅ Entregado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
