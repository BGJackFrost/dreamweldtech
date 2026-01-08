# Hướng Dẫn Chạy DreamWeldTech Trên Máy Local

**Phiên bản:** 1.0  
**Ngày cập nhật:** 08/01/2026

---

## Mục Lục

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Cài Đặt Công Cụ Cần Thiết](#2-cài-đặt-công-cụ-cần-thiết)
3. [Clone Dự Án](#3-clone-dự-án)
4. [Cấu Hình Database](#4-cấu-hình-database)
5. [Cấu Hình Biến Môi Trường](#5-cấu-hình-biến-môi-trường)
6. [Chạy Ứng Dụng](#6-chạy-ứng-dụng)
7. [Cập Nhật Nội Dung Website](#7-cập-nhật-nội-dung-website)
8. [Xử Lý Lỗi Thường Gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu Cầu Hệ Thống

| Thành phần | Phiên bản tối thiểu | Ghi chú |
|------------|---------------------|---------|
| Node.js | 18.x trở lên | Khuyến nghị 20.x |
| pnpm | 8.x trở lên | Package manager |
| PostgreSQL | 14.x trở lên | Database |
| Git | 2.x trở lên | Version control |

### Kiểm Tra Phiên Bản

```bash
node -v      # Kiểm tra Node.js
pnpm -v      # Kiểm tra pnpm
psql --version  # Kiểm tra PostgreSQL
git --version   # Kiểm tra Git
```

---

## 2. Cài Đặt Công Cụ Cần Thiết

### 2.1. Cài Đặt Node.js

**Windows:**
1. Tải từ [nodejs.org](https://nodejs.org/) (chọn LTS version)
2. Chạy installer và làm theo hướng dẫn

**macOS:**
```bash
# Sử dụng Homebrew
brew install node

# Hoặc sử dụng NVM (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

**Linux (Ubuntu/Debian):**
```bash
# Sử dụng NVM (khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 2.2. Cài Đặt pnpm

```bash
# Cài đặt pnpm globally
npm install -g pnpm

# Kiểm tra
pnpm -v
```

### 2.3. Cài Đặt PostgreSQL

**Windows:**
1. Tải từ [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Chạy installer, ghi nhớ password cho user `postgres`
3. Mặc định port: 5432

**macOS:**
```bash
# Sử dụng Homebrew
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.4. Cài Đặt Git

**Windows:**
Tải từ [git-scm.com](https://git-scm.com/download/win)

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

---

## 3. Clone Dự Án

### 3.1. Clone Từ GitHub

```bash
# Clone repository
git clone https://github.com/BGJackFrost/BGJackFrost.git dreamweldtech

# Di chuyển vào thư mục dự án
cd dreamweldtech
```

### 3.2. Cài Đặt Dependencies

```bash
# Cài đặt tất cả packages
pnpm install
```

---

## 4. Cấu Hình Database

### 4.1. Tạo Database

**Sử dụng Terminal/Command Line:**

```bash
# Đăng nhập PostgreSQL (Windows: mở SQL Shell hoặc pgAdmin)
# Linux/macOS:
sudo -u postgres psql

# Tạo database
CREATE DATABASE dreamweldtech;

# Tạo user (tùy chọn)
CREATE USER dreamweld WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE dreamweldtech TO dreamweld;

# Thoát
\q
```

**Sử dụng pgAdmin (GUI):**
1. Mở pgAdmin
2. Click chuột phải vào "Databases" → "Create" → "Database"
3. Nhập tên: `dreamweldtech`
4. Click "Save"

### 4.2. Phương Án Thay Thế: Sử Dụng Database Cloud (Miễn Phí)

Nếu không muốn cài PostgreSQL local, bạn có thể dùng:

**Neon (Khuyến nghị):**
1. Đăng ký tại [neon.tech](https://neon.tech)
2. Tạo project mới
3. Copy connection string

**Supabase:**
1. Đăng ký tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Vào Settings → Database → Connection string

---

## 5. Cấu Hình Biến Môi Trường

### 5.1. Tạo File .env

```bash
# Copy file mẫu
cp .env.example .env
```

### 5.2. Chỉnh Sửa File .env

Mở file `.env` bằng text editor (VS Code, Notepad++, etc.) và cập nhật:

```env
# ===== CẤU HÌNH BẮT BUỘC =====

# Database - Thay đổi theo cấu hình của bạn
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dreamweldtech

# Nếu dùng Neon:
# DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dreamweldtech?sslmode=require

# JWT Secret - Tạo chuỗi ngẫu nhiên ít nhất 32 ký tự
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# App Info
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech

# ===== CẤU HÌNH TÙY CHỌN =====

# Server
NODE_ENV=development
PORT=3000

# Email (để trống nếu không cần test email)
SENDGRID_API_KEY=
ADMIN_ALERT_EMAIL=

# Telegram (để trống nếu không cần)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# OAuth (để trống nếu không cần)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
```

### 5.3. Chạy Database Migration

```bash
# Push schema lên database
pnpm db:push
```

---

## 6. Chạy Ứng Dụng

### 6.1. Chế Độ Development (Khuyến nghị khi chỉnh sửa)

```bash
# Chạy development server
pnpm dev
```

Ứng dụng sẽ chạy tại: **http://localhost:3000**

**Đặc điểm:**
- Hot reload - tự động refresh khi thay đổi code
- Hiển thị lỗi chi tiết
- Source maps cho debugging

### 6.2. Chế Độ Production (Test trước khi deploy)

```bash
# Build ứng dụng
pnpm build

# Chạy production server
pnpm start
```

### 6.3. Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:

| URL | Mô tả |
|-----|-------|
| http://localhost:3000 | Trang chủ |
| http://localhost:3000/admin | Trang quản trị (cần đăng nhập) |
| http://localhost:3000/api/health | Health check endpoint |

---

## 7. Cập Nhật Nội Dung Website

### 7.1. Cấu Trúc Thư Mục Quan Trọng

```
dreamweldtech/
├── client/
│   ├── src/
│   │   ├── pages/           # Các trang của website
│   │   │   ├── Home.tsx     # Trang chủ
│   │   │   ├── About.tsx    # Giới thiệu
│   │   │   ├── Products.tsx # Sản phẩm
│   │   │   ├── Contact.tsx  # Liên hệ
│   │   │   └── admin/       # Các trang admin
│   │   ├── components/      # Components tái sử dụng
│   │   └── lib/             # Utilities
│   ├── public/              # Static files (images, fonts)
│   └── index.html           # HTML template
├── server/                  # Backend code
├── shared/                  # Shared types và constants
└── drizzle/                 # Database schema
```

### 7.2. Cập Nhật Thông Tin Công Ty

**File: `shared/const.ts`**
```typescript
export const COMPANY_INFO = {
  name: "DreamWeldTech",
  phone: "+84 123 456 789",
  email: "contact@dreamweldtech.com",
  address: "123 Đường ABC, Quận XYZ, TP.HCM",
  // ... cập nhật thông tin khác
};
```

### 7.3. Cập Nhật Nội Dung Trang Chủ

**File: `client/src/pages/Home.tsx`**

Tìm và chỉnh sửa các phần:
- Hero section (banner chính)
- Giới thiệu công ty
- Danh sách sản phẩm nổi bật
- Testimonials
- Call to action

### 7.4. Cập Nhật Hình Ảnh

1. Đặt hình ảnh vào thư mục `client/public/images/`
2. Sử dụng trong code:

```tsx
<img src="/images/your-image.jpg" alt="Mô tả" />
```

### 7.5. Cập Nhật Sản Phẩm

**Qua Admin Panel:**
1. Truy cập http://localhost:3000/admin
2. Đăng nhập với tài khoản admin
3. Vào mục "Quản lý sản phẩm"
4. Thêm/sửa/xóa sản phẩm

**Qua Database:**
```bash
# Mở database studio
pnpm db:studio
```
Truy cập http://localhost:4983 để quản lý dữ liệu trực tiếp

### 7.6. Cập Nhật Menu Navigation

**File: `client/src/components/Header.tsx`** hoặc **`Navbar.tsx`**

```tsx
const menuItems = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/about" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Tin tức", href: "/news" },
  { label: "Liên hệ", href: "/contact" },
];
```

### 7.7. Cập Nhật Footer

**File: `client/src/components/Footer.tsx`**

Chỉnh sửa:
- Thông tin liên hệ
- Links mạng xã hội
- Bản quyền

### 7.8. Cập Nhật SEO

**File: `client/index.html`**
```html
<head>
  <title>DreamWeldTech - Giải Pháp Công Nghệ Laser</title>
  <meta name="description" content="Mô tả website của bạn" />
  <meta name="keywords" content="laser, welding, công nghệ hàn" />
</head>
```

---

## 8. Xử Lý Lỗi Thường Gặp

### 8.1. Lỗi Kết Nối Database

**Lỗi:** `ECONNREFUSED 127.0.0.1:5432`

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
# Windows: Services → postgresql-x64-15
# Linux/macOS:
sudo systemctl status postgresql

# Khởi động nếu chưa chạy
sudo systemctl start postgresql
```

### 8.2. Lỗi Port Đã Được Sử Dụng

**Lỗi:** `EADDRINUSE: address already in use :::3000`

**Giải pháp:**
```bash
# Tìm process đang dùng port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS:
lsof -i :3000
kill -9 <PID>

# Hoặc đổi port trong .env
PORT=3001
```

### 8.3. Lỗi Module Not Found

**Lỗi:** `Cannot find module 'xxx'`

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
pnpm install
```

### 8.4. Lỗi Database Migration

**Lỗi:** `relation "xxx" does not exist`

**Giải pháp:**
```bash
# Chạy lại migration
pnpm db:push

# Nếu vẫn lỗi, reset database
pnpm db:push --force
```

### 8.5. Lỗi TypeScript

**Lỗi:** `Type error: xxx`

**Giải pháp:**
```bash
# Kiểm tra lỗi TypeScript
pnpm typecheck

# Hoặc
npx tsc --noEmit
```

---

## Tóm Tắt Các Lệnh Thường Dùng

| Lệnh | Mô tả |
|------|-------|
| `pnpm install` | Cài đặt dependencies |
| `pnpm dev` | Chạy development server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy production server |
| `pnpm db:push` | Đồng bộ database schema |
| `pnpm db:studio` | Mở database GUI |
| `pnpm typecheck` | Kiểm tra TypeScript |
| `pnpm test` | Chạy unit tests |

---

## Workflow Cập Nhật Nội Dung

```
1. Chạy dev server: pnpm dev
         ↓
2. Mở browser: http://localhost:3000
         ↓
3. Chỉnh sửa code (tự động refresh)
         ↓
4. Kiểm tra trên browser
         ↓
5. Lặp lại bước 3-4 cho đến khi hoàn thành
         ↓
6. Build và test: pnpm build && pnpm start
         ↓
7. Commit và push lên GitHub
         ↓
8. Deploy lên production
```

---

**Chúc bạn thành công!**

Nếu gặp vấn đề, hãy kiểm tra:
1. Console trong terminal (nơi chạy `pnpm dev`)
2. Console trong browser (F12 → Console)
3. Network tab trong browser DevTools

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 08/01/2026*
