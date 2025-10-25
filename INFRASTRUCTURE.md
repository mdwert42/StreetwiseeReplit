# Infrastructure & Deployment Guide

Complete guide for deploying Streetwise to GCP and managing infrastructure.

## Current Setup

**Platform**: Google Cloud Platform (GCP)
**Compute**: 1x f1-micro instance (free tier)
**Database**: Neon PostgreSQL (free tier)
**CI/CD**: GitHub Actions

## Architecture

```
┌─────────────────┐
│  GitHub Actions │  CI/CD Pipeline
│   (build/test)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GCP Compute    │  Node.js + Express
│   f1-micro      │  PORT: 5000
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Neon Database  │  PostgreSQL 15
│   (Serverless)  │  3GB storage
└─────────────────┘
```

## Quick Start

### 1. Database Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Neon database URL
vim .env

# Run migrations
npm run db:push
```

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

### 2. Local Development

```bash
# Install dependencies
npm install

# Start dev server (uses in-memory storage if no DATABASE_URL)
npm run dev

# Run tests
npm test

# Type check
npm run check
```

### 3. Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## GCP Deployment

### Initial Setup (One-Time)

#### 1. Create GCP Project

```bash
gcloud projects create streetwise-prod
gcloud config set project streetwise-prod
```

#### 2. Create Compute Instance

```bash
# Create f1-micro instance (free tier)
gcloud compute instances create streetwise-app \
  --machine-type=f1-micro \
  --zone=us-central1-a \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=10GB \
  --tags=http-server,https-server

# Allow HTTP/HTTPS traffic
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:443,tcp:5000 \
  --target-tags=http-server,https-server
```

#### 3. SSH into Instance

```bash
gcloud compute ssh streetwise-app --zone=us-central1-a
```

#### 4. Install Node.js on Instance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v20.x
npm --version
```

#### 5. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp /home/$(whoami)
```

#### 6. Clone Repository

```bash
cd ~
git clone https://github.com/mdwert42/StreetwiseeReplit.git
cd StreetwiseeReplit
```

#### 7. Configure Environment

```bash
# Create .env file
nano .env
```

Add:
```
DATABASE_URL=postgresql://user:pass@host/db
PORT=5000
NODE_ENV=production
```

#### 8. Install & Build

```bash
npm install --production
npm run build
```

#### 9. Start with PM2

```bash
pm2 start npm --name streetwise -- start
pm2 save
```

#### 10. Configure Nginx (Optional but Recommended)

```bash
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/streetwise
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/streetwise /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Automated Deployment (CI/CD)

#### 1. Create Service Account

```bash
gcloud iam service-accounts create github-deployer \
    --display-name="GitHub Actions Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding streetwise-prod \
    --member="serviceAccount:github-deployer@streetwise-prod.iam.gserviceaccount.com" \
    --role="roles/compute.instanceAdmin.v1"

# Create key
gcloud iam service-accounts keys create ~/github-sa-key.json \
    --iam-account=github-deployer@streetwise-prod.iam.gserviceaccount.com
```

#### 2. Add GitHub Secrets

In your GitHub repo settings, add these secrets:

```
DATABASE_URL         = postgresql://...
GCP_SA_KEY           = (contents of github-sa-key.json)
GCP_INSTANCE         = streetwise-app
GCP_ZONE             = us-central1-a
```

#### 3. Enable Deployment Workflow

Uncomment the deployment steps in `.github/workflows/deploy-gcp.yml`

#### 4. Deploy

Push to `main` branch or manually trigger via GitHub Actions.

## Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs streetwise

# Monitor resources
pm2 monit

# View status
pm2 status
```

### GCP Monitoring

```bash
# SSH to instance
gcloud compute ssh streetwise-app --zone=us-central1-a

# Check logs
pm2 logs

# Check system resources
htop
df -h
free -h
```

### Application Logs

Logs go to stdout/stderr and are captured by PM2:

```bash
pm2 logs streetwise --lines 100
```

## Scaling Considerations

### Current Limits (Free Tier)

- **Compute**: 1x f1-micro (0.6GB RAM, shared CPU)
- **Database**: Neon free tier (3GB, 0.5 CPU)
- **Concurrent users**: ~50-100
- **Requests/sec**: ~10-20

### When to Upgrade

Upgrade when:
- CPU constantly >80%
- Memory constantly >400MB
- Response times >500ms
- Database size >2.5GB
- Multiple orgs (white-label customers)

### Upgrade Path

#### Option 1: Bigger GCP Instance

```bash
# Stop instance
gcloud compute instances stop streetwise-app --zone=us-central1-a

