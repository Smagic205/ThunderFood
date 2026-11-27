import { axiosClient, ensureCsrfToken } from './axiosClient';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  avatarUrl: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string | null;
  user: User;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export const authApi = {
  ensureCsrf: ensureCsrfToken,

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    // Admin luôn dùng phiên tạm thời (session cookie), không lưu cookie dài hạn qua lần đóng trình duyệt
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      ...data,
      rememberMe: false,
    });
    return response.data.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', {
      rememberMe: false,
    });
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post<ApiResponse<null>>('/auth/logout', {}, { timeout: 5000 });
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/auth/forgot-password', { email });
    return response.data.message;
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/auth/reset-password', data);
    return response.data.message;
  },
};
