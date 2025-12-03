.PHONY: help build dev clean
.PHONY: up down logs shell ps restart
.PHONY: release deploy rollback prod-logs prod-shell

# ========================================
# Configuration
# ========================================
IMAGE_NAME ?= community
IMAGE_TAG ?= latest
REGISTRY ?= docker.cnb.cool/hackathonweekly
FULL_IMAGE = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

HOST_PORT ?= 3000
PLATFORM ?= linux/amd64

# ========================================
# Help
# ========================================
help:
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "📦 HackathonWeekly Community - Docker 管理"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo ""
	@echo "🚀 开发命令"
	@echo "  make dev          启动开发服务器 (bun dev)"
	@echo "  make build        构建生产版本 (bun run build)"
	@echo "  make clean        清理构建缓存"
	@echo ""
	@echo "🐳 本地 Docker"
	@echo "  make up           构建并启动容器"
	@echo "  make down         停止并删除容器"
	@echo "  make logs         查看容器日志"
	@echo "  make shell        进入容器终端"
	@echo "  make restart      重启容器"
	@echo "  make ps           查看容器状态"
	@echo ""
	@echo "🎯 生产部署"
	@echo "  make release TAG=v1.2.0"
	@echo "                    构建并推送镜像到仓库"
	@echo ""
	@echo "  make deploy TAG=v1.2.0"
	@echo "                    拉取镜像并部署到生产环境"
	@echo ""
	@echo "  make rollback TAG=v1.1.9"
	@echo "                    回滚到指定版本（使用本地已有镜像）"
	@echo ""
	@echo "  make prod-logs    查看生产环境日志"
	@echo "  make prod-shell   进入生产容器终端"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "💡 提示: 部署时必须指定 TAG，例如 TAG=v1.2.0"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ========================================
# Development Commands
# ========================================
dev:
	bun dev

build:
	bun run build

clean:
	rm -rf .next node_modules/.cache

# ========================================
# Local Docker Commands
# ========================================
up:
	@echo "🔨 构建并启动本地容器..."
	@IMAGE=$(IMAGE_NAME):$(IMAGE_TAG) docker compose up -d --build
	@echo "✅ 容器已启动！访问 http://localhost:$(HOST_PORT)"

down:
	@docker compose down --remove-orphans
	@echo "✅ 容器已停止"

logs:
	@docker compose logs -f app

shell:
	@docker compose exec app sh

restart:
	@docker compose restart app
	@echo "✅ 容器已重启"

ps:
	@docker compose ps

# ========================================
# Production Deployment Commands
# ========================================
release:
	@if [ -z "$(TAG)" ] || [ "$(TAG)" = "latest" ]; then \
		echo "❌ 错误: 请指定版本号"; \
		echo "   示例: make release TAG=v1.2.0"; \
		exit 1; \
	fi
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🚀 发布版本: $(TAG)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "1️⃣  构建镜像..."
	@IMAGE=$(IMAGE_NAME):$(TAG) PLATFORM=$(PLATFORM) docker compose build app
	@echo ""
	@echo "2️⃣  打标签: $(REGISTRY)/$(IMAGE_NAME):$(TAG)"
	@docker tag $(IMAGE_NAME):$(TAG) $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo ""
	@echo "3️⃣  推送到仓库..."
	@docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "✅ 发布成功: $(REGISTRY)/$(IMAGE_NAME):$(TAG)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

deploy:
	@if [ -z "$(TAG)" ] || [ "$(TAG)" = "latest" ]; then \
		echo "❌ 错误: 请指定版本号"; \
		echo "   示例: make deploy TAG=v1.2.0"; \
		exit 1; \
	fi
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "🚀 部署版本: $(TAG)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@IMAGE=$(REGISTRY)/$(IMAGE_NAME):$(TAG) \
		docker compose -f docker-compose.prod.yml up -d --remove-orphans
	@echo ""
	@echo "✅ 部署成功！访问 http://localhost:$(HOST_PORT)"

rollback:
	@if [ -z "$(TAG)" ] || [ "$(TAG)" = "latest" ]; then \
		echo "❌ 错误: 请指定回滚版本号"; \
		echo "   示例: make rollback TAG=v1.1.9"; \
		exit 1; \
	fi
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "⏪ 回滚到版本: $(TAG)"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@IMAGE=$(REGISTRY)/$(IMAGE_NAME):$(TAG) \
		docker compose -f docker-compose.prod.yml up -d --remove-orphans
	@echo ""
	@echo "✅ 回滚成功！"

prod-logs:
	@docker compose -f docker-compose.prod.yml logs -f app

prod-shell:
	@docker compose -f docker-compose.prod.yml exec app sh
