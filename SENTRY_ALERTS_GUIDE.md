# Hướng Dẫn Thiết Lập Sentry Alerts

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Các Loại Alerts](#2-các-loại-alerts)
3. [Thiết Lập Alert Rules](#3-thiết-lập-alert-rules)
4. [Integrations](#4-integrations)
5. [Best Practices](#5-best-practices)

---

## 1. Giới Thiệu

Sentry Alerts giúp bạn nhận thông báo kịp thời khi có lỗi hoặc vấn đề performance trên website DreamWeldTech.

### Truy Cập Sentry Alerts

1. Đăng nhập [sentry.io](https://sentry.io)
2. Chọn project **dreamweldtech**
3. Vào **Alerts** → **Alert Rules**

---

## 2. Các Loại Alerts

| Loại | Mô tả | Use Case |
|------|-------|----------|
| **Issue Alert** | Kích hoạt khi có error mới hoặc regression | Phát hiện bugs mới |
| **Metric Alert** | Kích hoạt dựa trên metrics (count, p95) | Theo dõi performance |
| **Uptime Alert** | Kích hoạt khi website down | Monitoring availability |

---

## 3. Thiết Lập Alert Rules

### 3.1 Alert: New Error (Lỗi Mới)

**Mục đích:** Nhận thông báo khi có loại lỗi mới xuất hiện

**Cách tạo:**
1. Vào **Alerts** → **Create Alert Rule**
2. Chọn **Issue Alert**
3. Cấu hình:

```
WHEN: A new issue is created
IF: Environment equals "production"
THEN: Send notification to [your email/Slack]
```

**Settings:**
- Name: `New Production Error`
- Action Interval: `30 minutes` (tránh spam)
- Owner: Team hoặc cá nhân

---

### 3.2 Alert: Error Spike (Tăng Đột Biến)

**Mục đích:** Phát hiện khi số lượng lỗi tăng đột ngột

**Cách tạo:**
1. Vào **Alerts** → **Create Alert Rule**
2. Chọn **Metric Alert**
3. Cấu hình:

```
WHEN: count() is above 10 for 5 minutes
FILTER: event.type:error
THEN: Send notification
```

**Thresholds:**
| Level | Condition | Action |
|-------|-----------|--------|
| Warning | > 10 errors/5min | Email |
| Critical | > 50 errors/5min | Email + Slack + SMS |

---

### 3.3 Alert: Slow Performance

**Mục đích:** Phát hiện khi response time chậm

**Cách tạo:**
1. Vào **Alerts** → **Create Alert Rule**
2. Chọn **Metric Alert**
3. Cấu hình:

```
WHEN: p95(transaction.duration) is above 3000ms for 10 minutes
FILTER: transaction.op:http.server
THEN: Send notification
```

**Thresholds:**
| Level | p95 Response Time | Action |
|-------|-------------------|--------|
| Warning | > 2000ms | Email |
| Critical | > 5000ms | Email + Slack |

---

### 3.4 Alert: High Error Rate

**Mục đích:** Theo dõi tỷ lệ lỗi

**Cách tạo:**
1. Vào **Alerts** → **Create Alert Rule**
2. Chọn **Metric Alert**
3. Cấu hình:

```
WHEN: failure_rate() is above 0.05 for 15 minutes
FILTER: transaction.op:http.server
THEN: Send notification
```

**Thresholds:**
| Level | Error Rate | Action |
|-------|------------|--------|
| Warning | > 1% | Email |
| Critical | > 5% | Email + Slack + PagerDuty |

---

### 3.5 Alert: Specific Error Types

**Mục đích:** Theo dõi các loại lỗi quan trọng

**Cách tạo:**
1. Vào **Alerts** → **Create Alert Rule**
2. Chọn **Issue Alert**
3. Cấu hình:

```
WHEN: An event is seen
IF: error.type equals "DatabaseError" OR "AuthenticationError"
THEN: Send notification immediately
```

**Các error types quan trọng:**
- `DatabaseError` - Lỗi database
- `AuthenticationError` - Lỗi xác thực
- `PaymentError` - Lỗi thanh toán
- `RateLimitError` - Bị rate limit

---

## 4. Integrations

### 4.1 Email Integration (Mặc định)

Email alerts được bật mặc định. Cấu hình tại:
- **Settings** → **Notifications** → **Email**

### 4.2 Slack Integration

**Cách thiết lập:**
1. Vào **Settings** → **Integrations** → **Slack**
2. Click **Add to Slack**
3. Chọn workspace và channel
4. Authorize

**Cấu hình channel:**
| Alert Type | Channel |
|------------|---------|
| Critical errors | #alerts-critical |
| Warnings | #alerts-general |
| Performance | #alerts-performance |

### 4.3 Telegram Integration

**Cách thiết lập:**
1. Vào **Settings** → **Integrations** → **Webhooks**
2. Thêm webhook URL của Telegram bot
3. Format: `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text={message}`

### 4.4 PagerDuty Integration (On-call)

**Cách thiết lập:**
1. Vào **Settings** → **Integrations** → **PagerDuty**
2. Nhập Integration Key từ PagerDuty
3. Map alert levels với PagerDuty severities

---

## 5. Best Practices

### 5.1 Tránh Alert Fatigue

| Vấn đề | Giải pháp |
|--------|-----------|
| Quá nhiều alerts | Tăng threshold hoặc action interval |
| Alerts không quan trọng | Sử dụng filters để loại bỏ noise |
| Duplicate alerts | Sử dụng issue grouping |

### 5.2 Alert Hierarchy

```
Level 1 (Critical) → PagerDuty + SMS + Slack + Email
Level 2 (Warning)  → Slack + Email
Level 3 (Info)     → Email only
```

### 5.3 Recommended Alert Rules

| # | Alert Name | Type | Threshold | Action |
|---|------------|------|-----------|--------|
| 1 | New Production Error | Issue | New issue | Email + Slack |
| 2 | Error Spike | Metric | >10/5min | Email + Slack |
| 3 | Critical Error Spike | Metric | >50/5min | PagerDuty |
| 4 | Slow API | Metric | p95 > 3s | Email |
| 5 | High Error Rate | Metric | >5% | Email + Slack |
| 6 | Database Error | Issue | Specific type | Immediate |

### 5.4 Maintenance Windows

Khi deploy hoặc maintenance:
1. Vào **Alerts** → **Mute**
2. Chọn thời gian mute (30min - 2h)
3. Unmute sau khi hoàn thành

---

## Checklist Thiết Lập

- [ ] Tạo alert "New Production Error"
- [ ] Tạo alert "Error Spike"
- [ ] Tạo alert "Slow Performance"
- [ ] Kết nối Slack integration
- [ ] Test alerts bằng `/api/test/sentry-error` (development)
- [ ] Cấu hình notification preferences
- [ ] Thiết lập on-call rotation (nếu cần)

---

**Tạo bởi Manus AI - Tháng 1, 2026**


---

## 6. Source Maps Integration

Source maps giúp Sentry hiển thị stack traces với code gốc thay vì code đã minified.

### 6.1 Cấu Hình Environment Variables

Thêm các biến sau vào `.env` hoặc Settings → Secrets:

```env
# Sentry Source Maps Upload
SENTRY_AUTH_TOKEN=sntrys_xxx...  # Lấy từ sentry.io/settings/auth-tokens/
SENTRY_ORG=your-org-slug         # Tên organization trong Sentry
SENTRY_PROJECT=dreamweldtech    # Tên project (mặc định: dreamweldtech)
```

### 6.2 Lấy Auth Token

1. Truy cập [sentry.io/settings/auth-tokens/](https://sentry.io/settings/auth-tokens/)
2. Click **Create New Token**
3. Chọn scopes:
   - `project:releases`
   - `org:read`
4. Copy token và lưu vào `SENTRY_AUTH_TOKEN`

### 6.3 Cách Hoạt Động

Khi build production (`npm run build`):

1. Vite tạo source maps (`.map` files)
2. Sentry plugin upload source maps lên Sentry
3. Source maps bị xóa khỏi build output (bảo mật)
4. Khi có lỗi, Sentry sử dụng source maps để hiển thị code gốc

### 6.4 Kiểm Tra Source Maps

1. Build production: `npm run build`
2. Vào Sentry → **Releases** → Chọn release mới nhất
3. Tab **Artifacts** → Kiểm tra source maps đã upload

### 6.5 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Source maps không upload | Kiểm tra `SENTRY_AUTH_TOKEN` và `SENTRY_ORG` |
| Stack traces vẫn minified | Đảm bảo release name khớp giữa client và server |
| Permission denied | Kiểm tra token có đủ scopes |

---

## Checklist Source Maps

- [ ] Tạo Sentry Auth Token
- [ ] Thêm `SENTRY_AUTH_TOKEN` vào env
- [ ] Thêm `SENTRY_ORG` vào env
- [ ] Build và kiểm tra upload thành công
- [ ] Verify stack traces hiển thị code gốc

---

**Cập nhật:** Tháng 1, 2026
