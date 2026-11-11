import { axiosClient } from '@/shared/api/axiosClient';

export interface AdminReview {
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

export interface AdminReviewPage {
  content: AdminReview[];
  pagination: PaginationInfo;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const reviewsApi = {
  getPage: async (page = 0, size = 15): Promise<AdminReviewPage> => {
    const response = await axiosClient.get<ApiResponse<AdminReviewPage>>('/staff/reviews', {
      params: { page, size },
    });
    if (!response.data.success) throw new Error(response.data.message || 'Không thể tải đánh giá');
    return response.data.data;
  },

  reply: async (reviewId: number, reply: string): Promise<AdminReview> => {
    const response = await axiosClient.post<ApiResponse<AdminReview>>(`/staff/reviews/${reviewId}/reply`, { reply });
    if (!response.data.success) throw new Error(response.data.message || 'Không thể gửi phản hồi');
    return response.data.data;
  },

  setHidden: async (reviewId: number, isHidden: boolean): Promise<AdminReview> => {
    const response = await axiosClient.patch<ApiResponse<AdminReview>>(
      `/staff/reviews/${reviewId}/hide`,
      null,
      { params: { isHidden } },
    );
    if (!response.data.success) throw new Error(response.data.message || 'Không thể cập nhật trạng thái đánh giá');
    return response.data.data;
  },
};
