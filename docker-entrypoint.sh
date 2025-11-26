#!/bin/sh
set -e

# Construct DATABASE_URL from individual components if not already set
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public"
fi

# Run Prisma migrations in production
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
fi

# Execute the main command
exec "$@"
