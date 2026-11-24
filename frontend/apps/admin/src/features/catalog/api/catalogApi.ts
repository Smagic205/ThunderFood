import { axiosClient } from '@/shared/api/axiosClient';
import type { Category, Product, ProductPageResponse, GetProductsParams } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PageData<T> {
  content: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/** Art/tint are presentation metadata keyed from real category slugs. */
const CATEGORY_VISUALS: Record<string, { art: string; tint: string }> = {
  combo: { art: 'combo', tint: '#FFB81C' },
  'ga-gion': { art: 'chicken', tint: '#FF8A3D' },
  burger: { art: 'burger', tint: '#F5B14A' },
  'com-mi': { art: 'plate', tint: '#5FC58A' },
  'an-kem': { art: 'fries', tint: '#FFD24A' },
  'do-uong': { art: 'cup', tint: '#4FC3F7' },
  'trang-mieng': { art: 'dessert', tint: '#FF7AA8' },
};
const DEFAULT_VISUAL = { art: 'plate', tint: '#FFB81C' };

function requireData<T>(response: ApiResponse<T> | undefined, message: string): T {
  if (!response?.success || response.data == null) {
    throw new Error(response?.message || message);
  }
  return response.data;
}

function enrichCategory(raw: any): Category {
  if (raw?.id == null || !raw.name || !raw.slug) {
    throw new Error('Dữ liệu danh mục từ máy chủ không hợp lệ');
  }
  const visual = CATEGORY_VISUALS[raw.slug] || DEFAULT_VISUAL;
  return {
    id: Number(raw.id),
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? '',
    isActive: Boolean(raw.isActive),
    art: visual.art,
    tint: visual.tint,
  };
}

function enrichProduct(raw: any): Product {
  const categoryId = raw?.category?.id ?? raw?.categoryId;
  if (raw?.id == null || categoryId == null || !raw.name) {
    throw new Error('Dữ liệu món ăn từ máy chủ không hợp lệ');
  }

  const images = Array.isArray(raw.images) ? raw.images : [];
  const imageUrls = images
    .map((image: any) => (typeof image === 'string' ? image : image?.url ?? image?.imageUrl))
    .filter((url: unknown): url is string => typeof url === 'string' && url.length > 0);
  const primaryImage = images.find((image: any) => typeof image === 'object' && image?.isMain)?.url
    ?? imageUrls[0];
  const categorySlug = raw.category?.slug ?? '';
  const visual = CATEGORY_VISUALS[categorySlug] || DEFAULT_VISUAL;

  return {
    id: Number(raw.id),
    categoryId: Number(categoryId),
    categoryName: raw.category?.name ?? raw.categoryName,
    name: raw.name,
    slug: raw.slug ?? '',
    price: Number(raw.price ?? 0),
    discountPrice: raw.discountPrice == null ? null : Number(raw.discountPrice),
    stockQuantity: Number(raw.stockQuantity ?? 0),
    soldCount: Number(raw.soldCount ?? 0),
    soldCountDisplay: raw.soldCountDisplay,
    avgRating: Number(raw.avgRating ?? raw.ratingAverage ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    art: visual.art,
    tint: visual.tint,
    description: raw.description ?? '',
    isAvailable: Boolean(raw.isAvailable),
    createdAt: raw.createdAt,
    imgs: imageUrls,
    thumbnailUrl: primaryImage,
  };
}

export const catalogApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await axiosClient.get<ApiResponse<any[]>>('/admin/categories');
    const data = requireData(res.data, 'Không thể tải danh sách danh mục');
    if (!Array.isArray(data)) throw new Error('Dữ liệu danh mục từ máy chủ không hợp lệ');
    return data.map(enrichCategory);
  },

  saveCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const payload = {
      name: categoryData.name?.trim() || '',
      slug: categoryData.slug?.trim() || '',
      description: categoryData.description?.trim() || '',
      isActive: categoryData.isActive ?? true,
    };
    const res = categoryData.id
      ? await axiosClient.put<ApiResponse<any>>(`/admin/categories/${categoryData.id}`, payload)
      : await axiosClient.post<ApiResponse<any>>('/admin/categories', payload);
    return enrichCategory(requireData(res.data, 'Không thể lưu danh mục'));
  },

  toggleCategoryActive: async (id: number, isActive: boolean): Promise<boolean> => {
    const currentRes = await axiosClient.get<ApiResponse<any>>(`/admin/categories/${id}`);
    const current = requireData(currentRes.data, 'Không tìm thấy danh mục');
    const res = await axiosClient.put<ApiResponse<any>>(`/admin/categories/${id}`, {
      name: current.name,
      slug: current.slug,
      description: current.description ?? '',
      isActive,
    });
    requireData(res.data, 'Không thể cập nhật trạng thái danh mục');
    return true;
  },

  deleteCategory: async (id: number): Promise<{ success: boolean; message?: string }> => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/admin/categories/${id}`);
    return {
      success: Boolean(res.data?.success),
      message: res.data?.message,
    };
  },

  getProducts: async (params?: GetProductsParams): Promise<ProductPageResponse> => {
    const page = params?.page ?? 1;
    const size = params?.size ?? 10;
    const sortMapping: Record<string, { sortBy: string; direction: string }> = {
      bestSelling: { sortBy: 'soldCount', direction: 'desc' },
      newest: { sortBy: 'createdAt', direction: 'desc' },
      rating: { sortBy: 'avgRating', direction: 'desc' },
      priceAsc: { sortBy: 'price', direction: 'asc' },
      priceDesc: { sortBy: 'price', direction: 'desc' },
    };
    const sort = sortMapping[params?.sort ?? 'bestSelling'] ?? sortMapping.bestSelling;
    const res = await axiosClient.get<ApiResponse<PageData<any>>>('/admin/products', {
      params: {
        page: Math.max(0, page - 1),
        size,
        categoryId: params?.categoryId && params.categoryId > 0 ? params.categoryId : undefined,
        keyword: params?.keyword?.trim() || undefined,
        sortBy: sort.sortBy,
        direction: sort.direction,
      },
    });
    const data = requireData(res.data, 'Không thể tải danh sách món ăn');
    if (!Array.isArray(data.content) || !data.pagination) {
      throw new Error('Dữ liệu món ăn từ máy chủ không hợp lệ');
    }
    return {
      content: data.content.map(enrichProduct),
      pagination: {
        page: data.pagination.page + 1,
        size: data.pagination.size,
        totalElements: data.pagination.totalElements,
        totalPages: data.pagination.totalPages,
        hasNext: data.pagination.hasNext,
        hasPrevious: data.pagination.hasPrevious,
      },
    };
  },

  getProductById: async (id: number): Promise<Product> => {
    const res = await axiosClient.get<ApiResponse<any>>(`/admin/products/${id}`);
    return enrichProduct(requireData(res.data, 'Không tìm thấy món ăn'));
  },

  toggleProductAvailability: async (id: number, isAvailable: boolean): Promise<boolean> => {
    const current = await catalogApi.getProductById(id);
    const updated = await catalogApi.saveProduct({ ...current, isAvailable });
    return updated.isAvailable === isAvailable;
  },

  uploadImages: async (files: File[], folder = 'thunderfood/products'): Promise<string[]> => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('folder', folder);

    const res = await axiosClient.post<ApiResponse<any[]>>('/admin/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const data = requireData(res.data, 'Không thể tải ảnh lên');
    if (!Array.isArray(data)) throw new Error('Dữ liệu ảnh tải lên không hợp lệ');
    return data.map((item: any) => item.imageUrl || item.url).filter(Boolean);
  },

  saveProduct: async (productData: Partial<Product>): Promise<Product> => {
    const categoryId = Number(productData.categoryId);
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      throw new Error('Vui lòng chọn danh mục cho món ăn');
    }

    const imagesPayload = (productData.imgs || []).filter(Boolean).map((imageUrl, index) => ({
      imageUrl,
      isThumbnail: index === 0,
      sortOrder: index,
    }));
    const payload = {
      name: productData.name?.trim() || '',
      slug: productData.slug?.trim() || undefined,
      categoryId,
      price: Number(productData.price),
      discountPrice: productData.discountPrice == null ? null : Number(productData.discountPrice),
      stockQuantity: Number(productData.stockQuantity ?? 0),
      description: productData.description?.trim() || '',
      isAvailable: productData.isAvailable ?? true,
      images: imagesPayload,
    };

    try {
      const res = productData.id
        ? await axiosClient.put<ApiResponse<any>>(`/admin/products/${productData.id}`, payload)
        : await axiosClient.post<ApiResponse<any>>('/admin/products', payload);
      return enrichProduct(requireData(res.data, 'Không thể lưu món ăn'));
    } catch (err: any) {
      const responseData = err?.response?.data;
      if (responseData?.data && typeof responseData.data === 'object') {
        const fieldErrors = Object.values(responseData.data).filter(Boolean);
        if (fieldErrors.length > 0) throw new Error(fieldErrors.join('; '));
      }
      if (responseData?.message) throw new Error(responseData.message);
      throw err;
    }
  },

  deleteProduct: async (id: number): Promise<boolean> => {
    const res = await axiosClient.delete<ApiResponse<void>>(`/admin/products/${id}`);
    return Boolean(res.data?.success);
  },
};
