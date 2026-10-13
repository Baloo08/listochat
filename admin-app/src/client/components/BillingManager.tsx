import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Users,
  CheckCircle2,
  RefreshCw,
  FileText,
  Key,
  Building2,
  Send,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';
import ElectronicBillingView from '../../../../src/client/components/ElectronicBillingView';

interface BillingManagerProps {
  onOpenHacienda?: (subTab?: 'comprobantes' | 'credenciales' | 'sucursales') => void;
}

type BillingSubView = 'cobranza' | 'comprobantes' | 'credenciales' | 'sucursales';

function resolveTrafficBadgeStyle(trafficColor?: string) {
  const c = (trafficColor || '').toLowerCase();
  if (c === 'red' || c === 'danger' || c === '#ef4444' || c === '#f87171') {
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: '#f87171',
      border: '1px solid rgba(239, 68, 68, 0.35)'
    };
  }
  if (c === 'yellow' || c === 'amber' || c === 'warning' || c === '#f59e0b' || c === '#eab308' || c === '#facc15') {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
      color: '#facc15',
      border: '1px solid rgba(245, 158, 11, 0.35)'
    };
  }
  if (c === 'green' || c === 'emerald' || c === 'success' || c === '#10b981' || c === '#34d399') {
    return {
      backgroundColor: 'rgba(52, 211, 153, 0.15)',
      color: '#34D399',
      border: '1px solid rgba(52, 211, 153, 0.35)'
    };
  }
  if (c.startsWith('#')) {
    return {
      backgroundColor: `${trafficColor}22`,
      color: trafficColor,
      border: `1px solid ${trafficColor}55`
    };
  }
  return {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    color: '#cbd5e1',
    border: '1px solid rgba(148, 163, 184, 0.3)'
  };
}

