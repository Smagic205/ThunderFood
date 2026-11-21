import { axiosClient } from '@/shared/api/axiosClient';
import type { UserAdminItem, UserFilterParams, UserRole, UserStatus } from '../types';

export const MOCK_USERS: UserAdminItem[] = [
  {
    id: 1,
    fullName: 'Trương Thanh Sơn',
    email: 'admin@thunderfood.vn',
    phone: '0901234567',
    role: 'ADMIN',
    status: 'ACTIVE',
    authProvider: 'LOCAL',
    createdAt: '2026-01-10T08:00:00',
  },
  {
    id: 2,
    fullName: 'Nguyễn Văn Hùng',
    email: 'shipper.hung@thunderfood.vn',
    phone: '0987654321',
    role: 'STAFF',
    status: 'ACTIVE',
    authProvider: 'LOCAL',
    createdAt: '2026-02-15T09:30:00',
  },
  {
    id: 3,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@gmail.com',
    phone: '0912345678',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    authProvider: 'LOCAL',
    createdAt: '2026-03-01T14:20:00',
  },
  {
    id: 4,
    fullName: 'Trần Thị Mai',
    email: 'mai.tran@gmail.com',
    phone: '0934567890',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    authProvider: 'GOOGLE',
    createdAt: '2026-03-05T10:15:00',
  },
  {
    id: 5,
    fullName: 'Đỗ Tuấn Kiệt',
    email: 'kiet.do@gmail.com',
    phone: '0971889900',
    role: 'CUSTOMER',
    status: 'LOCKED',
    authProvider: 'LOCAL',
    createdAt: '2026-03-12T16:45:00',
  },
];

export const customersApi = {
  getAllUsers: async (params: UserFilterParams = {}) => {
    try {
      const res = await axiosClient.get('/admin/users', {
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
      if (data?.content) {
        return {
          content: data.content as UserAdminItem[],
          totalElements: data.totalElements as number,
          totalPages: data.totalPages as number,
          pageNumber: data.pageNumber as number,
        };
      }
      return {
        content: MOCK_USERS,
        totalElements: MOCK_USERS.length,
        totalPages: 1,
        pageNumber: 0,
      };
    } catch {
      // Fallback local mock filtering
      let list = [...MOCK_USERS];
      if (params.keyword?.trim()) {
        const q = params.keyword.trim().toLowerCase();
        list = list.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q))
        );
      }
      if (params.role && params.role !== 'ALL') {
        list = list.filter((u) => u.role === params.role);
      }
      if (params.status && params.status !== 'ALL') {
        list = list.filter((u) => u.status === params.status);
      }
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        pageNumber: 0,
      };
    }
  },

  getUserDetail: async (id: number): Promise<UserAdminItem> => {
    const res = await axiosClient.get(`/admin/users/${id}`);
    return res.data?.data;
  },

  updateUserStatus: async (id: number, status: UserStatus): Promise<UserAdminItem> => {
    const res = await axiosClient.patch(`/admin/users/${id}/status`, { status });
    return res.data?.data;
  },

  updateUserRole: async (id: number, role: UserRole): Promise<UserAdminItem> => {
    const res = await axiosClient.patch(`/admin/users/${id}/role`, { role });
    return res.data?.data;
  },
};
