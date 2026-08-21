.PHONY: help dev build up down logs restart clean test test-api ps

# Default Target
help:
	@echo "======================================================================"
	@echo "                      CodeSync Orchestration                          "
	@echo "======================================================================"
	@echo "Available commands:"
	@echo "  make up          - Build and start all services in detached mode"
	@echo "  make build       - Build all Docker service and runner images"
	@echo "  make down        - Stop and remove all containers and networks"
	@echo "  make logs        - Tail logs from all containers"
	@echo "  make restart     - Restart all services"
	@echo "  make ps          - View status of all CodeSync containers"
	@echo "  make test        - Run backend test suite"
	@echo "  make clean       - Remove dangling images, volumes, and caches"
	@echo "======================================================================"

# Start all services with local builds
up:
	docker compose up --build -d

# Start in foreground
dev:
	docker compose up --build

# Build images only
build:
	docker compose build

# Stop containers
down:
	docker compose down --remove-orphans

# View logs
logs:
	docker compose logs -f

# Check container status
ps:
	docker compose ps

# Restart services
restart:
	docker compose restart

# Run validation and API tests
test:
	docker compose exec -T api pytest -v tests/

test-api:
	cd api && pytest -v tests/

# Clean up docker resources
clean:
	docker compose down -v --remove-orphans
	docker system prune -f
