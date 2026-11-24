import { axiosClient } from '@/shared/api/axiosClient';
import type { DeliveryPackage } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const packagesApi = {
  getPackages: async (): Promise<DeliveryPackage[]> => {
    const res = await axiosClient.get<ApiResponse<DeliveryPackage[]>>('/admin/packages');
    if (!res.data?.success || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách gói hàng');
    }
    return res.data.data;
  },

  getPackageByCode: async (code: string): Promise<DeliveryPackage | null> => {
    const res = await axiosClient.get<ApiResponse<DeliveryPackage>>(`/admin/packages/${encodeURIComponent(code)}`);
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || 'Không tìm thấy gói hàng');
    }
    return res.data.data;
  },
};
