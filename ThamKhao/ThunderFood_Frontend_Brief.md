# ThunderFood – Tài liệu tổng hợp dự án và cấu trúc frontend

Cập nhật: 21/09/2026  
Phạm vi của tài liệu: **frontend** (React). Backend là **Spring Boot + MySQL 8** do thành viên khác phụ trách.  
Bản thiết kế giao diện (prototype bấm được, 27 màn hình): https://claude.ai/artifact/61kUBTrDmacijFCsJwPGe4

---

## 1. Bối cảnh và phạm vi

| Mục | Nội dung |
|---|---|
| Sản phẩm | Website thương mại điện tử bán đồ ăn cho cửa hàng thương hiệu **ThunderFood**, khu vực **Hà Nội** |
| Loại dự án | Đồ án môn học, có định hướng lên public (server, Cloudflare) trong tương lai |
| Nguyên tắc | **Bám theo file database** (`database_schema_mysql.sql`). Các tài liệu ý tưởng khác chỉ để tham khảo |
| Vai trò của bạn | Chỉ làm frontend. Cần một hợp đồng API rõ ràng với bạn backend (mục 7) |
| Đối tượng dùng | Khách hàng (chủ yếu trên điện thoại), Admin và nhân viên (chủ yếu trên máy tính, đôi khi máy tính bảng) |

---

## 2. Danh sách chức năng

### 2.1 Phía khách hàng (User)

| Nhóm | Chức năng | Ưu tiên |
|---|---|---|
| Tài khoản | Đăng ký, đăng nhập email/mật khẩu | Bản chính |
| | Quên và đặt lại mật khẩu qua email | Bản chính |
| | Xem, sửa hồ sơ, đổi mật khẩu, ảnh đại diện | Bản chính |
| | Quản lý nhiều địa chỉ giao hàng, đặt địa chỉ mặc định | Bản chính |
| | Đăng nhập Google/Facebook | Tùy chọn (DB chưa hỗ trợ) |
| Thực đơn | Xem theo danh mục, tìm theo tên, lọc theo giá/danh mục/đánh giá/bán chạy, sắp xếp | Bản chính |
| | Chi tiết món (nhiều ảnh, mô tả, giá, đánh giá) | Bản chính |
| Giỏ hàng và đặt hàng | Thêm, xóa, sửa số lượng | Bản chính |
| | Chọn địa chỉ, ghi chú đơn, đặt hàng | Bản chính |
| | Áp mã giảm giá | Nâng cao |
| Thanh toán | COD | Bản chính |
| | VNPay (sandbox) | Nâng cao |
| | MoMo, Stripe | Nâng cao sau cùng |
| | Lịch sử giao dịch | Nâng cao |
| Theo dõi đơn | Danh sách đơn theo trạng thái, chi tiết đơn, dòng thời gian trạng thái | Bản chính |
| | Hủy đơn khi còn `PENDING`, đặt lại đơn cũ | Bản chính |
| Tương tác | Đánh giá món (sao, bình luận, ảnh), chỉ khi đã mua | Nâng cao |
| | Yêu thích món | Nâng cao |
| | Thông báo trong ứng dụng | Nâng cao |
| Hỗ trợ | Trang FAQ và liên hệ | Bản chính |
| | Chat với admin | Tùy chọn (DB chưa hỗ trợ) |

### 2.2 Phía quản trị (Admin/Staff)

| Nhóm | Chức năng | Ưu tiên |
|---|---|---|
| Sản phẩm | CRUD món, giá, giá khuyến mãi, tồn kho, trạng thái còn/hết, nhiều ảnh | Bản chính |
| | CRUD danh mục | Bản chính |
| Đơn hàng | Danh sách theo trạng thái, tìm theo mã/tên/SĐT, chi tiết, cập nhật trạng thái, hủy | Bản chính |
| Người dùng | Danh sách, khóa/mở khóa, đổi vai trò (ADMIN, STAFF, CUSTOMER) | Bản chính |
| Thống kê | Doanh thu theo ngày/tuần/tháng (biểu đồ), món bán chạy, đơn theo trạng thái | Bản chính (mức cơ bản) |
| | Xuất Excel/PDF | Nâng cao |
| Khuyến mãi | CRUD mã giảm giá | Nâng cao |
| Đánh giá | Ẩn/hiện, phản hồi | Nâng cao |
| Banner | CRUD banner (ảnh và liên kết), sắp xếp | Nâng cao |
| Cấu hình | Phí giao hàng mặc định, ngưỡng miễn phí | Nâng cao |

Phân quyền gợi ý: **STAFF** chỉ xử lý đơn hàng, **ADMIN** làm được mọi thứ.

---

## 3. Ràng buộc từ database (nguồn sự thật)

### 3.1 Bảng DB dùng ở màn hình nào

