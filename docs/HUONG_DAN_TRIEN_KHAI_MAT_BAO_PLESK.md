# Hướng Dẫn Triển Khai DreamWeldTech Lên Mắt Bão (Plesk)

**Phiên bản:** 3.0  
**Ngày cập nhật:** 08/01/2026  
**Dành cho:** Cloud Hosting Mắt Bão sử dụng Plesk Panel

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Chuẩn Bị Trên Máy Local](#2-chuẩn-bị-trên-máy-local)
3. [Tạo Database MySQL](#3-tạo-database-mysql)
4. [Upload Mã Nguồn](#4-upload-mã-nguồn)
5. [Cấu Hình Node.js App](#5-cấu-hình-nodejs-app)
6. [Cài Đặt Dependencies](#6-cài-đặt-dependencies)
7. [Build Ứng Dụng](#7-build-ứng-dụng)
8. [Chạy Database Migration](#8-chạy-database-migration)
9. [Khởi Động Ứng Dụng](#9-khởi-động-ứng-dụng)
10. [Kiểm Tra Và Xử Lý Lỗi](#10-kiểm-tra-và-xử-lý-lỗi)
11. [Cập Nhật Sau Này](#11-cập-nhật-sau-này)

---

## 1. Tổng Quan

### Thông tin cấu hình của bạn

| Thông tin | Giá trị |
|-----------|---------|
| Domain | dreamweldtech.vn |
| Document Root | /httpdocs/dreamweldtech |
| Node.js Version | 24.12.0 |
| Database | MySQL |
| Panel | Plesk |

### Cấu trúc thư mục sau khi triển khai

```
/httpdocs/
└── dreamweldtech/           ← Application Root
    ├── client/              ← Frontend source
    ├── server/              ← Backend source
    ├── shared/              ← Shared code
    ├── drizzle/             ← Database schema
    ├── dist/                ← Build output
    │   ├── index.js         ← Server file (Startup File)
    │   └── public/          ← Static files (Document Root)
    │       ├── index.html
    │       ├── assets/
    │       └── images/
    ├── node_modules/
    ├── package.json
    └── .env                 ← Environment variables
```

---

## 2. Chuẩn Bị Trên Máy Local

### Bước 2.1: Clone repository (nếu chưa có)

```bash
git clone https://github.com/BGJackFrost/BGJackFrost.git dreamweldtech
cd dreamweldtech
```

### Bước 2.2: Cài đặt dependencies

```bash
pnpm install
# hoặc
npm install --legacy-peer-deps
```

### Bước 2.3: Build ứng dụng

```bash
pnpm build
# hoặc
npm run build
```

### Bước 2.4: Kiểm tra thư mục dist

Sau khi build, đảm bảo có các file sau:

```
dist/
├── index.js              ← File server chính
└── public/
    ├── index.html
    ├── assets/
    │   ├── index-xxx.css
    │   └── index-xxx.js
    └── images/
```

### Bước 2.5: Đóng gói để upload

**Cách 1: Upload toàn bộ (khuyến nghị cho lần đầu)**

```bash
# Tạo file zip (KHÔNG bao gồm node_modules)
zip -r dreamweldtech-deploy.zip . -x "node_modules/*" -x ".git/*" -x "*.log"
```

**Cách 2: Chỉ upload các file cần thiết**

Các thư mục/file cần upload:
- `dist/` (bắt buộc)
- `drizzle/` (bắt buộc)
- `package.json` (bắt buộc)
- `pnpm-lock.yaml` hoặc `package-lock.json` (bắt buộc)
- `tsconfig.json`
- `.env` (tạo riêng cho production)

---

## 3. Tạo Database MySQL

### Bước 3.1: Đăng nhập Plesk

1. Truy cập Plesk Panel của Mắt Bão
2. Chọn domain **dreamweldtech.vn**

### Bước 3.2: Tạo Database

1. Vào **Databases** trong menu bên trái
2. Click **Add Database**
3. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| Database name | dreamweldtech |
| Database server | localhost |
| Related site | dreamweldtech.vn |

4. Tạo Database User:

| Trường | Giá trị |
|--------|---------|
| Database user name | (tự đặt, ví dụ: admin) |
| Password | (tạo password mạnh) |
| Access control | Allow local connections only |

5. Click **OK**

### Bước 3.3: Ghi nhớ thông tin kết nối

Sau khi tạo, bạn sẽ có thông tin như:

```
Host: localhost
Database: dre86999_dreamweldtech
Username: dre86999_admin
Password: Tien123!@
Port: 3306
```

**DATABASE_URL format:**
```
mysql://dre86999_admin:Tien123!@@localhost:3306/dre86999_dreamweldtech
```

> **Lưu ý:** Nếu password có ký tự đặc biệt như `@`, `#`, `!`, cần URL encode:
> - `@` → `%40`
> - `#` → `%23`
> - `!` → `%21`

---

## 4. Upload Mã Nguồn

### Cách 1: Sử dụng File Manager (Đơn giản)

1. Trong Plesk, click **File Manager**
2. Navigate đến `/httpdocs/`
3. Tạo thư mục `dreamweldtech` (nếu chưa có):
   - Click **New** → **Directory**
   - Đặt tên: `dreamweldtech`
4. Vào thư mục `dreamweldtech`
5. Click **Upload**
6. Chọn file `dreamweldtech-deploy.zip`
7. Sau khi upload xong, click chuột phải vào file zip → **Extract Files**
8. Xóa file zip sau khi extract

### Cách 2: Sử dụng Git (Khuyến nghị)

1. Trong Plesk, vào **Git**
2. Click **Add Repository**
3. Điền thông tin:

| Trường | Giá trị |
|--------|---------|
| Remote Git repository | https://github.com/BGJackFrost/BGJackFrost.git |
| Repository directory | /httpdocs/dreamweldtech |

4. Click **OK** và đợi clone hoàn tất

### Cách 3: Sử dụng SSH/Terminal

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs
git clone https://github.com/BGJackFrost/BGJackFrost.git dreamweldtech
```

---

## 5. Cấu Hình Node.js App

### Bước 5.1: Mở Node.js Settings

1. Trong Plesk, chọn domain **dreamweldtech.vn**
2. Click **Node.js** trong menu

### Bước 5.2: Enable Node.js (nếu chưa có)

Nếu chưa có ứng dụng Node.js:
1. Click **Enable Node.js**

### Bước 5.3: Cấu hình ứng dụng

Click **[edit]** bên cạnh từng mục để chỉnh sửa:

| Trường | Giá trị |
|--------|---------|
| **Node.js Version** | 24.12.0 (hoặc mới nhất) |
| **Package Manager** | npm |
| **Document Root** | `/httpdocs/dreamweldtech/dist/public` |
| **Application Mode** | production |
| **Application Root** | `/httpdocs/dreamweldtech` |
| **Application Startup File** | `dist/index.js` |

### Bước 5.4: Cấu hình Environment Variables

Click **[specify]** bên cạnh **Custom environment variables** và thêm:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | `mysql://dre86999_admin:Tien123%21%40@localhost:3306/dre86999_dreamweldtech` |
| `JWT_SECRET` | `0408d72529d0e394a3cd3ed681863f58` (hoặc chuỗi ngẫu nhiên 32+ ký tự) |
| `VITE_APP_TITLE` | `DreamWeldTech` |
| `VITE_APP_ID` | `dreamweldtech` |

**Biến môi trường tùy chọn (thêm sau nếu cần):**

| Variable | Value | Mô tả |
|----------|-------|-------|
| `SENDGRID_API_KEY` | (API key của bạn) | Gửi email |
| `ADMIN_ALERT_EMAIL` | admin@dreamweldtech.vn | Email nhận thông báo |
| `TELEGRAM_BOT_TOKEN` | (token bot) | Thông báo Telegram |
| `TELEGRAM_CHAT_ID` | (chat ID) | Thông báo Telegram |

---

## 6. Cài Đặt Dependencies

### Bước 6.1: Mở Terminal/SSH

**Cách 1: Dùng nút trong Plesk**
- Click **Run Node.js commands** (tab bên cạnh Dashboard)

**Cách 2: Dùng SSH**
- Kết nối SSH đến server
- Navigate đến thư mục dự án:
```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
```

### Bước 6.2: Cài đặt dependencies

```bash
npm install --legacy-peer-deps
```

**Nếu gặp lỗi permission:**
```bash
npm install --legacy-peer-deps --unsafe-perm
```

**Nếu gặp lỗi memory:**
```bash
NODE_OPTIONS="--max-old-space-size=1024" npm install --legacy-peer-deps
```

### Bước 6.3: Kiểm tra cài đặt

```bash
ls -la node_modules
```

Nếu thấy thư mục `node_modules` với nhiều package bên trong là thành công.

---

## 7. Build Ứng Dụng

### Nếu đã build trên local và upload dist/

Bỏ qua bước này, chuyển sang bước 8.

### Nếu cần build trên server

```bash
npm run build
```

**Nếu gặp lỗi memory khi build:**
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Kiểm tra build output

```bash
ls -la dist/
ls -la dist/public/
```

Đảm bảo có:
- `dist/index.js`
- `dist/public/index.html`
- `dist/public/assets/`

---

## 8. Chạy Database Migration

### Bước 8.1: Kiểm tra kết nối database

```bash
# Test kết nối MySQL
mysql -u dre86999_admin -p -h localhost dre86999_dreamweldtech -e "SELECT 1"
```

Nhập password khi được hỏi. Nếu thấy `1` là kết nối thành công.

### Bước 8.2: Chạy migration

```bash
npm run db:push
```

**Output mong đợi:**
```
[✓] Changes applied
```

### Bước 8.3: Kiểm tra tables đã tạo

```bash
mysql -u dre86999_admin -p -h localhost dre86999_dreamweldtech -e "SHOW TABLES"
```

Bạn sẽ thấy danh sách các tables như: `users`, `products`, `categories`, `news`, v.v.

---

## 9. Khởi Động Ứng Dụng

### Bước 9.1: Restart App

1. Quay lại Plesk → **Node.js**
2. Click **Restart App**

### Bước 9.2: Kiểm tra trạng thái

Sau khi restart, kiểm tra:
- **Application Status** hiển thị **Running** (màu xanh)

### Bước 9.3: Xem logs (nếu có lỗi)

1. Click **Run Node.js commands**
2. Chạy:
```bash
cat ~/logs/nodejs/dreamweldtech.log
```

Hoặc trong Plesk:
- Vào **Logs** để xem error logs

---

## 10. Kiểm Tra Và Xử Lý Lỗi

### 10.1. Kiểm tra website

1. **Trang chủ:** https://dreamweldtech.vn
2. **Health check:** https://dreamweldtech.vn/api/health

**Kết quả health check mong đợi:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-08T...",
  "uptime": "...",
  "database": {
    "status": "connected"
  },
  "memory": {
    "used": "...",
    "total": "..."
  }
}
```

### 10.2. Lỗi thường gặp và cách sửa

#### Lỗi 502 Bad Gateway

**Nguyên nhân:** Ứng dụng Node.js chưa chạy hoặc crash

**Giải pháp:**
1. Kiểm tra logs
2. Đảm bảo `dist/index.js` tồn tại
3. Kiểm tra environment variables
4. Restart App

#### Lỗi "Cannot find module"

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**
```bash
rm -rf node_modules
npm install --legacy-peer-deps
```

#### Lỗi "ECONNREFUSED" database

**Nguyên nhân:** Không kết nối được MySQL

**Giải pháp:**
1. Kiểm tra DATABASE_URL đúng format
2. Kiểm tra password đã URL encode ký tự đặc biệt
3. Kiểm tra database và user tồn tại

#### Lỗi "EACCES permission denied"

**Nguyên nhân:** Không có quyền ghi file

**Giải pháp:**
```bash
chmod -R 755 /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
```

#### Trang trắng hoặc lỗi JavaScript

**Nguyên nhân:** Document Root sai

**Giải pháp:**
- Đảm bảo Document Root là `/httpdocs/dreamweldtech/dist/public`

---

## 11. Cập Nhật Sau Này

### Khi có code mới từ GitHub

```bash
# SSH vào server hoặc dùng Terminal trong Plesk
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech

# Pull code mới
git pull origin main

# Cài đặt dependencies mới (nếu có)
npm install --legacy-peer-deps

# Build lại
npm run build

# Chạy migration (nếu có thay đổi database)
npm run db:push
```

Sau đó vào Plesk → Node.js → **Restart App**

### Script tự động update

Tạo file `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying DreamWeldTech..."

cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🔨 Building..."
npm run build

echo "🗄️ Running migrations..."
npm run db:push

echo "✅ Deploy complete! Please restart the app in Plesk."
```

Chạy:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Tóm Tắt Cấu Hình Cuối Cùng

| Mục | Giá trị |
|-----|---------|
| Node.js Version | 24.12.0 |
| Document Root | `/httpdocs/dreamweldtech/dist/public` |
| Application Root | `/httpdocs/dreamweldtech` |
| Application Startup File | `dist/index.js` |
| Application Mode | production |

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@localhost:3306/database
JWT_SECRET=your-secret-key
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech
```

---

## Liên Hệ Hỗ Trợ

- **Mắt Bão Hotline:** 1900 1830
- **Wiki Mắt Bão:** https://wiki.matbao.net
- **Email:** support@matbao.net

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 08/01/2026*
