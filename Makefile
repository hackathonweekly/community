.PHONY: help build docker-build docker-build-fast docker-build-arm docker-push docker-push-tencent docker-run docker-run-arm docker-stop docker-logs docker-shell docker-debug dev clean

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev                - Start development server"
	@echo "  make build              - Build Next.js application"
	@echo "  make clean              - Clean build artifacts"
	@echo ""
	@echo "Docker Build:"
	@echo "  make docker-build       - Build Docker image (traditional, slower)"
	@echo "  make docker-build-fast  - Build locally then package with Docker (faster)"
	@echo "  make docker-build-arm   - Build ARM64 image for local Mac testing"
	@echo ""
	@echo "Docker Deploy:"
	@echo "  make docker-run         - Run Docker container locally (amd64, for production test)"
	@echo "  make docker-run-arm     - Run Docker container locally (arm64, native Mac)"
	@echo "  make docker-stop        - Stop and remove Docker container"
	@echo "  make docker-logs        - View Docker container logs"
	@echo "  make docker-shell       - Enter running container shell"
	@echo "  make docker-debug       - Run container in debug mode (interactive shell)"
	@echo "  make docker-push-tencent VERSION=v1.0.0 - Push to Tencent registry (after docker-build-fast)"
	@echo "  make docker-push VERSION=v1.0.0 REGISTRY=xxx - Push to custom registry"

# Build Next.js application
build:
	bun run build

# Traditional Docker build (build inside Docker)
docker-build:
	./docker-build.sh latest --local-only

# Fast Docker build (use local build artifacts)
docker-build-fast: # run `bun run build` first
	./docker-build.sh latest --use-local-build --local-only

# Build ARM64 image for local Mac testing
docker-build-arm: # run `bun run build` first
	docker build --platform linux/arm64 \
		-f Dockerfile.local-build \
		-t community:latest-arm \
		.

# Build and push to custom registry (requires version argument)
# Usage: make docker-push VERSION=v1.0.0 REGISTRY=tencent
docker-push:
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Usage: make docker-push VERSION=v1.0.0 REGISTRY=xxx"; \
		exit 1; \
	fi
	bun run build && ./docker-build.sh $(VERSION) $(REGISTRY) --use-local-build

# Push to Tencent Cloud registry (use after docker-build-fast)
# Usage: make docker-push-tencent VERSION=v1.0.0
docker-push-tencent:
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Usage: make docker-push-tencent VERSION=v1.0.0"; \
		exit 1; \
	fi
	@echo "Tagging image for Tencent Cloud..."
	docker tag community:latest ccr.ccs.tencentyun.com/hackathonweekly/community:$(VERSION)
	docker tag community:latest ccr.ccs.tencentyun.com/hackathonweekly/community:latest
	@echo "Pushing to Tencent Cloud..."
	docker push ccr.ccs.tencentyun.com/hackathonweekly/community:$(VERSION)
	docker push ccr.ccs.tencentyun.com/hackathonweekly/community:latest
	@echo "Done! Images pushed to Tencent Cloud registry."

# Run Docker container locally (amd64, simulates production)
docker-run:
	@docker stop community 2>/dev/null || true
	@docker rm community 2>/dev/null || true
	docker run -d \
		--name community \
		-p 3000:3000 \
		--env-file .env.local \
		community:latest
	@echo "Container started (amd64 platform)! Access at http://localhost:3000"
	@echo "View logs: make docker-logs"

# Run Docker container locally (arm64, native Mac performance)
docker-run-arm:
	@docker stop community 2>/dev/null || true
	@docker rm community 2>/dev/null || true
	docker run -d \
		--name community \
		-p 3000:3000 \
		--env-file .env.local \
		community:latest-arm
	@echo "Container started (arm64 native)! Access at http://localhost:3000"
	@echo "View logs: make docker-logs"

# Stop and remove Docker container
docker-stop:
	@docker stop community 2>/dev/null || true
	@docker rm community 2>/dev/null || true
	@echo "Container stopped and removed."

# View Docker container logs
docker-logs:
	docker logs -f community

# Enter running container shell
docker-shell:
	@if ! docker ps --format '{{.Names}}' | grep -q '^community$$'; then \
		echo "Error: Container 'community' is not running."; \
		echo "Start it with: make docker-run or make docker-run-arm"; \
		exit 1; \
	fi
	docker exec -it community sh

# Run container in debug mode (interactive shell, no app start)
docker-debug:
	docker run --rm -it \
		--env-file .env.local \
		--entrypoint sh \
		community:latest

docker-debug-arm:
	docker run --rm -it \
		--env-file .env.local \
		--entrypoint sh \
		community:latest-arm

# Start development server
dev:
	bun dev

# Clean build artifacts
clean:
	rm -rf .next
	rm -rf node_modules/.cache
