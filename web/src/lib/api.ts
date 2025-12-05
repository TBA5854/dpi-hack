const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  async get(path: string) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (res.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    }
    return res;
  },

  async post(path: string, body: any) {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return null;
    }
    return res;
  }
};
