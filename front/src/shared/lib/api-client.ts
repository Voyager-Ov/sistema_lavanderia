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

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Obtener token (asumiendo que Zustand o LocalStorage lo guarda bajo 'auth-storage')
    let token = '';
    if (typeof window !== 'undefined') {
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

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Solo añadir application/json si no es un FormData
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          if (typeof window !== 'undefined') {
            try {
              // Import dinámico del store para evitar ciclos de dependencia o usar localStorage
              localStorage.removeItem('auth-storage');
              window.location.href = '/login?expired=true';
            } catch (e) {}
          }
        }
        
        throw new ApiError(
          response.status,
          data?.detalle || data?.error || data?.message || response.statusText || 'Error en la petición',
          data
        );
      }

      // La mayoría de los endpoints del backend retornan { status: 'success', data: { ... }, message: '...' }
      // Devolvemos el cuerpo completo (T) que normalmente intercepta el `data`.
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