| Bảng | Màn hình frontend |
|---|---|
| `roles`, `users` | Đăng nhập/đăng ký, hồ sơ, Admin > Người dùng |
| `addresses` | Tài khoản > Địa chỉ, Checkout |
| `user_tokens` | Backend dùng cho refresh token và đặt lại mật khẩu. Frontend chỉ nhận `?token=` ở trang đặt lại mật khẩu |
| `categories`, `products`, `product_images` | Thực đơn, chi tiết món, Admin > Sản phẩm/Danh mục |
| `carts`, `cart_items` | Giỏ hàng (lưu ở server) |
| `vouchers` | Giỏ hàng, Checkout, Admin > Khuyến mãi, thẻ mã ở trang chủ |
| `orders`, `order_items`, `order_status_history` | Checkout, đơn hàng, theo dõi đơn, Admin > Đơn hàng |
| `payments` | Tài khoản > Giao dịch, trang kết quả thanh toán |
| `reviews` | Đánh giá ở trang món, Admin > Đánh giá |
| `wishlists` | Yêu thích |
| `notifications` | Thông báo |
| `banners` | Trang chủ, Admin > Banner |
| `system_settings` | Phí giao hàng, ngưỡng miễn phí (dạng khóa-giá trị) |

### 3.2 Các giá trị enum (dùng đúng chuỗi này trong code)

| Loại | Giá trị (nhãn hiển thị) |
|---|---|
| Trạng thái đơn `orders.status` | `PENDING` (Chờ xác nhận), `CONFIRMED` (Đã xác nhận), `PREPARING` (Đang chuẩn bị), `DELIVERING` (Đang giao), `COMPLETED` (Hoàn thành), `CANCELLED` (Đã hủy) |
| Luồng chuẩn | PENDING → CONFIRMED → PREPARING → DELIVERING → COMPLETED. Được hủy trước khi giao. Khách chỉ tự hủy khi PENDING |
| Phương thức thanh toán | `COD`, `VNPAY`, `MOMO`, `STRIPE` |
| `orders.payment_status` | `UNPAID`, `PAID`, `FAILED`, `REFUNDED` |
| `payments.status` | `PENDING`, `SUCCESS`, `FAILED` (không có REFUNDED, hoàn tiền nằm ở `orders`) |
| Vai trò | `ADMIN`, `STAFF`, `CUSTOMER` |
| Trạng thái tài khoản | `ACTIVE`, `LOCKED` |
| Loại voucher | `PERCENT`, `FIXED_AMOUNT` |
| Loại thông báo | `ORDER_STATUS`, `PROMOTION`, `SYSTEM` |

### 3.3 Quy tắc nghiệp vụ

- **Tiền tệ:** VND, không có phần lẻ. Hiển thị dạng `189.000₫` bằng `Intl.NumberFormat('vi-VN')`.
- **Tổng tiền:** `total = subtotal - discount + shipping`.
- **Phí giao hàng:** `DEFAULT_SHIPPING_FEE = 15000`. Nếu `subtotal >= FREE_SHIPPING_THRESHOLD (200000)` thì miễn phí. *(Cần chốt với backend: so sánh trước hay sau khi trừ voucher. Prototype so sánh trước khi trừ.)*
- **Voucher:** `PERCENT` = `subtotal × value / 100`, bị chặn bởi `max_discount_amount`. `FIXED_AMOUNT` = `value`. Điều kiện: đang `is_active`, trong khoảng `start_date` đến `end_date`, `subtotal >= min_order_amount`, `used_count < usage_limit` (NULL là không giới hạn).
- **Giỏ hàng:** mỗi món một dòng (unique `cart_id + product_id`), `quantity > 0`, không vượt tồn kho.
- **Snapshot:** `order_items` lưu tên và giá món, `orders` lưu người nhận, SĐT, địa chỉ tại thời điểm đặt. Lịch sử đơn không đổi khi món hoặc địa chỉ bị sửa.
- **Mã đơn:** dạng `ORD20260920001` (`ORD` + ngày + số thứ tự). Dùng `order_code` để hiển thị và làm URL, không dùng `id`.
- **Đánh giá:** 1 đến 5 sao, có `order_id` (chỉ đánh giá khi đã mua), có `is_hidden` (admin ẩn) và `admin_reply`.
- **Trang chi tiết món** dùng `slug` (DB có cột `slug` UNIQUE). Prototype dùng `id` cho đơn giản.

---

## 4. Những thứ DB không hỗ trợ và cách xử lý

| Ý tưởng | Tình trạng | Cách xử lý |
|---|---|---|
| Topping, ghi chú theo từng món | Không có bảng | Bỏ. Chỉ có `orders.note` ở cấp đơn |
| Giỏ hàng cho khách chưa đăng nhập | `carts.user_id` bắt buộc | Bản đầu yêu cầu đăng nhập khi thêm giỏ. Sau này có thể thêm giỏ tạm rồi gộp khi đăng nhập |
| Đăng nhập Google/Facebook | `users` không có cột provider | Để tùy chọn, cần bổ sung schema |
| Chat với admin, push notification | Không có bảng | Chỉ làm thông báo trong ứng dụng từ `notifications` |
| Số lượng đánh giá của món | Không có cột `review_count` | Backend đếm từ `reviews` (bỏ review bị ẩn) rồi trả về |
| Voucher theo danh mục | Không có | Bỏ điều kiện này |
| Voucher "đơn đầu tiên" | Không theo dõi mỗi user dùng mấy lần | Backend kiểm tra số đơn của user, hoặc đổi mô tả |
| Khu vực giao hàng, phí theo quận | Không có bảng | Chỉ dùng phí mặc định. Danh sách 12 quận nội thành là hằng số ở frontend |
| Banner có tiêu đề, mã, màu | `banners` chỉ có `image_url, link_url, sort_order, is_active` | Banner là **một tấm ảnh** kèm liên kết. Chữ nằm sẵn trong ảnh |
| Ảnh cho danh mục | Không có cột ảnh | Frontend dùng icon cố định theo `slug` |
| Shipper, giờ giao dự kiến | Không có | Chỉ hiển thị dòng thời gian từ `order_status_history` |
| Tùy chọn nhận thông báo email/push | Không có | Bỏ |
| Giờ mở cửa, hotline, bật/tắt cổng thanh toán | Không có cột riêng | Có thể thêm khóa vào `system_settings` (dạng khóa-giá trị, không cần đổi schema) |

