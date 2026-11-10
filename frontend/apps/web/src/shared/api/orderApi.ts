import { axiosClient } from './axiosClient';
import type { VoucherClientResponse } from './voucherApi';
import type { CartItemResponse } from './cartApi';
import type { CustomerAddress } from './addressApi';

export interface CheckoutPreviewRequest {
  addressId: number;
  productVoucherCode?: string;
  shippingVoucherCode?: string;
}

export interface CheckoutPreviewResponse {
  subtotalAmount: number;
  discountAmount: number;
  originalShippingFee: number;
  thresholdShippingDiscount: number;
  voucherShippingDiscount: number;
  finalShippingFee: number;
  totalAmount: number;
  isFreeShippingByThreshold: boolean;
  freeShippingThreshold: number;
  amountNeededForFreeShip: number;
  productVoucher: VoucherClientResponse | null;
  shippingVoucher: VoucherClientResponse | null;
  items: CartItemResponse[];
  shippingAddress: CustomerAddress;
}

export interface PlaceOrderRequest {
  addressId: number;
  productVoucherCode?: string;
  shippingVoucherCode?: string;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'STRIPE' | string;
  note?: string;
}

export interface OrderItemResponse {
  id?: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  quantity: number;
  productPrice: number;
  lineTotal: number;
  /** Optional compatibility aliases used by older API responses. */
  thumbnailUrl?: string | null;
  unitPrice?: number;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  createdAt: string;
  deliveredAt: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | string;
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  subtotalAmount: number;
  discountAmount: number;
  originalShippingFee: number;
  shippingFee: number;
  totalAmount: number;
  productVoucher: VoucherClientResponse | null;
  shippingVoucher: VoucherClientResponse | null;
  items: OrderItemResponse[];
}

export interface OrderListResponse {
  id: number;
  orderCode: string;
  createdAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | string;
  paymentMethod: string;
  paymentStatus: string;
  totalItems: number;
  totalAmount: number;
  previewItems: OrderItemResponse[];
}

export interface OrderStatusHistoryResponse {
  id: number;
  status: string;
  note: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface OrderTrackingResponse {
  orderId: number;
  orderCode: string;
  currentStatus: string;
  createdAt: string;
  deliveredAt: string | null;
  shipperName: string | null;
  shipperPhone: string | null;
  timeline: OrderStatusHistoryResponse[];
}

export interface CancelOrderRequest {
  reason: string;
}

export interface OrderPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderPageResponse {
  content: OrderListResponse[];
  pagination: OrderPagination;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const orderApi = {
  /**
   * POST /api/v1/orders/checkout/preview
   * Xem trước chi phí checkout (phí ship, freeship, chiết khấu voucher)
   */
  previewCheckout: async (request: CheckoutPreviewRequest): Promise<CheckoutPreviewResponse> => {
    const res = await axiosClient.post<ApiResponse<CheckoutPreviewResponse>>('/v1/orders/checkout/preview', request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tính toán chi phí thanh toán');
    }
    return res.data.data;
  },

  /**
   * POST /api/v1/orders/checkout
   * Đặt hàng chính thức từ giỏ hàng hiện tại
   */
  placeOrder: async (request: PlaceOrderRequest): Promise<OrderResponse> => {
    const res = await axiosClient.post<ApiResponse<OrderResponse>>('/v1/orders/checkout', request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đặt hàng, vui lòng thử lại');
    }
    return res.data.data;
  },

  /**
   * GET /api/v1/orders
   * Lấy danh sách lịch sử đơn hàng của người dùng
   */
  getMyOrders: async (params?: { status?: string; page?: number; size?: number }): Promise<OrderPageResponse> => {
    const res = await axiosClient.get<ApiResponse<OrderPageResponse>>('/v1/orders', { params });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải lịch sử đơn hàng');
    }
    return res.data.data;
  },

  /**
   * GET /api/v1/orders/{id}
   * Lấy chi tiết đơn hàng
   */
  getOrderDetail: async (id: number): Promise<OrderResponse> => {
    const res = await axiosClient.get<ApiResponse<OrderResponse>>(`/v1/orders/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể lấy thông tin chi tiết đơn hàng');
    }
    return res.data.data;
  },

  /**
   * GET /api/v1/orders/{id}/tracking
   * Theo dõi tiến trình timeline và shipper
   */
  getOrderTracking: async (id: number): Promise<OrderTrackingResponse> => {
    const res = await axiosClient.get<ApiResponse<OrderTrackingResponse>>(`/v1/orders/${id}/tracking`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải thông tin theo dõi đơn hàng');
    }
    return res.data.data;
  },

  /**
   * POST /api/v1/orders/{id}/cancel
   * Hủy đơn hàng (khi đơn còn ở trạng thái PENDING)
   */
  cancelOrder: async (id: number, request: CancelOrderRequest): Promise<OrderResponse> => {
    const res = await axiosClient.post<ApiResponse<OrderResponse>>(`/v1/orders/${id}/cancel`, request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể hủy đơn hàng');
    }
    return res.data.data;
  },
};

