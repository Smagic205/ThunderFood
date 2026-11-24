import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, Minus, Plus, Truck, Flame, Bolt, Loader2, MessageSquareText, AlertCircle, Utensils } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/shared/api/categoryApi';
import { productApi } from '@/shared/api/productApi';
import { reviewApi } from '@/shared/api/reviewApi';
import { wishlistApi } from '@/shared/api/wishlistApi';
import { ProductCard } from '@/shared/components/ui/ProductCard';
import { useAuthStore } from '@/app/store/authStore';
import { useCartStore } from '@/shared/stores/cartStore';
import { useToastStore } from '@/shared/stores/toastStore';
import { useMyWishlist } from '@/shared/hooks/useMyWishlist';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const { showToast } = useToastStore();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);

  // 1. Lấy danh mục
  const { data: categories = [] } = useQuery({
    queryKey: ['active-categories'],
    queryFn: categoryApi.getActiveCategories,
  });

  // 2. Lấy chi tiết món ăn từ backend API theo slug
  const {
    data: apiProduct,
    isPending: isProductPending,
    isError: isProductError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: () => productApi.getProductBySlug(slug!),
    enabled: !!slug,
    retry: 1,
  });

  const product = apiProduct;

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'rv'>('desc');
  const wishlistQuery = useMyWishlist();
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', apiProduct?.id, reviewPage],
    queryFn: () => reviewApi.getProductReviews(apiProduct!.id, reviewPage, 10),
    enabled: Boolean(apiProduct?.id),
    staleTime: 60_000,
  });

  // Lấy danh sách ảnh
  const imagesList = useMemo(() => {
    return apiProduct?.images?.map((img) => img.url).filter(Boolean) ?? [];
  }, [apiProduct]);

  const [selectedImage, setSelectedImage] = useState<string>(imagesList[0] || '');

  // Cập nhật selected image khi món thay đổi
  useEffect(() => {
    setSelectedImage(imagesList[0] ?? '');
  }, [imagesList]);

  useEffect(() => {
    setReviewPage(0);
  }, [apiProduct?.id]);

  const resolvedCategoryId = apiProduct?.category?.id;

  // 3. Lấy sản phẩm liên quan từ API
  const { data: relatedProductsPage } = useQuery({
    queryKey: ['related-products', resolvedCategoryId],
    queryFn: () => productApi.getProducts({ categoryId: resolvedCategoryId, size: 5 }),
    enabled: !!resolvedCategoryId,
  });

  if (isProductPending) {
    return (
      <div className="container page center py-24 text-center">
        <h2 className="text-xl font-bold text-[var(--ink)]">Đang tải thông tin món ăn...</h2>
      </div>
    );
  }

  if (isProductError) {
    return (
      <div className="container page center text-center" role="alert">
        <h1 style={{ marginBottom: '16px' }}>Không thể tải thông tin món ăn</h1>
        <button type="button" className="btn btn-primary" onClick={() => refetchProduct()}>Thử lại</button>
        <Link to="/menu" className="btn btn-ghost" style={{ marginLeft: '8px' }}>Về thực đơn</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page center">
        <h1 style={{ marginBottom: '16px' }}>Sản phẩm không tồn tại</h1>
        <Link to="/menu" className="btn btn-primary">Về thực đơn</Link>
      </div>
    );
  }

  const categoryName = product.category?.name || categories.find((c) => c.id === product.category?.id)?.name;
  const categoryId = product.category?.id;

  const relatedProducts = relatedProductsPage?.content
    .filter((p) => p.id !== product.id)
    .slice(0, 4) ?? [];

  const reviews = reviewsQuery.data?.content ?? [];

  const avgRating = product.ratingAverage ?? 0;
  const reviewCount = reviewsQuery.data?.pagination.totalElements ?? product.reviewCount ?? 0;
  const isFavorite = wishlistQuery.data?.some((item) => item.productId === product.id) ?? product.isFavorite ?? false;
  const soldCount = product.soldCount ?? 0;
  const isOut = product.stockStatus?.code === 'OUT_OF_STOCK' || product.canPurchase === false;
  const off = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const originalPriceDisplay = product.originalPrice ?? null;
  const currentPriceDisplay = product.price;

  const MAX_QUANTITY_PER_ITEM = 20;
  const availableStock = product?.stockQuantity ?? MAX_QUANTITY_PER_ITEM;
  const maxAllowed = Math.min(MAX_QUANTITY_PER_ITEM, availableStock > 0 ? availableStock : MAX_QUANTITY_PER_ITEM);

  const handleQuantity = (delta: number) => {
    setQuantity((q) => {
      const next = q + delta;
      if (next > maxAllowed) {
        showToast(`Số lượng tối đa cho mỗi món là ${maxAllowed}`, 'info');
        return maxAllowed;
      }
      return Math.max(1, Math.min(maxAllowed, next));
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm món vào giỏ hàng', 'info');
      navigate('/login');
      return;
    }
    if (!product) return;

    const cart = useCartStore.getState().cart;
    const currentInCart = cart?.items?.find((i) => i.productId === product.id)?.quantity || 0;
    if (currentInCart + quantity > maxAllowed) {
      showToast(`Số lượng món “${product.name}” trong giỏ sẽ vượt quá giới hạn tối đa (${maxAllowed} món). Bạn đã có ${currentInCart} món trong giỏ.`, 'error');
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(product.id, quantity);
      showToast(`Đã thêm ${quantity} “${product.name}” vào giỏ hàng!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể thêm vào giỏ hàng', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để đặt món', 'info');
      navigate('/login');
      return;
    }
    if (!product) return;

    const cart = useCartStore.getState().cart;
    const currentInCart = cart?.items?.find((i) => i.productId === product.id)?.quantity || 0;
    if (currentInCart + quantity > maxAllowed) {
      showToast(`Số lượng món “${product.name}” trong giỏ sẽ vượt quá giới hạn tối đa (${maxAllowed} món). Bạn đã có ${currentInCart} món trong giỏ.`, 'error');
      navigate('/cart');
      return;
    }

    try {
      setIsAdding(true);
      await addToCart(product.id, quantity);
      navigate('/cart');
    } catch (err: any) {
      showToast(err?.message || 'Không thể đặt món lúc này', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để lưu món yêu thích', 'info');
      navigate('/login');
      return;
    }

    try {
      setIsTogglingFavorite(true);
      const result = await wishlistApi.toggle(product.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-wishlist', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['product-detail', slug] }),
      ]);
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Không thể cập nhật món yêu thích', 'error');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <>
      <div className="container page">
        <nav className="crumbs" aria-label="Đường dẫn">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} className="ic" />
          <Link to="/menu">Thực đơn</Link>
          <ChevronRight size={14} className="ic" />
          {categoryName && (
            <>
              <Link to={categoryId ? `/menu?cat=${categoryId}` : '/menu'}>{categoryName}</Link>
              <ChevronRight size={14} className="ic" />
            </>
          )}
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd">
          <div className="gal">
            <div className="gal-main" id="gal-main">
              <div className="tile" style={{ background: 'var(--surface)' }}>
                {off > 0 && (
                  <span className="badge-off" style={{ position: 'absolute', left: '16px', top: '16px', background: '#E13636', color: 'white', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', zIndex: 10 }}>
                    -{off}%
                  </span>
                )}
                {selectedImage ? (
                  <img src={selectedImage} alt={product.name} className="photo object-contain p-8" />
                ) : (
                  <div className="photo grid place-items-center text-[var(--ink-3)]" aria-label={`Chưa có ảnh cho ${product.name}`}>
                    <Utensils size={64} strokeWidth={1.2} />
                  </div>
                )}
              </div>
            </div>
            <div className="thumbs" role="group" aria-label="Ảnh món">
              {imagesList.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${selectedImage === img ? 'on' : ''}`}
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Xem ảnh ${i + 1}`}
                >
                  <div className="tile xs" style={{ background: 'var(--surface)' }}>
                    <img src={img} alt="" loading="lazy" decoding="async" className="photo object-contain p-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="row wrap" style={{ gap: '8px' }}>
              {categoryName && (
                <Link className="tag" to={categoryId ? `/menu?cat=${categoryId}` : '/menu'}>
                  {categoryName}
                </Link>
              )}
              {product.badges?.map((b, i) => (
                  <span key={i} className="tag gold">{b}</span>
                ))}
            </div>
            <h1>{product.name}</h1>
            <div className="row wrap" style={{ gap: '14px' }}>
              <span className="row" style={{ gap: '8px' }}>
                <span className="stars" style={{ gap: '2px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className={i < Math.round(avgRating) ? 'ic' : 'ic off'} />
                  ))}
                </span>
                <b>{avgRating.toFixed(1)}</b>
              </span>
              <button className="tlink" onClick={() => { setActiveTab('rv'); document.getElementById('pd-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                {reviewCount} đánh giá
              </button>
              <span className="muted">
                Đã bán {product.soldCountDisplay || soldCount.toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="pd-price">
              <b>{currentPriceDisplay.toLocaleString('vi-VN')}đ</b>
              {originalPriceDisplay && originalPriceDisplay > currentPriceDisplay && (
                <>
                  <s>{originalPriceDisplay.toLocaleString('vi-VN')}đ</s>
                  <span className="tag gold">Tiết kiệm {(originalPriceDisplay - currentPriceDisplay).toLocaleString('vi-VN')}đ</span>
                </>
              )}
            </div>

            <p className="muted" style={{ maxWidth: '56ch' }}>{product.description}</p>

            <div className="row" style={{ marginTop: '18px', gap: '8px' }}>
              {isOut ? (
                <span className="pill s-CANCELLED">Tạm hết hàng</span>
              ) : product.stockStatus?.label ? (
                <span className="pill s-COMPLETED">{product.stockStatus.label}</span>
              ) : null}
            </div>

            <div className="row wrap" style={{ marginTop: '24px', gap: '12px' }}>
              <div className="stepper lg" role="group" aria-label="Số lượng" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--line)', borderRadius: '999px', height: '54px', padding: '0 8px' }}>
                <button onClick={() => handleQuantity(-1)} aria-label="Giảm" className="ibtn" style={{ width: '38px', height: '38px' }}><Minus size={18} /></button>
                <output style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{quantity}</output>
                <button 
                  onClick={() => handleQuantity(1)} 
                  aria-label="Tăng" 
                  className="ibtn" 
                  disabled={quantity >= maxAllowed}
                  style={{ width: '38px', height: '38px', opacity: quantity >= maxAllowed ? 0.35 : 1, cursor: quantity >= maxAllowed ? 'not-allowed' : 'pointer' }}
                >
                  <Plus size={18} />
                </button>
              </div>
              <button 
                className="btn btn-primary btn-lg grow" 
                disabled={isOut || isAdding}
                onClick={handleAddToCart}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isAdding ? <Loader2 size={20} className="animate-spin" /> : <ShoppingBag size={20} className="ic" />}
                <span>{isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}</span>
              </button>
              <button 
                className="btn btn-ghost btn-lg hide-sm" 
                disabled={isOut || isAdding}
                onClick={handleBuyNow}
              >
                Mua ngay
              </button>
              <button
                type="button"
                className="ibtn heart-inline heart"
                style={{ position: 'static', border: '1.5px solid var(--line)', width: '54px', height: '54px' }}
                aria-label={isFavorite ? 'Xóa khỏi món yêu thích' : 'Thêm vào món yêu thích'}
                aria-pressed={isFavorite}
                disabled={isTogglingFavorite}
                onClick={handleToggleFavorite}
              >
                <Heart size={22} className={isFavorite ? "ic fill-[#e13636] text-[#e13636]" : "ic"} />
              </button>
            </div>

            {(product.delivery || product.highlights?.length) && (
              <div className="perks">
                {product.delivery && (
                  <div className="perk">
                    <Truck size={22} className="ic" />
                    <span>
                      {product.delivery.estimateMinutes > 0 && <>Giao khoảng {product.delivery.estimateMinutes} phút<br /></>}
                      {product.delivery.freeShipThreshold > 0 && <span className="faint">Miễn phí từ {product.delivery.freeShipThreshold.toLocaleString('vi-VN')}đ</span>}
                    </span>
                  </div>
                )}
                {product.highlights && product.highlights.length > 0 && (
                  <div className="perk">
                    <Flame size={22} className="ic" />
                    <span>{product.highlights.map((highlight) => <span className="block" key={highlight}>{highlight}</span>)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="sec" id="pd-tabs" style={{ marginTop: '48px' }}>
          <div className="tabs" role="tablist">
            <button className={`tab ${activeTab === 'desc' ? 'on' : ''}`} role="tab" aria-selected={activeTab === 'desc'} onClick={() => setActiveTab('desc')}>
              Chi tiết món
            </button>
            <button className={`tab ${activeTab === 'rv' ? 'on' : ''}`} role="tab" aria-selected={activeTab === 'rv'} onClick={() => setActiveTab('rv')}>
              Đánh giá<span className="n">{reviewCount}</span>
            </button>
          </div>

          {activeTab === 'desc' ? (
            <div className="grid2" style={{ alignItems: 'start' }}>
              <div>
                <h3 style={{ marginBottom: '12px' }}>Về món này</h3>
                <p className="muted" style={{ maxWidth: '60ch' }}>{product.description || 'Chưa có mô tả cho món ăn này.'}</p>
              </div>
              {product.details && Object.values(product.details).some(Boolean) ? (
                <dl className="kv card card-p" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px' }}>
                  {product.details.prepTime && <><dt className="muted" style={{ fontWeight: 600 }}>Thời gian chuẩn bị</dt><dd>{product.details.prepTime}</dd></>}
                  {product.details.consumeWithin && <><dt className="muted" style={{ fontWeight: 600 }}>Thời gian sử dụng</dt><dd>{product.details.consumeWithin}</dd></>}
                  {product.details.kitchenAddress && <><dt className="muted" style={{ fontWeight: 600 }}>Nhà bếp</dt><dd>{product.details.kitchenAddress}</dd></>}
                  {product.details.allergens && <><dt className="muted" style={{ fontWeight: 600 }}>Chất gây dị ứng</dt><dd>{product.details.allergens}</dd></>}
                </dl>
              ) : (
                <p className="card card-p muted">Chưa có thông tin chi tiết cho món ăn này.</p>
              )}
            </div>
          ) : (
            <>
              <div className="card rate-sum" style={{ justifyContent: 'center' }}>
                <div className="rate-big">
                  <b>{avgRating.toFixed(1)}</b>
                  <div className="stars" style={{ margin: '8px 0 4px', justifyContent: 'center' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className={i < Math.round(avgRating) ? 'ic' : 'ic off'} />
                    ))}
                  </div>
                  <span className="muted">{reviewCount} đánh giá</span>
                </div>
              </div>

              <div className="grid2" style={{ alignItems: 'start', gap: '32px' }}>
                <div>
                  {reviewsQuery.isLoading ? (
                    <div className="card card-p muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" /> Đang tải đánh giá…
                    </div>
                  ) : reviewsQuery.isError ? (
                    <div className="card card-p" role="alert" style={{ color: 'var(--c-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} /> Không thể tải đánh giá lúc này.
                    </div>
                  ) : reviews.length ? reviews.map(r => (
                    <article className="review" key={r.id}>
                      <div className="row" style={{ gap: '12px' }}>
                        <span className="avatar sm overflow-hidden">
                          {r.userAvatar ? <img src={r.userAvatar} alt={r.userName} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : r.userName?.split(' ').pop()?.charAt(0) || 'K'}
                        </span>
                        <div className="grow">
                          <b>{r.userName || 'Khách hàng'}</b>
                          <div className="faint" style={{ fontSize: '13px' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <span className="stars" style={{ gap: '1px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={15} className={i < r.rating ? 'ic' : 'ic off'} />
                          ))}
                        </span>
                      </div>
                      {r.comment && <p style={{ marginTop: '10px' }}>{r.comment}</p>}
                      {r.imageUrl && (
                        <div className="prev" style={{ marginTop: '10px', width: '96px', height: '96px' }}>
                          <div className="tile xs" style={{ background: 'var(--surface)' }}>
                            <img src={r.imageUrl} alt="" loading="lazy" decoding="async" className="photo object-cover" />
                          </div>
                        </div>
                      )}
                      {r.staffReply && (
                        <div className="reply">
                          <b><Bolt size={15} className="ic" style={{ color: 'var(--volt)' }} /> ThunderFood phản hồi</b>
                          {r.staffReply}
                        </div>
                      )}
                    </article>
                  )) : (
                    <div className="empty">
                      <h3>Chưa có đánh giá</h3>
                      <p>Đánh giá từ khách đã nhận món sẽ xuất hiện tại đây.</p>
                    </div>
                  )}
                  {reviewsQuery.data && reviewsQuery.data.pagination.totalPages > 1 && (
                    <div className="row between" style={{ marginTop: '18px' }}>
                      <button className="btn btn-ghost btn-sm" disabled={!reviewsQuery.data.pagination.hasPrevious} onClick={() => setReviewPage((current) => Math.max(0, current - 1))}>Trang trước</button>
                      <span className="muted" style={{ fontSize: '13px' }}>Trang {reviewsQuery.data.pagination.page + 1}/{reviewsQuery.data.pagination.totalPages}</span>
                      <button className="btn btn-ghost btn-sm" disabled={!reviewsQuery.data.pagination.hasNext} onClick={() => setReviewPage((current) => current + 1)}>Trang sau</button>
                    </div>
                  )}
                </div>
                <div className="card card-p">
                  <MessageSquareText size={22} style={{ color: 'var(--c-amber)', marginBottom: '10px' }} />
                  <h3 style={{ marginBottom: '8px' }}>Đánh giá sau khi nhận món</h3>
                  <p className="muted" style={{ fontSize: '14px', marginBottom: '14px' }}>
                    Bạn có thể đánh giá từng món trong đơn sau khi đơn hàng được giao thành công.
                  </p>
                  <Link to={isAuthenticated ? '/account/orders' : '/login'} className="btn btn-primary btn-sm">
                    Xem đơn hàng
                  </Link>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="sec" style={{ marginTop: '64px' }}>
          <div className="sec-h" style={{ marginBottom: '24px' }}>
            <h2>Có thể bạn cũng thích</h2>
          </div>
          <div className="pgrid hs-mobile">
            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </>
  );
}
