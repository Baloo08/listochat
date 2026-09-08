import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
  X,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Building2,
  Lock,
  CheckSquare,
  Square
} from 'lucide-react';
import { TenantAlmendroConfig } from '../../shared/types';

interface PlatformAlmendroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformAlmendroModal({ isOpen, onClose }: PlatformAlmendroModalProps) {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [defaultDocType, setDefaultDocType] = useState<'01' | '04'>('04');
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(true);

  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [legalName, setLegalName] = useState('');
  const [economicActivityCode, setEconomicActivityCode] = useState('8314100000000');

  useEffect(() => {
    if (!isOpen) return;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const res: TenantAlmendroConfig = await api.get('/api/superadmin/almendro/config');
        if (res) {
          setIsEnabled(Boolean(res.isEnabled));
          setEnvironment(res.environment || 'SANDBOX');
          setApiKeyMasked(res.apiKeyMasked || '');
          setDefaultDocType(res.defaultDocType || '04');
          setSubscriptionsEnabled(res.moduleToggles?.subscriptionsEnabled !== false);
          setTaxIdNumber(res.taxIdNumber || '');
          setLegalName(res.legalName || '');
          setEconomicActivityCode(res.economicActivityCode || '8314100000000');

          if (!res.apiKeyMasked) {
            setIsEditingKey(true);
          }
        }
      } catch (e) {
        console.error('Error cargando config de plataforma:', e);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const res = await api.post('/api/superadmin/almendro/test-connection', {
        apiKey: isEditingKey ? apiKey : undefined,
        environment
      });

      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Error probando conexión'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setTestResult(null);

      const payload: any = {
        isEnabled,
        environment,
        defaultDocType,
        moduleToggles: {
          subscriptionsEnabled
        },
        taxIdNumber,
        legalName,
        economicActivityCode
      };

      if (isEditingKey && apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }

      const res = await api.post('/api/superadmin/almendro/config', payload);
      if (res && res.config) {
        setApiKeyMasked(res.config.apiKeyMasked || '');
        setIsEditingKey(false);
        setApiKey('');
        alert('✅ ¡Configuración de facturación de plataforma guardada!');
        onClose();
      }
    } catch (e: any) {
      alert('Error guardando configuración: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--background)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>
                Facturación Electrónica de la Plataforma
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Emisión de comprobantes para suscripciones cobradas a inquilinos (Almendro / TRIBU-CR)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
            <p>Cargando credenciales de plataforma...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ padding: '24px' }}>
            
            {/* Master Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '10px',
              backgroundColor: isEnabled ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${isEnabled ? '#bbf7d0' : '#e2e8f0'}`,
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: isEnabled ? '#15803d' : '#334155' }}>
                  {isEnabled ? 'Facturación de Suscripciones Activada' : 'Facturación de Suscripciones Desactivada'}
                </div>
                <div style={{ fontSize: '0.78rem', color: isEnabled ? '#166534' : '#64748b' }}>
                  Permite emitir facturas oficiales a los comercios cuando pagan su suscripción.
                </div>
              </div>

              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Ambiente
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="SANDBOX">Sandbox / Pruebas</option>
                  <option value="PRODUCTION">Producción (Hacienda Real)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                  Tipo de Comprobante
                </label>
                <select
                  value={defaultDocType}
                  onChange={(e) => setDefaultDocType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.88rem'
                  }}
                >
                  <option value="04">Tiquete Electrónico (04)</option>
                  <option value="01">Factura Electrónica (01 - B2B)</option>
                </select>
              </div>
            </div>

            {/* API Key */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text)' }}>
                  API Key de Almendro (SuperAdmin)
                </label>
                {apiKeyMasked && !isEditingKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '700' }}
                  >
                    Cambiar Llave
                  </button>
                )}
              </div>

              {isEditingKey ? (
                <input
                  type="password"
                  placeholder="Pega la API Key del SuperAdmin..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.88rem'
                  }}
                />
              ) : (
                <div style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.86rem',
                  fontFamily: 'monospace',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{apiKeyMasked}</span>
                  <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700' }}>AES-256-GCM</span>
                </div>
              )}
            </div>

            {/* Test Connection Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || (!apiKey && !apiKeyMasked)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'white',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} color="#2563eb" />}
                Probar Llave
              </button>

              {testResult && (
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  color: testResult.success ? '#15803d' : '#dc2626'
                }}>
                  {testResult.success ? '✅ Conectado' : `❌ ${testResult.message}`}
                </span>
              )}
            </div>

            {/* Checkbox: Emit on Subscription Charges */}
            <div
              onClick={() => setSubscriptionsEnabled(!subscriptionsEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: subscriptionsEnabled ? '#eff6ff' : 'transparent',
                cursor: 'pointer',
                marginBottom: '24px'
              }}
            >
              <div style={{ color: subscriptionsEnabled ? 'var(--primary)' : '#94a3b8' }}>
                {subscriptionsEnabled ? <CheckSquare size={18} /> : <Square size={18} />}
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text)' }}>
                Habilitar facturación de suscripciones en la pantalla de Cobranza
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.88rem'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.88rem'
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Ajustes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
