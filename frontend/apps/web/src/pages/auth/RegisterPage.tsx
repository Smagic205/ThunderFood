import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MailCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';
import { GoogleAuthButton } from '@/shared/components/auth/GoogleAuthButton';
import { registerSchema, type RegisterFormValues } from './authSchemas';

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Trạng thái chờ kích hoạt email
  const [isActivationSent, setIsActivationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  
  const getPasswordStrength = (v: string) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return v ? Math.max(1, s) : 0;
  };
  
  const strength = getPasswordStrength(passwordValue);
  const strengthText = ['', 'Yếu', 'Trung bình', 'Khá tốt', 'Mạnh'][strength];

  // Đếm ngược gửi lại email kích hoạt
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const executeGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      setApiError('');
      const response = await authApi.googleLogin(idToken);
      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          fullName: response.user.fullName,
          phone: response.user.phone || '',
          role: response.user.role as any,
          avatarUrl: response.user.avatarUrl,
          authProvider: response.user.authProvider || 'GOOGLE',
          status: response.user.status || 'ACTIVE',
        },
        response.token,
        response.refreshToken
      );

      // Fetch thêm profile
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
      setApiError(err.response?.data?.message || 'Đăng ký/Đăng nhập Google thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setApiError('');
      
      const response = await authApi.register({
        fullName: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password
      });

      // Nếu hệ thống yêu cầu kích hoạt email (không có token)
      if (response.requiresVerification || !response.token) {
        setRegisteredEmail(data.email);
        setIsActivationSent(true);
        setResendCooldown(60);
        return;
      }

      // Trường hợp có token (dành cho Google hoặc môi trường test)
      const isAdmin = response.user.role === 'ADMIN';
      login(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.fullName,
          phone: data.phone,
          role: response.user.role as any,
          avatarUrl: response.user.avatarUrl
        },
        response.token,
        response.refreshToken
      );
      
      navigate(isAdmin ? '/admin' : '/');
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Đã có lỗi xảy ra khi đăng ký');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendActivation = async () => {
    if (!registeredEmail || resendCooldown > 0) return;
    try {
      setIsResending(true);
      setResendStatus('');
      const msg = await authApi.resendActivation(registeredEmail);
      setResendStatus(msg || 'Đã gửi lại email kích hoạt thành công!');
      setResendCooldown(60);
    } catch (err: any) {
      setResendStatus(err.response?.data?.message || 'Có lỗi khi gửi lại email kích hoạt.');
    } finally {
      setIsResending(false);
    }
  };

  // Màn hình thông báo đã gửi email kích hoạt
  if (isActivationSent) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <MailCheck size={60} style={{ color: '#10b981', margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          Kiểm tra hòm thư của bạn!
        </h1>
        <p className="muted" style={{ marginBottom: '20px', lineHeight: 1.6 }}>
          Chúng tôi đã gửi liên kết kích hoạt tài khoản đến địa chỉ:
          <br />
          <strong style={{ color: 'var(--ink)' }}>{registeredEmail}</strong>
        </p>

        <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '12px', fontSize: '13px', color: '#666', textAlign: 'left', marginBottom: '24px', lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>
            💡 <strong>Hướng dẫn hoàn tất đăng ký:</strong>
            <br />1. Mở email và bấm vào liên kết xác thực để kích hoạt tài khoản.
            <br />2. Nếu không thấy trong Hộp thư đến (Inbox), hãy kiểm tra thêm mục <em>Thư rác (Spam)</em> hoặc <em>Quảng cáo</em>.
            <br />3. Liên kết có hiệu lực trong vòng <strong>24 giờ</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ width: '100%', textDecoration: 'none' }}
          >
            Mở Gmail ngay
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResendActivation}
            style={{ width: '100%' }}
          >
            {isResending ? 'Đang gửi lại...' : resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại email kích hoạt'}
          </button>
          {resendStatus && (
            <p style={{ fontSize: '13px', color: resendStatus.includes('thành công') || resendStatus.includes('Đã gửi') ? '#10b981' : '#ef4444', margin: '4px 0 0' }}>
              {resendStatus}
            </p>
          )}
        </div>

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          Đã kích hoạt xong?{' '}
          <Link to="/login" style={{ color: 'var(--c-brand, #ff5722)', fontWeight: 600 }}>
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1>Tạo tài khoản</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Nhận ưu đãi 30.000₫ cho đơn đầu tiên.</p>
      
      <div className="social">
        <GoogleAuthButton
          onSuccess={executeGoogleLogin}
          onError={(msg) => setApiError(msg)}
          disabled={isLoading}
          text="signup_with"
        />
      </div>
      <div className="or">hoặc đăng ký bằng email</div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
        {apiError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">{apiError}</div>}
        <label className="field">
          <span>Họ và tên</span>
          <input 
            className="input" 
            placeholder="Nguyễn Văn A" 
            autoComplete="name"
            {...register('name')}
          />
          {errors.name && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.name.message}</small>}
        </label>
        
        <div className="grid2 keep">
          <label className="field">
            <span>Email</span>
            <input 
              className="input" 
              type="email" 
              placeholder="ten@email.com" 
              autoComplete="email" 
              inputMode="email" 
              {...register('email')}
            />
            {errors.email && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.email.message}</small>}
          </label>
          <label className="field">
            <span>Số điện thoại</span>
            <input 
              className="input" 
              type="tel" 
              placeholder="0912 345 678" 
              autoComplete="tel" 
              inputMode="tel" 
              {...register('phone')}
            />
            {errors.phone && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.phone.message}</small>}
          </label>
        </div>

        <label className="field">
          <span>Mật khẩu</span>
          <div className="input-ic">
            <button type="button" className="ibtn peek" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <input 
              className="input" 
              type={showPassword ? "text" : "password"} 
              placeholder="Tối thiểu 8 ký tự" 
              autoComplete="new-password"
              {...register('password')}
            />
          </div>
          {errors.password && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.password.message}</small>}
          {passwordValue && (
            <div className="meter" style={{ marginTop: 8 }}>
              <div className="bar"><span style={{ width: `${(strength / 4) * 100}%` }}></span></div>
              <small className="faint">Độ mạnh: <strong>{strengthText}</strong></small>
            </div>
          )}
        </label>

        <label className="field">
          <span>Xác nhận mật khẩu</span>
          <div className="input-ic">
            <button type="button" className="ibtn peek" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <input 
              className="input" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Nhập lại mật khẩu" 
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.confirmPassword.message}</small>}
        </label>

        <label className="check" style={{ marginTop: 4 }}>
          <input type="checkbox" {...register('terms')} />
          <span>Tôi đồng ý với <Link to="/support">Điều khoản dịch vụ</Link> và <Link to="/support">Chính sách bảo mật</Link> của ThunderFood.</span>
        </label>
        {errors.terms && <small className="faint" style={{ color: 'var(--c-red)', display: 'block' }}>{errors.terms.message}</small>}

        <button className="btn btn-primary btn-lg" type="submit" disabled={isLoading} style={{ marginTop: 12 }}>
          {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>

      <div className="auth-switch-prompt">
        <span>Đã có tài khoản?</span>
        <Link to="/login" className="auth-switch-link">
          Đăng nhập ngay
        </Link>
      </div>
    </>
  );
};
