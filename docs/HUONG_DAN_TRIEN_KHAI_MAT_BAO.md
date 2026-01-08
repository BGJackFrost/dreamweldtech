# Hướng Dẫn Triển Khai DreamWeldTech Lên Cloud Hosting Mắt Bão

**Phiên bản:** 2.0 (MySQL Edition)  
**Ngày cập nhật:** 08/01/2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Yêu Cầu Hệ Thống](#2-yêu-cầu-hệ-thống)
3. [Lựa Chọn Gói Hosting](#3-lựa-chọn-gói-hosting)
4. [Chuẩn Bị Trước Khi Triển Khai](#4-chuẩn-bị-trước-khi-triển-khai)
5. [Triển Khai Trên Cloud Hosting Premium (cPanel)](#5-triển-khai-trên-cloud-hosting-premium-cpanel)
6. [Triển Khai Trên Cloud Server/VPS](#6-triển-khai-trên-cloud-servervps)
7. [Cấu Hình Database MySQL](#7-cấu-hình-database-mysql)
8. [Cấu Hình Biến Môi Trường](#8-cấu-hình-biến-môi-trường)
9. [Cấu Hình Domain và SSL](#9-cấu-hình-domain-và-ssl)
10. [Kiểm Tra và Xử Lý Lỗi](#10-kiểm-tra-và-xử-lý-lỗi)
11. [Bảo Trì và Cập Nhật](#11-bảo-trì-và-cập-nhật)
12. [Liên Hệ Hỗ Trợ](#12-liên-hệ-hỗ-trợ)

---

## 1. Giới Thiệu

DreamWeldTech là một ứng dụng web được xây dựng trên nền tảng **Node.js** với **React 19** cho frontend và **Express.js** cho backend. Ứng dụng sử dụng **MySQL** làm cơ sở dữ liệu - hoàn toàn tương thích với Cloud Hosting của Mắt Bão.

### Kiến Trúc Ứng Dụng

| Thành phần | Công nghệ | Mô tả |
|------------|-----------|-------|
| Frontend | React 19 + Vite | Single Page Application với Tailwind CSS |
| Backend | Node.js + Express | REST API và tRPC endpoints |
| **Database** | **MySQL 8.0+** | **Cơ sở dữ liệu quan hệ (tương thích Mắt Bão)** |
| ORM | Drizzle ORM | Quản lý schema và migrations |
| Authentication | JWT + OAuth | Xác thực người dùng |
| Process Manager | PM2 | Quản lý tiến trình Node.js |

---

## 2. Yêu Cầu Hệ Thống

### Yêu Cầu Tối Thiểu

| Tài nguyên | Cloud Hosting Premium | Cloud Server/VPS |
|------------|----------------------|------------------|
| RAM | 2GB | 2GB |
| CPU | 1 vCPU | 1 vCPU |
| Storage | 10GB SSD | 20GB SSD |
| Node.js | 18.x trở lên | 20.x trở lên |
| **MySQL** | **8.0 trở lên** | **8.0 trở lên** |

### Yêu Cầu Khuyến Nghị (Production)

| Tài nguyên | Giá trị |
|------------|---------|
| RAM | 4GB trở lên |
| CPU | 2 vCPU trở lên |
| Storage | 50GB SSD |
| Bandwidth | Unlimited |

---

## 3. Lựa Chọn Gói Hosting

### 3.1. Cloud Hosting Premium (Khuyến nghị)

**Ưu điểm:**
- ✅ Giao diện cPanel dễ sử dụng
- ✅ Hỗ trợ Node.js tích hợp sẵn
- ✅ **MySQL có sẵn** - không cần cài đặt thêm
- ✅ Quản lý database qua phpMyAdmin
- ✅ Backup tự động
- ✅ Hỗ trợ kỹ thuật 24/7
- ✅ SSL miễn phí (Let's Encrypt)

**Gói khuyến nghị:** Premium Plus hoặc Business

### 3.2. Cloud Server/VPS

**Ưu điểm:**
- Toàn quyền kiểm soát server
- Cấu hình linh hoạt
- Hiệu suất cao hơn

**Nhược điểm:**
- Yêu cầu kiến thức quản trị Linux
- Tự cài đặt MySQL

---

## 4. Chuẩn Bị Trước Khi Triển Khai

### 4.1. Build Ứng Dụng

```bash
# Clone repository
git clone https://github.com/BGJackFrost/BGJackFrost.git dreamweldtech
cd dreamweldtech

# Cài đặt dependencies
pnpm install

# Build production
pnpm build
```

### 4.2. Chuẩn Bị File .env

Tạo file `.env` với cấu hình MySQL:

```env
# Server
NODE_ENV=production
PORT=3000

# Database MySQL - CẤU HÌNH QUAN TRỌNG
DATABASE_URL=mysql://username:password@localhost:3306/dreamweldtech

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# App Info
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech

# Email (SendGrid - tùy chọn)
SENDGRID_API_KEY=your-sendgrid-api-key
ADMIN_ALERT_EMAIL=admin@dreamweldtech.com
```

### 4.3. Đóng Gói Ứng Dụng

```bash
# Tạo file zip để upload
zip -r dreamweldtech-deploy.zip dist/ drizzle/ package.json pnpm-lock.yaml .env
```

---

## 5. Triển Khai Trên Cloud Hosting Premium (cPanel)

### 5.1. Đăng Nhập Quản Trị Hosting

1. Truy cập [id.matbao.net](https://id.matbao.net) với tài khoản MBxxxx
2. Vào mục **Cloud Hosting** → **Quản lý Cloud Hosting**
3. Click vào gói hosting cần sử dụng
4. Chọn **Control Panel** để đăng nhập cPanel

### 5.2. Tạo Database MySQL

**Bước 1:** Trong cPanel, tìm mục **MySQL Databases** (Cơ sở dữ liệu MySQL)

**Bước 2:** Tạo Database mới
- Trong mục **Create New Database**
- Nhập tên database: `dreamweldtech`
- Click **Create Database**

**Bước 3:** Tạo User MySQL
- Trong mục **Add New User**
- Nhập username: `dreamweld`
- Nhập password: (tạo password mạnh)
- Click **Create User**

**Bước 4:** Gán User vào Database
- Trong mục **Add User To Database**
- Chọn User: `dreamweld`
- Chọn Database: `dreamweldtech`
- Click **Add**
- Chọn **All Privileges** (bỏ check **Drop** để an toàn)
- Click **Make Changes**

**Bước 5:** Ghi nhớ thông tin kết nối

| Thông tin | Giá trị |
|-----------|---------|
| Host | localhost |
| Database | cpanelusername_dreamweldtech |
| Username | cpanelusername_dreamweld |
| Password | (password bạn đã tạo) |
| Port | 3306 |

**Lưu ý:** Mắt Bão thêm prefix `cpanelusername_` vào tên database và user.

### 5.3. Upload Dữ Liệu

1. Trong cPanel, tìm mục **File Manager** (Bộ quản lý tệp)
2. Truy cập thư mục `public_html`
3. Click **Upload** và chọn file `dreamweldtech-deploy.zip`
4. Sau khi upload xong, click chuột phải vào file zip → **Extract**

### 5.4. Tạo Môi Trường Node.js

**Bước 1:** Trong cPanel, tìm mục **Software** → **Setup Node.js App**

**Bước 2:** Click **Create Application**

**Bước 3:** Cấu hình như sau:

| Trường | Giá trị |
|--------|---------|
| Node.js Version | 20.x (hoặc mới nhất) |
| Application Mode | Production |
| Application Root | dreamweldtech |
| Application URL | domain.com |
| Application Startup File | dist/server/index.js |

**Bước 4:** Click **Create** để tạo ứng dụng

### 5.5. Cấu Hình Biến Môi Trường

**Bước 1:** Sau khi tạo app, click vào biểu tượng **Edit** (cây viết)

**Bước 2:** Tìm mục **Environment variables** và thêm:

| Variable | Value |
|----------|-------|
| NODE_ENV | production |
| DATABASE_URL | mysql://cpanelusername_dreamweld:password@localhost:3306/cpanelusername_dreamweldtech |
| JWT_SECRET | your-super-secret-key-32-chars |
| VITE_APP_TITLE | DreamWeldTech |

**Bước 3:** Click **Save**

### 5.6. Cài Đặt Dependencies

**Bước 1:** Copy lệnh **"Enter to virtual environment"** từ Node.js App

**Bước 2:** Mở **Terminal** trong cPanel (mục Advanced)

**Bước 3:** Paste lệnh và nhấn Enter

**Bước 4:** Chạy các lệnh:

```bash
# Cài đặt dependencies
npm install --production

# Chạy database migration
npm run db:push
```

### 5.7. Khởi Động Ứng Dụng

1. Quay lại **Setup Node.js App**
2. Click **Restart** để khởi động ứng dụng
3. Truy cập domain để kiểm tra

---

## 6. Triển Khai Trên Cloud Server/VPS

### 6.1. Đăng Ký Cloud Server

1. Truy cập [matbao.net/cloud-server](https://www.matbao.net/cloud-server.html)
2. Chọn gói phù hợp (khuyến nghị: 2GB RAM trở lên)
3. Chọn hệ điều hành: **Ubuntu 22.04 LTS**

### 6.2. Kết Nối SSH

```bash
ssh root@your-server-ip
```

### 6.3. Cập Nhật Hệ Thống

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 6.4. Cài Đặt Node.js

```bash
# Cài đặt NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Cài đặt Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Cài đặt pnpm
npm install -g pnpm
```

### 6.5. Cài Đặt MySQL 8.0

```bash
# Cài đặt MySQL
sudo apt install -y mysql-server

# Bảo mật MySQL
sudo mysql_secure_installation

# Đăng nhập MySQL
sudo mysql

# Tạo database và user
CREATE DATABASE dreamweldtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dreamweld'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON dreamweldtech.* TO 'dreamweld'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 6.6. Cài Đặt PM2

```bash
npm install -g pm2
pm2 startup systemd
```

### 6.7. Clone và Cấu Hình Ứng Dụng

```bash
# Tạo thư mục
sudo mkdir -p /var/www/dreamweldtech
sudo chown -R $USER:$USER /var/www/dreamweldtech
cd /var/www/dreamweldtech

# Clone repository
git clone https://github.com/BGJackFrost/BGJackFrost.git .

# Cài đặt dependencies
pnpm install

# Tạo file .env
cp .env.example .env
nano .env
```

Chỉnh sửa file `.env`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://dreamweld:your-secure-password@localhost:3306/dreamweldtech
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech
```

### 6.8. Build và Chạy Migration

```bash
# Build ứng dụng
pnpm build

# Chạy database migrations
pnpm db:push
```

### 6.9. Khởi Động Với PM2

Tạo file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'dreamweldtech',
    script: 'dist/server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/var/log/pm2/dreamweldtech-error.log',
    out_file: '/var/log/pm2/dreamweldtech-out.log',
    time: true
  }]
};
```

```bash
# Tạo thư mục log
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Khởi động ứng dụng
pm2 start ecosystem.config.js --env production
pm2 save
```

### 6.10. Cài Đặt Nginx

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/dreamweldtech
```

Nội dung file cấu hình:

```nginx
server {
    listen 80;
    server_name dreamweldtech.com www.dreamweldtech.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dreamweldtech.com www.dreamweldtech.com;

    ssl_certificate /etc/letsencrypt/live/dreamweldtech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dreamweldtech.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

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

```bash
sudo ln -s /etc/nginx/sites-available/dreamweldtech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6.11. Cài Đặt SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dreamweldtech.com -d www.dreamweldtech.com
```

### 6.12. Cấu Hình Firewall

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 7. Cấu Hình Database MySQL

### 7.1. Tối Ưu MySQL (VPS)

Chỉnh sửa file `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
# InnoDB settings
innodb_buffer_pool_size = 512M
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2

# Query cache
query_cache_type = 1
query_cache_size = 64M

# Connections
max_connections = 150

# Character set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

```bash
sudo systemctl restart mysql
```

### 7.2. Backup Database

**Script backup tự động:**

```bash
#!/bin/bash
# /usr/local/bin/backup-dreamweldtech.sh

BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="dreamweldtech_$DATE.sql.gz"

mkdir -p $BACKUP_DIR
mysqldump -u dreamweld -p'your-password' dreamweldtech | gzip > $BACKUP_DIR/$FILENAME

# Xóa backup cũ hơn 7 ngày
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-dreamweldtech.sh

# Thêm vào crontab (backup hàng ngày lúc 2:00 AM)
sudo crontab -e
# Thêm: 0 2 * * * /usr/local/bin/backup-dreamweldtech.sh
```

### 7.3. Backup Trên cPanel

1. Vào cPanel → **Backup** hoặc **Backup Wizard**
2. Chọn **Download a MySQL Database Backup**
3. Chọn database `dreamweldtech`
4. Download file `.sql.gz`

---

## 8. Cấu Hình Biến Môi Trường

### Danh Sách Biến Môi Trường

| Biến | Mô tả | Bắt buộc |
|------|-------|----------|
| `NODE_ENV` | Môi trường (production) | ✅ |
| `PORT` | Port chạy ứng dụng (3000) | ✅ |
| `DATABASE_URL` | MySQL connection string | ✅ |
| `JWT_SECRET` | Secret key cho JWT (min 32 chars) | ✅ |
| `VITE_APP_TITLE` | Tiêu đề ứng dụng | ✅ |
| `SENDGRID_API_KEY` | API key SendGrid | ⚠️ |
| `ADMIN_ALERT_EMAIL` | Email nhận cảnh báo | ⚠️ |

### Format DATABASE_URL cho MySQL

```
mysql://username:password@host:port/database
```

**Ví dụ:**
- Local: `mysql://dreamweld:password123@localhost:3306/dreamweldtech`
- cPanel: `mysql://mbxxxx_dreamweld:password@localhost:3306/mbxxxx_dreamweldtech`

---

## 9. Cấu Hình Domain và SSL

### 9.1. Trỏ Domain Về Server

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | IP-Server | 3600 |
| A | www | IP-Server | 3600 |

### 9.2. SSL Trên cPanel

1. Vào cPanel → **SSL/TLS Status**
2. Chọn domain
3. Click **Run AutoSSL**

---

## 10. Kiểm Tra và Xử Lý Lỗi

### 10.1. Kiểm Tra Ứng Dụng

```bash
# Kiểm tra PM2
pm2 status
pm2 logs dreamweldtech --lines 100

# Kiểm tra MySQL
sudo systemctl status mysql
mysql -u dreamweld -p -e "SELECT 1"
```

### 10.2. Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `ECONNREFUSED :3306` | MySQL không chạy | `sudo systemctl start mysql` |
| `Access denied` | Sai username/password | Kiểm tra lại DATABASE_URL |
| `Unknown database` | Database chưa tạo | Tạo database trong MySQL |
| `502 Bad Gateway` | Node.js không chạy | `pm2 restart dreamweldtech` |

### 10.3. Health Check

```bash
curl https://dreamweldtech.com/api/health
curl https://dreamweldtech.com/api/health/simple
```

---

## 11. Bảo Trì và Cập Nhật

### 11.1. Cập Nhật Ứng Dụng

```bash
cd /var/www/dreamweldtech
git pull origin main
pnpm install
pnpm build
pnpm db:push
pm2 restart dreamweldtech
```

### 11.2. Script Deploy Tự Động

```bash
#!/bin/bash
# deploy.sh
set -e

echo "🚀 Starting deployment..."
cd /var/www/dreamweldtech

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building application..."
pnpm build

echo "🗄️ Running migrations..."
pnpm db:push

echo "🔄 Restarting application..."
pm2 restart dreamweldtech

echo "✅ Deployment completed!"
```

---

## 12. Liên Hệ Hỗ Trợ

### Hỗ Trợ Kỹ Thuật Mắt Bão

| Kênh | Thông tin |
|------|-----------|
| Hotline 24/7 | 1900 1830 (1.000đ/phút) |
| Miền Nam | (028) 3622 9999 |
| Miền Bắc | (024) 35 123456 |
| Email | support@matbao.net |
| Wiki | [wiki.matbao.net](https://wiki.matbao.net) |

### Tài Liệu Tham Khảo

- [Hướng dẫn sử dụng NodeJS trên Hosting](https://wiki.matbao.net/kb/huong-dan-su-dung-nodejs-va-xu-ly-cac-loi-co-ban/)
- [Cài đặt NodeJS app trên cPanel](https://wiki.matbao.net/kb/cai-dat-nodejs-app-tren-cpanel/)
- [Quản lý Database trên cPanel](https://wiki.matbao.net/kb/huong-dan-quan-ly-database-tren-cpanel-moi-nhat-2023/)

---

## Checklist Triển Khai

### Trước Khi Triển Khai
- [ ] Build ứng dụng thành công ở local
- [ ] Chuẩn bị file .env với DATABASE_URL MySQL
- [ ] Đóng gói ứng dụng
- [ ] Đăng ký gói hosting Mắt Bão

### Trong Quá Trình Triển Khai
- [ ] Tạo database MySQL trong cPanel
- [ ] Tạo user MySQL và gán quyền
- [ ] Upload code lên server
- [ ] Tạo Node.js App trong cPanel
- [ ] Cấu hình biến môi trường
- [ ] Cài đặt dependencies
- [ ] Chạy database migrations (`pnpm db:push`)
- [ ] Khởi động ứng dụng

### Sau Khi Triển Khai
- [ ] Kiểm tra health check endpoint
- [ ] Test đăng nhập và các chức năng chính
- [ ] Cấu hình SSL (AutoSSL)
- [ ] Thiết lập backup tự động

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 08/01/2026*
