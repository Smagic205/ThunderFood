import { useState } from 'react';
import { MessageSquare, Star, Bolt } from 'lucide-react';
import { MOCK_REVIEWS } from '@/features/orders/store/mockData';
import { useAuthStore } from '@/features/auth/store/authStore';

const renderStars = (rating: number) => {
  return Array(5).fill(0).map((_, i) => (
    <Star 
      key={i} 
      size={15} 
      fill={i < rating ? "var(--c-amber)" : "transparent"} 
      color={i < rating ? "var(--c-amber)" : "var(--ink-3)"} 
    />
  ));
};

export const ReviewsPage = () => {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  const handleOpenReply = (review: any) => {
    setSelectedReview(review);
    setReplyText(review.staff_reply || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert('Nhập nội dung phản hồi');
      return;
    }
    
    setReviews(prev => prev.map(r => {
      if (r.id === selectedReview.id) {
        return {
          ...r,
          staff_reply: replyText.trim(),
          replied_by: user?.id
        };
      }
      return r;
    }));
    
    setReplyModalOpen(false);
  };

  return (
    <>
      <div className="ah">
        <div>
          <h2>Đánh giá của khách hàng</h2>
          <p>Phản hồi khách hàng dưới tên chung "ThunderFood". Admin có quyền ẩn nội dung không phù hợp.</p>
        </div>
      </div>
      
      <div className="stack" style={{ display: 'grid', gap: '14px' }}>
        {reviews.map(r => (
          <article key={r.id} className={`card rv-adm ${r.is_hidden ? 'hidden-rv' : ''}`}>
            <div style={{ width: '64px' }}>
              <div className="tile xs" style={{ borderRadius: '16px', '--tint': 'var(--volt)' } as any}>
                📦
              </div>
            </div>
            <div>
              <div className="row between wrap" style={{ gap: '8px' }}>
                <div>
                  <b>{r.user}</b> <span className="faint">đánh giá</span> <span className="tlink">{r.product_name}</span>
                </div>
                <div className="row" style={{ gap: '10px' }}>
                  <div className="row" style={{ gap: '2px' }}>{renderStars(r.rating)}</div>
                  <span className="faint" style={{ fontSize: '13px' }}>
                    {new Date(r.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              
              <p style={{ margin: '8px 0', color: r.is_hidden ? 'var(--ink-3)' : 'var(--ink)' }}>
                {r.comment}
              </p>
              
              {r.is_hidden && (
                <span className="pill s-CANCELLED nodot" style={{ marginBottom: '8px' }}>Đang ẩn khỏi cửa hàng</span>
              )}
              
              {r.staff_reply && (
                <div className="reply" style={{ marginTop: '12px', padding: '12px', background: 'var(--surface-2)', borderRadius: '12px' }}>
                  <b className="row" style={{ gap: '6px', marginBottom: '4px' }}>
                    <Bolt size={15} /> ThunderFood phản hồi
                    <span className="faint" style={{ fontWeight: 400 }}>(nội bộ: ID {r.replied_by})</span>
                  </b>
                  {r.staff_reply}
                </div>
              )}
              
              <div className="row wrap" style={{ marginTop: '12px', gap: '8px' }}>
                <button className="btn btn-soft btn-sm" onClick={() => handleOpenReply(r)}>
                  <MessageSquare size={16} /> {r.staff_reply ? 'Sửa phản hồi' : 'Phản hồi'}
                </button>
              </div>
            </div>
          </article>
        ))}
        
        {reviews.length === 0 && (
          <div className="empty card" style={{ padding: '40px', textAlign: 'center' }}>
            <h3>Không có đánh giá nào</h3>
          </div>
        )}
      </div>

      {replyModalOpen && selectedReview && (
        <div className="dlg-overlay" onClick={() => setReplyModalOpen(false)}>
          <div className="dlg" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-h">Phản hồi đánh giá</div>
            <div className="dlg-body">
              <blockquote style={{ margin: '0 0 16px', padding: '14px 16px', borderRadius: '14px', background: 'var(--surface-2)' }}>
                <b>{selectedReview.user}</b>
                <div className="row" style={{ gap: '2px', marginTop: '4px' }}>{renderStars(selectedReview.rating)}</div>
                <div className="muted" style={{ marginTop: '4px' }}>{selectedReview.comment}</div>
              </blockquote>
              <form id="rp-f" onSubmit={handleSaveReply}>
                <label className="field">
                  <span>Nội dung phản hồi</span>
                  <textarea 
                    className="textarea" 
                    placeholder="Cảm ơn bạn đã góp ý..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    autoFocus
                  />
                </label>
                <p className="faint" style={{ fontSize: '12.5px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Khách sẽ thấy phản hồi này dưới tên ThunderFood, không hiện tên bạn.
                </p>
              </form>
            </div>
            <div className="dlg-f row" style={{ justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setReplyModalOpen(false)}>Hủy</button>
              <button className="btn btn-primary" type="submit" form="rp-f">Gửi phản hồi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
