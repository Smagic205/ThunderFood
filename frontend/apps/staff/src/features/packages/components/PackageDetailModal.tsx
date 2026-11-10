import type { FC } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AlertCircle, Loader2, MapPin, Phone, X } from 'lucide-react';
import { staffOrderApi } from '@/features/orders/api/staffOrderApi';

interface PackageDetailModalProps {
  pkgId: number;
  packageName?: string;
  onClose: () => void;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Giao thất bại',
};

export const PackageDetailModal: FC<PackageDetailModalProps> = ({ pkgId, packageName, onClose }) => {
  const ordersQuery = useQuery({
    queryKey: ['package-orders', pkgId],
    queryFn: () => staffOrderApi.getPackageOrders(pkgId),
  });
  const orders = ordersQuery.data ?? [];
  const orderDetails = useQueries({
    queries: orders.map((order) => ({
      queryKey: ['staff-order-detail', order.id],
      queryFn: () => staffOrderApi.getOrderDetail(order.id),
      staleTime: 30_000,
    })),
  });

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <h3>Chi tiết {packageName || 'gói hàng'} <span className="muted">#{pkgId}</span></h3>
          <button className="ibtn" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="dlg-b" style={{ padding: '20px' }}>
          {ordersQuery.isLoading ? (
            <div className="empty" style={{ padding: '24px', textAlign: 'center' }}>
              <Loader2 size={20} className="animate-spin" />
              <p className="muted">Đang tải đơn trong gói…</p>
            </div>
          ) : ordersQuery.isError ? (
            <div className="empty" role="alert" style={{ padding: '24px', textAlign: 'center' }}>
              <AlertCircle size={22} style={{ color: 'var(--c-red)' }} />
              <p>{errorMessage(ordersQuery.error)}</p>
              <button className="btn btn-soft btn-sm" onClick={() => ordersQuery.refetch()}>Thử lại</button>
            </div>
          ) : orders.length === 0 ? (
            <p className="muted">Gói hàng này chưa có đơn nào.</p>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: '16px' }}>Danh sách {orders.length} đơn hàng trong gói:</p>
              <div className="vlist">
                {orders.map((order, index) => {
                  const detail = orderDetails[index]?.data;
                  return (
                    <div key={order.id} className="card card-p" style={{ padding: '12px' }}>
                      <div className="row between">
                        <b>{order.orderCode}</b>
                        <span className={`pill s-${order.status}`}>
                          {statusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                        <div>{order.receiverName} · <Phone size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {order.receiverPhone}</div>
                        <div style={{ marginTop: '4px' }}><MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {order.shippingAddress}</div>
                      </div>
                      {detail?.items?.length ? (
                        <div className="row wrap" style={{ gap: '6px', marginTop: '10px' }}>
                          {detail.items.map((item, itemIndex) => (
                            <span className="tag" key={item.id ?? `${item.productId}-${itemIndex}`}>
                              {item.quantity}× {item.productName}
                            </span>
                          ))}
                        </div>
                      ) : orderDetails[index]?.isLoading ? (
                        <small className="muted" style={{ display: 'block', marginTop: '8px' }}>Đang tải món…</small>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="dlg-f">
          <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};
