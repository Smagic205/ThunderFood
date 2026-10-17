import { useState } from 'react';
import { Search } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { OrderDrawer } from '../components/OrderDrawer';
import { ConfirmOrderModal } from '../components/ConfirmOrderModal';

const STATUS_MAP: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DELIVERING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy'
};

export const OrdersPage = () => {
  const orders = useOrderStore(s => s.orders);
  const packages = useOrderStore(s => s.packages);
  const maxPerPackage = useOrderStore(s => s.maxPerPackage);
  const cancelOrder = useOrderStore(s => s.cancelOrder);
  const confirmOrder = useOrderStore(s => s.confirmOrder);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedWard, setSelectedWard] = useState('ALL');

  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [confirmingOrderCode, setConfirmingOrderCode] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string>('');

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  const counts = (k: string) => k === 'ALL' ? orders.length : orders.filter(o => o.status === k).length;

  const districts = Array.from(new Set(orders.map(o => o.district).filter(Boolean)));
  const wards = Array.from(
    new Set(
      orders
        .filter(o => selectedDistrict === 'ALL' || o.district === selectedDistrict)
        .map(o => o.ward)
        .filter(Boolean)
    )
  );

  const filteredOrders = orders
    .filter(o => activeTab === 'ALL' || o.status === activeTab)
    .filter(o => {
      if (selectedDistrict === 'ALL' && selectedWard === 'ALL') return true;
      if (selectedDistrict !== 'ALL' && o.district !== selectedDistrict) return false;
      if (selectedWard !== 'ALL' && o.ward !== selectedWard) return false;
      return true;
    })
    .filter(o => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const phoneNoSpace = o.receiver_phone.replace(/\s/g, '');
      const qNoSpace = q.replace(/\s/g, '');
      return o.order_code.toLowerCase().includes(q) ||
             o.customer.toLowerCase().includes(q) ||
             phoneNoSpace.includes(qNoSpace);
    })
    .sort((a, b) => {
      const tA = new Date(a.created_at).getTime();
      const tB = new Date(b.created_at).getTime();
      if (['PENDING', 'CONFIRMED', 'DELIVERING'].includes(activeTab)) {
        return tA - tB;
      }
      return tB - tA;
    });

  const handleCancelOrder = (code: string) => {
    if (window.confirm(`Hủy đơn ${code}? Khách hàng sẽ nhận thông báo.`)) {
      cancelOrder(code);
      setSelectedOrderCode(null);
    }
  };

  const handleConfirmOrder = (pkgCode: string, isNew: boolean) => {
    if (!confirmingOrderCode) return;
    const err = confirmOrder(confirmingOrderCode, pkgCode, isNew);
    if (err) {
      setConfirmError(err);
      return;
    }
    setConfirmError('');
    setConfirmingOrderCode(null);
    setSelectedOrderCode(null);
  };

  const selectedOrder = orders.find(o => o.order_code === selectedOrderCode);
  const openPackages = packages.filter(p => p.status === 'PENDING');

  return (
    <>
      <div className="card" style={{ background: 'transparent', boxShadow: 'none', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Xử lý đơn hàng</h1>
        <p className="muted">{pendingCount} đơn đang chờ xác nhận. Xác nhận, in phiếu bếp hoặc hủy đơn trước khi xếp gói giao hàng.</p>
      </div>

      <div className="card panel-t">
        <div className="seg" role="tablist">
          {['ALL', 'PENDING', 'CONFIRMED', 'DELIVERING', 'DELIVERED', 'CANCELLED'].map(k => (
            <button
              key={k}
              className={`chip ${activeTab === k ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === k}
              onClick={() => setActiveTab(k)}
            >
              {k === 'ALL' ? 'Tất cả' : STATUS_MAP[k]}
              <span className="n">{counts(k)}</span>
            </button>
          ))}
        </div>

        <div className="filters-bar" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="input-ic" style={{ flex: '1', minWidth: '250px' }}>
            <div className="ic-prefix"><Search size={18} /></div>
            <input
              className="input"
              type="search"
              placeholder="Tìm mã đơn, tên khách, số điện thoại"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '160px', paddingRight: '32px' }} 
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedWard('ALL');
            }}
          >
            <option value="ALL">Tất cả Quận/Huyện</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          
          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '160px', paddingRight: '32px' }}
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
          >
            <option value="ALL">Tất cả Phường/Xã</option>
            {wards.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

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
              {filteredOrders.length > 0 ? (
                filteredOrders.map(o => (
                  <tr key={o.order_code} className="click" onClick={() => setSelectedOrderCode(o.order_code)}>
                    <td className="td-main">
                      <b>{o.order_code}</b>
                      <small>{new Date(o.created_at).toLocaleString('vi-VN')}</small>
                    </td>
                    <td data-label="Khách hàng">
                      {o.customer}
                      <small>{o.receiver_phone}</small>
                    </td>
                    <td data-label="Món">{o.items.reduce((acc: number, cur: { quantity: number }) => acc + cur.quantity, 0)} món</td>
                    <td data-label="Tổng tiền"><b>{o.total_amount.toLocaleString('vi-VN')}đ</b></td>
                    <td data-label="Gói hàng">
                      {o.package_code ? <span className="tag">{o.package_code}</span> : <span className="faint">—</span>}
                    </td>
                    <td data-label="Trạng thái">
                      <span className={`pill s-${o.status}`}>{STATUS_MAP[o.status]}</span>
                    </td>
                    <td className="td-act">
                      <button
                        className="btn btn-soft btn-sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedOrderCode(o.order_code); }}
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
                      <h3>Không có đơn hàng</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && !confirmingOrderCode && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrderCode(null)}
          onCancel={() => handleCancelOrder(selectedOrder.order_code)}
          onConfirm={() => {
            setConfirmError('');
            setConfirmingOrderCode(selectedOrder.order_code);
          }}
        />
      )}

      {confirmingOrderCode && (
        <ConfirmOrderModal
          orderCode={confirmingOrderCode}
          openPackages={openPackages}
          maxPerPackage={maxPerPackage}
          externalError={confirmError}
          onClose={() => {
            setConfirmError('');
            setConfirmingOrderCode(null);
          }}
          onConfirm={handleConfirmOrder}
        />
      )}
    </>
  );
};
