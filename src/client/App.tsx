import React, { useState } from 'react';
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
import StorefrontView from '../storefront/StorefrontView';
import { 
  Home, MessageSquare, Calendar, Wrench, ShoppingBag, 
  Package, ClipboardList, Bot, Phone, Bell, Users, Settings, LogOut, ArrowLeft, ShieldAlert
} from 'lucide-react';

export default function App() {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Check for public storefront route before anything else
  const pathname = window.location.pathname;
  if (pathname.startsWith('/tienda/')) {
    const slug = pathname.replace('/tienda/', '').split('/')[0];
    if (slug) {
      return <StorefrontView slug={slug} />;
    }
  }

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando Betico...</div>;

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
    { id: 'tienda', label: 'Tienda', icon: <ShoppingBag size={20} /> },
    { id: 'productos', label: 'Productos', icon: <Package size={20} /> },
    { id: 'ordenes', label: 'Órdenes', icon: <ClipboardList size={20} /> },
    { id: 'agente', label: 'Agente IA', icon: <Bot size={20} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <Phone size={20} /> },
    { id: 'notificaciones', label: 'Notificaciones', icon: <Bell size={20} /> },
    { id: 'usuarios', label: 'Usuarios', icon: <Users size={20} /> },
    { id: 'configuracion', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  const nav = user.role === 'superadmin' ? superAdminNav : tenantNav;

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> Betico
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: '500' }}>
            WhatsApp AI & E-commerce
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '10px 20px',
                border: 'none',
                backgroundColor: currentPage === item.id ? 'var(--primary)' : 'transparent',
                color: currentPage === item.id ? 'white' : 'var(--text-muted)',
                textAlign: 'left',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: currentPage === item.id ? '600' : 'normal'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.85rem', fontWeight: '600' }}>
              <ShieldAlert size={18} />
              <span>Modo Soporte SuperAdmin: Estás navegando en el portal de <strong>{impersonatedTenantName}</strong>.</span>
            </div>
            <button 
              onClick={handleReturnToSuperadmin}
              style={{ padding: '5px 12px', backgroundColor: '#92400e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              <ArrowLeft size={14} /> Volver al Panel SuperAdmin
            </button>
          </div>
        )}

        <header style={{ height: '60px', minHeight: '60px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{nav.find(n => n.id === currentPage)?.label || 'Dashboard'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.name || user.email || 'Usuario'} ({user.role})</span>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'transparent', color: 'var(--danger)', cursor: 'pointer' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>
        
        <main style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
