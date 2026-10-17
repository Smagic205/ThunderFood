import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Cuộn lên đầu trang mỗi khi đường dẫn (pathname) thay đổi.
 * Đặt component này bên trong Router context (ví dụ: AdminLayout).
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};
