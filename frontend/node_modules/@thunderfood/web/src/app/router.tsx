import { UserLayout } from '@/shared/components/layout/UserLayout';
import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '../pages/HomePage';
import { MenuPage } from '../pages/MenuPage';

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
        element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Chi tiết món ăn (Đang phát triển)</div>,
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
        path: 'cart',
        element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Giỏ hàng (Đang phát triển)</div>,
      },
      {
        path: 'account/*',
        element: <div className="container mx-auto p-12 text-center text-xl font-bold text-[#12183A]">Trang Tài khoản (Đang phát triển)</div>,
      },
    ],
  },
  {
    path: '/login',
    element: <div className="flex h-screen items-center justify-center text-2xl font-bold text-[#12183A]">Trang Đăng nhập (Đang phát triển)</div>,
  }
]);
