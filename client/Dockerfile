FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy source code
COPY . .

# Environment variables & build args for client
ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_COLLAB_WS_URL=ws://localhost:8080/collaboration

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_COLLAB_WS_URL=$VITE_COLLAB_WS_URL \
    NODE_ENV=development

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
