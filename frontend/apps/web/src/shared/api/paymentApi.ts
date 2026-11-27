import { axiosClient } from './axiosClient';
import { isSafeUrl } from '@/shared/utils/security';

export interface SepayPaymentInfo {
  orderId: number;
  orderCode: string;
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  qrImageUrl: string;
  paymentStatus: string;
  orderStatus: string;
  sandboxMode: boolean;
  transactionCode: string | null;
  paidAt: string | null;
}

export interface PaymentStatusInfo {
  orderId: number;
  orderCode: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  amount: number;
  transactionCode: string | null;
  paidAt: string | null;
}

export interface PaymentHistoryItem {
  id: number;
  orderId: number | null;
  orderCode: string | null;
  provider: string;
  transactionCode: string | null;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentHistoryPage {
  content: PaymentHistoryItem[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SepayGatewayCheckout {
  orderId: number;
  orderCode: string;
  amount: number;
  checkoutUrl: string;
  fields: Record<string, string>;
  sandboxMode: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const paymentApi = {
  getSepayInfo: async (orderId: number): Promise<SepayPaymentInfo> => {
    const res = await axiosClient.get<ApiResponse<SepayPaymentInfo>>(`/v1/payments/sepay/order/${orderId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể lấy thông tin thanh toán SePay');
    }
    return res.data.data;
  },

  initGatewayCheckout: async (orderId: number, returnOrigin?: string): Promise<SepayGatewayCheckout> => {
    const res = await axiosClient.post<ApiResponse<SepayGatewayCheckout>>(
      `/v1/payments/sepay/gateway/checkout/${orderId}`,
      null,
      { params: returnOrigin ? { returnOrigin } : undefined }
    );
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể khởi tạo cổng thanh toán SePay');
    }
    return res.data.data;
  },

  verifyGatewayOrder: async (orderId: number): Promise<PaymentStatusInfo> => {
    const res = await axiosClient.post<ApiResponse<PaymentStatusInfo>>(`/v1/payments/sepay/gateway/verify/${orderId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đối soát trạng thái thanh toán SePay');
    }
    return res.data.data;
  },

  submitSepayCheckoutForm: (checkoutUrl: string, fields: Record<string, string>) => {
    if (!isSafeUrl(checkoutUrl, { allowRelative: false })) {
      throw new Error('URL cổng thanh toán không hợp lệ');
    }
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = checkoutUrl;
    form.style.display = 'none';

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value ?? '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  },

  getOrderPaymentStatus: async (orderId: number): Promise<PaymentStatusInfo> => {
    const res = await axiosClient.get<ApiResponse<PaymentStatusInfo>>(`/v1/payments/order/${orderId}/status`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể kiểm tra trạng thái thanh toán');
    }
    return res.data.data;
  },

  simulateSandboxPayment: async (orderId: number): Promise<PaymentStatusInfo> => {
    const res = await axiosClient.post<ApiResponse<PaymentStatusInfo>>(`/v1/payments/sepay/sandbox/simulate/${orderId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể mô phỏng thanh toán Sandbox');
    }
    return res.data.data;
  },

  getMyPayments: async (params?: { page?: number; size?: number }): Promise<PaymentHistoryPage> => {
    const res = await axiosClient.get<ApiResponse<PaymentHistoryPage>>('/v1/payments/my', { params });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải lịch sử giao dịch');
    }
    return res.data.data;
  },
};
