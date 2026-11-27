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
  // 0. Mock API CSRF token: GET /v1/auth/csrf
  http.get('*/v1/auth/csrf', () => {
    return HttpResponse.json(
      {
        success: true,
        message: 'CSRF token ready',
        data: {
          token: 'mock-csrf-token',
          headerName: 'X-XSRF-TOKEN',
        },
      },
      {
        headers: {
          'X-CSRF-TOKEN': 'mock-csrf-token',
        },
      }
    )
  }),

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

  // 3.1. Mock API lấy chi tiết món ăn theo slug (phục vụ prefetch & detail page): GET /v1/products/slug/:slug
  http.get('*/v1/products/slug/:slug', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Thành công',
      data: {
        id: 101,
        name: 'Trà Sữa Trân Châu MSW',
        slug: String(params.slug),
        price: 35000,
        originalPrice: 40000,
        categoryName: 'Trà sữa',
        isAvailable: true,
        ratingAverage: 4.9,
        soldCount: 99,
        description: 'Mô tả trà sữa chuẩn vị thơm ngon',
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

  // 5. Mock API refresh token: POST /v1/auth/refresh-token
  http.post('*/v1/auth/refresh-token', () => {
    return HttpResponse.json({
      success: true,
      message: 'Làm mới token thành công',
      data: {
        user: {
          id: 1,
          email: 'khach@thunderfood.vn',
          name: 'Khách Hàng Thân Thiết',
          fullName: 'Khách Hàng Thân Thiết',
          role: 'CUSTOMER',
          avatarUrl: null,
        },
        token: 'mock-refreshed-customer-token',
      },
    })
  }),

  // 6. Mock API logout: POST /v1/auth/logout
  http.post('*/v1/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Đăng xuất thành công',
      data: null,
    })
  }),
]
