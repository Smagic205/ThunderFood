import { axiosClient } from '@/shared/api/axiosClient';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const bannersApi = {
  getAllBanners: async (): Promise<BannerItem[]> => {
    const res = await axiosClient.get<ApiResponse<BannerItem[]>>('/admin/banners');
    if (!res.data?.success || !Array.isArray(res.data.data)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách banner');
    }
    return res.data.data;
  },

  getBannerById: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.get<ApiResponse<BannerItem>>(`/admin/banners/${id}`);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không tìm thấy banner');
    return res.data.data;
  },

  createBanner: async (payload: CreateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.post<ApiResponse<BannerItem>>('/admin/banners', payload);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể tạo banner');
    return res.data.data;
  },

  updateBanner: async (id: number, payload: UpdateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.put<ApiResponse<BannerItem>>(`/admin/banners/${id}`, payload);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể cập nhật banner');
    return res.data.data;
  },

  toggleActive: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.patch<ApiResponse<BannerItem>>(`/admin/banners/${id}/toggle-active`);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể đổi trạng thái banner');
    return res.data.data;
  },

  deleteBanner: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/banners/${id}`);
  },
};
