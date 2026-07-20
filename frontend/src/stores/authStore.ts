import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/models';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const res = await api.post('/public/login', { username, password });
        const { token } = res.data;
        
        // Set token first so the next API call uses it
        set({ token, isAuthenticated: true });
        
        try {
          const userRes = await api.get('/user/me');
          set({ user: userRes.data });
        } catch (error) {
          // If fetching user fails, logout to clear the invalid state
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        // Register the user
        await api.post('/public/create-user', { userName: username, email, password });
        
        // After successful registration, log them in
        const res = await api.post('/public/login', { username, password });
        const { token } = res.data;
        
        set({ token, isAuthenticated: true });
        
        try {
          const userRes = await api.get('/user/me');
          set({ user: userRes.data });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'second-brain-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
