import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { VoucherAdmin, VoucherPayload, VoucherType, DiscountType } from '../types';

interface VoucherFormModalProps {
  isOpen: boolean;
  voucher: VoucherAdmin | null;
  onClose: () => void;
  onSave: (data: VoucherPayload) => Promise<any> | void;
  isSubmitting?: boolean;
}

function formatDateForInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export const VoucherFormModal: React.FC<VoucherFormModalProps> = ({
  isOpen,
  voucher,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [voucherType, setVoucherType] = useState<VoucherType>('PRODUCT');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const busy = isSubmitting || localSubmitting;

  useEffect(() => {
    if (!isOpen) return;

    if (voucher) {
      setCode(voucher.code);
      setName(voucher.name);
      setDescription(voucher.description || '');
      setVoucherType(voucher.voucherType);
      setDiscountType(voucher.discountType);
      setDiscountValue(voucher.discountValue);
      setMinOrderAmount(voucher.minOrderAmount || 0);
      setMaxDiscountAmount(voucher.maxDiscountAmount ?? '');
      setUsageLimit(voucher.usageLimit ?? '');
      setUsageLimitPerUser(voucher.usageLimitPerUser || 1);
      setStartDate(formatDateForInput(voucher.startDate));
      setEndDate(formatDateForInput(voucher.endDate));
      setIsActive(voucher.isActive);
    } else {
      setCode('');
      setName('');
      setDescription('');
      setVoucherType('PRODUCT');
      setDiscountType('PERCENT');
      setDiscountValue(10);
      setMinOrderAmount(0);
      setMaxDiscountAmount('');
      setUsageLimit(100);
      setUsageLimitPerUser(1);

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      setStartDate(formatDateForInput(now.toISOString()));
      setEndDate(formatDateForInput(nextMonth.toISOString()));
      setIsActive(true);
    }
    setError('');
  }, [voucher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Vui lòng nhập mã voucher');
      return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(cleanCode)) {
      setError('Mã voucher chỉ chứa ký tự chữ, số, gạch dưới hoặc gạch ngang');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên voucher');
      return;
    }
    if (!discountValue || discountValue <= 0) {
      setError('Giá trị giảm giá phải lớn hơn 0');
      return;
    }
    if (discountType === 'PERCENT' && discountValue > 100) {
      setError('Mức giảm theo % không được vượt quá 100%');
      return;
    }
    if (!startDate || !endDate) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu');
      return;
    }

    try {
      setLocalSubmitting(true);
      setError('');

      await onSave({
        code: cleanCode,
        name: name.trim(),
        description: description.trim() || undefined,
        voucherType,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: discountType === 'PERCENT' && maxDiscountAmount !== '' ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit !== '' ? Number(usageLimit) : null,
        usageLimitPerUser: Number(usageLimitPerUser) || 1,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu voucher. Vui lòng kiểm tra lại.');
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
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {voucher ? `Sửa voucher: ${voucher.code}` : 'Thêm mã khuyến mãi mới'}
            </h2>
            <p className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
              Thiết lập mã giảm giá món ăn hoặc ưu đãi phí vận chuyển
            </p>
          </div>
          <button className="ibtn" onClick={onClose} aria-label="Đóng" style={{ width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
          {/* Hàng 1: Mã voucher & Tên voucher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span className="lbl">Mã voucher (CODE) *</span>
              <input
                type="text"
                className="input"
                placeholder="VD: THUNDER30"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={busy || !!voucher}
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                required
              />
            </label>

            <label className="field">
              <span className="lbl">Tên hiển thị *</span>
              <input
                type="text"
                className="input"
                placeholder="VD: Giảm 30k tiệc trưa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={busy}
                required
              />
            </label>
          </div>

          {/* Mô tả */}
          <label className="field">
            <span className="lbl">Mô tả chi tiết</span>
            <input
              type="text"
              className="input"
              placeholder="VD: Áp dụng cho các đơn từ 120.000đ khung giờ 11h - 13h"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
            />
          </label>

          {/* Hàng 2: Loại Voucher & Hình thức giảm */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span className="lbl">Loại voucher *</span>
              <select
                className="select"
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value as VoucherType)}
                disabled={busy}
              >
                <option value="PRODUCT">Giảm giá món ăn (PRODUCT)</option>
                <option value="SHIPPING">Giảm phí vận chuyển (SHIPPING)</option>
              </select>
            </label>

            <label className="field">
              <span className="lbl">Hình thức giảm giá *</span>
              <select
                className="select"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                disabled={busy}
              >
                <option value="PERCENT">Theo phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
              </select>
            </label>
          </div>

          {/* Hàng 3: Giá trị giảm & Mức giảm tối đa (nếu %)) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span className="lbl">
                {discountType === 'PERCENT' ? 'Mức giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
              </span>
              <input
                type="number"
                className="input"
                min="0.01"
                step="any"
                max={discountType === 'PERCENT' ? '100' : undefined}
                placeholder={discountType === 'PERCENT' ? 'VD: 15' : 'VD: 20000'}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                disabled={busy}
                required
              />
            </label>

            {discountType === 'PERCENT' ? (
              <label className="field">
                <span className="lbl">Mức giảm tối đa (VNĐ)</span>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="1000"
                  placeholder="VD: 50000 (để trống nếu không giới hạn)"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value ? parseFloat(e.target.value) : '')}
                  disabled={busy}
                />
              </label>
            ) : (
              <label className="field">
                <span className="lbl">Đơn tối thiểu (VNĐ)</span>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="1000"
                  placeholder="VD: 100000"
                  value={minOrderAmount || ''}
                  onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                  disabled={busy}
                />
              </label>
            )}
          </div>

          {/* Nếu là %, hiện đơn tối thiểu ở hàng riêng */}
          {discountType === 'PERCENT' && (
            <label className="field">
              <span className="lbl">Đơn hàng tối thiểu (VNĐ)</span>
              <input
                type="number"
                className="input"
                min="0"
                step="1000"
                placeholder="VD: 100000 (đơn phải đạt giá trị này mới áp dụng)"
                value={minOrderAmount || ''}
                onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                disabled={busy}
              />
            </label>
          )}

          {/* Hàng 4: Giới hạn lượt dùng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span className="lbl">Tổng lượt phát hành</span>
              <input
                type="number"
                className="input"
                min="1"
                placeholder="VD: 200 (để trống nếu vô hạn)"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value ? parseInt(e.target.value) : '')}
                disabled={busy}
              />
            </label>

            <label className="field">
              <span className="lbl">Giới hạn mỗi khách hàng *</span>
              <input
                type="number"
                className="input"
                min="1"
                placeholder="VD: 1"
                value={usageLimitPerUser || 1}
                onChange={(e) => setUsageLimitPerUser(parseInt(e.target.value) || 1)}
                disabled={busy}
                required
              />
            </label>
          </div>

          {/* Hàng 5: Thời gian áp dụng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label className="field">
              <span className="lbl">Bắt đầu hiệu lực *</span>
              <input
                type="datetime-local"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={busy}
                required
              />
            </label>

            <label className="field">
              <span className="lbl">Hết hạn vào lúc *</span>
              <input
                type="datetime-local"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={busy}
                required
              />
            </label>
          </div>

          {/* Trạng thái hoạt động */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Kích hoạt ngay</span>
              <p className="muted" style={{ fontSize: '12px' }}>
                Cho phép khách hàng tra cứu và áp dụng voucher này khi đủ điều kiện
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={busy}
              />
              <i />
            </label>
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />
                  Đang lưu...
                </>
              ) : voucher ? (
                'Lưu thay đổi'
              ) : (
                'Tạo voucher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
