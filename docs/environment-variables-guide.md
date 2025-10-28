# 环境变量配置完整指南

## 🎯 概述

本文档详细说明了如何在不同环境（开发、测试、生产）中正确配置环境变量，确保部署的一致性和可靠性。

## 📚 目录

1. [环境类型说明](#环境类型说明)
2. [环境变量分类](#环境变量分类)
3. [配置文件模板](#配置文件模板)
4. [常见问题和解决方案](#常见问题和解决方案)
5. [部署检查清单](#部署检查清单)
6. [最佳实践](#最佳实践)

## 🏗️ 环境类型说明

### 开发环境 (Development)
- **用途**: 本地开发和调试
- **域名**: `localhost:3000` 或空
- **数据库**: 本地数据库或开发数据库
- **特点**: 详细日志、错误调试、热重载

### 测试环境 (Test/Staging)
- **用途**: 功能测试、集成测试、用户验收测试
- **域名**: `test.your-domain.com` 或 `staging.your-domain.com`
- **数据库**: 独立的测试数据库
- **特点**: 接近生产配置、完整功能测试

### 生产环境 (Production)
- **用途**: 正式提供服务
- **域名**: `your-domain.com`
- **数据库**: 生产数据库
- **特点**: 高性能、安全、稳定

## 📂 环境变量分类

### 🔑 核心必需变量
这些变量在所有环境中都必须正确配置：

| 变量名 | 开发环境示例 | 测试环境示例 | 生产环境示例 | 说明 |
|--------|-------------|-------------|-------------|------|
| `NODE_ENV` | `development` | `test` | `production` | 运行环境 |
| `PORT` | `3000` | `3000` | `3000` | 应用端口 |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://test.your-domain.com` | `https://your-domain.com` | 站点URL |
| `BETTER_AUTH_SECRET` | `dev-secret-key` | `test-secret-key` | `prod-secret-key` | 认证密钥 |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://test.your-domain.com` | `https://your-domain.com` | 认证回调URL |
| `TRUSTED_ORIGINS` | `http://localhost:3000` | `https://test.your-domain.com,https://your-domain.com` | `https://your-domain.com` | 信任域名 |

### 🗄️ 数据库配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `DATABASE_URL` | 本地PostgreSQL | 测试数据库 | 生产数据库 | 数据库连接 |
| `DIRECT_URL` | 可选 | 可选 | 可选 | 直接数据库连接 |

### 🔐 认证和第三方服务

#### 微信登录配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `WECHAT_WEBSITE_APP_ID` | 测试AppID | 测试AppID | 正式AppID | 微信开放平台 |
| `WECHAT_WEBSITE_APP_SECRET` | 测试Secret | 测试Secret | 正式Secret | 微信开放平台 |
| `WECHAT_SERVICE_ACCOUNT_APP_ID` | 测试AppID | 测试AppID | 正式AppID | 微信服务号 |
| `WECHAT_SERVICE_ACCOUNT_APP_SECRET` | 测试Secret | 测试Secret | 正式Secret | 微信服务号 |

**重要提示**:
- 微信登录需要在微信公众平台配置授权域名
- 测试环境和生产环境需要不同的AppID和AppSecret
- 开发环境可以使用测试账号

#### 邮件服务配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `PLUNK_API_KEY` | 测试Key | 测试Key | 正式Key | Plunk邮件服务 |
| `ENABLE_EMAIL_IN_DEV` | `false` | `false` | `false` | 开发环境邮件开关 |

#### 短信服务配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `TENCENT_CLOUD_SECRET_ID` | 测试ID | 测试ID | 正式ID | 腾讯云密钥ID |
| `TENCENT_CLOUD_SECRET_KEY` | 测试Key | 测试Key | 正式Key | 腾讯云密钥 |
| `TENCENT_CLOUD_REGION` | `ap-shanghai` | `ap-shanghai` | `ap-shanghai` | 腾讯云区域 |
| `TENCENT_SMS_REGION` | `ap-guangzhou` | `ap-guangzhou` | `ap-guangzhou` | 短信服务区域 |

### 💳 支付配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` | Stripe密钥 |
| `STRIPE_WEBHOOK_SECRET` | 测试Secret | 测试Secret | 正式Secret | Stripe Webhook |

### 📁 文件存储配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `S3_ACCESS_KEY_ID` | 测试Key | 测试Key | 正式Key | S3访问密钥 |
| `S3_SECRET_ACCESS_KEY` | 测试Key | 测试Key | 正式Key | S3密钥 |
| `S3_ENDPOINT` | 测试端点 | 测试端点 | 正式端点 | S3端点 |
| `NEXT_PUBLIC_BUCKET_NAME` | `test-public` | `test-public` | `public` | 存储桶名称 |

### 🤖 AI服务配置
| 变量名 | 开发环境 | 测试环境 | 生产环境 | 说明 |
|--------|----------|----------|----------|------|
| `OPENAI_API_KEY` | 测试Key | 测试Key | 正式Key | OpenAI API密钥 |
| `OPENAI_BASE_URL` | 官方URL | 官方URL | 官方URL | API基础URL |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | `gpt-3.5-turbo` | `gpt-4` | 使用的模型 |

## 📄 配置文件模板

### 开发环境 (.env.local)
```bash
# ==============================================
# 基础配置
# ==============================================
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_SITE_URL=
NEXTAUTH_URL=
TRUSTED_ORIGINS=http://localhost:3000

# ==============================================
# 认证配置
# ==============================================
BETTER_AUTH_SECRET=your-development-secret-key-here-at-least-32-chars

# ==============================================
# 数据库配置
# ==============================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/community_dev

# ==============================================
# 第三方服务 (使用测试账号)
# ==============================================
# 微信登录 - 开发环境可以使用测试账号
WECHAT_WEBSITE_APP_ID=your-test-wechat-app-id
WECHAT_WEBSITE_APP_SECRET=your-test-wechat-app-secret

# 邮件服务
PLUNK_API_KEY=your-test-plunk-api-key
ENABLE_EMAIL_IN_DEV=false

# 腾讯云服务
TENCENT_CLOUD_SECRET_ID=your-test-secret-id
TENCENT_CLOUD_SECRET_KEY=your-test-secret-key
TENCENT_CLOUD_REGION=ap-shanghai
TENCENT_SMS_REGION=ap-guangzhou

# 支付服务 - 使用测试密钥
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# 文件存储 - 使用测试存储桶
S3_ACCESS_KEY_ID=your-test-access-key
S3_SECRET_ACCESS_KEY=your-test-secret-key
S3_ENDPOINT=https://your-test-endpoint.com
NEXT_PUBLIC_BUCKET_NAME=test-public

# AI服务
OPENAI_API_KEY=your-test-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
```

### 测试环境 (.env.test)
```bash
# ==============================================
# 基础配置
# ==============================================
NODE_ENV=test
PORT=3000
NEXT_PUBLIC_SITE_URL=https://test.your-domain.com
NEXTAUTH_URL=https://test.your-domain.com
TRUSTED_ORIGINS=https://test.your-domain.com,https://your-domain.com

# ==============================================
# 认证配置
# ==============================================
BETTER_AUTH_SECRET=your-test-environment-secret-key-here-32-chars-min

# ==============================================
# 数据库配置
# ==============================================
DATABASE_URL=postgresql://postgres:password@test-db-host:5432/community_test

# ==============================================
# 第三方服务 (测试环境配置)
# ==============================================
# 微信登录 - 测试环境独立的AppID
WECHAT_WEBSITE_APP_ID=wx1234567890abcdef_test
WECHAT_WEBSITE_APP_SECRET=your-test-wechat-app-secret

# 邮件服务
PLUNK_API_KEY=your-test-plunk-api-key
ENABLE_EMAIL_IN_DEV=false

# 腾讯云服务 - 测试环境独立的配置
TENCENT_CLOUD_SECRET_ID=your-test-secret-id
TENCENT_CLOUD_SECRET_KEY=your-test-secret-key
TENCENT_CLOUD_REGION=ap-shanghai
TENCENT_SMS_REGION=ap-guangzhou

# 支付服务 - 测试环境
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# 文件存储 - 测试环境独立存储桶
S3_ACCESS_KEY_ID=your-test-access-key
S3_SECRET_ACCESS_KEY=your-test-secret-key
S3_ENDPOINT=https://your-test-endpoint.com
NEXT_PUBLIC_BUCKET_NAME=test-public

# AI服务
OPENAI_API_KEY=your-test-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# ==============================================
# 测试环境特定配置
# ==============================================
ENVIRONMENT=test
DEBUG=true
LOG_LEVEL=debug
```

### 生产环境 (.env.production)
```bash
# ==============================================
# 基础配置
# ==============================================
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
TRUSTED_ORIGINS=https://your-domain.com

# ==============================================
# 认证配置
# ==============================================
BETTER_AUTH_SECRET=your-production-environment-secret-key-here-32-chars-min

# ==============================================
# 数据库配置
# ==============================================
DATABASE_URL=postgresql://postgres:password@prod-db-host:5432/community_prod

# ==============================================
# 第三方服务 (生产环境配置)
# ==============================================
# 微信登录 - 生产环境正式配置
WECHAT_WEBSITE_APP_ID=wx1234567890abcdef_prod
WECHAT_WEBSITE_APP_SECRET=your-production-wechat-app-secret

# 邮件服务
PLUNK_API_KEY=your-production-plunk-api-key
ENABLE_EMAIL_IN_DEV=false

# 腾讯云服务 - 生产环境配置
TENCENT_CLOUD_SECRET_ID=your-production-secret-id
TENCENT_CLOUD_SECRET_KEY=your-production-secret-key
TENCENT_CLOUD_REGION=ap-shanghai
TENCENT_SMS_REGION=ap-guangzhou

# 支付服务 - 生产环境正式密钥
STRIPE_SECRET_KEY=sk_live_your_stripe_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# 文件存储 - 生产环境配置
S3_ACCESS_KEY_ID=your-production-access-key
S3_SECRET_ACCESS_KEY=your-production-secret-key
S3_ENDPOINT=https://your-production-endpoint.com
NEXT_PUBLIC_BUCKET_NAME=public

# AI服务
OPENAI_API_KEY=your-production-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4

# ==============================================
# 生产环境特定配置
# ==============================================
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info

# 价格配置 (生产环境)
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY=price_prod_monthly
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY=price_prod_yearly
NEXT_PUBLIC_PRICE_ID_LIFETIME=price_prod_lifetime
```

## 🚨 常见问题和解决方案

### 问题1: 微信登录在测试环境失败
**症状**: 测试环境微信扫码后回调失败
**原因**:
- `TRUSTED_ORIGINS` 未包含测试域名
- 微信公众平台未配置测试域名
- `NEXTAUTH_URL` 配置错误

**解决方案**:
```bash
# 检查环境变量
TRUSTED_ORIGINS=https://test.your-domain.com,https://your-domain.com
NEXTAUTH_URL=https://test.your-domain.com
NEXT_PUBLIC_SITE_URL=https://test.your-domain.com

# 在微信公众平台添加测试域名
# 登录微信公众平台 → 开发管理 → 网页授权
# 添加: test.your-domain.com
```

### 问题2: 数据库连接失败
**症状**: 应用启动时提示数据库连接错误
**原因**:
- 数据库URL格式错误
- 网络连接问题
- 认证信息错误

**解决方案**:
```bash
# 检查数据库URL格式
DATABASE_URL=postgresql://username:password@host:port/database

# 测试连接
psql "postgresql://username:password@host:port/database"

# 检查网络连接
ping host
telnet host port
```

### 问题3: 支付回调失败
**症状**: 支付成功后 webhook 回调失败
**原因**:
- Webhook URL 配置错误
- Webhook 密钥不匹配
- 防火墙阻止访问

**解决方案**:
```bash
# 检查 Stripe 配置
STRIPE_WEBHOOK_SECRET=whsec_your_correct_secret
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# 在 Stripe Dashboard 配置正确的 Webhook URL
# URL: https://your-domain.com/api/webhooks/stripe
```

### 问题4: 文件上传失败
**症状**: 用户头像上传失败
**原因**:
- S3 配置错误
- 权限不足
- 存储桶不存在

**解决方案**:
```bash
# 检查 S3 配置
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://your-region.amazonaws.com
NEXT_PUBLIC_BUCKET_NAME=your-bucket-name

# 测试 S3 连接
aws s3 ls s3://your-bucket-name --endpoint-url=$S3_ENDPOINT
```

## ✅ 部署检查清单

### 部署前检查
- [ ] 运行 `./scripts/pre-deploy-check.sh <environment>`
- [ ] 验证环境变量配置: `./scripts/validate-env.sh validate`
- [ ] 比较测试和生产环境差异: `./scripts/validate-env.sh compare .env.test .env.production`
- [ ] 检查代码是否有未提交更改
- [ ] 确认在正确的分支上
- [ ] 运行完整测试套件

### 测试环境验证
- [ ] 访问 `https://test.your-domain.com` 确认页面正常
- [ ] 测试微信登录功能
- [ ] 测试邮件发送功能
- [ ] 测试短信验证功能
- [ ] 测试支付功能（使用测试密钥）
- [ ] 测试文件上传功能
- [ ] 检查所有 API 端点响应正常

### 生产环境部署
- [ ] 备份生产数据库
- [ ] 备份当前环境变量配置
- [ ] 更新生产环境变量
- [ ] 部署新版本
- [ ] 验证核心功能正常
- [ ] 监控错误日志
- [ ] 准备回滚方案

## 🎯 最佳实践

### 1. 环境变量管理
```bash
# 使用不同的配置文件
.env.local          # 开发环境 (不提交到 Git)
.env.test           # 测试环境 (提交加密版本)
.env.production     # 生产环境 (提交加密版本)

# 使用环境变量前缀
TEST_*              # 测试环境特定变量
PROD_*             # 生产环境特定变量
DEV_*              # 开发环境特定变量
```

### 2. 安全实践
- **永远不要**将包含真实密钥的 `.env` 文件提交到 Git
- 使用加密工具管理敏感配置 (如 AWS Secrets Manager、HashiCorp Vault)
- 定期轮换所有密钥和令牌
- 为不同环境使用不同的第三方服务账号

### 3. 配置验证
```bash
# 集成到 CI/CD 流水线
./scripts/validate-env.sh validate

# 部署前检查
./scripts/pre-deploy-check.sh production

# 定期同步检查
./scripts/validate-env.sh compare .env.test .env.production
```

### 4. 监控和日志
```bash
# 在应用中添加环境变量检查
if (process.env.NODE_ENV === 'production') {
  // 生产环境特定配置
}

// 添加健康检查端点
app.get('/api/health', (req, res) => {
  // 检查关键服务连接状态
})
```

### 5. 文档维护
- 及时更新环境变量文档
- 记录每次配置变更的原因和影响
- 为新团队成员提供环境配置指南

## 🛠️ 实用脚本

### 快速环境切换
```bash
# scripts/switch-env.sh
#!/bin/bash
ENV=$1
cp .env.${ENV}.example .env.local
echo "已切换到 ${ENV} 环境配置"
```

### 配置差异检查
```bash
# scripts/diff-env.sh
#!/bin/bash
./scripts/validate-env.sh compare .env.test .env.production "测试环境" "生产环境"
```

### 环境变量同步
```bash
# scripts/sync-env.sh
#!/bin/bash
SOURCE=$1
TARGET=$2
./scripts/validate-env.sh sync .env.${SOURCE} .env.${TARGET}
```

## 📞 支持和故障排除

如果遇到环境变量配置问题：

1. 首先运行验证脚本检查配置
2. 查看应用启动日志中的错误信息
3. 使用测试环境验证配置是否正确
4. 参考本文档的常见问题部分
5. 联系运维团队获取帮助

---

**更新时间**: 2024年1月
**维护人员**: 开发团队
**版本**: 1.0.0