import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Receipt, 
  ShoppingBag, 
  Truck, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  X, 
  Phone, 
  User, 
  MapPin, 
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  orderApi, 
  type OrderResponse, 
  type OrderTrackingResponse 
} from '@/shared/api/orderApi';
import { useToastStore } from '@/shared/stores/toastStore';

type OrderTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export const OrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<OrderTab>('ALL');
  const [page, setPage] = useState(0);

  // Modal chi tiết & tracking
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<OrderResponse | null>(null);
  const [trackingData, setTrackingData] = useState<OrderTrackingResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal hủy đơn
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch danh sách đơn hàng
  const { 
    data: ordersData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['my-orders', activeTab, page],
    queryFn: () => orderApi.getMyOrders({
      status: activeTab === 'ALL' ? undefined : activeTab,
      page,
      size: 10,
    }),
  });

  const orders = ordersData?.content || [];
  const pagination = ordersData?.pagination;

  // Xem chi tiết & tracking
  const handleOpenDetail = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setLoadingDetail(true);
    try {
      const [orderRes, trackRes] = await Promise.all([
        orderApi.getOrderDetail(orderId),
        orderApi.getOrderTracking(orderId).catch(() => null),
      ]);
      setDetailData(orderRes);
      setTrackingData(trackRes);
    } catch (err: any) {
      showToast(err?.message || 'Không thể lấy thông tin chi tiết đơn hàng', 'error');
      setSelectedOrderId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancelOrderId || !cancelReason.trim()) {
      showToast('Vui lòng nhập lý do hủy đơn hàng', 'error');
      return;
    }

    try {
      setIsCancelling(true);
      await orderApi.cancelOrder(cancelOrderId, { reason: cancelReason.trim() });
      showToast('Đã hủy đơn hàng thành công', 'success');
      setCancelModalOpen(false);
      setCancelOrderId(null);
      setCancelReason('');

      // Refresh lại danh sách và chi tiết nếu đang mở
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      if (selectedOrderId === cancelOrderId) {
        handleOpenDetail(cancelOrderId);
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper hiển thị Badge trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="pill s-PENDING">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="pill s-CONFIRMED">Đã xác nhận</span>;
      case 'PREPARING':
        return <span className="pill s-PREPARING">Đang nấu món</span>;
      case 'SHIPPING':
        return <span className="pill s-DELIVERING">Đang giao hàng</span>;
      case 'DELIVERED':
        return <span className="pill s-COMPLETED">Giao thành công</span>;
      case 'CANCELLED':
        return <span className="pill s-CANCELLED">Đã hủy</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  return (
    <div>
      {/* Tiêu đề trang */}
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Đơn hàng của tôi</h1>
          <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
            Theo dõi tiến trình các món đang giao và xem lại lịch sử các đơn đã đặt.
          </p>
        </div>
      </div>

      {/* Tabs trạng thái */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ xác nhận' },
          { key: 'CONFIRMED', label: 'Đã nhận đơn' },
          { key: 'SHIPPING', label: 'Đang giao' },
          { key: 'DELIVERED', label: 'Đã giao' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key as OrderTab);
              setPage(0);
            }}
            className={`chip cursor-pointer text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--ink-3)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
          <p className="text-[var(--ink-2)] font-medium">Đang tải lịch sử đơn hàng...</p>
        </div>
      ) : isError ? (
        <div className="card p-8 text-center text-red-500">
          <AlertCircle size={32} className="mx-auto mb-2" />
          <p>Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty card">
          <div className="art-wrap text-[#2450D6] bg-blue-50 dark:bg-blue-950/40">
            <Receipt size={48} />
          </div>
          <h3>Chưa có đơn hàng nào</h3>
          <p>Các đơn hàng bạn đặt sẽ được lưu trữ và hiển thị chi tiết tại đây.</p>
          <Link className="btn btn-primary mt-2" to="/menu">
            <ShoppingBag size={18} />
            <span>Khám phá thực đơn ngay</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPending = order.status === 'PENDING';

            return (
              <div 
                key={order.id} 
                className="card p-5 bg-[var(--surface)] border border-[var(--line)] hover:shadow-md transition-shadow"
              >
                {/* Header card: Mã đơn, ngày tạo, status badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[var(--ink)]">#{order.orderCode}</span>
                    <span className="text-xs text-[var(--ink-3)]">•</span>
                    <span className="text-xs text-[var(--ink-3)] flex items-center gap-1">
                      <Calendar size={13} />
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>

                {/* Danh sách món tóm tắt */}
                <div className="py-3.5 space-y-2.5">
                  {order.previewItems?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] overflow-hidden shrink-0 border border-[var(--line)]">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--ink-3)]">
                            TF
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[var(--ink)] truncate">{item.productName}</h4>
                        <p className="text-xs text-[var(--ink-3)]">
                          Số lượng: {item.quantity} • Đơn giá: {Number(item.unitPrice).toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--ink)] shrink-0">
                        {Number(item.lineTotal).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}

                  {order.totalItems > (order.previewItems?.length || 0) && (
                    <p className="text-xs text-[var(--ink-3)] italic">
                      ...và thêm {order.totalItems - (order.previewItems?.length || 0)} món khác
                    </p>
                  )}
                </div>

                {/* Footer card: Tổng tiền & Nút thao tác */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--line)]">
                  <div>
                    <span className="text-xs text-[var(--ink-3)]">Tổng thanh toán ({order.totalItems} món): </span>
                    <span className="text-lg font-bold text-[var(--c-red)] ml-1">
                      {Number(order.totalAmount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelOrderId(order.id);
                          setCancelModalOpen(true);
                        }}
                        className="btn btn-sm btn-ghost text-[var(--c-red)] hover:bg-red-50 text-xs px-3"
                      >
                        Hủy đơn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(order.id)}
                      className="btn btn-sm btn-primary text-xs px-4"
                    >
                      <span>Xem chi tiết & Theo dõi</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Phân trang đơn giản */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                disabled={!pagination.hasPrevious}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="btn btn-sm btn-ghost text-xs"
              >
                Trang trước
              </button>
              <span className="text-xs text-[var(--ink-2)] font-medium">
                Trang {pagination.page + 1} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="btn btn-sm btn-ghost text-xs"
              >
                Trang sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL CHI TIẾT ĐƠN HÀNG & THEO DÕI */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[var(--ink)]">
                  Chi tiết đơn hàng {detailData?.orderCode ? `#${detailData.orderCode}` : ''}
                </h3>
                {detailData && (
                  <p className="text-xs text-[var(--ink-3)]">
                    Đặt lúc: {new Date(detailData.createdAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedOrderId(null);
                  setDetailData(null);
                  setTrackingData(null);
                }}
                className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-3)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail ? (
                <div className="py-16 text-center">
                  <Loader2 className="animate-spin text-[var(--volt)] mx-auto mb-3" size={32} />
                  <p className="text-sm text-[var(--ink-2)]">Đang tải chi tiết đơn hàng...</p>
                </div>
              ) : detailData ? (
                <>
                  {/* TIẾN TRÌNH THEO DÕI (TIMELINE STEPPER) */}
                  <div className="p-4 rounded-xl bg-[var(--surface-2)]/40 border border-[var(--line)]">
                    <h4 className="font-bold text-sm text-[var(--ink)] mb-3 flex items-center gap-1.5">
                      <Truck size={17} className="text-[var(--c-amber)]" /> Trạng thái giao hàng
                    </h4>

                    {trackingData?.shipperName && (
                      <div className="mb-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--line)] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-[var(--volt-soft)] text-[var(--c-amber)] flex items-center justify-center font-bold text-sm">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--ink)]">Tài xế giao hàng: {trackingData.shipperName}</p>
                            <p className="text-[11px] text-[var(--ink-3)]">Số điện thoại: {trackingData.shipperPhone}</p>
                          </div>
                        </div>
                        {trackingData.shipperPhone && (
                          <a 
                            href={`tel:${trackingData.shipperPhone}`} 
                            className="btn btn-sm btn-primary text-xs gap-1 py-1 px-3"
                          >
                            <Phone size={13} /> Gọi ngay
                          </a>
                        )}
                      </div>
                    )}

                    {/* Timeline List */}
                    <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--line)]">
                      {(trackingData?.timeline || []).map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)] bg-[var(--volt)]" />
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-bold text-xs text-[var(--ink)]">
                              {step.status === 'PENDING' && 'Khách hàng đặt hàng'}
                              {step.status === 'CONFIRMED' && 'Cửa hàng đã xác nhận'}
                              {step.status === 'PREPARING' && 'Bếp đang chuẩn bị món'}
                              {step.status === 'SHIPPING' && 'Shipper đang giao hàng'}
                              {step.status === 'DELIVERED' && 'Giao hàng thành công'}
                              {step.status === 'CANCELLED' && 'Đơn hàng đã hủy'}
                            </span>
                            <span className="text-[11px] text-[var(--ink-3)] shrink-0">
                              {new Date(step.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {step.note && (
                            <p className="text-xs text-[var(--ink-2)] mt-0.5">{step.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* THÔNG TIN NGƯỜI NHẬN & ĐỊA CHỈ */}
                  <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-3)] mb-2">
                      Thông tin giao nhận
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="font-bold text-[var(--ink)]">
                        {detailData.receiverName} <span className="font-normal text-[var(--ink-2)]">({detailData.receiverPhone})</span>
                      </p>
                      <p className="text-xs text-[var(--ink-2)] flex items-start gap-1">
                        <MapPin size={14} className="shrink-0 text-[var(--ink-3)] mt-0.5" />
                        <span>{detailData.shippingAddress}</span>
                      </p>
                      {detailData.note && (
                        <p className="text-xs text-[var(--c-amber)] font-medium mt-1">
                          Ghi chú: {detailData.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DANH SÁCH MÓN ĂN */}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-3)] mb-2">
                      Món ăn đã đặt ({detailData.items.length})
                    </h4>
                    <div className="border border-[var(--line)] rounded-xl divide-y divide-[var(--line)] overflow-hidden">
                      {detailData.items.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] overflow-hidden shrink-0 border border-[var(--line)]">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--ink-3)]">
                                TF
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-sm text-[var(--ink)] truncate">{item.productName}</h5>
                            <span className="text-xs text-[var(--ink-3)]">
                              {Number(item.unitPrice).toLocaleString('vi-VN')}đ × {item.quantity}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-[var(--ink)]">
                            {Number(item.lineTotal).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BẢNG KÊ TIỀN & VOUCHER */}
                  <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] space-y-2 text-sm">
                    <div className="flex justify-between text-[var(--ink-2)]">
                      <span>Tiền món ăn:</span>
                      <span className="font-medium text-[var(--ink)]">
                        {Number(detailData.subtotalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {Number(detailData.discountAmount) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Giảm giá món ({detailData.productVoucher?.code || 'Voucher'}):</span>
                        <span>-{Number(detailData.discountAmount).toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[var(--ink-2)]">
                      <span>Phí giao hàng:</span>
                      <span className="text-[var(--ink)]">
                        {Number(detailData.originalShippingFee).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {Number(detailData.originalShippingFee) > Number(detailData.shippingFee) && (
                      <div className="flex justify-between text-emerald-600 text-xs">
                        <span>Giảm phí giao hàng:</span>
                        <span>-{Number(Number(detailData.originalShippingFee) - Number(detailData.shippingFee)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-[var(--line)]">
                      <span className="font-bold text-base text-[var(--ink)]">Tổng tiền:</span>
                      <span className="text-xl font-bold text-[var(--c-red)]">
                        {Number(detailData.totalAmount).toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="text-xs text-[var(--ink-3)] pt-1 flex items-center justify-between">
                      <span>Phương thức thanh toán: <b>{detailData.paymentMethod}</b></span>
                      <span>Trạng thái: <b>{detailData.paymentStatus}</b></span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] flex items-center justify-between">
              {detailData?.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelOrderId(detailData.id);
                    setCancelModalOpen(true);
                  }}
                  className="btn btn-sm btn-ghost text-[var(--c-red)] hover:bg-red-50 text-xs"
                >
                  Hủy đơn này
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  setDetailData(null);
                  setTrackingData(null);
                }}
                className="btn btn-sm btn-primary text-xs px-5"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN HỦY ĐƠN */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-[var(--surface)] border border-[var(--line)] shadow-2xl p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[var(--c-red)] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--ink)] text-center mb-1">Xác nhận hủy đơn hàng</h3>
            <p className="text-xs text-[var(--ink-2)] text-center mb-4">
              Món ăn sẽ được hoàn tồn kho và các voucher áp dụng sẽ được trả lại tài khoản của bạn.
            </p>

            <div className="mb-4">
              <label className="lbl text-xs mb-1">Lý do hủy đơn *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Đổi ý không muốn ăn, đặt nhầm địa chỉ, bận việc đột xuất..."
                className="textarea w-full text-xs h-20"
                maxLength={200}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setCancelOrderId(null);
                  setCancelReason('');
                }}
                className="btn btn-ghost flex-1 text-xs"
                disabled={isCancelling}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="btn btn-danger flex-1 text-xs"
              >
                {isCancelling ? <Loader2 className="animate-spin mr-1" size={15} /> : null}
                <span>Xác nhận hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
