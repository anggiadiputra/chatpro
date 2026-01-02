# 🐳 Backend Deployment Guide - KirimChat

> **⚠️ CONFIDENTIAL - PRIVATE SOURCE CODE**
>
> **DO NOT SHARE OR DISTRIBUTE**
>
> - ❌ DO NOT make repository PUBLIC
> - ❌ DO NOT share source code
> - ❌ DO NOT publish Docker images publicly
> - ✅ Keep everything PRIVATE
> - ✅ Only authorized access
>
> This is proprietary software. Unauthorized distribution is prohibited.

---

Panduan lengkap deployment backend KirimChat menggunakan Docker.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Docker Deployment](#docker-deployment)
4. [Nginx & SSL Setup](#nginx--ssl-setup)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- VPS/Server dengan Ubuntu 20.04+ atau Debian 11+
- Domain untuk backend (e.g., api.yourdomain.com)
- Minimal 2GB RAM (recommended 4GB+)
- Minimal 10GB disk space
- GitHub account untuk GHCR (optional)

---

## Server Setup

### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Add user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Create Deployment Directory

```bash
# Create directory
mkdir -p ~/kirimchat-backend
cd ~/kirimchat-backend

# Create uploads directory
mkdir -p uploads
```

---

## Docker Deployment

### Step 3: Login to GitHub Container Registry (GHCR)

**IMPORTANT:** Docker image backend disimpan di GitHub Container Registry (GHCR) yang bersifat private. Anda perlu login terlebih dahulu sebelum bisa pull image.

#### Create GitHub Personal Access Token (PAT)

1. **Go to GitHub Settings:**
   - Login ke GitHub
   - Klik profile picture → **Settings**
   - Scroll ke bawah → **Developer settings**
   - Klik **Personal access tokens** → **Tokens (classic)**

2. **Generate New Token:**
   - Klik **Generate new token** → **Generate new token (classic)**
   - Note: `GHCR Access for KirimChat`
   - Expiration: `No expiration` atau sesuai kebutuhan
   - Select scopes:
     - ✅ `read:packages` - Download packages from GitHub Package Registry
     - ✅ `write:packages` - Upload packages to GitHub Package Registry (optional)
   - Klik **Generate token**
   - **COPY TOKEN** - Anda tidak akan bisa melihatnya lagi!

#### Login to GHCR

```bash
# Login menggunakan Personal Access Token
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Contoh:
# echo "ghp_xxxxxxxxxxxxxxxxxxxx" | docker login ghcr.io -u orif1n --password-stdin
```

**Expected output:**
```
Login Succeeded
```

**Verify login:**
```bash
# Test pull image
docker pull ghcr.io/orif1n/kirimchat-backend:latest
```

**Troubleshooting login:**
```bash
# If login fails, check:
# 1. Token has correct permissions (read:packages)
# 2. Token is not expired
# 3. Username is correct (case-sensitive)

# Manual login (interactive):
docker login ghcr.io
# Username: your-github-username
# Password: your-github-token
```

### Step 4: Download Deployment Files

**Option A: Clone from Git**
```bash
git clone https://github.com/orif1n/kichat-approved.git
cd kichat-approved

# Copy deployment files
cp docker-compose.yml ~/kirimchat-backend/
cp init-db.sh ~/kirimchat-backend/
cp setup.sh ~/kirimchat-backend/
cp .env.docker.example ~/kirimchat-backend/.env
```

**Option B: Manual Download**
```bash
cd ~/kirimchat-backend

# Download files
wget https://raw.githubusercontent.com/yourusername/kichat-approved/main/docker-compose.yml
wget https://raw.githubusercontent.com/yourusername/kichat-approved/main/init-db.sh
wget https://raw.githubusercontent.com/yourusername/kichat-approved/main/setup.sh
wget https://raw.githubusercontent.com/yourusername/kichat-approved/main/.env.docker.example

# Rename env file
mv .env.docker.example .env
```

### Step 5: Configure Environment Variables

```bash
nano .env
```

**Required Configuration:**

```env
# Database
DB_NAME=kirimchat
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

# Redis
REDIS_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

# JWT & Auth
JWT_SECRET=CHANGE_THIS_32_CHAR_SECRET
BETTER_AUTH_SECRET=CHANGE_THIS_32_CHAR_SECRET
BETTER_AUTH_URL=https://api.yourdomain.com

# URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://api.yourdomain.com
COOKIE_DOMAIN=.yourdomain.com

# SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-login
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=KirimChat
SMTP_SECURE=false
```

**Generate Strong Secrets:**
```bash
# Generate random secrets
openssl rand -base64 32
```

### Step 6: Run Automated Setup

```bash
# Make setup script executable
chmod +x setup.sh
chmod +x init-db.sh

# Run setup
./setup.sh
```

**Expected Output:**
```
🚀 KirimChat Backend - Automated Setup
======================================

✅ .env file found
✅ Docker is running

🛑 Stopping and removing existing containers...
🧹 Cleaning up orphaned containers...

📦 Pulling latest images...
[+] Pulling 3/3
 ✔ postgres Pulled
 ✔ redis Pulled
 ✔ backend Pulled

🚀 Starting services...
[+] Running 3/3
 ✔ Container kirimchat-postgres  Healthy
 ✔ Container kirimchat-redis     Healthy
 ✔ Container kirimchat-backend   Started

⏳ Waiting for PostgreSQL to be ready...
✅ PostgreSQL is ready

🔍 Checking backend health...
✅ Backend is healthy!

====================================
🎉 Setup completed successfully!
====================================

📊 Service Status:
NAME                  IMAGE                                      STATUS
kirimchat-backend     ghcr.io/orif1n/kirimchat-backend:latest   Up
kirimchat-postgres    ankane/pgvector:v0.5.1                     Up (healthy)
kirimchat-redis       redis:7-alpine                             Up (healthy)

🌐 Backend API: http://localhost:3005
🗄️  PostgreSQL: localhost:5432
🔴 Redis: localhost:6379

✅ Your KirimChat backend is now running!
```

---

## Nginx & SSL Setup

### Step 7: Setup Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/kirimchat-backend
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3005/health;
        access_log off;
    }
}
```

**Enable site:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/kirimchat-backend /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Setup Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH (IMPORTANT!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Post-Deployment

### Step 10: Create Admin User

```bash
# Change user role to ADMIN
docker compose exec postgres psql -U postgres -d kirimchat -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your-email@example.com';"

