import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/app/store/authStore';

const user = {
  id: 7,
  email: 'khach@example.com',
  name: 'Nguyễn Văn An',
  role: 'CUSTOMER' as const,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    localStorage.clear();
  });

  it('normalizes user fields and persists a successful login', () => {
    useAuthStore.getState().login(user, 'access-token', 'refresh-token');

    expect(useAuthStore.getState()).toMatchObject({
      user: {
        ...user,
        fullName: user.name,
        phone: '',
        authProvider: 'LOCAL',
        status: 'ACTIVE',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
    });
    expect(JSON.parse(localStorage.getItem('thunderfood-auth') || '{}').state.isAuthenticated).toBe(true);
  });

  it('keeps name and fullName in sync when updating the profile', () => {
    useAuthStore.getState().login(user, 'access-token', 'refresh-token');
    useAuthStore.getState().updateUser({ fullName: 'Nguyễn An' });

    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Nguyễn An',
      fullName: 'Nguyễn An',
    });
  });

  it('clears the active session on logout', () => {
    useAuthStore.getState().login(user, 'access-token', 'refresh-token');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    expect(JSON.parse(localStorage.getItem('thunderfood-auth') || '{}').state).toMatchObject({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });
});
