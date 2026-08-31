import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CreditCard, Search, RefreshCw, Send, FileText, CheckCircle, AlertTriangle, Phone, ExternalLink, Key } from 'lucide-react';
import TenantDossierModal from './TenantDossierModal';

export default function BillingCollectionsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'due_soon' | 'grace' | 'overdue'>('all');
  const [search, setSearch] = useState('');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

  const api = useApi();

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tenants/billing/collections');
      if (res) setData(res);
    } catch (e: any) {
      console.error('Error loading collections:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleRecordPayment = async (c: any) => {
    if (!confirm(`¿Registrar pago de ${c.currency === 'USD' ? '$' : '₡'}${c.monthlyPrice.toLocaleString('es-CR')} y renovar 30 días para ${c.name}?`)) return;
    try {
      await api.post(`/api/tenants/${c.id}/record-payment`, {
        amount: c.monthlyPrice,
        currency: c.currency,
        paymentMethod: 'sinpe',
        notes: 'Pago registrado desde cobranza rápida (+30 días)'
      });
      alert('¡Pago registrado con éxito! Suscripción extendida 30 días.');
      loadCollections();
    } catch (e: any) {
      alert('Error registrando pago: ' + e.message);
    }
  };

  const openWhatsAppCobro = (c: any) => {
    const rawPhone = (c.phone || '').replace(/[^0-9]/g, '');
    if (!rawPhone) {
      alert('El comercio no tiene WhatsApp registrado.');
      return;
    }
    const cleanPhone = rawPhone.length === 8 ? '506' + rawPhone : rawPhone;
    const priceStr = (c.currency === 'USD' ? '$' : '₡') + Number(c.monthlyPrice).toLocaleString('es-CR');
    const msg = `¡Hola ${c.name}! Te saludamos del equipo de Betico. Te recordamos que el pago de tu suscripción mensual (${priceStr}) correspondiente a este periodo está disponible. Puedes cancelar por SINPE Móvil o transferencia. ¡Muchas gracias por preferir Betico!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const collections = data?.collections || [];
  const summary = data?.summary || {};

  const filtered = collections.filter((c: any) => {
    if (filter !== 'all' && c.trafficLight !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q) || (c.adminEmail || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={26} color="var(--primary)" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Cobranza & Cuentas por Cobrar</h1>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Semáforo visual de cobros, control de vencimientos y recordatorios automatizados por WhatsApp
          </p>
        </div>

        <button
          onClick={loadCollections}
          style={{ padding: '8px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text)' }}
        >
          <RefreshCw size={15} /> Actualizar Cartera
        </button>
      </div>

      {/* 4 SUMMARY METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        
        <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 'bold' }}>🟢 AL DÍA / PAGADOS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {summary.countPaid || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Suscripciones al día</div>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#ca8a04', fontWeight: 'bold' }}>🟡 PRÓXIMOS A COBRAR (≤ 3 DÍAS)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ca8a04', marginTop: '4px' }}>
            {summary.countDueSoon || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Requieren aviso de pago</div>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 'bold' }}>🟠 EN PERIODO DE GRACIA</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ea580c', marginTop: '4px' }}>
            {summary.countGrace || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vencidos (1 a 5 días)</div>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>🔴 EN MORA / SUSPENDIDOS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
            {summary.countOverdue || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vencidos con mora</div>
        </div>

      </div>

      {/* TRAFFIC LIGHT FILTERS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', backgroundColor: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'paid', label: '🟢 Al Día' },
            { id: 'due_soon', label: '🟡 Por Vencer' },
            { id: 'grace', label: '🟠 En Gracia' },
            { id: 'overdue', label: '🔴 En Mora' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold',
                backgroundColor: filter === f.id ? 'var(--primary)' : 'transparent',
                color: filter === f.id ? 'white' : 'var(--text-muted)'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar cliente, correo o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* COLLECTIONS TABLE */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando cartera de cobros...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No se encontraron comercios en esta categoría.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 14px' }}>Semáforo</th>
                <th style={{ padding: '12px 14px' }}>Comercio</th>
                <th style={{ padding: '12px 14px' }}>Monto Pactado</th>
                <th style={{ padding: '12px 14px' }}>Próximo Pago</th>
                <th style={{ padding: '12px 14px' }}>Estado / Vencimiento</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '14px', fontSize: '0.72rem', fontWeight: '800',
                      backgroundColor: c.trafficLight === 'overdue' ? '#fee2e2' : c.trafficLight === 'grace' ? '#ffedd5' : c.trafficLight === 'due_soon' ? '#fef9c3' : '#dcfce7',
                      color: c.trafficLight === 'overdue' ? '#991b1b' : c.trafficLight === 'grace' ? '#c2410c' : c.trafficLight === 'due_soon' ? '#a16207' : '#15803d',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {c.trafficLabel}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.adminEmail} • <code>/{c.slug}</code>
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text)' }}>
                      {c.currency === 'USD' ? '$' : '₡'} {Number(c.monthlyPrice).toLocaleString('es-CR')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {c.plan}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {new Date(c.nextBillingDate).toLocaleDateString('es-CR', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    {c.diffDays > 0 ? (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        En {c.diffDays} {c.diffDays === 1 ? 'día' : 'días'}
                      </span>
                    ) : c.diffDays === 0 ? (
                      <span style={{ color: '#ca8a04', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        ⚠️ Vence Hoy
                      </span>
                    ) : (
                      <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.78rem' }}>
                        🚨 Atrasado {Math.abs(c.diffDays)} {Math.abs(c.diffDays) === 1 ? 'día' : 'días'}
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      
                      <button
                        onClick={() => openWhatsAppCobro(c)}
                        style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Enviar mensaje de cobro por WhatsApp"
                      >
                        <Send size={13} /> Cobrar
                      </button>

                      <button
                        onClick={() => handleRecordPayment(c)}
                        style={{ padding: '6px 10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        title="Registrar pago manual (+30 días)"
                      >
                        +30d Pago
                      </button>

                      <button
                        onClick={() => setSelectedDossierId(c.id)}
                        style={{ padding: '6px 10px', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                        title="Ver Expediente 360°"
                      >
                        Expediente
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DOSSIER MODAL */}
      {selectedDossierId && (
        <TenantDossierModal
          tenantId={selectedDossierId}
          onClose={() => setSelectedDossierId(null)}
          onRefresh={loadCollections}
        />
      )}

    </div>
  );
}
