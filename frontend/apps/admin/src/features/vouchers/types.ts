export type VoucherType = 'PRODUCT' | 'SHIPPING';
export type DiscountType = 'PERCENT' | 'FIXED_AMOUNT';
export type VoucherStatus = 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DEPLETED' | 'INACTIVE';

export interface VoucherAdmin {
  id: number;
  code: string;
  name: string;
  description: string | null;
  voucherType: VoucherType;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: VoucherStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherPayload {
  code: string;
  name: string;
  description?: string;
  voucherType: VoucherType;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface VoucherPagination {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface VoucherPageResponse {
  content: VoucherAdmin[];
  pagination: VoucherPagination;
}

export interface GetVouchersParams {
  keyword?: string;
  voucherType?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

