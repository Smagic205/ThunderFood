import { axiosClient } from '@/shared/api/axiosClient';
import type { StaffAccount, CreateStaffPayload } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const staffsApi = {
  getAllStaffs: async (): Promise<StaffAccount[]> => {
    const res = await axiosClient.get<ApiResponse<StaffAccount[]>>('/admin/staffs');
    if (!res.data?.success || !Array.isArray(res.data?.data)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách nhân viên');
    }
    return res.data.data;
  },

  createStaff: async (payload: CreateStaffPayload): Promise<StaffAccount> => {
    const res = await axiosClient.post<ApiResponse<StaffAccount>>('/admin/staffs', payload);
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || 'Không thể tạo tài khoản nhân viên');
    }
    return res.data.data;
  },

  updateStaffStatus: async (id: number, status: 'ACTIVE' | 'LOCKED'): Promise<void> => {
    await axiosClient.patch(`/admin/users/${id}/status`, { status });
  },

  updateStaffRole: async (id: number, role: 'STAFF' | 'ADMIN'): Promise<void> => {
    await axiosClient.patch(`/admin/users/${id}/role`, { role });
  },
};