---

## 5. Các quyết định kiến trúc đã chốt

1. **Giỏ hàng nằm ở server.** Frontend dùng React Query (`useQuery` + `useMutation`), **không** dùng Zustand `persist` cho giỏ hàng.
2. **Token:** access token giữ trong bộ nhớ (không lưu localStorage). Refresh token do backend cấp (nên là cookie `httpOnly`). `ProtectedRoute` chỉ là lớp trải nghiệm, quyền thật do backend kiểm soát.
3. **Backend tính tiền.** Frontend chỉ hiển thị. Server tự tính lại subtotal, voucher, phí ship, tổng tiền khi đặt đơn.
4. **Chưa có topping.** Trang chi tiết món chỉ có số lượng.
5. **Zustand chỉ giữ** thông tin đăng nhập và trạng thái giao diện (theme, drawer). Mọi dữ liệu từ server nằm trong React Query.
6. **Cập nhật đơn mới bằng polling** (`refetchInterval` 10 đến 15 giây) cho Admin và trang theo dõi đơn. Chưa cần WebSocket.
7. **TypeScript ngay từ đầu** vì có nhiều enum trạng thái.
8. **Thanh toán:** COD trước, VNPay sandbox sau. Chỉ tin kết quả do server xác nhận, trang kết quả chỉ hỏi lại server.

---

## 6. Thiết kế giao diện

### 6.1 Phong cách

- **Màu:** navy bão làm nền hero và sidebar, **vàng sét** chỉ dành cho hành động chính. Có chế độ tối.
- **Chữ:** Bricolage Grotesque cho tiêu đề, Be Vietnam Pro cho nội dung (hỗ trợ tiếng Việt).
- **Điểm nhấn:** tia sét (hero trang chủ vẽ đường viền rồi loé sáng một lần).
- **Ảnh món trong prototype là hình minh họa SVG.** Khi có ảnh thật, khung ảnh đã sẵn để thay.

| Token | Sáng | Tối |
|---|---|---|
| Nền `--bg` | `#F3F4FA` | `#0A0F2E` |
| Bề mặt `--surface` | `#FFFFFF` | `#121942` |
| Chữ `--ink` | `#12183A` | `#EDEFFC` |
| Chữ phụ `--ink-2` | `#565D82` | `#A6ADD6` |
| Viền `--line` | `#E0E3F0` | `#252E66` |
| Panel navy `--panel` | `#131C4D` | `#0F1862` |
| Vàng sét `--volt` | `#FFB81C` (nền hover `#F0A200`, chữ trên nền vàng `#12183A`) | giống nhau |
| Trạng thái | vàng cam `#A56200`, xanh dương `#2450D6`, tím `#6B3FD1`, xanh lá `#0F7F59`, đỏ `#C2372F`, xanh ngọc `#0E8A9C` | sáng hơn để đọc trên nền tối |

Bo góc: thẻ 22px, nút và chip dạng viên thuốc (999px), ô nhập 14px.

### 6.2 Responsive

- Thiết kế Mobile-First. Điểm gãy chính của prototype: **820px** (điện thoại chuyển sang máy tính: ẩn menu trên, hiện thanh điều hướng dưới), **980px** (layout nhiều cột thu về một cột), **1100px**.
- Trong Tailwind nên khai báo lại `screens` cho khớp các mốc này.
- Điện thoại: thanh điều hướng dưới, thanh mua hàng cố định ở trang món và giỏ, bảng chuyển thành thẻ, hộp thoại thành bottom sheet (dùng Drawer của shadcn để vuốt xuống đóng).
- Máy tính: Admin có sidebar cố định, bảng có lọc, tìm kiếm, phân trang.

### 6.3 Danh sách 27 màn hình và đường dẫn đề xuất

**Khách hàng**

| Màn hình | Đường dẫn |
|---|---|
| Trang chủ | `/` |
| Thực đơn | `/menu` (tham số `?category=&q=&sort=&minPrice=&maxPrice=&rating=`) |
| Chi tiết món | `/products/:slug` |
| Giỏ hàng | `/cart` |
| Thanh toán | `/checkout` |
| Kết quả thanh toán online | `/payment/result` |
| Đặt hàng thành công | `/order-success/:orderCode` |
| Hỗ trợ (FAQ, liên hệ) | `/support` |
| Đăng nhập | `/login` |
| Đăng ký | `/register` |
| Quên mật khẩu | `/forgot-password` |
| Đặt lại mật khẩu | `/reset-password?token=` |
| Hồ sơ, đổi mật khẩu | `/account/profile` |
| Sổ địa chỉ | `/account/addresses` |
| Lịch sử đơn hàng | `/account/orders` |
| Theo dõi đơn hàng | `/account/orders/:orderCode` |
| Lịch sử giao dịch | `/account/payments` |
| Yêu thích | `/account/wishlist` |
| Thông báo | `/account/notifications` |
| Không có quyền, không tìm thấy | `/403`, `*` |

