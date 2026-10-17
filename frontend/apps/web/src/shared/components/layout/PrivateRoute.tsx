import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';

export const PrivateRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
