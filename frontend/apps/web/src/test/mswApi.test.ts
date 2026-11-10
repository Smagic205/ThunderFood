import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './mocks/server'
import { cartApi } from '@/shared/api/cartApi'
import { authApi } from '@/shared/api/authApi'

describe('Integration Test: Mock API tầng mạng với MSW (Mock Service Worker)', () => {
  it('1. MSW chặn request GET /v1/cart và trả về dữ liệu mẫu mà không cần bật Backend', async () => {
    // Không dùng vi.spyOn! cartApi.getCart() thực sự gọi HTTP thông qua axiosClient
    const cart = await cartApi.getCart()

    expect(cart).toBeDefined()
    expect(cart.cartId).toBe(1)
    expect(cart.totalQuantity).toBe(2)
    expect(cart.items[0].productName).toBe('Trà Sữa Trân Châu MSW')
  })

  it('2. MSW mô phỏng kịch bản Server lỗi 500 (Ghi đè bằng server.use)', async () => {
    // Ghi đè handler chỉ riêng cho test case này
    server.use(
      http.get('*/v1/cart', () => {
        return HttpResponse.json(
          { success: false, message: 'Máy chủ cơ sở dữ liệu tạm thời gián đoạn' },
          { status: 500 }
        )
      })
    )

    // Kiểm tra cartApi bắt được lỗi và ném ra đúng ngoại lệ
    await expect(cartApi.getCart()).rejects.toThrow()
  })

  it('3. MSW xử lý POST /v1/auth/login thành công với tài khoản hợp lệ', async () => {
    const response = await authApi.login({
      email: 'khach@thunderfood.vn',
      password: 'Matkhau123@',
    })

    expect(response.user.email).toBe('khach@thunderfood.vn')
    expect(response.user.role).toBe('CUSTOMER')
    expect(response.token).toBe('mock-customer-token')
  })

  it('4. MSW xử lý POST /v1/auth/login trả về lỗi 400 khi sai thông tin', async () => {
    await expect(
      authApi.login({
        email: 'khach@thunderfood.vn',
        password: 'SaiMatKhau@',
      })
    ).rejects.toThrow()
  })
})
