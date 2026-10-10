export function useAdminApi() {
  const getHeaders = () => {
    const token = localStorage.getItem('betico_admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const request = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {})
      }
    });

    if (res.status === 401 || res.status === 403) {
      if (res.status === 401) {
        localStorage.removeItem('betico_admin_token');
        window.location.reload();
      }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
    }
    return data;
  };

  return {
    get: (url: string) => request(url, { method: 'GET' }),
    post: (url: string, body?: any) => request(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: (url: string, body?: any) => request(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    del: (url: string) => request(url, { method: 'DELETE' })
  };
}
