# EchoChat Deployment Guide

## Overview

EchoChat is a romantic, exclusive two-person communication platform designed for deployment on Hostinger VPS using Coolify. This guide walks through the complete deployment process.

## Prerequisites

- Hostinger VPS with Docker support (Ubuntu 22.04 or later recommended)
- Coolify installed on your VPS
- Domain name: `echochat.space` (already registered)
- MySQL/TiDB database (provided by Manus platform)
- SSL certificate (Coolify handles this automatically)

## Architecture

```
┌─────────────────────────────────────────┐
│         echochat.space                  │
│         (Coolify Proxy)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    EchoChat Docker Container            │
│  ┌──────────────────────────────────┐   │
│  │  Node.js 22 (Alpine)             │   │
│  │  - React 19 Frontend             │   │
│  │  - Express 4 Backend             │   │
│  │  - tRPC 11 API                   │   │
│  │  - Socket.io WebSocket           │   │
│  └──────────────────────────────────┘   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    MySQL/TiDB Database                  │
│  - Messages & Offline Messages          │
│  - User Presence & Keepsakes            │
│  - Shared Horizon Data                  │
└─────────────────────────────────────────┘
```

## Step-by-Step Deployment

### 1. Prepare Your Hostinger VPS

```bash
# SSH into your VPS
ssh root@your_vps_ip

# Update system packages
apt update && apt upgrade -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify Docker installation
docker --version
docker-compose --version
```

### 2. Install Coolify

```bash
# Download and run Coolify installation script
curl -fsSL https://get.coollabs.io/docker-compose.yml -o docker-compose.yml
docker-compose up -d

# Access Coolify at http://your_vps_ip:3000
# Complete the initial setup wizard
```

### 3. Configure Environment Variables

In Coolify dashboard, create a new project and set these environment variables:

```env
# Database Configuration
DATABASE_URL=mysql://user:password@host:3306/echochat_db

# Authentication
JWT_SECRET=your_secure_jwt_secret_here
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Owner Information
OWNER_OPEN_ID=your_open_id
OWNER_NAME=Your Name

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key

# Application
NODE_ENV=production
```

### 4. Deploy EchoChat

#### Option A: Using Coolify UI (Recommended)

1. In Coolify dashboard, click "New Project"
2. Select "Docker Compose"
3. Upload the `docker-compose.yml` file from this repository
4. Configure the environment variables (from Step 3)
5. Set the domain to `echochat.space`
6. Enable SSL/TLS (Coolify handles this automatically)
7. Click "Deploy"

#### Option B: Using Git Repository

1. Push this repository to GitHub/GitLab
2. In Coolify, select "Git Repository"
3. Connect your Git account and select the echochat repository
4. Configure environment variables
5. Set deployment branch to `main`
6. Enable automatic deployments on push
7. Click "Deploy"

### 5. Configure Domain

In Coolify:

1. Go to Project Settings → Domains
2. Add domain: `echochat.space`
3. Point your domain registrar's DNS to Coolify's nameservers
4. Coolify will automatically provision SSL certificate via Let's Encrypt

### 6. Database Setup

```bash
# SSH into your VPS
ssh root@your_vps_ip

# Run database migrations
docker exec echochat npm run db:push

# Verify database connection
docker exec echochat npm run check
```

### 7. Verify Deployment

```bash
# Check container status
docker ps | grep echochat

# View logs
docker logs -f echochat

# Test API endpoint
curl https://echochat.space/api/trpc/auth.me

# Test WebSocket connection
# Open https://echochat.space in browser and check browser console
```

## Post-Deployment Configuration

### Enable Automatic Backups

```bash
# Create backup script
cat > /root/backup-echochat.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/echochat"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
mysqldump -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /root/backup-echochat.sh

# Schedule daily backups at 2 AM
echo "0 2 * * * /root/backup-echochat.sh" | crontab -
```

### Monitor Application Health

```bash
# Check application logs
docker logs -f echochat --tail 100

# Monitor resource usage
docker stats echochat

# Check database connection
docker exec echochat npm run check
```

