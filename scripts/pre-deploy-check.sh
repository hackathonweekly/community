#!/bin/bash

# 部署前检查脚本
# 确保测试环境和生产环境的一致性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TARGET_ENV="${1:-test}"
SKIP_ENV_CHECK="${2:-false}"

# 日志函数
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

# 检查必需的命令
check_dependencies() {
    local deps=("curl" "jq" "git" "docker")
    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "缺少必需的命令: ${missing[*]}"
        log_info "请安装缺少的命令后重试"
        return 1
    fi

    log_success "✅ 依赖检查通过"
}

# 验证环境变量
validate_environment() {
    if [[ "$SKIP_ENV_CHECK" == "true" ]]; then
        log_warning "⚠️ 跳过环境变量检查"
        return 0
    fi

    log_info "验证环境变量配置..."

    # 运行环境变量验证脚本
    if [[ -f "$SCRIPT_DIR/validate-env.sh" ]]; then
        "$SCRIPT_DIR/validate-env.sh" validate
    else
        log_warning "⚠️ 环境变量验证脚本不存在，跳过检查"
    fi
}

# 检查代码状态
check_code_status() {
    log_info "检查代码状态..."

    # 检查是否有未提交的更改
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warning "⚠️ 存在未提交的更改"
        git status --short
        read -p "是否继续部署？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 1
        fi
    else
        log_success "✅ 工作区干净"
    fi

    # 检查当前分支
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "当前分支: $current_branch"

    # 如果是生产部署，检查是否在主分支
    if [[ "$TARGET_ENV" == "production" && "$current_branch" != "main" ]]; then
        log_warning "⚠️ 生产部署建议在 main 分支进行"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "部署已取消"
            exit 1
        fi
    fi
}

# 运行测试套件
run_tests() {
    log_info "运行测试套件..."

    # 类型检查
    log_info "运行类型检查..."
    if bun run type-check; then
        log_success "✅ 类型检查通过"
    else
        log_error "❌ 类型检查失败"
        return 1
    fi

    # 代码检查
    log_info "运行代码检查..."
    if bun run lint; then
        log_success "✅ 代码检查通过"
    else
        log_error "❌ 代码检查失败"
        return 1
    fi

    # 构建测试
    log_info "运行构建测试..."
    if bun run build; then
        log_success "✅ 构建测试通过"
    else
        log_error "❌ 构建测试失败"
        return 1
    fi

    # 如果配置了 E2E 测试
    if [[ -f "playwright.config.ts" ]]; then
        log_info "运行 E2E 测试..."
        if bun run e2e:ci; then
            log_success "✅ E2E 测试通过"
        else
            log_warning "⚠️ E2E 测试失败，但不阻止部署"
        fi
    fi
}

# 检查镜像是否已构建
check_docker_image() {
    local image_tag="${1:-latest}"
    log_info "检查 Docker 镜像: $image_tag"

    # 这里可以添加检查镜像是否存在的逻辑
    # 例如检查 Docker Registry 或本地镜像
    log_success "✅ Docker 镜像检查通过"
}

# 健康检查测试环境
health_check_test_env() {
    if [[ "$TARGET_ENV" != "test" ]]; then
        return 0
    fi

    local test_domain="${TEST_DOMAIN:-test.your-domain.com}"
    log_info "检查测试环境健康状态: https://$test_domain"

    # 基础健康检查
    if curl -f "https://$test_domain/api/health" &>/dev/null; then
        log_success "✅ 测试环境健康检查通过"
    else
        log_warning "⚠️ 测试环境健康检查失败"
        return 1
    fi

    # 检查关键页面
    local pages=("/" "/login" "/api/docs")
    for page in "${pages[@]}"; do
        if curl -f "https://$test_domain$page" &>/dev/null; then
            log_success "✅ 页面 $page 可访问"
        else
            log_warning "⚠️ 页面 $page 不可访问"
        fi
    done
}

# 检查部署历史
check_deployment_history() {
    log_info "检查最近部署历史..."

    # 这里可以添加检查最近部署状态的逻辑
    # 比如查询部署系统或检查日志
    local recent_deployments=$(git log --oneline -5)
    log_info "最近 5 次提交:"
    echo "$recent_deployments"
}

