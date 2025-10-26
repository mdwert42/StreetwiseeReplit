#!/bin/bash
# Diagnostic script to check deployment status

echo "🔍 Checking Streetwise deployment status..."
echo ""

# Check Node version
echo "Node.js version:"
node --version || echo "❌ Node.js not installed"
echo ""

# Check npm version
echo "npm version:"
npm --version || echo "❌ npm not installed"
echo ""

# Check if in correct directory
echo "Current directory:"
pwd
echo ""

# Check for .env
echo ".env file:"
if [ -f .env ]; then
  echo "✓ .env exists"
  echo "DATABASE_URL set: $(grep -q DATABASE_URL .env && echo "Yes" || echo "No")"
else
  echo "❌ .env file not found"
fi
echo ""

# Check build output
echo "Build artifacts:"
if [ -d dist ]; then
  echo "✓ dist/ directory exists"
  if [ -f dist/index.js ]; then
    echo "  ✓ dist/index.js ($(du -sh dist/index.js | cut -f1))"
  else
    echo "  ❌ dist/index.js missing"
  fi

  if [ -d dist/public ]; then
    echo "  ✓ dist/public/ ($(du -sh dist/public | cut -f1))"
    echo "    Files: $(find dist/public -type f | wc -l)"
  else
    echo "  ❌ dist/public/ missing"
  fi
else
  echo "❌ dist/ directory not found - build not run"
fi
echo ""

# Check PM2
echo "PM2 status:"
if command -v pm2 &> /dev/null; then
  echo "✓ PM2 installed ($(pm2 --version))"
  if pm2 describe streetwise &> /dev/null; then
    echo "  ✓ 'streetwise' process exists"
    pm2 describe streetwise | grep -E "status|uptime|restarts|memory"
  else
    echo "  ⚠ 'streetwise' process not running"
    echo "  Available processes:"
    pm2 list
  fi
else
  echo "⚠ PM2 not installed"
  echo "Install with: sudo npm install -g pm2"
fi
echo ""

# Check if server is responding
echo "Server health check:"
if command -v curl &> /dev/null; then
  PORT="${PORT:-5000}"
  if curl -s http://localhost:$PORT > /dev/null; then
    echo "✓ Server responding on port $PORT"
  else
    echo "❌ Server not responding on port $PORT"
  fi
else
  echo "⚠ curl not installed, skipping health check"
fi
echo ""

# Check logs if PM2 is available
if command -v pm2 &> /dev/null && pm2 describe streetwise &> /dev/null; then
  echo "Recent logs (last 10 lines):"
  echo "---"
  pm2 logs streetwise --lines 10 --nostream
fi
