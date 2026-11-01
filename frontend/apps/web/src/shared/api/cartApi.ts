import { axiosClient } from './axiosClient';

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  originalPrice: number | null;
  price: number;
  quantity: number;
  stockQuantity: number;
  isAvailable: boolean;
  subtotal: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discountTotal: number;
  finalAmount: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const cartApi = {
  /**
   * GET /api/v1/cart
   * Lấy chi tiết toàn bộ giỏ hàng của người dùng hiện tại
   */
  getCart: async (): Promise<CartResponse> => {
    const res = await axiosClient.get<ApiResponse<CartResponse>>('/v1/cart');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể tải thông tin giỏ hàng');
    }
    return res.data.data;
  },

  /**
   * GET /api/v1/cart/count
   * Lấy tổng số lượng món trong giỏ để cập nhật badge Header/Nav
   */
  getCartCount: async (): Promise<number> => {
    const res = await axiosClient.get<ApiResponse<number>>('/v1/cart/count');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể lấy số lượng giỏ hàng');
    }
    return res.data.data ?? 0;
  },

  /**
   * POST /api/v1/cart/items
   * Thêm món ăn vào giỏ (tự động cộng dồn nếu đã có)
   */
  addToCart: async (request: AddToCartRequest): Promise<CartResponse> => {
    const res = await axiosClient.post<ApiResponse<CartResponse>>('/v1/cart/items', request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể thêm món vào giỏ hàng');
    }
    return res.data.data;
  },

  /**
   * PUT /api/v1/cart/items/{itemId}
   * Cập nhật số lượng món ăn trong giỏ (tối thiểu là 1)
   */
  updateCartItem: async (itemId: number, request: UpdateCartItemRequest): Promise<CartResponse> => {
    const res = await axiosClient.put<ApiResponse<CartResponse>>(`/v1/cart/items/${itemId}`, request);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể cập nhật số lượng món');
    }
    return res.data.data;
  },

  /**
   * DELETE /api/v1/cart/items/{itemId}
   * Xóa 1 món ăn khỏi giỏ hàng
   */
  removeCartItem: async (itemId: number): Promise<CartResponse> => {
    const res = await axiosClient.delete<ApiResponse<CartResponse>>(`/v1/cart/items/${itemId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể xóa món khỏi giỏ hàng');
    }
    return res.data.data;
  },

  /**
   * DELETE /api/v1/cart
   * Xóa sạch toàn bộ món ăn trong giỏ hàng
   */
  clearCart: async (): Promise<CartResponse> => {
    const res = await axiosClient.delete<ApiResponse<CartResponse>>('/v1/cart');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể làm rỗng giỏ hàng');
    }
    return res.data.data;
  },
};

