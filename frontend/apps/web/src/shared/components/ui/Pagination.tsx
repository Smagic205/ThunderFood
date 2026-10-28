import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements?: number;
  size?: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  size = 12,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1 && (!totalElements || totalElements <= size)) {
    return null;
  }

  // Thuật toán tính toán danh sách số trang hiển thị (hỗ trợ dấu ...)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (page >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  // Tính số thứ tự bản ghi bắt đầu và kết thúc
  const startItem = totalElements ? (page - 1) * size + 1 : undefined;
  const endItem = totalElements ? Math.min(page * size, totalElements) : undefined;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-[var(--line)] ${className}`}>
      {/* Thông tin số lượng hiển thị */}
      <div className="text-sm text-[var(--ink-2)]">
        {totalElements && startItem && endItem ? (
          <>
            Hiển thị <span className="font-semibold text-[var(--ink)]">{startItem}</span> -{' '}
            <span className="font-semibold text-[var(--ink)]">{endItem}</span> trong{' '}
            <span className="font-semibold text-[var(--ink)]">{totalElements}</span> món
          </>
        ) : (
          <>
            Trang <span className="font-semibold text-[var(--ink)]">{page}</span> /{' '}
            <span className="font-semibold text-[var(--ink)]">{totalPages}</span>
          </>
        )}
      </div>

      {/* Các nút bấm điều hướng trang */}
      <nav className="flex items-center gap-1.5" aria-label="Điều hướng phân trang">
        {/* Nút Trang trước */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Về trang trước"
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm font-medium hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
          <span className="hidden md:inline">Trước</span>
        </button>

        {/* Danh sách các số trang */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-9 h-9 flex items-center justify-center text-[var(--ink-3)] text-sm font-bold select-none"
                >
                  •••
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === page;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--volt)] text-[var(--on-volt)] shadow-sm font-bold scale-105'
                    : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-2)]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Nút Trang sau */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Sang trang sau"
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-sm font-medium hover:bg-[var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <span className="hidden md:inline">Sau</span>
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
