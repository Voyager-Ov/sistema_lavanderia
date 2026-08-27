import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  negocioId?: number;
  googleLinked?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (partialUser: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (partialUser) => set((state) => ({ 
        user: state.user ? { ...state.user, ...partialUser } : null 
      })),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          if (typeof window === 'undefined') return null;
          try {
            const val = localStorage.getItem(name);
            if (!val || val.trim() === '' || val === 'undefined' || val === 'null') return null;
            return val;
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, value);
          } catch {}
        },
        removeItem: (name: string) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.removeItem(name);
          } catch {}
        }
      }))
    }
  )
);
