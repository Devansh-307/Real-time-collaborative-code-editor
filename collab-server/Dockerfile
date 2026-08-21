FROM node:22-alpine

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy server code
COPY server.js ./

# Create non-root user
USER node

EXPOSE 1234

ENV NODE_ENV=production \
    PORT=1234 \
    HOST=0.0.0.0

CMD ["node", "server.js"]
