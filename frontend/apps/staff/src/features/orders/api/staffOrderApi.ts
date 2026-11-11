import { axiosClient } from '@/shared/api/axiosClient';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pagination: PaginationInfo;
}

export interface StaffOrderListItem {
  id: number;
  orderCode: string;
  createdAt: string;
  customerName: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  wardName: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: string;
  totalItems: number;
  totalAmount: number;
  packageCode: string | null;
}

export interface OrderItemDetail {
  id?: number;
  productId: number;
  productName: string;
  productSlug?: string;
  productCode?: string;
  imageUrl?: string;
  productThumbnail?: string;
  productPrice?: number;
  price?: number;
  quantity: number;
  lineTotal?: number;
  totalPrice?: number;
}

export interface OrderStatusHistoryItem {
  id?: number;
  status: string;
  note?: string;
  createdAt: string;
  changedBy?: string;
  createdBy?: string;
}

export interface VoucherDetail {
  id: number;
  code: string;
  name: string;
  description?: string;
  voucherType: 'PRODUCT' | 'SHIPPING';
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
}

export interface StaffOrderDetail {
  id: number;
  orderCode: string;
  createdAt: string;
  deliveredAt: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;

  customerId: number | null;
  customerName: string | null;
  customerEmail: string | null;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  wardName: string | null;

  subtotalAmount: number;
  discountAmount: number;
  originalShippingFee: number;
  shippingFee: number;
  totalAmount: number;

  packageId: number | null;
  packageCode: string | null;

  productVoucher: VoucherDetail | null;
  shippingVoucher: VoucherDetail | null;

  items: OrderItemDetail[];
  history: OrderStatusHistoryItem[];
}

export interface DeliveryPackage {
  id: number;
  packageName: string;
  status: 'PENDING' | 'DELIVERING' | 'COMPLETED';
  maxOrders: number;
  currentOrdersCount: number;
  shippedByStaffId: number | null;
  shippedByStaffName: string | null;
  shippedByStaffPhone: string | null;
  createdAt: string;
  completedAt: string | null;
  orderCodes: string[];
}

export interface GetStaffOrdersParams {
  status?: string;
  ward?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface ConfirmOrderPayload {
  packageName: string;
  isNewPackage?: boolean;
}

export interface CancelOrderPayload {
  reason: string;
}

export const staffOrderApi = {
  getOrders: async (params: GetStaffOrdersParams = {}): Promise<PageResponse<StaffOrderListItem>> => {
    const cleanParams: Record<string, any> = {};
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params.ward && params.ward !== 'ALL') cleanParams.ward = params.ward;
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();
    if (params.page !== undefined) cleanParams.page = params.page;
    if (params.size !== undefined) cleanParams.size = params.size;

    const res = await axiosClient.get<ApiResponse<PageResponse<StaffOrderListItem>>>('/v1/staff/orders', {
      params: cleanParams,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải danh sách đơn hàng');
    }
    return res.data.data;
  },

  getOrderDetail: async (id: number): Promise<StaffOrderDetail> => {
    const res = await axiosClient.get<ApiResponse<StaffOrderDetail>>(`/v1/staff/orders/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải chi tiết đơn hàng');
    }
    return res.data.data;
  },

  confirmOrder: async (id: number, payload: ConfirmOrderPayload): Promise<StaffOrderDetail> => {
    const res = await axiosClient.post<ApiResponse<StaffOrderDetail>>(`/v1/staff/orders/${id}/confirm`, payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể xác nhận đơn hàng');
    }
    return res.data.data;
  },

  cancelOrder: async (id: number, payload: CancelOrderPayload): Promise<StaffOrderDetail> => {
    const res = await axiosClient.post<ApiResponse<StaffOrderDetail>>(`/v1/staff/orders/${id}/cancel`, payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể hủy đơn hàng');
    }
    return res.data.data;
  },

  getOpenPackages: async (): Promise<DeliveryPackage[]> => {
    const res = await axiosClient.get<ApiResponse<DeliveryPackage[]>>('/v1/staff/orders/packages/open');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải danh sách gói hàng đang mở');
    }
    return res.data.data;
  },

  claimPackage: async (packageId: number): Promise<DeliveryPackage> => {
    const res = await axiosClient.post<ApiResponse<DeliveryPackage>>(
      `/v1/staff/orders/packages/${packageId}/claim`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể nhận gói hàng');
    }
    return res.data.data;
  },

  getMyHeldPackage: async (): Promise<DeliveryPackage | null> => {
    const res = await axiosClient.get<ApiResponse<DeliveryPackage | null>>(
      '/v1/staff/orders/packages/my-held',
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải gói hàng đang giao');
    }
    return res.data.data;
  },

  getPackageOrders: async (packageId: number): Promise<StaffOrderListItem[]> => {
    const res = await axiosClient.get<ApiResponse<StaffOrderListItem[]>>(
      `/v1/staff/orders/packages/${packageId}/orders`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải danh sách đơn trong gói');
    }
    return res.data.data;
  },

  deliverOrder: async (orderId: number): Promise<StaffOrderDetail> => {
    const res = await axiosClient.post<ApiResponse<StaffOrderDetail>>(
      `/v1/staff/orders/${orderId}/deliver`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể xác nhận giao đơn hàng');
    }
    return res.data.data;
  },

  failDelivery: async (orderId: number, reason: string): Promise<StaffOrderDetail> => {
    const res = await axiosClient.post<ApiResponse<StaffOrderDetail>>(
      `/v1/staff/orders/${orderId}/fail`,
      { reason },
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể ghi nhận giao hàng thất bại');
    }
    return res.data.data;
  },
};

