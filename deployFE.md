# 🚀 Panduan Deployment Frontend Whoops (Next.js + CloudPanel)

Panduan komprehensif untuk mendeploy frontend **Whoops Next.js** di VPS berbasis **CloudPanel** menggunakan **PM2** dan terhubung ke backend **api.whoops.web.id**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Frontend / Dash** | `https://dash.whoops.web.id` |
| **Domain Backend API** | `https://api.whoops.web.id` |
| **Domain Utama (Sales Page)** | `https://whoops.web.id` |
| **Frontend App Port** | `3000` |
| **User CloudPanel** | `whoops-app` |
| **Path Domain Web** | `/home/whoops-app/htdocs/dash.whoops.web.id` |
| **Path Git Repository** | `/home/whoops-app/htdocs/support` |
| **Framework** | **Next.js 16 (App Router)** |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm v10+)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (`whoops-frontend`) |

---

## 🛠️ Langkah 1: Persiapan Server VPS

Login ke VPS Anda sebagai user `root` melalui SSH:

### 1.1 Pastikan Node.js v22 (LTS) & pnpm Terpasang
```bash
node -v   # Harus v22.x.x
pnpm -v   # Harus v10.x.x / v11.x.x
pm2 -v
```

Jika belum terpasang:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
# Install pnpm dan PM2 secara global serta izinkan Git safe directory
npm install -g pnpm pm2
git config --global --add safe.directory '*'
```

---

## 🌐 Langkah 2: Konfigurasi Site di CloudPanel

1. Buka dashboard CloudPanel (`https://IP-VPS:8443`).
2. Masuk ke menu **Sites** ➡️ **Add Site** ➡️ **Create a Node.js Site**:
   - **Domain**: `dash.whoops.web.id`
   - **Node.js Version**: `v22.x`
   - **App Port**: `3000`
   - **Site User**: `whoops-app`
3. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `dash.whoops.web.id` ➡️ klik **New Let's Encrypt Certificate**.
4. Konfigurasi **Vhost Nginx** (Tab **Vhost**):
   - Pastikan konfigurasi proxy dan caching static asset Next.js sudah optimal:
     ```nginx
     location /_next/static {
         proxy_pass http://127.0.0.1:3000;
         proxy_cache_bypass $http_upgrade;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
         expires 365d;
         access_log off;
     }

     location / {
         proxy_pass http://127.0.0.1:3000;
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

## ⚙️ Langkah 3: Buat File `.env` Production

Buat file environment di folder target domain `/home/whoops-app/htdocs/dash.whoops.web.id/.env`:

```bash
cat << 'EOF' > /home/whoops-app/htdocs/dash.whoops.web.id/.env
# BACKEND API & APP URL
NEXT_PUBLIC_API_URL="https://api.whoops.web.id"
NEXT_PUBLIC_APP_URL="https://dash.whoops.web.id"
NEXT_PUBLIC_APP_NAME="Whoops"

# SERVER RUNTIME
NODE_ENV="production"
PORT=3000
EOF

# Kunci permission file .env agar aman
chmod 600 /home/whoops-app/htdocs/dash.whoops.web.id/.env
```

---

## 🚀 Langkah 4: Eksekusi Deploy (One-Liner Command)

Jalankan perintah berikut untuk melakukan pull kode terbaru, sync frontend, copy konfigurasi `.npmrc`, install dependencies, build Next.js production bundle, atur permissions, dan restart PM2:

```bash
cd /home/whoops-app/htdocs/support && git pull && rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/frontend/ /home/whoops-app/htdocs/dash.whoops.web.id/ && cp /home/whoops-app/htdocs/support/.npmrc /home/whoops-app/htdocs/dash.whoops.web.id/.npmrc && cd /home/whoops-app/htdocs/dash.whoops.web.id && pnpm install && pnpm build && chown -R whoops-app:whoops-app /home/whoops-app/htdocs/dash.whoops.web.id && find /home/whoops-app/htdocs/dash.whoops.web.id -type d -exec chmod 755 {} + && find /home/whoops-app/htdocs/dash.whoops.web.id -type f -exec chmod 644 {} + && chmod -R +x /home/whoops-app/htdocs/dash.whoops.web.id/node_modules/.bin/ && chmod 600 /home/whoops-app/htdocs/dash.whoops.web.id/.env && su - whoops-app -c "cd /home/whoops-app/htdocs/dash.whoops.web.id && pm2 restart whoops-frontend || pm2 start ecosystem.config.cjs"
```

---

## 🔒 Langkah 5: Standarisasi Permission File & Folder

Jalankan perintah ini kapan saja untuk merapikan seluruh permission `dash.whoops.web.id`:

```bash
chown -R whoops-app:whoops-app /home/whoops-app/htdocs/dash.whoops.web.id && find /home/whoops-app/htdocs/dash.whoops.web.id -type d -exec chmod 755 {} + && find /home/whoops-app/htdocs/dash.whoops.web.id -type f -exec chmod 644 {} + && chmod -R +x /home/whoops-app/htdocs/dash.whoops.web.id/node_modules/.bin/ && chmod 600 /home/whoops-app/htdocs/dash.whoops.web.id/.env
```

---

## 📜 Langkah 6: Membuat Helper Script Deploy Otomatis

Buat file script `deploy-frontend.sh` di folder `/home/whoops-app/` agar update frontend di masa depan dapat dilakukan dengan 1 perintah singkat:

```bash
cat << 'EOF' > /home/whoops-app/deploy-frontend.sh
#!/bin/bash
set -e

