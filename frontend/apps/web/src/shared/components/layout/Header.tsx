import { Link, NavLink } from 'react-router-dom';
import { Zap, Search, Bell, Heart, ShoppingBag, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { useEffect } from 'react';

export const Header = () => {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const isDark = theme === 'dark';
  return (
    <header className="hdr">
      <div className="container">
        <div className="hdr-in">
          <Link className="logo" to="/" aria-label="ThunderFood, về trang chủ">
            <span className="logo-mark">
              <Zap size={22} />
            </span>
            <span>
              Thunder<em>Food</em>
            </span>
          </Link>
          <nav className="nav" aria-label="Điều hướng chính">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'on' : '')} end>Trang chủ</NavLink>
            <NavLink to="/menu" className={({ isActive }) => (isActive && !window.location.search.includes('sort=best') ? 'on' : '')}>Thực đơn</NavLink>
            <NavLink to="/menu?sort=best" className={() => (window.location.search.includes('sort=best') ? 'on' : '')}>Bán chạy</NavLink>
            <NavLink to="/support" className={({ isActive }) => (isActive ? 'on' : '')}>Hỗ trợ</NavLink>
          </nav>
          <form className="hsearch desk" role="search">
            <div className="input-ic">
              <Search size={18} className="ic" />
              <input
                className="input"
                name="q"
                placeholder="Tìm món ăn…"
                aria-label="Tìm món ăn"
                autoComplete="off"
              />
            </div>
          </form>
          <div className="hact" style={{ marginLeft: 'auto' }}>
            <button className="ibtn" onClick={toggleTheme} aria-label="Đổi giao diện sáng tối">
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <Link className="ibtn hide-sm" to="/account/notifications" aria-label="Thông báo">
              <Bell size={22} />
              <i className="dot" data-notif-dot style={{ display: 'none' }}></i>
            </Link>
            <Link className="ibtn hide-sm" to="/account/wishlist" aria-label="Món yêu thích">
              <Heart size={22} />
            </Link>
            <Link className="ibtn cart-btn" to="/cart" aria-label="Giỏ hàng">
              <ShoppingBag size={22} />
              <span className="badge" data-cart-badge>0</span>
            </Link>
            <span className="hide-sm" data-acct>
              <Link className="btn btn-dark btn-sm" to="/login" style={{ marginLeft: '6px' }}>Đăng nhập</Link>
            </span>
          </div>
        </div>
        <div className="msearch">
          <form role="search">
            <div className="input-ic">
              <Search size={18} className="ic" />
              <input
                className="input"
                name="q"
                placeholder="Tìm gà rán, burger, trà đào…"
                aria-label="Tìm món ăn"
                autoComplete="off"
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};
