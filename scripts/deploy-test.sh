#!/bin/bash

# 测试环境部署脚本
# 使用方法: ./scripts/deploy-test.sh [version_tag]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="community"
TEST_DOMAIN="test.your-domain.com"  # 修改为你的测试域名
REGISTRY="cnb.cool"
REPO_NAME="${REPO_SLUG_LOWERCASE:-your-community-app}"
TEST_SERVER_USER="${TEST_SERVER_USER}"
TEST_SERVER_HOST="${TEST_SERVER_HOST}"

# 函数：打印带颜色的消息
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必需的环境变量
check_env() {
    local required_vars=(
        "TEST_SERVER_USER"
        "TEST_SERVER_HOST"
        "REPO_SLUG_LOWERCASE"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "Environment variable $var is required"
            exit 1
        fi
    done
}

# 备份当前测试环境
backup_test_env() {
    log_info "Creating backup of current test environment..."

    ssh -o StrictHostKeyChecking=no "${TEST_SERVER_USER}@${TEST_SERVER_HOST}" << EOF
        cd /opt/${PROJECT_NAME}-test

        # 创建备份目录
        BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "\$BACKUP_DIR"

        # 备份数据库
        if docker-compose -f docker-compose.test.yml ps postgres-test | grep -q "Up"; then
            log_info "Backing up database..."
            docker-compose -f docker-compose.test.yml exec postgres-test pg_dump -U "\${TEST_POSTGRES_USER}" "\${TEST_POSTGRES_DB}" > "\$BACKUP_DIR/database.sql"
        fi

        # 备份配置文件
        cp docker-compose.test.yml "\$BACKUP_DIR/"
        cp .env.test "\$BACKUP_DIR/"

        # 备份 Redis 数据
        if docker-compose -f docker-compose.test.yml ps redis-test | grep -q "Up"; then
            docker-compose -f docker-compose.test.yml exec redis-test redis-cli BGSAVE
            cp redis-test-data/dump.rdb "\$BACKUP_DIR/" 2>/dev/null || true
        fi

        log_success "Backup created: \$BACKUP_DIR"
EOF
}

# 部署到测试环境
deploy_to_test() {
    local version_tag=${1:-"test-latest"}

    log_info "Deploying version ${version_tag} to test environment..."

    ssh -o StrictHostKeyChecking=no "${TEST_SERVER_USER}@${TEST_SERVER_HOST}" << EOF
        set -e

        cd /opt/${PROJECT_NAME}-test

        # 登录到镜像仓库
        echo "${CNB_TRIGGER_TOKEN}" | docker login ${REGISTRY} -u "${CNB_TRIGGER_USER}" --password-stdin

        # 拉取新镜像
        log_info "Pulling image ${REGISTRY}/${REPO_NAME}:${version_tag}..."
        docker pull ${REGISTRY}/${REPO_NAME}:${version_tag}

        # 停止现有服务
        log_info "Stopping current services..."
        docker-compose -f docker-compose.test.yml down

        # 更新镜像标签
        if grep -q "image: ${REGISTRY}/${REPO_NAME}:" docker-compose.test.yml; then
            sed -i "s|image: ${REGISTRY}/${REPO_NAME}:.*|image: ${REGISTRY}/${REPO_NAME}:${version_tag}|g" docker-compose.test.yml
        else
            log_error "Image not found in docker-compose.test.yml"
            exit 1
        fi

        # 更新环境变量
        if [[ -f .env.test ]]; then
            sed -i "s|TEST_VERSION_TAG=.*|TEST_VERSION_TAG=${version_tag}|g" .env.test
        fi

        # 启动新服务
        log_info "Starting new services..."
        export REPO_SLUG_LOWERCASE="${REPO_NAME}"
        export TEST_VERSION_TAG="${version_tag}"
        docker-compose -f docker-compose.test.yml up -d

        # 等待服务启动
        log_info "Waiting for services to start..."
        sleep 30

        # 健康检查
        log_info "Performing health checks..."
        for i in {1..10}; do
            if curl -f http://localhost/api/health >/dev/null 2>&1; then
                log_success "Health check passed!"
                break
            else
                log_warning "Health check attempt \$i failed, retrying in 10s..."
                sleep 10
            fi

            if [[ \$i -eq 10 ]]; then
                log_error "Health check failed after 10 attempts"

                # 回滚
                log_info "Rolling back..."
                docker-compose -f docker-compose.test.yml down
                # 这里可以添加回滚到上一版本的逻辑
                exit 1
            fi
        done

        # 显示服务状态
        log_info "Service status:"
        docker-compose -f docker-compose.test.yml ps

        log_success "Deployment completed successfully!"
EOF
}

# 运行部署后测试
run_post_deploy_tests() {
    log_info "Running post-deployment tests..."

    # 基础健康检查
    if curl -f "https://${TEST_DOMAIN}/api/health" >/dev/null 2>&1; then
        log_success "✅ Health check passed"
    else
        log_error "❌ Health check failed"
        return 1
    fi

    # 检查关键页面
    local pages=("/" "/login" "/api/docs")
    for page in "${pages[@]}"; do
        if curl -f "https://${TEST_DOMAIN}${page}" >/dev/null 2>&1; then
            log_success "✅ Page ${page} accessible"
        else
            log_warning "⚠️ Page ${page} not accessible"
        fi
    done

    # 检查 API 响应
    if curl -s "https://${TEST_DOMAIN}/api/health" | grep -q "ok"; then
        log_success "✅ API responding correctly"
    else
        log_warning "⚠️ API response unexpected"
    fi

    log_success "Post-deployment tests completed"
}

# 发送通知
send_notification() {
    local status=${1}
    local version_tag=${2}

    if [[ -n "${NOTIFICATION_WEBHOOK_URL}" ]]; then
        local message="🚀 测试环境部署${status}\n域名: https://${TEST_DOMAIN}\n版本: ${version_tag}\n时间: $(date)"

        curl -X POST "${NOTIFICATION_WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"msgtype\": \"text\",
                \"text\": {
                    \"content\": \"${message}\"
                }
            }" >/dev/null 2>&1 || true
    fi
}

