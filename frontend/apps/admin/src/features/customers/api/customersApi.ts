import { axiosClient } from '@/shared/api/axiosClient';
import type { UserAdminItem, UserFilterParams, UserRole, UserStatus } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const customersApi = {
  getAllUsers: async (params: UserFilterParams = {}) => {
    const res = await axiosClient.get<ApiResponse<{
      content: UserAdminItem[];
      totalElements: number;
      totalPages: number;
      pageNumber: number;
    }>>('/admin/users', {
      params: {
        keyword: params.keyword || undefined,
        role: params.role && params.role !== 'ALL' ? params.role : undefined,
        status: params.status && params.status !== 'ALL' ? params.status : undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.sortBy ?? 'createdAt',
        direction: params.direction ?? 'desc',
      },
    });

    const data = res.data?.data;
    if (!res.data?.success || !data || !Array.isArray(data.content)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách khách hàng');
    }
    return data;
  },

  getUserDetail: async (id: number): Promise<UserAdminItem> => {
    const res = await axiosClient.get<ApiResponse<UserAdminItem>>(`/admin/users/${id}`);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không tìm thấy khách hàng');
    return res.data.data;
  },

  updateUserStatus: async (id: number, status: UserStatus): Promise<UserAdminItem> => {
    const res = await axiosClient.patch<ApiResponse<UserAdminItem>>(`/admin/users/${id}/status`, { status });
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể cập nhật trạng thái khách hàng');
    return res.data.data;
  },

  updateUserRole: async (id: number, role: UserRole): Promise<UserAdminItem> => {
    const res = await axiosClient.patch<ApiResponse<UserAdminItem>>(`/admin/users/${id}/role`, { role });
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể cập nhật quyền khách hàng');
    return res.data.data;
  },
};
