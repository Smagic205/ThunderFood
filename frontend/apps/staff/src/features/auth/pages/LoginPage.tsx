import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Zap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);
    try {
      // Backend expects: { email, password }
      const res = await authApi.login({ email, password });
      
      // res is ApiResponse<AuthResponse>, so data is in res.data
      const authData = res.data;
      
      if (authData.user.role !== 'STAFF') {
        setError('Tài khoản này không có quyền truy cập của nhân viên');
        setLoading(false);
        return;
      }
      
      setAuth(authData.user, authData.token, authData.refreshToken);
      navigate('/orders'); // Redirect to orders dashboard for staff
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    // Quick demo login (mocking state)
    const mockUser = {
      id: 999,
      email: 'demo.staff@thunderfood.vn',
      fullName: 'Nhân viên Demo',
      role: 'STAFF',
    };
    setAuth(mockUser, 'mock_token', null);
    navigate('/orders');
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <svg className="hero-bolt" viewBox="0 0 210 300" aria-hidden="true">
          <path className="f" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z"/>
          <path className="o" pathLength="1000" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z"/>
        </svg>
        <Link to="/" className="logo">
          <span className="logo-mark"><Zap size={22} fill="currentColor" strokeWidth={0} /></span>
          <span>ThunderFood</span>
        </Link>
        
        {/* Illustration placeholder for Staff */}
        <svg className="big" viewBox="0 0 120 120" aria-hidden="true" style={{ filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.4))' }}>
          <ellipse cx="60" cy="106" rx="56" ry="7" fill="#000" opacity=".16"/>
          <path d="M60 20L100 40L60 60L20 40Z" fill="#E8B568"/>
          <path d="M20 40V80L60 100V60Z" fill="#D39F51"/>
          <path d="M100 40V80L60 100V60Z" fill="#C5903F"/>
          <path d="M60 20L100 40L60 60L20 40Z" fill="none" stroke="#FDE4B4" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M60 60V100" stroke="#FDE4B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 40L60 60L100 40" fill="none" stroke="#FDE4B4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M40 30L80 50" stroke="#C5903F" strokeWidth="3" strokeLinecap="round"/>
          <path d="M30 65L50 75" stroke="#FDE4B4" strokeWidth="3" strokeLinecap="round"/>
          <rect x="75" y="65" width="10" height="20" fill="#E8892A" transform="skewY(26)"/>
        </svg>

        <div>
          <h2>Giao đúng gói, đúng giờ.</h2>
          <p>Đăng nhập để xác nhận đơn, xếp gói và theo dõi các chuyến giao của bạn.</p>
        </div>
      </aside>
      
      <div className="auth-main">
        <div className="auth-box">
          
          <h1>Đăng nhập nhân viên</h1>
          <p className="muted" style={{ marginBottom: '28px' }}>
            Dành cho nhân viên ThunderFood xử lý đơn và giao hàng.
          </p>

          {error && (
            <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--c-red) 12%, transparent)', color: 'var(--c-red)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid" noValidate>
            <label className="field">
              <span>Email</span>
              <div className="input-ic">
                <div className="ic-prefix"><Mail size={18} /></div>
                <input 
                  className="input" 
                  type="email" 
                  name="email" 
                  placeholder="ten@thunderfood.vn" 
                  autoComplete="email" 
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            
            <label className="field">
              <span>Mật khẩu</span>
              <div className="input-ic">
                <div className="ic-prefix"><Lock size={18} /></div>
                <input 
                  className="input" 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Nhập mật khẩu" 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="peek btn-ic" 
                  aria-label="Hiện/ẩn mật khẩu"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: '8px' }}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          
          <p className="muted center" style={{ marginTop: '22px' }}>
            Chưa có tài khoản? <Link to="/register" className="tlink"><b>Đăng ký</b></Link>
          </p>
        </div>
      </div>
    </div>
  );
};
