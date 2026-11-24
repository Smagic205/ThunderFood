import { Wallet } from 'lucide-react';

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
      <h3>Lịch sử giao dịch chưa khả dụng</h3>
      <p>Ứng dụng hiện chưa kết nối chức năng tải lịch sử thanh toán.</p>
    </div>
  </div>
);
