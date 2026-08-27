import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'tenant_admin' | 'staff';
  tenant_id: string | null;
  name: string;
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
          setUser(data);
          setIsAuthenticated(true);
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
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      setToken(data.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
  };

  return { login, logout, user, isAuthenticated, loading };
}