**Quản trị**

| Màn hình | Đường dẫn |
|---|---|
| Tổng quan, thống kê | `/admin` |
| Đơn hàng | `/admin/orders` |
| Sản phẩm | `/admin/products` |
| Danh mục | `/admin/categories` |
| Người dùng, phân quyền | `/admin/users` |
| Đánh giá | `/admin/reviews` |
| Khuyến mãi | `/admin/vouchers` |
| Banner | `/admin/banners` |
| Cấu hình | `/admin/settings` |

---

## 7. Đề xuất hợp đồng API (cần thống nhất với bạn backend)

### 7.1 Quy ước chung

| Nội dung | Đề xuất |
|---|---|
| Tiền tố | `/api/v1` |
| **Thời gian** | ISO 8601 **có múi giờ**, ví dụ `2026-09-20T09:41:00+07:00`. Frontend hiển thị theo `Asia/Ho_Chi_Minh` |
| Tiền | Số nguyên VND, không chuỗi, không phần lẻ |
| Phân trang | `{ items, page, size, totalItems, totalPages }` (frontend có thể chuyển từ dạng `Page` của Spring) |
| Lỗi | `{ code, message, errors: [{ field, message }] }` kèm mã HTTP đúng, để form hiển thị lỗi theo từng ô |
| Xác thực | Header `Authorization: Bearer <accessToken>`. Refresh token qua cookie `httpOnly` |
| Định danh đơn | Dùng `orderCode` trong URL |
| Tài liệu | Backend bật springdoc-openapi để frontend có thể sinh kiểu dữ liệu tự động (`openapi-typescript`) |

### 7.2 Danh sách endpoint

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Công khai | `GET /products` (lọc, sắp xếp, phân trang), `GET /products/{slug}`, `GET /products/{id}/reviews`, `GET /categories`, `GET /banners`, `GET /settings/public` | Không cần |
| Xác thực | `POST /auth/register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password` | Không cần |
| Hồ sơ | `GET/PUT /me`, `PUT /me/password`, `GET/POST/PUT/DELETE /me/addresses` | CUSTOMER |
| Giỏ hàng | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{id}`, `DELETE /cart/items/{id}` | CUSTOMER |
| Voucher | `GET /vouchers/available`, `POST /vouchers/validate` (mã + giỏ hiện tại) | CUSTOMER |
| Đơn hàng | `POST /orders` (địa chỉ, phương thức thanh toán, mã voucher, ghi chú; trả về đơn và `paymentUrl` nếu thanh toán online), `GET /orders`, `GET /orders/{code}`, `POST /orders/{code}/cancel` | CUSTOMER |
| Thanh toán | `GET /me/payments`, `GET /payments/result?orderCode=` (trạng thái do server xác nhận) | CUSTOMER |
| Tương tác | `GET/POST/DELETE /me/wishlist`, `POST /products/{id}/reviews`, `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/{id}/read` | CUSTOMER |
| Admin | `GET /admin/dashboard?range=day\|week\|month`, `GET/PATCH /admin/orders`, `PATCH /admin/orders/{id}/status`, CRUD `/admin/products` (kèm tải ảnh), `/admin/categories`, `/admin/vouchers`, `/admin/banners`, `GET/PATCH /admin/users`, `/admin/reviews` (ẩn, phản hồi), `GET/PUT /admin/settings` | ADMIN (đơn hàng: cả STAFF) |
| Tải ảnh | `POST /uploads` (multipart, trả về URL đầy đủ) | Đăng nhập |

### 7.3 Vài kiểu dữ liệu chính (TypeScript, để hai bên đối chiếu)

```ts
type OrderStatus = 'PENDING'|'CONFIRMED'|'PREPARING'|'DELIVERING'|'COMPLETED'|'CANCELLED';
type PaymentMethod = 'COD'|'VNPAY'|'MOMO'|'STRIPE';

interface Product {
  id: number; slug: string; name: string; description: string;
  categoryId: number; price: number; discountPrice: number | null;
  stockQuantity: number; soldCount: number;
  avgRating: number; reviewCount: number;      // reviewCount do backend đếm
  isAvailable: boolean;
  images: { url: string; isThumbnail: boolean; sortOrder: number }[];
}

