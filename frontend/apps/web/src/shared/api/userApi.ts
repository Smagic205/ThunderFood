import { axiosClient } from './axiosClient';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Khớp CustomerProfileResponse của backend */
export interface CustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  authProvider: string;
  status: string;
  createdAt: string | null; // "yyyy-MM-dd HH:mm:ss"
  updatedAt: string | null;
}

/** Khớp UpdateCustomerProfileRequest của backend */
export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
  avatarUrl?: string | null;
}

export const userApi = {
  /**
   * GET /api/v1/users/profile
   * Lấy thông tin hồ sơ của người dùng hiện tại (yêu cầu đăng nhập)
   */
  getProfile: async (): Promise<CustomerProfile> => {
    const res = await axiosClient.get<ApiResponse<CustomerProfile>>('/v1/users/profile');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải thông tin hồ sơ');
    }
    return res.data.data;
  },

  /**
   * PUT /api/v1/users/profile
   * Cập nhật thông tin: fullName, phone, avatarUrl (email cố định — không thay đổi)
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<CustomerProfile> => {
    const res = await axiosClient.put<ApiResponse<CustomerProfile>>('/v1/users/profile', payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể cập nhật thông tin hồ sơ');
    }
    return res.data.data;
  },

  /**
   * POST /api/v1/users/profile/avatar
   * Tải ảnh đại diện lên Cloudinary và cập nhật avatarUrl của người dùng
   */
  uploadAvatar: async (file: File): Promise<CustomerProfile> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosClient.post<ApiResponse<CustomerProfile>>('/v1/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải lên ảnh đại diện');
    }
    return res.data.data;
  },
};
