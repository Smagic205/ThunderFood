import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/app/store/authStore';
import { authApi } from '@/shared/api/authApi';

const registerSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập họ và tên'),
  email: z.string().min(1, 'Vui lòng nhập email').regex(/^[\w-\.]+@gmail\.com$/, 'Vui lòng sử dụng tài khoản Gmail'),
  phone: z.string().regex(/^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/, 'Số điện thoại không hợp lệ'),
  password: z.string().regex(/^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/, 'Mật khẩu 8-12 ký tự, ít nhất 1 hoa & 1 đặc biệt'),
  confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  terms: z.literal(true, {
    errorMap: () => ({ message: "Bạn phải đồng ý với điều khoản" })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
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

  return (
    <>
      <h1>Tạo tài khoản</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Nhận ưu đãi 30.000₫ cho đơn đầu tiên.</p>
      
      <div className="social">
        <button className="btn btn-ghost" type="button" onClick={() => alert('Đăng ký Google sẽ kết nối ở bước triển khai')}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.35c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.7 7.29 9.13 5.35 12 5.35z"/></svg>
          Google
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => alert('Đăng ký Facebook sẽ kết nối ở bước triển khai')}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.85v-8.38H7.08V12h3.02V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12z"/></svg>
          Facebook
        </button>
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
            <span>Email (Bắt buộc Gmail)</span>
            <input 
              className="input" 
              type="email" 
              placeholder="ten@gmail.com" 
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
              placeholder="09xx xxx xxx" 
              autoComplete="tel"
              {...register('phone')}
            />
            {errors.phone && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.phone.message}</small>}
          </label>
        </div>
        

        <div>
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
                placeholder="Ít nhất 8 ký tự" 
                {...register('password')}
              />
            </div>
          </label>
          {errors.password && <small className="faint" style={{ color: 'var(--c-red)', display: 'block', marginBottom: 4 }}>{errors.password.message}</small>}
          
          <div className="strength" data-s={strength} aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </div>
          <small className="faint s-txt" style={{ display: 'block', marginTop: 6, fontSize: 12.5 }}>
            {strengthText}
          </small>
        </div>

        <label className="field">
          <span>Nhập lại mật khẩu</span>
          <div className="input-ic">
            <Lock className="ic" size={18} />
            <button type="button" className="ibtn peek" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <input 
              className="input" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Nhập lại mật khẩu" 
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <small className="faint" style={{ color: 'var(--c-red)' }}>{errors.confirmPassword.message}</small>}
        </label>
        
        <label className="check" style={{ marginTop: 8, fontSize: 13, alignItems: 'flex-start' }}>
          <input type="checkbox" {...register('terms')} style={{ marginTop: 2 }} />
          <span>
            Bằng việc đăng ký, bạn đồng ý với <Link to="/terms" className="tlink">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="tlink">Chính sách bảo mật</Link> của ThunderFood.
          </span>
        </label>
        {errors.terms && <small className="faint" style={{ color: 'var(--c-red)', display: 'block' }}>{errors.terms.message}</small>}
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={isLoading} style={{ marginTop: 12 }}>
          {isLoading ? 'Đang tạo...' : 'Đăng ký tài khoản'}
        </button>
      </form>
      
      <p className="muted center" style={{ marginTop: 22 }}>
        Đã có tài khoản? <Link className="tlink" to="/login"><b>Đăng nhập</b></Link>
      </p>
    </>
  );
};