interface Order {
  orderCode: string; status: OrderStatus;
  paymentMethod: PaymentMethod; paymentStatus: 'UNPAID'|'PAID'|'FAILED'|'REFUNDED';
  receiverName: string; receiverPhone: string; shippingAddress: string; note: string | null;
  subtotalAmount: number; discountAmount: number; shippingFee: number; totalAmount: number;
  voucherCode: string | null; createdAt: string;   // ISO có +07:00
  items: { productId: number; productName: string; productPrice: number; quantity: number; lineTotal: number }[];
  history: { status: OrderStatus; note: string | null; createdAt: string }[];
}
```

---

## 8. Cấu trúc thư mục frontend đề xuất

Nguyên tắc thiết kế:

1. **Chia theo tính năng (feature), không chia theo loại tệp.** Logic của một nghiệp vụ (đơn hàng, giỏ hàng...) nằm cùng một chỗ và dùng chung cho cả User lẫn Admin.
2. **Trang (`pages`) chỉ ghép các tính năng lại.** Trang User, Admin, Auth nằm ở các nhánh riêng. Mã Admin được lazy load nên khách không tải mã quản trị.
3. **Phụ thuộc một chiều** (mục 8.3), có ESLint chặn phụ thuộc vòng. Nhờ vậy về sau tách Admin thành ứng dụng riêng chỉ là việc di chuyển thư mục.
4. **Mọi thứ phụ thuộc môi trường** (địa chỉ API, tên miền) đi qua một chỗ duy nhất (`shared/config/env.ts`), để build một lần triển khai được nhiều môi trường.

### 8.1 Cây thư mục

```
thunderfood-web/
├─ .github/workflows/ci.yml        # lint, typecheck, test, build cho mỗi pull request
├─ .env.example                    # danh sách biến môi trường (không chứa bí mật)
├─ index.html
├─ package.json  vite.config.ts  tsconfig.json  eslint.config.js  components.json (shadcn)
│
├─ deploy/
│  ├─ docker/                      # Dockerfile + nginx.conf (nếu chạy trên VPS)
│  └─ cloudflare/README.md         # cấu hình Pages/Workers, tên miền, ghi chú CORS
│
├─ docs/
│  ├─ PROJECT_BRIEF.md             # tài liệu này
│  ├─ api-contract.md              # hợp đồng API đã chốt với backend
│  └─ adr/                         # ghi lại các quyết định kiến trúc (mỗi quyết định một tệp ngắn)
│
├─ mocks/                          # giả API bằng MSW khi backend chưa xong
│  ├─ browser.ts
│  ├─ handlers/                    # auth.ts, catalog.ts, cart.ts, orders.ts, admin.ts ...
│  └─ fixtures/                    # dữ liệu mẫu (có thể lấy từ prototype)
│
├─ public/
│  ├─ favicon.svg  manifest.webmanifest  robots.txt  og-image.jpg
│  └─ _headers                     # header cache và bảo mật cho Cloudflare Pages
│
└─ src/
   ├─ main.tsx
   │
   ├─ app/                         # khởi động ứng dụng, không chứa nghiệp vụ
   │  ├─ App.tsx
   │  ├─ providers/                # QueryProvider, ThemeProvider, AuthBootstrap (khôi phục phiên đăng nhập)
   │  ├─ router/
   │  │  ├─ index.tsx              # createBrowserRouter
   │  │  ├─ paths.ts               # hằng số đường dẫn, nguồn duy nhất
   │  │  ├─ user.routes.tsx
   │  │  ├─ auth.routes.tsx
   │  │  ├─ admin.routes.tsx       # toàn bộ dùng lazy()
   │  │  └─ guards/                # RequireAuth, RequireRole, GuestOnly
   │  └─ styles/
   │     ├─ index.css              # Tailwind + font
   │     └─ tokens.css             # biến màu, bo góc (sáng/tối), khớp mục 6.1
   │
   ├─ layouts/                     # khung cho từng vùng
   │  ├─ UserLayout/               # Header, BottomNav (mobile), Footer, FloatingCartBar, ChatLauncher
   │  ├─ AccountLayout/            # menu tài khoản (cột trái trên máy tính, thanh cuộn ngang trên mobile)
   │  ├─ AuthLayout/               # khung đăng nhập/đăng ký (nửa thương hiệu, nửa form)
   │  └─ AdminLayout/              # Sidebar (thu gọn được), Topbar, ngăn kéo menu trên mobile
   │
   ├─ pages/                       # mỗi tệp là một màn hình, chỉ ghép feature
   │  ├─ user/
   │  │  ├─ HomePage.tsx  MenuPage.tsx  ProductDetailPage.tsx  CartPage.tsx
   │  │  ├─ CheckoutPage.tsx  PaymentResultPage.tsx  OrderSuccessPage.tsx  SupportPage.tsx
   │  │  └─ account/  ProfilePage  AddressesPage  OrdersPage  OrderDetailPage  PaymentsPage  WishlistPage  NotificationsPage
   │  ├─ auth/     LoginPage  RegisterPage  ForgotPasswordPage  ResetPasswordPage
   │  ├─ admin/    DashboardPage  OrdersPage  ProductsPage  CategoriesPage  UsersPage  ReviewsPage  VouchersPage  BannersPage  SettingsPage
   │  └─ system/   NotFoundPage  ForbiddenPage  ErrorPage
   │
   ├─ features/                    # nghiệp vụ, dùng chung cho user và admin
   │  ├─ auth/          # đăng nhập, đăng ký, quên mật khẩu, store phiên đăng nhập
   │  ├─ account/       # hồ sơ, địa chỉ
   │  ├─ catalog/       # sản phẩm, danh mục (ProductCard, ProductGallery, bộ lọc; admin: ProductForm)
   │  ├─ cart/          # giỏ hàng, FloatingCartBar
   │  ├─ voucher/       # ô nhập mã, danh sách mã, (admin: VoucherForm)
   │  ├─ checkout/      # chọn địa chỉ, chọn phương thức thanh toán, schema Zod
   │  ├─ order/         # danh sách, dòng thời gian, hủy đơn, (admin: bảng đơn, ngăn kéo chi tiết)
   │  ├─ payment/       # lịch sử giao dịch, xử lý trả về từ cổng thanh toán
   │  ├─ review/        # đánh giá và phản hồi
   │  ├─ wishlist/
   │  ├─ notification/  # danh sách, số chưa đọc (polling)
   │  ├─ banner/
   │  ├─ settings/      # phí giao hàng, ngưỡng miễn phí
   │  ├─ users/         # (admin) quản lý người dùng
   │  └─ stats/         # (admin) thống kê, biểu đồ
   │
   └─ shared/                      # không chứa nghiệp vụ, dùng ở mọi nơi
      ├─ api/           # http.ts (Axios), interceptors.ts (gắn token, tự refresh khi 401), errors.ts, pagination.ts, upload.ts
      ├─ ui/            # nguyên tử của shadcn (Button, Input, Dialog, Drawer, Table, Select, Sonner ...)
      ├─ components/    # Price, StatusPill, EmptyState, PageHeader, DataTable, ImageWithFallback, Rating ...
      ├─ hooks/         # useDebounce, useMediaQuery, useDocumentTitle ...
      ├─ lib/           # format.ts (tiền, ngày theo Asia/Ho_Chi_Minh), cn.ts, storage.ts, image.ts
      ├─ config/        # env.ts (đọc và kiểm tra biến môi trường bằng Zod), constants.ts
      └─ types/         # kiểu dùng chung (ApiError, Page<T>), enums.ts (khớp mục 3.2)
