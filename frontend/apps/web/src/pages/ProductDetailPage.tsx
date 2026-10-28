import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, Minus, Plus, Truck, Flame, Bolt, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/shared/api/categoryApi';
import { productApi } from '@/shared/api/productApi';
import { mockProducts, mockReviews } from '@/shared/api/mockData';
import { ProductCard } from '@/shared/components/ui/ProductCard';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

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
  const [rating, setRating] = useState(0); // for the review form

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

  const reviews = mockReviews.filter((r) => r.productId === product.id);

  const avgRating = apiProduct?.ratingAverage ?? mockProduct?.avgRating ?? 0;
  const reviewCount = apiProduct?.reviewCount ?? mockProduct?.reviewCount ?? 0;
  const soldCount = apiProduct?.soldCount ?? mockProduct?.soldCount ?? 0;

  // Calculate review distribution based on average rating
  const dist = avgRating >= 4.8
    ? [0.82, 0.13, 0.03, 0.01, 0.01]
    : avgRating >= 4.6
      ? [0.68, 0.21, 0.07, 0.02, 0.02]
      : [0.55, 0.25, 0.11, 0.05, 0.04];

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
              <button className="btn btn-primary btn-lg grow" disabled={isOut}>
                <ShoppingBag size={20} className="ic" /> Thêm vào giỏ
              </button>
              <button className="btn btn-ghost btn-lg hide-sm" disabled={isOut}>Mua ngay</button>
              <button className="ibtn heart-inline heart" style={{ position: 'static', border: '1.5px solid var(--line)', width: '54px', height: '54px' }} aria-label="Yêu thích">
                <Heart size={22} className={apiProduct?.isFavorite ? "ic fill-[#e13636] text-[#e13636]" : "ic"} />
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
              <div className="card rate-sum">
                <div className="rate-big">
                  <b>{avgRating.toFixed(1)}</b>
                  <div className="stars" style={{ margin: '8px 0 4px', justifyContent: 'center' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className={i < Math.round(avgRating) ? 'ic' : 'ic off'} />
                    ))}
                  </div>
                  <span className="muted">{reviewCount} đánh giá</span>
                </div>
                <div className="bars">
                  {dist.map((v, i) => (
                    <div className="bar-row" key={i}>
                      <span>{5 - i} sao</span>
                      <div className="bar"><i style={{ width: `${Math.round(v * 100)}%` }}></i></div>
                      <span>{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid2" style={{ alignItems: 'start', gap: '32px' }}>
                <div>
                  {reviews.length ? reviews.map(r => (
                    <article className="review" key={r.id}>
                      <div className="row" style={{ gap: '12px' }}>
                        <span className="avatar sm">{r.userName.split(' ').pop()?.charAt(0) || r.userName.charAt(0)}</span>
                        <div className="grow">
                          <b>{r.userName}</b>
                          <div className="faint" style={{ fontSize: '13px' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <span className="stars" style={{ gap: '1px' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={15} className={i < r.rating ? 'ic' : 'ic off'} />
                          ))}
                        </span>
                      </div>
                      <p style={{ marginTop: '10px' }}>{r.comment}</p>
                      {r.imageUrl && (
                        <div className="prev" style={{ marginTop: '10px', width: '96px', height: '96px' }}>
                          <div className="tile xs" style={{ background: 'var(--surface)' }}>
                            <img src={r.imageUrl} alt="" className="photo object-cover" />
                          </div>
                        </div>
                      )}
                      {r.adminReply && (
                        <div className="reply">
                          <b><Bolt size={15} className="ic" style={{ color: 'var(--volt)' }} /> ThunderFood phản hồi</b>
                          {r.adminReply}
                        </div>
                      )}
                    </article>
                  )) : (
                    <div className="empty">
                      <h3>Chưa có đánh giá</h3>
                      <p>Hãy là người đầu tiên chia sẻ cảm nhận về món này.</p>
                    </div>
                  )}
                </div>
                <div className="card card-p">
                  <h3 style={{ marginBottom: '14px' }}>Viết đánh giá</h3>
                  <form className="form-grid">
                    <div>
                      <span className="lbl">Bạn chấm mấy sao?</span>
                      <div className="star-pick" role="radiogroup" aria-label="Số sao">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button
                            type="button"
                            key={i}
                            role="radio"
                            aria-checked={rating >= i}
                            className={rating >= i ? 'on' : ''}
                            onClick={() => setRating(i)}
                            aria-label={`${i} sao`}
                          >
                            <Star size={26} className="ic" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="field">
                      <span>Nhận xét</span>
                      <textarea className="textarea" placeholder="Món ăn thế nào, giao hàng ra sao…" required></textarea>
                    </label>
                    <div>
                      <span className="lbl">Ảnh món ăn (không bắt buộc)</span>
                      <div className="uploader">
                        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                          <ImageIcon size={18} className="ic" /> Chọn ảnh
                          <input type="file" accept="image/*" style={{ display: 'none' }} />
                        </label>
                        <span className="faint" style={{ fontSize: '13px' }}>Chưa chọn ảnh</span>
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary w-full">Gửi đánh giá</button>
                  </form>
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
