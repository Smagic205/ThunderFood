import { axiosClient } from './axiosClient';

export interface VoucherClientResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  voucherType: 'PRODUCT' | 'SHIPPING';
  discountType: 'PERCENT' | 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  remainingUses: number | null;
  eligible: boolean;
  ineligibleReason: string | null;
}

export interface VoucherCheckRequest {
  code: string;
  subtotalAmount?: number;
  shippingFee?: number;
}

export interface VoucherCheckResponse {
  valid: boolean;
  message: string;
  voucherType: 'PRODUCT' | 'SHIPPING';
  discountAmount: number;
  finalSubtotal: number;
  finalShippingFee: number;
  voucher: VoucherClientResponse;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const voucherApi = {
  /**
   * GET /api/v1/vouchers/available
   * Lấy danh sách mã giảm giá đang có hiệu lực cho khách hàng
   */
  getAvailableVouchers: async (currentSubtotal?: number): Promise<VoucherClientResponse[]> => {
    const params = currentSubtotal !== undefined ? { currentSubtotal } : {};
    const res = await axiosClient.get<ApiResponse<VoucherClientResponse[]>>('/v1/vouchers/available', { params });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải danh sách voucher');
    }
    return res.data.data || [];
  },

  /**
   * POST /api/v1/vouchers/check
   * Kiểm tra tính hợp lệ và tính toán số tiền giảm giá của voucher
   */
  checkVoucher: async (request: VoucherCheckRequest): Promise<VoucherCheckResponse> => {
    const res = await axiosClient.post<ApiResponse<VoucherCheckResponse>>('/v1/vouchers/check', request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Mã giảm giá không hợp lệ');
    }
    return res.data.data;
  },
};

