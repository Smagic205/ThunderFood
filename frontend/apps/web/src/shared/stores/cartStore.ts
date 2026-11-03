import { create } from 'zustand';
import { cartApi, type CartResponse } from '../api/cartApi';

interface CartState {
  cart: CartResponse | null;
  totalQuantity: number;
  isLoading: boolean;
  isAdding: boolean;
  error: string | null;

  fetchCart: () => Promise<void>;
  fetchCartCount: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: number, quantity: number) => Promise<boolean>;
  removeItem: (itemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  totalQuantity: 0,
  isLoading: false,
  isAdding: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const cart = await cartApi.getCart();
      set({
        cart,
        totalQuantity: cart.totalQuantity ?? 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.message || 'Không thể tải giỏ hàng',
        isLoading: false,
      });
    }
  },

  fetchCartCount: async () => {
    try {
      const count = await cartApi.getCartCount();
      set({ totalQuantity: count });
    } catch {
      // Bỏ qua lỗi khi chưa đăng nhập hoặc mạng yếu
    }
  },

  addToCart: async (productId: number, quantity = 1) => {
    set({ isAdding: true, error: null });
    try {
      const updatedCart = await cartApi.addToCart({ productId, quantity });
      set({
        cart: updatedCart,
        totalQuantity: updatedCart.totalQuantity ?? 0,
        isAdding: false,
      });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể thêm món vào giỏ hàng';
      set({ error: msg, isAdding: false });
      throw new Error(msg);
    }
  },

  updateQuantity: async (itemId: number, quantity: number) => {
    set({ error: null });
    try {
      const updatedCart = await cartApi.updateCartItem(itemId, { quantity });
      set({
        cart: updatedCart,
        totalQuantity: updatedCart.totalQuantity ?? 0,
      });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật số lượng món';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  removeItem: async (itemId: number) => {
    set({ error: null });
    try {
      const updatedCart = await cartApi.removeCartItem(itemId);
      set({
        cart: updatedCart,
        totalQuantity: updatedCart.totalQuantity ?? 0,
      });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xóa món khỏi giỏ hàng';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  clearCart: async () => {
    set({ error: null });
    try {
      const emptyCart = await cartApi.clearCart();
      set({
        cart: emptyCart,
        totalQuantity: 0,
      });
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể làm rỗng giỏ hàng';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  resetCart: () => {
    set({ cart: null, totalQuantity: 0, error: null, isLoading: false, isAdding: false });
  },
}));

