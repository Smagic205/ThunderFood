import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { RecentOrderItem, OrderStatus } from '../types';
import { OrderDetailModal } from './OrderDetailModal';

interface RecentOrdersCardProps {
  orders: RecentOrderItem[];
}

export const RecentOrdersCard: React.FC<RecentOrdersCardProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<RecentOrderItem | null>(null);

  const getStatusPill = (status: OrderStatus) => {
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

  return (
    <>
      <section className="card panel-t" aria-labelledby="h-rec">
        <div className="card-h" style={{ padding: '24px 24px 0' }}>
          <h3 id="h-rec">Đơn hàng gần đây</h3>
          <Link className="tlink" to="/admin/orders">
            Xem tất cả
          </Link>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="click"
                  onClick={() => setSelectedOrder(o)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="td-main">
                    <b>#{o.orderCode.slice(-6)}</b>
                    <small>{o.createdAt}</small>
                  </td>
                  <td data-label="Khách hàng" className="nw">
                    {o.customerName}
                  </td>
                  <td data-label="Tổng tiền">
                    <b>{o.totalAmount.toLocaleString('vi-VN')} ₫</b>
                  </td>
                  <td data-label="Trạng thái">{getStatusPill(o.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
};
