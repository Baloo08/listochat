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
  Download,
  Building,
  Key,
  Globe,
  ShoppingCart,
  Calendar,
  Trophy,
  Utensils,
  HelpCircle,
  Award,
  Lock,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  AlertTriangle
} from 'lucide-react';
import { ElectronicVoucher } from '../../shared/types';
import { formatShortDateTime } from '../utils/dateFormat';

interface NativeConfig {
  environment: 'sandbox' | 'production';
  taxpayerIdType: '01' | '02' | '03' | '04';
  taxpayerIdNumber: string;
  taxpayerName: string;
  commercialName?: string;
  taxpayerEmail: string;
  taxpayerPhone?: string;
  economicActivityCode: string;
  province: string;
  canton: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  idpUsername: string;
  idpPasswordMasked?: string;
  p12Filename?: string;
  p12ExpiresAt?: string | null;
  p12HasCertificate: boolean;
  branchCode: string;
  posCode: string;
  defaultDocType: '01' | '04';
  isConnected: boolean;
  lastTestAt?: string | null;
  lastTestMessage?: string | null;
  providerMode: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
  useAlternativeProvider: boolean;
  active: boolean;
}

interface UsageData {
  emitted: number;
  quota: number;
  remaining: number;
  inCourtesy: boolean;
  courtesyUsed: number;
  courtesyAvailable: number;
  isBlocked: boolean;
  cycleStartDate: string;
  cycleEndDate: string;
  planName: string;
}

