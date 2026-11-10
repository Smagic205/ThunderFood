import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Heart, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { wishlistApi } from '@/shared/api/wishlistApi';
import { myWishlistQueryKey, useMyWishlist } from '@/shared/hooks/useMyWishlist';
import { useCartStore } from '@/shared/stores/cartStore';
import { useToastStore } from '@/shared/stores/toastStore';

const PAGE_SIZE = 12;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể tải danh sách món yêu thích.';

export const WishlistPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { showToast } = useToastStore();
  const wishlistQuery = useMyWishlist();
  const [page, setPage] = useState(0);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  const removeMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.remove(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myWishlistQueryKey(user?.id) });
      showToast('Đã xóa món khỏi danh sách yêu thích', 'success');
    },
    onError: (error: any) => showToast(error?.response?.data?.message || error?.message || 'Không thể xóa món yêu thích', 'error'),
  });

  const products = wishlistQuery.data ?? [];
  const pageCount = Math.ceil(products.length / PAGE_SIZE);
  const visibleProducts = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    if (pageCount > 0 && page >= pageCount) setPage(pageCount - 1);
  }, [page, pageCount]);

  const handleAddToCart = async (productId: number, productName: string) => {
    try {
      setAddingProductId(productId);
      await addToCart(productId, 1);
      showToast(`Đã thêm “${productName}” vào giỏ hàng`, 'success');
    } catch (error: any) {
      showToast(error?.message || 'Không thể thêm món vào giỏ hàng', 'error');
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <div>
      <div className="page-h" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 2.2vw, 2.2rem)' }}>Món yêu thích</h1>
          <p className="muted" style={{ fontSize: '14.5px', marginTop: 4 }}>
            Bạn đã lưu {products.length} món để xem lại sau.
          </p>
        </div>
      </div>

      {wishlistQuery.isLoading ? (
        <div className="py-20 text-center text-[var(--ink-2)]">
          <Loader2 size={30} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
          Đang tải món yêu thích…
        </div>
      ) : wishlistQuery.isError ? (
        <div className="empty card text-center" role="alert">
          <AlertCircle size={30} className="mx-auto mb-2 text-red-500" />
          <h3>Không tải được danh sách</h3>
          <p>{errorMessage(wishlistQuery.error)}</p>
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => wishlistQuery.refetch()}>Thử lại</button>
        </div>
      ) : products.length === 0 ? (
        <div className="empty card">
          <div className="art-wrap text-[var(--c-red)] bg-red-50 dark:bg-red-950/40"><Heart size={48} /></div>
          <h3>Danh sách yêu thích đang trống</h3>
          <p>Chạm vào biểu tượng trái tim trên món ăn để lưu món bạn muốn thử.</p>
          <Link className="btn btn-primary mt-2" to="/menu"><ShoppingBag size={18} /> Xem thực đơn</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleProducts.map((product) => {
              const price = Number(product.discountPrice || product.price);
              const oldPrice = product.discountPrice && product.discountPrice < product.price ? Number(product.price) : null;
              return (
                <article key={product.productId} className="card overflow-hidden border border-[var(--line)]">
                  <Link to={`/product/${product.productSlug || product.productId}`} className="block aspect-[4/3] bg-[var(--surface-2)] overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--ink-3)]"><ShoppingBag size={34} /></div>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {product.categoryName && <p className="text-xs uppercase tracking-wide text-[var(--c-amber)] mb-1">{product.categoryName}</p>}
                        <Link to={`/product/${product.productSlug || product.productId}`} className="font-bold text-[var(--ink)] hover:text-[#2450D6] line-clamp-2">
                          {product.productName}
                        </Link>
                      </div>
                      <button
                        type="button"
                        className="ibtn shrink-0"
                        aria-label={`Xóa ${product.productName} khỏi yêu thích`}
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(product.productId)}
                      >
                        {removeMutation.isPending && removeMutation.variables === product.productId
                          ? <Loader2 size={18} className="animate-spin" />
                          : <Trash2 size={18} className="text-[var(--c-red)]" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-4">
                      <div>
                        <b className="text-lg text-[var(--ink)]">{price.toLocaleString('vi-VN')}đ</b>
                        {oldPrice && <s className="block text-xs text-[var(--ink-3)]">{oldPrice.toLocaleString('vi-VN')}đ</s>}
                      </div>
                      {!product.isAvailable ? (
                        <span className="pill s-CANCELLED">Tạm hết món</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={addingProductId === product.productId}
                          onClick={() => handleAddToCart(product.productId, product.productName)}
                        >
                          {addingProductId === product.productId ? <Loader2 size={15} className="animate-spin" /> : <ShoppingBag size={15} />}
                          Thêm giỏ
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex justify-center items-center gap-3 pt-6">
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Trang trước</button>
              <span className="text-xs text-[var(--ink-2)]">Trang {page + 1} / {pageCount}</span>
              <button className="btn btn-ghost btn-sm" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}>Trang sau</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
