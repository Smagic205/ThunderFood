import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: User, token: string) => void;
  setHydrating: (isHydrating: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrating: false,
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true, isHydrating: false }),
      setHydrating: (isHydrating) => set({ isHydrating }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isHydrating: false }),
    }),
    {
      name: 'staff-auth',
      version: 1,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: unknown) => {
        const raw = (persistedState || {}) as { isAuthenticated?: boolean; token?: string | null };
        return {
          isAuthenticated: Boolean(raw.isAuthenticated ?? raw.token),
        };
      },
    }
  )
);