```

### 8.2 Bên trong một feature (ví dụ `order`)

```
features/order/
├─ api/
│  ├─ order.api.ts          # hàm gọi API thuần (getOrders, getOrder, createOrder, cancelOrder ...)
│  ├─ order.queries.ts      # query keys + useOrders, useOrder (có refetchInterval khi đơn đang giao)
│  └─ order.mutations.ts    # useCreateOrder, useCancelOrder, (admin) useUpdateOrderStatus
├─ model/
│  ├─ order.types.ts        # kiểu dữ liệu
│  ├─ order.constants.ts    # nhãn trạng thái, luồng chuyển trạng thái
│  ├─ order.mappers.ts      # chuyển dữ liệu API thành dữ liệu dùng trong UI
│  └─ order.schema.ts       # schema Zod nếu có form
├─ components/
│  ├─ OrderCard.tsx  OrderTimeline.tsx  OrderStatusPill.tsx     # dùng chung
│  └─ admin/  OrderTable.tsx  OrderDrawer.tsx  OrderFilters.tsx # chỉ Admin dùng
└─ index.ts                 # chỉ export những gì bên ngoài được phép dùng
```

Thư mục `components/admin/` chỉ được import từ `pages/admin`. Vì trang Admin được lazy load, các thành phần này tự rơi vào gói (chunk) của Admin.

### 8.3 Quy tắc phụ thuộc

```
app  →  pages  →  features  →  shared
```

- `shared` không import `features`, `pages`, `app`.
- `features` không import `pages`, `app`. Feature này chỉ dùng feature khác qua `index.ts` của feature đó.
- `pages/user` không import `pages/admin` và ngược lại.
- Chỉ `app/router` được dùng `lazy()` để nạp trang.
- Có thể ép các quy tắc này bằng `eslint-plugin-boundaries` hoặc `no-restricted-imports`.

### 8.4 Cách thêm một tính năng mới

1. Tạo `features/<tên>/` gồm `api`, `model`, `components`, `index.ts`.
2. Thêm handler MSW và dữ liệu mẫu trong `mocks/` để làm việc khi backend chưa xong.
3. Tạo trang trong `pages/user` hoặc `pages/admin`, ghép các thành phần lại.
4. Khai báo đường dẫn trong `app/router/paths.ts` và file route tương ứng.
5. Viết test cho phần logic (mapper, schema) và một luồng chính.

### 8.5 Quy ước đặt tên

- Thư mục: `kebab-case` hoặc `camelCase` thống nhất (khuyến nghị `kebab-case` cho feature, `PascalCase` cho thư mục component có nhiều tệp).
- Component: `PascalCase.tsx`. Hook: `useXxx.ts`. Hằng số: `xxx.constants.ts`. Kiểu: `xxx.types.ts`.
- Query key tập trung trong `xxx.queries.ts`, ví dụ `orderKeys.detail(code)`.
- Tệp kiểm thử đặt cạnh tệp gốc: `OrderTimeline.test.tsx`.

### 8.6 Khi dự án lớn lên: tách Admin

Nếu sau này muốn Admin chạy ở tên miền riêng (`admin.thunderfood.vn`) hoặc nhiều người cùng phát triển, chuyển sang **monorepo** (pnpm workspaces):

```
apps/web        (khách hàng)     ← pages/user, pages/auth
apps/admin      (quản trị)       ← pages/admin
packages/features  ← src/features
packages/ui        ← src/shared/ui + components
packages/api-client← src/shared/api
```

Vì `features` và `shared` không phụ thuộc vào `pages`, việc tách chỉ là chuyển thư mục và sửa đường dẫn import.

---

## 9. Công nghệ và công cụ

| Nhóm | Lựa chọn |
|---|---|
| Nền tảng | React + TypeScript, build bằng Vite |
| Định tuyến | React Router (data router, `lazy`) |
| Dữ liệu server | TanStack Query + Axios |
| Trạng thái client | Zustand (chỉ auth và giao diện) |
| Form | React Hook Form + Zod |
| Giao diện | Tailwind CSS + shadcn/ui (Drawer cho bottom sheet), Sonner cho thông báo nhanh |
| Biểu đồ | Recharts hoặc biểu đồ SVG tự vẽ như prototype |
| Ngày giờ | `Intl.DateTimeFormat` hoặc dayjs (plugin timezone) |
| Giả API | MSW (hoặc json-server) |
| Kiểm thử | Vitest + Testing Library, Playwright cho vài luồng chính (tùy chọn) |
| Chất lượng | ESLint, Prettier, `eslint-plugin-boundaries` |
| Sinh kiểu dữ liệu | `openapi-typescript` từ springdoc của backend (khi backend sẵn sàng) |

---

## 10. Chuẩn bị lên public (server, Cloudflare)

### 10.1 Nguyên tắc để dễ triển khai

- Frontend build ra **tệp tĩnh** (`dist/`) nên đặt được lên Cloudflare Pages/Workers, Nginx trên VPS, hoặc bất kỳ CDN nào.
- **Không ghi cứng địa chỉ API.** Dùng biến `VITE_API_BASE_URL`, đọc và kiểm tra tại `shared/config/env.ts` (Zod, thiếu biến là báo lỗi ngay khi khởi động). Chỉ biến bắt đầu bằng `VITE_` lộ ra trình duyệt, **không** đặt bí mật vào đây.
- Ba môi trường: `dev` (chạy local, có thể dùng MSW), `staging` (bản xem thử), `production`.

`.env.example`:

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCKS=false
VITE_APP_ENV=development
VITE_SITE_URL=http://localhost:5173
```

