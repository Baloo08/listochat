import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Key,
  Shield,
  CreditCard,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Save
} from 'lucide-react';
import { useAdminApi } from '../useAdminApi';

export default function PlatformSettingsView() {
  const api = useAdminApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTilopay, setTestingTilopay] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [masterAiKey, setMasterAiKey] = useState('');
  const [masterAiModel, setMasterAiModel] = useState('gemini-2.5-flash');
  const [masterAiProvider, setMasterAiProvider] = useState('gemini');

  const [tilopayApiKey, setTilopayApiKey] = useState('');
  const [tilopayApiUser, setTilopayApiUser] = useState('');
  const [tilopayApiPassword, setTilopayApiPassword] = useState('');
  const [tilopayEnvironment, setTilopayEnvironment] = useState('PRODUCTION');
  const [tilopayIsEnabled, setTilopayIsEnabled] = useState(true);

  const [superadminNotifyPhone, setSuperadminNotifyPhone] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/platform/settings');
      if (data) {
        setMasterAiKey(data.masterAiKeyMasked || '');
        setMasterAiModel(data.masterAiModel || 'gemini-2.5-flash');
        setMasterAiProvider(data.masterAiProvider || 'gemini');

        setTilopayApiKey(data.tilopayApiKeyMasked || '');
        setTilopayApiUser(data.tilopayApiUser || '');
        setTilopayEnvironment(data.tilopayEnvironment || 'PRODUCTION');
        setTilopayIsEnabled(data.tilopayIsEnabled !== false);

        setSuperadminNotifyPhone(data.superadminNotifyPhone || '');
        setWebhookUrl(data.webhookUrl || '');
      }
    } catch (e: any) {
      console.error('Error cargando configuración:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMessage(null);
    try {
      const res = await api.post('/api/platform/settings', {
        masterAiKey,
        masterAiModel,
        masterAiProvider,
        tilopayApiKey,
        tilopayApiUser,
        tilopayApiPassword,
        tilopayEnvironment,
        tilopayIsEnabled,
        superadminNotifyPhone
      });
      setToastMessage(res.message || 'Configuración de plataforma guardada exitosamente');
      await loadSettings();
    } catch (err: any) {
      alert('Error guardando configuración: ' + (err.message || 'Error'));
    } finally {
      setSaving(false);
    }
  };

  const handleTestTilopay = async () => {
    setTestingTilopay(true);
    setTestResult(null);
    try {
      const res = await api.post('/api/platform/test-tilopay', {
        apiKey: tilopayApiKey,
        apiUser: tilopayApiUser,
        apiPassword: tilopayApiPassword
      });
      setTestResult({
        success: true,
        message: res.message || 'Conexión exitosa con Tilopay'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error de conexión con Tilopay'
      });
    } finally {
      setTestingTilopay(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
        <RotateCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: '#34D399' }} />
        <p style={{ margin: 0, fontSize: '1rem' }}>Cargando ajustes de plataforma...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={26} style={{ color: '#34D399' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#FAF8F5' }}>
            Ajustes de Infraestructura y Plataforma
          </h1>
        </div>
        <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
          Configuración global de la llave maestra de IA, credenciales de pasarela Tilopay y canal de alertas
        </p>
      </div>

      {toastMessage && (
        <div style={{
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          color: '#34D399',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        
        {/* SECCIÓN 1: MOTOR DE IA MAESTRO (GOOGLE GEMINI) */}
        <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Zap size={20} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
              Motor de IA Maestro (Google Gemini)
            </h2>
          </div>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Esta llave alimenta a los chatbots maestros de soporte y venta, y actúa como respaldo para comercios que no cuentan con su propia llave BYOK.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                API Key Maestra de Gemini
              </label>
              <input
                type="password"
                placeholder="Ingresa la API Key de Google Gemini..."
                value={masterAiKey}
                onChange={(e) => setMasterAiKey(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                Modelo Maestro por Defecto
              </label>
              <select
                value={masterAiModel}
                onChange={(e) => setMasterAiModel(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Ultra rápido)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Razonamiento complejo)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PASARELA DE COBROS RECURRENTES (TILOPAY) */}
        <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={20} color="#34D399" />
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
                Credenciales Maestras de Tilopay (Cobranza Recurrente)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleTestTilopay}
              disabled={testingTilopay}
              style={{
                padding: '7px 14px',
                backgroundColor: '#16383b',
                border: '1px solid #245053',
                borderRadius: '8px',
                color: '#34D399',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCw size={14} className={testingTilopay ? 'animate-spin' : ''} />
              {testingTilopay ? 'Probando...' : 'Probar Conexión Tilopay'}
            </button>
          </div>

          {testResult && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: testResult.success ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: testResult.success ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: testResult.success ? '#34D399' : '#f87171'
            }}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {testResult.message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                API Key de Plataforma
              </label>
              <input
                type="password"
                placeholder="Key suministrada por Tilopay..."
                value={tilopayApiKey}
                onChange={(e) => setTilopayApiKey(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                Usuario / Correo de API
              </label>
              <input
                type="text"
                placeholder="usuario@comercio.cr"
                value={tilopayApiUser}
                onChange={(e) => setTilopayApiUser(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                Contraseña de API (Para renovación de tokens)
              </label>
              <input
                type="password"
                placeholder="Contraseña del usuario de API..."
                value={tilopayApiPassword}
                onChange={(e) => setTilopayApiPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                Entorno de Pasarela
              </label>
              <select
                value={tilopayEnvironment}
                onChange={(e) => setTilopayEnvironment(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
              >
                <option value="PRODUCTION">Producción (Cobros reales bancarios)</option>
                <option value="SANDBOX">Sandbox (Pruebas de desarrollo)</option>
              </select>
            </div>
          </div>

          {/* Webhook Callback Display */}
          <div style={{ backgroundColor: '#071213', padding: '12px 16px', borderRadius: '10px', border: '1px solid #1a3e40', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                URL de Webhook Callback (Configurar en el panel de Tilopay)
              </span>
              <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>
                {webhookUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={copyWebhook}
              style={{
                padding: '6px 12px',
                backgroundColor: '#16383b',
                color: '#FAF8F5',
                border: '1px solid #234b4e',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {copiedWebhook ? <Check size={13} /> : <Copy size={13} />}
              {copiedWebhook ? 'Copiada' : 'Copiar URL'}
            </button>
          </div>
        </div>

        {/* SECCIÓN 3: NOTIFICACIONES Y ALERTAS DE SUPERADMIN */}
        <div style={{ backgroundColor: '#0f2426', border: '1px solid #1a3e40', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Phone size={20} color="#34D399" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FAF8F5' }}>
              Canal de Notificaciones de SuperAdmin
            </h2>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
              Número de WhatsApp para Alertas Automáticas
            </label>
            <input
              type="text"
              placeholder="Ej. 50688888888"
              value={superadminNotifyPhone}
              onChange={(e) => setSuperadminNotifyPhone(e.target.value)}
              style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', backgroundColor: '#071213', color: '#FAF8F5', border: '1px solid #234b4e', borderRadius: '8px', boxSizing: 'border-box' }}
            />
            <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              El sistema enviará alertas en tiempo real a este número cuando un cliente suba un comprobante de pago o se registre un nuevo comercio.
            </p>
          </div>
        </div>

        {/* BOTÓN GUARDAR CONFIGURACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              borderRadius: '10px',
              color: '#FAF8F5',
              fontSize: '0.95rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(52, 211, 153, 0.2)'
            }}
          >
            <Save size={18} />
            {saving ? 'Guardando Ajustes...' : 'Guardar Todos los Ajustes'}
          </button>
        </div>

      </form>

    </div>
  );
}
