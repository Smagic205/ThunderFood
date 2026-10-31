import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Receipt, 
  Wallet, 
  Heart, 
  Bell, 
  LogOut, 
  ChevronRight, 
  ShieldCheck 
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { authApi } from '@/shared/api/authApi';

export const AccountLayout = () => {
  const { user, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Always clear the local session even when the backend is unavailable.
    } finally {
      logout();
      showToast('Đã đăng xuất khỏi tài khoản', 'info');
      navigate('/');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TF';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navLinks = [
    { to: '/account/profile', label: 'Hồ sơ của tôi', icon: User },
    { to: '/account/addresses', label: 'Địa chỉ', icon: MapPin },
    { to: '/account/orders', label: 'Đơn hàng', icon: Receipt },
    { to: '/account/payments', label: 'Giao dịch', icon: Wallet },
    { to: '/account/wishlist', label: 'Yêu thích', icon: Heart },
    { to: '/account/notifications', label: 'Thông báo', icon: Bell },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="container page pb-12">
      {/* Breadcrumb */}
      <div className="crumbs">
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} className="ic" />
        <Link to="/account/profile">Tài khoản</Link>
        <ChevronRight size={14} className="ic" />
        <span className="text-[var(--ink)] font-medium">Hồ sơ cá nhân</span>
      </div>

      <div className="acc">
        {/* Sidebar Điều hướng */}
        <nav className="acc-nav card" aria-label="Menu tài khoản">
          {/* User info card header */}
          <div className="acc-user">
            <span 
              className="avatar lg overflow-hidden" 
              style={{ width: 52, height: 52, fontSize: 19 }}
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                getInitials(user.name || user.fullName)
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <b className="block text-[var(--ink)] truncate">
                {user.fullName || user.name}
              </b>
              <div 
                className="faint text-[13px] truncate" 
                title={user.email}
              >
                {user.email}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-[#A56200] dark:text-[#FFC552]">
                <ShieldCheck size={13} className="shrink-0" />
                <span>Thành viên ThunderFood</span>
              </div>
            </div>
          </div>

          {/* Danh sách liên kết */}
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'on' : '')}
                end={item.to === '/account/profile'}
              >
                <Icon size={20} className="ic" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <hr className="divider my-2" />

          {/* Đăng xuất */}
          <button 
            type="button" 
            onClick={handleLogout} 
            style={{ color: 'var(--c-red)' }}
            className="flex items-center gap-3 p-3 rounded-[14px] font-medium w-full text-left transition-colors hover:bg-[var(--surface-2)]"
          >
            <LogOut size={20} className="ic" />
            <span>Đăng xuất</span>
          </button>
        </nav>

        {/* Nội dung trang con */}
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
};
