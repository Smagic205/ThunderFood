import { axiosClient } from '@/shared/api/axiosClient';
import type { SystemSetting, ServiceWard, ServiceWardFilterParams } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const settingsApi = {
  getAllSettings: async (): Promise<SystemSetting[]> => {
    const res = await axiosClient.get<ApiResponse<SystemSetting[]>>('/admin/settings');
    if (!res.data?.success || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || 'Không thể tải cấu hình hệ thống');
    }
    return res.data.data;
  },

  updateSettings: async (settingsMap: Record<string, string>): Promise<SystemSetting[]> => {
    const res = await axiosClient.put<ApiResponse<SystemSetting[]>>('/admin/settings', { settings: settingsMap });
    if (!res.data?.success || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || 'Không thể lưu cấu hình hệ thống');
    }
    return res.data.data;
  },

  getDistricts: async (): Promise<string[]> => {
    const res = await axiosClient.get<ApiResponse<string[]>>('/admin/wards/districts');
    if (!res.data?.success || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách quận/huyện');
    }
    return res.data.data;
  },

  getWards: async (params: ServiceWardFilterParams = {}) => {
    const res = await axiosClient.get<ApiResponse<{
      content: ServiceWard[];
      totalElements: number;
      totalPages: number;
      pageNumber: number;
    }>>('/admin/wards', {
      params: {
        district: params.district && params.district !== 'ALL' ? params.district : undefined,
        keyword: params.keyword || undefined,
        isActive: params.isActive !== undefined ? params.isActive : undefined,
        page: params.page ?? 0,
        size: params.size ?? 15,
      },
    });
    const data = res.data?.data;
    if (!res.data?.success || !data || !Array.isArray(data.content)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách phường/xã');
    }
    return data;
  },

  updateShippingFee: async (id: number, shippingFee: number): Promise<ServiceWard> => {
    const res = await axiosClient.put<ApiResponse<ServiceWard>>(`/admin/wards/${id}/shipping-fee`, { shippingFee });
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không thể cập nhật phí giao hàng');
    return res.data.data;
  },

  toggleWardActive: async (id: number): Promise<ServiceWard> => {
    const res = await axiosClient.patch<ApiResponse<ServiceWard>>(`/admin/wards/${id}/toggle-active`);
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không thể đổi trạng thái phường/xã');
    return res.data.data;
  },
};
