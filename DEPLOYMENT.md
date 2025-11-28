# 🚀 CelebHub Deployment Guide

This guide covers multiple deployment options for the CelebHub platform.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
  - [Docker Deployment](#docker-deployment)
  - [PM2 Deployment](#pm2-deployment)
  - [Manual Deployment](#manual-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements
- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM (4GB recommended)
- 20GB+ storage
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (for Docker deployment)
- PM2 (for PM2 deployment)

### Domain & DNS
- Domain name configured
- DNS A record pointing to your server IP
- (Optional) Cloudflare for CDN and DDoS protection

## Environment Setup

### 1. Create Production Environment File

```bash
cp .env.example .env
```

Edit `.env` with production values:

```env
# Database
DATABASE_URL="postgresql://celebhub_user:STRONG_PASSWORD@localhost:5432/celebhub_prod"

# Next.js
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
NODE_ENV="production"

# App
NEXT_PUBLIC_APP_NAME="CelebHub"

# Security
NEXT_TELEMETRY_DISABLED=1
```

### 2. Secure Your Environment File

```bash
chmod 600 .env
chown $USER:$USER .env
```

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Advantages
- Isolated environment
- Easy scaling
- Consistent across environments
- Simple backup and restore

#### Setup Steps

1. **Install Docker & Docker Compose**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

2. **Configure Docker Compose**

```bash
# Create .env file for Docker Compose
cat > .env << 'EOF'
POSTGRES_USER=celebhub_user
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD
POSTGRES_DB=celebhub_prod
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
EOF
```

3. **Build and Start Services**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

4. **Run Database Migrations**

```bash
# Access app container
docker-compose exec app sh

# Run migrations
npx prisma migrate deploy

# Exit container
exit
```

#### Docker Commands

```bash
# View running containers
docker-compose ps

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app

# Update and redeploy
git pull
docker-compose build
docker-compose up -d
```

### Option 2: PM2 Deployment

#### Advantages
- Native Node.js process management
- Built-in clustering
- Auto-restart on crashes
- Real-time monitoring

#### Setup Steps

1. **Install PM2**

```bash
npm install -g pm2
```

2. **Install Dependencies**

```bash
npm ci --production
```

3. **Build Application**

```bash
npm run production:build
```

4. **Configure PM2**

Edit `ecosystem.config.js` with your settings:

```javascript
module.exports = {
  apps: [
    {
      name: 'celebhub',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
```

5. **Start with PM2**

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

#### PM2 Commands

```bash
# View processes
pm2 list

# Monitor
pm2 monit

# View logs
pm2 logs celebhub

# Restart
pm2 restart celebhub

# Stop
pm2 stop celebhub

# Delete
pm2 delete celebhub
```

### Option 3: Manual Deployment

1. **Set up PostgreSQL**

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE celebhub_prod;
CREATE USER celebhub_user WITH PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE celebhub_prod TO celebhub_user;
\q
```

2. **Build and Start**

```bash
# Install dependencies
npm ci --production

# Build
npm run production:build

# Run migrations
npx prisma migrate deploy

# Start
npm run production:start
```

## SSL/HTTPS Setup

### Using Nginx + Let's Encrypt

1. **Install Nginx**

```bash
sudo apt update
sudo apt install nginx
```

2. **Configure Nginx**

Create `/etc/nginx/sites-available/celebhub`:

```nginx
upstream celebhub {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        proxy_pass http://celebhub;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://celebhub;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

3. **Enable Site**

```bash
sudo ln -s /etc/nginx/sites-available/celebhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Install Certbot**

```bash
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring

### Health Checks

The application includes a health check endpoint:

```bash
curl https://yourdomain.com/api/health
```

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Logs
pm2 logs --lines 100
```

### Docker Monitoring

```bash
# Container stats
docker stats

# Health check
docker-compose exec app wget -q --spider http://localhost:3000/api/health
```

### Application Logs

```bash
# PM2 logs
pm2 logs celebhub --lines 200

# Docker logs
docker-compose logs -f --tail=200 app

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Backup & Recovery

### Database Backup

```bash
# Manual backup
pg_dump -U celebhub_user celebhub_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (cron)
0 2 * * * pg_dump -U celebhub_user celebhub_prod > /backups/celebhub_$(date +\%Y\%m\%d).sql
```

### Docker Volume Backup

```bash
# Backup database volume
docker run --rm -v test1-bio_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore
docker run --rm -v test1-bio_postgres_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres_backup.tar.gz"
```

### File Backup

```bash
# Backup uploads
tar czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Restore
tar xzf uploads_backup_YYYYMMDD.tar.gz -C ./
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs celebhub
# or
docker-compose logs app

# Check environment variables
env | grep DATABASE_URL

# Test database connection
npx prisma studio
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U celebhub_user -d celebhub_prod -h localhost

# Check connection string
echo $DATABASE_URL
```

### Memory Issues

```bash
# Check memory usage
free -h

# PM2: Limit memory
pm2 start ecosystem.config.js --max-memory-restart 1G

# Docker: Limit memory
# Add to docker-compose.yml:
# services:
#   app:
#     mem_limit: 1G
```

### Performance Issues

```bash
# Enable Next.js build cache
npm run build -- --profile

# Analyze bundle size
npm run build -- --analyze

# Check database queries
npx prisma studio
```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed and working
- [ ] Firewall configured (ports 80, 443, 5432)
- [ ] Backup system set up
- [ ] Monitoring enabled
- [ ] Health checks passing
- [ ] Logs rotation configured
- [ ] DNS configured correctly
- [ ] SEO tags verified (robots.txt, sitemap.xml)

## Security Hardening

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Secure PostgreSQL
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Set to require password authentication

# Disable root login
sudo passwd -l root

# Set up fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## Scaling

### Horizontal Scaling with PM2

```javascript
// ecosystem.config.js
{
  instances: 4, // or 'max' for all CPU cores
  exec_mode: 'cluster',
}
```

### Load Balancing with Nginx

```nginx
upstream celebhub_cluster {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}
```

## Support

For deployment issues:
1. Check logs first
2. Review this guide
3. Search existing issues
4. Create new issue with logs

---

Happy Deploying! 🚀
