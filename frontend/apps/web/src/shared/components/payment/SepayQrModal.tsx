import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, FlaskConical, Loader2, QrCode, RefreshCw, X } from 'lucide-react';
import { paymentApi, type SepayPaymentInfo } from '@/shared/api/paymentApi';
import { useToastStore } from '@/shared/stores/toastStore';

interface SepayQrModalProps {
  orderId: number;
  isOpen: boolean;
  onClose: () => void;
  onPaidSuccess?: () => void;
}

export const SepayQrModal: React.FC<SepayQrModalProps> = ({
  orderId,
  isOpen,
  onClose,
  onPaidSuccess,
}) => {
  const { showToast } = useToastStore();
  const [info, setInfo] = useState<SepayPaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    let active = true;
    setIsLoading(true);
    setError(null);
    setIsPaid(false);

    paymentApi
      .getSepayInfo(orderId)
      .then((res) => {
        if (!active) return;
        setInfo(res);
        if (res.paymentStatus === 'PAID') {
          setIsPaid(true);
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || 'Không thể tải thông tin thanh toán SePay');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isOpen || !orderId || isPaid || error) return;

    const timer = window.setInterval(async () => {
      try {
        const statusRes = await paymentApi.getOrderPaymentStatus(orderId);
        if (statusRes.paymentStatus === 'PAID') {
          setIsPaid(true);
          setInfo((prev) =>
            prev
              ? {
                  ...prev,
                  paymentStatus: 'PAID',
                  transactionCode: statusRes.transactionCode,
                  paidAt: statusRes.paidAt,
                }
              : prev
          );
          showToast('Thanh toán SePay thành công!', 'success');
          onPaidSuccess?.();
        }
      } catch {
        // Silent retry on next interval
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isOpen, orderId, isPaid, error, onPaidSuccess, showToast]);

  if (!isOpen) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}: ${text}`, 'success');
  };

  const handleSimulateSandbox = async () => {
    try {
      setIsSimulating(true);
      const res = await paymentApi.simulateSandboxPayment(orderId);
      if (res.paymentStatus === 'PAID') {
        setIsPaid(true);
        setInfo((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'PAID',
                transactionCode: res.transactionCode,
                paidAt: res.paidAt,
              }
            : prev
        );
        showToast('Mô phỏng thanh toán tiền ảo SePay Sandbox thành công!', 'success');
        onPaidSuccess?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể mô phỏng thanh toán Sandbox', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-[var(--surface)] border border-[var(--line)] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-[var(--c-blue)]" />
            <h3 className="font-bold text-base text-[var(--ink)]">Thanh toán SePay</h3>
            {info?.sandboxMode && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Sandbox Tiền ảo
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-3)]"
            aria-label="Đóng cửa sổ thanh toán"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 size={34} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
              <p className="text-sm text-[var(--ink-2)]">Đang khởi tạo mã QR SePay...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-[var(--c-red)] font-medium">{error}</p>
              <button type="button" onClick={onClose} className="btn btn-primary btn-sm">
                Đóng
              </button>
            </div>
          ) : isPaid ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-lg font-bold text-[var(--ink)]">Thanh toán thành công!</h4>
              <p className="text-xs text-[var(--ink-2)]">
                Đơn hàng <span className="font-mono font-bold">#{info?.orderCode}</span> đã được ghi nhận thanh toán{' '}
                <span className="font-bold text-emerald-600">
                  {Number(info?.amount ?? 0).toLocaleString('vi-VN')}đ
                </span>
                .
              </p>
              {info?.transactionCode && (
                <p className="text-[11px] font-mono text-[var(--ink-3)]">
                  Mã giao dịch: {info.transactionCode}
                </p>
              )}
              <button type="button" onClick={onClose} className="btn btn-primary w-full mt-2">
                Xem đơn hàng của tôi
              </button>
            </div>
          ) : info ? (
            <div className="space-y-4">
              {info.sandboxMode && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <FlaskConical size={16} className="shrink-0 mt-0.5" />
                  <span>
                    Đang chạy ở chế độ <b>Sandbox (tiền ảo)</b>. Bạn có thể mô phỏng giao dịch từ trang quản trị SePay
                    Test Mode (qua Webhook) hoặc bấm nút mô phỏng bên dưới. Không chuyển tiền thật!
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center p-4 rounded-xl bg-white border border-[var(--line)]">
                <img
                  src={info.qrImageUrl}
                  alt={`QR thanh toán ${info.orderCode}`}
                  className="w-48 h-48 object-contain"
                />
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Đang chờ xác nhận giao dịch từ SePay...</span>
                </div>
              </div>

              <div className="space-y-2 text-xs bg-[var(--surface-2)]/50 p-3.5 rounded-xl border border-[var(--line)]">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-3)]">Ngân hàng:</span>
                  <span className="font-bold text-[var(--ink)]">{info.bankCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-3)]">Số tài khoản:</span>
                  <button
                    type="button"
                    onClick={() => copyText(info.accountNumber, 'Số tài khoản')}
                    className="font-mono font-bold text-[var(--ink)] flex items-center gap-1 hover:text-[var(--c-blue)]"
                  >
                    {info.accountNumber} <Copy size={12} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-3)]">Chủ tài khoản:</span>
                  <span className="font-semibold text-[var(--ink)]">{info.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-3)]">Số tiền:</span>
                  <span className="font-bold text-sm text-[var(--c-red)]">
                    {Number(info.amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[var(--line)]">
                  <span className="text-[var(--ink-3)]">Nội dung CK:</span>
                  <button
                    type="button"
                    onClick={() => copyText(info.transferContent, 'Nội dung chuyển khoản')}
                    className="font-mono font-bold text-[var(--c-blue)] flex items-center gap-1"
                  >
                    {info.transferContent} <Copy size={12} />
                  </button>
                </div>
              </div>

              {info.sandboxMode && (
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={handleSimulateSandbox}
                  className="btn btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Đang mô phỏng giao dịch...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical size={16} />
                      <span>Mô phỏng thanh toán thành công (Sandbox)</span>
                    </>
                  )}
                </button>
              )}

              <button type="button" onClick={onClose} className="btn btn-ghost w-full text-xs">
                Thanh toán sau tại trang Đơn hàng
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
