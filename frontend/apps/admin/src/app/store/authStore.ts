import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Xóa sạch token cũ nếu từng lưu trong localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('thunderfood-admin-auth');
  } catch {
    // ignore storage errors
  }
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (user: User, accessToken: string) => void;
  setHydrating: (isHydrating: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: false,
      login: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isHydrating: false }),
      setHydrating: (isHydrating) => set({ isHydrating }),
      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('thunderfood-admin-auth');
            localStorage.removeItem('thunderfood-admin-auth');
          } catch {
            // ignore storage errors
          }
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
      },
    }),
    {
      name: 'thunderfood-admin-auth',
      version: 1,
      // Chỉ giữ cờ non-sensitive trong sessionStorage của tab hiện tại; token và hồ sơ chỉ giữ trong RAM.
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
      migrate: (persistedState: unknown) => {
        const raw = (persistedState || {}) as { isAuthenticated?: boolean };
        return {
          isAuthenticated: Boolean(raw.isAuthenticated),
        };
      },
    }
  )
);
