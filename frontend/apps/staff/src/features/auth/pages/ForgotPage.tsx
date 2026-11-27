import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Zap, Mail, KeyRound, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/;

export const ForgotPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(cleanEmail);
      setEmail(cleanEmail);
      setResendCooldown(60);
      setResendMessage('');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setResendMessage('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setResendCooldown(60);
      setResendMessage('Đã gửi lại mã OTP mới đến email của bạn.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi gửi lại mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Vui lòng nhập mã OTP');
      return;
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('Mật khẩu 8-12 ký tự, ít nhất 1 chữ hoa và 1 ký tự đặc biệt (@#$%^&+=!_)');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-side">
        <svg className="hero-bolt" viewBox="0 0 210 300" aria-hidden="true">
          <path className="f" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z" />
          <path className="o" pathLength="1000" d="M128 0 20 168h70l-24 132L190 110h-76L150 0Z" />
        </svg>
        <Link to="/" className="logo">
          <span className="logo-mark"><Zap size={22} fill="currentColor" strokeWidth={0} /></span>
          <span>ThunderFood</span>
        </Link>

        <div>
          <h2>Khôi phục mật khẩu nhân viên.</h2>
          <p>Xác thực bằng mã OTP qua email để đặt lại mật khẩu an toàn cho tài khoản Staff.</p>
        </div>
      </aside>

      <div className="auth-main">
        <div className="auth-box">
          {step === 3 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircle2 size={60} style={{ color: 'var(--c-green)', margin: '0 auto 20px' }} />
              <h1>Đổi mật khẩu thành công!</h1>
              <p className="muted" style={{ marginBottom: '28px' }}>
                Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập lại với mật khẩu mới.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg btn-block" style={{ textDecoration: 'none' }}>
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <h1>{step === 1 ? 'Quên mật khẩu' : 'Xác thực OTP'}</h1>
              <p className="muted" style={{ marginBottom: '28px' }}>
                {step === 1
                  ? 'Nhập email nhân viên đã đăng ký để nhận mã OTP khôi phục.'
                  : `Nhập mã OTP vừa được gửi đến ${email} và mật khẩu mới.`}
              </p>

              {error && (
                <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--c-red) 12%, transparent)', color: 'var(--c-red)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {resendMessage && (
                <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--c-green) 12%, transparent)', color: 'var(--c-green)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
                  {resendMessage}
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="form-grid" noValidate>
                  <label className="field">
                    <span>Email nhân viên</span>
                    <div className="input-ic">
                      <div className="ic-prefix"><Mail size={18} /></div>
                      <input
                        className="input"
                        type="email"
                        placeholder="ten@thunderfood.vn"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </label>

                  <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: '8px' }}>
                    {loading ? 'Đang gửi mã...' : 'Gửi mã xác thực'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="form-grid" noValidate>
                  <label className="field">
                    <span>Mã OTP</span>
                    <div className="input-ic">
                      <div className="ic-prefix"><KeyRound size={18} /></div>
                      <input
                        className="input"
                        type="text"
                        placeholder="Nhập mã 6 số"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="field">
                    <span>Mật khẩu mới</span>
                    <div className="input-ic">
                      <div className="ic-prefix"><Lock size={18} /></div>
                      <input
                        className="input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="8-12 ký tự, 1 hoa & 1 đặc biệt"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <label className="field">
                    <span>Xác nhận mật khẩu mới</span>
                    <div className="input-ic">
                      <div className="ic-prefix"><Lock size={18} /></div>
                      <input
                        className="input"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu mới"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="peek btn-ic"
                        aria-label="Hiện/ẩn mật khẩu"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading} style={{ marginTop: '8px' }}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendOtp}
                  >
                    {resendCooldown > 0 ? `Gửi lại mã OTP sau ${resendCooldown}s` : 'Gửi lại mã OTP'}
                  </button>
                </form>
              )}

              <p className="muted center" style={{ marginTop: '22px' }}>
                {step === 2 ? (
                  <button
                    type="button"
                    className="tlink"
                    onClick={() => {
                      setStep(1);
                      setError('');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Đổi email khác
                  </button>
                ) : (
                  <Link to="/login" className="tlink" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={16} /> Quay lại Đăng nhập
                  </Link>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
