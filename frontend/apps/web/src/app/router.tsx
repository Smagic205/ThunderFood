import { UserLayout } from '@/shared/components/layout/UserLayout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { RoleRoute } from '@/shared/components/layout/RoleRoute';
import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '../pages/HomePage';
import { MenuPage } from '../pages/MenuPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPage } from '../pages/auth/ForgotPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <UserLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
      {
        path: 'product/:id',
        element: <ProductDetailPage />,
      },
      {
        path: 'vouchers',
        element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Ưu đãi (Đang phát triển)</div>,
      },
      {
        path: 'support',
        element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Hỗ trợ (Đang phát triển)</div>,
      },
      {
        element: <RoleRoute allowedRoles={['CUSTOMER']} />,
        children: [
          {
            path: 'cart',
            element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Giỏ hàng (Đang phát triển)</div>,
          },
          {
            path: 'account/*',
            element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Tài khoản (Đang phát triển)</div>,
          },
        ]
      }
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot',
        element: <ForgotPage />,
      }
    ]
  }
]);
