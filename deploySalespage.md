# 🚀 Panduan Deployment Sales Page Whoops (Next.js + CloudPanel)

Panduan komprehensif untuk mendeploy landing page & sales page **Whoops Next.js** di VPS berbasis **CloudPanel** pada **Domain Utama (`whoops.web.id`)** menggunakan **PM2**.

---

## 📋 Informasi Arsitektur & Spesifikasi

| Parameter | Nilai / Konfigurasi |
| :--- | :--- |
| **Domain Utama (Sales Page)** | `https://whoops.web.id` *(dan `https://www.whoops.web.id`)* |
| **Domain Dashboard / App** | `https://dash.whoops.web.id` |
| **Domain Backend API** | `https://api.whoops.web.id` |
| **Sales Page App Port** | `3002` |
| **User CloudPanel** | `whoops` *(atau sesuaikan user site Anda)* |
| **Path Domain Web** | `/home/whoops/htdocs/whoops.web.id` |
| **Path Git Repository** | `/home/whoops/htdocs/support` |
| **Framework** | **Next.js 16 (App Router)** |
| **Node.js Version** | **v22.x (LTS)** *(Wajib untuk pnpm)* |
| **Package Manager** | `pnpm` |
| **Process Manager** | `PM2` (`whoops-salespage`) |

---

## 🛠️ Langkah 1: Persiapan Server VPS

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
   - **Domain**: `whoops.web.id`
   - **Site User**: `whoops` *(atau user yang sudah ada)*
   - **Node.js Version**: `v22.x`
   - **App Port**: `3002`
