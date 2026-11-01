import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { VoucherAdmin } from '../types';

interface ConfirmDeleteVoucherModalProps {
  isOpen: boolean;
  voucher: VoucherAdmin | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export const ConfirmDeleteVoucherModal: React.FC<ConfirmDeleteVoucherModalProps> = ({
  isOpen,
  voucher,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !voucher) return null;

  const hasBeenUsed = (voucher.usedCount || 0) > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card card-p"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--surface-1, #1e2238)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          padding: '24px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertTriangle size={26} />
        </div>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
          {hasBeenUsed ? 'Vô hiệu hóa voucher?' : 'Xóa mã voucher?'}
        </h3>

        <p className="muted" style={{ fontSize: '13.5px', lineHeight: 1.5, margin: '0 0 20px' }}>
          Bạn có chắc chắn muốn xóa mã voucher <b style={{ color: 'var(--ink)' }}>“{voucher.code}”</b>?
          {hasBeenUsed ? (
            <span style={{ display: 'block', marginTop: '6px', color: '#f59e0b' }}>
              Mã này đã có <b>{voucher.usedCount}</b> lượt khách hàng sử dụng. Hệ thống sẽ thực hiện <b>vô hiệu hóa</b> (chuyển sang ngưng hoạt động) để bảo toàn lịch sử đơn hàng.
            </span>
          ) : (
            <span style={{ display: 'block', marginTop: '6px' }}>
              Mã chưa từng được sử dụng và sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
            </span>
          )}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isDeleting} style={{ minWidth: '100px' }}>
            Hủy
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ minWidth: '120px' }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-1" />
                Đang xử lý...
              </>
            ) : hasBeenUsed ? (
              'Vô hiệu hóa'
            ) : (
              'Xóa vĩnh viễn'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

