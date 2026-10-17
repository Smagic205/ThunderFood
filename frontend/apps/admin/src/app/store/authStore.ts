import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Xóa sạch phiên cũ trong localStorage (nếu có từ trước) để luôn bắt đăng nhập lại
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('thunderfood-admin-auth');
  } catch {}
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
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('thunderfood-admin-auth');
            localStorage.removeItem('thunderfood-admin-auth');
          } catch {}
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'thunderfood-admin-auth',
      // Dùng sessionStorage: Chỉ duy trì trong phiên mở tab hiện tại.
      // Mỗi khi đóng trình duyệt hoặc mở link chạy mới luôn phải đăng nhập lại từ đầu.
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
