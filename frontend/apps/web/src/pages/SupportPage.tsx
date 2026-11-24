import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Package,
  HelpCircle,
  Truck,
  CreditCard,
  Percent,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'ORDER' | 'PAYMENT' | 'PROMO' | 'QUALITY';
  question: string;
  answer: string;
}

const FAQS_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'ORDER',
    question: 'Tôi xem thời gian giao hàng dự kiến ở đâu?',
    answer:
      'Thời gian dự kiến được cập nhật theo địa chỉ giao hàng và trạng thái đơn. Bạn có thể xem thông tin này khi đặt món và trong trang theo dõi đơn hàng.',
  },
  {
    id: 'faq-2',
    category: 'ORDER',
    question: 'ThunderFood có giao đến khu vực của tôi không?',
    answer:
      'Hãy chọn địa chỉ giao hàng ở bước thanh toán. Hệ thống sẽ hiển thị các phường/xã đang phục vụ và phí giao tương ứng với địa chỉ đó.',
  },
  {
    id: 'faq-3',
    category: 'ORDER',
    question: 'Làm thế nào để tôi theo dõi tiến độ đơn hàng của mình?',
    answer:
      'Vào mục Tài khoản > Đơn mua để xem trạng thái và thông tin theo dõi hiện có của từng đơn hàng.',
  },
  {
    id: 'faq-4',
    category: 'ORDER',
    question: 'Tôi cần sửa địa chỉ hoặc số điện thoại sau khi đặt thì làm sao?',
    answer:
      'Mở mục Tài khoản > Đơn mua để kiểm tra trạng thái đơn. Nếu đơn chưa được xử lý, bạn có thể hủy đơn theo tùy chọn đang hiển thị rồi đặt lại với thông tin chính xác.',
  },
  {
    id: 'faq-5',
    category: 'PAYMENT',
    question: 'ThunderFood hỗ trợ những phương thức thanh toán nào?',
    answer:
      'Các phương thức khả dụng sẽ được hiển thị ở bước thanh toán cho đơn hàng của bạn.',
  },
  {
    id: 'faq-6',
    category: 'PAYMENT',
    question: 'Tôi thanh toán online nhưng đơn hàng bị hủy, tiền sẽ được hoàn như thế nào?',
    answer:
      'Kiểm tra trạng thái đơn và thông tin thanh toán trong Tài khoản > Đơn mua. Trang này hiện chưa có chức năng gửi yêu cầu tra soát.',
  },
  {
    id: 'faq-7',
    category: 'PROMO',
    question: 'Chính sách miễn phí vận chuyển (Freeship) áp dụng như thế nào?',
    answer:
      'Điều kiện và mức giảm phí giao hàng được ghi trong từng voucher. Mã đủ điều kiện sẽ được áp dụng ở bước thanh toán.',
  },
  {
    id: 'faq-8',
    category: 'PROMO',
    question: 'Tôi có thể áp dụng đồng thời mã giảm giá món và mã freeship không?',
    answer:
      'Nhập mã vào trường ưu đãi phù hợp ở bước thanh toán. Hệ thống sẽ kiểm tra điều kiện và hiển thị số tiền được giảm trước khi bạn xác nhận đơn.',
  },
  {
    id: 'faq-9',
    category: 'QUALITY',
    question: 'Nếu món ăn giao đến bị nguội, thiếu món hoặc không đúng yêu cầu thì xử lý ra sao?',
    answer:
      'Kiểm tra thông tin đơn hàng trong Tài khoản > Đơn mua. Chức năng gửi yêu cầu hỗ trợ trực tuyến hiện chưa khả dụng.',
  },
  {
    id: 'faq-10',
    category: 'QUALITY',
    question: 'Tôi xem thành phần hoặc thông tin dị ứng của món ăn ở đâu?',
    answer:
      'Mở trang chi tiết món để xem thông tin thành phần được cung cấp. Ứng dụng chưa hiển thị thông tin dị ứng riêng cho từng món.',
  },
];

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả câu hỏi', icon: HelpCircle },
  { key: 'ORDER', label: 'Đặt món & Giao hàng', icon: Truck },
  { key: 'PAYMENT', label: 'Thanh toán & Hóa đơn', icon: CreditCard },
  { key: 'PROMO', label: 'Khuyến mãi & Voucher', icon: Percent },
  { key: 'QUALITY', label: 'Chất lượng & Khiếu nại', icon: ShieldCheck },
];

