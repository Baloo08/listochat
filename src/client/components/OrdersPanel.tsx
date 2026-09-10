import React, { useState, useEffect } from 'react';
import { ShoppingCart, Camera, Image, CheckCircle2, Clock, CheckCircle, Truck, Package, XCircle, Eye, MessageCircle, AlertCircle, RefreshCw, Send, Check, Utensils, LayoutGrid, List, Navigation, Bike, MapPin, User, Phone, Store, Maximize, ExternalLink, Building2, Zap, CreditCard, Smartphone, DollarSign, FileText, Download, Copy } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { Order, OrderStatus, DeliveryDriver } from '../../shared/types';
import InteractiveMapPicker from './InteractiveMapPicker';

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [customStages, setCustomStages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [updatingProofId, setUpdatingProofId] = useState<string | null>(null);
  const [dispatchingDriverId, setDispatchingDriverId] = useState<string>('');
  const [dispatching, setDispatching] = useState(false);
  const [emittingInvoiceId, setEmittingInvoiceId] = useState<string | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);
  const [markingManualInvoice, setMarkingManualInvoice] = useState(false);
  const [manualRefInput, setManualRefInput] = useState('');
  const [showManualInvoiceForm, setShowManualInvoiceForm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const fetchBranches = async () => {
    try {
      const data = await api.get('/api/branches');
      if (Array.isArray(data)) setBranches(data);
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const data = await api.get('/api/store');
      if (data?.customStages) setCustomStages(data.customStages);
    } catch (err) {
      console.error('Error fetching store settings in OrdersPanel:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
    fetchBranches();
    fetchStoreSettings();
    const timer = setInterval(fetchOrders, 6000);
    return () => clearInterval(timer);
  }, []);


  const handleProofStatusChange = async (orderId: string, proofStatus: 'pending' | 'received' | 'verified') => {
    setUpdatingProofId(orderId);
    try {
      await api.put(`/api/orders/${orderId}/proof-status`, { proofStatus });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          paymentProofStatus: proofStatus,
          paymentStatus: proofStatus === 'verified' ? 'paid' : proofStatus === 'received' ? 'proof_sent' : 'pending'
        } : null);
      }
    } catch (e: any) {
      alert('Error al actualizar estado del comprobante: ' + (e.message || 'Verifique'));
    } finally {
      setUpdatingProofId(null);
    }
  };

  const handleConfirmCashPayment = async (orderId: string) => {
    setConfirmingPaymentId(orderId);
    try {
      await api.post(`/api/orders/${orderId}/confirm-payment`, {
        reference: 'Efectivo recibido en establecimiento',
        notifyCustomer
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          paymentStatus: 'paid',
          paymentReference: 'Efectivo recibido en establecimiento'
        } : null);
      }
      alert('Pago en efectivo confirmado exitosamente.');
    } catch (e: any) {
      alert('Error al confirmar pago en efectivo: ' + (e?.message || 'Error'));
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  const handleEmitInvoice = async (orderId: string) => {
    setEmittingInvoiceId(orderId);
    try {
      const res: any = await api.post(`/api/almendro/emit-order-invoice/${orderId}`, {});
      alert(`Factura emitida exitosamente en Almendro. Clave: ${res.numericKey}`);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          billingInfo: {
            ...(prev.billingInfo || { requiresInvoice: true }),
            numericKey: res.numericKey,
            pdfUrl: res.pdfUrl,
            invoiceStatus: 'issued',
            issuedAt: new Date().toISOString()
          }
        } : null);
      }
    } catch (e: any) {
      alert('Error al emitir factura electrónica: ' + (e?.message || 'Verifique configuración'));
    } finally {
      setEmittingInvoiceId(null);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullTaxData = (billing: any) => {
    if (!billing) return;
    const typeMap: Record<string, string> = {
      '01': 'Cédula Física',
      '02': 'Cédula Jurídica',
      '03': 'DIMEX',
      '04': 'NITE'
    };
    const orderNum = selectedOrder?.orderNumber ? `#${selectedOrder.orderNumber}` : selectedOrder?.id ? `#${selectedOrder.id.slice(0, 8)}` : '';
    const totalFormatted = selectedOrder?.total != null ? `${selectedOrder.currency === 'USD' ? '$' : '₡'}${Number(selectedOrder.total).toLocaleString()}` : '';
    const text = `--- DATOS PARA FACTURA ELECTRÓNICA ---
Cédula: ${billing.idNumber || 'No especificada'}
Tipo de Cédula: ${typeMap[billing.idType] || billing.idType || 'Física'}
Razón Social: ${billing.legalName || selectedOrder?.customerName || ''}
Correo Electrónico: ${billing.email || selectedOrder?.customerEmail || ''}
${orderNum ? `Orden: ${orderNum}\n` : ''}${totalFormatted ? `Monto Total: ${totalFormatted}\n` : ''}---------------------------------------`;
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMarkManualInvoice = async (orderId: string) => {
    if (!orderId) return;
    setMarkingManualInvoice(true);
    try {
      const res: any = await api.put(`/api/orders/${orderId}/manual-invoice`, {
        externalInvoiceReference: manualRefInput.trim() || undefined
      });
      alert(res?.message || 'Orden marcada como facturada en su sistema exitosamente.');
      setShowManualInvoiceForm(false);
      setManualRefInput('');
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          billingInfo: {
            ...(prev.billingInfo || { requiresInvoice: true }),
            invoiceStatus: 'issued',
            issuedManually: true,
            externalInvoiceReference: manualRefInput.trim() || 'Manual',
            issuedAt: new Date().toISOString()
          }
        } : null);
      }
    } catch (err: any) {
      alert('Error al marcar orden como facturada: ' + (err?.message || 'Error desconocido'));
    } finally {
      setMarkingManualInvoice(false);
    }
  };

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
      alert(`¡Pedido despachado por WhatsApp a ${res.driverName} y cambiado a estado 'En Camino'!`);
      await fetchOrders();
      if (selectedOrder) setSelectedOrder(null);
    } catch (e: any) {
      alert('Error al despachar: ' + (e.message || 'Verifique'));
    } finally {
      setDispatching(false);
    }
  };

  const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pedido_recibido: { label: customStages.fase_1 || 'Pedido Recibido', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    pending: { label: customStages.fase_1 || 'Pedido Recibido', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    pedido_aceptado: { label: customStages.fase_2 || 'Pedido Aceptado', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    confirmed: { label: customStages.fase_2 || 'Pedido Aceptado', bg: '#eef2ff', color: '#4338ca', border: '#c7d2fe' },
    procesando: { label: customStages.fase_2 || 'En Preparación', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    preparing: { label: customStages.fase_2 || 'En Preparación', bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    listo_entrega: { label: customStages.fase_3 || 'Listo para Entregar', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
    en_camino: { label: customStages.fase_4 || 'En Camino', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    shipped: { label: customStages.fase_4 || 'En Camino', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    entregado: { label: customStages.fase_5 || 'Entregado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    delivered: { label: customStages.fase_5 || 'Entregado', bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    cancelado: { label: 'Cancelado', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  };

  const KANBAN_COLUMNS = [
    {
      id: 'nuevos',
      title: customStages.fase_1 || 'Nuevos / Recibidos',
      statuses: ['pedido_recibido', 'pending'],
      borderColor: '#3b82f6',
      badgeBg: '#eff6ff',
      badgeColor: '#1d4ed8'
    },
    {
      id: 'cocina',
      title: customStages.fase_2 || 'En Cocina / Preparación',
      statuses: ['pedido_aceptado', 'confirmed', 'procesando', 'preparing'],
      borderColor: '#f59e0b',
      badgeBg: '#fefce8',
      badgeColor: '#a16207'
    },
    {
      id: 'listo',
      title: customStages.fase_3 || 'Listo / Para Despacho',
      statuses: ['listo_entrega'],
      borderColor: '#8b5cf6',
      badgeBg: '#faf5ff',
      badgeColor: '#7e22ce'
    },
    {
      id: 'en_camino',
      title: customStages.fase_4 || 'En Camino (Delivery)',
      statuses: ['en_camino', 'shipped'],
      borderColor: '#0284c7',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1'
    },
    {
      id: 'entregados',
      title: customStages.fase_5 || 'Entregados',
      statuses: ['entregado', 'delivered'],
      borderColor: '#10b981',
      badgeBg: '#f0fdf4',
      badgeColor: '#15803d'
    }
  ];

  const filteredOrders = orders.filter(o => {
    if (selectedBranchId !== 'all' && (o as any).branchId !== selectedBranchId) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'new') return o.status === 'pedido_recibido' || o.status === 'pending';
    return o.status === filterStatus;
  });

  const newOrdersCount = filteredOrders.filter(o => o.status === 'pedido_recibido' || o.status === 'pending').length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando panel de comandas y pedidos...</div>;
  }

  return (
    <div>
      {/* Top Header */}
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

        {/* View Mode Toggle, Branch Selector & Fullscreen KDS Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {branches.length >= 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '5px 10px', boxShadow: 'var(--shadow-sm)' }}>
              <Building2 size={16} color="var(--primary)" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ border: 'none', background: 'none', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Todas las Sedes ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>Sede: {b.name} {b.isMain ? '(Matriz)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <a
            href={selectedBranchId !== 'all' ? `/kds?branch=${selectedBranchId}` : '/kds'}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '8px 14px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
          >
            <Maximize size={15} /> Pantalla Completa (KDS Cocina)
          </a>

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', alignItems: 'flex-start' }}>
          {KANBAN_COLUMNS.map(col => {
            const colOrders = filteredOrders.filter(o => col.statuses.includes(o.status));
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
                  <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{col.title}</strong>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>#ORD-{order.orderNumber}</strong>
                                
                                {/* Payment Method Badge */}
                                {order.paymentMethod === 'sinpe_tilopay' ? (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Zap size={10} /> SINPE Auto {order.paymentStatus === 'paid' ? 'Verif.' : 'Pend.'}
                                  </span>
                                ) : order.paymentMethod === 'card' || order.paymentMethod === 'tilopay' ? (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <CreditCard size={10} /> Tarjeta {order.paymentStatus === 'paid' ? 'Pagado' : 'Pend.'}
                                  </span>
                                ) : order.paymentMethod === 'sinpe' ? (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Smartphone size={10} /> SINPE {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'proof_sent' ? 'Comp.' : ''}
                                  </span>
                                ) : order.paymentMethod === 'transfer' ? (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#faf5ff', color: '#7e22ce', border: '1px solid #e9d5ff', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Building2 size={10} /> Transf.
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#fefce8', color: '#a16207', border: '1px solid #fef08a', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <DollarSign size={10} /> Contra Entrega
                                  </span>
                                )}
                                {(order as any).branchName && (
                                  <span style={{ fontSize: '0.68rem', padding: '1px 6px', backgroundColor: '#f3e8ff', color: '#6b21a8', borderRadius: '4px', fontWeight: 'bold' }}>
                                    {(order as any).branchName}
                                  </span>
                                )}
                                {order.billingInfo?.requiresInvoice && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    padding: '1px 6px',
                                    backgroundColor: order.billingInfo.numericKey ? '#ecfdf5' : '#faf5ff',
                                    color: order.billingInfo.numericKey ? '#047857' : '#7e22ce',
                                    border: `1px solid ${order.billingInfo.numericKey ? '#a7f3d0' : '#e9d5ff'}`,
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }} title={order.billingInfo.numericKey ? `Factura Clave: ${order.billingInfo.numericKey}` : 'Factura solicitada'}>
                                    <FileText size={10} /> {order.billingInfo.numericKey ? 'Facturada' : 'Factura'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>{order.customerName}</div>
                            </div>

                            {/* Consumption Badge */}
                            {order.consumptionMode === 'dine_in' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#ffedd5', color: '#ea580c', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Utensils size={11} /> Mesa #{order.tableNumber || 1}
                              </span>
                            ) : order.deliveryMethod === 'delivery' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Bike size={11} /> Delivery
                              </span>
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Package size={11} /> Para Llevar
                              </span>
                            )}
                          </div>

                          {/* Items summary con diseño destacado para KDS y tarjetas */}
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {(!order.items || order.items.length === 0) ? (
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin detalles registrados</div>
                            ) : (
                              order.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#1e293b' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: '800', fontSize: '0.7rem', padding: '1px 5px', borderRadius: '4px' }}>
                                      {it.quantity}x
                                    </span>
                                    <span style={{ fontWeight: '600' }}>{it.productName}</span>
                                    {it.variantName && (
                                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({it.variantName})</span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' }}>
                                    ₡{Number(it.totalPrice || it.unitPrice * it.quantity).toLocaleString('es-CR')}
                                  </span>
                                </div>
                              ))
                            )}

                            {order.notes && (
                              <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #e2e8f0', fontSize: '0.72rem', color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FileText size={12} /> <span>Nota: {order.notes}</span>
                              </div>
                            )}
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
                              order.consumptionMode === 'dine_in' ? (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'entregado')}
                                  style={{ flex: 1, padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Utensils size={13} /> Servir
                                </button>
                              ) : order.deliveryMethod === 'delivery' ? (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'en_camino')}
                                  style={{ flex: 1, padding: '6px 10px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Bike size={13} /> En Camino
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'entregado')}
                                  style={{ flex: 1, padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                  <Package size={13} /> Entregar
                                </button>
                              )
                            )}

                            {col.id === 'en_camino' && (
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
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{order.customerName}</span>
                        {order.billingInfo?.requiresInvoice && (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            backgroundColor: order.billingInfo.numericKey ? '#ecfdf5' : '#faf5ff',
                            color: order.billingInfo.numericKey ? '#047857' : '#7e22ce',
                            border: `1px solid ${order.billingInfo.numericKey ? '#a7f3d0' : '#e9d5ff'}`,
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <FileText size={10} /> {order.billingInfo.numericKey ? 'Facturada' : 'Factura'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerPhone || 'Sin teléfono'}</div>
                      {order.items && order.items.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '4px', fontWeight: '500', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Package size={12} style={{ flexShrink: 0 }} /> <span>{order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                        </div>
                      )}
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
                      <span style={{
                        padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                        backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                        color: order.paymentStatus === 'paid' ? '#15803d' : '#854d0e',
                        display: 'inline-flex', alignItems: 'center', gap: '3px'
                      }}>
                        {order.paymentStatus === 'paid'
                          ? (order.paymentMethod === 'sinpe_tilopay'
                              ? <><Zap size={11} /> SINPE Verificado</>
                              : order.paymentMethod === 'card' || order.paymentMethod === 'tilopay'
                                ? <><CreditCard size={11} /> Tarjeta Verificada</>
                                : <><CheckCircle size={11} /> Pagado</>)
                          : (order.paymentMethod === 'sinpe_tilopay'
                              ? <><Zap size={11} /> SINPE Auto (Pend.)</>
                              : order.paymentMethod === 'card' || order.paymentMethod === 'tilopay'
                                ? <><CreditCard size={11} /> Tarjeta (Pendiente)</>
                                : order.paymentMethod.toUpperCase())}
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
          ORDER DETAILS & STATUS CORRECTION MODAL WITH MAP
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

            {/* Universal Status Selector (To fix mistakes / change status freely) */}
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>
                Cambiar / Corregir Estado del Pedido:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  disabled={updatingStatus}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #93c5fd', backgroundColor: 'white', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e3a8a' }}
                >
                  <option value="pedido_recibido">1. {customStages.fase_1 || 'Pedido Recibido'}</option>
                  <option value="procesando">2. {customStages.fase_2 || 'En Preparación / Cocina'}</option>
                  <option value="listo_entrega">3. {customStages.fase_3 || 'Listo para Entregar / Retirar'}</option>
                  {selectedOrder.deliveryMethod === 'delivery' && (
                    <option value="en_camino">4. {customStages.fase_4 || 'En Camino (Con Repartidor)'}</option>
                  )}
                  <option value="entregado">5. {customStages.fase_5 || 'Entregado con Éxito'}</option>
                  <option value="cancelado">6. Cancelado</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#1e40af', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                  />
                  <span>Notificar WhatsApp</span>
                </label>
              </div>
            </div>

            {/* Customer & Delivery Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong>Cliente:</strong> {selectedOrder.customerName}</div>
              <div><strong>Teléfono:</strong> {selectedOrder.customerPhone || 'No registrado'}</div>
              <div>
                <strong>Método de Pago:</strong>{' '}
                {selectedOrder.paymentMethod === 'sinpe_tilopay' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Zap size={13} color="#047857" /> SINPE Móvil Automático (Tilopay)</span>
                ) : selectedOrder.paymentMethod === 'card' || selectedOrder.paymentMethod === 'tilopay' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><CreditCard size={13} color="#047857" /> Tarjeta (Tilopay)</span>
                ) : selectedOrder.paymentMethod === 'sinpe' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Smartphone size={13} color="#1d4ed8" /> SINPE Móvil Manual</span>
                ) : selectedOrder.paymentMethod === 'transfer' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Building2 size={13} color="#7e22ce" /> Transferencia Bancaria</span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><DollarSign size={13} color="#a16207" /> Contra Entrega</span>
                )}
              </div>
              <div>
                <strong>Estado del Pago:</strong>{' '}
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 'bold',
                  backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                  color: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#854d0e',
                  display: 'inline-flex', alignItems: 'center', gap: '3px'
                }}>
                  {selectedOrder.paymentStatus === 'paid' ? (
                    <><CheckCircle size={12} /> Pago Verificado</>
                  ) : (
                    <><Clock size={12} /> Pendiente de Verificación</>
                  )}
                </span>
              </div>
              {selectedOrder.customerAddress && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Dirección:</strong> {selectedOrder.customerAddress}
                </div>
              )}
            </div>

            {/* Payment Proof & Manual Verification Actions */}
            <div style={{
              backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${selectedOrder.paymentStatus === 'paid' ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: selectedOrder.paymentStatus === 'paid' ? '#166534' : '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {selectedOrder.paymentMethod === 'sinpe' ? <Smartphone size={16} /> : selectedOrder.paymentMethod === 'card' || selectedOrder.paymentMethod === 'tilopay' ? <CreditCard size={16} /> : <DollarSign size={16} />}
                  Verificación de Pago: {selectedOrder.paymentMethod === 'sinpe' ? 'SINPE Móvil Manual' : selectedOrder.paymentMethod === 'card' || selectedOrder.paymentMethod === 'tilopay' ? 'Tarjeta Débito/Crédito (Tilopay)' : selectedOrder.paymentMethod === 'sinpe_tilopay' ? 'SINPE Automático (Tilopay)' : 'Efectivo / En Establecimiento'}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px',
                  backgroundColor: selectedOrder.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                  color: selectedOrder.paymentStatus === 'paid' ? '#15803d' : '#b45309'
                }}>
                  {selectedOrder.paymentStatus === 'paid' ? '✅ Pago Aprobado' : selectedOrder.paymentProofStatus === 'received' ? '📱 Comprobante Recibido' : '⏳ Pendiente de Pago'}
                </span>
              </div>

              {/* Reference number if exists */}
              {selectedOrder.paymentReference && (
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '8px' }}>
                  <strong>Referencia / Comprobante:</strong> {selectedOrder.paymentReference}
                </div>
              )}

              {/* Payment Proof Image Preview */}
              {selectedOrder.paymentProofUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="Comprobante de Pago"
                    onClick={() => setLightboxImageUrl(selectedOrder.paymentProofUrl || null)}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                    title="Click para ver en pantalla completa"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b' }}>Comprobante Adjunto por el Cliente</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Haz clic en la imagen o en el botón para inspeccionar el comprobante</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLightboxImageUrl(selectedOrder.paymentProofUrl || null)}
                    style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Eye size={13} /> Inspeccionar
                  </button>
                </div>
              ) : selectedOrder.paymentMethod === 'sinpe' && selectedOrder.paymentStatus !== 'paid' ? (
                <div style={{ fontSize: '0.78rem', color: '#b45309', fontStyle: 'italic', marginTop: '4px' }}>
                  ⚠️ El cliente seleccionó SINPE Móvil pero aún no ha adjuntado la captura del comprobante.
                </div>
              ) : null}

              {/* Action Buttons for Merchant Verification */}
              {selectedOrder.paymentStatus !== 'paid' && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {selectedOrder.paymentProofUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleProofStatusChange(selectedOrder.id, 'verified')}
                        disabled={updatingProofId === selectedOrder.id}
                        style={{ flex: 1, padding: '8px 12px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <CheckCircle size={14} /> {updatingProofId === selectedOrder.id ? 'Aprobando...' : 'Aprobar Comprobante (Marcar Pagado)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProofStatusChange(selectedOrder.id, 'pending')}
                        disabled={updatingProofId === selectedOrder.id}
                        style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Rechazar
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleConfirmCashPayment(selectedOrder.id)}
                    disabled={confirmingPaymentId === selectedOrder.id}
                    style={{ flex: 1, padding: '8px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <DollarSign size={14} /> {confirmingPaymentId === selectedOrder.id ? 'Confirmando...' : 'Confirmar Pago en Efectivo'}
                  </button>
                </div>
              )}
            </div>

            {/* Facturación Electrónica */}
            {selectedOrder.billingInfo?.requiresInvoice && (
              <div style={{
                backgroundColor: (selectedOrder.billingInfo.numericKey || selectedOrder.billingInfo.issuedManually) ? '#f0fdf4' : '#faf5ff',
                border: `1px solid ${(selectedOrder.billingInfo.numericKey || selectedOrder.billingInfo.issuedManually) ? '#86efac' : '#e9d5ff'}`,
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: (selectedOrder.billingInfo.numericKey || selectedOrder.billingInfo.issuedManually) ? '#166534' : '#6b21a8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} /> Datos de Facturación Electrónica
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => copyFullTaxData(selectedOrder.billingInfo)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 9px',
                        backgroundColor: copiedField === 'all' ? '#15803d' : '#f8fafc',
                        color: copiedField === 'all' ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      title="Copiar toda la información fiscal al portapapeles"
                    >
                      {copiedField === 'all' ? <Check size={13} /> : <Copy size={13} />}
                      {copiedField === 'all' ? '¡Ficha Copiada!' : 'Copiar Ficha Completa'}
                    </button>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px',
                      backgroundColor: selectedOrder.billingInfo.numericKey ? '#dcfce7' : selectedOrder.billingInfo.issuedManually ? '#dcfce7' : selectedOrder.billingInfo.invoiceStatus === 'failed' ? '#fee2e2' : '#f3e8ff',
                      color: selectedOrder.billingInfo.numericKey ? '#15803d' : selectedOrder.billingInfo.issuedManually ? '#15803d' : selectedOrder.billingInfo.invoiceStatus === 'failed' ? '#b91c1c' : '#7e22ce'
                    }}>
                      {selectedOrder.billingInfo.numericKey
                        ? '✅ Emitida en Hacienda'
                        : selectedOrder.billingInfo.issuedManually
                        ? `✅ Facturada en mi Sistema (${selectedOrder.billingInfo.externalInvoiceReference || 'Manual'})`
                        : selectedOrder.billingInfo.invoiceStatus === 'failed'
                        ? '❌ Falló Emisión'
                        : '⏳ Pendiente de Emisión'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div>
                      <strong>Cédula:</strong> {selectedOrder.billingInfo.idNumber || 'No registrada'}{' '}
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ({selectedOrder.billingInfo.idType === '02' ? 'Jurídica' : selectedOrder.billingInfo.idType === '03' ? 'DIMEX' : selectedOrder.billingInfo.idType === '04' ? 'NITE' : 'Física'})
                      </span>
                    </div>
                    {selectedOrder.billingInfo.idNumber && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.billingInfo.idNumber, 'idNumber')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: copiedField === 'idNumber' ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center' }}
                        title="Copiar Cédula"
                      >
                        {copiedField === 'idNumber' ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div>
                      <strong>Razón Social:</strong> {selectedOrder.billingInfo.legalName || selectedOrder.customerName}
                    </div>
                    {(selectedOrder.billingInfo.legalName || selectedOrder.customerName) && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.billingInfo.legalName || selectedOrder.customerName, 'legalName')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: copiedField === 'legalName' ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center' }}
                        title="Copiar Razón Social"
                      >
                        {copiedField === 'legalName' ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <div>
                      <strong>Correo para Factura:</strong> {selectedOrder.billingInfo.email || selectedOrder.customerEmail || 'No especificado'}
                    </div>
                    {(selectedOrder.billingInfo.email || selectedOrder.customerEmail) && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedOrder.billingInfo.email || selectedOrder.customerEmail, 'email')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: copiedField === 'email' ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center' }}
                        title="Copiar Correo"
                      >
                        {copiedField === 'email' ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* State: Issued via Almendro/Hacienda */}
                {selectedOrder.billingInfo.numericKey ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#166534', wordBreak: 'break-all' }}>
                      <strong>Clave Numérica:</strong> {selectedOrder.billingInfo.numericKey}
                    </div>
                    {Boolean(selectedOrder.billingInfo.pdfUrl || selectedOrder.billingInfo.numericKey) && (
                      <div style={{ marginTop: '4px' }}>
                        <a
                          href={
                            selectedOrder.billingInfo.pdfUrl && !selectedOrder.billingInfo.pdfUrl.includes('fe.almendro.cr')
                              ? selectedOrder.billingInfo.pdfUrl
                              : `/api/almendro/public/voucher-pdf/${selectedOrder.billingInfo.numericKey}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: '#15803d', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 'bold' }}
                        >
                          <Download size={13} /> Ver / Descargar Factura PDF ↗
                        </a>
                      </div>
                    )}
                  </div>
                ) : selectedOrder.billingInfo.issuedManually ? (
                  /* State: Issued manually in external system */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534' }}>
                    <span>
                      📋 Facturada en su sistema externo. <strong>Ref:</strong> {selectedOrder.billingInfo.externalInvoiceReference || 'Manual'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualInvoiceForm(true)}
                      style={{ fontSize: '0.75rem', color: '#15803d', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Editar Referencia
                    </button>
                  </div>
                ) : (
                  /* State: Not yet issued */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.76rem', color: '#6b21a8' }}>
                        {selectedOrder.paymentStatus === 'paid'
                          ? 'El cliente solicitó factura electrónica. Puedes gestionarla aquí:'
                          : '💡 Datos recibidos para factura. Puedes marcarla cuando la emitas en tu facturador:'}
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setShowManualInvoiceForm(true)}
                          style={{ padding: '6px 12px', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle2 size={13} /> Marcar como Facturada en mi Sistema
                        </button>
                        {selectedOrder.paymentStatus === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleEmitInvoice(selectedOrder.id)}
                            disabled={emittingInvoiceId === selectedOrder.id}
                            style={{ padding: '6px 12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FileText size={13} /> {emittingInvoiceId === selectedOrder.id ? 'Emitiendo en Hacienda...' : 'Emitir con Almendro'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Form to enter external invoice reference */}
                {showManualInvoiceForm && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                      Registrar comprobante emitido en su facturador externo
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>
                      Ingrese el número o referencia del comprobante emitido en su sistema (ej. Quickbooks, Factun, GTI, ATV Hacienda o consecutivo local):
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        placeholder="Ej. FE-00100001010000001234 o #1042"
                        value={manualRefInput}
                        onChange={(e) => setManualRefInput(e.target.value)}
                        style={{ flex: 1, minWidth: '200px', padding: '7px 10px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleMarkManualInvoice(selectedOrder.id)}
                        disabled={markingManualInvoice}
                        style={{ padding: '7px 14px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: markingManualInvoice ? 'not-allowed' : 'pointer' }}
                      >
                        {markingManualInvoice ? 'Guardando...' : 'Confirmar Facturación'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowManualInvoiceForm(false); setManualRefInput(''); }}
                        style={{ padding: '7px 12px', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Embedded Map View */}
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
                
                <div style={{ height: 200, width: '100%' }}>
                  <InteractiveMapPicker
                    initialLocation={{ lat: selectedOrder.customerLocation.lat, lng: selectedOrder.customerLocation.lng }}
                    readonly={true}
                    height={200}
                  />
                </div>
              </div>
            )}

            {/* Driver Dispatch & Quick Assignment */}
            <div style={{ backgroundColor: '#eff6ff', padding: '14px 16px', borderRadius: '10px', border: '1px solid #bfdbfe', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={18} color="#2563eb" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e40af' }}>Asignar / Despachar Repartidor</div>
                  <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>
                    {selectedOrder.driverId ? `Asignado a: ${drivers.find(d => d.id === selectedOrder.driverId)?.name || 'Repartidor'}` : 'Sin asignar'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select
                  value={dispatchingDriverId || selectedOrder.driverId || ''}
                  onChange={(e) => setDispatchingDriverId(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #93c5fd', backgroundColor: 'white', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="">-- Seleccionar Repartidor --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.vehicleType || 'Moto'})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleDispatchToDriver(selectedOrder.id, dispatchingDriverId || selectedOrder.driverId || '')}
                  disabled={dispatching || (!dispatchingDriverId && !selectedOrder.driverId)}
                  style={{ padding: '7px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={13} /> {dispatching ? 'Despachando...' : 'Despachar WhatsApp'}
                </button>
              </div>
            </div>

            {/* Itemized Products */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={16} color="var(--primary)" /> Platillos / Productos del Pedido:
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>Producto / Detalle</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center' }}>Cant.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Precio Unit.</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                          No hay productos detallados registrados en este pedido.
                        </td>
                      </tr>
                    ) : (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.productName}</div>
                            {item.variantName && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Opción: {item.variantName}</div>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' }}>
                              {item.quantity}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>
                            ₡{Number(item.unitPrice).toLocaleString('es-CR')}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}>
                            ₡{Number(item.totalPrice || item.unitPrice * item.quantity).toLocaleString('es-CR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Order Breakdown */}
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                {Number(selectedOrder.deliveryFee) > 0 && (
                  <div style={{ color: '#64748b' }}>
                    Envío Express: ₡{Number(selectedOrder.deliveryFee).toLocaleString('es-CR')}
                  </div>
                )}
                {Number(selectedOrder.discount) > 0 && (
                  <div style={{ color: '#16a34a' }}>
                    Descuento: -₡{Number(selectedOrder.discount).toLocaleString('es-CR')}
                  </div>
                )}
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                  Total a Pagar: ₡{Number(selectedOrder.total).toLocaleString('es-CR')}
                </div>
              </div>
            </div>

            {/* Dispatch to Driver Section */}
            {selectedOrder.deliveryMethod === 'delivery' && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '10px' }}>
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
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL: FULL SIZE RECEIPT IMAGE */}
      {lightboxImageUrl && (
        <div
          onClick={() => setLightboxImageUrl(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', cursor: 'pointer'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <img
              src={lightboxImageUrl}
              alt="Comprobante de Pago Completo"
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              <a
                href={lightboxImageUrl}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Abrir en pestaña nueva ↗
              </a>
              <button
                type="button"
                onClick={() => setLightboxImageUrl(null)}
                style={{ padding: '8px 16px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
