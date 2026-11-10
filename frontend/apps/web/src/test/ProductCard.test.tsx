import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductCard } from '@/shared/components/ui/ProductCard'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/shared/stores/cartStore'
import { useToastStore } from '@/shared/stores/toastStore'
import { wishlistApi } from '@/shared/api/wishlistApi'
import type { Product } from '@/shared/types'

// Mock đối tượng navigate của react-router-dom để kiểm tra chuyển trang
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Dữ liệu mẫu sản phẩm
const baseProduct: Product = {
  id: 101,
  name: 'Trà Sữa Trân Châu Đường Đen',
  slug: 'tra-sua-tran-chau-duong-den',
  price: 30000,
  originalPrice: 40000, // Có giảm giá 25%
  categoryName: 'Trà sữa',
  imageUrl: '/images/tra-sua.png',
  isBestSeller: true,
  ratingAverage: 4.8,
  soldCount: 120,
}

const renderProductCard = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductCard product={baseProduct} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Component & Integration Test: ProductCard (<ProductCard />)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(wishlistApi, 'getAll').mockResolvedValue([])
    useAuthStore.setState({ isAuthenticated: false, user: null })
    useCartStore.getState().resetCart()
    useToastStore.setState({ toasts: [] })
  })

  it('1. Render đầy đủ thông tin: Tên, giá bán, giá gốc, badge giảm giá và bán chạy', () => {
    renderProductCard()

    // Kiểm tra tên món
    expect(screen.getByText('Trà Sữa Trân Châu Đường Đen')).toBeInTheDocument()

    // Kiểm tra category
    expect(screen.getByText('Trà sữa')).toBeInTheDocument()

    // Kiểm tra nhãn Bán chạy
    expect(screen.getByText('Bán chạy')).toBeInTheDocument()

    // Kiểm tra nhãn giảm giá: (1 - 30000/40000) * 100 = 25% -> "-25%"
    expect(screen.getByText('-25%')).toBeInTheDocument()

    // Kiểm tra hiển thị giá bán và giá gạch ngang
    expect(screen.getByText(/30\.000đ/)).toBeInTheDocument()
    expect(screen.getByText(/40\.000đ/)).toBeInTheDocument()

    // Kiểm tra rating & lượt bán
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText('Đã bán 120')).toBeInTheDocument()
  })

  it('2. Người dùng CHƯA đăng nhập: Bấm "Thêm vào giỏ" -> Điều hướng sang /login và hiện Toast nhắc nhở', async () => {
    const user = userEvent.setup()
    const showToastSpy = vi.spyOn(useToastStore.getState(), 'showToast')

    renderProductCard()

    // Tìm nút thêm vào giỏ thông qua aria-label
    const addToCartBtn = screen.getByRole('button', { name: /Thêm vào giỏ/i })
    await user.click(addToCartBtn)

    // Kiểm tra gọi thông báo nhắc đăng nhập
    expect(showToastSpy).toHaveBeenCalledWith('Vui lòng đăng nhập để thêm món vào giỏ hàng', 'info')

    // Kiểm tra điều hướng sang trang đăng nhập
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('3. Người dùng ĐÃ đăng nhập: Bấm "Thêm vào giỏ" -> Gọi addToCart và hiện Toast thành công', async () => {
    const user = userEvent.setup()

    // Giả lập trạng thái đã đăng nhập
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 1,
        email: 'khachhang@thunderfood.vn',
        name: 'Nguyễn Văn Test',
        role: 'CUSTOMER',
      },
    })

    // Mock hàm addToCart của cartStore
    const addToCartMock = vi.fn().mockResolvedValue(true)
    vi.spyOn(useCartStore.getState(), 'addToCart').mockImplementation(addToCartMock)
    const showToastSpy = vi.spyOn(useToastStore.getState(), 'showToast')

    renderProductCard()

    const addToCartBtn = screen.getByRole('button', { name: /Thêm vào giỏ/i })
    await user.click(addToCartBtn)

    // Kiểm tra addToCart được gọi đúng productId và số lượng 1
    await waitFor(() => {
      expect(addToCartMock).toHaveBeenCalledWith(101, 1)
    })

    // Kiểm tra Toast báo thêm thành công
    expect(showToastSpy).toHaveBeenCalledWith('Đã thêm “Trà Sữa Trân Châu Đường Đen” vào giỏ hàng', 'success')
  })
})
