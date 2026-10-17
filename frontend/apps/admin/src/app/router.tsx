import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminRoute } from '@/shared/components/layout/AdminRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';

import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { PackagesPage } from '@/features/packages/pages/PackagesPage';
import { ProductsPage } from '@/features/catalog/pages/ProductsPage';
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin" replace />,
          },
          {
            path: 'admin',
            element: <DashboardPage />,
          },
          {
            path: 'admin/orders',
            element: <OrdersPage />,
          },
          {
            path: 'admin/packages',
            element: <PackagesPage />,
          },
          {
            path: 'admin/products',
            element: <ProductsPage />,
          },
          {
            path: 'admin/categories',
            element: <CategoriesPage />,
          },
          {
            path: 'admin/customers',
            element: (
              <div className="card card-p">
                <h3>Khách hàng</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang quản lý khách hàng đang được xây dựng.</p>
              </div>
            ),
          },
          {
            path: 'admin/staffs',
            element: (
              <div className="card card-p">
                <h3>Nhân viên</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang quản lý nhân viên đang được xây dựng.</p>
              </div>
            ),
          },
          {
            path: 'admin/reviews',
            element: (
              <div className="card card-p">
                <h3>Đánh giá</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang quản lý đánh giá đang được xây dựng.</p>
              </div>
            ),
          },
          {
            path: 'admin/vouchers',
            element: (
              <div className="card card-p">
                <h3>Khuyến mãi</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang quản lý khuyến mãi đang được xây dựng.</p>
              </div>
            ),
          },
          {
            path: 'admin/banners',
            element: (
              <div className="card card-p">
                <h3>Banner</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang quản lý banner đang được xây dựng.</p>
              </div>
            ),
          },
          {
            path: 'admin/settings',
            element: (
              <div className="card card-p">
                <h3>Cấu hình hệ thống</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Trang cấu hình hệ thống đang được xây dựng.</p>
              </div>
            ),
          },
        ],
      },
    ],
  },
]);
