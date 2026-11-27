import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import { useForbiddenNoticeStore } from '@/shared/stores/forbiddenNoticeStore';

export const LOCKED_ACCOUNT_NOTICE_KEY = 'thunderfood_admin_locked_notice';

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:8080/api/v1';
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/v1') ? clean : `${clean}/v1`;
};

export const axiosClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Gắn token vào header
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tránh gọi refresh nhiều lần cùng lúc
let refreshTokenPromise: Promise<any> | null = null;

// Interceptor Response: Xử lý 401 Unauthorized ("Đón lõng")
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bỏ qua các URL auth vì 401 ở đây là do sai thông tin chứ không phải token hết hạn
    const isAuthRoute = originalRequest.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      const store = useAuthStore.getState();
      const currentRefreshToken = store.refreshToken;

      if (!currentRefreshToken) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        if (!refreshTokenPromise) {
          // Gọi trực tiếp axios (không qua axiosClient) để tránh circular dependency
          refreshTokenPromise = axios
            .post(`${axiosClient.defaults.baseURL}/auth/refresh-token`, {
              refreshToken: currentRefreshToken,
            })
            .then((res) => res.data.data);
        }

        const data = await refreshTokenPromise;
        store.login(data.user, data.token, data.refreshToken);

        // Gắn lại token mới cho request cũ
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        store.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        refreshTokenPromise = null;
      }
    }

    // Chuẩn hóa error.message từ ApiResponse phía backend nếu có (400, 404, 409, 500,...)
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

    return Promise.reject(error);
  }
);
