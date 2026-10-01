import type { Voucher } from '@/shared/types';
import { Copy, Percent } from 'lucide-react';

interface VoucherListProps {
  vouchers: Voucher[];
}

export function VoucherList({ vouchers }: VoucherListProps) {
  if (!vouchers || vouchers.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Add toast notification
    alert(`Đã sao chép mã ${code}`);
  };

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {vouchers.map((v) => (
        <div 
          key={v.id} 
          className="flex-none w-[300px] md:w-[350px] snap-center bg-white border border-[#E0E3F0] rounded-xl flex overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
          style={{
            maskImage: 'radial-gradient(circle at 0 50%, transparent 8px, black 8px), radial-gradient(circle at 100% 50%, transparent 8px, black 8px)',
            maskSize: '100% 100%',
            maskPosition: 'center',
            maskRepeat: 'no-repeat'
          }}
        >
          {/* Lề trái */}
          <div className="w-[60px] flex items-center justify-center bg-[#FFB81C] text-[#12183A]">
            <Percent size={24} strokeWidth={2.5} />
          </div>
          
          {/* Lề phải / Nét đứt */}
          <div className="flex-1 p-3 flex items-center justify-between border-l border-dashed border-[#E0E3F0]">
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="font-bold text-[#12183A] text-lg leading-tight truncate">{v.code}</h4>
              <p className="text-sm text-[#565D82] line-clamp-1">{v.description}</p>
              <p className="text-xs text-[#868CAD] mt-1">
                Hết hạn: {new Date(v.endDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <button 
              onClick={() => handleCopy(v.code)}
              className="flex-none flex flex-col items-center justify-center bg-[#EBEDF6] text-[#12183A] hover:bg-[#E0E3F0] h-full px-3 rounded-lg font-medium transition-colors"
            >
              <Copy size={16} className="mb-1" />
              <span className="text-xs">Chép</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
