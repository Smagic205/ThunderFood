import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore, type User } from '@/app/store/authStore';
import { PrivateRoute } from '@/shared/components/layout/PrivateRoute';
import { RoleRoute } from '@/shared/components/layout/RoleRoute';

const setAuthenticatedUser = (role: User['role']) => {
  useAuthStore.setState({
    user: { id: 1, email: 'user@example.com', name: 'Test User', role },
    accessToken: 'access-token',
    isAuthenticated: true,
    isHydrating: false,
  });
};

const renderProtectedRoute = (guard: ReactNode, path = '/protected') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Trang đăng nhập</p>} />
        <Route element={guard}>
          <Route path="/protected" element={<p>Nội dung riêng tư</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('customer portal route guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
  });

  it('redirects guests to login on private routes', () => {
    renderProtectedRoute(<PrivateRoute />);
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('does not treat an authenticated session without a user as private access', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderProtectedRoute(<PrivateRoute />);
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('redirects an inconsistent session without a user', () => {
    useAuthStore.setState({ isAuthenticated: true });
    renderProtectedRoute(<RoleRoute allowedRoles={['CUSTOMER']} />);
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('allows an authenticated user through a private route', () => {
    setAuthenticatedUser('CUSTOMER');
    renderProtectedRoute(<PrivateRoute />);
    expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument();
  });

  it('allows a customer through a customer-only route', () => {
    setAuthenticatedUser('CUSTOMER');
    renderProtectedRoute(<RoleRoute allowedRoles={['CUSTOMER']} />);
    expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument();
  });

  it('redirects a different role from a customer-only route', () => {
    setAuthenticatedUser('ADMIN');
    renderProtectedRoute(<RoleRoute allowedRoles={['CUSTOMER']} />);
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });
});
