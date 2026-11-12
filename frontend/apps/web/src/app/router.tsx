import { UserLayout } from '@/shared/components/layout/UserLayout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { RoleRoute } from '@/shared/components/layout/RoleRoute';
import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '../pages/HomePage';
import { MenuPage } from '../pages/MenuPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { VouchersPage } from '../pages/VouchersPage';
import { SupportPage } from '../pages/SupportPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPage } from '../pages/auth/ForgotPage';

import { AccountLayout } from '../pages/account/AccountLayout';
import { AddressesPage } from '../pages/account/AddressesPage';
import { ProfilePage } from '../pages/account/ProfilePage';
import { OrdersPage } from '../pages/account/OrdersPage';
import { PaymentsPage } from '../pages/account/Placeholders';
import { WishlistPage } from '../pages/account/WishlistPage';
import { NotificationsPage } from '../pages/account/NotificationsPage';
import { Navigate } from 'react-router-dom';

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
      }
    ]
  }
]);
