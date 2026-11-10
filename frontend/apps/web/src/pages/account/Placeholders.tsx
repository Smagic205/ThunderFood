import { MapPin, Wallet, Plus } from 'lucide-react';

export const AddressesPage = () => (
  <div>
    <div className="page-h" style={{ marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Địa chỉ giao hàng</h1>
        <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
          Quản lý các địa chỉ nhận món ăn để đặt hàng nhanh chóng hơn.
        </p>
      </div>
      <button className="btn btn-primary" type="button">
        <Plus size={18} />
        <span>Thêm địa chỉ</span>
      </button>
    </div>

    <div className="empty card">
      <div className="art-wrap text-[var(--c-amber)] bg-[var(--volt-soft)]"><MapPin size={48} /></div>
      <h3>Chưa có địa chỉ nào</h3>
      <p>Thêm địa chỉ giao hàng để ThunderFood phục vụ bạn nhanh nhất.</p>
      <button className="btn btn-primary mt-2" type="button">
        <Plus size={18} />
        <span>Thêm địa chỉ mới</span>
      </button>
    </div>
  </div>
);

export const PaymentsPage = () => (
  <div>
    <div className="page-h" style={{ marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Lịch sử giao dịch</h1>
        <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
          Theo dõi các giao dịch thanh toán trực tuyến hoặc hoàn tiền.
        </p>
      </div>
    </div>

    <div className="empty card">
      <div className="art-wrap text-[#6B3FD1] bg-purple-50 dark:bg-purple-950/40"><Wallet size={48} /></div>
      <h3>Chưa có giao dịch</h3>
      <p>Thông tin thanh toán qua VNPAY, MoMo hoặc chuyển khoản sẽ ghi nhận tại đây.</p>
    </div>
  </div>
);
