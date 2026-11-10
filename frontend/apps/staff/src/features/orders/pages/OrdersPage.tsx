import { useState, useEffect } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  staffOrderApi,
  type StaffOrderListItem,
  type StaffOrderDetail,
  type PageResponse,
  type DeliveryPackage,
} from '../api/staffOrderApi';
import { OrderDrawer } from '../components/OrderDrawer';
import { ConfirmOrderModal } from '../components/ConfirmOrderModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { addressApi } from '@/shared/api/addressApi';

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const normalizeWardName = (value: string) => value
  .replace(/^(phường|xã)\s+/i, '')
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('vi');

export const OrdersPage = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Selected order for drawer
  const [selectedOrder, setSelectedOrder] = useState<StaffOrderListItem | null>(null);

  // Modal states
  const [confirmingOrder, setConfirmingOrder] = useState<StaffOrderListItem | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<StaffOrderListItem | null>(null);
  const [confirmError, setConfirmError] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when tab or ward changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(0);
  };

  const handleWardChange = (ward: string) => {
    setSelectedWard(ward);
    setPage(0);
  };

  // Auto clear notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch service wards
  const {
    data: serviceWards = [],
    isLoading: isWardsLoading,
    isError: isWardsError,
  } = useQuery({
    queryKey: ['service-wards'],
    queryFn: addressApi.getServiceWards,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch staff orders
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery<PageResponse<StaffOrderListItem>>({
    queryKey: ['staff-orders', activeTab, selectedWard, debouncedSearch, page, pageSize],
    queryFn: () => staffOrderApi.getOrders({
      status: activeTab === 'ALL' ? undefined : activeTab,
      ward: selectedWard === 'ALL' ? undefined : selectedWard,
      search: debouncedSearch || undefined,
      page,
      size: pageSize,
    }),
    staleTime: 10 * 1000,
  });

  // Fetch open packages for confirmation modal
  const { data: openPackages = [] } = useQuery<DeliveryPackage[]>({
    queryKey: ['open-packages'],
    queryFn: staffOrderApi.getOpenPackages,
    staleTime: 15 * 1000,
  });

  // Mutation: Confirm order
  const confirmMutation = useMutation<
    StaffOrderDetail,
    any,
    { id: number; packageName: string; isNew: boolean }
  >({
    mutationFn: ({ id, packageName, isNew }) =>
      staffOrderApi.confirmOrder(id, { packageName, isNewPackage: isNew }),
    onSuccess: (data: StaffOrderDetail) => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['open-packages'] });
      setConfirmingOrder(null);
      setSelectedOrder(null);
      setConfirmError('');
      setNotification({
        type: 'success',
        message: `Đơn ${data.orderCode} đã xác nhận và gán vào gói ${data.packageCode || ''}`,
      });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Xác nhận đơn thất bại';
      setConfirmError(message);
    },
  });

  // Mutation: Cancel order
  const cancelMutation = useMutation<
    StaffOrderDetail,
    any,
    { id: number; reason: string }
  >({
    mutationFn: ({ id, reason }) =>
      staffOrderApi.cancelOrder(id, { reason }),
    onSuccess: (data: StaffOrderDetail) => {
      queryClient.invalidateQueries({ queryKey: ['staff-orders'] });
      queryClient.invalidateQueries({ queryKey: ['open-packages'] });
      setCancellingOrder(null);
      setSelectedOrder(null);
      setNotification({
        type: 'success',
        message: `Đơn ${data.orderCode} đã được hủy thành công`,
      });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message || 'Hủy đơn thất bại';
      setNotification({
        type: 'error',
        message,
      });
    },
  });

  const orders = ordersData?.content || [];
  const pagination = ordersData?.pagination;
  const totalCount = pagination?.totalElements ?? 0;

  // Prepare ward options
  const wardOptions = serviceWards
    .map((ward) => [
      normalizeWardName(ward.wardName),
      ward.displayName || `${ward.type === 'XA' ? 'Xã' : 'Phường'} ${ward.wardName}`,
    ] as const)
    .filter(([key]) => Boolean(key))
    .sort((a, b) => a[1].localeCompare(b[1], 'vi'));

  return (
    <>
      <div className="card" style={{ background: 'transparent', boxShadow: 'none', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Xử lý đơn hàng</h1>
        <p className="muted">
          Duyệt đơn, gán vào gói giao hàng hoặc hủy đơn khi cần. Tất cả dữ liệu đồng bộ trực tiếp với hệ thống máy chủ.
        </p>
      </div>

      {notification && (
        <div
          className="card card-p"
          style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: notification.type === 'success' ? '#F6FFED' : '#FFF1F0',
            border: `1px solid ${notification.type === 'success' ? '#B7EB8F' : '#FFCCC7'}`,
            color: notification.type === 'success' ? '#389E0D' : '#CF1322',
            padding: '12px 16px',
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{notification.message}</span>
        </div>
      )}

      <div className="card panel-t">
        {/* Status Tabs */}
        <div className="seg" role="tablist">
          {['ALL', 'PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'].map((k) => (
            <button
              key={k}
              className={`chip ${activeTab === k ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === k}
              onClick={() => handleTabChange(k)}
            >
              {k === 'ALL' ? 'Tất cả' : STATUS_MAP[k]}
              {activeTab === k && typeof pagination?.totalElements === 'number' && (
                <span className="n">{pagination.totalElements}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-bar" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="input-ic" style={{ flex: '1', minWidth: '250px' }}>
            <div className="ic-prefix"><Search size={18} /></div>
            <input
              className="input"
              type="search"
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <select
            className="input"
            style={{ width: 'auto', minWidth: '220px', paddingRight: '32px' }}
            value={selectedWard}
            onChange={(e) => handleWardChange(e.target.value)}
          >
            <option value="ALL">Tất cả Phường/Xã</option>
            {wardOptions.map(([key, label]) => (
              <option key={key} value={label}>{label}</option>
            ))}
          </select>

          <small className="muted" style={{ alignSelf: 'center', marginLeft: 'auto' }}>
            {isOrdersFetching && !isOrdersLoading && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
                <Loader2 size={12} className="animate-spin" /> Đang cập nhật...
              </span>
            )}
            {isWardsLoading
              ? 'Đang tải khu vực...'
              : isWardsError
                ? 'Không tải được khu vực'
                : `${serviceWards.length} phường/xã phục vụ`}
          </small>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isOrdersLoading ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px', gap: '10px' }}>
                      <Loader2 size={24} className="animate-spin text-muted" />
                      <span className="muted">Đang tải danh sách đơn hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : isOrdersError ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty" style={{ padding: '40px' }}>
                      <AlertCircle size={32} style={{ color: 'var(--c-red)', marginBottom: '8px' }} />
                      <h3>Lỗi khi tải đơn hàng</h3>
                      <p className="muted">{(ordersError as any)?.message || 'Không thể kết nối đến máy chủ.'}</p>
                      <button className="btn btn-soft btn-sm" style={{ marginTop: '12px' }} onClick={() => refetchOrders()}>
                        Thử lại
                      </button>
                    </div>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o: StaffOrderListItem) => (
                  <tr key={o.id} className="click" onClick={() => setSelectedOrder(o)}>
                    <td className="td-main">
                      <b>{o.orderCode}</b>
                      <small>{new Date(o.createdAt).toLocaleString('vi-VN')}</small>
                    </td>
                    <td data-label="Khách hàng">
                      {o.customerName || o.receiverName}
                      <small>{o.receiverPhone}</small>
                    </td>
                    <td data-label="Món">{o.totalItems} món</td>
                    <td data-label="Tổng tiền"><b>{o.totalAmount.toLocaleString('vi-VN')}đ</b></td>
                    <td data-label="Gói hàng">
                      {o.packageCode ? <span className="tag">{o.packageCode}</span> : <span className="faint">—</span>}
                    </td>
                    <td data-label="Trạng thái">
                      <span className={`pill s-${o.status}`}>{STATUS_MAP[o.status] || o.status}</span>
                    </td>
                    <td className="td-act">
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
                    <div className="empty" style={{ padding: '40px' }}>
                      <h3>Không có đơn hàng nào</h3>
                      <p className="muted">Không tìm thấy đơn hàng thỏa mãn điều kiện lọc.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination && pagination.totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderTop: '1px solid var(--line)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span className="muted" style={{ fontSize: '13px' }}>
              Hiển thị {orders.length} / {totalCount} đơn hàng (Trang {pagination.page + 1} / {pagination.totalPages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-soft btn-sm"
                disabled={!pagination.hasPrevious || isOrdersFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={16} /> Trang trước
              </button>
              <button
                className="btn btn-soft btn-sm"
                disabled={!pagination.hasNext || isOrdersFetching}
                onClick={() => setPage((p) => p + 1)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Trang sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail drawer */}
      {selectedOrder && !confirmingOrder && !cancellingOrder && (
        <OrderDrawer
          orderId={selectedOrder.id}
          initialOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={() => {
            setCancellingOrder(selectedOrder);
          }}
          onConfirm={() => {
            setConfirmError('');
            setConfirmingOrder(selectedOrder);
          }}
        />
      )}

      {/* Confirm order modal */}
      {confirmingOrder && (
        <ConfirmOrderModal
          orderCode={confirmingOrder.orderCode}
          openPackages={openPackages}
          maxPerPackage={7}
          externalError={confirmError}
          isSubmitting={confirmMutation.isPending}
          onClose={() => {
            setConfirmError('');
            setConfirmingOrder(null);
          }}
          onConfirm={(packageName, isNew) => {
            confirmMutation.mutate({
              id: confirmingOrder.id,
              packageName,
              isNew,
            });
          }}
        />
      )}

      {/* Cancel order modal */}
      {cancellingOrder && (
        <CancelOrderModal
          orderCode={cancellingOrder.orderCode}
          isSubmitting={cancelMutation.isPending}
          onClose={() => setCancellingOrder(null)}
          onConfirm={(reason: string) => {
            cancelMutation.mutate({
              id: cancellingOrder.id,
              reason,
            });
          }}
        />
      )}
    </>
  );
};
