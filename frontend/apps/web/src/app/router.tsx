import { lazy } from 'react';
import { UserLayout } from '@/shared/components/layout/UserLayout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { RoleRoute } from '@/shared/components/layout/RoleRoute';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Nạp động các trang chính (Code-splitting & Lazy loading cho Cloudflare CDN)
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const MenuPage = lazy(() => import('../pages/MenuPage').then((m) => ({ default: m.MenuPage })));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('../pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const VouchersPage = lazy(() => import('../pages/VouchersPage').then((m) => ({ default: m.VouchersPage })));
const SupportPage = lazy(() => import('../pages/SupportPage').then((m) => ({ default: m.SupportPage })));
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPage = lazy(() => import('../pages/auth/ForgotPage').then((m) => ({ default: m.ForgotPage })));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));

// Nạp động các trang tài khoản người dùng
const AccountLayout = lazy(() => import('../pages/account/AccountLayout').then((m) => ({ default: m.AccountLayout })));
const AddressesPage = lazy(() => import('../pages/account/AddressesPage').then((m) => ({ default: m.AddressesPage })));
const ProfilePage = lazy(() => import('../pages/account/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const OrdersPage = lazy(() => import('../pages/account/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const PaymentsPage = lazy(() => import('../pages/account/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const WishlistPage = lazy(() => import('../pages/account/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const NotificationsPage = lazy(() => import('../pages/account/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));

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
        path: 'product/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'vouchers',
        element: <VouchersPage />,
      },
      {
        path: 'support',
        element: <SupportPage />,
      },
      {
        element: <RoleRoute allowedRoles={['CUSTOMER']} />,
        children: [
          {
            path: 'cart',
            element: <CartPage />,
          },
          {
            path: 'checkout',
            element: <CheckoutPage />,
          },
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="profile" replace />,
              },
              {
                path: 'profile',
                element: <ProfilePage />,
              },
              {
                path: 'addresses',
                element: <AddressesPage />,
              },
              {
                path: 'orders',
                element: <OrdersPage />,
              },
              {
                path: 'payments',
                element: <PaymentsPage />,
              },
              {
                path: 'wishlist',
                element: <WishlistPage />,
              },
              {
                path: 'notifications',
                element: <NotificationsPage />,
              },
            ],
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
      },
      {
        path: '/verify-email',
        element: <VerifyEmailPage />,
      }
    ]
  }
]);
