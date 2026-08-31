import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
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
  LogOut,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Server,
  Activity,
  DollarSign,
  Send,
  Volume2,
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
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
    return <DriverPortal />;
  }

  if (pathname.startsWith('/especialista') || pathname.startsWith('/colaborador')) {
    return <SpecialistPortal />;
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
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

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

    if (user.role === 'superadmin') {
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
      window.location.href = '/app';
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>Cargando Betico...</div>;

  // 1. General Login Route (/login, /superadmin, /ingreso)
  if (pathname === '/login' || pathname === '/superadmin' || pathname === '/ingreso') {
    if (isAuthenticated && user) {
      window.location.href = '/app';
      return null;
    }
    return <Login onBack={() => { window.location.href = '/'; }} />;
  }

  // 2. Authenticated App Route (/app, /panel, /dashboard)
  const isAppRoute = pathname.startsWith('/app') || pathname.startsWith('/panel') || pathname.startsWith('/dashboard');

  if (isAppRoute) {
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return null;
    }
    // Continue below to render the authenticated SaaS Layout
  } else {
    // 3. ROOT DOMAIN (https://betico.tech/) OR ANY OTHER PUBLIC PATH -> ALWAYS RENDER PUBLIC WEBSITE
    return (
      <LandingPageView
        isLoggedIn={isAuthenticated}
        onLoginClick={() => { window.location.href = '/login'; }}
        onGoToDashboard={() => { window.location.href = '/app'; }}
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
        { id: 'sa_financials', label: 'Finanzas & Suscripciones', icon: <DollarSign size={18} /> }
      ]
    },
    {
      title: 'IA DE MARCA BLANCA',
      items: [
        { id: 'sa_ai_engine', label: 'Motor LocalAI & Modelos', icon: <Bot size={18} /> },
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

  const navGroups = user.role === 'superadmin' ? superAdminNavGroups : tenantNavGroups;

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (user.role === 'superadmin') {
      const tabMap: Record<string, 'tenants' | 'financials' | 'ai_engine' | 'ai_usage' | 'bots' | 'system' | 'notifications' | 'audit'> = {
        sa_tenants: 'tenants',
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {/* Sidebar (Collapsible for Desktop, Slide-over for Mobile) */}
      <div style={{
        width: sidebarWidth,
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transform: window.innerWidth < 768 && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'width 0.2s ease, transform 0.25s ease',
        overflow: 'hidden'
      }}>
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

          {window.innerWidth >= 768 ? (
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
            <button onClick={() => setMobileMenuOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
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
                      backgroundColor: isActive ? '#eff6ff' : 'transparent',
                      color: isActive ? '#2563eb' : '#475569',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontWeight: isActive ? '700' : '500',
                      fontSize: '0.86rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: isSidebarCollapsed ? 0 : '10px', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
                      <span style={{ color: isActive ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
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
        <header style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {window.innerWidth < 768 && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text)', padding: '6px' }}
              >
                <Menu size={22} />
              </button>
            )}
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
              {
                currentPage === 'sa_tenants' ? 'Inquilinos & Accesos' :
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)', lineHeight: '1.2' }}>{user.name}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' }}>{user.role === 'superadmin' ? 'SuperAdmin' : 'Administrador'}</span>
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
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
