# Hướng Dẫn Cài Đặt MySQL Trên Windows

**Phiên bản:** 1.0  
**Ngày cập nhật:** 08/01/2026

---

## Mục Lục

1. [Tải MySQL Installer](#1-tải-mysql-installer)
2. [Cài Đặt MySQL](#2-cài-đặt-mysql)
3. [Cấu Hình MySQL](#3-cấu-hình-mysql)
4. [Tạo Database Cho DreamWeldTech](#4-tạo-database-cho-dreamweldtech)
5. [Cấu Hình Dự Án](#5-cấu-hình-dự-án)
6. [Chạy Ứng Dụng](#6-chạy-ứng-dụng)
7. [Công Cụ Quản Lý MySQL](#7-công-cụ-quản-lý-mysql)
8. [Xử Lý Lỗi Thường Gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Tải MySQL Installer

### Bước 1: Truy cập trang download

Mở trình duyệt và truy cập: **https://dev.mysql.com/downloads/installer/**

### Bước 2: Chọn phiên bản

- Chọn **MySQL Installer for Windows**
- Khuyến nghị tải bản **mysql-installer-community** (khoảng 300MB)
- Click **Download**

### Bước 3: Bỏ qua đăng ký

- Khi được hỏi đăng nhập Oracle, click **"No thanks, just start my download"**

---

## 2. Cài Đặt MySQL

### Bước 1: Chạy Installer

- Double-click file `mysql-installer-community-x.x.x.msi` đã tải
- Nếu có cảnh báo UAC, click **Yes**

### Bước 2: Chọn Setup Type

Chọn **Custom** để cài đặt những gì cần thiết:

![Setup Type](https://dev.mysql.com/doc/refman/8.0/en/images/mi-setup-type-devdefault.png)

### Bước 3: Chọn Products

Trong màn hình **Select Products**, chọn các thành phần sau:

| Thành phần | Mô tả |
|------------|-------|
| **MySQL Server 8.0.x** | Database server (BẮT BUỘC) |
| **MySQL Workbench** | GUI quản lý database (KHUYẾN NGHỊ) |
| **MySQL Shell** | Command line tool (TÙY CHỌN) |

Click mũi tên **→** để thêm vào danh sách cài đặt, sau đó click **Next**

### Bước 4: Execute Installation

- Click **Execute** để bắt đầu cài đặt
- Đợi tất cả các thành phần được cài đặt (có dấu ✓)
- Click **Next**

---

## 3. Cấu Hình MySQL

### Bước 1: Type and Networking

| Cấu hình | Giá trị |
|----------|---------|
| Config Type | Development Computer |
| Port | **3306** (mặc định) |
| X Protocol Port | 33060 (mặc định) |

Click **Next**

### Bước 2: Authentication Method

- Chọn **Use Strong Password Encryption** (khuyến nghị)
- Click **Next**

### Bước 3: Accounts and Roles

**ĐÂY LÀ BƯỚC QUAN TRỌNG!**

Đặt password cho tài khoản **root**:

| Trường | Giá trị |
|--------|---------|
| MySQL Root Password | Nhập password (ghi nhớ!) |
| Repeat Password | Nhập lại password |

**Ví dụ password:** `DreamWeld@2024`

> ⚠️ **LƯU Ý:** Ghi nhớ password này! Bạn sẽ cần nó để kết nối database.

Click **Next**

### Bước 4: Windows Service

| Cấu hình | Giá trị |
|----------|---------|
| Configure MySQL Server as a Windows Service | ✅ Checked |
| Windows Service Name | MySQL80 |
| Start the MySQL Server at System Startup | ✅ Checked |
| Run Windows Service as | Standard System Account |

Click **Next**

### Bước 5: Server File Permissions

- Chọn **Yes, grant full access...** (mặc định)
- Click **Next**

### Bước 6: Apply Configuration

- Click **Execute** để áp dụng cấu hình
- Đợi tất cả các bước hoàn thành (có dấu ✓)
- Click **Finish**

### Bước 7: Hoàn tất

- Click **Next** và **Finish** để hoàn tất cài đặt

---

## 4. Tạo Database Cho DreamWeldTech

### Cách 1: Sử dụng MySQL Workbench (GUI)

**Bước 1:** Mở MySQL Workbench từ Start Menu

**Bước 2:** Click vào connection **Local instance MySQL80**

**Bước 3:** Nhập password root và click **OK**

**Bước 4:** Trong Query Editor, chạy các lệnh sau:

```sql
-- Tạo database
CREATE DATABASE dreamweldtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user (tùy chọn, có thể dùng root)
CREATE USER 'dreamweld'@'localhost' IDENTIFIED BY 'YourPassword123!';

-- Cấp quyền cho user
GRANT ALL PRIVILEGES ON dreamweldtech.* TO 'dreamweld'@'localhost';

-- Áp dụng thay đổi
FLUSH PRIVILEGES;

-- Kiểm tra database đã tạo
SHOW DATABASES;
```

**Bước 5:** Click biểu tượng ⚡ (Execute) hoặc nhấn **Ctrl + Enter**

### Cách 2: Sử dụng Command Line

**Bước 1:** Mở **Command Prompt** (cmd) với quyền Administrator

**Bước 2:** Kết nối MySQL:

```cmd
mysql -u root -p
```

Nhập password root khi được hỏi

**Bước 3:** Chạy các lệnh SQL:

```sql
CREATE DATABASE dreamweldtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dreamweld'@'localhost' IDENTIFIED BY 'YourPassword123!';
GRANT ALL PRIVILEGES ON dreamweldtech.* TO 'dreamweld'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 5. Cấu Hình Dự Án

### Bước 1: Mở thư mục dự án

```cmd
cd C:\path\to\dreamweldtech
```

### Bước 2: Tạo file .env

Copy file mẫu:

```cmd
copy .env.example .env
```

### Bước 3: Chỉnh sửa file .env

Mở file `.env` bằng Notepad hoặc VS Code và cập nhật:

```env
# Database MySQL - CẬP NHẬT THEO THÔNG TIN CỦA BẠN
DATABASE_URL=mysql://root:DreamWeld@2024@localhost:3306/dreamweldtech

# Hoặc nếu tạo user riêng:
# DATABASE_URL=mysql://dreamweld:YourPassword123!@localhost:3306/dreamweldtech

# Server
NODE_ENV=development
PORT=3000

# JWT Secret (tạo chuỗi ngẫu nhiên 32+ ký tự)
JWT_SECRET=your-super-secret-key-at-least-32-characters

# App Info
VITE_APP_TITLE=DreamWeldTech
VITE_APP_ID=dreamweldtech
```

### Bước 4: Cài đặt dependencies

```cmd
pnpm install
```

### Bước 5: Chạy database migration

```cmd
pnpm db:push
```

Lệnh này sẽ tạo tất cả các bảng trong database.

---

## 6. Chạy Ứng Dụng

### Chế độ Development

```cmd
pnpm dev
```

Mở trình duyệt và truy cập: **http://localhost:3000**

### Kiểm tra kết nối database

Truy cập: **http://localhost:3000/api/health**

Nếu thấy `"database": "connected"` là thành công!

### Quản lý database trực quan

```cmd
pnpm db:studio
```

Mở trình duyệt: **http://localhost:4983**

---

## 7. Công Cụ Quản Lý MySQL

### MySQL Workbench (Khuyến nghị)

- Đã cài đặt cùng MySQL
- Giao diện đồ họa dễ sử dụng
- Hỗ trợ thiết kế schema, query, backup

### HeidiSQL (Miễn phí, nhẹ)

- Tải từ: https://www.heidisql.com/download.php
- Giao diện đơn giản, nhẹ
- Hỗ trợ MySQL, MariaDB, PostgreSQL

### DBeaver (Miễn phí, đa năng)

- Tải từ: https://dbeaver.io/download/
- Hỗ trợ nhiều loại database
- Nhiều tính năng nâng cao

---

## 8. Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Can't connect to MySQL server on 'localhost'"

**Nguyên nhân:** MySQL service chưa chạy

**Giải pháp:**

1. Nhấn `Win + R`, gõ `services.msc`, Enter
2. Tìm **MySQL80**
3. Click chuột phải → **Start**

Hoặc chạy trong Command Prompt (Admin):

```cmd
net start MySQL80
```

### Lỗi 2: "Access denied for user 'root'@'localhost'"

**Nguyên nhân:** Sai password

**Giải pháp:**

1. Kiểm tra lại password trong file `.env`
2. Đảm bảo không có ký tự đặc biệt cần escape
3. Nếu quên password, reset bằng MySQL Installer

### Lỗi 3: "Unknown database 'dreamweldtech'"

**Nguyên nhân:** Database chưa được tạo

**Giải pháp:**

```cmd
mysql -u root -p -e "CREATE DATABASE dreamweldtech CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Lỗi 4: "ER_NOT_SUPPORTED_AUTH_MODE"

**Nguyên nhân:** MySQL 8.0 sử dụng authentication mới

**Giải pháp:**

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourPassword';
FLUSH PRIVILEGES;
```

### Lỗi 5: Port 3306 đã được sử dụng

**Nguyên nhân:** Có ứng dụng khác đang dùng port 3306

**Giải pháp:**

1. Kiểm tra process đang dùng port:
```cmd
netstat -ano | findstr :3306
```

2. Tắt process đó hoặc đổi port MySQL trong `my.ini`

### Lỗi 6: "ECONNREFUSED 127.0.0.1:3306"

**Nguyên nhân:** MySQL không chạy hoặc firewall chặn

**Giải pháp:**

1. Kiểm tra MySQL service đang chạy
2. Tắt Windows Firewall tạm thời để test
3. Thêm exception cho port 3306 trong Firewall

---

## Tóm Tắt Các Lệnh Quan Trọng

| Lệnh | Mô tả |
|------|-------|
| `net start MySQL80` | Khởi động MySQL service |
| `net stop MySQL80` | Dừng MySQL service |
| `mysql -u root -p` | Kết nối MySQL qua command line |
| `pnpm db:push` | Chạy database migration |
| `pnpm db:studio` | Mở GUI quản lý database |
| `pnpm dev` | Chạy development server |

---

## Thông Tin Kết Nối Mặc Định

| Thông tin | Giá trị |
|-----------|---------|
| Host | localhost |
| Port | 3306 |
| Username | root |
| Password | (password bạn đặt khi cài đặt) |
| Database | dreamweldtech |

---

## Workflow Test Local

```
1. Khởi động MySQL service
         ↓
2. Mở Command Prompt trong thư mục dự án
         ↓
3. Chạy: pnpm dev
         ↓
4. Mở browser: http://localhost:3000
         ↓
5. Test các chức năng
         ↓
6. Chỉnh sửa code (tự động refresh)
         ↓
7. Khi hoàn thành: pnpm build
         ↓
8. Deploy lên Mắt Bão
```

---

**Chúc bạn cài đặt thành công!**

Nếu gặp vấn đề, hãy kiểm tra:
1. MySQL service đang chạy (services.msc)
2. Password trong .env đúng
3. Database đã được tạo
4. Port 3306 không bị chặn

---

*Tài liệu này được tạo bởi Manus AI. Cập nhật lần cuối: 08/01/2026*
