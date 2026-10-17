import { BotMessageSquare } from 'lucide-react';
import { useState } from 'react';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Nút Chat nổi */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[110px] right-4 md:bottom-10 md:right-10 w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:scale-110 hover:-translate-y-1 transition-all z-50 opacity-100"
        style={{ backgroundColor: 'var(--volt)', color: 'var(--on-volt)' }}
        aria-label="Mở chat với AI"
      >
        <BotMessageSquare size={30} />
      </button>

      {/* Cửa sổ Chat AI (ẩn/hiện) */}
      {isOpen && (
        <div 
          className="fixed bottom-[180px] right-4 md:bottom-28 md:right-10 w-[calc(100vw-32px)] max-w-[360px] border border-[var(--line)] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex flex-col z-50 overflow-hidden transform origin-bottom-right transition-all opacity-100 bg-white dark:bg-[#131C4D]"
        >
          <div className="bg-[#12183A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full text-[#12183A] flex items-center justify-center font-bold"
                style={{ backgroundColor: 'var(--volt)' }}
              >
                T
              </div>
              <div>
                <b className="block text-sm">Thunder AI</b>
                <span className="text-xs text-[#A6ADD6]">Sẵn sàng hỗ trợ bạn</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-[#A6ADD6] hover:text-white">
              ✕
            </button>
          </div>
          
          <div className="p-4 h-[300px] overflow-y-auto bg-gray-50 flex flex-col gap-3">
            <div className="bg-white border border-[var(--line)] rounded-2xl rounded-tl-sm p-3 text-sm text-[var(--ink)] self-start max-w-[85%] shadow-sm">
              Chào bạn! Tôi là trợ lý AI của ThunderFood. Bạn cần hỗ trợ đặt món hay tư vấn combo nào không?
            </div>
            <div className="text-center text-xs text-[var(--ink-3)] mt-auto pt-4">
              Chức năng chat AI sẽ sớm ra mắt!
            </div>
          </div>
          
          <div className="p-3 border-t border-[var(--line)] flex gap-2 bg-white dark:bg-[#131C4D]">
            <input type="text" placeholder="Nhập tin nhắn..." className="flex-1 bg-gray-100 dark:bg-[#22308A] rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--volt)]" disabled />
            <button 
              className="w-[36px] h-[36px] rounded-full text-[#12183A] flex items-center justify-center shrink-0 opacity-50 cursor-not-allowed" 
              style={{ backgroundColor: 'var(--volt)' }}
              disabled
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
