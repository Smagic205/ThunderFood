import axios from 'axios';
import { createCsrfCoordinator, extractRateLimitMessage, isMutatingHttpMethod } from '@thunderfood/api';
import { useAuthStore } from '@/app/store/authStore';
import { useToastStore } from '@/shared/stores/toastStore';

export const LOCKED_ACCOUNT_NOTICE_KEY = 'thunderfood_locked_account_notice';

const baseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const csrfCoordinator = createCsrfCoordinator({
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

export const ensureCsrfToken = (forceRefresh = false) => csrfCoordinator.ensureToken(forceRefresh);

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Đính kèm Access Token (RAM) & CSRF Token (Double-Submit)
axiosClient.interceptors.request.use(
  async (config) => {
    config.withCredentials = true;

    const token = useAuthStore.getState().accessToken;
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

// Keep track of refresh promise to prevent multiple simultaneous calls
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

    // Tự động lấy lại CSRF token mới và thử lại 1 lần nếu CSRF cookie/memory bị lệch
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

    // Bỏ qua các URL auth (login, register, refresh, forgot, reset) vì 401 ở đây là do sai thông tin chứ không phải token hết hạn
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
              { rememberMe: store.rememberSession },
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
        store.login(data.user, data.token, store.rememberSession);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Chuẩn hóa error.message từ ApiResponse phía backend nếu có (400, 404, 409, 500,...)
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    // Xử lý lỗi 403 Forbidden (không có quyền truy cập dữ liệu người khác hoặc chức năng bị cấm)
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Bạn không có quyền thực hiện thao tác này';
      const isLockedError = message.toLowerCase().includes('khóa') || error.response?.data?.code === 'ACCOUNT_LOCKED';

      if (isLockedError && !isAuthRoute) {
        try {
          sessionStorage.setItem(LOCKED_ACCOUNT_NOTICE_KEY, message);
        } catch {
          // Bỏ qua lỗi storage nếu trình duyệt chặn
        }
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        } else {
          useToastStore.getState().showToast(message, 'error');
        }
        return Promise.reject(error);
      }

      if (!isAuthRoute) {
        useToastStore.getState().showToast(message, 'error');
      }
    }

    // Xử lý mã lỗi Rate Limit (HTTP 429 Too Many Requests)
    const rateLimitMsg = extractRateLimitMessage(error);
    if (rateLimitMsg) {
      error.message = rateLimitMsg;
      useToastStore.getState().showToast(rateLimitMsg, 'error');
    }

    return Promise.reject(error);
  }
);
