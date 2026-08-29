# 🚀 Panduan Deployment Backend ProChat (CloudPanel + Neon DB)

Panduan komprehensif untuk mendeploy backend **ProChat API** di VPS berbasis **CloudPanel** menggunakan database **Neon PostgreSQL** dan **PM2**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Backend** | `https://api.prochat.work` |
| **Domain Frontend** | `https://app.prochat.work` |
| **Backend App Port** | `3005` |
| **User CloudPanel** | `prochat-api` |
| **Path Domain Web** | `/home/prochat-api/htdocs/api.prochat.work` |
| **Path Git Repository** | `/home/prochat-api/htdocs/chatpro` |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm v10+)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (Cluster / Fork mode) |
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
   - **Domain**: `api.prochat.work`
   - **Node.js Version**: `v22.x`
   - **App Port**: `3005`
3. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `api.prochat.work` ➡️ klik **New Let's Encrypt Certificate**.
4. Konfigurasi **WebSocket** di Nginx Vhost:
   - Buka tab **Vhost**, pastikan blok proxy menyertakan header WebSocket:
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
     }
     ```

---

## 📥 Langkah 3: Setup Folder Git Repository

Clone repositori ke folder induk `/home/prochat-api/htdocs/`:

```bash
cd /home/prochat-api/htdocs
git clone https://github.com/anggiadiputra/chatpro.git
```

---

## ⚙️ Langkah 4: Buat File `.env` Production

Buat file environment di folder target domain `/home/prochat-api/htdocs/api.prochat.work/.env`:

```bash
cat << 'EOF' > /home/prochat-api/htdocs/api.prochat.work/.env
# DATABASE (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:npg_wvV0kTK1qtlz@ep-dry-meadow-azrtkedb-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# SERVER CONFIGURATION
NODE_ENV="production"
PORT=3005
PUBLIC_URL="https://api.prochat.work"
FRONTEND_URL="https://app.prochat.work"

# CORS & COOKIE DOMAIN
CORS_ALLOWED_ORIGINS="https://app.prochat.work,https://api.prochat.work"
COOKIE_DOMAIN="prochat.work"

# SECURITY & AUTHENTICATION SECRETS
JWT_SECRET="prochat-prod-jwt-secret-98437f8e7b9a4c12d5e6f8a0b3c5d7e9"
BETTER_AUTH_SECRET="prochat-better-auth-secret-prod-32chars-secure"
BETTER_AUTH_URL="https://api.prochat.work"
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN="24h"
TWO_FACTOR_ISSUER="ProChat Platform"

# REDIS CONFIGURATION (VPS Local)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# META & WHATSAPP BUSINESS API (WABA)
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_ACCESS_TOKEN="your-meta-access-token"
META_CONFIG_ID="your-meta-embedded-signup-config-id"
OAUTH_REDIRECT_URI="https://app.prochat.work/waba/callback"
WEBHOOK_BASE_URL="https://api.prochat.work"
WABA_TOKEN_ENCRYPTION_KEY="MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE="

# INSTAGRAM API CONFIGURATION
INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""
INSTAGRAM_REDIRECT_URI="https://api.prochat.work/api/v1/ig/auth/callback"
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="prochat-ig-verify-token"

# EMAIL CONFIGURATION (SMTP / Brevo)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your-smtp-login"
SMTP_PASSWORD="your-smtp-password"
SMTP_FROM_EMAIL="noreply@prochat.work"
SMTP_FROM_NAME="ProChat"
SMTP_SECURE=false
EMAIL_NOTIFICATIONS_ENABLED=false

# FILE STORAGE & LOGGING
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE=10485760
LOG_LEVEL="info"
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100

