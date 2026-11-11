import type { PageResponse } from '@/shared/types';
import { axiosClient } from './axiosClient';

export interface ProductReview {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  orderId: number | null;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  isHidden: boolean;
  staffReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface CreateReviewRequest {
  productId: number;
  orderId: number;
  rating: number;
  comment?: string;
  imageUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const reviewApi = {
  getProductReviews: async (productId: number, page = 0, size = 10): Promise<PageResponse<ProductReview>> => {
    const response = await axiosClient.get<ApiResponse<PageResponse<ProductReview>>>(
      `/v1/reviews/product/${productId}`,
      { params: { page, size } },
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải đánh giá sản phẩm');
    }
    return response.data.data;
  },

  createReview: async (request: CreateReviewRequest): Promise<ProductReview> => {
    const response = await axiosClient.post<ApiResponse<ProductReview>>('/v1/reviews', request);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể gửi đánh giá');
    }
    return response.data.data;
  },
};
