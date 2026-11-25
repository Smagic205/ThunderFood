# Báo Cáo Kết Quả Kiểm Thử Hệ Thống ThunderFood

**Ngày thực hiện:** 25/11/2026  
**Phạm vi:** Backend Spring Boot (`backend_thunderfood`) & tổng hợp hiện trạng Frontend (`frontend`)  
**Lệnh thực thi Backend:** `mvn -o test` (JDK 22, Spring Boot `4.1.1`, Profile `test`, H2 `MODE=MySQL` + `ThunderFoodTestHikariPool`)

---

## 1. Tổng Quan Kết Quả Thực Thi (Backend)

| Nhóm kiểm thử | Số Test Suite | Số Test Case | Pass | Fail | Error | Skipped | Thời gian (Surefire) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Khởi tạo Spring Context (`BackendThunderfoodApplicationTests`) | 1 | 1 | 1 | 0 | 0 | 0 | 9.311 s |
| Kiểm thử tích hợp (`integration.*IntegrationTest`) | 5 | 5 | 5 | 0 | 0 | 0 | 4.945 s |
| Unit Test tầng Controller (`controller.*Test`) | 21 | 108 | 108 | 0 | 0 | 0 | 4.212 s |
| Unit Test tầng Service (`service.*Test`) | 15 | 171 | 171 | 0 | 0 | 0 | 3.649 s |
| Unit Test tầng Utility (`util.*Test`) | 2 | 5 | 5 | 0 | 0 | 0 | 0.004 s |
| **Tổng cộng** | **44** | **290** | **290** | **0** | **0** | **0** | **22.121 s** |

* **Trạng thái Maven Build:** `BUILD SUCCESS` (tổng thời gian build & test: `35.753 s`).
* **Lưu ý Frontend (`frontend/`):** Dự án có 11 file test Vitest (`apps/admin/src/test/AdminRoute.test.tsx` và 10 file trong `apps/web/src/test/`). Tại máy local hiện chưa cài `frontend/node_modules` (`vitest` chưa khả dụng); các bài test này được cấu hình chạy tự động trên CI tại `.github/workflows/frontend-ci.yml`.

---

## 2. Chi Tiết 05 Kịch Bản Kiểm Thử Tích Hợp (Integration Tests)

Tất cả 05 kịch bản chạy xuyên suốt `@SpringBootTest` + `@AutoConfigureMockMvc` + `SecurityFilterChain` + `JwtAuthenticationFilter` + `Service (@Transactional)` + `JPA/Hibernate` + `H2 (MODE=MySQL)` thông qua lớp nền `BaseIntegrationTest` (chỉ mock `EmailService` để không gửi SMTP thật ra ngoài).

