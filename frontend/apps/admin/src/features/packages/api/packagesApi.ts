import { axiosClient } from '@/shared/api/axiosClient';
import type { DeliveryPackage } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GetAdminPackagesParams {
  startDate?: string;
  endDate?: string;
}

export const packagesApi = {
  getPackages: async (params: GetAdminPackagesParams = {}): Promise<DeliveryPackage[]> => {
    const cleanParams: Record<string, string> = {};
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;

    const res = await axiosClient.get<ApiResponse<DeliveryPackage[]>>('/admin/packages', {
      params: cleanParams,
    });
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
