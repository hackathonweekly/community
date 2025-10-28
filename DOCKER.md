# Docker 部署快速参考

本项目支持 Docker 容器化部署，提供了完整的自动化脚本和配置文件。 （我们现在采用 cnb.yml 自动构建 docker 镜像）

## 📁 相关文件

- `Dockerfile` - 生产环境多阶段构建配置
- `.dockerignore` - Docker 构建忽略文件

## 🚀 快速开始

### 方式一：使用自动化脚本（推荐）

```bash
# 使用 Docker Hub (默认)
DOCKERHUB_USERNAME=myusername ./docker-build.sh v1.0.0

# 使用腾讯云（快捷参数，推荐国内用户）
./docker-build.sh v1.0.0 tencent

# 跳过登录确认（已登录时使用）
./docker-build.sh v1.0.0 tencent --skip-login

# 仅本地构建，不推送
./docker-build.sh v1.0.0 --local-only

# 同时推送到多个仓库
DOCKERHUB_USERNAME=myusername ./docker-push-all.sh v1.0.0
```

**快捷参数：**
- `tencent` - 腾讯云镜像仓库（国内快）
- `dockerhub` - Docker Hub（国际）
- `--skip-login` - 跳过登录确认
- `--local-only` - 仅本地构建
- 或直接指定自定义仓库地址

**跨平台构建：**
- ✅ 脚本自动使用 `--platform linux/amd64`
- ✅ Mac 构建的镜像可在 Ubuntu/Linux 服务器运行
- ✅ 验证：`docker inspect community:latest | grep Architecture`

### 方式二：使用 Docker Compose

```bash
# 1. 复制配置文件
cp docker-compose.yml.example docker-compose.yml
cp .env.local.example .env.local

# 2. 编辑 .env.local 填入实际环境变量

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### 方式三：手动构建

```bash
# Mac 构建 linux/amd64 镜像
docker build --platform linux/amd64 \
  -t ccr.ccs.tencentyun.com/hackathonweekly/community:v1.0.0 \
  .

# 推送到腾讯云
docker push ccr.ccs.tencentyun.com/hackathonweekly/community:v1.0.0
```

## 🏗️ 镜像仓库

### Docker Hub（默认）

```bash
# 登录
docker login
# 输入用户名和密码

# 镜像地址
your-username/community:latest
your-username/community:v1.0.0

# 使用脚本推送
DOCKERHUB_USERNAME=your-username ./docker-build.sh v1.0.0
```

### 腾讯云容器镜像服务（国内快）

```bash
# 登录（个人版）替换为你的 username
docker login ccr.ccs.tencentyun.com --username=100015625279
# 输入密码（在腾讯云控制台获取）

# 镜像地址
ccr.ccs.tencentyun.com/hackathonweekly/community:latest
ccr.ccs.tencentyun.com/hackathonweekly/community:v1.0.0

# 使用脚本推送
./docker-build.sh v1.0.0 tencent
```

**镜像仓库对比：**

| 特性 | Docker Hub | 腾讯云个人版 | 腾讯云企业版 |
|------|-----------|------------|------------|
| 国内速度 | 较慢 | 快 | 非常快 |
| 费用 | 免费（限速） | 免费 | 付费 |
| 私有仓库 | 1个 | 无限 | 无限 |
| 存储空间 | 无限（公开） | 10GB | 可扩展 |

## 📝 环境变量配置

环境变量**不应该**写在 Docker 镜像中，而应该在运行时传入：

### 方式 1: 使用 .env 文件（推荐）

```bash
# 复制模板
cp .env.local.example .env.production

# 编辑 .env.production 填入实际值

# 使用 docker run
docker run -d \
  --env-file .env.production \
  ccr.ccs.tencentyun.com/hackathonweekly/community:latest

# 或使用 docker-compose
docker-compose up -d
```

### 方式 2: 直接传入环境变量

```bash
docker run -d \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  -e BETTER_AUTH_URL="https://yourdomain.com" \
  ccr.ccs.tencentyun.com/hackathonweekly/community:latest
```

## 🔧 服务器部署

### 使用 Docker Hub

```bash
# 1. 登录（私有仓库需要）
docker login

# 2. 拉取镜像
docker pull your-username/community:latest

# 3. 运行容器
docker run -d \
  --name community \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  your-username/community:latest

# 4. 查看日志
docker logs -f community
```

### 使用腾讯云

```bash
# 1. 登录腾讯云
docker login ccr.ccs.tencentyun.com --username=100015625279
# 输入密码

# 2. 拉取镜像
docker pull ccr.ccs.tencentyun.com/hackathonweekly/community:latest

# 3. 运行容器
docker run -d \
  --name community \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ccr.ccs.tencentyun.com/hackathonweekly/community:latest

# 4. 查看日志
docker logs -f community
```

## 🎯 常用命令

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器日志
docker logs -f community

# 进入容器调试
docker exec -it community sh

# 重启容器
docker restart community

# 停止并删除容器
docker stop community && docker rm community

# 查看镜像列表
docker images | grep community

# 删除旧镜像
docker rmi community:old-version
```

## 📚 详细文档

完整的 Docker 部署文档请查看：
- 中文文档：`content/docs/dev-guide/docker-deployment.zh.mdx`
- 在线访问：https://yourdomain.com/docs/dev-guide/docker-deployment

## 🔍 故障排查

### Docker Hub 网络问题（EOF, timeout）

**常见错误：**
```
ERROR: failed to solve: failed to fetch anonymous token: ... EOF
ERROR: ... timeout
```

**快速解决：**

```bash
# 方案 1: 使用腾讯云（最简单）
./docker-build.sh v1.0.0 tencent

# 方案 2: 配置镜像加速
# Mac: Docker Desktop → Settings → Docker Engine
# 添加: "registry-mirrors": ["https://mirror.ccs.tencentyun.com"]

# 方案 3: 仅本地构建
./docker-build.sh v1.0.0 --local-only
```

**详细配置：** 查看 `DOCKER_MIRROR_SETUP.md`

### 跨平台问题（Mac → Ubuntu）

**问题：** 镜像在服务器上无法运行

**原因：** 架构不匹配（ARM vs x86）

**解决：** 脚本已自动处理，使用 `--platform linux/amd64`

```bash
# 验证镜像架构
docker inspect community:latest | grep Architecture
# 应显示: "Architecture": "amd64"
```

### 容器无法启动

```bash
# 查看详细日志
docker logs community

# 检查环境变量
docker exec community env

# 查看容器详情
docker inspect community
```

### 数据库连接失败

检查 `DATABASE_URL` 环境变量格式：
```
postgresql://user:password@host:5432/database
```

### 健康检查失败

```bash
# 手动测试健康检查端点
curl http://localhost:3000/api/health

# 查看健康检查状态
docker inspect --format='{{json .State.Health}}' community
```

## 🆘 获取帮助

```bash
# 脚本使用帮助
./docker-build.sh
./docker-push-all.sh --help

# 查看 Docker Compose 配置
docker-compose config
```
