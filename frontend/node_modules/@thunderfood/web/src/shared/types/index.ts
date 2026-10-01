export interface Banner {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
  style?: string; // e.g. for custom gradient styles
}

export interface Voucher {
  id: number;
  code: string;
  description: string;
  discountValue: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  categoryName?: string;
  categoryId?: number;
  price: number;
  discountPrice?: number;
  rating?: number;
  avgRating?: number;
  soldCount?: number;
  imageUrl: string;
  isBestSeller?: boolean;
  stockQuantity?: number;
  isAvailable?: boolean;
}
