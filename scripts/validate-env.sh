#!/bin/bash

# 环境变量验证和同步脚本
# 用于确保测试和生产环境变量配置的一致性

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

# 环境变量定义模板
declare -A ENV_TEMPLATES=(
    # 基础配置
    ["NODE_ENV"]="必需，应为 'production' 或 'test'"
    ["PORT"]="必需，应用端口，通常为 3000"
    ["NEXT_PUBLIC_SITE_URL"]="必需，站点完整 URL"

    # 认证配置
    ["BETTER_AUTH_SECRET"]="必需，认证密钥，至少 32 字符"
    ["NEXTAUTH_URL"]="必需，NextAuth 回调 URL"
    ["TRUSTED_ORIGINS"]="必需，信任的域名列表，逗号分隔"

    # 数据库配置
    ["DATABASE_URL"]="必需，PostgreSQL 连接字符串"
    ["DIRECT_URL"]="可选，直接数据库连接字符串"

    # 微信登录配置
    ["WECHAT_WEBSITE_APP_ID"]="可选，微信开放平台 App ID"
    ["WECHAT_WEBSITE_APP_SECRET"]="可选，微信开放平台 App Secret"
    ["WECHAT_SERVICE_ACCOUNT_APP_ID"]="可选，微信服务号 App ID"
    ["WECHAT_SERVICE_ACCOUNT_APP_SECRET"]="可选，微信服务号 App Secret"

    # 邮件配置
    ["PLUNK_API_KEY"]="可选，Plunk 邮件服务 API Key"
    ["ENABLE_EMAIL_IN_DEV"]="可选，开发环境是否发送真实邮件"

    # 腾讯云配置
    ["TENCENT_CLOUD_SECRET_ID"]="可选，腾讯云访问密钥 ID"
    ["TENCENT_CLOUD_SECRET_KEY"]="可选，腾讯云访问密钥"
    ["TENCENT_CLOUD_REGION"]="可选，腾讯云区域，如 ap-shanghai"

    # 短信配置
    ["TENCENT_SMS_REGION"]="可选，短信服务区域，如 ap-guangzhou"
    ["TENCENT_SMS_SDK_APP_ID"]="可选，短信 SDK App ID"
    ["TENCENT_SMS_SIGN_NAME"]="可选，短信签名"
    ["TENCENT_SMS_TEMPLATE_ID"]="可选，验证码模板 ID"
    ["TENCENT_SMS_EVENT_APPROVED_TEMPLATE_ID"]="可选，活动审核通过模板 ID"
    ["TENCENT_SMS_EVENT_REJECTED_TEMPLATE_ID"]="可选，活动审核拒绝模板 ID"

    # 支付配置
    ["STRIPE_SECRET_KEY"]="可选，Stripe 密钥"
    ["STRIPE_WEBHOOK_SECRET"]="可选，Stripe Webhook 密钥"

    # 价格配置
    ["NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY"]="可选，专业版月付价格 ID"
    ["NEXT_PUBLIC_PRICE_ID_PRO_YEARLY"]="可选，专业版年付价格 ID"
    ["NEXT_PUBLIC_PRICE_ID_LIFETIME"]="可选，终身版价格 ID"

    # 存储配置
    ["S3_ACCESS_KEY_ID"]="可选，S3 访问密钥 ID"
    ["S3_SECRET_ACCESS_KEY"]="可选，S3 访问密钥"
    ["S3_ENDPOINT"]="可选，S3 端点 URL"
    ["S3_REGION"]="可选，S3 区域"
    ["NEXT_PUBLIC_BUCKET_NAME"]="可选，公开存储桶名称"
    ["NEXT_PUBLIC_S3_ENDPOINT"]="可选，公开 S3 端点"

    # AI 配置
    ["ARK_API_KEY"]="可选，火山引擎 Ark API 密钥"
    ["ARK_BASE_URL"]="可选，火山引擎 Ark 基础 URL"
    ["ARK_MODEL"]="可选，火山引擎模型名称"
    ["AI_API_KEY"]="可选，统一 AI API 密钥（优先级低于 ARK_API_KEY）"
    ["AI_BASE_URL"]="可选，统一 AI 基础 URL（优先级低于 ARK_BASE_URL）"
    ["AI_MODEL"]="可选，统一 AI 模型名称（优先级低于 ARK_MODEL）"
    ["OPENAI_API_KEY"]="可选，OpenAI API 密钥"
    ["OPENAI_BASE_URL"]="可选，OpenAI 基础 URL"
    ["OPENAI_MODEL"]="可选，OpenAI 模型名称"

    # 统计分析
    ["NEXT_PUBLIC_UMAMI_WEBSITE_ID"]="可选，Umami 网站 ID"
    ["NEXT_PUBLIC_UMAMI_SCRIPT_URL"]="可选，Umami 脚本 URL"
    ["NEXT_PUBLIC_GOOGLE_ANALYTICS_ID"]="可选，Google Analytics ID"
    ["NEXT_PUBLIC_BAIDU_ANALYTICS_ID"]="可选，百度统计 ID"
)

