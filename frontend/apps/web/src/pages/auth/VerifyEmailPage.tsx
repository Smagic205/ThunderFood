import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { authApi } from '@/shared/api/authApi';
import { useAuthStore } from '@/app/store/authStore';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [state, setState] = useState<'verifying' | 'success' | 'error'>(token ? 'verifying' : 'error');
  const [errorMessage, setErrorMessage] = useState(token ? '' : 'Không tìm thấy mã kích hoạt trong đường dẫn.');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const verify = async () => {
      try {
        const response = await authApi.verifyEmail(token);
        if (!isMounted) return;

        if (response && response.token) {
          login(
            {
              id: response.user.id,
              email: response.user.email,
              name: response.user.fullName,
              fullName: response.user.fullName,
              phone: response.user.phone || '',
              role: response.user.role as any,
              avatarUrl: response.user.avatarUrl,
              authProvider: response.user.authProvider || 'LOCAL',
              status: response.user.status || 'ACTIVE',
            },
            response.token,
            response.refreshToken
          );

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
        }

        setState('success');
        setTimeout(() => {
          if (isMounted) {
            navigate('/');
          }
        }, 3000);
      } catch (err: any) {
        if (!isMounted) return;
        setState('error');
        setErrorMessage(
          err.response?.data?.message || 'Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.'
        );
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, login, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    try {
      setIsResending(true);
      setResendMessage('');
      const msg = await authApi.resendActivation(resendEmail.trim());
      setResendMessage(msg || 'Đã gửi lại email kích hoạt! Vui lòng kiểm tra hòm thư của bạn.');
    } catch (err: any) {
      setResendMessage(
        err.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email kích hoạt.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      {state === 'verifying' && (
        <div>
          <Loader2 className="animate-spin" size={48} style={{ color: '#ff5722', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Đang xác thực tài khoản...
          </h2>
          <p className="muted">Vui lòng đợi giây lát trong khi chúng tôi kích hoạt tài khoản của bạn.</p>
        </div>
      )}

      {state === 'success' && (
        <div>
          <CheckCircle2 size={56} style={{ color: '#10b981', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
            Kích hoạt thành công!
          </h2>
          <p className="muted" style={{ marginBottom: '24px' }}>
            Chúc mừng bạn đã hoàn tất kích hoạt tài khoản ThunderFood. Hệ thống đang tự động đăng nhập và chuyển về trang chủ...
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            Đến trang chủ ngay <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </button>
        </div>
      )}

      {state === 'error' && (
        <div>
          <XCircle size={56} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
            Kích hoạt thất bại
          </h2>
          <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px', lineHeight: 1.5 }}>
            {errorMessage}
          </p>

          <div style={{ background: 'var(--surface, #f9fafb)', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 600 }}>
              Gửi lại liên kết kích hoạt mới
            </h4>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px 0' }}>
              Nhập email tài khoản của bạn để nhận liên kết kích hoạt mới:
            </p>
            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="input-ic">
                <Mail className="ic" size={18} />
                <input
                  className="input"
                  type="email"
                  placeholder="Địa chỉ email đã đăng ký"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isResending || !resendEmail.trim()}
                style={{ width: '100%' }}
              >
                {isResending ? 'Đang gửi email...' : 'Gửi lại email kích hoạt'}
              </button>
              {resendMessage && (
                <p style={{ fontSize: '13px', color: resendMessage.includes('Đã gửi') ? '#10b981' : '#ef4444', margin: '4px 0 0' }}>
                  {resendMessage}
                </p>
              )}
            </form>
          </div>

          <Link to="/login" className="btn btn-ghost" style={{ width: '100%' }}>
            Về trang đăng nhập
          </Link>
        </div>
      )}
    </div>
  );
};
