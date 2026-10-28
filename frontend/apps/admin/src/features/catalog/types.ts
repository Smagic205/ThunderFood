export interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  art: string;
  tint: string;
  description: string;
  productCount?: number;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  soldCount: number;
  soldCountDisplay?: string;
  avgRating: number;
  reviewCount: number;
  art?: string;
  tint?: string;
  description: string;
  isAvailable: boolean;
  createdAt?: string;
  imgs: string[];
  thumbnailUrl?: string;
}

export type ProductStockFilter = 'all' | 'in' | 'out' | 'hidden';

export interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProductPageResponse {
  content: Product[];
  pagination: PaginationInfo;
}

export interface GetProductsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  keyword?: string;
  sort?: string;
}

