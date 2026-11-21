import { axiosClient } from './axiosClient';
import type { Banner } from '@/shared/types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const bannerApi = {
  /**
   * GET /api/v1/banners
   * Lấy danh sách banner quảng cáo đang hoạt động để hiển thị trang chủ cho khách hàng
   */
  getActiveBanners: async (): Promise<Banner[]> => {
    const response = await axiosClient.get<ApiResponse<Banner[]>>('/v1/banners');

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải danh sách banner');
    }

    return response.data.data;
  },
};
