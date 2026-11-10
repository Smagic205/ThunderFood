import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, Star, X } from 'lucide-react';
import { orderApi, type OrderItemResponse } from '@/shared/api/orderApi';
import { reviewApi } from '@/shared/api/reviewApi';
import { useToastStore } from '@/shared/stores/toastStore';
import { getReviewedProductIds, markOrderReviewed, saveReviewedProductIds } from './reviewProgress';

interface ReviewOrderModalProps {
  orderId: number;
  orderCode: string;
  userId: number;
  onClose: () => void;
  onOrderReviewed: (orderId: number) => void;
}

const getErrorMessage = (error: any) =>
  error?.response?.data?.message || error?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';

const uniqueOrderItems = (items: OrderItemResponse[]) => {
  const byProduct = new Map<number, OrderItemResponse>();
  items.forEach((item) => {
    const existing = byProduct.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
      existing.lineTotal += item.lineTotal;
    } else {
      byProduct.set(item.productId, { ...item });
    }
  });
  return [...byProduct.values()];
};

export const ReviewOrderModal = ({ orderId, orderCode, userId, onClose, onOrderReviewed }: ReviewOrderModalProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToastStore();
  const [reviewedProductIds, setReviewedProductIdsState] = useState<number[]>(() => getReviewedProductIds(userId, orderId));
  const [activeSubmissionId, setActiveSubmissionId] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState('');

  const orderQuery = useQuery({
    queryKey: ['order-for-review', orderId],
    queryFn: () => orderApi.getOrderDetail(orderId),
    staleTime: 30_000,
  });
  const items = useMemo(() => uniqueOrderItems(orderQuery.data?.items ?? []), [orderQuery.data?.items]);
  const reviewedSet = useMemo(() => new Set(reviewedProductIds), [reviewedProductIds]);
  const remainingItems = items.filter((item) => !reviewedSet.has(item.productId));

  useEffect(() => {
    if (orderQuery.data?.status !== 'DELIVERED' || items.length === 0) return;
    if (items.every((item) => reviewedSet.has(item.productId))) {
      markOrderReviewed(userId, orderId);
      onOrderReviewed(orderId);
    }
  }, [items, onOrderReviewed, orderId, orderQuery.data?.status, reviewedSet, userId]);

  const markProductReviewed = (productId: number) => {
    setReviewedProductIdsState((current) => {
      const next = [...new Set([...current, productId])];
      saveReviewedProductIds(userId, orderId, next);
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    queryClient.invalidateQueries({ queryKey: ['product-detail'] });
  };

  const handleReview = async (item: OrderItemResponse, rating: number, comment: string) => {
    if (activeSubmissionId !== null) return;
    setActiveSubmissionId(item.productId);
    setSubmissionError('');
    try {
      await reviewApi.createReview({
        orderId,
        productId: item.productId,
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      markProductReviewed(item.productId);
      showToast(`Đã gửi đánh giá cho ${item.productName}`, 'success');
    } catch (error: any) {
      const message = getErrorMessage(error);
      if (error?.response?.status === 409 || /đã đánh giá|đánh giá.*rồi/i.test(message)) {
        markProductReviewed(item.productId);
        showToast(`Món ${item.productName} đã được đánh giá trước đó`, 'info');
      } else {
        setSubmissionError(message);
      }
    } finally {
      setActiveSubmissionId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl bg-[var(--surface)] border border-[var(--line)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(event) => event.stopPropagation()}>
        <div className="p-4 md:p-5 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-[var(--ink)]">Đánh giá đơn #{orderCode}</h3>
            <p className="text-xs text-[var(--ink-3)]">Đánh giá riêng cho từng món trong đơn đã giao.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-3)]" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {orderQuery.isLoading ? (
            <div className="py-12 text-center text-[var(--ink-2)]">
              <Loader2 size={28} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
              Đang tải món trong đơn…
            </div>
          ) : orderQuery.isError ? (
            <div className="card card-p text-center" role="alert">
              <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
              <p>Không thể tải đơn hàng. Vui lòng đóng cửa sổ và thử lại.</p>
              <button className="btn btn-ghost btn-sm mt-3" onClick={() => orderQuery.refetch()}>Thử lại</button>
            </div>
          ) : orderQuery.data?.status !== 'DELIVERED' ? (
            <div className="card card-p text-center">
              <AlertCircle size={24} className="mx-auto mb-2 text-[var(--c-amber)]" />
              <p>Chỉ có thể đánh giá sau khi đơn được giao thành công.</p>
            </div>
          ) : remainingItems.length === 0 ? (
            <div className="empty card text-center py-10">
              <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-600" />
              <h3>Đã đánh giá hết các món trong đơn</h3>
              <p className="muted">Cảm ơn bạn đã chia sẻ cảm nhận.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--ink-2)]">Còn {remainingItems.length} món chưa đánh giá.</p>
              {submissionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">{submissionError}</div>
              )}
              {remainingItems.map((item) => (
                <ReviewItemForm
                  key={item.productId}
                  item={item}
                  isSubmitting={activeSubmissionId === item.productId}
                  isAnotherSubmitting={activeSubmissionId !== null && activeSubmissionId !== item.productId}
                  onSubmit={(rating, comment) => handleReview(item, rating, comment)}
                />
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-[var(--line)] bg-[var(--surface-2)] flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm">Đóng</button>
        </div>
      </div>
    </div>
  );
};

interface ReviewItemFormProps {
  item: OrderItemResponse;
  isSubmitting: boolean;
  isAnotherSubmitting: boolean;
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewItemForm = ({ item, isSubmitting, isAnotherSubmitting, onSubmit }: ReviewItemFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [validationError, setValidationError] = useState('');

  const submit = () => {
    if (rating < 1 || rating > 5) {
      setValidationError('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }
    setValidationError('');
    onSubmit(rating, comment);
  };

  return (
    <article className="card card-p">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)] overflow-hidden shrink-0 border border-[var(--line)]">
          {(item.imageUrl || item.thumbnailUrl) ? <img src={item.imageUrl || item.thumbnailUrl || ''} alt={item.productName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-[var(--ink-3)]">TF</div>}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-[var(--ink)] truncate">{item.productName}</h4>
          <p className="text-xs text-[var(--ink-3)]">Số lượng: {item.quantity}</p>
        </div>
      </div>

      <div className="mb-3">
        <span className="lbl text-xs">Bạn chấm món này mấy sao?</span>
        <div className="flex items-center gap-1 mt-1" role="radiogroup" aria-label={`Đánh giá ${item.productName}`}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} sao`}
              className="p-1"
              onClick={() => { setRating(value); setValidationError(''); }}
            >
              <Star size={24} className={rating >= value ? 'fill-[var(--volt)] text-[var(--volt)]' : 'text-[var(--ink-3)]'} />
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Nhận xét <small className="muted">(không bắt buộc)</small></span>
        <textarea
          className="textarea"
          rows={3}
          maxLength={1000}
          placeholder="Chia sẻ cảm nhận của bạn về món ăn…"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <small className="muted text-right">{comment.length}/1000</small>
      </label>

      {validationError && <p className="text-xs text-red-600 mt-2" role="alert">{validationError}</p>}
      <div className="flex justify-end mt-3">
        <button type="button" className="btn btn-primary btn-sm" disabled={isSubmitting || isAnotherSubmitting} onClick={submit}>
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          {isSubmitting ? 'Đang gửi…' : 'Gửi đánh giá món này'}
        </button>
      </div>
    </article>
  );
};
