import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] flex items-center justify-center p-6 my-8">
          <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 md:p-8 text-center shadow-lg">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-bold text-[var(--ink)] mb-2">
              Đã có lỗi xảy ra
            </h3>

            <p className="text-sm text-[var(--ink-2)] mb-6">
              Rất tiếc, đã có sự cố ngoài ý muốn khi hiển thị nội dung này. Vui lòng thử tải lại hoặc quay về trang chủ.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs bg-red-50 text-red-700 p-3 rounded-lg mb-6 overflow-x-auto text-left max-h-36">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Tải lại trang</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-ghost w-full sm:w-auto inline-flex items-center justify-center gap-2"
              >
                <Home size={16} />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
