import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '@/pages/auth/authSchemas';

const validRegistration = {
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@gmail.com',
  phone: '0912345678',
  password: 'Password123@',
  confirmPassword: 'Password123@',
  terms: true,
};

describe('login form validation', () => {
  it('accepts a valid email, password, and remember setting', () => {
    expect(loginSchema.safeParse({
      email: 'khach@example.com',
      password: 'Password123@',
      remember: true,
    }).success).toBe(true);
  });

  it('rejects an invalid email and an empty password', () => {
    const result = loginSchema.safeParse({ email: 'invalid-email', password: '', remember: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.map((error) => error.message)).toEqual([
        'Email chưa đúng định dạng',
        'Vui lòng nhập mật khẩu',
      ]);
    }
  });
});

describe('registration form validation used by RegisterPage', () => {
  it('accepts complete valid registration details', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('rejects an invalid email address', () => {
    const result = registerSchema.safeParse({ ...validRegistration, email: 'not-an-email' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('Email không đúng định dạng');
  });

  it('rejects an invalid Vietnamese phone number', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '12345' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('Số điện thoại không hợp lệ');
  });

  it('requires an uppercase letter and a special character in the password', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some((error) => error.message === 'Mật khẩu 8-12 ký tự, ít nhất 1 hoa & 1 đặc biệt')).toBe(true);
    }
  });

  it('requires matching password confirmation', () => {
    const result = registerSchema.safeParse({ ...validRegistration, confirmPassword: 'Different123@' });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('Mật khẩu không khớp');
  });

  it('requires agreement to the terms', () => {
    const result = registerSchema.safeParse({ ...validRegistration, terms: false });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.errors[0].message).toBe('Bạn phải đồng ý với điều khoản');
  });
});
