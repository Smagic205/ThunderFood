import { http, HttpResponse } from 'msw'

// Dữ liệu mẫu chuẩn của ThunderFood
export const mockCartData = {
  cartId: 1,
  totalItems: 1,
  totalQuantity: 2,
  subtotal: 70000,
  discountTotal: 0,
  finalAmount: 70000,
  items: [
    {
      id: 10,
      productId: 101,
      productName: 'Trà Sữa Trân Châu MSW',
      productSlug: 'tra-sua-tran-chau-msw',
      imageUrl: '/images/tra-sua.jpg',
      originalPrice: 35000,
      price: 35000,
      quantity: 2,
      stockQuantity: 50,
      isAvailable: true,
      subtotal: 70000,
    },
  ],
}

export const mockProductsData = [
  {
    id: 101,
    name: 'Trà Sữa Trân Châu MSW',
    slug: 'tra-sua-tran-chau-msw',
    price: 35000,
    originalPrice: 40000,
    categoryName: 'Trà sữa',
    isAvailable: true,
    ratingAverage: 4.9,
    soldCount: 99,
  },
]

export const handlers = [
  // 1. Mock API lấy thông tin giỏ hàng: GET /v1/cart
  http.get('*/v1/cart', () => {
    return HttpResponse.json({
      success: true,
      message: 'Lấy giỏ hàng thành công',
      data: mockCartData,
    })
  }),

  // 2. Mock API đếm số lượng giỏ hàng: GET /v1/cart/count
  http.get('*/v1/cart/count', () => {
    return HttpResponse.json({
      success: true,
      message: 'Thành công',
      data: mockCartData.totalQuantity,
    })
  }),

  // 3. Mock API lấy danh sách món ăn: GET /v1/products
  http.get('*/v1/products', () => {
    return HttpResponse.json({
      success: true,
      message: 'Thành công',
      data: {
        content: mockProductsData,
        totalElements: 1,
        totalPages: 1,
      },
    })
  }),

  // 4. Mock API đăng nhập: POST /v1/auth/login
  http.post('*/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email === 'admin@thunderfood.vn') {
      return HttpResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: 99,
            email: 'admin@thunderfood.vn',
            name: 'Quản trị viên',
            fullName: 'Quản trị viên',
            role: 'ADMIN',
            avatarUrl: null,
          },
          token: 'mock-admin-token',
          accessToken: 'mock-admin-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    }

    if (body.email === 'khach@thunderfood.vn' && body.password === 'Matkhau123@') {
      return HttpResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            id: 1,
            email: 'khach@thunderfood.vn',
            name: 'Khách Hàng Thân Thiết',
            fullName: 'Khách Hàng Thân Thiết',
            role: 'CUSTOMER',
            avatarUrl: null,
          },
          token: 'mock-customer-token',
          accessToken: 'mock-customer-token',
          refreshToken: 'mock-refresh-token',
        },
      })
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'Email hoặc mật khẩu không chính xác',
      },
      { status: 400 }
    )
  }),
]
