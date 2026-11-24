import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';
import { loginSchema, type LoginFormValues } from './authSchemas';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [isResending, setIsResending] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: true,
    }
  });

  const executeGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      setApiError('');
      const response = await authApi.googleLogin(idToken);

      // Ngăn chặn STAFF và ADMIN đăng nhập ở cổng Khách hàng
      if (response.user.role === 'ADMIN' || response.user.role === 'STAFF') {
        setApiError(`Tài khoản ${response.user.role} không được đăng nhập tại đây.`);
        setIsLoading(false);
        return;
      }

      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          fullName: response.user.fullName,
          phone: response.user.phone || '',
          role: response.user.role as 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER',
          avatarUrl: response.user.avatarUrl,
          authProvider: 'GOOGLE'
        },
        response.token,
        response.refreshToken
      );

      // Fetch thêm profile đầy đủ (authProvider, status, createdAt, v.v.) ngay sau login
      import('@/shared/api/userApi').then(({ userApi }) => {
        userApi.getProfile().then((profile) => {
          useAuthStore.getState().updateUser({
            authProvider: profile.authProvider as 'LOCAL' | 'GOOGLE',
            status: profile.status,
            createdAt: profile.createdAt || undefined,
            updatedAt: profile.updatedAt || undefined
          });
        }).catch(() => {});
      });

      navigate('/');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    let timer: any;
    const initializeGoogle = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && googleBtnRef.current) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              if (response.credential) {
                await executeGoogleLogin(response.credential);
              }
            },
          });

          // Render button phủ lên custom button để mở popup chính chủ Google khi click
          google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 250,
          });
        } catch (e) {
          console.warn('Google Identity Services init error:', e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initializeGoogle();
    } else {
      timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          initializeGoogle();
        }
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [clientId]);

  const handleGoogleAuth = () => {
    if (!clientId) {
      setApiError('Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong file .env. Vui lòng thiết lập để sử dụng đăng nhập Google.');
      return;
    }

    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          const btn = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement;
          if (btn) btn.click();
        }
      });
    } else {
      setApiError('Đang tải thư viện Google, vui lòng thử lại sau vài giây.');
    }
  };

  const handleResendActivation = async () => {
    if (!unverifiedEmail) return;
    try {
      setIsResending(true);
      setResendStatus('');
      const msg = await authApi.resendActivation(unverifiedEmail);
      setResendStatus(msg || 'Đã gửi lại email kích hoạt! Vui lòng kiểm tra hòm thư của bạn.');
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || 'Có lỗi khi gửi lại email kích hoạt.');
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setApiError('');
      setUnverifiedEmail('');
      setResendStatus('');
      
      const response = await authApi.login({
        email: data.email,
        password: data.password
      });
      
      // Ngăn chặn STAFF và ADMIN đăng nhập ở cổng Khách hàng
      if (response.user.role === 'ADMIN' || response.user.role === 'STAFF') {
        setApiError(`Tài khoản ${response.user.role} không được đăng nhập tại đây.`);
        setIsLoading(false);
        return;
      }
      
      // Lưu thông tin cơ bản vào store trước để có token
      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          fullName: response.user.fullName,
          phone: response.user.phone || '',
          role: response.user.role as 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER',
          avatarUrl: response.user.avatarUrl
        },
        response.token,
        response.refreshToken
      );

      // Fetch thêm profile đầy đủ (authProvider, status, createdAt, v.v.) ngay sau login
      import('@/shared/api/userApi').then(({ userApi }) => {
        userApi.getProfile().then((profile) => {
          useAuthStore.getState().updateUser({
            authProvider: profile.authProvider as 'LOCAL' | 'GOOGLE',
            status: profile.status as 'ACTIVE' | 'LOCKED',
            phone: profile.phone || '',
            createdAt: profile.createdAt || undefined,
            updatedAt: profile.updatedAt || undefined,
          });
        }).catch(() => { /* silent */ });
      });
      
      navigate('/');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập';
      setApiError(errorMsg);

      // Nếu tài khoản chưa kích hoạt, lưu email để hỗ trợ gửi lại ngay tại chỗ
      if (errorMsg.toLowerCase().includes('chưa được kích hoạt') || errorMsg.toLowerCase().includes('kích hoạt')) {
        setUnverifiedEmail(data.email);
      } else {
        setError('email', { type: 'manual', message: errorMsg });
        setError('password', { type: 'manual', message: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1>Chào mừng trở lại</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Đăng nhập để tiếp tục đặt món.</p>
      
      <div className="social">
        <div className="relative overflow-hidden rounded-xl">
          <button className="btn btn-ghost w-full" type="button" onClick={handleGoogleAuth} disabled={isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.35c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.7 7.29 9.13 5.35 12 5.35z"/></svg>
            Google
          </button>
          {Boolean(clientId) && (
            <div
              ref={googleBtnRef}
              className="absolute inset-0 opacity-[0.0001] cursor-pointer flex items-center justify-center overflow-hidden scale-125 z-10"
              title="Đăng nhập bằng tài khoản Google"
            />
          )}
        </div>
        <button className="btn btn-ghost" type="button" onClick={() => alert('Đăng nhập Facebook sẽ kết nối ở bước triển khai')}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.85v-8.38H7.08V12h3.02V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12z"/></svg>
          Facebook
        </button>
      </div>
      <div className="or">hoặc dùng email</div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
        {apiError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-2 text-sm">
            {apiError}
            {unverifiedEmail && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fee2e2' }}>
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={isResending}
                  className="font-semibold underline hover:text-red-700"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  {isResending ? 'Đang gửi...' : 'Bấm vào đây để gửi lại email kích hoạt'}
                </button>
                {resendStatus && (
                  <p style={{ marginTop: '4px', fontSize: '12px', color: resendStatus.includes('Đã gửi') ? '#10b981' : '#b91c1c' }}>
                    {resendStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <label className="field">
          <span>Email</span>
          <div className="input-ic">
            <Mail className="ic" size={18} />
            <input 
              className="input" 
              type="email" 
              placeholder="ten@email.com" 
              autoComplete="email" 
              inputMode="email" 
              {...register('email')}
            />
          </div>
          {errors.email && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.email.message}</small>}
        </label>
        
        <label className="field">
          <span>Mật khẩu</span>
          <div className="input-ic">
            <Lock className="ic" size={18} />
            <button type="button" className="ibtn peek" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <input 
              className="input" 
              type={showPassword ? "text" : "password"} 
              placeholder="Nhập mật khẩu" 
              {...register('password')}
            />
          </div>
          {errors.password && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.password.message}</small>}
        </label>
        
        <div className="row between">
          <label className="check">
            <input type="checkbox" {...register('remember')} />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot" className="faint" style={{ color: 'var(--c-brand)' }}>Quên mật khẩu?</Link>
        </div>

        <button className="btn btn-primary btn-lg" type="submit" disabled={isLoading}>
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="foot">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
    </>
  );
};
