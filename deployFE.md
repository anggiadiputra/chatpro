# 🚀 Panduan Deployment Frontend ProChat (Next.js + CloudPanel)

Panduan komprehensif untuk mendeploy frontend **ProChat Next.js** di VPS berbasis **CloudPanel** menggunakan **PM2** dan terhubung ke backend **api.prochat.work**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Frontend** | `https://app.prochat.work` |
| **Domain Backend** | `https://api.prochat.work` |
| **Frontend App Port** | `3000` |
| **User CloudPanel** | `prochat-app` *(atau sesuaikan user site Anda)* |
| **Path Domain Web** | `/home/prochat-app/htdocs/app.prochat.work` |
| **Path Git Repository** | `/home/prochat-app/htdocs/chatpro` |
| **Framework** | **Next.js 15 (App Router)** |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm v10+)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (`prochat-frontend`) |

---

## 🛠️ Langkah 1: Persiapan Server VPS

> [!NOTE]
> Jika Anda sudah melakukan Langkah 1 pada panduan Backend (`deployBE.md`), Anda bisa langsung melompat ke **Langkah 2**.

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
npm install -g pnpm pm2
```

---

## 🌐 Langkah 2: Konfigurasi Site di CloudPanel

1. Buka dashboard CloudPanel (`https://IP-VPS:8443`).
2. Masuk ke menu **Sites** ➡️ **Add Site** ➡️ **Create a Node.js Site**:
   - **Domain**: `app.prochat.work`
   - **Node.js Version**: `v22.x`
   - **App Port**: `3000`
   - **Site User**: `prochat-app` *(otomatis atau custom)*
3. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `app.prochat.work` ➡️ klik **New Let's Encrypt Certificate**.
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

## 📥 Langkah 3: Setup Folder Git Repository

Login sebagai root atau user terkait, lalu clone repositori ke folder `/home/prochat-app/htdocs/`:

```bash
cd /home/prochat-app/htdocs
git clone https://github.com/anggiadiputra/chatpro.git
```

> [!TIP]
> Jika folder `chatpro` sudah ada di VPS (misalnya saat deploy backend di user yang sama), Anda bisa menggunakan path yang sudah ada.

---

## ⚙️ Langkah 4: Buat File `.env` Production

> [!IMPORTANT]
> Next.js meng-*embed* variabel bertanda `NEXT_PUBLIC_*` ke dalam bundle javascript **saat proses build (`pnpm build`)**. Pastikan file `.env` ini dibuat sebelum menjalankan build!

Buat file environment di folder target domain `/home/prochat-app/htdocs/app.prochat.work/.env`:

```bash
cat << 'EOF' > /home/prochat-app/htdocs/app.prochat.work/.env
# BACKEND API & APP URL
NEXT_PUBLIC_API_URL="https://api.prochat.work"
NEXT_PUBLIC_APP_URL="https://app.prochat.work"
NEXT_PUBLIC_APP_NAME="ProChat"

# SERVER RUNTIME
NODE_ENV="production"
PORT=3000
EOF
```

---

## 🚀 Langkah 5: Eksekusi Deploy (One-Liner Command)

Jalankan satu baris perintah berikut untuk melakukan pull kode terbaru, sync file frontend, install dependencies, build Next.js production bundle, atur permissions, dan jalankan PM2:

```bash
cd /home/prochat-app/htdocs/chatpro && git pull origin main && rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/frontend/ /home/prochat-app/htdocs/app.prochat.work/ && cd /home/prochat-app/htdocs/app.prochat.work && pnpm install --dangerously-allow-all-builds && chmod -R +x node_modules/.bin/ && pnpm build && chown -R prochat-app:prochat-app /home/prochat-app/htdocs/ && su - prochat-app -c "cd /home/prochat-app/htdocs/app.prochat.work && pm2 restart prochat-frontend || pm2 start ecosystem.config.cjs"
```

---

## 📜 Langkah 6: Membuat Helper Script Deploy Otomatis

Buat file script `deploy-frontend.sh` agar update frontend di masa depan dapat dilakukan dengan 1 perintah singkat:

```bash
cat << 'EOF' > /home/prochat-app/deploy-frontend.sh
#!/bin/bash
set -e

echo "🚀 [1/5] Pulling latest code from GitHub..."
cd /home/prochat-app/htdocs/chatpro
git pull origin main

echo "📦 [2/5] Syncing frontend files to app.prochat.work..."
rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/frontend/ /home/prochat-app/htdocs/app.prochat.work/

echo "🔨 [3/5] Installing dependencies..."
cd /home/prochat-app/htdocs/app.prochat.work
pnpm install --dangerously-allow-all-builds
chmod -R +x node_modules/.bin/

echo "⚙️ [4/5] Building Next.js Production App..."
pnpm build

echo "🔒 [5/5] Fixing file permissions & restarting PM2..."
chown -R prochat-app:prochat-app /home/prochat-app/htdocs/
su - prochat-app -c "cd /home/prochat-app/htdocs/app.prochat.work && pm2 restart prochat-frontend || pm2 start ecosystem.config.cjs"

echo "✅ Frontend Deployment Finished Successfully!"
EOF

chmod +x /home/prochat-app/deploy-frontend.sh
```

**Setiap kali Anda ingin deploy update frontend terbaru, cukup jalankan:**
```bash
/home/prochat-app/deploy-frontend.sh
```

---

## 🧪 Langkah 7: Pengujian & Monitoring

### 7.1 Cek Status dan Log PM2
```bash
# Cek status proses frontend
su - prochat-app -c "pm2 status"

# Cek 30 baris log terakhir
su - prochat-app -c "pm2 logs prochat-frontend --lines 30 --nostream"
```

### 7.2 Tes Akses Domain
```bash
# Dari dalam server (port 3000)
curl -I http://localhost:3000

# Dari publik melalui domain SSL
curl -I https://app.prochat.work
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK` atau `HTTP/2 200`

### 7.3 Simpan PM2 Startup (Auto-start saat reboot server)
```bash
su - prochat-app -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `502 Bad Gateway` di browser | Next.js belum berjalan di port 3000 | Cek status dengan `pm2 status` dan log dengan `pm2 logs prochat-frontend` |
| `NEXT_PUBLIC_* tidak terbaca / API mengarah ke localhost` | `.env` belum dibuat sebelum build, atau Next.js belum di-build ulang | Pastikan `.env` terisi benar, lalu jalankan `pnpm build` dan restart PM2 |
| `EADDRINUSE: port 3000 already in use` | Ada proses lain yang menduduki port 3000 | Cek proses dengan `lsof -i :3000` atau `fuser -k 3000/tcp` lalu restart PM2 |
| `JavaScript heap out of memory saat build` | RAM VPS terbatas (< 2GB) saat compile Next.js | Tambahkan swap RAM di VPS: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| `sh: 1: next: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x node_modules/.bin/` |
