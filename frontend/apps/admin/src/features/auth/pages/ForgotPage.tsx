import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, KeyRound, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/shared/api/authApi';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/;

export const ForgotPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.forgotPassword(cleanEmail);
      setEmail(cleanEmail);
      setResendCooldown(60);
      setResendMessage('');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError('');
    setResendMessage('');
    try {
      setIsLoading(true);
      await authApi.forgotPassword(email.trim());
      setResendCooldown(60);
      setResendMessage('Đã gửi lại mã OTP mới đến email của bạn.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu mới phải từ 8-12 ký tự, có ít nhất 1 chữ hoa và 1 ký tự đặc biệt (@#$%^&+=!_).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">
            <Zap size={28} />
          </span>
          <span className="login-logo-text">ThunderFood</span>
        </div>

        {step === 3 ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <CheckCircle2 size={56} style={{ color: '#34d399', margin: '0 auto 16px' }} />
            <h1 className="login-title">Đổi mật khẩu thành công</h1>
            <p className="login-subtitle" style={{ marginBottom: 24 }}>
              Mật khẩu tài khoản quản trị đã được cập nhật. Vui lòng đăng nhập lại.
            </p>
            <Link to="/login" className="login-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Quay lại Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <h1 className="login-title">
              {step === 1 ? 'Quên mật khẩu' : 'Xác thực OTP'}
            </h1>
            <p className="login-subtitle">
              {step === 1
                ? 'Nhập email quản trị để nhận mã OTP đặt lại mật khẩu.'
                : `Nhập mã OTP 6 số vừa được gửi đến ${email}.`}
            </p>

            {error && (
              <div className="login-error" role="alert">
                <span>{error}</span>
              </div>
            )}

            {resendMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.14)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  fontSize: '0.85rem',
                }}
              >
                {resendMessage}
              </div>
            )}

            {step === 1 ? (
              <form className="login-form" onSubmit={handleSendOtp}>
                <div className="login-field">
                  <label className="login-label" htmlFor="admin-forgot-email">
                    Email quản trị
                  </label>
                  <div className="login-input-wrap">
                    <Mail size={18} className="login-input-icon" />
                    <input
                      id="admin-forgot-email"
                      className="login-input"
                      type="email"
                      placeholder="admin@thunderfood.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="login-spinner" />
                      Đang gửi mã OTP…
                    </>
                  ) : (
                    'Gửi mã xác thực'
                  )}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleResetPassword}>
                <div className="login-field">
                  <label className="login-label" htmlFor="admin-forgot-otp">
                    Mã OTP (6 chữ số)
                  </label>
                  <div className="login-input-wrap">
                    <KeyRound size={18} className="login-input-icon" />
                    <input
                      id="admin-forgot-otp"
                      className="login-input"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="admin-forgot-newpass">
                    Mật khẩu mới
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={18} className="login-input-icon" />
                    <input
                      id="admin-forgot-newpass"
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8-12 ký tự, chữ hoa & ký tự đặc biệt"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="admin-forgot-confirmpass">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={18} className="login-input-icon" />
                    <input
                      id="admin-forgot-confirmpass"
                      className="login-input"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={20} className="login-spinner" />
                      Đang xử lý…
                    </>
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isLoading}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '10px',
                    padding: '10px',
                    color: 'var(--admin-text-muted)',
                    fontSize: '0.85rem',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resendCooldown > 0 ? `Gửi lại mã OTP sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
                </button>
              </form>
            )}

            <p className="login-footer" style={{ marginTop: 20 }}>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--admin-primary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <ArrowLeft size={16} /> Đổi email khác
                </button>
              ) : (
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowLeft size={16} /> Quay lại Đăng nhập
                </Link>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
