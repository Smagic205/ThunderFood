import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import { useForbiddenNoticeStore } from '@/shared/stores/forbiddenNoticeStore';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
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

      // Nếu đang dùng tài khoản Demo (token giả lập), không gọi refresh-token và không logout
      if (currentRefreshToken?.startsWith('demo-') || store.accessToken?.startsWith('demo-')) {
        return Promise.reject(error);
      }

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

    if (error.response?.status === 403) {
      useForbiddenNoticeStore.getState().showForbidden(
        error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này'
      );
    }

    return Promise.reject(error);
  }
);
