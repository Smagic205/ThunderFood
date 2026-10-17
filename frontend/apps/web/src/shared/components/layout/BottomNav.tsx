import { NavLink } from 'react-router-dom';
import { Home, Utensils, ShoppingBag, Receipt, User } from 'lucide-react';

export function BottomNav() {
  return (
    <nav className="bnav" aria-label="Điều hướng nhanh">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'on' : '')}>
        <Home size={22} className="ic" />
        <span>Trang chủ</span>
      </NavLink>
      <NavLink to="/menu" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Utensils size={22} className="ic" />
        <span>Thực đơn</span>
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => (isActive ? 'on' : '')}>
        <ShoppingBag size={22} className="ic" />
        <span>Giỏ hàng</span>
        <span className="badge" data-cart-badge>0</span>
      </NavLink>
      <NavLink to="/account/orders" className={({ isActive }) => (isActive ? 'on' : '')}>
        <Receipt size={22} className="ic" />
        <span>Đơn hàng</span>
      </NavLink>
      <NavLink to="/account/profile" className={({ isActive }) => (isActive ? 'on' : '')}>
        <User size={22} className="ic" />
        <span>Tài khoản</span>
      </NavLink>
    </nav>
  );
}
