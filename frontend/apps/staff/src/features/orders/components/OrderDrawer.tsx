import React from 'react';
import { X, Check, Printer, Loader2, Tag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  staffOrderApi,
  type StaffOrderDetail,
  type StaffOrderListItem,
  type OrderItemDetail,
  type OrderStatusHistoryItem,
} from '../api/staffOrderApi';

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const PAYSTAT_MAP: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

const formatMoney = (amount?: number | null | string): string => {
  if (amount === undefined || amount === null) return '0';
  const num = typeof amount === 'number' ? amount : Number(amount);
  return isNaN(num) ? '0' : num.toLocaleString('vi-VN');
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('vi-VN');
  } catch {
    return String(dateStr);
  }
};

interface OrderDrawerProps {
  orderId: number | null;
  initialOrder?: StaffOrderListItem | null;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  orderId,
  initialOrder,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const { data: detailData, isLoading, isError, error } = useQuery<StaffOrderDetail>({
    queryKey: ['staff-order-detail', orderId],
    queryFn: () => staffOrderApi.getOrderDetail(orderId!),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });

  if (!orderId && !initialOrder) return null;

  const order = detailData || initialOrder;
  if (!order) return null;

  const canAct = order.status === 'PENDING';
  const items = detailData?.items || [];
  const history = detailData?.history || [];

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <div>
            <h3>{order.orderCode}</h3>
            {isLoading && (
              <span className="muted" style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={12} className="animate-spin" /> Đang cập nhật dữ liệu...
              </span>
            )}
          </div>
          <button className="ibtn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="dlg-b">
          <div className="row wrap" style={{ marginBottom: '18px', gap: '8px', alignItems: 'center' }}>
            <span className={`pill s-${order.status}`}>{STATUS_MAP[order.status] || order.status}</span>
            <span className={`pill p-${order.paymentStatus}`}>{PAYSTAT_MAP[order.paymentStatus] || order.paymentStatus}</span>
            <span className="faint" style={{ fontSize: '13px', marginLeft: 'auto' }}>
              {formatDate(order.createdAt)}
            </span>
          </div>

          {isError && (
            <div className="card card-p" style={{ background: '#FFF1F0', border: '1px solid #FFCCC7', marginBottom: '16px' }}>
              <p style={{ color: 'var(--c-red)', fontSize: '13px', margin: 0 }}>
                Không thể tải chi tiết mới nhất: {(error as any)?.message || 'Lỗi kết nối'}
              </p>
            </div>
          )}

