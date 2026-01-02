# KirimChat - Setup Guide

> **⚠️ CONFIDENTIAL - PROPRIETARY SOFTWARE**
>
> **🚨 CRITICAL: DO NOT SHARE, FORK PUBLICLY, OR DISTRIBUTE THIS CODE 🚨**
>
> This is **PRIVATE** proprietary software. Unauthorized sharing or distribution is **STRICTLY PROHIBITED**.
>
> **FORBIDDEN ACTIONS:**
> - ❌ **DO NOT** make this GitHub repository PUBLIC
> - ❌ **DO NOT** fork to public repositories
> - ❌ **DO NOT** share source code with anyone
> - ❌ **DO NOT** publish Docker images publicly on GHCR/Docker Hub
> - ❌ **DO NOT** distribute or sell this code
> - ❌ **DO NOT** upload to public code repositories (GitHub, GitLab, Bitbucket, etc.)
>
> **REQUIRED ACTIONS:**
> - ✅ **ALWAYS** keep repository PRIVATE
> - ✅ **ALWAYS** keep Docker images PRIVATE on GHCR
> - ✅ **ONLY** share access with authorized team members
> - ✅ Use private repositories and packages only
> - ✅ Protect all credentials and secrets
>
> **Violation of these terms will result in legal action.**
>
> ---

Platform WhatsApp Business API dengan frontend di Cloudflare Workers dan backend di VPS.

## Arsitektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │────▶│   VPS Backend   │────▶│   PostgreSQL    │
│   Workers       │     │   (Node.js)     │     │   + Redis       │
│   (Frontend)    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 1. Daftar Brevo (Email SMTP)

Brevo digunakan untuk mengirim email transaksional (verifikasi, reset password, notifikasi).

### Langkah-langkah:

1. Buka [brevo.com](https://www.brevo.com) dan klik **Sign Up**
2. Verifikasi email dan lengkapi profil
3. Masuk ke **Settings** → **SMTP & API**
4. Klik **Generate a new SMTP key**
5. Catat kredensial berikut:

```env
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER="your-brevo-login"
SMTP_PASSWORD="your-smtp-key"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="KirimChat"
```

> **Tips:** Free tier Brevo = 300 email/hari, cukup untuk development.

---

## 2. Daftar Google OAuth

Google OAuth untuk fitur "Login with Google".

### Langkah-langkah:

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih existing project
3. Masuk ke **APIs & Services** → **OAuth consent screen**
   - Pilih **External**
   - Isi App name, User support email, Developer contact
   - Tambahkan scope: `email`, `profile`, `openid`
4. Masuk ke **APIs & Services** → **Credentials**
5. Klik **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     ```
     https://yourdomain.com
     https://api.yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     https://api.yourdomain.com/api/auth/callback/google
     ```
6. Catat Client ID dan Client Secret:

```env
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

---

## 3. Setup Cloudflare Workers (Frontend)

Frontend Next.js di-deploy ke Cloudflare Workers menggunakan OpenNext.

### Langkah-langkah:

1. Buat akun di [cloudflare.com](https://cloudflare.com) jika belum punya
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. Masuk ke folder frontend:
   ```bash
   cd apps/frontend
   ```
4. Build dan deploy:
   ```bash
   pnpm build
   wrangler deploy
   ```
5. Setup custom domain di Cloudflare Dashboard:
   - Workers & Pages → pilih worker → Settings → Domains & Routes
   - Tambahkan custom domain (misal: `app.yourdomain.com`)

### Environment Variables di Cloudflare:

Set via dashboard atau `wrangler.jsonc`:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## 4. Setup VPS (Backend)

Backend Node.js di-deploy ke VPS dengan Docker atau PM2.

### Requirement VPS:
- Ubuntu 22.04+ / Debian 12+
- RAM minimal 2GB
- Node.js 20+
- PostgreSQL 17+
- Redis 7+

### Langkah-langkah:

1. **SSH ke VPS dan install dependencies:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install pnpm
   npm install -g pnpm
   
   # Install PM2
   npm install -g pm2
   ```

2. **Setup PostgreSQL 17 dengan pgvector:**
   ```bash
   # Tambahkan PostgreSQL APT Repository
   sudo apt install -y postgresql-common
   sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
   
   # Install PostgreSQL 17
   sudo apt install postgresql-17 postgresql-contrib-17 -y
   
   # Install pgvector extension
   sudo apt install postgresql-17-pgvector -y
   
   # Masuk ke PostgreSQL
   sudo -u postgres psql
   ```
   
   Di dalam psql:
   ```sql
   -- Buat user dan database
   CREATE USER kirimchat WITH PASSWORD 'your-password';
   CREATE DATABASE kirimchat OWNER kirimchat;
   
   -- Koneksi ke database kirimchat
   \c kirimchat
   
   -- Aktifkan pgvector extension
   CREATE EXTENSION IF NOT EXISTS vector;
   
   -- Verifikasi extension aktif
   SELECT * FROM pg_extension WHERE extname = 'vector';
   
   \q
   ```
   
   > **Note:** pgvector digunakan untuk fitur AI/embedding search. Pastikan extension sudah aktif sebelum menjalankan migrasi.

3. **Setup Redis:**
   ```bash
   sudo apt install redis-server -y
   sudo systemctl enable redis-server
   ```

4. **Clone dan setup project:**
   
   > **⚠️ REMINDER: Keep repository PRIVATE!**
   
   ```bash
   git clone git@github.com:orif1n/kichat-approved.git
   cd kichat/apps/backend
   pnpm install
   cp .env.example .env
   # Edit .env dengan kredensial yang benar
   ```
   
   **IMPORTANT:** Ensure your fork/clone remains PRIVATE at all times.

5. **Jalankan migrasi database:**
   ```bash
   pnpm prisma db push

   pnpm prisma generate
   ```

6. **Build dan jalankan dengan PM2:**
   ```bash
   pnpm build
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

### Setup Nginx Reverse Proxy:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL dengan Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

---

## Checklist Deployment

- [ ] Brevo SMTP credentials configured
- [ ] Google OAuth credentials configured
- [ ] PostgreSQL database created
- [ ] Redis running
- [ ] Backend deployed dan running di VPS
- [ ] Frontend deployed ke Cloudflare Workers
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Meta/WhatsApp webhook configured

---

## Troubleshooting

| Issue | Solusi |
|-------|--------|
| Email tidak terkirim | Cek SMTP credentials, pastikan domain terverifikasi di Brevo |
| Google login error | Pastikan redirect URI match persis di Google Console |
| CORS error | Cek `CORS_ALLOWED_ORIGINS` di backend .env |
| 502 Bad Gateway | Cek apakah backend running: `pm2 status` |