| Mã | Class kiểm thử | Luồng nghiệp vụ & Endpoint kiểm chứng | Xác thực Database & Kết quả | Trạng thái |
| --- | --- | --- | --- | --- |
| **IT-01** | `AuthAndSecurityIntegrationTest` | `POST /api/v1/auth/register` → Login khi `UNVERIFIED` → `POST /api/v1/auth/verify-email` → `POST /api/v1/auth/login` → `GET /api/v1/cart` (không token) → `GET /api/v1/admin/dashboard/summary` (token `CUSTOMER` vs `ADMIN`) → `POST /api/v1/auth/logout` → `POST /api/v1/auth/refresh-token` | Kiểm chứng mật khẩu băm BCrypt trong `users.password_hash`, chặn chưa kích hoạt `403`, chặn không token `401`, chặn sai role `403`, thu hồi `UserToken` khi logout (`0.494 s`) | **PASS** |
| **IT-02** | `ProductSearchFilterPaginationIntegrationTest` | Seed đa danh mục/giá/rating/trạng thái → `GET /api/v1/products?keyword=Gà&categorySlug=burger&priceRange=m100&ratingRange=above4&hasDiscount=true&sort=priceAsc&page=1&size=2` và `page=2` | Kiểm chứng `JpaSpecificationExecutor` lọc đúng điều kiện, loại món `isAvailable=false`, sắp xếp tăng dần theo giá và trả đúng `PaginationInfo` (`totalElements=3`, `totalPages=2`) (`0.076 s`) | **PASS** |
| **IT-03** | `CartAndOrderCheckoutIntegrationTest` | `POST /api/v1/cart/items` → `POST /api/v1/orders/checkout/preview` (áp 2 voucher `GIAM15K` + `SHIP10K` + phí ship `ServiceWard`) → `POST /api/v1/orders/checkout` → `POST /api/v1/orders/{id}/cancel` | Kiểm chứng tính tiền (`120.000 - 15.000 + 10.000 = 115.000đ`), trừ tồn kho (`10 -> 8`), tăng `soldCount` (`5 -> 7`), xóa `cart_items`, ghi `VoucherUsage` & `OrderStatusHistory`, hủy đơn hoàn kho về `10` (`0.356 s`) | **PASS** |
| **IT-04** | `StaffOrderDeliveryWorkflowIntegrationTest` | `GET /api/v1/staff/orders?district=Đống Đa&ward=Trung Tự&status=PENDING` → `POST /api/v1/staff/orders/{id}/confirm` → `POST /api/v1/staff/orders/packages/{packageId}/claim` → `POST /api/v1/staff/orders/{id}/deliver` | Kiểm chứng lọc địa bàn đa cấp, tạo gói `DeliveryPackage`, chuyển trạng thái `PENDING -> CONFIRMED -> DELIVERING -> DELIVERED`, tự thu COD `PAID` và đóng gói `COMPLETED` (`0.312 s`) | **PASS** |
| **IT-05** | `AdminProductAndDashboardIntegrationTest` | `POST /api/v1/admin/products` (dữ liệu sai `@Valid` → `400`, dữ liệu hợp lệ → `201`) → `PUT /api/v1/admin/products/{id}` → Khách thêm giỏ → Admin `DELETE /api/v1/admin/products/{id}` → `GET /api/v1/admin/dashboard/summary` | Kiểm chứng `GlobalExceptionHandler`, xóa mềm chuyển `isAvailable=false` và tự xóa khỏi `cart_items` của khách, Dashboard tính đúng doanh thu `250.000đ` từ đơn `DELIVERED` (`3.707 s`) | **PASS** |

---

## 3. Lỗi Đã Phát Hiện & Cách Khắc Phục (Bug Log)

### 3.1. Lỗi phát hiện trực tiếp khi xây dựng & chạy Integration Test

