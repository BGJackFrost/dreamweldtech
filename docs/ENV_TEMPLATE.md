# Hướng Dẫn Cấu Hình Biến Môi Trường (.env)

Tạo file `.env` trong thư mục gốc dự án với nội dung sau:

---

## File .env Mẫu

```env
# ============================================
# DREAMWELDTECH - ENVIRONMENT CONFIGURATION
# ============================================

# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000

# ============================================
# DATABASE - MySQL (BẮT BUỘC)
# ============================================
# Format: mysql://username:password@host:port/database
#
# Ví dụ LOCAL (Windows/Mac):
# DATABASE_URL=mysql://root:password123@localhost:3306/dreamweldtech
#
# Ví dụ MẮT BÃO (cPanel):
# DATABASE_URL=mysql://mbxxxx_user:password@localhost:3306/mbxxxx_dreamweldtech
#
DATABASE_URL=mysql://root:your_password@localhost:3306/dreamweldtech

# ============================================
# AUTHENTICATION (BẮT BUỘC)
# ============================================
# JWT Secret - Tạo chuỗi ngẫu nhiên ít nhất 32 ký tự
# Có thể tạo tại: https://generate-secret.vercel.app/32
#
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# ============================================
# APPLICATION INFO (BẮT BUỘC)
# ============================================
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech

# ============================================
# EMAIL - SendGrid (TÙY CHỌN)
# ============================================
# Đăng ký miễn phí tại: https://sendgrid.com
# Free tier: 100 emails/ngày
# Để trống nếu không cần gửi email
#
SENDGRID_API_KEY=
ADMIN_ALERT_EMAIL=admin@dreamweldtech.com

# ============================================
# TELEGRAM NOTIFICATIONS (TÙY CHỌN)
# ============================================
# Tạo bot tại: https://t.me/BotFather
# Lấy chat_id bằng cách gửi tin nhắn cho bot và truy cập:
# https://api.telegram.org/bot<TOKEN>/getUpdates
#
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ============================================
# RECAPTCHA (TÙY CHỌN)
# ============================================
# Đăng ký tại: https://www.google.com/recaptcha/admin
# Chọn reCAPTCHA v2 "I'm not a robot"
#
VITE_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# ============================================
# SLACK NOTIFICATIONS (TÙY CHỌN)
# ============================================
# Tạo Incoming Webhook tại: https://api.slack.com/messaging/webhooks
#
SLACK_WEBHOOK_URL=
```

---

## Hướng Dẫn Từng Bước

### 1. Tạo File .env

**Windows (Command Prompt):**
```cmd
cd C:\path\to\dreamweldtech
copy NUL .env
notepad .env
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\dreamweldtech
New-Item -Path .env -ItemType File
notepad .env
```

**macOS/Linux:**
```bash
cd /path/to/dreamweldtech
touch .env
nano .env
```

### 2. Copy Nội Dung

Copy toàn bộ nội dung trong phần **File .env Mẫu** ở trên vào file `.env`

### 3. Cập Nhật Giá Trị

Thay đổi các giá trị sau:

| Biến | Giá trị cần thay đổi |
|------|---------------------|
| `DATABASE_URL` | Thay `your_password` bằng password MySQL của bạn |
| `JWT_SECRET` | Tạo chuỗi ngẫu nhiên 32+ ký tự |

### 4. Kiểm Tra

Sau khi lưu file, chạy:

```bash
pnpm db:push
pnpm dev
```

---

## Ví Dụ Cụ Thể

### Cấu hình cho Local Development (Windows)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:DreamWeld2024@localhost:3306/dreamweldtech
JWT_SECRET=my-super-secret-key-for-development-only-32chars
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech
```

### Cấu hình cho Mắt Bão (Production)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://mb12345_dreamweld:SecurePass123!@localhost:3306/mb12345_dreamweldtech
JWT_SECRET=production-secret-key-very-long-and-random-string-here
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
ADMIN_ALERT_EMAIL=admin@dreamweldtech.vn
```

---

## Lưu Ý Quan Trọng

1. **KHÔNG commit file .env lên Git** - File này chứa thông tin nhạy cảm
2. **Mỗi môi trường cần file .env riêng** - Local, staging, production
3. **Password MySQL không được chứa ký tự đặc biệt** như `@`, `#`, `$` trong URL (hoặc phải encode)
4. **JWT_SECRET phải khác nhau** giữa development và production

---

## Xử Lý Lỗi

### Lỗi: "DATABASE_URL is required"

File `.env` chưa được tạo hoặc không đúng vị trí. Đảm bảo file `.env` nằm trong thư mục gốc dự án (cùng cấp với `package.json`).

### Lỗi: "Access denied for user"

Password trong `DATABASE_URL` không đúng. Kiểm tra lại password MySQL.

### Lỗi: "Unknown database"

Database chưa được tạo. Chạy lệnh SQL:
```sql
CREATE DATABASE dreamweldtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

*Tài liệu này được tạo bởi Manus AI*
