# Hướng Dẫn Tạo và Thêm GitHub Secrets

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Danh Sách Secrets Cần Thiết](#2-danh-sách-secrets-cần-thiết)
3. [Hướng Dẫn Tạo Từng Secret](#3-hướng-dẫn-tạo-từng-secret)
4. [Thêm Secrets Vào GitHub](#4-thêm-secrets-vào-github)
5. [Kiểm Tra Cấu Hình](#5-kiểm-tra-cấu-hình)
6. [Bảo Mật](#6-bảo-mật)

---

## 1. Tổng Quan

GitHub Secrets là cách an toàn để lưu trữ thông tin nhạy cảm như API keys, tokens, và credentials. Secrets được mã hóa và chỉ có thể truy cập trong GitHub Actions workflows.

### Đặc Điểm Của GitHub Secrets

| Đặc điểm | Mô tả |
|----------|-------|
| **Mã hóa** | Secrets được mã hóa bằng libsodium sealed box |
| **Không hiển thị** | Không thể xem lại giá trị sau khi lưu |
| **Masked trong logs** | Tự động ẩn trong workflow logs |
| **Scoped** | Có thể giới hạn theo repository hoặc environment |

---

## 2. Danh Sách Secrets Cần Thiết

### 2.1 Secrets Cho Sentry

| Secret | Mô tả | Bắt buộc |
|--------|-------|----------|
| `SENTRY_AUTH_TOKEN` | Token xác thực với Sentry API | ✅ Có |
| `SENTRY_ORG` | Organization slug trên Sentry | ✅ Có |
| `SENTRY_PROJECT` | Tên project (mặc định: dreamweldtech) | ❌ Không |

### 2.2 Secrets Cho Deploy (SSH)

| Secret | Mô tả | Bắt buộc |
|--------|-------|----------|
| `SSH_PRIVATE_KEY` | Private key để SSH vào server | ✅ Có |
| `SSH_HOST` | IP hoặc domain của server | ✅ Có |
| `SSH_USER` | Username SSH | ✅ Có |
| `DEPLOY_PATH` | Đường dẫn project trên server | ✅ Có |

---

## 3. Hướng Dẫn Tạo Từng Secret

### 3.1 SENTRY_AUTH_TOKEN

**Bước 1:** Đăng nhập [sentry.io](https://sentry.io)

**Bước 2:** Truy cập Auth Tokens
- Click avatar góc trên trái → **User Settings**
- Hoặc truy cập trực tiếp: `https://sentry.io/settings/account/api/auth-tokens/`

**Bước 3:** Tạo Token mới
- Click **Create New Token**
- Đặt tên: `GitHub Actions - DreamWeldTech`
- Chọn scopes:
  - ✅ `project:releases`
  - ✅ `project:read`
  - ✅ `org:read`
- Click **Create Token**

**Bước 4:** Copy token
```
sntrys_eyJpYXQiOjE3MDQ4MjQwMDAsInVybCI6Imh0dHBzOi8vc2VudHJ5LmlvIiwicmVnaW9uX3VybCI6Imh0dHBzOi8vdXMuc2VudHJ5LmlvIiwib3JnIjoieW91ci1vcmcifQ==_xxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **QUAN TRỌNG:** Token chỉ hiển thị một lần. Copy ngay và lưu an toàn!

---

### 3.2 SENTRY_ORG

**Cách 1:** Từ URL
```
https://sentry.io/organizations/your-org-slug/projects/
                              ^^^^^^^^^^^^^^
                              Đây là SENTRY_ORG
```

**Cách 2:** Từ Settings
- Vào **Settings** → **General Settings**
- Xem mục **Organization Slug**

**Ví dụ:**
```
SENTRY_ORG=dreamweldtech-company
```

---

### 3.3 SSH_PRIVATE_KEY

**Bước 1:** Tạo SSH key pair (trên máy local)

```bash
# Mở Terminal/Command Prompt

# Tạo key pair mới
ssh-keygen -t ed25519 -C "github-actions@dreamweldtech.vn" -f ~/.ssh/github_actions_deploy

# Khi được hỏi passphrase, nhấn Enter để bỏ qua (không đặt passphrase)
```

**Bước 2:** Xem và copy Private Key

```bash
# Linux/macOS
cat ~/.ssh/github_actions_deploy

# Windows (PowerShell)
Get-Content ~/.ssh/github_actions_deploy
```

**Kết quả sẽ như sau:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==
AAAAQHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==
-----END OPENSSH PRIVATE KEY-----
```

> ⚠️ **Copy toàn bộ** bao gồm cả `-----BEGIN...` và `-----END...`

**Bước 3:** Thêm Public Key vào Server

```bash
# Copy public key
cat ~/.ssh/github_actions_deploy.pub

# SSH vào server Mắt Bão
ssh root@dreamweldtech.vn

# Trên server, thêm public key vào authorized_keys
echo "ssh-ed25519 AAAA... github-actions@dreamweldtech.vn" >> ~/.ssh/authorized_keys

# Đảm bảo quyền đúng
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Hoặc dùng ssh-copy-id (đơn giản hơn):**
```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub root@dreamweldtech.vn
```

---

### 3.4 SSH_HOST

Đây là IP hoặc domain của server Mắt Bão.

**Ví dụ:**
```
SSH_HOST=dreamweldtech.vn
```

hoặc

```
SSH_HOST=103.xxx.xxx.xxx
```

---

### 3.5 SSH_USER

Username để SSH vào server.

**Ví dụ:**
```
SSH_USER=root
```

hoặc (nếu dùng user khác)

```
SSH_USER=dreamweldtech
```

---

### 3.6 DEPLOY_PATH

Đường dẫn đến thư mục project trên server.

**Cho Mắt Bão (Plesk):**
```
DEPLOY_PATH=/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
```

---

## 4. Thêm Secrets Vào GitHub

### Bước 1: Truy Cập Repository Settings

1. Mở repository GitHub của bạn
2. Click tab **Settings** (cần quyền Admin)
3. Trong sidebar, click **Secrets and variables** → **Actions**

### Bước 2: Thêm Repository Secret

1. Click nút **New repository secret**
2. Điền thông tin:
   - **Name:** Tên secret (ví dụ: `SENTRY_AUTH_TOKEN`)
   - **Secret:** Giá trị secret
3. Click **Add secret**

### Bước 3: Lặp Lại Cho Tất Cả Secrets

Thêm lần lượt các secrets sau:

| # | Name | Giá trị mẫu |
|---|------|-------------|
| 1 | `SENTRY_AUTH_TOKEN` | `sntrys_eyJpYXQ...` |
| 2 | `SENTRY_ORG` | `dreamweldtech-company` |
| 3 | `SENTRY_PROJECT` | `dreamweldtech` |
| 4 | `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| 5 | `SSH_HOST` | `dreamweldtech.vn` |
| 6 | `SSH_USER` | `root` |
| 7 | `DEPLOY_PATH` | `/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech` |

### Bước 4: Xác Nhận

Sau khi thêm xong, bạn sẽ thấy danh sách secrets như sau:

```
Repository secrets (7)
├── DEPLOY_PATH          Updated 2 minutes ago
├── SENTRY_AUTH_TOKEN    Updated 5 minutes ago
├── SENTRY_ORG           Updated 5 minutes ago
├── SENTRY_PROJECT       Updated 5 minutes ago
├── SSH_HOST             Updated 3 minutes ago
├── SSH_PRIVATE_KEY      Updated 3 minutes ago
└── SSH_USER             Updated 3 minutes ago
```

---

## 5. Kiểm Tra Cấu Hình

### 5.1 Test SSH Connection

Tạo workflow test để kiểm tra SSH:

```yaml
# .github/workflows/test-ssh.yml
name: Test SSH Connection

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            echo "✅ SSH connection successful!"
            whoami
            pwd
            ls -la ${{ secrets.DEPLOY_PATH }} || echo "Path not found"
```

### 5.2 Test Sentry Connection

Push một commit để trigger CI workflow và kiểm tra:

1. Vào **Actions** tab trong repository
2. Xem workflow run mới nhất
3. Kiểm tra step "Create Sentry release" có thành công không

### 5.3 Verify Trên Sentry Dashboard

1. Vào [sentry.io](https://sentry.io) → Project **dreamweldtech**
2. Click **Releases** trong sidebar
3. Xác nhận có release mới với commit SHA

---

## 6. Bảo Mật

### 6.1 Best Practices

| Nên làm | Không nên làm |
|---------|---------------|
| ✅ Sử dụng GitHub Secrets | ❌ Hardcode credentials trong code |
| ✅ Tạo SSH key riêng cho CI/CD | ❌ Dùng chung SSH key cá nhân |
| ✅ Giới hạn quyền SSH key | ❌ Dùng root với full quyền |
| ✅ Rotate secrets định kỳ | ❌ Giữ secrets mãi mãi |
| ✅ Audit access logs | ❌ Bỏ qua security alerts |

### 6.2 Giới Hạn Quyền SSH Key

Trên server, có thể giới hạn quyền của SSH key:

```bash
# Trong ~/.ssh/authorized_keys, thêm options trước key:
command="/usr/local/bin/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
```

### 6.3 Sử Dụng Environment Secrets

Cho môi trường production/staging riêng biệt:

1. Vào **Settings** → **Environments**
2. Tạo environment mới (ví dụ: `production`)
3. Thêm secrets riêng cho environment đó
4. Trong workflow, sử dụng:

```yaml
jobs:
  deploy:
    environment: production  # Sử dụng secrets của environment này
```

### 6.4 Rotate Secrets

Định kỳ (3-6 tháng) nên:

1. Tạo Sentry token mới
2. Cập nhật `SENTRY_AUTH_TOKEN` trong GitHub
3. Revoke token cũ trên Sentry
4. Tạo SSH key pair mới
5. Cập nhật `SSH_PRIVATE_KEY` và authorized_keys

---

## Checklist

### Sentry Secrets
- [ ] Tạo Sentry Auth Token với đủ scopes
- [ ] Copy token (chỉ hiển thị 1 lần)
- [ ] Tìm Organization Slug
- [ ] Thêm `SENTRY_AUTH_TOKEN` vào GitHub Secrets
- [ ] Thêm `SENTRY_ORG` vào GitHub Secrets
- [ ] Thêm `SENTRY_PROJECT` vào GitHub Secrets (optional)

### SSH Secrets
- [ ] Tạo SSH key pair mới
- [ ] Thêm public key vào server
- [ ] Test SSH connection thủ công
- [ ] Thêm `SSH_PRIVATE_KEY` vào GitHub Secrets
- [ ] Thêm `SSH_HOST` vào GitHub Secrets
- [ ] Thêm `SSH_USER` vào GitHub Secrets
- [ ] Thêm `DEPLOY_PATH` vào GitHub Secrets

### Verification
- [ ] Push commit để test CI workflow
- [ ] Kiểm tra Sentry releases
- [ ] Test deploy workflow (manual trigger)
- [ ] Verify website hoạt động sau deploy

---

## Tham Khảo

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Sentry Auth Tokens](https://docs.sentry.io/api/auth/)
- [SSH Key Generation](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
