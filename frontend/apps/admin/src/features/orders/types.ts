export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';

export type OrderFilterTab = 'ALL' | OrderStatus;

export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'STRIPE';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface OrderItem {
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryItem {
  status: OrderStatus;
  createdAt: string;
  note?: string | null;
}

export interface PackageInfo {
  id: number;
  code: string;
  status: 'UNASSIGNED' | 'DELIVERING' | 'COMPLETED';
  staffId?: number | null;
  staffName?: string | null;
}

export interface AdminOrder {
  id: number;
  orderCode: string;
  userId: number;
  customer: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  itemCount: number;
  voucherProduct?: string | null;
  voucherShipping?: string | null;
  subtotalAmount: number;
  discountAmount: number;
  discountShippingAmount: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string | null;
  createdAt: string;
  history: OrderHistoryItem[];
  packageInfo?: PackageInfo | null;
  txn?: string | null;
}
