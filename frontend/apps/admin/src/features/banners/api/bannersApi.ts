import { axiosClient } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/app/store/authStore';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const bannersApi = {
  getAllBanners: async (): Promise<BannerItem[]> => {
    const res = await axiosClient.get<ApiResponse<BannerItem[]>>('/admin/banners');
    if (!res.data?.success || !Array.isArray(res.data.data)) {
      throw new Error(res.data?.message || 'Không thể tải danh sách banner');
    }
    return res.data.data;
  },

  getBannerById: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.get<ApiResponse<BannerItem>>(`/admin/banners/${id}`);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không tìm thấy banner');
    return res.data.data;
  },

  createBanner: async (payload: CreateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.post<ApiResponse<BannerItem>>('/admin/banners', payload);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể tạo banner');
    return res.data.data;
  },

  updateBanner: async (id: number, payload: UpdateBannerPayload): Promise<BannerItem> => {
    const res = await axiosClient.put<ApiResponse<BannerItem>>(`/admin/banners/${id}`, payload);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể cập nhật banner');
    return res.data.data;
  },

  toggleActive: async (id: number): Promise<BannerItem> => {
    const res = await axiosClient.patch<ApiResponse<BannerItem>>(`/admin/banners/${id}/toggle-active`);
    if (!res.data?.success || !res.data.data) throw new Error(res.data?.message || 'Không thể đổi trạng thái banner');
    return res.data.data;
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
