import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '@/shared/stores/cartStore'
import { cartApi, type CartResponse } from '@/shared/api/cartApi'

// Mock dữ liệu giả lập giỏ hàng
const mockCartData: CartResponse = {
  cartId: 1,
  totalItems: 2,
  totalQuantity: 3,
  subtotal: 120000,
  discountTotal: 20000,
  finalAmount: 100000,
  items: [
    {
      id: 10,
      productId: 101,
      productName: 'Trà Sữa Trân Châu',
      productSlug: 'tra-sua-tran-chau',
      imageUrl: '/images/tra-sua.jpg',
      originalPrice: 40000,
      price: 35000,
      quantity: 2,
      stockQuantity: 50,
      isAvailable: true,
      subtotal: 70000,
    },
    {
      id: 11,
      productId: 102,
      productName: 'Bánh Mì Thịt Nướng',
      productSlug: 'banh-mi-thit-nuong',
      imageUrl: '/images/banh-mi.jpg',
      originalPrice: 30000,
      price: 30000,
      quantity: 1,
      stockQuantity: 20,
      isAvailable: true,
      subtotal: 30000,
    },
  ],
}

describe('Unit Test: useCartStore (Quản lý trạng thái giỏ hàng)', () => {
  beforeEach(() => {
    // Reset state của Zustand store trước mỗi bài test để không bị ảnh hưởng chéo
    useCartStore.getState().resetCart()
    vi.restoreAllMocks()
  })

  it('1. Trạng thái khởi tạo giỏ hàng phải rỗng', () => {
    const state = useCartStore.getState()
    expect(state.cart).toBeNull()
    expect(state.totalQuantity).toBe(0)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('2. fetchCart() thành công: Cập nhật dữ liệu giỏ hàng và số lượng món', async () => {
    // Giả lập (Mock) API getCart trả về mockCartData
    vi.spyOn(cartApi, 'getCart').mockResolvedValueOnce(mockCartData)

    await useCartStore.getState().fetchCart()

    const state = useCartStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.cart).toEqual(mockCartData)
    expect(state.totalQuantity).toBe(3)
    expect(state.error).toBeNull()
  })

  it('3. fetchCart() thất bại: Xử lý lỗi và lưu thông báo lỗi vào store', async () => {
    // Giả lập API getCart ném ra lỗi mạng
    vi.spyOn(cartApi, 'getCart').mockRejectedValueOnce(new Error('Mất kết nối máy chủ'))

    await useCartStore.getState().fetchCart()

    const state = useCartStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.cart).toBeNull()
    expect(state.error).toBe('Mất kết nối máy chủ')
  })

  it('4. addToCart() thành công: Cập nhật giỏ hàng và trả về true', async () => {
    vi.spyOn(cartApi, 'addToCart').mockResolvedValueOnce(mockCartData)

    const result = await useCartStore.getState().addToCart(101, 2)

    expect(result).toBe(true)
    const state = useCartStore.getState()
    expect(state.cart).toEqual(mockCartData)
    expect(state.totalQuantity).toBe(3)
    expect(state.isAdding).toBe(false)
  })

  it('5. addToCart() thất bại: Bắt lỗi khi sản phẩm hết hàng hoặc lỗi server', async () => {
    const errorMessage = 'Sản phẩm này tạm thời đã hết hàng'
    vi.spyOn(cartApi, 'addToCart').mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    })

    await expect(useCartStore.getState().addToCart(999, 1)).rejects.toThrow(errorMessage)

    const state = useCartStore.getState()
    expect(state.error).toBe(errorMessage)
    expect(state.isAdding).toBe(false)
  })

  it('6. updateQuantity() thành công: Cập nhật lại số lượng món trong giỏ', async () => {
    const updatedCart = { ...mockCartData, totalQuantity: 5 }
    vi.spyOn(cartApi, 'updateCartItem').mockResolvedValueOnce(updatedCart)

    const result = await useCartStore.getState().updateQuantity(10, 4)

    expect(result).toBe(true)
    const state = useCartStore.getState()
    expect(state.totalQuantity).toBe(5)
  })

  it('7. removeItem() thành công: Xóa món và giảm tổng số lượng', async () => {
    const cartAfterRemove = { ...mockCartData, items: [mockCartData.items[0]], totalQuantity: 2 }
    vi.spyOn(cartApi, 'removeCartItem').mockResolvedValueOnce(cartAfterRemove)

    const result = await useCartStore.getState().removeItem(11)

    expect(result).toBe(true)
    const state = useCartStore.getState()
    expect(state.totalQuantity).toBe(2)
    expect(state.cart?.items.length).toBe(1)
  })

  it('8. resetCart(): Dọn dẹp toàn bộ dữ liệu giỏ hàng về mặc định', () => {
    // Set một state bất kỳ trước
    useCartStore.setState({ cart: mockCartData, totalQuantity: 3, error: 'Lỗi cũ' })

    // Gọi hàm reset
    useCartStore.getState().resetCart()

    const state = useCartStore.getState()
    expect(state.cart).toBeNull()
    expect(state.totalQuantity).toBe(0)
    expect(state.error).toBeNull()
  })
})
