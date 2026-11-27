import axios from 'axios';
import { createCsrfCoordinator, extractRateLimitMessage, isMutatingHttpMethod } from '@thunderfood/api';
import { useAuthStore } from '../../features/auth/store/authStore';
import { useForbiddenNoticeStore } from '../stores/forbiddenNoticeStore';

export const LOCKED_ACCOUNT_NOTICE_KEY = 'thunderfood_staff_locked_notice';

export const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/v1\/?$/, '');
  }
  return 'http://localhost:8080/api';
};

const baseURL = getBaseApiUrl();

export const csrfCoordinator = createCsrfCoordinator({
  fetchToken: async () => {
    const res = await axios.get<{ data?: { token?: string } }>(`${baseURL}/v1/auth/csrf`, {
      withCredentials: true,
    });
    const headerToken = res.headers?.['x-csrf-token'] || res.headers?.['X-CSRF-TOKEN'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
    return res.data?.data?.token || null;
  },
});

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  async (config) => {
    config.withCredentials = true;

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const url = config.url || '';
    if (isMutatingHttpMethod(config.method) && !url.includes('/v1/auth/csrf')) {
      const csrfToken = await csrfCoordinator.ensureToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let refreshTokenPromise: Promise<{ token: string; user: any }> | null = null;

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

    const isAuthRoute = originalRequest?.url?.includes('/v1/auth/');

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
              `${baseURL}/v1/auth/refresh-token`,
              {},
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
        if (data.user.role !== 'STAFF') throw new Error('Not a staff');
        store.setAuth(data.user, data.token);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
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
