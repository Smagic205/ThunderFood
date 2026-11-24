import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderHook, act } from '@testing-library/react';
import { server } from './mocks/server';
import { axiosClient } from '@/shared/api/axiosClient';
import { useToastStore } from '@/shared/stores/toastStore';
import { appQueryClient, CACHE_TIME } from '@/shared/config/queryClient';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { escapeHtml, stripHtml } from '@/shared/utils/security';

describe('Giai đoạn 1: Rate Limit 429, Client Cache & Tiện ích bảo mật', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    vi.restoreAllMocks();
  });

  describe('1. Xử lý mã lỗi Rate Limit HTTP 429', () => {
    it('bắt lỗi 429 với header Retry-After và hiển thị toast chứa số giây chờ', async () => {
      server.use(
        http.get('*/v1/test-rate-limit', () => {
          return new HttpResponse(
            JSON.stringify({ status: 429, errorCode: 'RATE_LIMIT_EXCEEDED' }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '30',
              },
            }
          );
        })
      );

      const showToastSpy = vi.spyOn(useToastStore.getState(), 'showToast');

      await expect(axiosClient.get('/v1/test-rate-limit')).rejects.toThrow();

      expect(showToastSpy).toHaveBeenCalledWith(
        expect.stringContaining('30 giây'),
        'error'
      );
    });

    it('bắt lỗi 429 khi không có header Retry-After và dùng thông báo thân thiện mặc định', async () => {
      server.use(
        http.get('*/v1/test-rate-limit-default', () => {
          return new HttpResponse(null, { status: 429 });
        })
      );

      const showToastSpy = vi.spyOn(useToastStore.getState(), 'showToast');

      await expect(axiosClient.get('/v1/test-rate-limit-default')).rejects.toThrow();

      expect(showToastSpy).toHaveBeenCalledWith(
        'Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.',
        'error'
      );
    });

    it('ưu tiên hiển thị message từ backend trả về nếu có trong body 429', async () => {
      server.use(
        http.get('*/v1/test-rate-limit-custom-msg', () => {
          return HttpResponse.json(
            { message: 'Hệ thống đang bận, vui lòng chờ 1 phút.' },
            { status: 429 }
          );
        })
      );

      const showToastSpy = vi.spyOn(useToastStore.getState(), 'showToast');

      await expect(axiosClient.get('/v1/test-rate-limit-custom-msg')).rejects.toThrow();

      expect(showToastSpy).toHaveBeenCalledWith(
        'Hệ thống đang bận, vui lòng chờ 1 phút.',
        'error'
      );
    });
  });

  describe('2. Cấu hình Cache phân tầng TanStack Query', () => {
    it('appQueryClient được khởi tạo với staleTime và gcTime chuẩn mực', () => {
      const defaultQueryOptions = appQueryClient.getDefaultOptions().queries;
      expect(defaultQueryOptions?.staleTime).toBe(CACHE_TIME.PRODUCTS);
      expect(defaultQueryOptions?.gcTime).toBe(CACHE_TIME.PRODUCTS_GC);
      expect(defaultQueryOptions?.refetchOnWindowFocus).toBe(false);
    });

    it('các hằng số thời gian cache tuân thủ chuẩn scale-up guide', () => {
      expect(CACHE_TIME.REGIONS).toBe(24 * 60 * 60 * 1000); // 24 giờ
      expect(CACHE_TIME.CATEGORIES).toBe(30 * 60 * 1000);    // 30 phút
      expect(CACHE_TIME.PRODUCTS).toBe(5 * 60 * 1000);       // 5 phút
      expect(CACHE_TIME.PRODUCTS_GC).toBe(15 * 60 * 1000);   // 15 phút
    });
  });

  describe('3. Tiện ích useDebounce', () => {
    it('chỉ cập nhật giá trị sau khoảng thời gian debounce', () => {
      vi.useFakeTimers();

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'ban đầu', delay: 300 } }
      );

      expect(result.current).toBe('ban đầu');

      rerender({ value: 'đã gõ phím', delay: 300 });
      // Trước khi đủ 300ms, giá trị vẫn là ban đầu
      expect(result.current).toBe('ban đầu');

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Sau 300ms, giá trị đã được cập nhật
      expect(result.current).toBe('đã gõ phím');

      vi.useRealTimers();
    });
  });

  describe('4. Tiện ích phòng chống XSS', () => {
    it('escapeHtml thoát các ký tự nhạy cảm < > & " \'', () => {
      const dangerous = '<script>alert("xss & hack")</script>';
      const safe = escapeHtml(dangerous);
      expect(safe).toBe('&lt;script&gt;alert(&quot;xss &amp; hack&quot;)&lt;/script&gt;');
    });

    it('stripHtml loại bỏ hoàn toàn các thẻ HTML', () => {
      const htmlText = '<b>Trà sữa</b> <i>trân châu</i>';
      expect(stripHtml(htmlText)).toBe('Trà sữa trân châu');
    });
  });
});