export default function BillingManager({ onOpenHacienda }: BillingManagerProps) {
  const api = useAdminApi();
  const [activeView, setActiveView] = useState<BillingSubView>('cobranza');
  const [stats, setStats] = useState<any | null>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 6500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sData, cData, colData] = await Promise.all([
        api.get('/api/billing/stats'),
        api.get('/api/billing/charges'),
        api.get('/api/billing/collections').catch(() => [])
      ]);
      setStats(sData?.overview || null);
      setCharges(cData || []);
      setCollections(Array.isArray(colData) ? colData : colData?.collections || []);
    } catch (e: any) {
      console.warn('Error al cargar datos de facturación:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleInvoicePreference = async (c: any) => {
    setBusyTenantId(c.id);
    try {
      const nextVal = !c.requiresSubscriptionInvoice;
      await api.put(`/api/tenants/${c.id}/billing-preference`, {
        requiresSubscriptionInvoice: nextVal
      });
      showToast(
        nextVal
          ? `Regla actualizada para ${c.name}: El cliente solicitó factura electrónica (Emisión automática activada).`
          : `Regla actualizada para ${c.name}: Sin emisión automática de factura.`
      );
      await fetchData();
    } catch (err: any) {
      alert('Error al actualizar preferencia de facturación: ' + (err.message || 'Error'));
    } finally {
      setBusyTenantId(null);
    }
  };

  const handleEmitSubscriptionInvoice = async (c: any) => {
    const targetEmail = c.billingEmail || c.adminEmail || 'correo del cliente';
    const docLabel = c.billingIdNumber ? 'Factura Electrónica (01)' : 'Tiquete Electrónico (04)';
    if (
      !confirm(
        `¿Emitir ${docLabel} ahora para "${c.name}" y enviar PDF y XML DGT v4.4 a ${targetEmail}?`
      )
    ) {
      return;
    }
    setBusyTenantId(c.id);
    try {
      const res = await api.post(`/api/tenants/${c.id}/emit-subscription-invoice`, {});
      const clave = res?.voucher?.clave || res?.clave || '';
      const consecutivo = res?.voucher?.consecutivo || res?.consecutivo || '';
      showToast(
        `Comprobante emitido para ${c.name}. ${consecutivo ? `Consecutivo: ${consecutivo}` : ''} ${clave ? `· Clave (50 dígitos): ${clave}` : ''}`
      );
      await fetchData();
    } catch (err: any) {
      alert('Error al emitir factura electrónica: ' + (err.message || 'Error'));
    } finally {
      setBusyTenantId(null);
    }
  };

  const handleRecordQuickPayment = async (c: any) => {
    const currency = c.currency || c.billingCurrency || 'CRC';
    const amount = Number(c.monthlyPrice ?? c.customMonthlyPrice ?? 55000);
    const symbol = currency === 'USD' ? '$' : '₡';
    const autoInvoiceNotice = c.requiresSubscriptionInvoice
      ? 'El cliente solicitó factura: Se emitirá y enviará automáticamente su Factura Electrónica (PDF y XML DGT v4.4).'
      : 'El cliente NO solicitó factura automática: Solo se registrará el pago y se extenderán 30 días.';

    if (
      !confirm(
        `¿Registrar pago de ${symbol}${amount.toLocaleString('es-CR')} (+30 días) para "${c.name}"?\n\n${autoInvoiceNotice}`
      )
    ) {
      return;
    }

    setBusyTenantId(c.id);
    try {
      const res = await api.post(`/api/monitoring/tenant/${c.id}/record-payment`, {
        amount,
        currency,
        paymentMethod: 'sinpe',
        extendDays: 30
      });
      showToast(res?.message || `Pago registrado (+30 días) para ${c.name}.`);
      await fetchData();
    } catch (err: any) {
      alert('Error al registrar pago: ' + (err.message || 'Error'));
    } finally {
      setBusyTenantId(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid #34D399',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '18px',
        backgroundColor: '#0f2426',
        border: '1px solid #1a3e40',
        borderRadius: '16px',
        padding: '20px 24px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', color: '#FAF8F5', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} color="#34D399" />
            Ingresos Recurrentes y Facturación de la Plataforma
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
            Métricas de MRR, suscripciones activas, cartera de cobro y comprobantes electrónicos de Hacienda (DGT v4.4)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveView('credenciales')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              borderRadius: '8px',
              color: '#FAF8F5',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Key size={14} color="#34D399" />
            Configurar Credenciales y Llave .p12 (Hacienda)
          </button>

          <button
            type="button"
            onClick={() => setActiveView('comprobantes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              backgroundColor: '#123032',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              color: '#38bdf8',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <FileText size={14} />
            Facturador Manual a Clientes de Tenants
          </button>

          {onOpenHacienda && (
            <button
              type="button"
              onClick={() => onOpenHacienda('comprobantes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 12px',
                backgroundColor: '#123032',
                border: '1px solid #234b4e',
                borderRadius: '8px',
                color: '#cbd5e1',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={14} color="#34D399" />
              Vista Completa Hacienda
            </button>
          )}

          <button
            type="button"
            onClick={fetchData}
            title="Refrescar métricas y cartera"
            style={{
              padding: '9px 14px',
              backgroundColor: '#123032',
              border: '1px solid #234b4e',
              borderRadius: '8px',
              color: '#FAF8F5',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Internal View Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '22px',
        backgroundColor: '#0a1a1c',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid #163638'
      }}>
        <button
          type="button"
          onClick={() => setActiveView('cobranza')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeView === 'cobranza' ? '1px solid #34D399' : '1px solid transparent',
            backgroundColor: activeView === 'cobranza' ? '#0B3C3D' : 'transparent',
            color: activeView === 'cobranza' ? '#34D399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <Users size={15} />
          Cobranza, Suscripciones y Semáforo
        </button>

        <button
          type="button"
          onClick={() => setActiveView('comprobantes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeView === 'comprobantes' ? '1px solid #34D399' : '1px solid transparent',
            backgroundColor: activeView === 'comprobantes' ? '#0B3C3D' : 'transparent',
            color: activeView === 'comprobantes' ? '#34D399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <FileText size={15} />
          Comprobantes y Emisión (Hacienda)
        </button>

        <button
          type="button"
          onClick={() => setActiveView('credenciales')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeView === 'credenciales' ? '1px solid #34D399' : '1px solid transparent',
            backgroundColor: activeView === 'credenciales' ? '#0B3C3D' : 'transparent',
            color: activeView === 'credenciales' ? '#34D399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <Key size={15} />
          Credenciales ATV y Llave .p12
        </button>

        <button
          type="button"
          onClick={() => setActiveView('sucursales')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: activeView === 'sucursales' ? '1px solid #34D399' : '1px solid transparent',
            backgroundColor: activeView === 'sucursales' ? '#0B3C3D' : 'transparent',
            color: activeView === 'sucursales' ? '#34D399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          <Building2 size={15} />
          Datos Fiscales y Sucursales
        </button>
      </div>

      {/* Render ElectronicBillingView directly when in Hacienda tabs */}
      {(activeView === 'comprobantes' || activeView === 'credenciales' || activeView === 'sucursales') && (
        <ElectronicBillingView key={activeView} initialTab={activeView} isSuperAdminMode={true} darkMode={true} />
      )}

      {/* Render Cobranza y Suscripciones view */}
      {activeView === 'cobranza' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 4 KPI Cards */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {/* MRR Colones */}
              <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>MRR Estimado CRC</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399', margin: '8px 0 4px 0' }}>
                  ₡{Number(stats.mrrCrc || 0).toLocaleString('es-CR')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Facturación mensual en Colones</span>
              </div>

              {/* MRR Dólares */}
              <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>MRR Estimado USD</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa', margin: '8px 0 4px 0' }}>
                  ${Number(stats.mrrUsd || 0).toLocaleString('es-CR')}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Facturación mensual en Dólares</span>
              </div>

              {/* Clientes de Pago Activos */}
              <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Clientes de Pago Activos</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF8F5', margin: '8px 0 4px 0' }}>
                  {stats.payingTenants || 0} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.totalTenants || 0}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#34D399' }}>{stats.trialTenants || 0} en período de prueba</span>
              </div>

              {/* Facturas Emitidas */}
              <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Facturas Emitidas</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#facc15', margin: '8px 0 4px 0' }}>
                  {stats.vouchers?.totalVouchers || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Comprobantes electrónicos Hacienda</span>
              </div>
            </div>
          )}

          {/* Cartera de Clientes y Facturación Electrónica de Suscripciones */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#FAF8F5', fontWeight: 700 }}>
                  Cartera de Clientes y Facturación Electrónica de Suscripciones
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Control de vencimientos por semáforo, regla de emisión bajo solicitud del cliente y envío directo de PDF y XML DGT v4.4
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#34D399', fontWeight: 700 }}>
                {collections.length} comercios en cartera
              </span>
            </div>

            {collections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                {loading ? 'Cargando cartera de suscripciones...' : 'No hay comercios registrados en la cartera de cobro.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a3e40', color: '#94a3b8', backgroundColor: '#0a1a1c' }}>
                      <th style={{ padding: '12px 14px' }}>Comercio / Inquilino</th>
                      <th style={{ padding: '12px 14px' }}>Mensualidad y Próximo Cobro</th>
                      <th style={{ padding: '12px 14px' }}>Regla de Facturación (El cliente solicitó factura)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones de Cobro y Emisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((c) => {
                      const currency = c.currency || c.billingCurrency || 'CRC';
                      const price = Number(c.monthlyPrice ?? c.customMonthlyPrice ?? 0);
                      const badgeStyle = resolveTrafficBadgeStyle(c.trafficColor);
                      const isBusy = busyTenantId === c.id;

                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #142e30' }}>
                          {/* 1. Comercio / Inquilino */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 700, color: '#FAF8F5', fontSize: '0.92rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                              /{c.slug} · <span style={{ textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>{c.plan || 'starter'}</span>
                            </div>
                          </td>

                          {/* 2. Mensualidad y Próximo Cobro */}
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 800, color: '#34D399', fontSize: '0.92rem' }}>
                              {currency === 'USD' ? `$${price.toLocaleString('es-CR')}` : `₡${price.toLocaleString('es-CR')}`} / mes
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                                Próximo: <strong>{c.nextBillingDate || 'Sin fecha'}</strong>
                              </span>
                              {c.trafficLabel && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  ...badgeStyle
                                }}>
                                  {c.trafficLabel}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Regla de Facturación */}
                          <td style={{ padding: '14px' }}>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleInvoicePreference(c)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: isBusy ? 'wait' : 'pointer',
                                border: c.requiresSubscriptionInvoice
                                  ? '1px solid #34D399'
                                  : '1px solid #334155',
                                backgroundColor: c.requiresSubscriptionInvoice
                                  ? 'rgba(52, 211, 153, 0.18)'
                                  : 'rgba(51, 65, 85, 0.35)',
                                color: c.requiresSubscriptionInvoice ? '#34D399' : '#94a3b8'
                              }}
                            >
                              {c.requiresSubscriptionInvoice ? 'Solicitó Factura: Sí' : 'No solicitada'}
                            </button>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '5px' }}>
                              Cédula: {c.billingIdNumber || 'Sin cédula'} · {c.billingEmail || c.adminEmail || 'Sin correo'}
                            </div>
                          </td>

                          {/* 4. Acciones de Cobro y Emisión */}
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleEmitSubscriptionInvoice(c)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '7px 12px',
                                  backgroundColor: '#0B3C3D',
                                  border: '1px solid #34D399',
                                  borderRadius: '8px',
                                  color: '#FAF8F5',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: isBusy ? 'wait' : 'pointer'
                                }}
                              >
                                <Send size={13} color="#34D399" />
                                Emitir Factura Ahora
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleRecordQuickPayment(c)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '7px 12px',
                                  backgroundColor: '#10b981',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: isBusy ? 'wait' : 'pointer'
                                }}
                              >
                                <Plus size={13} />
                                Registrar Pago (+30d)
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
          </div>

          {/* Transacciones y Cargos Recientes */}
          <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#FAF8F5', fontWeight: 700 }}>
              Transacciones y Cargos Recientes
            </h3>
            {charges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                No hay transacciones registradas recientemente
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a3e40', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 14px' }}>Comercio</th>
                      <th style={{ padding: '12px 14px' }}>Monto</th>
                      <th style={{ padding: '12px 14px' }}>Método</th>
                      <th style={{ padding: '12px 14px' }}>Estado</th>
                      <th style={{ padding: '12px 14px' }}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {charges.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #142e30' }}>
                        <td style={{ padding: '12px 14px', color: '#FAF8F5', fontWeight: 600 }}>{c.tenantName || 'Comercio'}</td>
                        <td style={{ padding: '12px 14px', color: '#34D399', fontWeight: 700 }}>
                          {c.currency === 'USD' ? `$${c.amount}` : `₡${Number(c.amount).toLocaleString('es-CR')}`}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#94a3b8' }}>{c.paymentMethod || 'Tarjeta'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: c.status === 'success' || c.status === 'completed' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: c.status === 'success' || c.status === 'completed' ? '#34D399' : '#facc15'
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{new Date(c.createdAt).toLocaleString('es-CR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
