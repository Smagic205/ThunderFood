import { Link, NavLink } from 'react-router-dom';
import { Zap, Receipt, Box, Truck, MessageSquare, LogOut } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api/auth';

export const StaffSidebar = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Always clear the local session even when the backend is unavailable.
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <aside className="side" id="side" aria-label="Menu nhân viên">
      <Link className="logo" to="/">
        <span className="logo-mark">
          <Zap size={22} />
        </span>
        <span>ThunderFood</span>
      </Link>
      
      <div className="grp">Điều phối</div>
      <NavLink to="/orders" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Receipt size={20} />
        <span>Tiếp nhận đơn</span>
      </NavLink>
      <NavLink to="/packages" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Box size={20} />
        <span>Gói hàng chờ giao</span>
      </NavLink>

      <div className="grp">Giao hàng</div>
      <NavLink to="/my-package" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Truck size={20} />
        <span>Gói đơn của tôi</span>
      </NavLink>

      <div className="grp">Khách hàng</div>
      <NavLink to="/reviews" className={({ isActive }) => (isActive ? 'on' : '')}>
        <MessageSquare size={20} />
        <span>Phản hồi đánh giá</span>
      </NavLink>

      <div className="side-user" style={{ marginTop: 'auto' }}>
        <span className="avatar">{user?.fullName?.substring(0, 2).toUpperCase() || 'NV'}</span>
        <div className="grow">
          <b style={{ color: '#fff' }}>{user?.fullName || 'Nhân viên'}</b>
          <small>Điều phối / Shipper</small>
        </div>
        <button onClick={handleLogout} className="ibtn" style={{ color: '#B9C1EC' }} aria-label="Đăng xuất" title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};
