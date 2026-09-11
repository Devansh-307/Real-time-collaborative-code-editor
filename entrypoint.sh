#!/bin/sh
set -e

# Default PORT to 10000 if not provided by cloud environment
export PORT=${PORT:-10000}

echo "=================================================="
echo " Starting CodeSync Unified Container"
echo " Public Port: ${PORT}"
echo "=================================================="

# 1. Substitute PORT into Nginx config (only replaces ${PORT})
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# 2. Start Node.js Yjs Collaboration Server on port 1234 in background
echo "Starting Node.js Yjs collaboration server on 127.0.0.1:1234..."
PORT=1234 HOST=127.0.0.1 node /app/collab-server/server.js &

# 3. Start Python FastAPI API on port 8000 in background
echo "Starting FastAPI backend on 127.0.0.1:8000..."
cd /app/api && uvicorn app.main:app --host 127.0.0.1 --port 8000 &

# Wait briefly for internal services to bind
sleep 2

# 4. Start Nginx in foreground on public PORT
echo "Starting Nginx Gateway on port ${PORT}..."
exec nginx -g 'daemon off;'
