# Deployment Instructions for GCP

Quick guide to deploy Streetwise to your GCP compute instance.

## Current Status

You're SSH'd into your GCP instance with the repo already cloned. This guide will help you build and run the app.

## Quick Deploy (Recommended)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment script
./scripts/deploy.sh

# Check deployment status
./scripts/check-deploy.sh
```

That's it! The deploy script handles everything.

## Manual Deploy (Step by Step)

If you prefer to run commands manually:

### 1. Pull Latest Code

```bash
cd ~/StreetwiseeReplit
git pull origin claude/incomplete-description-011CUT6cVMvg8bczHR7XaUQY
```

### 2. Set Up Environment

```bash
# Copy template
cp .env.example .env

# Edit with your database URL
nano .env
```

Add:
```
DATABASE_URL=postgresql://your-neon-connection-string
PORT=5000
NODE_ENV=production
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run db:push
```

This creates all tables in your PostgreSQL database.

### 5. Build the App

```bash
npm run build
```

This creates:
- `dist/public/` - Client files (React app)
- `dist/index.js` - Server bundle

### 6. Verify Build

```bash
ls -lh dist/
ls -lh dist/public/
```

You should see:
```
dist/
  index.js       <- ~500KB server bundle
  public/
    index.html   <- Entry point
    assets/      <- JS/CSS bundles
```

### 7. Start the Server

**Option A: With PM2 (Recommended)**
```bash
# Install PM2 if not already installed
sudo npm install -g pm2

# Start the app
pm2 start npm --name streetwise -- start

# Save PM2 config
pm2 save

# Set up auto-start on reboot
pm2 startup
# Then run the command it outputs
```

**Option B: Direct with Node**
```bash
NODE_ENV=production node dist/index.js
```

**Option C: With npm**
```bash
npm start
```

## Checking Status

### Quick Check

```bash
./scripts/check-deploy.sh
```

### Manual Checks

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs streetwise

# Monitor resources
pm2 monit

# Check if server is running
curl http://localhost:5000
```

## Troubleshooting

### "Could not find the build directory" Error

**Problem**: Server can't find `dist/public/`

**Solution**:
```bash
# Rebuild
npm run build

# Verify files exist
ls -la dist/public/

# Restart
pm2 restart streetwise
```

### Build Fails

**Problem**: `npm run build` errors out

**Solution**:
```bash
# Check for detailed errors
npm run build 2>&1 | tee build.log

# Common issues:
# 1. Out of memory - upgrade instance or add swap
# 2. Missing dependencies - run npm install again
# 3. TypeScript errors - check npm run check
```

### PM2 Process Crashes

**Problem**: `pm2 status` shows "errored" or "stopped"

**Solution**:
```bash
# View error logs
pm2 logs streetwise --err --lines 50

# Common issues:
# 1. Missing .env - create it with DATABASE_URL
# 2. Port already in use - change PORT in .env
# 3. Database connection - check DATABASE_URL is correct

# Try starting manually to see full errors
NODE_ENV=production node dist/index.js
```

### Database Connection Issues

**Problem**: "DATABASE_URL is required" or connection errors

**Solution**:
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection directly
psql "$DATABASE_URL"

# If using in-memory storage (no database)
# Just remove or comment out DATABASE_URL in .env
```

### Out of Memory During Build

**Problem**: Build process killed or hangs

**Solution**:
```bash
# Add temporary swap space
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Try build again
npm run build

# Remove swap after (optional)
sudo swapoff /swapfile
sudo rm /swapfile
```

## Updating the App

When you want to deploy new changes:

```bash
# Quick update
./scripts/deploy.sh

# Or manually
cd ~/StreetwiseeReplit
git pull
npm install
npm run build
pm2 restart streetwise
```

## Stopping the App

```bash
# With PM2
pm2 stop streetwise

# Or delete from PM2 entirely
pm2 delete streetwise
```

## Port Configuration

The app runs on port 5000 by default. Access it:

**Locally on the server:**
```bash
curl http://localhost:5000
```

**From your browser:**
```
http://YOUR_GCP_INSTANCE_IP:5000
```

**With Nginx reverse proxy** (see INFRASTRUCTURE.md):
```
http://your-domain.com
```

## Next Steps

1. ✅ Deploy the app using the script above
2. ⬜ Set up Nginx reverse proxy (optional, for custom domain)
3. ⬜ Configure SSL with Let's Encrypt (for HTTPS)
4. ⬜ Set up monitoring/alerts
5. ⬜ Configure automated backups

See [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) for detailed production setup.

## Quick Reference

```bash
# Deploy everything
./scripts/deploy.sh

# Check status
./scripts/check-deploy.sh
pm2 status
pm2 logs streetwise

# Restart app
pm2 restart streetwise

# Update app
git pull && npm install && npm run build && pm2 restart streetwise

# View logs
pm2 logs streetwise --lines 100

# Monitor
pm2 monit
```

## Need Help?

1. Run `./scripts/check-deploy.sh` and share output
2. Check `pm2 logs streetwise` for errors
3. Verify `.env` file exists with DATABASE_URL
4. Make sure build completed: `ls -la dist/public/`
