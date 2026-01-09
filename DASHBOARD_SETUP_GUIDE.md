# Hướng Dẫn Thiết Lập Dashboard Monitoring

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Sentry Dashboard](#1-sentry-dashboard)
2. [Rate Limit Monitoring](#2-rate-limit-monitoring)
3. [Custom Dashboards](#3-custom-dashboards)

---

## 1. Sentry Dashboard

Sentry đã được tích hợp vào DreamWeldTech. Dưới đây là hướng dẫn thiết lập dashboard.

### 1.1 Truy Cập Sentry Dashboard

1. Đăng nhập vào [sentry.io](https://sentry.io)
2. Chọn project **dreamweldtech**
3. Bạn sẽ thấy dashboard mặc định với các metrics

### 1.2 Tạo Custom Dashboard

Vào **Dashboards** → **Create Dashboard** và thêm các widgets sau:

| Widget | Type | Query | Mô tả |
|--------|------|-------|-------|
| Error Count | Big Number | `count()` | Tổng số lỗi |
| Error Rate | Line Chart | `count()` by time | Xu hướng lỗi theo thời gian |
| Top Errors | Table | `count()` group by `issue` | Top 10 lỗi phổ biến |
| Affected Users | Big Number | `count_unique(user)` | Số users bị ảnh hưởng |
| Response Time | Line Chart | `p95(transaction.duration)` | Thời gian response p95 |
| Throughput | Line Chart | `epm()` | Events per minute |

### 1.3 Thiết Lập Alerts

Vào **Alerts** → **Create Alert Rule**:

**Alert 1: High Error Rate**
```
When: count() > 10 in 5 minutes
Action: Send email + Slack notification
```

**Alert 2: New Error Type**
```
When: A new issue is created
Action: Send email notification
```

**Alert 3: Slow Performance**
```
When: p95(transaction.duration) > 3000ms
Action: Send email notification
```

**Alert 4: Error Spike**
```
When: count() increases by 200% compared to previous hour
Action: Send email + SMS
```

### 1.4 Integrations

Kết nối Sentry với các tools khác:

| Integration | Mục đích | Cách thiết lập |
|-------------|----------|----------------|
| **Slack** | Nhận alerts | Settings → Integrations → Slack |
| **GitHub** | Link issues | Settings → Integrations → GitHub |
| **Jira** | Create tickets | Settings → Integrations → Jira |
| **PagerDuty** | On-call alerts | Settings → Integrations → PagerDuty |

---

## 2. Rate Limit Monitoring

DreamWeldTech có endpoint để theo dõi rate limiting.

### 2.1 Rate Limit Stats API

Truy cập endpoint sau để xem thống kê:

```
GET /api/admin/rate-limit-stats
```

Response:
```json
{
  "ip": {
    "total": 150,
    "blocked": 3
  },
  "user": {
    "total": 45,
    "blocked": 0
  },
  "combined": {
    "total": 200,
    "blocked": 5
  },
  "endpoint": {
    "total": 80,
    "blocked": 2
  }
}
```

### 2.2 Rate Limit Headers

Mỗi response API có các headers sau:

| Header | Mô tả |
|--------|-------|
| `X-RateLimit-Limit` | Giới hạn tối đa |
| `X-RateLimit-Remaining` | Số requests còn lại |
| `X-RateLimit-Reset` | Thời điểm reset (Unix timestamp) |

### 2.3 Giám Sát Rate Limits

Tạo script để theo dõi rate limits:

```bash
#!/bin/bash
# monitor-rate-limits.sh

while true; do
  curl -s https://dreamweldtech.vn/api/admin/rate-limit-stats | jq .
  sleep 60
done
```

---

## 3. Custom Dashboards

### 3.1 Grafana Dashboard (Tùy chọn)

Nếu bạn sử dụng Grafana, import dashboard sau:

```json
{
  "dashboard": {
    "title": "DreamWeldTech Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### 3.2 Metrics Quan Trọng

| Metric | Ngưỡng Warning | Ngưỡng Critical |
|--------|----------------|-----------------|
| Error Rate | > 1% | > 5% |
| Response Time (p95) | > 500ms | > 2000ms |
| Rate Limit Blocks | > 10/phút | > 50/phút |
| Memory Usage | > 80% | > 90% |
| CPU Usage | > 70% | > 85% |

### 3.3 Checklist Dashboard

- [ ] Sentry dashboard đã thiết lập
- [ ] Alerts đã cấu hình
- [ ] Slack integration đã kết nối
- [ ] Rate limit monitoring đang hoạt động
- [ ] Custom metrics đã thêm

---

## Tài Liệu Tham Khảo

1. [Sentry Dashboard Documentation](https://docs.sentry.io/product/dashboards/)
2. [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
3. [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
