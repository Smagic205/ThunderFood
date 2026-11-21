import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import type { BannerItem } from '../types';

interface ConfirmDeleteBannerModalProps {
  isOpen: boolean;
  banner: BannerItem | null;
  onClose: () => void;
  onConfirm: () => Promise<any> | void;
  isDeleting?: boolean;
}

export const ConfirmDeleteBannerModal: React.FC<ConfirmDeleteBannerModalProps> = ({
  isOpen,
  banner,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !banner) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card card-p"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--surface-1, #1e2238)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
          borderRadius: '16px',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={20} />
          </div>
          <div>
            <h3 id="confirm-delete-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
              Xóa banner quảng cáo
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>Banner ID: #{banner.id}</span>
          </div>
        </div>

        {banner.imageUrl && (
          <div
            style={{
              width: '100%',
              height: '100px',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
            }}
          >
            <img src={banner.imageUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          Bạn có chắc chắn muốn xóa banner này không? Thao tác này không thể hoàn tác.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isDeleting}>
            Hủy bỏ
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ backgroundColor: '#dc2626', color: '#fff' }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="spin" size={16} /> : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};
