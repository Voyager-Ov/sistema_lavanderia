import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  googleLinked?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Opcional: limpiar cookies u otras cosas
      },
    }),
    {
      name: 'auth-storage', // Nombre de la clave en localStorage
    }
  )
);
