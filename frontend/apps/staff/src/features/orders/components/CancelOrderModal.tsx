import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface CancelOrderModalProps {
  orderCode: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const COMMON_REASONS = [
  'Khách hàng yêu cầu hủy đơn',
  'Quán tạm hết món trong đơn',
  'Không liên lạc được với khách hàng',
  'Địa chỉ nằm ngoài phạm vi phục vụ',
  'Đơn hàng bị trùng lặp',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  orderCode,
  isSubmitting = false,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="dlg-h">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--c-red)' }} />
            <h3 style={{ color: 'var(--c-red)' }}>Hủy đơn hàng {orderCode}</h3>
          </div>
          <button className="ibtn" onClick={onClose} disabled={isSubmitting}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="dlg-b">
            <p className="muted" style={{ marginBottom: '14px', fontSize: '14px' }}>
              Khi hủy đơn hàng, hệ thống sẽ tự động <b>hoàn lại số lượng tồn kho sản phẩm</b> và <b>hoàn lượt sử dụng mã giảm giá</b> (nếu có).
            </p>

            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Gợi ý lý do nhanh:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className="chip"
                    style={{ fontSize: '12px', padding: '4px 10px' }}
                    onClick={() => {
                      setReason(r);
                      setError('');
                    }}
                    disabled={isSubmitting}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className="field" style={{ marginTop: '10px' }}>
              <span style={{ fontWeight: 600 }}>Lý do hủy đơn (*)</span>
              <textarea
                className="input"
                rows={3}
                placeholder="Nhập lý do chi tiết để thông báo cho khách hàng..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
                style={{ resize: 'vertical' }}
              />
              {error && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {error}
                </small>
              )}
            </label>
          </div>

          <div className="dlg-f">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Quay lại
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
