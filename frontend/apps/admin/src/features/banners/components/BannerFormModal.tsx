import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import type { BannerItem, CreateBannerPayload, UpdateBannerPayload } from '../types';

interface BannerFormModalProps {
  isOpen: boolean;
  banner: BannerItem | null;
  onClose: () => void;
  onSave: (payload: CreateBannerPayload | UpdateBannerPayload) => Promise<any> | void;
  isSubmitting?: boolean;
}

export const BannerFormModal: React.FC<BannerFormModalProps> = ({
  isOpen,
  banner,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (banner) {
      setImageUrl(banner.imageUrl || '');
      setLinkUrl(banner.linkUrl || '');
      setSortOrder(banner.sortOrder ?? 1);
      setIsActive(banner.isActive ?? true);
    } else {
      setImageUrl('');
      setLinkUrl('');
      setSortOrder(1);
      setIsActive(true);
    }
    setError('');
    setImgError(false);
  }, [banner, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Vui lòng nhập đường dẫn hình ảnh banner');
      return;
    }

    try {
      setError('');
      await onSave({
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || undefined,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu banner');
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
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card card-p"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--surface-1, #1e2238)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-modal-title"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
              <ImageIcon size={20} />
            </div>
            <h3 id="banner-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
              {banner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
            </h3>
          </div>
          <button className="ibtn" onClick={onClose} style={{ color: 'var(--muted, #94a3b8)' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Image URL Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Đường dẫn hình ảnh (URL) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                required
                autoFocus
                placeholder="https://example.com/banner.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImgError(false);
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Image Live Preview */}
          {imageUrl.trim() && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', marginBottom: '6px' }}>
                Xem trước ảnh:
              </div>
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed var(--border, rgba(255, 255, 255, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {imgError ? (
                  <div style={{ color: '#f87171', fontSize: '12px' }}>Không thể tải ảnh từ URL này</div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    onError={() => setImgError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Target Link */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Đường dẫn liên kết khi nhấn (Link URL)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="/products hoặc https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Sort Order & IsActive */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '9px 0',
                  color: '#fff',
                  fontSize: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--c-blue, #3b82f6)' }}
                />
                <span>Đang hiển thị (Active)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="spin" size={16} /> : banner ? 'Cập nhật Banner' : 'Tạo mới Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
