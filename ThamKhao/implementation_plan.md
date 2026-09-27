# Kế hoạch triển khai Frontend ThunderFood

Tài liệu này trình bày kế hoạch chi tiết để xây dựng frontend cho dự án ThunderFood (bao gồm web đặt đồ ăn và trang quản trị), dựa trên tài liệu `ThunderFood_Frontend_Brief.md` và bản prototype HTML.

## Các quyết định đã thống nhất và Lời giải thích

> [!NOTE]
> Dựa trên phản hồi của bạn, chúng ta đã chốt 100% các vấn đề sau:
> 1. **Phí ship miễn phí:** So sánh tổng đơn trước khi trừ voucher.
> 2. **Review Count:** Ưu tiên API trả về, không có thì Frontend tự đếm.
> 3. **Refresh Token:** Dùng cookie `httpOnly`.
> 4. **Upload Ảnh:** Theo **Cách 2 (Qua Backend)** - Frontend gọi API upload của Backend, Backend đẩy lên Cloudinary và trả về URL.
> 5. **Thanh toán:** Tạm thời làm COD trước.
> 6. **Định dạng API & OpenAPI:** Frontend sẽ linh hoạt chờ đến khi có source code Backend. Khi có BE, tôi sẽ tự đọc code BE và khớp định dạng phân trang/lỗi theo thực tế (Phân trang - Pagination đơn giản là việc chia nhỏ dữ liệu, ví dụ 1000 đơn hàng thì API chỉ trả về 20 đơn/trang, kèm theo thông tin "tổng số trang là 50" để UI vẽ các nút bấm trang 1, 2, 3...).

> [!IMPORTANT]
> **Giải thích thêm về 2 thắc mắc cuối cùng của bạn:**
> 
> **A. Đăng nhập Google & Chức năng Chat (Có ảnh hưởng Schema cũ không?):**
> Hoàn toàn **không ảnh hưởng** đến các bảng khác.
> - **Google Login:** Bạn có thể không cần sửa Schema bằng phương pháp "mật khẩu ảo" (tự động tạo mật khẩu ngẫu nhiên khi đăng ký qua Google, bỏ qua check mật khẩu khi đăng nhập). Hoặc nếu muốn chuẩn chỉnh thì sửa (thêm cột `auth_provider`), nó cũng chỉ tác động duy nhất lên bảng `users` mà không phá vỡ liên kết nào.
> - **Chat:** Chỉ cần tạo thêm bảng mới hoàn toàn độc lập (ví dụ `chat_messages`) để lưu tin nhắn giữa `user_id` và admin, không đụng chạm gì đến luồng đặt hàng hay sản phẩm hiện tại.
> => Vì 2 tính năng này hoàn toàn biệt lập và an toàn, tôi đã bổ sung chúng vào danh sách các việc sẽ làm ở **Giai đoạn 5 (Tính năng nâng cao)**.
> 
> **B. Kế hoạch CI/CD (Tự động hóa kiểm tra & triển khai):**
> Dự án sẽ áp dụng CI/CD tự động bằng **GitHub Actions** và **Cloudflare Pages**:
> 1. **CI (Continuous Integration):** Tạo file cấu hình `.github/workflows/ci.yml`. Mỗi khi bạn Push code hoặc tạo Pull Request, GitHub sẽ khởi tạo một máy chủ ảo tự động chạy lệnh: cài đặt thư viện (`npm install`), kiểm tra lỗi cú pháp (`npm run lint`), kiểm tra kiểu dữ liệu Typescript (`npm run typecheck`), và thử Build (`npm run build`). Code bị lỗi sẽ bị chặn lại (chữ thập đỏ ❌), đảm bảo nhánh `main` luôn sạch.
> 2. **CD (Continuous Deployment):** Frontend sẽ được host trên **Cloudflare Pages** (miễn phí, CDN toàn cầu, cực kỳ tối ưu cho React SPA). Ta chỉ cần kết nối GitHub Repository với Cloudflare Pages một lần. Sau này, cứ hễ code được gộp vào nhánh `main` (và qua được bước CI), Cloudflare sẽ tự động kéo code mới nhất về, tự Build và Public ra domain thực tế chỉ trong 1-2 phút mà không cần thao tác thủ công.

## 1. Công nghệ & Kiến trúc (Technologies & Architecture)

- **Core:** React 18, TypeScript, Vite.
- **Routing:** React Router v6 (Data Router, code splitting bằng `lazy()`).
- **State Management & Data Fetching:** TanStack Query (React Query) cho server state (giỏ hàng, đơn hàng, dữ liệu fetch từ API). Zustand chỉ dùng quản lý global client state (UI state, auth session).
- **Styling:** Tailwind CSS kết hợp với CSS Variables từ file prototype (`thunderfood (1).html`). Component UI sẽ dùng shadcn/ui.
- **Form Validation:** React Hook Form + Zod.
- **Cấu trúc Monorepo-ready:** Chia theo feature-based (`features`, `pages`, `shared`, `app`), đảm bảo luồng phụ thuộc 1 chiều, chuẩn bị cho việc tách app Admin và User dễ dàng trong tương lai.

