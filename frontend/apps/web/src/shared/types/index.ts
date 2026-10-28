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

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  categoryName?: string;
  categoryId?: number;
  price: number;
  discountPrice?: number;
  originalPrice?: number | null;
  rating?: number;
  avgRating?: number;
  ratingAverage?: number;
  soldCount?: number;
  soldCountDisplay?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  images?: string[];
  isBestSeller?: boolean;
  stockQuantity?: number;
  isAvailable?: boolean;
  reviewCount?: number;
  isFavorite?: boolean;
  cartQuantity?: number;
  canPurchase?: boolean;
}

export interface ProductListItem extends Partial<Product> {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number | null;
  ratingAverage?: number;
  soldCount?: number;
  soldCountDisplay?: string;
  thumbnailUrl?: string;
  isFavorite?: boolean;
  cartQuantity?: number;
  canPurchase?: boolean;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  badges?: string[];
  images?: Array<{ url: string; isMain: boolean }>;
  ratingAverage?: number;
  reviewCount?: number;
  soldCount?: number;
  soldCountDisplay?: string;
  price: number;
  originalPrice?: number | null;
  shortDescription?: string | null;
  description?: string;
  stockStatus?: {
    code: string;
    label: string;
  };
  delivery?: {
    estimateMinutes: number;
    freeShipThreshold: number;
  };
  highlights?: string[];
  details?: {
    prepTime?: string;
    consumeWithin?: string;
    kitchenAddress?: string;
    allergens?: string;
  };
  isFavorite?: boolean;
  cartQuantity?: number;
  canPurchase?: boolean;
}

export interface Review {
  id: number;
  productId: number;
  userId?: number;
  userName: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  createdAt: string;
  adminReply?: string;
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string | null;
  authProvider?: 'LOCAL' | 'GOOGLE' | string;
  providerId?: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER';
  status: 'ACTIVE' | 'LOCKED' | string;
  createdAt?: string;
  updatedAt?: string;
}

