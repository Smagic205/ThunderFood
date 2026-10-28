import { axiosClient } from './axiosClient';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ServiceWard {
  id: number;
  wardName: string;
  type: string;
  displayName: string;
  shippingFee: number;
  isActive: boolean;
}

export const addressApi = {
  getServiceWards: async (): Promise<ServiceWard[]> => {
    const response = await axiosClient.get<ApiResponse<ServiceWard[]>>('/v1/addresses/wards');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải khu vực giao hàng');
    }
    return response.data.data;
  },
};
