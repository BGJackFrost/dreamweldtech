# Hướng Dẫn Cấu Hình Biến Môi Trường (.env)

## Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Danh Sách Biến Môi Trường](#danh-sách-biến-môi-trường)
3. [Hướng Dẫn Chi Tiết](#hướng-dẫn-chi-tiết)
4. [File .env Mẫu](#file-env-mẫu)

---

## Tổng Quan

File `.env` chứa các biến môi trường cần thiết để chạy ứng dụng DreamWeldTech. Bạn cần tạo file này trên server production với các giá trị phù hợp.

### Cách Tạo File .env

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
nano .env
```

Sau đó sao chép nội dung từ mẫu bên dưới và điền các giá trị.

---

## Danh Sách Biến Môi Trường

### Biến Bắt Buộc (Required)

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `DATABASE_URL` | Connection string MySQL | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | Secret key cho JWT (64 ký tự) | `a1b2c3d4...` |
| `SENDGRID_API_KEY` | API key từ SendGrid | `SG.xxx...` |
| `VITE_RECAPTCHA_SITE_KEY` | reCAPTCHA site key | `6Lxxx...` |
| `RECAPTCHA_SECRET_KEY` | reCAPTCHA secret key | `6Lxxx...` |

### Biến Tùy Chọn (Optional)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `NODE_ENV` | Môi trường | `production` |
| `PORT` | Port server | `3000` |
| `VITE_APP_URL` | URL website | `https://dreamweldtech.vn` |
| `ADMIN_EMAIL` | Email admin | `admin@dreamweldtech.vn` |
| `SLACK_WEBHOOK_URL` | Slack webhook | (không có) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | (không có) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | (không có) |

---

## Hướng Dẫn Chi Tiết

### 1. DATABASE_URL

**Cách lấy:** Tạo database trong Plesk và lấy thông tin kết nối.

**Format:**
```
mysql://[username]:[password]@[host]:[port]/[database_name]
```

**Ví dụ:**
```
DATABASE_URL=mysql://dreamweldtech_user:MyP@ssw0rd123@localhost:3306/dreamweldtech_db
```

### 2. JWT_SECRET

**Cách tạo:** Chạy lệnh sau trong terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Kết quả mẫu:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 3. SENDGRID_API_KEY

**Cách lấy:**

1. Đăng ký tài khoản tại [sendgrid.com](https://sendgrid.com)
2. Vào **Settings** → **API Keys**
3. Click **Create API Key**
4. Chọn **Full Access** hoặc **Restricted Access** với quyền Mail Send
5. Sao chép API key (bắt đầu bằng `SG.`)

**Lưu ý:** API key chỉ hiển thị một lần, hãy lưu lại ngay.

### 4. RECAPTCHA Keys

**Cách lấy:**

1. Truy cập [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Click **+** để tạo site mới
3. Điền thông tin:
   - **Label:** DreamWeldTech
   - **reCAPTCHA type:** reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains:** dreamweldtech.vn, www.dreamweldtech.vn
4. Click **Submit**
5. Sao chép **Site Key** và **Secret Key**

### 5. SLACK_WEBHOOK_URL (Tùy chọn)

**Cách lấy:**

1. Truy cập [Slack API](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Vào **Incoming Webhooks** → Enable
4. Click **Add New Webhook to Workspace**
5. Chọn channel và sao chép Webhook URL

### 6. TELEGRAM Bot (Tùy chọn)

**Cách tạo Bot:**

1. Mở Telegram, tìm @BotFather
2. Gửi `/newbot`
3. Đặt tên và username cho bot
4. Sao chép **Bot Token**

**Cách lấy Chat ID:**

1. Thêm bot vào group hoặc gửi tin nhắn cho bot
2. Truy cập: `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Tìm `"chat":{"id":...}` và sao chép ID

---

## File .env Mẫu

Sao chép toàn bộ nội dung bên dưới vào file `.env`:

```env
# =====================================================
# DATABASE CONFIGURATION (BẮT BUỘC)
# =====================================================
DATABASE_URL=mysql://dreamweldtech_user:YOUR_PASSWORD@localhost:3306/dreamweldtech_db

# =====================================================
# APPLICATION SETTINGS
# =====================================================
NODE_ENV=production
PORT=3000
VITE_APP_URL=https://dreamweldtech.vn
VITE_APP_TITLE=Dreamweldtech - Giải Pháp Công Nghệ Laser Hàng Đầu
VITE_APP_LOGO=/images/logo.png
VITE_APP_ID=dreamweldtech

# =====================================================
# AUTHENTICATION (BẮT BUỘC)
# =====================================================
# Tạo bằng lệnh: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=THAY_BANG_CHUOI_64_KY_TU_NGAU_NHIEN

# =====================================================
# EMAIL - SENDGRID (BẮT BUỘC)
# =====================================================
SENDGRID_API_KEY=SG.THAY_BANG_API_KEY_CUA_BAN
SENDGRID_FROM_EMAIL=noreply@dreamweldtech.vn
SENDGRID_FROM_NAME=Dreamweldtech
ADMIN_EMAIL=admin@dreamweldtech.vn
ADMIN_ALERT_EMAIL=admin@dreamweldtech.vn

# =====================================================
# RECAPTCHA (BẮT BUỘC)
# =====================================================
VITE_RECAPTCHA_SITE_KEY=6LTHAY_BANG_SITE_KEY
RECAPTCHA_SECRET_KEY=6LTHAY_BANG_SECRET_KEY

# =====================================================
# ANALYTICS (TÙY CHỌN)
# =====================================================
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
VITE_GA_MEASUREMENT_ID=

# =====================================================
# MAPS - FORGE API (TÙY CHỌN)
# =====================================================
VITE_FRONTEND_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
BUILT_IN_FORGE_API_URL=

# =====================================================
# PUSH NOTIFICATIONS (TÙY CHỌN)
# =====================================================
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@dreamweldtech.vn

# =====================================================
# SLACK NOTIFICATIONS (TÙY CHỌN)
# =====================================================
SLACK_WEBHOOK_URL=

# =====================================================
# TELEGRAM NOTIFICATIONS (TÙY CHỌN)
# =====================================================
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# =====================================================
# OAUTH (TÙY CHỌN)
# =====================================================
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
OWNER_NAME=Admin
OWNER_OPEN_ID=
OWNER_EMAIL=
```

---

## Checklist Cấu Hình

Sau khi tạo file `.env`, kiểm tra các mục sau:

- [ ] `DATABASE_URL` đã điền đúng thông tin database
- [ ] `JWT_SECRET` đã tạo chuỗi ngẫu nhiên 64 ký tự
- [ ] `SENDGRID_API_KEY` đã lấy từ SendGrid
- [ ] `VITE_RECAPTCHA_SITE_KEY` đã lấy từ Google reCAPTCHA
- [ ] `RECAPTCHA_SECRET_KEY` đã lấy từ Google reCAPTCHA
- [ ] `ADMIN_EMAIL` đã điền email nhận thông báo

---

## Kiểm Tra Cấu Hình

Sau khi tạo file `.env`, chạy các lệnh sau để kiểm tra:

```bash
# Kiểm tra file .env tồn tại
ls -la .env

# Kiểm tra nội dung (ẩn password)
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v API_KEY

# Test database connection
npm run db:push

# Build project
npm run build
```

---

## Lưu Ý Bảo Mật

1. **KHÔNG** commit file `.env` lên Git
2. **KHÔNG** chia sẻ API keys công khai
3. **Thay đổi** `JWT_SECRET` định kỳ
4. **Sử dụng** password mạnh cho database
5. **Giới hạn** quyền truy cập file `.env`:
   ```bash
   chmod 600 .env
   ```

---

**Tạo bởi Manus AI - Tháng 1, 2026**
