# ==============================================================================
# CodeSync - OpenJDK 21 Sandboxed Runner Image
# ==============================================================================
FROM eclipse-temurin:21-jdk-jammy

# Set environment
ENV DEBIAN_FRONTEND=noninteractive

# Create non-root user and sandbox workspace
RUN groupadd -g 10001 sandbox && \
    useradd -u 10001 -g sandbox -m -s /bin/bash sandbox && \
    mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

WORKDIR /workspace
USER sandbox:sandbox

# Default command
CMD ["sh", "-c", "javac Main.java && java Main"]
