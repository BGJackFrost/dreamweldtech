# Hướng Dẫn Deploy Dreamweldtech.vn

## Tổng Quan

Tài liệu này hướng dẫn cách deploy website Dreamweldtech lên domain **dreamweldtech.vn** sử dụng Manus Hosting.

## Bước 1: Chuẩn Bị Trước Deploy

### 1.1 Kiểm Tra Cấu Hình

Đảm bảo các biến môi trường đã được cấu hình đúng:

| Biến | Mô tả | Trạng thái |
|------|-------|------------|
| `SENDGRID_API_KEY` | API key SendGrid để gửi email | ✅ Đã cấu hình |
| `VITE_RECAPTCHA_SITE_KEY` | Site key cho Google reCAPTCHA | ✅ Đã cấu hình |
| `RECAPTCHA_SECRET_KEY` | Secret key cho reCAPTCHA verification | ✅ Đã cấu hình |
| `JWT_SECRET` | Secret key cho JWT authentication | ✅ Tự động |
| `DATABASE_URL` | Connection string database | ✅ Tự động |

### 1.2 Kiểm Tra Tính Năng

Trước khi deploy, hãy test các tính năng quan trọng:

1. **Form Liên Hệ**: Gửi form và kiểm tra email notification
2. **Form Ứng Tuyển**: Upload CV và gửi đơn ứng tuyển
3. **Newsletter**: Đăng ký nhận tin
4. **Admin Panel**: Đăng nhập và quản lý nội dung
5. **WebSocket Notifications**: Kiểm tra real-time notifications trong admin

## Bước 2: Tạo Checkpoint

Trước khi publish, cần tạo checkpoint để lưu trạng thái hiện tại:

1. Mở **Management UI** (panel bên phải)
2. Kiểm tra **Preview** để đảm bảo website hoạt động đúng
3. Checkpoint sẽ được tạo tự động khi có thay đổi

## Bước 3: Deploy Lên Manus Hosting

### 3.1 Publish Website

1. Mở **Management UI**
2. Click nút **Publish** ở header (góc phải trên)
3. Chờ quá trình deploy hoàn tất (1-2 phút)

### 3.2 Cấu Hình Domain

Sau khi publish thành công:

1. Vào **Settings** → **Domains** trong Management UI
2. Bạn sẽ thấy domain mặc định: `xxx.manus.space`

#### Option A: Sử Dụng Domain Manus (Miễn Phí)
- Có thể thay đổi prefix `xxx` thành `dreamweldtech`
- Domain sẽ là: `dreamweldtech.manus.space`

#### Option B: Kết Nối Domain Riêng (dreamweldtech.vn)

1. **Mua domain** (nếu chưa có):
   - Có thể mua trực tiếp trong Manus UI
   - Hoặc sử dụng domain đã có từ nhà cung cấp khác

2. **Cấu hình DNS** tại nhà cung cấp domain:
   ```
   Type: CNAME
   Name: @
   Value: dreamweldtech.manus.space
   TTL: 3600
   
   Type: CNAME
   Name: www
   Value: dreamweldtech.manus.space
   TTL: 3600
   ```

3. **Thêm domain vào Manus**:
   - Trong Settings → Domains
   - Click "Add Custom Domain"
   - Nhập: `dreamweldtech.vn`
   - Chờ DNS propagation (có thể mất 24-48 giờ)

### 3.3 Cấu Hình SSL/HTTPS

SSL được cấu hình **tự động** bởi Manus:
- Certificate Let's Encrypt miễn phí
- Auto-renewal trước khi hết hạn
- Force HTTPS redirect

## Bước 4: Cấu Hình Email

### 4.1 Cập Nhật Sender Email

Sau khi có domain riêng, cần cập nhật email sender:

1. Vào **Settings** → **Secrets** trong Management UI
2. Thêm hoặc cập nhật:
   - `FROM_EMAIL`: `noreply@dreamweldtech.vn`
   - `ADMIN_EMAIL`: `admin@dreamweldtech.vn`

