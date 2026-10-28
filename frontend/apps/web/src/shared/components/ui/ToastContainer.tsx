import { useToastStore } from '@/shared/stores/toastStore';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === 'error' ? 'err' : ''}`} role="alert">
          {t.type === 'error' ? (
            <AlertCircle size={18} className="ic" />
          ) : t.type === 'info' ? (
            <Info size={18} className="ic" />
          ) : (
            <CheckCircle2 size={18} className="ic" />
          )}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
