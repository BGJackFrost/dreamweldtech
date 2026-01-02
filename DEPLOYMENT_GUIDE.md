# Hướng Dẫn Triển Khai Website Dreamweldtech

**Tác giả:** Manus AI  
**Phiên bản:** 1.0  
**Cập nhật:** 02/01/2026

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Yêu Cầu Hệ Thống](#2-yêu-cầu-hệ-thống)
3. [Triển Khai Trên Manus Platform](#3-triển-khai-trên-manus-platform)
4. [Triển Khai Thủ Công](#4-triển-khai-thủ-công)
5. [Cấu Hình Biến Môi Trường](#5-cấu-hình-biến-môi-trường)
6. [Cấu Hình Database](#6-cấu-hình-database)
7. [Cấu Hình Domain](#7-cấu-hình-domain)
8. [Bảo Mật](#8-bảo-mật)
9. [Sao Lưu & Khôi Phục](#9-sao-lưu--khôi-phục)
10. [Xử Lý Sự Cố](#10-xử-lý-sự-cố)

---

## 1. Tổng Quan

Website Dreamweldtech được xây dựng trên nền tảng React 19 + Node.js với các công nghệ chính sau:

| Thành phần | Công nghệ | Phiên bản |
|------------|-----------|-----------|
| Frontend | React 19 + Vite | 19.x |
| Backend | Node.js + Express | 22.x |
| Database | MySQL (PlanetScale) | 8.x |
| ORM | Drizzle ORM | Latest |
| Styling | Tailwind CSS 4 | 4.x |
| API | tRPC | 11.x |

---

## 2. Yêu Cầu Hệ Thống

### Môi trường phát triển

Để phát triển và chạy website locally, bạn cần cài đặt các phần mềm sau:

- **Node.js** phiên bản 20.x trở lên
- **pnpm** phiên bản 8.x trở lên (package manager)
- **Git** để quản lý source code

### Môi trường production

Đối với triển khai production, yêu cầu tối thiểu như sau:

| Tài nguyên | Tối thiểu | Khuyến nghị |
|------------|-----------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 512MB | 1GB |
| Storage | 1GB | 5GB |
| Bandwidth | 100GB/tháng | Unlimited |

---

## 3. Triển Khai Trên Manus Platform

Đây là cách đơn giản và nhanh nhất để triển khai website Dreamweldtech. Manus Platform cung cấp hosting tích hợp với đầy đủ tính năng.

### Bước 1: Tạo Checkpoint

Trước khi publish, bạn cần tạo checkpoint để lưu trạng thái hiện tại của project. Checkpoint đã được tạo tự động trong quá trình phát triển.

### Bước 2: Publish Website

1. Mở **Management UI** bằng cách click vào biểu tượng ở góc phải màn hình chat
2. Chọn tab **Dashboard**
3. Click nút **Publish** ở góc trên bên phải
4. Xác nhận publish

Website sẽ được triển khai tự động và có sẵn tại domain `*.manus.space`.

### Bước 3: Cấu Hình Domain (Tùy chọn)

Để sử dụng domain riêng:

1. Vào **Settings** → **Domains**
2. Có thể chọn:
   - Thay đổi prefix của domain manus.space (miễn phí)
   - Mua domain mới trực tiếp trong Manus
   - Kết nối domain đã có sẵn

### Bước 4: Cấu Hình SSL

SSL được cấu hình tự động cho tất cả các domain trên Manus Platform. Không cần thao tác thêm.

---

## 4. Triển Khai Thủ Công

Nếu bạn muốn triển khai trên server riêng hoặc các nền tảng khác, hãy làm theo hướng dẫn sau.

### 4.1. Clone Source Code

```bash
# Clone repository
git clone https://github.com/your-username/dreamweldtech.git
cd dreamweldtech

# Cài đặt dependencies
pnpm install
```

### 4.2. Build Production

```bash
# Build frontend và backend
pnpm build

# Kết quả build sẽ nằm trong thư mục dist/
```

### 4.3. Chạy Production Server

```bash
# Chạy server production
NODE_ENV=production pnpm start
```

### 4.4. Sử Dụng PM2 (Khuyến nghị)

PM2 giúp quản lý process Node.js một cách chuyên nghiệp:

```bash
# Cài đặt PM2
npm install -g pm2

# Chạy với PM2
pm2 start dist/server/index.js --name dreamweldtech

# Cấu hình auto-restart khi server reboot
pm2 startup
pm2 save
```

### 4.5. Cấu Hình Nginx (Reverse Proxy)

Tạo file `/etc/nginx/sites-available/dreamweldtech`:

```nginx
server {
    listen 80;
    server_name dreamweldtech.com www.dreamweldtech.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kích hoạt site:

```bash
sudo ln -s /etc/nginx/sites-available/dreamweldtech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Cấu Hình Biến Môi Trường

Tạo file `.env` trong thư mục gốc với các biến sau:

### Biến bắt buộc

| Biến | Mô tả | Ví dụ |
|------|-------|-------|
| `DATABASE_URL` | Connection string MySQL | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Secret key cho JWT | `your-secret-key-min-32-chars` |
| `VITE_APP_TITLE` | Tên website | `Dreamweldtech` |

### Biến tùy chọn

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `SENDGRID_API_KEY` | API key SendGrid để gửi email | - |
| `VITE_RECAPTCHA_SITE_KEY` | Site key reCAPTCHA v3 | - |
| `RECAPTCHA_SECRET_KEY` | Secret key reCAPTCHA v3 | - |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics ID | - |

### Ví dụ file .env

```env
# Database
DATABASE_URL=mysql://admin:password@db.example.com:3306/dreamweldtech

# Security
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# App Config
VITE_APP_TITLE=Dreamweldtech - Giải Pháp Công Nghệ Laser
VITE_APP_LOGO=/logo.svg

# Email (Optional)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx

# reCAPTCHA (Optional)
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxx

# Analytics (Optional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 6. Cấu Hình Database

### 6.1. Tạo Database

Website sử dụng MySQL. Bạn có thể sử dụng các dịch vụ sau:

| Dịch vụ | Gói miễn phí | Ghi chú |
|---------|--------------|---------|
| PlanetScale | 5GB storage | Serverless MySQL |
| Railway | $5 credit/tháng | PostgreSQL/MySQL |
| Supabase | 500MB | PostgreSQL |
| AWS RDS | 12 tháng free tier | MySQL/PostgreSQL |

### 6.2. Migrate Schema

Sau khi có database, chạy migration:

```bash
# Generate migration files
pnpm db:generate

# Apply migrations
pnpm db:push
```

### 6.3. Seed Data (Tùy chọn)

Để thêm dữ liệu mẫu:

```bash
# Chạy seed script
node seed-partners.mjs
node seed-jobs.mjs
```

---

## 7. Cấu Hình Domain

### 7.1. DNS Records

Cấu hình DNS tại nhà cung cấp domain của bạn:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | IP_SERVER | 3600 |
| A | www | IP_SERVER | 3600 |
| CNAME | www | dreamweldtech.com | 3600 |

### 7.2. SSL Certificate

Sử dụng Let's Encrypt để có SSL miễn phí:

```bash
# Cài đặt Certbot
sudo apt install certbot python3-certbot-nginx

# Tạo certificate
sudo certbot --nginx -d dreamweldtech.com -d www.dreamweldtech.com

# Auto-renew
sudo certbot renew --dry-run
```

---

## 8. Bảo Mật

Website đã được tích hợp nhiều biện pháp bảo mật. Dưới đây là các cấu hình bổ sung khuyến nghị.

### 8.1. Firewall

```bash
# Chỉ mở các port cần thiết
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 8.2. Security Headers

Các header bảo mật đã được cấu hình sẵn trong server:

- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### 8.3. Rate Limiting

Rate limiting đã được cấu hình:

| Endpoint | Giới hạn |
|----------|----------|
| API chung | 100 requests/phút |
| Login | 5 requests/phút |
| Contact form | 10 requests/phút |

---

## 9. Sao Lưu & Khôi Phục

### 9.1. Sao Lưu Thủ Công

Truy cập Admin → Sao Lưu để:

1. **Export dữ liệu công khai**: Tải về file JSON chứa sản phẩm, tin tức, FAQ...
2. **Export dữ liệu nhạy cảm**: Tải về file JSON chứa thông tin liên hệ, đơn ứng tuyển

### 9.2. Sao Lưu Tự Động

Thiết lập cron job để backup định kỳ:

```bash
# Backup database hàng ngày lúc 2:00 AM
0 2 * * * mysqldump -u user -p database > /backup/db_$(date +\%Y\%m\%d).sql
```

### 9.3. Khôi Phục

1. Truy cập Admin → Sao Lưu
2. Click "Chọn file để nhập"
3. Chọn file backup JSON
4. Xác nhận import

---

## 10. Xử Lý Sự Cố

### 10.1. Website không load

**Kiểm tra:**
1. Server có đang chạy không: `pm2 status`
2. Port 3000 có đang listen: `netstat -tlnp | grep 3000`
3. Nginx có lỗi không: `sudo nginx -t`

**Giải pháp:**
```bash
# Restart server
pm2 restart dreamweldtech

# Restart nginx
sudo systemctl restart nginx
```

### 10.2. Lỗi kết nối database

**Kiểm tra:**
1. Database URL có đúng không
2. Database server có online không
3. Firewall có block port database không

**Giải pháp:**
```bash
# Test connection
mysql -h host -u user -p database

# Check env
cat .env | grep DATABASE
```

### 10.3. Lỗi gửi email

**Kiểm tra:**
1. SENDGRID_API_KEY có đúng không
2. Domain đã verify trên SendGrid chưa

**Giải pháp:**
- Kiểm tra SendGrid dashboard
- Verify domain sender

### 10.4. Liên hệ hỗ trợ

Nếu gặp vấn đề không thể tự giải quyết:

- **Email:** support@dreamweldtech.com
- **Hotline:** +84 123 456 789
- **Manus Support:** https://help.manus.im

---

## Phụ Lục

### A. Cấu Trúc Thư Mục

```
dreamweldtech/
├── client/                 # Frontend React
│   ├── public/            # Static assets
│   └── src/               # Source code
├── server/                # Backend Node.js
│   ├── _core/            # Core utilities
│   └── routers.ts        # API routes
├── drizzle/              # Database schema
├── dist/                 # Build output
└── .env                  # Environment variables
```

### B. Scripts Hữu Ích

| Script | Mô tả |
|--------|-------|
| `pnpm dev` | Chạy development server |
| `pnpm build` | Build production |
| `pnpm start` | Chạy production server |
| `pnpm test` | Chạy unit tests |
| `pnpm db:push` | Apply database migrations |

### C. Tài Liệu Tham Khảo

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [tRPC](https://trpc.io)

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 02/01/2026*
