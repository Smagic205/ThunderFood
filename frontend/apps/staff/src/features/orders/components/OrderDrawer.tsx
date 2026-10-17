import React from 'react';
import { X, Check, Printer } from 'lucide-react';

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy'
};

const PAYSTAT_MAP: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền'
};

interface OrderDrawerProps {
  order: any;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const OrderDrawer: React.FC<OrderDrawerProps> = ({ order, onClose, onConfirm, onCancel }) => {
  if (!order) return null;

  const canAct = order.status === 'PENDING';

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg drawer" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <h3>{order.order_code}</h3>
          <button className="ibtn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="dlg-b">
          <div className="row wrap" style={{ marginBottom: '18px', gap: '8px' }}>
            <span className={`pill s-${order.status}`}>{STATUS_MAP[order.status]}</span>
            <span className={`pill p-${order.payment_status}`}>{PAYSTAT_MAP[order.payment_status]}</span>
            <span className="faint" style={{ fontSize: '13px', marginLeft: 'auto' }}>
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </span>
          </div>

          <div className="card card-p" style={{ boxShadow: 'none', marginBottom: '16px' }}>
            <div className="card-h" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem' }}>Khách hàng</h3>
            </div>
            <dl className="kv">
              <dt>Người nhận</dt><dd>{order.receiver_name}</dd>
              <dt>Điện thoại</dt><dd><a className="tlink" href={`tel:${order.receiver_phone}`}>{order.receiver_phone}</a></dd>
              <dt>Địa chỉ</dt><dd>{order.shipping_address}</dd>
              <dt>Thanh toán</dt><dd>{order.payment_method}</dd>
              {order.package_code && (
                <>
                  <dt>Gói hàng</dt>
                  <dd><span className="tag">{order.package_code}</span></dd>
                </>
              )}
              {order.note && (
                <>
                  <dt>Ghi chú</dt>
                  <dd style={{ color: 'var(--c-amber)' }}>{order.note}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card card-p" style={{ boxShadow: 'none', marginBottom: '16px' }}>
            <div className="card-h" style={{ marginBottom: '6px' }}>
              <h3 style={{ fontSize: '1rem' }}>Món trong đơn</h3>
            </div>
            {order.items.map((i: any, idx: number) => (
              <div className="mini-item" key={idx}>
                <div className="tile xs" style={{ background: 'var(--volt-soft)', color: 'var(--volt)' }}>M</div>
                <div className="grow">
                  <b style={{ fontWeight: 600 }}>{i.product_name}</b>
                  <div className="faint">{i.product_price.toLocaleString('vi-VN')}đ × {i.quantity}</div>
                </div>
                <b>{i.line_total.toLocaleString('vi-VN')}đ</b>
              </div>
            ))}
            <hr className="divider" style={{ margin: '8px 0 10px' }} />
            <div className="sum-line"><span>Tạm tính</span><span>{order.subtotal_amount.toLocaleString('vi-VN')}đ</span></div>
            <div className="sum-line"><span>Phí giao hàng</span><span>{order.shipping_fee.toLocaleString('vi-VN')}đ</span></div>
            <div className="sum-line total"><span>Tổng cộng</span><b>{order.total_amount.toLocaleString('vi-VN')}đ</b></div>
          </div>

          <div className="card card-p" style={{ boxShadow: 'none' }}>
            <div className="card-h">
              <h3 style={{ fontSize: '1rem' }}>Lịch sử trạng thái</h3>
            </div>
            <div className="tl">
              {order.history.map((h: any, idx: number) => (
                <div className={`tl-i ${h.status === 'CANCELLED' ? 'bad' : 'done'}`} key={idx}>
                  <span className="tl-dot" style={h.status === 'CANCELLED' ? { background: 'var(--c-red)', borderColor: 'var(--c-red)', color: '#fff' } : {}}>
                    {h.status === 'CANCELLED' ? <X size={15} /> : <Check size={15} />}
                  </span>
                  <div>
                    <b>{STATUS_MAP[h.status]}</b>
                    <small>{new Date(h.created_at).toLocaleString('vi-VN')} {h.note ? `· ${h.note}` : ''}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {!canAct && (
            <p className="faint center" style={{ marginTop: '14px', fontSize: '13px' }}>
              {order.status === 'CONFIRMED'
                ? 'Đơn đã xác nhận. Nhận gói tại mục Gói hàng chờ giao, rồi xử lý giao tại Gói đơn của tôi.'
                : order.status === 'DELIVERING'
                  ? 'Đơn đang giao — xử lý tại mục Gói đơn của tôi.'
                  : 'Không thể thao tác xác nhận với đơn ở trạng thái này.'}
            </p>
          )}
        </div>
        
        <div className="dlg-f">
          {canAct ? (
            <>
              <button className="btn btn-danger" onClick={onCancel}>Hủy đơn</button>
              <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} style={{ marginRight: '4px' }}/> In đơn</button>
              <button className="btn btn-primary" onClick={onConfirm}>Xác nhận</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 'auto' }}>Đóng</button>
          )}
        </div>
      </div>
    </div>
  );
};