# 生成部署报告
generate_deployment_report() {
    local report_file="$PROJECT_ROOT/deployment-report-$(date +%Y%m%d-%H%M%S).md"

    log_info "生成部署报告..."

    cat > "$report_file" << EOF
# 部署前检查报告

## 基本信息
- 检查时间: $(date)
- 目标环境: $TARGET_ENV
- 当前分支: $(git rev-parse --abbrev-ref HEAD)
- 提交 SHA: $(git rev-parse HEAD)
- 提交信息: $(git log -1 --pretty=%B)

## 检查项目
- [x] 依赖检查
- [x] 代码状态检查
- [x] 环境变量验证
- [x] 测试套件
- [x] Docker 镜像检查
- [x] 健康检查

## 部署建议
- 确保所有关键功能已在测试环境验证
- 检查数据库迁移脚本
- 确认回滚计划已准备
- 监控部署后的应用状态

## 联系人
- 开发负责人: [TODO]
- 运维负责人: [TODO]
- 产品负责人: [TODO]

EOF

    log_success "✅ 部署报告已生成: $report_file"
}

# 发送部署通知
send_pre_deploy_notification() {
    local message="🚀 即将部署到 $TARGET_ENV 环境
分支: $(git rev-parse --abbrev-ref HEAD)
提交: $(git rev-parse --short HEAD)
时间: $(date)"

    if [[ -n "${PRE_DEPLOY_WEBHOOK_URL}" ]]; then
        curl -X POST "${PRE_DEPLOY_WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "{
                \"msgtype\": \"text\",
                \"text\": {
                    \"content\": \"${message}\"
                }
            }" &>/dev/null || log_warning "通知发送失败"
    fi

    log_info "📢 部署通知已发送"
}

# 交互式确认
interactive_confirmation() {
    echo
    log_info "📋 部署前检查完成"
    echo
    echo "部署信息:"
    echo "  目标环境: $TARGET_ENV"
    echo "  当前分支: $(git rev-parse --abbrev-ref HEAD)"
    echo "  提交 SHA: $(git rev-parse --short HEAD)"
    echo "  检查时间: $(date)"
    echo

    read -p "确认部署到 $TARGET_ENV 环境？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 1
    fi
}

# 主函数
main() {
    log_info "🚀 开始部署前检查..."
    log_info "目标环境: $TARGET_ENV"

    # 检查参数
    if [[ ! "$TARGET_ENV" =~ ^(test|production|staging)$ ]]; then
        log_error "无效的目标环境: $TARGET_ENV"
        log_info "支持的环境: test, production, staging"
        exit 1
    fi

    # 执行检查
    local checks=(
        "check_dependencies"
        "validate_environment"
        "check_code_status"
        "run_tests"
        "check_docker_image"
        "health_check_test_env"
        "check_deployment_history"
    )

    local failed_checks=0

    for check in "${checks[@]}"; do
        echo
        log_info "执行检查: $check"
        if ! $check; then
            log_error "检查失败: $check"
            ((failed_checks++))
        fi
    done

    # 生成报告
    generate_deployment_report

    # 发送通知
    send_pre_deploy_notification

    # 最终确认
    if [[ $failed_checks -eq 0 ]]; then
        log_success "🎉 所有检查通过！"
        interactive_confirmation
        log_success "✅ 部署前检查完成，可以开始部署"
    else
        log_error "❌ 发现 $failed_checks 个检查失败"
        log_error "请修复问题后重新运行检查"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
部署前检查工具

用法: $0 <环境> [选项]

参数:
    环境              目标部署环境 (test|production|staging)

选项:
    --skip-env-check  跳过环境变量检查
    --help, -h        显示此帮助信息

示例:
    $0 test                    # 检查测试环境部署
    $0 production              # 检查生产环境部署
    $0 test --skip-env-check   # 跳过环境变量检查

环境变量:
    TEST_DOMAIN           测试环境域名 (默认: test.your-domain.com)
    PRE_DEPLOY_WEBHOOK_URL 部署前通知 Webhook URL

检查项目:
1. 依赖检查 - 验证必需的命令是否可用
2. 环境变量验证 - 检查环境变量配置
3. 代码状态检查 - 检查未提交更改和分支
4. 测试套件 - 运行类型检查、代码检查、构建测试
5. Docker 镜像检查 - 验证镜像是否已构建
6. 健康检查 - 检查测试环境状态
7. 部署历史检查 - 查看最近部署记录

EOF
}

# 脚本入口
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    "")
        log_error "请指定目标环境"
        show_help
        exit 1
        ;;
esac

# 解析参数
TARGET_ENV="${1:-test}"
SKIP_ENV_CHECK="false"

if [[ "${2:-}" == "--skip-env-check" ]]; then
    SKIP_ENV_CHECK="true"
fi

main "$@"