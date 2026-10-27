import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import GuidedTourModal, { SIX_MODULES_CATALOG } from './components/GuidedTourModal';
import { StoreModulesConfig } from '../shared/types';
import Dashboard from './components/Dashboard';
import ChatsInbox from './components/ChatsInbox';
import Bookings from './components/Bookings';
import ServicesManager from './components/ServicesManager';
import ProductManager from './components/ProductManager';
import OrdersPanel from './components/OrdersPanel';
import StoreSettings from './components/StoreSettings';
import AgentPromptStudio from './components/AgentPromptStudio';
import MessageQueuePanel from './components/MessageQueuePanel';
import EvolutionManager from './components/EvolutionManager';
import NotificationsCenter from './components/NotificationsCenter';
import UsersManagement from './components/UsersManagement';
import TenantSettings from './components/TenantSettings';
import SuperAdminPanel from './components/SuperAdminPanel';
import StorefrontView from '../storefront/StorefrontView';
import PublicBookingView from '../storefront/PublicBookingView';
import OrderSuccessView from '../storefront/OrderSuccessView';
import HostedCheckoutView from '../storefront/HostedCheckoutView';
import CourtBookingPublic from './components/CourtBookingPublic';
import CourtsManager from './components/CourtsManager';
import CourtsBookingsManager from './components/CourtsBookingsManager';
import DriverPortal from './components/DriverPortal';
import SpecialistPortal from './components/SpecialistPortal';
import KDSFullscreen from './components/KDSFullscreen';
import TenantLoginView from './components/TenantLoginView';
import CampaignsManager from './components/CampaignsManager';
import BranchesManager from './components/BranchesManager';
import LandingPageView from './components/LandingPageView';
import PrivacyPolicyView from './components/PrivacyPolicyView';
import TermsOfServiceView from './components/TermsOfServiceView';
import WebsiteBuilder from './components/WebsiteBuilder';
import WebsitePublicView from '../storefront/WebsitePublicView';
import TenantSubscriptionView from './components/TenantSubscriptionView';
import SubscriptionReturnView from './components/SubscriptionReturnView';
import ElectronicBillingView from './components/ElectronicBillingView';
import LoyaltyManager from './components/LoyaltyManager';
import LoyaltyWalletCustomerApp from './components/LoyaltyWalletCustomerApp';
import SecretaryManager from './components/SecretaryManager';
import { BusinessAdvisorCopilot, BusinessAdvisorView } from './components/BusinessAdvisorCopilot';
import { io } from 'socket.io-client';
import { playOrderNotificationSound, playBookingNotificationSound } from './utils/sound';

import {
  Home,
  MessageSquare,
  Calendar,
  Wrench,
  ShoppingBag,
  Package,
  ClipboardList,
  FileText,
  Bot,
  Phone,
  Bell,
  Users,
  Settings,
  Shield,
  ShieldAlert,
  LogOut,
  ArrowLeft,
  DollarSign,
  CreditCard,
  Building2,
  Server,
  ShieldCheck,
  Send,
  Sparkles, HelpCircle,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Zap,
  Globe,
  Clock,
  Trophy,
  CalendarCheck,
  Gift,
  Tag,
  Award,
  QrCode,
  Sliders,
  Check
} from 'lucide-react';


