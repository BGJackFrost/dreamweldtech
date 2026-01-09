# Hướng Dẫn Triển Khai DreamWeldTech Lên Host Mắt Bão

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Yêu Cầu Hệ Thống](#1-yêu-cầu-hệ-thống)
2. [Chuẩn Bị Trước Khi Triển Khai](#2-chuẩn-bị-trước-khi-triển-khai)
3. [Cấu Hình Database MySQL](#3-cấu-hình-database-mysql)
4. [Upload Source Code](#4-upload-source-code)
5. [Cài Đặt Dependencies](#5-cài-đặt-dependencies)
6. [Cấu Hình Environment Variables](#6-cấu-hình-environment-variables)
7. [Build Project](#7-build-project)
8. [Cấu Hình Node.js Application](#8-cấu-hình-nodejs-application)
9. [Cấu Hình Domain và SSL](#9-cấu-hình-domain-và-ssl)
10. [Kiểm Tra và Xử Lý Lỗi](#10-kiểm-tra-và-xử-lý-lỗi)
11. [Bảo Trì và Cập Nhật](#11-bảo-trì-và-cập-nhật)

---

## 1. Yêu Cầu Hệ Thống

### 1.1 Yêu Cầu Server

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị |
|------------|-------------------|-------------|
| Node.js | 18.x | 20.x hoặc 22.x |
| npm | 9.x | 10.x |
| MySQL | 5.7 | 8.0 |
| RAM | 512MB | 1GB+ |
| Disk | 1GB | 2GB+ |

### 1.2 Gói Hosting Mắt Bão Phù Hợp

Để chạy ứng dụng Node.js, bạn cần sử dụng một trong các gói sau của Mắt Bão:

- **Business Hosting** (có hỗ trợ Node.js)
- **VPS** (khuyến nghị để có toàn quyền kiểm soát)
- **Cloud Server**

> **Lưu ý:** Gói Shared Hosting thông thường có thể không hỗ trợ Node.js. Hãy liên hệ Mắt Bão để xác nhận.

---

## 2. Chuẩn Bị Trước Khi Triển Khai

### 2.1 Truy Cập Control Panel

1. Đăng nhập vào **Plesk Control Panel** của Mắt Bão
2. URL thường có dạng: `https://your-domain.vn:8443` hoặc qua link trong email kích hoạt

### 2.2 Kiểm Tra Node.js

Trong Plesk, vào **Tools & Settings** → **Node.js** để kiểm tra phiên bản Node.js có sẵn.

Nếu chưa có, liên hệ support Mắt Bão để kích hoạt Node.js cho hosting của bạn.

### 2.3 Chuẩn Bị SSH Access

1. Trong Plesk, vào **Websites & Domains** → **SSH Access**
2. Bật SSH access nếu chưa bật
3. Lưu lại thông tin SSH:
   - Host: `your-domain.vn` hoặc IP server
   - Port: `22` (hoặc port custom)
   - Username: thường là tên domain hoặc username Plesk
   - Password: password Plesk hoặc SSH key

---

## 3. Cấu Hình Database MySQL

### 3.1 Tạo Database Mới

1. Trong Plesk, vào **Databases** → **Add Database**
2. Điền thông tin:
   - **Database name:** `dreamweldtech_db`
   - **Database server:** localhost
   - **Related site:** chọn domain của bạn

3. Tạo Database User:
   - **Database user name:** `dreamweldtech_user`
   - **Password:** tạo password mạnh (lưu lại để dùng sau)
   - **Access control:** Local (MySQL)

### 3.2 Lưu Thông Tin Kết Nối

Ghi lại các thông tin sau để cấu hình sau này:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dreamweldtech_db
DB_USER=dreamweldtech_user
DB_PASSWORD=your_password_here
```

---

## 4. Upload Source Code

### Phương Pháp 1: Upload qua File Manager (Đơn giản)

1. Trong Plesk, vào **Files**
2. Navigate đến thư mục `httpdocs`
3. Tạo thư mục mới: `dreamweldtech`
4. Upload file ZIP của project
5. Extract file ZIP

### Phương Pháp 2: Upload qua FTP (Nhanh hơn cho file lớn)

1. Sử dụng FTP client như FileZilla
2. Kết nối với thông tin:
   - Host: `ftp.your-domain.vn`
   - Username: FTP username từ Plesk
   - Password: FTP password
   - Port: 21

3. Upload toàn bộ source code vào `/httpdocs/dreamweldtech/`

### Phương Pháp 3: Clone từ GitHub (Khuyến nghị)

Kết nối SSH và chạy:

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs
git clone https://github.com/your-username/dreamweldtech.git
cd dreamweldtech
```

Nếu repository là private, sử dụng Personal Access Token:

```bash
git clone https://your-username:your-token@github.com/your-username/dreamweldtech.git
```

---

## 5. Cài Đặt Dependencies

### 5.1 Kết Nối SSH

```bash
ssh username@your-domain.vn -p 22
```

Hoặc sử dụng SSH Terminal trong Plesk.

### 5.2 Di Chuyển Đến Thư Mục Project

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
```

### 5.3 Kiểm Tra Node.js và npm

```bash
node -v
npm -v
```

Nếu không có, thử:

```bash
# Sử dụng nvm nếu có
source ~/.nvm/nvm.sh
nvm use 20

# Hoặc đường dẫn đầy đủ
/opt/plesk/node/20/bin/node -v
/opt/plesk/node/20/bin/npm -v
```

### 5.4 Cài Đặt Dependencies

```bash
# Xóa cache và lock files cũ (nếu có)
rm -rf node_modules
rm -f package-lock.json pnpm-lock.yaml

# Cài đặt dependencies
npm install

# Hoặc nếu dùng pnpm
npm install -g pnpm
pnpm install
```

### 5.5 Xử Lý Lỗi Thiếu Package

Nếu gặp lỗi thiếu `react-helmet-async`:

```bash
npm install react-helmet-async
```

Nếu gặp lỗi khác về missing packages:

```bash
npm install --legacy-peer-deps
```

---

## 6. Cấu Hình Environment Variables

### 6.1 Tạo File .env

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
nano .env
```

### 6.2 Nội Dung File .env

Sao chép và điền các giá trị phù hợp:

```env
# =====================================================
# Database Configuration
# =====================================================
DATABASE_URL=mysql://dreamweldtech_user:your_password@localhost:3306/dreamweldtech_db

# =====================================================
# Application Settings
# =====================================================
NODE_ENV=production
PORT=3000

# =====================================================
# JWT Secret (Tạo chuỗi ngẫu nhiên 64 ký tự)
# =====================================================
JWT_SECRET=your_random_64_character_string_here

# =====================================================
# SendGrid Email (Lấy từ sendgrid.com)
# =====================================================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
ADMIN_ALERT_EMAIL=admin@dreamweldtech.vn

# =====================================================
# reCAPTCHA (Lấy từ google.com/recaptcha)
# =====================================================
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxx

# =====================================================
# Analytics (Tùy chọn)
# =====================================================
VITE_ANALYTICS_ENDPOINT=https://analytics.dreamweldtech.vn
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# =====================================================
# OAuth (Nếu sử dụng)
# =====================================================
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=

# =====================================================
# Notifications (Tùy chọn)
# =====================================================
SLACK_WEBHOOK_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 6.3 Tạo JWT Secret

Chạy lệnh sau để tạo JWT secret ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sao chép kết quả vào `JWT_SECRET` trong file .env.

### 6.4 Lưu File

Nhấn `Ctrl + X`, sau đó `Y`, rồi `Enter` để lưu.

---

## 7. Build Project

### 7.1 Chạy Database Migration

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech

# Push schema vào database
npm run db:push
```

### 7.2 Build Production

```bash
npm run build
```

**Kết quả mong đợi:**

```
> dreamweldtech@1.0.0 build
> vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

vite v7.x.x building for production...
✓ xxx modules transformed.
...
✓ built in xxs
```

### 7.3 Xử Lý Lỗi Build Thường Gặp

**Lỗi 1: Cannot resolve import "react-helmet-async"**

```bash
npm install react-helmet-async
npm run build
```

**Lỗi 2: Out of memory**

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Lỗi 3: Permission denied**

```bash
sudo chown -R $(whoami):$(whoami) /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
npm run build
```

---

## 8. Cấu Hình Node.js Application

### 8.1 Cấu Hình trong Plesk

1. Trong Plesk, vào **Websites & Domains** → **Node.js**
2. Click **Enable Node.js**
3. Cấu hình:
   - **Node.js Version:** 20.x (hoặc cao nhất có sẵn)
   - **Document Root:** `/httpdocs/dreamweldtech/dist/public`
   - **Application Root:** `/httpdocs/dreamweldtech`
   - **Application Startup File:** `dist/index.js`
   - **Application Mode:** production

4. Click **Enable** hoặc **Apply**

### 8.2 Cấu Hình PM2 (Nếu có quyền root/VPS)

Nếu bạn dùng VPS và có quyền root, sử dụng PM2 để quản lý process:

```bash
# Cài đặt PM2
npm install -g pm2

# Tạo file ecosystem
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
nano ecosystem.config.js
```

Nội dung `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dreamweldtech',
    script: 'dist/index.js',
    cwd: '/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Khởi động với PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 9. Cấu Hình Domain và SSL

### 9.1 Cấu Hình Proxy trong Plesk

1. Vào **Websites & Domains** → **Apache & nginx Settings**
2. Trong phần **Additional nginx directives**, thêm:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}
```

3. Click **OK** để lưu

### 9.2 Cài Đặt SSL Certificate

1. Vào **Websites & Domains** → **SSL/TLS Certificates**
2. Chọn **Install a free basic certificate provided by Let's Encrypt**
3. Điền email và chọn các options:
   - ☑️ Secure the domain
   - ☑️ Include www subdomain
   - ☑️ Secure webmail
4. Click **Get it free**

### 9.3 Bật HTTPS Redirect

1. Vào **Websites & Domains** → **Hosting Settings**
2. Chọn **Permanent SEO-safe 301 redirect from HTTP to HTTPS**
3. Click **OK**

---

## 10. Kiểm Tra và Xử Lý Lỗi

### 10.1 Kiểm Tra Website

Truy cập các URL sau để kiểm tra:

| URL | Mục đích |
|-----|----------|
| `https://dreamweldtech.vn` | Trang chủ |
| `https://dreamweldtech.vn/products` | Trang sản phẩm |
| `https://dreamweldtech.vn/admin` | Trang quản trị |
| `https://dreamweldtech.vn/api/trpc/health` | API health check |

### 10.2 Xem Logs

```bash
# Xem logs của Node.js app
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
tail -f logs/app.log

# Xem logs của PM2 (nếu dùng)
pm2 logs dreamweldtech

# Xem logs nginx
tail -f /var/log/nginx/error.log
```

### 10.3 Các Lỗi Thường Gặp và Cách Khắc Phục

**Lỗi 502 Bad Gateway:**

```bash
# Kiểm tra app có chạy không
ps aux | grep node

# Restart app
pm2 restart dreamweldtech
# Hoặc trong Plesk: Node.js → Restart App
```

**Lỗi Database Connection:**

```bash
# Test kết nối database
mysql -u dreamweldtech_user -p dreamweldtech_db

# Kiểm tra DATABASE_URL trong .env
cat .env | grep DATABASE_URL
```

**Lỗi Permission:**

```bash
# Sửa quyền thư mục
chmod -R 755 /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
chown -R www-data:www-data /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
```

**Lỗi Port đã được sử dụng:**

```bash
# Tìm process đang dùng port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Restart app
pm2 restart dreamweldtech
```

---

## 11. Bảo Trì và Cập Nhật

### 11.1 Cập Nhật Code từ GitHub

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech

# Pull code mới
git pull origin main

# Cài đặt dependencies mới (nếu có)
npm install

# Build lại
npm run build

# Restart app
pm2 restart dreamweldtech
# Hoặc trong Plesk: Node.js → Restart App
```

### 11.2 Backup Database

```bash
# Backup database
mysqldump -u dreamweldtech_user -p dreamweldtech_db > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u dreamweldtech_user -p dreamweldtech_db < backup_20260109.sql
```

### 11.3 Monitoring

Thiết lập monitoring với PM2:

```bash
# Xem trạng thái
pm2 status

# Xem metrics
pm2 monit

# Xem thông tin chi tiết
pm2 show dreamweldtech
```

### 11.4 Auto-restart khi Server Reboot

```bash
pm2 startup
pm2 save
```

---

## Checklist Triển Khai

Sử dụng checklist sau để đảm bảo không bỏ sót bước nào:

- [ ] Tạo database MySQL
- [ ] Upload source code
- [ ] Cài đặt Node.js dependencies (`npm install`)
- [ ] Cài đặt `react-helmet-async` (`npm install react-helmet-async`)
- [ ] Tạo file `.env` với đầy đủ biến môi trường
- [ ] Chạy database migration (`npm run db:push`)
- [ ] Build project (`npm run build`)
- [ ] Cấu hình Node.js app trong Plesk
- [ ] Cấu hình nginx proxy
- [ ] Cài đặt SSL certificate
- [ ] Test website hoạt động
- [ ] Thiết lập PM2 auto-restart (nếu dùng VPS)

---

## Hỗ Trợ

Nếu gặp vấn đề trong quá trình triển khai:

1. **Mắt Bão Support:** https://matbao.net/lien-he.html
2. **Plesk Documentation:** https://docs.plesk.com
3. **Node.js Documentation:** https://nodejs.org/docs

---

**Chúc bạn triển khai thành công!** 🚀
