import { useCallback } from 'react';

export function useApi() {
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'API Error');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text();
  }, []);

  const get = useCallback((url: string) => fetchWithAuth(url, { method: 'GET' }), [fetchWithAuth]);
  
  const post = useCallback((url: string, body: any) => 
    fetchWithAuth(url, { method: 'POST', body: JSON.stringify(body) }), [fetchWithAuth]);
    
  const put = useCallback((url: string, body: any) => 
    fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(body) }), [fetchWithAuth]);
    
  const del = useCallback((url: string) => fetchWithAuth(url, { method: 'DELETE' }), [fetchWithAuth]);

  return { get, post, put, del, fetchWithAuth };
}
