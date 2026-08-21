# ==============================================================================
# CodeSync - Python 3.12 Sandboxed Runner Image
# ==============================================================================
FROM python:3.12-slim

# Prevent interactive prompts and configure python environment
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Create non-root user and sandbox workspace
RUN groupadd -g 10001 sandbox && \
    useradd -u 10001 -g sandbox -m -s /bin/bash sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox:sandbox

# Default command
CMD ["python3", "main.py"]