### Update Application

```bash
# Pull latest code
cd /path/to/echochat
git pull origin main

# Rebuild and redeploy
docker-compose down
docker-compose up -d --build

# Run migrations if schema changed
docker exec echochat npm run db:push
```

## Troubleshooting

### Application won't start

```bash
# Check logs for errors
docker logs echochat

# Verify environment variables are set
docker exec echochat env | grep DATABASE_URL

# Check database connectivity
docker exec echochat npm run check
```

### WebSocket connection issues

```bash
# Ensure port 3000 is open
sudo ufw allow 3000/tcp

# Check if Socket.io is listening
docker exec echochat netstat -tlnp | grep 3000
```

### Database connection errors

```bash
# Verify DATABASE_URL format
# Should be: mysql://user:password@host:port/database

# Test connection manually
docker exec echochat mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1"
```

### SSL certificate issues

```bash
# Check certificate status
docker exec echochat certbot certificates

# Force renewal
docker exec echochat certbot renew --force-renewal
```

## Performance Optimization

### Enable Caching

```bash
# Add Redis for caching (optional)
docker-compose.yml additions:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_messages_senderId ON messages(senderId);
CREATE INDEX idx_messages_receiverId ON messages(receiverId);
CREATE INDEX idx_messages_createdAt ON messages(createdAt);
CREATE INDEX idx_userPresence_userId ON userPresence(userId);
```

### CDN Configuration

For static assets, consider using Cloudflare:

1. Add `echochat.space` to Cloudflare
2. Configure DNS records to point to Coolify
3. Enable caching for static assets

## Security Best Practices

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Verify SSL certificate
docker exec echochat openssl s_client -connect localhost:443 -showcerts

# Check certificate expiration
docker exec echochat openssl x509 -in /etc/letsencrypt/live/echochat.space/cert.pem -noout -dates
```

### Environment Security

- Never commit `.env` files to Git
- Use Coolify's secret management for sensitive data
- Rotate JWT_SECRET periodically
- Use strong database passwords

## Monitoring and Alerts

### Set up Coolify Monitoring

1. In Coolify dashboard, enable monitoring
2. Configure alert thresholds
3. Set up email notifications
4. Monitor CPU, memory, and disk usage

### Application Metrics

```bash
# View application performance metrics
docker stats echochat

# Check database query performance
docker exec echochat mysql -e "SHOW PROCESSLIST"
```

## Scaling Considerations

### Horizontal Scaling

For multiple instances, use:
- Load balancer (Nginx/HAProxy)
- Shared database (already configured)
- Shared session store (Redis)
- WebSocket sticky sessions

### Vertical Scaling

If single instance needs more resources:
- Increase VPS RAM
- Upgrade CPU
- Use SSD storage for database

## Support and Maintenance

### Regular Maintenance Tasks

- [ ] Monitor disk space usage
- [ ] Update Docker images monthly
- [ ] Review and rotate logs weekly
- [ ] Backup database daily
- [ ] Test disaster recovery monthly
- [ ] Update dependencies quarterly

### Getting Help

- Coolify Documentation: https://coolify.io/docs
- Docker Documentation: https://docs.docker.com
- Manus Platform Support: https://help.manus.im

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous version
docker-compose down
git revert HEAD
docker-compose up -d --build

# Restore database from backup
mysql < /backups/echochat/db_latest.sql
```

## Production Checklist

- [ ] Domain configured and DNS propagated
- [ ] SSL certificate installed and valid
- [ ] Database backups scheduled
- [ ] Environment variables securely stored
- [ ] Firewall properly configured
- [ ] Monitoring and alerts enabled
- [ ] Application tested end-to-end
- [ ] WebSocket connections working
- [ ] Offline messaging tested
- [ ] User authentication verified
- [ ] Performance benchmarks met
- [ ] Disaster recovery plan documented

---

**Deployment Date**: [Your Date]
**Version**: 1.0.0
**Last Updated**: January 2026