### 10.2 Cloudflare Pages (hoặc Workers với static assets)

1. Kết nối repo GitHub. Cấu hình build: lệnh `npm run build`, thư mục xuất `dist`, khai báo biến môi trường theo từng môi trường.
2. Mỗi nhánh hoặc pull request có một bản xem thử riêng, dùng làm **staging**.
3. **SPA:** Pages tự trả về `index.html` cho đường dẫn không tồn tại nếu dự án không có tệp `404.html`. Hãy kiểm tra lại theo tài liệu hiện hành của Cloudflare khi triển khai.
4. Tệp `public/_headers` để đặt header. Ví dụ:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

5. Thêm `Content-Security-Policy` khi đã biết chắc các nguồn dùng đến (API, CDN ảnh, font). Nên tự host font (ví dụ qua Fontsource) thay vì tải từ Google Fonts để giảm kết nối và dễ viết CSP.

### 10.3 Tên miền, API và cookie

| Phương án | Cách làm | Lưu ý |
|---|---|---|
| A. API ở tên miền con (khuyến nghị) | `thunderfood.vn` cho frontend, `api.thunderfood.vn` cho backend | Backend bật CORS cho đúng origin của frontend, cho phép gửi cookie. Cookie refresh token: `HttpOnly; Secure; SameSite=Lax; Domain=.thunderfood.vn` |
| B. Cùng origin qua proxy | Cloudflare Worker hoặc Pages Functions chuyển tiếp `/api/*` tới backend | Không cần CORS, cookie đơn giản hơn. Cần viết và bảo trì thêm lớp proxy |

- Bản xem thử của Pages nằm ở tên miền `*.pages.dev`, khác site với API nên cookie có thể không gửi được. Khi kiểm thử ở staging, dùng MSW hoặc cấu hình staging riêng.
- Bật HTTPS toàn bộ. Trong Cloudflare dùng chế độ SSL **Full (strict)** khi API đã có chứng chỉ hợp lệ.

### 10.4 Ảnh và hiệu năng

- Ảnh món, banner, ảnh đánh giá do backend lưu và trả URL đầy đủ (Cloudinary, Cloudflare R2 hoặc S3). Dùng định dạng WebP/AVIF, `loading="lazy"` cho ảnh dưới màn hình đầu, **không** lazy cho ảnh hero.
- Luôn đặt trước kích thước ảnh (`width`, `height` hoặc `aspect-ratio`) để trang không nhảy bố cục.
- Viết hàm `shared/lib/image.ts` để tạo URL theo kích thước. Khi đổi nhà cung cấp ảnh chỉ sửa một chỗ.
- Tách gói (code splitting): Admin lazy load, các trang User ít dùng (Support, Account) lazy load, thư viện nặng như biểu đồ chỉ nạp ở trang Admin.
- Đặt ngân sách dung lượng cho gói đầu tiên và kiểm tra ở CI.

### 10.5 Bảo mật khi lên public

- Không lưu token trong localStorage. Access token giữ trong bộ nhớ, refresh token ở cookie `httpOnly`.
- Không dùng `dangerouslySetInnerHTML` với dữ liệu người dùng (bình luận, tên...). Mặc định React đã thoát ký tự.
- Với ảnh do người dùng tải lên, backend kiểm tra loại và dung lượng, frontend chỉ chặn sớm để báo lỗi nhanh.
- Cloudflare: bật WAF và giới hạn tốc độ cho `/auth/*`. Có thể thêm Turnstile (captcha miễn phí) cho đăng nhập, đăng ký, quên mật khẩu, khi đó backend cần xác minh token.
- Cẩn thận khi cache: chỉ cache các API công khai như danh sách món, banner, với thời gian ngắn do backend đặt qua `Cache-Control`. Không cache API có dữ liệu người dùng.

