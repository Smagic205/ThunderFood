import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ChevronRight, 
  Truck, 
  ShieldCheck, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/shared/stores/cartStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { useAuthStore } from '@/app/store/authStore';

const FREESHIP_THRESHOLD = 200000;
const SHIPPING_FEE = 15000;

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { 
    cart, 
    isLoading, 
    fetchCart, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCartStore();
  const { showToast } = useToastStore();

  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để xem giỏ hàng', 'info');
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated, fetchCart, navigate, showToast]);

  const handleUpdateQuantity = async (itemId: number, newQty: number, maxStock: number) => {
    if (newQty < 1) return;
    if (newQty > 99) {
      showToast('Số lượng tối đa cho mỗi món là 99', 'info');
      return;
    }
    if (maxStock && newQty > maxStock) {
      showToast(`Chỉ còn ${maxStock} món trong kho`, 'error');
      return;
    }

    try {
      setLoadingItemId(itemId);
      await updateQuantity(itemId, newQty);
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật số lượng', 'error');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: number, productName: string) => {
    try {
      setLoadingItemId(itemId);
      await removeItem(itemId);
      showToast(`Đã xóa “${productName}” khỏi giỏ hàng`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể xóa món ăn', 'error');
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setIsClearingCart(true);
      await clearCart();
      setConfirmClearOpen(false);
      showToast('Đã làm rỗng giỏ hàng', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể làm rỗng giỏ hàng', 'error');
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleCheckout = () => {
    // Nếu có món ngưng bán, cảnh báo trước
    const unavailableItem = cart?.items.find((i) => !i.isAvailable || i.stockQuantity <= 0);
    if (unavailableItem) {
      showToast(`Món “${unavailableItem.productName}” hiện không khả dụng. Vui lòng xóa trước khi đặt hàng.`, 'error');
      return;
    }
    navigate('/checkout');
  };

  // Trạng thái đang tải giỏ ban đầu
  if (isLoading && !cart) {
    return (
      <div className="container page center py-32 text-center">
        <Loader2 className="animate-spin text-[var(--volt)] mx-auto mb-4" size={40} />
        <h2 className="text-xl font-bold text-[var(--ink)]">Đang tải giỏ hàng của bạn...</h2>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  // Trạng thái giỏ hàng rỗng
  if (isEmpty) {
    return (
      <div className="container page center py-20 text-center" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div 
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'var(--surface-2)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 24px',
            color: 'var(--ink-3)',
          }}
        >
          <ShoppingBag size={48} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12 }}>Giỏ hàng của bạn đang trống</h1>
        <p className="muted" style={{ fontSize: '15px', marginBottom: 28, lineHeight: 1.6 }}>
          Bạn chưa chọn món ăn nào. Hãy khám phá ngay thực đơn đa dạng và các combo ưu đãi hấp dẫn của ThunderFood nhé!
        </p>
        <Link to="/menu" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span>Khám phá thực đơn</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  // Tính toán phí ship & freeship
  const finalAmount = cart?.finalAmount || 0;
  const isFreeShip = finalAmount >= FREESHIP_THRESHOLD;
  const shippingFee = isFreeShip ? 0 : SHIPPING_FEE;
  const grandTotal = finalAmount + shippingFee;
  const shipProgress = Math.min(100, Math.round((finalAmount / FREESHIP_THRESHOLD) * 100));

  return (
    <div className="container page pb-24">
      {/* Breadcrumb */}
      <nav className="crumbs" aria-label="Đường dẫn" style={{ marginBottom: 20 }}>
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} className="ic" />
        <span className="current">Giỏ hàng</span>
      </nav>

      {/* Header */}
      <div className="row wrap between" style={{ alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Giỏ hàng của bạn
          </h1>
          <p className="muted" style={{ marginTop: 4, fontSize: '14px' }}>
            Bạn đang có <b className="text-[var(--ink)]">{cart?.totalQuantity} món</b> trong giỏ hàng
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-ghost btn-sm text-[var(--c-red)]"
          onClick={() => setConfirmClearOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Trash2 size={16} />
          <span>Xóa toàn bộ giỏ</span>
        </button>
      </div>

      {/* Main Two-column layout */}
      <div className="two-col">
        {/* Left Column: Cart Items List */}
        <div className="card" style={{ padding: '0 24px' }}>
          {items.map((item) => {
            const isItemLoading = loadingItemId === item.id;
            const isOutOfStock = !item.isAvailable || item.stockQuantity <= 0;

            return (
              <div key={item.id} className="cart-line" style={{ opacity: isItemLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {/* Product Thumbnail */}
                <Link 
                  to={`/product/${item.productSlug || item.productId}`}
                  className="tile"
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 18,
                    overflow: 'hidden',
                    backgroundColor: 'var(--surface-2)',
                    display: 'block',
                    flexShrink: 0,
                  }}
                >
                  <img 
                    src={item.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'} 
                    alt={item.productName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </Link>

                {/* Product Details */}
                <div style={{ minWidth: 0, paddingRight: 8 }}>
                  <Link to={`/product/${item.productSlug || item.productId}`}>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--ink)' }}>{item.productName}</h3>
                  </Link>

                  <div className="row" style={{ alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--ink)' }}>
                      {item.price.toLocaleString('vi-VN')}₫
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <s className="muted" style={{ fontSize: '13px' }}>
                        {item.originalPrice.toLocaleString('vi-VN')}₫
                      </s>
                    )}
                  </div>

                  {/* Cảnh báo trạng thái nếu có */}
                  {isOutOfStock ? (
                    <div style={{ marginTop: 6 }}>
                      <span className="pill s-CANCELLED" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Tạm ngưng kinh doanh
                      </span>
                    </div>
                  ) : item.stockQuantity && item.quantity > item.stockQuantity ? (
                    <div style={{ marginTop: 6 }}>
                      <span className="pill s-PENDING" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Kho chỉ còn {item.stockQuantity} món
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* End: Quantity Stepper & Subtotal & Delete */}
                <div className="end">
                  <div className="row" style={{ alignItems: 'center', gap: 14 }}>
                    {/* Stepper */}
                    <div 
                      className="stepper" 
                      style={{ 
                        height: 38, 
                        display: 'flex', 
                        alignItems: 'center', 
                        background: 'var(--surface-2)', 
                        border: '1px solid var(--line)', 
                        borderRadius: 999, 
                        padding: '0 4px' 
                      }}
                    >
                      <button 
                        type="button" 
                        className="ibtn" 
                        aria-label="Giảm" 
                        disabled={isItemLoading}
                        onClick={() => {
                          if (item.quantity === 1) {
                            handleRemoveItem(item.id, item.productName);
                          } else {
                            handleUpdateQuantity(item.id, item.quantity - 1, item.stockQuantity);
                          }
                        }}
                        style={{ width: 30, height: 30 }}
                      >
                        <Minus size={14} />
                      </button>

                      <output style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '13.5px' }}>
                        {isItemLoading ? <Loader2 size={13} className="animate-spin inline" /> : item.quantity}
                      </output>

                      <button 
                        type="button" 
                        className="ibtn" 
                        aria-label="Tăng" 
                        disabled={isItemLoading || (item.stockQuantity ? item.quantity >= item.stockQuantity : false)}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stockQuantity)}
                        style={{ width: 30, height: 30 }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <b style={{ fontSize: '1.05rem', fontWeight: 800, minWidth: 90, textAlign: 'right', color: 'var(--ink)' }}>
                      {item.subtotal.toLocaleString('vi-VN')}₫
                    </b>

                    {/* Delete button */}
                    <button 
                      type="button" 
                      className="ibtn text-[var(--ink-3)] hover:text-[#e13636]" 
                      title="Xóa món khỏi giỏ"
                      disabled={isItemLoading}
                      onClick={() => handleRemoveItem(item.id, item.productName)}
                      style={{ width: 34, height: 34 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Sticky Order Summary */}
        <aside className="sum card" style={{ padding: 24, borderRadius: 24 }}>
          {/* Freeship Progress */}
          <div className="freeship" style={{ marginBottom: 20 }}>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <Truck size={18} className="text-[var(--c-amber)]" />
              {isFreeShip ? (
                <b>🎉 Đơn hàng của bạn được MIỄN PHÍ giao hàng!</b>
              ) : (
                <span>
                  Mua thêm <b>{(FREESHIP_THRESHOLD - finalAmount).toLocaleString('vi-VN')}₫</b> để được Miễn phí giao hàng
                </span>
              )}
            </div>
            <div className="progress" style={{ marginTop: 10, height: 6 }}>
              <i style={{ width: `${shipProgress}%` }}></i>
            </div>
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16 }}>Tóm tắt đơn hàng</h3>

          <div className="sum-line">
            <span>Tạm tính (giá gốc)</span>
            <span style={{ fontWeight: 600 }}>{cart?.subtotal?.toLocaleString('vi-VN')}₫</span>
          </div>

          {cart && cart.discountTotal > 0 && (
            <div className="sum-line">
              <span>Khuyến mãi tiết kiệm</span>
              <span className="disc">- {cart.discountTotal.toLocaleString('vi-VN')}₫</span>
            </div>
          )}

          <div className="sum-line">
            <span>Phí vận chuyển dự kiến</span>
            <span>
              {isFreeShip ? (
                <span className="disc">Miễn phí</span>
              ) : (
                `${SHIPPING_FEE.toLocaleString('vi-VN')}₫`
              )}
            </span>
          </div>

          <div className="sum-line total">
            <div>
              <span>Tổng thanh toán</span>
              <small className="faint block" style={{ fontSize: '12px', fontWeight: 400 }}>
                Đã bao gồm thuế & phí dịch vụ
              </small>
            </div>
            <b style={{ color: 'var(--ink)' }}>{grandTotal.toLocaleString('vi-VN')}₫</b>
          </div>

          <button 
            type="button" 
            className="btn btn-primary btn-lg w-full"
            onClick={handleCheckout}
            style={{ marginTop: 20, width: '100%', height: 50, fontSize: '15px' }}
          >
            Tiến hành đặt hàng
          </button>

          <Link 
            to="/menu" 
            className="btn btn-ghost w-full text-center"
            style={{ marginTop: 10, width: '100%', display: 'block' }}
          >
            Tiếp tục chọn món
          </Link>

          <div 
            className="row center" 
            style={{ 
              gap: 8, 
              marginTop: 18, 
              paddingTop: 16, 
              borderTop: '1px solid var(--line)', 
              color: 'var(--ink-3)', 
              fontSize: '12px' 
            }}
          >
            <ShieldCheck size={16} />
            <span>Thanh toán an toàn & bảo mật 100%</span>
          </div>
        </aside>
      </div>

      {/* Modal xác nhận làm rỗng giỏ */}
      {confirmClearOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(7, 11, 38, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setConfirmClearOpen(false)}
        >
          <div 
            className="card"
            style={{
              maxWidth: 420,
              width: '100%',
              padding: 24,
              borderRadius: 20,
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--c-red)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <AlertCircle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Xóa toàn bộ giỏ hàng?</h3>
            </div>
            <p className="muted" style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: 20 }}>
              Tất cả các món ăn trong giỏ hàng sẽ bị xóa. Bạn có chắc chắn muốn thực hiện thao tác này?
            </p>
            <div className="row end" style={{ gap: 10 }}>
              <button 
                type="button" 
                className="btn btn-ghost" 
                disabled={isClearingCart}
                onClick={() => setConfirmClearOpen(false)}
              >
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                disabled={isClearingCart}
                onClick={handleClearCart}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isClearingCart ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span>Xóa giỏ hàng</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

