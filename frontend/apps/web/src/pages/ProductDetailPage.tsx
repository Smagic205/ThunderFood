import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, Minus, Plus, Truck, Flame, Bolt, Loader2, MessageSquareText, AlertCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '@/shared/api/categoryApi';
import { productApi } from '@/shared/api/productApi';
import { reviewApi } from '@/shared/api/reviewApi';
import { wishlistApi } from '@/shared/api/wishlistApi';
import { mockProducts } from '@/shared/api/mockData';
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
  } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: () => productApi.getProductBySlug(slug!),
    enabled: !!slug,
    retry: 1,
  });

  // Fallback sang mockProduct nếu database chưa có món này
  const mockProduct = useMemo(() => {
    if (!slug) return undefined;
    return mockProducts.find((p) => p.slug === slug || String(p.id) === slug);
  }, [slug]);

  const product = apiProduct || mockProduct;

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
    if (apiProduct?.images && apiProduct.images.length > 0) {
      return apiProduct.images.map((img) => img.url);
    }
    if (mockProduct?.images && mockProduct.images.length > 0) {
      return mockProduct.images;
    }
    return [mockProduct?.imageUrl || 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png'];
  }, [apiProduct, mockProduct]);

  const [selectedImage, setSelectedImage] = useState<string>(imagesList[0] || '');

  // Cập nhật selected image khi món thay đổi
  useEffect(() => {
    if (imagesList.length > 0) {
      setSelectedImage(imagesList[0]);
    }
  }, [imagesList]);

  useEffect(() => {
    setReviewPage(0);
  }, [apiProduct?.id]);

  const resolvedCategoryId = apiProduct?.category?.id || mockProduct?.categoryId;

  // 3. Lấy sản phẩm liên quan từ API
  const { data: relatedProductsPage } = useQuery({
    queryKey: ['related-products', resolvedCategoryId],
    queryFn: () => productApi.getProducts({ categoryId: resolvedCategoryId, size: 5 }),
    enabled: !!resolvedCategoryId,
  });

  if (isProductPending && !mockProduct) {
    return (
      <div className="container page center py-24 text-center">
        <h2 className="text-xl font-bold text-[var(--ink)]">Đang tải thông tin món ăn...</h2>
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

  const categoryName = apiProduct?.category?.name || categories.find((c) => c.id === mockProduct?.categoryId)?.name;
  const categoryId = apiProduct?.category?.id || mockProduct?.categoryId;

  // Xử lý danh sách món liên quan (ưu tiên backend)
  const relatedProducts = relatedProductsPage?.content && relatedProductsPage.content.length > 0
    ? relatedProductsPage.content.filter((p) => p.id !== product.id).slice(0, 4)
    : mockProducts
      .filter((p) => p.categoryId === resolvedCategoryId && p.id !== product.id)
      .slice(0, 4)
      .map((p) => ({
        ...p,
        categoryName: categories.find((c) => c.id === p.categoryId)?.name,
      }));

  const reviews = reviewsQuery.data?.content ?? [];

  const avgRating = apiProduct?.ratingAverage ?? 0;
  const reviewCount = reviewsQuery.data?.pagination.totalElements ?? apiProduct?.reviewCount ?? 0;
  const isFavorite = wishlistQuery.data?.some((item) => item.productId === product.id) ?? apiProduct?.isFavorite ?? false;
  const soldCount = apiProduct?.soldCount ?? mockProduct?.soldCount ?? 0;

  const isOut = apiProduct
    ? apiProduct.stockStatus?.code === 'OUT_OF_STOCK'
    : !mockProduct?.isAvailable || (mockProduct?.stockQuantity ?? 0) <= 0;
  const isLow = !apiProduct && !isOut && (mockProduct?.stockQuantity ?? 0) <= 5;

  const off = apiProduct
    ? (apiProduct.originalPrice && apiProduct.originalPrice > apiProduct.price
      ? Math.round((1 - apiProduct.price / apiProduct.originalPrice) * 100)
      : 0)
    : (mockProduct?.discountPrice
      ? Math.round((1 - mockProduct.discountPrice / mockProduct.price) * 100)
      : 0);

  const originalPriceDisplay = apiProduct?.originalPrice || (mockProduct?.discountPrice ? mockProduct.price : null);
  const currentPriceDisplay = product.price;

  const handleQuantity = (delta: number) => {
    setQuantity((q) => Math.max(1, Math.min(20, q + delta)));
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để thêm món vào giỏ hàng', 'info');
      navigate('/login');
      return;
    }
    if (!product) return;

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
                <img src={selectedImage} alt={product.name} className="photo object-contain p-8" />
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
                    <img src={img} alt="" className="photo object-contain p-2" />
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
              {apiProduct?.badges && apiProduct.badges.length > 0 ? (
                apiProduct.badges.map((b, i) => (
                  <span key={i} className="tag gold">{b}</span>
                ))
              ) : (
                (product as any).isBestSeller && <span className="tag gold">Bán chạy</span>
              )}
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
                Đã bán {apiProduct?.soldCountDisplay || soldCount.toLocaleString('vi-VN')}
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
              ) : isLow ? (
                <span className="pill s-PENDING">Sắp hết hàng</span>
              ) : (
                <span className="pill s-COMPLETED">Còn hàng</span>
              )}
            </div>

            <div className="row wrap" style={{ marginTop: '24px', gap: '12px' }}>
              <div className="stepper lg" role="group" aria-label="Số lượng" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1.5px solid var(--line)', borderRadius: '999px', height: '54px', padding: '0 8px' }}>
                <button onClick={() => handleQuantity(-1)} aria-label="Giảm" className="ibtn" style={{ width: '38px', height: '38px' }}><Minus size={18} /></button>
                <output style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{quantity}</output>
                <button onClick={() => handleQuantity(1)} aria-label="Tăng" className="ibtn" style={{ width: '38px', height: '38px' }}><Plus size={18} /></button>
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

            <div className="perks">
              <div className="perk">
                <Truck size={22} className="ic" />
                <span>
                  Giao khoảng {apiProduct?.delivery?.estimateMinutes || 30} phút<br />
                  <span className="faint">Miễn phí từ {(apiProduct?.delivery?.freeShipThreshold || 200000).toLocaleString('vi-VN')}đ</span>
                </span>
              </div>
              <div className="perk">
                <Flame size={22} className="ic" />
                <span>
                  {apiProduct?.highlights?.[0] || 'Nấu tươi khi có đơn'}<br />
                  <span className="faint">{apiProduct?.highlights?.[1] || 'Đóng gói giữ nhiệt'}</span>
                </span>
              </div>
            </div>
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
                <p className="muted" style={{ maxWidth: '60ch' }}>
                  {product.description || 'Nguyên liệu được nhập mỗi sáng và chế biến trong ngày, không dùng phụ gia bảo quản.'}
                </p>
              </div>
              <dl className="kv card card-p" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px' }}>
                <dt className="muted" style={{ fontWeight: 600 }}>Giao chỉ trong</dt>
                <dd>{apiProduct?.details?.prepTime || '30 - 40 phút'}</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>Nên dùng trong</dt>
                <dd>{apiProduct?.details?.consumeWithin || '60 phút sau khi nhận'}</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>Nhà bếp</dt>
                <dd>{'120 Yên Lãng, Đống Đa, Hà Nội'}</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>CẢNH BÁO</dt>
                <dd>{'Người bị bệnh đẹp trai/xinh gái ăn nhiều sẽ làm bệnh thêm trầm trọng'}</dd>
              </dl>
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
                          {r.userAvatar ? <img src={r.userAvatar} alt={r.userName} className="w-full h-full object-cover" /> : r.userName?.split(' ').pop()?.charAt(0) || 'K'}
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
                            <img src={r.imageUrl} alt="" className="photo object-cover" />
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