export default function ElectronicBillingView() {
  const api = useApi();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Modalidad seleccionada
  const [billingMode, setBillingMode] = useState<'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED'>('BETICO_NATIVE');
  const [showAlternativeProvider, setShowAlternativeProvider] = useState(false);

  // Cuota y Consumo del ciclo
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Configuración Nativa Betico
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [taxpayerIdType, setTaxpayerIdType] = useState<'01' | '02' | '03' | '04'>('01');
  const [taxpayerIdNumber, setTaxpayerIdNumber] = useState('');
  const [taxpayerName, setTaxpayerName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [taxpayerEmail, setTaxpayerEmail] = useState('');
  const [taxpayerPhone, setTaxpayerPhone] = useState('');
  const [economicActivityCode, setEconomicActivityCode] = useState('');
  const [province, setProvince] = useState('1');
  const [canton, setCanton] = useState('01');
  const [district, setDistrict] = useState('01');
  const [neighborhood, setNeighborhood] = useState('01');
  const [addressDetail, setAddressDetail] = useState('');
  const [branchCode, setBranchCode] = useState('001');
  const [posCode, setPosCode] = useState('00001');
  const [defaultDocType, setDefaultDocType] = useState<'01' | '04'>('04');

  // Credenciales ATV
  const [idpUsername, setIdpUsername] = useState('');
  const [idpPassword, setIdpPassword] = useState('');
  const [hasIdpPassword, setHasIdpPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // Certificado .p12
  const [p12File, setP12File] = useState<File | null>(null);
  const [p12Pin, setP12Pin] = useState('');
  const [hasExistingCert, setHasExistingCert] = useState(false);
  const [certFilename, setCertFilename] = useState('');
  const [certExpiresAt, setCertExpiresAt] = useState<string | null>(null);

  // Almendro Config (Proveedor alternativo opcional)
  const [almendroApiKey, setAlmendroApiKey] = useState('');
  const [almendroApiKeyMasked, setAlmendroApiKeyMasked] = useState('');
  const [isEditingAlmendroKey, setIsEditingAlmendroKey] = useState(false);

  // Módulos activos para facturar
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [bookingsEnabled, setBookingsEnabled] = useState(true);
  const [courtsEnabled, setCourtsEnabled] = useState(false);
  const [restaurantEnabled, setRestaurantEnabled] = useState(false);

  // Guías visuales ATV desplegables
  const [showAtvGuide, setShowAtvGuide] = useState(false);
  const [showP12Guide, setShowP12Guide] = useState(false);

  // Historial de comprobantes
  const [vouchers, setVouchers] = useState<ElectronicVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Cargar Configuración Nativa Betico
      const nativeRes = await api.get('/api/billing/native/config');
      if (nativeRes && nativeRes.config) {
        const c: NativeConfig = nativeRes.config;
        setBillingMode(c.providerMode || 'BETICO_NATIVE');
        setShowAlternativeProvider(Boolean(c.useAlternativeProvider));
        setEnvironment(c.environment || 'sandbox');
        setTaxpayerIdType(c.taxpayerIdType || '01');
        setTaxpayerIdNumber(c.taxpayerIdNumber || '');
        setTaxpayerName(c.taxpayerName || '');
        setCommercialName(c.commercialName || '');
        setTaxpayerEmail(c.taxpayerEmail || '');
        setTaxpayerPhone(c.taxpayerPhone || '');
        setEconomicActivityCode(c.economicActivityCode || '');
        setProvince(c.province || '1');
        setCanton(c.canton || '01');
        setDistrict(c.district || '01');
        setNeighborhood(c.neighborhood || '01');
        setAddressDetail(c.addressDetail || '');
        setBranchCode(c.branchCode || '001');
        setPosCode(c.posCode || '00001');
        setDefaultDocType(c.defaultDocType || '04');
        setIdpUsername(c.idpUsername || '');
        setHasIdpPassword(Boolean(c.idpPasswordMasked));
        setHasExistingCert(Boolean(c.p12HasCertificate));
        setCertFilename(c.p12Filename || '');
        setCertExpiresAt(c.p12ExpiresAt || null);

        if (!c.idpPasswordMasked) {
          setIsEditingPassword(true);
        }
      }

      // 2. Cargar Cuota y Consumo Mensual
      const usageRes = await api.get('/api/billing/native/usage');
      if (usageRes && usageRes.usage) {
        setUsage(usageRes.usage);
      }

      // 3. Cargar configuración de Almendro para modo alternativo
      try {
        const almendroRes = await api.get('/api/almendro/config');
        if (almendroRes) {
          setAlmendroApiKeyMasked(almendroRes.apiKeyMasked || '');
          if (almendroRes.moduleToggles) {
            setStoreEnabled(almendroRes.moduleToggles.storeEnabled !== false);
            setBookingsEnabled(almendroRes.moduleToggles.bookingsEnabled !== false);
            setCourtsEnabled(Boolean(almendroRes.moduleToggles.courtsEnabled));
            setRestaurantEnabled(Boolean(almendroRes.moduleToggles.restaurantEnabled));
          }
          if (!almendroRes.apiKeyMasked) {
            setIsEditingAlmendroKey(true);
          }
        }
      } catch (_) {}

    } catch (e: any) {
      console.error('Error cargando configuración de facturación:', e);
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
    loadData();
    loadVouchers();
  }, []);

  // Probar conexión integral con Hacienda
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      if (billingMode === 'BETICO_NATIVE') {
        const res = await api.post('/api/billing/native/test-connection', {});
        setTestResult(res);
      } else if (billingMode === 'ALMENDRO_AUTO') {
        const res = await api.post('/api/almendro/test-connection', {
          apiKey: isEditingAlmendroKey ? almendroApiKey : undefined,
          environment: environment === 'production' ? 'PRODUCTION' : 'SANDBOX'
        });
        setTestResult(res);
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e.message || 'Error probando conexión con el Ministerio de Hacienda'
      });
    } finally {
      setTesting(false);
    }
  };

  // Guardar configuración completa
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setTestResult(null);

      if (billingMode === 'BETICO_NATIVE') {
        const formData = new FormData();
        formData.append('environment', environment);
        formData.append('taxpayerIdType', taxpayerIdType);
        formData.append('taxpayerIdNumber', taxpayerIdNumber);
        formData.append('taxpayerName', taxpayerName);
        formData.append('commercialName', commercialName);
        formData.append('taxpayerEmail', taxpayerEmail);
        formData.append('taxpayerPhone', taxpayerPhone);
        formData.append('economicActivityCode', economicActivityCode);
        formData.append('province', province);
        formData.append('canton', canton);
        formData.append('district', district);
        formData.append('neighborhood', neighborhood);
        formData.append('addressDetail', addressDetail);
        formData.append('branchCode', branchCode);
        formData.append('posCode', posCode);
        formData.append('defaultDocType', defaultDocType);
        formData.append('providerMode', billingMode);
        formData.append('useAlternativeProvider', String(showAlternativeProvider));
        formData.append('idpUsername', idpUsername);

        if (isEditingPassword && idpPassword.trim()) {
          formData.append('idpPassword', idpPassword.trim());
        }

        if (p12File) {
          formData.append('certificateFile', p12File);
        }

        if (p12Pin.trim()) {
          formData.append('p12Pin', p12Pin.trim());
        }

        const res = await fetch('/api/billing/native/config', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: formData
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Error guardando datos fiscales');
        }

        alert('✅ ¡Configuración de Betico Facturación Electrónica guardada con éxito!');
        setP12File(null);
        setP12Pin('');
        setIsEditingPassword(false);
        await loadData();

      } else if (billingMode === 'ALMENDRO_AUTO' || billingMode === 'EXTERNAL_MANUAL' || billingMode === 'DISABLED') {
        // Guardar configuración en Almendro / Externa
        const payload: any = {
          isEnabled: billingMode !== 'DISABLED',
          billingMode,
          environment: environment === 'production' ? 'PRODUCTION' : 'SANDBOX',
          defaultDocType,
          moduleToggles: { storeEnabled, bookingsEnabled, courtsEnabled, restaurantEnabled },
          taxIdNumber: taxpayerIdNumber,
          legalName: taxpayerName,
          economicActivityCode,
          branchCode,
          posCode
        };

        if (billingMode === 'ALMENDRO_AUTO' && isEditingAlmendroKey && almendroApiKey.trim()) {
          payload.apiKey = almendroApiKey.trim();
        }

        await api.post('/api/almendro/config', payload);

        // Guardar también en nativo el providerMode
        await api.post('/api/billing/native/config', {
          providerMode: billingMode,
          useAlternativeProvider: showAlternativeProvider
        });

        alert('✅ ¡Modalidad de facturación guardada exitosamente!');
        await loadData();
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

  // Porcentaje de consumo para la barra
  const quotaTotal = usage?.quota || 100;
  const emittedCount = usage?.emitted || 0;
  const percentUsed = Math.min(100, Math.round((emittedCount / quotaTotal) * 100));
  const isNearLimit = percentUsed >= 80;
  const isOverLimit = emittedCount >= quotaTotal;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* 1. CABECERA Y RESUMEN GENERAL */}
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
                Integración oficial con el Ministerio de Hacienda (Esquema v4.4 DGT)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '0.84rem',
            fontWeight: '700',
            padding: '5px 14px',
            borderRadius: '20px',
            backgroundColor: billingMode === 'BETICO_NATIVE' ? '#dcfce7' : billingMode === 'ALMENDRO_AUTO' ? '#eff6ff' : billingMode === 'EXTERNAL_MANUAL' ? '#f3e8ff' : '#f1f5f9',
            color: billingMode === 'BETICO_NATIVE' ? '#15803d' : billingMode === 'ALMENDRO_AUTO' ? '#1d4ed8' : billingMode === 'EXTERNAL_MANUAL' ? '#7e22ce' : '#64748b'
          }}>
            {billingMode === 'BETICO_NATIVE' ? '⚡ Betico Nativo (Recomendado)' : billingMode === 'ALMENDRO_AUTO' ? '⚡ Almendro API' : billingMode === 'EXTERNAL_MANUAL' ? '📋 Facturación Externa' : '○ Deshabilitada'}
          </span>
        </div>
      </div>

      {/* 2. WIDGET DE CUOTA MENSUAL Y CONSUMO */}
      {usage && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: `1px solid ${isOverLimit ? '#fca5a5' : isNearLimit ? '#fde68a' : 'var(--border)'}`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)',
          background: isOverLimit ? 'linear-gradient(180deg, #fff5f5 0%, var(--surface) 100%)' : 'var(--surface)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Award size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.0rem', fontWeight: '800', color: 'var(--text)' }}>
                  Cuota Mensual de Facturación ({usage.planName.toUpperCase()})
                </h3>
                {usage.inCourtesy && (
                  <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                    🎁 Margen de Cortesía Activo (+{usage.courtesyUsed}/10)
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Tu plan incluye <strong>{usage.quota} comprobantes oficiales</strong> cada mes sin costo adicional.
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '900', color: isOverLimit ? '#dc2626' : 'var(--text)' }}>
                {usage.emitted} / {usage.quota}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>comprobantes</span>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div style={{ width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              width: `${percentUsed}%`,
              height: '100%',
              backgroundColor: isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981',
              borderRadius: '6px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '8px' }}>
            <span>
              {isOverLimit 
                ? `⚠️ Has completado tu cuota base de ${usage.quota} comprobantes. Puedes emitir hasta 10 comprobantes de cortesía.` 
                : `Te quedan ${usage.remaining} comprobantes disponibles este ciclo.`}
            </span>
            <span>
              Tu ciclo se reinicia el <strong>{usage.cycleEndDate}</strong> con tu fecha de corte.
            </span>
          </div>
        </div>
      )}

      {/* 3. SELECTOR DE MODALIDAD DE FACTURACIÓN */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '22px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--primary)" /> Selecciona la Modalidad de Facturación
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          
          {/* Opción 1: BETICO FACTURACIÓN ELECTRÓNICA NATIVA (RECOMENDADO) */}
          <div
            onClick={() => setBillingMode('BETICO_NATIVE')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              border: `2px solid ${billingMode === 'BETICO_NATIVE' ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: billingMode === 'BETICO_NATIVE' ? '#f0fdf4' : 'var(--surface)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '800', fontSize: '0.96rem', color: billingMode === 'BETICO_NATIVE' ? '#166534' : 'var(--text)' }}>
                  ⚡ Betico Facturación Electrónica
                </span>
              </div>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'BETICO_NATIVE'}
                onChange={() => setBillingMode('BETICO_NATIVE')}
                style={{ accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '800', marginBottom: '8px' }}>
              <Check size={12} /> Opción Principal Recomendada
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}>
              Emisión directa oficial ante el Ministerio de Hacienda (DGT v4.4). Incluye firma digital con tu llave criptográfica, generación de XML y PDF con código QR.
            </p>
          </div>

          {/* Opción 2: FACTURACIÓN EXTERNA / MANUAL */}
          <div
            onClick={() => setBillingMode('EXTERNAL_MANUAL')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              border: `2px solid ${billingMode === 'EXTERNAL_MANUAL' ? '#7c3aed' : 'var(--border)'}`,
              backgroundColor: billingMode === 'EXTERNAL_MANUAL' ? '#faf5ff' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.94rem', color: billingMode === 'EXTERNAL_MANUAL' ? '#6b21a8' : 'var(--text)' }}>
                📋 Facturación Externa y Manual
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'EXTERNAL_MANUAL'}
                onChange={() => setBillingMode('EXTERNAL_MANUAL')}
                style={{ accentColor: '#7c3aed' }}
              />
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              Solicita la cédula y razón social a los clientes en la tienda o citas para que emitas la factura en tu propio sistema contable (Quickbooks, Factun, ATV directo, etc.).
            </p>
          </div>

          {/* Opción 3: DESHABILITADA */}
          <div
            onClick={() => setBillingMode('DISABLED')}
            style={{
              padding: '18px',
              borderRadius: '12px',
              border: `2px solid ${billingMode === 'DISABLED' ? '#dc2626' : 'var(--border)'}`,
              backgroundColor: billingMode === 'DISABLED' ? '#fef2f2' : 'var(--surface)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.94rem', color: billingMode === 'DISABLED' ? '#991b1b' : 'var(--text)' }}>
                🚫 Deshabilitada
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'DISABLED'}
                onChange={() => setBillingMode('DISABLED')}
                style={{ accentColor: '#dc2626' }}
              />
            </div>

            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4' }}>
              No se solicitan datos fiscales ni se emiten comprobantes electrónicos en tus ventas o reservas.
            </p>
          </div>

        </div>

        {/* INTERRUPTOR PARA MOSTRAR ALMENDRO COMO PROVEEDOR ALTERNATIVO */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text)' }}>
            <input
              type="checkbox"
              checked={showAlternativeProvider}
              onChange={(e) => {
                setShowAlternativeProvider(e.target.checked);
                if (!e.target.checked && billingMode === 'ALMENDRO_AUTO') {
                  setBillingMode('BETICO_NATIVE');
                }
              }}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>¿Tienes una cuenta existente con Almendro? <strong>Habilitar proveedor alternativo</strong></span>
          </label>
        </div>

        {/* TARJETA DE ALMENDRO (SÓLO SI ESTÁ HABILITADO EL PROVEEDOR ALTERNATIVO) */}
        {showAlternativeProvider && (
          <div
            onClick={() => setBillingMode('ALMENDRO_AUTO')}
            style={{
              marginTop: '14px',
              padding: '16px',
              borderRadius: '12px',
              border: `2px solid ${billingMode === 'ALMENDRO_AUTO' ? '#2563eb' : 'var(--border)'}`,
              backgroundColor: billingMode === 'ALMENDRO_AUTO' ? '#eff6ff' : 'var(--background)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: '800', fontSize: '0.92rem', color: billingMode === 'ALMENDRO_AUTO' ? '#1e40af' : 'var(--text)' }}>
                ⚡ Almendro Facturación (Proveedor Alternativo por API)
              </span>
              <input
                type="radio"
                name="billingMode"
                checked={billingMode === 'ALMENDRO_AUTO'}
                onChange={() => setBillingMode('ALMENDRO_AUTO')}
                style={{ accentColor: '#2563eb' }}
              />
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Conexión externa utilizando tu propia API Key de Almendro. Requiere plan de emisión contratado por aparte con Almendro.
            </p>
          </div>
        )}
      </div>

      {/* 4. FORMULARIO PRINCIPAL: BETICO FACTURACIÓN ELECTRÓNICA NATIVA */}
      {billingMode === 'BETICO_NATIVE' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PASO 1: DATOS FISCALES DEL CONTRIBUYENTE */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                1
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                Datos Fiscales del Contribuyente
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Entorno de Emisión *
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontWeight: '600' }}
                >
                  <option value="sandbox">Sandbox (Pruebas y Certificación)</option>
                  <option value="production">Producción (Hacienda Real)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Tipo de Cédula *
                </label>
                <select
                  value={taxpayerIdType}
                  onChange={(e) => setTaxpayerIdType(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                >
                  <option value="01">Física (9 dígitos)</option>
                  <option value="02">Jurídica (10 dígitos)</option>
                  <option value="03">DIMEX (11 o 12 dígitos)</option>
                  <option value="04">NITE (10 dígitos)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Número de Cédula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 3101234567"
                  value={taxpayerIdNumber}
                  onChange={(e) => setTaxpayerIdNumber(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tal como está inscrito en Hacienda"
                  value={taxpayerName}
                  onChange={(e) => setTaxpayerName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Nombre Comercial (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Nombre de tu negocio o marca"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Correo Fiscal Oficial *
                </label>
                <input
                  type="email"
                  required
                  placeholder="facturacion@tunegocio.cr"
                  value={taxpayerEmail}
                  onChange={(e) => setTaxpayerEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Código Actividad Económica (CIIU) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 722003 (6 dígitos)"
                  value={economicActivityCode}
                  onChange={(e) => setEconomicActivityCode(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Documento Predeterminado *
                </label>
                <select
                  value={defaultDocType}
                  onChange={(e) => setDefaultDocType(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                >
                  <option value="04">Tiquete Electrónico (04) - Rápido para público</option>
                  <option value="01">Factura Electrónica (01) - Con crédito fiscal</option>
                </select>
              </div>

            </div>

            {/* Dirección Detallada */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Provincia</label>
                <select value={province} onChange={(e) => setProvince(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                  <option value="1">1 - San José</option>
                  <option value="2">2 - Alajuela</option>
                  <option value="3">3 - Cartago</option>
                  <option value="4">4 - Heredia</option>
                  <option value="5">5 - Guanacaste</option>
                  <option value="6">6 - Puntarenas</option>
                  <option value="7">7 - Limón</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Cantón (2 dígitos)</label>
                <input type="text" value={canton} onChange={(e) => setCanton(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Distrito (2 dígitos)</label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Barrio (2 dígitos)</label>
                <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                Otras Señas / Dirección Exacta *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. De la iglesia 100 metros norte, local esquinero"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* PASO 2: CREDENCIALES ATV DE HACIENDA */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                  2
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                  Credenciales del API en ATV (Hacienda)
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowAtvGuide(!showAtvGuide)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={15} />
                {showAtvGuide ? 'Ocultar guía' : '¿Cómo genero estas credenciales en ATV?'}
              </button>
            </div>

            {/* Guía Explicativa ATV */}
            {showAtvGuide && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', fontSize: '0.82rem', lineHeight: '1.5', color: '#334155' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text)' }}>
                  Pasos para generar tus credenciales en el portal oficial ATV de Hacienda:
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Ingresa al portal ATV en <a href="https://atv.hacienda.go.cr/ATV/Login.aspx" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>atv.hacienda.go.cr</a>.</li>
                  <li>Ve a la pestaña superior <strong>Comprobantes Electrónicos</strong> y selecciona <strong>Llave Criptográfica de Producción</strong> (o Staging para pruebas).</li>
                  <li>Haz clic en <strong>Generar Contraseña en Producción</strong>. Copia el <em>Usuario</em> generado (ej. <code>cpf-01-XXXX-XXXX@prod</code>) y la <em>Contraseña</em> temporal.</li>
                  <li>Pégalos en los campos a continuación.</li>
                </ol>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Usuario del API de Hacienda *
                </label>
                <input
                  type="text"
                  required
                  placeholder={environment === 'production' ? 'cpf-01-XXXX-XXXX@prod' : 'cpf-01-XXXX-XXXX@stag'}
                  value={idpUsername}
                  onChange={(e) => setIdpUsername(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                    Contraseña del API de Hacienda *
                  </label>
                  {hasIdpPassword && !isEditingPassword && (
                    <button
                      type="button"
                      onClick={() => { setIsEditingPassword(true); setIdpPassword(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Cambiar contraseña
                    </button>
                  )}
                </div>

                {hasIdpPassword && !isEditingPassword ? (
                  <div style={{ padding: '9px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    •••••••••••••••••••• (Guardada de forma segura)
                  </div>
                ) : (
                  <input
                    type="password"
                    required={!hasIdpPassword}
                    placeholder="Contraseña generada en ATV"
                    value={idpPassword}
                    onChange={(e) => setIdpPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* PASO 3: CERTIFICADO CRIPTOGRÁFICO (.p12) Y PIN */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' }}>
                  3
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                  Certificado Criptográfico de Firma (.p12) y PIN
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowP12Guide(!showP12Guide)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={15} />
                {showP12Guide ? 'Ocultar guía' : '¿Cómo descargo el archivo .p12?'}
              </button>
            </div>

            {/* Guía Explicativa .p12 */}
            {showP12Guide && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', fontSize: '0.82rem', lineHeight: '1.5', color: '#334155' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text)' }}>
                  Cómo generar tu archivo de firma digital (.p12):
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>En ATV, ve a <strong>Comprobantes Electrónicos</strong> &gt; <strong>Llave Criptográfica de Producción</strong>.</li>
                  <li>Introduce un PIN de 4 dígitos numéricos que tú elijas y recuérdalo bien.</li>
                  <li>Presiona <strong>Generar</strong> y descarga el archivo que terminará en <code>.p12</code> en tu computadora o teléfono.</li>
                  <li>Sube ese archivo y digita el mismo PIN de 4 dígitos a continuación.</li>
                </ol>
              </div>
            )}

            {/* Estado del Certificado Existente */}
            {hasExistingCert && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <span style={{ fontWeight: '700', fontSize: '0.86rem', color: '#166534' }}>
                      Certificado cargado: {certFilename || 'Llave criptográfica .p12'}
                    </span>
                    {certExpiresAt && (
                      <span style={{ display: 'block', fontSize: '0.76rem', color: '#15803d' }}>
                        Válido hasta: {new Date(certExpiresAt).toLocaleDateString('es-CR')}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#15803d', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '8px' }}>
                  Cifrado AES-256 en Base de Datos
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  {hasExistingCert ? 'Reemplazar archivo .p12 (Opcional)' : 'Seleccionar archivo de certificado (.p12) *'}
                </label>
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={(e) => setP12File(e.target.files ? e.target.files[0] : null)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  PIN de 4 Dígitos del Certificado *
                </label>
                <input
                  type="password"
                  maxLength={10}
                  placeholder="Ej. 1234"
                  value={p12Pin}
                  onChange={(e) => setP12Pin(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>

          {/* RESULTADO DE LA PRUEBA DE CONEXIÓN */}
          {testResult && (
            <div style={{
              padding: '16px 20px',
              borderRadius: '12px',
              border: `1px solid ${testResult.success ? '#86efac' : '#fca5a5'}`,
              backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              {testResult.success ? <CheckCircle2 size={22} color="#16a34a" /> : <AlertCircle size={22} color="#dc2626" />}
              <div style={{ fontSize: '0.86rem', lineHeight: '1.5', color: testResult.success ? '#166534' : '#991b1b' }}>
                <strong style={{ display: 'block', marginBottom: '2px' }}>
                  {testResult.success ? 'Conexión Exitosa con Hacienda' : 'Error en la Prueba de Conexión'}
                </strong>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}
            >
              {testing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} color="var(--primary)" />}
              <span>{testing ? 'Verificando con Hacienda...' : 'Probar Conexión con Hacienda'}</span>
            </button>

            <button
              type="submit"
              disabled={saving || testing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 26px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
              }}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>

        </form>
      )}

      {/* 5. FORMULARIO SECUNDARIO: ALMENDRO (SÓLO SI ESTÁ SELECCIONADO) */}
      {billingMode === 'ALMENDRO_AUTO' && (
        <form onSubmit={handleSave} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px', boxShadow: 'var(--shadow-xs)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 14px 0', color: 'var(--text)' }}>
            Configuración de Proveedor Alternativo (Almendro)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                Entorno Almendro *
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as any)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
              >
                <option value="sandbox">Sandbox (Pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '700' }}>API Key de Almendro *</label>
                {almendroApiKeyMasked && !isEditingAlmendroKey && (
                  <button type="button" onClick={() => { setIsEditingAlmendroKey(true); setAlmendroApiKey(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    Editar llave
                  </button>
                )}
              </div>
              {almendroApiKeyMasked && !isEditingAlmendroKey ? (
                <div style={{ padding: '9px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  {almendroApiKeyMasked}
                </div>
              ) : (
                <input
                  type="password"
                  placeholder="Pega tu API Key de Almendro"
                  value={almendroApiKey}
                  onChange={(e) => setAlmendroApiKey(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={handleTestConnection} disabled={testing} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
              Probar Conexión Almendro
            </button>
            <button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
              Guardar Almendro
            </button>
          </div>
        </form>
      )}

      {/* 6. BANNER PARA FACTURACIÓN EXTERNA / MANUAL */}
      {billingMode === 'EXTERNAL_MANUAL' && (
        <div style={{
          backgroundColor: '#faf5ff',
          border: '1px solid #d8b4fe',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <strong style={{ fontSize: '0.98rem', color: '#6b21a8', display: 'block', marginBottom: '6px' }}>
            Modalidad Externa y Manual Activa
          </strong>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.84rem', color: '#581c87', lineHeight: '1.5' }}>
            Tus clientes verán la casilla <em>«¿Necesita Factura Electrónica? (Hacienda CR)»</em> en el carrito de compras y citas. Los datos fiscales se guardan en la orden para que puedas emitir la factura en tu software habitual.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 18px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.84rem' }}
          >
            Confirmar Modo Externo
          </button>
        </div>
      )}

      {/* 7. HISTORIAL DE COMPROBANTES EMITIDOS */}
      <div style={{
        marginTop: '32px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
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
