import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Percent, Truck, Copy, Search, Loader2 } from 'lucide-react';
import { voucherApi } from '@/shared/api/voucherApi';
import { useToastStore } from '@/shared/stores/toastStore';
import { mockVouchers } from '@/shared/api/mockData';

export const VouchersPage: React.FC = () => {
  const { showToast } = useToastStore();
  const [filterType, setFilterType] = useState<'ALL' | 'PRODUCT' | 'SHIPPING'>('ALL');
  const [search, setSearch] = useState('');

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['available-vouchers-page'],
    queryFn: () => voucherApi.getAvailableVouchers(),
  });

  const displayVouchers = vouchers.length > 0 ? vouchers : (mockVouchers.map(m => ({
    id: m.id,
    code: m.code,
    name: m.code,
    description: m.description,
    voucherType: 'PRODUCT' as const,
    discountType: m.discountType,
    discountValue: m.discountValue,
    minOrderAmount: m.minOrderValue,
    maxDiscountAmount: m.maxDiscount || null,
    startDate: m.startDate,
    endDate: m.endDate,
    remainingUses: 50,
    eligible: true,
    ineligibleReason: null,
  })));

  const filtered = displayVouchers.filter((v) => {
    if (filterType !== 'ALL' && v.voucherType !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return v.code.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã “${code}”`, 'success');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-[var(--volt-soft)] text-[var(--c-amber)]">
              <Ticket size={24} />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--ink)]">Kho Mã Khuyến Mãi</h1>
          </div>
          <p className="text-[var(--ink-2)] text-sm md:text-base">
            Thu thập mã giảm giá món ăn và miễn phí vận chuyển siêu hời tại ThunderFood.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
          <input 
            type="text" 
            placeholder="Tìm theo mã voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10 h-11 text-sm bg-[var(--surface)] border-[var(--line)] rounded-xl"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterType('ALL')}
          className={`chip cursor-pointer text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
            filterType === 'ALL'
              ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
              : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--ink-3)]'
          }`}
        >
          Tất cả ưu đãi ({displayVouchers.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('PRODUCT')}
          className={`chip cursor-pointer text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
            filterType === 'PRODUCT'
              ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
              : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--ink-3)]'
          }`}
        >
          <Percent size={15} className="inline mr-1 text-[var(--volt)]" />
          Giảm giá món ăn
        </button>
        <button
          type="button"
          onClick={() => setFilterType('SHIPPING')}
          className={`chip cursor-pointer text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
            filterType === 'SHIPPING'
              ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
              : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:border-[var(--ink-3)]'
          }`}
        >
          <Truck size={15} className="inline mr-1 text-emerald-500" />
          Miễn/Giảm phí ship
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--volt)] mx-auto mb-3" />
          <p className="text-[var(--ink-2)] font-medium">Đang tải danh sách ưu đãi...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4 text-[var(--ink-3)]">
            <Ticket size={32} />
          </div>
          <h3 className="font-bold text-lg text-[var(--ink)] mb-1">Không tìm thấy voucher</h3>
          <p className="text-sm text-[var(--ink-2)]">
            Hiện chưa có mã giảm giá nào phù hợp với bộ lọc hoặc tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const isShipping = v.voucherType === 'SHIPPING';
            const isPercent = v.discountType === 'PERCENTAGE';
            const discountLabel = isShipping
              ? isPercent ? `Giảm ${v.discountValue}% ship` : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ ship`
              : isPercent ? `Giảm ${v.discountValue}%` : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ`;

            return (
              <div 
                key={v.id}
                className="card flex overflow-hidden border border-[var(--line)] bg-[var(--surface)] hover:shadow-md transition-shadow relative"
              >
                {/* Cột icon trái */}
                <div 
                  className={`w-28 flex flex-col items-center justify-center p-3 text-center shrink-0 ${
                    isShipping ? 'bg-emerald-500 text-white' : 'bg-[var(--volt)] text-[var(--on-volt)]'
                  }`}
                >
                  {isShipping ? <Truck size={32} strokeWidth={2.2} /> : <Percent size={32} strokeWidth={2.4} />}
                  <span className="text-xs font-bold mt-1.5 uppercase tracking-wide">
                    {isShipping ? 'Freeship' : 'Voucher'}
                  </span>
                </div>

                {/* Thông tin phải */}
                <div className="flex-1 p-4 flex flex-col justify-between border-l border-dashed border-[var(--line)]">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="font-mono font-bold text-lg text-[var(--ink)] tracking-wider">
                          {v.code}
                        </span>
                        <h4 className="text-xs text-[var(--ink-3)] mt-0.5">{v.name}</h4>
                      </div>
                      <span className="badge px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--volt-soft)] text-[var(--c-amber)]">
                        {discountLabel}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--ink-2)] mt-1.5 line-clamp-2">
                      {v.description || 'Ưu đãi dành cho tất cả đơn hàng thỏa điều kiện.'}
                    </p>

                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-[11px] text-[var(--ink-3)] mt-2">
                      <span>Đơn tối thiểu: <b>{Number(v.minOrderAmount).toLocaleString('vi-VN')}đ</b></span>
                      {v.maxDiscountAmount && (
                        <span>Giảm tối đa: <b>{Number(v.maxDiscountAmount).toLocaleString('vi-VN')}đ</b></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--line)]">
                    <span className="text-[11px] text-[var(--ink-3)]">
                      HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(v.code)}
                      className="btn btn-sm btn-ghost gap-1.5 text-xs py-1 px-3 h-8"
                    >
                      <Copy size={13} />
                      <span>Sao chép mã</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
