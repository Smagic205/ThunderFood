import { axiosClient } from '@/shared/api/axiosClient';
import type { AdminOrder } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const ordersApi = {
  getOrders: async (): Promise<AdminOrder[]> => {
    const response = await axiosClient.get<ApiResponse<AdminOrder[]>>('/admin/orders');
    if (!response.data?.success || !Array.isArray(response.data?.data)) {
      throw new Error(response.data?.message || 'Không thể tải danh sách đơn hàng');
    }
    return response.data.data;
  },

  getOrderByCode: async (orderCode: string): Promise<AdminOrder | null> => {
    const response = await axiosClient.get<ApiResponse<AdminOrder>>(`/admin/orders/${encodeURIComponent(orderCode)}`);
    if (!response.data?.success || !response.data?.data) {
      throw new Error(response.data?.message || 'Không tìm thấy đơn hàng');
    }
    return response.data.data;
  },
};
