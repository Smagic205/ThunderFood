import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';

export const PrivateRoute = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
