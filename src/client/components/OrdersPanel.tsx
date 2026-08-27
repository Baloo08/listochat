import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { ShoppingBag, CheckCircle, Clock, Truck, XCircle, Phone, Search, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';

interface OrderItem {
  id?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  whatsappJid?: string;
  source: 'store' | 'whatsapp' | 'manual';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'sinpe' | 'transfer' | 'cash' | 'card';
  paymentStatus: 'pending' | 'proof_sent' | 'paid' | 'refunded';
  paymentReference?: string;
  notes?: string;
  deliveryMethod: 'pickup' | 'delivery';
  createdAt: string;
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState<{ [key: string]: string }>({});

  const api = useApi();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/orders?status=${statusFilter}` : '/api/orders';
      const data = await api.get(url);
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err) {
      alert('Error actualizando estado de la orden');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    const ref = paymentRefInput[orderId] || 'Verificado manualmente';
    try {
      await api.post(`/api/orders/${orderId}/confirm-payment`, { reference: ref });
      await loadOrders();
    } catch (err) {
      alert('Error confirmando pago');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Gestión de Pedidos y Órdenes</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Monitorea las ventas de tu tienda virtual y compras por WhatsApp</p>
        </div>

        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'white', fontWeight: '500' }}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="preparing">En preparación</option>
          <option value="shipped">En camino / Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}># ORDEN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CLIENTE</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ORIGEN</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>TOTAL</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PAGO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ESTADO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando órdenes...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay órdenes registradas aún. Los pedidos de tus clientes aparecerán aquí.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <React.Fragment key={order.id}>
                  <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => toggleExpand(order.id)}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                      #{order.orderNumber || order.id.slice(0, 6)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600' }}>{order.customerName || 'Cliente'}</div>
                      {order.customerPhone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerPhone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: order.source === 'whatsapp' ? '#dcfce7' : '#eff6ff', color: order.source === 'whatsapp' ? '#166534' : '#1e40af' }}>
                        {order.source === 'whatsapp' ? 'WhatsApp' : 'Tienda'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                      ₡{parseFloat(String(order.total || 0)).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '3px 8px', 
                        borderRadius: '10px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                        color: order.paymentStatus === 'paid' ? '#166534' : '#92400e'
                      }}>
                        {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <select 
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.8rem', backgroundColor: 'white' }}
                      >
                        <option value="pending">Pendiente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="shipped">En camino</option>
                        <option value="delivered">Entregado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {order.customerPhone && (
                        <a 
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: '#16a34a', marginRight: '10px', textDecoration: 'none' }}
                          title="Contactar al cliente por WhatsApp"
                        >
                          <Phone size={16} />
                        </a>
                      )}
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {expandedOrderId === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                      <td colSpan={7} style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Detalle de Productos</h4>
                            {order.items && order.items.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {order.items.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                    <span>{item.quantity}x {item.productName} {item.variantName ? `(${item.variantName})` : ''}</span>
                                    <span style={{ fontWeight: '600' }}>₡{(item.totalPrice || item.unitPrice * item.quantity).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay items detallados</div>
                            )}

                            {order.notes && (
                              <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
                                <strong>Notas del cliente:</strong> {order.notes}
                              </div>
                            )}
                            {order.customerAddress && (
                              <div style={{ marginTop: '6px', fontSize: '0.85rem' }}>
                                <strong>Dirección de entrega:</strong> {order.customerAddress}
                              </div>
                            )}
                          </div>

                          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Método de Pago</h4>
                            <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                              <strong>Método:</strong> {order.paymentMethod?.toUpperCase() || 'SINPE'}
                            </div>
                            {order.paymentReference && (
                              <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                                <strong>Comprobante:</strong> {order.paymentReference}
                              </div>
                            )}

                            {order.paymentStatus !== 'paid' && (
                              <button 
                                onClick={() => handleConfirmPayment(order.id)}
                                style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', marginTop: '5px' }}
                              >
                                ✓ Confirmar Pago Recibido
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
