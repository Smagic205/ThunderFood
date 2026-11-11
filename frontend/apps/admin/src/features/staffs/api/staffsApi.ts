import { axiosClient } from '@/shared/api/axiosClient';
import type { StaffAccount, CreateStaffPayload } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const INITIAL_MOCK_STAFFS: StaffAccount[] = [
  {
    id: 1,
    email: 'staff.hoang@thunderfood.vn',
    fullName: 'Hoàng Minh Tuấn',
    phone: '0912345678',
    role: 'STAFF',
    status: 'ACTIVE',
    avatarUrl: null,
    createdAt: '2026-10-10T08:30:00',
  },
  {
    id: 2,
    email: 'staff.lan@thunderfood.vn',
    fullName: 'Nguyễn Thị Ngọc Lan',
    phone: '0987654321',
    role: 'STAFF',
    status: 'ACTIVE',
    avatarUrl: null,
    createdAt: '2026-10-15T09:15:00',
  },
  {
    id: 3,
    email: 'staff.duc@thunderfood.vn',
    fullName: 'Trần Đức Anh',
    phone: '0901234567',
    role: 'STAFF',
    status: 'ACTIVE',
    avatarUrl: null,
    createdAt: '2026-10-20T14:00:00',
  },
];

let memoryStaffs: StaffAccount[] = [...INITIAL_MOCK_STAFFS];

export const staffsApi = {
  getAllStaffs: async (): Promise<StaffAccount[]> => {
    try {
      const res = await axiosClient.get<ApiResponse<StaffAccount[]>>('/admin/staffs');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        return res.data.data;
      }
    } catch {
      // Offline fallback
    }
    return memoryStaffs;
  },

  createStaff: async (payload: CreateStaffPayload): Promise<StaffAccount> => {
    try {
      const res = await axiosClient.post<ApiResponse<StaffAccount>>('/admin/staffs', payload);
      if (res.data?.success && res.data?.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Không thể tạo tài khoản nhân viên');
    } catch (err: any) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      if (err.response?.status) {
        throw err;
      }
      // Demo / offline fallback
      const newStaff: StaffAccount = {
        id: Date.now(),
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        role: 'STAFF',
        status: 'ACTIVE',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
      memoryStaffs.unshift(newStaff);
      return newStaff;
    }
  },
};

