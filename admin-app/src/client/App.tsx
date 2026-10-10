import React, { useState } from 'react';
import {
  Activity,
  Building2,
  Server,
  DollarSign,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Shield,
  Loader2
} from 'lucide-react';
import { useAdminAuth } from './useAdminAuth';
import LoginView from './components/LoginView';
import MonitoringCenter from './components/MonitoringCenter';
import TenantsManager from './components/TenantsManager';
import SystemHealth from './components/SystemHealth';
import BillingManager from './components/BillingManager';
import AuditLogsView from './components/AuditLogsView';

type Tab = 'monitoring' | 'tenants' | 'system' | 'billing' | 'audit';

export default function App() {
  const { isAuthenticated, user, loading, login, logout } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('monitoring');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#071213',
        color: '#FAF8F5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: '#34D399', margin: '0 auto 12px auto' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Iniciando entorno administrativo seguro...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLogin={login} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071213', color: '#FAF8F5' }}>
      {/* Top Navigation Bar */}
      <header style={{
        backgroundColor: '#0a1a1c',
        borderBottom: '1px solid #163638',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px'
        }}>
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#0B3C3D',
              border: '1px solid #34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399'
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FAF8F5', letterSpacing: '-0.02em' }}>
                Betico Ops
              </div>
              <div style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: 600 }}>
                Centro Aislado de SuperAdmin
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setCurrentTab('monitoring')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'monitoring' ? '#0f2426' : 'transparent',
                color: currentTab === 'monitoring' ? '#34D399' : '#94a3b8',
                fontWeight: currentTab === 'monitoring' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Activity size={16} />
              Monitoreo 360°
            </button>

            <button
              onClick={() => setCurrentTab('tenants')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'tenants' ? '#0f2426' : 'transparent',
                color: currentTab === 'tenants' ? '#34D399' : '#94a3b8',
                fontWeight: currentTab === 'tenants' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Building2 size={16} />
              Negocios
            </button>

            <button
              onClick={() => setCurrentTab('system')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'system' ? '#0f2426' : 'transparent',
                color: currentTab === 'system' ? '#34D399' : '#94a3b8',
                fontWeight: currentTab === 'system' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Server size={16} />
              Salud VPS
            </button>

            <button
              onClick={() => setCurrentTab('billing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'billing' ? '#0f2426' : 'transparent',
                color: currentTab === 'billing' ? '#34D399' : '#94a3b8',
                fontWeight: currentTab === 'billing' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <DollarSign size={16} />
              Facturación
            </button>

            <button
              onClick={() => setCurrentTab('audit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: currentTab === 'audit' ? '#0f2426' : 'transparent',
                color: currentTab === 'audit' ? '#34D399' : '#94a3b8',
                fontWeight: currentTab === 'audit' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ShieldCheck size={16} />
              Auditoría
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://betico.tech"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#0f2426',
                border: '1px solid #1a3e40',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '0.8rem',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              <ExternalLink size={13} />
              betico.tech
            </a>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: '#0f2426',
              borderRadius: '8px',
              border: '1px solid #1a3e40'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#34D399'
              }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FAF8F5' }}>
                {user?.name || user?.email || 'SuperAdmin'}
              </span>
            </div>

            <button
              onClick={logout}
              title="Cerrar Sesión Segura"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                backgroundColor: 'rgba(181, 28, 18, 0.15)',
                border: '1px solid rgba(181, 28, 18, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Body View */}
      <main>
        {currentTab === 'monitoring' && <MonitoringCenter />}
        {currentTab === 'tenants' && <TenantsManager />}
        {currentTab === 'system' && <SystemHealth />}
        {currentTab === 'billing' && <BillingManager />}
        {currentTab === 'audit' && <AuditLogsView />}
      </main>
    </div>
  );
}
