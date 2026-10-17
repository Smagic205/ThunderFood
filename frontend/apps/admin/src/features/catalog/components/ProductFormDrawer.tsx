import React, { useState, useEffect, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import type { Product, Category } from '../types';

interface ProductFormDrawerProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
}

export const ProductFormDrawer: React.FC<ProductFormDrawerProps> = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [price, setPrice] = useState<number | ''>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imgs, setImgs] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategoryId(product.categoryId);
      setPrice(product.price);
      setDiscountPrice(product.discountPrice ?? '');
      setStockQuantity(product.stockQuantity);
      setDescription(product.description);
      setIsAvailable(product.isAvailable);
      setImgs(product.imgs || []);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || 1);
      setPrice('');
      setDiscountPrice('');
      setStockQuantity(50);
      setDescription('');
      setIsAvailable(true);
      setImgs([]);
    }
    setErrors({});
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remainingSlots = 8 - imgs.length;
    const filesToProcess = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImgs((prev) => (prev.length < 8 ? [...prev, reader.result as string] : prev));
        }
      };
      reader.readAsDataURL(file);
    });
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

    onSave({
      id: product?.id,
      name: name.trim(),
      categoryId: Number(categoryId),
      price: Number(price),
      discountPrice: discountPrice !== '' ? Number(discountPrice) : null,
      stockQuantity: Number(stockQuantity),
      description: description.trim(),
      isAvailable,
      imgs,
    });
    onClose();
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

          {/* Danh mục */}
          <div className="field">
            <span>Danh mục <span style={{ color: 'var(--c-red)' }}>*</span></span>
            <select
              className="select"
              value={categoryId}
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

            <div
              className={`drop ${isDragOver ? 'over' : ''}`}
              style={{
                border: `2px dashed ${isDragOver ? 'var(--volt, #FFC107)' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: isDragOver ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={28} className="muted" />
              <b style={{ color: 'var(--ink)', fontSize: '14px' }}>Kéo thả ảnh vào đây</b>
              <span className="muted" style={{ fontSize: '12.5px' }}>
                hoặc bấm để chọn từ máy tính (JPG, PNG, WebP)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
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
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" form="product-form" className="btn btn-primary">
            {product ? 'Lưu thay đổi' : 'Thêm món'}
          </button>
        </div>
      </div>
    </div>
  );
};
