import React, { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Link2, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { bannersApi } from '../api/bannersApi';
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
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (banner) {
      setImageUrl(banner.imageUrl || '');
      setLinkUrl(banner.linkUrl || '');
      setSortOrder(banner.sortOrder ?? 1);
      setIsActive(banner.isActive ?? true);
      // Nếu đã có ảnh banner, mặc định cho phép up từ máy hoặc xem preview
      setInputMode('upload');
    } else {
      setImageUrl('');
      setLinkUrl('');
      setSortOrder(1);
      setIsActive(true);
      setInputMode('upload');
    }
    setError('');
    setUploadError(null);
    setImgError(false);
  }, [banner, isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP, GIF)');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setUploadError(`Tệp "${file.name}" vượt quá dung lượng tối đa 5MB`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setError('');
      const uploadedUrl = await bannersApi.uploadBannerImage(file);
      setImageUrl(uploadedUrl);
      setImgError(false);
    } catch (err: any) {
      setUploadError(err?.message || 'Không thể tải ảnh lên hệ thống lưu trữ');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleProcessFile(files[0]);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImgError(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    if (!imageUrl.trim()) {
      setError('Vui lòng tải ảnh lên từ máy tính hoặc điền đường dẫn ảnh banner');
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

  const busy = isSubmitting || isUploading;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.75)',
        backdropFilter: 'blur(5px)',
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
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--c-blue, #60a5fa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={22} />
            </div>
            <div>
              <h3 id="banner-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                {banner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--muted, #94a3b8)' }}>
                Tải ảnh banner quảng cáo hoặc điền đường dẫn ảnh
              </p>
            </div>
          </div>
          <button className="ibtn" onClick={onClose} disabled={busy} style={{ color: 'var(--muted, #94a3b8)' }}>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Banner Image Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Hình ảnh Banner <span style={{ color: '#ef4444' }}>*</span>
              </label>

              {/* Mode switch tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: inputMode === 'upload' ? 'var(--c-blue, #3b82f6)' : 'transparent',
                    color: inputMode === 'upload' ? '#fff' : 'var(--muted, #94a3b8)',
                    fontWeight: inputMode === 'upload' ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={13} />
                  Tải từ máy
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: inputMode === 'url' ? 'var(--c-blue, #3b82f6)' : 'transparent',
                    color: inputMode === 'url' ? '#fff' : 'var(--muted, #94a3b8)',
                    fontWeight: inputMode === 'url' ? 600 : 400,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Link2 size={13} />
                  Điền link URL
                </button>
              </div>
            </div>

            {uploadError && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '12.5px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* If an image exists, show Preview Card with change/delete actions */}
            {imageUrl.trim() ? (
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 7',
                    maxHeight: '200px',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {imgError ? (
                    <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', padding: '16px' }}>
                      <AlertCircle size={24} style={{ margin: '0 auto 6px auto', display: 'block' }} />
                      Không thể tải ảnh từ liên kết này
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      onError={() => setImgError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}

                  {/* Loading overlay while uploading */}
                  {isUploading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#fff',
                        zIndex: 2,
                      }}
                    >
                      <Loader2 size={28} className="spin" style={{ color: 'var(--c-blue, #60a5fa)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>Đang tải ảnh mới lên Cloudinary...</span>
                    </div>
                  )}
                </div>

                {/* Toolbar under preview */}
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--muted, #94a3b8)', wordBreak: 'break-all', flex: 1 }}>
                    {imageUrl.startsWith('data:') ? 'Ảnh tải lên từ máy tính (Data URL)' : imageUrl}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      <RefreshCw size={12} />
                      Đổi ảnh khác
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={busy}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      <Trash2 size={12} />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ) : inputMode === 'upload' ? (
              /* Drag & Drop Upload Zone */
              <div
                style={{
                  border: `2px dashed ${isDragOver ? 'var(--c-blue, #3b82f6)' : 'rgba(255, 255, 255, 0.18)'}`,
                  borderRadius: '12px',
                  padding: '28px 16px',
                  textAlign: 'center',
                  backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  opacity: busy ? 0.7 : 1,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!busy) setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (!busy) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => {
                  if (!busy) fileInputRef.current?.click();
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--c-blue, #60a5fa)' }} />
                    <b style={{ color: '#fff', fontSize: '14px' }}>Đang tải ảnh lên Cloudinary...</b>
                    <span style={{ color: 'var(--muted, #94a3b8)', fontSize: '12.5px' }}>
                      Vui lòng đợi trong giây lát
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--c-blue, #60a5fa)',
                      }}
                    >
                      <Upload size={22} />
                    </div>
                    <b style={{ color: '#fff', fontSize: '14px' }}>Kéo thả ảnh banner vào đây</b>
                    <span style={{ color: 'var(--muted, #94a3b8)', fontSize: '12.5px' }}>
                      hoặc bấm để chọn từ máy tính (Tối đa 5MB: JPG, PNG, WebP, GIF)
                    </span>
                    <span style={{ color: 'var(--muted, #64748b)', fontSize: '11.5px' }}>
                      Khuyến nghị ảnh nằm ngang tỉ lệ 16:9 hoặc 2:1
                    </span>
                  </>
                )}
              </div>
            ) : (
              /* URL Input Box */
              <div>
                <input
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImgError(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
                <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>
                  Dán đường dẫn ảnh trực tiếp từ internet
                </span>
              </div>
            )}
          </div>

          {/* Target Link */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 500 }}>
              Đường dẫn liên kết khi nhấn (Link URL)
            </label>
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
            <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: 'var(--muted, #94a3b8)' }}>
              Khách hàng nhấp vào banner sẽ chuyển hướng đến đường dẫn này
            </span>
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

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '16px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
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
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? <Loader2 className="spin" size={16} /> : banner ? 'Cập nhật Banner' : 'Tạo mới Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
