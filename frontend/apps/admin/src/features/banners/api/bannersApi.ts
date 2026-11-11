import { axiosClient } from '@/shared/api/axiosClient';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

export const MOCK_BANNERS: BannerItem[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/products',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/vouchers',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/categories/burger',
    sortOrder: 3,
    isActive: false,
  },
];

export const bannersApi = {
  getAllBanners: async (): Promise<BannerItem[]> => {
    try {
      const res = await axiosClient.get('/admin/banners');
      if (Array.isArray(res.data?.data)) {
        return res.data.data;
      }
      return MOCK_BANNERS;
    } catch {
      return MOCK_BANNERS;
    }
  },

  getBannerById: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.get(`/admin/banners/${id}`);
    return res.data?.data;
  },

  createBanner: async (payload: CreateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.post('/admin/banners', payload);
    return res.data?.data;
  },

  updateBanner: async (id: number, payload: UpdateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.put(`/admin/banners/${id}`, payload);
    return res.data?.data;
  },

  toggleActive: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.patch(`/admin/banners/${id}/toggle-active`);
    return res.data?.data;
  },

  deleteBanner: async (id: number): Promise<void> => {
    await axiosClient.delete(`/admin/banners/${id}`);
  },
};
