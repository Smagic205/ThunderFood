import { Link, useNavigate } from 'react-router-dom';
import { Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';

const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email chưa đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
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

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setApiError('');
      
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
      // Import động để tránh circular dependency
      import('@/shared/api/userApi').then(({ userApi }) => {
        userApi.getProfile().then((profile) => {
          useAuthStore.getState().updateUser({
            authProvider: profile.authProvider as 'LOCAL' | 'GOOGLE',
            status: profile.status as 'ACTIVE' | 'LOCKED',
            phone: profile.phone || '',
            createdAt: profile.createdAt || undefined,
            updatedAt: profile.updatedAt || undefined,
          });
        }).catch(() => { /* silent - không ảnh hưởng luồng login */ });
      });
      
      navigate('/');
    } catch (error: unknown) {
      const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đã có lỗi xảy ra khi đăng nhập';
      setApiError(errorMsg);
      setError('email', { type: 'manual', message: errorMsg });
      setError('password', { type: 'manual', message: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <h1>Chào mừng trở lại</h1>
      <p className="muted" style={{ marginBottom: 28 }}>Đăng nhập để tiếp tục đặt món.</p>
      
      <div className="social">
        <button className="btn btn-ghost" type="button" onClick={() => alert('Đăng nhập Google sẽ kết nối ở bước triển khai')}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.35c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.7 7.29 9.13 5.35 12 5.35z"/></svg>
          Google
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => alert('Đăng nhập Facebook sẽ kết nối ở bước triển khai')}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.85v-8.38H7.08V12h3.02V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12z"/></svg>
          Facebook
        </button>
      </div>
      <div className="or">hoặc dùng email</div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form-grid" noValidate>
        {apiError && <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-2 text-sm">{apiError}</div>}
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
            <input type="checkbox" {...register('remember')} />Ghi nhớ đăng nhập
          </label>
          <Link className="tlink" to="/forgot">Quên mật khẩu?</Link>
        </div>
        
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
      
      <p className="muted center" style={{ marginTop: 22 }}>
        Chưa có tài khoản? <Link className="tlink" to="/register"><b>Đăng ký</b></Link>
      </p>
    </>
  );
};
