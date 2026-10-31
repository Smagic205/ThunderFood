import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { Zap, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register(formData);
      const authData = res.data;
      
      if (authData.user.role !== 'STAFF') {
        setError('Tài khoản này không phải là nhân viên');
        setLoading(false);
        return;
      }
      
      setAuth(authData.user, authData.token, authData.refreshToken);
      navigate('/orders');
    } catch (err: any) {
      // Access error response based on common Spring Boot error format or custom message
      let errorMsg = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (err.response.data.errors) {
          errorMsg = Object.values(err.response.data.errors).join(', ');
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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
          <h2>Gia nhập đội ngũ ThunderFood.</h2>
          <p>Trở thành nhân viên giao hàng và nhận ngay các chuyến đơn đầu tiên của bạn.</p>
        </div>
      </aside>
      
      <div className="auth-main">
        <div className="auth-box">
          
          <h1>Đăng ký tài khoản</h1>
          <p className="muted" style={{ marginBottom: '28px' }}>
            Dành cho nhân viên ThunderFood.
          </p>

          {error && (
            <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--c-red) 12%, transparent)', color: 'var(--c-red)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-grid" noValidate>
            <label className="field">
              <span>Họ tên</span>
              <div className="input-ic">
                <div className="ic-prefix"><User size={18} /></div>
                <input 
                  className="input" 
                  type="text" 
                  name="fullName" 
                  placeholder="Nhập họ và tên" 
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="field">
              <span>Số điện thoại</span>
              <div className="input-ic">
                <div className="ic-prefix"><Phone size={18} /></div>
                <input 
                  className="input" 
                  type="tel" 
                  name="phone" 
                  placeholder="09xx xxx xxx" 
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </label>

            <label className="field">
              <span>Email</span>
              <div className="input-ic">
                <div className="ic-prefix"><Mail size={18} /></div>
                <input 
                  className="input" 
                  type="email" 
                  name="email" 
                  placeholder="ten@email.com"
                  autoComplete="email" 
                  inputMode="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  placeholder="8-12 ký tự, HOA, đặc biệt" 
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
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
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>
          
          <p className="muted center" style={{ marginTop: '22px' }}>
            Đã có tài khoản? <Link to="/login" className="tlink"><b>Đăng nhập</b></Link>
          </p>
        </div>
      </div>
    </div>
  );
};
