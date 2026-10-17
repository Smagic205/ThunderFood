import { createBrowserRouter, Navigate } from 'react-router-dom';
import { StaffLayout } from '@/shared/components/layout/StaffLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { PackagesPage } from '@/features/packages/pages/PackagesPage';
import { MyPackagePage } from '@/features/packages/pages/MyPackagePage';
import { ReviewsPage } from '@/features/reviews/pages/ReviewsPage';

// Fallback component until we implement real pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div>
    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{title}</h2>
    <p>Nội dung đang được xây dựng.</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <StaffLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/orders" replace />,
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'packages',
        element: <PackagesPage />,
      },
      {
        path: 'my-package',
        element: <MyPackagePage />,
      },
      {
        path: 'reviews',
        element: <ReviewsPage />,
      },
    ],
  },
]);
