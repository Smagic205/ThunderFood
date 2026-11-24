import { axiosClient } from '@/shared/api/axiosClient';
import type { VoucherAdmin, VoucherPayload, VoucherPageResponse, GetVouchersParams } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const vouchersApi = {
  getVouchers: async (params?: GetVouchersParams): Promise<VoucherPageResponse> => {
    const queryParams = {
      page: params?.page ?? 0,
      size: params?.size ?? 10,
      keyword: params?.keyword?.trim() || undefined,
      voucherType: params?.voucherType && params.voucherType !== 'ALL' ? params.voucherType : undefined,
      status: params?.status && params.status !== 'ALL' ? params.status : undefined,
      sortBy: params?.sortBy,
      direction: params?.direction,
    };
    const res = await axiosClient.get<ApiResponse<VoucherPageResponse>>('/admin/vouchers', { params: queryParams });
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || 'Không thể tải danh sách voucher');
    }
    return res.data.data;
  },

  getVoucherById: async (id: number): Promise<VoucherAdmin> => {
    const res = await axiosClient.get<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}`);
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không tìm thấy voucher');
    return res.data.data;
  },

  createVoucher: async (payload: VoucherPayload): Promise<VoucherAdmin> => {
    const res = await axiosClient.post<ApiResponse<VoucherAdmin>>('/admin/vouchers', payload);
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không thể tạo voucher');
    return res.data.data;
  },

  updateVoucher: async (id: number, payload: VoucherPayload): Promise<VoucherAdmin> => {
    const res = await axiosClient.put<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}`, payload);
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không thể cập nhật voucher');
    return res.data.data;
  },

  toggleStatus: async (id: number): Promise<VoucherAdmin> => {
    const res = await axiosClient.patch<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}/toggle-status`);
    if (!res.data?.success || !res.data?.data) throw new Error(res.data?.message || 'Không thể đổi trạng thái voucher');
    return res.data.data;
  },

  deleteVoucher: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/admin/vouchers/${id}`);
    return {
      success: res.data?.success ?? true,
      message: res.data?.message || 'Đã xóa voucher thành công',
    };
  },
};
