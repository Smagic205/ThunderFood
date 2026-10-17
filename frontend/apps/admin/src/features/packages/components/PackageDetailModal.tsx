import React from 'react';
import {
  X,
  Box,
  User,
  MapPin,
  Receipt,
  Info,
  ExternalLink,
  Phone,
} from 'lucide-react';
import type { DeliveryPackage, PackageStatus } from '../types';
import type { OrderStatus } from '@/features/orders/types';

interface PackageDetailModalProps {
  pkg: DeliveryPackage | null;
  onClose: () => void;
  onOpenOrder?: (orderCode: string) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  pkg,
  onClose,
  onOpenOrder,
}) => {
  if (!pkg) return null;

  const getPackageStatusBadge = (status: PackageStatus) => {
    switch (status) {
      case 'UNASSIGNED':
        return <span className="pill p-amber">Chưa giao</span>;
      case 'DELIVERING':
        return <span className="pill p-teal">Đang giao</span>;
      case 'COMPLETED':
        return <span className="pill p-green">Hoàn thành</span>;
      default:
        return <span className="pill">{status}</span>;
    }
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
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

  const totalPackageAmount = pkg.orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 38, 0.7)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        className="card card-p"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--surface-1, #1e2238)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 193, 7, 0.15)',
                color: 'var(--volt, #FFC107)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Box size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Chi tiết Gói hàng {pkg.code}
              </h2>
              <div className="muted" style={{ fontSize: '12.5px', marginTop: '2px' }}>
                Khởi tạo: {pkg.createdAt}
              </div>
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

        {/* Badges & Meta info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {getPackageStatusBadge(pkg.status)}
          <span className="tag" style={{ fontSize: '13px', fontWeight: 600 }}>
            {pkg.orders.length}/7 đơn (Tối đa 7)
          </span>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13.5px',
            }}
          >
            <User size={15} className="muted" />
            <span style={{ color: pkg.staffName ? 'var(--ink)' : 'var(--ink-3)' }}>
              {pkg.staffName ? `Shipper: ${pkg.staffName}` : 'Chưa có nhân viên nhận'}
            </span>
          </div>
        </div>

        {/* Admin notice */}
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
            lineHeight: 1.45,
            marginBottom: '20px',
          }}
        >
          <Info size={17} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
          <div>
            <b>Chế độ giám sát:</b> Admin chỉ theo dõi trạng thái gom gói và tiến độ giao hàng. Việc tiếp nhận gói và cập nhật hành trình do nhân viên điều phối & shipper thực hiện.
          </div>
        </div>

        {/* Orders list in Package */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
              Danh sách đơn trong gói ({pkg.orders.length} đơn)
            </h3>
            <span className="muted" style={{ fontSize: '13px' }}>
              Tổng giá trị: <b style={{ color: 'var(--volt, #FFC107)' }}>{formatVnd(totalPackageAmount)}</b>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pkg.orders.map((o) => (
              <div
                key={o.orderCode}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
                  border: '1px solid var(--line, rgba(255, 255, 255, 0.06))',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    color: 'var(--c-amber, #f59e0b)',
                  }}
                >
                  <Receipt size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <button
                      type="button"
                      className="tlink"
                      onClick={() => onOpenOrder?.(o.orderCode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {o.orderCode}
                      <ExternalLink size={12} />
                    </button>
                    {getOrderStatusBadge(o.status)}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '2px' }}>
                    <b>{o.receiverName}</b> · <Phone size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {o.receiverPhone}
                  </div>

                  <div className="muted" style={{ fontSize: '12.5px', lineHeight: 1.35 }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    {o.shippingAddress}
                  </div>

                  <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--volt, #FFC107)' }}>
                    {formatVnd(o.totalAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '16px',
            borderTop: '1px solid var(--line, rgba(255, 255, 255, 0.08))',
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
