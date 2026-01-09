# Monitoring & Observability Guide

## Overview

This guide covers monitoring, logging, and observability for the Dreamweldtech website to ensure optimal performance and quick issue resolution.

## Key Metrics

### Application Metrics

**Response Time**
- Target: < 200ms (p95)
- Warning: 200-500ms
- Critical: > 500ms

**Error Rate**
- Target: < 0.1%
- Warning: 0.1-1%
- Critical: > 1%

**Availability**
- Target: 99.9% uptime
- Warning: 99.5-99.9%
- Critical: < 99.5%

**Throughput**
- Target: > 1000 req/sec
- Warning: 500-1000 req/sec
- Critical: < 500 req/sec

### Database Metrics

**Query Time**
- Target: < 100ms (p95)
- Warning: 100-500ms
- Critical: > 500ms

**Connection Pool**
- Target: < 80% utilization
- Warning: 80-95%
- Critical: > 95%

**Slow Queries**
- Target: 0 queries > 1s
- Warning: 1-5 queries
- Critical: > 5 queries

### Infrastructure Metrics

**CPU Usage**
- Target: < 70%
- Warning: 70-85%
- Critical: > 85%

**Memory Usage**
- Target: < 70%
- Warning: 70-85%
- Critical: > 85%

**Disk Usage**
- Target: < 80%
- Warning: 80-90%
- Critical: > 90%

**Network I/O**
- Target: < 80% bandwidth
- Warning: 80-95%
- Critical: > 95%

## Monitoring Stack

### 1. Application Monitoring

**Umami Analytics** (Already integrated)
- Page views
- Visitor count
- Bounce rate
- Session duration
- Geographic distribution
- Device/browser stats

**Custom Metrics**
- API endpoint performance
- Database query times
- Error tracking
- User flow analysis

### 2. Error Tracking

**Setup Error Tracking**
```bash
# Install Sentry (recommended)
npm install @sentry/node @sentry/tracing

# Configure in server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

**Error Categories**
- 4xx errors (client errors)
- 5xx errors (server errors)
- Database errors
- External API errors
- Timeout errors

### 3. Performance Monitoring

**Core Web Vitals**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Custom Metrics**
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Total Blocking Time (TBT)
- API response time

### 4. Logging

**Log Levels**
- DEBUG: Development information
- INFO: General information
- WARN: Warning conditions
- ERROR: Error conditions
- CRITICAL: Critical failures

**Log Destinations**
- Console (development)
- File system (production)
- Centralized logging service (recommended)

**Structured Logging**
```typescript
logger.info('User login', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
  duration: loginTime,
});
```

## Alerting Rules

### Critical Alerts

**High Error Rate**
- Condition: Error rate > 1%
- Duration: 5 minutes
- Action: Page on-call engineer

**High Response Time**
- Condition: p95 response time > 1000ms
- Duration: 10 minutes
- Action: Page on-call engineer

**Database Connection Pool Full**
- Condition: Pool utilization > 95%
- Duration: 2 minutes
- Action: Page on-call engineer

**Out of Memory**
- Condition: Memory usage > 90%
- Duration: 1 minute
- Action: Page on-call engineer

**Disk Full**
- Condition: Disk usage > 95%
- Duration: 1 minute
- Action: Page on-call engineer

### Warning Alerts

**Elevated Error Rate**
- Condition: Error rate > 0.5%
- Duration: 15 minutes
- Action: Send notification

**Slow Response Time**
- Condition: p95 response time > 500ms
- Duration: 20 minutes
- Action: Send notification

**High CPU Usage**
- Condition: CPU > 80%
- Duration: 15 minutes
- Action: Send notification

**High Memory Usage**
- Condition: Memory > 80%
- Duration: 15 minutes
- Action: Send notification

**Database Slow Queries**
- Condition: > 5 queries > 1s
- Duration: 10 minutes
- Action: Send notification

## Dashboard Setup

### Key Dashboards

**1. Overview Dashboard**
- Uptime status
- Error rate
- Response time (p50, p95, p99)
- Active users
- Requests per second

**2. Performance Dashboard**
- API response times by endpoint
- Database query times
- Cache hit rate
- Memory usage
- CPU usage

**3. Error Dashboard**
- Error rate by type
- Top errors
- Error trend
- Affected users
- Error details

**4. Database Dashboard**
- Query performance
- Slow queries
- Connection pool usage
- Query count by table
- Replication lag

**5. Business Dashboard**
- Conversions
- Contact requests
- Job applications
- Newsletter subscribers
- Revenue (if applicable)

## Incident Response

### Incident Severity

**Severity 1 (Critical)**
- Service completely down
- Data loss or corruption
- Security breach
- Response time: Immediate

**Severity 2 (High)**
- Service partially down
- Major functionality broken
- Performance degradation > 50%
- Response time: 15 minutes

**Severity 3 (Medium)**
- Minor functionality broken
- Performance degradation 10-50%
- Workaround available
- Response time: 1 hour

**Severity 4 (Low)**
- Cosmetic issues
- Minor performance impact
- No workaround needed
- Response time: 24 hours

### Incident Response Steps

1. **Detection**
   - Alert triggered
   - Severity assessed
   - On-call engineer paged

2. **Triage**
   - Confirm issue
   - Assess impact
   - Identify root cause

3. **Mitigation**
   - Implement quick fix
   - Communicate status
   - Monitor metrics

4. **Resolution**
   - Implement permanent fix
   - Deploy to production
   - Verify resolution

5. **Post-Incident**
   - Document incident
   - Conduct post-mortem
   - Implement preventive measures

## Backup & Recovery

### Backup Strategy

**Database Backups**
- Frequency: Daily at 2:00 AM
- Retention: 30 days
- Location: Offsite S3 bucket
- Verification: Weekly restore test

**Application Backups**
- Frequency: Every deployment
- Retention: Last 10 versions
- Location: Git repository
- Verification: Automated

**Configuration Backups**
- Frequency: On change
- Retention: 90 days
- Location: Version control
- Verification: Manual

### Recovery Procedures

**Database Recovery**
```bash
# List available backups
aws s3 ls s3://dreamweldtech-backups/