3. *(Opsional)* Tambahkan Domain Alias `www.whoops.web.id` jika diinginkan di tab **Settings** ➡️ **Domain Names**.
4. Pasang **SSL (Let's Encrypt)**:
   - Masuk ke tab **SSL/TLS** pada site `whoops.web.id` ➡️ klik **New Let's Encrypt Certificate** ➡️ checklist domain dan klik **Create and Install**.
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

## ⚙️ Langkah 3: Buat File `.env` Production

Buat file environment di folder target domain `/home/whoops/htdocs/whoops.web.id/.env`:

```bash
cat << 'EOF' > /home/whoops/htdocs/whoops.web.id/.env
# APP CONFIGURATION
NEXT_PUBLIC_APP_URL="https://whoops.web.id"
NEXT_PUBLIC_DASHBOARD_URL="https://dash.whoops.web.id"
NEXT_PUBLIC_API_URL="https://api.whoops.web.id"
NEXT_PUBLIC_APP_NAME="Whoops"

# SERVER RUNTIME
NODE_ENV="production"
PORT=3002
EOF

# Kunci permission file .env agar aman
chmod 600 /home/whoops/htdocs/whoops.web.id/.env
```

---

## 🚀 Langkah 4: Eksekusi Deploy (One-Liner Command)

Jalankan satu baris perintah berikut di terminal server Anda (sebagai user `root`):

```bash
cd /home/whoops/htdocs/support && git pull support main || git pull origin main && rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/salespage/ /home/whoops/htdocs/whoops.web.id/ && cd /home/whoops/htdocs/whoops.web.id && pnpm install --dangerously-allow-all-builds && chmod -R +x node_modules/.bin/ && pnpm build && chown -R whoops:whoops /home/whoops/htdocs/whoops.web.id && find /home/whoops/htdocs/whoops.web.id -type d -exec chmod 755 {} + && find /home/whoops/htdocs/whoops.web.id -type f -exec chmod 644 {} + && chmod -R +x /home/whoops/htdocs/whoops.web.id/node_modules/.bin/ && chmod 600 /home/whoops/htdocs/whoops.web.id/.env && su - whoops -c "cd /home/whoops/htdocs/whoops.web.id && pm2 restart whoops-salespage || pm2 start ecosystem.config.cjs"
```

---

## 🔒 Langkah 5: Standarisasi Permission File & Folder

Untuk memastikan semua file dan folder memiliki permission yang tepat dan aman sesuai standar CloudPanel & Linux:

```bash
# 1. Atur kepemilikan user & group whoops secara menyeluruh
chown -R whoops:whoops /home/whoops/htdocs/whoops.web.id

# 2. Atur permission semua FOLDER menjadi 755 (drwxr-xr-x)
find /home/whoops/htdocs/whoops.web.id -type d -exec chmod 755 {} +

# 3. Atur permission semua FILE menjadi 644 (-rw-r--r--)
find /home/whoops/htdocs/whoops.web.id -type f -exec chmod 644 {} +

# 4. Beri izin execute untuk binary Next.js di node_modules
chmod -R +x /home/whoops/htdocs/whoops.web.id/node_modules/.bin/

# 5. Kunci file .env agar hanya bisa dibaca oleh user whoops (600)
chmod 600 /home/whoops/htdocs/whoops.web.id/.env

# 6. Atur folder logs agar bisa ditulis oleh PM2 (775)
chmod -R 775 /home/whoops/htdocs/whoops.web.id/logs 2>/dev/null || true
```

---

## 📜 Langkah 6: Membuat Helper Script Deploy Otomatis

Buat file script `deploy-salespage.sh` di folder `/home/whoops/` agar update sales page di masa depan dapat dilakukan dengan 1 perintah singkat (sudah otomatis merapikan permission):

```bash
cat << 'EOF' > /home/whoops/deploy-salespage.sh
#!/bin/bash
set -e

echo "🚀 [1/6] Pulling latest code from GitHub..."
cd /home/whoops/htdocs/support
git pull support main || git pull origin main

echo "📦 [2/6] Syncing salespage files to whoops.web.id..."
rsync -av --delete --exclude='.env' --exclude='.env.local' --exclude='node_modules' --exclude='.next' --exclude='logs' ./apps/salespage/ /home/whoops/htdocs/whoops.web.id/

echo "🔨 [3/6] Installing dependencies..."
cd /home/whoops/htdocs/whoops.web.id
pnpm install --dangerously-allow-all-builds
chmod -R +x node_modules/.bin/

echo "⚙️ [4/6] Building Next.js Production App..."
pnpm build

echo "🔒 [5/6] Fixing file & folder permissions..."
chown -R whoops:whoops /home/whoops/htdocs/whoops.web.id
find /home/whoops/htdocs/whoops.web.id -type d -exec chmod 755 {} +
find /home/whoops/htdocs/whoops.web.id -type f -exec chmod 644 {} +
chmod -R +x /home/whoops/htdocs/whoops.web.id/node_modules/.bin/
chmod 600 /home/whoops/htdocs/whoops.web.id/.env 2>/dev/null || true
chmod -R 775 /home/whoops/htdocs/whoops.web.id/logs 2>/dev/null || true

echo "🔄 [6/6] Restarting PM2 process..."
su - whoops -c "cd /home/whoops/htdocs/whoops.web.id && pm2 restart whoops-salespage || pm2 start ecosystem.config.cjs"

echo "✅ Salespage Deployment Finished Successfully!"
EOF

chmod +x /home/whoops/deploy-salespage.sh
```

**Setiap kali Anda ingin deploy update sales page terbaru, cukup jalankan:**
```bash
/home/whoops/deploy-salespage.sh
```

---

## 🧪 Langkah 7: Pengujian & Monitoring

### 7.1 Cek Status dan Log PM2
```bash
# Cek status proses sales page
su - whoops -c "pm2 status"

# Cek 30 baris log terakhir
su - whoops -c "pm2 logs whoops-salespage --lines 30 --nostream"
```

### 7.2 Tes Akses Domain
```bash
# Dari dalam server (port 3002)
curl -I http://localhost:3002

# Dari publik melalui domain SSL
curl -I https://whoops.web.id
curl -I https://whoops.web.id/privacy-policy
curl -I https://whoops.web.id/terms
curl -I https://whoops.web.id/aup
```
*Respons yang diharapkan:* `HTTP/1.1 200 OK` atau `HTTP/2 200`

### 7.3 Simpan PM2 Startup (Auto-start saat reboot server)
```bash
su - whoops -c "pm2 save"
pm2 startup
```

---

## ⚠️ Troubleshooting Umum

| Error / Gejala | Penyebab | Solusi |
| :--- | :--- | :--- |
| `502 Bad Gateway` di browser | Next.js belum berjalan di port 3002 | Cek status dengan `pm2 status` dan log dengan `pm2 logs whoops-salespage` |
| `EADDRINUSE: port 3002 already in use` | Ada proses lain yang menduduki port 3002 | Cek proses dengan `lsof -i :3002` atau `fuser -k 3002/tcp` lalu restart PM2 |
| `JavaScript heap out of memory saat build` | RAM VPS terbatas (< 2GB) saat compile Next.js | Tambahkan swap RAM di VPS: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` |
| `sh: 1: next: Permission denied` | Binary di `node_modules/.bin` kehilangan flag execute | Jalankan `chmod -R +x /home/whoops/htdocs/whoops.web.id/node_modules/.bin/` |
| `Permission denied / EACCES` | Kepemilikan file bukan milik `whoops:whoops` | Jalankan langkah 5 (Standarisasi Permission File & Folder) |
| `Tombol Login/Daftar mengarah ke URL lama` | Cache browser atau belum deploy kode terbaru | Bersihkan cache browser dan jalankan `/home/whoops/deploy-salespage.sh` |