echo "🚀 [1/6] Pulling latest code from GitHub..."
cd /home/whoops-app/htdocs/support
git pull

echo "📦 [2/6] Syncing frontend files to dash.whoops.web.id..."
rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/frontend/ /home/whoops-app/htdocs/dash.whoops.web.id/
cp /home/whoops-app/htdocs/support/.npmrc /home/whoops-app/htdocs/dash.whoops.web.id/.npmrc

echo "🔨 [3/6] Installing dependencies..."
cd /home/whoops-app/htdocs/dash.whoops.web.id
pnpm install
chmod -R +x node_modules/.bin/

echo "⚙️ [4/6] Building Next.js Production App..."
pnpm build

echo "🔒 [5/6] Fixing file & folder permissions..."
chown -R whoops-app:whoops-app /home/whoops-app/htdocs/dash.whoops.web.id
find /home/whoops-app/htdocs/dash.whoops.web.id -type d -exec chmod 755 {} +
find /home/whoops-app/htdocs/dash.whoops.web.id -type f -exec chmod 644 {} +
chmod -R +x /home/whoops-app/htdocs/dash.whoops.web.id/node_modules/.bin/
chmod 600 /home/whoops-app/htdocs/dash.whoops.web.id/.env 2>/dev/null || true

echo "🔄 [6/6] Restarting PM2 process..."
su - whoops-app -c "cd /home/whoops-app/htdocs/dash.whoops.web.id && pm2 restart whoops-frontend || pm2 start ecosystem.config.cjs"

echo "✅ Frontend Deployment Finished Successfully!"
EOF

chmod +x /home/whoops-app/deploy-frontend.sh
```

**Setiap kali Anda ingin deploy update frontend terbaru, cukup jalankan:**
```bash
/home/whoops-app/deploy-frontend.sh
```

---

## 🧪 Langkah 7: Pengujian & Monitoring

### 7.1 Cek Status dan Log PM2
```bash
# Cek status proses frontend
su - whoops-app -c "pm2 status"

# Cek 30 baris log terakhir
su - whoops-app -c "pm2 logs whoops-frontend --lines 30 --nostream"
```

### 7.2 Tes Akses Domain
```bash
# Dari dalam server (port 3000)
curl -I http://localhost:3000

# Dari publik melalui domain SSL
curl -I https://dash.whoops.web.id
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK` atau `HTTP/2 200`

### 7.3 Simpan PM2 Startup (Auto-start saat reboot server)
```bash
su - whoops-app -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `502 Bad Gateway` di browser | Next.js belum berjalan di port 3000 | Cek status dengan `pm2 status` dan log dengan `pm2 logs whoops-frontend` |
| `NEXT_PUBLIC_* tidak terbaca / API mengarah ke localhost` | `.env` belum dibuat sebelum build, atau Next.js belum di-build ulang | Pastikan `.env` terisi benar, lalu jalankan `pnpm build` dan restart PM2 |
| `EADDRINUSE: port 3000 already in use` | Ada proses lain yang menduduki port 3000 | Cek proses dengan `lsof -i :3000` atau `fuser -k 3000/tcp` lalu restart PM2 |
| `JavaScript heap out of memory saat build` | RAM VPS terbatas (< 2GB) saat compile Next.js | Tambahkan swap RAM di VPS: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| `sh: 1: next: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x /home/whoops-app/htdocs/dash.whoops.web.id/node_modules/.bin/` |
| `Permission denied / EACCES` | Kepemilikan file belum disesuaikan | Jalankan langkah 5 (Standarisasi Permission File & Folder) |
