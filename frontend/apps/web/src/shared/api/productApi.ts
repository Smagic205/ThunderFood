import { axiosClient } from './axiosClient';
import type { PageResponse, ProductDetail, ProductListItem } from '@/shared/types';

export interface GetProductsParams {
  page?: number;
  size?: number;
  categoryId?: number;
  categorySlug?: string;
  category?: string;
  keyword?: string;
  /** Khoảng giá được backend hỗ trợ: lt50 | m100 | m200 | gt200 */
  priceRange?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Khoảng sao được backend hỗ trợ: above4 | 3to4 | under3 */
  ratingRange?: string;
  minRating?: number;
  maxRating?: number;
  /** Chỉ lấy món có giảm giá */
  hasDiscount?: boolean;
  /** Chỉ lấy món bán chạy (soldCount >= 100) */
  bestSeller?: boolean;
  minSoldCount?: number;
  /** bestSelling | soldCountAsc | soldCountDesc | rating | priceAsc | priceDesc | newest | discountDesc */
  sort?: 'bestSelling' | 'soldCountAsc' | 'soldCountDesc' | 'rating' | 'priceAsc' | 'priceDesc' | 'newest' | 'discountDesc';
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const productApi = {
  getProducts: async (params?: GetProductsParams): Promise<PageResponse<ProductListItem>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<ProductListItem>>>('/v1/products', {
      params,
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải danh sách sản phẩm');
    }

    return response.data.data;
  },

  getProductBySlug: async (slug: string): Promise<ProductDetail> => {
    const response = await axiosClient.get<ApiResponse<ProductDetail>>(`/v1/products/slug/${slug}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải chi tiết sản phẩm');
    }

    return response.data.data;
  },

  getProductById: async (id: number | string): Promise<ProductDetail> => {
    const response = await axiosClient.get<ApiResponse<ProductDetail>>(`/v1/products/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải chi tiết sản phẩm');
    }

    return response.data.data;
  },

  getProductsByCategorySlug: async (
    categorySlug: string,
    params?: Omit<GetProductsParams, 'categoryId' | 'categorySlug' | 'category'>
  ): Promise<PageResponse<ProductListItem>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<ProductListItem>>>(
      `/v1/products/category/${categorySlug}`,
      { params }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải sản phẩm theo danh mục');
    }

    return response.data.data;
  },
};
