# Hướng Dẫn Thiết Lập CI/CD với GitHub Actions

**Phiên bản:** 1.0  
**Cập nhật:** Tháng 1, 2026  
**Tác giả:** Manus AI

---

## Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Chuẩn Bị](#2-chuẩn-bị)
3. [Thiết Lập GitHub Secrets](#3-thiết-lập-github-secrets)
4. [Tạo Workflow File](#4-tạo-workflow-file)
5. [Giải Thích Chi Tiết](#5-giải-thích-chi-tiết)
6. [Các Workflow Nâng Cao](#6-các-workflow-nâng-cao)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Tổng Quan

GitHub Actions cho phép tự động hóa quy trình CI/CD, bao gồm build, test, upload source maps lên Sentry, và deploy lên server. Quy trình này được kích hoạt mỗi khi có push hoặc pull request vào nhánh chính.

### Quy Trình CI/CD

```
Push to main → Install Dependencies → Run Tests → Build → Upload Source Maps → Deploy
```

### Lợi Ích

| Lợi ích | Mô tả |
|---------|-------|
| **Tự động hóa** | Không cần thao tác thủ công |
| **Nhất quán** | Mọi deploy đều theo cùng quy trình |
| **Nhanh chóng** | Build và deploy trong vài phút |
| **An toàn** | Secrets được mã hóa và bảo mật |
| **Truy vết** | Mỗi deploy gắn với commit cụ thể |

---

## 2. Chuẩn Bị

### 2.1 Yêu Cầu

Trước khi bắt đầu, đảm bảo bạn có:

- Repository GitHub đã kết nối với project
- Sentry Auth Token (xem hướng dẫn `SENTRY_AUTH_TOKEN_GUIDE.md`)
- Thông tin SSH để deploy lên server Mắt Bão (nếu cần)

### 2.2 Cấu Trúc Thư Mục

```
dreamweldtech/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI workflow (test, lint)
│       ├── deploy.yml       # Deploy workflow
│       └── sentry.yml       # Sentry source maps upload
├── client/
├── server/
├── package.json
└── ...
```

---

## 3. Thiết Lập GitHub Secrets

### 3.1 Truy Cập Settings

1. Vào repository GitHub của bạn
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 3.2 Thêm Các Secrets

Thêm các secrets sau:

| Secret Name | Mô tả | Cách lấy |
|-------------|-------|----------|
| `SENTRY_AUTH_TOKEN` | Token để upload source maps | sentry.io/settings/account/api/auth-tokens/ |
| `SENTRY_ORG` | Organization slug | URL: sentry.io/organizations/**your-org**/ |
| `SENTRY_PROJECT` | Project name | `dreamweldtech` |
| `SSH_PRIVATE_KEY` | Private key để SSH vào server | Tạo SSH key pair |
| `SSH_HOST` | IP hoặc domain của server | `dreamweldtech.vn` |
| `SSH_USER` | Username SSH | Thường là `root` hoặc user cụ thể |
| `DEPLOY_PATH` | Đường dẫn trên server | `/var/www/vhosts/dreamweldtech.vn/httpdocs/dreamweldtech` |

### 3.3 Tạo SSH Key Pair (Nếu Chưa Có)

```bash
# Tạo SSH key pair
ssh-keygen -t ed25519 -C "github-actions@dreamweldtech.vn" -f ~/.ssh/github_actions

# Copy public key lên server
ssh-copy-id -i ~/.ssh/github_actions.pub user@dreamweldtech.vn

# Copy private key để thêm vào GitHub Secrets
cat ~/.ssh/github_actions
```

---

## 4. Tạo Workflow File

### 4.1 Workflow Cơ Bản: CI + Sentry

Tạo file `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  PNPM_VERSION: '10'

jobs:
  # Job 1: Lint và Test
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run type check
        run: pnpm tsc --noEmit
        
      - name: Run tests
        run: pnpm test
        
  # Job 2: Build và Upload Source Maps
  build:
    name: Build & Upload Source Maps
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Cần cho Sentry commits
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build production
        run: pnpm build
        env:
          NODE_ENV: production
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
          
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
          version: ${{ github.sha }}
          
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7
```

### 4.2 Workflow Deploy Lên Server Mắt Bão

Tạo file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  workflow_run:
    workflows: ["CI/CD Pipeline"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    name: Deploy to Mắt Bão
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
          
      - name: Add host to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts
          
      - name: Deploy to server
        run: |
          # Sync files to server
          rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.env' \
            --exclude '.git' \
            ./ ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:${{ secrets.DEPLOY_PATH }}/
            
          # Run post-deploy commands
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} << 'EOF'
            cd ${{ secrets.DEPLOY_PATH }}
            npm install --production
            npm run db:push
            pm2 restart dreamweldtech || pm2 start dist/index.js --name dreamweldtech
          EOF
          
      - name: Notify Sentry of deploy
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
        with:
          environment: production
          version: ${{ github.sha }}
          set_commits: auto
```

### 4.3 Workflow Đơn Giản (All-in-One)

Nếu muốn đơn giản hơn, sử dụng workflow này:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - uses: pnpm/action-setup@v4
        with:
          version: 10
          
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'
          
      - name: Install & Build
        run: |
          pnpm install --frozen-lockfile
          pnpm build
        env:
          NODE_ENV: production
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: dreamweldtech
          
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            git pull origin main
            npm install --production
            npm run build
            pm2 restart dreamweldtech
```

---

## 5. Giải Thích Chi Tiết

### 5.1 Triggers

```yaml
on:
  push:
    branches: [main]      # Chạy khi push vào main
  pull_request:
    branches: [main]      # Chạy khi có PR vào main
```

### 5.2 Environment Variables

| Variable | Mục đích |
|----------|----------|
| `NODE_ENV=production` | Bật production mode |
| `SENTRY_AUTH_TOKEN` | Xác thực với Sentry API |
| `SENTRY_ORG` | Xác định organization |
| `SENTRY_PROJECT` | Xác định project |

### 5.3 Sentry Release Action

```yaml
- uses: getsentry/action-release@v1
  with:
    environment: production    # Môi trường deploy
    version: ${{ github.sha }} # Version = commit SHA
    set_commits: auto          # Tự động link commits
```

### 5.4 Caching

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'  # Cache pnpm dependencies
```

Caching giúp giảm thời gian install từ ~2 phút xuống ~10 giây.

---

## 6. Các Workflow Nâng Cao

### 6.1 Preview Deployments (Cho PR)

```yaml
name: Preview Deploy

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to preview
        # Deploy to preview URL như Vercel, Netlify
        run: |
          echo "Preview URL: https://pr-${{ github.event.number }}.preview.dreamweldtech.vn"
```

### 6.2 Scheduled Builds

```yaml
name: Nightly Build

on:
  schedule:
    - cron: '0 2 * * *'  # 2:00 AM UTC hàng ngày

jobs:
  nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run build
      - run: npm test
```

### 6.3 Manual Trigger

```yaml
name: Manual Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"
```

---

## 7. Troubleshooting

### 7.1 Lỗi Thường Gặp

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| `Permission denied (publickey)` | SSH key không đúng | Kiểm tra `SSH_PRIVATE_KEY` |
| `SENTRY_AUTH_TOKEN is not set` | Secret chưa được thêm | Thêm secret vào repository |
| `pnpm-lock.yaml not found` | Thiếu lockfile | Chạy `pnpm install` và commit lockfile |
| `Build failed` | Lỗi trong code | Kiểm tra logs chi tiết |
| `Connection refused` | Server không cho phép SSH | Kiểm tra firewall và SSH config |

### 7.2 Debug Workflow

Thêm step debug:

```yaml
- name: Debug info
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    env
```

### 7.3 Xem Logs

1. Vào repository → **Actions**
2. Click vào workflow run
3. Click vào job để xem logs chi tiết

---

## Checklist Thiết Lập

- [ ] Tạo SSH key pair
- [ ] Thêm public key vào server
- [ ] Thêm `SSH_PRIVATE_KEY` vào GitHub Secrets
- [ ] Thêm `SSH_HOST`, `SSH_USER`, `DEPLOY_PATH`
- [ ] Thêm `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- [ ] Tạo file `.github/workflows/ci.yml`
- [ ] Push và kiểm tra workflow chạy thành công
- [ ] Verify source maps trên Sentry dashboard
- [ ] Verify deploy trên server

---

## Tham Khảo

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Sentry GitHub Action](https://github.com/getsentry/action-release)
- [pnpm GitHub Action](https://github.com/pnpm/action-setup)
- [SSH Deploy Action](https://github.com/appleboy/ssh-action)

---

**Tạo bởi Manus AI - Tháng 1, 2026**
