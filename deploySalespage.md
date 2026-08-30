# 🚀 Panduan Deployment Sales Page ProChat (Next.js + CloudPanel)

Panduan komprehensif untuk mendeploy landing page & sales page **ProChat Next.js** di VPS berbasis **CloudPanel** pada **Domain Utama (`prochat.work`)** menggunakan **PM2**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Utama (Sales Page)** | `https://prochat.work` *(dan `https://www.prochat.work`)* |
| **Domain Dashboard / App** | `https://dash.prochat.work` |
| **Domain Backend API** | `https://api.prochat.work` |
| **Sales Page App Port** | `3002` |
| **User CloudPanel** | `prochat-sales` *(atau sesuaikan user site Anda)* |
| **Path Domain Web** | `/home/prochat-sales/htdocs/prochat.work` |
| **Path Git Repository** | `/home/prochat-sales/htdocs/chatpro` |
| **Framework** | **Next.js 16 (App Router)** |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (`prochat-salespage`) |

---

## 🛠️ Langkah 1: Persiapan Server VPS

> [!NOTE]
> Jika Anda sudah melakukan Langkah 1 pada panduan Frontend/Backend sebelumnya, Anda bisa langsung melompat ke **Langkah 2**.

Login ke VPS Anda sebagai user `root` melalui SSH:

### 1.1 Pastikan Node.js v22 (LTS), pnpm & PM2 Terpasang
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
   - **Domain**: `prochat.work`
   - **Site User**: `prochat-sales` *(otomatis atau custom)*
   - **Node.js Version**: `v22.x`
   - **App Port**: `3002`
3. *(Opsional)* Tambahkan Domain Alias `www.prochat.work` jika diinginkan di tab **Settings** ➡️ **Domain Names**.
4. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `prochat.work` ➡️ klik **New Let's Encrypt Certificate** ➡️ checklist domain dan klik **Create and Install**.
5. Konfigurasi **Vhost Nginx** (Tab **Vhost**):
   - Salin dan terapkan konfigurasi proxy dan caching static asset Next.js berikut:
     ```nginx
     location /_next/static {
         proxy_pass http://127.0.0.1:3002;
         proxy_cache_bypass $http_upgrade;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
         expires 365d;
         access_log off;
     }

     location / {
         proxy_pass http://127.0.0.1:3002;
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

Login sebagai root atau user terkait, lalu clone repositori ke folder `/home/prochat-sales/htdocs/`:

```bash
cd /home/prochat-sales/htdocs
git clone https://github.com/anggiadiputra/chatpro.git
```

> [!TIP]
> Jika folder repositori `chatpro` sudah ada di server (misalnya digunakan bersama), Anda cukup memastikan branch `main` sudah ditarik (`git pull origin main`).

---

## ⚙️ Langkah 4: Buat File `.env` Production

Buat file environment di folder target domain `/home/prochat-sales/htdocs/prochat.work/.env`:

```bash
cat << 'EOF' > /home/prochat-sales/htdocs/prochat.work/.env
# APP CONFIGURATION
NEXT_PUBLIC_APP_URL="https://prochat.work"
NEXT_PUBLIC_DASHBOARD_URL="https://dash.prochat.work"
NEXT_PUBLIC_API_URL="https://api.prochat.work"
NEXT_PUBLIC_APP_NAME="ProChat"

# SERVER RUNTIME
NODE_ENV="production"
PORT=3002
EOF
```

---

## 🚀 Langkah 5: Eksekusi Deploy (One-Liner Command)

Jalankan satu baris perintah berikut untuk melakukan pull kode terbaru, sync file salespage, install dependencies, build Next.js production bundle, atur permissions, dan jalankan PM2:

```bash
cd /home/prochat-sales/htdocs/chatpro && git pull origin main && rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/salespage/ /home/prochat-sales/htdocs/prochat.work/ && cd /home/prochat-sales/htdocs/prochat.work && pnpm install --dangerously-allow-all-builds && chmod -R +x node_modules/.bin/ && pnpm build && chown -R prochat-sales:prochat-sales /home/prochat-sales/htdocs/ && su - prochat-sales -c "cd /home/prochat-sales/htdocs/prochat.work && pm2 restart prochat-salespage || pm2 start ecosystem.config.cjs"
```

---

## 📜 Langkah 6: Membuat Helper Script Deploy Otomatis

Buat file script `deploy-salespage.sh` agar update sales page di masa depan dapat dilakukan dengan 1 perintah singkat:

```bash
cat << 'EOF' > /home/prochat-sales/deploy-salespage.sh
#!/bin/bash
set -e

echo "🚀 [1/5] Pulling latest code from GitHub..."
cd /home/prochat-sales/htdocs/chatpro
git pull origin main

echo "📦 [2/5] Syncing salespage files to prochat.work..."
rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/salespage/ /home/prochat-sales/htdocs/prochat.work/

echo "🔨 [3/5] Installing dependencies..."
cd /home/prochat-sales/htdocs/prochat.work
pnpm install --dangerously-allow-all-builds
chmod -R +x node_modules/.bin/

echo "⚙️ [4/5] Building Next.js Production App..."
pnpm build

echo "🔒 [5/5] Fixing file permissions & restarting PM2..."
chown -R prochat-sales:prochat-sales /home/prochat-sales/htdocs/
su - prochat-sales -c "cd /home/prochat-sales/htdocs/prochat.work && pm2 restart prochat-salespage || pm2 start ecosystem.config.cjs"

echo "✅ Salespage Deployment Finished Successfully!"
EOF

chmod +x /home/prochat-sales/deploy-salespage.sh
```

**Setiap kali Anda ingin deploy update sales page terbaru, cukup jalankan:**
```bash
/home/prochat-sales/deploy-salespage.sh
```

---

## 🧪 Langkah 7: Pengujian & Monitoring

### 7.1 Cek Status dan Log PM2
```bash
# Cek status proses sales page
su - prochat-sales -c "pm2 status"

# Cek 30 baris log terakhir
su - prochat-sales -c "pm2 logs prochat-salespage --lines 30 --nostream"
```

### 7.2 Tes Akses Domain
```bash
# Dari dalam server (port 3002)
curl -I http://localhost:3002

# Dari publik melalui domain SSL
curl -I https://prochat.work
curl -I https://prochat.work/privacy-policy
curl -I https://prochat.work/terms
curl -I https://prochat.work/aup
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK` atau `HTTP/2 200`

### 7.3 Simpan PM2 Startup (Auto-start saat reboot server)
```bash
su - prochat-sales -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `502 Bad Gateway` di browser | Next.js belum berjalan di port 3002 | Cek status dengan `pm2 status` dan log dengan `pm2 logs prochat-salespage` |
| `EADDRINUSE: port 3002 already in use` | Ada proses lain yang menduduki port 3002 | Cek proses dengan `lsof -i :3002` atau `fuser -k 3002/tcp` lalu restart PM2 |
| `JavaScript heap out of memory saat build` | RAM VPS terbatas (< 2GB) saat compile Next.js | Tambahkan swap RAM di VPS: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| `sh: 1: next: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x node_modules/.bin/` |
| `Tombol Login/Daftar mengarah ke URL lama` | Cache browser atau belum deploy kode terbaru | Bersihkan cache browser dan jalankan `/home/prochat-sales/deploy-salespage.sh` |
