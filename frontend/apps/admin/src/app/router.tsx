import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { createBrowserRouter } from 'react-router-dom';

const DashboardPage = () => {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Tổng quan hệ thống</h2>
      <p>Nội dung trang chủ Admin sẽ được xây dựng ở đây.</p>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'admin',
        element: <DashboardPage />, // Fallback nếu user gõ /admin
      },
    ],
  },
]);
