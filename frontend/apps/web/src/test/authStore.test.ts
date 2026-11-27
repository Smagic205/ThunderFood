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
      isAuthenticated: false,
      rememberSession: true,
      isHydrating: false,
    });
    localStorage.clear();
  });

  it('normalizes user fields, keeps tokens in memory only, and stores non-sensitive session flag', () => {
    useAuthStore.getState().login(user, 'access-token', true);

    expect(useAuthStore.getState()).toMatchObject({
      user: {
        ...user,
        fullName: user.name,
        phone: '',
        authProvider: 'LOCAL',
        status: 'ACTIVE',
      },
      accessToken: 'access-token',
      isAuthenticated: true,
      rememberSession: true,
    });

    const persisted = JSON.parse(localStorage.getItem('thunderfood-auth') || '{}');
    expect(persisted.state).toEqual({
      isAuthenticated: true,
      rememberSession: true,
    });
    expect(persisted.state.accessToken).toBeUndefined();
    expect(persisted.state.refreshToken).toBeUndefined();
    expect(persisted.state.user).toBeUndefined();
  });

  it('keeps name and fullName in sync when updating the profile', () => {
    useAuthStore.getState().login(user, 'access-token');
    useAuthStore.getState().updateUser({ fullName: 'Nguyễn An' });

    expect(useAuthStore.getState().user).toMatchObject({
      name: 'Nguyễn An',
      fullName: 'Nguyễn An',
    });
  });

  it('clears the active session on logout', () => {
    useAuthStore.getState().login(user, 'access-token');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
    expect(JSON.parse(localStorage.getItem('thunderfood-auth') || '{}').state).toMatchObject({
      isAuthenticated: false,
    });
  });
});
