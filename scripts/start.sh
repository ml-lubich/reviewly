#!/bin/sh
set -e

# Validate required environment variables
REQUIRED_VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY"

for var in $REQUIRED_VARS; do
  eval val=\$$var
  if [ -z "$val" ]; then
    echo "ERROR: Required environment variable $var is not set"
    exit 1
  fi
done

echo "Starting Reviewly..."
echo "  Environment: ${NODE_ENV:-production}"
echo "  Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL}"

# Graceful shutdown
trap 'echo "Shutting down..."; kill -TERM $PID; wait $PID' SIGTERM SIGINT

node server.js &
PID=$!
wait $PID
