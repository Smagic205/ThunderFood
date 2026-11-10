import { useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bolt, ChevronLeft, ChevronRight, Eye, EyeOff, Image, Loader2, MessageSquare, Send, Star, X } from 'lucide-react';
import { reviewsApi, type AdminReview } from '@/features/reviews/api/reviewsApi';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Đã xảy ra lỗi, vui lòng thử lại.';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const renderStars = (rating: number) => Array.from({ length: 5 }, (_, index) => (
  <Star key={index} size={15} fill={index < rating ? 'var(--c-amber)' : 'transparent'} color={index < rating ? 'var(--c-amber)' : 'var(--ink-3)'} />
));

export const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews', page],
    queryFn: () => reviewsApi.getPage(page, 15),
    staleTime: 15_000,
  });

  const refreshReviews = async () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: number; reply: string }) => reviewsApi.reply(reviewId, reply),
    onSuccess: async (review) => {
      setSelectedReview(null);
      setReplyText('');
      setFormError('');
      setNotice('Đã gửi phản hồi cho khách hàng.');
      await refreshReviews();
      queryClient.invalidateQueries({ queryKey: ['product-reviews', review.productId] });
    },
    onError: (error) => setFormError(errorMessage(error)),
  });
  const visibilityMutation = useMutation({
    mutationFn: ({ reviewId, isHidden }: { reviewId: number; isHidden: boolean }) => reviewsApi.setHidden(reviewId, isHidden),
    onSuccess: async (review) => {
      setNotice(review.isHidden ? 'Đã ẩn đánh giá khỏi cửa hàng.' : 'Đã hiển thị lại đánh giá.');
      await refreshReviews();
      queryClient.invalidateQueries({ queryKey: ['product-reviews', review.productId] });
    },
  });

  const reviews = reviewsQuery.data?.content ?? [];
  const pagination = reviewsQuery.data?.pagination;

  const openReply = (review: AdminReview) => {
    setSelectedReview(review);
    setReplyText(review.staffReply ?? '');
    setFormError('');
    setNotice('');
  };

  const submitReply = (event: FormEvent<HTMLFormElement>) => {
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
          <p>Xem góp ý, phản hồi dưới tên ThunderFood và ẩn nội dung vi phạm.</p>
        </div>
        {pagination && <span className="muted">{pagination.totalElements} đánh giá</span>}
      </div>

      {notice && <div className="card card-p" role="status" style={{ marginBottom: 16, color: 'var(--c-green)' }}>{notice}</div>}
      {visibilityMutation.isError && <div className="card card-p" role="alert" style={{ marginBottom: 16, color: 'var(--c-red)' }}>{errorMessage(visibilityMutation.error)}</div>}

      {reviewsQuery.isLoading ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}><Loader2 size={24} className="animate-spin" /><p className="muted">Đang tải đánh giá…</p></div>
      ) : reviewsQuery.isError ? (
        <div className="empty card" role="alert" style={{ padding: 40, textAlign: 'center' }}>
          <AlertCircle size={28} style={{ color: 'var(--c-red)' }} />
          <h3>Không tải được đánh giá</h3>
          <p className="muted">{errorMessage(reviewsQuery.error)}</p>
          <button className="btn btn-soft btn-sm" onClick={() => reviewsQuery.refetch()}>Thử lại</button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty card" style={{ padding: 40, textAlign: 'center' }}><MessageSquare size={30} className="muted" /><h3>Chưa có đánh giá nào</h3></div>
      ) : (
        <div className="stack" style={{ display: 'grid', gap: 14 }}>
          {reviews.map((review) => (
            <article
              key={review.id}
              className={`card rv-adm ${review.isHidden ? 'hidden-rv' : ''}`}
              style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr)', alignItems: 'start', gap: 16, padding: 18 }}
            >
              <div style={{ width: 56, flexShrink: 0, paddingTop: 2 }}>
                {review.userAvatar ? (
                  <img src={review.userAvatar} alt="" className="avatar" style={{ width: 48, height: 48, objectFit: 'cover' }} />
                ) : (
                  <div className="tile xs" style={{ borderRadius: 16, '--tint': 'var(--volt)' } as CSSProperties}>{(review.userName || 'K').slice(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', columnGap: 16, rowGap: 10 }}>
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
                <div className="faint" style={{ fontSize: 12, marginTop: 7 }}>Mã đơn #{review.orderId}</div>
                <p style={{ margin: '14px 0 10px', color: review.isHidden ? 'var(--ink-3)' : 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{review.comment || 'Khách không để lại nhận xét.'}</p>
                {review.imageUrl && <a href={review.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }} className="tlink"><Image size={15} /> Xem ảnh khách gửi</a>}
                {review.isHidden && <div><span className="pill s-CANCELLED nodot" style={{ margin: '10px 0 0' }}>Đang ẩn khỏi cửa hàng</span></div>}
                {review.staffReply && (
                  <div className="reply" style={{ marginTop: 16, padding: 14, background: 'var(--surface-2)', borderRadius: 12 }}>
                  <b style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <Bolt size={15} /> ThunderFood phản hồi
                    {review.repliedByStaffName && <span className="faint" style={{ fontWeight: 400 }}>· Nhân viên: {review.repliedByStaffName}</span>}
                    {review.repliedAt && <span className="faint" style={{ fontWeight: 400 }}>· {formatDate(review.repliedAt)}</span>}
                  </b>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, marginTop: 6 }}>{review.staffReply}</div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', marginTop: 14, gap: 8 }}>
                  <button className="btn btn-soft btn-sm" onClick={() => openReply(review)}><MessageSquare size={16} /> {review.staffReply ? 'Sửa phản hồi' : 'Phản hồi'}</button>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={visibilityMutation.isPending}
                    onClick={() => visibilityMutation.mutate({ reviewId: review.id, isHidden: !review.isHidden })}
                  >
                    {visibilityMutation.isPending && visibilityMutation.variables?.reviewId === review.id
                      ? <Loader2 size={15} className="animate-spin" />
                      : review.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                    {review.isHidden ? 'Hiện lại' : 'Ẩn đánh giá'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '16px 4px', gap: 12 }}>
          <span className="muted" style={{ fontSize: 13 }}>Trang {pagination.page + 1} / {pagination.totalPages} · {pagination.totalElements} đánh giá</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasPrevious || reviewsQuery.isFetching} onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /> Trang trước</button>
            <button className="btn btn-soft btn-sm" disabled={!pagination.hasNext || reviewsQuery.isFetching} onClick={() => setPage((value) => value + 1)}>Trang sau <ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {selectedReview && (
        <div className="dlg-overlay" onClick={() => !replyMutation.isPending && setSelectedReview(null)}>
          <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="admin-review-reply-title" onClick={(event) => event.stopPropagation()}>
            <div className="dlg-h"><h3 id="admin-review-reply-title">{selectedReview.staffReply ? 'Sửa phản hồi' : 'Phản hồi đánh giá'}</h3><button className="ibtn" disabled={replyMutation.isPending} onClick={() => setSelectedReview(null)} aria-label="Đóng"><X size={20} /></button></div>
            <div className="dlg-body">
              <blockquote style={{ margin: '0 0 16px', padding: '14px 16px', borderRadius: 14, background: 'var(--surface-2)' }}>
                <b>{selectedReview.userName || 'Khách hàng'}</b>
                <div aria-label={`${selectedReview.rating} trên 5 sao`} style={{ display: 'inline-flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: 2, marginTop: 4 }}>{renderStars(selectedReview.rating)}</div>
                <div className="muted" style={{ marginTop: 4 }}>{selectedReview.comment || 'Không có nhận xét.'}</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>{selectedReview.productName} · Đơn #{selectedReview.orderId}</div>
              </blockquote>
              <form id="admin-review-reply-form" onSubmit={submitReply}>
                <label className="field"><span>Nội dung phản hồi</span><textarea className="textarea" placeholder="Cảm ơn bạn đã góp ý…" value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={1000} autoFocus disabled={replyMutation.isPending} /></label>
                <div className="row between" style={{ marginTop: 6 }}><span className="faint" style={{ fontSize: 12 }}>Khách sẽ thấy phản hồi dưới tên ThunderFood.</span><span className="faint" style={{ fontSize: 12 }}>{replyText.length}/1000</span></div>
                {formError && <p role="alert" style={{ color: 'var(--c-red)', fontSize: 13, marginTop: 10 }}>{formError}</p>}
              </form>
            </div>
            <div className="dlg-f row" style={{ justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn btn-ghost" disabled={replyMutation.isPending} onClick={() => setSelectedReview(null)}>Hủy</button>
              <button className="btn btn-primary" type="submit" form="admin-review-reply-form" disabled={replyMutation.isPending || !replyText.trim()}>{replyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Gửi phản hồi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
