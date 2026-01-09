# Hướng Dẫn Vận Hành DreamWeldTech

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Uptime Monitoring](#1-uptime-monitoring)
2. [Log Rotation](#2-log-rotation)
3. [Security Headers](#3-security-headers)

---

## 1. Uptime Monitoring

Uptime monitoring giúp bạn nhận thông báo ngay khi website gặp sự cố, giảm thiểu thời gian downtime.

### 1.1 So Sánh Các Dịch Vụ Monitoring

| Dịch vụ | Gói miễn phí | Tần suất check | Kênh thông báo | Đặc điểm |
|---------|--------------|----------------|----------------|----------|
| **UptimeRobot** | 50 monitors | 5 phút | Email, SMS, Slack, Telegram | Phổ biến, dễ dùng |
| **Pingdom** | 1 monitor | 1 phút | Email, SMS, Webhook | Chuyên nghiệp, chi tiết |
| **Better Uptime** | 10 monitors | 3 phút | Email, SMS, Slack, PagerDuty | UI đẹp, incident management |
| **Hetrix Tools** | 15 monitors | 1 phút | Email, Telegram, Discord | Miễn phí nhiều tính năng |

### 1.2 Thiết Lập UptimeRobot (Khuyến nghị)

#### Bước 1: Đăng ký tài khoản

1. Truy cập [uptimerobot.com](https://uptimerobot.com)
2. Click **Register for FREE**
3. Điền email và tạo password
4. Xác nhận email

#### Bước 2: Tạo Monitor cho Website

1. Đăng nhập và click **Add New Monitor**
2. Cấu hình:

| Trường | Giá trị |
|--------|---------|
| Monitor Type | HTTP(s) |
| Friendly Name | DreamWeldTech Website |
| URL | https://dreamweldtech.vn |
| Monitoring Interval | 5 minutes |

3. Click **Create Monitor**

#### Bước 3: Tạo Monitor cho API

1. Click **Add New Monitor**
2. Cấu hình:

| Trường | Giá trị |
|--------|---------|
| Monitor Type | HTTP(s) - Keyword |
| Friendly Name | DreamWeldTech API |
| URL | https://dreamweldtech.vn/api/trpc/health |
| Keyword | "status":"ok" |
| Monitoring Interval | 5 minutes |

#### Bước 4: Cấu hình Alert Contacts

1. Vào **My Settings** → **Alert Contacts**
2. Thêm các kênh thông báo:

**Email:**
- Click **Add Alert Contact**
- Type: Email
- Email: admin@dreamweldtech.vn

**Telegram:**
- Click **Add Alert Contact**
- Type: Telegram
- Làm theo hướng dẫn để kết nối bot

**Slack:**
- Click **Add Alert Contact**
- Type: Slack
- Nhập Webhook URL

#### Bước 5: Tạo Status Page (Tùy chọn)

1. Vào **Status Pages** → **Add Status Page**
2. Cấu hình:
   - Name: DreamWeldTech Status
   - Custom Domain: status.dreamweldtech.vn (tùy chọn)
3. Thêm các monitors vào status page
4. Chia sẻ link với khách hàng

### 1.3 Thiết Lập Pingdom

#### Đăng ký và tạo monitor

1. Truy cập [pingdom.com](https://www.pingdom.com)
2. Đăng ký gói Free hoặc Starter
3. Vào **Uptime** → **Add New**
4. Cấu hình tương tự UptimeRobot

### 1.4 Thiết Lập Better Uptime

1. Truy cập [betteruptime.com](https://betteruptime.com)
2. Đăng ký tài khoản miễn phí
3. Tạo monitors và cấu hình on-call schedules

### 1.5 Monitors Khuyến Nghị

Tạo các monitors sau để giám sát toàn diện:

| Monitor | URL/Endpoint | Type | Interval |
|---------|--------------|------|----------|
| Website | https://dreamweldtech.vn | HTTP(s) | 5 min |
| Admin Panel | https://dreamweldtech.vn/admin | HTTP(s) | 5 min |
| API Health | https://dreamweldtech.vn/api/trpc/health | Keyword | 5 min |
| SSL Certificate | https://dreamweldtech.vn | SSL | Daily |
| Database | (internal) | Port 3306 | 5 min |

---

## 2. Log Rotation

Log rotation ngăn chặn log files chiếm hết dung lượng disk và giúp quản lý logs hiệu quả.

### 2.1 Tại Sao Cần Log Rotation?

| Vấn đề không có log rotation | Giải pháp với log rotation |
|------------------------------|----------------------------|
| Log files tăng không giới hạn | Tự động xoay vòng theo kích thước/thời gian |
| Disk đầy → Website crash | Giữ dung lượng ổn định |
| Khó tìm kiếm trong log lớn | Chia nhỏ thành nhiều files |
| Không có lịch sử | Lưu trữ logs cũ có nén |

### 2.2 Cấu Hình Logrotate

#### Bước 1: Tạo file cấu hình

```bash
sudo nano /etc/logrotate.d/dreamweldtech
```

#### Bước 2: Thêm nội dung cấu hình

```
# DreamWeldTech Application Logs
/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        # Restart PM2 to reopen log files
        /usr/bin/pm2 reloadLogs 2>/dev/null || true
    endscript
}

# Backup Logs
/var/www/vhosts/dreamweldtech.vn/logs/*.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}

# Nginx Access Logs (nếu dùng nginx riêng)
/var/www/vhosts/dreamweldtech.vn/logs/nginx-access.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

# Nginx Error Logs
/var/www/vhosts/dreamweldtech.vn/logs/nginx-error.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 2.3 Giải Thích Các Options

| Option | Mô tả |
|--------|-------|
| `daily` | Xoay vòng hàng ngày |
| `weekly` | Xoay vòng hàng tuần |
| `rotate 14` | Giữ 14 files log cũ |
| `compress` | Nén files cũ bằng gzip |
| `delaycompress` | Không nén file mới nhất |
| `missingok` | Không báo lỗi nếu file không tồn tại |
| `notifempty` | Không xoay vòng nếu file rỗng |
| `create 0640` | Tạo file mới với quyền 0640 |
| `sharedscripts` | Chạy postrotate một lần cho tất cả files |
| `postrotate` | Script chạy sau khi xoay vòng |

### 2.4 Test Cấu Hình

```bash
# Test cấu hình (dry run)
sudo logrotate -d /etc/logrotate.d/dreamweldtech

# Force rotate để test
sudo logrotate -f /etc/logrotate.d/dreamweldtech

# Kiểm tra kết quả
ls -la /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech/logs/
```

### 2.5 Cấu Hình PM2 Log Rotation

Nếu sử dụng PM2, cài đặt module log rotation:

```bash
# Cài đặt pm2-logrotate
pm2 install pm2-logrotate

# Cấu hình
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateModule true
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval "0 0 * * *"

# Kiểm tra cấu hình
pm2 conf pm2-logrotate
```

### 2.6 Tạo Thư Mục Logs

```bash
# Tạo thư mục logs nếu chưa có
mkdir -p /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech/logs
mkdir -p /var/www/vhosts/dreamweldtech.vn/logs

# Cấp quyền
chown -R www-data:www-data /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech/logs
chmod 755 /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech/logs
```

### 2.7 Monitoring Disk Usage

Tạo script cảnh báo khi disk gần đầy:

```bash
nano /var/www/vhosts/dreamweldtech.vn/scripts/check-disk.sh
```

```bash
#!/bin/bash

THRESHOLD=80
ADMIN_EMAIL="admin@dreamweldtech.vn"

USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "WARNING: Disk usage is ${USAGE}% (threshold: ${THRESHOLD}%)" | \
    mail -s "DreamWeldTech Disk Alert" $ADMIN_EMAIL
fi
```

Thêm vào cron:

```bash
# Check disk usage every hour
0 * * * * /var/www/vhosts/dreamweldtech.vn/scripts/check-disk.sh
```

---

## 3. Security Headers

Security headers bảo vệ website khỏi các cuộc tấn công phổ biến như XSS, clickjacking, và MIME sniffing.

### 3.1 Các Security Headers Quan Trọng

| Header | Mục đích | Mức độ quan trọng |
|--------|----------|-------------------|
| **Content-Security-Policy (CSP)** | Ngăn XSS, injection attacks | Cao |
| **X-Frame-Options** | Ngăn clickjacking | Cao |
| **Strict-Transport-Security (HSTS)** | Bắt buộc HTTPS | Cao |
| **X-Content-Type-Options** | Ngăn MIME sniffing | Trung bình |
| **X-XSS-Protection** | Bật XSS filter của browser | Trung bình |
| **Referrer-Policy** | Kiểm soát thông tin referrer | Trung bình |
| **Permissions-Policy** | Kiểm soát browser features | Thấp |

### 3.2 Cấu Hình Security Headers trong Server

Tôi sẽ thêm security headers trực tiếp vào server code của DreamWeldTech.

### 3.3 Cấu Hình trong Nginx (Nếu dùng reverse proxy)

Thêm vào nginx config:

```nginx
# Security Headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# HSTS - Bắt buộc HTTPS trong 1 năm
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy
add_header Content-Security-Policy "
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://analytics.google.com;
    frame-src 'self' https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    upgrade-insecure-requests;
" always;
```

### 3.4 Cấu Hình trong Cloudflare

Nếu đã setup Cloudflare, có thể thêm headers qua Transform Rules:

1. Vào **Rules** → **Transform Rules**
2. Click **Create Rule**
3. Chọn **Modify Response Header**
4. Thêm các headers

### 3.5 Giải Thích Chi Tiết Các Headers

#### Content-Security-Policy (CSP)

CSP là header quan trọng nhất, kiểm soát nguồn tài nguyên được phép load:

```
Content-Security-Policy: 
    default-src 'self';                    # Mặc định chỉ cho phép từ cùng origin
    script-src 'self' 'unsafe-inline';     # Scripts từ cùng origin + inline
    style-src 'self' 'unsafe-inline';      # Styles từ cùng origin + inline
    img-src 'self' data: https:;           # Images từ cùng origin, data URI, HTTPS
    font-src 'self' https://fonts.gstatic.com;  # Fonts
    connect-src 'self' https://api.example.com; # API calls
    frame-src 'self';                      # iframes
    object-src 'none';                     # Không cho phép plugins
    upgrade-insecure-requests;             # Tự động upgrade HTTP → HTTPS
```

#### X-Frame-Options

Ngăn website bị nhúng trong iframe của site khác (clickjacking):

| Giá trị | Mô tả |
|---------|-------|
| `DENY` | Không cho phép nhúng trong bất kỳ iframe nào |
| `SAMEORIGIN` | Chỉ cho phép nhúng từ cùng origin |
| `ALLOW-FROM uri` | Cho phép từ URI cụ thể (deprecated) |

#### Strict-Transport-Security (HSTS)

Bắt buộc browser sử dụng HTTPS:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

| Directive | Mô tả |
|-----------|-------|
| `max-age=31536000` | Áp dụng trong 1 năm (giây) |
| `includeSubDomains` | Áp dụng cho tất cả subdomains |
| `preload` | Cho phép thêm vào HSTS preload list |

**Lưu ý:** Sau khi bật HSTS, website sẽ không thể truy cập qua HTTP. Đảm bảo SSL hoạt động tốt trước khi bật.

#### X-Content-Type-Options

Ngăn browser đoán MIME type:

```
X-Content-Type-Options: nosniff
```

#### Referrer-Policy

Kiểm soát thông tin referrer gửi đi:

| Giá trị | Mô tả |
|---------|-------|
| `no-referrer` | Không gửi referrer |
| `same-origin` | Chỉ gửi cho cùng origin |
| `strict-origin` | Gửi origin cho HTTPS, không gửi cho HTTP |
| `strict-origin-when-cross-origin` | Gửi đầy đủ cho cùng origin, chỉ origin cho cross-origin |

### 3.6 Kiểm Tra Security Headers

Sử dụng các công cụ sau để kiểm tra:

1. **Security Headers:** https://securityheaders.com
2. **Mozilla Observatory:** https://observatory.mozilla.org
3. **SSL Labs:** https://www.ssllabs.com/ssltest/

### 3.7 CSP Report-Only Mode

Trước khi áp dụng CSP strict, test với report-only mode:

```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /api/csp-report
```

Điều này sẽ báo cáo vi phạm mà không block, giúp bạn điều chỉnh policy phù hợp.

---

## Checklist Hoàn Thành

### Uptime Monitoring
- [ ] Đăng ký UptimeRobot/Pingdom
- [ ] Tạo monitor cho website
- [ ] Tạo monitor cho API
- [ ] Cấu hình alert contacts (Email, Telegram, Slack)
- [ ] Tạo status page (tùy chọn)
- [ ] Test nhận thông báo

### Log Rotation
- [ ] Tạo file cấu hình logrotate
- [ ] Test cấu hình với dry run
- [ ] Force rotate để kiểm tra
- [ ] Cài đặt pm2-logrotate (nếu dùng PM2)
- [ ] Tạo script check disk usage
- [ ] Thêm cron job cho disk check

### Security Headers
- [ ] Thêm security headers vào server/nginx
- [ ] Test với securityheaders.com
- [ ] Test với Mozilla Observatory
- [ ] Điều chỉnh CSP nếu cần
- [ ] Bật HSTS sau khi xác nhận SSL OK

---

## Tài Liệu Tham Khảo

1. [UptimeRobot Documentation](https://uptimerobot.com/help/)
2. [Logrotate Manual](https://linux.die.net/man/8/logrotate)
3. [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
4. [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
