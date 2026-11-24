import { QueryClient } from '@tanstack/react-query';

/**
 * Thời gian sống của cache (theo quy chuẩn scale-up guide)
 */
export const CACHE_TIME = {
  /** Tỉnh/Thành, Quận/Huyện, Phường/Xã: 24 giờ */
  REGIONS: 24 * 60 * 60 * 1000,
  /** Danh mục món ăn: 30 phút */
  CATEGORIES: 30 * 60 * 1000,
  /** Danh sách & chi tiết món ăn: 5 phút */
  PRODUCTS: 5 * 60 * 1000,
  /** Garbage collection time món ăn: 15 phút */
  PRODUCTS_GC: 15 * 60 * 1000,
  /** Banner: 1 giờ */
  BANNERS: 60 * 60 * 1000,
  /** Voucher khả dụng: 10 phút */
  VOUCHERS: 10 * 60 * 1000,
} as const;

/**
 * Khởi tạo Query Client với cấu hình mặc định tối ưu hiệu năng
 */
export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_TIME.PRODUCTS,
      gcTime: CACHE_TIME.PRODUCTS_GC,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