# 主函数
main() {
    local version_tag=${1:-"test-latest"}

    log_info "Starting deployment to test environment..."
    log_info "Version: ${version_tag}"
    log_info "Domain: https://${TEST_DOMAIN}"

    # 检查环境
    check_env

    # 备份当前环境
    backup_test_env

    # 部署
    if deploy_to_test "${version_tag}"; then
        # 运行测试
        if run_post_deploy_tests; then
            log_success "🎉 Deployment to test environment completed successfully!"
            send_notification "成功 ✅" "${version_tag}"

            log_info "Test environment is available at: https://${TEST_DOMAIN}"
            log_info "You can now test features like WeChat login with the test domain."
        else
            log_error "Post-deployment tests failed"
            send_notification "测试失败 ❌" "${version_tag}"
            exit 1
        fi
    else
        log_error "Deployment failed"
        send_notification "部署失败 ❌" "${version_tag}"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
Usage: $0 [VERSION_TAG]

Deploy the application to test environment.

Arguments:
  VERSION_TAG    Docker image tag to deploy (default: test-latest)

Environment Variables:
  TEST_SERVER_USER    SSH user for test server
  TEST_SERVER_HOST    Test server host
  REPO_SLUG_LOWERCASE Repository name in lowercase
  CNB_TRIGGER_USER    Container registry username
  CNB_TRIGGER_TOKEN   Container registry token
  NOTIFICATION_WEBHOOK_URL Optional webhook for notifications

Examples:
  $0                          # Deploy test-latest version
  $0 v1.2.3                   # Deploy specific version
  $0 test-abc123              # Deploy test version

Requirements:
  - SSH access to test server
  - Docker and docker-compose installed on test server
  - Proper SSL certificates for test domain
EOF
}

# 脚本入口
if [[ "${1}" == "-h" || "${1}" == "--help" ]]; then
    show_help
    exit 0
fi

main "$@"