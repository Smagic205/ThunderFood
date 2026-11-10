import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, ShieldCheck, User, Mail, Phone, Lock } from 'lucide-react';
import type { CreateStaffPayload } from '../types';

interface CreateStaffModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffPayload) => void;
}

export const CreateStaffModal: React.FC<CreateStaffModalProps> = ({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateStaffPayload>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên nhân viên';
    }

    const emailRegex = /^[a-zA-Z0-9_!#$%&'*+/=?`{|}~^.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng';
    }

    const phoneRegex = /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không đúng định dạng (VD: 0912345678)';
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/;
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải từ 8-12 ký tự, gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt (@, #, $, %, v.v.)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) return;

    onSubmit({
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="dlg-h">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} style={{ color: 'var(--c-blue)' }} />
            <h3>Thêm tài khoản nhân viên</h3>
          </div>
          <button className="ibtn" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="dlg-b">
            <p className="muted" style={{ marginBottom: '16px', fontSize: '13.5px' }}>
              Tài khoản được tạo sẽ có quyền <b>STAFF</b> để đăng nhập vào ứng dụng điều phối & giao hàng ThunderFood Staff.
            </p>

            {/* Họ tên */}
            <label className="field" style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: 600 }}>Họ và tên (*)</span>
              <div className="input-ic">
                <div className="ic-prefix"><User size={16} /></div>
                <input
                  className="input"
                  name="fullName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.fullName && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {errors.fullName}
                </small>
              )}
            </label>

            {/* Email */}
            <label className="field" style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: 600 }}>Địa chỉ Email (*)</span>
              <div className="input-ic">
                <div className="ic-prefix"><Mail size={16} /></div>
                <input
                  className="input"
                  type="email"
                  name="email"
                  placeholder="nhanvien@thunderfood.vn"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {errors.email}
                </small>
              )}
            </label>

            {/* Phone */}
            <label className="field" style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: 600 }}>Số điện thoại (*)</span>
              <div className="input-ic">
                <div className="ic-prefix"><Phone size={16} /></div>
                <input
                  className="input"
                  type="tel"
                  name="phone"
                  placeholder="0912345678"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {errors.phone}
                </small>
              )}
            </label>

            {/* Password */}
            <label className="field" style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Mật khẩu khởi tạo (*)</span>
              <div className="input-ic">
                <div className="ic-prefix"><Lock size={16} /></div>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Từ 8-12 ký tự, 1 chữ hoa, 1 ký tự đặc biệt"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  style={{ paddingRight: '46px' }}
                />
                <button
                  type="button"
                  className="input-ic-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Xem mật khẩu'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                <small style={{ color: 'var(--c-red)', marginTop: '4px', display: 'block' }}>
                  {errors.password}
                </small>
              ) : (
                <small className="muted" style={{ marginTop: '4px', display: 'block', fontSize: '12px' }}>
                  Quy chuẩn mật khẩu: 8-12 ký tự, gồm chữ hoa (A-Z) và ký tự đặc biệt (@, #, $, %, v.v.)
                </small>
              )}
            </label>
          </div>

          <div className="dlg-f">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
