import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Zap, Search, Bell, Heart, ShoppingBag, Moon, Sun, User, Receipt, Layout, LogOut } from 'lucide-react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { useAuthStore } from '@/app/store/authStore';
import { useEffect, useState, useRef } from 'react';

export const Header = () => {
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(-2).map(x => x[0]).join('').toUpperCase();
  };

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
            <Link className="ibtn" to="/account/notifications" aria-label="Thông báo">
              <Bell size={22} />
              <i className="dot" data-notif-dot style={{ display: 'none' }}></i>
            </Link>
            <Link className="ibtn" to="/account/wishlist" aria-label="Món yêu thích">
              <Heart size={22} />
            </Link>
            <Link className="ibtn cart-btn" to="/cart" aria-label="Giỏ hàng">
              <ShoppingBag size={22} />
              <span className="badge" data-cart-badge>0</span>
            </Link>
            <span className="hide-sm" data-acct ref={menuRef}>
              {isAuthenticated && user ? (
                <span className="pop-wrap">
                  <button 
                    className="ibtn" 
                    aria-haspopup="menu" 
                    aria-expanded={showMenu}
                    aria-label="Tài khoản của tôi"
                    onClick={() => setShowMenu(!showMenu)}
                  >
                    <span className="avatar">{getInitials(user.name)}</span>
                  </button>
                  {showMenu && (
                    <div className="menu-pop card" role="menu">
                      <div style={{ padding: '10px 12px 8px' }}>
                        <b>{user.name}</b>
                        <div className="faint" style={{ fontSize: 13 }}>{user.email}</div>
                      </div>
                      <hr />
                      <Link to="/account/profile" role="menuitem" onClick={() => setShowMenu(false)}><User size={18} /> Hồ sơ của tôi</Link>
                      <Link to="/account/orders" role="menuitem" onClick={() => setShowMenu(false)}><Receipt size={18} /> Đơn hàng</Link>
                      <Link to="/account/wishlist" role="menuitem" onClick={() => setShowMenu(false)}><Heart size={18} /> Yêu thích</Link>
                      {user.role === 'ADMIN' && (
                        <Link to="/admin" role="menuitem" onClick={() => setShowMenu(false)}><Layout size={18} /> Trang quản trị</Link>
                      )}
                      <hr />
                      <button role="menuitem" onClick={handleLogout}><LogOut size={18} /> Đăng xuất</button>
                    </div>
                  )}
                </span>
              ) : (
                <Link className="btn btn-dark btn-sm" to="/login" style={{ marginLeft: '6px' }}>Đăng nhập</Link>
              )}
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
