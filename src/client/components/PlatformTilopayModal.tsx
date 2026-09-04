import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  CreditCard, ShieldCheck, Key, Lock, Eye, EyeOff, Check, Copy, 
  RefreshCw, AlertCircle, CheckCircle, X, ExternalLink, Globe, Zap 
} from 'lucide-react';

interface PlatformTilopayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PlatformTilopayModal({
  isOpen,
  onClose,
  onSuccess
}: PlatformTilopayModalProps) {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [apiKey, setApiKey] = useState('');
  const [apiUser, setApiUser] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [environment, setEnvironment] = useState<'PRODUCTION' | 'SANDBOX'>('PRODUCTION');
  const [isEnabled, setIsEnabled] = useState(true);

  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://betico.tech/api/webhooks/tilopay');
  const [isConfigured, setIsConfigured] = useState(false);
  const [source, setSource] = useState<'database' | 'environment' | 'none'>('none');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/superadmin/billing/platform-config');
      if (res) {
        setIsConfigured(Boolean(res.isConfigured));
        setIsEnabled(res.isEnabled !== false);
        setApiKey(res.apiKeyMasked || '');
        setApiUser(res.apiUser || '');
        setApiPassword(res.apiPasswordMasked || '');
        setEnvironment(res.environment === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION');
        setSource(res.source || 'none');
        if (res.webhookUrl) setWebhookUrl(res.webhookUrl);
      }
    } catch (err: any) {
      console.error('Error al cargar configuración de Tilopay:', err);
      setError(err.message || 'Error al cargar configuración de Tilopay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setTestResult(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);
      setSuccessMsg(null);

      const res = await api.post('/api/superadmin/billing/test-platform-config', {
        apiKey,
        apiUser,
        apiPassword,
        environment
      });

      if (res?.success) {
        setTestResult({ success: true, message: res.message || '¡Conexión validada exitosamente con Tilopay!' });
      } else {
        setTestResult({ success: false, message: res?.error || 'No fue posible validar las credenciales.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error en prueba de conexión.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUser.trim()) {
      setError('El API User de Tilopay es obligatorio.');
      return;
    }
    if (!apiKey.trim()) {
      setError('El API Key de Tilopay es obligatorio.');
      return;
    }
    if (!apiPassword.trim()) {
      setError('La contraseña de Tilopay es obligatoria.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await api.post('/api/superadmin/billing/platform-config', {
        apiKey,
        apiUser,
        apiPassword,
        environment,
        isEnabled
      });

      if (res?.success) {
        setSuccessMsg('✅ ¡Credenciales maestras de Tilopay guardadas con éxito!');
        setIsConfigured(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(res?.error || 'Error al guardar configuración.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar credenciales en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Pasarela Tilopay (Plataforma)
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Recepción de cobros por suscripciones mensuales de comercios
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: isConfigured ? '#f0fdf4' : '#fffbeb',
            border: '1px solid',
            borderColor: isConfigured ? '#bbf7d0' : '#fde68a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isConfigured ? (
                <CheckCircle size={18} color="#16a34a" />
              ) : (
                <AlertCircle size={18} color="#d97706" />
              )}
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: isConfigured ? '#15803d' : '#b45309' }}>
                {isConfigured 
                  ? 'Pasarela Maestra Configurada y Activa' 
                  : 'Pasarela Pendiente de Configurar'}
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '20px',
              backgroundColor: environment === 'PRODUCTION' ? '#dbeafe' : '#f3e8ff',
              color: environment === 'PRODUCTION' ? '#1e40af' : '#7e22ce'
            }}>
              {environment === 'PRODUCTION' ? '🟢 PRODUCCIÓN' : '🟡 SANDBOX'}
            </span>
          </div>

          {error && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '0.83rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              color: '#16a34a',
              fontSize: '0.83rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {testResult && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2',
              border: '1px solid',
              borderColor: testResult.success ? '#bbf7d0' : '#fecaca',
              borderRadius: '10px',
              color: testResult.success ? '#15803d' : '#dc2626',
              fontSize: '0.83rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              {testResult.success ? <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />}
              <div>
                <strong>{testResult.success ? 'Conexión Exitosa:' : 'Fallo de Autenticación:'}</strong> {testResult.message}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.85rem' }}>
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px auto' }} />
              Cargando configuración...
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Environment Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Ambiente de Operación:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEnvironment('PRODUCTION')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '2px solid',
                      borderColor: environment === 'PRODUCTION' ? '#2563eb' : '#e2e8f0',
                      backgroundColor: environment === 'PRODUCTION' ? '#eff6ff' : '#ffffff',
                      color: environment === 'PRODUCTION' ? '#1d4ed8' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Globe size={16} /> Producción (Real)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEnvironment('SANDBOX')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '2px solid',
                      borderColor: environment === 'SANDBOX' ? '#7c3aed' : '#e2e8f0',
                      backgroundColor: environment === 'SANDBOX' ? '#f5f3ff' : '#ffffff',
                      color: environment === 'SANDBOX' ? '#6d28d9' : '#64748b',
                      fontWeight: '700',
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Zap size={16} /> Sandbox (Pruebas)
                  </button>
                </div>
              </div>

              {/* API User */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  API User (Usuario Tilopay):
                </label>
                <input
                  type="text"
                  placeholder="ej. Z9iUbB o tu_usuario"
                  value={apiUser}
                  onChange={(e) => setApiUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Tu código de API User o usuario de acceso registrado en <code>app.tilopay.com</code>
                </span>
              </div>

              {/* API Key */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  API Key:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Ingresa tu API Key de Tilopay"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      fontFamily: showApiKey ? 'inherit' : 'monospace'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* API Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  API Password / Contraseña:
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Contraseña de API o de acceso a Tilopay"
                    value={apiPassword}
                    onChange={(e) => setApiPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      boxSizing: 'border-box',
                      fontFamily: showPassword ? 'inherit' : 'monospace'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Webhook Callback Notification Box */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#475569' }}>
                    🔗 URL de Webhook para Tilopay:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedWebhook ? '#16a34a' : '#2563eb',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px'
                    }}
                  >
                    {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
                    {copiedWebhook ? '¡Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <code style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#0f172a',
                  wordBreak: 'break-all'
                }}>
                  {webhookUrl}
                </code>
                <span style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: '1.3' }}>
                  Copia y pega esta URL en tu panel de Tilopay (Configuración → Webhooks) para recibir confirmaciones automáticas de vinculación de tarjetas.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || saving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={15} style={{ animation: testing ? 'spin 1s linear infinite' : 'none' }} />
                  {testing ? 'Verificando...' : '🧪 Probar Conexión'}
                </button>

                <button
                  type="submit"
                  disabled={saving || testing}
                  style={{
                    flex: 1.3,
                    padding: '12px',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <ShieldCheck size={16} />
                  {saving ? 'Guardando...' : '💾 Guardar Credenciales'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
