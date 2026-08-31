# 🚀 Panduan Deployment Backend Whoops (CloudPanel + Neon DB)

Panduan komprehensif untuk mendeploy backend **Whoops API** di VPS berbasis **CloudPanel** menggunakan database **Neon PostgreSQL** dan **PM2**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Backend** | `https://api.whoops.web.id` |
| **Domain Frontend / Dash** | `https://dash.whoops.web.id` |
| **Domain Utama (Sales Page)** | `https://whoops.web.id` |
| **Backend App Port** | `3005` |
| **User CloudPanel** | `whoops-api` *(atau sesuaikan user site Anda)* |
| **Path Domain Web** | `/home/whoops-api/htdocs/api.whoops.web.id` |
| **Path Git Repository** | `/home/whoops-api/htdocs/support` |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm v10+)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (`whoops-backend`) |
| **Database** | **Neon PostgreSQL** *(Serverless + pgvector)* |
| **Cache & Queue** | **Redis Server** (`127.0.0.1:6379`) |

---

## 🛠️ Langkah 1: Persiapan Server VPS (Dilakukan Sekali)

Login ke VPS Anda sebagai user `root` melalui SSH:

### 1.1 Update Node.js ke Versi 22 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
```

### 1.2 Install Redis Server, pnpm, dan PM2
```bash
# Install & jalankan Redis
apt update && apt install -y redis-server
systemctl enable redis-server && systemctl start redis-server

# Install pnpm dan PM2 secara global
npm install -g pnpm pm2
git config --global --add safe.directory '*'
```

### 1.3 Verifikasi Versi
```bash
node -v   # Harus v22.x.x
pnpm -v   # Harus v10.x.x / v11.x.x
pm2 -v
redis-cli ping  # Harus membalas PONG
```

---

## 🌐 Langkah 2: Konfigurasi Site di CloudPanel

1. Buka dashboard CloudPanel (`https://IP-VPS:8443`).
2. Masuk ke menu **Sites** ➡️ **Add Site** ➡️ **Create a Node.js Site**:
   - **Domain**: `api.whoops.web.id`
   - **Node.js Version**: `v22.x`
   - **App Port**: `3005`
   - **Site User**: `whoops-api`
3. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `api.whoops.web.id` ➡️ klik **New Let's Encrypt Certificate**.
4. Konfigurasi **Vhost Nginx** (Tab **Vhost**):
   - Pastikan konfigurasi proxy dan websocket timeout sudah optimal:
     ```nginx
     location / {
         proxy_pass http://127.0.0.1:3005;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
         proxy_read_timeout 86400s;
         proxy_send_timeout 86400s;
     }
     ```

---

## 📥 Langkah 3: Setup Folder Git Repository

Login sebagai root, lalu clone repositori ke folder `/home/whoops-api/htdocs/`:

```bash
cd /home/whoops-api/htdocs
git clone https://github.com/anggiadiputra/support.git
```

---

## ⚙️ Langkah 4: Buat File `.env` Production

Buat file environment di folder target domain `/home/whoops-api/htdocs/api.whoops.web.id/.env`:

```bash
cat << 'EOF' > /home/whoops-api/htdocs/api.whoops.web.id/.env
# DATABASE CONNECTION (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_wvV0kTK1qtlz@ep-dry-meadow-azrtkedb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# SERVER CONFIGURATION
NODE_ENV="production"
PORT=3005
PUBLIC_URL="https://api.whoops.web.id"
FRONTEND_URL="https://dash.whoops.web.id"

# CORS & COOKIE DOMAIN
CORS_ALLOWED_ORIGINS="https://dash.whoops.web.id,https://whoops.web.id,https://www.whoops.web.id,https://app.whoops.web.id,https://api.whoops.web.id"
COOKIE_DOMAIN="whoops.web.id"

# SECURITY & AUTHENTICATION SECRETS
JWT_SECRET="whoops-prod-jwt-secret-98437f8e7b9a4c12d5e6f8a0b3c5d7e9"
BETTER_AUTH_SECRET="whoops-better-auth-secret-prod-32chars-secure"
BETTER_AUTH_URL="https://api.whoops.web.id"
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN="24h"
TWO_FACTOR_ISSUER="Whoops Platform"

# REDIS CONFIGURATION (VPS Local)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# META & WHATSAPP BUSINESS API (WABA)
META_APP_ID=""
META_APP_SECRET=""
META_ACCESS_TOKEN=""
META_CONFIG_ID=""
OAUTH_REDIRECT_URI="https://dash.whoops.web.id/waba/callback"
WEBHOOK_BASE_URL="https://api.whoops.web.id"
WABA_TOKEN_ENCRYPTION_KEY="MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE="

# INSTAGRAM API CONFIGURATION
INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""
INSTAGRAM_REDIRECT_URI="https://api.whoops.web.id/api/v1/ig/auth/callback"
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="whoops-ig-verify-token"

# EMAIL CONFIGURATION (SMTP / Brevo)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your-smtp-login"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM_EMAIL="noreply@whoops.web.id"
SMTP_FROM_NAME="Whoops"
SMTP_SECURE=false
EMAIL_NOTIFICATIONS_ENABLED=false

# FILE STORAGE & LOGGING
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760
LOG_LEVEL="info"
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100

# CLOUDFLARE TURNSTILE (Opsional / via Admin Panel)
TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
TURNSTILE_ENABLED="false"

# AI & INTEGRATIONS (Optional)
OPENAI_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EOF

# Kunci permission file .env agar aman
chmod 600 /home/whoops-api/htdocs/api.whoops.web.id/.env
```

---

## 🚀 Langkah 5: Eksekusi Deploy (One-Liner Command)

