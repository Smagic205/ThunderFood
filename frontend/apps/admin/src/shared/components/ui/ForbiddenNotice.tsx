import { useForbiddenNoticeStore } from '@/shared/stores/forbiddenNoticeStore';

export const ForbiddenNotice = () => {
  const { notice, dismiss } = useForbiddenNoticeStore();
  if (!notice) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        maxWidth: 'min(440px, calc(100vw - 32px))',
        padding: '14px 16px',
        border: '1px solid var(--admin-danger-border)',
        borderRadius: 12,
        background: '#35171b',
        color: '#fee2e2',
        boxShadow: 'var(--admin-shadow-lg)',
      }}
    >
      <span style={{ flex: 1 }}>{notice.message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Đóng thông báo"
        style={{ border: 0, background: 'transparent', color: 'inherit', fontSize: 20, cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
};
