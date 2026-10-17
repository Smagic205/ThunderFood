import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Download,
  Receipt,
  FileSpreadsheet,
  Check,
} from 'lucide-react';
import { ordersApi } from '../api/ordersApi';
import { OrderDrawer } from '../components/OrderDrawer';
import type { AdminOrder, OrderFilterTab, OrderStatus } from '../types';

export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: ordersApi.getOrders,
  });

  // Check URL query param ?open=ORD-XXXX
  const openParam = searchParams.get('open');
  useEffect(() => {
    if (openParam && orders.length > 0) {
      const match = orders.find(
        (o) => o.orderCode.toLowerCase() === openParam.toLowerCase()
      );
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [openParam, orders]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      DELIVERING: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesTab = activeTab === 'ALL' || o.status === activeTab;
      const matchesSearch =
        !q ||
        o.orderCode.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.receiverPhone.replace(/\s/g, '').includes(q.replace(/\s/g, ''));
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchQuery]);

  const handleExportExcel = () => {
    setToastMessage('Đang tạo báo cáo Excel… Tải xuống file "ThunderFood_Orders_2026.xlsx"');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCloseDrawer = () => {
    setSelectedOrder(null);
    if (searchParams.has('open')) {
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

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

  const tabsConfig: { key: OrderFilterTab; label: string }[] = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING', label: 'Chờ xác nhận' },
    { key: 'CONFIRMED', label: 'Đã xác nhận' },
    { key: 'DELIVERING', label: 'Đang giao' },
    { key: 'DELIVERED', label: 'Đã giao' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1E2238',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            padding: '12px 20px',
            borderRadius: '14px',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <FileSpreadsheet size={18} color="var(--volt, #FFC107)" />
          <span>{toastMessage}</span>
          <Check size={16} color="var(--c-green, #10b981)" />
        </div>
      )}

      {/* Page Header (ahead) */}
      <div className="ah">
        <div>
          <h2>Theo dõi đơn hàng</h2>
          <p>
            {orders.length} đơn, {tabCounts.PENDING || 0} đơn đang chờ xác nhận. Admin chỉ xem, việc xác nhận và giao hàng do nhân viên xử lý.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleExportExcel}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={18} />
          Xuất danh sách
        </button>
      </div>

      {/* Main Panel */}
      <div className="card panel-t">
        {/* Status Filter Tabs (seg / chip) */}
        <div className="seg" role="tablist">
          {tabsConfig.map((t) => {
            const isSelected = activeTab === t.key;
            return (
              <button
                key={t.key}
                className={`chip ${isSelected ? 'on' : ''}`}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className="n">{tabCounts[t.key] || 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filter / Search Bar */}
        <div className="filters-bar" style={{ padding: '16px' }}>
          <div className="input-ic" style={{ width: '100%', maxWidth: '420px' }}>
            <Search size={18} className="muted" />
            <input
              className="input"
              type="search"
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm đơn hàng"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Món</th>
                <th>Tổng tiền</th>
                <th>Gói hàng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody id="ord-body">
              {isLoading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ padding: '40px' }}>
                      <p className="muted">Đang tải danh sách đơn hàng…</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="click"
                    onClick={() => setSelectedOrder(o)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="td-main">
                      <b>{o.orderCode}</b>
                      <small>{o.createdAt}</small>
                    </td>
                    <td data-label="Khách hàng">
                      <div>{o.customer}</div>
                      <small className="muted">{o.receiverPhone}</small>
                    </td>
                    <td data-label="Món">
                      <span>{o.itemCount} món</span>
                    </td>
                    <td data-label="Tổng tiền">
                      <b>{formatVnd(o.totalAmount)}</b>
                    </td>
                    <td data-label="Gói hàng">
                      {o.packageInfo ? (
                        <span className="tag">{o.packageInfo.code}</span>
                      ) : (
                        <span className="faint">—</span>
                      )}
                    </td>
                    <td data-label="Trạng thái">{getStatusBadge(o.status)}</td>
                    <td className="td-act" style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(o);
                        }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '16px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          display: 'grid',
                          placeItems: 'center',
                          margin: '0 auto 14px',
                          color: 'var(--c-amber, #f59e0b)',
                        }}
                      >
                        <Receipt size={28} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Không có đơn hàng</h3>
                      <p className="muted" style={{ fontSize: '13.5px' }}>
                        Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={handleCloseDrawer}
        onOpenPackage={(pkgCode) => {
          handleCloseDrawer();
          navigate(`/admin/packages?open=${pkgCode}`);
        }}
      />
    </div>
  );
};
