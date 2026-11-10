import { Menu, Search, Moon, Sun, Bell, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/shared/stores/themeStore';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store/authStore';
import { notificationApi } from '@/shared/api/notificationApi';

export const AdminHeader = () => {
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const unreadQuery = useQuery({
    queryKey: ['admin-notification-unread-count', user?.id],
    queryFn: notificationApi.getUnreadCount,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unreadCount = unreadQuery.data ?? 0;

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const isDark = theme === 'dark';

  return (
    <header className="atop">
      <button className="ibtn only-mob-lg" aria-label="Mở menu">
        <Menu size={24} />
      </button>
      <h1 id="atitle">Tổng quan</h1>
      <form className="hsearch" style={{ marginLeft: 'auto' }} role="search" onSubmit={(e) => e.preventDefault()}>
        <div className="input-ic">
          <Search size={18} />
          <input className="input" name="q" placeholder="Tìm đơn, món, khách…" aria-label="Tìm kiếm quản trị" />
        </div>
      </form>
      <button
        className="ibtn"
        onClick={toggleTheme}
        aria-label="Đổi giao diện sáng tối"
        title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </button>
      <Link className="ibtn" to="/admin/notifications" aria-label={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'} title="Thông báo">
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="badge" style={{ position: 'absolute', top: 1, right: 1, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 10, background: 'var(--c-red)', color: '#fff', fontSize: 10, lineHeight: '18px', textAlign: 'center' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
      <a className="btn btn-ghost btn-sm hide-sm" href="http://localhost:5173" target="_blank" rel="noreferrer">
        <Store size={18} />
        Xem cửa hàng
      </a>
    </header>
  );
};

