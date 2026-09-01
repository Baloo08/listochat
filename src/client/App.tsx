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
import EvolutionManager from './components/EvolutionManager';
import NotificationsCenter from './components/NotificationsCenter';
import UsersManagement from './components/UsersManagement';
import TenantSettings from './components/TenantSettings';
import SuperAdminPanel from './components/SuperAdminPanel';
import StorefrontView from '../storefront/StorefrontView';
import PublicBookingView from '../storefront/PublicBookingView';
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
  Sparkles,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';

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

  if (pathname.startsWith('/reservas/')) {
    const slug = pathname.replace('/reservas/', '').split('/')[0];
    return <PublicBookingView slug={slug} />;
  }

  if (pathname.startsWith('/acceso/')) {
    const slug = pathname.replace('/acceso/', '').split('/')[0];
    return <TenantLoginView slug={slug} />;
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
  const [storeModules, setStoreModules] = useState<{ storeEnabled: boolean; bookingsEnabled: boolean }>({
    storeEnabled: true,
    bookingsEnabled: true
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
                bookingsEnabled: data.storeModules.bookingsEnabled !== false
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
      window.location.href = '/panel';
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>Cargando Betico...</div>;

  // 1. General Login Route (/login, /superadmin, /ingreso)
  if (pathname === '/login' || pathname === '/superadmin' || pathname === '/ingreso') {
    if (isAuthenticated && user) {
      window.location.href = '/panel';
      return null;
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
    setCurrentPage(pageId);
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
        case 'campaigns': return <CampaignsManager />;
        case 'reservas': return <Bookings />;
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
    <div style={{ display: 'flex', minHeight: '100dvh', backgroundColor: 'var(--background)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Responsive Mobile Styles for iOS / Android */}
      <style>{`
        .app-mobile-menu-btn {
          display: none !important;
        }
        .app-mobile-bottom-nav {
          display: none !important;
        }
        @media (max-width: 900px) {
          .app-mobile-menu-btn {
            display: inline-flex !important;
          }
          .app-mobile-bottom-nav {
            display: flex !important;
          }
          .app-top-header {
            padding: 0 12px !important;
            height: 56px !important;
          }
          .app-header-title {
            font-size: 1.05rem !important;
          }
          .app-main-sidebar {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            height: 100dvh !important;
            z-index: 99999 !important;
            width: 290px !important;
            max-width: 85vw !important;
            background-color: var(--surface) !important;
            box-shadow: 4px 0 25px rgba(0,0,0,0.3) !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>

      
      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {/* Sidebar (Collapsible for Desktop, Slide-over Drawer for Mobile) */}
      <div
        className="app-main-sidebar"
        style={{
          width: isMobile ? '280px' : sidebarWidth,
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: 0,
          height: '100vh',
          zIndex: 9999,
          transform: isMobile ? (mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'width 0.2s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: isMobile && mobileMenuOpen ? '4px 0 25px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        {/* Sidebar Header */}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Expandir barra lateral"
            >
              <Bot size={26} color="var(--primary)" />
            </button>
          )}

          {!isMobile ? (
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
          ) : (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#0f172a', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={22} />
            </button>
          )}
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
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
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
                      <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: '800', padding: '2px 7px', borderRadius: 'var(--radius-full)', boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)' }}>
                        {item.badge}
                      </span>
                    )}
                    {item.badge && isSidebarCollapsed && (
                      <span style={{ position: 'absolute', top: '6px', right: '10px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Collapse Toggle Button at Bottom */}
        {window.innerWidth >= 768 && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'flex-end' }}>
            <button
              onClick={toggleSidebar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-muted)'
              }}
              title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar a solo íconos"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              {!isSidebarCollapsed && <span>Colapsar Menú</span>}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', overflow: 'hidden' }}>
        
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fde68a', fontSize: '0.85rem', fontWeight: '500' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#d97706" />
              <span>Estás viendo el portal como administrador de <strong>{impersonatedTenantName}</strong>.</span>
            </div>
            <button
              onClick={handleReturnToSuperadmin}
              style={{ padding: '5px 14px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Volver a SuperAdmin
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="app-top-header" style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Botón de Menú Hamburguesa para Móvil / iPhone */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="app-mobile-menu-btn"
              style={{
                border: '1.5px solid var(--primary)',
                background: '#eff6ff',
                cursor: 'pointer',
                padding: '7px 10px',
                borderRadius: '8px',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 5px rgba(37,99,235,0.15)',
                touchAction: 'manipulation'
              }}
              aria-label="Abrir menú de navegación"
            >
              <Menu size={20} color="var(--primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--primary)' }}>Menú</span>
            </button>
            <h1 className="app-header-title" style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
              {
                currentPage === 'sa_tenants' ? 'Inquilinos & Negocios' :
                currentPage === 'sa_collections' ? 'Cobranza & Cuentas por Cobrar' :
                currentPage === 'sa_financials' ? 'Finanzas del SaaS' :
                currentPage === 'sa_system' ? 'Servidor & Recursos' :
                currentPage === 'sa_apis' ? 'APIs & Tráfico' :
                currentPage === 'sa_audit' ? 'Auditoría & Seguridad' :
                currentPage === 'ordenes' ? (storeMode === 'restaurant' ? 'Comandas & Pedidos' : 'Órdenes de Compra') :
                currentPage === 'dashboard' ? 'Dashboard' :
                currentPage === 'chats' ? 'Bandeja de WhatsApp' :
                currentPage === 'campaigns' ? 'Marketing, Difusión & CRM' :
                currentPage === 'whatsapp' ? 'Conexión WhatsApp' :
                currentPage === 'productos' ? (storeMode === 'restaurant' ? 'Menú / Platillos' : 'Catálogo de Productos') :
                currentPage === 'tienda' ? 'Personalización de Tienda' :
                currentPage === 'reservas' ? 'Agenda de Citas' :
                currentPage === 'servicios' ? 'Catálogo de Servicios' :
                currentPage === 'agente' ? 'Estudio Agente IA' :
                currentPage === 'notificaciones' ? 'Historial de Notificaciones' :
                currentPage === 'usuarios' ? 'Gestión de Equipo' :
                currentPage === 'configuracion' ? 'Configuración General' :
                currentPage
              }
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowTourModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: '#047857',
                fontSize: '0.82rem',
                fontWeight: '700'
              }}
              title="Abrir Tutorial Guiado"
            >
              <Sparkles size={15} color="#059669" />
              <span>Tutorial</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-xs)'
              }}>
                {(user?.name || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="app-user-name-text" style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', lineHeight: '1.2' }}>{user?.name || user?.email || 'Administrador'}</span>
                <span className="app-user-role-text" style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' }}>{user?.role === 'superadmin' ? 'SuperAdmin' : 'Administrador'}</span>
              </div>
            </div>

            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="app-main-content" style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          {renderContent()}
          <GuidedTourModal
            isOpen={showTourModal}
            onClose={() => setShowTourModal(false)}
            onNavigateToTab={(tabId) => {
              if (tabId === 'website_builder') {
                setCurrentPage('tienda');
              } else {
                setCurrentPage(tabId);
              }
            }}
          />
        </main>
        
        {/* iOS / Mobile Bottom Navigation Bar */}
        <div
          className="app-mobile-bottom-nav"
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
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
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
            <span style={{ fontSize: '0.68rem', fontWeight: '700' }}>Más</span>
          </button>
        </div>

      </div>
    </div>
  );
}
