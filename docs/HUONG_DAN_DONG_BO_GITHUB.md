# Hướng Dẫn Đồng Bộ Mã Nguồn Từ GitHub Lên Mắt Bão

**Ngày cập nhật:** 08/01/2026

---

## Mục Lục

1. [Cách 1: Sử dụng Terminal trong cPanel (Khuyến nghị)](#cách-1-sử-dụng-terminal-trong-cpanel-khuyến-nghị)
2. [Cách 2: Sử dụng Git Deploy trong cPanel](#cách-2-sử-dụng-git-deploy-trong-cpanel)
3. [Cách 3: Upload thủ công qua File Manager](#cách-3-upload-thủ-công-qua-file-manager)
4. [Cách 4: Sử dụng FTP/SFTP](#cách-4-sử-dụng-ftpsftp)
5. [Sau khi đồng bộ: Các bước cần thực hiện](#sau-khi-đồng-bộ-các-bước-cần-thực-hiện)

---

## Cách 1: Sử dụng Terminal trong cPanel (Khuyến nghị)

Đây là cách nhanh nhất và đơn giản nhất nếu bạn đã clone repository trước đó.

### Bước 1: Mở Terminal

1. Đăng nhập vào cPanel của Mắt Bão
2. Tìm mục **Advanced** → **Terminal**
3. Click để mở Terminal

### Bước 2: Di chuyển đến thư mục dự án

```bash
cd ~/public_html/dreamweldtech
```

Hoặc nếu dự án nằm ở thư mục khác:

```bash
cd ~/public_html/your-folder-name
```

### Bước 3: Pull code mới từ GitHub

```bash
# Kiểm tra trạng thái hiện tại
git status

# Pull code mới nhất từ branch main
git pull origin main
```

**Nếu gặp lỗi conflict:**

```bash
# Hủy các thay đổi local và lấy code mới
git fetch origin
git reset --hard origin/main
```

### Bước 4: Cài đặt dependencies mới (nếu có)

```bash
# Vào môi trường Node.js
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate

# Cài đặt dependencies
npm install --legacy-peer-deps
```

### Bước 5: Build lại ứng dụng

```bash
npm run build
```

### Bước 6: Chạy database migration (nếu có thay đổi schema)

```bash
npm run db:push
```

### Bước 7: Restart ứng dụng

1. Quay lại cPanel → **Setup Node.js App**
2. Tìm ứng dụng DreamWeldTech
3. Click **Restart**

---

## Cách 2: Sử dụng Git Deploy trong cPanel

Nếu Mắt Bão hỗ trợ tính năng Git Version Control trong cPanel.

### Bước 1: Truy cập Git Version Control

1. Đăng nhập cPanel
2. Tìm mục **Files** → **Git Version Control**

### Bước 2: Quản lý Repository

1. Nếu chưa có repository:
   - Click **Create**
   - Nhập URL: `https://github.com/BGJackFrost/BGJackFrost.git`
   - Chọn thư mục: `/home/cpanelusername/public_html/dreamweldtech`
   - Click **Create**

2. Nếu đã có repository:
   - Tìm repository trong danh sách
   - Click **Manage**
   - Click **Pull or Deploy** → **Update from Remote**

### Bước 3: Sau khi pull xong

Mở Terminal và chạy:

```bash
cd ~/public_html/dreamweldtech
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate
npm install --legacy-peer-deps
npm run build
npm run db:push
```

---

## Cách 3: Upload thủ công qua File Manager

Sử dụng khi không thể dùng Git hoặc cần upload nhanh.

### Bước 1: Tải code từ GitHub

1. Truy cập repository: https://github.com/BGJackFrost/BGJackFrost
2. Click nút **Code** (màu xanh)
3. Chọn **Download ZIP**
4. Giải nén file ZIP trên máy local

### Bước 2: Chuẩn bị file upload

**Quan trọng:** Chỉ upload các file đã thay đổi, không cần upload `node_modules`

Các thư mục/file quan trọng cần upload:
- `client/` - Frontend code
- `server/` - Backend code
- `shared/` - Shared code
- `drizzle/` - Database schema
- `package.json` - Dependencies
- `vite.config.ts` - Vite config
- `tsconfig.json` - TypeScript config

### Bước 3: Upload lên Mắt Bão

1. Đăng nhập cPanel → **File Manager**
2. Truy cập thư mục `public_html/dreamweldtech`
3. **Backup trước:** Tạo bản sao thư mục cũ
   - Click chuột phải → **Compress** → Đặt tên `backup-YYYYMMDD.zip`
4. Upload file mới:
   - Click **Upload**
   - Chọn các file/thư mục cần upload
   - Nếu upload file ZIP, sau đó Extract

### Bước 4: Rebuild ứng dụng

Mở Terminal:

```bash
cd ~/public_html/dreamweldtech
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate
npm install --legacy-peer-deps
npm run build
npm run db:push
```

---

## Cách 4: Sử dụng FTP/SFTP

### Bước 1: Lấy thông tin FTP

1. Đăng nhập cPanel
2. Tìm mục **Files** → **FTP Accounts**
3. Tạo FTP account mới hoặc sử dụng account có sẵn
4. Ghi nhớ thông tin:
   - Host: `ftp.yourdomain.com` hoặc IP server
   - Username: `cpanelusername@yourdomain.com`
   - Password: (password bạn đặt)
   - Port: 21 (FTP) hoặc 22 (SFTP)

### Bước 2: Kết nối bằng FileZilla

1. Tải FileZilla: https://filezilla-project.org/
2. Mở FileZilla
3. Nhập thông tin kết nối:
   - Host: `sftp://your-server-ip`
   - Username: `cpanelusername`
   - Password: (password cPanel)
   - Port: 22
4. Click **Quickconnect**

### Bước 3: Upload files

1. Bên trái (Local): Chọn thư mục chứa code mới
2. Bên phải (Remote): Navigate đến `/public_html/dreamweldtech`
3. Kéo thả các file/thư mục cần upload
4. Chọn **Overwrite** khi được hỏi

### Bước 4: Rebuild ứng dụng

Sau khi upload xong, mở Terminal trong cPanel và chạy các lệnh build.

---

## Sau khi đồng bộ: Các bước cần thực hiện

### Checklist bắt buộc

```bash
# 1. Vào môi trường Node.js
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate

# 2. Cài đặt dependencies (nếu package.json thay đổi)
npm install --legacy-peer-deps

# 3. Build ứng dụng
npm run build

# 4. Chạy database migration (nếu schema thay đổi)
npm run db:push

# 5. Kiểm tra lỗi
npm run check
```

### Restart ứng dụng

1. Vào cPanel → **Setup Node.js App**
2. Tìm ứng dụng DreamWeldTech
3. Click **Restart**

### Kiểm tra website

1. Truy cập website: `https://yourdomain.com`
2. Kiểm tra các trang chính:
   - Trang chủ
   - Sản phẩm
   - Tin tức
   - Liên hệ
3. Kiểm tra Console trong DevTools (F12) xem có lỗi không

### Kiểm tra health endpoint

```
https://yourdomain.com/api/health
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": "...",
  "timestamp": "..."
}
```

---

## Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Permission denied" khi git pull

```bash
# Kiểm tra quyền
ls -la

# Sửa quyền nếu cần
chmod -R 755 .
```

### Lỗi 2: "npm: command not found"

```bash
# Vào môi trường Node.js trước
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate
```

### Lỗi 3: "ERESOLVE unable to resolve dependency tree"

```bash
# Sử dụng flag legacy-peer-deps
npm install --legacy-peer-deps
```

### Lỗi 4: Website hiển thị lỗi 502/503

1. Kiểm tra ứng dụng đã start chưa trong **Setup Node.js App**
2. Kiểm tra log lỗi:
   ```bash
   cat ~/logs/nodejs/dreamweldtech.log
   ```
3. Restart ứng dụng

### Lỗi 5: Database connection failed

1. Kiểm tra DATABASE_URL trong Environment Variables
2. Kiểm tra MySQL service đang chạy
3. Kiểm tra username/password đúng

---

## Script Tự Động Hóa

Tạo file `deploy.sh` trong thư mục dự án:

```bash
#!/bin/bash

echo "🚀 Bắt đầu deploy DreamWeldTech..."

# Pull code mới
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Vào môi trường Node.js
source /home/cpanelusername/nodevenv/dreamweldtech/20/bin/activate

# Cài đặt dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Build
echo "🔨 Building application..."
npm run build

# Database migration
echo "🗄️ Running database migrations..."
npm run db:push

echo "✅ Deploy hoàn tất!"
echo "⚠️ Nhớ restart ứng dụng trong cPanel → Setup Node.js App"
```

Chạy script:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Tóm Tắt Nhanh

| Phương pháp | Ưu điểm | Nhược điểm |
|-------------|---------|------------|
| **Terminal + Git** | Nhanh, dễ dàng | Cần biết Git cơ bản |
| **Git Version Control** | Giao diện đồ họa | Không phải hosting nào cũng có |
| **File Manager** | Trực quan | Chậm với nhiều file |
| **FTP/SFTP** | Linh hoạt | Cần cài phần mềm |

**Khuyến nghị:** Sử dụng **Terminal + Git** cho việc deploy thường xuyên.

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 08/01/2026*
