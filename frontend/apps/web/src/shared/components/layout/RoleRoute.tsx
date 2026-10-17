import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';

export const RoleRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to a safe default or 403 page
    // For now, redirect to login with no history
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
