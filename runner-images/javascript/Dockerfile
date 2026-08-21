# ==============================================================================
# CodeSync - Node.js 22 Sandboxed Runner Image
# ==============================================================================
FROM node:22-slim

# Set environment
ENV NODE_ENV=production

# Create non-root user and sandbox workspace
RUN groupadd -g 10001 sandbox && \
    useradd -u 10001 -g sandbox -m -s /bin/bash sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox:sandbox

# Default command
CMD ["node", "main.js"]
