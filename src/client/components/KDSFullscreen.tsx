import React, { useState, useEffect } from 'react';
import { LayoutGrid, RefreshCw, Maximize, Minimize, Utensils, CheckCircle, Clock, Navigation, Bike, ArrowLeft } from 'lucide-react';
import { Order, OrderStatus } from '../../shared/types';

export default function KDSFullscreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      console.error('KDS Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus, notifyCustomer: true })
      });
      await fetchOrders();
    } catch (e) {
      alert('Error cambiando estado');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const COLUMNS = [
    { id: 'nuevos', title: '1. NUEVOS / RECIBIDOS', statuses: ['pedido_recibido', 'pending'], color: '#3b82f6', nextStatus: 'procesando', nextLabel: '🔥 Cocinar' },
    { id: 'cocina', title: '2. EN PREPARACIÓN', statuses: ['pedido_aceptado', 'confirmed', 'procesando', 'preparing'], color: '#f59e0b', nextStatus: 'listo_entrega', nextLabel: '⚡ Listo' },
    { id: 'listo', title: '3. LISTO / DESPACHO', statuses: ['listo_entrega'], color: '#8b5cf6', nextStatus: 'entregado', nextLabel: '✅ Entregar' },
    { id: 'en_camino', title: '4. EN CAMINO (DELIVERY)', statuses: ['en_camino', 'shipped'], color: '#0284c7', nextStatus: 'entregado', nextLabel: '✅ Entregado' },
    { id: 'entregados', title: '5. COMPLETADOS', statuses: ['entregado', 'delivered'], color: '#10b981' }
  ];

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando pantalla de cocina KDS...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top KDS Bar */}
      <header style={{ padding: '12px 20px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => window.location.href = '/'}
            style={{ padding: '6px 12px', backgroundColor: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}
          >
            <ArrowLeft size={14} /> Volver al Panel
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={20} color="#f97316" />
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>
              Monitor de Comandas & Cocina (KDS)
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchOrders}
            style={{ padding: '8px 14px', backgroundColor: '#1f2937', color: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            <RefreshCw size={15} /> Refrescar
          </button>

          <button
            onClick={toggleFullscreen}
            style={{ padding: '8px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </header>

      {/* Kanban Grid */}
      <main style={{ flex: 1, padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', overflowX: 'auto' }}>
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => col.statuses.includes(o.status));

          return (
            <div
              key={col.id}
              style={{
                backgroundColor: '#111827',
                borderRadius: '10px',
                border: '1px solid #1f2937',
                borderTop: `4px solid ${col.color}`,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 85px)',
                overflow: 'hidden'
              }}
            >
              {/* Column Header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a2234' }}>
                <strong style={{ fontSize: '0.8rem', color: '#e5e7eb', letterSpacing: '0.5px' }}>{col.title}</strong>
                <span style={{ backgroundColor: `${col.color}25`, color: col.color, padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {colOrders.length}
                </span>
              </div>

              {/* Column Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#4b5563', fontSize: '0.75rem' }}>
                    Sin comandas
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div
                      key={order.id}
                      style={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        padding: '12px',
                        border: '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'white' }}>#ORD-{order.orderNumber}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.customerName}</div>
                        </div>

                        {order.consumptionMode === 'dine_in' ? (
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#ea580c', color: 'white' }}>
                            Mesa #{order.tableNumber || 1}
                          </span>
                        ) : order.deliveryMethod === 'delivery' ? (
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#0284c7', color: 'white' }}>
                            Delivery
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#475569', color: 'white' }}>
                            Llevar
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div style={{ backgroundColor: '#0f172a', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #334155' }}>
                        {(order.items || []).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#f1f5f9', fontWeight: 'bold', marginBottom: '2px' }}>
                            <span>{it.quantity}x {it.productName}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                          Nota: {order.notes}
                        </div>
                      )}

                      {/* Advance Button */}
                      {col.nextStatus && (
                        <button
                          onClick={() => handleStatusChange(order.id, col.nextStatus as any)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: col.color,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {col.nextLabel}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
