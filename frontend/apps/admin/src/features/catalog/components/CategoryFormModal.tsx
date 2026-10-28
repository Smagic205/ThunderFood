import React, { useState, useEffect, useRef } from 'react';
import { X, Link2, Loader2 } from 'lucide-react';
import type { Category } from '../types';

interface CategoryFormModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (catData: Partial<Category>) => Promise<any> | void;
  isSubmitting?: boolean;
}

/**
 * Chuyển chuỗi tiếng Việt có dấu thành slug không dấu, dạng kebab-case.
 * Ví dụ: "Gà giòn & Burger" → "ga-gion-burger"
 */
function toSlug(str: string): string {
  // Bảng ánh xạ dấu tiếng Việt → ASCII
  const from =
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
  const to =
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  let result = str.toLowerCase().trim();
  for (let i = 0; i < from.length; i++) {
    result = result.replaceAll(from[i], to[i]);
  }
  return result
    .replace(/[^a-z0-9\s-]/g, '')  // bỏ ký tự đặc biệt
    .replace(/[\s-]+/g, '-')        // khoảng trắng / dấu gạch → 1 dấu gạch
    .replace(/^-+|-+$/g, '');       // bỏ gạch đầu/cuối
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const initializedCategoryIdRef = useRef<number | null | undefined>(undefined);

  const busy = isSubmitting || localSubmitting;

  useEffect(() => {
    if (!isOpen) {
      initializedCategoryIdRef.current = undefined;
      return;
    }

    const categoryId = category?.id ?? null;
    if (initializedCategoryIdRef.current === categoryId) return;
    initializedCategoryIdRef.current = categoryId;

    if (category) {
      setName(category.name);
      setSlug(category.slug || toSlug(category.name));
      setSlugTouched(true); // Khi sửa, giữ slug hiện tại
      setDescription(category.description);
      setIsActive(category.isActive);
    } else {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setDescription('');
      setIsActive(true);
    }
    setError('');
  }, [category, isOpen]);

  // Tự động sinh slug từ tên nếu người dùng chưa chỉnh tay
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      setSlug(toSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugTouched(true);
    // Chỉ cho phép ký tự hợp lệ trong slug
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  // Reset về auto-gen khi bấm nút reset
  const handleSlugReset = () => {
    setSlugTouched(false);
    setSlug(toSlug(name));
    slugInputRef.current?.focus();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!name.trim() || name.trim().length < 2) {
      setError('Vui lòng nhập tên danh mục (ít nhất 2 ký tự)');
      return;
    }
    const finalSlug = slug || toSlug(name);
    if (!finalSlug) {
      setError('Slug không hợp lệ, vui lòng nhập slug cho danh mục');
      return;
    }

    try {
      setLocalSubmitting(true);
      setError('');
      await onSave({
        id: category?.id,
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch (err: any) {
      // Giữ modal mở để người dùng chỉnh sửa và hiển thị lỗi từ backend
      setError(err?.message || 'Không thể lưu danh mục. Vui lòng kiểm tra lại.');
    } finally {
      setLocalSubmitting(false);
    }
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
          maxWidth: '480px',
          backgroundColor: 'var(--surface-1, #1e2238)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            {category ? 'Sửa danh mục' : 'Thêm danh mục'}
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
        <form id="category-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <span>Tên danh mục <span style={{ color: 'var(--c-red)' }}>*</span></span>
            <input
              className="input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Burger, Đồ uống, Gà giòn..."
            />
            {error && <small style={{ color: 'var(--c-red)', marginTop: '4px' }}>{error}</small>}
          </div>

          {/* Slug Field */}
          <div className="field">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={14} style={{ opacity: 0.6 }} />
              Đường dẫn (slug)
            </span>
            <div style={{ position: 'relative' }}>
              <input
                ref={slugInputRef}
                className="input"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="tu-dong-sinh-tu-ten"
                style={{ paddingRight: slugTouched ? '72px' : undefined }}
              />
              {slugTouched && (
                <button
                  type="button"
                  onClick={handleSlugReset}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11.5px',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                    opacity: 0.8,
                  }}
                >
                  Tự sinh
                </button>
              )}
            </div>
            {slug && (
              <small className="muted" style={{ marginTop: '4px', fontSize: '12px' }}>
                URL: /danh-muc/<b style={{ color: 'var(--volt, #FFB81C)' }}>{slug}</b>
              </small>
            )}
          </div>

          <div className="field">
            <span>Mô tả ngắn</span>
            <textarea
              className="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả danh mục hiển thị trên thực đơn..."
              style={{ resize: 'vertical' }}
            />
          </div>

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
                Tắt để tạm ẩn danh mục khỏi thực đơn khách hàng
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <i></i>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
          }}
        >
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button
            type="submit"
            form="category-form"
            className="btn btn-primary"
            disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {busy && <Loader2 size={16} className="spin" />}
            {category ? (busy ? 'Đang lưu…' : 'Lưu thay đổi') : (busy ? 'Đang thêm…' : 'Thêm danh mục')}
          </button>
        </div>
      </div>
    </div>
  );
};

