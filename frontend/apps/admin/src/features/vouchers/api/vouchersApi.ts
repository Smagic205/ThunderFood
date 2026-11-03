import { axiosClient } from '@/shared/api/axiosClient';
import type { 
  VoucherAdmin, 
  VoucherPayload, 
  VoucherPageResponse, 
  GetVouchersParams 
} from '../types';

export const INITIAL_MOCK_VOUCHERS: VoucherAdmin[] = [
  {
    id: 1,
    code: 'THUNDER50',
    name: 'Giảm 50k đơn đầu tiên',
    description: 'Áp dụng cho mọi khách hàng mới đặt món qua ThunderFood',
    voucherType: 'PRODUCT',
    discountType: 'FIXED_AMOUNT',
    discountValue: 50000,
    minOrderAmount: 150000,
    maxDiscountAmount: null,
    usageLimit: 200,
    usageLimitPerUser: 1,
    usedCount: 42,
    startDate: '2026-10-01T00:00:00',
    endDate: '2026-12-31T23:59:59',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00',
  },
  {
    id: 2,
    code: 'FREESHIP25',
    name: 'Miễn phí giao hàng 25k',
    description: 'Miễn phí giao hàng tới các quận nội thành',
    voucherType: 'SHIPPING',
    discountType: 'FIXED_AMOUNT',
    discountValue: 25000,
    minOrderAmount: 100000,
    maxDiscountAmount: null,
    usageLimit: 500,
    usageLimitPerUser: 3,
    usedCount: 188,
    startDate: '2026-10-15T00:00:00',
    endDate: '2026-11-30T23:59:59',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2026-10-15T10:00:00',
  },
  {
    id: 3,
    code: 'WEEKEND15',
    name: 'Giảm 15% cuối tuần',
    description: 'Thưởng thức bữa tiệc cuối tuần cùng bạn bè và gia đình',
    voucherType: 'PRODUCT',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderAmount: 200000,
    maxDiscountAmount: 40000,
    usageLimit: 100,
    usageLimitPerUser: 1,
    usedCount: 95,
    startDate: '2026-10-20T00:00:00',
    endDate: '2026-11-15T23:59:59',
    isActive: true,
    status: 'ACTIVE',
    createdAt: '2026-10-20T14:00:00',
  },
];

let memoryVouchers = [...INITIAL_MOCK_VOUCHERS];

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const vouchersApi = {
  getVouchers: async (params?: GetVouchersParams): Promise<VoucherPageResponse> => {
    const page = params?.page ?? 0;
    const size = params?.size ?? 10;
    const queryParams: Record<string, any> = {
      page,
      size,
    };
    if (params?.keyword?.trim()) queryParams.keyword = params.keyword.trim();
    if (params?.voucherType && params.voucherType !== 'ALL') queryParams.voucherType = params.voucherType;
    if (params?.status && params.status !== 'ALL') queryParams.status = params.status;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.direction) queryParams.direction = params.direction;

    try {
      const res = await axiosClient.get<ApiResponse<VoucherPageResponse>>('/admin/vouchers', { params: queryParams });
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback mock nếu server đang offline
    }

    let filtered = [...memoryVouchers];
    if (params?.keyword?.trim()) {
      const q = params.keyword.trim().toLowerCase();
      filtered = filtered.filter((v) => v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q));
    }
    if (params?.voucherType && params.voucherType !== 'ALL') {
      filtered = filtered.filter((v) => v.voucherType === params.voucherType);
    }
    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((v) => v.status === params.status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      pagination: {
        page,
        size,
        totalElements,
        totalPages,
        hasNext: page + 1 < totalPages,
        hasPrevious: page > 0,
      },
    };
  },

  getVoucherById: async (id: number): Promise<VoucherAdmin> => {
    try {
      const res = await axiosClient.get<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}`);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
    } catch {
      // Fallback
    }

    const found = memoryVouchers.find((v) => v.id === id);
    if (!found) throw new Error(`Không tìm thấy voucher ID ${id}`);
    return found;
  },

  createVoucher: async (payload: VoucherPayload): Promise<VoucherAdmin> => {
    try {
      const res = await axiosClient.post<ApiResponse<VoucherAdmin>>('/admin/vouchers', payload);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Không thể tạo voucher');
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // Offline fallback
      const newV: VoucherAdmin = {
        id: Date.now(),
        ...payload,
        description: payload.description || null,
        maxDiscountAmount: payload.maxDiscountAmount || null,
        minOrderAmount: payload.minOrderAmount || 0,
        usageLimit: payload.usageLimit || null,
        usageLimitPerUser: payload.usageLimitPerUser || 1,
        usedCount: 0,
        isActive: payload.isActive ?? true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };
      memoryVouchers.unshift(newV);
      return newV;
    }
  },

  updateVoucher: async (id: number, payload: VoucherPayload): Promise<VoucherAdmin> => {
    try {
      const res = await axiosClient.put<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}`, payload);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Không thể cập nhật voucher');
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // Offline fallback
      const idx = memoryVouchers.findIndex((v) => v.id === id);
      if (idx !== -1) {
        memoryVouchers[idx] = {
          ...memoryVouchers[idx],
          ...payload,
          description: payload.description || null,
          maxDiscountAmount: payload.maxDiscountAmount || null,
          minOrderAmount: payload.minOrderAmount || 0,
          usageLimit: payload.usageLimit || null,
          usageLimitPerUser: payload.usageLimitPerUser || 1,
          updatedAt: new Date().toISOString(),
        };
        return memoryVouchers[idx];
      }
      throw new Error('Không tìm thấy voucher để cập nhật');
    }
  },

  toggleStatus: async (id: number): Promise<VoucherAdmin> => {
    try {
      const res = await axiosClient.patch<ApiResponse<VoucherAdmin>>(`/admin/vouchers/${id}/toggle-status`);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Không thể đổi trạng thái voucher');
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      // Fallback
      const v = memoryVouchers.find((item) => item.id === id);
      if (v) {
        v.isActive = !v.isActive;
        v.status = v.isActive ? 'ACTIVE' : 'INACTIVE';
        return { ...v };
      }
      throw new Error('Không tìm thấy voucher');
    }
  },

  deleteVoucher: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await axiosClient.delete<ApiResponse<void>>(`/admin/vouchers/${id}`);
      return {
        success: res.data?.success ?? true,
        message: res.data?.message || 'Đã xóa voucher thành công',
      };
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      memoryVouchers = memoryVouchers.filter((v) => v.id !== id);
      return { success: true, message: 'Đã xóa voucher khỏi bộ nhớ' };
    }
  },
};

