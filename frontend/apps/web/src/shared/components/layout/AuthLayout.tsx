import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';
import { ScrollToTop } from './ScrollToTop';
import logoUrl from '@/assets/logo.png';

const SIDE_CONTENT: Record<string, { h: string; p: string }> = {
  '/login': {
    h: 'Đặt món nhanh như chớp.',
    p: 'Đăng nhập để lưu địa chỉ, theo dõi đơn và nhận ưu đãi dành riêng cho bạn.',
  },
  '/register': {
    h: 'Trở thành thành viên.',
    p: 'Đăng ký tài khoản ngay hôm nay để nhận được voucher 30.000₫ cho đơn hàng đầu tiên.',
  },
  '/forgot': {
    h: 'Quên mật khẩu?',
    p: 'Đừng lo lắng, chúng tôi sẽ giúp bạn khôi phục lại tài khoản chỉ trong vài bước đơn giản.',
  }
};

export const AuthLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const side = SIDE_CONTENT[location.pathname] || SIDE_CONTENT['/login'];

  return (
    <div className="auth">
      <ScrollToTop />
      <aside className="auth-side">
        <svg className="hero-bolt" viewBox="0 0 210 300" aria-hidden="true">
          <path className="f" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z" style={{ fill: '#79FFFF', opacity: 0.9 }} />
          <path className="o" pathLength="1000" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z" />
        </svg>
        <div className="logo">
          <span className="logo-mark"><Zap size={22} fill="currentColor" /></span>
          <span>ThunderFood</span>
        </div>

        {/* User can change the src attribute below to their custom logo or illustration */}
        <img
          src={logoUrl}
          alt="ThunderFood Banner"
          className="big"
          style={{
            width: '100%',
            maxWidth: '500px',
            alignSelf: 'center',
            objectFit: 'contain',
            aspectRatio: '1/1',
            transform: 'scale(1.8)',
            filter: 'brightness(1.15) contrast(1.1) drop-shadow(0 10px 20px rgba(0,0,0,0.15))',
            zIndex: 1
          }}
        />
        <div>
          <h2>{side.h}</h2>
          <p>{side.p}</p>
        </div>
      </aside>
      <div className="auth-main">
        <div className="auth-box">
          <button className="link only-sm" onClick={() => navigate('/')} style={{ marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
            <ArrowLeft size={16} />Về trang chủ
          </button>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
