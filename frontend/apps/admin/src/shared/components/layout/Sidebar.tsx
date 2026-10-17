import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  Receipt,
  Package,
  Utensils,
  LayoutGrid,
  Users,
  Shield,
  Star,
  Percent,
  Image as ImageIcon,
  Sliders,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';

export const Sidebar = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'TS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.fullName || 'Trương Thanh Sơn';

  return (
    <aside className="side" id="side" aria-label="Menu quản trị">
      <Link className="logo" to="/admin">
        <span className="logo-mark">
          <Zap size={22} />
        </span>
        <span>ThunderFood</span>
      </Link>

      <div className="grp">Vận hành</div>
      <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'on' : '')}>
        <LayoutDashboard size={20} />
        <span>Tổng quan</span>
      </NavLink>
      <NavLink to="/admin/orders" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Receipt size={20} />
        <span>Theo dõi đơn hàng</span>
        <span className="cnt">3</span>
      </NavLink>
      <NavLink to="/admin/packages" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Package size={20} />
        <span>Gói hàng</span>
      </NavLink>
      <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Utensils size={20} />
        <span>Sản phẩm</span>
      </NavLink>
      <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'on' : '')}>
        <LayoutGrid size={20} />
        <span>Danh mục</span>
      </NavLink>

      <div className="grp">Con người</div>
      <NavLink to="/admin/customers" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Users size={20} />
        <span>Khách hàng</span>
      </NavLink>
      <NavLink to="/admin/staffs" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Shield size={20} />
        <span>Nhân viên</span>
      </NavLink>
      <NavLink to="/admin/reviews" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Star size={20} />
        <span>Đánh giá</span>
        <span className="cnt">5</span>
      </NavLink>
      <NavLink to="/admin/vouchers" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Percent size={20} />
        <span>Khuyến mãi</span>
      </NavLink>

      <div className="grp">Hệ thống</div>
      <NavLink to="/admin/banners" className={({ isActive }) => (isActive ? 'on' : '')}>
        <ImageIcon size={20} />
        <span>Banner</span>
      </NavLink>
      <NavLink to="/admin/settings" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Sliders size={20} />
        <span>Cấu hình</span>
      </NavLink>

      <div className="side-user" style={{ marginTop: 'auto' }}>
        <span className="avatar">
          {getInitials(displayName)}
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <b
            style={{
              color: '#fff',
              display: 'block',
              lineHeight: 1.25,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </b>
          <small style={{ color: '#8F98CC', fontSize: '12px' }}>
            Quản trị viên
          </small>
        </div>
        <button
          className="ibtn"
          style={{ color: '#B9C1EC', flexShrink: 0, width: '36px', height: '36px' }}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
