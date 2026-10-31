import axios from 'axios';

export interface StaffUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
}

export interface StaffAuthResponse {
  token: string;
  refreshToken: string;
  user: StaffUser;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Keep auth calls outside axiosClient so a failed refresh cannot recurse through its interceptor.
const authAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await authAxios.post<ApiResponse<StaffAuthResponse>>('/v1/auth/staff/login', credentials);
    return res.data;
  },
  register: async (data: { fullName: string; email: string; phone: string; password: string }) => {
    const res = await authAxios.post<ApiResponse<StaffAuthResponse>>('/v1/auth/staff/register', data);
    return res.data;
  },
  refreshToken: async (refreshToken: string) => {
    const res = await authAxios.post<ApiResponse<StaffAuthResponse>>('/v1/auth/refresh-token', {
      refreshToken,
    });
    return res.data;
  },
  logout: async (refreshToken: string): Promise<void> => {
    await authAxios.post<ApiResponse<null>>('/v1/auth/logout', {
      refreshToken,
    }, { timeout: 5000 });
  }
};
