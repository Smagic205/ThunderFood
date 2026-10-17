import { useNavigate } from 'react-router-dom';
import { Truck, Check, X } from 'lucide-react';
import { useOrderStore } from '@/features/orders/store/orderStore';
import { useAuthStore } from '@/features/auth/store/authStore';

const PAYSTAT_MAP: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền'
};

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy'
};

export const MyPackagePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const packages = useOrderStore(s => s.packages);
  const orders = useOrderStore(s => s.orders);
  const updateOrderStatus = useOrderStore(s => s.updateOrderStatus);

  const heldPackage = packages.find(p => p.staff_id === user?.id && p.status === 'DELIVERING');

  if (!heldPackage) {
    return (
      <>
        <div className="ah">
          <div>
            <h2>Gói đơn của tôi</h2>
          </div>
        </div>
        <div className="empty card" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="art-wrap" style={{ color: 'var(--c-blue)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Truck size={48} />
          </div>
          <h3>Bạn chưa nhận gói nào</h3>
          <p className="muted" style={{ marginBottom: '20px' }}>Vào mục Nhận gói hàng để nhận một gói đang chờ giao.</p>
          <button className="btn btn-primary" onClick={() => navigate('/packages')}>Xem gói hàng</button>
        </div>
      </>
    );
  }

  const pkgOrders = orders.filter(o => heldPackage.order_codes.includes(o.order_code));

  const handleUpdateStatus = (orderCode: string, newStatus: string) => {
    const label = newStatus === 'DELIVERED' ? 'đã giao' : 'hủy';
    if (!window.confirm(`Xác nhận ${label} đơn ${orderCode}?`)) return;

    updateOrderStatus(orderCode, newStatus);

    const remaining = pkgOrders
      .map(o => (o.order_code === orderCode ? { ...o, status: newStatus } : o))
      .every(o => o.status === 'DELIVERED' || o.status === 'CANCELLED');

    if (remaining) {
      setTimeout(() => {
        alert(`Tất cả đơn trong gói ${heldPackage.code} đã hoàn tất. Bạn có thể nhận gói mới.`);
      }, 100);
    }
  };

  return (
    <>
      <div className="ah">
        <div>
          <h2>Gói đơn của tôi</h2>
          <p>Gói {heldPackage.code} — {pkgOrders.length} đơn. Đánh dấu từng đơn khi giao xong hoặc khi khách không nhận hàng.</p>
        </div>
      </div>

      <div className="stack" style={{ display: 'grid', gap: '14px' }}>
        {pkgOrders.map(o => (
          <article key={o.order_code} className="card card-p">
            <div className="row between wrap" style={{ gap: '8px' }}>
              <div>
                <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem' }}>{o.order_code}</b>
                <div className="faint" style={{ fontSize: '13px' }}>
                  {o.receiver_name} · <a className="tlink" href={`tel:${o.receiver_phone}`}>{o.receiver_phone}</a>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`pill p-${o.payment_status}`}>{PAYSTAT_MAP[o.payment_status]}</span>
                <span className={`pill s-${o.status}`}>{STATUS_MAP[o.status]}</span>
              </div>
            </div>

            <div className="muted" style={{ margin: '10px 0' }}>{o.shipping_address}</div>

            <div className="row wrap" style={{ gap: '8px' }}>
              {o.items.map((i: { quantity: number; product_name: string }, idx: number) => (
                <span key={idx} className="tag">{i.quantity}× {i.product_name}</span>
              ))}
            </div>

            <div className="row between wrap" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
              <div>
                <span className="muted" style={{ fontSize: '13px' }}>Tổng thu tiền mặt (nếu chưa thanh toán)</span>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.25rem', fontWeight: 800 }}>
                  {o.payment_status === 'UNPAID' ? `${o.total_amount.toLocaleString('vi-VN')}đ` : '0đ'}
                </div>
              </div>

              {o.status === 'DELIVERING' && (
                <div className="row" style={{ gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--c-red)' }} onClick={() => handleUpdateStatus(o.order_code, 'CANCELLED')}>
                    <X size={16} /> Báo Hủy
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(o.order_code, 'DELIVERED')}>
                    <Check size={16} /> Đã Giao
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
