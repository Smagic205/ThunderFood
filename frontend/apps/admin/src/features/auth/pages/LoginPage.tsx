import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore, type User } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(true);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const editedCredentialsRef = useRef({ email: false, password: false });

  // Chống autofill triệt để từ trình duyệt khi trang vừa load
  useEffect(() => {
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';

    // Xóa thêm 1 lần sau khi DOM render xong đề phòng trình duyệt inject chậm
    const timer = setTimeout(() => {
      const emailInput = emailRef.current;
      if (!editedCredentialsRef.current.email && emailInput?.value) {
        emailInput.value = '';
      }
      const passwordInput = passwordRef.current;
      if (!editedCredentialsRef.current.password && passwordInput?.value) {
        passwordInput.value = '';
      }
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Lấy giá trị từ state hoặc fallback từ DOM ref
    const currentEmail = (email || emailRef.current?.value || '').trim();
    const currentPassword = password || passwordRef.current?.value || '';

    if (!currentEmail) {
      setError('Vui lòng nhập email quản trị.');
      return;
    }

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authApi.login({ email: currentEmail, password: currentPassword });

      // Kiểm tra role ADMIN trước khi cho đăng nhập
      if (data.user.role !== 'ADMIN') {
        setError('Tài khoản này không có quyền truy cập trang Quản trị (Admin).');
        setIsLoading(false);
        return;
      }

      login(data.user, data.token, data.refreshToken);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng nhập nhanh dành cho bản Demo / phát triển giao diện
  const handleDemoLogin = () => {
    const demoAdmin: User = {
      id: 1,
      email: 'admin@thunderfood.vn',
      fullName: 'Trương Thanh Sơn',
      role: 'ADMIN',
      avatarUrl: null,
    };
    login(demoAdmin, 'demo-admin-access-token', 'demo-admin-refresh-token');
    navigate('/admin', { replace: true });
  };

  // Điền nhanh thông tin mẫu vào form
  const handleFillDemo = () => {
    editedCredentialsRef.current.email = true;
    editedCredentialsRef.current.password = true;
    setIsReadOnly(false);
    setEmail('admin@thunderfood.vn');
    setPassword('admin123');
    if (emailRef.current) emailRef.current.value = 'admin@thunderfood.vn';
    if (passwordRef.current) passwordRef.current.value = 'admin123';
  };

  return (
    <div className="login-page">
      {/* Background decorative elements */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">
            <Zap size={28} />
          </span>
          <span className="login-logo-text">ThunderFood</span>
        </div>

        <h1 className="login-title">Đăng nhập Quản trị</h1>
        <p className="login-subtitle">
          Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
        </p>

        {/* Error message */}
        {error && (
          <div className="login-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="login-field">
            <label className="login-label" htmlFor="admin-user-input">
              Email
            </label>
            <div className="login-input-wrap">
              <Mail size={18} className="login-input-icon" />
              <input
                ref={emailRef}
                id="admin-user-input"
                name="admin_acc_user"
                className="login-input"
                type="text"
                placeholder="admin@thunderfood.vn"
                value={email}
                readOnly={isReadOnly}
                onFocus={() => setIsReadOnly(false)}
                onMouseDown={() => setIsReadOnly(false)}
                onTouchStart={() => setIsReadOnly(false)}
                onChange={(e) => {
                  editedCredentialsRef.current.email = true;
                  setEmail(e.target.value);
                }}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="login-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="login-label" htmlFor="admin-pass-input">
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={handleFillDemo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--admin-primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Điền mẫu admin
              </button>
            </div>
            <div className="login-input-wrap">
              <Lock size={18} className="login-input-icon" />
              <input
                ref={passwordRef}
                id="admin-pass-input"
                name="admin_acc_pass"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                readOnly={isReadOnly}
                onFocus={() => setIsReadOnly(false)}
                onMouseDown={() => setIsReadOnly(false)}
                onTouchStart={() => setIsReadOnly(false)}
                onChange={(e) => {
                  editedCredentialsRef.current.password = true;
                  setPassword(e.target.value);
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="login-spinner" />
                Đang xử lý…
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          <div className="login-divider">hoặc</div>

          <button
            type="button"
            className="login-demo-btn"
            onClick={handleDemoLogin}
          >
            <Sparkles size={16} />
            Đăng nhập nhanh (Admin Demo)
          </button>
        </form>

        <p className="login-footer">
          Trang quản trị dành riêng cho Admin. <br />
          Nhân viên vui lòng sử dụng{' '}
          <a href="http://localhost:5175" target="_blank" rel="noreferrer">
            ứng dụng Staff
          </a>
          .
        </p>
      </div>
    </div>
  );
};