## 2. Tối ưu Hiệu năng & Trải nghiệm (Performance & UX)

- **Code Splitting:** Lazy load module trang Quản trị (Admin) để user không phải tải code của Admin. Lazy load các trang ít dùng (Hồ sơ, FAQ).
- **Tối ưu hình ảnh:** Đặt sẵn kích thước khung ảnh để tránh Layout Shift. Khuyến khích sử dụng WebP/AVIF.
- **Caching & Polling:** Cấu hình React Query cache hợp lý. Sử dụng `refetchInterval` (10-15s) thay vì WebSocket để cập nhật trạng thái đơn hàng (cho Admin và màn hình Tracking).
- **Responsive:** Thiết kế theo hướng Mobile-first. Sử dụng các điểm gãy (breakpoints) chính là 820px, 980px, 1100px.
- **Bảo mật:** Không lưu Access Token / Refresh Token vào `localStorage`. Access Token giữ trong memory, Refresh Token dùng `httpOnly` cookie.

## 3. Luồng hoạt động & Các tính năng chính (Features & Workflows)

### 3.1 Ứng dụng Khách hàng (User Web)
- **Tài khoản:** Đăng ký, Đăng nhập, Quản lý hồ sơ, Quản lý địa chỉ.
- **Mua hàng:** 
  - Xem danh sách món ăn, bộ lọc và tìm kiếm.
  - Chi tiết sản phẩm, xem đánh giá.
  - Giỏ hàng (dữ liệu lưu trên Server thay vì LocalStorage).
  - Thanh toán (Checkout): áp dụng mã giảm giá, phí giao hàng, chọn địa chỉ.
- **Quản lý đơn hàng:** Theo dõi trạng thái đơn hàng, hủy đơn (khi đang ở `PENDING`), lịch sử mua hàng, lịch sử giao dịch.

### 3.2 Ứng dụng Quản trị (Admin Web)
- **Dashboard:** Thống kê doanh thu, đơn hàng, sản phẩm bán chạy.
- **Sản phẩm & Danh mục:** CRUD món ăn, danh mục, upload hình ảnh.
- **Đơn hàng:** Xem danh sách, tìm kiếm, cập nhật trạng thái đơn hàng.
- **Khách hàng:** Quản lý người dùng, phân quyền (STAFF, ADMIN), khóa tài khoản.
- **Hệ thống:** Quản lý voucher, banner, cấu hình hệ thống (ngưỡng freeship, phí giao hàng mặc định).

## 4. Tương tác API (API Interaction)
- Sử dụng Axios instance tùy chỉnh với interceptor tự động gắn token và gọi refresh token khi hết hạn (401).
- Mọi logic gọi API được cô lập trong layer `features/*/api` và map dữ liệu thông qua Data Mappers.
- Khi BE chưa hoàn thiện, sử dụng MSW (Mock Service Worker) để giả lập API nhằm không làm gián đoạn tiến độ code Frontend.

## 5. Chuẩn bị cho triển khai (Docker & Cloudflare)
- Biến môi trường quản lý qua file `.env`, validate thông qua Zod lúc runtime.
- **Cloudflare Pages/Workers:** Build thành Single Page Application tĩnh, cấu hình rule proxy cho API, thiết lập file `_headers` với các header bảo mật (CSP, Cache-Control).
- **Docker:** Tạo sẵn `Dockerfile` với multi-stage build (NodeJS để build, Nginx Alpine để serve file tĩnh), kèm cấu hình Nginx SPA-fallback (`try_files $uri /index.html`).

## Kế hoạch thực thi (Execution Phases)
- **Giai đoạn 0:** Khởi tạo project (Vite, Tailwind, cấu trúc thư mục, MSW, env).
- **Giai đoạn 1:** Xây dựng layouts chính (User, Admin, Auth), cấu hình Router, Auth store và Axios Interceptor.
- **Giai đoạn 2:** Phát triển luồng khách hàng (Trang chủ, Menu, Giỏ hàng, Checkout cơ bản).
- **Giai đoạn 3:** Phát triển luồng sau đặt hàng (Theo dõi đơn, Lịch sử, Quản lý hồ sơ).
- **Giai đoạn 4:** Xây dựng trang Admin (Dashboard, Quản lý sản phẩm, Quản lý đơn hàng).
- **Giai đoạn 5:** Tích hợp tính năng nâng cao (Voucher, Đánh giá, Tracking, Settings, Google Login, Chat).
- **Giai đoạn 6:** Hoàn thiện UI/UX, tối ưu hiệu năng, viết Dockerfile và chuẩn bị deploy.

## Đề xuất
Nếu bạn đồng ý với kế hoạch trên, vui lòng phản hồi lại các câu hỏi ở phần **Open Questions** và nhấn phê duyệt.
