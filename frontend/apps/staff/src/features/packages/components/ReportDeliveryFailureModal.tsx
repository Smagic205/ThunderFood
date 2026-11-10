import { useState, type FormEvent } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ReportDeliveryFailureModalProps {
  orderCode: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

const QUICK_REASONS = [
  'Không liên lạc được với khách hàng',
  'Khách hàng từ chối nhận hàng',
  'Địa chỉ không tìm thấy',
  'Không thể tiếp cận địa chỉ giao hàng',
];

export const ReportDeliveryFailureModal = ({
  orderCode,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ReportDeliveryFailureModalProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Vui lòng nhập lý do giao hàng thất bại.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="dlg-overlay" onClick={isSubmitting ? undefined : onClose}>
      <div className="dlg" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="dlg-h">
          <div className="row" style={{ gap: '8px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--c-red)' }} />
            <h3 style={{ color: 'var(--c-red)' }}>Báo giao thất bại · {orderCode}</h3>
          </div>
          <button className="ibtn" onClick={onClose} disabled={isSubmitting} aria-label="Đóng"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dlg-b">
            <p className="muted" style={{ marginBottom: '12px' }}>
              Đơn sẽ được ghi nhận giao thất bại. Hãy nhập lý do để lưu vào lịch sử đơn hàng.
            </p>
            <div className="row wrap" style={{ gap: '6px', marginBottom: '12px' }}>
              {QUICK_REASONS.map((quickReason) => (
                <button
                  key={quickReason}
                  type="button"
                  className="chip"
                  onClick={() => { setReason(quickReason); setError(''); }}
                  disabled={isSubmitting}
                  style={{ fontSize: '12px' }}
                >
                  {quickReason}
                </button>
              ))}
            </div>
            <label className="field">
              <span>Lý do giao thất bại <b>(*)</b></span>
              <textarea
                className="input"
                rows={3}
                value={reason}
                onChange={(event) => { setReason(event.target.value); setError(''); }}
                disabled={isSubmitting}
                placeholder="Nhập lý do…"
              />
              {error && <small style={{ color: 'var(--c-red)' }}>{error}</small>}
            </label>
          </div>
          <div className="dlg-f">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Quay lại</button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Đang lưu…' : 'Xác nhận thất bại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
