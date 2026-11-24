import { useEffect, useRef, useState } from 'react';

interface GoogleAuthButtonProps {
  onSuccess: (idToken: string) => Promise<void> | void;
  onError?: (errorMessage: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  text = 'signin_with',
  disabled = false,
}: GoogleAuthButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const [, setGsiReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    let isMounted = true;

    const initAndRender = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && containerRef.current) {
        if (!isMounted) return;
        setGsiReady(true);

        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              if (response.credential) {
                await onSuccess(response.credential);
              } else {
                onError?.('Không nhận được token xác thực từ tài khoản Google.');
              }
            },
          });

          // Làm trống container trước khi render lại
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
            
            // Tính toán chiều rộng nút chuẩn Google (tối đa 400px, tối thiểu 240px)
            const parentWidth = containerRef.current.clientWidth || 380;
            const btnWidth = Math.min(400, Math.max(240, Math.floor(parentWidth)));

            google.accounts.id.renderButton(containerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text,
              shape: 'pill',
              logo_alignment: 'left',
              width: btnWidth,
            });
          }

          // Kích hoạt thêm Google One Tap nếu trình duyệt hỗ trợ
          google.accounts.id.prompt();
        } catch (err) {
          console.error('Error rendering Google Sign-In button:', err);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initAndRender();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          initAndRender();
        }
      }, 250);

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, text]);

  // Nếu chưa cấu hình Client ID thì hiển thị nút dự phòng hướng dẫn cấu hình
  if (!clientId) {
    return (
      <button
        className="btn btn-ghost"
        type="button"
        disabled={disabled}
        onClick={() => {
          alert('Chưa cấu hình VITE_GOOGLE_CLIENT_ID trong file .env. Vui lòng thiết lập Google Client ID để sử dụng đăng nhập Google.');
        }}
        title="Chưa cấu hình Google Client ID"
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '46px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '10px 20px',
          borderRadius: '9999px',
          background: '#ffffff',
          color: '#1f2937',
          fontWeight: 600,
          border: '1px solid #dadce0',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.75c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9z"/>
          <path fill="#EA4335" d="M12 5.35c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.7 7.29 9.13 5.35 12 5.35z"/>
        </svg>
        {text === 'signup_with' ? 'Đăng ký với Google' : 'Đăng nhập với Google'}
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '46px',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    />
  );
};
