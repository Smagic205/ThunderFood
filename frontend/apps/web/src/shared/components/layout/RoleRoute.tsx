import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { PageLoader } from '@/shared/components/ui/PageLoader';

export const RoleRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { isAuthenticated, user, isHydrating } = useAuthStore();

  if (isHydrating) {
    return <PageLoader message="Đang khôi phục phiên đăng nhập..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
