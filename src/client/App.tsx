import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import GuidedTourModal from './components/GuidedTourModal';
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
  Bot,
  Phone,
  Bell,
  Users,
  Settings,
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
  CalendarCheck
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

  if (pathname.startsWith('/repartidor')) {
    const slug = pathname.replace('/repartidor/', '').replace('/repartidor', '').split('/')[0];
    return <DriverPortal tenantSlug={slug || undefined} />;
  }

  if (pathname.startsWith('/especialista') || pathname.startsWith('/colaborador')) {
    const slug = pathname.replace('/especialista/', '').replace('/especialista', '').replace('/colaborador/', '').replace('/colaborador', '').split('/')[0];
    return <SpecialistPortal tenantSlug={slug || undefined} />;
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

  const { isAuthenticated, user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [showTourModal, setShowTourModal] = useState<boolean>(() => {
    return window.location.search.includes('tour=true') || (!localStorage.getItem('betico_tour_dismissed') && localStorage.getItem('betico_tour_active') === 'true');
  });
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tenant customization
  const [storeMode, setStoreMode] = useState<'retail' | 'restaurant'>('retail');
  const [storeModules, setStoreModules] = useState<{ storeEnabled: boolean; bookingsEnabled: boolean; courtsEnabled?: boolean }>({
    storeEnabled: true,
    bookingsEnabled: true,
    courtsEnabled: false
  });

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('sidebar_collapsed', String(nextState));
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user?.role === 'superadmin') {
      if (currentPage === 'dashboard') {
        setCurrentPage('sa_tenants');
      }
      return;
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
              setStoreModules({
                storeEnabled: data.storeModules.storeEnabled !== false,
                bookingsEnabled: data.storeModules.bookingsEnabled !== false,
                courtsEnabled: data.storeModules.courtsEnabled === true
              });
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

    const socket = io(window.location.origin);
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
    title: string;
    items: NavItem[];
  }

  const superAdminNavGroups: NavGroup[] = [
    {
      title: 'GESTIÓN DE NEGOCIOS',
      items: [
        { id: 'sa_tenants', label: 'Inquilinos & Negocios', icon: <Building2 size={18} /> },
        { id: 'sa_collections', label: 'Cobranza & Semáforo', icon: <CreditCard size={18} /> },
        { id: 'sa_financials', label: 'Finanzas & Suscripciones', icon: <DollarSign size={18} /> }
      ]
    },
    {
      title: 'BETICO IA & MODELOS',
      items: [
        { id: 'sa_ai_engine', label: 'Motor Betico IA & Modelos', icon: <Bot size={18} /> },
        { id: 'sa_ai_usage', label: 'Consumo & Cuotas', icon: <TrendingUp size={18} /> }
      ]
    },
    {
      title: 'WHATSAPP & COMUNICACIÓN',
      items: [
        { id: 'sa_bots', label: 'Bots de WhatsApp', icon: <MessageSquare size={18} /> }
      ]
    },
    {
      title: 'INFRAESTRUCTURA & SEGURIDAD',
      items: [
        { id: 'sa_system', label: 'Servidor & Despliegues', icon: <Server size={18} /> },
        { id: 'sa_notifications', label: 'Alertas SuperAdmin', icon: <Bell size={18} /> },
        { id: 'sa_audit', label: 'Auditoría & Accesos', icon: <ShieldCheck size={18} /> }
      ]
    }
  ];

  const tenantNavGroups: NavGroup[] = [
    {
      title: 'GENERAL & CLIENTES',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
        { id: 'chats', label: 'Chats en Vivo', icon: <MessageSquare size={18} /> },
        { id: 'queue', label: 'Mensajes por contestar', icon: <Clock size={18} /> },
        { id: 'whatsapp', label: 'Conexión WhatsApp', icon: <Phone size={18} /> }
      ]
    },
    ...(storeModules.storeEnabled !== false ? [{
      title: storeMode === 'restaurant' ? 'RESTAURANTE & COCINA' : 'TIENDA & VENTAS',
      items: [
        { 
          id: 'ordenes', 
          label: storeMode === 'restaurant' ? 'Comandas' : 'Pedidos', 
          icon: <ClipboardList size={18} />, 
          badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined 
        },
        { id: 'productos', label: storeMode === 'restaurant' ? 'Menú / Platillos' : 'Catálogo Productos', icon: <Package size={18} /> },
        { id: 'tienda', label: 'Tienda & Envíos', icon: <ShoppingBag size={18} /> },
        { id: 'sitio', label: 'Mi Sitio Web', icon: <Globe size={18} /> }
      ]
    }] : [{
      title: 'PRESENCIA ONLINE',
      items: [
        { id: 'sitio', label: 'Mi Sitio Web', icon: <Globe size={18} /> }
      ]
    }]),
    ...(storeModules.bookingsEnabled !== false ? [{
      title: 'AGENDA & CITAS',
      items: [
        { id: 'reservas', label: 'Reservas & Agenda', icon: <Calendar size={18} /> },
        { id: 'servicios', label: 'Servicios', icon: <Wrench size={18} /> }
      ]
    }] : []),
    ...(storeModules.courtsEnabled ? [{
      title: 'CANCHAS & DEPORTES',
      items: [
        { id: 'canchas', label: 'Gestión de Canchas', icon: <Trophy size={18} /> },
        { id: 'canchas_reservas', label: 'Reservas Deportivas', icon: <CalendarCheck size={18} /> }
      ]
    }] : []),
    {
      title: 'MARKETING & DIFUSIÓN',
      items: [
        { id: 'campaigns', label: 'Difusión & CRM', icon: <Send size={18} /> }
      ]
    },
    {
      title: 'SISTEMA & AJUSTES',
      items: [
        { id: 'sucursales', label: 'Sucursales', icon: <Building2 size={18} /> },
        { id: 'agente', label: 'Agente IA', icon: <Bot size={18} /> },
        { id: 'notificaciones', label: 'Historial Envíos', icon: <Bell size={18} /> },
        { id: 'usuarios', label: 'Usuarios', icon: <Users size={18} /> },
        { id: 'configuracion', label: 'Configuración', icon: <Settings size={18} /> }
      ]
    }
  ];

  const navGroups = user?.role === 'superadmin' ? superAdminNavGroups : tenantNavGroups;

  const handleNavClick = (pageId: string) => {
    let target = pageId === 'website_builder' ? 'sitio' : pageId;
    setCurrentPage(target);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (user?.role === 'superadmin') {
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
          onTabChangeProp={(tab) => setCurrentPage(`sa_${tab}`)}
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
        case 'agente': return <AgentPromptStudio />;
        case 'whatsapp': return <EvolutionManager />;
        case 'notificaciones': return <NotificationsCenter />;
        case 'usuarios': return <UsersManagement />;
        case 'configuracion': return <TenantSettings />;
        default: return <Dashboard />;
      }
    }
  };

  const sidebarWidth = isSidebarCollapsed ? '72px' : '260px';

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: 'var(--background)', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', overflowX: 'hidden' }}>

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
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--background)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={24} color="var(--primary)" />
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

            {/* Drawer Navigation Links */}
            <nav style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
              {navGroups.map((group, gIdx) => (
                <div key={gIdx} style={{ marginBottom: '16px' }}>
                  <div style={{ padding: '4px 18px 6px 18px', fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {group.title}
                  </div>

                  {group.items.map(item => {
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: 'calc(100% - 20px)',
                          margin: '3px 10px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--text)',
                          fontWeight: isActive ? '800' : '600',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: isActive ? 'var(--primary)' : '#64748b', display: 'flex', alignItems: 'center' }}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
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

      {/* 2. DESKTOP PERMANENT SIDEBAR */}
      <div
        className="desktop-only-sidebar"
        style={{
          width: sidebarWidth,
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          flexDirection: 'column',
          position: 'relative',
          height: '100vh',
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
          boxSizing: 'border-box'
        }}>
          {!isSidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={24} color="var(--primary)" />
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
              <Bot size={26} color="var(--primary)" />
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

        {/* Grouped Sidebar Navigation */}
        <nav style={{ flex: 1, padding: '14px 0', overflowY: 'auto' }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ marginBottom: isSidebarCollapsed ? '12px' : '16px' }}>
              {!isSidebarCollapsed && (
                <div style={{ padding: '6px 18px 4px 18px', fontSize: '0.68rem', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {group.title}
                </div>
              )}

              {group.items.map(item => {
                const isActive = currentPage === item.id;
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
          ))}
        </nav>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh', width: '100%', overflowX: 'hidden' }}>
        
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fde68a', fontSize: '0.82rem', fontWeight: '500' }}>
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
          boxSizing: 'border-box'
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
                currentPage === 'sa_tenants' ? 'Inquilinos & Negocios' :
                currentPage === 'sa_collections' ? 'Cobranza & Cuentas' :
                currentPage === 'sa_financials' ? 'Finanzas del SaaS' :
                currentPage === 'sa_system' ? 'Servidor & Recursos' :
                currentPage === 'sa_apis' ? 'APIs & Tráfico' :
                currentPage === 'sa_audit' ? 'Auditoría & Seguridad' :
                currentPage === 'ordenes' ? (storeMode === 'restaurant' ? 'Comandas' : 'Pedidos') :
                currentPage === 'dashboard' ? 'Dashboard' :
                currentPage === 'chats' ? 'Chats en Vivo' :
                currentPage === 'campaigns' ? 'Difusión & CRM' :
                currentPage === 'whatsapp' ? 'WhatsApp' :
                currentPage === 'productos' ? (storeMode === 'restaurant' ? 'Menú / Platillos' : 'Productos') :
                currentPage === 'tienda' ? 'Tienda & Envíos' :
                currentPage === 'sitio' ? 'Mi Sitio Web' :
                currentPage === 'reservas' ? 'Reservas & Agenda' :
                currentPage === 'canchas' ? 'Gestión de Canchas' :
                currentPage === 'canchas_reservas' ? 'Reservas de Canchas' :
                currentPage === 'servicios' ? 'Servicios' :
                currentPage === 'agente' ? 'Agente IA' :
                currentPage === 'notificaciones' ? 'Notificaciones' :
                currentPage === 'sucursales' ? 'Sucursales' :
                currentPage === 'usuarios' ? 'Usuarios' :
                currentPage === 'configuracion' ? 'Configuración' :
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
              title="Tutorial y Ayuda de Betico"
              aria-label="Tutorial"
            >
              <HelpCircle size={20} color="#059669" />
            </button>

            {/* User Avatar & Info */}
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
        <main style={{ flex: 1, padding: '20px 16px 80px 16px', overflowY: 'auto' }}>
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

          {user?.role !== 'superadmin' && (
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
              <span style={{ fontSize: '0.68rem', fontWeight: currentPage === 'ordenes' ? '800' : '600' }}>Pedidos</span>
            </button>
          )}

          {user?.role !== 'superadmin' && (
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

      {/* Guided Tour Modal */}
      {showTourModal && (
        <GuidedTourModal
          isOpen={showTourModal}
          onClose={() => setShowTourModal(false)}
          onNavigateToTab={(tabId) => handleNavClick(tabId)}
        />
      )}

    </div>
  );
}
