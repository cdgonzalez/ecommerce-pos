import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken?: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken = null) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set((state) => ({ ...state, accessToken, refreshToken })),
      logout: async () => {
        const { accessToken, refreshToken } = get();
        try {
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
          }
          await axios.post(
            `${baseURL}/auth/logout`,
            { refreshToken: refreshToken || undefined },
            { headers, timeout: 5000 }
          );
        } catch {
          // Si falla por red o token ya expirado, limpia el estado de todas formas
        } finally {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage', // Clave en localStorage
    }
  )
);
