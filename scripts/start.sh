#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until npx prisma migrate deploy; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Starting application..."
exec node dist/index.js 