# 必需的环境变量
REQUIRED_VARS=(
    "NODE_ENV"
    "PORT"
    "NEXT_PUBLIC_SITE_URL"
    "BETTER_AUTH_SECRET"
    "NEXTAUTH_URL"
    "TRUSTED_ORIGINS"
    "DATABASE_URL"
)

# 验证单个环境变量文件
validate_env_file() {
    local env_file="$1"
    local environment="$2"

    log_info "验证环境变量文件: $env_file (环境: $environment)"

    if [[ ! -f "$env_file" ]]; then
        log_error "环境变量文件不存在: $env_file"
        return 1
    fi

    local errors=0
    local warnings=0

    # 加载环境变量
    set -a
    source "$env_file"
    set +a

    # 检查必需变量
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_error "❌ 缺少必需变量: $var - ${ENV_TEMPLATES[$var]}"
            ((errors++))
        else
            log_success "✅ $var: 已设置"
        fi
    done

    # 环境特定验证
    case "$environment" in
        "production")
            validate_production_env
            ;;
        "test")
            validate_test_env
            ;;
        "development")
            validate_development_env
            ;;
    esac

    # 特定变量格式验证
    validate_specific_formats

    if [[ $errors -gt 0 ]]; then
        log_error "发现 $errors 个错误，$warnings 个警告"
        return 1
    else
        log_success "✅ 环境变量验证通过 (警告: $warnings)"
        return 0
    fi
}

# 生产环境特定验证
validate_production_env() {
    # 检查 URL 是否为生产域名
    if [[ "$NEXT_PUBLIC_SITE_URL" == *"localhost"* ]] || [[ "$NEXT_PUBLIC_SITE_URL" == *"127.0.0.1"* ]]; then
        log_error "❌ 生产环境不应使用 localhost"
        return 1
    fi

    if [[ "$NEXTAUTH_URL" == *"localhost"* ]] || [[ "$NEXTAUTH_URL" == *"127.0.0.1"* ]]; then
        log_error "❌ 生产环境 NEXTAUTH_URL 不应使用 localhost"
        return 1
    fi

    # 检查是否包含测试域名
    if [[ "$TRUSTED_ORIGINS" == *"test."* ]] || [[ "$TRUSTED_ORIGINS" == *"staging."* ]]; then
        log_warning "⚠️ 生产环境 TRUSTED_ORIGINS 包含测试域名"
    fi

    # 检查数据库连接
    if [[ "$DATABASE_URL" == *"localhost"* ]] || [[ "$DATABASE_URL" == *"127.0.0.1"* ]]; then
        log_error "❌ 生产环境不应使用本地数据库"
        return 1
    fi
}

