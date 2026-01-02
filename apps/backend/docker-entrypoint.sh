#!/bin/sh
set -e

echo "🔄 KirimChat Backend - Starting..."
echo "=================================="

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Check if database already has tables (existing deployment)
echo "🔍 Checking database status..."
TABLE_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tail -n 1 | tr -d ' ' || echo "0")

if [ "$TABLE_COUNT" -gt "0" ]; then
  echo "✅ Database already initialized with $TABLE_COUNT tables"
  echo "⚠️  Skipping schema push to preserve existing data"
  echo "💡 If you need to update schema, run: docker compose exec backend npx prisma db push"
else
  echo "🔄 First-time setup: Creating database schema..."
  if npx prisma db push --accept-data-loss --skip-generate; then
    echo "✅ Database schema created successfully!"
  else
    echo "❌ Failed to setup database schema"
    exit 1
  fi
fi

# Start the application
echo "🚀 Starting backend server..."
echo "=================================="
exec node dist/index.js