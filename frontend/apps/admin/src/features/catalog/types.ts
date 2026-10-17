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
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  art: string;
  tint: string;
  description: string;
  isAvailable: boolean;
  createdAt: string;
  imgs: string[];
}

export type ProductStockFilter = 'all' | 'in' | 'out' | 'hidden';
