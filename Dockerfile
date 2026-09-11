# ==============================================================================
# CodeSync - Unified Production Container (Render / Cloud Deployment)
# Multi-stage build running React SPA, Node.js Yjs, and FastAPI behind Nginx
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React Client SPA
# ------------------------------------------------------------------------------
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Install Node Dependencies for Collaboration Server
# ------------------------------------------------------------------------------
FROM node:22-alpine AS collab-builder
WORKDIR /app/collab-server
COPY collab-server/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# ------------------------------------------------------------------------------
# Stage 3: Final Production Container
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm

# Install system dependencies: Nginx, Node.js, gettext (envsubst), curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    curl \
    gettext-base \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Python FastAPI API
COPY api/requirements.txt ./api/
RUN pip install --no-cache-dir -r ./api/requirements.txt
COPY api/ ./api/

# 2. Node.js Collaboration Server
COPY collab-server/ ./collab-server/
COPY --from=collab-builder /app/collab-server/node_modules ./collab-server/node_modules

# 3. Built React Frontend Static Assets
COPY --from=client-builder /app/client/dist ./client/dist

# 4. Nginx Configuration & Runner Script
COPY nginx.render.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT=10000 \
    PYTHONUNBUFFERED=1

EXPOSE 10000 8080

CMD ["/app/entrypoint.sh"]