Jalankan satu baris perintah berikut untuk melakukan pull kode, sync rsync, instalasi dependensi, build TypeScript, penyesuaian hak akses file, dan reload PM2:

```bash
cd /home/whoops-api/htdocs/support && git pull support main || git pull origin main && rsync -av --delete --exclude='.env' --exclude='node_modules' --exclude='dist' --exclude='logs' ./apps/backend/ /home/whoops-api/htdocs/api.whoops.web.id/ && cd /home/whoops-api/htdocs/api.whoops.web.id && pnpm install --dangerously-allow-all-builds && chmod -R +x node_modules/.bin/ && pnpm exec prisma generate && pnpm build && chown -R whoops-api:whoops-api /home/whoops-api/htdocs/api.whoops.web.id && find /home/whoops-api/htdocs/api.whoops.web.id -type d -exec chmod 755 {} + && find /home/whoops-api/htdocs/api.whoops.web.id -type f -exec chmod 644 {} + && chmod -R +x /home/whoops-api/htdocs/api.whoops.web.id/node_modules/.bin/ && chmod 600 /home/whoops-api/htdocs/api.whoops.web.id/.env && su - whoops-api -c "cd /home/whoops-api/htdocs/api.whoops.web.id && pm2 restart whoops-backend || pm2 start ecosystem.config.cjs"
```

---

## 🔒 Langkah 6: Standarisasi Permission File & Folder

Jalankan perintah ini kapan saja untuk merapikan seluruh permission `api.whoops.web.id`:

```bash
chown -R whoops-api:whoops-api /home/whoops-api/htdocs/api.whoops.web.id && find /home/whoops-api/htdocs/api.whoops.web.id -type d -exec chmod 755 {} + && find /home/whoops-api/htdocs/api.whoops.web.id -type f -exec chmod 644 {} + && chmod -R +x /home/whoops-api/htdocs/api.whoops.web.id/node_modules/.bin/ && chmod 600 /home/whoops-api/htdocs/api.whoops.web.id/.env
```

---

## 📜 Langkah 7: Membuat Helper Script Deploy Otomatis

Agar tidak perlu mengetik perintah panjang di masa depan, buat file script `deploy-backend.sh` di `/home/whoops-api/`:

```bash
cat << 'EOF' > /home/whoops-api/deploy-backend.sh
#!/bin/bash
set -e

echo "🚀 [1/7] Pulling latest code from GitHub..."
cd /home/whoops-api/htdocs/support
git pull support main || git pull origin main

echo "📦 [2/7] Syncing backend files to api.whoops.web.id..."
rsync -av --delete --exclude='.env' --exclude='node_modules' --exclude='dist' --exclude='logs' ./apps/backend/ /home/whoops-api/htdocs/api.whoops.web.id/

echo "🔨 [3/7] Installing dependencies..."
cd /home/whoops-api/htdocs/api.whoops.web.id
pnpm install --dangerously-allow-all-builds
chmod -R +x node_modules/.bin/

echo "🧬 [4/7] Generating Prisma Client..."
pnpm exec prisma generate

echo "⚙️ [5/7] Building TypeScript project..."
pnpm build

echo "🔒 [6/7] Fixing file & folder permissions..."
chown -R whoops-api:whoops-api /home/whoops-api/htdocs/api.whoops.web.id
find /home/whoops-api/htdocs/api.whoops.web.id -type d -exec chmod 755 {} +
find /home/whoops-api/htdocs/api.whoops.web.id -type f -exec chmod 644 {} +
chmod -R +x /home/whoops-api/htdocs/api.whoops.web.id/node_modules/.bin/
chmod 600 /home/whoops-api/htdocs/api.whoops.web.id/.env 2>/dev/null || true

echo "🔄 [7/7] Restarting PM2 process..."
su - whoops-api -c "cd /home/whoops-api/htdocs/api.whoops.web.id && pm2 restart whoops-backend || pm2 start ecosystem.config.cjs"

echo "✅ Backend Deployment Finished Successfully!"
EOF

chmod +x /home/whoops-api/deploy-backend.sh
```

**Setiap kali Anda ingin deploy update backend terbaru, cukup jalankan:**
```bash
/home/whoops-api/deploy-backend.sh
```

---

## 🧪 Langkah 8: Pengujian & Monitoring

### 8.1 Cek Status dan Log PM2
```bash
# Cek status proses
su - whoops-api -c "pm2 status"

# Cek 30 baris log terakhir
su - whoops-api -c "pm2 logs whoops-backend --lines 30 --nostream"
```

### 8.2 Tes Endpoint Healthcheck
```bash
# Dari dalam server
curl -I http://localhost:3005/health

# Dari publik melalui domain SSL
curl -I https://api.whoops.web.id/health
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK` atau `HTTP/2 200`

### 8.3 Simpan PM2 Startup
```bash
su - whoops-api -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `502 Bad Gateway` | Backend belum running di port 3005 | Cek `pm2 status` dan periksa error di `pm2 logs whoops-backend` |
| `PrismaClientInitializationError` | URL database Neon salah / timeout | Pastikan parameter `?sslmode=require` aktif di `DATABASE_URL` |
| `Redis connection refused (ECONNREFUSED)` | Service Redis belum berjalan di VPS | Jalankan `systemctl restart redis-server` |
| `EADDRINUSE: port 3005 already in use` | Ada proses lama menggantung di port 3005 | Cek dengan `lsof -i :3005` atau `fuser -k 3005/tcp` lalu restart PM2 |
| `sh: 1: prisma: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x /home/whoops-api/htdocs/api.whoops.web.id/node_modules/.bin/` |
| `Permission denied / EACCES` | Kepemilikan file belum disesuaikan | Jalankan langkah 6 (Standarisasi Permission File & Folder) |
