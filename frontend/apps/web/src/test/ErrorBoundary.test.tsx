import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary';

const FaultyComponent = () => {
  throw new Error('Mô phỏng lỗi render component');
};

const SafeComponent = () => <div>Nội dung an toàn</div>;

describe('Kiểm thử thành phần ErrorBoundary', () => {
  beforeEach(() => {
    // Tắt console.error khi cố ý quăng lỗi trong test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('1. Render bình thường các component con khi không có lỗi', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Nội dung an toàn')).toBeInTheDocument();
  });

  it('2. Bắt lỗi khi component con bị crash và hiển thị giao diện thông báo lỗi thân thiện', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Đã có lỗi xảy ra')).toBeInTheDocument();
    expect(
      screen.getByText(/Rất tiếc, đã có sự cố ngoài ý muốn/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Về trang chủ/i })).toBeInTheDocument();
  });

  it('3. Hiển thị fallback tùy chỉnh nếu được truyền qua props', () => {
    render(
      <ErrorBoundary fallback={<div>Giao diện lỗi tùy chỉnh</div>}>
        <FaultyComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Giao diện lỗi tùy chỉnh')).toBeInTheDocument();
  });
});
