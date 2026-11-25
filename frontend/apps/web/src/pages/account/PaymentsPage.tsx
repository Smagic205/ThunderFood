import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, Wallet, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paymentApi } from '@/shared/api/paymentApi';

export const PaymentsPage: React.FC = () => {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-payments', page],
    queryFn: () => paymentApi.getMyPayments({ page, size: 10 }),
  });

  const payments = data?.content ?? [];
  const pagination = data?.pagination;

  const renderStatus = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={13} /> Thành công
        </span>
      );
    }
    if (status === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
          <XCircle size={13} /> Thất bại
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
        <Clock size={13} /> Chờ thanh toán
      </span>
    );
  };

  return (
    <div>
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Lịch sử giao dịch</h1>
          <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
            Theo dõi các giao dịch thanh toán trực tuyến qua cổng SePay.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 size={32} className="animate-spin text-[var(--volt)] mx-auto mb-2" />
          <p className="text-sm text-[var(--ink-2)]">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : isError ? (
        <div className="card p-6 text-center text-sm text-[var(--c-red)]">
          Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.
        </div>
      ) : payments.length === 0 ? (
        <div className="empty card">
          <div className="art-wrap text-[#6B3FD1] bg-purple-50 dark:bg-purple-950/40">
            <Wallet size={48} />
          </div>
          <h3>Chưa có giao dịch trực tuyến</h3>
          <p>Các giao dịch thanh toán SePay của bạn sẽ hiển thị tại đây.</p>
          <Link to="/menu" className="btn btn-primary mt-2">
            Đặt món ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((item) => (
            <div
              key={item.id}
              className="card p-4 bg-[var(--surface)] border border-[var(--line)] flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[var(--ink)]">
                    #{item.orderCode || item.orderId}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                    {item.provider}
                  </span>
                  {renderStatus(item.status)}
                </div>
                <p className="text-xs text-[var(--ink-3)]">
                  Mã GD: <span className="font-mono">{item.transactionCode || 'Đang chờ'}</span> •{' '}
                  {new Date(item.paidAt || item.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-[var(--ink)]">
                  {Number(item.amount).toLocaleString('vi-VN')}đ
                </p>
              </div>
            </div>
          ))}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                type="button"
                disabled={!pagination.hasPrevious}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-sm btn-ghost text-xs"
              >
                Trang trước
              </button>
              <span className="text-xs text-[var(--ink-2)]">
                Trang {pagination.page + 1} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