export const SupportPage: React.FC = () => {
  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filtered FAQ List
  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((faq) => {
      // Category filter
      if (selectedCategory !== 'ALL' && faq.category !== selectedCategory) {
        return false;
      }
      // Search keyword
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Breadcrumb Header */}
      <div className="container" style={{ paddingTop: '20px' }}>
        <nav className="crumbs" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <span className="ic">/</span>
          <span style={{ color: 'var(--ink)' }}>Trung tâm hỗ trợ</span>
        </nav>
      </div>

      {/* Hero Banner Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--panel) 0%, var(--panel-2) 100%)',
          color: '#fff',
          padding: '48px 0 54px',
          marginBottom: '36px',
        }}
      >
        <div className="container center">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 184, 28, 0.15)',
              color: 'var(--volt)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '14px',
            }}
          >
            <HelpCircle size={15} />
            Trung tâm hỗ trợ
          </span>

          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '12px' }}>
            Chúng tôi có thể giúp gì cho bạn?
          </h1>

          <p
            style={{
              fontSize: '16px',
              color: '#B9C0EA',
              maxWidth: '60ch',
              margin: '0 auto 28px',
              lineHeight: 1.6,
            }}
          >
            Tìm câu trả lời cho các vấn đề thường gặp hoặc kiểm tra thông tin đơn hàng của bạn.
          </p>

          {/* Search Box */}
          <div style={{ maxWidth: '580px', margin: '0 auto', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-3)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              placeholder="Tìm kiếm: phí ship, đổi món, hủy đơn, voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px 14px 50px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '15px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </section>

      <div className="container">
        {/* Available navigation shortcuts */}
        <section
          aria-label="Lối tắt hỗ trợ"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            marginBottom: '48px',
          }}
        >
          {/* FAQ shortcut */}
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 184, 28, 0.15)',
                color: 'var(--c-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Câu hỏi thường gặp</b>
              <span className="muted" style={{ fontSize: '13px' }}>Tìm hướng dẫn theo chủ đề</span>
            </div>
            <a
              href="#faq-heading"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              Xem câu hỏi <ChevronRight size={14} />
            </a>
          </div>

          {/* Tracking Orders */}
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(36, 80, 214, 0.12)',
                color: 'var(--c-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Theo dõi đơn hàng</b>
              <span className="muted" style={{ fontSize: '13px' }}>Xem trạng thái đơn trong tài khoản</span>
            </div>
            <Link
              to="/account/orders"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              Xem đơn mua <ChevronRight size={14} />
            </Link>
          </div>

          {/* Menu */}
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 127, 89, 0.12)',
                color: 'var(--c-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Thực đơn</b>
              <span className="muted" style={{ fontSize: '13px' }}>Xem món ăn đang được cung cấp</span>
            </div>
            <Link
              to="/menu"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              Mở thực đơn <ChevronRight size={14} />
            </Link>
          </div>
        </section>

        {/* FAQ and currently available actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'start' }}>
          {/* FAQ Accordion Section */}
          <section aria-labelledby="faq-heading" style={{ flex: '1 1 500px' }}>
            <div className="sec-h" style={{ marginBottom: '18px' }}>
              <div>
                <h2 id="faq-heading" style={{ fontSize: '1.65rem', scrollMarginTop: '24px' }}>Câu hỏi thường gặp</h2>
                <p>Những giải đáp chi tiết cho các thắc mắc phổ biến nhất</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div
              className="faq-category-tabs"
              role="group"
              aria-label="Chủ đề câu hỏi thường gặp, có thể cuộn ngang"
              tabIndex={0}
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    className="faq-category-chip"
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      border: isActive ? '1px solid var(--volt)' : '1px solid var(--line)',
                      backgroundColor: isActive ? 'var(--volt-soft)' : 'var(--surface)',
                      color: isActive ? 'var(--on-volt)' : 'var(--ink-2)',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* FAQ List using Native <details> according to modern-web-guidance */}
            <div className="faq card" style={{ padding: '0 20px', overflow: 'hidden' }}>
              {filteredFaqs.length === 0 ? (
                <div style={{ padding: '40px 10px', textAlign: 'center', color: 'var(--ink-3)' }}>
                  <HelpCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600 }}>Không tìm thấy câu hỏi phù hợp</p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Thử tìm bằng từ khóa khác hoặc xem trạng thái đơn hàng trong tài khoản.</p>
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <details
                    key={faq.id}
                    open={idx === 0 && !searchQuery}
                    style={{ borderBottom: idx === filteredFaqs.length - 1 ? 'none' : undefined }}
                  >
                    <summary>
                      {/* Guidance note: Avoid headings inside summary for screen readers */}
                      <span style={{ color: 'var(--ink)' }}>{faq.question}</span>
                      <ChevronDown size={18} className="ic" />
                    </summary>
                    <div className="ans">{faq.answer}</div>
                  </details>
                ))
              )}
            </div>
          </section>

          {/* No fabricated support contact or submission flow */}
          <section aria-labelledby="form-heading" style={{ flex: '1 1 380px' }}>
            <div className="card card-p">
              <div style={{ marginBottom: '20px' }}>
                <h2 id="form-heading" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                  Hỗ trợ đơn hàng
                </h2>
                <p className="muted" style={{ fontSize: '13.5px' }}>
                  Chức năng gửi yêu cầu hỗ trợ trực tuyến chưa được kết nối. Bạn có thể xem thông tin và trạng thái đơn hàng trong tài khoản.
                </p>
              </div>
              <Link to="/account/orders" className="btn btn-primary btn-block" style={{ textDecoration: 'none' }}>
                <Package size={16} />
                <span>Mở danh sách đơn mua</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
