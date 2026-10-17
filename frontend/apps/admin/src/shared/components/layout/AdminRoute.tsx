import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';

/**
 * Route Guard: Chỉ cho phép truy cập nếu đã đăng nhập VÀ có role ADMIN.
 * Nếu chưa đăng nhập hoặc role không hợp lệ -> redirect về /login.
 */
export const AdminRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
