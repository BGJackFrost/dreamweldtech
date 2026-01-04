# Hướng Dẫn Triển Khai Website Dreamweldtech Lên Hosting Mắt Bão

**Tác giả:** Manus AI  
**Ngày cập nhật:** 04/01/2026  
**Phiên bản:** 1.0

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Yêu Cầu Hệ Thống](#2-yêu-cầu-hệ-thống)
3. [Chọn Gói Hosting Phù Hợp](#3-chọn-gói-hosting-phù-hợp)
4. [Chuẩn Bị Trước Khi Triển Khai](#4-chuẩn-bị-trước-khi-triển-khai)
5. [Hướng Dẫn Triển Khai Chi Tiết](#5-hướng-dẫn-triển-khai-chi-tiết)
6. [Cấu Hình Database PostgreSQL](#6-cấu-hình-database-postgresql)
7. [Cấu Hình Domain và SSL](#7-cấu-hình-domain-và-ssl)
8. [Cấu Hình Biến Môi Trường](#8-cấu-hình-biến-môi-trường)
9. [Khởi Động Ứng Dụng](#9-khởi-động-ứng-dụng)
10. [Kiểm Tra và Xử Lý Lỗi](#10-kiểm-tra-và-xử-lý-lỗi)
11. [Bảo Trì và Cập Nhật](#11-bảo-trì-và-cập-nhật)

---

## 1. Tổng Quan

Website Dreamweldtech là một ứng dụng full-stack được xây dựng với công nghệ hiện đại, bao gồm React 19 cho frontend, Express.js cho backend, và PostgreSQL cho database. Để triển khai thành công lên hosting của Mắt Bão, bạn cần chọn gói hosting phù hợp hỗ trợ Node.js và PostgreSQL.

### Kiến Trúc Ứng Dụng

| Thành phần | Công nghệ | Yêu cầu |
|------------|-----------|---------|
| Frontend | React 19 + Vite | Node.js 18+ |
| Backend | Express.js + tRPC | Node.js 18+ |
| Database | PostgreSQL | PostgreSQL 14+ |
| File Storage | S3-compatible | Tích hợp sẵn |
| Email | SendGrid | API Key |

---

## 2. Yêu Cầu Hệ Thống

### Yêu Cầu Tối Thiểu

Để website hoạt động ổn định, hosting cần đáp ứng các yêu cầu sau:

| Thông số | Yêu cầu tối thiểu | Khuyến nghị |
|----------|-------------------|-------------|
| RAM | 512 MB | 1 GB+ |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 5 GB SSD | 10 GB SSD |
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 14.x | 15.x |
| Bandwidth | 50 GB/tháng | Unlimited |

### Lưu Ý Quan Trọng

> **Cảnh báo:** Hosting chia sẻ (Shared Hosting) thông thường của Mắt Bão **không hỗ trợ Node.js**. Bạn cần chọn gói **VPS** hoặc **Cloud Server** để triển khai ứng dụng này.

---

## 3. Chọn Gói Hosting Phù Hợp

### Các Gói Hosting Phù Hợp Tại Mắt Bão

Mắt Bão cung cấp nhiều loại hosting, nhưng chỉ có VPS và Cloud Server phù hợp cho ứng dụng Node.js:

| Gói dịch vụ | Phù hợp | Giá tham khảo | Ghi chú |
|-------------|---------|---------------|---------|
| Shared Hosting | ❌ Không | - | Không hỗ trợ Node.js |
| WordPress Hosting | ❌ Không | - | Chỉ dành cho WordPress |
| **VPS Linux** | ✅ Có | ~200,000đ/tháng | Khuyến nghị cho startup |
| **Cloud Server** | ✅ Có | ~500,000đ/tháng | Khuyến nghị cho production |
| Dedicated Server | ✅ Có | ~3,000,000đ/tháng | Cho doanh nghiệp lớn |

### Khuyến Nghị

Đối với website Dreamweldtech, tôi khuyến nghị chọn **VPS Linux** với cấu hình sau:

- **RAM:** 1 GB (tối thiểu) hoặc 2 GB (khuyến nghị)
- **CPU:** 1 vCPU
- **SSD:** 20 GB
- **Hệ điều hành:** Ubuntu 22.04 LTS
- **Bandwidth:** Unlimited

---

## 4. Chuẩn Bị Trước Khi Triển Khai

### 4.1. Đăng Ký VPS Tại Mắt Bão

1. Truy cập [https://www.matbao.vn/vps.html](https://www.matbao.vn/vps.html)
2. Chọn gói VPS phù hợp (khuyến nghị: VPS SSD 1GB RAM)
3. Chọn hệ điều hành: **Ubuntu 22.04 LTS**
4. Hoàn tất thanh toán và nhận thông tin đăng nhập qua email

### 4.2. Chuẩn Bị Source Code

Trước khi upload, bạn cần build ứng dụng:

```bash
# Clone repository (nếu chưa có)
git clone https://github.com/BGJackFrost/BGJackFrost.git dreamweldtech
cd dreamweldtech

# Cài đặt dependencies
pnpm install

# Build ứng dụng
pnpm build
```

### 4.3. Chuẩn Bị Database

Bạn có 2 lựa chọn cho database:

| Lựa chọn | Ưu điểm | Nhược điểm |
|----------|---------|------------|
| PostgreSQL trên VPS | Miễn phí, toàn quyền kiểm soát | Cần tự quản lý, backup |
| Database dịch vụ (Neon, Supabase) | Managed, tự động backup | Có thể mất phí |

---

## 5. Hướng Dẫn Triển Khai Chi Tiết

### 5.1. Kết Nối SSH Vào VPS

Sau khi nhận thông tin VPS từ Mắt Bão, kết nối SSH:

```bash
# Trên Windows: sử dụng PuTTY hoặc Windows Terminal
# Trên Mac/Linux: sử dụng Terminal

ssh root@<IP_VPS>
# Nhập password được cung cấp qua email
```

### 5.2. Cập Nhật Hệ Thống

```bash
# Cập nhật package list
apt update && apt upgrade -y

# Cài đặt các công cụ cần thiết
apt install -y curl wget git build-essential
```

### 5.3. Cài Đặt Node.js

```bash
# Cài đặt Node.js 20.x LTS qua NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Kiểm tra phiên bản
node -v  # Kết quả: v20.x.x
npm -v   # Kết quả: 10.x.x

# Cài đặt pnpm
npm install -g pnpm
```

### 5.4. Cài Đặt PostgreSQL

```bash
# Cài đặt PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Khởi động PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Kiểm tra trạng thái
systemctl status postgresql
```

### 5.5. Cài Đặt Nginx (Reverse Proxy)

```bash
# Cài đặt Nginx
apt install -y nginx

# Khởi động Nginx
systemctl start nginx
systemctl enable nginx
```

### 5.6. Cài Đặt PM2 (Process Manager)

```bash
# Cài đặt PM2 globally
npm install -g pm2

# Cấu hình PM2 khởi động cùng hệ thống
pm2 startup systemd
```

---

## 6. Cấu Hình Database PostgreSQL

### 6.1. Tạo Database và User

```bash
# Đăng nhập vào PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE dreamweldtech;

# Tạo user với password mạnh
CREATE USER dreamweld_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';

# Cấp quyền cho user
GRANT ALL PRIVILEGES ON DATABASE dreamweldtech TO dreamweld_user;

# Thoát PostgreSQL
\q
```

### 6.2. Cấu Hình Cho Phép Kết Nối

Chỉnh sửa file `pg_hba.conf`:

```bash
# Tìm vị trí file
sudo -u postgres psql -c "SHOW hba_file;"

# Chỉnh sửa file (thường ở /etc/postgresql/15/main/pg_hba.conf)
nano /etc/postgresql/15/main/pg_hba.conf

# Thêm dòng sau (cho phép kết nối local với password)
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   dreamweldtech   dreamweld_user                          md5
host    dreamweldtech   dreamweld_user  127.0.0.1/32            md5

# Restart PostgreSQL
systemctl restart postgresql
```

### 6.3. Connection String

Sau khi cấu hình, connection string sẽ có dạng:

```
postgresql://dreamweld_user:your_strong_password_here@localhost:5432/dreamweldtech
```

---

## 7. Cấu Hình Domain và SSL

### 7.1. Trỏ Domain Về VPS

Tại trang quản lý DNS của Mắt Bão hoặc nhà cung cấp domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | IP_VPS | 3600 |
| A | www | IP_VPS | 3600 |
| CNAME | www | dreamweldtech.vn | 3600 |

### 7.2. Cài Đặt SSL Miễn Phí với Let's Encrypt

```bash
# Cài đặt Certbot
apt install -y certbot python3-certbot-nginx

# Tạo SSL certificate
certbot --nginx -d dreamweldtech.vn -d www.dreamweldtech.vn

# Certbot sẽ hỏi email và điều khoản, làm theo hướng dẫn
# Chọn redirect HTTP to HTTPS khi được hỏi
```

### 7.3. Cấu Hình Nginx

Tạo file cấu hình Nginx:

```bash
nano /etc/nginx/sites-available/dreamweldtech
```

Nội dung file:

```nginx
server {
    listen 80;
    server_name dreamweldtech.vn www.dreamweldtech.vn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dreamweldtech.vn www.dreamweldtech.vn;

    # SSL certificates (được tạo bởi Certbot)
    ssl_certificate /etc/letsencrypt/live/dreamweldtech.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dreamweldtech.vn/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to Node.js app
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
    }

    # WebSocket support
    location /api/ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Kích hoạt cấu hình:

```bash
# Tạo symbolic link
ln -s /etc/nginx/sites-available/dreamweldtech /etc/nginx/sites-enabled/

# Kiểm tra cấu hình
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 8. Cấu Hình Biến Môi Trường

### 8.1. Upload Source Code

```bash
# Tạo thư mục cho ứng dụng
mkdir -p /var/www/dreamweldtech
cd /var/www/dreamweldtech

# Upload source code (sử dụng SCP hoặc SFTP)
# Từ máy local:
scp -r ./dist/* root@<IP_VPS>:/var/www/dreamweldtech/

# Hoặc clone từ Git
git clone https://github.com/BGJackFrost/BGJackFrost.git .
pnpm install --production
pnpm build
```

### 8.2. Tạo File .env

```bash
nano /var/www/dreamweldtech/.env
```

Nội dung file `.env`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://dreamweld_user:your_strong_password_here@localhost:5432/dreamweldtech

# JWT
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# OAuth (nếu sử dụng)
OAUTH_SERVER_URL=https://oauth.dreamweldtech.vn

# Analytics
VITE_ANALYTICS_WEBSITE_ID=your_analytics_id
VITE_ANALYTICS_ENDPOINT=https://analytics.dreamweldtech.vn

# App Info
VITE_APP_TITLE=Dreamweldtech - Giải Pháp Công Nghệ Laser Hàng Đầu
VITE_APP_LOGO=/logo.png
VITE_APP_ID=dreamweldtech

# Owner Info
OWNER_NAME=Admin
OWNER_OPEN_ID=admin@dreamweldtech.vn
```

### 8.3. Bảo Mật File .env

```bash
# Chỉ cho phép owner đọc
chmod 600 /var/www/dreamweldtech/.env
```

---

## 9. Khởi Động Ứng Dụng

### 9.1. Chạy Database Migration

```bash
cd /var/www/dreamweldtech

# Chạy migration
pnpm db:push
```

### 9.2. Khởi Động Với PM2

```bash
# Tạo file ecosystem cho PM2
nano /var/www/dreamweldtech/ecosystem.config.js
```

Nội dung file:

```javascript
module.exports = {
  apps: [{
    name: 'dreamweldtech',
    script: 'dist/index.js',
    cwd: '/var/www/dreamweldtech',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env',
    max_memory_restart: '500M',
    error_file: '/var/log/dreamweldtech/error.log',
    out_file: '/var/log/dreamweldtech/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Khởi động ứng dụng:

```bash
# Tạo thư mục log
mkdir -p /var/log/dreamweldtech

# Khởi động với PM2
cd /var/www/dreamweldtech
pm2 start ecosystem.config.js

# Lưu cấu hình PM2
pm2 save

# Kiểm tra trạng thái
pm2 status
pm2 logs dreamweldtech
```

---

## 10. Kiểm Tra và Xử Lý Lỗi

### 10.1. Kiểm Tra Ứng Dụng

```bash
# Kiểm tra PM2
pm2 status

# Kiểm tra logs
pm2 logs dreamweldtech --lines 100

# Kiểm tra Nginx
systemctl status nginx
nginx -t

# Kiểm tra PostgreSQL
systemctl status postgresql

# Test kết nối từ browser
curl -I https://dreamweldtech.vn
```

### 10.2. Các Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| 502 Bad Gateway | Node.js chưa chạy | `pm2 start ecosystem.config.js` |
| Connection refused | Port bị chặn | Kiểm tra firewall: `ufw allow 3000` |
| Database error | Sai connection string | Kiểm tra DATABASE_URL trong .env |
| SSL error | Certificate hết hạn | `certbot renew` |
| Permission denied | Quyền file sai | `chown -R www-data:www-data /var/www/dreamweldtech` |

### 10.3. Cấu Hình Firewall

```bash
# Cho phép các port cần thiết
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 5432    # PostgreSQL (chỉ nếu cần remote access)

# Kích hoạt firewall
ufw enable

# Kiểm tra trạng thái
ufw status
```

---

## 11. Bảo Trì và Cập Nhật

### 11.1. Cập Nhật Ứng Dụng

```bash
cd /var/www/dreamweldtech

# Pull code mới
git pull origin main

# Cài đặt dependencies mới
pnpm install

# Build lại
pnpm build

# Chạy migration (nếu có)
pnpm db:push

# Restart ứng dụng
pm2 restart dreamweldtech
```

### 11.2. Backup Database

```bash
# Tạo script backup
nano /root/backup-db.sh
```

Nội dung script:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U dreamweld_user dreamweldtech > $BACKUP_DIR/dreamweldtech_$DATE.sql

# Nén file backup
gzip $BACKUP_DIR/dreamweldtech_$DATE.sql

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: dreamweldtech_$DATE.sql.gz"
```

Thiết lập cron job:

```bash
chmod +x /root/backup-db.sh

# Thêm vào crontab (backup hàng ngày lúc 2h sáng)
crontab -e
# Thêm dòng:
0 2 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

### 11.3. Gia Hạn SSL Tự Động

Certbot tự động thiết lập cron job để gia hạn SSL. Kiểm tra:

```bash
# Kiểm tra cron job
systemctl list-timers | grep certbot

# Test gia hạn (dry run)
certbot renew --dry-run
```

### 11.4. Monitoring

```bash
# Xem tài nguyên hệ thống
htop

# Xem logs PM2
pm2 logs

# Xem logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Xem logs PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## Tổng Kết

Sau khi hoàn thành các bước trên, website Dreamweldtech sẽ được triển khai thành công trên VPS của Mắt Bão với:

- **HTTPS** được bật với SSL miễn phí từ Let's Encrypt
- **Nginx** làm reverse proxy với cấu hình tối ưu
- **PM2** quản lý process Node.js với auto-restart
- **PostgreSQL** database được bảo mật
- **Backup tự động** hàng ngày

### Checklist Cuối Cùng

- [ ] VPS đã được cấu hình với Ubuntu 22.04
- [ ] Node.js 20.x đã được cài đặt
- [ ] PostgreSQL 15 đã được cài đặt và cấu hình
- [ ] Nginx đã được cài đặt và cấu hình
- [ ] SSL certificate đã được tạo
- [ ] Source code đã được upload và build
- [ ] File .env đã được cấu hình đúng
- [ ] Database migration đã chạy thành công
- [ ] PM2 đã khởi động ứng dụng
- [ ] Website có thể truy cập qua HTTPS
- [ ] Backup script đã được thiết lập

### Liên Hệ Hỗ Trợ

Nếu gặp vấn đề trong quá trình triển khai, bạn có thể liên hệ:

- **Mắt Bão Support:** [https://www.matbao.vn/lien-he.html](https://www.matbao.vn/lien-he.html)
- **Hotline:** 1900 1596

---

*Tài liệu này được tạo bởi Manus AI cho dự án Dreamweldtech.*
