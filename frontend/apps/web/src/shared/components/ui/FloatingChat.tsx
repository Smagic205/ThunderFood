import { BotMessageSquare } from 'lucide-react';
import { useState } from 'react';

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Nút Chat nổi */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-[52px] h-[52px] md:w-[60px] md:h-[60px] bg-[var(--volt)] text-[var(--on-volt)] rounded-full flex items-center justify-center shadow-[0_8px_24px_-10px_rgba(255,184,28,0.8)] hover:scale-110 hover:-translate-y-1 transition-all z-50"
        aria-label="Mở chat với AI"
      >
        <BotMessageSquare size={30} />
      </button>

      {/* Cửa sổ Chat AI (ẩn/hiện) */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-10 w-[calc(100vw-48px)] max-w-[360px] bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-[0_16px_40px_-16px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden transform origin-bottom-right transition-all">
          <div className="bg-[#12183A] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--volt)] text-[#12183A] flex items-center justify-center font-bold">
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
          
          <div className="p-3 border-t border-[var(--line)] bg-[var(--surface)] flex gap-2">
            <input type="text" placeholder="Nhập tin nhắn..." className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--volt)]" disabled />
            <button className="w-[36px] h-[36px] rounded-full bg-[var(--volt)] text-[#12183A] flex items-center justify-center shrink-0 opacity-50 cursor-not-allowed" disabled>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
