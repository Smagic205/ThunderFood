import React from 'react';
import {
  X,
  Info,
  User,
  Phone,
  MapPin,
  Package,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import type { AdminOrder, OrderStatus, PaymentStatus, PaymentMethod } from '../types';

interface OrderDrawerProps {
  order: AdminOrder | null;
  onClose: () => void;
  onOpenPackage?: (packageCode: string) => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ order, onClose, onOpenPackage }) => {
  if (!order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="pill p-amber">Chờ xác nhận</span>;
      case 'CONFIRMED':
        return <span className="pill p-blue">Đã xác nhận</span>;
      case 'DELIVERING':
        return <span className="pill p-teal">Đang giao</span>;
      case 'DELIVERED':
        return <span className="pill p-green">Đã giao</span>;
      case 'CANCELLED':
        return <span className="pill p-red">Đã hủy</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (pStatus: PaymentStatus) => {
    switch (pStatus) {
      case 'PAID':
        return <span className="pill p-green">Đã thanh toán</span>;
      case 'UNPAID':
        return <span className="pill p-amber">Chưa thanh toán</span>;
      case 'REFUNDED':
        return <span className="pill p-red">Đã hoàn tiền</span>;
      default:
        return <span className="pill">{pStatus}</span>;
    }
  };

  const getPaymentMethodName = (pm: PaymentMethod) => {
    switch (pm) {
      case 'COD':
        return 'Tiền mặt khi nhận hàng (COD)';
      case 'VNPAY':
        return 'Ví điện tử VNPAY';
      case 'MOMO':
        return 'Ví MoMo';
      case 'STRIPE':
        return 'Thẻ thanh toán quốc tế (Stripe)';
      default:
        return pm;
    }
  };

  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(540px, 100vw)',
          height: '100dvh',
          backgroundColor: 'var(--surface, #1e2238)',
          borderLeft: '1px solid var(--line, rgba(255, 255, 255, 0.1))',
          boxShadow: 'var(--sh-2, 0 20px 40px rgba(0,0,0,0.4))',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slidein 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                {order.orderCode}
              </h2>
            </div>
            <div className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Thời gian đặt: {order.createdAt}
            </div>
          </div>
          <button
            className="ibtn"
            onClick={onClose}
            aria-label="Đóng ngăn chi tiết"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Status Badges Row */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {getStatusBadge(order.status)}
            {getPaymentStatusBadge(order.paymentStatus)}
            {order.packageInfo && (
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Package size={13} />
                Gói {order.packageInfo.code}
              </span>
            )}
          </div>

          {/* Admin Read-only Notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#93c5fd',
              padding: '12px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: '1.45',
            }}
          >
            <Info size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
            <div>
              <b style={{ color: 'var(--ink)' }}>Chế độ xem quản trị:</b> Admin chỉ theo dõi trạng thái đơn hàng. Việc tiếp nhận, xếp gói và giao hàng do bộ phận Điều phối & Shipper (Staff) thực hiện.
            </div>
          </div>

          {/* Card: Thông tin khách hàng & Giao nhận */}
          <div
            className="card card-p"
            style={{
              boxShadow: 'none',
              backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
              borderRadius: '16px',
              border: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <User size={16} className="muted" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
                Khách hàng & Giao hàng
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span className="muted">Người nhận:</span>
                <b style={{ color: 'var(--ink)' }}>{order.receiverName}</b>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span className="muted">Điện thoại:</span>
                <a
                  href={`tel:${order.receiverPhone.replace(/\s/g, '')}`}
                  className="tlink"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}
                >
                  <Phone size={14} />
                  {order.receiverPhone}
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span className="muted">Địa chỉ:</span>
                <div style={{ color: 'var(--ink, #C9D0F5)', lineHeight: 1.4 }}>
                  <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                  {order.shippingAddress}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                <span className="muted">Thanh toán:</span>
                <div>
                  <span style={{ color: 'var(--ink)' }}>{getPaymentMethodName(order.paymentMethod)}</span>
                  {order.txn && (
                    <small className="muted" style={{ display: 'block', marginTop: '2px', fontSize: '11.5px' }}>
                      Mã GD: {order.txn}
                    </small>
                  )}
                </div>
              </div>

              {order.packageInfo && (
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'center' }}>
                  <span className="muted">Gói hàng:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="tlink"
                      onClick={() => onOpenPackage?.(order.packageInfo!.code)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {order.packageInfo.code}
                      <ExternalLink size={12} />
                    </button>
                    <span className="muted">·</span>
                    <span className="muted">
                      {order.packageInfo.staffName ? `Shipper: ${order.packageInfo.staffName}` : 'Chưa nhận'}
                    </span>
                  </div>
                </div>
              )}

              {order.note && (
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                  <span className="muted">Ghi chú:</span>
                  <span style={{ color: 'var(--c-amber, #f59e0b)', fontStyle: 'italic' }}>
                    {order.note}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Món trong đơn & Chi phí */}
          <div
            className="card card-p"
            style={{
              boxShadow: 'none',
              backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
              borderRadius: '16px',
              border: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FileText size={16} className="muted" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
                Món trong đơn ({order.itemCount} món)
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13.5px',
                    paddingBottom: '8px',
                    borderBottom: idx < order.items.length - 1 ? '1px dashed var(--line, rgba(255,255,255,0.06))' : 'none',
                  }}
                >
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{item.productName}</div>
                    <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
                      {formatVnd(item.productPrice)} × {item.quantity}
                    </div>
                  </div>
                  <b style={{ color: 'var(--ink)' }}>{formatVnd(item.lineTotal)}</b>
                </div>
              ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))', margin: '14px 0 10px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
                <span>Tạm tính</span>
                <span>{formatVnd(order.subtotalAmount)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--c-green, #10b981)' }}>
                  <span>Giảm giá món {order.voucherProduct ? `(${order.voucherProduct})` : ''}</span>
                  <span>-{formatVnd(order.discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
                <span>Phí giao hàng</span>
                <span>{order.shippingFee > 0 ? formatVnd(order.shippingFee) : 'Miễn phí'}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Tổng thanh toán</span>
                <b style={{ fontSize: '1.25rem', color: 'var(--volt, #FFC107)' }}>
                  {formatVnd(order.totalAmount)}
                </b>
              </div>
            </div>
          </div>

          {/* Card: Lịch sử trạng thái */}
          <div
            className="card card-p"
            style={{
              boxShadow: 'none',
              backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
              borderRadius: '16px',
              border: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} className="muted" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
                Lịch sử trạng thái
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '8px' }}>
              {order.history.map((step, idx) => {
                const isCancelled = step.status === 'CANCELLED';
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: `1px solid ${isCancelled ? 'var(--c-red, #ef4444)' : 'var(--c-green, #10b981)'}`,
                        color: isCancelled ? 'var(--c-red, #ef4444)' : 'var(--c-green, #10b981)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isCancelled ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13.5px' }}>
                        {step.status === 'PENDING' && 'Chờ xác nhận'}
                        {step.status === 'CONFIRMED' && 'Đã xác nhận'}
                        {step.status === 'DELIVERING' && 'Đang giao hàng'}
                        {step.status === 'DELIVERED' && 'Đã giao thành công'}
                        {step.status === 'CANCELLED' && 'Đã hủy đơn'}
                      </div>
                      <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                        {step.createdAt} {step.note ? `· ${step.note}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--surface, #1e2238)',
          }}
        >
          <button className="btn btn-ghost" onClick={onClose} style={{ minWidth: '90px' }}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
