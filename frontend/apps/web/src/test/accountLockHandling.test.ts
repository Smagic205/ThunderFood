import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { axiosClient, LOCKED_ACCOUNT_NOTICE_KEY } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/app/store/authStore';

describe('Xử lý thông báo tài khoản bị khóa (HTTP 403)', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/account/profile', href: 'http://localhost/account/profile' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('lưu thông báo khóa vào sessionStorage trước khi chuyển về /login cho request đã đăng nhập', async () => {
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');
    server.use(
      http.get('*/v1/users/profile', () =>
        HttpResponse.json(
          { success: false, message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên.' },
          { status: 403 }
        )
      )
    );

    await expect(axiosClient.get('/v1/users/profile')).rejects.toThrow(
      'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
    );

    expect(logoutSpy).toHaveBeenCalled();
    expect(sessionStorage.getItem(LOCKED_ACCOUNT_NOTICE_KEY)).toBe(
      'Tài khoản của bạn đã bị khóa bởi quản trị viên.'
    );
    expect(window.location.href).toBe('/login');
  });

  it('không reload sang /login khi lỗi 403 khóa tài khoản xảy ra ở API đăng nhập (/v1/auth/)', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, pathname: '/login', href: 'http://localhost/login' },
    });
    const logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout');
    server.use(
      http.post('*/v1/auth/login', () =>
        HttpResponse.json(
          { success: false, message: 'Tài khoản đã bị khóa' },
          { status: 403 }
        )
      )
    );

    await expect(axiosClient.post('/v1/auth/login', { email: 'a@b.com', password: '123' })).rejects.toThrow(
      'Tài khoản đã bị khóa'
    );

    expect(logoutSpy).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(LOCKED_ACCOUNT_NOTICE_KEY)).toBeNull();
    expect(window.location.href).toBe('http://localhost/login');
  });
});
