import { axiosClient } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/app/store/authStore';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

export const MOCK_BANNERS: BannerItem[] = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/products',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-11-01T10:00:00',
    updatedAt: '2026-11-01T10:00:00',
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/vouchers',
    sortOrder: 2,
    isActive: true,
    createdAt: '2026-11-05T14:30:00',
    updatedAt: '2026-11-05T14:30:00',
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/categories/burger',
    sortOrder: 3,
    isActive: false,
    createdAt: '2026-11-10T09:15:00',
    updatedAt: '2026-11-10T09:15:00',
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

  uploadBannerImage: async (file: File): Promise<string> => {
    // Nếu đang dùng tài khoản Demo (giả lập offline / không có backend Cloudinary)
    const token = useAuthStore.getState().accessToken;
    if (token?.startsWith('demo-')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'thunderfood/banners');

    try {
      const res = await axiosClient.post('/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data?.success && res.data?.data?.imageUrl) {
        return res.data.data.imageUrl;
      }
      if (res.data?.data?.imageUrl) {
        return res.data.data.imageUrl;
      }
    } catch {
      // Fallback sang endpoint /admin/upload/images
      try {
        const multiFormData = new FormData();
        multiFormData.append('files', file);
        multiFormData.append('folder', 'thunderfood/banners');

        const multiRes = await axiosClient.post('/admin/upload/images', multiFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (multiRes.data?.success && Array.isArray(multiRes.data.data) && multiRes.data.data[0]?.imageUrl) {
          return multiRes.data.data[0].imageUrl;
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên hệ thống Cloudinary';
        throw new Error(msg);
      }
    }

    throw new Error('Không thể tải ảnh lên hệ thống');
  },
};
