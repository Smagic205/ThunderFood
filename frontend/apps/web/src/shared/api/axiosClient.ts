import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { authApi } from './authApi';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
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

// Keep track of refresh promise to prevent multiple simultaneous calls
let refreshTokenPromise: Promise<any> | null = null;

// Interceptor Response: Xử lý lỗi chung (vd: 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bỏ qua các URL auth (login, register, refresh, forgot, reset) vì 401 ở đây là do sai thông tin chứ không phải token hết hạn
    const isAuthRoute = originalRequest.url?.includes('/v1/auth/');

    // Tránh loop vô hạn nếu api refresh token bị lỗi 401
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
          refreshTokenPromise = authApi.refreshToken(currentRefreshToken);
        }

        const data = await refreshTokenPromise;
        store.login(data.user, data.token, data.refreshToken);
        
        // Gắn lại token mới cho request cũ
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosClient(originalRequest);
        
      } catch (refreshError) {
        // Lỗi refresh -> phải login lại
        store.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        refreshTokenPromise = null;
      }
    }

    // Xử lý lỗi 403 Forbidden (không có quyền truy cập dữ liệu người khác hoặc chức năng bị cấm)
    if (error.response?.status === 403) {
      const message = error.response.data?.message || 'Bạn không có quyền thực hiện thao tác này';
      useToastStore.getState().showToast(message, 'error');
    }

    return Promise.reject(error);
  }
);
