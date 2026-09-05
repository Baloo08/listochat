import React, { useState } from 'react';
import { CreditCard, Lock, X, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface TenantBillingCardModalProps {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TenantBillingCardModal({
  tenantId,
  tenantName,
  onClose,
  onSuccess
}: TenantBillingCardModalProps) {
  const api = useApi();
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expMonth, setExpMonth] = useState('01');
  const [expYear, setExpYear] = useState(String(new Date().getFullYear()));
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(.{4})/g, '$1 ').trim();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => String(currentYear + i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 15) {
      setError('Por favor ingresa un número de tarjeta válido (15-16 dígitos).');
      return;
    }
    if (!cardHolder.trim()) {
      setError('El nombre del titular es requerido.');
      return;
    }
    if (cvv.length < 3) {
      setError('El código CVV debe tener al menos 3 dígitos.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/api/superadmin/billing/cards/${tenantId}`, {
        cardNumber: cleanNumber,
        expMonth,
        expYear,
        cvv,
        cardHolder: cardHolder.trim()
      });

      if (res?.success) {
        setSuccessMsg(`✅ Tarjeta ${res.cardBrand} terminada en ${res.cardLast4} registrada con éxito.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        throw new Error(res?.error || 'Error al tokenizar tarjeta');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la pasarela de Tilopay');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSession = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.post(`/api/superadmin/billing/cards/${tenantId}/session`, {});
      if (res?.paymentUrl) {
        window.open(res.paymentUrl, '_blank');
        setSuccessMsg('Se ha abierto la pasarela bancaria segura de Tilopay en una nueva pestaña.');
      } else {
        throw new Error(res?.error || 'No se pudo generar la sesión segura.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar enlace seguro de Tilopay');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(3px)',
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid #e2e8f0',
          position: 'relative'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal de tarjeta bancaria"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '10px' }}>
            <CreditCard size={24} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
              Registrar Tarjeta de Cobro
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Comercio: <strong>{tenantName}</strong>
            </p>
          </div>
        </div>

        {/* Option 1: Hosted Tilopay Session (Recommended - SAQ A) */}
        <div style={{ padding: '14px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', margin: '14px 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.85rem', color: '#166534', marginBottom: '4px' }}>
            <ShieldCheck size={16} /> Pasarela Hospedada Tilopay (Recomendado)
          </div>
          <p style={{ fontSize: '0.78rem', color: '#15803d', margin: '0 0 10px 0' }}>
            Abre la pasarela bancaria oficial de Tilopay sin que los datos de la tarjeta toquen este servidor.
          </p>
          <button
            type="button"
            onClick={handleGenerateSession}
            disabled={submitting}
            style={{
              padding: '9px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Lock size={14} /> Abrir Pasarela Bancaria Tilopay
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0', color: '#94a3b8', fontSize: '0.78rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span>O ingresar datos manualmente</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {error && (
          <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', fontSize: '0.82rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
              Número de Tarjeta
            </label>
            <input
              type="text"
              placeholder="4000 1234 5678 9010"
              value={cardNumber}
              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
              required
              maxLength={19}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.95rem',
                letterSpacing: '1px',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
              Nombre del Titular (como aparece en la tarjeta)
            </label>
            <input
              type="text"
              placeholder="JUAN PEREZ"
              value={cardHolder}
              onChange={e => setCardHolder(e.target.value.toUpperCase())}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
                Mes
              </label>
              <select
                value={expMonth}
                onChange={e => setExpMonth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
                Año
              </label>
              <select
                value={expYear}
                onChange={e => setExpYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', color: '#334155' }}>
                CVV
              </label>
              <input
                type="password"
                placeholder="123"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '9px 8px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#475569'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Lock size={15} />
              {submitting ? 'Tokenizando con Tilopay...' : 'Guardar y Tokenizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}