import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email').email('Email chưa đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
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
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
