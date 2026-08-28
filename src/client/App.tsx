import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SuperAdminPanel from './components/SuperAdminPanel';
import TenantSettings from './components/TenantSettings';
import ProductManager from './components/ProductManager';
import OrdersPanel from './components/OrdersPanel';
import StoreSettings from './components/StoreSettings';
import ChatsInbox from './components/ChatsInbox';
import Bookings from './components/Bookings';
import ServicesManager from './components/ServicesManager';
import EvolutionManager from './components/EvolutionManager';
import AgentPromptStudio from './components/AgentPromptStudio';
import NotificationsCenter from './components/NotificationsCenter';
import UsersManagement from './components/UsersManagement';
import DriverPortal from './components/DriverPortal';
import KDSFullscreen from './components/KDSFullscreen';
import StorefrontView from '../storefront/StorefrontView';
import PublicBookingView from '../storefront/PublicBookingView';
import { 
  Home, MessageSquare, Calendar, Wrench, ShoppingBag, 
  Package, ClipboardList, Bot, Phone, Bell, Users, Settings, LogOut, ArrowLeft, ShieldAlert, Menu, X, Bike
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for public driver portal or KDS fullscreen routes before anything else
  const pathname = window.location.pathname;

  if (pathname.startsWith('/repartidor') || pathname.startsWith('/driver')) {
    return <DriverPortal />;
  }

  if (pathname.startsWith('/kds') || pathname.startsWith('/comandas-live')) {
    return <KDSFullscreen />;
  }

  if (pathname.startsWith('/tienda/')) {
    const slug = pathname.replace('/tienda/', '').split('/')[0];
    if (slug) {
      return <StorefrontView slug={slug} />;
    }
  }

  if (pathname.startsWith('/reservas/') || pathname.startsWith('/agendar/')) {
    const slug = pathname.replace('/reservas/', '').replace('/agendar/', '').split('/')[0];
    if (slug) {
      return <PublicBookingView slug={slug} />;
    }
  }

  // Periodic check for new unread orders if authenticated
  useEffect(() => {
    if (!isAuthenticated || user?.role === 'superadmin') return;

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

    checkUnread();
    const interval = setInterval(checkUnread, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const isImpersonating = !!localStorage.getItem('original_token');
  const impersonatedTenantName = localStorage.getItem('impersonated_tenant') || 'este negocio';

  const handleReturnToSuperadmin = () => {
    const originalToken = localStorage.getItem('original_token');
    if (originalToken) {
      localStorage.setItem('token', originalToken);
      localStorage.removeItem('original_token');
      localStorage.removeItem('impersonated_tenant');
      window.location.reload();
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>Cargando Betico...</div>;

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  const superAdminNav = [
    { id: 'tenants', label: 'Clientes & Inquilinos', icon: <Users size={20} /> },
  ];

  const tenantNav = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'chats', label: 'Chats', icon: <MessageSquare size={20} /> },
    { id: 'reservas', label: 'Reservas', icon: <Calendar size={20} /> },
    { id: 'servicios', label: 'Servicios', icon: <Wrench size={20} /> },
    { id: 'tienda', label: 'Tienda & Envíos', icon: <ShoppingBag size={20} /> },
    { id: 'productos', label: 'Productos', icon: <Package size={20} /> },
    { id: 'ordenes', label: 'Comandas & Pedidos', icon: <ClipboardList size={20} />, badge: unreadOrdersCount > 0 ? unreadOrdersCount : undefined },
    { id: 'agente', label: 'Agente IA', icon: <Bot size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <Phone size={20} /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <Bell size={20} /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users size={20} /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  const nav = user.role === 'superadmin' ? superAdminNav : tenantNav;

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    if (user.role === 'superadmin') {
      return <SuperAdminPanel />;
    } else {
      switch (currentPage) {
        case 'dashboard': return <Dashboard />;
        case 'chats': return <ChatsInbox />;
        case 'reservas': return <Bookings />;
        case 'servicios': return <ServicesManager />;
        case 'productos': return <ProductManager />;
        case 'ordenes': return <OrdersPanel />;
        case 'tienda': return <StoreSettings />;
        case 'agente': return <AgentPromptStudio />;
        case 'whatsapp': return <EvolutionManager />;
        case 'notificaciones': return <NotificationsCenter />;
        case 'usuarios': return <UsersManagement />;
        case 'configuracion': return <TenantSettings />;
        default: return <Dashboard />;
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      {/* Sidebar (Responsive for Desktop, Tablet & Mobile) */}
      <div style={{
        width: '250px',
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
        transition: 'transform 0.25s ease'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={24} color="var(--primary)" /> <span>Betico</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>
              WhatsApp AI & E-commerce
            </div>
          </div>

          {window.innerWidth < 768 && (
            <button onClick={() => setMobileMenuOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: currentPage === item.id ? 'var(--primary)' : 'transparent',
                color: currentPage === item.id ? 'white' : 'var(--text-muted)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: currentPage === item.id ? '600' : 'normal',
                fontSize: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 7px', borderRadius: '10px' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
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
              style={{ padding: '4px 12px', backgroundColor: '#d97706', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Volver a SuperAdmin
            </button>
          </div>
        )}

        {/* Top Header */}
        <header style={{ height: '60px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1e293b', padding: '6px', display: 'flex', alignItems: 'center' }}
            >
              <Menu size={22} />
            </button>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '600', textTransform: 'capitalize', margin: 0 }}>
              {nav.find(i => i.id === currentPage)?.label || currentPage}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                {user.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({user.role})</span>
              </span>
            </div>

            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                border: '1px solid #fee2e2',
                backgroundColor: '#fef2f2',
                color: '#ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              <LogOut size={14} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
