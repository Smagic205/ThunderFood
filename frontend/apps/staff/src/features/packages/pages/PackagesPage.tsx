import { useNavigate } from 'react-router-dom';
import { Package, Eye, Truck, Info } from 'lucide-react';
import { useOrderStore } from '@/features/orders/store/orderStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PackageDetailModal } from '../components/PackageDetailModal';
import { useState } from 'react';

export const PackagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const packages = useOrderStore(s => s.packages);
  const orders = useOrderStore(s => s.orders);
  const claimPackage = useOrderStore(s => s.claimPackage);

  const [detailPkgId, setDetailPkgId] = useState<number | null>(null);

  const list = packages.filter(p => p.status === 'PENDING');
  const held = packages.find(p => p.staff_id === user?.id && p.status === 'DELIVERING');

  const handleClaim = (pkgId: number) => {
    if (!user?.id) {
      alert('Vui lòng đăng nhập lại');
      return;
    }
    const err = claimPackage(pkgId, user.id);
    if (err) {
      alert(err);
      return;
    }
    navigate('/my-package');
  };

  return (
    <>
      <div className="ah">
        <div>
          <h2>Gói hàng chờ giao</h2>
          <p>{list.length} gói đang chờ nhận. Mỗi nhân viên chỉ giữ một gói tại một thời điểm, nhận gói mới khi gói hiện tại đã hoàn thành.</p>
        </div>
      </div>

      {held && (
        <div className="card card-p" style={{ marginBottom: '20px', borderColor: 'var(--volt)' }}>
          <div className="row" style={{ gap: '12px' }}>
            <Info size={20} className="ic" style={{ color: 'var(--volt)' }} />
            <div>
              Bạn đang giao gói <b>{held.code}</b>. <a className="tlink" href="/my-package" onClick={(e) => { e.preventDefault(); navigate('/my-package'); }}>Xem gói đơn của tôi</a> để hoàn thành trước khi nhận gói mới.
            </div>
          </div>
        </div>
      )}

      <div className="ban-g">
        {list.length > 0 ? (
          list.map(p => {
            const os = orders.filter(o => p.order_codes.includes(o.order_code));
            const canClaim = p.status === 'PENDING' && !held;

            return (
              <article key={p.id} className="card card-p">
                <div className="row between" style={{ marginBottom: '10px' }}>
                  <b style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem' }}>{p.code}</b>
                  <span className={`pill s-${p.status}`}>{p.status === 'PENDING' ? 'Chưa giao' : 'Đang giao'}</span>
                </div>
                <div className="row wrap" style={{ gap: '14px', color: 'var(--ink-2)', fontSize: '14px' }}>
                  <span className="row"><Package size={16} /> {os.length}/7 đơn</span>
                </div>
                <div className="row wrap" style={{ marginTop: '16px', gap: '8px' }}>
                  <button 
                    className="btn btn-soft btn-sm" 
                    type="button" 
                    onClick={() => setDetailPkgId(p.id)}
                  >
                    <Eye size={16} /> Chi tiết
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!canClaim}
                    onClick={() => handleClaim(p.id)}
                  >
                    <Truck size={16} /> Nhận giao gói
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center' }}>
            <h3>Không có gói nào đang chờ</h3>
            <p className="muted">Mọi đơn đã xác nhận hiện đã được xếp vào gói đang giao hoặc đã hoàn thành.</p>
          </div>
        )}
      </div>

      {detailPkgId && (
        <PackageDetailModal 
          pkgId={detailPkgId} 
          onClose={() => setDetailPkgId(null)} 
        />
      )}
    </>
  );
};