# 测试环境特定验证
validate_test_env() {
    # 检查 URL 是否为测试域名
    if [[ ! "$NEXT_PUBLIC_SITE_URL" == *"test."* ]] && [[ ! "$NEXT_PUBLIC_SITE_URL" == *"staging."* ]]; then
        log_warning "⚠️ 测试环境建议使用 test. 或 staging. 子域名"
    fi

    # 检查是否包含生产域名
    if [[ "$TRUSTED_ORIGINS" == *"www."* ]] && [[ ! "$TRUSTED_ORIGINS" == *"test."* ]]; then
        log_warning "⚠️ 测试环境 TRUSTED_ORIGINS 应主要包含测试域名"
    fi
}

# 开发环境特定验证
validate_development_env() {
    # 开发环境通常使用 localhost
    if [[ ! "$NEXT_PUBLIC_SITE_URL" == *"localhost"* ]] && [[ -z "$NEXT_PUBLIC_SITE_URL" ]]; then
        log_warning "⚠️ 开发环境建议设置 NEXT_PUBLIC_SITE_URL 为空或 localhost"
    fi
}

# 特定变量格式验证
validate_specific_formats() {
    # URL 格式验证
    local url_vars=("NEXT_PUBLIC_SITE_URL" "NEXTAUTH_URL" "NEXT_PUBLIC_S3_ENDPOINT")
    for var in "${url_vars[@]}"; do
        if [[ -n "${!var}" ]] && [[ ! "${!var}" =~ ^https?:// ]]; then
            log_warning "⚠️ $var 可能不是有效的 URL 格式"
        fi
    done

    # 密钥长度验证
    if [[ -n "$BETTER_AUTH_SECRET" ]] && [[ ${#BETTER_AUTH_SECRET} -lt 32 ]]; then
        log_error "❌ BETTER_AUTH_SECRET 长度应至少 32 字符"
    fi

    # 区域格式验证
    local region_patterns=("ap-shanghai" "ap-guangzhou" "us-east-1" "us-west-2")
    if [[ -n "$TENCENT_CLOUD_REGION" ]]; then
        local valid_region=false
        for pattern in "${region_patterns[@]}"; do
            if [[ "$TENCENT_CLOUD_REGION" == "$pattern" ]]; then
                valid_region=true
                break
            fi
        done
        if [[ "$valid_region" == false ]]; then
            log_warning "⚠️ TENCENT_CLOUD_REGION 格式可能不正确"
        fi
    fi
}

# 比较两个环境变量文件
compare_env_files() {
    local env1="$1"
    local env2="$2"
    local env1_name="$3"
    local env2_name="$4"

    log_info "比较环境变量文件: $env1_name vs $env2_name"

    if [[ ! -f "$env1" ]] || [[ ! -f "$env2" ]]; then
        log_error "其中一个环境变量文件不存在"
        return 1
    fi

    # 提取变量名（忽略注释和空行）
    local vars1=$(grep -E '^[A-Z_][A-Z0-9_]*=' "$env1" | cut -d'=' -f1 | sort)
    local vars2=$(grep -E '^[A-Z_][A-Z0-9_]*=' "$env2" | cut -d'=' -f1 | sort)

    # 找出差异
    local only_in_env1=$(comm -23 <(echo "$vars1") <(echo "$vars2"))
    local only_in_env2=$(comm -13 <(echo "$vars1") <(echo "$vars2"))
    local common_vars=$(comm -12 <(echo "$vars1") <(echo "$vars2"))

    local issues=0

    # 报告差异
    if [[ -n "$only_in_env1" ]]; then
        log_warning "⚠️ 仅在 $env1_name 中存在的变量:"
        echo "$only_in_env1" | sed 's/^/  - /'
        ((issues++))
    fi

    if [[ -n "$only_in_env2" ]]; then
        log_warning "⚠️ 仅在 $env2_name 中存在的变量:"
        echo "$only_in_env2" | sed 's/^/  - /'
        ((issues++))
    fi

    # 检查共同变量的值差异（排除敏感信息和环境特定值）
    log_info "检查共同变量的值差异..."
    while IFS= read -r var; do
        if [[ -n "$var" ]]; then
            local val1=$(grep "^${var}=" "$env1" | cut -d'=' -f2-)
            local val2=$(grep "^${var}=" "$env2" | cut -d'=' -f2-)

            # 跳过敏感信息和环境特定值的比较
            if [[ "$var" =~ (SECRET|KEY|TOKEN|PASSWORD|URL|ENV|DATABASE) ]]; then
                continue
            fi

            if [[ "$val1" != "$val2" ]]; then
                log_warning "⚠️ $var 值不同:"
                echo "  $env1_name: $val1"
                echo "  $env2_name: $val2"
                ((issues++))
            fi
        fi
    done <<< "$common_vars"

    if [[ $issues -eq 0 ]]; then
        log_success "✅ 环境变量配置一致性良好"
    else
        log_warning "发现 $issues 个配置差异"
    fi

    return $issues
}

# 生成环境变量同步建议
generate_sync_recommendations() {
    local source_env="$1"
    local target_env="$2"
    local source_name="$3"
    local target_name="$4"

    log_info "生成 $source_name → $target_name 同步建议..."

    # 这里可以添加具体的同步逻辑
    # 比如生成差异报告、建议需要同步的变量等
}

# 生成环境变量文档
generate_env_docs() {
    local output_file="$PROJECT_ROOT/docs/environment-variables.md"

    log_info "生成环境变量文档..."

    cat > "$output_file" << 'EOF'
# 环境变量配置文档

本文档详细说明了项目中所有环境变量的用途和配置要求。

## 环境说明

- **development**: 本地开发环境
- **test**: 测试环境 (test.your-domain.com)
- **production**: 生产环境 (your-domain.com)

## 环境变量列表

### 基础配置

| 变量名 | 必需 | 默认值 | 说明 | 示例 |
|--------|------|--------|------|------|
| `NODE_ENV` | ✅ | - | 运行环境 | `production` |
| `PORT` | ✅ | `3000` | 应用端口 | `3000` |
| `NEXT_PUBLIC_SITE_URL` | ✅ | - | 站点完整 URL | `https://your-domain.com` |

### 认证配置

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `BETTER_AUTH_SECRET` | ✅ | Better Auth 密钥，至少32字符 | `your-secret-key-here` |
| `NEXTAUTH_URL` | ✅ | NextAuth 回调 URL | `https://your-domain.com` |
| `TRUSTED_ORIGINS` | ✅ | 信任的域名列表，逗号分隔 | `https://your-domain.com,https://test.your-domain.com` |

### 数据库配置

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | ❌ | 直接数据库连接字符串 | `postgresql://user:pass@host:5432/db` |

### 微信登录配置

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `WECHAT_WEBSITE_APP_ID` | ❌ | 微信开放平台 App ID | `wx1234567890abcdef` |
| `WECHAT_WEBSITE_APP_SECRET` | ❌ | 微信开放平台 App Secret | `your-secret-key` |
| `WECHAT_SERVICE_ACCOUNT_APP_ID` | ❌ | 微信服务号 App ID | `wx1234567890abcdef` |
| `WECHAT_SERVICE_ACCOUNT_APP_SECRET` | ❌ | 微信服务号 App Secret | `your-secret-key` |

## 环境特定配置

### 开发环境 (apps/web/.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
TRUSTED_ORIGINS=http://localhost:3000
ENABLE_EMAIL_IN_DEV=false
```

### 测试环境 (apps/web/.env.test)
```bash
NODE_ENV=test
NEXT_PUBLIC_SITE_URL=https://test.your-domain.com
NEXTAUTH_URL=https://test.your-domain.com
TRUSTED_ORIGINS=https://test.your-domain.com,https://your-domain.com
```

### 生产环境 (apps/web/.env.production)
```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
TRUSTED_ORIGINS=https://your-domain.com
```

## 安全注意事项

1. **敏感信息**: 所有包含 `SECRET`、`KEY`、`TOKEN` 的变量都是敏感信息
2. **版本控制**: 不要将包含真实密钥的环境变量文件提交到 Git
3. **密钥轮换**: 定期更换所有密钥和令牌
4. **最小权限**: 为每个服务配置最小必要的权限

## 故障排除

### 常见问题

1. **微信登录失败**
   - 检查 `TRUSTED_ORIGINS` 是否包含当前域名
   - 确认微信平台配置的回调域名正确

2. **数据库连接失败**
   - 验证 `DATABASE_URL` 格式正确
   - 检查网络连接和防火墙设置

3. **邮件发送失败**
   - 确认 API 密钥有效
   - 检查 `ENABLE_EMAIL_IN_DEV` 设置

EOF

    log_success "✅ 环境变量文档已生成: $output_file"
}

# 主函数
main() {
    local action="${1:-validate}"

    case "$action" in
        "validate")
            # 验证所有环境变量文件
            local files=(
                "apps/web/.env.local:development"
                "apps/web/.env.test:test"
                "apps/web/.env.production:production"
            )

            local all_valid=true
            for file_env in "${files[@]}"; do
                local file="${file_env%:*}"
                local env="${file_env#*:}"

                if [[ -f "$PROJECT_ROOT/$file" ]]; then
                    if ! validate_env_file "$PROJECT_ROOT/$file" "$env"; then
                        all_valid=false
                    fi
                else
                    log_warning "⚠️ 环境变量文件不存在: $file"
                fi
            done

            if [[ "$all_valid" == true ]]; then
                log_success "🎉 所有环境变量验证通过！"
            else
                log_error "❌ 部分环境变量验证失败"
                exit 1
            fi
            ;;

        "compare")
            # 比较测试和生产环境
            local env1="${2:-apps/web/.env.test}"
            local env2="${3:-apps/web/.env.production}"
            local name1="${4:-测试环境}"
            local name2="${5:-生产环境}"

            compare_env_files "$PROJECT_ROOT/$env1" "$PROJECT_ROOT/$env2" "$name1" "$name2"
            ;;

        "docs")
            # 生成文档
            generate_env_docs
            ;;

        "sync")
            # 生成同步建议
            local source="${2:-apps/web/.env.test}"
            local target="${3:-apps/web/.env.production}"
            local source_name="${4:-测试环境}"
            local target_name="${5:-生产环境}"

            generate_sync_recommendations "$PROJECT_ROOT/$source" "$PROJECT_ROOT/$target" "$source_name" "$target_name"
            ;;

        *)
            echo "用法: $0 {validate|compare|docs|sync} [args...]"
            echo ""
            echo "命令说明:"
            echo "  validate                 验证所有环境变量文件"
            echo "  compare <file1> <file2>  比较两个环境变量文件"
            echo "  docs                     生成环境变量文档"
            echo "  sync <source> <target>   生成同步建议"
            echo ""
            echo "示例:"
            echo "  $0 validate"
            echo "  $0 compare apps/web/.env.test apps/web/.env.production 测试环境 生产环境"
            echo "  $0 docs"
            exit 1
            ;;
    esac
}

# 显示帮助信息
show_help() {
    cat << EOF
环境变量验证和管理工具

用法: $0 <命令> [参数...]

命令:
    validate                    验证所有环境变量文件
    compare <file1> <file2>     比较两个环境变量文件的差异
    docs                       生成环境变量文档
    sync <source> <target>     生成环境同步建议

示例:
    $0 validate                                    # 验证所有环境
    $0 compare apps/web/.env.test apps/web/.env.production           # 比较测试和生产环境
    $0 docs                                       # 生成文档
    $0 sync apps/web/.env.test apps/web/.env.production              # 生成同步建议

环境变量文件:
    apps/web/.env.local        开发环境
    apps/web/.env.test         测试环境
    apps/web/.env.production   生产环境

EOF
}

# 脚本入口
if [[ "${1}" == "-h" || "${1}" == "--help" ]]; then
    show_help
    exit 0
fi

main "$@"
