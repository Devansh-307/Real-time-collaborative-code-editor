#!/usr/bin/env bash
set -e

echo "Building Collab Code Editor Runner Docker Image..."
docker build -t collab-runner:latest -f Dockerfile.runner .
echo "collab-runner:latest built successfully!"
