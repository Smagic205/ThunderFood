import { useEffect, useState } from 'react';

/**
 * Hook trì hoãn cập nhật giá trị (debounce) giúp chống spam gọi API khi gõ phím hoặc lọc dữ liệu
 * @param value Giá trị cần debounce
 * @param delay Thời gian chờ (mặc định 300ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
