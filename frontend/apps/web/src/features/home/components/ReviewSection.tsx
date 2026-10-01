import { Star, Zap } from 'lucide-react';

interface Review {
  id: number;
  user: string;
  avatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminReply?: string;
}

const mockReviews: Review[] = [
  {
    id: 1,
    user: 'Nguyễn Văn A',
    rating: 5,
    comment: 'Gà rán rất giòn và ngon, giao hàng đúng 30 phút. Sẽ ủng hộ quán lâu dài!',
    createdAt: 'Hôm nay',
    adminReply: 'ThunderFood cảm ơn bạn đã tin tưởng và ủng hộ. Chúc bạn một ngày vui vẻ!',
  },
  {
    id: 2,
    user: 'Trần Thị B',
    rating: 5,
    comment: 'Burger to chà bá, cắn ngập răng luôn. Đóng gói rất cẩn thận, không bị nát.',
    createdAt: 'Hôm qua',
    adminReply: 'Cảm ơn đánh giá tuyệt vời của bạn. Hẹn gặp lại bạn ở những đơn hàng sau nhé!',
  },
  {
    id: 3,
    user: 'Lê Hoàng C',
    rating: 5,
    comment: 'Trà sữa đậm vị trà, trân châu mềm dẻo. Rất đáng tiền, 10 điểm!',
    createdAt: '2 ngày trước',
  },
  {
    id: 4,
    user: 'Phạm D',
    rating: 5,
    comment: 'Combo sấm sét ăn bao no. Giá cả hợp lý mà chất lượng thì khỏi bàn.',
    createdAt: '3 ngày trước',
    adminReply: 'ThunderFood rất vui khi mang đến bữa ăn ngon miệng cho bạn!',
  },
];

export function ReviewSection() {
  return (
    <section className="container mx-auto px-4 mb-12">
      <div className="flex flex-col mb-6">
        <h2 className="text-[clamp(1.5rem,3vw,2.15rem)] font-bold text-[#12183A]">Khách hàng nói gì</h2>
        <p className="text-[#565D82] mt-1.5">Đánh giá thực tế từ những người đã trải nghiệm món ngon.</p>
      </div>

      {/* Sử dụng cuộn ngang trên mobile, grid trên desktop */}
      <div className="flex md:grid overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid-cols-2 gap-5 hide-scrollbar">
        {mockReviews.map((r) => (
          <article key={r.id} className="min-w-[85%] md:min-w-0 snap-start flex flex-col bg-white border border-[var(--line)] p-5 rounded-3xl shadow-sm">
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--volt-soft)] text-[var(--volt)] flex items-center justify-center font-bold text-sm shrink-0">
                {r.avatar ? <img src={r.avatar} alt={r.user} className="w-full h-full rounded-full object-cover" /> : r.user.charAt(0)}
              </div>
              <div className="flex-1">
                <b className="block text-[var(--ink)] leading-tight">{r.user}</b>
                <span className="text-xs text-[var(--ink-3)]">{r.createdAt}</span>
              </div>
              <div className="flex text-[var(--volt)]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className={i < r.rating ? "fill-current" : "opacity-30"} />
                ))}
              </div>
            </div>
            
            <p className="text-[#12183A] text-sm leading-relaxed mb-4 grow">{r.comment}</p>
            
            {r.adminReply && (
              <div className="mt-auto bg-[#F3F4FA] rounded-2xl p-4 text-sm">
                <b className="flex items-center gap-1.5 text-[#12183A] mb-1.5">
                  <Zap size={15} className="text-[#FFB81C]" />
                  ThunderFood phản hồi
                </b>
                <p className="text-[#565D82] leading-relaxed">{r.adminReply}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
