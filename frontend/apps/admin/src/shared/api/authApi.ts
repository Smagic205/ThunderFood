import { axiosClient } from './axiosClient';

// === Interfaces bám sát entity Backend ===

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  avatarUrl: string | null;
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

// === Auth API functions ===

export const authApi = {
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await axiosClient.post<ApiResponse<null>>('/auth/logout', {
      refreshToken,
    }, { timeout: 5000 });
  },
};
