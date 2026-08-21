@echo off
echo Building Collab Code Editor Runner Docker Image...
docker build -t collab-runner:latest -f Dockerfile.runner .
if %ERRORLEVEL% equ 0 (
    echo collab-runner:latest built successfully!
) else (
    echo Failed to build Docker image.
)
