#!/bin/bash
set -e

echo "🔄 Waiting for database to be ready..."
/wait-for-it.sh db:5432 --timeout=60 --strict -- echo "✅ Database is ready!"

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "✅ Starting application..."
exec "$@"