| Mã lỗi | Mô tả lỗi phát hiện | Nguyên nhân gốc rễ | Giải pháp khắc phục & File đã sửa | Trạng thái |
| --- | --- | --- | --- | --- |
| **BUG-01** | `BackendThunderfoodApplicationTests` lỗi `Communications link failure` (`11.94 s`) khi chạy test độc lập | Chưa có `src/test/resources` và DB in-memory cho test nên `@SpringBootTest` cố kết nối MySQL `localhost:3306` | Thêm `h2` (`scope=test`) và `spring-boot-starter-webmvc-test` vào `pom.xml`; tạo `src/test/resources/application-test.yaml` (H2 `MODE=MySQL` + `ThunderFoodTestHikariPool`); gắn `@ActiveProfiles("test")` | **Đã sửa & Pass** |
| **BUG-02** | Tài khoản `UNVERIFIED` (hoặc `LOCKED`) đăng nhập bị trả HTTP `400` với `"User is disabled"` thay vì HTTP `403` và thông báo tiếng Việt `"chưa được kích hoạt"` | `UserDetailsImpl.isEnabled()` trả `false` với `UNVERIFIED`, khiến `DaoAuthenticationProvider` ném `DisabledException` trước đoạn check trạng thái ở `AuthServiceImpl.login()`; `GlobalExceptionHandler` không bắt riêng nên rơi vào `RuntimeException` (`400`), làm Frontend `LoginPage.tsx` không hiện nút gửi lại email kích hoạt | Thêm `authenticateCredentials()` trong `AuthServiceImpl.java` bắt `DisabledException` & `LockedException` và ném `AccessDeniedException` với thông báo tiếng Việt chuẩn cho cả `login()` và `loginStaff()` | **Đã sửa & Pass** |
| **BUG-03** | Lỗi `IncorrectResultSizeDataAccessException: Query did not return a unique result: 2 results were returned` khi `verify-email` và `login` chạy liên tiếp trong cùng 1 giây | `JwtServiceImpl.buildToken()` chỉ dùng `sub`, `iat`, `exp` (độ chính xác theo giây của JWT `NumericDate`) nên 2 lần cấp Refresh Token trong cùng 1 giây cho cùng user sinh ra 2 chuỗi JWT giống hệt nhau, lưu trùng vào `user_tokens` | Bổ sung JWT ID duy nhất `.setId(UUID.randomUUID().toString())` trong `JwtServiceImpl.buildToken()` | **Đã sửa & Pass** |
| **BUG-04** | Lỗi `ClassCastException: Integer cannot be cast to Double` trong JSON assertion `BigDecimal` của Integration Test | Hamcrest `comparesEqualTo(120000)` truyền `Integer` trong khi Jackson/JsonPath đọc số thập phân `120000.00` thành `Double` | So sánh thông qua `BigDecimal.isEqualByComparingTo(...)` từ `JsonNode` trong `CartAndOrderCheckoutIntegrationTest` và `AdminProductAndDashboardIntegrationTest` | **Đã sửa & Pass** |

### 3.2. Lỗi kỹ thuật đã khắc phục trước đó được ghi nhận trong mã nguồn

| Mã lỗi | Vấn đề kỹ thuật | Cách khắc phục trong mã nguồn |
| --- | --- | --- |
| **CODE-01** | Hibernate sinh `FOR UPDATE OF <alias>` gây lỗi cú pháp trên TiDB Cloud khi khóa tồn kho | Viết `nativeQuery = true` (`SELECT * FROM ... FOR UPDATE`) tại `ProductRepository`, `OrderRepository`, `DeliveryPackageRepository` |
| **CODE-02** | Lỗi Hibernate `A collection with orphan deletion was no longer referenced` khi cập nhật `Order.items` lúc đặt hàng | Giữ nguyên collection hiện tại, gọi `savedOrder.getItems().clear()` rồi `addAll(savedItems)` trong `OrderServiceImpl.placeOrder()` |
| **CODE-03** | Gõ dấu tiếng Việt (IME) ở thanh tìm kiếm kích hoạt debounce sớm và làm nhảy ký tự | Dùng cờ `isComposing` (`onCompositionStart`/`onCompositionEnd`) kết hợp debounce 250–300ms ở `MenuPage.tsx` và `Header.tsx` |
| **CODE-04** | Nhiều API gặp `401` đồng thời gọi lặp `/v1/auth/refresh-token` | Dùng biến khóa `refreshTokenPromise` chia sẻ chung 1 lời gọi refresh trong `axiosClient.ts` |

---

## 4. Kết Luận

* Cấu hình **HikariCP Connection Pool** (`ThunderFoodHikariPool`) đã được khai báo tường minh trong `application.yaml` và xác nhận hoạt động qua log khởi động Spring Boot.
* Toàn bộ **290 bài kiểm thử Backend** (gồm **44 test suite**: 1 context test, **05 Integration Test** xuyên suốt Security–Controller–Service–DB và 38 Unit Test suite) đều **Pass 100% (`Failures: 0, Errors: 0, Skipped: 0`)** sau lần chỉnh sửa cuối cùng.
