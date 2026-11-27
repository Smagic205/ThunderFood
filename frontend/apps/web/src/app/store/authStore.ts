import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Clean up any legacy raw accessToken key if present from older builds
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('accessToken');
  } catch {
    // ignore storage errors
  }
}

export interface User {
  id: number;
  email: string;
  name: string;
  fullName?: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER';
  avatarUrl?: string | null;
  authProvider?: 'LOCAL' | 'GOOGLE' | string;
  providerId?: string | null;
  status?: 'ACTIVE' | 'LOCKED' | string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  rememberSession: boolean;
  isHydrating: boolean;
  login: (user: User, accessToken: string, rememberSession?: boolean) => void;
  setHydrating: (isHydrating: boolean) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      rememberSession: true,
      isHydrating: false,
      login: (user, accessToken, rememberSession) => {
        const normalizedUser = {
          ...user,
          fullName: user.fullName || user.name,
          phone: user.phone || '',
          authProvider: user.authProvider || 'LOCAL',
          status: user.status || 'ACTIVE',
        };
        set((state) => ({
          user: normalizedUser,
          accessToken,
          isAuthenticated: true,
          rememberSession: rememberSession ?? state.rememberSession,
          isHydrating: false,
        }));
      },
      setHydrating: (isHydrating) => set({ isHydrating }),
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...updatedUser,
                name: updatedUser.name || updatedUser.fullName || state.user.name,
                fullName: updatedUser.fullName || updatedUser.name || state.user.fullName,
              }
            : null,
        })),
      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          rememberSession: true,
          isHydrating: false,
        });
      },
    }),
    {
      name: 'thunderfood-auth',
      version: 1,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        rememberSession: state.rememberSession,
      }),
      migrate: (persistedState: unknown) => {
        const raw = (persistedState || {}) as { isAuthenticated?: boolean; rememberSession?: boolean };
        return {
          isAuthenticated: Boolean(raw.isAuthenticated),
          rememberSession: raw.rememberSession ?? true,
        };
      },
    }
  )
);
