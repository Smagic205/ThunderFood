import React from 'react';
import { X, Info, User, Phone, MapPin, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import type { RecentOrderItem, OrderStatus } from '../types';

interface OrderDetailModalProps {
  order: RecentOrderItem | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
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

  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fade 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card card-p"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Đơn hàng #{order.orderCode}
              </h2>
              {getStatusBadge(order.status)}
            </div>
            <div className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
              Đặt lúc: {order.createdAt}
            </div>
          </div>
          <button
            className="ibtn"
            onClick={onClose}
            aria-label="Đóng"
            style={{ width: '36px', height: '36px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Read-only Alert */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: '#60a5fa',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            <b>Quyền Admin:</b> Chế độ chỉ xem (Read-only). Việc xác nhận, gom gói và giao hàng do nhân viên điều phối (Staff) xử lý.
          </span>
        </div>

        {/* Thông tin khách hàng */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--ink)' }}>
            Thông tin giao hàng
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={15} className="muted" />
              <span>Người nhận: <b>{order.customerName}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={15} className="muted" />
              <span>Số điện thoại: <b>{order.receiverPhone}</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={15} className="muted" />
              <span>Địa chỉ: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={15} className="muted" />
              <span>Thanh toán: Tiền mặt khi nhận hàng (COD)</span>
            </div>
          </div>
        </div>

        {/* Chi tiết món & tổng tiền */}
        <div
          style={{
            backgroundColor: 'var(--surface-2)',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--ink)' }}>
            Chi tiết đơn hàng ({order.itemCount} món)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
              <span>Burger Bò Double Cheese × 2</span>
              <b>170.000 ₫</b>
            </div>
            {order.itemCount > 2 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                <span>Khoai Tây Chiên Giòn × 1</span>
                <b>45.000 ₫</b>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
              <span>Trà Đào Cam Sả × 1</span>
              <b>40.000 ₫</b>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
              <span>Tạm tính</span>
              <span>{formatVnd(order.totalAmount - 20000)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted">
              <span>Phí vận chuyển</span>
              <span>20.000 ₫</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--ink)',
                marginTop: '4px',
              }}
            >
              <span>Tổng thanh toán</span>
              <span style={{ color: 'var(--brand-primary, #ff5722)' }}>{formatVnd(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Lịch sử trạng thái */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '10px', color: 'var(--ink)' }}>
            Tiến trình đơn
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
              <CheckCircle2 size={16} color="var(--c-green)" style={{ marginTop: '2px' }} />
              <div>
                <b>Đơn hàng được khởi tạo thành công</b>
                <div className="muted" style={{ fontSize: '12px' }}>{order.createdAt}</div>
              </div>
            </div>
            {order.status !== 'PENDING' && order.status !== 'CANCELLED' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                <CheckCircle2 size={16} color="var(--c-blue)" style={{ marginTop: '2px' }} />
                <div>
                  <b>Nhân viên điều phối đã xác nhận đơn</b>
                  <div className="muted" style={{ fontSize: '12px' }}>Hệ thống ThunderFood Staff</div>
                </div>
              </div>
            )}
            {order.status === 'CANCELLED' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                <AlertCircle size={16} color="var(--c-red)" style={{ marginTop: '2px' }} />
                <div>
                  <b>Đơn hàng đã bị hủy</b>
                  <div className="muted" style={{ fontSize: '12px' }}>Khách hàng đổi ý / Hết món</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ minWidth: '90px' }}>
            Đóng
          </button>
          <a
            href={`/admin/orders?open=${order.orderCode}`}
            className="btn btn-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            Mở trang đơn hàng
          </a>
        </div>
      </div>
    </div>
  );
};
