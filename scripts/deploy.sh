#!/bin/bash
set -e  # Exit on error

echo "🚀 Deploying Streetwise..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="$HOME/StreetwiseeReplit"
BRANCH="${1:-claude/incomplete-description-011CUT6cVMvg8bczHR7XaUQY}"

echo -e "${BLUE}1. Checking directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
  echo -e "${RED}Error: $APP_DIR does not exist${NC}"
  exit 1
fi

cd "$APP_DIR"

echo -e "${BLUE}2. Pulling latest code from $BRANCH...${NC}"
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo -e "${BLUE}3. Checking for .env file...${NC}"
if [ ! -f .env ]; then
  echo -e "${RED}Warning: .env file not found${NC}"
  echo "Create .env file with:"
  echo "  DATABASE_URL=postgresql://..."
  echo "  PORT=5000"
  echo "  NODE_ENV=production"
  echo ""
  read -p "Continue without .env? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${BLUE}4. Installing dependencies...${NC}"
npm install --production=false

echo -e "${BLUE}5. Running database migrations...${NC}"
if [ -n "$DATABASE_URL" ] || grep -q "DATABASE_URL" .env 2>/dev/null; then
  npm run db:push || echo -e "${RED}Warning: Database migration failed${NC}"
else
  echo "Skipping migrations (no DATABASE_URL found)"
fi

echo -e "${BLUE}6. Building application...${NC}"
# Clean old build
rm -rf dist/

# Build client and server
npm run build

# Verify build output
if [ ! -d "dist/public" ]; then
  echo -e "${RED}Error: Client build failed - dist/public/ not found${NC}"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo -e "${RED}Error: Server build failed - dist/index.js not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build successful!${NC}"
echo "  Client: $(du -sh dist/public | cut -f1)"
echo "  Server: $(du -sh dist/index.js | cut -f1)"

echo -e "${BLUE}7. Checking for PM2...${NC}"
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}8. Restarting with PM2...${NC}"

  # Check if already running
  if pm2 describe streetwise &> /dev/null; then
    echo "Restarting existing PM2 process..."
    pm2 restart streetwise
  else
    echo "Starting new PM2 process..."
    pm2 start npm --name streetwise -- start
  fi

  pm2 save

  echo -e "${GREEN}✓ Deployment complete!${NC}"
  echo ""
  echo "View logs: pm2 logs streetwise"
  echo "Monitor:   pm2 monit"
  echo "Status:    pm2 status"
else
  echo -e "${BLUE}8. PM2 not found, starting with node...${NC}"
  echo ""
  echo "To start the server manually:"
  echo "  NODE_ENV=production node dist/index.js"
  echo ""
  echo "Or install PM2 for process management:"
  echo "  sudo npm install -g pm2"
  echo "  pm2 start npm --name streetwise -- start"
  echo "  pm2 save"
  echo "  pm2 startup"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
