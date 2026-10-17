import { axiosClient } from './axiosClient';
import type { Category } from '@/shared/types';

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const categoryApi = {
  getActiveCategories: async (): Promise<Category[]> => {
    const response = await axiosClient.get<ApiResponse<ApiCategory[]>>('/v1/categories');

    if (!response.data.success) {
      throw new Error(response.data.message || 'Không thể tải danh mục');
    }

    // Backend endpoint chỉ trả về danh mục đang hoạt động.
    return response.data.data.map((category) => ({
      ...category,
      description: category.description ?? '',
      isActive: true,
    }));
  },
};