# Restore from backup
mysql -u root -p dreamweldtech < backup-20260102.sql

# Verify restore
mysql -u root -p -e "SELECT COUNT(*) FROM products;"
```

**Application Recovery**
```bash
# Rollback to previous version
git revert <commit-hash>
git push origin main

# Or use Manus rollback
manus rollback --project dreamweldtech --version abc123
```

**Recovery Time Objectives (RTO)**
- Database: 1 hour
- Application: 15 minutes
- Full system: 2 hours

**Recovery Point Objectives (RPO)**
- Database: 1 hour
- Application: Immediate (Git)
- Configuration: Immediate (Git)

## Maintenance Windows

### Scheduled Maintenance

**Weekly Database Maintenance**
- Day: Sunday 2:00-3:00 AM UTC
- Tasks: OPTIMIZE, ANALYZE, REPAIR
- Downtime: None (background)

**Monthly Security Updates**
- Day: First Sunday of month, 3:00-4:00 AM UTC
- Tasks: Dependency updates, security patches
- Downtime: 5-10 minutes

**Quarterly Major Updates**
- Day: Scheduled in advance
- Tasks: Framework upgrades, major refactoring
- Downtime: 30 minutes
- Notification: 2 weeks in advance

### Maintenance Communication

- Email notification to subscribers
- Status page update
- In-app banner notification
- Social media announcement

## Performance Optimization

### Continuous Optimization

**Weekly Review**
- Check slow queries
- Review error logs
- Analyze user behavior
- Identify bottlenecks

**Monthly Optimization**
- Database index review
- Cache strategy review
- API endpoint optimization
- Frontend bundle analysis

**Quarterly Planning**
- Performance goals
- Optimization priorities
- Infrastructure scaling
- Technology updates

### Optimization Checklist

- [ ] Database indexes optimized
- [ ] Queries optimized
- [ ] Cache strategy effective
- [ ] API response times < 200ms
- [ ] Frontend bundle < 500KB gzipped
- [ ] Images optimized
- [ ] CDN configured
- [ ] Compression enabled
- [ ] Database connections pooled
- [ ] Rate limiting configured

## Tools & Services

### Recommended Services

**Monitoring**
- Datadog
- New Relic
- Prometheus + Grafana
- CloudWatch (AWS)

**Error Tracking**
- Sentry
- Rollbar
- Bugsnag
- Airbrake

**Logging**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- Papertrail
- Loggly

**Uptime Monitoring**
- Pingdom
- UptimeRobot
- Statuspage.io
- Opsgenie

**Performance Testing**
- LoadImpact
- JMeter
- Gatling
- k6

## Compliance & Reporting

### Monthly Reports

**Performance Report**
- Uptime percentage
- Average response time
- Error rate
- Top errors
- Performance trends

**Security Report**
- Security incidents
- Vulnerability scans
- Access logs review
- Compliance status

**Business Report**
- User metrics
- Conversion metrics
- Revenue impact
- Customer satisfaction

### Annual Audit

- Third-party security audit
- Performance audit
- Accessibility audit
- Compliance review

## Escalation Procedures

### On-Call Rotation

- Primary: 24/7 on-call
- Secondary: Backup support
- Rotation: Weekly
- Escalation: Manager if no response in 15 minutes

### Escalation Paths

1. **Alert triggered** → On-call engineer
2. **No response in 15 min** → Manager notified
3. **No resolution in 1 hour** → CTO notified
4. **No resolution in 2 hours** → CEO notified

### Communication Channels

- Slack: #incidents
- Email: incidents@dreamweldtech.com
- Phone: +84-xxx-xxx-xxx
- Status Page: status.dreamweldtech.com

---

**Last Updated:** 2026-01-02  
**Maintained By:** DevOps Team  
**Review Frequency:** Quarterly


---

## Advanced Rate Limiting (Mới)

DreamWeldTech đã tích hợp hệ thống rate limiting nâng cao với nhiều chiến lược.

### Các Loại Rate Limiting

| Loại | Mô tả | Use Case |
|------|-------|----------|
| **IP-based** | Giới hạn theo địa chỉ IP | Chống DDoS, brute force |
| **User-based** | Giới hạn theo user ID | Công bằng giữa users |
| **Combined** | Kết hợp IP + User | Bảo vệ toàn diện |
| **Endpoint** | Giới hạn theo endpoint cụ thể | Bảo vệ API nhạy cảm |
| **Sliding Window** | Cửa sổ trượt chính xác hơn | Phân phối đều requests |
| **Tiered** | Giới hạn theo tier user | Phân biệt free/premium |

### Cấu Hình Mặc Định

| Endpoint | Window | Max Requests | Mô tả |
|----------|--------|--------------|-------|
| Login | 15 phút | 5 | Chống brute force |
| Password Reset | 1 giờ | 3 | Chống spam |
| Contact Form | 1 giờ | 5 | Chống spam |
| Quote Request | 1 giờ | 10 | Giới hạn hợp lý |
| File Upload | 1 giờ | 20 | Tiết kiệm bandwidth |
| Search | 1 phút | 30 | Tránh quá tải |
| API (IP) | 1 phút | 60 | Tiêu chuẩn |
| API (User) | 1 phút | 200 | Cho authenticated users |

### Tiered Rate Limits

| Tier | Requests/phút | Mô tả |
|------|---------------|-------|
| Anonymous | 30 | Chưa đăng nhập |
| Free | 60 | Tài khoản miễn phí |
| Basic | 120 | Gói cơ bản |
| Premium | 300 | Gói premium |
| Enterprise | 1000 | Doanh nghiệp |
| Admin | 5000 | Quản trị viên |

### Sử Dụng Rate Limiters

```typescript
import { 
  loginRateLimit,
  contactFormRateLimit,
  apiRateLimitAdvanced,
  tieredRateLimit
} from "./advancedRateLimiter";

