import { describe, it, expect } from 'vitest'
import * as z from 'zod'

// Schema đăng ký kế thừa từ RegisterPage của ThunderFood
export const registerSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập họ và tên'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
    phone: z.string().regex(
      /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/,
      'Số điện thoại không hợp lệ'
    ),
    password: z
      .string()
      .regex(/^(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,12}$/, 'Mật khẩu 8-12 ký tự, ít nhất 1 hoa & 1 đặc biệt'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    terms: z.literal(true, {
      errorMap: () => ({ message: 'Bạn phải đồng ý với điều khoản' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  })

describe('Unit Test: Schema xác thực đăng ký tài khoản (Register Validation)', () => {
  it('1. Đăng ký thành công khi cung cấp đầy đủ thông tin hợp lệ', () => {
    const validData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0912345678',
      password: 'Password123@',
      confirmPassword: 'Password123@',
      terms: true,
    }

    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('2. Báo lỗi khi email sai định dạng', () => {
    const invalidData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana-sai-email',
      phone: '0912345678',
      password: 'Password123@',
      confirmPassword: 'Password123@',
      terms: true,
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Email không đúng định dạng')
    }
  })

  it('3. Báo lỗi khi số điện thoại không hợp lệ theo chuẩn Việt Nam', () => {
    const invalidData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '12345', // Quá ngắn, sai đầu số
      password: 'Password123@',
      confirmPassword: 'Password123@',
      terms: true,
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Số điện thoại không hợp lệ')
    }
  })

  it('4. Báo lỗi khi mật khẩu thiếu ký tự đặc biệt hoặc chữ hoa', () => {
    const invalidData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0912345678',
      password: 'password123', // Không có chữ hoa và ký tự đặc biệt
      confirmPassword: 'password123',
      terms: true,
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Mật khẩu 8-12 ký tự, ít nhất 1 hoa & 1 đặc biệt')
    }
  })

  it('5. Báo lỗi khi xác nhận mật khẩu không khớp', () => {
    const invalidData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0912345678',
      password: 'Password123@',
      confirmPassword: 'Password456@', // Khác mật khẩu
      terms: true,
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Mật khẩu không khớp')
    }
  })

  it('6. Báo lỗi khi chưa tick đồng ý điều khoản dịch vụ', () => {
    const invalidData = {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      phone: '0912345678',
      password: 'Password123@',
      confirmPassword: 'Password123@',
      terms: false, // Chưa đồng ý điều khoản
    }

    const result = registerSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Bạn phải đồng ý với điều khoản')
    }
  })
})
