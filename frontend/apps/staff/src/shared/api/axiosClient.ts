import axios from 'axios';
import { useAuthStore } from '../../features/auth/store/authStore';
import { authApi, type ApiResponse, type StaffAuthResponse } from '../../features/auth/api/auth';
import { useForbiddenNoticeStore } from '../stores/forbiddenNoticeStore';

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshTokenPromise: Promise<ApiResponse<StaffAuthResponse>> | null = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes('/v1/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      const store = useAuthStore.getState();

      // Demo sessions do not have backend-issued refresh tokens.
      if (store.token === 'mock_token') {
        return Promise.reject(error);
      }

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

        const response = await refreshTokenPromise;
        const data = response.data;
        if (data.user.role !== 'STAFF') throw new Error('Not a staff');
        store.setAuth(data.user, data.token, data.refreshToken);

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
