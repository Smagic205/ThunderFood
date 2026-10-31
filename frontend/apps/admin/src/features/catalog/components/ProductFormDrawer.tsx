import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import type { Product, Category } from '../types';
import { catalogApi } from '../api/catalogApi';

interface ProductFormDrawerProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  isOpen,
  product,
  categories,
  isSubmitting = false,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [price, setPrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imgs, setImgs] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedProductIdRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      initializedProductIdRef.current = undefined;
      return;
    }

    const productId = product?.id ?? null;
    if (initializedProductIdRef.current !== productId) {
      initializedProductIdRef.current = productId;

      if (product) {
        setName(product.name);
        setSlug(product.slug || '');
        setCategoryId(product.categoryId);
        setPrice(product.price);
        setDiscountPrice(product.discountPrice ?? '');
        setStockQuantity(product.stockQuantity);
        setDescription(product.description);
        setIsAvailable(product.isAvailable);
        setImgs(product.imgs || []);
      } else {
        setName('');
        setSlug('');
        setCategoryId(categories[0]?.id ?? 0);
        setPrice('');
        setDiscountPrice('');
        setStockQuantity(50);
        setDescription('');
        setIsAvailable(true);
        setImgs([]);
      }
      setErrors({});
      setUploadError(null);
      return;
    }

    // If categories arrive after opening a new-product form, choose the first
    // category once without resetting the rest of the user's input.
    if (!product && categoryId === 0 && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [product, categories, categoryId, isOpen]);

  const selectedCategoryId = categoryId || categories[0]?.id || 1;

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    const remainingSlots = 8 - imgs.length;
    if (remainingSlots <= 0) {
      setUploadError('Tối đa 8 hình ảnh cho mỗi món ăn');
      return;
    }

    const filesToProcess = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      setUploadError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP, GIF)');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    const oversized = filesToProcess.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setUploadError(`Tệp "${oversized.name}" vượt quá dung lượng tối đa 5MB`);
      return;
    }

    try {
      setIsUploading(true);
      const uploadedUrls = await catalogApi.uploadImages(filesToProcess);
      setImgs((prev) => [...prev, ...uploadedUrls].slice(0, 8));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên hệ thống lưu trữ Cloudinary';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleMakeMainImage = (index: number) => {
    setImgs((prev) => {
      const newImgs = [...prev];
      const [item] = newImgs.splice(index, 1);
      newImgs.unshift(item);
      return newImgs;
    });
  };

  const handleDeleteImage = (index: number) => {
    setImgs((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Vui lòng nhập tên món (ít nhất 2 ký tự)';
    }
    if (price === '' || Number(price) <= 0) {
      errs.price = 'Giá bán phải lớn hơn 0 ₫';
    }
    if (discountPrice !== '' && discountPrice !== null) {
      if (Number(discountPrice) >= Number(price)) {
        errs.discountPrice = 'Giá khuyến mãi phải nhỏ hơn giá bán';
      }
    }
    if (stockQuantity < 0) {
      errs.stockQuantity = 'Số lượng tồn kho không hợp lệ';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isUploading) {
      setUploadError('Vui lòng đợi ảnh tải lên Cloudinary hoàn tất');
      return;
    }

    onSave({
      id: product?.id,
      name: name.trim(),
      slug: slug.trim() || undefined,
      categoryId: Number(selectedCategoryId),
      price: Number(price),
      discountPrice: discountPrice !== '' && discountPrice !== null ? Number(discountPrice) : null,
      stockQuantity: Number(stockQuantity),
      description: description.trim(),
      isAvailable,
      imgs,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(580px, 100vw)',
          height: '100dvh',
          backgroundColor: 'var(--surface, #1e2238)',
          borderLeft: '1px solid var(--line, rgba(255, 255, 255, 0.1))',
          boxShadow: 'var(--sh-2, 0 20px 40px rgba(0,0,0,0.4))',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slidein 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            {product ? 'Sửa món ăn' : 'Thêm món ăn mới'}
          </h2>
          <button
            className="ibtn"
            onClick={onClose}
            aria-label="Đóng"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="product-form"
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Tên món */}
          <div className="field">
            <span>Tên món <span style={{ color: 'var(--c-red)' }}>*</span></span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Burger Bò Thunder, Gà Giòn Sốt Cay..."
            />
            {errors.name && <small style={{ color: 'var(--c-red)', marginTop: '4px' }}>{errors.name}</small>}
          </div>

          {/* Slug */}
          <div className="field">
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Đường dẫn (Slug)</span>
              <span className="muted" style={{ fontSize: '12px' }}>Tùy chọn (tự sinh theo tên nếu để trống)</span>
            </span>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Ví dụ: burger-bo-thunder"
            />
          </div>

          {/* Danh mục */}
          <div className="field">
            <span>Danh mục <span style={{ color: 'var(--c-red)' }}>*</span></span>
            <select
              className="select"
              value={selectedCategoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Giá bán & Giá khuyến mãi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="field">
              <span>Giá bán (₫) <span style={{ color: 'var(--c-red)' }}>*</span></span>
              <input
                className="input"
                type="number"
                min="0"
                step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="69.000"
              />
              {errors.price && <small style={{ color: 'var(--c-red)', marginTop: '4px' }}>{errors.price}</small>}
            </div>

            <div className="field">
              <span>Giá khuyến mãi (₫)</span>
              <input
                className="input"
                type="number"
                min="0"
                step="1000"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Không bắt buộc"
              />
              {errors.discountPrice && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px' }}>{errors.discountPrice}</small>
              )}
            </div>
          </div>

          {/* Tồn kho */}
          <div className="field">
            <span>Số lượng tồn kho <span style={{ color: 'var(--c-red)' }}>*</span></span>
            <input
              className="input"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(Number(e.target.value))}
            />
            {errors.stockQuantity && (
              <small style={{ color: 'var(--c-red)', marginTop: '4px' }}>{errors.stockQuantity}</small>
            )}
          </div>

          {/* Mô tả */}
          <div className="field">
            <span>Mô tả món ăn</span>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nguyên liệu, khẩu phần, hương vị đặc trưng..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Upload hình ảnh (tối đa 8) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="lbl" style={{ fontWeight: 600, fontSize: '13.5px' }}>
                Hình ảnh món ({imgs.length}/8 ảnh, ảnh đầu là ảnh chính)
              </span>
            </div>

            {uploadError && (
              <div style={{ color: 'var(--c-red)', fontSize: '13px', marginBottom: '8px' }}>
                {uploadError}
              </div>
            )}

            <div
              className={`drop ${isDragOver ? 'over' : ''}`}
              style={{
                border: `2px dashed ${isDragOver ? 'var(--volt, #FFC107)' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: isDragOver ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                opacity: isUploading ? 0.7 : 1,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isUploading) setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (!isUploading) handleFiles(e.dataTransfer.files);
              }}
              onClick={() => {
                if (!isUploading) fileInputRef.current?.click();
              }}
            >
              {isUploading ? (
                <>
                  <Loader2 size={28} className="animate-spin text-volt" />
                  <b style={{ color: 'var(--ink)', fontSize: '14px' }}>Đang tải ảnh lên Cloudinary...</b>
                  <span className="muted" style={{ fontSize: '12.5px' }}>
                    Vui lòng đợi trong giây lát
                  </span>
                </>
              ) : (
                <>
                  <Upload size={28} className="muted" />
                  <b style={{ color: 'var(--ink)', fontSize: '14px' }}>Kéo thả ảnh vào đây</b>
                  <span className="muted" style={{ fontSize: '12.5px' }}>
                    hoặc bấm để chọn từ máy tính (Tối đa 5MB: JPG, PNG, WebP, GIF)
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                disabled={isUploading}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Image Previews */}
            {imgs.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                {imgs.map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid var(--volt, #FFC107)' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <img
                      src={src}
                      alt={`Ảnh ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {idx === 0 ? (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          backgroundColor: 'var(--volt, #FFC107)',
                          color: '#000',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '99px',
                        }}
                      >
                        Chính
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeMainImage(idx)}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '4px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '10.5px',
                          padding: '2px 6px',
                          borderRadius: '99px',
                          cursor: 'pointer',
                        }}
                        title="Đặt làm ảnh chính"
                      >
                        Chính
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        color: '#fff',
                        border: 'none',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                      title="Xóa ảnh"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Switch hiển thị */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: '12px',
            }}
          >
            <div>
              <b style={{ color: 'var(--ink)', display: 'block' }}>Hiển thị trên cửa hàng</b>
              <span className="muted" style={{ fontSize: '12.5px' }}>
                Tắt để tạm ẩn món ăn khỏi thực đơn khách hàng
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              <i></i>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            backgroundColor: 'var(--surface, #1e2238)',
          }}
        >
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting || isUploading}>
            Hủy
          </button>
          <button
            type="submit"
            form="product-form"
            className="btn btn-primary"
            disabled={isSubmitting || isUploading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              product ? 'Lưu thay đổi' : 'Thêm món'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
