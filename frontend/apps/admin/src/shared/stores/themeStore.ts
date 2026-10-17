import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (typeof window !== 'undefined' && (document.documentElement.dataset.theme as Theme)) || 'dark',

  initTheme: () => {
    // 1. Kiểm tra localStorage ('tf-theme')
    const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('tf-theme') as Theme | null) : null;

    // 2. Nếu chưa lưu, ưu tiên dark mode làm mặc định chuẩn của Admin hoặc theo cấu hình hệ điều hành
    const initialTheme: Theme = savedTheme || 'dark';

    // 3. Áp dụng thuộc tính data-theme lên documentElement (<html>)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = initialTheme;
    }

    set({ theme: initialTheme });
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';

    // 1. Áp dụng lên documentElement (<html>)
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = newTheme;
    }

    // 2. Lưu vào localStorage ('tf-theme')
    try {
      localStorage.setItem('tf-theme', newTheme);
    } catch (e) {
      console.warn('Không thể lưu theme vào localStorage:', e);
    }

    set({ theme: newTheme });
  },
}));
