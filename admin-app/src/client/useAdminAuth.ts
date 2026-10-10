import { useState, useEffect } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAdminAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('betico_admin_token'));
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    localStorage.setItem('betico_admin_token', token);

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error('Sesión inválida');
        const data = await res.json();
        setUser(data);
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem('betico_admin_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Credenciales incorrectas');
    }

    localStorage.setItem('betico_admin_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('betico_admin_token');
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, isAuthenticated: Boolean(token && user), login, logout };
}