          {/* Khách hàng */}
          <div className="card card-p" style={{ boxShadow: 'none', marginBottom: '16px' }}>
            <div className="card-h" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem' }}>Khách hàng & Người nhận</h3>
            </div>
            <dl className="kv">
              <dt>Người nhận</dt><dd>{order.receiverName}</dd>
              <dt>Điện thoại</dt>
              <dd>
                <a className="tlink" href={`tel:${order.receiverPhone}`}>{order.receiverPhone}</a>
              </dd>
              <dt>Địa chỉ</dt>
              <dd>
                {order.shippingAddress}
                {order.wardName && <span className="muted" style={{ display: 'block', fontSize: '13px' }}>Khu vực: {order.wardName}</span>}
              </dd>
              <dt>Thanh toán</dt><dd>{order.paymentMethod}</dd>
              {order.packageCode && (
                <>
                  <dt>Gói hàng</dt>
                  <dd><span className="tag">{order.packageCode}</span></dd>
                </>
              )}
              {detailData?.note && (
                <>
                  <dt>Ghi chú</dt>
                  <dd style={{ color: 'var(--c-amber)', fontWeight: 500 }}>{detailData.note}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Món trong đơn */}
          <div className="card card-p" style={{ boxShadow: 'none', marginBottom: '16px' }}>
            <div className="card-h" style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem' }}>Món trong đơn</h3>
            </div>

            {isLoading && items.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <Loader2 size={24} className="animate-spin text-muted" />
              </div>
            ) : items.length > 0 ? (
              items.map((item: OrderItemDetail, idx: number) => {
                const itemPrice = item.productPrice ?? item.price ?? 0;
                const itemTotal = item.lineTotal ?? item.totalPrice ?? (itemPrice * item.quantity);
                const itemImage = item.imageUrl || item.productThumbnail;

                return (
                  <div className="mini-item" key={item.id ?? idx}>
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={item.productName}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="tile xs" style={{ background: 'var(--volt-soft)', color: 'var(--volt)' }}>M</div>
                    )}
                    <div className="grow">
                      <b style={{ fontWeight: 600 }}>{item.productName}</b>
                      <div className="faint">{formatMoney(itemPrice)}đ × {item.quantity}</div>
                    </div>
                    <b>{formatMoney(itemTotal)}đ</b>
                  </div>
                );
              })
            ) : (
              <p className="muted" style={{ fontSize: '13px', margin: '8px 0' }}>
                Tổng {initialOrder?.totalItems ?? items.length} món
              </p>
            )}

            <hr className="divider" style={{ margin: '12px 0 10px' }} />

            {detailData && (
              <>
                <div className="sum-line">
                  <span>Tạm tính</span>
                  <span>{formatMoney(detailData.subtotalAmount)}đ</span>
                </div>

                {detailData.discountAmount > 0 && (
                  <div className="sum-line" style={{ color: 'var(--c-green)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={14} /> Giảm giá món
                      {detailData.productVoucher && ` (${detailData.productVoucher.code})`}
                    </span>
                    <span>-{formatMoney(detailData.discountAmount)}đ</span>
                  </div>
                )}

                <div className="sum-line">
                  <span>Phí giao hàng</span>
                  <span>
                    {detailData.originalShippingFee && detailData.originalShippingFee > detailData.shippingFee && (
                      <span className="muted" style={{ textDecoration: 'line-through', marginRight: '6px' }}>
                        {formatMoney(detailData.originalShippingFee)}đ
                      </span>
                    )}
                    {detailData.shippingFee === 0 ? 'Miễn phí' : `${formatMoney(detailData.shippingFee)}đ`}
                    {detailData.shippingVoucher && ` (${detailData.shippingVoucher.code})`}
                  </span>
                </div>
              </>
            )}

            <div className="sum-line total">
              <span>Tổng cộng</span>
              <b>{formatMoney(order.totalAmount)}đ</b>
            </div>
          </div>

          {/* Lịch sử trạng thái */}
          <div className="card card-p" style={{ boxShadow: 'none' }}>
            <div className="card-h" style={{ marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem' }}>Lịch sử trạng thái</h3>
            </div>
            {history.length > 0 ? (
              <div className="tl">
                {history.map((h: OrderStatusHistoryItem, idx: number) => (
                  <div className={`tl-i ${h.status === 'CANCELLED' ? 'bad' : 'done'}`} key={h.id ?? idx}>
                    <span
                      className="tl-dot"
                      style={h.status === 'CANCELLED' ? { background: 'var(--c-red)', borderColor: 'var(--c-red)', color: '#fff' } : {}}
                    >
                      {h.status === 'CANCELLED' ? <X size={15} /> : <Check size={15} />}
                    </span>
                    <div>
                      <b>{STATUS_MAP[h.status] || h.status}</b>
                      <small>
                        {formatDate(h.createdAt)}
                        {h.note ? ` · ${h.note}` : ''}
                        {h.changedBy || h.createdBy ? ` (bởi ${h.changedBy || h.createdBy})` : ''}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: '13px' }}>Chưa có lịch sử trạng thái</p>
            )}
          </div>

          {!canAct && (
            <p className="faint center" style={{ marginTop: '14px', fontSize: '13px' }}>
              {order.status === 'CONFIRMED'
                ? 'Đơn đã xác nhận và gán vào gói hàng.'
                : order.status === 'DELIVERING'
                  ? 'Đơn đang trong quá trình giao hàng.'
                  : order.status === 'DELIVERED'
                    ? 'Đơn hàng đã được giao thành công.'
                    : 'Đơn hàng đã hủy.'}
            </p>
          )}
        </div>

        <div className="dlg-f">
          {canAct ? (
            <>
              <button className="btn btn-danger" onClick={onCancel}>Hủy đơn</button>
              <button className="btn btn-ghost" onClick={() => window.print()}>
                <Printer size={16} style={{ marginRight: '4px' }} /> In đơn
              </button>
              <button className="btn btn-primary" onClick={onConfirm}>Xác nhận</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
