import { Link, NavLink } from 'react-router-dom';
import { Zap, LayoutDashboard, Receipt, Utensils, Grid, Users, Star, Percent, Image as ImageIcon, Sliders, LogOut } from 'lucide-react';

export const Sidebar = () => {
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
        <span>Đơn hàng</span>
        <span className="cnt" style={{ display: 'none' }}>0</span>
      </NavLink>
      <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Utensils size={20} />
        <span>Sản phẩm</span>
      </NavLink>
      <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Grid size={20} />
        <span>Danh mục</span>
      </NavLink>

      <div className="grp">Khách hàng</div>
      <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Users size={20} />
        <span>Người dùng</span>
      </NavLink>
      <NavLink to="/admin/reviews" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Star size={20} />
        <span>Đánh giá</span>
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
        <span className="avatar">TS</span>
        <div className="grow">
          <b style={{ color: '#fff' }}>Trương Thanh Sơn</b>
          <small>Quản trị viên</small>
        </div>
        <button className="ibtn" style={{ color: '#B9C1EC' }} aria-label="Đăng xuất" title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};
