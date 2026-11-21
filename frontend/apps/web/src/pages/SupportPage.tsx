import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Search,
  ChevronDown,
  Send,
  CheckCircle2,
  Package,
  HelpCircle,
  Truck,
  CreditCard,
  Percent,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Loader2,
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
    question: 'Thời gian giao hàng trung bình của ThunderFood là bao lâu?',
    answer:
      'Thời gian giao hàng thông thường từ 25 - 40 phút kể từ lúc bạn hoàn tất đặt đơn. Đội ngũ đầu bếp sẽ chuẩn bị món nóng hổi ngay khi nhận đơn và shipper chuyên trách sẽ giao tận tay bạn.',
  },
  {
    id: 'faq-2',
    category: 'ORDER',
    question: 'ThunderFood phục vụ giao hàng tại những khu vực nào?',
    answer:
      'Hiện tại ThunderFood phục vụ toàn bộ các quận nội thành Hà Nội: Hoàn Kiếm, Ba Đình, Đống Đa, Hai Bà Trưng, Cầu Giấy, Thanh Xuân, Tây Hồ và Nam/Bắc Từ Liêm. Bạn có thể kiểm tra phí giao hàng chính xác theo phường/xã tại bước Thanh toán.',
  },
  {
    id: 'faq-3',
    category: 'ORDER',
    question: 'Làm thế nào để tôi theo dõi tiến độ đơn hàng của mình?',
    answer:
      'Bạn có thể vào mục "Tài khoản > Đơn mua" để xem chi tiết trạng thái từng đơn hàng theo thời gian thực (Chờ xác nhận → Bếp đang chuẩn bị → Đang giao hàng → Hoàn thành).',
  },
  {
    id: 'faq-4',
    category: 'ORDER',
    question: 'Tôi có thể thay đổi địa chỉ hoặc số điện thoại sau khi đặt không?',
    answer:
      'Nếu đơn hàng đang ở trạng thái "Chờ xác nhận", bạn vui lòng liên hệ ngay hotline 1900 6868 để nhân viên hỗ trợ cập nhật thông tin trước khi đơn được giao cho shipper.',
  },
  {
    id: 'faq-5',
    category: 'PAYMENT',
    question: 'ThunderFood hỗ trợ những phương thức thanh toán nào?',
    answer:
      'Chúng tôi hỗ trợ: 1) Thanh toán tiền mặt khi nhận hàng (COD), 2) Chuyển khoản ngân hàng qua mã QR / VNPay, 3) Thẻ ATM/Visa/MasterCard nội địa và quốc tế.',
  },
  {
    id: 'faq-6',
    category: 'PAYMENT',
    question: 'Tôi thanh toán online nhưng đơn hàng bị hủy, tiền sẽ được hoàn như thế nào?',
    answer:
      'Với các đơn thanh toán trực tuyến bị hủy hoặc hoàn tiền, số tiền sẽ được hoàn trả tự động vào tài khoản ngân hàng hoặc thẻ của bạn trong vòng 2 - 5 ngày làm việc tùy chính sách của từng ngân hàng.',
  },
  {
    id: 'faq-7',
    category: 'PROMO',
    question: 'Chính sách miễn phí vận chuyển (Freeship) áp dụng như thế nào?',
    answer:
      'ThunderFood tự động áp dụng Miễn phí vận chuyển cho tất cả các đơn hàng có giá trị tiền món từ 300.000 ₫ trở lên. Ngoài ra, bạn có thể áp dụng thêm mã Freeship từ trang "Khuyến mãi".',
  },
  {
    id: 'faq-8',
    category: 'PROMO',
    question: 'Tôi có thể áp dụng đồng thời mã giảm giá món và mã freeship không?',
    answer:
      'Hệ thống của ThunderFood cho phép áp dụng tối đa 01 voucher ưu đãi trên mỗi đơn hàng. Bạn có thể chọn voucher có mức giảm cao nhất để tối ưu chi phí đặt món.',
  },
  {
    id: 'faq-9',
    category: 'QUALITY',
    question: 'Nếu món ăn giao đến bị nguội, thiếu món hoặc không đúng yêu cầu thì xử lý ra sao?',
    answer:
      'ThunderFood cam kết chất lượng 100%. Nếu có bất kỳ sự cố nào về món ăn, bạn chỉ cần chụp ảnh và gọi ngay hotline 1900 6868 hoặc gửi yêu cầu hỗ trợ bên dưới, chúng tôi sẽ giao lại món mới miễn phí hoặc hoàn tiền ngay lập tức.',
  },
  {
    id: 'faq-10',
    category: 'QUALITY',
    question: 'Món ăn của ThunderFood có đảm bảo vệ sinh an toàn thực phẩm không?',
    answer:
      'Tất cả nguyên liệu thịt gà tươi, bò băm, rau củ đều có chứng nhận nguồn gốc xuất xứ rõ ràng và được kiểm dịch nghiêm ngặt. Quy trình chế biến tuân thủ tiêu chuẩn an toàn thực phẩm HACCP quốc tế.',
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

  // Contact Form State
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    orderCode: '',
    topic: 'ORDER_ISSUE',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.message.trim()) {
      setFormError('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Nội dung yêu cầu.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    // Giả lập gửi yêu cầu hỗ trợ
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setForm({
        fullName: '',
        phone: '',
        email: '',
        orderCode: '',
        topic: 'ORDER_ISSUE',
        message: '',
      });
    }, 800);
  };

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
            Chăm sóc khách hàng 24/7
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
            Tìm câu trả lời nhanh cho các vấn đề thường gặp hoặc liên hệ trực tiếp với bộ phận chăm sóc khách hàng của ThunderFood.
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
        {/* Quick Contact Cards */}
        <section
          aria-labelledby="contact-channels-heading"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '18px',
            marginBottom: '48px',
          }}
        >
          <h2 id="contact-channels-heading" className="sr">Kênh liên hệ hỗ trợ</h2>

          {/* Hotline */}
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
              <PhoneCall size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Tổng đài Hotline</b>
              <span className="muted" style={{ fontSize: '13px' }}>08:00 - 22:00 hằng ngày</span>
            </div>
            <a
              href="tel:19006868"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              <PhoneCall size={14} />
              1900 6868
            </a>
          </div>

          {/* Email */}
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
              <Mail size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Hộp thư hỗ trợ</b>
              <span className="muted" style={{ fontSize: '13px' }}>Phản hồi trong 2-4 giờ</span>
            </div>
            <a
              href="mailto:hotro@thunderfood.vn"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              <Mail size={14} />
              hotro@thunderfood.vn
            </a>
          </div>

          {/* Tracking Orders */}
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
              <Package size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Theo dõi đơn hàng</b>
              <span className="muted" style={{ fontSize: '13px' }}>Xem vị trí đơn đang giao</span>
            </div>
            <Link
              to="/account/orders"
              className="btn btn-soft btn-sm"
              style={{ marginTop: 'auto', textDecoration: 'none' }}
            >
              Xem đơn mua <ChevronRight size={14} />
            </Link>
          </div>

          {/* Address */}
          <div className="card card-p" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(107, 63, 209, 0.12)',
                color: 'var(--c-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <b style={{ fontSize: '16px', display: 'block', color: 'var(--ink)' }}>Cửa hàng & Bếp chính</b>
              <span className="muted" style={{ fontSize: '13px' }}>86 Hàng Bài, Hoàn Kiếm, HN</span>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ink-2)' }}>
              <Clock size={14} />
              <span>08:00 - 22:00</span>
            </div>
          </div>
        </section>

        {/* Main Content Layout: FAQ & Contact Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'start' }}>
          {/* FAQ Accordion Section */}
          <section aria-labelledby="faq-heading" style={{ flex: '1 1 500px' }}>
            <div className="sec-h" style={{ marginBottom: '18px' }}>
              <div>
                <h2 id="faq-heading" style={{ fontSize: '1.65rem' }}>Câu hỏi thường gặp</h2>
                <p>Những giải đáp chi tiết cho các thắc mắc phổ biến nhất</p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '12px',
                marginBottom: '16px',
                scrollbarWidth: 'none',
              }}
            >
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
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
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>Thử tìm bằng từ khóa khác hoặc gửi yêu cầu bên cạnh.</p>
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

            {/* Quality Commitment Box */}
            <div
              className="card card-p"
              style={{
                marginTop: '24px',
                background: 'linear-gradient(135deg, rgba(255, 184, 28, 0.08) 0%, rgba(36, 80, 214, 0.06) 100%)',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <ShieldCheck size={22} style={{ color: 'var(--c-amber)' }} />
                <b style={{ fontSize: '15px', color: 'var(--ink)' }}>Cam kết chất lượng ThunderFood</b>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-2)', lineHeight: 1.6 }}>
                Mọi món ăn đều được đóng hộp giữ nhiệt cẩn thận, đảm bảo độ giòn và hương vị ngon nhất khi đến tay bạn. Nếu bạn không hài lòng về bất kỳ điều gì, hãy để chúng tôi có cơ hội phục vụ lại bạn tốt hơn!
              </p>
            </div>
          </section>

          {/* Online Support Ticket Form */}
          <section aria-labelledby="form-heading" style={{ flex: '1 1 380px' }}>
            <div className="card card-p">
              <div style={{ marginBottom: '20px' }}>
                <h2 id="form-heading" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                  Gửi yêu cầu hỗ trợ trực tuyến
                </h2>
                <p className="muted" style={{ fontSize: '13.5px' }}>
                  Điền thông tin và vấn đề bạn gặp phải, chuyên viên CSKH sẽ liên hệ lại trong thời gian sớm nhất.
                </p>
              </div>

              {submitted ? (
                <div
                  style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--ink)' }}>
                    Đã gửi yêu cầu thành công!
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: '20px' }}>
                    Cảm ơn bạn đã phản hồi. Đội ngũ chăm sóc khách hàng của ThunderFood đã tiếp nhận và sẽ chủ động liên hệ lại qua số điện thoại của bạn.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSubmitted(false)}
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {formError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(194, 55, 47, 0.1)',
                        border: '1px solid rgba(194, 55, 47, 0.25)',
                        color: 'var(--c-red)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Họ và tên <span style={{ color: 'var(--c-red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {/* SĐT & Email */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Số điện thoại <span style={{ color: 'var(--c-red)' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--ink)',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="ban@gmail.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--ink)',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Mã đơn hàng (nếu có) */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Mã đơn hàng (nếu có)
                    </label>
                    <input
                      type="text"
                      placeholder="VD: TF261110001"
                      value={form.orderCode}
                      onChange={(e) => setForm({ ...form, orderCode: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {/* Vấn đề cần hỗ trợ */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Chủ đề cần hỗ trợ
                    </label>
                    <select
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                      }}
                    >
                      <option value="ORDER_ISSUE">Tiến độ giao hàng / Shipper</option>
                      <option value="FOOD_QUALITY">Chất lượng món ăn / Đổi trả món</option>
                      <option value="PAYMENT_ISSUE">Thanh toán & Hoàn tiền</option>
                      <option value="VOUCHER_ISSUE">Mã giảm giá & Khuyến mãi</option>
                      <option value="FEEDBACK">Góp ý dịch vụ & Khác</option>
                    </select>
                  </div>

                  {/* Nội dung tin nhắn */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      Nội dung chi tiết <span style={{ color: 'var(--c-red)' }}>*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Mô tả cụ thể sự cố hoặc nội dung bạn cần ThunderFood hỗ trợ..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--line)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--ink)',
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={isSubmitting}
                    style={{ marginTop: '8px' }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Gửi yêu cầu hỗ trợ</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
