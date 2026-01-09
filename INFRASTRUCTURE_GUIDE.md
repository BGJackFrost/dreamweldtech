# Hướng Dẫn Cấu Hình Hạ Tầng DreamWeldTech

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Xác Thực Domain SendGrid](#1-xác-thực-domain-sendgrid)
2. [Cấu Hình Cloudflare CDN](#2-cấu-hình-cloudflare-cdn)
3. [Backup Database Tự Động](#3-backup-database-tự-động)

---

## 1. Xác Thực Domain SendGrid

Xác thực domain giúp email của bạn không bị đánh dấu là spam và tăng tỷ lệ gửi thành công.

### 1.1 Tại Sao Cần Xác Thực Domain?

| Vấn đề khi chưa xác thực | Lợi ích khi đã xác thực |
|--------------------------|-------------------------|
| Email vào thư mục Spam | Email vào Inbox |
| Hiển thị "via sendgrid.net" | Hiển thị domain của bạn |
| Tỷ lệ gửi thấp (~60%) | Tỷ lệ gửi cao (~95%) |
| Dễ bị block bởi Gmail/Outlook | Được tin tưởng bởi email providers |

### 1.2 Các Bước Xác Thực Domain

#### Bước 1: Đăng nhập SendGrid

Truy cập [SendGrid Dashboard](https://app.sendgrid.com) và đăng nhập.

#### Bước 2: Vào Settings → Sender Authentication

1. Click **Settings** ở menu bên trái
2. Chọn **Sender Authentication**
3. Click **Authenticate Your Domain**

#### Bước 3: Chọn DNS Host

1. Chọn DNS host của bạn (thường là **Other Host** nếu dùng Mắt Bão)
2. Click **Next**

#### Bước 4: Nhập Domain

1. Nhập domain: `dreamweldtech.vn`
2. Chọn **Advanced Settings** (tùy chọn):
   - ☑️ Use automated security
   - ☑️ Use custom return path
3. Click **Next**

#### Bước 5: Thêm DNS Records

SendGrid sẽ cung cấp các DNS records cần thêm. Thông thường bao gồm:

**CNAME Records:**

| Type | Host | Value |
|------|------|-------|
| CNAME | `em1234.dreamweldtech.vn` | `u1234567.wl123.sendgrid.net` |
| CNAME | `s1._domainkey.dreamweldtech.vn` | `s1.domainkey.u1234567.wl123.sendgrid.net` |
| CNAME | `s2._domainkey.dreamweldtech.vn` | `s2.domainkey.u1234567.wl123.sendgrid.net` |

**Lưu ý:** Giá trị thực tế sẽ khác, hãy sao chép từ SendGrid.

#### Bước 6: Thêm DNS Records vào Mắt Bão

1. Đăng nhập **Plesk Control Panel**
2. Vào **Websites & Domains** → **DNS Settings**
3. Click **Add Record** cho mỗi record
4. Điền thông tin:
   - **Record type:** CNAME
   - **Domain name:** (host từ SendGrid)
   - **Points to:** (value từ SendGrid)
5. Click **OK** để lưu

#### Bước 7: Xác Minh

1. Quay lại SendGrid
2. Click **Verify**
3. Đợi 24-48 giờ để DNS propagate
4. Trạng thái sẽ chuyển sang **Verified** ✅

### 1.3 Cấu Hình SPF và DKIM (Tự động)

Khi bạn xác thực domain với SendGrid, SPF và DKIM sẽ được cấu hình tự động thông qua các CNAME records.

### 1.4 Thêm DMARC Record (Khuyến nghị)

DMARC giúp bảo vệ domain khỏi email spoofing.

**Thêm TXT record:**

| Type | Host | Value |
|------|------|-------|
| TXT | `_dmarc.dreamweldtech.vn` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@dreamweldtech.vn` |

### 1.5 Kiểm Tra Cấu Hình Email

Sử dụng các công cụ sau để kiểm tra:

1. **Mail Tester:** https://www.mail-tester.com - Gửi email test và nhận điểm
2. **MXToolbox:** https://mxtoolbox.com/SuperTool.aspx - Kiểm tra DNS records
3. **Google Postmaster:** https://postmaster.google.com - Theo dõi reputation với Gmail

---

## 2. Cấu Hình Cloudflare CDN

Cloudflare cung cấp CDN miễn phí, bảo vệ DDoS, và SSL tự động.

### 2.1 Lợi Ích Của Cloudflare

| Tính năng | Mô tả |
|-----------|-------|
| **CDN** | Cache static files tại 300+ data centers toàn cầu |
| **DDoS Protection** | Bảo vệ khỏi tấn công DDoS miễn phí |
| **SSL/TLS** | Chứng chỉ SSL miễn phí và tự động gia hạn |
| **Firewall** | WAF (Web Application Firewall) cơ bản |
| **Analytics** | Thống kê traffic và threats |
| **Page Rules** | Tùy chỉnh caching và redirects |

### 2.2 Đăng Ký Cloudflare

1. Truy cập [cloudflare.com](https://cloudflare.com)
2. Click **Sign Up**
3. Nhập email và tạo password
4. Xác nhận email

### 2.3 Thêm Website

#### Bước 1: Add Site

1. Click **Add a Site**
2. Nhập domain: `dreamweldtech.vn`
3. Click **Add Site**

#### Bước 2: Chọn Plan

1. Chọn **Free** plan (đủ cho hầu hết websites)
2. Click **Continue**

#### Bước 3: Xem Xét DNS Records

Cloudflare sẽ tự động scan DNS records hiện tại. Kiểm tra và đảm bảo:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | dreamweldtech.vn | IP của server | ☁️ Proxied |
| A | www | IP của server | ☁️ Proxied |
| CNAME | (SendGrid records) | ... | ☁️ DNS only |

**Lưu ý:** 
- Bật **Proxied** (☁️ cam) cho website chính
- Để **DNS only** (☁️ xám) cho email records

#### Bước 4: Thay Đổi Nameservers

Cloudflare sẽ cung cấp 2 nameservers mới, ví dụ:

```
aria.ns.cloudflare.com
bob.ns.cloudflare.com
```

**Thay đổi nameservers tại Mắt Bão:**

1. Đăng nhập [Mắt Bão Customer Portal](https://matbao.net)
2. Vào **Quản lý tên miền**
3. Chọn domain `dreamweldtech.vn`
4. Click **Thay đổi Nameserver**
5. Xóa nameservers cũ
6. Thêm 2 nameservers của Cloudflare
7. Click **Lưu**

**Thời gian propagate:** 24-48 giờ

### 2.4 Cấu Hình SSL/TLS

Sau khi nameservers đã propagate:

1. Vào **SSL/TLS** → **Overview**
2. Chọn encryption mode: **Full (strict)**
3. Vào **Edge Certificates**:
   - ☑️ Always Use HTTPS
   - ☑️ Automatic HTTPS Rewrites
   - ☑️ TLS 1.3

### 2.5 Cấu Hình Caching

#### Page Rules (3 rules miễn phí)

**Rule 1: Cache static assets**
- URL: `*dreamweldtech.vn/assets/*`
- Settings: 
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

**Rule 2: Bypass cache for admin**
- URL: `*dreamweldtech.vn/admin/*`
- Settings:
  - Cache Level: Bypass
  - Security Level: High

**Rule 3: Bypass cache for API**
- URL: `*dreamweldtech.vn/api/*`
- Settings:
  - Cache Level: Bypass

#### Caching Configuration

1. Vào **Caching** → **Configuration**
2. Cấu hình:
   - **Caching Level:** Standard
   - **Browser Cache TTL:** 4 hours
   - **Always Online:** ON

### 2.6 Cấu Hình Security

#### Firewall Rules

1. Vào **Security** → **WAF**
2. Bật **Managed Rules** (nếu có plan Pro)
3. Tạo custom rules:

**Block bad bots:**
```
(cf.client.bot) and not (cf.client.bot eq "googlebot") and not (cf.client.bot eq "bingbot")
```

**Rate limiting cho login:**
```
(http.request.uri.path contains "/admin/login") and (rate(5m) > 10)
```

#### Bot Fight Mode

1. Vào **Security** → **Bots**
2. Bật **Bot Fight Mode**

### 2.7 Cấu Hình Performance

1. Vào **Speed** → **Optimization**
2. Bật các tính năng:
   - ☑️ Auto Minify (JavaScript, CSS, HTML)
   - ☑️ Brotli Compression
   - ☑️ Early Hints
   - ☑️ Rocket Loader (thử nghiệm)

### 2.8 Kiểm Tra Cloudflare

Sau khi cấu hình xong:

1. **Check propagation:** https://dnschecker.org
2. **Test SSL:** https://www.ssllabs.com/ssltest/
3. **Test performance:** https://www.webpagetest.org

---

## 3. Backup Database Tự Động

Backup thường xuyên là cực kỳ quan trọng để bảo vệ dữ liệu.

### 3.1 Chiến Lược Backup

| Loại backup | Tần suất | Lưu trữ |
|-------------|----------|---------|
| Full backup | Hàng ngày | 7 ngày gần nhất |
| Weekly backup | Hàng tuần | 4 tuần gần nhất |
| Monthly backup | Hàng tháng | 12 tháng gần nhất |

### 3.2 Tạo Script Backup

#### Bước 1: Tạo thư mục backup

```bash
mkdir -p /var/www/vhosts/dreamweldtech.vn/backups
chmod 700 /var/www/vhosts/dreamweldtech.vn/backups
```

#### Bước 2: Tạo script backup

```bash
nano /var/www/vhosts/dreamweldtech.vn/scripts/backup-db.sh
```

Nội dung script:

```bash
#!/bin/bash

# =====================================================
# DreamWeldTech Database Backup Script
# =====================================================

# Configuration
DB_USER="dreamweldtech_user"
DB_PASS="YOUR_DATABASE_PASSWORD"
DB_NAME="dreamweldtech_db"
BACKUP_DIR="/var/www/vhosts/dreamweldtech.vn/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Create backup
echo "[$(date)] Starting backup..."
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed: db_backup_$DATE.sql.gz"
    
    # Get backup size
    SIZE=$(ls -lh $BACKUP_DIR/db_backup_$DATE.sql.gz | awk '{print $5}')
    echo "[$(date)] Backup size: $SIZE"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Delete old backups
echo "[$(date)] Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List remaining backups
echo "[$(date)] Current backups:"
ls -lh $BACKUP_DIR/db_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo "[$(date)] Backup process completed"
```

#### Bước 3: Cấp quyền thực thi

```bash
chmod +x /var/www/vhosts/dreamweldtech.vn/scripts/backup-db.sh
```

#### Bước 4: Test script

```bash
/var/www/vhosts/dreamweldtech.vn/scripts/backup-db.sh
```

### 3.3 Thiết Lập Cron Job

#### Phương pháp 1: Qua Plesk

1. Vào **Websites & Domains** → **Scheduled Tasks**
2. Click **Add Task**
3. Cấu hình:
   - **Task type:** Run a command
   - **Command:** `/var/www/vhosts/dreamweldtech.vn/scripts/backup-db.sh`
   - **Run:** Daily at 2:00 AM

#### Phương pháp 2: Qua SSH

```bash
crontab -e
```

Thêm dòng:

```cron
# Daily backup at 2:00 AM
0 2 * * * /var/www/vhosts/dreamweldtech.vn/scripts/backup-db.sh >> /var/www/vhosts/dreamweldtech.vn/logs/backup.log 2>&1

# Weekly full backup on Sunday at 3:00 AM
0 3 * * 0 /var/www/vhosts/dreamweldtech.vn/scripts/backup-weekly.sh >> /var/www/vhosts/dreamweldtech.vn/logs/backup.log 2>&1
```

### 3.4 Backup Files (Tùy chọn)

Tạo script backup files:

```bash
nano /var/www/vhosts/dreamweldtech.vn/scripts/backup-files.sh
```

```bash
#!/bin/bash

# Configuration
SOURCE_DIR="/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech"
BACKUP_DIR="/var/www/vhosts/dreamweldtech.vn/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Exclude node_modules and dist
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.git' \
    -C $SOURCE_DIR .

echo "[$(date)] Files backup completed: files_backup_$DATE.tar.gz"
```

### 3.5 Backup Lên Cloud Storage (Khuyến nghị)

#### Sử dụng rclone để sync lên Google Drive/S3

```bash
# Cài đặt rclone
curl https://rclone.org/install.sh | sudo bash

# Cấu hình
rclone config

# Sync backups lên cloud
rclone sync /var/www/vhosts/dreamweldtech.vn/backups remote:dreamweldtech-backups
```

### 3.6 Script Restore Database

```bash
nano /var/www/vhosts/dreamweldtech.vn/scripts/restore-db.sh
```

```bash
#!/bin/bash

# Usage: ./restore-db.sh backup_file.sql.gz

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lh /var/www/vhosts/dreamweldtech.vn/backups/db_backup_*.sql.gz
    exit 1
fi

BACKUP_FILE=$1
DB_USER="dreamweldtech_user"
DB_PASS="YOUR_DATABASE_PASSWORD"
DB_NAME="dreamweldtech_db"

echo "[$(date)] Restoring from $BACKUP_FILE..."

# Decompress and restore
gunzip -c $BACKUP_FILE | mysql -u$DB_USER -p$DB_PASS $DB_NAME

if [ $? -eq 0 ]; then
    echo "[$(date)] Restore completed successfully!"
else
    echo "[$(date)] ERROR: Restore failed!"
    exit 1
fi
```

### 3.7 Monitoring Backups

Thêm script kiểm tra backup:

```bash
nano /var/www/vhosts/dreamweldtech.vn/scripts/check-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/www/vhosts/dreamweldtech.vn/backups"
ADMIN_EMAIL="admin@dreamweldtech.vn"

# Check if backup from today exists
TODAY=$(date +%Y%m%d)
BACKUP_COUNT=$(ls $BACKUP_DIR/db_backup_${TODAY}*.sql.gz 2>/dev/null | wc -l)

if [ $BACKUP_COUNT -eq 0 ]; then
    echo "WARNING: No backup found for today ($TODAY)" | mail -s "DreamWeldTech Backup Alert" $ADMIN_EMAIL
    exit 1
fi

echo "Backup check passed. Found $BACKUP_COUNT backup(s) for today."
```

Thêm vào cron (chạy lúc 6:00 AM để kiểm tra backup đêm qua):

```cron
0 6 * * * /var/www/vhosts/dreamweldtech.vn/scripts/check-backup.sh
```

---

## Checklist Hoàn Thành

### SendGrid Domain Verification
- [ ] Đăng nhập SendGrid
- [ ] Vào Sender Authentication
- [ ] Thêm CNAME records vào DNS
- [ ] Verify domain
- [ ] Thêm DMARC record
- [ ] Test gửi email

### Cloudflare Setup
- [ ] Đăng ký tài khoản Cloudflare
- [ ] Thêm website
- [ ] Thay đổi nameservers
- [ ] Cấu hình SSL/TLS
- [ ] Thiết lập Page Rules
- [ ] Bật security features
- [ ] Test website

### Database Backup
- [ ] Tạo thư mục backup
- [ ] Tạo script backup
- [ ] Test script thủ công
- [ ] Thiết lập cron job
- [ ] Tạo script restore
- [ ] Test restore
- [ ] Thiết lập backup monitoring

---

## Tài Liệu Tham Khảo

1. [SendGrid Domain Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
2. [Cloudflare Getting Started](https://developers.cloudflare.com/fundamentals/get-started/)
3. [MySQL Backup Best Practices](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