// Safe Error Boundary to prevent white screen / crash on unexpected runtime errors
class TabErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Betico Tab Error caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
          <h3 style={{ color: '#991b1b', margin: '0 0 10px 0', fontSize: '1.2rem' }}>Ocurrió un inconveniente al cargar esta sección</h3>
          <p style={{ color: '#7f1d1d', fontSize: '0.85rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'Error de referencia inesperado'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 18px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
          >
            Reintentar carga
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Public route checks
  const pathname = window.location.pathname;

  if (pathname.startsWith('/sitio/') || pathname.startsWith('/web/')) {
    const slug = pathname.replace('/sitio/', '').replace('/web/', '').split('/')[0];
    return <WebsitePublicView slug={slug} />;
  }

  if (pathname.startsWith('/tienda/')) {
    const slug = pathname.replace('/tienda/', '').split('/')[0];
    return <StorefrontView slug={slug} />;
  }

  if (pathname.startsWith('/order/success/')) {
    const orderId = pathname.replace('/order/success/', '').split('/')[0];
    return <OrderSuccessView orderId={orderId} />;
  }

  if (pathname.startsWith('/pay/')) {
    const token = pathname.replace('/pay/', '').split('/')[0];
    return <HostedCheckoutView token={token} />;
  }

  if (pathname.startsWith('/reservas/')) {
    const slug = pathname.replace('/reservas/', '').split('/')[0];
    return <PublicBookingView slug={slug} />;
  }

  if (pathname.startsWith('/canchas/')) {
    const slug = pathname.replace('/canchas/', '').split('/')[0];
    return <CourtBookingPublic slug={slug} />;
  }

  if (pathname.startsWith('/acceso/')) {
    const slug = pathname.replace('/acceso/', '').split('/')[0];
    if (slug) {
      return <TenantLoginView slug={slug} />;
    }
  }

  if (pathname === '/acceso' || pathname === '/acceso/') {
    const lastSlug = localStorage.getItem('last_tenant_slug');
    if (lastSlug) {
      return <TenantLoginView slug={lastSlug} />;
    }
    return <Login onBack={() => { window.location.href = '/'; }} />;
  }

  if (pathname.startsWith('/admin/') || pathname.startsWith('/portal/')) {
    const slug = pathname.replace('/admin/', '').replace('/portal/', '').split('/')[0];
    return <TenantLoginView slug={slug} />;
  }

  if (pathname.startsWith('/repartidor') || pathname.startsWith('/driver') || pathname.startsWith('/mensajero')) {
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const match = cleanPath.match(/^\/(?:repartidor|driver|mensajero)(?:\/([a-zA-Z0-9_-]+))?/i);
    const slug = (match && match[1]) ? match[1].toLowerCase().trim() : undefined;
    return <DriverPortal tenantSlug={slug} />;
  }

  if (pathname.startsWith('/especialista') || pathname.startsWith('/colaborador') || pathname.startsWith('/equipo')) {
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const match = cleanPath.match(/^\/(?:especialista|colaborador|equipo)(?:\/([a-zA-Z0-9_-]+))?/i);
    const slug = (match && match[1]) ? match[1].toLowerCase().trim() : undefined;
    return <SpecialistPortal tenantSlug={slug} />;
  }

  if (pathname.startsWith('/kds')) {
    return <KDSFullscreen />;
  }

  if (pathname === '/politica-de-privacidad' || pathname === '/privacidad') {
    return <PrivacyPolicyView />;
  }

  if (pathname === '/terminos-y-condiciones' || pathname === '/terminos') {
    return <TermsOfServiceView />;
  }

  if (pathname.startsWith('/subscription/return') || pathname.startsWith('/suscripcion/retorno')) {
    return <SubscriptionReturnView />;
  }

  if (pathname.startsWith('/fidelidad') || pathname.startsWith('/fidelizacion') || pathname.startsWith('/club')) {
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const match = cleanPath.match(/^\/(?:fidelidad|fidelizacion|club)(?:\/([a-zA-Z0-9_-]+))?/i);
    const slug = (match && match[1]) ? match[1].toLowerCase().trim() : undefined;
    return <LoyaltyWalletCustomerApp tenantSlug={slug} />;
  }

  return <MainApp pathname={pathname} />;
}

function MainApp({ pathname }: { pathname: string }) {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('p');
      if (tabParam) return tabParam;
      if (params.get('sa_tab') === 'cobranza') return 'sa_collections';
      if (params.get('card_status') === 'success' || params.get('tab') === 'suscripcion') return 'configuracion';

      const saSaved = sessionStorage.getItem('betico_active_tab_superadmin');
      const tenantSaved = sessionStorage.getItem('betico_active_tab_tenant');
      if (saSaved && saSaved.startsWith('sa_')) return saSaved;
      if (tenantSaved) return tenantSaved;
    } catch (e) {}
    return 'dashboard';
  });
  const [showTourModal, setShowTourModal] = useState<boolean>(() => {
    return window.location.search.includes('tour=true') || (!localStorage.getItem('betico_tour_dismissed') && localStorage.getItem('betico_tour_active') === 'true');
  });
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const navigateToTab = (pageId: string) => {
    const target = pageId === 'website_builder' ? 'sitio' : pageId;
    setCurrentPage(target);
    setMobileMenuOpen(false);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', target);
      url.searchParams.delete('sa_tab');
      url.searchParams.delete('card_status');
      url.searchParams.delete('tour');
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch (e) {}

    try {
      const scope = user?.role === 'superadmin' ? 'superadmin' : (user?.tenantId || 'tenant');
      sessionStorage.setItem(`betico_active_tab_${scope}`, target);
      if (user?.role !== 'superadmin') {
        sessionStorage.setItem('betico_active_tab_tenant', target);
      }
    } catch (e) {}
  };

  const handleCloseTourModal = () => {
    setShowTourModal(false);
    try {
      if (user?.tenantId) {
        localStorage.setItem(`betico_tour_dismissed_${user.tenantId}`, 'true');
      }
      localStorage.setItem('betico_tour_dismissed', 'true');
      localStorage.removeItem('betico_tour_active');
      const url = new URL(window.location.href);
      if (url.searchParams.has('tour')) {
        url.searchParams.delete('tour');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('p');
      if (tabParam && tabParam !== currentPage) {
        setCurrentPage(tabParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPage]);

  // Tenant customization
  const [storeMode, setStoreMode] = useState<'retail' | 'restaurant'>('retail');
  const [storeModules, setStoreModules] = useState<StoreModulesConfig>(() => {
    try {
      const cached = localStorage.getItem('betico_store_modules_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return {
      whatsappEnabled: true,
      storeEnabled: true,
      bookingsEnabled: true,
      courtsEnabled: false,
      branchesEnabled: false,
      loyaltyEnabled: false,
      billingEnabled: true
    };
  });
  const [showModuleSwitcher, setShowModuleSwitcher] = useState<boolean>(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    whatsapp: true,
    tienda: true,
    reservas: false,
    canchas: false,
    fidelizacion: false,
    facturacion: false
  });

  const pageToModule: Record<string, string> = {
    whatsapp: 'whatsapp',
    chats: 'whatsapp',
    queue: 'whatsapp',
    campaigns: 'whatsapp',
    agente: 'whatsapp',
    secretario: 'whatsapp',
    asesor: 'whatsapp',
    tienda: 'tienda',
    productos: 'tienda',
    ordenes: 'tienda',
    reservas: 'reservas',
    servicios: 'reservas',
    canchas: 'canchas',
    canchas_reservas: 'canchas',
    fidelidad: 'fidelizacion',
    fidelidad_ajustes: 'fidelizacion',
    fidelidad_billeteras: 'fidelizacion',
    fidelidad_clientes: 'fidelizacion',
    fidelidad_promociones: 'fidelizacion',
    fidelidad_cupones: 'fidelizacion',
    facturacion: 'facturacion',
    facturacion_comprobantes: 'facturacion',
    facturacion_credenciales: 'facturacion',
    facturacion_sucursales: 'facturacion',
    suscripcion: 'facturacion'
  };

  const ensureAtLeastOneModuleActive = (mods: StoreModulesConfig): StoreModulesConfig => {
    const hasAnyActive =
      mods.whatsappEnabled !== false ||
      mods.storeEnabled !== false ||
      mods.bookingsEnabled !== false ||
      Boolean(mods.courtsEnabled) ||
      Boolean(mods.loyaltyEnabled) ||
      mods.billingEnabled !== false;
    if (!hasAnyActive) {
      return { ...mods, whatsappEnabled: true };
    }
    return mods;
  };

  const saveModuleConfiguration = async (config: {
    storeModules: StoreModulesConfig;
    storeMode?: 'retail' | 'restaurant';
  }) => {
    const nextModules = ensureAtLeastOneModuleActive(config.storeModules);
    const nextMode = config.storeMode || storeMode;
    setStoreModules(nextModules);
    if (config.storeMode) setStoreMode(config.storeMode);
    try {
      localStorage.setItem('betico_store_modules_cache', JSON.stringify(nextModules));
      if (user?.tenantId) {
        localStorage.setItem(`betico_store_modules_cache_${user.tenantId}`, JSON.stringify(nextModules));
        localStorage.setItem(`betico_tour_dismissed_${user.tenantId}`, 'true');
      }
    } catch (e) {}
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/store/modules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            storeModules: nextModules,
            storeMode: nextMode
          })
        });
      }
    } catch (e) {}
  };

  const toggleSingleModule = (moduleKey: string) => {
    let next: StoreModulesConfig = { ...storeModules };
    if (moduleKey === 'whatsapp') next.whatsappEnabled = next.whatsappEnabled === false;
    if (moduleKey === 'tienda') next.storeEnabled = next.storeEnabled === false;
    if (moduleKey === 'reservas') next.bookingsEnabled = next.bookingsEnabled === false;
    if (moduleKey === 'canchas') next.courtsEnabled = !next.courtsEnabled;
    if (moduleKey === 'fidelizacion') next.loyaltyEnabled = !next.loyaltyEnabled;
    if (moduleKey === 'facturacion') next.billingEnabled = next.billingEnabled === false;

    next = ensureAtLeastOneModuleActive(next);
    saveModuleConfiguration({ storeModules: next });

    const isNowEnabled =
      moduleKey === 'whatsapp' ? next.whatsappEnabled !== false :
      moduleKey === 'tienda' ? next.storeEnabled !== false :
      moduleKey === 'reservas' ? next.bookingsEnabled !== false :
      moduleKey === 'canchas' ? Boolean(next.courtsEnabled) :
      moduleKey === 'fidelizacion' ? Boolean(next.loyaltyEnabled) :
      next.billingEnabled !== false;

    if (isNowEnabled) {
      setExpandedModules(prev => ({ ...prev, [moduleKey]: true }));
    } else if (pageToModule[currentPage] === moduleKey) {
      const firstActive = SIX_MODULES_CATALOG.find(m =>
        m.key === 'whatsapp' ? next.whatsappEnabled !== false :
        m.key === 'tienda' ? next.storeEnabled !== false :
        m.key === 'reservas' ? next.bookingsEnabled !== false :
        m.key === 'canchas' ? Boolean(next.courtsEnabled) :
        m.key === 'fidelizacion' ? Boolean(next.loyaltyEnabled) :
        next.billingEnabled !== false
      );
      navigateToTab(firstActive ? firstActive.defaultTab : 'dashboard');
    }
  };

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    const handleStoreConfigUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;
      if (detail.storeMode) setStoreMode(detail.storeMode);
      if (detail.storeModules) {
        const safeModules = ensureAtLeastOneModuleActive(detail.storeModules);
        setStoreModules(safeModules);
        try {
          localStorage.setItem('betico_store_modules_cache', JSON.stringify(safeModules));
          if (user?.tenantId) {
            localStorage.setItem(`betico_store_modules_cache_${user.tenantId}`, JSON.stringify(safeModules));
          }
        } catch (_err) {}
      }
    };
    window.addEventListener('betico:store-config-updated', handleStoreConfigUpdated);
    return () => window.removeEventListener('betico:store-config-updated', handleStoreConfigUpdated);
  }, [user?.tenantId]);

  useEffect(() => {
    const modKey = pageToModule[currentPage];
    if (modKey) {
      setExpandedModules(prev => (prev[modKey] ? prev : { ...prev, [modKey]: true }));
    }
  }, [currentPage]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('p');

    if (user?.role === 'superadmin') {
      if (params.get('sa_tab') === 'cobranza') {
        navigateToTab('sa_collections');
        return;
      }
      const saSaved = sessionStorage.getItem('betico_active_tab_superadmin');
      if (tabParam) {
        const resolved = tabParam.startsWith('sa_') ? tabParam : `sa_${tabParam}`;
        if (currentPage !== resolved) setCurrentPage(resolved);
      } else if (saSaved && saSaved.startsWith('sa_')) {
        if (currentPage !== saSaved) setCurrentPage(saSaved);
      } else if (currentPage === 'dashboard') {
        setCurrentPage('sa_tenants');
      }
      return;
    } else {
      const tenantSaved = sessionStorage.getItem(`betico_active_tab_${user.tenantId || 'tenant'}`) || sessionStorage.getItem('betico_active_tab_tenant');
      if (tabParam && currentPage !== tabParam) {
        setCurrentPage(tabParam);
      } else if (!tabParam && tenantSaved && currentPage !== tenantSaved) {
        setCurrentPage(tenantSaved);
      }
    }

    const fetchTenantStoreConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/store', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setStoreMode(data.storeMode || 'retail');
            if (data.storeModules) {
              const resolvedModules = ensureAtLeastOneModuleActive({
                ...data.storeModules,
                whatsappEnabled: data.storeModules.whatsappEnabled !== false,
                storeEnabled: data.storeModules.storeEnabled !== false,
                bookingsEnabled: data.storeModules.bookingsEnabled !== false,
                courtsEnabled: data.storeModules.courtsEnabled === true,
                branchesEnabled: data.storeModules.branchesEnabled === true,
                loyaltyEnabled: data.storeModules.loyaltyEnabled === true,
                billingEnabled: data.storeModules.billingEnabled !== false
              });
              setStoreModules(resolvedModules);
              try {
                localStorage.setItem('betico_store_modules_cache', JSON.stringify(resolvedModules));
                if (user.tenantId) {
                  localStorage.setItem(`betico_store_modules_cache_${user.tenantId}`, JSON.stringify(resolvedModules));
                }
              } catch (e) {}

              const isDismissedForTenant = user.tenantId
                ? Boolean(localStorage.getItem(`betico_tour_dismissed_${user.tenantId}`))
                : Boolean(localStorage.getItem('betico_tour_dismissed'));

              if (
                data.storeModules.onboardingCompleted === false &&
                !isDismissedForTenant
              ) {
                setShowTourModal(true);
              }
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const checkUnread = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/orders/stats/unread', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadOrdersCount(data.newOrdersCount || 0);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchTenantStoreConfig();
    checkUnread();

    const token = localStorage.getItem('token');
    const socket = io(window.location.origin, { auth: { token } });
    if (user.tenantId) {
      socket.emit('join_tenant', user.tenantId);
    }
    socket.on('order:created', () => {
      playOrderNotificationSound();
      setUnreadOrdersCount(prev => prev + 1);
    });
    socket.on('appointment:created', () => {
      playBookingNotificationSound();
    });
    socket.on('appointment:updated', () => {
      playBookingNotificationSound();
    });
    socket.on('courtBooking:created', () => {
      playBookingNotificationSound();
    });
    socket.on('courtBooking:matched', () => {
      playBookingNotificationSound();
    });
    socket.on('courtBooking:updated', () => {
      playBookingNotificationSound();
    });

    const interval = setInterval(checkUnread, 15000);
    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  const isImpersonating = !!(localStorage.getItem('superadmin_token') || localStorage.getItem('original_token'));
  const impersonatedTenantName = localStorage.getItem('impersonated_tenant_name') || localStorage.getItem('impersonated_tenant') || user?.tenantName || 'este negocio';

  const handleReturnToSuperadmin = () => {
    const originalToken = localStorage.getItem('superadmin_token') || localStorage.getItem('original_token');
    if (originalToken) {
      localStorage.setItem('token', originalToken);
      localStorage.removeItem('original_token');
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('impersonated_tenant');
      localStorage.removeItem('impersonated_tenant_name');
      window.location.href = '/app';
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>Cargando Betico...</div>;

  // 1. General Login Route (/login, /superadmin, /ingreso, /acceso)
  if (pathname === '/login' || pathname === '/superadmin' || pathname === '/ingreso' || pathname === '/acceso' || pathname === '/acceso/') {
    if (isAuthenticated && user) {
      window.location.href = '/app';
      return null;
    }
    const lastSlug = localStorage.getItem('last_tenant_slug');
    if (pathname.includes('acceso') && lastSlug) {
      return <TenantLoginView slug={lastSlug} />;
    }
    return <Login onBack={() => { window.location.href = '/'; }} />;
  }

  // 2. Dedicated Admin Panel Routes (/panel, /app, /dashboard)
  const isPanelRoute = pathname.startsWith('/panel') || pathname.startsWith('/app') || pathname.startsWith('/dashboard');

  if (isPanelRoute) {
    if (!isAuthenticated || !user) {
      return <Login onBack={() => { window.location.href = '/'; }} />;
    }
    // Continue below to render the full SaaS layout
  } else {
    // 3. Root "/" or any other path: ALWAYS render Public Website (Landing Page)
    return (
      <LandingPageView
        isLoggedIn={isAuthenticated}
        onLoginClick={() => { window.location.href = '/login'; }}
        onGoToDashboard={() => { window.location.href = '/panel'; }}
      />
    );
  }

  // GROUPED NAVIGATION
  interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }

  interface NavGroup {
    key?: string;
    title: string;
    icon?: React.ReactNode;
    badge?: number;
    items: NavItem[];
  }

  const superAdminNavGroups: NavGroup[] = [
    {
      title: 'GESTIÓN DE NEGOCIOS',
      items: [
        { id: 'sa_tenants', label: 'Inquilinos y Negocios', icon: <Building2 size={18} /> },
        { id: 'sa_collections', label: 'Cobranza y Semáforo', icon: <CreditCard size={18} /> },
        { id: 'sa_financials', label: 'Finanzas y Suscripciones', icon: <DollarSign size={18} /> }
      ]
    },
    {
      title: 'FACTURACIÓN HACIENDA',
      items: [
        { id: 'sa_facturacion_comprobantes', label: 'Comprobantes y Emisión', icon: <FileText size={18} /> },
        { id: 'sa_facturacion_credenciales', label: 'Credenciales y Llave .p12', icon: <ShieldCheck size={18} /> },
        { id: 'sa_facturacion_sucursales', label: 'Datos Fiscales y Sucursales', icon: <Building2 size={18} /> }
      ]
    },
    {
      title: 'BETICO IA Y MODELOS',
      items: [
        { id: 'sa_ai_engine', label: 'Motor Betico IA y Modelos', icon: <Bot size={18} /> },
        { id: 'sa_ai_usage', label: 'Consumo y Cuotas', icon: <TrendingUp size={18} /> }
      ]
    },
    {
      title: 'WHATSAPP Y COMUNICACIÓN',
      items: [
        { id: 'sa_bots', label: 'Bots de WhatsApp', icon: <MessageSquare size={18} /> }
      ]
    },
    {
      title: 'INFRAESTRUCTURA Y SEGURIDAD',
      items: [
        { id: 'sa_system', label: 'Servidor y Despliegues', icon: <Server size={18} /> },
        { id: 'sa_notifications', label: 'Alertas SuperAdmin', icon: <Bell size={18} /> },
        { id: 'sa_audit', label: 'Auditoría y Accesos', icon: <ShieldCheck size={18} /> }
      ]
    }
  ];

  const isEnterpriseOrFranquicia = ['enterprise', 'business', 'franquicia', 'empresa'].includes((user as any)?.tenantPlan || '');
  const branchesEnabled = storeModules.branchesEnabled === true || isEnterpriseOrFranquicia;

  // Minimalist SVG general access dock
  const generalAccessItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'sitio', label: 'Sitio Web', icon: <Globe size={18} /> },
    { id: 'usuarios', label: 'Equipo y Usuarios', icon: <Users size={18} /> },
    ...(branchesEnabled ? [{ id: 'sucursales', label: 'Sedes y Sucursales', icon: <Building2 size={18} /> }] : []),
    { id: 'configuracion', label: 'Ajustes Generales', icon: <Settings size={18} /> }
  ];

  // The 6 core modules with accordion sub-tabs
  const tenantNavGroups: NavGroup[] = [
    // 1. Asistente de WhatsApp
    ...(storeModules.whatsappEnabled !== false ? [{
      key: 'whatsapp',
      title: 'Asistente de WhatsApp',
      icon: <MessageSquare size={18} />,
      items: [
        { id: 'whatsapp', label: 'WhatsApp y Bot', icon: <Phone size={16} /> },
        { id: 'chats', label: 'Chats en Vivo', icon: <MessageSquare size={16} /> },
        { id: 'agente', label: 'Personalidad Agente IA', icon: <Bot size={16} /> },
        { id: 'secretario', label: 'Secretario WhatsApp', icon: <Shield size={16} /> },
        { id: 'asesor', label: 'Asesor de Negocio', icon: <Sparkles size={16} /> },
        { id: 'campaigns', label: 'Difusión y Campañas', icon: <Send size={16} /> },
        { id: 'queue', label: 'Cola de Mensajes', icon: <Clock size={16} /> }
      ]
    }] : []),

    // 2. Tienda
    ...(storeModules.storeEnabled !== false ? [{
      key: 'tienda',
      title: 'Tienda',
      icon: <ShoppingBag size={18} />,
      badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined,
      items: [
        { id: 'tienda', label: 'Ajuste de Tienda', icon: <ShoppingBag size={16} /> },
        { id: 'productos', label: storeMode === 'restaurant' ? 'Menú y Platillos' : 'Productos y Catálogo', icon: <Package size={16} /> },
        {
          id: 'ordenes',
          label: storeMode === 'restaurant' ? 'Comandas y Cocina' : 'Pedidos y Despacho',
          icon: <ClipboardList size={16} />,
          badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined
        }
      ]
    }] : []),

    // 3. Reservas
    ...(storeModules.bookingsEnabled !== false ? [{
      key: 'reservas',
      title: 'Reservas',
      icon: <Calendar size={18} />,
      items: [
        { id: 'reservas', label: 'Reservas', icon: <Calendar size={16} /> },
        { id: 'servicios', label: 'Servicios Profesionales', icon: <Wrench size={16} /> }
      ]
    }] : []),

    // 4. Canchas
    ...(storeModules.courtsEnabled ? [{
      key: 'canchas',
      title: 'Canchas',
      icon: <Trophy size={18} />,
      items: [
        { id: 'canchas', label: 'Gestión de Canchas', icon: <Trophy size={16} /> },
        { id: 'canchas_reservas', label: 'Reserva de Canchas', icon: <CalendarCheck size={16} /> }
      ]
    }] : []),

    // 5. Tarjetas de fidelización
    ...(storeModules.loyaltyEnabled ? [{
      key: 'fidelizacion',
      title: 'Tarjetas de fidelización',
      icon: <Gift size={18} />,
      items: [
        { id: 'fidelidad_ajustes', label: 'Ajustes de Tarjeta', icon: <Gift size={16} /> },
        { id: 'fidelidad_billeteras', label: 'Billeteras Móviles', icon: <CreditCard size={16} /> },
        { id: 'fidelidad_clientes', label: 'Clientes Registrados', icon: <Users size={16} /> },
        { id: 'fidelidad_promociones', label: 'Promociones Activas', icon: <Award size={16} /> },
        { id: 'fidelidad_cupones', label: 'Cupones y Canjes', icon: <Tag size={16} /> }
      ]
    }] : []),

    // 6. Cobros y Facturación
    ...(storeModules.billingEnabled !== false ? [{
      key: 'facturacion',
      title: 'Cobros y Facturación',
      icon: <FileText size={18} />,
      items: [
        { id: 'facturacion_comprobantes', label: 'Comprobantes y Emisión', icon: <FileText size={16} /> },
        { id: 'facturacion_credenciales', label: 'Credenciales y Llave .p12', icon: <ShieldCheck size={16} /> },
        { id: 'facturacion_sucursales', label: 'Datos Fiscales y Sucursales', icon: <Building2 size={16} /> },
        { id: 'suscripcion', label: 'Mi Suscripción y Pagos', icon: <CreditCard size={16} /> }
      ]
    }] : [])
  ];

  const navGroups = user?.role === 'superadmin' ? superAdminNavGroups : tenantNavGroups;

  const handleNavClick = (pageId: string) => {
    navigateToTab(pageId);
  };

  const toggleAccordionGroup = (group: NavGroup) => {
    const key = group.key || group.title;
    if (isSidebarCollapsed && group.items.length > 0) {
      handleNavClick(group.items[0].id);
      return;
    }
    setExpandedModules(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isModuleEnabledByKey = (key: string) => {
    if (key === 'whatsapp') return storeModules.whatsappEnabled !== false;
    if (key === 'tienda') return storeModules.storeEnabled !== false;
    if (key === 'reservas') return storeModules.bookingsEnabled !== false;
    if (key === 'canchas') return Boolean(storeModules.courtsEnabled);
    if (key === 'fidelizacion') return Boolean(storeModules.loyaltyEnabled);
    if (key === 'facturacion') return storeModules.billingEnabled !== false;
    return false;
  };

  const isNavItemActive = (itemId: string) => {
    if (currentPage === itemId) return true;
    if (currentPage === 'facturacion' && itemId === 'facturacion_comprobantes') return true;
    if (currentPage === 'fidelidad' && itemId === 'fidelidad_ajustes') return true;
    if (currentPage === 'sa_facturacion' && itemId === 'sa_facturacion_comprobantes') return true;
    return false;
  };

  const renderContent = () => {
    if (user?.role === 'superadmin') {
      if (currentPage === 'sa_facturacion' || currentPage === 'sa_facturacion_comprobantes') {
        return <ElectronicBillingView initialTab="comprobantes" isSuperAdminMode={true} hideTabBar={true} />;
      }
      if (currentPage === 'sa_facturacion_credenciales') {
        return <ElectronicBillingView initialTab="credenciales" isSuperAdminMode={true} hideTabBar={true} />;
      }
      if (currentPage === 'sa_facturacion_sucursales') {
        return <ElectronicBillingView initialTab="sucursales" isSuperAdminMode={true} hideTabBar={true} />;
      }

      const tabMap: Record<string, 'tenants' | 'collections' | 'financials' | 'ai_engine' | 'ai_usage' | 'bots' | 'system' | 'notifications' | 'audit'> = {
        sa_tenants: 'tenants',
        sa_collections: 'collections',
        collections: 'collections',
        sa_financials: 'financials',
        sa_ai_engine: 'ai_engine',
        sa_ai_usage: 'ai_usage',
        sa_bots: 'bots',
        sa_system: 'system',
        sa_notifications: 'notifications',
        sa_audit: 'audit',
        tenants: 'tenants',
        dashboard: 'tenants'
      };
      const activeTab = tabMap[currentPage] || 'tenants';
      return (
        <SuperAdminPanel
          activeTabProp={activeTab}
          onTabChangeProp={(tab) => navigateToTab(tab.startsWith('sa_') ? tab : `sa_${tab}`)}
          hideTabBar={true}
        />
      );
    } else {
      switch (currentPage) {
        case 'dashboard': return <Dashboard />;
        case 'chats': return <ChatsInbox />;
        case 'queue': return <MessageQueuePanel />;
        case 'campaigns': return <CampaignsManager />;
        case 'reservas': return <Bookings />;
        case 'canchas': return <CourtsManager />;
        case 'canchas_reservas': return <CourtsBookingsManager />;
        case 'servicios': return <ServicesManager />;
        case 'productos': return <ProductManager />;
        case 'ordenes': return <OrdersPanel />;
        case 'tienda': return <StoreSettings />;
        case 'sitio': return <WebsiteBuilder />;
        case 'sucursales': return <BranchesManager />;
        case 'fidelidad':
        case 'fidelidad_ajustes':
          return <LoyaltyManager initialTab="ajustes" hideTabBar={true} onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)} />;
        case 'fidelidad_billeteras':
          return <LoyaltyManager initialTab="billeteras" hideTabBar={true} onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)} />;
        case 'fidelidad_clientes':
          return <LoyaltyManager initialTab="clientes" hideTabBar={true} onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)} />;
        case 'fidelidad_promociones':
          return <LoyaltyManager initialTab="promociones" hideTabBar={true} onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)} />;
        case 'fidelidad_cupones':
          return <LoyaltyManager initialTab="cupones" hideTabBar={true} onTabChange={(tab) => navigateToTab(`fidelidad_${tab}`)} />;
        case 'agente': return <AgentPromptStudio />;
        case 'secretario': return <SecretaryManager />;
        case 'asesor': return <BusinessAdvisorView />;
        case 'whatsapp': return <EvolutionManager />;
        case 'notificaciones': return <NotificationsCenter />;
        case 'usuarios': return <UsersManagement />;
        case 'facturacion':
        case 'facturacion_comprobantes':
          return <ElectronicBillingView initialTab="comprobantes" hideTabBar={true} />;
        case 'facturacion_credenciales':
          return <ElectronicBillingView initialTab="credenciales" hideTabBar={true} />;
        case 'facturacion_sucursales':
          return <ElectronicBillingView initialTab="sucursales" hideTabBar={true} />;
        case 'suscripcion': return <TenantSubscriptionView />;
        case 'configuracion': return <TenantSettings />;
        default: return <Dashboard />;
      }
    }
  };

  const sidebarWidth = isSidebarCollapsed ? '72px' : '260px';

  // Clean Skeleton Backdrop while new user answers the Welcome Onboarding Modal
  if (showTourModal && user?.role !== 'superadmin') {
    return (
      <div
        data-testid="onboarding-skeleton-backdrop"
        style={{
          display: 'flex',
          height: '100dvh',
          maxHeight: '100dvh',
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          backgroundColor: 'var(--background)',
          fontFamily: "'Poppins', 'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <div
          className="desktop-only-sidebar"
          style={{
            width: '250px',
            height: '100dvh',
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            flexShrink: 0
          }}
        >
          <div style={{ height: '32px', width: '115px', borderRadius: '8px', backgroundColor: '#e2e8f0' }} />
          <div style={{ height: '34px', width: '100%', borderRadius: '8px', backgroundColor: '#f1f5f9', marginTop: '6px' }} />
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{ height: '38px', width: '100%', borderRadius: '10px', backgroundColor: '#f1f5f9' }} />
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
          <div
            style={{
              height: '62px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px'
            }}
          >
            <div style={{ height: '20px', width: '150px', borderRadius: '6px', backgroundColor: '#e2e8f0' }} />
            <div style={{ height: '30px', width: '30px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} />
          </div>
          <div
            style={{
              flex: 1,
              padding: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              alignContent: 'start'
            }}
          >
            {[1, 2, 3].map(n => (
              <div
                key={n}
                style={{
                  height: '130px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ height: '14px', width: '50%', borderRadius: '6px', backgroundColor: '#f1f5f9' }} />
                <div style={{ height: '28px', width: '35%', borderRadius: '8px', backgroundColor: '#e2e8f0' }} />
              </div>
            ))}
          </div>
        </div>

        <GuidedTourModal
          isOpen={showTourModal}
          onClose={handleCloseTourModal}
          onNavigateToTab={(tabId) => handleNavClick(tabId)}
          currentModules={storeModules}
          currentStoreMode={storeMode}
          onApplyConfiguration={saveModuleConfiguration}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', maxHeight: '100dvh', backgroundColor: 'var(--background)', fontFamily: "'Poppins', 'Plus Jakarta Sans', system-ui, sans-serif", width: '100%', maxWidth: '100vw', overflow: 'hidden' }}>

      {/* Global CSS for Mobile vs Desktop */}
      <style>{`
        .desktop-only-sidebar {
          display: flex !important;
        }
        .mobile-bottom-nav {
          display: none !important;
        }
        @media (max-width: 900px) {
          .desktop-only-sidebar {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          .app-top-header {
            padding: 0 12px !important;
            height: 56px !important;
          }
          .app-header-title-text {
            font-size: 1.0rem !important;
            max-width: 140px !important;
          }
          .app-user-info-text {
            display: none !important;
          }
          .app-logout-btn-text {
            display: none !important;
          }
        }
      `}</style>

      {/* 1. DEDICATED MOBILE SLIDE-OVER DRAWER (When mobileMenuOpen is TRUE) */}
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex' }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', transition: 'opacity 0.2s ease' }}
          />

          {/* Drawer Content */}
          <div
            style={{
              position: 'relative',
              width: '290px',
              maxWidth: '85vw',
              height: '100dvh',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 30px rgba(0,0,0,0.4)',
              zIndex: 1000000,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/logo.png" 
                  alt="Betico" 
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)', lineHeight: '1.2' }}>Betico</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: '600' }}>WhatsApp AI SaaS</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  border: 'none',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* Minimalist SVG Dock in Mobile Drawer for Tenants */}
            {user?.role !== 'superadmin' && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {generalAccessItems.map(gItem => {
                    const isActive = currentPage === gItem.id;
                    return (
                      <button
                        key={gItem.id}
                        type="button"
                        onClick={() => handleNavClick(gItem.id)}
                        title={gItem.label}
                        aria-label={gItem.label}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                          color: isActive ? 'var(--primary)' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {gItem.icon}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowModuleSwitcher(prev => !prev)}
                    title="Activar o desactivar módulos"
                    aria-label="Activar o desactivar módulos"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: showModuleSwitcher ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: showModuleSwitcher ? 'var(--primary-light)' : '#ffffff',
                      color: showModuleSwitcher ? 'var(--primary)' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Sliders size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowTourModal(true);
                    }}
                    title="Personalizar panel"
                    aria-label="Personalizar panel"
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Inline Module Switcher in Mobile Drawer */}
            {user?.role !== 'superadmin' && showModuleSwitcher && (
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {SIX_MODULES_CATALOG.map(mod => {
                  const enabled = isModuleEnabledByKey(mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => toggleSingleModule(mod.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: enabled ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                        backgroundColor: enabled ? 'var(--primary-light)' : '#ffffff',
                        color: '#0f172a',
                        fontSize: '0.8rem',
                        fontWeight: enabled ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{mod.label}</span>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          backgroundColor: enabled ? 'var(--primary)' : '#e2e8f0',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {enabled && <Check size={12} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Drawer Navigation Links (Accordion for Tenants) */}
            <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' }}>
              {navGroups.map((group, gIdx) => {
                const groupKey = group.key || group.title;
                const isGroupActive = group.items.some(i => isNavItemActive(i.id));
                const isExpanded = user?.role === 'superadmin' ? true : Boolean(expandedModules[groupKey]);
                return (
                  <div key={gIdx} style={{ marginBottom: '8px' }}>
                    {user?.role === 'superadmin' ? (
                      <div style={{ padding: '4px 18px 6px 18px', fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {group.title}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAccordionGroup(group)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: 'calc(100% - 20px)',
                          margin: '2px 10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: isGroupActive ? 'var(--primary-light)' : 'transparent',
                          color: isGroupActive ? 'var(--primary)' : 'var(--text)',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {group.icon && (
                            <span style={{ color: isGroupActive ? 'var(--primary)' : '#64748b', display: 'flex' }}>
                              {group.icon}
                            </span>
                          )}
                          <span>{group.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {group.badge && (
                            <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '1px 7px', borderRadius: '12px' }}>
                              {group.badge}
                            </span>
                          )}
                          <ChevronRight
                            size={16}
                            style={{
                              color: '#64748b',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease'
                            }}
                          />
                        </div>
                      </button>
                    )}

                    {isExpanded && (
                      <div style={user?.role === 'superadmin' ? {} : { paddingLeft: '14px', marginLeft: '20px', borderLeft: '2px solid #e2e8f0', marginTop: '2px' }}>
                        {group.items.map(item => {
                          const isActive = isNavItemActive(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNavClick(item.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: 'calc(100% - 14px)',
                                margin: '2px 6px',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--text)',
                                fontWeight: isActive ? '700' : '500',
                                cursor: 'pointer',
                                fontSize: '0.84rem',
                                textAlign: 'left'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: isActive ? 'var(--primary)' : '#64748b', display: 'flex', alignItems: 'center' }}>
                                  {item.icon}
                                </span>
                                <span>{item.label}</span>
                              </div>

                              {item.badge && (
                                <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: '800', padding: '1px 7px', borderRadius: '12px' }}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Drawer Footer with Logout */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <button
                type="button"
                onClick={logout}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={16} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DESKTOP PERMANENT SIDEBAR (Fixed/Sticky, zero blank scroll space) */}
      <div
        className="desktop-only-sidebar"
        style={{
          width: sidebarWidth,
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          maxHeight: '100dvh',
          zIndex: 50,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Desktop Sidebar Header */}
        <div style={{
          padding: isSidebarCollapsed ? '12px 6px' : '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
          alignItems: 'center',
          height: '62px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          {!isSidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img 
                src="/logo.png" 
                alt="Betico" 
                style={{ height: '34px', width: 'auto', objectFit: 'contain' }} 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: '1.2' }}>Betico</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '500' }}>WhatsApp AI SaaS</div>
              </div>
            </div>
          ) : (
            <button
              onClick={toggleSidebar}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
              title="Expandir barra lateral"
            >
              <img 
                src="/logo.png" 
                alt="Betico" 
                style={{ height: '28px', width: 'auto', objectFit: 'contain' }} 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </button>
          )}

          <button
            onClick={toggleSidebar}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar menú"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Minimalist SVG Dock for General Accesses + Module Switcher */}
        {user?.role !== 'superadmin' && (
          <div
            style={{
              padding: isSidebarCollapsed ? '8px 6px' : '8px 12px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: isSidebarCollapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', flexDirection: isSidebarCollapsed ? 'column' : 'row', alignItems: 'center', gap: '3px' }}>
              {generalAccessItems.map(gItem => {
                const isActive = currentPage === gItem.id;
                return (
                  <button
                    key={gItem.id}
                    type="button"
                    onClick={() => handleNavClick(gItem.id)}
                    title={gItem.label}
                    aria-label={gItem.label}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {gItem.icon}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: isSidebarCollapsed ? 'column' : 'row', alignItems: 'center', gap: '3px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isSidebarCollapsed) {
                    setIsSidebarCollapsed(false);
                    setShowModuleSwitcher(true);
                  } else {
                    setShowModuleSwitcher(prev => !prev);
                  }
                }}
                title="Activar o desactivar módulos"
                aria-label="Activar o desactivar módulos"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: showModuleSwitcher ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: showModuleSwitcher ? 'var(--primary-light)' : '#ffffff',
                  color: showModuleSwitcher ? 'var(--primary)' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Sliders size={15} />
              </button>
              <button
                type="button"
                onClick={() => setShowTourModal(true)}
                title="Personalizar panel"
                aria-label="Personalizar panel"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Inline Module Toggles in Desktop Sidebar */}
        {user?.role !== 'superadmin' && showModuleSwitcher && !isSidebarCollapsed && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
            {SIX_MODULES_CATALOG.map(mod => {
              const enabled = isModuleEnabledByKey(mod.key);
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => toggleSingleModule(mod.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: enabled ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                    backgroundColor: enabled ? 'var(--primary-light)' : '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.78rem',
                    fontWeight: enabled ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <span>{mod.label}</span>
                  <span
                    style={{
                      width: '17px',
                      height: '17px',
                      borderRadius: '4px',
                      backgroundColor: enabled ? 'var(--primary)' : '#e2e8f0',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {enabled && <Check size={11} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grouped / Accordion Sidebar Navigation */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
          {navGroups.map((group, gIdx) => {
            const groupKey = group.key || group.title;
            const isGroupActive = group.items.some(i => isNavItemActive(i.id));
            const isExpanded = user?.role === 'superadmin' ? true : Boolean(expandedModules[groupKey]);

            if (user?.role === 'superadmin') {
              return (
                <div key={gIdx} style={{ marginBottom: isSidebarCollapsed ? '12px' : '16px' }}>
                  {!isSidebarCollapsed && (
                    <div style={{ padding: '6px 18px 4px 18px', fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {group.title}
                    </div>
                  )}

                  {group.items.map(item => {
                    const isActive = isNavItemActive(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                          width: isSidebarCollapsed ? 'calc(100% - 16px)' : 'calc(100% - 20px)',
                          margin: isSidebarCollapsed ? '3px 8px' : '2px 10px',
                          padding: isSidebarCollapsed ? '10px 0' : '9px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text)',
                          fontWeight: isActive ? '700' : '500',
                          cursor: 'pointer',
                          fontSize: '0.86rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: isSidebarCollapsed ? 0 : '10px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
                          <span style={{ color: isActive ? 'var(--primary)' : '#64748b', display: 'flex', alignItems: 'center' }}>
                            {item.icon}
                          </span>
                          {!isSidebarCollapsed && <span>{item.label}</span>}
                        </div>
                        {item.badge && !isSidebarCollapsed && (
                          <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: '800', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={groupKey} style={{ marginBottom: '6px' }}>
                <button
                  type="button"
                  onClick={() => toggleAccordionGroup(group)}
                  title={isSidebarCollapsed ? group.title : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                    width: isSidebarCollapsed ? 'calc(100% - 16px)' : 'calc(100% - 20px)',
                    margin: isSidebarCollapsed ? '3px 8px' : '2px 10px',
                    padding: isSidebarCollapsed ? '10px 0' : '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: isGroupActive ? 'var(--primary-light)' : 'transparent',
                    color: isGroupActive ? 'var(--primary)' : 'var(--text)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isSidebarCollapsed ? 0 : '10px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', minWidth: 0 }}>
                    {group.icon && (
                      <span style={{ color: isGroupActive ? 'var(--primary)' : '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {group.icon}
                      </span>
                    )}
                    {!isSidebarCollapsed && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {group.title}
                      </span>
                    )}
                  </div>

                  {!isSidebarCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {group.badge && (
                        <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>
                          {group.badge}
                        </span>
                      )}
                      <ChevronRight
                        size={15}
                        style={{
                          color: isGroupActive ? 'var(--primary)' : '#94a3b8',
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      />
                    </div>
                  )}
                </button>

                {!isSidebarCollapsed && isExpanded && (
                  <div style={{ paddingLeft: '10px', marginLeft: '20px', borderLeft: '2px solid #e2e8f0', marginTop: '2px', marginBottom: '4px' }}>
                    {group.items.map(item => {
                      const isActive = isNavItemActive(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavClick(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: 'calc(100% - 12px)',
                            margin: '2px 4px',
                            padding: '7px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text)',
                            fontWeight: isActive ? '700' : '500',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            textAlign: 'left'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={{ color: isActive ? 'var(--primary)' : '#64748b', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {item.icon}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.label}
                            </span>
                          </div>
                          {item.badge && (
                            <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100dvh', maxHeight: '100dvh', minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fde68a', fontSize: '0.82rem', fontWeight: '500', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="#d97706" />
              <span>Viendo portal de <strong>{impersonatedTenantName}</strong>.</span>
            </div>
            <button
              onClick={handleReturnToSuperadmin}
              style={{ padding: '4px 10px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              Volver
            </button>
          </div>
        )}

        {/* TOP HEADER BAR */}
        <header className="app-top-header" style={{
          height: '62px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxShadow: 'var(--shadow-xs)',
          gap: '8px',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          {/* Left Side: Prominent Menu Button + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {/* BOTÓN DE MENÚ (Visible en todas las plataformas) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 12px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                gap: '6px',
                fontWeight: '800',
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                touchAction: 'manipulation'
              }}
              title="Abrir menú de secciones"
            >
              <Menu size={18} color="white" />
              <span>Menú</span>
            </button>

            <h1 className="app-header-title-text" style={{
              fontSize: '1.15rem',
              fontWeight: '800',
              letterSpacing: '-0.02em',
              margin: 0,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {
                currentPage === 'sa_tenants' ? 'Inquilinos y Negocios' :
                currentPage === 'sa_collections' ? 'Cobranza y Cuentas' :
                currentPage === 'sa_financials' ? 'Finanzas del SaaS' :
                currentPage === 'sa_facturacion' ? 'Facturación Hacienda' :
                currentPage === 'sa_facturacion_comprobantes' ? 'Comprobantes y Emisión' :
                currentPage === 'sa_facturacion_credenciales' ? 'Credenciales y Llave .p12' :
                currentPage === 'sa_facturacion_sucursales' ? 'Datos Fiscales y Sucursales' :
                currentPage === 'sa_system' ? 'Servidor y Recursos' :
                currentPage === 'sa_apis' ? 'APIs y Tráfico' :
                currentPage === 'sa_audit' ? 'Auditoría y Seguridad' :
                currentPage === 'dashboard' ? 'Dashboard' :
                currentPage === 'whatsapp' ? 'WhatsApp y Bot' :
                currentPage === 'chats' ? 'Chats en Vivo' :
                currentPage === 'queue' ? 'Cola de Mensajes' :
                currentPage === 'campaigns' ? 'Difusión y Campañas' :
                currentPage === 'agente' ? 'Personalidad Agente IA' :
                currentPage === 'secretario' ? 'Secretario WhatsApp' :
                currentPage === 'asesor' ? 'Asesor de Negocio' :
                currentPage === 'sitio' ? 'Sitio Web' :
                currentPage === 'tienda' ? 'Ajuste de Tienda' :
                currentPage === 'productos' ? (storeMode === 'restaurant' ? 'Menú y Platillos' : 'Productos y Catálogo') :
                currentPage === 'ordenes' ? (storeMode === 'restaurant' ? 'Comandas y Cocina' : 'Pedidos y Despacho') :
                currentPage === 'canchas' ? 'Gestión de Canchas' :
                currentPage === 'canchas_reservas' ? 'Reserva de Canchas' :
                currentPage === 'reservas' ? 'Reservas' :
                currentPage === 'servicios' ? 'Servicios Profesionales' :
                currentPage === 'fidelidad' ? 'Tarjetas de fidelización' :
                currentPage === 'fidelidad_ajustes' ? 'Ajustes de Tarjeta' :
                currentPage === 'fidelidad_billeteras' ? 'Billeteras Móviles' :
                currentPage === 'fidelidad_clientes' ? 'Clientes Registrados' :
                currentPage === 'fidelidad_promociones' ? 'Promociones Activas' :
                currentPage === 'fidelidad_cupones' ? 'Cupones y Canjes' :
                currentPage === 'configuracion' ? 'Ajustes Generales' :
                currentPage === 'suscripcion' ? 'Mi Suscripción y Pagos' :
                currentPage === 'facturacion' ? 'Facturación Electrónica' :
                currentPage === 'facturacion_comprobantes' ? 'Comprobantes y Emisión' :
                currentPage === 'facturacion_credenciales' ? 'Credenciales y Llave .p12' :
                currentPage === 'facturacion_sucursales' ? 'Datos Fiscales y Sucursales' :
                currentPage === 'usuarios' ? 'Equipo y Usuarios' :
                currentPage === 'sucursales' ? 'Sedes y Sucursales' :
                currentPage === 'notificaciones' ? 'Notificaciones' :
                currentPage
              }
            </h1>
          </div>

          {/* Right Side: Tutorial (?) + User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Tutorial Question Mark Icon Button */}
            <button
              type="button"
              onClick={() => setShowTourModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '50%',
                cursor: 'pointer',
                color: '#047857',
                flexShrink: 0
              }}
              title="Personalizar panel"
              aria-label="Personalizar panel"
            >
              <HelpCircle size={20} color="#059669" />
            </button>

            {/* User Avatar e Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '8px', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.8rem',
                flexShrink: 0
              }}>
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="app-user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text)', lineHeight: '1.1', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || user?.email || 'Admin'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: '600',
                flexShrink: 0
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span className="app-logout-btn-text">Salir</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main style={{ flex: 1, padding: '20px 16px 80px 16px', overflowY: 'auto', overflowX: 'hidden', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
          <TabErrorBoundary key={currentPage}>
            {renderContent()}
          </TabErrorBoundary>
        </main>

        {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
        <div
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            zIndex: 9000,
            justifyContent: 'space-around',
            alignItems: 'center',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <button
            type="button"
            onClick={() => handleNavClick(user?.role === 'superadmin' ? 'sa_tenants' : 'dashboard')}
            style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: (currentPage === 'dashboard' || currentPage === 'sa_tenants') ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Home size={20} />
            <span style={{ fontSize: '0.68rem', fontWeight: (currentPage === 'dashboard' || currentPage === 'sa_tenants') ? '800' : '600' }}>Inicio</span>
          </button>

          {user?.role !== 'superadmin' && (
            <button
              type="button"
              onClick={() => handleNavClick('chats')}
              style={{
                flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                color: currentPage === 'chats' ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              <MessageSquare size={20} />
              <span style={{ fontSize: '0.68rem', fontWeight: currentPage === 'chats' ? '800' : '600' }}>Chats</span>
            </button>
          )}

          {user?.role !== 'superadmin' && storeModules.storeEnabled !== false && (
            <button
              type="button"
              onClick={() => handleNavClick('ordenes')}
              style={{
                flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                color: currentPage === 'ordenes' ? 'var(--primary)' : 'var(--text-muted)',
                position: 'relative'
              }}
            >
              <ClipboardList size={20} />
              {unreadOrdersCount > 0 && (
                <span style={{ position: 'absolute', top: '-2px', right: '25%', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadOrdersCount}
                </span>
              )}
              <span style={{ fontSize: '0.68rem', fontWeight: currentPage === 'ordenes' ? '800' : '600' }}>
                {storeMode === 'restaurant' ? 'Comandas' : 'Pedidos'}
              </span>
            </button>
          )}

          {user?.role !== 'superadmin' && storeModules.courtsEnabled && storeModules.storeEnabled === false && (
            <button
              type="button"
              onClick={() => handleNavClick('canchas_reservas')}
              style={{
                flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                color: currentPage === 'canchas_reservas' ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              <CalendarCheck size={20} />
              <span style={{ fontSize: '0.68rem', fontWeight: currentPage === 'canchas_reservas' ? '800' : '600' }}>Canchas</span>
            </button>
          )}

          {user?.role !== 'superadmin' && storeModules.bookingsEnabled !== false && (
            <button
              type="button"
              onClick={() => handleNavClick('reservas')}
              style={{
                flex: 1, border: 'none', background: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                color: currentPage === 'reservas' ? 'var(--primary)' : 'var(--text-muted)'
              }}
            >
              <Calendar size={20} />
              <span style={{ fontSize: '0.68rem', fontWeight: currentPage === 'reservas' ? '800' : '600' }}>Reservas</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            style={{
              flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: mobileMenuOpen ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Menu size={20} />
            <span style={{ fontSize: '0.68rem', fontWeight: '700' }}>Menú</span>
          </button>
        </div>

      </div>

      {/* Asesor de Negocio Flotante (Copilot para inquilinos) */}
      {user?.role !== 'superadmin' && <BusinessAdvisorCopilot />}

      {/* Guided Tour Modal */}
      {showTourModal && (
        <GuidedTourModal
          isOpen={showTourModal}
          onClose={handleCloseTourModal}
          onNavigateToTab={(tabId) => handleNavClick(tabId)}
          currentModules={storeModules}
          currentStoreMode={storeMode}
          onApplyConfiguration={saveModuleConfiguration}
        />
      )}

    </div>
  );
}
