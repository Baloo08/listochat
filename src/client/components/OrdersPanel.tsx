import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, Truck, Package, XCircle, Eye, MessageCircle, AlertCircle, RefreshCw, Send, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Order, OrderStatus } from '../../shared/types';

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 10000); // Polling every 10s for new orders
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

  const handleConfirmPayment = async (orderId: string) => {
    try {
      await api.post(`/api/orders/${orderId}/confirm-payment`, {
        reference: 'Confirmado por Administrador',
        notifyCustomer: true
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: 'paid' } : null);
      }
    } catch (err) {
      alert('Error al confirmar pago');
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

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'new') return o.status === 'pedido_recibido' || o.status === 'pending';
    return o.status === filterStatus;
  });

  const newOrdersCount = orders.filter(o => o.status === 'pedido_recibido' || o.status === 'pending').length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel de órdenes...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Gestión de Pedidos</h2>
            {newOrdersCount > 0 && (
              <span style={{ backgroundColor: '#2563eb', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {newOrdersCount} {newOrdersCount === 1 ? 'nuevo' : 'nuevos'}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Trazabilidad, estados y notificaciones automáticas por WhatsApp a los clientes
          </p>
        </div>

        <button
          onClick={fetchOrders}
          style={{ padding: '8px 14px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setFilterStatus('all')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: filterStatus === 'all' ? 'var(--primary)' : 'var(--surface)', color: filterStatus === 'all' ? 'white' : 'var(--text)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Todos ({orders.length})
        </button>

        <button
          onClick={() => setFilterStatus('new')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: filterStatus === 'new' ? '#2563eb' : 'var(--surface)', color: filterStatus === 'new' ? 'white' : 'var(--text)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Nuevos ({newOrdersCount})
        </button>

        <button
          onClick={() => setFilterStatus('procesando')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: filterStatus === 'procesando' ? '#a16207' : 'var(--surface)', color: filterStatus === 'procesando' ? 'white' : 'var(--text)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          En Preparación
        </button>

        <button
          onClick={() => setFilterStatus('listo_entrega')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: filterStatus === 'listo_entrega' ? '#7e22ce' : 'var(--surface)', color: filterStatus === 'listo_entrega' ? 'white' : 'var(--text)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Listos para Entrega
        </button>

        <button
          onClick={() => setFilterStatus('entregado')}
          style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: filterStatus === 'entregado' ? '#15803d' : 'var(--surface)', color: filterStatus === 'entregado' ? 'white' : 'var(--text)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          Entregados
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <ShoppingCart size={40} color="var(--text-muted)" style={{ margin: '0 auto 10px auto' }} />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No hay pedidos en esta sección.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Orden</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Cliente</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Entrega</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Estado</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Pago</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const isNew = order.status === 'pedido_recibido' || order.status === 'pending';
                const statusStyle = STATUS_CONFIG[order.status] || { label: order.status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };

                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isNew ? '#f0f9ff' : 'transparent',
                      borderLeft: isNew ? '4px solid #2563eb' : 'none'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>
                      #ORD-{order.orderNumber}
                      {isNew && <span style={{ marginLeft: '6px', fontSize: '0.65rem', backgroundColor: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Nuevo</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                      {order.customerPhone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customerPhone}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                      ₡{Number(order.total).toLocaleString('es-CR')}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      {order.consumptionMode === 'dine_in' ? `🍽️ Mesa #${order.tableNumber || 1}` : order.deliveryMethod === 'delivery' ? '🛵 Domicilio' : '🏪 Retiro Local'}
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
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600' }}
                        >
                          <Eye size={14} /> Ver Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ==========================================
          ORDER DETAILS & STATUS MANAGEMENT MODAL
      ========================================== */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            
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
              <div><strong>Modalidad / Entrega:</strong> {selectedOrder.consumptionMode === 'dine_in' ? `🍽️ En Mesa #${selectedOrder.tableNumber || 1}` : selectedOrder.deliveryMethod === 'delivery' ? '🛵 A Domicilio' : '🏪 Retiro en Tienda'}</div>
              <div><strong>Método de Pago:</strong> {selectedOrder.paymentMethod.toUpperCase()} ({selectedOrder.paymentStatus})</div>
              {selectedOrder.customerAddress && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Dirección de Entrega:</strong> {selectedOrder.customerAddress}
                </div>
              )}
              {selectedOrder.customerLocation?.mapsUrl && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Ubicación GPS:</strong>{' '}
                  <a
                    href={selectedOrder.customerLocation.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    📍 Abrir Coordenadas en Google Maps
                  </a>
                </div>
              )}
              {selectedOrder.paymentReference && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Comprobante / Referencia:</strong> {selectedOrder.paymentReference}
                </div>
              )}
              {selectedOrder.notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Notas:</strong> {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Itemized Products */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold' }}>Productos Solicitados:</h4>
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

            {/* Status Change Controls & WhatsApp Notification */}
            <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '10px', border: '1px solid #bae6fd', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', color: '#0369a1' }}>
                Cambiar Estado del Pedido:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {[
                  { key: 'pedido_aceptado', label: '✅ Aceptar' },
                  { key: 'procesando', label: '🍳 Preparando' },
                  { key: 'listo_entrega', label: '🛵 Listo' },
                  { key: 'entregado', label: '🎉 Entregado' },
                  { key: 'cancelado', label: '❌ Cancelar' }
                ].map(st => (
                  <button
                    key={st.key}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(selectedOrder.id, st.key as any)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: selectedOrder.status === st.key ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      backgroundColor: selectedOrder.status === st.key ? '#0284c7' : 'white',
                      color: selectedOrder.status === st.key ? 'white' : '#1e293b',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#0369a1', cursor: 'pointer', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
                <span>🔔 Enviar notificación automática por WhatsApp al cliente con cada cambio de estado</span>
              </label>
            </div>

            {/* Direct WhatsApp button */}
            {selectedOrder.customerPhone && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selectedOrder.customerName}, nos comunicamos de la tienda con respecto a tu pedido #ORD-${selectedOrder.orderNumber}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, padding: '10px', backgroundColor: '#25d366', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <MessageCircle size={16} /> Chatear por WhatsApp con el Cliente
                </a>

                {selectedOrder.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => handleConfirmPayment(selectedOrder.id)}
                    style={{ padding: '10px 16px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={16} /> Marcar Pagado
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
