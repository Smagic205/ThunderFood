import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Loader2, MapPin, Phone, Truck, X } from 'lucide-react';
import { staffOrderApi, type StaffOrderListItem } from '@/features/orders/api/staffOrderApi';
import { ReportDeliveryFailureModal } from '../components/ReportDeliveryFailureModal';

const PAYMENT_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Giao thất bại',
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

export const MyPackagePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [failureOrder, setFailureOrder] = useState<StaffOrderListItem | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const heldPackageQuery = useQuery({
    queryKey: ['my-held-package'],
    queryFn: staffOrderApi.getMyHeldPackage,
    staleTime: 10_000,
  });
  const heldPackage = heldPackageQuery.data;

  const packageOrdersQuery = useQuery({
    queryKey: ['package-orders', heldPackage?.id],
    queryFn: () => staffOrderApi.getPackageOrders(heldPackage!.id),
    enabled: heldPackage !== null && heldPackage !== undefined,
    staleTime: 10_000,
  });
  const orders = packageOrdersQuery.data ?? [];
  const orderDetails = useQueries({
    queries: orders.map((order) => ({
      queryKey: ['staff-order-detail', order.id],
      queryFn: () => staffOrderApi.getOrderDetail(order.id),
      staleTime: 30_000,
    })),
  });

  const updateMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      reason === undefined
        ? staffOrderApi.deliverOrder(orderId)
        : staffOrderApi.failDelivery(orderId, reason),
    onSuccess: async (data, variables) => {
      setFailureOrder(null);
      setActionMessage(variables.reason === undefined
        ? `Đã xác nhận giao thành công đơn ${data.orderCode}.`
        : `Đã ghi nhận giao thất bại đơn ${data.orderCode}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-held-package'] }),
        queryClient.invalidateQueries({ queryKey: ['package-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['staff-order-detail', variables.orderId] }),
        queryClient.invalidateQueries({ queryKey: ['staff-orders'] }),
      ]);
    },
  });

  const handleDeliver = (order: StaffOrderListItem) => {
    if (!window.confirm(`Xác nhận đã giao đơn ${order.orderCode}?`)) return;
    setActionMessage('');
    updateMutation.mutate({ orderId: order.id });
  };

  if (heldPackageQuery.isLoading) {
    return (
      <>
        <div className="ah"><div><h2>Gói đơn của tôi</h2></div></div>
        <div className="empty card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={22} className="animate-spin" />
          <p className="muted">Đang tải gói giao hàng…</p>
        </div>
      </>
    );
  }

  if (heldPackageQuery.isError) {
    return (
      <>
        <div className="ah"><div><h2>Gói đơn của tôi</h2></div></div>
        <div className="empty card" role="alert" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--c-red)' }} />
          <h3>Không tải được gói đang giao</h3>
          <p className="muted">{errorMessage(heldPackageQuery.error)}</p>
          <button className="btn btn-soft btn-sm" onClick={() => heldPackageQuery.refetch()}>Thử lại</button>
        </div>
      </>
    );
  }

  if (!heldPackage) {
    return (
      <>
        <div className="ah"><div><h2>Gói đơn của tôi</h2></div></div>
        {actionMessage && <div className="card card-p" role="status" style={{ marginBottom: '16px' }}>{actionMessage}</div>}
        <div className="empty card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="art-wrap" style={{ color: 'var(--c-blue)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Truck size={48} />
          </div>
          <h3>Bạn chưa nhận gói nào</h3>
          <p className="muted" style={{ marginBottom: '20px' }}>Nhận một gói đang chờ để bắt đầu giao hàng.</p>
          <button className="btn btn-primary" onClick={() => navigate('/packages')}>Xem gói hàng</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="ah">
        <div>
          <h2>Gói đơn của tôi</h2>
          <p>Gói {heldPackage.packageName} · chuyến #{heldPackage.id} — {orders.length} đơn.</p>
        </div>
      </div>

      {actionMessage && <div className="card card-p" role="status" style={{ marginBottom: '16px' }}>{actionMessage}</div>}
      {updateMutation.isError && (
        <div className="card card-p" role="alert" style={{ marginBottom: '16px', color: 'var(--c-red)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} /> {errorMessage(updateMutation.error)}
        </div>
      )}

      {packageOrdersQuery.isLoading ? (
        <div className="empty card" style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={22} className="animate-spin" />
          <p className="muted">Đang tải đơn trong gói…</p>
        </div>
      ) : packageOrdersQuery.isError ? (
        <div className="empty card" role="alert" style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--c-red)' }} />
          <h3>Không tải được đơn trong gói</h3>
          <p className="muted">{errorMessage(packageOrdersQuery.error)}</p>
          <button className="btn btn-soft btn-sm" onClick={() => packageOrdersQuery.refetch()}>Thử lại</button>
        </div>
      ) : (
        <div className="stack" style={{ display: 'grid', gap: '14px' }}>
          {orders.map((order, index) => {
            const detail = orderDetails[index]?.data;
            const isUpdating = updateMutation.isPending && updateMutation.variables?.orderId === order.id;
            return (
              <article key={order.id} className="card card-p">
                <div className="row between wrap" style={{ gap: '8px' }}>
                  <div>
                    <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem' }}>{order.orderCode}</b>
                    <div className="faint" style={{ fontSize: '13px' }}>
                      {order.receiverName} · <a className="tlink" href={`tel:${order.receiverPhone}`}><Phone size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {order.receiverPhone}</a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`pill p-${order.paymentStatus}`}>{PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}</span>
                    <span className={`pill s-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                  </div>
                </div>

                <div className="muted" style={{ margin: '10px 0' }}><MapPin size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {order.shippingAddress}</div>

                {detail?.items?.length ? (
                  <div className="row wrap" style={{ gap: '8px' }}>
                    {detail.items.map((item, itemIndex) => (
                      <span className="tag" key={item.id ?? `${item.productId}-${itemIndex}`}>
                        {item.quantity}× {item.productName}
                      </span>
                    ))}
                  </div>
                ) : orderDetails[index]?.isLoading ? (
                  <span className="muted" style={{ fontSize: '13px' }}>Đang tải món…</span>
                ) : null}

                <div className="row between wrap" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                  <div>
                    <span className="muted" style={{ fontSize: '13px' }}>Tiền COD cần thu</span>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.25rem', fontWeight: 800 }}>
                      {order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID'
                        ? `${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ`
                        : '0đ'}
                    </div>
                  </div>

                  {order.status === 'DELIVERING' && (
                    <div className="row wrap" style={{ gap: '8px' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--c-red)' }}
                        disabled={updateMutation.isPending}
                        onClick={() => setFailureOrder(order)}
                      >
                        <X size={16} /> Báo giao thất bại
                      </button>
                      <button className="btn btn-primary btn-sm" disabled={updateMutation.isPending} onClick={() => handleDeliver(order)}>
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Đã giao
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
          {orders.length === 0 && <div className="empty card" style={{ padding: '36px', textAlign: 'center' }}>Gói hiện không còn đơn cần giao.</div>}
        </div>
      )}

      {failureOrder && (
        <ReportDeliveryFailureModal
          orderCode={failureOrder.orderCode}
          isSubmitting={updateMutation.isPending}
          onClose={() => setFailureOrder(null)}
          onSubmit={(reason) => {
            setActionMessage('');
            updateMutation.mutate({ orderId: failureOrder.id, reason });
          }}
        />
      )}
    </>
  );
};
