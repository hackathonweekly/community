# Docker 部署指南

> 📖 **文档结构**：快速上手（3分钟）+ 详细说明（按需查阅）

---

## 🚀 快速上手（3分钟）

### 第一次使用？跟着做就行

#### 1. 本地开发测试
```bash
# 复制环境变量模板
cp .env.local.example .env.local

# 启动容器（会自动构建镜像）
make up

# 查看日志确认启动成功
make logs
```
访问 http://localhost:3000 即可看到应用

#### 2. 生产环境部署
```bash
# 一键发布镜像到仓库
make release TAG=v1.2.0

# 一键部署到生产环境
make deploy TAG=v1.2.0
```

#### 3. 紧急回滚
```bash
make rollback TAG=v1.1.9
```

**完成！** 🎉 这就是全部核心操作。

---

## 📚 详细说明

### 常用命令速查表

| 命令 | 用途 | 使用场景 |
|------|------|----------|
| **本地开发** | | |
| `make up` | 启动容器 | 本地测试 Docker 环境 |
| `make down` | 停止容器 | 结束测试 |
| `make logs` | 查看日志 | 排查问题 |
| `make shell` | 进入容器 | 调试容器内环境 |
| **生产部署** | | |
| `make release TAG=v1.2.0` | 发布镜像 | 构建并推送到镜像仓库 |
| `make deploy TAG=v1.2.0` | 部署到生产 | 拉取镜像并启动服务 |
| `make rollback TAG=v1.1.9` | 回滚版本 | 快速恢复到旧版本 |
| `make prod-logs` | 查看生产日志 | 监控生产环境 |

💡 **提示**：运行 `make help` 查看所有命令

---

### 环境变量配置

项目使用两个环境变量文件：

| 文件 | 用途 | 位置 |
|------|------|------|
| `.env.local` | 本地开发和测试 | 本地机器，不提交到 Git |
| `.env.production` | 生产环境 | 生产服务器，包含敏感信息 |

#### 如何配置环境变量？

1. **本地开发**：
   ```bash
   cp .env.local.example .env.local
   # 编辑 .env.local，填入数据库、对象存储等配置
   ```

2. **生产环境**：
   ```bash
   # 在生产服务器创建 .env.production
   vim .env.production
   # 填入生产环境的数据库、密钥等配置
   ```

---

### 完整部署流程

#### 方案 A：一步到位（推荐新手）
```bash
# 发布并部署
make release TAG=v1.2.0 && make deploy TAG=v1.2.0
```

#### 方案 B：分步执行（推荐了解每一步）

**步骤 1：构建并发布镜像**
```bash
make release TAG=v1.2.0
```
这个命令会：
- ✅ 构建 Docker 镜像
- ✅ 打上版本标签
- ✅ 推送到镜像仓库（默认：docker.cnb.cool/hackathonweekly）

**步骤 2：部署到生产环境**
```bash
make deploy TAG=v1.2.0
```
这个命令会：
- ✅ 从仓库拉取指定版本镜像
- ✅ 停止旧容器
- ✅ 启动新容器
- ✅ 自动清理无用容器

**步骤 3：验证部署**
```bash
# 查看容器状态
make ps

# 查看实时日志
make prod-logs
```

---

### 镜像仓库配置

默认使用 `docker.cnb.cool/hackathonweekly`，如需修改：

#### 方法 1：临时指定（单次使用）
```bash
REGISTRY=docker.io/your-username make release TAG=v1.2.0
```

#### 方法 2：永久修改（推荐）
编辑 `Makefile` 第 10 行：
```makefile
REGISTRY ?= docker.io/your-username
```

#### 常用镜像仓库

| 仓库 | 地址 | 特点 |
|------|------|------|
| Docker Hub | `docker.io/username` | 国际通用，有免费限额 |
| 腾讯云 | `ccr.ccs.tencentyun.com` | 国内快，免费私有仓库 |
| 阿里云 | `registry.cn-hangzhou.aliyuncs.com` | 国内快，需实名 |

登录仓库：
```bash
# Docker Hub
docker login

# 腾讯云
docker login ccr.ccs.tencentyun.com --username=<用户名>
```