### 4.2 Cấu Hình SendGrid Domain Authentication

Để email không bị spam:

1. Đăng nhập [SendGrid Dashboard](https://app.sendgrid.com)
2. Vào **Settings** → **Sender Authentication**
3. Click "Authenticate Your Domain"
4. Chọn DNS host và nhập `dreamweldtech.vn`
5. Thêm các DNS records theo hướng dẫn:
   ```
   Type: CNAME
   Name: em1234.dreamweldtech.vn
   Value: u1234567.wl001.sendgrid.net
   
   Type: CNAME
   Name: s1._domainkey.dreamweldtech.vn
   Value: s1.domainkey.u1234567.wl001.sendgrid.net
   
   Type: CNAME
   Name: s2._domainkey.dreamweldtech.vn
   Value: s2.domainkey.u1234567.wl001.sendgrid.net
   ```

## Bước 5: Monitoring & Analytics

### 5.1 Dashboard

Sau khi deploy, có thể theo dõi:

1. Mở **Management UI** → **Dashboard**
2. Xem các metrics:
   - **UV/PV**: Unique visitors và page views
   - **Status**: Server health
   - **Visibility**: Public/Private

### 5.2 Admin Analytics

Trong Admin Panel (`/admin/analytics`):
- Thống kê liên hệ theo thời gian
- Thống kê đơn ứng tuyển
- Thống kê newsletter subscribers
- Traffic và conversion rates

## Bước 6: Test Production

### 6.1 Checklist Test

| Tính năng | URL | Test |
|-----------|-----|------|
| Trang chủ | `/` | ✅ Load đúng, banner slider hoạt động |
| Sản phẩm | `/products` | ✅ Danh sách và chi tiết sản phẩm |
| Tin tức | `/news` | ✅ Danh sách và chi tiết bài viết |
| Liên hệ | `/contact` | ✅ Form gửi thành công, email notification |
| Tuyển dụng | `/careers` | ✅ Danh sách việc làm, form ứng tuyển |
| Admin | `/admin` | ✅ Đăng nhập, quản lý nội dung |
| WebSocket | Admin Panel | ✅ Real-time notifications |

### 6.2 Test Email Notifications

1. **Test Contact Form**:
   - Gửi form liên hệ từ `/contact`
   - Kiểm tra email admin nhận được notification
   - Kiểm tra email khách hàng nhận được thank you email

2. **Test Job Application**:
   - Gửi đơn ứng tuyển từ `/careers/:slug`
   - Kiểm tra email admin nhận được notification
   - Kiểm tra email ứng viên nhận được confirmation

3. **Test Newsletter**:
   - Đăng ký newsletter từ footer
   - Kiểm tra email welcome được gửi

### 6.3 Test WebSocket

1. Mở Admin Panel trong 2 browser tabs
2. Gửi form liên hệ từ tab khác
3. Kiểm tra notification xuất hiện real-time trong Admin

## Troubleshooting

### Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| SSL không hoạt động | DNS chưa propagate | Chờ 24-48 giờ |
| Email không gửi được | SendGrid chưa verify | Kiểm tra domain authentication |
| WebSocket disconnect | Firewall/Proxy | Kiểm tra network settings |
| 502 Bad Gateway | Server overload | Kiểm tra Dashboard, restart nếu cần |

### Liên Hệ Hỗ Trợ

- **Manus Support**: https://help.manus.im
- **SendGrid Support**: https://support.sendgrid.com

## Cập Nhật Sau Deploy

Khi cần cập nhật website:

1. Thực hiện thay đổi trong Manus
2. Tạo checkpoint mới
3. Click **Publish** để deploy phiên bản mới
4. Rollback nếu có vấn đề bằng cách chọn checkpoint cũ

---

**Lưu ý**: Tài liệu này được tạo cho Dreamweldtech project. Các bước có thể thay đổi tùy theo cập nhật của Manus platform.

**Ngày tạo**: 02/01/2026
**Phiên bản**: 1.0
