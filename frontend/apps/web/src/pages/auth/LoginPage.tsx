import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';
import { LOCKED_ACCOUNT_NOTICE_KEY } from '@/shared/api/axiosClient';
import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton';
import { loginSchema, type LoginFormValues } from './authSchemas';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(() => {
    try {
      const notice = sessionStorage.getItem(LOCKED_ACCOUNT_NOTICE_KEY) || '';
      if (notice) sessionStorage.removeItem(LOCKED_ACCOUNT_NOTICE_KEY);
      return notice;
    } catch {
      return '';
    }
  });
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [isResending, setIsResending] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const notice = sessionStorage.getItem(LOCKED_ACCOUNT_NOTICE_KEY);
      if (notice) {
        sessionStorage.removeItem(LOCKED_ACCOUNT_NOTICE_KEY);
        setApiError(notice);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const {
    register,
    handleSubmit,
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
          authProvider: response.user.authProvider || 'GOOGLE',
          status: response.user.status || 'ACTIVE',
        },
        response.token,
        true
      );

      // Fetch thêm profile đầy đủ (nếu có thêm thông tin bổ trợ)
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
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Đăng nhập Google thất bại');
    } finally {
      setIsLoading(false);
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
        password: data.password,
        rememberMe: data.remember,
      });
      
      // Ngăn chặn STAFF và ADMIN đăng nhập ở cổng Khách hàng
      if (response.user.role === 'ADMIN' || response.user.role === 'STAFF') {
        setApiError(`Tài khoản ${response.user.role} không được đăng nhập tại đây.`);
        setIsLoading(false);
        return;
      }
      
      // Lưu thông tin cơ bản vào store (RAM) trước để có token
      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          fullName: response.user.fullName,
          phone: response.user.phone || '',
          role: response.user.role as 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER',
          avatarUrl: response.user.avatarUrl,
          authProvider: response.user.authProvider || 'LOCAL',
          status: response.user.status || 'ACTIVE',
        },
        response.token,
        data.remember
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
        <GoogleAuthButton
          onSuccess={executeGoogleLogin}
          onError={(msg) => setApiError(msg)}
          disabled={isLoading}
          text="signin_with"
        />
      </div>
      <div className="or">hoặc dùng email</div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
        {apiError && (
          <div role="alert" className="p-3 bg-red-50 text-red-600 rounded-xl mb-2 text-sm">
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

      <div className="auth-switch-prompt">
        <span>Chưa có tài khoản?</span>
        <Link to="/register" className="auth-switch-link">
          Đăng ký ngay
        </Link>
      </div>
    </>
  );
};
