import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme | null;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: null,
  
  initTheme: () => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('tf-theme') as Theme | null;
    
    // Check OS preference
    const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (isSystemDark ? 'dark' : 'light');
    
    // Apply to DOM
    document.documentElement.dataset.theme = initialTheme;
    
    set({ theme: initialTheme });
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    
    // Apply to DOM
    document.documentElement.dataset.theme = newTheme;
    
    // Save to localStorage
    try {
      localStorage.setItem('tf-theme', newTheme);
    } catch (e) {}
    
    set({ theme: newTheme });
  }
}));
