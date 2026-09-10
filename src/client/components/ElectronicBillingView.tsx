import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import {
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Info,
  CheckSquare,
  Square,
  Download,
  Building,
  Key,
  Globe,
  ShoppingCart,
  Calendar,
  Trophy,
  Utensils
} from 'lucide-react';
import { TenantAlmendroConfig, ElectronicVoucher } from '../../shared/types';
import { formatShortDateTime } from '../utils/dateFormat';

export default function ElectronicBillingView() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form State
  const [billingMode, setBillingMode] = useState<'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED'>('DISABLED');
  const [isEnabled, setIsEnabled] = useState(false);
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [defaultDocType, setDefaultDocType] = useState<'01' | '04'>('04');
  
  // Module Toggles
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [bookingsEnabled, setBookingsEnabled] = useState(true);
  const [courtsEnabled, setCourtsEnabled] = useState(false);
  const [restaurantEnabled, setRestaurantEnabled] = useState(false);

  // Taxpayer Info (Optional)
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [legalName, setLegalName] = useState('');
  const [economicActivityCode, setEconomicActivityCode] = useState('');
  const [branchCode, setBranchCode] = useState('001');
  const [posCode, setPosCode] = useState('00001');

  // Vouchers History
  const [vouchers, setVouchers] = useState<ElectronicVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res: TenantAlmendroConfig = await api.get('/api/almendro/config');
      if (res) {
        const rawMode = (res as any).billingMode as 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED' | undefined;
        const effectiveMode = rawMode || (res.isEnabled ? (res.apiKeyMasked ? 'ALMENDRO_AUTO' : 'EXTERNAL_MANUAL') : 'DISABLED');
        setBillingMode(effectiveMode);
        setIsEnabled(effectiveMode !== 'DISABLED');
        setEnvironment(res.environment || 'SANDBOX');
        setApiKeyMasked(res.apiKeyMasked || '');
        setDefaultDocType(res.defaultDocType || '04');
        
        if (res.moduleToggles) {
          setStoreEnabled(res.moduleToggles.storeEnabled !== false);
          setBookingsEnabled(res.moduleToggles.bookingsEnabled !== false);
          setCourtsEnabled(Boolean(res.moduleToggles.courtsEnabled));
          setRestaurantEnabled(Boolean(res.moduleToggles.restaurantEnabled));
        }

        setTaxIdNumber(res.taxIdNumber || '');
        setLegalName(res.legalName || '');
        setEconomicActivityCode(res.economicActivityCode || '');
        setBranchCode(res.branchCode || '001');
        setPosCode(res.posCode || '00001');

        if (!res.apiKeyMasked) {
          setIsEditingKey(true);
        }
      }
    } catch (e: any) {
      console.error('Error cargando configuración de Almendro:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const res = await api.get('/api/almendro/vouchers?limit=25');
      if (res && res.vouchers) {
        setVouchers(res.vouchers);
      }
    } catch (e: any) {
      console.error('Error cargando comprobantes:', e);
    } finally {
      setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadVouchers();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const res = await api.post('/api/almendro/test-connection', {
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

      const isEnabledValue = billingMode !== 'DISABLED';
      const payload: any = {
        isEnabled: isEnabledValue,
        billingMode,
        environment,
        defaultDocType,
        moduleToggles: {
          storeEnabled,
          bookingsEnabled,
          courtsEnabled,
          restaurantEnabled
        },
        taxIdNumber,
        legalName,
        economicActivityCode,
        branchCode,
        posCode
      };

      if (billingMode === 'ALMENDRO_AUTO' && isEditingKey && apiKey.trim()) {
        payload.apiKey = apiKey.trim();
      }

      const res = await api.post('/api/almendro/config', payload);
      if (res && res.config) {
        setApiKeyMasked(res.config.apiKeyMasked || '');
        setIsEditingKey(false);
        setApiKey('');
        alert('✅ ¡Configuración de Facturación Electrónica guardada con éxito!');
      }
    } catch (e: any) {
      alert('Error guardando configuración: ' + (e.message || 'Intente nuevamente'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <p>Cargando módulo de Facturación Electrónica...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
              <FileText size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>
                Facturación Electrónica Costa Rica
              </h1>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Integración oficial con el Ministerio de Hacienda / TRIBU-CR (Esquema v4.4)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '0.84rem',
            fontWeight: '700',
            padding: '5px 12px',
            borderRadius: '20px',
            backgroundColor: billingMode === 'ALMENDRO_AUTO' ? '#dcfce7' : billingMode === 'EXTERNAL_MANUAL' ? '#f3e8ff' : '#f1f5f9',
            color: billingMode === 'ALMENDRO_AUTO' ? '#15803d' : billingMode === 'EXTERNAL_MANUAL' ? '#7e22ce' : '#64748b'
          }}>
            {billingMode === 'ALMENDRO_AUTO' ? '⚡ Facturación Automática (Almendro)' : billingMode === 'EXTERNAL_MANUAL' ? '📋 Facturación Externa / Manual' : '○ Facturación Deshabilitada'}
          </span>
        </div>
      </div>

      {/* 2. SELECTOR DE MODALIDAD DE FACTURACIÓN */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--primary)" /> Selecciona la Modalidad de Facturación
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          
          {/* Opción 1: Automática con Almendro */}
          <div
            onClick={() => { setBillingMode('ALMENDRO_AUTO'); setIsEnabled(true); }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `2px solid ${billingMode === 'ALMENDRO_AUTO' ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: billingMode === 'ALMENDRO_AUTO' ? '#f0fdf4' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.92rem', color: billingMode === 'ALMENDRO_AUTO' ? '#166534' : 'var(--text)' }}>
                ⚡ Automática (Almendro / API)
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'ALMENDRO_AUTO'}
                onChange={() => { setBillingMode('ALMENDRO_AUTO'); setIsEnabled(true); }}
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              Emisión oficial automática ante Hacienda al pagar. Genera PDF oficial con QR y firma digital. Requiere API Key de Almendro.
            </p>
          </div>

          {/* Opción 2: Externa / Manual sin facturador */}
          <div
            onClick={() => { setBillingMode('EXTERNAL_MANUAL'); setIsEnabled(true); }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `2px solid ${billingMode === 'EXTERNAL_MANUAL' ? '#7c3aed' : 'var(--border)'}`,
              backgroundColor: billingMode === 'EXTERNAL_MANUAL' ? '#faf5ff' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.92rem', color: billingMode === 'EXTERNAL_MANUAL' ? '#6b21a8' : 'var(--text)' }}>
                📋 Facturación Externa / Manual
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'EXTERNAL_MANUAL'}
                onChange={() => { setBillingMode('EXTERNAL_MANUAL'); setIsEnabled(true); }}
                style={{ accentColor: '#7c3aed' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              <strong>Sin facturador integrado.</strong> Pide datos fiscales (cédula, razón social, correo) en el checkout para que emitas la factura en tu propio sistema (Quickbooks, Factun, ATV, etc.).
            </p>
          </div>

          {/* Opción 3: Deshabilitada */}
          <div
            onClick={() => { setBillingMode('DISABLED'); setIsEnabled(false); }}
            style={{
              padding: '16px',
              borderRadius: '10px',
              border: `2px solid ${billingMode === 'DISABLED' ? '#dc2626' : 'var(--border)'}`,
              backgroundColor: billingMode === 'DISABLED' ? '#fef2f2' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.92rem', color: billingMode === 'DISABLED' ? '#991b1b' : 'var(--text)' }}>
                🚫 Deshabilitada
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'DISABLED'}
                onChange={() => { setBillingMode('DISABLED'); setIsEnabled(false); }}
                style={{ accentColor: '#dc2626' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              No se solicitan datos de facturación electrónica a los clientes en la tienda virtual ni en reservas.
            </p>
          </div>

        </div>
      </div>

      {/* BANNER INFORMATIVO PARA FACTURACIÓN EXTERNA / MANUAL */}
      {billingMode === 'EXTERNAL_MANUAL' && (
        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #d8b4fe',
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px'
        }}>
          <div style={{ backgroundColor: '#7c3aed', color: 'white', padding: '6px', borderRadius: '8px', marginTop: '2px' }}>
            <FileText size={18} />
          </div>
          <div style={{ fontSize: '0.86rem', color: '#581c87', lineHeight: '1.5' }}>
            <strong style={{ fontSize: '0.95rem' }}>Modalidad de Facturación Externa Activada</strong>
            <p style={{ margin: '4px 0 8px 0' }}>
              Los clientes verán la casilla <em>«¿Necesita Factura Electrónica? (Hacienda CR)»</em> al comprar en tu tienda o reservar citas. Al abrir la orden en tu panel, verás su cédula, razón social y correo electrónico con botones para <strong>copiar con 1 solo clic</strong> y pegar directamente en tu sistema de facturación habitual (Quickbooks, Factun, GTI, STEL Order, ATV de Hacienda, etc.).
            </p>
            <span style={{ fontSize: '0.8rem', color: '#7e22ce' }}>
              💡 <em>No requieres suscripción, API Key ni conexión con Almendro para utilizar esta modalidad.</em>
            </span>
          </div>
        </div>
      )}

      {/* BANNER EDUCATIVO ALMENDRO (Solo si está en modo ALMENDRO_AUTO) */}
      {billingMode === 'ALMENDRO_AUTO' && (
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '6px', borderRadius: '8px', marginTop: '2px' }}>
              <Info size={20} />
            </div>
            <div style={{ flex: 1, fontSize: '0.88rem', color: '#334155', lineHeight: '1.5' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: '800', color: '#0f172a' }}>
                ¿Cómo funciona la Facturación Automática en Betico?
              </h3>
              <p style={{ margin: '0 0 10px 0' }}>
                Para cumplir con la normativa tributaria de Costa Rica sin fricción manual, Betico se conecta con <strong>Almendro Facturación Electrónica</strong> (<a href="https://fe.almendro.cr/?lang=es" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'underline' }}>fe.almendro.cr</a>), un Proveedor Autorizado de Facturación (PAC).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginTop: '12px' }}>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#16a34a" /> 100% Legal ante TRIBU-CR
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Genera la firma digital oficial (XAdES-EPES) y valida los 23 campos matemáticos exigidos por Hacienda.
                  </div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={16} color="#2563eb" /> Emisión Automática & WhatsApp
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    El cliente recibe su factura o tiquete en PDF oficial de inmediato tras pagar o reservar.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONFIGURATION FORM */}
      <form onSubmit={handleSave} style={{ opacity: billingMode !== 'DISABLED' ? 1 : 0.6, pointerEvents: billingMode !== 'DISABLED' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
        
        {/* CARD A: CREDENTIALS & ENVIRONMENT */}
        {billingMode === 'ALMENDRO_AUTO' && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 16px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="var(--primary)" /> Credenciales de Conexión Almendro
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            
            {/* Ambiente */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                Ambiente de Facturación
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <option value="SANDBOX">Sandbox / Pruebas (Sin validez legal ante Hacienda)</option>
                <option value="PRODUCTION">Producción (Comprobantes Reales ante Hacienda)</option>
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Usa Sandbox para hacer pruebas iniciales sin afectar tus declaraciones fiscales.
              </span>
            </div>

            {/* Tipo de Documento por Defecto */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text)' }}>
                Tipo de Comprobante Predeterminado
              </label>
              <select
                value={defaultDocType}
                onChange={(e) => setDefaultDocType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <option value="04">Tiquete Electrónico (Tipo 04 - B2C / No requiere cédula)</option>
                <option value="01">Factura Electrónica (Tipo 01 - B2B / Requiere cédula del receptor)</option>
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Si el cliente no brinda cédula, el sistema emitirá Tiquete Electrónico.
              </span>
            </div>
          </div>

          {/* API Key */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text)' }}>
                Llave de API de Almendro (Bearer Token)
              </label>
              {apiKeyMasked && !isEditingKey && (
                <button
                  type="button"
                  onClick={() => setIsEditingKey(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  Cambiar Llave
                </button>
              )}
            </div>

            {isEditingKey ? (
              <input
                type="password"
                placeholder="Pega aquí tu API Key generada en Almendro (ej. 1|abcdef123456...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.9rem'
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem',
                fontFamily: 'monospace'
              }}>
                <span>{apiKeyMasked || '••••••••••••••••'}</span>
                <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Cifrada con AES-256-GCM
                </span>
              </div>
            )}
          </div>

          {/* Connection Test Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || (!apiKey && !apiKeyMasked)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: 'white',
                color: '#334155',
                cursor: testing || (!apiKey && !apiKeyMasked) ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem'
              }}
            >
              {testing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} color="#2563eb" />}
              {testing ? 'Verificando con Almendro...' : 'Probar Conexión con Almendro'}
            </button>

            {testResult && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
                color: testResult.success ? '#15803d' : '#dc2626'
              }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* CARD B: MODULE-LEVEL TOGGLES (CHECKBOXES) */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={18} color="var(--primary)" /> {billingMode === 'ALMENDRO_AUTO' ? 'Módulos con Emisión Automática' : 'Módulos donde Solicitar Datos de Facturación'}
          </h2>
          <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {billingMode === 'ALMENDRO_AUTO'
              ? 'Selecciona en cuáles áreas de tu negocio deseas que el sistema emita y envíe comprobantes oficiales automáticamente:'
              : 'Selecciona en cuáles áreas de tu negocio deseas que el checkout pida cédula, razón social y correo de facturación al cliente:'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            
            {/* Tienda Virtual */}
            <div
              onClick={() => setStoreEnabled(!storeEnabled)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: `2px solid ${storeEnabled ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: storeEnabled ? 'var(--primary-light, #eff6ff)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ marginTop: '2px', color: storeEnabled ? 'var(--primary)' : '#94a3b8' }}>
                {storeEnabled ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingCart size={15} /> Tienda Virtual
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Factura pedidos confirmados (SINPE, transferencia o tarjeta).
                </div>
              </div>
            </div>

            {/* Reservas & Citas */}
            <div
              onClick={() => setBookingsEnabled(!bookingsEnabled)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: `2px solid ${bookingsEnabled ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: bookingsEnabled ? 'var(--primary-light, #eff6ff)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ marginTop: '2px', color: bookingsEnabled ? 'var(--primary)' : '#94a3b8' }}>
                {bookingsEnabled ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} /> Reservas & Citas
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Factura citas de servicios profesionales al completarse o pagarse.
                </div>
              </div>
            </div>

            {/* Canchas Deportivas */}
            <div
              onClick={() => setCourtsEnabled(!courtsEnabled)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: `2px solid ${courtsEnabled ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: courtsEnabled ? 'var(--primary-light, #eff6ff)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ marginTop: '2px', color: courtsEnabled ? 'var(--primary)' : '#94a3b8' }}>
                {courtsEnabled ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={15} /> Canchas Deportivas
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Factura reservas de canchas y partidos confirmados.
                </div>
              </div>
            </div>

            {/* Menú & Restaurante */}
            <div
              onClick={() => setRestaurantEnabled(!restaurantEnabled)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px',
                borderRadius: '10px',
                border: `2px solid ${restaurantEnabled ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: restaurantEnabled ? 'var(--primary-light, #eff6ff)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <div style={{ marginTop: '2px', color: restaurantEnabled ? 'var(--primary)' : '#94a3b8' }}>
                {restaurantEnabled ? <CheckSquare size={20} /> : <Square size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Utensils size={15} /> Menú & Restaurante
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Factura comandas y platillos al despacharse en cocina.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD C: EMISOR BRANCH & POS CODES (ADVANCED) */}
        {billingMode === 'ALMENDRO_AUTO' && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="var(--primary)" /> Parámetros de Sucursal y Terminal
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                  Código de Sucursal (3 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  placeholder="001"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>
                  Punto de Venta / Caja (5 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="00001"
                  value={posCode}
                  onChange={(e) => setPosCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saving && <RefreshCw size={16} className="animate-spin" />}
            {saving ? 'Guardando Ajustes...' : 'Guardar Configuración de Facturación'}
          </button>
        </div>
      </form>

      {/* 4. VOUCHERS HISTORY TABLE */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
              Comprobantes Electrónicos Emitidos
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Historial de facturas y tiquetes procesados ante Hacienda
            </span>
          </div>

          <button
            type="button"
            onClick={loadVouchers}
            disabled={loadingVouchers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={14} className={loadingVouchers ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {vouchers.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Aún no se han emitido comprobantes electrónicos.</p>
            <span style={{ fontSize: '0.78rem' }}>Las facturas generadas por tus ventas aparecerán aquí con su enlace de descarga.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Fecha</th>
                  <th style={{ padding: '10px 8px' }}>Tipo</th>
                  <th style={{ padding: '10px 8px' }}>Clave Hacienda</th>
                  <th style={{ padding: '10px 8px' }}>Receptor</th>
                  <th style={{ padding: '10px 8px' }}>Total</th>
                  <th style={{ padding: '10px 8px' }}>Estado</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => {
                  const isAccepted = v.status === 'accepted';
                  const isRejected = v.status === 'rejected';

                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                        {formatShortDateTime(v.createdAt)}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          backgroundColor: v.docType === '01' ? '#eff6ff' : '#f1f5f9',
                          color: v.docType === '01' ? '#2563eb' : '#475569'
                        }}>
                          {v.docType === '01' ? 'Factura' : v.docType === '03' ? 'Nota Crédito' : 'Tiquete'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {v.numericKey ? `${v.numericKey.slice(0, 10)}...${v.numericKey.slice(-8)}` : 'En proceso'}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {v.receiverName || 'Cliente Particular'}
                        </div>
                        {v.receiverIdNumber && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            ID: {v.receiverIdNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: '700', color: 'var(--text)' }}>
                        {v.currency === 'USD' ? '$' : '₡'}{Number(v.totalAmount).toLocaleString('es-CR')}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: isAccepted ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef9c3',
                          color: isAccepted ? '#15803d' : isRejected ? '#dc2626' : '#854d0e'
                        }}>
                          {isAccepted ? <CheckCircle2 size={12} /> : isRejected ? <XCircle size={12} /> : <RefreshCw size={12} />}
                          {isAccepted ? 'Aceptado' : isRejected ? 'Rechazado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {Boolean(v.pdfUrl || v.numericKey) ? (
                          <a
                            href={
                              v.pdfUrl && !v.pdfUrl.includes('fe.almendro.cr')
                                ? v.pdfUrl
                                : `/api/almendro/public/voucher-pdf/${v.numericKey || v.id}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#eff6ff',
                              color: 'var(--primary)',
                              textDecoration: 'none'
                            }}
                            title="Ver / Descargar PDF Oficial"
                          >
                            <Download size={15} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
