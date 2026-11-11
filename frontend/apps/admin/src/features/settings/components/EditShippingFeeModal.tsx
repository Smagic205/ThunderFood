import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import type { ServiceWard } from '../types';

interface EditShippingFeeModalProps {
  isOpen: boolean;
  ward: ServiceWard | null;
  onClose: () => void;
  onSave: (id: number, fee: number) => Promise<any> | void;
  isSubmitting?: boolean;
}

export const EditShippingFeeModal: React.FC<EditShippingFeeModalProps> = ({
  isOpen,
  ward,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const [fee, setFee] = useState<number>(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ward) {
      setFee(ward.shippingFee);
    }
    setError('');
  }, [ward, isOpen]);

  if (!isOpen || !ward) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fee < 0) {
      setError('Phí giao hàng không được âm');
      return;
    }

    try {
      setError('');
      await onSave(ward.id, fee);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật phí');
    }
  };

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
        aria-labelledby="shipping-fee-modal-title"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--c-blue, #60a5fa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={20} />
            </div>
            <div>
              <h3 id="shipping-fee-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                Cập nhật phí giao hàng
              </h3>
              <span style={{ fontSize: '13px', color: 'var(--muted, #94a3b8)' }}>
                {ward.wardName}, {ward.district}
              </span>
            </div>
          </div>
          <button className="ibtn" onClick={onClose} style={{ color: 'var(--muted, #94a3b8)' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Mức phí giao hàng (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              autoFocus
              value={fee}
              onChange={(e) => setFee(Number(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
              }}
            />
            <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginTop: '4px' }}>
              Quy đổi: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee)}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spin" size={16} /> : 'Lưu mức phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
