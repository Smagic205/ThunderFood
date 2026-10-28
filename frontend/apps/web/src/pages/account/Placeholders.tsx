import { MapPin, Receipt, Wallet, Heart, Bell, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="art-wrap text-[var(--c-amber)] bg-[var(--volt-soft)]">
        <MapPin size={48} />
      </div>
      <h3>Chưa có địa chỉ nào</h3>
      <p>Thêm địa chỉ giao hàng để ThunderFood phục vụ bạn nhanh nhất.</p>
      <button className="btn btn-primary mt-2" type="button">
        <Plus size={18} />
        <span>Thêm địa chỉ mới</span>
      </button>
    </div>
  </div>
);

export const OrdersPage = () => (
  <div>
    <div className="page-h" style={{ marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Đơn hàng của tôi</h1>
        <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
          Xem lịch sử đơn mua, tình trạng giao hàng và đặt lại các món yêu thích.
        </p>
      </div>
    </div>

    <div className="empty card">
      <div className="art-wrap text-[#2450D6] bg-blue-50 dark:bg-blue-950/40">
        <Receipt size={48} />
      </div>
      <h3>Chưa có đơn hàng nào</h3>
      <p>Các đơn hàng bạn đặt sẽ được lưu trữ và hiển thị tại đây.</p>
      <Link className="btn btn-primary mt-2" to="/menu">
        <ShoppingBag size={18} />
        <span>Khám phá thực đơn ngay</span>
      </Link>
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
      <div className="art-wrap text-[#6B3FD1] bg-purple-50 dark:bg-purple-950/40">
        <Wallet size={48} />
      </div>
      <h3>Chưa có giao dịch</h3>
      <p>Thông tin thanh toán qua VNPAY, MoMo hoặc chuyển khoản sẽ ghi nhận tại đây.</p>
    </div>
  </div>
);

export const WishlistPage = () => (
  <div>
    <div className="page-h" style={{ marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Món yêu thích</h1>
        <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
          Danh sách các món ăn bạn đã lưu lại để thưởng thức sau.
        </p>
      </div>
    </div>

    <div className="empty card">
      <div className="art-wrap text-[var(--c-red)] bg-red-50 dark:bg-red-950/40">
        <Heart size={48} />
      </div>
      <h3>Chưa có món yêu thích</h3>
      <p>Nhấp vào biểu tượng trái tim ở từng món ăn để lưu vào danh sách yêu thích.</p>
      <Link className="btn btn-primary mt-2" to="/menu">
        <ShoppingBag size={18} />
        <span>Xem thực đơn</span>
      </Link>
    </div>
  </div>
);

export const NotificationsPage = () => (
  <div>
    <div className="page-h" style={{ marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>Thông báo</h1>
        <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
          Cập nhật trạng thái đơn hàng, ưu đãi và tin tức mới nhất từ ThunderFood.
        </p>
      </div>
    </div>

    <div className="empty card">
      <div className="art-wrap text-[#0F7F59] bg-green-50 dark:bg-green-950/40">
        <Bell size={48} />
      </div>
      <h3>Không có thông báo mới</h3>
      <p>Bạn đã xem tất cả các thông báo từ hệ thống.</p>
    </div>
  </div>
);
