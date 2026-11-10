import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  CreditCard, 
  Ticket, 
  Percent, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  X, 
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { useCartStore } from '@/shared/stores/cartStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { addressApi, type CustomerAddress } from '@/shared/api/addressApi';
import { voucherApi, type VoucherClientResponse } from '@/shared/api/voucherApi';
import { orderApi, type CheckoutPreviewResponse, type PlaceOrderRequest } from '@/shared/api/orderApi';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, fetchCart, resetCart, fetchCartCount } = useCartStore();
  const { showToast } = useToastStore();

  // State địa chỉ
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // State voucher
  const [availableVouchers, setAvailableVouchers] = useState<VoucherClientResponse[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [productVoucherCode, setProductVoucherCode] = useState<string>('');
  const [shippingVoucherCode, setShippingVoucherCode] = useState<string>('');
  const [voucherModalType, setVoucherModalType] = useState<'PRODUCT' | 'SHIPPING' | null>(null);

  // State thanh toán & ghi chú
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY' | 'MOMO'>('COD');
  const [note, setNote] = useState<string>('');

  // State Preview & Đặt hàng
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Tải giỏ hàng & địa chỉ ban đầu
  useEffect(() => {
    fetchCart();
    loadAddresses();
  }, [fetchCart]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const list = await addressApi.getMyAddresses();
      setAddresses(list);
      // Mặc định chọn địa chỉ default hoặc địa chỉ đầu tiên
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể tải danh sách địa chỉ nhận hàng', 'error');
    } finally {
      setLoadingAddresses(false);
    }
  };

  // 2. Tải danh sách voucher khả dụng theo tiền giỏ hàng
  useEffect(() => {
    const subtotal = cart?.subtotal || 0;
    setLoadingVouchers(true);
    voucherApi.getAvailableVouchers(subtotal)
      .then(setAvailableVouchers)
      .catch(() => {})
      .finally(() => setLoadingVouchers(false));
  }, [cart?.subtotal]);

  // 3. Gọi Preview Checkout mỗi khi Address hoặc Voucher thay đổi
  useEffect(() => {
    if (!selectedAddressId || !cart || cart.items.length === 0) {
      setPreview(null);
      return;
    }

    let active = true;
    setPreviewLoading(true);
    setPreviewError(null);

    orderApi.previewCheckout({
      addressId: selectedAddressId,
      productVoucherCode: productVoucherCode.trim() || undefined,
      shippingVoucherCode: shippingVoucherCode.trim() || undefined,
    })
      .then((res) => {
        if (active) {
          setPreview(res);
          setPreviewError(null);
        }
      })
      .catch((err: any) => {
        if (active) {
          setPreviewError(err?.message || 'Không thể tính toán chi phí đơn hàng');
        }
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedAddressId, productVoucherCode, shippingVoucherCode, cart]);

  // Đặt hàng
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast('Vui lòng chọn địa chỉ nhận hàng', 'error');
      return;
    }

    if (!cart || cart.items.length === 0) {
      showToast('Giỏ hàng của bạn đang trống', 'error');
      navigate('/cart');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: PlaceOrderRequest = {
        addressId: selectedAddressId,
        productVoucherCode: productVoucherCode.trim() || undefined,
        shippingVoucherCode: shippingVoucherCode.trim() || undefined,
        paymentMethod,
        note: note.trim() || undefined,
      };

      const order = await orderApi.placeOrder(payload);
      showToast('Đặt hàng thành công! Mã đơn: ' + order.orderCode, 'success');
      
      // Xóa giỏ hàng trên store
      resetCart();
      fetchCartCount();

      // Chuyển hướng sang trang quản lý đơn hàng
      navigate('/account/orders');
    } catch (err: any) {
      showToast(err?.message || 'Đặt hàng thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productVouchers = availableVouchers.filter((v) => v.voucherType === 'PRODUCT');
  const shippingVouchers = availableVouchers.filter((v) => v.voucherType === 'SHIPPING');

  if (!cart && loadingAddresses) {
    return (
      <div className="container py-32 text-center">
        <Loader2 className="animate-spin text-[var(--volt)] mx-auto mb-3" size={38} />
        <p className="text-[var(--ink-2)] font-medium">Đang chuẩn bị thông tin thanh toán...</p>
      </div>
    );
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="container py-20 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4 text-[var(--ink-3)]">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-sm text-[var(--ink-2)] mb-6">Hãy thêm món ăn yêu thích vào giỏ trước khi tiến hành thanh toán nhé.</p>
        <Link to="/menu" className="btn btn-primary">Khám phá thực đơn ngay</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Tiêu đề & Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--ink-3)] mb-4">
        <Link to="/cart" className="hover:text-[var(--ink)] flex items-center gap-1">
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </Link>
        <span>/</span>
        <span className="text-[var(--ink)] font-semibold">Xác nhận thanh toán</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[var(--ink)] mb-6">Thanh toán & Đặt hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Địa chỉ, Voucher, Phương thức thanh toán, Ghi chú */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
          <div className="card p-5 md:p-6 bg-[var(--surface)] border border-[var(--line)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--volt-soft)] text-[var(--c-amber)]">
                  <MapPin size={20} />
                </span>
                <h3 className="font-bold text-lg text-[var(--ink)]">Địa chỉ giao hàng</h3>
              </div>
              <Link to="/account/addresses" className="text-xs font-semibold text-[var(--c-blue)] hover:underline flex items-center gap-1">
                <Plus size={14} /> Quản lý địa chỉ
              </Link>
            </div>

            {loadingAddresses ? (
              <div className="py-6 text-center text-sm text-[var(--ink-3)]">
                <Loader2 className="animate-spin inline mr-2 text-[var(--volt)]" size={18} /> Đang tải địa chỉ...
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[var(--line)] text-center">
                <p className="text-sm text-[var(--ink-2)] mb-3">Bạn chưa lưu địa chỉ nhận hàng nào.</p>
                <Link to="/account/addresses" className="btn btn-sm btn-primary">
                  <Plus size={16} /> Thêm địa chỉ mới
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isSelected = addr.id === selectedAddressId;
                  const isInactiveWard = addr.ward && addr.ward.isActive === false;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => !isInactiveWard && setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected 
                          ? 'border-[var(--ink)] bg-amber-50/20 dark:bg-amber-950/10 shadow-sm' 
                          : 'border-[var(--line)] hover:border-[var(--ink-3)] bg-[var(--surface)]'
                      } ${isInactiveWard ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name="delivery_address"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        disabled={isInactiveWard}
                        className="mt-1 accent-[var(--ink)]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-[var(--ink)]">{addr.receiverName}</span>
                          <span className="text-xs text-[var(--ink-2)]">({addr.phone})</span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--volt-soft)] text-[var(--c-amber)]">
                              Mặc định
                            </span>
                          )}
                          {isInactiveWard && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">
                              Khu vực tạm ngưng phục vụ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--ink-2)] line-clamp-2">
                          {addr.fullAddress}
                        </p>
                        {addr.ward && (
                          <div className="text-[11px] text-[var(--ink-3)] mt-1">
                            Phí ship khu vực: <b>{Number(addr.ward.shippingFee).toLocaleString('vi-VN')}đ</b>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. KHUYẾN MÃI & MÃ GIẢM GIÁ */}
          <div className="card p-5 md:p-6 bg-[var(--surface)] border border-[var(--line)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-[var(--volt-soft)] text-[var(--c-amber)]">
                <Ticket size={20} />
              </span>
              <h3 className="font-bold text-lg text-[var(--ink)]">Mã giảm giá & Ưu đãi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voucher Món Ăn */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <Percent size={15} className="text-[var(--c-amber)]" /> Voucher Món Ăn
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoucherModalType('PRODUCT')}
                    className="text-xs font-semibold text-[var(--c-blue)] hover:underline"
                  >
                    Chọn voucher
                  </button>
                </div>

                {productVoucherCode ? (
                  <div className="flex items-center justify-between bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--line)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-sm text-[var(--ink)]">{productVoucherCode}</span>
                      {preview?.productVoucher && (
                        <span className="text-xs text-emerald-600 font-semibold truncate">
                          -{Number(preview.discountAmount).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setProductVoucherCode('')}
                      className="p-1 hover:bg-[var(--surface-2)] rounded text-[var(--ink-3)]"
                      title="Gỡ bỏ"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã voucher món..."
                      className="input h-9 text-xs uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setProductVoucherCode((e.target as HTMLInputElement).value.toUpperCase());
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) setProductVoucherCode(e.target.value.toUpperCase());
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Voucher Phí Ship */}
              <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)]/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <Truck size={15} className="text-emerald-500" /> Voucher Vận Chuyển
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoucherModalType('SHIPPING')}
                    className="text-xs font-semibold text-[var(--c-blue)] hover:underline"
                  >
                    Chọn voucher
                  </button>
                </div>

                {shippingVoucherCode ? (
                  <div className="flex items-center justify-between bg-[var(--surface)] px-3 py-2 rounded-lg border border-[var(--line)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-sm text-[var(--ink)]">{shippingVoucherCode}</span>
                      {preview?.shippingVoucher && (
                        <span className="text-xs text-emerald-600 font-semibold truncate">
                          -{Number(preview.voucherShippingDiscount).toLocaleString('vi-VN')}đ ship
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShippingVoucherCode('')}
                      className="p-1 hover:bg-[var(--surface-2)] rounded text-[var(--ink-3)]"
                      title="Gỡ bỏ"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã voucher ship..."
                      className="input h-9 text-xs uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setShippingVoucherCode((e.target as HTMLInputElement).value.toUpperCase());
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) setShippingVoucherCode(e.target.value.toUpperCase());
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. PHƯƠNG THỨC THANH TOÁN */}
          <div className="card p-5 md:p-6 bg-[var(--surface)] border border-[var(--line)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="p-1.5 rounded-lg bg-[var(--volt-soft)] text-[var(--c-amber)]">
                <CreditCard size={20} />
              </span>
              <h3 className="font-bold text-lg text-[var(--ink)]">Phương thức thanh toán</h3>
            </div>

            <div className="space-y-3">
              <label 
                className={`opt p-3.5 flex items-center justify-between rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-[var(--ink)] bg-amber-50/20 shadow-sm' : 'border-[var(--line)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ink)]">Thanh toán khi nhận hàng (COD)</h4>
                    <p className="text-xs text-[var(--ink-2)]">Thanh toán bằng tiền mặt khi shipper giao tận nơi</p>
                  </div>
                </div>
                <span className="pay-logo bg-emerald-600">COD</span>
              </label>

              <label 
                className={`opt p-3.5 flex items-center justify-between rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'VNPAY' ? 'border-[var(--ink)] bg-amber-50/20 shadow-sm' : 'border-[var(--line)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="VNPAY"
                    checked={paymentMethod === 'VNPAY'}
                    onChange={() => setPaymentMethod('VNPAY')}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ink)]">Cổng thanh toán VNPAY</h4>
                    <p className="text-xs text-[var(--ink-2)]">Quét mã VNPAY-QR hoặc thẻ ATM / Visa nội địa</p>
                  </div>
                </div>
                <span className="pay-logo bg-[#005BAA]">VNPAY</span>
              </label>

              <label 
                className={`opt p-3.5 flex items-center justify-between rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'MOMO' ? 'border-[var(--ink)] bg-amber-50/20 shadow-sm' : 'border-[var(--line)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={() => setPaymentMethod('MOMO')}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--ink)]">Ví điện tử MoMo</h4>
                    <p className="text-xs text-[var(--ink-2)]">Thanh toán tức thì qua ứng dụng MoMo</p>
                  </div>
                </div>
                <span className="pay-logo bg-[#A50064]">MOMO</span>
              </label>
            </div>
          </div>

          {/* 4. GHI CHÚ ĐƠN HÀNG */}
          <div className="card p-5 md:p-6 bg-[var(--surface)] border border-[var(--line)]">
            <h3 className="font-bold text-sm text-[var(--ink)] mb-2">Lời nhắn cho nhà hàng / Shipper (nếu có)</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Lấy nhiều ớt, giao trước 12h, gọi trước khi đến..."
              className="textarea w-full text-sm h-20"
              maxLength={255}
            />
          </div>

        </div>

        {/* Cột phải: Tóm tắt đơn hàng & Bảng kê chi phí */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          
          <div className="card p-5 md:p-6 bg-[var(--surface)] border border-[var(--line)] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)] mb-4">
              <h3 className="font-bold text-lg text-[var(--ink)]">Đơn hàng của bạn</h3>
              <span className="text-xs text-[var(--ink-3)]">{cart?.items.length} món</span>
            </div>

            {/* Danh sách món rút gọn */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-none mb-4">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] overflow-hidden shrink-0 border border-[var(--line)]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--ink-3)]">
                        TF
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[var(--ink)] truncate">{item.productName}</h4>
                    <p className="text-[11px] text-[var(--ink-3)]">
                      {Number(item.price).toLocaleString('vi-VN')}đ × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--ink)] shrink-0">
                    {Number(item.subtotal).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}
            </div>

            {/* Thanh tiến trình Freeship */}
            {preview && preview.amountNeededForFreeShip > 0 && (
              <div className="p-3 rounded-xl bg-[var(--volt-soft)] mb-4 text-xs text-[var(--c-amber)]">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles size={14} /> Mua thêm {Number(preview.amountNeededForFreeShip).toLocaleString('vi-VN')}đ để nhận FREESHIP sàn!
                </div>
                <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-[var(--volt)] h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (Number(preview.subtotalAmount) / Number(preview.freeShippingThreshold)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {preview && preview.isFreeShippingByThreshold && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs font-semibold flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} /> Đơn hàng của bạn đủ điều kiện FREESHIP toàn sàn!
              </div>
            )}

            {/* Bảng kê chi phí */}
            <div className="space-y-2.5 pt-3 border-t border-[var(--line)] text-sm">
              <div className="flex justify-between text-[var(--ink-2)]">
                <span>Tiền món ăn:</span>
                <span className="font-medium text-[var(--ink)]">
                  {Number(preview?.subtotalAmount ?? cart?.subtotal ?? 0).toLocaleString('vi-VN')}đ
                </span>
              </div>

              {preview && Number(preview.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá món:</span>
                  <span>-{Number(preview.discountAmount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              <div className="flex justify-between text-[var(--ink-2)]">
                <span>Phí giao hàng:</span>
                <span>
                  {preview ? (
                    Number(preview.originalShippingFee) > 0 ? (
                      `${Number(preview.originalShippingFee).toLocaleString('vi-VN')}đ`
                    ) : '0đ'
                  ) : (
                    '--'
                  )}
                </span>
              </div>

              {preview && Number(preview.thresholdShippingDiscount) > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs">
                  <span>Miễn phí vận chuyển sàn:</span>
                  <span>-{Number(preview.thresholdShippingDiscount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              {preview && Number(preview.voucherShippingDiscount) > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs">
                  <span>Voucher giảm phí ship:</span>
                  <span>-{Number(preview.voucherShippingDiscount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}

              {preview && (
                <div className="flex justify-between text-[var(--ink-2)] text-xs">
                  <span>Phí ship thực tế:</span>
                  <span className="font-semibold text-[var(--ink)]">
                    {Number(preview.finalShippingFee) === 0 ? 'Miễn phí' : `${Number(preview.finalShippingFee).toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
              )}

              {/* Lỗi preview nếu có */}
              {previewError && (
                <div className="p-2 rounded bg-red-50 text-red-600 text-xs flex items-center gap-1.5 mt-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              {/* Tổng cộng */}
              <div className="flex justify-between items-baseline pt-3 border-t border-[var(--line)]">
                <span className="font-bold text-base text-[var(--ink)]">Tổng thanh toán:</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[var(--c-red)]">
                    {Number(preview?.totalAmount ?? cart?.subtotal ?? 0).toLocaleString('vi-VN')}đ
                  </span>
                  <p className="text-[11px] text-[var(--ink-3)]">(Đã bao gồm thuế & phí ship)</p>
                </div>
              </div>
            </div>

            {/* Nút bấm Đặt hàng */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || previewLoading || !selectedAddressId || !!previewError}
              className="btn btn-primary btn-block btn-lg mt-6 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Đang xử lý đơn hàng...
                </>
              ) : previewLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Đang tính toán chi phí...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Xác nhận Đặt hàng</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-[var(--ink-3)] text-center mt-3">
              Nhấn “Xác nhận Đặt hàng” đồng nghĩa với việc bạn đồng ý với Điều khoản dịch vụ của ThunderFood.
            </p>
          </div>

        </div>
      </div>

      {/* MODAL CHỌN VOUCHER */}
      {voucherModalType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg bg-[var(--surface)] border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[var(--volt-soft)] text-[var(--c-amber)]">
                  <Ticket size={20} />
                </span>
                <h3 className="font-bold text-base text-[var(--ink)]">
                  {voucherModalType === 'PRODUCT' ? 'Chọn Voucher Món Ăn' : 'Chọn Voucher Vận Chuyển'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setVoucherModalType(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-3)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingVouchers ? (
                <div className="py-12 text-center text-sm text-[var(--ink-3)]">
                  <Loader2 className="animate-spin inline mr-2 text-[var(--volt)]" size={20} /> Đang kiểm tra mã...
                </div>
              ) : (voucherModalType === 'PRODUCT' ? productVouchers : shippingVouchers).length === 0 ? (
                <div className="py-12 text-center text-sm text-[var(--ink-3)]">
                  Không có mã giảm giá nào thuộc loại này.
                </div>
              ) : (
                (voucherModalType === 'PRODUCT' ? productVouchers : shippingVouchers).map((v) => {
                  const isPercent = v.discountType === 'PERCENT' || v.discountType === 'PERCENTAGE';
                  const isEligible = v.eligible;
                  const isSelected = (voucherModalType === 'PRODUCT' ? productVoucherCode : shippingVoucherCode) === v.code;

                  return (
                    <div 
                      key={v.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                        isSelected 
                          ? 'border-[var(--ink)] bg-amber-50/20' 
                          : isEligible 
                            ? 'border-[var(--line)] hover:border-[var(--ink-3)] bg-[var(--surface)]' 
                            : 'border-[var(--line)] bg-[var(--surface-2)]/40 opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm text-[var(--ink)]">{v.code}</span>
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[var(--volt-soft)] text-[var(--c-amber)]">
                            {isPercent ? `Giảm ${v.discountValue}%` : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ`}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-2)] line-clamp-1">{v.description || v.name}</p>
                        <div className="text-[11px] text-[var(--ink-3)] mt-1">
                          Đơn tối thiểu {Number(v.minOrderAmount).toLocaleString('vi-VN')}đ • HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                        </div>
                        {!isEligible && v.ineligibleReason && (
                          <div className="text-[11px] text-red-500 font-medium mt-1">
                            {v.ineligibleReason}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!isEligible}
                        onClick={() => {
                          if (voucherModalType === 'PRODUCT') {
                            setProductVoucherCode(isSelected ? '' : v.code);
                          } else {
                            setShippingVoucherCode(isSelected ? '' : v.code);
                          }
                          setVoucherModalType(null);
                        }}
                        className={`btn btn-sm shrink-0 ${
                          isSelected 
                            ? 'btn-ghost text-xs' 
                            : isEligible 
                              ? 'btn-primary text-xs' 
                              : 'btn-soft text-xs is-disabled'
                        }`}
                      >
                        {isSelected ? 'Gỡ bỏ' : 'Áp dụng'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] flex justify-end">
              <button 
                type="button" 
                onClick={() => setVoucherModalType(null)} 
                className="btn btn-sm btn-ghost"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
