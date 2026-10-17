import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, Minus, Plus, Truck, Flame, Bolt, Image as ImageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '@/shared/api/categoryApi';
import { mockProducts, mockReviews } from '@/shared/api/mockData';
import { ProductCard } from '@/shared/components/ui/ProductCard';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: categories = [] } = useQuery({
    queryKey: ['active-categories'],
    queryFn: categoryApi.getActiveCategories,
  });
  const product = useMemo(() => mockProducts.find((p) => p.id === Number(id)), [id]);
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'rv'>('desc');
  const [selectedImage, setSelectedImage] = useState(product?.imageUrl);
  const [rating, setRating] = useState(0); // for the review form
  
  // Update selected image when product changes
  useEffect(() => {
    if (product) setSelectedImage(product.imageUrl);
  }, [product]);
  
  if (!product) {
    return (
      <div className="container page center">
        <h1 style={{ marginBottom: '16px' }}>Sản phẩm không tồn tại</h1>
        <Link to="/menu" className="btn btn-primary">Về thực đơn</Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const relatedProducts = mockProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4)
    .map((relatedProduct) => ({
      ...relatedProduct,
      categoryName: categories.find((c) => c.id === relatedProduct.categoryId)?.name,
    }));
  const reviews = mockReviews.filter((r) => r.productId === product.id);
  
  // Calculate review distribution based on average rating (mock logic matching HTML)
  const dist = product.avgRating && product.avgRating >= 4.8 
    ? [0.82, 0.13, 0.03, 0.01, 0.01] 
    : product.avgRating && product.avgRating >= 4.6 
    ? [0.68, 0.21, 0.07, 0.02, 0.02] 
    : [0.55, 0.25, 0.11, 0.05, 0.04];
  
  const isOut = !product.isAvailable || (product.stockQuantity ?? 0) <= 0;
  const isLow = !isOut && (product.stockQuantity ?? 0) <= 5;
  const off = product.discountPrice ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  
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
          {category && (
            <>
              <Link to={`/menu?cat=${category.id}`}>{category.name}</Link>
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
              {(product.images || [product.imageUrl]).map((img, i) => (
                <button 
                  key={i} 
                  className={`thumb ${selectedImage === img ? 'on' : ''}`} 
                  onClick={() => setSelectedImage(img)}
                  aria-label={`Xem ảnh ${i+1}`}
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
              {category && <Link className="tag" to={`/menu?cat=${category.id}`}>{category.name}</Link>}
              {product.isBestSeller && <span className="tag gold">Bán chạy</span>}
            </div>
            <h1>{product.name}</h1>
            <div className="row wrap" style={{ gap: '14px' }}>
              <span className="row" style={{ gap: '8px' }}>
                <span className="stars" style={{ gap: '2px' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} className={i < Math.round(product.avgRating || 0) ? 'ic' : 'ic off'} />
                  ))}
                </span>
                <b>{product.avgRating?.toFixed(1) || '0.0'}</b>
              </span>
              <button className="tlink" onClick={() => { setActiveTab('rv'); document.getElementById('pd-tabs')?.scrollIntoView({ behavior: 'smooth' }); }}>
                {product.reviewCount || 0} đánh giá
              </button>
              <span className="muted">Đã bán {product.soldCount?.toLocaleString('vi-VN')}</span>
            </div>
            
            <div className="pd-price">
              <b>{(product.discountPrice || product.price).toLocaleString('vi-VN')}đ</b>
              {product.discountPrice && (
                <>
                  <s>{product.price.toLocaleString('vi-VN')}đ</s>
                  <span className="tag gold">Tiết kiệm {(product.price - product.discountPrice).toLocaleString('vi-VN')}đ</span>
                </>
              )}
            </div>
            
            <p className="muted" style={{ maxWidth: '56ch' }}>{product.description}</p>
            
            <div className="row" style={{ marginTop: '18px', gap: '8px' }}>
              {isOut ? (
                <span className="pill s-CANCELLED">Tạm hết hàng</span>
              ) : isLow ? (
                <span className="pill s-PENDING">Sắp hết, còn {product.stockQuantity} phần</span>
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
                <Heart size={22} className="ic" />
              </button>
            </div>
            
            <div className="perks">
              <div className="perk">
                <Truck size={22} className="ic" />
                <span>
                  Giao khoảng 30 phút<br />
                  <span className="faint">Miễn phí từ 200.000đ</span>
                </span>
              </div>
              <div className="perk">
                <Flame size={22} className="ic" />
                <span>
                  Nấu tươi khi có đơn<br />
                  <span className="faint">Đóng gói giữ nhiệt</span>
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
              Đánh giá<span className="n">{product.reviewCount || 0}</span>
            </button>
          </div>
          
          {activeTab === 'desc' ? (
            <div className="grid2" style={{ alignItems: 'start' }}>
              <div>
                <h3 style={{ marginBottom: '12px' }}>Về món này</h3>
                <p className="muted" style={{ maxWidth: '60ch' }}>
                  {product.description} Nguyên liệu được nhập mỗi sáng và chế biến trong ngày, không dùng phụ gia bảo quản.
                </p>
              </div>
              <dl className="kv card card-p" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px' }}>
                <dt className="muted" style={{ fontWeight: 600 }}>Thời gian chuẩn bị</dt><dd>10 đến 15 phút</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>Nên dùng trong</dt><dd>60 phút sau khi nhận</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>Nhà bếp</dt><dd>86 Hàng Bài, Hoàn Kiếm</dd>
                <dt className="muted" style={{ fontWeight: 600 }}>Dị ứng</dt><dd>Có thể chứa gluten, sữa, trứng</dd>
              </dl>
            </div>
          ) : (
            <>
              <div className="card rate-sum">
                <div className="rate-big">
                  <b>{product.avgRating?.toFixed(1) || '0.0'}</b>
                  <div className="stars" style={{ margin: '8px 0 4px', justifyContent: 'center' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className={i < Math.round(product.avgRating || 0) ? 'ic' : 'ic off'} />
                    ))}
                  </div>
                  <span className="muted">{product.reviewCount || 0} đánh giá</span>
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
