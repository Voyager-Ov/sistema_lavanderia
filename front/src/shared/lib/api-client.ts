export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Obtener token de auth-storage o fallback superadmin_token
    let token = '';
    if (typeof window !== 'undefined') {
      const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
      if (isSuperAdminPath) {
        token = localStorage.getItem('superadmin_token') || '';
      }
      if (!token) {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            if (parsed.state && parsed.state.token) {
              token = parsed.state.token;
            }
          } catch (e) {
            // ignore error
          }
        }
      }
      if (!token) {
        token = localStorage.getItem('superadmin_token') || '';
      }
    }

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Solo añadir application/json si no es un FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const { responseType, ...fetchOptions } = options as any;

    try {
      const response = await fetch(url, { ...fetchOptions, headers });
      
      let data;
      if (responseType === 'text') {
        data = await response.text();
      } else if (responseType === 'blob') {
        data = await response.blob();
      } else {
        data = await response.json().catch(() => null);
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/superadmin/login')) {
          if (typeof window !== 'undefined') {
            try {
              const isSuperAdminPath = window.location.pathname.startsWith('/superadmin');
              if (isSuperAdminPath) {
                localStorage.removeItem('superadmin_token');
                window.location.href = '/superadmin/login?expired=true';
              } else {
                localStorage.removeItem('auth-storage');
                window.location.href = '/login?expired=true';
              }
            } catch (e) {}
          }
        }
        
        const errorMessage = (typeof data?.message === 'string' && data.message)
          || (typeof data?.detalle === 'string' && data.detalle)
          || (typeof data?.error === 'string' && data.error)
          || response.statusText
          || 'Error en la petición';

        throw new ApiError(
          response.status,
          errorMessage,
          data
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error instanceof Error ? error.message : 'Error de red');
    }
  },

  get<T>(endpoint: string, options?: Omit<RequestInit, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  postForm<T>(endpoint: string, body: FormData, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body,
    });
  },

  put<T>(endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  putForm<T>(endpoint: string, body: FormData, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body,
    });
  },

  delete<T>(endpoint: string, options?: Omit<RequestInit, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  patch<T>(endpoint: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
