import { axiosClient } from '@/shared/api/axiosClient';

export interface ReviewResponse {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  orderId: number;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  isHidden: boolean;
  staffReply: string | null;
  repliedByStaffId: number | null;
  repliedByStaffName: string | null;
  repliedAt: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ReviewPage {
  content: ReviewResponse[];
  pagination: PaginationInfo;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const staffReviewApi = {
  getPage: async (page = 0, size = 15): Promise<ReviewPage> => {
    const response = await axiosClient.get<ApiResponse<ReviewPage>>('/v1/staff/reviews', {
      params: { page, size },
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải đánh giá');
    }
    return response.data.data;
  },

  reply: async (reviewId: number, reply: string): Promise<ReviewResponse> => {
    const response = await axiosClient.post<ApiResponse<ReviewResponse>>(
      `/v1/staff/reviews/${reviewId}/reply`,
      { reply },
    );
    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể gửi phản hồi');
    }
    return response.data.data;
  },
};
