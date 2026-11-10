import { useQuery } from '@tanstack/react-query';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { notificationApi } from '@/shared/api/notificationApi';

export const StaffHeader = () => {
  const { user } = useAuthStore();
  const unreadQuery = useQuery({
    queryKey: ['staff-notification-unread-count', user?.id],
    queryFn: notificationApi.getUnreadCount,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = unreadQuery.data ?? 0;

  return (
    <header className="adm-header">
      <div className="row between" style={{ width: '100%' }}>
        <div className="row">
        <button className="ibtn hide-sm" data-act="side-open" aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Workspace Nhân Viên</h2>
        </div>
        <Link to="/notifications" className="ibtn" aria-label={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span
              className="badge"
              style={{ position: 'absolute', top: 1, right: 1, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 10, background: 'var(--c-red)', color: '#fff', fontSize: 10, lineHeight: '18px', textAlign: 'center' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};
