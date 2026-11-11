import { axiosClient } from '@/shared/api/axiosClient';
import type { SystemSetting, ServiceWard, ServiceWardFilterParams } from '../types';

export const MOCK_SETTINGS: SystemSetting[] = [
  { id: 1, key: 'FREESHIP_THRESHOLD', value: '300000' },
  { id: 2, key: 'MAX_ORDERS_PER_PACKAGE', value: '3' },
  { id: 3, key: 'DEFAULT_SHIPPING_FEE', value: '20000' },
  { id: 4, key: 'STORE_HOTLINE', value: '1900 6868' },
  { id: 5, key: 'ESTIMATED_DELIVERY_MINUTES', value: '30' },
];

export const MOCK_DISTRICTS = ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Cầu Giấy', 'Hai Bà Trưng', 'Thanh Xuân'];

export const MOCK_WARDS: ServiceWard[] = [
  { id: 1, district: 'Đống Đa', wardName: 'Kim Liên', shippingFee: 15000, isActive: true },
  { id: 2, district: 'Đống Đa', wardName: 'Ô Chợ Dừa', shippingFee: 15000, isActive: true },
  { id: 3, district: 'Đống Đa', wardName: 'Láng Hạ', shippingFee: 18000, isActive: true },
  { id: 4, district: 'Ba Đình', wardName: 'Điện Biên', shippingFee: 20000, isActive: true },
  { id: 5, district: 'Ba Đình', wardName: 'Kim Mã', shippingFee: 20000, isActive: true },
  { id: 6, district: 'Cầu Giấy', wardName: 'Dịch Vọng', shippingFee: 25000, isActive: true },
  { id: 7, district: 'Cầu Giấy', wardName: 'Nghĩa Tân', shippingFee: 25000, isActive: false },
  { id: 8, district: 'Hoàn Kiếm', wardName: 'Hàng Bạc', shippingFee: 22000, isActive: true },
];

export const settingsApi = {
  // Settings
  getAllSettings: async (): Promise<SystemSetting[]> => {
    try {
      const res = await axiosClient.get('/admin/settings');
      if (Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return MOCK_SETTINGS;
    } catch {
      return MOCK_SETTINGS;
    }
  },

  updateSettings: async (settingsMap: Record<string, string>): Promise<SystemSetting[]> => {
    const res = await axiosClient.put('/admin/settings', { settings: settingsMap });
    return res.data?.data;
  },

  // Service Wards
  getDistricts: async (): Promise<string[]> => {
    try {
      const res = await axiosClient.get('/admin/wards/districts');
      if (Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return MOCK_DISTRICTS;
    } catch {
      return MOCK_DISTRICTS;
    }
  },

  getWards: async (params: ServiceWardFilterParams = {}) => {
    try {
      const res = await axiosClient.get('/admin/wards', {
        params: {
          district: params.district && params.district !== 'ALL' ? params.district : undefined,
          keyword: params.keyword || undefined,
          isActive: params.isActive !== undefined ? params.isActive : undefined,
          page: params.page ?? 0,
          size: params.size ?? 15,
        },
      });

      const data = res.data?.data;
      if (data?.content) {
        return {
          content: data.content as ServiceWard[],
          totalElements: data.totalElements as number,
          totalPages: data.totalPages as number,
          pageNumber: data.pageNumber as number,
        };
      }
      return {
        content: MOCK_WARDS,
        totalElements: MOCK_WARDS.length,
        totalPages: 1,
        pageNumber: 0,
      };
    } catch {
      let list = [...MOCK_WARDS];
      if (params.district && params.district !== 'ALL') {
        list = list.filter((w) => w.district === params.district);
      }
      if (params.keyword?.trim()) {
        const q = params.keyword.trim().toLowerCase();
        list = list.filter((w) => w.wardName.toLowerCase().includes(q) || w.district.toLowerCase().includes(q));
      }
      if (params.isActive !== undefined) {
        list = list.filter((w) => w.isActive === params.isActive);
      }
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        pageNumber: 0,
      };
    }
  },

  updateShippingFee: async (id: number, shippingFee: number): Promise<ServiceWard> => {
    const res = await axiosClient.put(`/admin/wards/${id}/shipping-fee`, { shippingFee });
    return res.data?.data;
  },

  toggleWardActive: async (id: number): Promise<ServiceWard> => {
    const res = await axiosClient.patch(`/admin/wards/${id}/toggle-active`);
    return res.data?.data;
  },
};