# Verify
docker compose exec postgres psql -U postgres -d kirimchat -c "SELECT email, name, role FROM \"User\" WHERE email = 'your-email@example.com';"
```

### Step 11: Verify Deployment

```bash
# Check services
docker compose ps

# Check logs
docker compose logs -f backend

# Test API
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Setup Monitoring

```bash
# View logs
docker compose logs -f backend

# Check resource usage
docker stats

# Setup log rotation
sudo nano /etc/logrotate.d/kirimchat
```

**Logrotate config:**
```
/home/ubuntu/kirimchat-backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### Setup Automated Backups

```bash
# Create backup script
nano ~/backup-kirimchat.sh
```

**Backup script:**
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T postgres pg_dump -U postgres kirimchat > $BACKUP_DIR/db-$DATE.sql

# Compress
gzip $BACKUP_DIR/db-$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db-*.sql.gz" -mtime +7 -delete

echo "Backup completed: db-$DATE.sql.gz"
```

**Setup cron:**
```bash
chmod +x ~/backup-kirimchat.sh

# Add to crontab
crontab -e

# Add this line (daily at 2 AM):
0 2 * * * /home/ubuntu/backup-kirimchat.sh >> /home/ubuntu/backup.log 2>&1
```

---

## Troubleshooting

### GHCR Authentication Issues

**Error: "unauthorized: authentication required"**
```bash
# Solution: Login to GHCR first
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Verify login
docker pull ghcr.io/orif1n/kirimchat-backend:latest
```

**Error: "denied: permission_denied"**
```bash
# Solution: Check token permissions
# Token must have 'read:packages' scope
# Generate new token with correct permissions
```

**Error: "no basic auth credentials"**
```bash
# Solution: Re-login to GHCR
docker logout ghcr.io
docker login ghcr.io
# Enter username and token
```

### Container won't start

```bash
# Check logs
docker compose logs backend

# Check database connection
docker compose exec backend npx prisma db execute --stdin <<< "SELECT 1"

# Restart services
docker compose restart
```

### Database connection error

```bash
# Check PostgreSQL
docker compose logs postgres

# Verify credentials in .env
cat .env | grep DB_

# Test connection
docker compose exec postgres psql -U postgres -d kirimchat -c "SELECT 1"
```

### Port already in use

```bash
# Check what's using port 3005
sudo lsof -i :3005

# Kill process or change port in .env
```

### Migration errors

```bash
# Check migration status
docker compose exec backend npx prisma migrate status

# Force deploy migrations
docker compose exec backend npx prisma migrate deploy --force
```

### Redis connection error

```bash
# Check Redis logs
docker compose logs redis

# Test Redis connection
docker compose exec redis redis-cli -a your-redis-password ping
```

## 🛠️ Common Commands

```bash
# View all logs
docker compose logs -f

# Restart backend
docker compose restart backend

# Stop all services
docker compose down

# Update to latest version
docker compose pull && docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U postgres kirimchat > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres kirimchat
```

---

**Backend deployment complete!** 🎉

Next: Deploy frontend → See [02-FRONTEND-DEPLOYMENT.md](02-FRONTEND-DEPLOYMENT.md)