import { Menu, Search, Moon, Bell, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminHeader = () => {
  return (
    <header className="atop">
      <button className="ibtn only-mob-lg" aria-label="Mở menu">
        <Menu size={24} />
      </button>
      <h1 id="atitle">Tổng quan</h1>
      <form className="hsearch" style={{ marginLeft: 'auto' }} role="search">
        <div className="input-ic">
          <Search size={18} />
          <input className="input" name="q" placeholder="Tìm đơn, món, khách…" aria-label="Tìm kiếm quản trị" />
        </div>
      </form>
      <button className="ibtn" aria-label="Đổi giao diện sáng tối">
        <Moon size={22} />
      </button>
      <Link className="ibtn" to="/admin/orders" aria-label="Đơn mới">
        <Bell size={22} />
        <i className="dot" style={{ display: 'none' }}></i>
      </Link>
      <a className="btn btn-ghost btn-sm hide-sm" href="http://localhost:5173" target="_blank" rel="noreferrer">
        <Store size={18} />
        Xem cửa hàng
      </a>
    </header>
  );
};
