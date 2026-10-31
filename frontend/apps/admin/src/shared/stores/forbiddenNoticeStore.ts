import { create } from 'zustand';

interface ForbiddenNotice {
  id: string;
  message: string;
}

interface ForbiddenNoticeState {
  notice: ForbiddenNotice | null;
  showForbidden: (message: string) => void;
  dismiss: () => void;
}

export const useForbiddenNoticeStore = create<ForbiddenNoticeState>((set, get) => ({
  notice: null,
  showForbidden: (message) => {
    const id = `${Date.now()}-${Math.random()}`;
    set({ notice: { id, message } });
    window.setTimeout(() => {
      if (get().notice?.id === id) set({ notice: null });
    }, 4000);
  },
  dismiss: () => set({ notice: null }),
}));
