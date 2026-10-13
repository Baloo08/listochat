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
  Info,
  Download,
  Building2,
  Key,
  HelpCircle,
  Award,
  Lock,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Edit3,
  Send,
  Mail,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { ElectronicVoucher } from '../../shared/types';
import { formatShortDateTime } from '../utils/dateFormat';

export interface ElectronicBillingViewProps {
  initialTab?: 'comprobantes' | 'credenciales' | 'sucursales';
  isSuperAdminMode?: boolean;
  darkMode?: boolean;
}

interface EconomicActivityItem {
  code: string;
  description: string;
}

interface NativeConfig {
  environment: 'sandbox' | 'production';
  taxpayerIdType: '01' | '02' | '03' | '04';
  taxpayerIdNumber: string;
  taxpayerName: string;
  commercialName?: string;
  taxpayerEmail: string;
  taxpayerPhone?: string;
  economicActivityCode: string;
  economicActivities?: EconomicActivityItem[];
  defaultCabysCode?: string;
  province: string;
  canton: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  idpUsername: string;
  idpPasswordMasked?: string;
  p12Filename?: string;
  p12ExpiresAt?: string | null;
  p12Subject?: string | null;
  p12DaysRemaining?: number | null;
  p12HasCertificate: boolean;
  branchCode: string;
  posCode: string;
  seqFactura?: number;
  seqTiquete?: number;
  seqNotaCredito?: number;
  multiBranchEnabled?: boolean;
  defaultDocType: '01' | '04';
  isConnected: boolean;
  lastTestAt?: string | null;
  lastTestMessage?: string | null;
  providerMode: 'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED';
  useAlternativeProvider: boolean;
  isSimplifiedRegime?: boolean;
  emailAutoSend?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassMasked?: string;
  resendApiKeyMasked?: string;
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

interface HaciendaBranch {
  id: string;
  storeBranchId?: string | null;
  storeBranchName?: string | null;
  branchName: string;
  branchCode: string;
  posCode: string;
  economicActivityCode?: string;
  province?: string;
  canton?: string;
  district?: string;
  neighborhood?: string;
  addressDetail?: string;
  seqFactura: number;
  seqTiquete: number;
  seqNotaCredito: number;
  useCustomCredentials: boolean;
  customTaxpayerIdType?: '01' | '02' | '03' | '04';
  customTaxpayerIdNumber?: string;
  customTaxpayerName?: string;
  customIdpUsername?: string;
  customIdpPasswordMasked?: string;
  customP12Filename?: string;
  customP12ExpiresAt?: string | null;
  customP12HasCertificate?: boolean;
  isActive?: boolean;
}

interface StoreBranchOption {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface ManualInvoiceLine {
  id: string;
  description: string;
  cabysCode: string;
  quantity: number;
  unitPrice: number;
  taxRateCode: '08' | '04' | '02' | '01' | '10';
}

interface VoucherRow extends ElectronicVoucher {
  branchCode?: string;
}

const TAX_RATE_MAP: Record<string, { label: string; rate: number }> = {
  '08': { label: '13% IVA General (08)', rate: 13 },
  '04': { label: '4% Reducido (04)', rate: 4 },
  '02': { label: '2% Reducido (02)', rate: 2 },
  '01': { label: '1% Canasta Básica (01)', rate: 1 },
  '10': { label: '0% Exento (10)', rate: 0 }
};

function computeDaysRemaining(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt).getTime();
  if (isNaN(exp)) return null;
  const diff = exp - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatConsecutivePreview(branchCode: string, posCode: string, docType: string, seq: number): string {
  const b = (branchCode || '001').replace(/\D/g, '').padStart(3, '0').slice(-3);
  const p = (posCode || '00001').replace(/\D/g, '').padStart(5, '0').slice(-5);
  const d = (docType || '01').padStart(2, '0').slice(-2);
  const s = String(Math.max(1, Number(seq) || 1)).padStart(10, '0').slice(-10);
  return `${b}${p}${d}${s}`;
}

export default function ElectronicBillingView({ initialTab, isSuperAdminMode = false, darkMode = false }: ElectronicBillingViewProps) {
  const api = useApi();

  const [autoDark, setAutoDark] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && document.body) {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      if (bg === 'rgb(11, 25, 26)' || bg === 'rgb(7, 18, 19)' || document.title.includes('Betico Ops')) {
        setAutoDark(true);
      }
    }
  }, []);
  const isDark = Boolean(darkMode || autoDark);

  // Navegación interna sincronizada con la barra lateral
  const [activeTab, setActiveTab] = useState<'comprobantes' | 'credenciales' | 'sucursales'>(
    initialTab || 'comprobantes'
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Modalidad seleccionada
  const [billingMode, setBillingMode] = useState<'BETICO_NATIVE' | 'ALMENDRO_AUTO' | 'EXTERNAL_MANUAL' | 'DISABLED'>('BETICO_NATIVE');
  const [showAlternativeProvider, setShowAlternativeProvider] = useState(false);

  // Cuota y Consumo del ciclo
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Configuración Nativa Betico (Datos Fiscales y Casa Matriz)
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [taxpayerIdType, setTaxpayerIdType] = useState<'01' | '02' | '03' | '04'>('01');
  const [taxpayerIdNumber, setTaxpayerIdNumber] = useState('');
  const [taxpayerName, setTaxpayerName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [taxpayerEmail, setTaxpayerEmail] = useState('');
  const [taxpayerPhone, setTaxpayerPhone] = useState('');
  const [economicActivityCode, setEconomicActivityCode] = useState('');
  const [economicActivities, setEconomicActivities] = useState<EconomicActivityItem[]>([]);
  const [defaultCabysCode, setDefaultCabysCode] = useState('8311100000000');
  const [province, setProvince] = useState('1');
  const [canton, setCanton] = useState('01');
  const [district, setDistrict] = useState('01');
  const [neighborhood, setNeighborhood] = useState('01');
  const [addressDetail, setAddressDetail] = useState('');
  const [branchCode, setBranchCode] = useState('001');
  const [posCode, setPosCode] = useState('00001');
  const [seqFactura, setSeqFactura] = useState<number>(1);
  const [seqTiquete, setSeqTiquete] = useState<number>(1);
  const [seqNotaCredito, setSeqNotaCredito] = useState<number>(1);
  const [multiBranchEnabled, setMultiBranchEnabled] = useState<boolean>(false);
  const [defaultDocType, setDefaultDocType] = useState<'01' | '04'>('04');
  const [isSimplifiedRegime, setIsSimplifiedRegime] = useState(false);

  // Consulta en Padrón de Hacienda (Tab 3)
  const [consultingPadron, setConsultingPadron] = useState(false);
  const [padronMessage, setPadronMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Credenciales ATV (Tab 2)
  const [idpUsername, setIdpUsername] = useState('');
  const [idpPassword, setIdpPassword] = useState('');
  const [hasIdpPassword, setHasIdpPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [testingAtvQuick, setTestingAtvQuick] = useState(false);
  const [atvQuickResult, setAtvQuickResult] = useState<{ success: boolean; message: string } | null>(null);

  // Certificado .p12 (Tab 2)
  const [p12File, setP12File] = useState<File | null>(null);
  const [p12Pin, setP12Pin] = useState('');
  const [hasExistingCert, setHasExistingCert] = useState(false);
  const [certFilename, setCertFilename] = useState('');
  const [certExpiresAt, setCertExpiresAt] = useState<string | null>(null);
  const [certSubject, setCertSubject] = useState<string>('');
  const [certDaysRemaining, setCertDaysRemaining] = useState<number | null>(null);
  const [testingP12, setTestingP12] = useState(false);
  const [p12TestResult, setP12TestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Entrega prioritaria por Correo Electrónico (Tab 2 y Tab 1)
  const [emailAutoSend, setEmailAutoSend] = useState<boolean>(true);
  const [smtpHost, setSmtpHost] = useState<string>('');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [hasSmtpPass, setHasSmtpPass] = useState<boolean>(false);
  const [isEditingSmtpPass, setIsEditingSmtpPass] = useState<boolean>(false);
  const [resendApiKey, setResendApiKey] = useState<string>('');
  const [hasResendApiKey, setHasResendApiKey] = useState<boolean>(false);
  const [isEditingResendKey, setIsEditingResendKey] = useState<boolean>(false);
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sendingEmailVoucherId, setSendingEmailVoucherId] = useState<string | null>(null);

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

  // Sucursales Fiscales de Hacienda y Sedes de Tienda (Tab 3)
  const [haciendaBranches, setHaciendaBranches] = useState<HaciendaBranch[]>([]);
  const [storeBranches, setStoreBranches] = useState<StoreBranchOption[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [savingBranch, setSavingBranch] = useState(false);
  const [testingBranchId, setTestingBranchId] = useState<string | null>(null);

  // Campos del formulario de Sucursal Fiscal
  const [bStoreBranchId, setBStoreBranchId] = useState('');
  const [bBranchName, setBBranchName] = useState('');
  const [bBranchCode, setBBranchCode] = useState('002');
  const [bPosCode, setBPosCode] = useState('00001');
  const [bEconomicActivityCode, setBEconomicActivityCode] = useState('');
  const [bProvince, setBProvince] = useState('1');
  const [bCanton, setBCanton] = useState('01');
  const [bDistrict, setBDistrict] = useState('01');
  const [bNeighborhood, setBNeighborhood] = useState('01');
  const [bAddressDetail, setBAddressDetail] = useState('');
  const [bSeqFactura, setBSeqFactura] = useState<number>(1);
  const [bSeqTiquete, setBSeqTiquete] = useState<number>(1);
  const [bSeqNotaCredito, setBSeqNotaCredito] = useState<number>(1);
  const [bUseCustomCredentials, setBUseCustomCredentials] = useState<boolean>(false);
  const [bCustomIdType, setBCustomIdType] = useState<'01' | '02' | '03' | '04'>('02');
  const [bCustomIdNumber, setBCustomIdNumber] = useState('');
  const [bCustomName, setBCustomName] = useState('');
  const [bCustomIdpUsername, setBCustomIdpUsername] = useState('');
  const [bCustomIdpPassword, setBCustomIdpPassword] = useState('');
  const [bCustomP12File, setBCustomP12File] = useState<File | null>(null);
  const [bCustomP12Pin, setBCustomP12Pin] = useState('');

  // Facturador Rápido Manual (Tab 1)
  const [showManualInvoicer, setShowManualInvoicer] = useState(false);
  const [manualDocType, setManualDocType] = useState<'04' | '01'>('04');
  const [manualBranchCode, setManualBranchCode] = useState('001');
  const [manualPaymentMethod, setManualPaymentMethod] = useState<'01' | '02' | '04'>('01');
  const [manualCurrency, setManualCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [manualReceiverIdType, setManualReceiverIdType] = useState<'01' | '02' | '03' | '04'>('01');
  const [manualReceiverId, setManualReceiverId] = useState('');
  const [manualReceiverName, setManualReceiverName] = useState('');
  const [manualReceiverEmail, setManualReceiverEmail] = useState('');
  const [manualReceiverPhone, setManualReceiverPhone] = useState('');
  const [searchingReceiverPadron, setSearchingReceiverPadron] = useState(false);
  const [emittingManual, setEmittingManual] = useState(false);
  const [platformTenants, setPlatformTenants] = useState<any[]>([]);
  const [selectedPlatformTenantId, setSelectedPlatformTenantId] = useState<string>('');
  const [manualLines, setManualLines] = useState<ManualInvoiceLine[]>([
    {
      id: 'line-1',
      description: 'Servicio o producto comercial',
      cabysCode: '8311100000000',
      quantity: 1,
      unitPrice: 10000,
      taxRateCode: '08'
    }
  ]);

  // Historial y filtros de comprobantes (Tab 1)
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBranchCode, setFilterBranchCode] = useState('');
  const [filterDocType, setFilterDocType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [cancellingVoucherId, setCancellingVoucherId] = useState<string | null>(null);

  const loadPlatformTenants = async () => {
    if (!isSuperAdminMode) return;
    try {
      const res = await api.get('/api/tenants');
      if (Array.isArray(res)) {
        setPlatformTenants(res);
      }
    } catch (_) {}
  };

  const loadBranches = async () => {
    try {
      const res = await api.get('/api/billing/native/branches');
      if (res) {
        if (Array.isArray(res.branches)) {
          setHaciendaBranches(res.branches);
        } else if (Array.isArray(res.haciendaBranches)) {
          setHaciendaBranches(res.haciendaBranches);
        }
        if (Array.isArray(res.storeBranches)) {
          setStoreBranches(res.storeBranches);
        }
      }
    } catch (_) {
      // Silenciar si aún no existen sucursales
    }
  };

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
        if (Array.isArray(c.economicActivities) && c.economicActivities.length > 0) {
          setEconomicActivities(c.economicActivities);
        }
        setDefaultCabysCode(c.defaultCabysCode || '8311100000000');
        setProvince(c.province || '1');
        setCanton(c.canton || '01');
        setDistrict(c.district || '01');
        setNeighborhood(c.neighborhood || '01');
        setAddressDetail(c.addressDetail || '');
        setBranchCode(c.branchCode || '001');
        setPosCode(c.posCode || '00001');
        setSeqFactura(Number(c.seqFactura) || 1);
        setSeqTiquete(Number(c.seqTiquete) || 1);
        setSeqNotaCredito(Number(c.seqNotaCredito) || 1);
        setMultiBranchEnabled(Boolean(c.multiBranchEnabled));
        setDefaultDocType(c.defaultDocType || '04');
        setIsSimplifiedRegime(Boolean(c.isSimplifiedRegime));
        setIdpUsername(c.idpUsername || '');
        setHasIdpPassword(Boolean(c.idpPasswordMasked));
        setHasExistingCert(Boolean(c.p12HasCertificate));
        setCertFilename(c.p12Filename || '');
        setCertExpiresAt(c.p12ExpiresAt || null);
        setCertSubject(c.p12Subject || c.taxpayerName || '');
        setCertDaysRemaining(
          typeof c.p12DaysRemaining === 'number'
            ? c.p12DaysRemaining
            : computeDaysRemaining(c.p12ExpiresAt)
        );
        setIsConnected(Boolean(c.isConnected));
        setEmailAutoSend(c.emailAutoSend !== undefined ? Boolean(c.emailAutoSend) : true);
        setSmtpHost(c.smtpHost || '');
        setSmtpPort(Number(c.smtpPort) || 587);
        setSmtpUser(c.smtpUser || '');
        setHasSmtpPass(Boolean(c.smtpPassMasked));
        setIsEditingSmtpPass(!c.smtpPassMasked);
        setHasResendApiKey(Boolean(c.resendApiKeyMasked));
        setIsEditingResendKey(!c.resendApiKeyMasked);

        if (!c.idpPasswordMasked) {
          setIsEditingPassword(true);
        }
      }

      // 2. Cargar Cuota y Consumo Mensual
      const usageRes = await api.get('/api/billing/native/usage');
      if (usageRes && usageRes.usage) {
        setUsage(usageRes.usage);
      }

      // 3. Cargar Sucursales Fiscales y Sedes de Tienda
      await loadBranches();

      // 4. Cargar configuración de Almendro para modo alternativo
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

  const loadVouchers = async (overrides?: {
    search?: string;
    branchCode?: string;
    docType?: string;
    status?: string;
  }) => {
    try {
      setLoadingVouchers(true);
      const params = new URLSearchParams();
      params.set('limit', '50');

      const s = overrides?.search !== undefined ? overrides.search : filterSearch;
      const b = overrides?.branchCode !== undefined ? overrides.branchCode : filterBranchCode;
      const d = overrides?.docType !== undefined ? overrides.docType : filterDocType;
      const st = overrides?.status !== undefined ? overrides.status : filterStatus;

      if (s.trim()) params.set('search', s.trim());
      if (b) params.set('branchCode', b);
      if (d) params.set('docType', d);
      if (st) params.set('status', st);

      const res = await api.get(`/api/almendro/vouchers?${params.toString()}`);
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
    if (isSuperAdminMode) {
      loadPlatformTenants();
    }
  }, [isSuperAdminMode]);

  // Consulta al Padrón de Hacienda para Contribuyente Emisor (Tab 3)
  const handleConsultTaxpayerPadron = async () => {
    const cleanId = taxpayerIdNumber.replace(/\D/g, '').trim();
    if (!cleanId || cleanId.length < 9) {
      setPadronMessage({ type: 'error', text: 'Ingresa un número de cédula válido (mínimo 9 dígitos) para consultar en Hacienda.' });
      return;
    }

    try {
      setConsultingPadron(true);
      setPadronMessage(null);
      const res = await api.get(`/api/billing/native/padron/${cleanId}`);
      if (res) {
        const foundName = res.taxpayerName || res.name || res.nombre || '';
        const foundType = res.taxpayerIdType || res.idType || res.tipoIdentificacion || taxpayerIdType;
        const foundRts = Boolean(res.isSimplifiedRegime ?? res.regimenSimplificado);
        const rawActivities = res.economicActivities || res.activities || res.actividades || [];

        if (foundName) setTaxpayerName(foundName);
        if (['01', '02', '03', '04'].includes(foundType)) {
          setTaxpayerIdType(foundType as '01' | '02' | '03' | '04');
        }
        setIsSimplifiedRegime(foundRts);
        if (foundRts) setDefaultDocType('04');

        const parsedActivities: EconomicActivityItem[] = Array.isArray(rawActivities)
          ? rawActivities.map((a: any) => ({
              code: String(a.code || a.codigo || '').trim(),
              description: String(a.description || a.descripcion || a.name || 'Actividad Económica').trim()
            })).filter((a: EconomicActivityItem) => Boolean(a.code))
          : [];

        if (parsedActivities.length > 0) {
          setEconomicActivities(parsedActivities);
          setEconomicActivityCode(parsedActivities[0].code);
        } else if (res.economicActivityCode) {
          setEconomicActivityCode(String(res.economicActivityCode));
        }

        setPadronMessage({
          type: 'success',
          text: `Datos recuperados de Hacienda: ${foundName || cleanId}${parsedActivities.length > 0 ? ` (${parsedActivities.length} actividades económicas registradas)` : ''}.`
        });
      }
    } catch (e: any) {
      setPadronMessage({
        type: 'error',
        text: e.message || 'No se pudo consultar el padrón de Hacienda en este momento.'
      });
    } finally {
      setConsultingPadron(false);
    }
  };

  // Consulta al Padrón de Hacienda para Receptor en Facturador Manual (Tab 1)
  const handleConsultReceiverPadron = async () => {
    const cleanId = manualReceiverId.replace(/\D/g, '').trim();
    if (!cleanId || cleanId.length < 9) {
      alert('Ingresa un número de cédula válido (mínimo 9 dígitos) para buscar en Hacienda.');
      return;
    }

    try {
      setSearchingReceiverPadron(true);
      const res = await api.get(`/api/billing/native/padron/${cleanId}`);
      if (res) {
        const foundName = res.taxpayerName || res.name || res.nombre || '';
        const foundType = res.taxpayerIdType || res.idType || res.tipoIdentificacion || '01';
        if (foundName) setManualReceiverName(foundName);
        if (['01', '02', '03', '04'].includes(foundType)) {
          setManualReceiverIdType(foundType as '01' | '02' | '03' | '04');
        }
      }
    } catch (e: any) {
      alert('No se encontró la cédula en el padrón de Hacienda: ' + (e.message || 'Verifica el número ingresado.'));
    } finally {
      setSearchingReceiverPadron(false);
    }
  };

  // Probar sólo Usuario y Contraseña ATV (Tab 2)
  const handleQuickTestAtv = async () => {
    try {
      setTestingAtvQuick(true);
      setAtvQuickResult(null);
      const res = await api.post('/api/billing/native/quick-test', {
        environment,
        idpUsername: idpUsername.trim(),
        idpPassword: isEditingPassword && idpPassword.trim() ? idpPassword.trim() : undefined
      });
      setAtvQuickResult({
        success: Boolean(res?.success !== false),
        message: res?.message || 'Autenticación OAuth2 exitosa con el IDP del Ministerio de Hacienda.'
      });
      if (res?.success !== false) {
        setIsConnected(true);
      }
    } catch (e: any) {
      setAtvQuickResult({
        success: false,
        message: e.message || 'Error verificando usuario y contraseña ATV con Hacienda.'
      });
    } finally {
      setTestingAtvQuick(false);
    }
  };

  // Validar Certificado .p12 y PIN en vivo (Tab 2)
  const handleTestP12 = async () => {
    try {
      setTestingP12(true);
      setP12TestResult(null);

      const formData = new FormData();
      if (p12File) {
        formData.append('certificateFile', p12File);
      }
      if (p12Pin.trim()) {
        formData.append('p12Pin', p12Pin.trim());
      }

      const res = await fetch('/api/billing/native/test-p12', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('betico_admin_token') || ''}`
        },
        body: formData
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || json.message || 'No se pudo abrir el certificado .p12 con el PIN suministrado.');
      }

      setHasExistingCert(true);
      if (json.filename || p12File?.name) {
        setCertFilename(json.filename || p12File?.name || certFilename);
      }
      if (json.subject || json.titular) {
        setCertSubject(json.subject || json.titular);
      }
      if (json.expiresAt || json.validTo) {
        const exp = json.expiresAt || json.validTo;
        setCertExpiresAt(exp);
        setCertDaysRemaining(
          typeof json.daysRemaining === 'number' ? json.daysRemaining : computeDaysRemaining(exp)
        );
      } else if (typeof json.daysRemaining === 'number') {
        setCertDaysRemaining(json.daysRemaining);
      }

      setP12TestResult({
        success: true,
        message: json.message || 'Certificado .p12 y PIN validados correctamente.'
      });
    } catch (e: any) {
      setP12TestResult({
        success: false,
        message: e.message || 'Error validando el archivo .p12 y su PIN.'
      });
    } finally {
      setTestingP12(false);
    }
  };

  // Limpiar credenciales ATV o Certificado .p12 (Tab 2)
  const handleDeleteCredentials = async (target: 'atv' | 'p12') => {
    const confirmMsg =
      target === 'atv'
        ? '¿Estás seguro de limpiar el usuario y contraseña del API de ATV guardados?'
        : '¿Estás seguro de eliminar el certificado criptográfico .p12 actual de la bóveda?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.del(`/api/billing/native/credentials?target=${target}`);
      if (target === 'atv') {
        setIdpUsername('');
        setIdpPassword('');
        setHasIdpPassword(false);
        setIsEditingPassword(true);
        setAtvQuickResult(null);
      } else {
        setP12File(null);
        setP12Pin('');
        setHasExistingCert(false);
        setCertFilename('');
        setCertExpiresAt(null);
        setCertSubject('');
        setCertDaysRemaining(null);
        setP12TestResult(null);
      }
      setIsConnected(false);
    } catch (e: any) {
      alert('No se pudieron limpiar las credenciales: ' + (e.message || 'Intenta nuevamente'));
    }
  };

  // Probar conexión integral con Hacienda
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      if (billingMode === 'BETICO_NATIVE') {
        const res = await api.post('/api/billing/native/test-connection', {});
        setTestResult(res);
        if (res?.success) {
          setIsConnected(true);
        }
      } else if (billingMode === 'ALMENDRO_AUTO') {
        const res = await api.post('/api/almendro/test-connection', {
          apiKey: isEditingAlmendroKey ? almendroApiKey : undefined,
          environment: environment === 'production' ? 'PRODUCTION' : 'SANDBOX'
        });
        setTestResult(res);
        if (res?.success) {
          setIsConnected(true);
        }
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

  // Guardar configuración completa (Tab 2 y Tab 3)
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        formData.append('defaultCabysCode', defaultCabysCode || '8311100000000');
        formData.append('province', province);
        formData.append('canton', canton);
        formData.append('district', district);
        formData.append('neighborhood', neighborhood);
        formData.append('addressDetail', addressDetail);
        formData.append('branchCode', branchCode || '001');
        formData.append('posCode', posCode || '00001');
        formData.append('seqFactura', String(Math.max(1, Number(seqFactura) || 1)));
        formData.append('seqTiquete', String(Math.max(1, Number(seqTiquete) || 1)));
        formData.append('seqNotaCredito', String(Math.max(1, Number(seqNotaCredito) || 1)));
        formData.append('multiBranchEnabled', String(multiBranchEnabled));
        formData.append('defaultDocType', defaultDocType);
        formData.append('isSimplifiedRegime', String(isSimplifiedRegime));
        formData.append('providerMode', billingMode);
        formData.append('useAlternativeProvider', String(showAlternativeProvider));
        formData.append('idpUsername', idpUsername);
        formData.append('emailAutoSend', String(emailAutoSend));
        formData.append('smtpHost', smtpHost.trim());
        formData.append('smtpPort', String(Number(smtpPort) || 587));
        formData.append('smtpUser', smtpUser.trim());

        if (isEditingSmtpPass && smtpPass.trim()) {
          formData.append('smtpPass', smtpPass.trim());
        }
        if (isEditingResendKey && resendApiKey.trim()) {
          formData.append('resendApiKey', resendApiKey.trim());
        }

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
            Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('betico_admin_token') || ''}`
          },
          body: formData
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Error guardando datos fiscales');
        }

        alert('✅ Configuración de Facturación Electrónica Hacienda guardada con éxito.');
        setP12File(null);
        setP12Pin('');
        setIsEditingPassword(false);
        setSmtpPass('');
        setResendApiKey('');
        await loadData();
      } else {
        const payload: any = {
          isEnabled: billingMode !== 'DISABLED',
          billingMode,
          environment: environment === 'production' ? 'PRODUCTION' : 'SANDBOX',
          defaultDocType,
          isSimplifiedRegime,
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

        await api.post('/api/billing/native/config', {
          providerMode: billingMode,
          useAlternativeProvider: showAlternativeProvider,
          isSimplifiedRegime,
          emailAutoSend
        });

        alert('✅ Modalidad de facturación guardada exitosamente.');
        await loadData();
      }
    } catch (e: any) {
      alert('Error guardando configuración: ' + (e.message || 'Intente nuevamente'));
    } finally {
      setSaving(false);
    }
  };

  // Probar envío de correo electrónico (Tab 2)
  const handleTestEmailDelivery = async () => {
    const defaultTarget = taxpayerEmail.trim() || smtpUser.trim();
    const targetEmail = window.prompt(
      'Ingresa el correo electrónico donde deseas recibir la prueba de facturación (PDF y XML):',
      defaultTarget
    );
    if (!targetEmail || !targetEmail.trim()) return;

    try {
      setTestingEmail(true);
      setEmailTestResult(null);
      const res = await api.post('/api/billing/native/test-email', {
        testEmail: targetEmail.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 587,
        smtpUser: smtpUser.trim(),
        smtpPass: isEditingSmtpPass && smtpPass.trim() ? smtpPass.trim() : undefined,
        resendApiKey: isEditingResendKey && resendApiKey.trim() ? resendApiKey.trim() : undefined
      });
      setEmailTestResult({
        success: Boolean(res?.success),
        message: res?.message || 'Prueba de correo procesada.'
      });
    } catch (e: any) {
      setEmailTestResult({
        success: false,
        message: e.message || 'Error probando el envío de correo electrónico.'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Enviar o reenviar comprobante (PDF y XML) al correo del cliente (Tab 1)
  const handleSendVoucherEmail = async (voucher: VoucherRow) => {
    const targetEmail = window.prompt(
      `Enviar comprobante ${voucher.consecutiveNumber || voucher.numericKey || voucher.id} (PDF y XML oficial de Hacienda) al correo del cliente:`,
      voucher.receiverEmail || ''
    );
    if (!targetEmail || !targetEmail.trim()) return;

    try {
      setSendingEmailVoucherId(voucher.id);
      const res = await api.post(`/api/billing/native/vouchers/${voucher.id}/send-email`, {
        email: targetEmail.trim()
      });
      alert(res?.message || `Correo enviado a ${targetEmail.trim()}`);
      await loadVouchers();
    } catch (e: any) {
      alert('Error al enviar comprobante por correo: ' + (e.message || 'Verifica la dirección de correo'));
    } finally {
      setSendingEmailVoucherId(null);
    }
  };

  // Emitir Factura o Tiquete Manual (Tab 1)
  const handleAddManualLine = () => {
    setManualLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length + 1}`,
        description: '',
        cabysCode: defaultCabysCode || '8311100000000',
        quantity: 1,
        unitPrice: 0,
        taxRateCode: '08'
      }
    ]);
  };

  const handleRemoveManualLine = (id: string) => {
    if (manualLines.length <= 1) return;
    setManualLines((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateManualLine = (id: string, field: keyof ManualInvoiceLine, value: any) => {
    setManualLines((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const manualTotals = manualLines.reduce(
    (acc, line) => {
      const qty = Math.max(0, Number(line.quantity) || 0);
      const price = Math.max(0, Number(line.unitPrice) || 0);
      const lineSub = qty * price;
      const taxRateInfo = TAX_RATE_MAP[line.taxRateCode] || TAX_RATE_MAP['08'];
      const lineTax = lineSub * (taxRateInfo.rate / 100);
      acc.subtotal += lineSub;
      acc.tax += lineTax;
      acc.total += lineSub + lineTax;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

  const handleEmitManualVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualDocType === '01' && (!manualReceiverId.trim() || !manualReceiverName.trim())) {
      alert('Para emitir una Factura Electrónica (01) es obligatorio indicar la Cédula y el Nombre o Razón Social del cliente receptor.');
      return;
    }

    const validLines = manualLines.filter((l) => l.description.trim() && Number(l.unitPrice) > 0);
    if (validLines.length === 0) {
      alert('Agrega al menos una línea de detalle con descripción y precio unitario mayor a 0.');
      return;
    }

    try {
      setEmittingManual(true);
      const selectedBranchObj = haciendaBranches.find((b) => b.branchCode === manualBranchCode);

      const payload = {
        docType: manualDocType,
        currency: manualCurrency,
        branchCode: manualBranchCode || branchCode || '001',
        haciendaBranchId: selectedBranchObj?.id || undefined,
        paymentMethod: manualPaymentMethod,
        receiver: {
          idType: manualReceiverIdType,
          idNumber: manualReceiverId.trim(),
          name: manualReceiverName.trim() || 'Cliente Contado',
          email: manualReceiverEmail.trim(),
          phone: manualReceiverPhone.trim()
        },
        receiverIdType: manualReceiverIdType,
        receiverIdNumber: manualReceiverId.trim(),
        receiverName: manualReceiverName.trim() || 'Cliente Contado',
        receiverEmail: manualReceiverEmail.trim(),
        receiverPhone: manualReceiverPhone.trim(),
        items: validLines.map((l) => ({
          description: l.description.trim(),
          cabysCode: (l.cabysCode || defaultCabysCode || '8311100000000').trim(),
          quantity: Number(l.quantity) || 1,
          unitPrice: Number(l.unitPrice) || 0,
          taxRateCode: l.taxRateCode,
          taxRate: (TAX_RATE_MAP[l.taxRateCode] || TAX_RATE_MAP['08']).rate
        }))
      };

      const res = await api.post('/api/billing/native/emit-manual', payload);
      alert(
        res?.message ||
          `✅ Comprobante (${manualDocType === '01' ? 'Factura Electrónica 01' : 'Tiquete Electrónico 04'}) emitido correctamente.`
      );
      setShowManualInvoicer(false);
      setSelectedPlatformTenantId('');
      setManualReceiverId('');
      setManualReceiverName('');
      setManualReceiverEmail('');
      setManualReceiverPhone('');
      await loadVouchers();
      await loadData();
    } catch (e: any) {
      alert('Error al emitir comprobante manual: ' + (e.message || 'Revisa la configuración de Hacienda.'));
    } finally {
      setEmittingManual(false);
    }
  };

  // Anular comprobante con Nota de Crédito (03) (Tab 1)
  const handleIssueCreditNote = async (voucher: ElectronicVoucher) => {
    const reason = window.prompt(
      `Vas a anular el comprobante ${voucher.consecutiveNumber || voucher.numericKey || voucher.id} mediante una Nota de Crédito Electrónica (03) ante Hacienda.\n\nIndica la razón de referencia fiscal:`,
      'Anulación de comprobante electrónico por ajuste en operación'
    );
    if (!reason || !reason.trim()) return;

    try {
      setCancellingVoucherId(voucher.id);
      const res = await api.post(`/api/billing/native/vouchers/${voucher.id}/credit-note`, {
        reason: reason.trim()
      });
      alert(res?.message || '✅ Nota de Crédito Electrónica (03) emitida con éxito.');
      await loadVouchers();
      await loadData();
    } catch (e: any) {
      alert('Error al emitir Nota de Crédito (03): ' + (e.message || 'Intenta nuevamente'));
    } finally {
      setCancellingVoucherId(null);
    }
  };

  // Gestión de Sucursales Fiscales (Tab 3)
  const openCreateBranchModal = () => {
    const nextNum = haciendaBranches.length + 2;
    const defaultNextCode = String(nextNum).padStart(3, '0');
    setEditingBranchId(null);
    setBStoreBranchId('');
    setBBranchName('');
    setBBranchCode(defaultNextCode);
    setBPosCode('00001');
    setBEconomicActivityCode(economicActivityCode || '');
    setBProvince(province || '1');
    setBCanton(canton || '01');
    setBDistrict(district || '01');
    setBNeighborhood(neighborhood || '01');
    setBAddressDetail('');
    setBSeqFactura(1);
    setBSeqTiquete(1);
    setBSeqNotaCredito(1);
    setBUseCustomCredentials(false);
    setBCustomIdType(taxpayerIdType || '02');
    setBCustomIdNumber('');
    setBCustomName('');
    setBCustomIdpUsername('');
    setBCustomIdpPassword('');
    setBCustomP12File(null);
    setBCustomP12Pin('');
    setShowBranchModal(true);
  };

  const openEditBranchModal = (b: HaciendaBranch) => {
    setEditingBranchId(b.id);
    setBStoreBranchId(b.storeBranchId || '');
    setBBranchName(b.branchName || '');
    setBBranchCode(b.branchCode || '002');
    setBPosCode(b.posCode || '00001');
    setBEconomicActivityCode(b.economicActivityCode || economicActivityCode || '');
    setBProvince(b.province || province || '1');
    setBCanton(b.canton || canton || '01');
    setBDistrict(b.district || district || '01');
    setBNeighborhood(b.neighborhood || neighborhood || '01');
    setBAddressDetail(b.addressDetail || '');
    setBSeqFactura(Number(b.seqFactura) || 1);
    setBSeqTiquete(Number(b.seqTiquete) || 1);
    setBSeqNotaCredito(Number(b.seqNotaCredito) || 1);
    setBUseCustomCredentials(Boolean(b.useCustomCredentials));
    setBCustomIdType(b.customTaxpayerIdType || '02');
    setBCustomIdNumber(b.customTaxpayerIdNumber || '');
    setBCustomName(b.customTaxpayerName || '');
    setBCustomIdpUsername(b.customIdpUsername || '');
    setBCustomIdpPassword('');
    setBCustomP12File(null);
    setBCustomP12Pin('');
    setShowBranchModal(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bBranchName.trim()) {
      alert('Indica un nombre descriptivo para la sucursal fiscal.');
      return;
    }

    try {
      setSavingBranch(true);
      const formData = new FormData();
      if (editingBranchId) {
        formData.append('id', editingBranchId);
      }
      if (bStoreBranchId) {
        formData.append('storeBranchId', bStoreBranchId);
      }
      formData.append('branchName', bBranchName.trim());
      formData.append('branchCode', bBranchCode.trim().padStart(3, '0'));
      formData.append('posCode', bPosCode.trim().padStart(5, '0'));
      formData.append('economicActivityCode', bEconomicActivityCode.trim() || economicActivityCode);
      formData.append('province', bProvince);
      formData.append('canton', bCanton);
      formData.append('district', bDistrict);
      formData.append('neighborhood', bNeighborhood);
      formData.append('addressDetail', bAddressDetail.trim());
      formData.append('seqFactura', String(Math.max(1, Number(bSeqFactura) || 1)));
      formData.append('seqTiquete', String(Math.max(1, Number(bSeqTiquete) || 1)));
      formData.append('seqNotaCredito', String(Math.max(1, Number(bSeqNotaCredito) || 1)));
      formData.append('useCustomCredentials', String(bUseCustomCredentials));
      formData.append('inheritCredentials', String(!bUseCustomCredentials));

      if (bUseCustomCredentials) {
        formData.append('customTaxpayerIdType', bCustomIdType);
        formData.append('customTaxpayerIdNumber', bCustomIdNumber.trim());
        formData.append('customTaxpayerName', bCustomName.trim());
        formData.append('customIdpUsername', bCustomIdpUsername.trim());
        if (bCustomIdpPassword.trim()) {
          formData.append('customIdpPassword', bCustomIdpPassword.trim());
        }
        if (bCustomP12File) {
          formData.append('certificateFile', bCustomP12File);
        }
        if (bCustomP12Pin.trim()) {
          formData.append('customP12Pin', bCustomP12Pin.trim());
        }
      }

      const res = await fetch('/api/billing/native/branches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('betico_admin_token') || ''}`
        },
        body: formData
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error guardando la sucursal fiscal');
      }

      setShowBranchModal(false);
      await loadBranches();
    } catch (e: any) {
      alert('Error al guardar sucursal en facturación: ' + (e.message || 'Intenta nuevamente'));
    } finally {
      setSavingBranch(false);
    }
  };

  const handleDeleteBranch = async (b: HaciendaBranch) => {
    if (!window.confirm(`¿Eliminar la configuración fiscal de la sucursal "${b.branchName}" (Código ${b.branchCode})?`)) {
      return;
    }
    try {
      await api.del(`/api/billing/native/branches/${b.id}`);
      await loadBranches();
    } catch (e: any) {
      alert('Error al eliminar sucursal: ' + (e.message || 'Intenta nuevamente'));
    }
  };

  const handleTestBranchConnection = async (b: HaciendaBranch) => {
    try {
      setTestingBranchId(b.id);
      const res = await api.post(`/api/billing/native/branches/${b.id}/test`, {});
      alert(res?.message || `✅ Conexión verificada para ${b.branchName} (Sucursal ${b.branchCode}).`);
    } catch (e: any) {
      alert(`Error probando conexión de ${b.branchName}: ` + (e.message || 'Revisa las credenciales configuradas.'));
    } finally {
      setTestingBranchId(null);
    }
  };

  const palette = {
    surface: isDark ? '#0f2426' : '#ffffff',
    surfaceAlt: isDark ? '#091819' : '#f8fafc',
    surfaceMuted: isDark ? '#132e31' : '#f1f5f9',
    inputBg: isDark ? '#071415' : '#ffffff',
    border: isDark ? '#1e4245' : '#e2e8f0',
    text: isDark ? '#FAF8F5' : '#0f172a',
    textSecondary: isDark ? '#e2e8f0' : '#334155',
    textMuted: isDark ? '#cbd5e1' : '#475569',
    primary: isDark ? '#34D399' : '#2563eb',
    primaryBtnBg: isDark ? '#059669' : '#2563eb',
    primaryBtnText: '#ffffff',
    primarySoftBg: isDark ? 'rgba(52, 211, 153, 0.14)' : '#eff6ff',
    primarySoftBorder: isDark ? 'rgba(52, 211, 153, 0.4)' : '#bfdbfe',
    primarySoftText: isDark ? '#6ee7b7' : '#1d4ed8',
    indigoSoftBg: isDark ? 'rgba(99, 102, 241, 0.18)' : '#eef2ff',
    indigoSoftBorder: isDark ? 'rgba(129, 140, 248, 0.45)' : '#c7d2fe',
    indigoSoftText: isDark ? '#e0e7ff' : '#3730a3',
    successSoftBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
    successBadgeBg: isDark ? 'rgba(16, 185, 129, 0.22)' : '#dcfce7',
    successSoftBorder: isDark ? 'rgba(52, 211, 153, 0.45)' : '#86efac',
    successText: isDark ? '#6ee7b7' : '#166534',
    warnSoftBg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fffbeb',
    warnSoftBorder: isDark ? 'rgba(251, 191, 36, 0.45)' : '#fde68a',
    warnText: isDark ? '#fde68a' : '#92400e',
    dangerSoftBg: isDark ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2',
    dangerSoftBorder: isDark ? 'rgba(248, 113, 113, 0.45)' : '#fca5a5',
    dangerText: isDark ? '#fca5a5' : '#b91c1c',
    purpleSoftBg: isDark ? 'rgba(168, 85, 247, 0.18)' : '#faf5ff',
    purpleText: isDark ? '#e9d5ff' : '#6b21a8'
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: palette.textMuted }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <p>Cargando Módulo de Facturación Electrónica Costa Rica (Hacienda DGT v4.4)...</p>
      </div>
    );
  }

  // Porcentaje de consumo para la barra
  const quotaTotal = usage?.quota || 100;
  const emittedCount = usage?.emitted || 0;
  const percentUsed = Math.min(100, Math.round((emittedCount / quotaTotal) * 100));
  const isNearLimit = percentUsed >= 80;
  const isOverLimit = emittedCount >= quotaTotal;

  // Días restantes del certificado
  const effectiveDaysRemaining =
    certDaysRemaining !== null ? certDaysRemaining : computeDaysRemaining(certExpiresAt);
  const isCertExpired = effectiveDaysRemaining !== null && effectiveDaysRemaining <= 0;
  const isCertExpiringSoon =
    effectiveDaysRemaining !== null && effectiveDaysRemaining > 0 && effectiveDaysRemaining < 30;

  return (
    <div
      className={isDark ? 'eb-billing-root eb-dark' : 'eb-billing-root eb-light'}
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '20px 16px',
        color: palette.text,
        ['--surface' as any]: palette.surface,
        ['--background' as any]: palette.surfaceAlt,
        ['--border' as any]: palette.border,
        ['--text' as any]: palette.text,
        ['--text-muted' as any]: palette.textMuted,
        ['--text-secondary' as any]: palette.textSecondary,
        ['--primary' as any]: palette.primary
      }}
    >
      <style>{`
        .eb-billing-root.eb-dark input:not([type="checkbox"]):not([type="radio"]),
        .eb-billing-root.eb-dark select,
        .eb-billing-root.eb-dark textarea {
          background-color: #071415 !important;
          color: #FAF8F5 !important;
          border-color: #234e52 !important;
        }
        .eb-billing-root.eb-dark select option {
          background-color: #091819;
          color: #FAF8F5;
        }
        .eb-billing-root.eb-dark input::placeholder,
        .eb-billing-root.eb-dark textarea::placeholder {
          color: #94a3b8 !important;
        }
        .eb-billing-root.eb-dark label,
        .eb-billing-root.eb-dark h1,
        .eb-billing-root.eb-dark h2,
        .eb-billing-root.eb-dark h3,
        .eb-billing-root.eb-dark h4,
        .eb-billing-root.eb-dark strong,
        .eb-billing-root.eb-dark td {
          color: #FAF8F5;
        }
        .eb-billing-root.eb-dark th {
          color: #cbd5e1;
        }
        .eb-billing-root.eb-light input:not([type="checkbox"]):not([type="radio"]),
        .eb-billing-root.eb-light select,
        .eb-billing-root.eb-light textarea {
          color: #0f172a;
          background-color: #ffffff;
        }
      `}</style>

      {/* CABECERA SUPERIOR */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: '14px',
          padding: '18px 22px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: palette.primarySoftBg,
              padding: '10px',
              borderRadius: '12px',
              color: palette.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={26} />
          </div>
          <div>
            {isSuperAdminMode && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: palette.indigoSoftBg,
                  color: palette.indigoSoftText,
                  border: `1px solid ${palette.indigoSoftBorder}`,
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  letterSpacing: '0.03em',
                  marginBottom: '6px'
                }}
              >
                <ShieldCheck size={13} />
                SUPERADMIN PLATAFORMA · FACTURACIÓN OFICIAL A TENANTS (BETICO FACTURAS)
              </div>
            )}
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: palette.text }}>
              {isSuperAdminMode
                ? 'Betico Facturas — Facturación Electrónica de Suscripciones (Hacienda DGT v4.4)'
                : 'Módulo de Facturación Electrónica Costa Rica (Hacienda DGT v4.4)'}
            </h1>
            <span style={{ fontSize: '0.82rem', color: palette.textMuted }}>
              {isSuperAdminMode
                ? 'Cuenta fiscal de la plataforma Betico para facturar suscripciones a comercios clientes con firma XAdES-EPES'
                : 'Emisión directa de Facturas Electrónicas (01), Tiquetes (04) y Notas de Crédito (03) con firma XAdES-EPES'}
            </span>
          </div>
        </div>

        {/* Badges de modalidad activa y estado de conexión */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor:
                billingMode === 'BETICO_NATIVE'
                  ? palette.successBadgeBg
                  : billingMode === 'ALMENDRO_AUTO'
                  ? palette.primarySoftBg
                  : billingMode === 'EXTERNAL_MANUAL'
                  ? palette.purpleSoftBg
                  : palette.surfaceMuted,
              color:
                billingMode === 'BETICO_NATIVE'
                  ? palette.successText
                  : billingMode === 'ALMENDRO_AUTO'
                  ? palette.primarySoftText
                  : billingMode === 'EXTERNAL_MANUAL'
                  ? palette.purpleText
                  : palette.textMuted
            }}
          >
            {billingMode === 'BETICO_NATIVE'
              ? '⚡ Betico Facturación Electrónica Nativa'
              : billingMode === 'ALMENDRO_AUTO'
              ? '⚡ Almendro API'
              : billingMode === 'EXTERNAL_MANUAL'
              ? '📋 Facturación Externa y Manual'
              : '○ Deshabilitada'}
          </span>

          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: '700',
              padding: '5px 12px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: isConnected ? palette.successSoftBg : palette.warnSoftBg,
              color: isConnected ? palette.successText : palette.warnText,
              border: `1px solid ${isConnected ? palette.successSoftBorder : palette.warnSoftBorder}`
            }}
          >
            {isConnected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {isConnected ? 'Conectado con Hacienda' : 'Pendiente de Validar'}
          </span>
        </div>
      </div>

      {/* BARRA DE 3 PESTAÑAS INTERNAS */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `2px solid ${palette.border}`,
          paddingBottom: '2px',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('comprobantes')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            border: 'none',
            borderBottom: activeTab === 'comprobantes' ? `3px solid ${palette.primary}` : '3px solid transparent',
            backgroundColor: activeTab === 'comprobantes' ? palette.primarySoftBg : 'transparent',
            color: activeTab === 'comprobantes' ? palette.primary : palette.textMuted,
            fontWeight: activeTab === 'comprobantes' ? '800' : '600',
            fontSize: '0.9rem',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <FileText size={17} />
          <span>Comprobantes y Emisión</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credenciales')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            border: 'none',
            borderBottom: activeTab === 'credenciales' ? `3px solid ${palette.primary}` : '3px solid transparent',
            backgroundColor: activeTab === 'credenciales' ? palette.primarySoftBg : 'transparent',
            color: activeTab === 'credenciales' ? palette.primary : palette.textMuted,
            fontWeight: activeTab === 'credenciales' ? '800' : '600',
            fontSize: '0.9rem',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <ShieldCheck size={17} />
          <span>Credenciales y Llave .p12</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sucursales')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            border: 'none',
            borderBottom: activeTab === 'sucursales' ? `3px solid ${palette.primary}` : '3px solid transparent',
            backgroundColor: activeTab === 'sucursales' ? palette.primarySoftBg : 'transparent',
            color: activeTab === 'sucursales' ? palette.primary : palette.textMuted,
            fontWeight: activeTab === 'sucursales' ? '800' : '600',
            fontSize: '0.9rem',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={17} />
          <span>Datos Fiscales y Sucursales</span>
        </button>
      </div>

      {/* =====================================================================
          PESTAÑA 1: COMPROBANTES Y EMISIÓN
      ===================================================================== */}
      {activeTab === 'comprobantes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 1. Tarjeta de Cuota Mensual y Consumo */}
          {usage &&
            (isSuperAdminMode ||
            (usage as any)?.plan === 'superadmin_platform' ||
            usage?.planName === 'superadmin_platform' ? (
              <div
                style={{
                  backgroundColor: palette.successSoftBg,
                  border: `1px solid ${palette.successSoftBorder}`,
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <Award size={18} color={palette.successText} />
                    <h3 style={{ margin: 0, fontSize: '1.0rem', fontWeight: '800', color: palette.successText }}>
                      Cuenta Fiscal SuperAdmin (Plataforma Betico) — Emisión Ilimitada de Comprobantes
                    </h3>
                    <span
                      style={{
                        backgroundColor: palette.successBadgeBg,
                        color: palette.successText,
                        border: `1px solid ${palette.successSoftBorder}`,
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '2px 10px',
                        borderRadius: '999px'
                      }}
                    >
                      SIN LÍMITE DE CUOTA
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: palette.textSecondary }}>
                    Emite facturas electrónicas (01), tiquetes (04) y notas de crédito (03) a todos tus tenants con envío directo de PDF y XML por correo.
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: '900', color: palette.successText }}>
                    {(usage as any)?.emittedCount ?? usage?.emitted ?? 0}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: palette.textSecondary, marginLeft: '6px', fontWeight: '700' }}>
                    comprobantes emitidos este mes
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: isOverLimit ? palette.dangerSoftBg : palette.surface,
                  border: `1px solid ${isOverLimit ? palette.dangerSoftBorder : isNearLimit ? palette.warnSoftBorder : palette.border}`,
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <Award size={18} color={palette.primary} />
                      <h3 style={{ margin: 0, fontSize: '1.0rem', fontWeight: '800', color: palette.text }}>
                        Cuota Mensual de Facturación ({usage.planName.toUpperCase()})
                      </h3>
                      {usage.inCourtesy && (
                        <span
                          style={{
                            backgroundColor: palette.warnSoftBg,
                            color: palette.warnText,
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}
                        >
                          🎁 Margen de Cortesía Activo (+{usage.courtesyUsed}/10)
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: palette.textMuted }}>
                      Tu plan incluye <strong>{usage.quota} comprobantes oficiales</strong> cada mes sin costo adicional.
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '900', color: isOverLimit ? palette.dangerText : palette.text }}>
                      {usage.emitted} / {usage.quota}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: palette.textMuted, marginLeft: '4px' }}>
                      comprobantes
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    backgroundColor: palette.surfaceMuted,
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      width: `${percentUsed}%`,
                      height: '100%',
                      backgroundColor: isOverLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981',
                      borderRadius: '6px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                    color: palette.textMuted,
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
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
            ))}

          {/* 2. Barra de Acción y Facturador Rápido Manual */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: palette.text }}>
                  Facturador Rápido Manual
                </h2>
                <span style={{ fontSize: '0.82rem', color: palette.textMuted }}>
                  Emite al instante una Factura Electrónica (01) o Tiquete Electrónico (04) directo a Hacienda y WhatsApp
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowManualInvoicer(!showManualInvoicer)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: showManualInvoicer ? `1px solid ${palette.border}` : 'none',
                  backgroundColor: showManualInvoicer ? palette.surfaceMuted : palette.primaryBtnBg,
                  color: showManualInvoicer ? palette.text : palette.primaryBtnText,
                  fontWeight: '800',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                <Plus size={16} />
                <span>
                  {showManualInvoicer ? 'Cerrar Facturador Manual' : '+ Emitir Factura o Tiquete Manual'}
                </span>
              </button>
            </div>

            {showManualInvoicer && (
              <form
                onSubmit={handleEmitManualVoucher}
                style={{
                  marginTop: '18px',
                  paddingTop: '18px',
                  borderTop: `1px solid ${palette.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                {/* Selectores principales */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px'
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                      Tipo de Comprobante *
                    </label>
                    <select
                      value={manualDocType}
                      onChange={(e) => setManualDocType(e.target.value as '01' | '04')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.inputBg,
                        color: palette.text,
                        fontWeight: '700'
                      }}
                    >
                      <option value="04">Tiquete Electrónico (04)</option>
                      <option value="01">Factura Electrónica (01)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                      Sucursal Emisora *
                    </label>
                    <select
                      value={manualBranchCode}
                      onChange={(e) => setManualBranchCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.inputBg,
                        color: palette.text,
                        fontWeight: '600'
                      }}
                    >
                      <option value={branchCode || '001'}>
                        Casa Matriz ({branchCode || '001'} - Caja {posCode || '00001'})
                      </option>
                      {haciendaBranches
                        .filter((b) => b.isActive !== false)
                        .map((b) => (
                          <option key={b.id} value={b.branchCode}>
                            {b.branchName} ({b.branchCode} - Caja {b.posCode})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                      Medio de Pago *
                    </label>
                    <select
                      value={manualPaymentMethod}
                      onChange={(e) => setManualPaymentMethod(e.target.value as '01' | '02' | '04')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.inputBg,
                        color: palette.text,
                        fontWeight: '600'
                      }}
                    >
                      <option value="01">Efectivo (01)</option>
                      <option value="02">Tarjeta (02)</option>
                      <option value="04">SINPE Móvil o Transferencia (04)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                      Moneda *
                    </label>
                    <select
                      value={manualCurrency}
                      onChange={(e) => setManualCurrency(e.target.value as 'CRC' | 'USD')}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${palette.border}`,
                        backgroundColor: palette.inputBg,
                        color: palette.text,
                        fontWeight: '700'
                      }}
                    >
                      <option value="CRC">Colones (CRC ₡)</option>
                      <option value="USD">Dólares (USD $)</option>
                    </select>
                  </div>
                </div>

                {/* Selector de Tenant para SuperAdmin */}
                {isSuperAdminMode && (
                  <div
                    style={{
                      backgroundColor: palette.indigoSoftBg,
                      border: `1px solid ${palette.indigoSoftBorder}`,
                      borderRadius: '12px',
                      padding: '14px 16px'
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        color: palette.indigoSoftText,
                        marginBottom: '6px'
                      }}
                    >
                      Seleccionar Cliente de Tenant (Inquilino de Betico) para Autocompletar Factura
                    </label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={selectedPlatformTenantId}
                        onChange={(e) => {
                          const tid = e.target.value;
                          setSelectedPlatformTenantId(tid);
                          const t = platformTenants.find((item: any) => String(item.id) === tid);
                          if (!t) return;
                          const rawId = String(t.billingIdNumber || t.taxId || '').replace(/[^0-9]/g, '');
                          const inferredType: '01' | '02' | '03' | '04' =
                            t.billingIdType && ['01', '02', '03', '04'].includes(t.billingIdType)
                              ? t.billingIdType
                              : rawId.length === 9
                              ? '01'
                              : rawId.length === 10
                              ? '02'
                              : rawId.length >= 11
                              ? '03'
                              : '01';
                          setManualReceiverName(t.billingLegalName || t.name || '');
                          setManualReceiverId(rawId);
                          setManualReceiverIdType(inferredType);
                          setManualReceiverEmail(t.billingEmail || t.adminEmail || '');
                          setManualReceiverPhone(t.phoneNumber || '');
                          setManualDocType(rawId.length >= 9 ? '01' : '04');
                          const curr: 'CRC' | 'USD' = t.billingCurrency === 'USD' ? 'USD' : 'CRC';
                          setManualCurrency(curr);
                          const defaultPrice = Number(t.customMonthlyPrice || 35000);
                          setManualLines([
                            {
                              id: 'line-sa-1',
                              description: `Suscripción Plataforma Betico SaaS - Plan ${String(t.plan || 'Pro').toUpperCase()} (${t.name})`,
                              cabysCode: defaultCabysCode || '8314100000000',
                              quantity: 1,
                              unitPrice: defaultPrice,
                              taxRateCode: isSimplifiedRegime ? '10' : '08'
                            }
                          ]);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '280px',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.indigoSoftBorder}`,
                          backgroundColor: palette.inputBg,
                          fontWeight: '700',
                          color: palette.text,
                          fontSize: '0.84rem'
                        }}
                      >
                        <option value="">-- Seleccionar comercio cliente (o completar manualmente abajo) --</option>
                        {platformTenants.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.slug}) — Plan {String(t.plan || '').toUpperCase()} —{' '}
                            {t.requiresSubscriptionInvoice ? 'Solicitó Factura' : 'Sin solicitud automática'}
                          </option>
                        ))}
                      </select>

                      {(() => {
                        const selTenant = platformTenants.find((item: any) => String(item.id) === selectedPlatformTenantId);
                        const cleanCed = String(manualReceiverId || '').replace(/[^0-9]/g, '');
                        if (
                          selTenant &&
                          cleanCed.length >= 9 &&
                          cleanCed.length <= 12 &&
                          (!selTenant.billingLegalName || selTenant.billingLegalName === selTenant.name)
                        ) {
                          return (
                            <button
                              type="button"
                              onClick={handleConsultReceiverPadron}
                              disabled={searchingReceiverPadron}
                              style={{
                                padding: '9px 14px',
                                borderRadius: '8px',
                                border: '1px solid #6366f1',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                cursor: searchingReceiverPadron ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Search size={14} />
                              {searchingReceiverPadron ? 'Consultando...' : 'Consultar Cédula en Hacienda'}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}

                {/* Datos del Cliente Receptor */}
                <div
                  style={{
                    backgroundColor: palette.surfaceAlt,
                    border: `1px solid ${palette.border}`,
                    borderRadius: '12px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem', color: palette.text }}>
                      Datos del Cliente Receptor{' '}
                      {manualDocType === '01' ? '(Obligatorio para Factura 01)' : '(Opcional para Tiquete 04)'}
                    </strong>
                    <span style={{ fontSize: '0.76rem', color: palette.textMuted }}>
                      Consulta el padrón oficial de Hacienda por número de cédula
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: palette.text }}>
                        Cédula del Cliente {manualDocType === '01' ? '*' : ''}
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          required={manualDocType === '01'}
                          placeholder="Ej. 109870654"
                          value={manualReceiverId}
                          onChange={(e) => setManualReceiverId(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${palette.border}`,
                            backgroundColor: palette.inputBg,
                            color: palette.text
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleConsultReceiverPadron}
                          disabled={searchingReceiverPadron}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${palette.primarySoftBorder}`,
                            backgroundColor: palette.primarySoftBg,
                            color: palette.primarySoftText,
                            fontWeight: '700',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {searchingReceiverPadron ? 'Buscando...' : 'Buscar en Hacienda'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: palette.text }}>
                        Tipo de Identificación
                      </label>
                      <select
                        value={manualReceiverIdType}
                        onChange={(e) => setManualReceiverIdType(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.border}`,
                          backgroundColor: palette.inputBg,
                          color: palette.text
                        }}
                      >
                        <option value="01">01 - Cédula Física</option>
                        <option value="02">02 - Cédula Jurídica</option>
                        <option value="03">03 - DIMEX</option>
                        <option value="04">04 - NITE</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: palette.text }}>
                        Nombre o Razón Social {manualDocType === '01' ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        required={manualDocType === '01'}
                        placeholder="Nombre completo o empresa"
                        value={manualReceiverName}
                        onChange={(e) => setManualReceiverName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.border}`,
                          backgroundColor: palette.inputBg,
                          color: palette.text
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: palette.text }}>
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        placeholder="cliente@correo.com"
                        value={manualReceiverEmail}
                        onChange={(e) => setManualReceiverEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.border}`,
                          backgroundColor: palette.inputBg,
                          color: palette.text
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '4px', color: palette.text }}>
                        Teléfono WhatsApp (Envío PDF)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 88888888"
                        value={manualReceiverPhone}
                        onChange={(e) => setManualReceiverPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.border}`,
                          backgroundColor: palette.inputBg,
                          color: palette.text
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Líneas de Detalle */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}
                  >
                    <strong style={{ fontSize: '0.9rem', color: palette.text }}>
                      Líneas de Detalle del Comprobante
                    </strong>
                    <button
                      type="button"
                      onClick={handleAddManualLine}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${palette.primarySoftBorder}`,
                        backgroundColor: palette.primarySoftBg,
                        color: palette.primarySoftText,
                        fontWeight: '700',
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={14} /> Agregar Línea
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {manualLines.map((line, idx) => (
                      <div
                        key={line.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.1fr 0.7fr 1fr 1.2fr auto',
                          gap: '8px',
                          alignItems: 'end',
                          backgroundColor: palette.surfaceAlt,
                          padding: '10px',
                          borderRadius: '8px',
                          border: `1px solid ${palette.border}`
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: palette.textMuted, marginBottom: '3px' }}>
                            Descripción #{idx + 1}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Producto o servicio"
                            value={line.description}
                            onChange={(e) => handleUpdateManualLine(line.id, 'description', e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${palette.border}`, backgroundColor: palette.inputBg, color: palette.text }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: palette.textMuted, marginBottom: '3px' }}>
                            Código CABYS (13 díg.)
                          </label>
                          <input
                            type="text"
                            value={line.cabysCode}
                            onChange={(e) => handleUpdateManualLine(line.id, 'cabysCode', e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${palette.border}`, backgroundColor: palette.inputBg, color: palette.text, fontFamily: 'monospace' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: palette.textMuted, marginBottom: '3px' }}>
                            Cant.
                          </label>
                          <input
                            type="number"
                            min={1}
                            step="any"
                            value={line.quantity}
                            onChange={(e) => handleUpdateManualLine(line.id, 'quantity', Number(e.target.value))}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${palette.border}`, backgroundColor: palette.inputBg, color: palette.text }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: palette.textMuted, marginBottom: '3px' }}>
                            Precio Unitario (₡)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={line.unitPrice}
                            onChange={(e) => handleUpdateManualLine(line.id, 'unitPrice', Number(e.target.value))}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${palette.border}`, backgroundColor: palette.inputBg, color: palette.text }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: palette.textMuted, marginBottom: '3px' }}>
                            Tarifa IVA Hacienda
                          </label>
                          <select
                            value={line.taxRateCode}
                            onChange={(e) => handleUpdateManualLine(line.id, 'taxRateCode', e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: `1px solid ${palette.border}`, backgroundColor: palette.inputBg, color: palette.text }}
                          >
                            <option value="08">13% IVA General (08)</option>
                            <option value="04">4% Reducido (04)</option>
                            <option value="02">2% Reducido (02)</option>
                            <option value="01">1% Canasta Básica (01)</option>
                            <option value="10">0% Exento (10)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveManualLine(line.id)}
                          disabled={manualLines.length <= 1}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: `1px solid ${palette.dangerSoftBorder}`,
                            backgroundColor: palette.dangerSoftBg,
                            color: palette.dangerText,
                            cursor: manualLines.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: manualLines.length <= 1 ? 0.4 : 1
                          }}
                          title="Eliminar línea"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumen de Totales y Botón de Emisión */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${palette.border}`
                  }}
                >
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.88rem', color: palette.text }}>
                    <span>
                      Subtotal: <strong>₡{manualTotals.subtotal.toLocaleString('es-CR')}</strong>
                    </span>
                    <span>
                      IVA: <strong>₡{manualTotals.tax.toLocaleString('es-CR')}</strong>
                    </span>
                    <span style={{ fontSize: '1.05rem', color: palette.primary, fontWeight: '900' }}>
                      Total: ₡{manualTotals.total.toLocaleString('es-CR')}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={emittingManual}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '0.9rem',
                      cursor: emittingManual ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
                    }}
                  >
                    {emittingManual ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>{emittingManual ? 'Firmando y enviando a Hacienda...' : 'Emitir Comprobante Oficial'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. Historial de Comprobantes Emitidos */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.08rem', fontWeight: '800', margin: 0, color: palette.text }}>
                  Historial de Comprobantes Emitidos
                </h2>
                <span style={{ fontSize: '0.78rem', color: palette.textMuted }}>
                  Facturas, tiquetes y notas de crédito firmados ante el Ministerio de Hacienda
                </span>
              </div>

              <button
                type="button"
                onClick={() => loadVouchers()}
                disabled={loadingVouchers}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.surfaceMuted,
                  color: palette.text,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: '700'
                }}
              >
                <RefreshCw size={14} className={loadingVouchers ? 'animate-spin' : ''} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Barra de Filtros */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: '10px',
                marginBottom: '16px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar por cliente, cédula, consecutivo o clave numérica..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadVouchers({ search: e.currentTarget.value });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.inputBg,
                    color: palette.text,
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <select
                value={filterBranchCode}
                onChange={(e) => {
                  setFilterBranchCode(e.target.value);
                  loadVouchers({ branchCode: e.target.value });
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.inputBg,
                  color: palette.text,
                  fontSize: '0.82rem'
                }}
              >
                <option value="">Sucursal: Todas</option>
                <option value={branchCode || '001'}>{branchCode || '001'} - Casa Matriz</option>
                {haciendaBranches.map((b) => (
                  <option key={b.id} value={b.branchCode}>
                    {b.branchCode} - {b.branchName}
                  </option>
                ))}
              </select>

              <select
                value={filterDocType}
                onChange={(e) => {
                  setFilterDocType(e.target.value);
                  loadVouchers({ docType: e.target.value });
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.inputBg,
                  color: palette.text,
                  fontSize: '0.82rem'
                }}
              >
                <option value="">Tipo: Todos</option>
                <option value="01">01 - Factura</option>
                <option value="04">04 - Tiquete</option>
                <option value="03">03 - Nota de Crédito</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  loadVouchers({ status: e.target.value });
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.border}`,
                  backgroundColor: palette.inputBg,
                  color: palette.text,
                  fontSize: '0.82rem'
                }}
              >
                <option value="">Estado: Todos</option>
                <option value="accepted">Aceptado (accepted)</option>
                <option value="pending">Pendiente (pending)</option>
                <option value="rejected">Rechazado (rejected)</option>
                <option value="cancelled">Anulado (cancelled)</option>
              </select>
            </div>

            {vouchers.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: palette.textMuted }}>
                <FileText size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No se encontraron comprobantes electrónicos con estos filtros.</p>
                <span style={{ fontSize: '0.78rem' }}>
                  Las facturas generadas por tus ventas o por el facturador manual aparecerán aquí.
                </span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${palette.border}`, textAlign: 'left', color: palette.textMuted }}>
                      <th style={{ padding: '10px 8px' }}>Fecha</th>
                      <th style={{ padding: '10px 8px' }}>Sucursal / Consecutivo</th>
                      <th style={{ padding: '10px 8px' }}>Tipo</th>
                      <th style={{ padding: '10px 8px' }}>Clave Hacienda</th>
                      <th style={{ padding: '10px 8px' }}>Receptor</th>
                      <th style={{ padding: '10px 8px' }}>Total</th>
                      <th style={{ padding: '10px 8px' }}>Estado</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => {
                      const isAccepted = v.status === 'accepted';
                      const isRejected = v.status === 'rejected';
                      const isCancelled = (v.status as string) === 'cancelled';
                      const vBranch = v.branchCode || (v.consecutiveNumber ? v.consecutiveNumber.slice(0, 3) : '001');

                      return (
                        <tr key={v.id} style={{ borderBottom: `1px solid ${palette.border}` }}>
                          <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', color: palette.text }}>
                            {formatShortDateTime(v.createdAt)}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: palette.surfaceMuted,
                                color: palette.textSecondary,
                                fontWeight: '800',
                                fontSize: '0.72rem',
                                marginRight: '6px'
                              }}
                            >
                              Suc. {vBranch}
                            </span>
                            {v.consecutiveNumber && (
                              <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: palette.textMuted, marginTop: '2px' }}>
                                {v.consecutiveNumber}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                backgroundColor:
                                  v.docType === '01' ? palette.primarySoftBg : v.docType === '03' ? palette.warnSoftBg : palette.surfaceMuted,
                                color:
                                  v.docType === '01' ? palette.primarySoftText : v.docType === '03' ? palette.warnText : palette.textSecondary
                              }}
                            >
                              {v.docType === '01'
                                ? 'Factura 01'
                                : v.docType === '03'
                                ? 'Nota Crédito 03'
                                : 'Tiquete 04'}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '10px 8px',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: palette.textMuted
                            }}
                            title={v.numericKey || ''}
                          >
                            {v.numericKey
                              ? `${v.numericKey.slice(0, 10)}...${v.numericKey.slice(-8)}`
                              : 'En proceso'}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ fontWeight: '600', color: palette.text }}>
                              {v.receiverName || 'Cliente Contado'}
                            </div>
                            {v.receiverIdNumber && (
                              <div style={{ fontSize: '0.73rem', color: palette.textMuted }}>
                                ID: {v.receiverIdNumber}
                              </div>
                            )}
                            {v.receiverEmail && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: palette.primarySoftText,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px'
                                }}
                              >
                                <Mail size={11} />
                                <span>{v.receiverEmail}</span>
                                {(v.metadata as any)?.emailDelivery?.status === 'sent' && (
                                  <span
                                    style={{
                                      backgroundColor: palette.successBadgeBg,
                                      color: palette.successText,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontSize: '0.67rem',
                                      fontWeight: '700'
                                    }}
                                  >
                                    Enviado
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: '700', color: palette.text }}>
                            {v.currency === 'USD' ? '$' : '₡'}
                            {Number(v.totalAmount).toLocaleString('es-CR')}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: isCancelled
                                  ? palette.surfaceMuted
                                  : isAccepted
                                  ? palette.successBadgeBg
                                  : isRejected
                                  ? palette.dangerSoftBg
                                  : palette.warnSoftBg,
                                color: isCancelled
                                  ? palette.textSecondary
                                  : isAccepted
                                  ? palette.successText
                                  : isRejected
                                  ? palette.dangerText
                                  : palette.warnText
                              }}
                            >
                              {isAccepted ? (
                                <CheckCircle2 size={12} />
                              ) : isRejected ? (
                                <XCircle size={12} />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              {isCancelled
                                ? 'Anulado'
                                : isAccepted
                                ? 'Aceptado'
                                : isRejected
                                ? 'Rechazado'
                                : 'Pendiente'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <a
                                href={`/api/almendro/public/voucher-pdf/${v.numericKey || v.id}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  border: `1px solid ${palette.primarySoftBorder}`,
                                  backgroundColor: palette.primarySoftBg,
                                  color: palette.primarySoftText,
                                  textDecoration: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: '700'
                                }}
                                title="Descargar PDF Oficial"
                              >
                                <Download size={13} />
                                <span>PDF</span>
                              </a>

                              <a
                                href={`/api/almendro/public/voucher-xml/${v.numericKey || v.id}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  border: `1px solid ${palette.border}`,
                                  backgroundColor: palette.surfaceMuted,
                                  color: palette.textSecondary,
                                  textDecoration: 'none',
                                  fontSize: '0.74rem',
                                  fontWeight: '700'
                                }}
                                title="Descargar XML Oficial Hacienda DGT v4.4"
                              >
                                <Download size={13} />
                                <span>XML</span>
                              </a>

                              <button
                                type="button"
                                disabled={sendingEmailVoucherId === v.id}
                                onClick={() => handleSendVoucherEmail(v)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  border: `1px solid ${palette.primarySoftBorder}`,
                                  backgroundColor: palette.primarySoftBg,
                                  color: palette.primarySoftText,
                                  cursor: 'pointer',
                                  fontSize: '0.73rem',
                                  fontWeight: '700'
                                }}
                                title="Enviar o reenviar Factura (PDF y XML) al correo electrónico del cliente"
                              >
                                <Mail size={12} />
                                <span>
                                  {sendingEmailVoucherId === v.id ? 'Enviando...' : 'Enviar al Correo'}
                                </span>
                              </button>

                              {v.docType !== '03' && (v.status as string) !== 'cancelled' && (
                                <button
                                  type="button"
                                  disabled={cancellingVoucherId === v.id}
                                  onClick={() => handleIssueCreditNote(v)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '5px 9px',
                                    borderRadius: '6px',
                                    border: `1px solid ${palette.dangerSoftBorder}`,
                                    backgroundColor: palette.dangerSoftBg,
                                    color: palette.dangerText,
                                    cursor: 'pointer',
                                    fontSize: '0.73rem',
                                    fontWeight: '700'
                                  }}
                                  title="Anular con Nota de Crédito Electrónica (03)"
                                >
                                  <RotateCcw size={12} />
                                  <span>
                                    {cancellingVoucherId === v.id
                                      ? 'Anulando...'
                                      : 'Anular con Nota de Crédito (03)'}
                                  </span>
                                </button>
                              )}
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
        </div>
      )}

      {/* =====================================================================
          PESTAÑA 2: CREDENCIALES Y LLAVE .P12
      ===================================================================== */}
      {activeTab === 'credenciales' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* 1. Selector de Modalidad de Facturación */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h2
              style={{
                fontSize: '1.05rem',
                fontWeight: '800',
                margin: '0 0 14px 0',
                color: palette.text,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FileText size={18} color={palette.primary} /> Modalidad de Facturación Electrónica
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
                marginBottom: '16px'
              }}
            >
              {/* BETICO NATIVO */}
              <div
                onClick={() => setBillingMode('BETICO_NATIVE')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${billingMode === 'BETICO_NATIVE' ? palette.primary : palette.border}`,
                  backgroundColor: billingMode === 'BETICO_NATIVE' ? palette.successSoftBg : palette.surfaceAlt,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.94rem', color: billingMode === 'BETICO_NATIVE' ? palette.successText : palette.text }}>
                    ⚡ Betico Facturación Electrónica Nativa
                  </span>
                  <input
                    type="radio"
                    name="billingMode"
                    checked={billingMode === 'BETICO_NATIVE'}
                    onChange={() => setBillingMode('BETICO_NATIVE')}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: palette.textSecondary, lineHeight: '1.4' }}>
                  Conexión directa oficial con el Ministerio de Hacienda (DGT v4.4) con tu llave criptográfica .p12 y usuario ATV.
                </p>
              </div>

              {/* EXTERNA Y MANUAL */}
              <div
                onClick={() => setBillingMode('EXTERNAL_MANUAL')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${billingMode === 'EXTERNAL_MANUAL' ? '#a855f7' : palette.border}`,
                  backgroundColor: billingMode === 'EXTERNAL_MANUAL' ? palette.purpleSoftBg : palette.surfaceAlt,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.94rem', color: billingMode === 'EXTERNAL_MANUAL' ? palette.purpleText : palette.text }}>
                    📋 Facturación Externa y Manual
                  </span>
                  <input
                    type="radio"
                    name="billingMode"
                    checked={billingMode === 'EXTERNAL_MANUAL'}
                    onChange={() => setBillingMode('EXTERNAL_MANUAL')}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: palette.textSecondary, lineHeight: '1.4' }}>
                  Captura los datos fiscales del cliente en pedidos o reservas para facturarlos manualmente en otro sistema.
                </p>
              </div>

              {/* DESHABILITADA */}
              <div
                onClick={() => setBillingMode('DISABLED')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${billingMode === 'DISABLED' ? '#ef4444' : palette.border}`,
                  backgroundColor: billingMode === 'DISABLED' ? palette.dangerSoftBg : palette.surfaceAlt,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '800', fontSize: '0.94rem', color: billingMode === 'DISABLED' ? palette.dangerText : palette.text }}>
                    🚫 Deshabilitada
                  </span>
                  <input
                    type="radio"
                    name="billingMode"
                    checked={billingMode === 'DISABLED'}
                    onChange={() => setBillingMode('DISABLED')}
                  />
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: palette.textSecondary, lineHeight: '1.4' }}>
                  No solicita datos fiscales ni emite comprobantes electrónicos.
                </p>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: '12px' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: palette.text }}>
                <input
                  type="checkbox"
                  checked={showAlternativeProvider}
                  onChange={(e) => {
                    setShowAlternativeProvider(e.target.checked);
                    if (!e.target.checked && billingMode === 'ALMENDRO_AUTO') {
                      setBillingMode('BETICO_NATIVE');
                    }
                  }}
                />
                <span>Habilitar proveedor alternativo por API (Almendro)</span>
              </label>

              {showAlternativeProvider && (
                <div
                  onClick={() => setBillingMode('ALMENDRO_AUTO')}
                  style={{
                    marginTop: '12px',
                    padding: '14px',
                    borderRadius: '10px',
                    border: `2px solid ${billingMode === 'ALMENDRO_AUTO' ? palette.primary : palette.border}`,
                    backgroundColor: billingMode === 'ALMENDRO_AUTO' ? palette.primarySoftBg : palette.surfaceAlt,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.88rem', color: palette.text }}>⚡ Almendro API (Proveedor Alternativo)</strong>
                    <input
                      type="radio"
                      name="billingMode"
                      checked={billingMode === 'ALMENDRO_AUTO'}
                      onChange={() => setBillingMode('ALMENDRO_AUTO')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Selector de Entorno de Hacienda */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', marginBottom: '8px', color: palette.text }}>
              Entorno de Hacienda (DGT)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div
                onClick={() => setEnvironment('sandbox')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `2px solid ${environment === 'sandbox' ? '#f59e0b' : palette.border}`,
                  backgroundColor: environment === 'sandbox' ? palette.warnSoftBg : palette.surfaceAlt,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: environment === 'sandbox' ? palette.warnText : palette.text }}>
                  🧪 Sandbox (Pruebas y Certificación)
                </div>
                <div style={{ fontSize: '0.76rem', color: palette.textSecondary, marginTop: '4px' }}>
                  Usa credenciales @stag para validar emisión sin validez tributaria real.
                </div>
              </div>

              <div
                onClick={() => setEnvironment('production')}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  border: `2px solid ${environment === 'production' ? '#10b981' : palette.border}`,
                  backgroundColor: environment === 'production' ? palette.successSoftBg : palette.surfaceAlt,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '0.9rem', color: environment === 'production' ? palette.successText : palette.text }}>
                  🏛️ Producción (Hacienda Real)
                </div>
                <div style={{ fontSize: '0.76rem', color: palette.textSecondary, marginTop: '4px' }}>
                  Usa credenciales @prod para emitir comprobantes oficiales ante la DGT.
                </div>
              </div>
            </div>
          </div>

          {/* 3. Sección A: Credenciales del API en ATV (Usuario y Contraseña IDP) */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: palette.text }}>
                  Sección A: Credenciales del API en ATV (Usuario y Contraseña IDP)
                </h2>
                <span style={{ fontSize: '0.8rem', color: palette.textMuted }}>
                  Credenciales OAuth2 generadas en la Administración Tributaria Virtual
                </span>
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
                  color: palette.primary,
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={15} />
                <span>
                  {showAtvGuide
                    ? 'Ocultar guía oficial'
                    : '¿Cómo genero el usuario y contraseña en el portal ATV de Hacienda?'}
                </span>
              </button>
            </div>

            {showAtvGuide && (
              <div
                style={{
                  backgroundColor: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: palette.textSecondary
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px', color: palette.text }}>
                  Pasos oficiales en el portal ATV de Hacienda:
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>
                    Ingresa a{' '}
                    <a
                      href="https://atv.hacienda.go.cr"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: palette.primary, fontWeight: 'bold' }}
                    >
                      atv.hacienda.go.cr
                    </a>{' '}
                    con tu cédula y contraseña.
                  </li>
                  <li>
                    En el menú superior selecciona <strong>Comprobantes Electrónicos</strong> y luego{' '}
                    <strong>Llave Criptográfica de Producción</strong> (o de Pruebas / Staging).
                  </li>
                  <li>
                    Haz clic en <strong>Generar Contraseña</strong>. Copia el Usuario (ej.{' '}
                    <code>cpf-01-XXXX-XXXX@prod</code>) y la Contraseña mostrada en pantalla.
                  </li>
                </ol>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                  Usuario del API de Hacienda *
                </label>
                <input
                  type="text"
                  placeholder={environment === 'production' ? 'cpf-01-XXXX-XXXX@prod' : 'cpf-01-XXXX-XXXX@stag'}
                  value={idpUsername}
                  onChange={(e) => setIdpUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.inputBg,
                    color: palette.text
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '700', color: palette.text }}>
                    Contraseña del API de Hacienda *
                  </label>
                  {hasIdpPassword && !isEditingPassword && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPassword(true);
                        setIdpPassword('');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: palette.primary,
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Editar o cambiar contraseña
                    </button>
                  )}
                </div>

                {hasIdpPassword && !isEditingPassword ? (
                  <div
                    style={{
                      padding: '9px 12px',
                      backgroundColor: palette.surfaceMuted,
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      fontSize: '0.85rem',
                      color: palette.textSecondary
                    }}
                  >
                    •••••••• (Guardada de forma segura)
                  </div>
                ) : (
                  <input
                    type="password"
                    placeholder="Contraseña del IDP generada en ATV"
                    value={idpPassword}
                    onChange={(e) => setIdpPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.inputBg,
                      color: palette.text
                    }}
                  />
                )}
              </div>
            </div>

            {atvQuickResult && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  border: `1px solid ${atvQuickResult.success ? palette.successSoftBorder : palette.dangerSoftBorder}`,
                  backgroundColor: atvQuickResult.success ? palette.successSoftBg : palette.dangerSoftBg,
                  color: atvQuickResult.success ? palette.successText : palette.dangerText,
                  fontSize: '0.83rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {atvQuickResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{atvQuickResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleQuickTestAtv}
                disabled={testingAtvQuick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.primarySoftBorder}`,
                  backgroundColor: palette.primarySoftBg,
                  color: palette.primarySoftText,
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {testingAtvQuick ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{testingAtvQuick ? 'Verificando IDP...' : 'Probar Usuario y Contraseña ATV'}</span>
              </button>

              {(hasIdpPassword || idpUsername) && (
                <button
                  type="button"
                  onClick={() => handleDeleteCredentials('atv')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.dangerSoftBorder}`,
                    backgroundColor: palette.dangerSoftBg,
                    color: palette.dangerText,
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Limpiar Credenciales ATV</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Sección B: Llave Criptográfica de Firma Digital (.p12) y PIN */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0, color: palette.text }}>
                  Sección B: Llave Criptográfica de Firma Digital (.p12) y PIN
                </h2>
                <span style={{ fontSize: '0.8rem', color: palette.textMuted }}>
                  Certificado tributario para firma electrónica XAdES-EPES de tus comprobantes
                </span>
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
                  color: palette.primary,
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={15} />
                <span>
                  {showP12Guide ? 'Ocultar guía' : '¿Cómo descargo mi Llave Criptográfica .p12 en ATV?'}
                </span>
              </button>
            </div>

            {showP12Guide && (
              <div
                style={{
                  backgroundColor: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '0.82rem',
                  lineHeight: '1.5',
                  color: palette.textSecondary
                }}
              >
                <strong style={{ display: 'block', marginBottom: '6px', color: palette.text }}>
                  Pasos para descargar tu Llave Criptográfica .p12 en ATV:
                </strong>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>En el portal ATV, entra a <strong>Comprobantes Electrónicos</strong> y elige <strong>Llave Criptográfica</strong>.</li>
                  <li>Define un PIN numérico de 4 dígitos y haz clic en <strong>Generar Llave Criptográfica</strong>.</li>
                  <li>Se descargará un archivo con extensión <code>.p12</code>. Súbelo aquí junto con ese PIN de 4 dígitos.</li>
                </ol>
              </div>
            )}

            {/* Inspector Visual del Certificado */}
            {hasExistingCert && (
              <div
                style={{
                  backgroundColor: isCertExpired ? palette.dangerSoftBg : isCertExpiringSoon ? palette.warnSoftBg : palette.successSoftBg,
                  border: `1px solid ${isCertExpired ? palette.dangerSoftBorder : isCertExpiringSoon ? palette.warnSoftBorder : palette.successSoftBorder}`,
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color={isCertExpired ? palette.dangerText : isCertExpiringSoon ? palette.warnText : palette.successText} />
                    <strong style={{ fontSize: '0.92rem', color: palette.text }}>
                      Inspector de Certificado Criptográfico
                    </strong>
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: palette.successBadgeBg,
                      color: palette.successText
                    }}
                  >
                    🔒 Cifrado AES-256-GCM en Bóveda
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <span style={{ color: palette.textMuted, display: 'block', fontSize: '0.74rem' }}>
                      Archivo cargado:
                    </span>
                    <strong style={{ color: palette.text }}>{certFilename || 'llave_criptografica.p12'}</strong>
                  </div>

                  <div>
                    <span style={{ color: palette.textMuted, display: 'block', fontSize: '0.74rem' }}>
                      Titular del Certificado (Subject):
                    </span>
                    <strong style={{ color: palette.text }}>{certSubject || taxpayerName || 'Certificado Tributario Hacienda'}</strong>
                  </div>

                  <div>
                    <span style={{ color: palette.textMuted, display: 'block', fontSize: '0.74rem' }}>
                      Fecha de Vencimiento:
                    </span>
                    <strong style={{ color: palette.text }}>
                      {certExpiresAt ? new Date(certExpiresAt).toLocaleDateString('es-CR') : 'Verificada en bóveda'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: palette.textMuted, display: 'block', fontSize: '0.74rem' }}>
                      Estado de Vigencia y Días Restantes:
                    </span>
                    {effectiveDaysRemaining !== null ? (
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: '2px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '0.76rem',
                          backgroundColor: isCertExpired
                            ? palette.dangerSoftBg
                            : isCertExpiringSoon
                            ? palette.warnSoftBg
                            : palette.successBadgeBg,
                          color: isCertExpired ? palette.dangerText : isCertExpiringSoon ? palette.warnText : palette.successText
                        }}
                      >
                        {isCertExpired
                          ? `Vencido (${Math.abs(effectiveDaysRemaining)} días atrás)`
                          : `Vigente (${effectiveDaysRemaining} días restantes)`}
                      </span>
                    ) : (
                      <strong style={{ color: palette.successText }}>Vigente</strong>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                  {hasExistingCert ? 'Reemplazar archivo .p12 / .pfx' : 'Archivo de Certificado (.p12 / .pfx) *'}
                </label>
                <input
                  type="file"
                  accept=".p12,.pfx"
                  onChange={(e) => setP12File(e.target.files ? e.target.files[0] : null)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.inputBg,
                    color: palette.text,
                    fontSize: '0.82rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                  PIN de 4 dígitos del Certificado *
                </label>
                <input
                  type="password"
                  maxLength={12}
                  placeholder="Ej. 1234"
                  value={p12Pin}
                  onChange={(e) => setP12Pin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.inputBg,
                    color: palette.text
                  }}
                />
              </div>
            </div>

            {p12TestResult && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  border: `1px solid ${p12TestResult.success ? palette.successSoftBorder : palette.dangerSoftBorder}`,
                  backgroundColor: p12TestResult.success ? palette.successSoftBg : palette.dangerSoftBg,
                  color: p12TestResult.success ? palette.successText : palette.dangerText,
                  fontSize: '0.83rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {p12TestResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{p12TestResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleTestP12}
                disabled={testingP12}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.primarySoftBorder}`,
                  backgroundColor: palette.primarySoftBg,
                  color: palette.primarySoftText,
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {testingP12 ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                <span>{testingP12 ? 'Inspeccionando .p12...' : 'Validar Certificado .p12 y PIN'}</span>
              </button>

              {hasExistingCert && (
                <button
                  type="button"
                  onClick={() => handleDeleteCredentials('p12')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.dangerSoftBorder}`,
                    backgroundColor: palette.dangerSoftBg,
                    color: palette.dangerText,
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                  <span>Eliminar Certificado Actual</span>
                </button>
              )}
            </div>
          </div>

          {/* Sección C: Entrega Prioritaria de Facturas al Correo del Cliente (PDF y XML) */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={19} color={palette.primary} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: palette.text }}>
                  Sección C: Entrega Prioritaria de Facturas al Correo del Cliente (PDF y XML)
                </h3>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: emailAutoSend ? palette.successBadgeBg : palette.surfaceMuted,
                  color: emailAutoSend ? palette.successText : palette.textSecondary,
                  border: `1px solid ${emailAutoSend ? palette.successSoftBorder : palette.border}`
                }}
              >
                {emailAutoSend ? 'Envío Automático Activo (PDF + XML)' : 'Envío Automático Pausado'}
              </span>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '0.84rem', color: palette.textSecondary, lineHeight: '1.5' }}>
              Cada vez que un cliente realice un pedido en tu tienda, agende una cita o se le emita una factura manual e ingrese su correo electrónico, el sistema le enviará automáticamente el <strong>PDF del Comprobante</strong> y el <strong>XML Oficial DGT v4.4</strong> adjuntos.
            </p>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: emailAutoSend ? palette.successSoftBg : palette.surfaceAlt,
                border: `1px solid ${emailAutoSend ? palette.successSoftBorder : palette.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px'
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: palette.text }}>
                  Enviar automáticamente facturas y tiquetes al correo del cliente
                </div>
                <div style={{ fontSize: '0.78rem', color: palette.textSecondary, marginTop: '2px' }}>
                  Adjunta el PDF representativo y el archivo XML oficial de Hacienda en el correo que el cliente registró en el sistema.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAutoSend}
                onChange={(e) => setEmailAutoSend(e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: palette.primary, cursor: 'pointer' }}
              />
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: palette.surfaceAlt,
                border: `1px solid ${palette.border}`,
                marginBottom: '14px'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '0.84rem', color: palette.text, marginBottom: '4px' }}>
                Servidor de Correo del Comercio (Opcional: SMTP Propio o Resend API)
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: palette.textSecondary, lineHeight: '1.45' }}>
                Si deseas que las facturas salgan directamente desde el correo oficial de tu negocio (por ejemplo Gmail con Contraseña de Aplicación, Google Workspace, Office 365 o tu propio hosting), configura aquí tu servidor SMTP o llave de Resend. Si lo dejas en blanco, se utilizará el servidor global de la plataforma.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="Ej: smtp.gmail.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.inputBg,
                      color: palette.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                    Puerto SMTP
                  </label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value) || 587)}
                    placeholder="587 o 465"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.inputBg,
                      color: palette.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                    Usuario o Correo SMTP
                  </label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="facturacion@tunegocio.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.inputBg,
                      color: palette.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                    Contraseña SMTP o App Password
                  </label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder={hasSmtpPass ? '•••••••• (Guardada en bóveda)' : 'Contraseña de aplicación'}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.border}`,
                      backgroundColor: palette.inputBg,
                      color: palette.text
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: palette.text }}>
                  Alternativa Cloud: Resend API Key (Opcional)
                </label>
                <input
                  type="password"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder={hasResendApiKey ? '•••••••• (Guardada en bóveda)' : 're_xxxxxxxxxxxxxxxxx'}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.inputBg,
                    color: palette.text
                  }}
                />
              </div>
            </div>

            {emailTestResult && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${emailTestResult.success ? palette.successSoftBorder : palette.dangerSoftBorder}`,
                  backgroundColor: emailTestResult.success ? palette.successSoftBg : palette.dangerSoftBg,
                  color: emailTestResult.success ? palette.successText : palette.dangerText,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px'
                }}
              >
                {emailTestResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{emailTestResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleTestEmailDelivery}
                disabled={testingEmail}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${palette.primarySoftBorder}`,
                  backgroundColor: palette.primarySoftBg,
                  color: palette.primarySoftText,
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {testingEmail ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{testingEmail ? 'Enviando correo de prueba...' : 'Probar Envío de Correo'}</span>
              </button>
              <span style={{ fontSize: '0.76rem', color: palette.textSecondary }}>
                Recuerda hacer clic en <strong>Guardar Credenciales y Llave</strong> abajo después de configurar tu correo.
              </span>
            </div>
          </div>

          {/* Resultado de Prueba Integral */}
          {testResult && (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: `1px solid ${testResult.success ? palette.successSoftBorder : palette.dangerSoftBorder}`,
                backgroundColor: testResult.success ? palette.successSoftBg : palette.dangerSoftBg,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}
            >
              {testResult.success ? <CheckCircle2 size={22} color={palette.successText} /> : <AlertCircle size={22} color={palette.dangerText} />}
              <div style={{ fontSize: '0.86rem', lineHeight: '1.5', color: testResult.success ? palette.successText : palette.dangerText }}>
                <strong style={{ display: 'block', marginBottom: '2px', color: testResult.success ? palette.successText : palette.dangerText }}>
                  {testResult.success ? 'Conexión Exitosa con Hacienda' : 'Error en la Prueba de Conexión'}
                </strong>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Barra Inferior de Acciones (Tab 2) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
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
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surfaceMuted,
                color: palette.text,
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '0.9rem'
              }}
            >
              {testing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} color={palette.primary} />}
              <span>{testing ? 'Verificando con Hacienda...' : 'Prueba Integral con Hacienda'}</span>
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
                backgroundColor: palette.primaryBtnBg,
                color: palette.primaryBtnText,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '800',
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
              }}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              <span>{saving ? 'Guardando...' : 'Guardar Credenciales y Llave'}</span>
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          PESTAÑA 3: DATOS FISCALES Y SUCURSALES
      ===================================================================== */}
      {activeTab === 'sucursales' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Sección A: Datos Fiscales del Contribuyente y Padrón de Hacienda */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)' }}>
              Sección A: Datos Fiscales del Contribuyente y Padrón de Hacienda
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Consulta tu número de cédula directamente en el padrón del Ministerio de Hacienda para autocompletar tu Razón Social, régimen y actividades económicas CIIU.
            </p>

            {padronMessage && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  border: `1px solid ${padronMessage.type === 'success' ? palette.successSoftBorder : palette.dangerSoftBorder}`,
                  backgroundColor: padronMessage.type === 'success' ? palette.successSoftBg : palette.dangerSoftBg,
                  color: padronMessage.type === 'success' ? palette.successText : palette.dangerText,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {padronMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{padronMessage.text}</span>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '14px',
                marginBottom: '16px'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Número de Cédula *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Ej. 3101234567"
                    value={taxpayerIdNumber}
                    onChange={(e) => setTaxpayerIdNumber(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--background)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleConsultTaxpayerPadron}
                    disabled={consultingPadron}
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.primarySoftBorder}`,
                      backgroundColor: palette.primarySoftBg,
                      color: palette.primarySoftText,
                      fontWeight: '700',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {consultingPadron ? 'Consultando...' : 'Consultar en Hacienda'}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Tipo de Cédula *
                </label>
                <select
                  value={taxpayerIdType}
                  onChange={(e) => setTaxpayerIdType(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                >
                  <option value="01">01 - Física (9 dígitos)</option>
                  <option value="02">02 - Jurídica (10 dígitos)</option>
                  <option value="03">03 - DIMEX (11 o 12 dígitos)</option>
                  <option value="04">04 - NITE (10 dígitos)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Nombre o Razón Social *
                </label>
                <input
                  type="text"
                  placeholder="Inscrito en Hacienda"
                  value={taxpayerName}
                  onChange={(e) => setTaxpayerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  placeholder="Nombre de tu comercio"
                  value={commercialName}
                  onChange={(e) => setCommercialName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Correo Fiscal Oficial *
                </label>
                <input
                  type="email"
                  placeholder="facturacion@tunegocio.cr"
                  value={taxpayerEmail}
                  onChange={(e) => setTaxpayerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Teléfono
                </label>
                <input
                  type="text"
                  placeholder="Ej. 22223333"
                  value={taxpayerPhone}
                  onChange={(e) => setTaxpayerPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Código de Actividad Económica Principal (CIIU) *
                </label>
                {economicActivities.length > 0 && (
                  <select
                    value={economicActivityCode}
                    onChange={(e) => setEconomicActivityCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${palette.primarySoftBorder}`,
                      backgroundColor: palette.primarySoftBg,
                      color: palette.primarySoftText,
                      marginBottom: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    {economicActivities.map((act) => (
                      <option key={act.code} value={act.code}>
                        {act.code} - {act.description}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Ej. 722003 (6 dígitos)"
                  value={economicActivityCode}
                  onChange={(e) => setEconomicActivityCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Código CABYS Predeterminado (13 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="8311100000000"
                  value={defaultCabysCode}
                  onChange={(e) => setDefaultCabysCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                  Documento Predeterminado *
                </label>
                <select
                  value={defaultDocType}
                  onChange={(e) => setDefaultDocType(e.target.value as '01' | '04')}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                >
                  <option value="04">04 - Tiquete Electrónico</option>
                  <option value="01">01 - Factura Electrónica</option>
                </select>
              </div>
            </div>

            {/* Tarjeta de Régimen de Tributación Simplificada (RTS) */}
            <div
              style={{
                marginBottom: '16px',
                padding: '15px',
                borderRadius: '12px',
                border: `1px solid ${isSimplifiedRegime ? palette.primarySoftBorder : 'var(--border)'}`,
                backgroundColor: isSimplifiedRegime ? palette.primarySoftBg : 'var(--background)'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isSimplifiedRegime}
                  onChange={(e) => {
                    setIsSimplifiedRegime(e.target.checked);
                    if (e.target.checked) setDefaultDocType('04');
                  }}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <div>
                  <strong style={{ fontSize: '0.88rem', color: isSimplifiedRegime ? palette.primarySoftText : 'var(--text)' }}>
                    Régimen de Tributación Simplificada (RTS)
                  </strong>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.79rem', color: palette.textMuted }}>
                    Emite por defecto Tiquete Electrónico (04) y cambia automáticamente a Factura Electrónica (01) cuando el cliente proporciona sus datos fiscales.
                  </p>
                </div>
              </label>
            </div>

            {/* Ubicación Fiscal de Casa Matriz */}
            <h3 style={{ fontSize: '0.92rem', fontWeight: '800', margin: '0 0 10px 0', color: 'var(--text)' }}>
              Ubicación Fiscal de Casa Matriz
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Provincia</label>
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
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Cantón (2 dígitos)</label>
                <input type="text" value={canton} onChange={(e) => setCanton(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Distrito (2 dígitos)</label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Barrio (2 dígitos)</label>
                <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                Otras Señas / Dirección Exacta *
              </label>
              <input
                type="text"
                placeholder="Ej. Del parque central 100 metros norte, edificio esquinero"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)'
                }}
              />
            </div>
          </div>

          {/* Sección B: Casa Matriz y Control de Consecutivos Iniciales (001 / 00001) */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: '800', margin: '0 0 6px 0', color: 'var(--text)' }}>
              Sección B: Casa Matriz y Control de Consecutivos Iniciales ({branchCode || '001'} / {posCode || '00001'})
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Si vienes migrando desde otro facturador electrónico, ingresa aquí el último número consecutivo utilizado para que Hacienda nunca rechace documentos por secuencia duplicada.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '16px'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>
                  Código de Sucursal Principal (3 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>
                  Código de Caja / Terminal Principal (5 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={posCode}
                  onChange={(e) => setPosCode(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>
                  Consecutivo Actual Factura Electrónica (01)
                </label>
                <input
                  type="number"
                  min={1}
                  value={seqFactura}
                  onChange={(e) => setSeqFactura(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
                <span style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--primary)', marginTop: '4px' }}>
                  Vista previa (20 díg.): {formatConsecutivePreview(branchCode, posCode, '01', seqFactura)}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>
                  Consecutivo Actual Tiquete Electrónico (04)
                </label>
                <input
                  type="number"
                  min={1}
                  value={seqTiquete}
                  onChange={(e) => setSeqTiquete(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
                <span style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--primary)', marginTop: '4px' }}>
                  Vista previa (20 díg.): {formatConsecutivePreview(branchCode, posCode, '04', seqTiquete)}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px' }}>
                  Consecutivo Actual Nota de Crédito (03)
                </label>
                <input
                  type="number"
                  min={1}
                  value={seqNotaCredito}
                  onChange={(e) => setSeqNotaCredito(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)'
                  }}
                />
                <span style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--primary)', marginTop: '4px' }}>
                  Vista previa (20 díg.): {formatConsecutivePreview(branchCode, posCode, '03', seqNotaCredito)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                <span>{saving ? 'Guardando...' : 'Guardar Datos Fiscales y Consecutivos'}</span>
              </button>
            </div>
          </div>

          {/* Sección C: Facturación Multi-Sucursal Vinculada a Sucursales de Tienda (Opcional) */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '22px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '14px',
                flexWrap: 'wrap',
                paddingBottom: multiBranchEnabled ? '16px' : '0',
                borderBottom: multiBranchEnabled ? '1px solid var(--border)' : 'none'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={multiBranchEnabled}
                  onChange={(e) => setMultiBranchEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--primary)' }}
                />
                <div>
                  <strong style={{ fontSize: '1.0rem', color: 'var(--text)', display: 'block' }}>
                    ¿Operas con varias sucursales? Activar Facturación por Sucursal
                  </strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                    Activa esta opción solo si tienes o planeas abrir más sucursales y deseas relacionar cada sucursal de tu tienda con un código de sucursal de Hacienda (002, 003...), consecutivos independientes o credenciales propias.
                  </p>
                </div>
              </label>

              {multiBranchEnabled && (
                <button
                  type="button"
                  onClick={openCreateBranchModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>+ Configurar Sucursal en Facturación</span>
                </button>
              )}
            </div>

            {multiBranchEnabled && (
              <div style={{ marginTop: '18px' }}>
                {haciendaBranches.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: '10px',
                      border: '1px dashed var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem'
                    }}
                  >
                    Aún no has configurado sucursales adicionales (002, 003...). Haz clic en{' '}
                    <strong>+ Configurar Sucursal en Facturación</strong> para vincular una sede.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                    {haciendaBranches.map((b) => {
                      const linkedStore = storeBranches.find((sb) => sb.id === b.storeBranchId);
                      const storeLabel = b.storeBranchName || linkedStore?.name;

                      return (
                        <div
                          key={b.id}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--background)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                              <strong style={{ fontSize: '0.96rem', color: 'var(--text)' }}>{b.branchName}</strong>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  backgroundColor: palette.primarySoftBg,
                                  color: palette.primarySoftText
                                }}
                              >
                                Sucursal {b.branchCode} · Caja {b.posCode}
                              </span>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.73rem',
                                  fontWeight: '700',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  backgroundColor: storeLabel ? palette.successBadgeBg : palette.surfaceMuted,
                                  color: storeLabel ? palette.successText : palette.textMuted
                                }}
                              >
                                {storeLabel
                                  ? `Vinculada a tienda: ${storeLabel}`
                                  : 'Sin vincular a sede de tienda'}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'monospace' }}>
                              Factura 01: #{b.seqFactura || 1} | Tiquete 04: #{b.seqTiquete || 1}
                            </div>

                            <div>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.73rem',
                                  fontWeight: '700',
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  backgroundColor: b.useCustomCredentials ? palette.warnSoftBg : palette.surfaceMuted,
                                  color: b.useCustomCredentials ? palette.warnText : palette.textSecondary
                                }}
                              >
                                {b.useCustomCredentials
                                  ? `Credenciales ATV y llave .p12 propias (${b.customTaxpayerIdNumber || 'Cédula propia'})`
                                  : 'Hereda credenciales y llave .p12 de Casa Matriz'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                            <button
                              type="button"
                              onClick={() => handleTestBranchConnection(b)}
                              disabled={testingBranchId === b.id}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${palette.primarySoftBorder}`,
                                backgroundColor: palette.primarySoftBg,
                                color: palette.primarySoftText,
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {testingBranchId === b.id ? 'Probando...' : 'Probar Conexión'}
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditBranchModal(b)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBranch(b)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${palette.dangerSoftBorder}`,
                                backgroundColor: palette.dangerSoftBg,
                                color: palette.dangerText,
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal / Formulario de Configuración de Sucursal en Facturación */}
          {showBranchModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px'
              }}
            >
              <form
                onSubmit={handleSaveBranch}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '16px',
                  maxWidth: '680px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text)' }}>
                    {editingBranchId ? 'Editar Sucursal en Facturación' : 'Configurar Sucursal en Facturación'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Relacionar con Sucursal de Tienda */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', marginBottom: '5px' }}>
                      Relacionar con Sucursal de Tienda (Sedes y Sucursales)
                    </label>
                    <select
                      value={bStoreBranchId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBStoreBranchId(val);
                        const found = storeBranches.find((sb) => sb.id === val);
                        if (found) {
                          if (!bBranchName.trim()) setBBranchName(found.name);
                          if (!bAddressDetail.trim() && found.address) setBAddressDetail(found.address);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    >
                      <option value="">-- Sin vincular o seleccionar sede --</option>
                      {storeBranches.map((sb) => (
                        <option key={sb.id} value={sb.id}>
                          {sb.name} {sb.address ? `(${sb.address})` : ''}
                        </option>
                      ))}
                    </select>
                    {storeBranches.length === 0 && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: palette.warnText, marginTop: '4px' }}>
                        Nota: Aún no has creado sedes operativas en el módulo Sedes y Sucursales. Puedes crear esta sucursal fiscal ahora y vincularla después.
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                        Nombre de la Sucursal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Sucursal Escazú"
                        value={bBranchName}
                        onChange={(e) => setBBranchName(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                        Código Sucursal Hacienda (3 díg.) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        placeholder="002"
                        value={bBranchCode}
                        onChange={(e) => setBBranchCode(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                        Código Caja / Terminal (5 díg.) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="00001"
                        value={bPosCode}
                        onChange={(e) => setBPosCode(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>

                  {/* Actividad Económica y Dirección */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                        Actividad CIIU
                      </label>
                      <input
                        type="text"
                        placeholder={economicActivityCode || '722003'}
                        value={bEconomicActivityCode}
                        onChange={(e) => setBEconomicActivityCode(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                        Provincia
                      </label>
                      <select
                        value={bProvince}
                        onChange={(e) => setBProvince(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      >
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
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                        Cantón
                      </label>
                      <input
                        type="text"
                        value={bCanton}
                        onChange={(e) => setBCanton(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                        Distrito
                      </label>
                      <input
                        type="text"
                        value={bDistrict}
                        onChange={(e) => setBDistrict(e.target.value)}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '4px' }}>
                      Dirección Fiscal / Señas de la Sucursal
                    </label>
                    <input
                      type="text"
                      placeholder="Dirección exacta de esta sede"
                      value={bAddressDetail}
                      onChange={(e) => setBAddressDetail(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                  </div>

                  {/* Consecutivos de esta Sucursal */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '3px' }}>
                        Consecutivo Factura (01)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={bSeqFactura}
                        onChange={(e) => setBSeqFactura(Math.max(1, Number(e.target.value) || 1))}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '3px' }}>
                        Consecutivo Tiquete (04)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={bSeqTiquete}
                        onChange={(e) => setBSeqTiquete(Math.max(1, Number(e.target.value) || 1))}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', marginBottom: '3px' }}>
                        Consecutivo Nota Crédito (03)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={bSeqNotaCredito}
                        onChange={(e) => setBSeqNotaCredito(Math.max(1, Number(e.target.value) || 1))}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                      />
                    </div>
                  </div>

                  {/* Modo de Credenciales de Hacienda para esta Sucursal */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', marginBottom: '8px' }}>
                      Modo de Credenciales de Hacienda para esta Sucursal
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${!bUseCustomCredentials ? palette.primarySoftBorder : 'var(--border)'}`,
                          backgroundColor: !bUseCustomCredentials ? palette.primarySoftBg : 'var(--background)',
                          color: !bUseCustomCredentials ? palette.primarySoftText : palette.text,
                          cursor: 'pointer',
                          fontSize: '0.82rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="branchCredMode"
                          checked={!bUseCustomCredentials}
                          onChange={() => setBUseCustomCredentials(false)}
                        />
                        <span>
                          <strong>Heredar Cédula, Usuario ATV y Llave .p12 de Casa Matriz</strong> (solo cambia el código de sucursal, dirección y consecutivos)
                        </span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${bUseCustomCredentials ? palette.primarySoftBorder : 'var(--border)'}`,
                          backgroundColor: bUseCustomCredentials ? palette.primarySoftBg : 'var(--background)',
                          color: bUseCustomCredentials ? palette.primarySoftText : palette.text,
                          cursor: 'pointer',
                          fontSize: '0.82rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="branchCredMode"
                          checked={bUseCustomCredentials}
                          onChange={() => setBUseCustomCredentials(true)}
                        />
                        <span>
                          <strong>Configurar Cédula, Usuario ATV y Llave .p12 propias para esta sucursal</strong>
                        </span>
                      </label>
                    </div>

                    {bUseCustomCredentials && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '14px',
                          borderRadius: '10px',
                          backgroundColor: palette.surfaceAlt,
                          border: '1px solid var(--border)',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            Cédula de la Sucursal *
                          </label>
                          <input
                            type="text"
                            required={bUseCustomCredentials}
                            value={bCustomIdNumber}
                            onChange={(e) => setBCustomIdNumber(e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            Razón Social *
                          </label>
                          <input
                            type="text"
                            required={bUseCustomCredentials}
                            value={bCustomName}
                            onChange={(e) => setBCustomName(e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            Usuario ATV *
                          </label>
                          <input
                            type="text"
                            required={bUseCustomCredentials}
                            value={bCustomIdpUsername}
                            onChange={(e) => setBCustomIdpUsername(e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            Contraseña ATV
                          </label>
                          <input
                            type="password"
                            value={bCustomIdpPassword}
                            onChange={(e) => setBCustomIdpPassword(e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            Archivo .p12 de la Sucursal
                          </label>
                          <input
                            type="file"
                            accept=".p12,.pfx"
                            onChange={(e) => setBCustomP12File(e.target.files ? e.target.files[0] : null)}
                            style={{ width: '100%', padding: '5px', fontSize: '0.76rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '3px' }}>
                            PIN del .p12
                          </label>
                          <input
                            type="password"
                            value={bCustomP12Pin}
                            onChange={(e) => setBCustomP12Pin(e.target.value)}
                            style={{ width: '100%', padding: '7px 9px', borderRadius: '6px', border: '1px solid var(--border)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowBranchModal(false)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'transparent',
                        color: palette.text,
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingBranch}
                      style={{
                        padding: '9px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '800'
                      }}
                    >
                      {savingBranch ? 'Guardando...' : 'Guardar Sucursal Fiscal'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
