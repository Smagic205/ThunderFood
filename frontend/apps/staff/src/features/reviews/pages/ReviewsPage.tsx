import { useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bolt, ChevronLeft, ChevronRight, Image, Loader2, MessageSquare, Send, Star, X } from 'lucide-react';
import { staffReviewApi, type ReviewResponse } from '@/features/reviews/api/staffReviewApi';
import { isSafeUrl, sanitizeUrl } from '@/shared/utils/security';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const renderStars = (rating: number) => Array.from({ length: 5 }, (_, index) => (
  <Star
    key={index}
    size={15}
    fill={index < rating ? 'var(--c-amber)' : 'transparent'}
    color={index < rating ? 'var(--c-amber)' : 'var(--ink-3)'}
  />
));

export const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null);
  const [replyText, setReplyText] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const reviewsQuery = useQuery({
    queryKey: ['staff-reviews', page],
    queryFn: () => staffReviewApi.getPage(page, 15),
    staleTime: 15_000,
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) => staffReviewApi.reply(reviewId, reply),
    onSuccess: async (updatedReview) => {
      setSelectedReview(null);
      setReplyText('');
      setFormError('');
      setSuccessMessage('Đã gửi phản hồi cho khách hàng.');
      await queryClient.invalidateQueries({ queryKey: ['staff-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', updatedReview.productId] });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const reviews = reviewsQuery.data?.content ?? [];
  const pagination = reviewsQuery.data?.pagination;

  const openReply = (review: ReviewResponse) => {
    setSelectedReview(review);
    setReplyText(review.staffReply ?? '');
    setFormError('');
    setSuccessMessage('');
  };

  const handleSubmitReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reply = replyText.trim();
    if (!reply) {
      setFormError('Nhập nội dung phản hồi trước khi gửi.');
      return;
    }
    if (!selectedReview) return;
    setFormError('');
    replyMutation.mutate({ reviewId: selectedReview.id, reply });
  };

  return (
    <>
      <div className="ah">
        <div>
          <h2>Đánh giá của khách hàng</h2>
          <p>Đọc góp ý và phản hồi công khai dưới tên ThunderFood.</p>
        </div>
        {pagination && <span className="muted">{pagination.totalElements} đánh giá</span>}
      </div>

      {successMessage && (
        <div className="card card-p" role="status" style={{ marginBottom: 16, color: 'var(--c-green)' }}>
          {successMessage}
        </div>
      )}

      {reviewsQuery.isLoading ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}>
          <Loader2 size={24} className="animate-spin" />
          <p className="muted">Đang tải đánh giá…</p>
        </div>
      ) : reviewsQuery.isError ? (
        <div className="empty card" role="alert" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={28} style={{ color: 'var(--c-red)' }} />
          <h3>Không tải được đánh giá</h3>
          <p className="muted">{errorMessage(reviewsQuery.error)}</p>
          <button className="btn btn-soft btn-sm" onClick={() => reviewsQuery.refetch()}>Thử lại</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}>
          <MessageSquare size={30} className="muted" />
          <h3>Chưa có đánh giá nào</h3>
          <p className="muted">Đánh giá mới của khách hàng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
          {reviews.map((review) => (
            <article key={review.id} className={`card rv-adm ${review.isHidden ? 'hidden-rv' : ''}`} style={{ minWidth: 0 }}>
              <div style={{ width: 56, flexShrink: 0, paddingTop: 2 }}>
                {review.userAvatar ? (
                  <img src={review.userAvatar} alt="" className="avatar" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                ) : (
                  <div className="tile xs" style={{ borderRadius: 16, '--tint': 'var(--volt)' } as CSSProperties}>
                    {(review.userName || 'K').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', columnGap: 16, rowGap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
                    <b>{review.userName || 'Khách hàng'}</b>
                    <span className="faint">đánh giá</span>
                    <span className="tlink">{review.productName || 'Món ăn'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 10, rowGap: 6 }}>
                    <div aria-label={`${review.rating} trên 5 sao`} style={{ display: 'inline-flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>{renderStars(review.rating)}</div>
                    <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{review.rating}/5</span>
                    <span className="faint" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(review.createdAt)}</span>
                  </div>
                </div>

                <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Mã đơn {review.orderCode || `#${review.orderId}`}</div>
                <p style={{ margin: '12px 0 8px', color: review.isHidden ? 'var(--ink-3)' : 'var(--ink)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.6 }}>
                  {review.comment || 'Khách không để lại nhận xét.'}
                </p>
                {isSafeUrl(review.imageUrl) && (
                  <a className="tlink" href={sanitizeUrl(review.imageUrl, { fallback: '#' })} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Image size={15} /> Xem ảnh khách gửi
                  </a>
                )}
                {review.isHidden && (
                  <div><span className="pill s-CANCELLED nodot" style={{ margin: '8px 0 0' }}>Đang ẩn khỏi cửa hàng</span></div>
                )}

                {review.staffReply && (
                  <div className="reply" style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', borderRadius: 12 }}>
                    <b style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                      <Bolt size={15} /> ThunderFood phản hồi
                      {review.repliedByStaffName && <span className="faint" style={{ fontWeight: 400 }}>· Nhân viên: {review.repliedByStaffName}</span>}
                      {review.repliedAt && <span className="faint" style={{ fontWeight: 400 }}>· {formatDate(review.repliedAt)}</span>}
                    </b>
                    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', lineHeight: 1.55, marginTop: 6 }}>{review.staffReply}</div>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 14, gap: 8 }}>
                  <button className="btn btn-soft btn-sm" onClick={() => openReply(review)}>
                    <MessageSquare size={16} /> {review.staffReply ? 'Sửa phản hồi' : 'Phản hồi'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="row between wrap" style={{ padding: '16px 4px', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Trang {pagination.page + 1} / {pagination.totalPages} · {pagination.totalElements} đánh giá
          </span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasPrevious || reviewsQuery.isFetching} onClick={() => setPage((value) => Math.max(0, value - 1))}>
              <ChevronLeft size={16} /> Trang trước
            </button>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasNext || reviewsQuery.isFetching} onClick={() => setPage((value) => value + 1)}>
              Trang sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="dlg-overlay" onClick={() => !replyMutation.isPending && setSelectedReview(null)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="staff-review-reply-title" onClick={(event) => event.stopPropagation()}>
            <div className="dlg-h">
              <h3 id="staff-review-reply-title">{selectedReview.staffReply ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}</h3>
              <button className="ibtn" disabled={replyMutation.isPending} onClick={() => setSelectedReview(null)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="dlg-body">
              <blockquote style={{ margin: '0 0 16px', padding: '14px 16px', borderRadius: 14, background: 'var(--surface-2)' }}>
                <b>{selectedReview.userName || 'Khách hàng'}</b>
                <div className="row" style={{ gap: 2, marginTop: 4 }}>{renderStars(selectedReview.rating)}</div>
                <div className="muted" style={{ marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{selectedReview.comment || 'Không có nhận xét.'}</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>{selectedReview.productName} · Đơn {selectedReview.orderCode || `#${selectedReview.orderId}`}</div>
              </blockquote>
              <form id="staff-review-reply-form" onSubmit={handleSubmitReply}>
                <label className="field">
                  <span>Nội dung phản hồi</span>
                  <textarea
                    className="textarea"
                    placeholder="Cảm ơn bạn đã góp ý…"
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    maxLength={1000}
                    autoFocus
                    disabled={replyMutation.isPending}
                  />
                </label>
                <div className="row between" style={{ marginTop: 6 }}>
                  <span className="faint" style={{ fontSize: 12 }}>Khách sẽ thấy phản hồi dưới tên ThunderFood.</span>
                  <span className="faint" style={{ fontSize: 12 }}>{replyText.length}/1000</span>
                </div>
                {formError && <p role="alert" style={{ color: 'var(--c-red)', fontSize: 13, marginTop: 10 }}>{formError}</p>}
              </form>
            </div>
            <div className="dlg-f row" style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" disabled={replyMutation.isPending} onClick={() => setSelectedReview(null)}>Hủy</button>
              <button className="btn btn-primary" type="submit" form="staff-review-reply-form" disabled={replyMutation.isPending || !replyText.trim()}>
                {replyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
