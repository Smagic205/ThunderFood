import axios from 'axios';
import { createCsrfCoordinator, extractRateLimitMessage, isMutatingHttpMethod } from '@thunderfood/api';
import { useAuthStore } from '@/app/store/authStore';
import { useForbiddenNoticeStore } from '@/shared/stores/forbiddenNoticeStore';

export const LOCKED_ACCOUNT_NOTICE_KEY = 'thunderfood_admin_locked_notice';

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:8080/api/v1';
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/v1') ? clean : `${clean}/v1`;
};

const baseURL = getBaseUrl();

const csrfCoordinator = createCsrfCoordinator({
  fetchToken: async () => {
    const res = await axios.get<{ data?: { token?: string } }>(`${baseURL}/auth/csrf`, {
      withCredentials: true,
    });
    const headerToken = res.headers?.['x-csrf-token'] || res.headers?.['X-CSRF-TOKEN'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
    return res.data?.data?.token || null;
  },
});

export const ensureCsrfToken = (forceRefresh = false) => csrfCoordinator.ensureToken(forceRefresh);

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Đính kèm Access Token (RAM) & CSRF Token
axiosClient.interceptors.request.use(
  async (config) => {
    config.withCredentials = true;

    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const url = config.url || '';
    if (isMutatingHttpMethod(config.method) && !url.includes('/auth/csrf')) {
      const csrfToken = await csrfCoordinator.ensureToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Tránh gọi refresh nhiều lần cùng lúc
let refreshTokenPromise: Promise<{ token: string; user: any }> | null = null;

// Interceptor Response: Xử lý 401 refresh qua HttpOnly Cookie, 403 CSRF/khóa tài khoản & 429 Rate Limit
axiosClient.interceptors.response.use(
  (response) => {
    csrfCoordinator.captureFromHeaders(response.headers as Record<string, unknown>);
    return response;
  },
  async (error) => {
    csrfCoordinator.captureFromHeaders(error.response?.headers as Record<string, unknown>);
    const originalRequest = error.config;

    if (
      error.response?.status === 403 &&
      error.response?.data?.data === 'CSRF_INVALID' &&
      originalRequest &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      const freshCsrf = await csrfCoordinator.ensureToken(true);
      if (freshCsrf) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['X-XSRF-TOKEN'] = freshCsrf;
        return axiosClient(originalRequest);
      }
    }

    // Bỏ qua các URL auth vì 401 ở đây là do sai thông tin chứ không phải token hết hạn
    const isAuthRoute = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      const store = useAuthStore.getState();
      if (!store.isAuthenticated) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = (async () => {
            const csrfToken = await csrfCoordinator.ensureToken();
            const res = await axios.post<{ data: { token: string; user: any } }>(
              `${baseURL}/auth/refresh-token`,
              { rememberMe: false },
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                  ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
              }
            );
            csrfCoordinator.captureFromHeaders(res.headers as Record<string, unknown>);
            return res.data.data;
          })().finally(() => {
            refreshTokenPromise = null;
          });
        }

        const data = await refreshTokenPromise;
        store.login(data.user, data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này';
      const isLockedError =
        message.toLowerCase().includes('khóa') || error.response?.data?.code === 'ACCOUNT_LOCKED';

      if (isLockedError && !isAuthRoute) {
        try {
          sessionStorage.setItem(LOCKED_ACCOUNT_NOTICE_KEY, message);
        } catch {
          // ignore storage errors
        }
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      useForbiddenNoticeStore.getState().showForbidden(message);
    }

    const rateLimitMsg = extractRateLimitMessage(error);
    if (rateLimitMsg) {
      error.message = rateLimitMsg;
      useForbiddenNoticeStore.getState().showForbidden(rateLimitMsg);
    }

    return Promise.reject(error);
  }
);
