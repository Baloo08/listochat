import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, TrendingUp, Users, CheckCircle, RefreshCw, FileText } from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function BillingManager() {
  const api = useAdminApi();
  const [stats, setStats] = useState<any | null>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sData, cData] = await Promise.all([
        api.get('/api/billing/stats'),
        api.get('/api/billing/charges')
      ]);
      setStats(sData?.overview || null);
      setCharges(cData || []);
    } catch (e: any) {
      console.warn('Error al cargar datos de facturación:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
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
            Métricas de MRR, suscripciones activas, pasarelas de pago y comprobantes electrónicos
          </p>
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: '9px 16px',
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

      {stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {/* MRR Colones */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>MRR Estimado (CRC)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34D399', margin: '8px 0 4px 0' }}>
                ₡{Number(stats.mrrCrc).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Facturación mensual en Colones</span>
            </div>

            {/* MRR Dólares */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>MRR Estimado (USD)</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa', margin: '8px 0 4px 0' }}>
                ${Number(stats.mrrUsd).toLocaleString()}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Facturación mensual en Dólares</span>
            </div>

            {/* Paying Tenants */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Clientes de Pago Activos</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FAF8F5', margin: '8px 0 4px 0' }}>
                {stats.payingTenants} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {stats.totalTenants}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#34D399' }}>{stats.trialTenants} en período de prueba</span>
            </div>

            {/* Electronic Invoicing Vouchers */}
            <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Facturas Almendro / Hacienda</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#facc15', margin: '8px 0 4px 0' }}>
                {stats.vouchers.totalVouchers || 0}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Comprobantes emitidos este mes</span>
            </div>
          </div>

          {/* Recent Charges Table */}
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
                          {c.currency === 'USD' ? `$${c.amount}` : `₡${Number(c.amount).toLocaleString()}`}
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
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{new Date(c.createdAt).toLocaleString()}</td>
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
