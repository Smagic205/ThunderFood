import axios from 'axios';
import { isMutatingHttpMethod } from '@thunderfood/api';
import { csrfCoordinator, getBaseApiUrl } from '../../../shared/api/axiosClient';

export interface StaffUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export interface StaffAuthResponse {
  token: string;
  refreshToken?: string | null;
  user: StaffUser;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Keep auth calls outside axiosClient so a failed refresh cannot recurse through its 401 interceptor.
const authAxios = axios.create({
  baseURL: getBaseApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

authAxios.interceptors.request.use(async (config) => {
  config.withCredentials = true;
  if (isMutatingHttpMethod(config.method)) {
    const csrfToken = await csrfCoordinator.ensureToken();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});

authAxios.interceptors.response.use(
  (res) => {
    csrfCoordinator.captureFromHeaders(res.headers as Record<string, unknown>);
    return res;
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
        return authAxios(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await authAxios.post<ApiResponse<StaffAuthResponse>>('/v1/auth/staff/login', credentials);
    return res.data;
  },
  refreshToken: async () => {
    const res = await authAxios.post<ApiResponse<StaffAuthResponse>>('/v1/auth/refresh-token', {});
    return res.data;
  },
  logout: async (): Promise<void> => {
    await authAxios.post<ApiResponse<null>>('/v1/auth/logout', {}, { timeout: 5000 });
  },
  forgotPassword: async (email: string) => {
    const res = await authAxios.post<ApiResponse<string>>('/v1/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const res = await authAxios.post<ApiResponse<string>>('/v1/auth/reset-password', data);
    return res.data;
  },
};