### 10.6 SEO và chia sẻ

- SPA React thuần kém cho công cụ tìm kiếm và xem trước liên kết khi chia sẻ. Với đồ án thì đủ dùng.
- Khi cần: dựng sẵn (prerender) các trang tĩnh như Trang chủ, Thực đơn, hoặc chuyển phần khách hàng sang framework có SSR. Cấu trúc `features/` giữ nguyên nên chi phí chuyển đổi thấp.
- Đặt sẵn `document.title`, thẻ meta cơ bản, `robots.txt`, `sitemap.xml` (sinh từ danh sách món), thẻ Open Graph.

### 10.7 CI/CD và vận hành

- GitHub Actions: cài đặt, lint, kiểm tra kiểu, test, build. Chỉ khi qua hết mới cho hợp nhánh chính.
- Cloudflare Pages tự triển khai khi nhánh chính đổi, bản xem thử theo pull request.
- Theo dõi lỗi phía trình duyệt bằng Sentry (hoặc tương đương), số liệu truy cập bằng Cloudflare Web Analytics.
- Có thể thêm PWA (manifest và service worker) để khách "cài" web lên màn hình điện thoại. Thanh điều hướng dưới và thiết kế mobile-first của prototype đã phù hợp.

### 10.8 Chạy trên VPS (thay thế Cloudflare Pages)

`deploy/docker/Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
```

`deploy/docker/nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location / { try_files $uri /index.html; }   # SPA: đường dẫn lạ trả về index.html
}
```

Có thể đặt Cloudflare phía trước VPS để có CDN, chống tấn công và HTTPS.

---

## 11. Lộ trình phát triển frontend

| Giai đoạn | Nội dung |
|---|---|
| 0. Khởi tạo | Vite + React + TS, Tailwind, shadcn, cấu trúc thư mục, `tokens.css`, ESLint, CI, MSW, hợp đồng API v0 |
| 1. Nền tảng | Layout User/Admin/Auth, router và guard, Axios + refresh token, đăng nhập/đăng ký, trang lỗi |
| 2. Mua hàng cơ bản | Trang chủ, thực đơn (lọc, tìm), chi tiết món, giỏ hàng (React Query), checkout COD, đặt hàng thành công |
| 3. Sau khi đặt | Lịch sử đơn, theo dõi đơn (polling), hủy đơn, hồ sơ, địa chỉ |
| 4. Admin cơ bản | Dashboard, quản lý đơn (đổi trạng thái), sản phẩm (kèm tải ảnh), danh mục, người dùng |
| 5. Nâng cao | Voucher, VNPay, đánh giá, yêu thích, thông báo, banner, cấu hình, xuất báo cáo |
| 6. Chuẩn bị public | Staging trên Cloudflare Pages, tên miền, CORS/cookie, header bảo mật, tối ưu ảnh, SEO cơ bản, giám sát lỗi |

---

## 12. Ghi chú cho bạn backend (liên quan đến frontend)

- **Múi giờ:** trong `application.yml`, đổi `serverTimezone=UTC` thành `Asia/Ho_Chi_Minh` để giờ đơn không lệch 7 tiếng. API trả thời gian ISO 8601 có múi giờ.
- **`MySQL8Dialect`:** Spring Boot 3 (Hibernate 6) tự nhận MySQL nên bỏ dòng này đi, giữ lại chỉ gây cảnh báo.
- **`ddl-auto=validate`:** Hibernate chỉ kiểm tra khớp schema, không tự sửa bảng. Dùng Flyway (`V1__init.sql`) để tạo và cập nhật schema.
- **Đặt đơn** nên nằm trong một transaction: tính lại tiền, lưu snapshot, trừ kho có điều kiện, tăng `used_count` voucher, ghi `order_status_history`, xóa giỏ. Hủy đơn phải hoàn lại kho và lượt voucher.
- **VNPay:** chỉ tin IPN từ VNPay để cập nhật `payments` và `orders.payment_status`. Local cần ngrok để nhận IPN.
- **Trang kết quả thanh toán** ở frontend chỉ hỏi lại server trạng thái đơn, không dựa vào tham số trên URL.
- **Refresh token** lưu bản băm vào `user_tokens.token`.

---

## 13. Việc cần chốt

| Câu hỏi | Với ai |
|---|---|
| Phí ship miễn phí so sánh trước hay sau khi trừ voucher? | Backend |
| Backend trả về `reviewCount` cho món hay frontend tự đếm? | Backend |
| Refresh token: cookie `httpOnly` hay gửi trong body? | Backend |
| Ảnh: dùng dịch vụ nào (Cloudinary, R2, thư mục local) và endpoint tải ảnh như thế nào? | Backend |
| Định dạng phân trang, định dạng lỗi (mục 7.1) | Backend |
| Có bật OpenAPI (springdoc) để sinh kiểu dữ liệu không? | Backend |
| Chỉ làm COD trước hay làm luôn VNPay? | Cả nhóm |
| Có làm đăng nhập Google/Facebook và chat không (cần đổi schema)? | Cả nhóm, giảng viên |
| Tên miền và nhà cung cấp máy chủ khi lên public | Cả nhóm |
