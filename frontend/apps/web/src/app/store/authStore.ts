import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) => {
        // Đồng bộ fullName và name
        const normalizedUser = {
          ...user,
          fullName: user.fullName || user.name,
          phone: user.phone || '',
          authProvider: user.authProvider || 'LOCAL',
          status: user.status || 'ACTIVE',
        };
        set({ user: normalizedUser, accessToken, refreshToken, isAuthenticated: true });
      },
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
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'thunderfood-auth',
    }
  )
);
