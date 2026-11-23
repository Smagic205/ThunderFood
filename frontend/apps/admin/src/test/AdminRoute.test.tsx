import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminRoute } from '@/shared/components/layout/AdminRoute';
import { useAuthStore } from '@/app/store/authStore';

const renderAdminRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/login" element={<p>Đăng nhập quản trị</p>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<p>Bảng điều khiển</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('AdminRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it('redirects an unauthenticated visitor to the admin login page', () => {
    renderAdminRoute();

    expect(screen.getByText('Đăng nhập quản trị')).toBeInTheDocument();
  });

  it('rejects an authenticated customer', () => {
    useAuthStore.setState({
      user: { id: 1, email: 'customer@example.com', fullName: 'Customer', role: 'CUSTOMER', avatarUrl: null },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });
    renderAdminRoute();

    expect(screen.getByText('Đăng nhập quản trị')).toBeInTheDocument();
  });

  it('rejects a session marked authenticated when no user is present', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderAdminRoute();

    expect(screen.getByText('Đăng nhập quản trị')).toBeInTheDocument();
  });

  it('allows an authenticated administrator', () => {
    useAuthStore.setState({
      user: { id: 2, email: 'admin@example.com', fullName: 'Admin', role: 'ADMIN', avatarUrl: null },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });
    renderAdminRoute();

    expect(screen.getByText('Bảng điều khiển')).toBeInTheDocument();
  });
});
