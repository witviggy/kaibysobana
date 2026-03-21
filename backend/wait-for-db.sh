#!/bin/sh
# Wait for database to be ready

DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

echo "Waiting for database at $DB_HOST:$DB_PORT..."

for i in $(seq 1 30); do
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    echo "✅ Database is ready!"
    exec npm start
  fi
  echo "Attempt $i/30: Database not ready, retrying in 2s..."
  sleep 2
done

echo "❌ Database failed to start in time"
exit 1
