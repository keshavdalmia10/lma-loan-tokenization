#!/bin/sh
set -eu

# BusyBox/Alpine sh may not support pipefail; enable if available
if (set -o pipefail) 2>/dev/null; then
  set -o pipefail
fi

# Enable error handling and strict mode
trap 'echo "Error on line $LINENO"' ERR

echo "Starting LMA Loan Tokenization server..."

# Ensure logs directory exists and is writable
if mkdir -p /app/logs 2>/dev/null; then
  echo "✓ Logs directory is ready at /app/logs"
else
  echo "⚠ Warning: Could not create /app/logs directory"
fi

# Verify logs directory is writable
if [ -w /app/logs ]; then
  echo "✓ Logs directory is writable"
else
  echo "⚠ Warning: /app/logs directory is not writable. Logs may not be persisted."
fi

# Check if DATABASE_URL is configured
if [ -z "${DATABASE_URL:-}" ]; then
  echo "⚠ Warning: DATABASE_URL environment variable is not set"
  echo "   This will cause database operations to fail at runtime"
else
  echo "✓ DATABASE_URL is configured"
fi

# Run Prisma migrations before starting server
echo "Preparing database..."
if [ -n "${DATABASE_URL:-}" ]; then
  if ! npx prisma migrate deploy --skip-generate; then
    echo "⚠ Warning: Failed to run migrations"
    echo "   This may be expected if database is already up to date"
  else
    echo "✓ Database migrations applied successfully"
  fi
else
  echo "⚠ Warning: Skipping migrations - DATABASE_URL not configured"
fi

# Verify NODE_ENV is set
if [ -z "${NODE_ENV:-}" ]; then
  echo "⚠ Warning: NODE_ENV is not set, defaulting to production"
  export NODE_ENV=production
else
  echo "✓ NODE_ENV=$NODE_ENV"
fi

# Verify server.js exists
if [ ! -f "/app/server.js" ]; then
  echo "✗ Error: server.js not found at /app/server.js"
  echo "Available files:"
  ls -la /app/ | head -20
  exit 1
fi

echo "✓ Starting application server..."
echo ""

# Start the application (exec replaces this process with the app)
exec node server.js
