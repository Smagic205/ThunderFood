import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, KeyRound, Lock, EyeOff, Eye, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/shared/api/authApi';

const step1Schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email chưa đúng định dạng')
});

const step2Schema = z.object({
  otp: z.string().min(1, 'Vui lòng nhập mã OTP'),
  newPassword: z.string().regex(/^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/, 'Mật khẩu 8-12 ký tự, ít nhất 1 hoa & 1 đặc biệt')
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export const ForgotPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: OTP, 3: Success
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema)
  });

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema)
  });

  const onStep1Submit = async (data: Step1Values) => {
    try {
      setIsLoading(true);
      setApiError('');
      await authApi.forgotPassword(data.email);
      setEmail(data.email);
      setStep(2);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const onStep2Submit = async (data: Step2Values) => {
    try {
      setIsLoading(true);
      setApiError('');
      await authApi.resetPassword({
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      setStep(3);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center', paddingTop: '10vh' }}>
        <CheckCircle2 size={64} style={{ color: 'var(--c-green)', margin: '0 auto 24px' }} />
        <h1>Đổi mật khẩu thành công!</h1>
        <p className="muted" style={{ marginBottom: 32 }}>Mật khẩu của bạn đã được thay đổi. Vui lòng đăng nhập lại với mật khẩu mới.</p>
        <Link to="/login" className="btn btn-primary btn-lg btn-block">
          Quay lại Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <>
      <button 
        type="button" 
        onClick={() => step === 2 ? setStep(1) : navigate('/login')} 
        className="ibtn" 
        style={{ position: 'absolute', top: 32, left: 32, width: 44, height: 44, background: 'var(--bg-2)', borderRadius: '50%' }}
        aria-label="Quay lại"
      >
        <ArrowLeft size={20} />
      </button>

      <h1>{step === 1 ? 'Quên mật khẩu' : 'Xác thực OTP'}</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        {step === 1 
          ? 'Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.' 
          : `Nhập mã OTP vừa được gửi đến ${email} và mật khẩu mới của bạn.`}
      </p>

      {apiError && <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-4 text-sm">{apiError}</div>}

      {step === 1 && (
        <form className="form-grid" onSubmit={form1.handleSubmit(onStep1Submit)} noValidate>
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
                {...form1.register('email')}
              />
            </div>
            {form1.formState.errors.email && <small className="faint" style={{ color: 'var(--c-red)' }}>{form1.formState.errors.email.message}</small>}
          </label>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isLoading} style={{ marginTop: 12 }}>
            {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form className="form-grid" onSubmit={form2.handleSubmit(onStep2Submit)} noValidate>
          <label className="field">
            <span>Mã OTP</span>
            <div className="input-ic">
              <KeyRound className="ic" size={18} />
              <input 
                className="input"
                type="text" 
                placeholder="Nhập mã 6 số"
                maxLength={6}
                {...form2.register('otp')}
              />
            </div>
            {form2.formState.errors.otp && <small className="faint" style={{ color: 'var(--c-red)' }}>{form2.formState.errors.otp.message}</small>}
          </label>

          <label className="field">
            <span>Mật khẩu mới</span>
            <div className="input-ic">
              <Lock className="ic" size={18} />
              <button type="button" className="ibtn peek" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              <input 
                className="input"
                type={showPassword ? "text" : "password"} 
                placeholder="Mật khẩu mới"
                {...form2.register('newPassword')}
              />
            </div>
            {form2.formState.errors.newPassword && <small className="faint" style={{ color: 'var(--c-red)' }}>{form2.formState.errors.newPassword.message}</small>}
          </label>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isLoading} style={{ marginTop: 12 }}>
            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      )}
    </>
  );
};
