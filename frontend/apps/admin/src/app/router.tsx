import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminRoute } from '@/shared/components/layout/AdminRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';

import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';
import { PackagesPage } from '@/features/packages/pages/PackagesPage';
import { ProductsPage } from '@/features/catalog/pages/ProductsPage';
import { CategoriesPage } from '@/features/catalog/pages/CategoriesPage';
import { VouchersPage } from '@/features/vouchers/pages/VouchersPage';
import { StaffsPage } from '@/features/staffs/pages/StaffsPage';
import { ReviewsPage } from '@/features/reviews/pages/ReviewsPage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { CustomersPage } from '@/features/customers/pages/CustomersPage';
import { BannersPage } from '@/features/banners/pages/BannersPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

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
            element: <CustomersPage />,
          },
          {
            path: 'admin/staffs',
            element: <StaffsPage />,
          },
          {
            path: 'admin/reviews',
            element: <ReviewsPage />,
          },
          {
            path: 'admin/notifications',
            element: <NotificationsPage />,
          },
          {
            path: 'admin/vouchers',
            element: <VouchersPage />,
          },
          {
            path: 'admin/banners',
            element: <BannersPage />,
          },
          {
            path: 'admin/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);