// Áp dụng cho login
app.post("/api/login", loginRateLimit, loginHandler);

// Áp dụng cho contact form
app.post("/api/contact", contactFormRateLimit, contactHandler);

// Áp dụng tiered rate limit
app.use("/api", tieredRateLimit(defaultTiers, (req) => {
  return req.user?.tier || "anonymous";
}));
```

### Response Headers

| Header | Mô tả |
|--------|-------|
| `X-RateLimit-Limit` | Số requests tối đa |
| `X-RateLimit-Remaining` | Số requests còn lại |
| `X-RateLimit-Reset` | Timestamp reset (Unix) |
| `X-RateLimit-Tier` | Tier của user (nếu có) |

---

## Sentry Error Tracking (Mới)

### Thiết Lập Sentry

#### Bước 1: Tạo Tài Khoản

1. Truy cập [sentry.io](https://sentry.io)
2. Đăng ký tài khoản (có gói miễn phí)
3. Tạo project mới cho Node.js và React

#### Bước 2: Cấu Hình Environment Variables

```env
# Sentry Configuration
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENABLED=true
```

### Tính Năng Đã Tích Hợp

| Tính năng | Server | Client | Mô tả |
|-----------|--------|--------|-------|
| Error Capture | ✅ | ✅ | Tự động bắt exceptions |
| Performance | ✅ | ✅ | Tracking thời gian response |
| Breadcrumbs | ✅ | ✅ | Lịch sử actions trước lỗi |
| User Context | ✅ | ✅ | Gắn user vào lỗi |
| Session Replay | ❌ | ✅ | Xem lại session user |
| Sensitive Data Filter | ✅ | ✅ | Ẩn password, token |

### Sử Dụng Trong Code

#### Server-side

```typescript
import { captureError, captureMessage, addBreadcrumb } from "./sentry";

// Bắt lỗi với context
try {
  await riskyOperation();
} catch (error) {
  captureError(error, {
    user: { id: userId, email: userEmail },
    tags: { feature: "checkout" },
    extra: { orderId, amount }
  });
}

// Ghi breadcrumb
addBreadcrumb("User clicked checkout", "user.action", { cartItems: 3 });
```

#### Client-side

```typescript
import { captureError, setUser, showReportDialog } from "@/lib/sentry";

// Set user khi login
setUser({ id: user.id, email: user.email, name: user.name });

// Hiển thị dialog báo cáo lỗi
showReportDialog(eventId);
```

### Cấu Hình Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| New Error | Khi có lỗi mới | Email + Slack |
| Error Spike | > 10 lỗi/phút | Email + Slack |
| Performance | Response > 3s | Email |
| Crash Rate | > 1% sessions | Email + SMS |

---

**Cập nhật:** Tháng 1, 2026