---

### 版本管理策略

#### 推荐的版本号规则

| 格式 | 示例 | 适用场景 |
|------|------|----------|
| 语义版本 | `v1.2.3` | 正式发布版本 |
| 日期版本 | `v2024.11.10` | 每日构建 |
| Git SHA | `abc1234` | 开发测试版本 |

#### 版本回滚

如果新版本有问题，立即回滚：
```bash
make rollback TAG=v1.1.9
```

💡 **原理**：使用本地已拉取的旧版本镜像，**不重新下载**，秒级完成。

---

### 故障排查

#### 问题 1：容器无法启动

**症状**：`make up` 后容器立即退出

**解决方案**：
```bash
# 查看日志
make logs

# 常见原因：
# - 数据库连接失败 → 检查 DATABASE_URL
# - 端口被占用 → 修改 PORT 环境变量
# - 环境变量缺失 → 对比 .env.local.example
```

#### 问题 2：健康检查失败

**症状**：`make ps` 显示 `unhealthy`

**解决方案**：
```bash
# 1. 检查健康检查端点
curl http://localhost:3000/api/health

# 2. 查看详细健康状态
docker inspect community | grep -A 10 Health

# 3. 常见原因：
# - 数据库未连接
# - 依赖服务（如 Redis）未启动
```

#### 问题 3：镜像拉取失败

**症状**：`make deploy` 时报 `EOF` 或 `timeout`

**解决方案**：
```bash
# 方法 1：使用国内镜像加速
# 编辑 /etc/docker/daemon.json (Linux) 或 Docker Desktop 设置 (Mac)
{
  "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]
}

# 重启 Docker
sudo systemctl restart docker  # Linux
# 或重启 Docker Desktop

# 方法 2：改用国内镜像仓库
REGISTRY=ccr.ccs.tencentyun.com/your-namespace make release TAG=v1.2.0
```

#### 问题 4：构建缓慢

**症状**：`make release` 构建超过 10 分钟

**解决方案**：
```bash
# 1. 清理 Docker 缓存
docker builder prune

# 2. 使用 BuildKit 加速（Docker 默认已启用）
DOCKER_BUILDKIT=1 make release TAG=v1.2.0

# 3. 检查网络（依赖下载慢）
# - 可能是 npm/bun 源慢，在 Dockerfile 中配置镜像源
```

---

### 高级配置

#### 自定义端口
```bash
# 本地
PORT=8080 make up

# 生产（修改 .env.production）
PORT=8080
```

#### 多环境部署

如需同时运行多个环境（如 staging、production）：

```bash
# Staging 环境
IMAGE=community:staging \
ENV_FILE=.env.staging \
PORT=3001 \
docker compose up -d

# Production 环境
IMAGE=community:production \
ENV_FILE=.env.production \
PORT=3000 \
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### 跨平台构建（ARM/x86）

```bash
# 构建 ARM64 镜像（如 Apple Silicon Mac）
PLATFORM=linux/arm64 make release TAG=v1.2.0-arm64

# 构建 x86 镜像（生产服务器通常是 x86）
PLATFORM=linux/amd64 make release TAG=v1.2.0
```

---

### 工作原理（可选阅读）

#### Docker Compose 分层设计

```
docker-compose.yml          # 基础配置（开发+生产通用）
     ↓
docker-compose.prod.yml     # 生产覆盖（镜像源、安全选项）
```

**为什么这样设计？**
- ✅ 避免重复配置（DRY 原则）
- ✅ 开发生产环境隔离
- ✅ 生产配置仅覆盖差异部分

#### Dockerfile 多阶段构建

```
deps    → builder    → runner
(依赖)    (构建)       (运行)
```

**好处：**
- 最终镜像只包含运行时文件
- 镜像体积减少 60%+
- 安全性更高（无构建工具）

---

## 🆘 获取帮助

- 运行 `make help` 查看命令说明
- 查看日志：`make logs` 或 `make prod-logs`
- 进入容器调试：`make shell` 或 `make prod-shell`
- 有问题？在 GitHub Issues 提问，附上：
  - 执行的命令
  - 完整的错误日志
  - `docker version` 输出
