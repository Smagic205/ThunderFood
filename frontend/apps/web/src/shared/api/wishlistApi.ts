import type { PageResponse } from '@/shared/types';
import { axiosClient } from './axiosClient';

export interface WishlistProduct {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  categoryName: string | null;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  avgRating: number;
  soldCount: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface WishlistToggleResponse {
  productId: number;
  isWishlist: boolean;
  message: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const wishlistApi = {
  getPage: async (page = 0, size = 12): Promise<PageResponse<WishlistProduct>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<WishlistProduct>>>('/v1/wishlists', {
      params: { page, size },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải danh sách món yêu thích');
    }
    return response.data.data;
  },

  getAll: async (): Promise<WishlistProduct[]> => {
    const firstPage = await wishlistApi.getPage(0, 100);
    const items = [...firstPage.content];
    for (let page = 1; page < firstPage.pagination.totalPages; page += 1) {
      const nextPage = await wishlistApi.getPage(page, 100);
      items.push(...nextPage.content);
    }
    return items;
  },

  toggle: async (productId: number): Promise<WishlistToggleResponse> => {
    const response = await axiosClient.post<ApiResponse<WishlistToggleResponse>>(`/v1/wishlists/toggle/${productId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể cập nhật món yêu thích');
    }
    return response.data.data;
  },

  remove: async (productId: number): Promise<void> => {
    const response = await axiosClient.delete<ApiResponse<void>>(`/v1/wishlists/${productId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể xóa món khỏi danh sách yêu thích');
    }
  },
};
