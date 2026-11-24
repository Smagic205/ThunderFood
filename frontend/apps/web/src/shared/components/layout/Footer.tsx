import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot-in">
          <div>
            <Link className="logo" to="/">
              <span className="logo-mark">
                <Zap size={22} />
              </span>
              <span>ThunderFood</span>
            </Link>
            <p style={{ marginTop: '16px', maxWidth: '32ch', color: '#B9C0EA' }}>
              Chọn món từ thực đơn và theo dõi đơn hàng trong tài khoản của bạn.
            </p>
          </div>
          <div>
            <h4>Khám phá</h4>
            <ul>
              <li><Link to="/menu">Thực đơn</Link></li>
              <li><Link to="/menu?cat=1">Combo tiết kiệm</Link></li>
              <li><Link to="/menu?sort=best">Món bán chạy</Link></li>
              <li><Link to="/account/wishlist">Món yêu thích</Link></li>
            </ul>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <ul>
              <li><Link to="/support">Câu hỏi thường gặp</Link></li>
              <li><Link to="/support">Liên hệ</Link></li>
              <li><Link to="/account/orders">Theo dõi đơn hàng</Link></li>
              <li><Link to="/login">Đăng nhập</Link></li>
            </ul>
          </div>
          <div>
            <h4>Tài khoản</h4>
            <ul>
              <li><Link to="/account/orders">Đơn mua</Link></li>
              <li><Link to="/account/profile">Thông tin cá nhân</Link></li>
              <li><Link to="/account/addresses">Địa chỉ giao hàng</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-b">
          <span>© 2026 ThunderFood. Bảo lưu mọi quyền.</span>
        </div>
      </div>
    </footer>
  );
};
