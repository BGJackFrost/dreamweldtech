# Hướng Dẫn Tạo Sentry Auth Token

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Đích

Sentry Auth Token được sử dụng để upload source maps lên Sentry, giúp hiển thị stack traces với code gốc thay vì code đã minified. Điều này giúp debug lỗi production dễ dàng hơn.

---

## Bước 1: Đăng Nhập Sentry

1. Truy cập [sentry.io](https://sentry.io)
2. Đăng nhập bằng tài khoản của bạn
3. Chọn organization chứa project **dreamweldtech**

---

## Bước 2: Truy Cập Auth Tokens

1. Click vào **avatar** ở góc trên bên trái
2. Chọn **User Settings** (hoặc truy cập trực tiếp: [sentry.io/settings/account/api/auth-tokens/](https://sentry.io/settings/account/api/auth-tokens/))
3. Trong menu bên trái, chọn **Auth Tokens**

---

## Bước 3: Tạo Token Mới

1. Click nút **Create New Token**
2. Đặt tên cho token: `DreamWeldTech Source Maps`
3. Chọn các **Scopes** sau:

| Scope | Mô tả | Bắt buộc |
|-------|-------|----------|
| `project:releases` | Upload source maps và tạo releases | ✅ Có |
| `project:read` | Đọc thông tin project | ✅ Có |
| `org:read` | Đọc thông tin organization | ✅ Có |

4. Click **Create Token**
5. **QUAN TRỌNG**: Copy token ngay lập tức vì bạn sẽ không thể xem lại sau này

---

## Bước 4: Thêm Token Vào Project

### Cách 1: Qua Manus Management UI (Khuyến nghị)

1. Mở **Management UI** của project DreamWeldTech
2. Vào **Settings** → **Secrets**
3. Thêm 2 secrets mới:

| Key | Value | Mô tả |
|-----|-------|-------|
| `SENTRY_AUTH_TOKEN` | `sntrys_xxx...` | Token vừa tạo |
| `SENTRY_ORG` | `your-org-slug` | Slug của organization |

4. Click **Save**

### Cách 2: Qua File .env (Cho Host Mắt Bão)

Thêm vào file `.env` trên server:

```env
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3MDQ4MjQwMDAsInVybCI6Imh0dHBzOi8vc2VudHJ5LmlvIiwicmVnaW9uX3VybCI6Imh0dHBzOi8vdXMuc2VudHJ5LmlvIiwib3JnIjoieW91ci1vcmcifQ==_xxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=dreamweldtech
```

---

## Bước 5: Tìm Organization Slug

Organization slug là phần URL sau `sentry.io/organizations/`:

```
https://sentry.io/organizations/your-org-slug/projects/
                              ^^^^^^^^^^^^^^
                              Đây là org slug
```

Hoặc:
1. Vào **Settings** → **General Settings**
2. Xem mục **Organization Slug**

---

## Bước 6: Verify Cấu Hình

### Test trên Local

```bash
cd /var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech
npm run build
```

Nếu cấu hình đúng, bạn sẽ thấy:
```
[Sentry] Source maps upload enabled
[Sentry] Uploading source maps...
[Sentry] Source maps uploaded successfully
```

### Kiểm Tra Trên Sentry Dashboard

1. Vào [sentry.io](https://sentry.io) → Project **dreamweldtech**
2. Chọn **Releases** trong menu
3. Tìm release mới nhất (ví dụ: `dreamweldtech@1.0.0`)
4. Click vào release → Tab **Artifacts**
5. Xác nhận có các file `.js.map` đã được upload

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| `401 Unauthorized` | Token không hợp lệ | Tạo token mới |
| `403 Forbidden` | Thiếu scopes | Kiểm tra token có đủ scopes |
| `404 Not Found` | Sai org hoặc project | Kiểm tra `SENTRY_ORG` và `SENTRY_PROJECT` |
| Không thấy log upload | Thiếu env vars | Kiểm tra `SENTRY_AUTH_TOKEN` đã được set |
| Source maps không upload | NODE_ENV không phải production | Set `NODE_ENV=production` khi build |

---

## Bảo Mật Token

**QUAN TRỌNG**: Auth Token có quyền truy cập vào Sentry account của bạn.

| Nên làm | Không nên làm |
|---------|---------------|
| ✅ Lưu trong biến môi trường | ❌ Commit vào Git |
| ✅ Sử dụng Secrets management | ❌ Chia sẻ công khai |
| ✅ Rotate token định kỳ | ❌ Sử dụng token cá nhân cho CI/CD |
| ✅ Tạo token riêng cho mỗi môi trường | ❌ Sử dụng chung token |

---

## Checklist

- [ ] Đăng nhập Sentry
- [ ] Tạo Auth Token với đủ scopes
- [ ] Copy token (chỉ hiển thị 1 lần)
- [ ] Tìm Organization Slug
- [ ] Thêm `SENTRY_AUTH_TOKEN` vào Secrets
- [ ] Thêm `SENTRY_ORG` vào Secrets
- [ ] Build và verify source maps upload
- [ ] Kiểm tra Releases trên Sentry dashboard

---

## Tham Khảo

- [Sentry Auth Tokens Documentation](https://docs.sentry.io/api/auth/)
- [Sentry Vite Plugin](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/)
- [Source Maps Best Practices](https://docs.sentry.io/platforms/javascript/sourcemaps/)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
