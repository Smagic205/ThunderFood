import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Search, Bell, Heart, ShoppingBag, Moon, Sun, User, Receipt, Layout, LogOut, X, Loader2, ChevronRight } from 'lucide-react';
import { useThemeStore } from '@/shared/stores/themeStore';
import { useAuthStore } from '@/app/store/authStore';
import { useCartStore } from '@/shared/stores/cartStore';
import { authApi } from '@/shared/api/authApi';
import { notificationApi } from '@/shared/api/notificationApi';
import { productApi } from '@/shared/api/productApi';
import type { ProductListItem } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef, type FormEvent, type KeyboardEvent } from 'react';

interface FoodSearchProps {
  id: string;
  className: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onSelectProduct: (product: ProductListItem) => void;
}

const formatSearchPrice = (price: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(price);

const FoodSearch = ({
  id,
  className,
  placeholder,
  value,
  onValueChange,
  onSubmit,
  onSelectProduct,
}: FoodSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyword = value.trim();

  useEffect(() => {
    if (!isOpen || isComposing || keyword.length < 2) {
      setDebouncedKeyword('');
      return;
    }

    const timeout = window.setTimeout(() => setDebouncedKeyword(keyword), 250);
    return () => window.clearTimeout(timeout);
  }, [isComposing, isOpen, keyword]);

  const suggestionsQuery = useQuery({
    queryKey: ['header-product-suggestions', debouncedKeyword],
    queryFn: () => productApi.getProducts({
      keyword: debouncedKeyword,
      page: 1,
      size: 5,
      sort: 'bestSelling',
    }),
    enabled: isOpen && !isComposing && debouncedKeyword.length >= 2,
    staleTime: 15_000,
  });
  const suggestions = suggestionsQuery.data?.content ?? [];
  const isWaitingForDebounce = keyword.length >= 2 && keyword !== debouncedKeyword;
  const listboxId = `${id}-suggestions`;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const submitKeyword = (valueToSubmit: string) => {
    const submittedKeyword = valueToSubmit.trim();
    if (!submittedKeyword) return;
    setIsOpen(false);
    setActiveIndex(-1);
    onSubmit(submittedKeyword);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitKeyword(keyword);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || isComposing) return;

    if (event.key === 'ArrowDown' && suggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(current => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex(current => current <= 0 ? suggestions.length - 1 : current - 1);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'Enter' && isOpen && suggestions[activeIndex]) {
      event.preventDefault();
      setIsOpen(false);
      onSelectProduct(suggestions[activeIndex]);
    }
  };

  const selectProduct = (product: ProductListItem) => {
    setIsOpen(false);
    setActiveIndex(-1);
    onSelectProduct(product);
  };

  return (
    <form ref={formRef} className={`food-search ${className}`} role="search" onSubmit={submit}>
      <div className="input-ic food-search-input-wrap">
        <button className="ic food-search-submit" type="submit" aria-label="Tìm món ăn">
          <Search size={18} />
        </button>
        <input
          ref={inputRef}
          id={id}
          className="input"
          name="q"
          type="text"
          value={value}
          placeholder={placeholder}
          aria-label="Tìm món ăn"
          aria-autocomplete="list"
          aria-controls={isOpen && !isWaitingForDebounce && suggestions.length > 0 ? listboxId : undefined}
          aria-expanded={isOpen && keyword.length >= 2}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          onFocus={() => setIsOpen(true)}
          onChange={event => {
            onValueChange(event.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={event => {
            setIsComposing(false);
            onValueChange(event.currentTarget.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            className="food-search-clear"
            type="button"
            aria-label="Xóa từ khóa tìm kiếm"
            onClick={() => {
              onValueChange('');
              setActiveIndex(-1);
              setIsOpen(true);
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && keyword.length > 0 && (
        <div className="food-search-suggestions" role="region" aria-label="Gợi ý món ăn">
          {keyword.length < 2 ? (
            <div className="food-search-message">Nhập thêm để tìm món ăn</div>
          ) : isWaitingForDebounce || suggestionsQuery.isFetching ? (
            <div className="food-search-message"><Loader2 size={16} className="food-search-spinner" /> Đang tìm món…</div>
          ) : suggestionsQuery.isError ? (
            <div className="food-search-message">Không tải được gợi ý. Nhấn Enter để xem kết quả.</div>
          ) : suggestions.length > 0 ? (
            <div id={listboxId} className="food-search-list" role="listbox" aria-label="Món ăn phù hợp">
              {suggestions.map((product, index) => (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={product.id}
                  className="food-search-option"
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectProduct(product)}
                >
                  {product.thumbnailUrl ? (
                    <img className="food-search-thumb" src={product.thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="food-search-thumb food-search-thumb-fallback" aria-hidden="true">🍽️</span>
                  )}
                  <span className="food-search-option-info">
                    <span className="food-search-option-name">{product.name}</span>
                    <span className="food-search-option-meta">
                      {product.categoryName && <span>{product.categoryName}</span>}
                      <span>{formatSearchPrice(product.price)}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="food-search-message">Chưa tìm thấy món phù hợp.</div>
          )}
          <button className="food-search-all" type="button" onClick={() => submitKeyword(keyword)}>
            Xem tất cả kết quả <ChevronRight size={16} />
          </button>
        </div>
      )}
    </form>
  );
};

export const Header = () => {
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalQuantity, fetchCartCount, resetCart } = useCartStore();
  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const menuRef = useRef<HTMLSpanElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const unreadNotificationsQuery = useQuery({
    queryKey: ['notification-unread-count', user?.id],
    queryFn: notificationApi.getUnreadCount,
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    setSearchTerm(new URLSearchParams(location.search).get('q') || '');
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount();
    } else {
      resetCart();
    }
  }, [isAuthenticated, fetchCartCount, resetCart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Always clear the local session even when the backend is unavailable.
    } finally {
      logout();
      setShowMenu(false);
      navigate('/login');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(-2).map(x => x[0]).join('').toUpperCase();
  };

  const submitFoodSearch = (keyword: string) => {
    const params = new URLSearchParams();
    params.set('q', keyword.trim());
    navigate({ pathname: '/menu', search: `?${params.toString()}` });
  };

  const openProduct = (product: ProductListItem) => {
    navigate(`/product/${product.slug}`);
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
          <FoodSearch
            id="header-food-search-desktop"
            className="hsearch desk"
            placeholder="Tìm món ăn…"
            value={searchTerm}
            onValueChange={setSearchTerm}
            onSubmit={submitFoodSearch}
            onSelectProduct={openProduct}
          />
          <div className="hact" style={{ marginLeft: 'auto' }}>
            <button className="ibtn" onClick={toggleTheme} aria-label="Đổi giao diện sáng tối">
              {isDark ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <Link className="ibtn" to="/account/notifications" aria-label="Thông báo">
              <Bell size={22} />
              {(unreadNotificationsQuery.data ?? 0) > 0 && (
                <span className="badge" aria-label={`${unreadNotificationsQuery.data} thông báo chưa đọc`}>
                  {(unreadNotificationsQuery.data ?? 0) > 99 ? '99+' : unreadNotificationsQuery.data}
                </span>
              )}
            </Link>
            <Link className="ibtn" to="/account/wishlist" aria-label="Món yêu thích">
              <Heart size={22} />
            </Link>
            <Link className="ibtn cart-btn" to="/cart" aria-label="Giỏ hàng">
              <ShoppingBag size={22} />
              {totalQuantity > 0 && (
                <span className="badge" data-cart-badge>
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
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
                    <span className="avatar overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </span>
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
          <FoodSearch
            id="header-food-search-mobile"
            className="food-search-mobile"
            placeholder="Tìm gà rán, burger, trà đào…"
            value={searchTerm}
            onValueChange={setSearchTerm}
            onSubmit={submitFoodSearch}
            onSelectProduct={openProduct}
          />
        </div>
      </div>
    </header>
  );
};