# AI & INTEGRATIONS (Optional)
OPENAI_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EOF
```

---

## 🚀 Langkah 5: Eksekusi Deploy (One-Liner Command)

Jalankan satu baris perintah berikut untuk melakukan pull kode, sync rsync, instalasi dependensi, build TypeScript, penyesuaian hak akses file, dan reload PM2:

```bash
cd /home/prochat-api/htdocs/chatpro && git pull origin main && rsync -av --delete --exclude='.env' --exclude='node_modules' --exclude='dist' --exclude='logs' ./apps/backend/ /home/prochat-api/htdocs/api.prochat.work/ && cd /home/prochat-api/htdocs/api.prochat.work && pnpm install --dangerously-allow-all-builds && chmod -R +x node_modules/.bin/ && pnpm exec prisma generate && pnpm build && chown -R prochat-api:prochat-api /home/prochat-api/htdocs/ && su - prochat-api -c "cd /home/prochat-api/htdocs/api.prochat.work && pm2 restart prochat-backend || pm2 start ecosystem.config.cjs"
```

---

## 📜 Langkah 6: Membuat Helper Script Deploy Otomatis

Agar tidak perlu mengetik perintah panjang di masa depan, buat file script `deploy-backend.sh`:

```bash
cat << 'EOF' > /home/prochat-api/deploy-backend.sh
#!/bin/bash
set -e

echo "🚀 [1/6] Pulling latest code from GitHub..."
cd /home/prochat-api/htdocs/chatpro
git pull origin main

echo "📦 [2/6] Syncing backend files to api.prochat.work..."
rsync -av --delete --exclude='.env' --exclude='node_modules' --exclude='dist' --exclude='logs' ./apps/backend/ /home/prochat-api/htdocs/api.prochat.work/

echo "🔨 [3/6] Installing dependencies..."
cd /home/prochat-api/htdocs/api.prochat.work
pnpm install --dangerously-allow-all-builds
chmod -R +x node_modules/.bin/

echo "🗄️ [4/6] Generating Prisma Client..."
pnpm exec prisma generate

echo "⚙️ [5/6] Compiling TypeScript..."
pnpm build

echo "🔒 [6/6] Fixing file permissions & restarting PM2..."
chown -R prochat-api:prochat-api /home/prochat-api/htdocs/
su - prochat-api -c "cd /home/prochat-api/htdocs/api.prochat.work && pm2 restart prochat-backend || pm2 start ecosystem.config.cjs"

echo "✅ Deployment Finished Successfully!"
EOF

chmod +x /home/prochat-api/deploy-backend.sh
```

**Setiap kali Anda ingin deploy update terbaru, cukup ketik:**
```bash
/home/prochat-api/deploy-backend.sh
```

---

## 🧪 Langkah 7: Pengujian & Monitoring

### 7.1 Cek Status dan Log PM2
```bash
# Cek status proses
su - prochat-api -c "pm2 status"

# Cek 30 baris log terakhir
su - prochat-api -c "pm2 logs prochat-backend --lines 30 --nostream"
```

### 7.2 Tes Health Endpoint
```bash
# Dari dalam server (port 3005)
curl -I http://localhost:3005/health

# Dari publik melalui domain SSL
curl -I https://api.prochat.work/health
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK`

### 7.3 Simpan PM2 Startup (Auto-start saat reboot server)
```bash
su - prochat-api -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `Command 'pnpm' not found` | `pnpm` belum terinstall global | Jalankan `npm install -g pnpm pm2` |
| `pnpm requires at least Node.js v22` | Node.js di server masih versi lama (< v20) | Jalankan `curl -fsSL https://deb.nodesource.com/setup_22.x \| bash - && apt install -y nodejs` |
| `sh: 1: prisma: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x node_modules/.bin/` |
| `Unsupported URL Type "link:"` | Menggunakan `npm` alih-alih `pnpm` | Selalu gunakan perintah `pnpm` di proyek ini |
| `type "vector" does not exist` | Ekstensi pgvector belum aktif di Neon | Jalankan query SQL: `CREATE EXTENSION IF NOT EXISTS vector;` di Neon Console |
| `502 Bad Gateway` di browser | Aplikasi belum jalan di port 3005 | Cek log dengan `pm2 logs prochat-backend` dan pastikan PM2 berstatus `online` |