# Change machine type
gcloud compute instances set-machine-type streetwise-app \
    --machine-type=e2-small \
    --zone=us-central1-a

# Start instance
gcloud compute instances start streetwise-app --zone=us-central1-a
```

Cost: ~$13/month for e2-small

#### Option 2: Cloud Run (Serverless)

Better for:
- Variable traffic
- Auto-scaling
- Zero maintenance

Cost: Pay per request (often cheaper for low traffic)

#### Option 3: Multiple Instances + Load Balancer

For high availability:

```bash
# Create instance group
gcloud compute instance-groups managed create streetwise-group \
    --base-instance-name=streetwise \
    --size=2 \
    --template=streetwise-template

# Add load balancer
gcloud compute forwarding-rules create streetwise-lb \
    --target-pool=streetwise-pool \
    --region=us-central1
```

Cost: ~$50/month (2x e2-small + load balancer)

### Database Scaling

#### Neon Upgrade Path

- **Free**: 3GB storage, 0.5 CPU
- **Launch ($19/mo)**: 10GB, 1 CPU, dedicated compute
- **Scale ($69/mo)**: 50GB, 2 CPU, autoscaling
- **Business ($700/mo)**: 500GB, 8 CPU, enterprise support

#### Alternative: Cloud SQL

```bash
gcloud sql instances create streetwise-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1
```

Cost: ~$7/month for db-f1-micro

## Backup Strategy

### Database Backups (Neon)

Automatic:
- Point-in-time recovery (7 days on free tier)
- No setup needed

Manual:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Application Backups

```bash
# On GCP instance
cd ~/StreetwiseeReplit
git pull  # Get latest code

# Backup old version
pm2 save --force
```

### Disaster Recovery

1. Database: Restore from Neon backup
2. Application: Redeploy from GitHub
3. RTO: ~15 minutes
4. RPO: ~5 minutes (last database write)

## Cost Breakdown

### Current (Free Tier)

| Resource | Cost | Limit |
|----------|------|-------|
| GCP f1-micro | $0 | 1 instance, 30% CPU |
| Neon database | $0 | 3GB storage |
| GitHub Actions | $0 | 2000 min/month |
| **Total** | **$0/month** | Good for <100 users |

### Paid (Small Scale)

| Resource | Cost | Specs |
|----------|------|-------|
| GCP e2-small | $13/mo | 2GB RAM, 2 vCPU |
| Neon Launch | $19/mo | 10GB, 1 dedicated CPU |
| GitHub Actions | $0 | Still free |
| **Total** | **$32/month** | Good for 500-1000 users |

### Paid (Medium Scale)

| Resource | Cost | Specs |
|----------|------|-------|
| GCP e2-medium x2 | $50/mo | 4GB RAM, 2 vCPU each |
| Cloud Load Balancer | $18/mo | HA, auto-scaling |
| Neon Scale | $69/mo | 50GB, 2 CPU |
| **Total** | **$137/month** | Good for 5000+ users |

## Security Checklist

- [ ] Use HTTPS (Let's Encrypt free SSL)
- [ ] Firewall rules (only expose 80, 443)
- [ ] DATABASE_URL in environment, not code
- [ ] Regular security updates (`sudo apt update && sudo apt upgrade`)
- [ ] SSH key authentication only (disable password)
- [ ] Non-root user for app
- [ ] PM2 with limited restart attempts
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured
- [ ] Database connection pooling

## SSL/HTTPS Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl status certbot.timer
```

Certificates auto-renew every 90 days.

## Troubleshooting

### App Won't Start

```bash
# Check PM2 logs
pm2 logs streetwise

# Check environment variables
cat ~/StreetwiseeReplit/.env

# Restart
pm2 restart streetwise
```

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL

# Check firewall
gcloud compute firewall-rules list

# Verify .env file
cat .env | grep DATABASE_URL
```

### Out of Memory

```bash
# Check usage
free -h

# Increase swap (temporary)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Upgrade instance (permanent)
gcloud compute instances set-machine-type ...
```

### Slow Performance

```bash
# Check CPU
top

# Check disk
df -h

# Check memory
free -h

# Check database
# Look for slow queries in Neon dashboard
```

## Next Steps

- [ ] Set up DATABASE_URL in .env
- [ ] Deploy to GCP instance
- [ ] Configure GitHub Actions secrets
- [ ] Enable automated deployments
- [ ] Set up monitoring/alerts
- [ ] Configure SSL certificate
- [ ] Test backup/restore process
- [ ] Document runbooks for common issues

## Resources

- [GCP Free Tier](https://cloud.google.com/free)
- [Neon Documentation](https://neon.tech/docs)
- [PM2 Guide](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
