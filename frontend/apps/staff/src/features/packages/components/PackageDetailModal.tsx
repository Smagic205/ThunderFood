import React from 'react';
import { X } from 'lucide-react';
import { useOrderStore } from '@/features/orders/store/orderStore';

interface PackageDetailModalProps {
  pkgId: number;
  onClose: () => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({ pkgId, onClose }) => {
  const packages = useOrderStore(s => s.packages);
  const orders = useOrderStore(s => s.orders);
  
  const pkg = packages.find(p => p.id === pkgId);
  if (!pkg) return null;

  const pkgOrders = orders.filter(o => pkg.order_codes.includes(o.order_code));

  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div className="dlg" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-h">
          <h3>Chi tiết gói {pkg.code}</h3>
          <button className="ibtn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="dlg-b" style={{ padding: '20px' }}>
          <p className="muted" style={{ marginBottom: '16px' }}>Danh sách {pkgOrders.length} đơn hàng trong gói này:</p>
          <div className="vlist">
            {pkgOrders.length === 0 ? (
              <p className="muted">Gói hàng này chưa có đơn nào.</p>
            ) : (
              pkgOrders.map(o => (
                <div key={o.order_code} className="card card-p" style={{ padding: '12px' }}>
                  <div className="row between">
                    <b>{o.order_code}</b>
                    <span className={`pill s-${o.status}`}>
                      {o.status === 'PENDING' ? 'Chờ xác nhận' : 'Đã xác nhận'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                    <div>Người nhận: {o.receiver_name} - {o.receiver_phone}</div>
                    <div style={{ marginTop: '4px' }}>Địa chỉ: {o.shipping_address}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="dlg-f">
          <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};
