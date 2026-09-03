import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Lock, AlertCircle, Loader2, Smartphone, CheckCircle } from 'lucide-react';

export interface TilopayPaymentFormProps {
  orderId: string;
  orderNumber?: number;
  amount: number;
  currency: string;
  sdkToken: string;
  apiKey: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  themeColor?: string;
}

export default function TilopayPaymentForm({
  orderId,
  orderNumber,
  amount,
  currency = 'CRC',
  sdkToken,
  apiKey,
  environment = 'SANDBOX',
  customerName = '',
  customerEmail = '',
  customerPhone = '',
  onSuccess,
  onError,
  onCancel,
  themeColor = '#16a34a'
}: TilopayPaymentFormProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'sinpe'>('card');
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerName || '');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [installments, setInstallments] = useState<'1' | '3' | '6' | '12'>('1');

  // SINPE State
  const [sinpePhone, setSinpePhone] = useState(customerPhone || '');

  // Format Card Number (with spaces every 4 digits)
  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 16);
    const parts = clean.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : clean);
  };

  // Format MM/YY
  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 4);
    if (clean.length >= 3) {
      setExpiry(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setExpiry(clean);
    }
  };

  useEffect(() => {
    // Dynamic load of official Tilopay JS SDK V2 script
    const scriptId = 'tilopay-sdk-v2';
    const sdkUrl = 'https://app.tilopay.com/sdk/v2/sdk_tpay.min.js';

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = sdkUrl;
      script.async = true;
      script.onload = () => {
        setSdkReady(true);
      };
      script.onerror = () => {
        setErrorMessage('No fue posible cargar la pasarela segura de pago. Intenta de nuevo.');
      };
      document.body.appendChild(script);
    } else {
      setSdkReady(true);
    }
  }, []);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 15) {
        setErrorMessage('Por favor ingresa un número de tarjeta válido.');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Por favor ingresa el nombre del titular como figura en la tarjeta.');
        return;
      }
      if (expiry.length < 5) {
        setErrorMessage('Ingresa una fecha de expiración válida (MM/AA).');
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage('Ingresa el código de seguridad (CVV).');
        return;
      }
    } else {
      const cleanPhone = sinpePhone.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        setErrorMessage('Por favor ingresa el número de teléfono para cobro SINPE Móvil.');
        return;
      }
    }

    setLoading(true);

    try {
      // Direct tokenized checkout via Tilopay SDK or secure endpoint
      const baseUrl = environment === 'PRODUCTION'
        ? 'https://app.tilopay.net/api/v1'
        : 'https://sandbox.tilopay.net/api/v1';

      const [expMonth, expYear] = expiry.split('/');
      const cleanCard = cardNumber.replace(/\s/g, '');

      const payload: any = {
        key: apiKey,
        token: sdkToken,
        order_id: orderId,
        amount: Number(amount),
        currency: currency.toUpperCase(),
        bill_to: customerName || cardHolder,
        email: customerEmail || 'cliente@betico.cr',
        phone: customerPhone || sinpePhone
      };

      if (activeTab === 'card') {
        payload.card_number = cleanCard;
        payload.exp_month = expMonth;
        payload.exp_year = expYear && expYear.length === 2 ? `20${expYear}` : expYear;
        payload.cvv = cvv;
        payload.cardholder = cardHolder;
        if (Number(installments) > 1) {
          payload.plan = `${installments} cuotas`;
        }
      } else {
        payload.payment_type = 'sinpe';
        payload.phone = sinpePhone;
      }

      // Execute payment via Tilopay REST
      const res = await fetch(`${baseUrl}/processPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sdkToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => ({}));

      // Check 3D Secure redirection challenge if returned
      if (result.redirect_url || result.url3ds) {
        window.location.href = result.redirect_url || result.url3ds;
        return;
      }

      const isSuccess =
        res.ok &&
        (result.result_code === '1' || result.result_code === 1 || result.status === 'approved' || result.result === '00');

      if (isSuccess) {
        onSuccess(result);
      } else {
        const msg = result.message || result.error || 'La transacción fue declinada por el banco emisor.';
        setErrorMessage(msg);
        onError(msg);
      }
    } catch (err: any) {
      console.error('[TilopayPaymentForm] Error procesando pago:', err);
      const msg = err.message || 'Error de comunicación al procesar el pago.';
      setErrorMessage(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      
      {/* Header with Amount & Security Badge */}
      <div style={{ padding: '18px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>TOTAL A PAGAR</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a' }}>
            {currency === 'USD' ? '$' : '₡'}{Number(amount).toLocaleString('es-CR')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <ShieldCheck size={16} /> Pago Seguro 256-bit
        </div>
      </div>

      {/* Payment Method Selector Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('card'); setErrorMessage(null); }}
          style={{
            flex: 1, padding: '12px', border: 'none', background: activeTab === 'card' ? 'white' : '#f8fafc',
            borderBottom: activeTab === 'card' ? `2px solid ${themeColor}` : 'none',
            color: activeTab === 'card' ? themeColor : '#64748b',
            fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <CreditCard size={18} /> Tarjeta de Débito / Crédito
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('sinpe'); setErrorMessage(null); }}
          style={{
            flex: 1, padding: '12px', border: 'none', background: activeTab === 'sinpe' ? 'white' : '#f8fafc',
            borderBottom: activeTab === 'sinpe' ? `2px solid ${themeColor}` : 'none',
            color: activeTab === 'sinpe' ? themeColor : '#64748b',
            fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <Smartphone size={18} /> SINPE Móvil Tilopay
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmitPayment} style={{ padding: '20px' }}>
        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '16px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === 'card' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Card Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Número de Tarjeta
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', letterSpacing: '0.05em' }}
                  required
                />
                <CreditCard size={20} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Nombre del Titular (como figura en la tarjeta)
              </label>
              <input
                type="text"
                placeholder="JUAN PEREZ"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                required
              />
            </div>

            {/* Expiry & CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Vencimiento (MM/AA)
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={expiry}
                  onChange={(e) => handleExpiryChange(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', textAlign: 'center' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Código CVV
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', textAlign: 'center' }}
                    required
                  />
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            {/* Installments Selector (BAC Credomatic Tasa Cero) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Plan de Financiamiento BAC / Tarjetas Locales
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value as any)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '0.9rem' }}
              >
                <option value="1">1 solo pago (Contado)</option>
                <option value="3">3 Cuotas (Tasa Cero si aplica)</option>
                <option value="6">6 Cuotas (Tasa Cero si aplica)</option>
                <option value="12">12 Cuotas (Minicuotas)</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', fontSize: '0.85rem', color: '#166534', lineHeight: '1.5' }}>
              📲 <strong>SINPE Móvil Inmediato:</strong> Ingresa tu número de teléfono registrado en SINPE Móvil. Tilopay solicitará la confirmación directa a tu banco.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Número de Teléfono SINPE (Costa Rica)
              </label>
              <input
                type="tel"
                placeholder="8888 8888"
                value={sinpePhone}
                onChange={(e) => setSinpePhone(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                required
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: themeColor,
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Procesando pago seguro...
              </>
            ) : (
              <>
                <Lock size={18} /> Pagar {currency === 'USD' ? '$' : '₡'}{Number(amount).toLocaleString('es-CR')}
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#64748b',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Cancelar y volver
            </button>
          )}
        </div>

        {/* Brand footer */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>Powered by</span>
          <strong style={{ color: '#0f172a' }}>Tilopay</strong>
          <span>• Cumplimiento PCI-DSS Nivel 1</span>
        </div>
      </form>
    </div>
  );
}
