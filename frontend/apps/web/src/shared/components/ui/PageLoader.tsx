import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Đang tải trang...' }: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[50vh] flex flex-col items-center justify-center p-8 w-full"
    >
      <div className="relative flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--volt)]" size={44} />
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--ink-2)] animate-pulse">
        {message}
      </p>
    </div>
  );
}
