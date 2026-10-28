import { axiosClient } from './axiosClient';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export const authApi = {
  login: async (data: any): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/v1/auth/login', data);
    return response.data.data;
  },
  
  register: async (data: any): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/v1/auth/register', data);
    return response.data.data;
  },
  
  forgotPassword: async (email: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/v1/auth/forgot-password', { email });
    return response.data.message;
  },
  
  resetPassword: async (data: any): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<string>>('/v1/auth/reset-password', data);
    return response.data.message;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/v1/auth/refresh-token', { refreshToken });
    return response.data.data;
  }
};
