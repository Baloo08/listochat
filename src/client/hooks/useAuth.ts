import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'tenant_admin' | 'admin' | 'staff' | 'viewer';
  tenantId: string | null;
  tenant_id?: string | null;
  name: string;
  tenantName?: string;
  tenantSlug?: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.get('/api/auth/me')
        .then(data => {
          if (data && (data.id || data.userId)) {
            setUser(data);
            setIsAuthenticated(true);
            if (data.tenantSlug && data.role !== 'superadmin') {
              localStorage.setItem('last_tenant_slug', data.tenantSlug);
            }
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Correo o contraseña incorrectos');
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user?.tenantSlug && data.user?.role !== 'superadmin') {
          localStorage.setItem('last_tenant_slug', data.user.tenantSlug);
        }
        setToken(data.token);
        // Force fast seamless transition to dashboard
        window.location.href = '/app';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    const lastSlug = localStorage.getItem('last_tenant_slug');
    const wasSuperAdmin = user?.role === 'superadmin';
    localStorage.removeItem('token');
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('impersonated_tenant_name');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // If tenant admin logged out, redirect them back to their branded login portal
    if (lastSlug && !wasSuperAdmin && !window.location.pathname.startsWith('/acceso/')) {
      window.location.href = `/acceso/${lastSlug}`;
    } else if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/acceso/')) {
      window.location.href = '/';
    }
  };

  return { login, logout, user, isAuthenticated, loading };
}
